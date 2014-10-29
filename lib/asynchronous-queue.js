'use strict';

var stampit = require('stampit')
    ,EVENTS = require('./system-events')

module.exports = stampit()
.methods({
    collect: function(){
        throw new Error('Collection method not implemented')
    }
})
.enclose(function(){
    var buffer = []
    function raiseHandled(event, result){
        return this.emit(EVENTS.HANDLED, event)
    }
    function processQueue() {
        if(!buffer.length) {
            return this.Promise.resolve(this)
        }
        var event = buffer.shift()
            ,handlers = this.collect(event.inputType)
                .map(function(handler){
                    return this.Promise.resolve(handler(event.payload))
                        .then(raiseHandled.bind(this,event))
                },this)

        if(handlers.length < 1) {
            this.emit(EVENTS.NO_HANDLER,event.inputType)
            return this.Promise.resolve(this)
        }

        return this.Promise.all(handlers)
            .bind(this)
            .then(processQueue.bind(this))
    }
    this.enqueue = function(msg) {
        buffer.push(msg)
    }
    this.process = function(context){
        var result = processQueue.call(this)
        return this.Promise.resolve(result)
    }
    this.handle = function(inputType,msg){
        var fn = this[inputType]
        return this.Promise.resolve(msg)
            .bind(this)
            .then(fn)
    }

})

