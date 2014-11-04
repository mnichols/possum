'use strict';

var stampit =require('stampit')
    ,debug = require('debug')('possum:debug')

module.exports = function deferrals(cfg) {

var nextHandler = stampit()
    .state({
        isSatisfied: false
        ,command: undefined
        ,type: 'handler'
    })
    .methods({
        handler: function(){
            this.isSatisfied = true
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
            var handlers = deferrals
                .filter(function(def){
                    return def.type === 'handler'
                })
                .forEach(function(def){
                    def.handler()
                })
        }
        function satisfyTransitions(toState){
            var transitioners =deferrals
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
                })
                deferrals.push(def)
                return this
            }
            ,deferUntilNextHandler: function(){
                var command = this.queue.defer()
                var def = nextHandler({
                    command: command
                })
                deferrals.push(def)
                return this
            }
            ,deferred: function(handled) {
                var remove = []
                var sats = deferrals
                    .filter(function(def,index){
                        var sat = def.isSatisfied
                        if(sat){
                            remove.push(index)
                        }
                        return sat
                    })
                    .map(function(def) {
                        return def.command
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
            handle: function(inputType){
                var result = originalHandle.apply(this,arguments)
                return result.then(function(result){
                        satisfyHandlers()
                        return result
                    })
            }
            ,transition: function(toState){
                debug('decorated transition',toState)
                return originalTransition.apply(this, arguments)
                    .then(function(result){
                        satisfyTransitions(toState)
                        return result
                    })
            }
        })
    })


    return model
}
