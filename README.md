```js
 _  _  _ _    _  
|_)(_)_)_)|_|||| 
| state machine
```

> I am able.

- _From potis (“able, capable”) + sum (“I am”)._

========
<a href="https://github.com/mnichols/possum"><img style="position: absolute; top: 0; right: 0; border: 0;z-index:1100" src="https://camo.githubusercontent.com/365986a132ccd6a44c23a9169022c0b5c890c387/68747470733a2f2f73332e616d617a6f6e6177732e636f6d2f6769746875622f726962626f6e732f666f726b6d655f72696768745f7265645f6161303030302e706e67" alt="Fork me on GitHub" data-canonical-src="https://s3.amazonaws.com/github/ribbons/forkme_right_red_aa0000.png"></a>

[![Build Status](https://travis-ci.org/mnichols/possum.svg?branch=master)](https://travis-ci.org/mnichols/possum)

## License
[MIT](https://raw.githubusercontent.com/mnichols/possum/master/LICENSE)


### Install

`npm install --save possum`

### Size

- **unminified** 3.05kb
- **minified** 1.68kb

### Building

`make build` => `./build/possum.js`

minified builds are broken atm

### Documentation

Found [here](https://mnichols.github.io/possum)

### Example

`make example`

### Module Support

Works in nodejs and the browser. 

### Getting Started

> This is in the `app.js` for the example.

```js

//listening to Kiss' Love Gun on my record player

//first, define our state machine spec

let gun = possum
    .config({
        namespace: 'kiss'
        , initialState: 'uninitialized'
    })
    .methods({
        enable: function(actions) {
            Object.keys(controls).forEach(function(key){
                controls[key].setAttribute('disabled','disabled')
            })
            if(!actions || !actions.length) {
                return
            }
            actions.forEach(function(action){
                controls[action].removeAttribute('disabled')
            })
        }
        ,loadWeapon: function(bullets){
            return this.bullets = bullets || [
                'I Stole Your Love'
                ,'Shock Me'
                ,'Love Gun'
            ]
        }
        ,fire: function(){
            //asynchronous, returns a Promise
            return this.recordPlayer.play(this.song)
        }
    })
    .states({
        'uninitialized': {
            _enter: function(){
                this.enable(['initialize'])
                return this.recordPlayer.turnOn()
            }
            ,'initialize': function(args) {
                return this.recordPlayer.spinRecord()
                    .then(this.transition.bind(this,'initialized'))
            }
        }
        ,'initialized': {
            _enter: function(){
                this.enable(['pullTrigger','load'])
            }
            ,'pullTrigger': function() {
                this.deferUntilTransition('aimed')
            }
            ,'load': function(args) {
                this.deferUntilTransition('loading')
                return this.transition('loading')
            }
        }
        ,'loading': {
            _enter: function(){
                this.enable(['load'])
            }
            ,'load': function(args) {
                this.loadWeapon(args && args.bullets)
                return this.transition('loaded')
            }
            ,'reload': function() {
                return this.handle('load')
            }
        }
        ,'loaded': {
            _enter: function(){
                document.querySelector('.remaining').innerHTML = ''
                this.enable(['aim'])
            }
            ,'aim': function(args) {
                this.song = (args && args.target) || this.bullets.shift()
                this.recordPlayer.hoverNeedleOver(this.song)
                return this.transition('aimed')
            }
        }
        ,'aimed':{
            _enter: function(){
                this.enable(['pullTrigger'])
            }
            ,'pullTrigger': function() {
                return this.fire()
                    .then(this.transition.bind(this,'smoking'))
            }
        }
        ,'smoking': {
            _enter: function(){
                console.log('light cigarette, sit back and relax')
                this.enable(['liftNeedle'])
            }
            ,'aim': function(args){
                this.deferUntilNextHandler()
                return this.handle('liftNeedle')
            }
            ,'liftNeedle': function(){
                if(this.bullets.length) {
                    return this.transition('loaded')
                }
                return this.transition('emptied')
            }
        }
        ,'emptied': {
            _enter: function(){
                this.enable(['reload'])
                return this.handle('aim')
            }
            ,'aim': function(args){
                return this.recordPlayer.returnArm()
            }
            ,'reload': function(){
                this.deferUntilTransition('loading')
                return this.transition('loading')
            }
        }

    })
    .create()

gun.currentState == 'uninitialized' // true

```

### What is a Possum?

A marsupial.

But for our purposes, `possum` uses [stampit](https://github.com/ericelliott/stampit) under-the-hood for
model prototyping.

This means that when you do this:

```js

var p = possum.states({ ... }).create()

```

A possum will compose any settings you put on the top level possum
call and then exposes this to the api (see below for more details):

```js
possum
.config( /* configure initialState, namespace, etc */) // alias to stampit `props`
.states( /* configure states */) 
.methods(/* special methods */) //stampit method
.init(function(){
    //initializing stuff
    var secretData = 'shhhh'
    this.prop == 'erty' // -> true
}) //stampit method
.compose(/* mixin other stamps into the machine */) //stampit method
.target(/* the state object to use (default is the machine itself) */)
.create() //this creates the possum instance; you may also just call it as a function

```

### Isolation and prototypes

Every call to the builder functions on `possum` return a new stamp. This is important
to know and also to take advantage of. Consider the following:

```js

let loggable = possum.compose(logger)
let eventable = possum.compose(eventSourcer)
let kitchen = loggable.compose(eventable)

let model = loggable.config({initialState: 'a'}).create() //has loggable, not eventable, behavior
let model2 = eventable.config({initialState:'a'}).create() //has eventable, not loggable, behavior
let everything = kitchen.config({initialState:'a' }).create() // has both 
```

See the tests [here](https://github.com/mnichols/possum/blob/master/test/composing-possum-test.js) for
seeing in action.

### Asynchronous and synchronous transitions and handlers

Oftentimes handlers end up being async, breaking all the callers. Initially
`possum` did Promises for all api calls.

As of `v0.1.0` possum supports both synchronous and Promised handlers.

It is worth noting that the events which are emitted are ordered differently
depending on the flow model you choose.


### Possum Builder API (extensions atop stampit)

##### `config` {Object} **required**

These attributes can (should) be set here:

###### `namespace` {String} [optional]

The namespace for this instance
```
var p = possum.config({
    namespace: 'secure'
})

```

###### `initialState` {String} **required**

The state to transition to initially

```
var p = possum.config({
    initialState: 'uninitialized'
})
```

NOTE: 

* the `_enter` callback will NOT get called immediately upon construction
if the state designated by  `initialState` has one. This is to avoid the 
need for asynchronous instantiation support. If really need an initialization routing
you can just use stampit's built in facility for this:

```js

var p = possum
.config({
    initialState: 'a'
})
.states({
    'a': {
        '_enter': function(){
            //wont get called on creation!
        }
    }
})
.init(function(){
    //do init stuff here
    //...you can even return a Promise and stampit will return the promise
    //for you to control it
})

```

##### `states` {Object} **required**
The states handlers configuration in the shape of:

```js
var states = {
    'myState': {
        _enter: function( target ){
            //optional
            //steps to perform right when entering a state
            //can return an Promise for async support
        }
        ,'doIt': function(args, target) {
            //optionally make changes to the state target
            //handle the command 'doIt'
            //receiving exactly ONE argument
            return this.doIt()
        }
        ... 
        ,_exit: function( target ) {
            //optional
            //steps to perform right before transitioning
            //out of this state
        }
    }
}

```

Note that each state's input handler, will receive _one_ `arguments` parameter. That means you must
invoke the handlers this way:

```js
model.handle('doIt','myArgument')
```

**Additional arguments will be ignored**.


### Possum Instance API

##### `currentState` {String} 

The current state of the possum instance. 
This is the same as `initialState` upon creation

##### `priorState` {String}

The priorState state of the possum instance, if any. 
This is `undefined` until a transition has occurred.

##### `namespaced([str,namespace])` {Function}

Receives an optional `str` argument to produce an namespaced string using underlying delimiter rules.

If `str` is not provided, the instance's `namespace` is returned (from the spec).

If the instance has an `undefined` namespace the input `namespace` argument is used; if that is undefined
the `str` is returned.

This utility is used for producing underlying events for subscription; eg : 

`possumInstance.on(possumInstance.namespaced('handled'),function(){...})`


##### `handle(inputType, args)` {Function} 

Queues the command _inputType_ and processes it with the singular _args_ payload.
Note that only **one** argument will be used. Other arguments will be ignored.

Returns the result of the handler (Promise or not)

##### `transition(toState)` {Function}

Convenience method that queues the transition commands `exit`, `_transition`, and `_onEnter` and processes them.
Returns a Promise if an `_enter` or `_exit` handler does so; otherwise, it returns
the possum instance.

##### `deferUntilTransition(toState)` {Function}

Queues the current message (input) to be replayed after the possum has transitioned
to `toState`. If `toState` is not provided, then it will replay after _any_
transition has occurred.

Returns `this` possum instance.

### Possum Events

##### `{namespace}.handling` 

Emitted _during_ an input handler.

Event properties:

* topic: 'handling'
* inputType: {String} the name of the handler you just called
* payload: {Any} The arguments passed into the `handle` call
* action: {String} the path of the handler you just called ; eg 'myState.myHandler'
* namespace: {String} the namespace of the possum

##### `{namespace}.invoked` 

Emitted _just after_ an input handler has been invoked but possibly before
the handler has completed (asynchronously).

Event properties:

* topic: 'invoked'
* inputType: {String} the name of the handler you just called
* payload: {Any} The arguments passed into the `handle` call
* action: {String} the path of the handler you just called ; eg 'myState.myHandler'
* namespace: {String} the namespace of the possum


##### `{namespace}.handled` 

Emitted _after_ an input handler Promise has resolved (if async).

Event properties:

* topic: 'handled'
* inputType: {String} the name of the handler you just called
* payload: {Any} The arguments passed into the `handle` call
* action: {String} the path of the handler you just called ; eg 'myState.myHandler'
* namespace: {String} the namespace of the possum

##### `{namespace}.transitioned` 

Emitted _after_ a possum has transitioned into a state, 
and _after_ its entry callback has been invoked (`_enter`).

Event properties:

* topic: 'transitioned'
* inputType: {String} the name of the handler you just called
* payload: {Object} having these properties
    - `toState` The state you just transitioned to
    - `fromState` The state you just transitioned from
* action: {String} the path of the handler you just called ; eg 'myState.myHandler'
* namespace: {String} the namespace of the possum

##### `{namespace}.noHandler`

Emitted when an input has been attempted on a state that does not declare it.

#### `{namespace}.invalidTransition`

Emitted when an transition is attempted to a state that does not exist.

### Tests

- `make test` will by default run tests on Node.
- `make browser` will run tape tests on any browser you visit at `http://localhost:2222`

### Roadmap

* Hierarchical State Machine support
* Behavior tree generation (ala [machine.js](https://github.com/maryrosecook/machinejs)).

#### Acknowledgements

API inspiration from [machina.js](https://github.com/ifandelse/machina.js).

### Credits

* [machina.js](https://github.com/ifandelse/machina.js)
* [ascii generation](http://www.network-science.de/ascii/)
