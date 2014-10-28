'use strict';

var stampit = require('stampit')
    ,cuid = require('cuid')
    ,EventEmitter2 = require('eventemitter2').EventEmitter2
    ,debug = require('debug')('possum:debug')
    ,error = require('debug')('possum:error')
    ,asyncQueue = require('./async-queue')
    ,slice = Array.prototype.slice
    ,EVENTS = require('./system-events')
    ;


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


module.exports = function possum(cfg, services){
    //@todo workout default emitter
    cfg = (cfg || {})
    if(!cfg.initialState) {
        throw new Error('An initialState is required')
    }
    if(!cfg.states) {
        throw new Error('States are required')
    }

    cfg.namespace = (cfg.namespace || 'possum__' + cuid())

    var emitter
        ;

    if(!services.emitter) {
        emitter = stampit.convertConstructor(EventEmitter2)
    } else {
        emitter = stampit(services.emitter)
    }




    var factory = stampit()
    factory.state({
        initialState: cfg.initialState
        ,namespace: cfg.namespace
        ,state: undefined
        ,started: false
    })

    factory.enclose(function(){
        var queue = asyncQueue({ Promise: require('bluebird') });

        this.states = cfg.states
        this.start = function start(){
            this.started = true
            return this.transition(this.initialState)
        }
        this.handle = function(inputType, e) {
            queue.enqueue({
                inputType: inputType
                ,payload: e
                ,state: this.state
            })
            return queue.process.call(this)
        }
        this.transition = function transition(toState) {
            return this.handle(EVENTS.TRANSITIONED,{
                toState: toState
                ,fromState: this.state
            })
        }
    })

    var model = stampit
        .compose(factory, emitter)
        .create()

    return model
}
