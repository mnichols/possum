'use strict';

var stampit = require('stampit')
    ,cuid = require('cuid')
    ,EventEmitter2 = require('eventemitter2').EventEmitter2
    ,EVENTS = require('./system-events')
    ,asyncQueue = require('./async-queue')
    ,states = require('./states')
    ,command = require('./command')
    ,deferrals = require('./deferrals')
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
        ,Promise = (cfg.Promise || require('bluebird'))
        ;

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

    var collector = stampit()
        .enclose(function(){
            var _start = {
                match: function(spec) {
                    return spec.inputType === '_start'
                }
                ,fn: function(e) {
                    this.started = true
                    return this.transition(e.toState)
                }
            }
            var _transition = {
                match: function(spec) {
                    return spec.inputType === '_transition'
                }
                ,fn: function(e) {
                    this.priorState = e.fromState
                    this.state = e.toState
                    return e
                }
            }
            var lifecycle = [
                _start
                ,_transition
            ]
            var coll = states()
                .state({
                    states: this.states
                    ,handlers: lifecycle.concat(this.handlers || [])
                })
                .create()

            stampit.mixIn(this,{
                collect: coll.collect.bind(coll)
            })

        })

    var queued = stampit()
        .enclose(function(){
            var queue = asyncQueue({
                    Promise: Promise
                })
                .methods({
                    deferred: function(handled){
                        throw new Error('not implemented')
                    }
                    ,raise: this.raise.bind(this)
                })
                .create()

            stampit.mixIn(this,{
                queue: queue
            })
        })

    var handler = stampit()
        .methods({
            handle: function(inputType, msg) {
                debug('handling',inputType,msg)
                var message = command({
                    inputType: inputType
                    ,state: this.state
                    ,payload: msg
                })
                this.queue.enqueue(message)
                return this.queue.process(this, this.collect)
            }
        })

    var transitioner = stampit()
        .methods({
            transition: function(toState) {
                debug('transitioning',toState)
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
                    return payload
                }
                if(this.state === toState) {
                    //dont transition to same state
                    return this.Promise.resolve(payload)
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
                return this.queue.process(this, this.collect)
            }
        })
    var starter = stampit()
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

    var deferrable = stampit.compose(deferrals())

    return model.compose(
        collector
        ,queued
        ,handler
        ,transitioner
        ,starter
        ,deferrable
    )

}
