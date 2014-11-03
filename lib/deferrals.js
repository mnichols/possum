'use strict';

var stampit =require('stampit')

var deferral = stampit()
    .state({
        matches: []
        ,specifications: []
        ,command: undefined
        ,type: undefined
    })
    .methods({
        isSatisfiedBy : function isSatisfiedBy(msg) {
            if(!this.specifications.length) {
                throw new Error('deferral is missing specifications')
            }
            var spec = this.specifications[0]
            if(spec.call(this,msg)) {
                splice.call(this.specifications, 0, 1)
                push.call(this.matches,msg)
                if(!this.specifications.length) {
                    return true
                }
            }
            return false
        }
    })

var transitionDeferral = stampit()
    .state({
        state: undefined
        ,type: 'transition'
    })
    .methods({
        matchesState: function(msg) {
            return !this.state || (msg.toState === this.state)
        }
    })
    .compose(deferral)
    .enclose(function(){
        this.specifications = [
            '_onExit'
            ,'_transition'
            ,'_onEnter'
        ].map(function(inputType) {
            return function isSatisfied(msg) {
                return ((msg.inputType === inputType) && this.matchesState(msg))
            }
        })

    })

var handlerDeferral = stampit()
    .state({
        type: 'handler'
    })
    .compose(deferral)
    .enclose(function(){
        function transitionHandler(msg) {
            return (msg.inputType.charAt(0) === '_')
        }
        function postTransition(msg) {
            return !!passes
        }
        this.specifications = []
        push.call(this.specifications, function(msg){
            if(transitionHandler(msg)) {
                return false
            }
            return msg.id !== this.command.id
        })
    })

module.exports = stampit()
    .state({
        transition: transitionDeferral
        ,handler: handlerDeferral
    })
