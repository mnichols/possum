'use strict';

var stampit = require('stampit')
    ,chainPromises = require('./chain-promises')
    ,slice = Array.prototype.slice
    ,EVENTS = require('./system-events')

module.exports = transitioner


function noop(result){ return result; }

function transitioner(cfg) {

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
                    return this
                }
                var fns = [
                    (fromCfg._onExit || noop)
                    ,doTransition.bind(this,payload)
                    ,(toCfg._onEnter || noop)
                    ,notifyTransitioned.bind(this,payload)
                ]
                fns.forEach(function(fn) {
                    fn.apply(this,payload)
                },this)
                return this
            }
        })
        .create()
}
