'use strict';

import test from 'blue-tape'
import possum from '../src/possum'
import stampit from 'stampit'
import Promise from 'bluebird'
import {EventEmitter2 as EventEmitter} from 'eventemitter2'

const buildMachineProto = (cfg) => {
    cfg = (cfg || {
        initialState: 'unlocked'
        , namespace: 'door'
    })
    return possum
        .compose(stampit.convertConstructor(EventEmitter))
        .config(cfg)
        .states({
            'locked': {
                'enterCode': function( args, target ) {
                    if(args.code === target.code) {
                        return this.transition('unlocked')
                    }
                    return this.handle('deny' )
                }
                , 'deny': function( args, target ) {
                    this.deferUntilTransition()
                    return this.transition('denied')
                }
            }
            , 'unlocked': {
                'lock': function( args, target ) {
                    console.log('calling lock',args);
                    return this.transition('locked')
                }
            }
            , 'denied': {
                '_enter': function( target ) {
                    target.denials++
                }
                ,'deny': function( args, target ) {
                    setTimeout(function(){
                        return this.transition('locked')
                    }.bind(this), 90) //prevent retries for delay
                }
                , '_exit': function( target ) {
                    target.restarts++
                }
            }
        })

}
const buildMachine = (cfg) => {
    return buildMachineProto(cfg)
        //.target(model)
        .create()

}
test('[sync] state lifecycle', (assert) => {
    assert.plan(3)
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

    machine.handle('enterCode', { code: '456' })
    setTimeout(function(){
        assert.equal(machine.currentState, 'locked')
        assert.equal(model.denials,1)
        assert.equal(model.restarts,1)
    }, 100)
})
test('[sync] handler transitions [buildMachine]',(assert) => {
    assert.plan(1)
    let model = stampit()
        .refs({ name: 'deadbolt', code: '123'})
        .create()

    let machine = buildMachine()
    machine.target(model)

    machine.handle('lock')
    assert.equal(machine.currentState, 'locked')
})

test('[sync] deferred transitions', ( assert ) => {
    assert.plan(32)
    let model = stampit()
        .refs({ name: 'deadbolt', code: '123'})
        .create()

    let machine = buildMachineProto({ initialState: 'locked' })
    .create()

    let events = []
    machine.onAny(function(e,data) {
        if(e) {
            events.push(data)
        }
    })
    //use bad code
    machine.handle('enterCode', { code: '456'})
    setTimeout(function() {
        assert.equal(events.length, 12)
        assert.equal(machine.currentState, 'locked')

        assert.equal(events[0].topic, 'handling')
        assert.equal(events[0].payload.inputType, 'enterCode')

        assert.equal(events[1].topic, 'handling')
        assert.equal(events[1].payload.inputType, 'deny')

        assert.equal(events[2].topic, 'deferred')
        assert.equal(events[2].payload.inputType, 'deny')

        assert.equal(events[3].topic, 'transitioned')
        assert.equal(events[3].payload.toState, 'denied')

        assert.equal(events[4].topic, 'handling')
        assert.equal(events[4].payload.inputType, 'deny')

        assert.equal(events[5].topic, 'invoked')
        assert.equal(events[5].payload.inputType, 'deny')

        assert.equal(events[6].topic, 'handled')
        assert.equal(events[6].payload.inputType, 'deny')
        assert.equal(events[6].state, 'denied')

        assert.equal(events[7].topic, 'invoked')
        assert.equal(events[7].payload.inputType, 'deny')
        assert.equal(events[7].state, 'locked')

        assert.equal(events[8].topic, 'handled')
        assert.equal(events[8].payload.inputType, 'deny')
        assert.equal(events[8].state, 'locked')

        assert.equal(events[9].topic, 'invoked')
        assert.equal(events[9].payload.inputType, 'enterCode')
        assert.equal(events[9].state, 'locked')

        assert.equal(events[10].topic, 'handled')
        assert.equal(events[10].payload.inputType, 'enterCode')
        assert.equal(events[10].state, 'locked')

        assert.equal(events[11].topic, 'transitioned')
        assert.equal(events[11].payload.toState, 'locked')
        assert.equal(events[11].payload.fromState, 'denied')

    }, 100)
})

test('[sync] no handler emits', (assert) => {
    assert.plan(4)
    let machine = buildMachineProto({ initialState: 'locked' , namespace: 'door'})
    .create()

    let noHandler
    machine.on('door.noHandler',function(e) {
        noHandler = e
    })
    machine.handle('bad', 'boop')
    assert.equal(noHandler.state,machine.currentState)
    assert.equal(noHandler.topic,'noHandler')
    assert.equal(noHandler.payload.inputType, 'bad')
    assert.equal(noHandler.payload.args, 'boop')

})
test('[sync] invalid transition', (assert) => {
    assert.plan(5)
    let machine = buildMachineProto({ initialState: 'locked', namespace: 'door'})
    .create()
    let events = []
    machine.on('door.invalidTransition', events.push.bind(events))
    machine.transition('bad')
    assert.equal(machine.currentState,'locked')
    assert.equal(events.length,1)
    assert.equal(events[0].topic, 'invalidTransition')
    assert.equal(events[0].payload.toState, 'bad')
    assert.equal(events[0].payload.fromState, 'locked')


})
test('[sync] multiple deferrals', (assert) => {
    assert.plan(5)
    let machine = possum
        .compose(stampit.convertConstructor(EventEmitter))
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
                    return this.transition('b')
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
                    return this.transition('dob')
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
        .create()

    machine.handle('b', { foo: 'bar'})
    let hits = machine.target().hits
    assert.equal(machine.currentState,'dob')
    assert.equal(machine.target().hits.length, 3)
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
