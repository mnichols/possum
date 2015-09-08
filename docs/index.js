'use strict';

Object.defineProperty(exports, '__esModule', {
    value: true
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _stampit = require('stampit');

var _stampit2 = _interopRequireDefault(_stampit);

var _bluebird = require('bluebird');

var _bluebird2 = _interopRequireDefault(_bluebird);

var _eventemitter2 = require('eventemitter2');

var _cuid = require('cuid');

var _cuid2 = _interopRequireDefault(_cuid);

//constants
var ANY_TRANSITION = 'ANY';

var EVENTS = {
    INVALID_TRANSITION: 'invalidTransition',
    NO_HANDLER: 'noHandler',
    HANDLING: 'handling',
    HANDLED: 'handled',
    INVOKED: 'invoked',
    DEFERRED: 'deferred',
    TRANSITIONED: 'transitioned'
};

/**
* possums are event emitters
*
* */
var emittable = (0, _stampit2['default'])().methods({
    emitEvent: function emitEvent(e) {
        this.emit(this.namespaced(e.topic), e);
        return this;
    },
    namespaced: function namespaced(value, namespace) {
        namespace = namespace || this.namespace;
        var pre = '';
        if (namespace) {
            pre = '' + namespace + this.emitterOpts.delimiter;
        }
        return '' + pre + value;
    }
}).init(function () {
    var _this = this;

    //expose emitter
    this.emitter = this.emitter || new _eventemitter2.EventEmitter2(this.emitterOpts);

    var eventModel = (0, _stampit2['default'])().refs({
        topic: undefined,
        payload: undefined,
        state: undefined,
        timestamp: undefined,
        id: undefined,
        namespace: undefined
    }).init(function () {
        this.timestamp = new Date().toUTCString();
        this.id = (0, _cuid2['default'])();
    });

    this.createEvent = eventModel;
    this.copyEvent = function (e, topic) {
        return _this.createEvent({
            topic: topic || e.topic,
            payload: e.payload,
            state: e.state,
            timestamp: new Date().toUTCString(),
            namespace: e.namespace,
            id: (0, _cuid2['default'])()
        });
    };

    var forwardFn = function forwardFn(fn) {
        _this[fn] = _this.emitter[fn].bind(_this.emitter);
    };

    var eventApi = ['addListener', 'on', 'onAny', 'offAny', 'once', 'many', 'removeListener', 'off', 'listeners', 'listenersAny', 'emit'];
    eventApi.forEach(forwardFn);
});

/**
 * represents a single state in config passed by `states`
 *
 * */
var stateModel = (0, _stampit2['default'])().refs({
    name: undefined
}).init(function () {
    var _this2 = this;

    if (!this.name) {
        throw new Error('`name` is required');
    }
    var enter = undefined;
    var exit = undefined;
    var handlers = new Map();

    function noop() {}

    this.entry = function () {
        return enter || noop;
    };
    this.exit = function () {
        return exit || noop;
    };
    this.get = function (inputType) {
        return handlers.get(inputType);
    };
    this.set = function () {
        var handlers = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

        for (var inputType in handlers) {
            _this2.handler(inputType, handlers[inputType]);
        }
    };
    this.handler = function (inputType, fn) {
        switch (inputType) {
            case '_enter':
                enter = fn;
                break;
            case '_exit':
                exit = fn;
                break;
            default:
                handlers.set(inputType, fn);
        }
        return _this2;
    };
});

/**
 * maps state names to their config and exposes
 * api for retrieving and setting them
 *
 * */
var statesCollection = (0, _stampit2['default'])().init(function () {
    var _this3 = this;

    var map = new Map();

    this.set = function (states) {
        for (var stateName in states) {
            var state = stateModel({ name: stateName });
            state.set(states[stateName]);
            map.set(stateName, state);
        }
        return _this3;
    };
    this.get = function (stateName, inputType) {
        var cfg = map.get(stateName);
        if (!cfg) {
            return undefined;
        }
        var handler = cfg.get(inputType);
        if (!handler) {
            return undefined;
        }
        return handler;
    };
    this.getEntry = function (stateName) {
        var cfg = map.get(stateName);
        return cfg.entry();
    };
    this.getExit = function (stateName) {
        var cfg = map.get(stateName);
        return cfg.exit();
    };
    this.has = function (stateName) {
        return map.has(stateName);
    };
});

/**
 * possum api
 *
 * */
var api = (0, _stampit2['default'])().refs({
    emitterOpts: {
        wildcards: true,
        delimiter: '.',
        newListener: true,
        maxListeners: 10
    }
})['static']({
    /**
     * Assign states config to instance
     *
     * @method states
     * @param {Object} cfg state : inputHandlers pairs
     * @example
     * p.states({
     *  'uninitialized': {
     *      'initialized': function(inputType, args) { ...}
     *      'another': function(inputType, args) { ...}
     *  }
     * })
     * @return {stamp}
     * */
    states: function states(cfg) {
        return this.props({
            states: cfg
        });
    },
    /**
     * Set the state target. Uses `this` if not provided.
     *
     * @method target
     * @param {Any} obj the object for state tracking
     * @return {stamp}
     */
    target: function target(obj) {
        return this.props({
            target: obj
        });
    },
    /**
     * Configure the instance
     *
     * @method config
     * @param {Object...} args any number of args to configure
     * @return {stamp}
     * */
    config: function config() {
        return this.props.apply(this, arguments);
    }
}).compose(emittable).init(function () {
    var _this4 = this;

    if (!this.initialState) {
        throw new Error('an `initialState` config is required');
    }

    var handlers = statesCollection();
    handlers.set(this.states);

    var target = this.target || this;

    var invocations = [];

    var deferrals = new Map();

    var replay = function replay(_x3, _x4) {
        var _again = true;

        _function: while (_again) {
            var deferred = _x3,
                lastResult = _x4;
            next = undefined;
            _again = false;

            if (!deferred.length) {
                return lastResult;
            }
            var next = deferred.shift();
            if (lastResult && lastResult.then) {
                return lastResult.then(_this4.handle.bind(_this4, next.inputType, next.args)).then(function (res) {
                    return replay(deferred, res);
                });
            }
            _x3 = deferred;
            _x4 = _this4.handle(next.inputType, next.args);
            _again = true;
            continue _function;
        }
    };

    var done = function done(len, completed, result) {
        //remove the invocation
        if (invocations.length >= len) {
            invocations.splice(len - 1, 1);
        }
        _this4.emitEvent(completed);
        return result;
    };

    /**
     * The current state
     *
     * @property {String} currentState the current state of the possum
     * */
    this.currentState = this.initialState;
    /**
     * The prior state
     *
     * @property {String} priorState the prior state of the possum
     * */
    this.priorState = undefined;

    /**
     * Handle an `inputType` with the configure states handlers
     *
     * @method handle - the primary interaction point for callers
     * @param {String} inputType
     * @param {Any} [args]
     * @example
     *
     * myPossum.handle('initialize',{ id: '123'})
     * @return {Any} the result of the handler configured by `states`
     * */
    this.handle = function (inputType, args) {
        var len = invocations.push({ inputType: inputType, args: args });
        var handler = handlers.get(this.currentState, inputType);
        if (!handler) {
            var noHandler = this.createEvent({
                topic: EVENTS.NO_HANDLER,
                payload: {
                    args: args,
                    inputType: inputType
                },
                namespace: this.namespace,
                state: this.currentState
            });
            this.emitEvent(noHandler);
            return this;
        }
        //create events
        var handling = this.createEvent({
            topic: EVENTS.HANDLING,
            payload: {
                args: args,
                inputType: inputType
            },
            namespace: this.namespace,
            state: this.currentState
        });
        var invoked = this.copyEvent(handling, EVENTS.INVOKED);
        var handled = this.copyEvent(handling, EVENTS.HANDLED);

        //do it
        this.emitEvent(handling);
        var result = handler.call(this, args, target);
        this.emitEvent(invoked);

        if (result && result.then) {
            return result.bind(this).then(done.bind(this, len, handled));
        }
        return done(len, handled, result);
    };

    /**
     * Defers the invocation for replay after transition
     *
     * @method deferUntilTransition
     * @param {String} [toState] optionally provide a transition
     * after which to replay this invocation.
     * @return {Possum} the possum instance
     * */
    this.deferUntilTransition = function () {
        var toState = arguments.length <= 0 || arguments[0] === undefined ? ANY_TRANSITION : arguments[0];

        var coll = deferrals.get(toState) || [];
        var invocation = invocations.pop();
        var deferred = _this4.createEvent({
            topic: 'deferred',
            state: _this4.currentState,
            payload: invocation,
            namespace: _this4.namespace
        });
        coll.push(invocation);
        deferrals.set(toState, coll);

        _this4.emitEvent(deferred);
        return _this4;
    };

    var doTransition = function doTransition(toState, target) {
        _this4.priorState = _this4.currentState;
        _this4.currentState = toState;
        var e = _this4.createEvent({
            topic: 'transitioned',
            payload: {
                toState: _this4.currentState,
                fromState: _this4.priorState
            },
            state: _this4.currentState,
            namespace: _this4.namespace
        });
        _this4.emit(_this4.namespaced(e.topic), e);
        var deferred = (deferrals.get(toState) || []).concat(deferrals.get(ANY_TRANSITION) || []);
        deferrals['delete'](toState);
        deferrals['delete'](ANY_TRANSITION);
        return replay(deferred);
    };
    /**
     * Transition to another state.
     * Prefer calling this internally; eg inside a handler.
     *
     * @method transition
     * @param {String} toState - the target transition
     * @return {Any} the result of any deferred handlers, if any
     * */
    this.transition = function (toState) {
        if (!handlers.has(toState)) {
            this.emitEvent(this.createEvent({
                topic: EVENTS.INVALID_TRANSITION,
                namespace: this.namespace,
                payload: { toState: toState, fromState: this.currentState },
                state: this.currentState
            }));
            return this;
        }
        // first exit current state
        var exit = handlers.getExit(this.currentState);
        var enter = handlers.getEntry(toState);
        var result = exit.call(this, target);
        var doTransitionBound = doTransition.bind(this, toState, target);
        if (result && result.then) {
            return result.bind(this).then(enter).then(doTransitionBound);
        }
        result = enter.call(this, target);
        if (result && result.then) {
            return result.then(doTransitionBound);
        }
        return doTransitionBound();
    };

    /**
     * Getter/setter for the state target to pass
     * into each handler
     *
     * @method target
     * @param {Any} [obj] if provided, SET the target
     * with `obj`; otherwise, GET the target
     * @return {Any} the target
     * */
    this.target = function (obj) {
        if (obj) {
            return target = obj;
        }
        return target;
    };
});

exports['default'] = api;
module.exports = exports['default'];