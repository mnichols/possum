'use strict';

var stampit =require('stampit')
    ,debug = require('debug')('possum:debug')
    ,asyncQueue = require('./async-queue')
    ,EVENTS = require('./system-events')
    ,event = require('./event')
    ,push = Array.prototype.push

module.exports = function deferrals() {

function notifyDeferred(message) {
    this.raise(event({
        topic: EVENTS.DEFERRED
        ,payload: message.payload
        ,state: this.state
        ,inputType: message.inputType
    }))
}

function assertMixin(){
    if(!this.queue) {
        throw new Error('a queue is required')
    }
    if(!this.router || typeof this.router !== 'function') {
        throw new Error('router [Function] is required')
    }
    if(!this.current || typeof this.current !== 'function') {
        throw new Error('an accessor to `currentMessage` is required')
    }
}

function canCauseReplay(message) {
    return (message.inputType && message.inputType.charAt(0) !== '_')
}

var handlerDeferral = stampit()
    .enclose(function(){
        assertMixin.call(this)
        var deferred = []
            ,router = this.router()
            ,originalHandle = this.handle

        if(!originalHandle) {
            throw new Error('this mixin decorates `handle` method which could not be found')
        }
        var deferralQueue = asyncQueue({
            emitter: this
        }).state({
            router: router.collect.bind(router)
            ,name: 'queue.deferrals.handle'
        })
        .create()

        //register for inner processing
        this.queue.addQueue(deferralQueue)


        stampit.mixIn(this, {
            handle: function(inputType, args) {
                var satisfied = deferred.splice(0,deferred.length)
                deferralQueue.enqueue(satisfied)
                return originalHandle.call(this, inputType, args)
            }
            ,deferUntilNextHandler: function(){
                var currentMessage = this.current().currentMessage()
                push.call(deferred, currentMessage)
                notifyDeferred.call(this,currentMessage)
                return this
            }
        })

    })



var transitionDeferral = stampit()
    .enclose(function(){
        assertMixin.call(this)
        var router = this.router()
            ,originalTransition = this.transition
            ,ANY_STATE = 'ANY'
            ,deferrals = {}
        ;
        if(!originalTransition) {
            throw new Error('`transition` method is required to decorate')
        }

        var deferralQueue = asyncQueue({
            emitter: this
        }).state({
            router: router.collect.bind(router)
            ,name: 'queue.deferrals.transition'
        })
        .create()

        this.queue.addQueue(deferralQueue)

        stampit.mixIn(this, {
            deferUntilTransition: function(toState) {
                toState = (toState || ANY_STATE)
                var arr
                    ,currentMessage = this.current().currentMessage()

                arr = (deferrals[toState] = (deferrals[toState] || []))
                push.call(arr,currentMessage)
                notifyDeferred.call(this, currentMessage)
                return this
            }
            ,transition: function(toState) {
                //copy messages into primary queue for `toState` matches
                //if provided
                var satisfied = (deferrals[toState] || [])
                    .concat(deferrals[ANY_STATE] || [])

                ;(delete deferrals[toState])
                ;(delete deferrals[ANY_STATE])

                //careful not to enqueue during this cycle
                //or else you get into an infinite loop!
                return originalTransition.call(this, toState)
                    .tap(deferralQueue.enqueue.bind(deferralQueue,satisfied))
            }
        })
    })



return stampit.compose(
    handlerDeferral
    ,transitionDeferral
)

}
