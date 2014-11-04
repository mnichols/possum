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
                return Promise.resolve(this.command)
            }
            var handler = shift.call(this.handlers)
            if(!handler.fn) {
                throw new Error('handlers should have a `fn`')
            }
            debug('handling',handler.action,'with',this.command.payload)
            return Promise.resolve(this.command.payload)
                .bind(this)
                .tap(function(){
                    this.raise(event({
                        topic: 'handling'
                        ,inputType: this.command.inputType
                        ,payload: this.command.payload
                    }))
                })
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
                debug('clearing after cycles',cycles)
                return this.clear()
            }
            var command = shift.call(active)
            var spec = {
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
                msgs = ([].concat(msgs))
                if(msgs.some(function(msg){
                    return !msg.inputType
                })) {
                    throw new Error('inputType is required')
                }

                push.apply(buffer,msgs)
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
            ,clear: function(){
                uow = undefined
                processing = undefined
                cycles = 0
                active.length = 0
                buffer.length = 0
                return this
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
            ,mount: function(context, collect, messages) {
                return model
                    .enclose(function(){
                        function processor(context, collect, messages) {
                            if(!messages.length) {
                                console.log('NO MORE MESSAGES')
                                return this
                            }
                            var command = shift.call(messages)
                            var spec = {
                                inputType: command.inputType
                                ,state: context.state
                            }
                            //fetch handlers for command (array)
                            var handlers = collect(spec)
                            uow = unitOfWork({
                                command: command
                                ,handlers: handlers
                                ,raise: this.raise
                            })
                            return uow.flush(context)
                                .then(processor.bind(this, context, collect,messages))
                        }
                        stampit.mixIn(this,{
                            deferred: function(){
                                return Promise.resolve([])
                            }
                            ,enqueue: function(){
                                return Promise.resolve(this)
                            }
                            ,raise: function(e) {
                                return Promise.resolve(this)
                            }
                            ,process: function(context,collect,messages) {
                                if(this.processed) {
                                    return Promise.resolve(this)
                                }
                                this.processed = true
                                debug('mounting',messages.length,'messages')

                                return processor.call(this, context, collect, messages)
                                    .bind(this)
                                    .then(this.clear)
                            }
                        })
                    })
                    .create()
                    .process(context, collect, messages)

            }
        })
    })

return model
}
