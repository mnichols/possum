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
    })
    .methods({
        defer: function() {
            this.raise(event({
                topic: EVENTS.DEFERRED
                ,payload: this.command
            }))
            return this.command
        }
        ,flush: function(context){
            if(++this.cycles > 100) {
                warn('cycles detected','unit of work')
                throw new Error('cycle')
            }
            if(!this.handlers.length) {
                debug('flushed',this.command.inputType)
                return this.command
            }
            debug('flushing',this.command.inputType)
            var handler = shift.call(this.handlers)
            if(!handler.fn) {
                throw new Error('handlers should have a `fn`')
            }
            return Promise.resolve(this.command.payload)
                .bind(context)
                .then(handler.fn)
                .bind(this)
                .then(function(result){
                    debug('raising',EVENTS.HANDLED)
                    this.raise(event({
                        topic: EVENTS.HANDLED
                        ,payload: this.command
                        ,action: this.command.command
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
            debug('processing',command.inputType,handlers.length)

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
            return uow.flush(context)
                .bind(this)
                .then(this.deferred)
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
                var target = processing ? active : buffer;
                unshift.apply(target,msgs)
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
                if(processing) {
                    return processing
                        .then(process.bind(this, context, collect, messages))
                }
                active = splice.call(messages, 0, messages.length)
                return processing = Promise.resolve()
                    .then(process.bind(this, context, collect))

            }
        })
    })

return model
}
