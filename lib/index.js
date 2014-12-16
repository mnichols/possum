'use strict';

var stampit = require('stampit')
    ,cuid = require('cuid')
    ,EventEmitter2 = require('chained-emitter').EventEmitter
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

function assertStarted(){
    if(!this.started) {
        throw new Error('This possum has not been `start`ed.')
    }
}


module.exports = function possum(cfg) {
    assertCfg(cfg)

    var model = stampit()
        .state({
            initialState: undefined
            ,namespace: 'possum__' + cuid()
            ,started: false
            ,inputCount: 0
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
        .methods({
            raise: function(e) {
                e.state = this.state
                return this.emit(e.topic, e)
            }
        })
        .enclose(function(){
            var emitter = new EventEmitter2({
                wildcards: true
                ,delimiter: '.'
                ,newListener: true
                ,maxListeners: 10
            })
            stampit.mixIn(this,{
                emitter: emitter
            })
            var api = [
                'on'
                ,'onAny'
                ,'once'
                ,'off'
                ,'offAny'
                ,'removeListener'
                ,'removeAllListeners'
                ,'many'
                ,'emit'
            ]
            api.forEach(function(key){
                this[key] = emitter[key].bind(emitter)
            },this)

            emitter.on(EVENTS.QUEUE.HANDLED,function(e) {
                var message = e.message
                    ,action = e.action
                return this.raise(event({
                        topic: EVENTS.HANDLED
                        ,inputType: message.inputType
                        ,payload: message.payload
                        ,action: action
                    })
                )
            }.bind(this))
            emitter.on(EVENTS.QUEUE.COMPLETED,function(e) {
                var message = e.message
                    ,action = e.action
                return this.raise(event({
                        topic: EVENTS.COMPLETED
                        ,inputType: message.inputType
                        ,payload: message.payload
                        ,action: action
                    })
                )
            }.bind(this))
            emitter.on(EVENTS.QUEUE.NO_HANDLER,function(e) {
                var message = e.message
                    ,action = e.action
                return this.raise(event({
                        topic: EVENTS.NO_HANDLER
                        ,inputType: message.inputType
                        ,payload: message.payload
                        ,action: action
                    })
                )
            }.bind(this))
            //raise `transitioned` event _before_ _onEnter
            //but after transition handler
            emitter.on(EVENTS.QUEUE.COMPLETED,function(e) {
                var message = e.message
                    ,action = e.action

                if(message.inputType !== '_transition') {
                    return
                }
                var ev = event({
                    topic: EVENTS.TRANSITIONED
                    ,payload: message.payload
                    ,action: action
                })

                return this.raise(stampit.mixIn(ev,message.payload))
            }.bind(this))
        })

    var router = stampit()
        .enclose(function(){
            var state = undefined
            Object.defineProperty(this, 'state',{
                get: function(){
                    if(!this.started) {
                        throw new Error('`state` is not set on unstarted possums.')
                    }
                    return state
                }
                ,set: function(val) {
                    state = val
                }
            })

            var stateful = states()
                .state({
                    states: this.states
                    ,handlers: this.handlers
                })
                .create()
            // configure default handlers
            //add _start handler
            stateful.addHandlers({
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
            stateful.addHandlers({
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
            var currentContext = null
                ,router = this.router()
            var primaryQueue = asyncQueue({
                emitter: this.emitter
            }).state({
                router: router.collect.bind(router)
                ,name: 'queue'
            })
            .create()

            stampit.mixIn(this, {
                /**
                 * Get/set the current context. Pass `null` to clear the context
                 * */
                currentProcessContext: function(context) {
                    if(context || context === null) {
                        return currentContext = context
                    }
                    return currentContext
                }
                ,createContext: function(){
                    return primaryQueue.createContext(this)
                }
            })

            stampit.mixIn(this,{
                queue: primaryQueue
            })
        })

    var handler = stampit()
        .methods({
            handle: function(inputType, msg) {
                assertStarted.call(this)
                var message = command({
                    inputType: inputType
                    ,state: this.state
                    ,payload: msg
                })
                this.queue.enqueue(message)
                this.currentProcessContext(this.createContext())
                return this.queue.process(this.currentProcessContext())
                    .bind(this)
                    .then(function(){
                        this.currentProcessContext(null)
                        //resolve the possum instance
                        return this
                    })
            }
        })

    var transitioner = stampit()
        .methods({
            transition: function(toState) {
                assertStarted.call(this)
                debug(this.namespace,'transitioning to:', toState )
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
                    return Promise.resolve(this)
                        .then(this.raise.bind(this,e))
                        .return(payload)
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
                this.currentProcessContext(this.createContext())
                return this.queue.process(this.currentProcessContext())
                    .bind(this)
                    .then(function(){
                        this.currentProcessContext(null)
                        //resolve the possum instance
                        return this
                    })
            }
        })


    var startable = stampit()
        .methods({
            start: function(){
                debug('starting possum with namespace:',this.namespace || 'UNDEFINED')
                if(this.started) {
                    throw new Error('Already started')
                }
                this.started = true
                return this.handle('_start',{
                    toState: this.initialState
                    ,fromState: undefined
                })
                .bind(this)
                .then(function(){
                    //resolve the possum instance
                    return this
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
                    router.addHandlers(extension.handlers[i])
                }
            }
            router.extendStates(extension.states)

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
