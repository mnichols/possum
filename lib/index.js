'use strict';

var stampit = require('stampit')
    ,cuid = require('cuid')
    ,EventEmitter2 = require('eventemitter2').EventEmitter2
    ,EVENTS = require('./system-events')

module.exports = function(cfg) {
    if(!cfg.initialState) {
        throw new Error('An initialState is required')
    }
    if(!cfg.states) {
        throw new Error('States are required')
    }


    var emitter = new EventEmitter2

    var model = stampit()
        .state({
            initialState: undefined
            ,namespace: 'possum__' + cuid()
            ,started: false
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

                this.started = true
                return this.transition(this.initialState)
            }
        })
        .methods(emitter)
        .enclose(function(){
            var buffer = []
                ,deferred = []

            function noop(result) {
                return result
            }
            function collect(inputType) {
                var handlers = []
                if(inputType === 'transition') {
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
                    buffer: []
                    ,Promise: this.Promise
                })
                .methods({
                    dispatch: function(event, context, handler) {
                        return this.Promise.resolve(event.payload)
                            .bind(context)
                            .then(handler)
                            .then(this.notifyHandled.bind(context,event))
                    }
                    ,enqueue: function(msg) {
                        this.buffer.push(msg)
                    }
                    ,process: function(context) {
                        if(!this.buffer.length) {
                            return this.Promise.resolve(context)
                        }
                        var event = this.buffer.shift()
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
                })

            var queue = defaultQueue()



            function config(state) {
                return this.states[state]
            }
            /*
            function raiseHandled(event, result){
                return this.emit(EVENTS.HANDLED, event)
            }
            */

           /*
            function enqueue(msg) {
                buffer.push(msg)
            }

            */
            function doTransition(e) {
                this.priorState = e.fromState
                this.state = e.toState
                this.emit(EVENTS.TRANSITION,e)
                return e
            }
            function notifyTransitioned(e) {
                this.emit(EVENTS.TRANSITIONED, e)
                return e
            }
            function handleTransition(e) {
                if(e.toState === this.state) {
                    return e
                }
                var payload = {
                    toState: e.toState
                    ,fromState: e.fromState
                }

                var fromCfg = (config.call(this,payload.fromState) || {})
                    ,toCfg = (config.call(this,payload.toState))
                    ;

                if(!toCfg) {
                    this.emit(EVENTS.INVALID_TRANSITION,payload)
                    return e
                }
                //async
                if(this.Promise) {
                    return this.Promise.resolve(payload)
                        .bind(this)
                        .then(fromCfg._onExit || noop)
                        .then(doTransition.bind(this,payload))
                        .then(toCfg._onEnter || noop)
                        .then(notifyTransitioned.bind(this,payload))
                }

                //sync
                var fns = [
                    (fromCfg._onExit || noop)
                    ,doTransition.bind(this,payload)
                    ,(toCfg._onEnter || noop)
                    ,notifyTransitioned.bind(this,payload)
                ]
                fns.forEach(function(fn){
                    fn.call(this,payload)
                },this)

                return this

            }
            function config(state) {
                return this.states[state]
            }

            /*
            function dispatch(event, handler) {
                return this.Promise.resolve(event.payload)
                    .bind(this)
                    .then(handler)
                    .then(raiseHandled.bind(this,event))
            }
            function processQueue() {
                if(!buffer.length) {
                    return this.Promise.resolve(this)
                }
                var event = buffer.shift()
                    ,handlers = collect.call(this,event.inputType)
                        .map(dispatch.bind(this,event),this)

                if(handlers.length < 1) {
                    this.emit(EVENTS.NO_HANDLER,event)
                    return this.Promise.resolve(this)
                }

                return this.Promise.all(handlers)
                    .bind(this)
                    .then(processQueue.bind(this))
            }
            */

            this.handle = function handler(inputType, msg) {
                var envelope = {
                    inputType: inputType
                    ,payload: msg
                    ,state: this.state
                }
                queue.enqueue(envelope)
                return queue.process(this)
            }

            this.transition = function transition(toState) {
                return this.handle('transition',{
                    toState: toState
                    ,fromState: this.state
                })
            }

            this.deferUntilTransition = function(state) {
                defer('transition',state)
                //deferring needs to know the current
                //input in play so it can be replayed
                //
                //so when this is invoked we need to:
                //0. set deferring predicate
                //1. move the current input to the deferred queue
                //2. suppress 'handled' event

                //subsequent calls to enqueue will be added to
                //the deferred queue until an input matches
                //the deferring predicate.
                //Calls to 'process' will be noops until a match has
                //been made.
                //
                //When the predicate is satisfied, inputs from the defer
                //queue are copied into the buffer and 'process' is invoked

            }
        })

    return model

}
