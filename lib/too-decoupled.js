'use strict';

var stampit = require('stampit')
    ,cuid = require('cuid')
    ,EventEmitter2 = require('eventemitter2').EventEmitter2
    ,debug = require('debug')('possum:debug')
    ,error = require('debug')('possum:error')
    ,Promise = require('bluebird')
    ,slice = Array.prototype.slice
    ,EVENTS = require('./system-events')
    ,api = require('./api')
    ,states= require('./states')
    ,queue = require('./asynchronous-queue')
    ;


module.exports = possum


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


function possum(cfg, services){
    assertCfg(cfg)

    var stampedEmitter = new EventEmitter2()

    var defaults = stampit()
        .state({
            initialState: undefined
            ,namespace: 'possum__' + cuid()
            ,started: false
        })
    var configured = stampit()
        .state({
            initialState: cfg.initialState
            ,namespace: cfg.namespace
        })


    var evented = stampit()
        .methods(stampedEmitter)

    var stateful = states({
            Promise: Promise
        })
        .state({
            states: cfg.states
        })


    var startable = stampit()
        .methods({
            start: function start(){
                if(this.started) {
                    throw new Error('Already started')
                }

                this.started = true
                return this.transition(this.initialState)
            }
        })

    var queued = queue({
        Promise: Promise
    })
    .methods(stampedEmitter)
    .create()


    var model = stampit
        .compose(
            defaults
            , configured
            , api
            , startable
            , stateful
            , evented
        )
        .state({
            queue: queued
        })
        .enclose(function(){
            stampit.mixIn(this.queue,{
                collect: this.collect.bind(this)
            })
        })

    return model

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

}

