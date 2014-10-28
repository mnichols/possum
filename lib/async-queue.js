'use strict';

var stampit = require('stampit')
module.exports = function asyncQueue(cfg) {
    // Helper function to chain an array of promises into
    // a sequence, starting with the provided "seed" value.
    // Passes along the context of the original callee.
    function chainPromises(arr, seed) {
        return arr.reduce(function (sequence, fn) {
            return sequence.then(fn.bind(this))
        }.bind(this), seed)
    }

    return stampit().enclose(function(){
        var buffer = []
        this.enqueue = function(fn) {
            buffer.push(fn)
        }
        this.process = function(){
            return chainPromises(buffer,cfg.Promise.resolve())
                .then(function(result){
                    buffer.length = 0
                    return result
                })
        }
    }).create()

}
