'use strict';

var stampit = require('stampit')
    ,cuid = require('cuid')
    ,EventEmitter2 = require('eventemitter2').EventEmitter2
    ,EVENTS = require('./system-events')
    ,chainPromises = require('./chain-promises')

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
function configureStates(cfg) {
    var states = cfg.states
    for(var k in states) {
        states[k] = stampit()
            .state({
                _onEnter: noop
                ,_onExit: noop
            })
            .state(states[k])
            .create()
    }
    return cfg
}
module.exports = function(cfg) {
    assertCfg(cfg)
    configureStates(cfg)

    var emitter = new EventEmitter2

    var model = stampit()
        .state({
            initialState: undefined
            ,namespace: 'possum__' + cuid()
            ,started: false
            ,inputCount: 0
        })
        .state({
            Promise: require('bluebird')
        })
        .state(cfg)
        .methods({
            start: function start(){
                if(this.started) {
                    throw new Error('Already started')
                }
                return this.handle('_start',{
                    toState: this.initialState
                    ,fromState: undefined
                })
            }
        })
        .methods(emitter)
        .enclose(function(){
            var queue

            function noop(result) {
                return result
            }
            function collect(inputType) {
                var handlers = []

                if(inputType === '_start') {
                    handlers.push(handleStart.bind(this))
                }
                if(inputType === '_transition') {
                    handlers.push(handleTransition.bind(this))
                }
                var current = this.states[this.state]
                if(current && current[inputType]){
                    handlers.push(current[inputType])
                }
                return handlers
            }

            var defaultQueue = stampit()
                .state({
                    Promise: this.Promise
                    ,deferring: false
                    ,processing: false
                    ,deferred: []
                    ,buffer: []
                    ,matches: []
                })
                .methods({
                    dispatch: function(event, context, handler) {
                        var self = this
                        return this.Promise.resolve(event.payload)
                            .bind(context)
                            .then(handler)
                            .then(this.notifyHandled.bind(context, event))
                            //we only want to raise handled when
                            //deferral hasnt occurred
                    }
                    ,deferralComplete: function(msg) {
                        return msg.inputType === this.deferring[0].inputType
                    }
                    ,enqueue: function(msg) {
                        if(!!this.deferring) {
                            if(this.deferralComplete(msg)){
                                this.matches.push(msg)
                                this.deferring.shift()
                                if(this.deferring.length === 0) {
                                    this.buffer.push.apply(this.buffer, this.matches.concat(this.deferred))
                                    this.matches.length = 0
                                    this.deferred.length = 0
                                    this.deferring = false
                                }
                                return this
                            }
                            this.deferred.push(msg)
                            return this
                        }
                        this.buffer.push.call(this.buffer, msg)
                        return this
                    }
                    ,process: function(context) {
                        if(!this.buffer.length || !!this.deferring) {
                            this.processing = false
                            return this.Promise.resolve(context)
                        }
                        var event = this.processing = this.buffer.shift()
                            ,handlers = collect.call(context,event.inputType)
                                .map(this.dispatch.bind(this, event, context),this)

                        if(handlers.length < 1) {
                            this.notifyNoHandler.call(context, event)
                            return this.Promise.resolve(context)
                        }
                        return this.Promise.all(handlers)
                            .bind(this)
                            .then(this.process.bind(this, context))
                    }
                    ,notifyNoHandler: function(e) {
                        this.emit(EVENTS.NO_HANDLER, e)
                    }
                    ,notifyHandled: function(e){
                        this.emit(EVENTS.HANDLED,e)
                    }
                    ,defer: function(requests) {
                        this.deferred.push(this.processing)
                        this.deferring = [].concat(requests)
                        return this
                    }
                })

            queue = defaultQueue()

            function config(state) {
                return this.states[state]
            }
            function handleTransitionDeferral(e) {
                queue.defer(e)
            }
            function handleStart(e) {
                this.started = true
                return this.transition(e.toState)
            }
            function handleTransition(e) {
                this.priorState = e.fromState
                this.state = e.toState
                return e
            }
            function handleEntry(e) {
                var stateCfg = (config.call(this, e.toState))
                if(!stateCfg) {
                    return e
                }
                return (stateCfg._onEnter || noop).call(this,e)
            }
            function handleExit(e) {
                var stateCfg = (config.call(this, e.fromState))
                if(!stateCfg) {
                    return e
                }
                return (stateCfg._onExit || noop).call(this,e)
            }
            function config(state) {
                return this.states[state]
            }

            this.handle = function handler(inputType, msg) {
                var envelope = {
                    inputType: inputType
                    ,payload: msg
                    ,state: this.state
                    ,timestamp: new Date().toUTCString()
                    ,id: ++this.inputCount
                }
                queue = queue.enqueue(envelope)
                return queue.process(this)
            }

            this.transition = function transition(toState) {
                var payload = {
                    toState: toState
                    ,fromState: this.state
                }
                if(!config.call(this,toState)) {
                    this.emit(EVENTS.INVALID_TRANSITION, payload)
                    return payload
                }
                if(this.state === toState) {
                    return this.Promise.resolve(payload)
                }
                return this.Promise.resolve(payload)
                    .then(this.handle.bind(this,'_onExit',payload))
                    .then(this.handle.bind(this,'_transition',payload))
                    .then(this.handle.bind(this,'_onEnter',payload))
            }

            this.deferUntilTransition = function(state) {
                queue = queue.defer([ {
                        inputType: '_onExit'
                    }, {
                        inputType: '_transition'
                    }, {
                        inputType: '_onEnter'
                    }
                ])
                return this
            }
        })

    return model

}
