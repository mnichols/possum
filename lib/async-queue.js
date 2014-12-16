'use strict';

var stampit  = require('stampit')
   ,EventEmitter2 = require('eventemitter2').EventEmitter2
    ,Promise = require('bluebird')
    ,push = Array.prototype.push
    ,splice = Array.prototype.splice
    ,shift = Array.prototype.shift
    ,unshift = Array.prototype.unshift
    ,EVENTS = require('./system-events')
    ,event = require('./event')
    ,processContext = require('./process-context')
    ,warn = require('debug')('possum:warn')
    ,debug = require('debug')('possum:debug:async-queue')
    ,error = require('debug')('possum:error')

module.exports = queue

function queue(cfg) {

cfg = (cfg || {})

var emitter = (cfg.emitter || new EventEmitter2)


var model = stampit()
    .state({
        messages: []
        ,router: undefined
        ,queues: []
        ,name: 'possum.queue'
    })
    .methods(emitter)
    .methods({
        raise: function(e) {
            this.emit(e.topic, e)
            return this
        }
    })
    .methods({
        /**
         * Pushes either a single message or an {Array} of messages onto this queue
         * @method enqueue
         * */
        enqueue: function(msgs) {
            //accept a single message or an array of messages
            this.messages = this.messages.concat([].concat(msgs))
            return this
        }
    })
    .enclose(function(){

        function processInnerQueues(context) {
            //some messages should not trigger inner processing
            //and only then if queues are available to process
            if(!context.replayable() || !(this.queues && this.queues.length)) {
                return Promise.resolve(context)
            }
            debug('processing inner queues')
            return Promise.resolve(this.queues || [])
                .each(function(queue){
                    //each inner queue receives a child context
                    var child = context.createChild()
                    return queue.process.call(queue, child)
                })
                .then(function(){
                    return context
                })
        }
        function invoke(context, message, handler) {
            var fn = handler.fn
            if(!fn) {
                throw new Error('handler must have a `fn` to be invoked')
            }
            debug(this.name,'invoking',handler.name)
            return Promise.resolve(message)
                .bind(this)
                .then(function(msg) {
                    var result = fn.call(context.target, message.payload)
                    this.raise({
                        topic: EVENTS.QUEUE.HANDLED // -> marshal as 'handled'
                        ,action: handler.name
                        ,message: message
                    })

                    return result
                })
                .then(function(result){
                    this.raise({
                        topic: EVENTS.QUEUE.COMPLETED // -> marshal as 'completed'
                        ,action: handler.name
                        ,message: message
                    })
                    return processInnerQueues.call(this,context, message)
                })
                .tap(function(){
                    debug(this.name,'invoked',handler.name)
                })
        }


        function handle(context, message, handlers) {
            if(!handlers.length) {
                return Promise.resolve(context)
            }
            var handler = shift.call(handlers)
            return invoke.call(this, context, message, handler)
                .bind(this)
                .then(handle.bind(this,context, message, handlers))
        }

        function process(context, messages) {
            if(context.infinite()) {
                throw new Error('cycle detected in queue process for queue ' + this.name)
            }
            if(!messages.length) {
                return Promise.resolve(context)
            }
            var message = shift.call(messages)
                ,spec = {
                    inputType: message.inputType
                    ,state: context.state
                }
            try {
                context.currentMessage(message)
            } catch(err) {
                error(err,'attempting to assign currentMessage:',message)
                throw err
            }

            var handlers = [].concat(this.router(spec))
            if(!handlers || !handlers.length) {
                debug(this.name,'NO HANDLERS for',spec.inputType,'at',spec.state)
                this.raise({
                    topic: EVENTS.QUEUE.NO_HANDLER
                    ,message: message
                    ,action: undefined
                })
                return process.call(this,context,  messages)
            }
            debug(this.name,'processing','`' + message.inputType + '`','with',handlers.length,'handlers')
            return handle.call(this,context, message, handlers)
                .bind(this)
                .then(process.bind(this,context, messages))
        }


        stampit.mixIn(this, {
            process: function(context, messages) {
                var self = this
                if(!context) {
                    throw new Error('a context is required')
                }
                //sometimes we pass the target in as the context
                if(!context.hasTarget || !context.hasTarget()) {
                    context = this.createContext(context)
                }
                if(messages) {
                    messages = [].concat(messages)
                } else {
                    messages = this.messages.splice(0, this.messages.length)
                }
                debug(this.name,'processing',messages.length,'messages','for context')

                context.status(EVENTS.CONTEXT.PROCESSING)

                return process.call(this,context,messages)
                        .bind(this)
                        .then(function(result){
                            context.status(EVENTS.CONTEXT.COMPLETED)
                            return result
                        })
            }
            ,createContext: function(target){
                return processContext({
                    target: target
                })
            }
            ,addQueue: function(queue) {
                this.queues.push(queue)
                return this
            }
        })

    })

return model
}

