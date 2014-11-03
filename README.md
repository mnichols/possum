# Possum

I am able.
From potis (“able, capable”) + sum (“I am”).

## Hierarchical State Machine

### Goals

* Asynchronous transition/API support
* Hierarchical State Machine support
* Evented input handlers
* Extend existing prototype
* Event emitter

### Roadmap


* Behavior tree generation (ala [machine.js](https://github.com/maryrosecook/machinejs)).
* Separate config from actor 


### Asynchrony

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

#### Queue

Processes queued commands, in serial, invoking _n_ handlers per command.
If the current command is deferred, it will be replayed when the 
condition of the deferral has been met.
