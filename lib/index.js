'use strict';

import stampit from 'stampit'
import Promise from 'bluebird'
import {EventEmitter2 as EventEmitter} from 'eventemitter2'
import cuid from 'cuid'

export default function possum(cfg = {}) {

    const ANY_TRANSITION = 'ANY'

    const EVENTS = {
        INVALID_TRANSITION: 'invalidTransition'
        ,NO_HANDLER: 'noHandler'
        ,HANDLING: 'handling'
        ,HANDLED: 'handled'
        ,INVOKED: 'invoked'
        ,DEFERRED: 'deferred'
        ,TRANSITIONED: 'transitioned'
    }

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
            ,namespaced: function(value, namespace) {
                namespace = (namespace || this.namespace)
                let pre = ''
                if(namespace) {
                    pre = `${namespace}${cfg.emitterOpts.delimiter}`
                }
                return `${pre}${value}`
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
            if(!this.initialState) {
                throw new Error('an `initialState` config is required')
            }
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
                if(!handler) {
                    let noHandler = this.createEvent({
                        topic: EVENTS.NO_HANDLER
                        , payload: {
                            args: args
                            , inputType: inputType
                        }
                        , namespace: this.namespace
                        , state: this.currentState
                    })
                    this.emitEvent(noHandler)
                    return this
                }
                //create events
                let handling = this.createEvent({
                    topic: EVENTS.HANDLING
                    , payload: {
                        args: args
                        , inputType: inputType
                    }
                    , namespace: this.namespace
                    , state: this.currentState
                })
                let invoked = this.copyEvent(handling, EVENTS.INVOKED)
                let handled = this.copyEvent(handling, EVENTS.HANDLED)

                //do it
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
                if(!this.states.has( toState )) {
                    this.emitEvent(this.createEvent({
                        topic: EVENTS.INVALID_TRANSITION
                        , namespace: this.namespace
                        , payload: { toState: toState, fromState: this.currentState}
                        , state: this.currentState
                    }))
                    return this
                }
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
                    return (target = obj)
                }
                return target
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
                    return undefined
                }
                let handler = cfg.get(inputType)
                if(!handler) {
                    return undefined
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
            this.has = ( stateName ) => {
                return map.has(stateName)
            }
        })



    /**
     * the possum builder api
     * */
    const builder = stampit()
        .init(function(){
            let states = statesCollection()
            let target

            /**
             * @param {Object} cfg
             *  @param {String} initialState the initial state of machine
             *  @param {String} [namespace] the namespace for the machine
             *  */
            this.config = (cfg = {}) => {
                apiModel = apiModel.props(cfg)
                return this
            }
            /**
             * configure state handlers
             * */
            this.states = (statesCfg = {}) => {
                states.set(statesCfg)
                return this
            }
            this.methods = (methods) => {
                apiModel  = apiModel.methods(methods)
                return this
            }
            /**
             * initialization functions for machine creation
             * */
            this.init = (...args) => {
                apiModel = apiModel.init(...args)
                return this
            }
            /**
             * the object for state tracking
             * */
            this.target = (obj) => {
                target = obj
                return this
            }
            this.compose = (...these) => {
                apiModel = apiModel.compose(...these)
                return this
            }
            /**
             * compile our config and create machine
             * @return {possum} instance
             * */
            this.build = (args) => {
                let result = apiModel
                    .props({
                        states: states
                    })
                    .create(args, cfg.emitterOpts)
                result.target(target)
                return result
            }
        })

    return builder.create()
}
