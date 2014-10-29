'use strict';

var stampit = require('stampit')
    ,cuid = require('cuid')
    ,EventEmitter2 = require('eventemitter2').EventEmitter2
    ,debug = require('debug')('possum:debug')
    ,error = require('debug')('possum:error')
    ,slice = Array.prototype.slice
    ,EVENTS = require('./system-events')
    ;


var stampedEmitter = stampit.convertConstructor(EventEmitter2)

function noop(){}
function throwingEmitter(){
    return stampit().enclose(function(){
        return {
            emit: function(){
                throw new Error('not implemented')
            }
            ,on: function(){
                throw new Error('not implemented')
            }
            ,off: function(){
                throw new Error('not implemented')
            }
        }
    })
}

function assertCfg(cfg) {
    //@todo workout default emitter
    cfg = (cfg || {})
    if(!cfg.initialState) {
        throw new Error('An initialState is required')
    }
    if(!cfg.states) {
        throw new Error('States are required')
    }
}

module.exports = possum

function possum(cfg, services){
    assertCfg(cfg)


    var defaults = stampit()
        .state({
            initialState: undefined
            ,namespace: 'possum__' + cuid()
            ,states: {}
            ,started: false
        })
        .state(cfg)

    var api  = stampit()
        .methods({
            start: function start() {
                if(this.started) {
                    throw new Error('Already started')
                }
                if(this.queue.start) {
                    console.log('starting queue',this.queue.namespace)
                    return this.queue.start()
                        .then(function(){
                            this.started = true
                            return this.transition(this.initialState)
                        })
                } else {
                    this.started = true
                    return this.transition(this.initialState)
                }

            }
            ,handle: function handler(inputType, msg) {
                this.queue.handle('enqueue',{
                    inputType: inputType
                    ,payload: msg
                    ,state: this.state
                })
                return this.queue.handle('process', this)
            }
            ,transition: function transition(toState) {
                return this.handle('transition',{
                    toState: toState
                    ,fromState: this.state
                })
            }
        })

    var deferrable = stampit()
        .methods({
            deferUntil: function(predicate) {
                this.queue.handle('defer',predicate)
            }
            ,deferUntilTransition: function(state) {
                return this.deferUntil(function(e){
                    return e.inputType === 'transition'
                })
            }
        })

    var factory = stampit()
        .compose(
            defaults
            , api
            , deferrable
            , stampedEmitter
            , services.emitter
        )

    var asyncStrategy = asyncQueue({
        Promise: require('bluebird')
    })
    //we need to get our api in
    var queue = queueApi({
        strategy: asyncStrategy
    }).compose(api, deferrable, stampedEmitter, services.emitter).create()
    return factory.create({ queue: queue})
}
