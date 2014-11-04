'use strict';

var stampit =require('stampit')

module.exports = function deferrals(cfg) {

var nextHandler = stampit()
    .state({
        isSatisfied: false
        ,command: undefined
        ,type: 'handler'
    })
    .methods({
        handler: function(){
            this.isSatisfied
            return this
        }
    })

var transitionedTo = stampit()
    .state({
        isSatisfied: false
        ,command: undefined
        ,type: 'transition'
        ,toState: undefined
    })
    .methods({
        transition: function(toState) {
            this.isSatisfied = (!this.toState || (this.toState === toState))
            return this
        }
    })
var model = stampit()
    .enclose(function(){
        var deferrals = []
        function satisfyHandlers(){
            var handlers = Object.keys(deferrals)
                .filter(function(def){
                    return def.type === 'handler'
                })
                .forEach(function(def){
                    def.handler()
                })
        }
        function satisfyTransitions(toState){
            var transitioners = Object.keys(deferrals)
                .filter(function(def){
                    return def.type === 'transition'
                })
                .forEach(function(def){
                    def.transition(toState)
                })
        }
        stampit.mixIn(this,{
            deferUntilTransition: function(toState) {
                var command = this.queue.defer()
                var def = transitionedTo({
                    command: command
                    ,toState: toState
                }).create()
                deferrals.push(def)
                return this
            }
            ,deferUntilNextHandler: function(){
                var command = this.queue.defer()
                var def = nextHandler({
                    command: command
                }).create()
                deferrals.push(def)
                return this
            }
            ,deferred: function(handled) {
                var remove = []
                var sats = deferrals.filter(function(def,index){
                    var sat = def.isSatisfied
                    if(sat){
                        remove.push(index)
                    }
                    return sat
                })
                remove.forEach(function(index){
                    deferrals.splice(index,1)
                })
                return sats
            }
        })

        //decorate
        var originalHandle = this.handle
            ,originalTransition = this.transition
        stampit.mixIn(this,{
            handle: function(){
                var result = originalHandle.call(this,arguments)
                return result.then(function(result){
                        satisfyHandlers()
                        return result
                    })
            }
            ,transition: function(toState){
                debug('decorated transition',toState)
                return originalTransition.call(this, arguments)
                    .then(function(result){
                        satisfyTransitions(toState)
                        return result
                    })
            }
        })
    })


    return model
}
