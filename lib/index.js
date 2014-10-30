'use strict';

var stampit = require('stampit')
    ,cuid = require('cuid')
    ,EventEmitter2 = require('eventemitter2').EventEmitter2
    ,EVENTS = require('./system-events')
    ,chainPromises = require('./chain-promises')
    ,slice = Array.prototype.slice
    ,splice = Array.prototype.splice
    ,push  = Array.prototype.push
    ,shift = Array.prototype.shift
    ,unshift = Array.prototype.unshift


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
            var deferredQueue = stampit()
                .state({
                    Promise: this.Promise
                    ,buffer: []
                    ,matches: []
                    ,specifications: []
                    ,requests: []
                    ,source: undefined
                    ,processing: undefined
                    ,id: 'deferred'
                })
                .methods({
                    isSatisfied: function(msg) {
                        var spec = shift.call(this.specifications)
                        if(spec.call(this,msg)) {
                            push.call(this.matches,msg)
                            if(!this.specifications.length) {
                                this.buffer = this.matches.concat(this.buffer)
                                return true
                            }
                        }
                        return false
                    }
                    ,enqueue: function(msg) {
                        msg = [].concat(msg)
                        while(!!msg.length) {
                            var m = msg.shift()
                            if(this.isSatisfied(m)) {
                                return this.source.enqueue(this.buffer)
                            }
                            push.apply(this.buffer,m)
                        }
                        return this
                    }
                    ,process: function(){
                        return this.Promise.resolve(this)
                    }
                })
                .enclose(function(){
                    push.call(this.buffer, this.processing )
                    this.specifications = this.requests.map(function(req){
                        return function spec(msg) {
                            return msg.inputType === req.inputType
                        }
                    })
                })

            var defaultQueue = stampit()
                .state({
                    Promise: this.Promise
                    ,deferring: false
                    ,processing: false
                    ,buffer: []
                    ,id: 'default'
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
                    ,enqueue: function(msg) {
                        msg = [].concat(msg)
                        console.log('adding',msg.length,'events','to',this.buffer.length)
                        push.apply(this.buffer, msg)
                        return this
                    }
                    ,process: function(context) {
                        if(!this.buffer.length) {
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
                        return deferredQueue({
                            source: this
                            ,requests: requests
                            ,processing: this.processing
                        })
                    }
                })

            queue = defaultQueue()

            function config(state) {
                return this.states[state]
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
                console.log('processing',queue.id, queue.buffer.length, 'events')
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
