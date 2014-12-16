```js
 _  _  _ _    _  
|_)(_)_)_)|_|||| 
| state machine
```

> I am able.

- _From potis (“able, capable”) + sum (“I am”)._


#### Inspiration

API inspiration from [machina.js](https://github.com/ifandelse/machina.js).
Thanks to [Jim Cowart](http://freshbrewedcode.com/jimcowart/) and contributors
for formulating a powerful api.

### Install

`npm install --save possum`

### Building

`make build`

### Example

`make example`

### Roadmap

* Hierarchical State Machine support
* Behavior tree generation (ala [machine.js](https://github.com/maryrosecook/machinejs)).
* Separate config from actor 


### Module Support

Works in nodejs and the browser using CJS modules. 
For the browser maybe use [browserify](http://browserify.org/index.html).
AMD isn't going to be supported, sorry.

### Getting Started

> This is in the `app.js` for the example.

```js

//listening to Kiss' Love Gun on my record player

//first, define our state machine spec

var gun = {
    namespace: 'kiss'
    ,initialState: 'uninitialized'
    ,enable: function(actions) {
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
    ,states: {
        'uninitialized': {
            _onEnter: function(){
                this.enable(['initialize'])
                return this.recordPlayer.turnOn()
            }
            ,'initialize': function(args) {
                return this.recordPlayer.spinRecord()
                    .then(this.transition.bind(this,'initialized'))
            }
        }
        ,'initialized': {
            _onEnter: function(){
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
            _onEnter: function(){
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
            _onEnter: function(){
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
            _onEnter: function(){
                this.enable(['pullTrigger'])
            }
            ,'pullTrigger': function() {
                return this.fire()
                    .then(this.transition.bind(this,'smoking'))
            }
        }
        ,'smoking': {
            _onEnter: function(){
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
            _onEnter: function(){
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
}

//now pass the spec to possum to get a prototype
var model = possum(spec).create() // model.state === undefined

model.start().then(function(){
    console.log(model.state) // ->'uninitialized'
})

```

### What is a Possum?

A marsupial.

But for our purposes, `possum` uses [stampit](https://github.com/ericelliott/stampit) under-the-hood for
model prototyping.

This means that when you do this:

```js

var model = possum(spec)

```

what you get is a 'stamp' that allows to to:

```js

model
.state({ prop: 'erty'})
.methods({ meth: function isBad(){..}})
.enclose(function(){
    var secretData = 'shhhh'
    this.prop == 'erty' // -> true
})
.create() //this creates the possum instance; you may also just call it as a function

```

#### Extending a possum

Sometimes you may want to merge two `spec` objects into a single instance. 
Ideally, this is the burden of the calling code but `possum` exposes an `extend` function to assist with this form of composition.
Note that will _overwrite_ states of the same name with this procedure. If you want fancier mixing then prepare the input `spec` object
before passing it to `possum`.


```js

var spec = {
    initialState: 'foo'
    ,states: {
        'foo': {
            ...
        }
    }
}
var disposable = {
    states: {
        'disposed': {
            _onEnter: function(){
                this.disposed = true
            }
        }
    }
}
var model = possum(spec).extend(disposable).create()
model.transition('disposed') // model.disposed === true

```

### Asynchronous transitions and handlers

We needed asynchronous support for transitioning to states and for input handlers found on states.

Due to asynchronous `_onEnter` callback potential, a `possum` must
invoke `.start()` to be properly initialized.

This allows separation between construction and initialization.

### Possum Spec API

##### `namespace` {String} [optional]
The namespace for this instance

##### `initialState` {String} **required**
The state to transition to when `.start()` is called

##### `states` {Object} **required**
The states configuration in the shape of:

```js
var states = {
    'myState': {
        _onEnter: function(){
            //optional
            //steps to perform right when entering a state
            //can return an Promise for async support
        }
        ,'doIt': function(args) {
            //handle the command 'doIt'
            //receiving exactly ONE argument
            return this.doIt()
        }
        ... 
        ,_onExit: function() {
            //optional
            //steps to perform right before transitioning
            //out of this state
        }
    }
}

```

Note that each state's input handler, will receive _one_ argument. That means you must
invoke the handlers this way:

```js
model.handle('doIt','myArgument')
```

**Additional arguments will be ignored**.


##### `handlers` {Array} [optional]

Provide handler objects can be in the form of :

```js

var handler = {
    name: 'myHandler'
    ,fn: function(args) {
        // just like any other handler
    }
    ,match: function(spec) {
        //spec.inputType is the input type being invoked
        //spec.state is the current state of the possum instance
        return true/false
    }
}

```

Or, you may provide **wildcard handlers** in the form of : 

var handler = {
    '*': function(args) {
        //just like any other handler
    }
}


The order of execution for matching handlers is:

1. Wildcard handlers
2. Handlers configured through `handlers` collection that match (not through state config)
3. State input handler


### Possum Instance API

##### `state` {String} 

The current state of the possum instance. 
This is `undefined` until the instance has been `.start()`-ed.

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

Returns a Promise resolving the context.

##### `transition(toState)` {Function}

Convenience method that queues the transition commands `_onExit`, `_transition`, and `_onEnter` and processes them.

Returns a Promise resolving the context.

##### `start` {Function}

Causes a transition to the `initialState`.

Returns a Promise, resolving when transition has completed. 

##### `deferUntilTransition(toState)` {Function}

Queues the current message (input) to be replayed after the possum has transitioned
to `toState`. If `toState` is not provided, then it will replay after _any_
transition has occurred.

Returns `this` possum instance.

##### `deferUntilNextHandler` {Function}

Queues the current message (input) to be replayed after the possum has `handle`d another
input, regardless of whether a transition has occurred. **Note:** be careful that
you avoid infinite loops using this functionality.

Returns `this` possum instance.

##### `schedule` {Function}

If the possum instance is currently processing messages, this will cause `inputType` to be `handle`d immediately after the current processing messages have 
completed; otherwise, this will simply `handle` them immediately.

##### `currentProcessContext` {Function}

Returns an `processContext` which exposes:

* `currentMessage` {Function} The message currently being handled
* `completed` {Boolean} A flag indicating if the processing has completed

This is really for internal use, but you _may_ use this inside a handler to get access to the current message being invoked. 


### Possum Events

##### `{namespace}.handled` 

Emitted _just after_ an input handler has been invoked but probably before
the handler has completed (asynchronously).

Event properties:

* topic: '{namespace}.handled'
* inputType: {String} the name of the handler you just called
* payload: {Any} The arguments passed into the `handle` call
* action: {String} the path of the handler you just called ; eg 'myState.myHandler'


##### `{namespace}.completed` 

Emitted _after_ an input handler Promise has resolved.

Event properties:

* topic: '{namespace}.completed'
* inputType: {String} the name of the handler you just called
* payload: {Any} The arguments passed into the `handle` call
* action: {String} the path of the handler you just called ; eg 'myState.myHandler'

##### `{namespace}.transitioned` 

Emitted _after_ a possum has transitioned into a state, 
but _before_ its entry callback has been invoked (`_onEnter`).

Event properties:

* topic: '{namespace}.transitioned'
* inputType: {String} the name of the handler you just called
* payload: {Object} having these properties
    - `toState` The state you just transitioned to
    - `fromState` The state you just transitioned from
* action: {String} the path of the handler you just called ; eg 'myState.myHandler'

##### `{namespace}.noHandler`

Emitted when an input has been attempted on a state that does not declare it.

#### `{namespace}.invalidTransition`

Emitted when an transition is attempted to a state that does not exist.

### Diagnostics

`possum` likes to talk alot using the `debug` npm module. 
To enable logging, drop into your console and type `localStorage.debug = 'possum*'`.
To turn it back off, type `localStorage.debug = undefined`.
In node, you can  pass `DEBUG=possum*` as an environment variable.

### Tests

`make test` will by default run tests on Safari, Chrome, Firefox, and NodeJS.

You can also do `make node` to quickly run tests or `make silent node` to shut possum up during test runs.

### Credits

* [machina.js](https://github.com/ifandelse/machina.js)
* [ascii generation](http://www.network-science.de/ascii/)
