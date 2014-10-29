'use strict';

var stampit = require('stampit')
    ,slice = Array.prototype.slice
    ,EVENTS = require('./system-events')

module.exports = stateful

function noop(result){ return result; }

function stateful(cfg) {
    cfg = (cfg || {})
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
            ,execute: function(e) {
            }
            ,transition: function(e) {
                if(e.toState === this.state) {
                    return e
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
                    return e
                }
                //async
                if(this.Promise) {
                    return this.Promise.resolve(payload)
                        .bind(this)
                        .then(fromCfg._onExit || noop)
                        .then(doTransition.bind(this,payload))
                        .then(toCfg._onEnter || noop)
                        .then(notifyTransitioned.bind(this,payload))
                }

                //sync
                var fns = [
                    (fromCfg._onExit || noop)
                    ,doTransition.bind(this,payload)
                    ,(toCfg._onEnter || noop)
                    ,notifyTransitioned.bind(this,payload)
                ]
                fns.forEach(function(fn){
                    fn.call(this,payload)
                },this)

                return this

            }
        })
}
