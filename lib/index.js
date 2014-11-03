'use strict';

var stampit = require('stampit')
    ,cuid = require('cuid')
    ,EventEmitter2 = require('eventemitter2').EventEmitter2
    ,EVENTS = require('./system-events')
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
    var emitter = new EventEmitter2
    //configureStates(cfg)
    //

    var possum = stampit()
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
        .methods(emitter)
        .methods({
            config: function(forState) {
                return this.states[forState]
            }
            ,raise: function(e) {
                e.state = self.state
                this.emit(e.topic, e)
                return this
            }
        })
        .enclose(function(){
            this.states = configureStates(this.states)
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
                return this.queue.process(this)
            }
        })

    var transitioner = stampit()
        .methods({
            transition: function(toState) {
                var payload = {
                    toState: toState
                    ,fromState: this.state
                }
                if(!this.config(toState)) {
                    var e = event({
                        topic: EVENTS.INVALID_TRANSITION
                        ,state: this.state
                        ,payload: payload
                    })
                    this.raise(e)
                    return payload
                }
                if(this.state === toState) {
                    //dont transition to same state
                    return this.Promise.resolve(payload)
                }
                return this.Promise.resolve(payload)
                    .then(this.handle.bind(this,'_onExit',payload))
                    .then(this.handle.bind(this,'_transition',payload))
                    .then(this.handle.bind(this,'_onEnter',payload))
            }
        })
    var starter = stampit()
        .methods({
            if(this.started) {
                throw new Error('Already started')
            }
            return this.handle('_start',{
                toState: this.initialState
                ,fromState: undefined
            })
        })

    var collector = stampit()
        .enclose(function(){
            var special = {
                '_start': function(e) {
                    this.started = true
                    return this.transition(e.toState)
                }
                ,'_transition': function(e) {
                    this.priorState = e.fromState
                    this.state = e.toState
                    return e
                }
            }
            stampit.mixIn(this,{
                collect: function(inputType) {
                    var handlers = []

                    if(this.when['*']) {
                        push.apply(handlers, this.when['*'].map(function(fn){
                            return fn.bind(context)
                        }) )
                    }
                    if(special[inputType]) {
                        push.call(handlers, special[inputType].bind(this))
                    }
                    var current = this.config(context.state)
                    if(current && current[inputType]){
                        push.call(handlers, current[inputType].bind(this))
                    }
                    return handlers
                }
            })

        })

    var queue = stampit()
        .enclose(function(){
            var buffer = []
                ,processing = []
                ;
            function process(context) {
                if(!processing.length) {
                    this.unitOfWork = undefined
                    return context
                }
                var command = processing.shift()
                this.unitOfWork = unitOfWork({
                    command: command
                })
                return this.Promise.resolve(context)
                    .then(this.unitOfWork.commit.bind(this.unitOfWork))
                    .then(this.processDeferrals.bind(this, command, context ))
                    .then(process.bind(this, context))
            }
            stampit.mixIn(this,{
                enqueue: function(msgs) {
                    push.apply(buffer,[].concat(msgs))
                    return this
                }
                ,process: function(context, messages) {
                    messages = (messages || buffer)
                    processing = splice.call(messages, 0, messages.length)
                    return process.call(this, context)
                }
            })
        })

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
                ,states
                ,self = this
                ;

            var transaction = stampit()
                .state({
                    command: undefined
                    ,handler: undefined
                })
                .methods({
                    execute: function(context) {
                        return this.handler.call(context, this.command.payload)
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
                            ,inputType: this.command.inputType
                            ,payload: this.command.payload
                        })
                        notify(e)
                        return this
                    }
                })

            var unitOfWork = stampit()
                .state({
                    command: undefined
                    ,current: undefined
                })
                .enclose(function(){
                    var transactions = []
                        ,current = undefined

                    function commit(context) {
                        if(transactions.length < 1) {
                            current = undefined
                            return this
                        }
                        current = transactions.shift()
                        var result = current.execute.call(current, context)
                        if(result && result.then) {
                            return result.then(commit.bind(this,context))
                        }
                        return commit.call(this, context)
                    }

                    this.deferCurrent = function(){
                        current.defer()
                        return current.command
                    }

                    this.commit = function(context) {
                        transactions = states.collect(this.command.inputType, context)
                            .map(function(handler){
                                return transaction({
                                    command: this.command
                                    ,handler: handler
                                })
                            },this)

                        if(transactions.length < 1) {
                            var e = event({
                                topic: EVENTS.NO_HANDLER
                                ,payload: this.command
                            })
                            notify(e)
                            return this
                        }
                        return commit.call(this,context)
                    }
                })

            var defaultQueue = stampit()
                .state({
                    Promise: this.Promise
                    ,buffer: []
                    ,id: 'default'
                    ,deferrals: []
                })
                .methods({
                    enqueue: function(msgs) {
                        msgs = [].concat(msgs)
                        push.apply(this.buffer, msgs)
                        return this
                    }
                    ,processDeferrals: function(msg, context){
                        var sats = []
                            ,deferredCommands = []
                        for(var i = 0; i < this.deferrals.length; i++) {
                            var def = this.deferrals[i]
                            if(def.isSatisfiedBy(msg)) {
                                push.call(sats,i)
                                push.call(deferredCommands, def.command)
                            }
                        }
                        sats.forEach(function(index){
                            this.deferrals.splice(index, 1)
                        }, this)
                        return this.process.call(this, context, deferredCommands)
                    }
                    ,deferUntilNextHandler: function(){
                        push.call(this.deferrals,handlerDeferral({
                            command: this.unitOfWork.deferCurrent()
                        }))
                        return this
                    }
                    ,deferUntilTransition: function(state) {
                        push.call(this.deferrals,transitionDeferral({
                            command: this.unitOfWork.deferCurrent()
                            ,state: state
                        }))
                        return this
                    }
                })
                .enclose(function(){
                    var processing = []
                    function process(context) {
                        if(!processing.length) {
                            this.unitOfWork = undefined
                            return context
                        }
                        var command = processing.shift()
                        this.unitOfWork = unitOfWork({
                            command: command
                        })
                        return this.Promise.resolve(context)
                            .then(this.unitOfWork.commit.bind(this.unitOfWork))
                            .then(this.processDeferrals.bind(this, command, context ))
                            .then(process.bind(this, context))
                    }
                    stampit.mixIn(this,{
                        process: function(context, messages) {
                            messages = (messages || this.buffer)
                            processing = splice.call(messages, 0, messages.length)
                            return process.call(this, context)
                        }
                    })
                })

            queue = defaultQueue()


            this.deferUntilNextHandler = function(){
                queue = queue.deferUntilNextHandler()
                return this
            }
            this.deferUntilTransition = function(state) {
                queue = queue.deferUntilTransition(state)
                return this
            }
        })

    return model

}
