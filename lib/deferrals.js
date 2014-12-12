'use strict';

var stampit =require('stampit')
    ,Promise = require('bluebird')
    ,debug = require('debug')('possum:debug:deferrals')
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
    if(!this.currentProcessContext || typeof this.currentProcessContext !== 'function') {
        throw new Error('an accessor to `currentProcessContext` is required')
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
                var currentMessage = this.currentProcessContext().currentMessage()
                push.call(deferred, currentMessage)
                debug(currentMessage.inputType,'on',this.state,'deferring until next handler')
                notifyDeferred.call(this,currentMessage)
                return this
            }
        })

    })


var scheduleDeferral = stampit()
    .enclose(function(){
        assertMixin.call(this)

        function handleScheduled(context, inputType, args, resolve) {
            return context.once(EVENTS.CONTEXT.COMPLETED, function(e){
                return this.handle(inputType,args)
                    .bind(this)
                    .then(resolve)
            }.bind(this))
        }
        stampit.mixIn(this,{
            /**
             * Schedules `inputType` to be `handle`d when the current processing cycle has completed
             * (if in-process), or immediately.
             * @method schedule
             * @return {Promise} resolving when the scheduled input has completed
             * */
            schedule: function(inputType, args) {
                var context = this.currentProcessContext()
                if(context && context.is(EVENTS.CONTEXT.PROCESSING)) {
                    var handler = handleScheduled.bind(this,context,inputType,args)
                    return new Promise(handler)
                }
                return this.handle(inputType,args)
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
                    ,currentMessage = this.currentProcessContext().currentMessage()

                arr = (deferrals[toState] = (deferrals[toState] || []))
                push.call(arr,currentMessage)
                debug(currentMessage.inputType,'on',this.state,'deferring until transition to',toState)
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

                //careful not to enqueue during this tick
                //or else you get into an infinite loop!
                return originalTransition.call(this, toState)
                    .tap(deferralQueue.enqueue.bind(deferralQueue,satisfied))
            }
        })
    })



return stampit.compose(
    handlerDeferral
    ,transitionDeferral
    ,scheduleDeferral
)

}
