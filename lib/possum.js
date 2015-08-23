'use strict';

import stampit from 'stampit'
import Promise from 'bluebird'
import {EventEmitter2 as EventEmitter} from 'eventemitter2'
import EVENTS from './system-events'
import cuid from 'cuid'

export default function possum(cfg = {}) {

    const ANY_TRANSITION = 'ANY'

    cfg.emitterOpts = (cfg.emitterOpts || {
        wildcards: true
        ,delimiter: '.'
        ,newListener: true
        ,maxListeners: 10
    })

    /**
     * possums are event emitters
     * */
    const emittable =  stampit.convertConstructor(EventEmitter)
        .methods({
            emitEvent: function(e) {
                this.emit(this.namespaced(e.topic), e)
                return this
            }
            ,namespaced: function(value) {
                return `${this.namespace}${cfg.emitterOpts.delimiter}${value}`
            }
        })
        .init(function(){
            const eventModel = stampit()
                .refs({
                    topic: undefined
                     , payload: undefined
                     , state: undefined
                     , timestamp: undefined
                     , id: undefined
                     , namespace: undefined
                })
                .init(function() {
                    this.timestamp = new Date().toUTCString()
                    this.id = cuid()
                })

            this.createEvent = eventModel
            this.copyEvent = (e, topic) => {
                return this.createEvent({
                    topic: (topic || e.topic)
                    , payload: e.payload
                    , state: e.state
                    , timestamp: new Date().toUTCString()
                    , namespace: e.namespace
                    , id: cuid()
                })
            }
        })

    /**
     * the possum machine api
     * */
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

            const done = (len, completed, result) => {
                //remove the invocation
                if(invocations.length >= len) {
                    invocations.splice(len -1, 1)
                }
                this.emitEvent(completed)
                return result
            }

            this.currentState = this.initialState
            this.priorState = undefined

            this.handle = function(inputType, args) {
                let len = invocations.push({ inputType, args})
                let handler = this.states.get(this.currentState, inputType)
                let handling
                try {
                    handling = this.createEvent({
                        topic: EVENTS.HANDLING
                        , payload: {
                            args: args
                            , inputType: inputType
                        }
                        , namespace: this.namespace
                        , state: this.currentState
                    })
                } catch (err) {
                    console.log('ERR',err.stack)
                    throw err
                }
                let invoked = this.copyEvent(handling, EVENTS.INVOKED)
                let handled = this.copyEvent(handling, EVENTS.HANDLED)
                if(!handler) {
                    let noHandler = this.copyEvent(handling, EVENTS.NO_HANDLER)
                    this.emitEvent(noHandler)
                    return this
                }
                this.emitEvent(handling)
                let result = handler.call(this, args, target)
                this.emitEvent(invoked)
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
                let deferred = this.createEvent({
                    topic: 'deferred'
                    , state: this.currentState
                    , payload: invocation
                    , namespace: this.namespace
                })
                coll.push(invocation)
                deferrals.set(toState, coll)

                this.emitEvent(deferred)
                return this
            }

            const doTransition = (toState, target) => {
                this.priorState = this.currentState
                this.currentState = toState
                let e = this.createEvent({
                    topic: 'transitioned'
                    , payload: {
                        toState: this.currentState
                        , fromState: this.priorState
                    }
                    , state: this.currentState
                    , namespace: this.namespace
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
                let exit = this.states.getExit(this.currentState)
                let enter = this.states.getEntry(toState)
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

    /**
     * represents a single state in config passed by `states`
     * */
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

    /**
     * maps state names to their config and exposes
     * api for retrieving and setting them
     * */
    let statesCollection = stampit()
        .init(function(){
            let map = new Map()

            function noHandler(state, inputType) {
                console.error('no handler',state,inputType)
            }
            this.set = (states) => {
                for(let stateName in states) {
                    let state = stateModel({ name: stateName})
                    state.set(states[stateName])
                    map.set(stateName, state)
                }
                return this
            }
            this.get = ( stateName, inputType ) => {
                let cfg = map.get(stateName)
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
                let cfg = map.get(stateName)
                return cfg.entry()
            }
            this.getExit = ( stateName ) => {
                let cfg = map.get(stateName)
                return cfg.exit()
            }
        })



    /**
     * the possum builder api
     * */
    const builder = stampit()
        .init(function(){
            let states = statesCollection()
            let state = stampit()
            let target

            this.config = (cfg) => {
                apiModel = apiModel.props(cfg)
                return this
            }
            this.states = (statesCfg = {}) => {
                states.set(statesCfg)
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
                    states: states
                }).create({}, cfg.emitterOpts)
                result.target(target)
                return result
            }
        })

    return builder.create()
}
