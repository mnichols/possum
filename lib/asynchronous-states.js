'use strict';

var stampit = require('stampit')
    ,slice = Array.prototype.slice
    ,EVENTS = require('./system-events')

module.exports = stateful

function noop(result){ return result; }

function stateful(cfg) {
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
        .state({
            Promise: cfg.Promise
            ,states: {}
        })
        .methods({
            config: function(state) {
                return this.states[state]
            }
            ,transition: function(e) {
                if(e.toState === this.state) {
                    return this.Promise.resolve(e)
                }
                var payload = {
                    toState: e.toState
                    ,fromState: e.fromState
                }

                var fromCfg = (this.config(payload.fromState) || {})
                    ,toCfg = (this.config(payload.toState))
                    ;

                if(!toCfg) {
                    this.emit(EVENTS.INVALID_TRANSITION,payload)
                    return this.Promise.resolve(this)
                }
                return this.Promise.resolve(payload)
                    .bind(this)
                    .then(fromCfg._onExit || noop)
                    .then(doTransition.bind(this,payload))
                    .then(toCfg._onEnter || noop)
                    .then(notifyTransitioned.bind(this,payload))
            }
        })
}
