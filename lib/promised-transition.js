'use strict';

var stampit = require('stampit')
    ,chainPromises = require('./chain-promises')
    ,slice = Array.prototype.slice
    ,EVENTS = require('./system-events')

module.exports = transitioner


function noop(result){ return result; }

function transitioner(cfg) {
    if(!cfg.Promise){
        throw new Error('Promise is required')
    }

    function doTransition(e) {
        this.priorState = e.fromState
        this.state = e.toState
        this.emit(EVENTS.TRANSITION,e)
        return e
    }
    function notifyTransitioned(e) {
        this.emit(EVENTS.TRANSITIONED, e)
        return e
    }
    return stampit()
        .methods({
            execute: function(e) {
                var args = slice.call(arguments)
                var toState = e.toState
                var payload = {
                    toState: toState
                    ,fromState: e.fromState
                }

                var fromCfg = (this.states[payload.fromState] || {})
                    ,toCfg = this.states[payload.toState]
                    ;

                if(!toCfg) {
                    this.emit(EVENTS.INVALID_TRANSITION,payload)
                    return cfg.Promise.resolve(this)
                }
                return cfg.Promise.resolve(payload)
                    .bind(this)
                    .then(fromCfg._onExit || noop)
                    .then(doTransition.bind(this,payload))
                    .then(toCfg._onEnter || noop)
                    .then(notifyTransitioned.bind(this,payload))
            }
        })
        .create()
}
