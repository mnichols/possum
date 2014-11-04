'use strict';

var stampit = require('stampit')
    ,push = Array.prototype.push

module.exports = function states(cfg) {
    var cfg = (cfg || {})
    var model = stampit()
        .state({
            states: (cfg.states || {})
            ,handlers: []
        })
        .enclose(function(){
            function noop(result) {
                return result
            }
            for(var k in this.states) {
                this.states[k] = stampit()
                    .state({
                        _onEnter: noop
                        ,_onExit: noop
                    })
                    .state(this.states[k])
                    .create()
            }
            function toHandler(state, inputType, fn) {
                return {
                    action: [state,inputType].join('.')
                    ,fn: fn
                }
            }
            stampit.mixIn(this,{
                collect: function(spec) {
                    var handlers = []
                        ,inputType = spec.inputType
                        ,state = spec.state

                    //first handle catchall handlers
                    push.apply(handlers,this.handlers.filter(function(h){
                        return !!h['*']
                    }).map(function(its){
                        return toHandler(
                            spec.state
                            , spec.inputType
                            , its['*']
                        )
                    }))

                    //now add handlers with matchers
                    push.apply(handlers,this.handlers.filter(function(h){
                        return !!(h.match && h.match(spec))
                    }).map(function(its){
                        return toHandler(
                            spec.state
                            , spec.inputType
                            , its.fn
                        )
                    }))

                    //finally try add state specific handler
                    var current = this.states[state]
                    if(current && current[inputType]){
                        push.call(handlers, toHandler(
                            spec.state
                            ,spec.inputType
                            ,current[inputType]
                        ))
                    }
                    return handlers
                }
            })

        })

    return model
}
