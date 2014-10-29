'use strict';


var stampit = require('stampit')
module.exports = stampit()
.methods({
    start: function start() {
        if(this.started) {
            throw new Error('Already started')
        }
        this.started = true
        return this.handle('start',{
            toState: this.initialState
            ,fromState: undefined
        })
    }
    ,handle: function handler(inputType, msg) {
        this.queue.handle('enqueue',{
            inputType: inputType
            ,payload: msg
            ,state: this.state
        })
        return this.queue.handle('process', this)
    }
    ,transition: function transition(toState) {
        return this.handle('transition',{
            toState: toState
            ,fromState: this.state
        })
    }
})
