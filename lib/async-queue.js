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

var processor = stampit()
    .state({
        router: function(e) {
            throw new Error('not implemented: router')
        }
    })
    .methods(emitter)
    .methods({
        raise: function(e) {
            this.emit(e.topic, e)
            return this
        }
    })
    .enclose(function(){
        function invoke(context, message, handler) {
            return Promise.resolve(message)
                .bind(this)
                .then(function(msg) {
                    var result = handler.call(context, message.payload)
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
                    //here we process message which would
                    //be prioritized by this message handlers' completion
                    return result
                })
        }


        function handle(context, message, handlers) {
            if(!handlers.length) {
                return Promise.resolve(context)
            }
            var handler = shift.call(handlers)
            if(!handler.fn) {
                throw new Error('handlers must provide a `fn` to be invoked')
            }
            return invoke.call(this, context, message, handler.fn)
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
            debug('processing',message.inputType)

            var handlers = this.router(spec)
            if(!handlers) {
                return process.call(this,context,  messages)
            }
            return handle.call(this,context, message, handlers)
                .bind(this)
                .then(process.bind(this,context, messages))
        }

        stampit.mixIn(this, {
            process: process
        })
    })


var model = stampit()
    .state({
        messages: []
        ,router: undefined
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
        ,process: function(context, messages) {
            messages = (messages || this.messages.splice(0, this.messages.length))
            return processor({
                raise: this.raise.bind(this)
                ,router: this.router
            }).process(context, messages)
        }
    })

return model
}

