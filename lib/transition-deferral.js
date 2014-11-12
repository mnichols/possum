'use strict';
var stampit =require('stampit')
    ,debug = require('debug')('possum:debug')
    ,asyncQueue = require('./async-queue')


module.exports = stampit()
    .enclose(function(){
        var originalTransition = this.transition
            ,ANY_STATE = 'ANY'
            ,deferrals = {}
        ;

        var deferralQueue = asyncQueue()
            .state({
                name: 'queue.transition.deferral'
            })
            .create()


        stampit.mixIn(this, {
            deferUntilTransition: function(toState) {
                toState = (toState || ANY_STATE)
                var arr
                    ,currentMessage = this.currentMessage()

                deferrals[toState] = (arr = (deferrals[toState] || []))
                push.call(arr,currentMessage)
                this.raise(event({
                    topic: EVENTS.DEFERRED
                    ,payload: currentMessage
                    ,state: this.state
                }))
                return this
            }
            ,transition: function(toState) {
                toState = (toState || ANY_STATE)
                //copy messages into primary queue for `toState` matches
                //if provided
                deferralQueue.enqueue(deferrals[toState] || [])
                ;(delete deferrals[toState])
                return originalTransition.call(this, toState)
            }
            ,queue: function(){
                return deferralQueue
            }
        })
    })
