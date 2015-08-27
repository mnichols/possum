'use strict';

import stampit from 'stampit'
import Promise from 'bluebird'
import {EventEmitter2 as EventEmitter} from 'eventemitter2'
import cuid from 'cuid'

//constants
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

/**
* possums are event emitters
* */
const emittable =  stampit()
.methods({
    emitEvent: function(e) {
        this.emit(this.namespaced(e.topic), e)
        return this
    }
    ,namespaced: function(value, namespace) {
        namespace = (namespace || this.namespace)
        let pre = ''
        if(namespace) {
            pre = `${namespace}${this.emitterOpts.delimiter}`
        }
        return `${pre}${value}`
    }
})
.init(function(){
    //expose emitter
    this.emitter = (this.emitter || new EventEmitter(this.emitterOpts))

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

    const forwardFn = (fn) => {
        this[fn] = this.emitter[fn].bind(this.emitter)
    }

    let eventApi = [
        'addListener'
        ,'on'
        , 'onAny'
        , 'offAny'
        , 'once'
        , 'many'
        , 'removeListener'
        , 'off'
        , 'listeners'
        , 'listenersAny'
        , 'emit'
    ]
    eventApi.forEach(forwardFn)
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





let api = stampit()
    .refs({
        emitterOpts: {
            wildcards: true
            ,delimiter: '.'
            ,newListener: true
            ,maxListeners: 10
        }
    })
    .static({
        /**
         * @method states
         * @param {Object} cfg - state : inputHandlers pairs
         * @example
         * p.states({
         *  'uninitialized': {
         *      'initialized': function(inputType, args) { ...}
         *      'another': function(inputType, args) { ...}
         *  }
         * })
         * @return {stamp}
         * */
        states (cfg) {
            return this.props({
                states: cfg
            })
        }
        /**
         * @method target
         * @param {Any} obj  - the object for state tracking
         * @return {stamp}
         */
        , target (obj) {
            return this.props({
                target: obj
            })
        }
        /**
         * @method config
         * @param {Object...} args any number of args to configure
         * @return {stamp}
         * */
        , config (...args) {
            return this.props(...args)
        }
    })
    .compose(emittable)
    .init(function(){
        if(!this.initialState) {
            throw new Error('an `initialState` config is required')
        }

        let handlers = statesCollection()
        handlers.set(this.states)

        let target = (this.target || this)

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

        /**
         * @property {String} currentState the current state of the possum
         * */
        this.currentState = this.initialState
        /**
         * @property {String} priorState the prior state of the possum
         * */
        this.priorState = undefined

        /**
         * @method handle - the primary interaction point for callers
         * @param {String} inputType
         * @param {Any} [args]
         * @example
         *
         * myPossum.handle('initialize',{ id: '123'})
         * @return {Any} the result of the handler configured by `states`
         * */
        this.handle = function(inputType, args) {
            let len = invocations.push({ inputType, args})
            let handler = handlers.get(this.currentState, inputType)
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

        /**
         * Defers the invocation for replay after transition
         * @method deferUntilTransition
         * @param {String} [toState] optionally provide a transition
         * after which to replay this invocation.
         * @return {Possum} the possum instance
         * */
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
        /**
         * Prefer calling this internally; eg inside a handler.
         * @method transition
         * @param {String} toState - the target transition
         * @return {Any} the result of any deferred handlers, if any
         * */
        this.transition = function(toState) {
            if(!handlers.has( toState )) {
                this.emitEvent(this.createEvent({
                    topic: EVENTS.INVALID_TRANSITION
                    , namespace: this.namespace
                    , payload: { toState: toState, fromState: this.currentState}
                    , state: this.currentState
                }))
                return this
            }
            // first exit current state
            let exit = handlers.getExit(this.currentState)
            let enter = handlers.getEntry(toState)
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

        /**
         *
         * Getter/setter for the state target to pass
         * into each handler
         * @method target
         * @param {Any} [obj] if provided, SET the target
         * with `obj`; otherwise, GET the target
         * @return {Any} the target
         * */
        this.target = (obj) => {
            if(obj) {
                return (target = obj)
            }
            return target
        }
    })

export default api
