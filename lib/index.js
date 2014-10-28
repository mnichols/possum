'use strict';

var stampit = require('stampit')
    ,cuid = require('cuid')
    ,EventEmitter2 = require('eventemitter2').EventEmitter2
    ,debug = require('debug')('possum:debug')
    ,error = require('debug')('possum:error')
    ,Promise = require('bluebird')
    ,transition = require('./transition')
    ,queue = require('./async-queue')
    ,slice = Array.prototype.slice
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

    var EVENTS = {
        TRANSITION: 'transition'
        ,TRANSITIONED: 'transitioned'
        ,INVALID_TRANSITION: 'invalidTransition'
    }
    var factory = stampit()
    factory.state({
        initialState: cfg.initialState
        ,namespace: cfg.namespace
        ,state: undefined
    })

    function doTransition(e){
        this.priorState = e.fromState
        this.state = e.toState
    }
    function notifyTransition(e) {
        this.emit(EVENTS.TRANSITIONED, e)
    }

    factory.enclose(function(){

        var actionQueue = queue({Promise: Promise})

        this.states = cfg.states
        this.canBe = function(state) {
            return !!this.states[state]
        }
        this.transition = function(state) {
            //do not transition to same state
            if(this.state === state) {
                return this
            }

            var payload = {
                toState: state
                ,fromState: this.state
                ,args: slice.call(arguments,1)
            }
            if(!this.canBe(state)){
                this.emit(EVENTS.INVALID_TRANSITION,payload)
                return this
            }
            var fromCfg = (this.states[this.state] || {})
                ,toCfg = this.states[state]
                ;

            actionQueue.enqueue((fromCfg._onExit || noop).bind(this,payload.args))
            actionQueue.enqueue(doTransition.bind(this,payload))
            actionQueue.enqueue((toCfg._onEnter || noop).bind(this,payload.args))
            actionQueue.enqueue(notifyTransition.bind(this,payload))

            return actionQueue.process()
        }
    })

    var emitter
    if(!services.emitter) {
        emitter = stampit.convertConstructor(EventEmitter2)
    } else {
        emitter = stampit(services.emitter)
    }

    var model = stampit.compose(factory, emitter).create()

    model.transition(cfg.initialState)
    return model
}
