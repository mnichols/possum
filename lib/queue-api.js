'use strict';

var stampit = require('stampit')
    ,synchronousTransition = require('./synchronous-transition')

module.exports = function queueApi(cfg) {

    var instaQueue = stampit()
        .state({
            namespace: 'possum.instaQueue'
        })
        .enclose(function(){
            var transition = synchronousTransition()
            var buffer = []
            this.handle = function(e, msg) {
                if(e === 'transition') {
                    return transition.execute.call(this,msg)
                }
                //throw new Error(e + ' is not supported')
            }
        })

    return stampit()
        .state({
            initialState: 'uninitialized'
            ,namespace: 'possum.queue'
            ,strategy: cfg.strategy
            ,queue: instaQueue.create()
        })
        .enclose(function(){
            var deferred = []
            stampit.mixIn(this, {
                states: {
                    'uninitialized': {
                        'initialize': function(){
                            return this.transition('initialized')
                        }
                    }
                    ,'initialized': {
                        'enqueue': function(e) {
                            this.strategy.buffer(e)
                        }
                        ,'process': function(){
                            this.deferUntilTransition()
                            return this.transition('processing')
                        }
                        ,'defer': function(predicate) {
                            this.deferUntilTransition()
                            return this.transition('deferring')
                        }
                    }
                    ,'deferring': {
                        'defer': function(predicate) {
                            this.predicate = predicate
                        }
                        ,'enqueue': function(e) {
                            deferred.push(e)
                            if(this.predicate && this.predicate.call(this,e)) {
                                this.strategy.buffer(deferred)
                                deferred.length = 0
                                return this.transition('initialized')
                            }
                        }
                    }
                    ,'processing': {
                        'process': function(target){
                            return this.strategy.process.call(target)
                        }
                    }
                }
            })

        })

}
