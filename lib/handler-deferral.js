'use strict';

var stampit =require('stampit')
    ,debug = require('debug')('possum:debug')
    ,asyncQueue = require('./async-queue')

module.exports = stampit()
    .state({
        queue: undefined
    })
    .enclose(function(){
        var originalHandle = this.handle
            ,deferred = []
        var deferralQueue = this.queue

        stampit.mixIn(this, {
            handle: function(inputType, args) {
                deferralQueue.enqueue(deferred.splice(0,deferred.length))
                return originalHandle.call(this, inputType, args)
            }
            ,deferUntilNextHandler: function(){
                var currentMessage = this.currentMessage()
                deferralQueue.enqueue(currentMessage)
                this.raise(event({
                    topic: EVENTS.DEFERRED
                    ,payload: currentMessage
                    ,state: this.state
                }))
                return this
            }
        })

    })
