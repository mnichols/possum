'use strict';

var stampit = require('stampit')
    ,cuid = require('cuid')
    ,EventEmitter2 = require('eventemitter2').EventEmitter2
    ,debug = require('debug')('possum:debug')
    ,error = require('debug')('possum:error')
    ;


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
        ,INVALID_TRANSITION: 'invalidTransition'
    }
    var factory = stampit()
    factory.state({
        initialState: cfg.initialState
        ,namespace: cfg.namespace
        ,state: undefined
    })


    function handleTransition(e) {
        var priorCfg = (this.states[e.fromState] || {})
            ,toCfg = this.states[e.toState]
            ;
        if(priorCfg._onExit) {
            priorCfg._onExit.call(this)
        }

        this.priorState = e.fromState
        this.state = e.toState

        if(toCfg._onEnter) {
            toCfg._onEnter.call(this)
        }
        this.emit('transitioned', {
            toState: e.toState
            ,fromState: e.fromState
            ,event: 'transitioned'
        })
    }
    factory.enclose(function(){

        var events = []
        function enqueue(e) {
            events.push(e)
        }
        function process() {
            while(!!events.length) {
                var e = events.shift()
                if(!e || !e.event) {
                    var msg = 'Bad event during processing';
                    error(msg)
                    throw new Error(msg)
                }
                this.emit(e.event,e)
            }
        }

        this.on('transition',handleTransition.bind(this))

        this.states = cfg.states
        this.canBe = function(state) {
            return !!this.states[state]
        }
        this.transition = function(state) {
            //do not transition to same state
            if(this.state === state) {
                return this
            }

            var event = {
                toState: state
                ,fromState: this.state
                ,event: (this.canBe(state) ? EVENTS.TRANSITION : EVENTS.INVALID_TRANSITION)
            }
            enqueue(event)
            process.call(this)
            return this
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
