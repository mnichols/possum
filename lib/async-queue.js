'use strict';

var stampit  = require('stampit')
    ,push = Array.prototype.push
    ,splice = Array.prototype.splice
    ,shift = Array.prototype.shift
    ,EVENTS = require('./system-events')
    ,event = require('./event')

module.exports = queue

function queue(cfg) {

cfg = (cfg || {})

var Promise = cfg.Promise

var unitOfWork = stampit()
    .state({
        command: undefined
        ,handlers: []
    })
    .methods({
        defer: function() {
            return this.raise(event({
                topic: EVENTS.DEFERRED
                ,payload: this.command
            }))
        }
        ,flush: function(context){
            if(!this.handlers.length) {
                return this
            }
            var handler = shift.call(this.handlers)
            return Promise.resolve(this.command.payload)
                .bind(context)
                .then(handler)
                .bind(this)
                .then(function(result){
                    this.raise(event({
                        topic: EVENTS.HANDLED
                        ,payload: this.command
                    }))
                    return result
                })
                .then(this.flush.bind(this, context))
        }
    })

var model =  stampit()
    .state({
        deferrals: []
    })
    .enclose(function(){
        var buffer = []
            ,active = []
            ,uow = undefined
            ,processing = undefined
            ;

        function process(context, collect) {
            if(!active.length) {
                uow = undefined
                processing = undefined
                return context
            }
            var command = active.shift()
            //fetch handlers for command (array)
            var handlers = collect(command.inputType)

            if(!handlers.length) {
                this.raise(event({
                    topic: EVENTS.NO_HANDLER
                    ,payload: this.command
                }))
                return this
            }
            uow = unitOfWork({
                command: command
                ,handlers: handlers
                ,raise: this.raise
            })
            return Promise.resolve(context)
                .then(uow.flush.bind(uow))
                //.then(this.processDeferrals.bind(this, command, context ))
                .then(process.bind(this, context, collect))
        }
        stampit.mixIn(this,{
            enqueue: function(msgs) {
                push.apply(buffer,[].concat(msgs))
                return this
            }
            ,process: function(context, collect, messages) {
                if(!context) {
                    throw new Error('context must be provided')
                }
                if(!collect) {
                    throw new Error('A collection method for collecting commands is required.')
                }
                messages = (messages || buffer)
                if(processing) {
                    return processing.then(process.bind(this, context, collect, messages))
                }
                active = splice.call(messages, 0, messages.length)
                return processing = process.call(this, context, collect)
            }
            ,deferUntilNextHandler: function(){
                push.call(this.deferrals,handlerDeferral({
                    command: this.unitOfWork.deferCurrent()
                }))
                return this
            }
            ,deferUntilTransition: function(state) {
                push.call(this.deferrals,transitionDeferral({
                    command: this.unitOfWork.deferCurrent()
                    ,state: state
                }))
                return this
            }
        })
    })

return model
}
