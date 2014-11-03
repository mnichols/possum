'use strict';

var stampit = require('stampit')
    ,cuid = require('cuid')
    ,EventEmitter2 = require('eventemitter2').EventEmitter2
    ,EVENTS = require('./system-events')
    ,queue = require('./async-queue')
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
            , deferUntilTransition: function(toState) {
                this.queue.deferUntilTransition(toState)
                return this
            }
            , deferUntilNextHandler: function(){
                this.queue.deferUntilNextHandler()
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


}
