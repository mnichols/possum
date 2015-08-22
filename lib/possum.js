'use strict';

import stampit from 'stampit'
import Promise from 'bluebird'

export default function possum(cfg) {
    let apiModel = stampit()
        .init(function(){
            let target = this

            this.currentState = this.initialState

            this.handle = function(input, args) {
                let handler = this.handlers.get(this.currentState, input)
                let result = handler.call(this, args, target)
                return result
            }

            this.transition = function(toState, target ) {
                this.currentState = toState
                return this
            }

            this.target = (obj) => {
                if(obj) {
                    target = obj
                }
                return obj
            }
        })

    let handlersModel = stampit()
        .init(function(){
            let handlers = new Map()

            function noHandler(state, input) {
                console.error('no handler',state,input)
            }
            this.set = (states) => {
                for(let k in states) {
                    let funcs = states[k]
                    let funcMap = new Map()
                    for(let h in funcs) {
                        funcMap.set(h,funcs[h])
                    }
                    handlers.set(k, funcMap)
                }
                return this
            }
            this.get = ( state, input ) => {
                let cfg = handlers.get(state)
                if(!cfg) {
                    return noHandler(state, input)
                }
                let handler = cfg.get(input)
                if(!handler) {
                    return noHandler(state, input)
                }
                return handler
            }
        })



    return stampit()
        .init(function(){
            let handlers = handlersModel()
            let state = stampit()
            let target

            this.config = (cfg) => {
                apiModel = apiModel.props(cfg)
                return this
            }
            this.states = (states = {}) => {
                handlers.set(states)
                return this
            }
            this.methods = (methods) => {
                apiModel  = apiModel.methods(methods)
                return this
            }
            this.init = (...args) => {
                state = state.init(...args)
                return this
            }
            this.target = (obj) => {
                state = state.compose(obj)
                return this
            }
            this.build = (args) => {
                let result = apiModel.props({
                    handlers: handlers
                }).create()
                result.target(state(args))
                return result
            }
        })
        .create()
}
