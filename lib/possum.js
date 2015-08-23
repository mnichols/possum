'use strict';

import stampit from 'stampit'
import Promise from 'bluebird'
import {EventEmitter2 as EventEmitter} from 'eventemitter2'
import event from './event'
import EVENTS from './system-events'

export default function possum(cfg) {
    const ANY_TRANSITION = 'ANY'

    const EMITTER_OPTS = {
        wildcards: true
        ,delimiter: '.'
        ,newListener: true
        ,maxListeners: 10
    }

    const emittable =  stampit.convertConstructor(EventEmitter)

    let apiModel = stampit()
        .compose(emittable)
        .init(function(){
            let target = this

            let invocations = []

            let deferrals = new Map()

            const replay = (deferred, lastResult) =>  {
                if(!deferred.length) {
                    return lastResult
                }
                let next = deferred.shift()
                if(lastResult && lastResult.then) {
                    return lastResult
                        .then(this.handle.bind(this, next.inputType, next.args))
                        .then(function(res){
                            return replay(deferred, res)
                        })
                }
                return replay(deferred, this.handle(next.inputType,next.args))
            }

            const emitEvent = (e) => {
                this.emit(this.namespaced(e.topic), e)
                return this
            }

            function done(len, completed, result) {
                //remove the invocation
                if(invocations.length >= len) {
                    invocations.splice(len -1, 1)
                }
                emitEvent(completed)
                return result
            }
            this.currentState = this.initialState


            this.namespaced = (value) => {
                return `${this.namespace}${EMITTER_OPTS.delimiter}${value}`
            }

            this.handle = function(inputType, args) {
                let len = invocations.push({ inputType, args})
                let handler = this.handlers.get(this.currentState, inputType)
                let handling = event({
                    topic: EVENTS.HANDLING
                    , payload: {
                        args: args
                        , inputType: inputType
                    }
                    , state: this.currentState
                })
                let invoked = event({
                    topic: EVENTS.INVOKED
                    , payload: {
                        args: args
                        , inputType: inputType
                    }
                    , state: this.currentState
                })
                let handled = event({
                    topic: EVENTS.HANDLED
                    , payload: {
                        args: args
                        , inputType: inputType
                    }
                    , state: this.currentState
                })
                emitEvent(handling)
                let result = handler.call(this, args, target)
                emitEvent(invoked)
                if(result && result.then) {
                    return result
                        .bind(this)
                        .then(done.bind(this, len, handled))
                }
                return done(len, handled, result)
            }

            this.deferUntilTransition = (toState = ANY_TRANSITION) => {
                let coll = (deferrals.get(toState) || [])
                let invocation = invocations.pop()
                let deferred = event({
                    topic: 'deferred'
                    , state: this.currentState
                    , payload: invocation
                })
                coll.push(invocation)
                deferrals.set(toState, coll)

                emitEvent(deferred)
                return this
            }

            const doTransition = (toState, target) => {
                this.priorState = this.currentState
                this.currentState = toState
                let e = event({
                    topic: 'transitioned'
                    , payload: {
                        toState: this.currentState
                        , fromState: this.priorState
                    }
                    , state: this.currentState
                })
                this.emit(this.namespaced(e.topic),e)
                let deferred = (deferrals.get(toState) || [])
                    .concat(deferrals.get(ANY_TRANSITION) || [])
                deferrals.delete(toState)
                deferrals.delete(ANY_TRANSITION)
                return replay(deferred)
            }
            this.transition = function(toState) {
                // first exit current state
                let exit = this.handlers.getExit(this.currentState)
                let enter = this.handlers.getEntry(this.currentState)
                let result = exit.call(this, target )
                let doTransitionBound = doTransition.bind(this, toState, target )
                if(result && result.then) {
                    return result
                        .bind(this)
                        .then(enter)
                        .then(doTransitionBound)
                }
                result = enter.call(this, target )
                if( result && result.then ) {
                    return result.then(doTransitionBound)
                }
                return doTransitionBound()
            }

            this.target = (obj) => {
                if(obj) {
                    target = obj
                }
                return obj
            }
        })

    let stateModel = stampit()
        .refs({
            name: undefined
        })
        .init(function(){
            if(!this.name) {
                throw new Error('`name` is required')
            }
            let enter
            let exit
            let handlers = new Map()

            function noop(){}

            this.entry = () => {
                return (enter || noop)
            }
            this.exit = () => {
                return (exit || noop)
            }
            this.get = (inputType) => {
                return handlers.get(inputType)
            }
            this.set = (handlers = {}) => {
                for(let inputType in handlers) {
                    this.handler(inputType,handlers[inputType])
                }
            }
            this.handler = (inputType, fn) => {
                switch(inputType) {
                    case '_enter':
                        enter = fn
                        break;
                    case '_exit':
                        exit = fn
                        break;
                    default:
                        handlers.set(inputType,fn)
                }
                return this
            }
        })
    let handlersModel = stampit()
        .init(function(){
            let handlers = new Map()

            function noHandler(state, inputType) {
                console.error('no handler',state,inputType)
            }
            this.set = (states) => {
                for(let stateName in states) {
                    let state = stateModel({ name: stateName})
                    state.set(states[stateName])
                    handlers.set(stateName, state)
                }
                return this
            }
            this.get = ( stateName, inputType ) => {
                let cfg = handlers.get(stateName)
                if(!cfg) {
                    return noHandler(stateName, inputType)
                }
                let handler = cfg.get(inputType)
                if(!handler) {
                    return noHandler(stateName, inputType)
                }
                return handler
            }
            this.getEntry = ( stateName ) => {
                let cfg = handlers.get(stateName)
                return cfg.entry()
            }
            this.getExit = ( stateName ) => {
                let cfg = handlers.get(stateName)
                return cfg.exit()
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
                target = obj
                return this
            }
            this.build = (args) => {
                let result = apiModel.props({
                    handlers: handlers
                }).create({}, EMITTER_OPTS)
                result.target(target)
                return result
            }
        })
        .create()
}
