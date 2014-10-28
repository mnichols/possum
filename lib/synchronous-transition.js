'use strict';

var stampit = require('stampit')
    ,chainPromises = require('./chain-promises')
    ,slice = Array.prototype.slice

module.exports = transitioner

var EVENTS = {
    TRANSITION: 'transition'
    ,TRANSITIONED: 'transitioned'
    ,TRANSITIONING: 'transitioning'
    ,INVALID_TRANSITION: 'invalidTransition'
}

function noop(result){ return result; }

function transitioner(cfg) {
    function doTransition(e) {
        this.priorState = e.fromState
        this.state = e.toState
        this.emit('transition',e)
        return e
    }
    function notifyTransitioned(e) {
        this.emit('transitioned',e)
        return e
    }
    return stampit()
        .methods({
            execute: function() {
                var args = slice.call(arguments)
                var toState = args.shift()
                var payload = {
                    toState: toState
                    ,fromState: this.state
                    ,args: args
                }
                var fromCfg = (this.states[payload.fromState] || {})
                    ,toCfg = this.states[payload.toState]
                    ;

                if(!toCfg) {
                    this.emit(EVENTS.INVALID_TRANSITION,payload)
                    return this
                }
                var fns = [
                    (fromCfg._onEnter || noop)
                    ,doTransition.bind(this,payload)
                    ,(toCfg._onEnter || noop)
                    ,notifyTransitioned.bind(this,payload)
                ]
                fns.forEach(function(fn){
                    return fn.apply(this,payload.args)
                },this)
                return this
            }
        })
        .create()
}
