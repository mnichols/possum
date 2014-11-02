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

var command = stampit()
    .state({
        inputType: undefined
        ,payload: undefined
        ,state: undefined
        ,timestamp: undefined
        ,id: undefined
    })
    .enclose(function(){
        stampit.mixIn(this,{
            timestamp: new Date().toUTCString()
            ,id: cuid()
        })
    })

var event = stampit()
    .state({
        topic: undefined
        ,payload: undefined
        ,state: undefined
        ,timestamp: undefined
        ,id: undefined
    })
    .enclose(function(){
        stampit.mixIn(this,{
            timestamp: new Date().toUTCString()
            ,id: cuid()
        })
    })



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
                ,self = this
                ;

            function noop(result) {
                return result
            }
            function notify( message) {
                message.state = self.state
                self.emit(message.topic, message)
                return self
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
            var transaction = stampit()
                .state({
                    command: undefined
                    ,handler: undefined
                    ,Promise: undefined
                })
                .methods({
                    execute: function(context) {
                        var self = this
                        return this.Promise.resolve(this.command.payload)
                            .bind(context)
                            .then(this.handler)
                            .then(function(result){
                                if(self.DEFERRED) {
                                    return self
                                }
                                return self.complete()
                            })
                    }
                    ,complete: function(){
                        stampit.mixIn(this,{
                            IN_PROCESS: false
                            ,HANDLED: true
                            ,DEFERRED: false
                        })
                        var e = event({
                            topic: EVENTS.HANDLED
                            ,payload: this.command.payload
                            ,inputType: this.command.inputType
                        })
                        notify(e)
                        return this
                    }
                    ,defer: function(){
                        stampit.mixIn(this, {
                            IN_PROCESS: false
                            ,HANDLED: false
                            ,DEFERRED: true
                        })
                        var e = event({
                            topic: EVENTS.DEFERRED
                            ,payload: this.command.payload
                        })
                        notify(e)
                        return this
                    }
                })

            var unitOfWork = stampit()
                .state({
                    command: undefined
                    ,Promise: this.Promise
                    ,current: undefined
                })
                .enclose(function(){
                    var transactions = []
                        ,current = undefined

                    function commit(context) {
                        if(transactions.length < 1) {
                            current = undefined
                            return this.Promise.resolve(this)
                        }
                        current = transactions.shift()
                        return current.execute(context)
                            .bind(this)
                            .then(commit.bind(this, context))
                    }

                    this.deferCurrent = function(){
                        current.defer()
                        return current.command
                    }

                    this.commit = function(context) {
                        transactions = collect.call(context,this.command.inputType)
                            .map(function(handler){
                                return transaction({
                                    command: this.command
                                    ,handler: handler
                                    ,Promise: this.Promise
                                })
                            },this)

                        if(transactions.length < 1) {
                            var e = event({
                                topic: EVENTS.NO_HANDLER
                                ,payload: this.command
                            })
                            notify(e)
                            return this.Promise.resolve(this)
                        }
                        return commit.call(this,context)
                    }

                })
            var deferredQueue = stampit()
                .state({
                    Promise: this.Promise
                    ,buffer: []
                    ,matches: []
                    ,specifications: []
                    ,requests: []
                    ,source: undefined
                    ,command: undefined
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
                    push.apply(this.buffer, [this.command])
                    this.specifications = this.requests.map(function(req){
                        return function spec(msg) {
                            return msg.inputType === req.inputType
                        }
                    })
                })

            /**
             * a queue
             * enqueues messages
             * processes messages in its storage
             * */
            var defaultQueue = stampit()
                .state({
                    Promise: this.Promise
                    ,deferring: false
                    ,processing: undefined
                    ,buffer: []
                    ,id: 'default'
                })
                .methods({
                    enqueue: function(msg) {
                        msg = [].concat(msg)
                        push.apply(this.buffer, msg)
                        return this
                    }
                    ,process: function(context) {
                        if(!this.buffer.length) {
                            this.unitOfWork = undefined
                            return context
                        }
                        var command = this.buffer.shift()
                        this.unitOfWork = unitOfWork({
                            command: command
                            ,Promise: this.Promise
                        })
                        return this.unitOfWork.commit(context)
                            .then(this.process.bind(this, context))
                    }
                    ,defer: function(requests) {
                        var deferred = this.unitOfWork.deferCurrent()
                        return deferredQueue({
                            source: this
                            ,requests: requests
                            , command: deferred
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
                var envelope = command({
                    inputType: inputType
                    ,state: this.state
                    ,payload: msg
                })
                queue = queue.enqueue(envelope)
                var processed = queue.process(this)
                return this.Promise.resolve(processed)
            }

            this.transition = function transition(toState) {
                var payload = {
                    toState: toState
                    ,fromState: this.state
                }
                if(!config.call(this,toState)) {
                    var e = event({
                        topic: EVENTS.INVALID_TRANSITION
                        ,state: this.state
                        ,payload: payload
                    })
                    notify(e)
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
