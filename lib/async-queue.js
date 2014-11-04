'use strict';

var stampit  = require('stampit')
    ,push = Array.prototype.push
    ,splice = Array.prototype.splice
    ,shift = Array.prototype.shift
    ,unshift = Array.prototype.unshift
    ,EVENTS = require('./system-events')
    ,event = require('./event')
    ,warn = require('debug')('possum:warn')
    ,debug = require('debug')('possum:debug')

module.exports = queue

function queue(cfg) {

cfg = (cfg || {})

var Promise = cfg.Promise

var unitOfWork = stampit()
    .state({
        command: undefined
        ,handlers: []
        ,cycles: 0
        ,deferred: false
    })
    .methods({
        defer: function() {
            this.deferred = true
            this.raise(event({
                topic: EVENTS.DEFERRED
                ,payload: this.command
                ,inputType: this.command.inputType
            }))
            return this.command
        }
        ,notifyCompletion: function(handler, result) {
            if(this.deferred) {
                return result
            }
            this.raise(event({
                topic: EVENTS.HANDLED
                ,payload: this.command.payload
                ,action: handler.action
                ,inputType: this.command.inputType
            }))

            return result
        }
        ,flush: function(context){
            if(++this.cycles > 100) {
                warn('cycles detected','unit of work')
                throw new Error('cycle')
            }
            if(!this.handlers.length) {
                return this.command
            }
            var handler = shift.call(this.handlers)
            if(!handler.fn) {
                throw new Error('handlers should have a `fn`')
            }
            debug('handling',handler.action,'with',this.command.payload)
            return Promise.resolve(this.command.payload)
                .bind(context)
                .then(handler.fn)
                .bind(this)
                .then(this.notifyCompletion.bind(this,handler))
                .then(this.flush.bind(this, context))
        }
    })

var model =  stampit()
    .state({
        deferrals: []
    })
    .methods({
        deferred: function(handled) {
            warn('deferred commands not queried after',handled)
            return []
        }
        ,raise: function(e) {
            warn('event not published',e)
            return this
        }
    })
    .enclose(function(){
        var buffer = []
            ,active = []
            ,uow = undefined
            ,processing = undefined
            ,cycles = 0
            ;

        function process(context, collect) {
            if(++cycles > 100) {
                warn('infinite cycle detected','be sure deferred commands are cleared upon consumption')
                return context
            }
            if(!active.length) {
                uow = undefined
                processing = undefined
                cycles = 0
                return context
            }
            var command = shift.call(active)
                ,spec = {
                    inputType: command.inputType
                    ,state: context.state
                }
            //fetch handlers for command (array)
            var handlers = collect(spec)

            if(!handlers.length) {
                this.raise(event({
                    topic: EVENTS.NO_HANDLER
                    ,payload: command.payload
                    ,inputType: command.inputType
                }))
                return this
            }
            uow = unitOfWork({
                command: command
                ,handlers: handlers
                ,raise: this.raise
            })
            return uow.flush(context)
                .bind(this)
                .then(context.deferred || this.deferred)
                .then(this.prioritize)
                .then(process.bind(this, context, collect))
        }
        stampit.mixIn(this,{
            enqueue: function(msgs) {
                push.apply(buffer,[].concat(msgs))
                return this
            }
            ,prioritize: function(msgs) {
                if(!msgs || !msgs.length) {
                    return []
                }
                unshift.apply(active,msgs)
                return msgs
            }
            ,defer: function(){
                if(uow) {
                    return uow.defer()
                }
                return undefined
            }
            ,process: function(context, collect, messages) {
                if(!context) {
                    throw new Error('context must be provided')
                }
                if(!collect || typeof collect !== 'function') {
                    throw new Error('A collection method for collecting commands is required.')
                }
                messages = (messages || buffer)
                active = splice.call(messages, 0, messages.length)
                return processing = Promise.resolve()
                    .then(process.bind(this, context, collect))

            }
        })
    })

return model
}
