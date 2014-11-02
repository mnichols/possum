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
                })
                .methods({
                    execute: function(context) {
                        var self = this
                        var result = this.handler.call(context, this.command.payload)
                        if(result && result.then) {
                            return result.then(function(){
                                if(self.DEFERRED) {
                                    return self
                                }
                                return self.complete()
                            })
                        }
                        if(self.DEFERRED) {
                            return self
                        }
                        return self.complete()
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
                        transactions = collect.call(context,this.command.inputType)
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

            var deferral = stampit()
                .state({
                    matches: []
                    ,specifications: []
                    ,command: undefined
                })
                .methods({
                    isSatisfiedBy : function isSatisfiedBy(msg) {
                        if(!this.specifications.length) {
                            throw new Error('deferral is missing specifications')
                        }
                        var spec = this.specifications[0]
                        if(spec.call(this,msg)) {
                            splice.call(this.specifications, 0, 1)
                            push.call(this.matches,msg)
                            if(!this.specifications.length) {
                                return true
                            }
                        }
                        return false
                    }
                    ,appendTo: function(buffer) {
                        var addThese = [this.command]
                        push.apply(buffer, addThese)
                        return this
                    }
                })

            var transitionDeferral = stampit()
                .state({
                    state: undefined
                    ,type: 'transition'
                })
                .methods({
                    matchesState: function(msg) {
                        return !this.state || (msg.toState === this.state)
                    }
                })
                .compose(deferral)
                .enclose(function(){
                    this.specifications = [
                        '_onExit'
                        ,'_transition'
                        ,'_onEnter'
                    ].map(function(inputType) {
                        return function isSatisfied(msg) {
                            return ((msg.inputType === inputType) && this.matchesState(msg))
                        }
                    })

                })

            var handlerDeferral = stampit()
                .state({
                    type: 'handler'
                })
                .compose(deferral)
                .enclose(function(){
                    function transitionHandler(msg) {
                        return (msg.inputType.charAt(0) === '_')
                    }
                    function postTransition(msg) {
                        return !!passes
                    }
                    this.specifications = []
                    this.specifications.push(function(msg) {
                        if(transitionHandler(msg)) {
                            return false
                        }
                        return msg.id !== this.command.id
                    })
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
                        this.deferrals.push(handlerDeferral({
                            command: this.unitOfWork.deferCurrent()
                        }))
                        return this
                    }
                    ,deferUntilTransition: function(state) {
                        this.deferrals.push(transitionDeferral({
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
                            processing = messages.splice(0,messages.length)
                            return process.call(this, context)
                        }
                    })
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
                return queue.process(this)
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
                    //dont transition to same state
                    return this.Promise.resolve(payload)
                }
                return this.Promise.resolve(payload)
                    .then(this.handle.bind(this,'_onExit',payload))
                    .then(this.handle.bind(this,'_transition',payload))
                    .then(this.handle.bind(this,'_onEnter',payload))
            }

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
