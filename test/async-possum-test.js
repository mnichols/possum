'use strict';

import test from 'blue-tape'
import possum from '../lib/possum'
import stampit from 'stampit'
import Promise from 'bluebird'

const buildMachine = (cfg) => {
    cfg  = (cfg || {
        initialState: 'unlocked'
        ,namespace: 'door'
    })
    return possum()
        .config(cfg)
        .states({
            'locked': {
                'enterCode': function( args, target ) {
                    let p = Promise.resolve()
                    if(args.code === target.code) {
                        return p
                            .then(this.transition.bind(this, 'unlocked'))
                    }
                    return p
                        .then(this.handle.bind(this,'deny' ))
                }
                , 'deny': function( args, target ) {
                    this.deferUntilTransition()
                    return Promise.resolve()
                        .then(this.transition.bind(this,'denied'))
                }
            }
            , 'unlocked': {
                'lock': function( args, target ) {
                    return Promise.resolve()
                        .then(this.transition.bind(this,'locked'))
                }
            }
            , 'denied': {
                '_enter': function( target ) {
                    target.denials++
                }
                , 'deny': function( args, target ) {
                    return Promise.delay(90)
                        .then(this.transition.bind(this,'locked'))
                }
                , '_exit': function( target ) {
                    target.restarts++
                }
            }
        })
        //.target(model)
        .build()

}

test('[async] state lifecycle', (assert) => {
    let model = stampit()
        .refs({
            name: 'deadbolt'
            , code: '123'
            , denials: 0
            , restarts: 0
        })
        .create()


    let machine = buildMachine({ initialState: 'locked' })
    machine.target(model)

    return machine.handle('enterCode', { code: '456' })
    .then(function(){
        assert.equal(machine.currentState, 'locked')
        assert.equal(model.denials,1)
        assert.equal(model.restarts,1)
    })

})
test('[async] handler transitions',(assert) => {
    assert.plan(1)
    let model = stampit()
        .refs({ name: 'deadbolt', code: '123'})
        .create()

    let machine = buildMachine()
    machine.target(model)

    return machine.handle('lock').then(function(){
        assert.equal(machine.currentState, 'locked')
    })
})
test('[async] events are emitted', (assert) => {
    let model = stampit()
        .refs({ name: 'deadbolt', code: '123'})
        .create()

    let machine = buildMachine()
    machine.target(model)
    let events = {}
    machine.on('door.handled',function(e) { events[this.event] = e })
    machine.on('door.transitioned',function(e) { events[this.event] = e })
    return machine.handle('lock')
        .tap(function(){
            let e = events['door.handled']
            assert.ok(e, 'event not raised')
            assert.equal(e.topic,'handled')
            assert.equal(e.state,'unlocked')
            assert.equal(e.payload.inputType, 'lock')
            assert.ok(e.id)
            assert.ok(e.timestamp)
        })
        .tap(function(){
            let e = events['door.transitioned']
            assert.ok(e, 'event not raised')
            assert.equal(e.topic,'transitioned')
            assert.equal(e.payload.fromState,'unlocked')
            assert.equal(e.payload.toState,'locked')
            assert.ok(e.id)
            assert.ok(e.timestamp)

        })


})

test('[async] transition deferral', ( assert ) => {
    let model = stampit()
        .refs({ name: 'deadbolt', code: '123'})

    let machine = buildMachine({initialState: 'locked'})
    let events = []
    machine.onAny(function(e) {
        if(e) {
            events.push(e)
        }
    })
    //use bad code
    return machine.handle('enterCode', { code: '456'})
    .then(function() {
        assert.equal(events.length, 12)
        assert.equal(machine.currentState, 'locked')

        assert.equal(events[0].topic, 'handling')
        assert.equal(events[0].payload.inputType, 'enterCode')

        assert.equal(events[1].topic, 'invoked')
        assert.equal(events[1].payload.inputType, 'enterCode')

        assert.equal(events[2].topic, 'handling')
        assert.equal(events[2].payload.inputType, 'deny')

        assert.equal(events[3].topic, 'deferred')
        assert.equal(events[3].payload.inputType, 'deny')

        assert.equal(events[4].topic, 'invoked')
        assert.equal(events[4].payload.inputType, 'deny')

        assert.equal(events[5].topic, 'transitioned')
        assert.equal(events[5].payload.toState, 'denied')

        assert.equal(events[6].topic, 'handling')
        assert.equal(events[6].payload.inputType, 'deny')
        assert.equal(events[6].state, 'denied')

        assert.equal(events[7].topic, 'invoked')
        assert.equal(events[7].payload.inputType, 'deny')
        assert.equal(events[7].state, 'denied')

        assert.equal(events[8].topic, 'transitioned')
        assert.equal(events[8].payload.toState, 'locked')

        //now we rewind from all the promises
        assert.equal(events[9].topic, 'handled')
        assert.equal(events[9].payload.inputType, 'deny')

        assert.equal(events[10].topic, 'handled')
        assert.equal(events[10].payload.inputType, 'deny')

        assert.equal(events[11].topic, 'handled')
        assert.equal(events[11].payload.inputType, 'enterCode')

    })

})

test('[async] multiple deferrals', (assert) => {
    let machine = possum()
        .config({
            initialState: 'a'
            , namespace: 'foo'
        })
        .target({ hits: []})
        .states({
            'a': {
                'b': function(args, target) {
                    this.deferUntilTransition()
                    target.hits.push({
                        state: this.currentState
                        , args: args
                        , inputType: 'b'
                    })
                    return Promise.resolve()
                        .then(this.transition.bind(this,'b'))
                }
            }
            , 'b': {
                'b': function(args, target ) {
                    this.deferUntilTransition()
                    target.hits.push({
                        state: this.currentState
                        , args: args
                        , inputType: 'b'
                    })
                    return Promise.resolve()
                        .then(this.transition.bind(this,'dob'))
                }
            }
            , 'dob': {
                'b': function(args, target) {
                    target.hits.push({
                        state: this.currentState
                        , args: args
                        , inputType: 'b'
                    })
                }
            }

        })
        .build()

    return machine.handle('b', { foo: 'bar'})
        .then(function(it){
            let hits = machine.target().hits
            assert.equal(machine.currentState,'dob')
            assert.equal(hits.length, 3)
            assert.deepEqual(hits[0], {
                state: 'a'
                , inputType: 'b'
                , args: { foo: 'bar'}
            })
            assert.deepEqual(hits[1], {
                state: 'b'
                , inputType: 'b'
                , args: { foo: 'bar'}
            })
            assert.deepEqual(hits[2], {
                state: 'dob'
                , inputType: 'b'
                , args: { foo: 'bar'}
            })
        })


})
