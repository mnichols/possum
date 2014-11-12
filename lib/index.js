'use strict';

var stampit = require('stampit')
    ,cuid = require('cuid')
    ,EventEmitter2 = require('eventemitter2').EventEmitter2
    ,Promise = require('bluebird')
    ,EVENTS = require('./system-events')
    ,asyncQueue = require('./async-queue')
    ,states = require('./states')
    ,command = require('./command')
    ,event = require('./event')
    ,transitionDeferral = require('./transition-deferral')
    ,handlerDeferral = require('./handler-deferral')
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
        .methods(emitter)
        .methods({
            raise: function(e) {
                e.state = this.state
                this.emit(e.topic, e)
                return this
            }
        })
        .enclose(function(){
            var currentContext
            stampit.mixIn(this, {
                current: function(context) {
                    if(!context) {
                        return (currentContext = this.queue.createContext(this))
                    }
                    return currentContext
                }
            })
        })

    var router = stampit()
        .enclose(function(){
            var stateful = states()
                .state({
                    states: this.states
                    ,handlers: this.handlers
                })
                .create()
            //add _start handler
            stateful.add({
                match: function(spec) {
                    return spec.inputType === '_start'
                }
                ,fn: function(e) {
                    this.started = true
                    return this.transition(e.toState)
                }
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
            })

            stampit.mixIn(this,{
                router: function(){
                    return stateful
                }
            })
        })


    var deferrable = stampit()
        .enclose(function(){

            //setup queues
            var transitionDeferralQueue = queueFactory()
                .state({
                    router: this.router()
                    ,name: 'queue.deferrals.transition'
                })
                .create()

            var deferTransitions = transitionDeferral({
                queue: transitionDeferralQueue
            })


            var handlerDeferralQueue = queueFactory()
                .state({
                    router: this.router()
                    ,name: 'queue.deferrals.handler'
                })
                .create()

            var deferHandler = handlerDeferral({
                queue: handlerDeferralQueue
            })

            var primaryQueue = queueFactory()
                .state({
                    router: this.router()
                    ,name: 'queue'
                    ,queues: [
                        transitionDeferralQueue
                        ,handlerDeferralQueue
                    ]
                })

            stampit.mixIn(this,{
                queue: primaryQueue
            })

            //mixin deferral api
            stampit.mixIn(this, deferTransitions)
            stampit.mixIn(this, deferHandler)

        })


    var handler = stampit()
        .methods({
            handle: function(inputType, msg) {
                var message = command({
                    inputType: inputType
                    ,state: this.state
                    ,payload: msg
                })
                debug('queueing',message.inputType,message.payload)
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
                if(!this.states[toState]) {
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

    return model.compose(
        router
        ,handler
        ,transitioner
        ,startable
        ,deferrable
    )

}
