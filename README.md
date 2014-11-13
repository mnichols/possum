# Possum Evented State Machine

    I am able.
- _From potis (“able, capable”) + sum (“I am”)._

**...eventually**

### Inspiration

API inspiration from [machina.js](https://github.com/ifandelse/machina.js).

### Roadmap

* Hierarchical State Machine support
* Behavior tree generation (ala [machine.js](https://github.com/maryrosecook/machinejs)).
* Separate config from actor 

### Install

`npm install possum`

### Module Support

Works in nodejs and the browser using CJS modules. 
For the browser maybe use [browserify](http://browserify.org/index.html).
AMD isn't going to be supported, sorry.

### Getting Started

```js

//listening to Kiss' Love Gun on my record player

var gun = {
    namespace: 'kiss'
    ,initialState: 'uninitialized'
    ,states: {
        'uninitialized': {
            _onEnter: function(){
                return this.recordPlayer.turnOn()
            }
            ,'initialize': function(args) {
                return this.recordPlayer.spinRecord()
                    .then(this.transition.bind(this,'initialized'))
            }
        }
        ,'initialized': {
            'pullTrigger': function() {
                this.deferUntilTransition('aimed')
            }
            ,'load': function(args) {
                this.deferUntilTransition('loading')
                return this.transition('loading')
            }
        }
        ,'loading': {
            'load': function(args) {
                this.loadWeapon(args.bullets)
                return this.transition('loaded')
            }
        }
        ,'loaded': {
            'aim': function(args) {
                this.recordPlayer.dropNeedleAt(args.target)
                return this.transition('aimed')
            }
        }
        ,'aimed':{
            'pullTrigger': function() {
                return this.fire()
                    .then(this.transition.bind(this,'smoking'))
            }
        }
        ,'smoking': {
            _onEnter: function(){
                this.releaseTrigger()
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
            'aim': function(args){
                reutrn this.recordPlayer.returnArm()
                    .then(this.transition.bind(this,'initialized'))
            }
        }
    }
    ,loadWeapon: function(bullets){
        return this.bullets = bullets || [
            'I Stole Your Love'
            ,'Shock Me'
            ,'Christine Sixteen'
            ,'Tomorrow and Tonight'
            ,'Love Gun'
        ]
    }
    ,fire: function(){
        var song = this.bullets.shift()
        //asynchronous, returns a Promise
        return this.recordPlayer.play(song)
    }
}

var model = possum(spec) // model.state === undefined

model.start().then(function(){
    model.state === 'uninitialized'
})

```

### Asynchronous transitions and handlers

We needed asynchronous support for transitioning to states and for input handlers found on states.

Due to asynchronous `_onEnter` callback potential, a machina must
invoke `.start()` to be properly initialized.
This allows separation between construction and initialization.


When a caller calls:

    myMachine.transition('destinationState',arg1,arg2)
        .bind(myMachine)
        .then(function(){
            var done = this.state === 'destinationState'
            console.log(done) -> 'true'
        })

This will get converted to:

    myMachine.handle('transition',e)

This in turn create this event:

    var transitionEvent = {
        event: 'transitioned'
        ,args: args
        ,fromState: priorState
        ,toState: toState
    }


This event is placed on the queue:

    this.queue.enqueue(transitionEvent)

And then finally the queue is processed _asynchronously_:

    return this.queue.process()

### Model

Possum is composed of:

#### States

Compiles `.states` configuration to route inputs (eg events) to the appropriate
handler.

#### Queue

Processes queued commands, in serial, invoking _n_ handlers per command, collected
by the `states` router.

#### Deferrals

Exposes deferral api. A deferral is a specification which, when satisfied, requeues its
command to be replayed immediately after the current handler has completed.
Deferrals may be stored during an input handler.


