'use strict';

module.exports = function chainPromises(arr, seed) {
    // Helper function to chain an array of promises into
    // a sequence, starting with the provided "seed" value.
    // Passes along the context of the original callee.
    return arr.reduce(function (sequence, fn) {
        return sequence.then(fn.bind(this))
    }.bind(this), seed)
}
