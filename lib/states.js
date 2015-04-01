'use strict';

var stampit = require('stampit')
    ,debug = require('debug')('possum:debug:states')
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
            //ensure each state has entry and exit handlers (noop)
            for(var k in this.states) {
                this.states[k] = stampit()
                    .state({
                        _onEnter: noop
                        ,_onExit: noop
                    })
                    .state(this.states[k])
                    .create()
            }
            var cache = {}
            function toHandler(state, inputType, fn) {
                var parts = [inputType]
                if(state) {
                    parts.unshift(state)
                }
                return {
                    name: parts.join('.')
                    ,fn: fn
                }
            }
            stampit.mixIn(this,{
                addHandlers: function(handlerOrHandlers) {
                    handlerOrHandlers = [].concat(handlerOrHandlers)
                    this.handlers = this.handlers.concat(handlerOrHandlers)
                    return this
                }
                ,extendStates: function(states) {
                    cache = {}
                    stampit.mixIn(this.states, states || {})
                    return this
                }
                ,hasState: function(state) {
                    return !!this.states[state]
                }
                /**
                 * collect handlers which could be consumed
                 * If a 'context' is provided, that will be used
                 * to match handlers as `this`
                 * @param {PossumInstance} [context] The possum instance to provide as context
                 * @param {Object} spec The input spec with `inputType` and `state`
                 * */
                ,collect: function(context, spec) {
                    if(!spec) {
                        spec = context
                        context = this
                    } else  {
                        context = context || this
                    }
                    var handlers = []
                        ,inputType = spec.inputType
                        ,state = spec.state
                        ,key = JSON.stringify(spec)
                        ;

                    if(cache[key]) {
                        return cache[key]
                    }

                    //first handle catchall handlers
                    push.apply(handlers,this.handlers.filter(function(h){
                        return !!h['*']
                    }).map(function(its){
                        return toHandler(
                            undefined
                            , '*'
                            , its['*']
                        )
                    }))


                    //now add handlers with matchers
                    //calling `match` with the `context` (possum instance)
                    push.apply(handlers,this.handlers.filter(function(h){
                        return !!(h.match && h.match.call(context, spec))
                    }, this).map(function(its){
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
                    cache[key] = handlers

                    return handlers
                }
            })

        })

    return model
}
