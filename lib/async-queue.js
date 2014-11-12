'use strict';

var stampit  = require('stampit')
    ,EventEmitter2 = require('eventemitter2').EventEmitter2
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

var Promise = (cfg.Promise || require('bluebird'))
    ,emitter = (cfg.emitter || new EventEmitter2)

var eligible = ['Promise','emitter']
var invalid = Object.keys(cfg).filter(function(key){
    return (eligible.indexOf(key) < 0)
})
if(invalid.length) {
    throw new Error('The following keys are invalid config for queue:' + JSON.stringify(invalid, null, 2))
}


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
        enqueue: function(msgs) {
            this.messages = this.messages.concat([].concat(msgs))
            return this
        }
    })
    .enclose(function(){
        function invoke(context, message, handler) {
            var fn = handler.fn
            if(!fn) {
                throw new Error('handler must have a `fn` to be invoked')
            }
            debug(this.name,'invoking',handler.name)
            return Promise.resolve(message)
                .bind(this)
                .then(function(msg) {
                    var result = fn.call(context, message.payload)
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
                    return Promise.resolve(this.queues)
                        .each(function(queue){
                            return queue.process.call(queue, context)
                        })
                        .then(function(result){
                            return result
                        })
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
            if(!messages.length) {
                return Promise.resolve(context)
            }
            var message = shift.call(messages)
                ,spec = {
                    inputType: message.inputType
                }

            var handlers = [].concat(this.router(spec))
            if(!handlers) {
                debug(this.name,'NO HANDLERS')
                return process.call(this,context,  messages)
            }
            debug(this.name,'processing',message.inputType,'with',handlers.length,'handlers')
            return handle.call(this,context, message, handlers)
                .bind(this)
                .then(process.bind(this,context, messages))
        }

        stampit.mixIn(this, {
            process: function(context, messages) {
                if(messages) {
                    messages = [].concat(messages)
                } else {
                    messages = this.messages.splice(0, this.messages.length)
                }
                debug(this.name,'process',messages.length)
                return process.call(this,context, messages)
            }
        })

    })

return model
}

