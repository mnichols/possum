'use strict';

var stampit = require('stampit')
    ,cuid = require('cuid')
    ,EventEmitter2 = require('eventemitter2').EventEmitter2
    ,Promise = require('bluebird')
    ,EVENTS = require('./system-events')
    ,states = require('./states')
    ,asyncQueue = require('./async-queue')
    ,deferrals = require('./deferrals')
    ,command = require('./command')
    ,event = require('./event')
    ,slice = Array.prototype.slice
    ,splice = Array.prototype.splice
    ,push  = Array.prototype.push
    ,shift = Array.prototype.shift
    ,unshift = Array.prototype.unshift
    ,debug = require('debug')('possum:debug')


function noop(result) {
    return result
}
function assertCfg(cfg) {
    if(!cfg.initialState) {
        throw new Error('An initialState is required')
    }
    if(!cfg.states) {
        throw new Error('States are required')
    }
}


module.exports = function possum(cfg) {
    assertCfg(cfg)
    var emitter = new EventEmitter2
    var queueFactory = asyncQueue.bind(asyncQueue,{ emitter: emitter })

    var model = stampit()
        .state({
            initialState: undefined
            ,namespace: 'possum__' + cuid()
            ,started: false
            ,inputCount: 0
            ,state: undefined
            ,priorState: undefined
            ,states: {}
            ,handlers: []
        })
        .state(cfg)
        .methods({
            router: function(){
                throw new Error('router not provided')
            }
        })

    var evented = stampit()
        .methods(emitter)
        .methods({
            raise: function(e) {
                e.state = this.state
                this.emit(e.topic, e)
                return this
            }
        })
        .enclose(function(){
            this.on(EVENTS.QUEUE.HANDLED,function(e) {
                var message = e.message
                    ,action = e.action
                this.raise(event({
                        topic: EVENTS.HANDLED
                        ,inputType: message.inputType
                        ,payload: message.payload
                        ,action: action
                    })
                )
            }.bind(this))
            this.on(EVENTS.QUEUE.COMPLETED,function(e) {
                var message = e.message
                    ,action = e.action
                this.raise(event({
                        topic: EVENTS.COMPLETED
                        ,inputType: message.inputType
                        ,payload: message.payload
                        ,action: action
                    })
                )
            }.bind(this))
            this.on(EVENTS.QUEUE.NO_HANDLER,function(e) {
                var message = e.message
                    ,action = e.action
                this.raise(event({
                        topic: EVENTS.NO_HANDLER
                        ,inputType: message.inputType
                        ,payload: message.payload
                        ,action: action
                    })
                )
            }.bind(this))
            //raise `transitioned` event _before_ _onEnter
            //but after transition handler
            this.on(EVENTS.QUEUE.COMPLETED,function(e) {
                var message = e.message
                    ,action = e.action

                if(message.inputType !== '_transition') {
                    return
                }
                this.raise(event({
                        topic: EVENTS.TRANSITIONED
                        ,inputType: message.inputType
                        ,payload: message.payload
                        ,action: action
                    })
                )
            }.bind(this))

        })

    var router = stampit()
        .enclose(function(){

            var stateful = states()
                .state({
                    states: this.states
                    ,handlers: this.handlers
                })
                .create()
            // configure default handlers
            //add _start handler
            stateful.add({
                match: function(spec) {
                    return spec.inputType === '_start'
                }
                ,fn: function(e) {
                    this.started = true
                    return this.transition(e.toState)
                }
                ,name: '_start'
            })
            //add _transition handler
            stateful.add({
                match: function(spec) {
                    return spec.inputType === '_transition'
                }
                ,fn: function(e) {
                    this.priorState = e.fromState
                    this.state = e.toState
                    return e
                }
                ,name: '_transition'
            })

            stampit.mixIn(this,{
                router: function(){
                    return stateful
                }
            })
        })

    var queued = stampit()
        .enclose(function(){
            var currentContext
                ,router = this.router()
            var primaryQueue = queueFactory()
                .state({
                    router: router.collect.bind(router)
                    ,name: 'queue'
                })
                .create()

            stampit.mixIn(this, {
                current: function(context) {
                    if(context) {
                        return currentContext = context
                    }

                    return (currentContext = currentContext || primaryQueue.createContext(this))
                }
            })

            stampit.mixIn(this,{
                queue: primaryQueue
            })
        })

    var handler = stampit()
        .methods({
            handle: function(inputType, msg) {
                var message = command({
                    inputType: inputType
                    ,state: this.state
                    ,payload: msg
                })
                this.queue.enqueue(message)
                return this.queue.process(this.current())
            }
        })

    var transitioner = stampit()
        .methods({
            transition: function(toState) {
                debug('transitioning to',toState)
                var payload = {
                    toState: toState
                    ,fromState: this.state
                }

                if(!this.router().hasState(toState)) {
                    var e = event({
                        topic: EVENTS.INVALID_TRANSITION
                        ,state: this.state
                        ,payload: payload
                    })
                    this.raise(e)
                    return Promise.resolve(payload)
                }
                if(this.state === toState) {
                    //dont transition to same state
                    return Promise.resolve(payload)
                }
                var commands = ['_onExit','_transition','_onEnter']
                    .map(function(inputType){
                        return command({
                            inputType: inputType
                            ,state: this.state
                            ,payload: payload
                        })
                    }, this)
                this.queue.enqueue(commands)
                return this.queue.process(this.current())
            }
        })


    var startable = stampit()
        .methods({
            start: function(){
                    debug('starting')
                    if(this.started) {
                        throw new Error('Already started')
                    }
                    return this.handle('_start',{
                        toState: this.initialState
                        ,fromState: undefined
                    })
                }
        })


    model = model.compose(
        evented
        ,router
        ,queued
        ,handler
        ,transitioner
        ,deferrals()
        ,startable
    )

    model.extend = function(extension) {
        if(!extension) {
            //noop
            return ret
        }
        model.enclose(function(){
            var router = this.router()
            if(extension.handlers) {
                for(var i = 0, len = extension.handlers.length; i < len; i++) {
                    router.add(extension.handlers[i])
                }
            }
            router.extend(extension.states)

            var copy = {}
            for(var k in extension) {
                //dont overwrite
                if(k !== 'states' && k !== 'handlers') {
                    copy[k] = extension[k]
                }
            }
            stampit.mixIn(this, copy)
        })
        return model
    }
    return model

}
