'use strict';

function noop(){}
module.exports = function transition(e) {
    var priorCfg = (this.states[e.fromState] || {})
        ,toCfg = this.states[e.toState]
        ;

    function update(){
        this.priorState = e.fromState
        this.state = e.toState
    }

    function notify(){
        this.emit('transitioned', {
            toState: e.toState
            ,fromState: e.fromState
            ,event: 'transitioned'
        })
    }

    var fns = [
        (priorCfg._onExit || noop)
        ,update
        ,(toCfg._onEnter || noop)
        ,notify
    ]

    fns.forEach(function(fn){
        fn.call(this)
    },this)
}
