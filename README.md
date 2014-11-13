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

```

### Asynchronous transitions and handlers

We needed asynchronous support for transitioning to states and for input handlers found on states.

Due to asynchronous `_onEnter` callback potential, a machina must
invoke `.start()` to be properly initialized.

This allows separation between construction and initialization.


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


##### Credits

[ascii generation](http://www.network-science.de/ascii/)
