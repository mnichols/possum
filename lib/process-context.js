'use strict';
var stampit = require('stampit')
    ,EventEmitter2 = require('eventemitter2').EventEmitter2
    ,Promise = require('bluebird')
    ,push = Array.prototype.push
    ,splice = Array.prototype.splice
    ,shift = Array.prototype.shift
    ,unshift = Array.prototype.unshift
    ,EVENTS = require('./system-events')
    ,warn = require('debug')('possum:warn')
    ,debug = require('debug')('possum:debug:async-queue')
    ,error = require('debug')('possum:error')


/**
 * Provides a reference for processing messages. Emits events for changes to the
 * context status.
 * */
var model = stampit()
    .state({
        target: undefined
    })
    .enclose(function(){
        var cycles = 0
        if(!this.target) {
            throw new Error('target is required')
        }
        var currentMessage = undefined
            ,contextStatus = 'INIT'
            //must have a distinct emitter
            ,eventEmitter = new EventEmitter2
            ,blacklist = [
                '_onExit'
                ,'_transition'
            ]

        function canCauseReplay(message) {
            return (message.inputType && blacklist.indexOf(message.inputType) < 0)
        }
        function assertIncomplete(){
            if(this.is(EVENTS.CONTEXT.COMPLETED)) {
                throw new Error('Context has completed. Please create another.')
            }
        }
        //expose subset of eventing facility
        stampit.mixIn(this,{
            once: eventEmitter.once.bind(eventEmitter)
            ,on: eventEmitter.on.bind(eventEmitter)
        })
        stampit.mixIn(this, {
            status: function(state){
                assertIncomplete.call(this)
                if(state) {
                    //emit changes to status
                    contextStatus = state
                    eventEmitter.emit(contextStatus, this)
                    return contextStatus
                }
                return contextStatus
            }
            ,is: function(state) {
                return contextStatus === state
            }
            ,hasTarget: function(){
                return !!this.target
            }
            ,currentMessage: function(obj) {
                assertIncomplete.call(this)

                if(!obj && !currentMessage) {
                    throw new Error('Possum is not processing a message.')
                }
                if(obj) {
                    return (currentMessage = obj)
                }
                return currentMessage
            }
            ,infinite: function(){
                return (++cycles > 1000)
            }
            ,replayable: function(){
                var replay = !!currentMessage && canCauseReplay(currentMessage)
                return replay
            }
            /**
             * Basically a fresh copy of the context pointing to the `target`.
             * No attempt at tracking context hierarchies is done currently.
             * @method createChild
             */
            ,createChild: function(){
                return processContext({ target: this.target })
            }
        })
        //seal the target
        Object.defineProperty(this, 'target',{
            writable: false
            ,configurable: false
        })
        //LSP to context.target
        Object.defineProperty(this, 'state',{
            get: function(){
                return this.target.state
            }
        })
    })

module.exports = processContext

function processContext(cfg) {
    return model(cfg)
}

