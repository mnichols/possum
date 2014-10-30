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
            var queue

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
                    Promise: this.Promise
                    ,deferring: false
                    ,processing: false
                    ,deferred: []
                    ,buffer: []
                })
                .methods({
                    dispatch: function(event, context, handler) {
                        var self = this
                        console.log('dispatching',event.inputType)
                        return this.Promise.resolve(event.payload)
                            .bind(context)
                            .then(handler)
                            .then(this.notifyHandled.bind(context, event))
                            //we only want to raise handled when
                            //deferral hasnt occurred
                    }
                    ,enqueue: function(msg) {
                        if(this.deferring && this.deferring.call(this,msg)) {
                            if(this.deferring.call(this,msg)){
                                this.deferred.unshift(msg)
                                var copy = this.deferred.splice(0, this.deferred.length)
                                this.buffer.push.apply(this.buffer, copy)
                                this.deferring = false
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
                        console.log('notifyHandled',e.inputType)
                        this.emit(EVENTS.HANDLED,e)
                    }
                    ,defer: function(predicate) {
                        this.deferring = predicate
                        this.deferred.push(this.processing)
                        return this
                    }
                })

            queue = defaultQueue()

            function config(state) {
                return this.states[state]
            }
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

            this.handle = function handler(inputType, msg) {
                console.log('handling',inputType,msg,queue.buffer.length)
                var envelope = {
                    inputType: inputType
                    ,payload: msg
                    ,state: this.state
                }
                queue = queue.enqueue(envelope)
                return queue.process(this)
            }

            this.transition = function transition(toState) {
                return this.handle('transition',{
                    toState: toState
                    ,fromState: this.state
                })
            }

            this.deferUntilTransition = function(state) {
                queue = queue.defer(function(e){
                    return e.inputType === 'transition'
                })
            }
        })

    return model

}
