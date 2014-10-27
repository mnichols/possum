'use strict';

var stampit = require('stampit')
    ,EventEmitter2 = require('eventemitter2').EventEmitter2
module.exports = function mock(emitter){
    emitter = emitter || new EventEmitter2({
        wildcard: true
    })

    return stampit().enclose(function(){
        var events = {}
        emitter.onAny(function() {
            var args = [].slice.call(arguments,0)
            var e = this.event
            var arr = (events[e] || [])
            arr.push(args)
            events[e] = arr
        })
        this.emit = emitter.emit.bind(emitter)
        this.on = emitter.on.bind(emitter)
        this.emitted = function(e){
            if(e) {
                return (events[e] || [])
            }
            return events
        }
        this.reset = function(){
            events = {}
        }
    }).create()
}
