'use strict';

var stampit = require('stampit')
    ,asyncTransition = require('./promised-transition')
    ,EVENTS = require('./system-events')
    ;
module.exports = function asyncQueue(cfg) {

    var Promise = cfg.Promise
    if(!Promise) {
        throw new Error('Promise implementation is required')
    }

    return stampit()
        .enclose(function(){
            var buffer = []
            function collectHandlers(input) {
                var handlers = []
                if(input === 'transitioned') {
                    handlers.push(asyncTransition({
                        Promise:cfg.Promise
                    }).execute)
                }
                var currentCfg = this.states[this.state]
                var context = (currentCfg && currentCfg[input])
                if(context) {
                    handlers.push(context)
                }
                return handlers
            }
            function enqueue(e) {
                buffer.push(e)
            }
            function processQueue() {
                if(!buffer.length) {
                    return Promise.resolve(this)
                }
                var event = buffer.shift()
                    ,handlers = collectHandlers.call(this,event.inputType)
                        .map(function(fn){
                            return fn.call(this,event.payload)
                        },this)
                    ;

                if(handlers.length < 1) {
                    this.emit(EVENTS.NO_HANDLER,event.inputType)
                    return Promise.resolve(this)
                }

                return Promise.all(handlers)
                    .bind(this)
                    .then(function(){
                        this.emit(EVENTS.HANDLED,event)
                    })
                    .then(processQueue.bind(this))
            }
            this.process = processQueue
            this.enqueue = enqueue
        })
        .create()
}
