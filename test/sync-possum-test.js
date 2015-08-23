'use strict';

import test from 'blue-tape'
import possum from '../lib/possum'
import stampit from 'stampit'
import Promise from 'bluebird'

const synchronous = (cfg) => {
    cfg = (cfg || {
        initialState: 'unlocked'
        , namespace: 'door'
    })
    return possum()
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
                'deny': function( args, target ) {
                    setTimeout(function(){
                        return this.transition('locked')
                    }.bind(this), 1000) //prevent retries for 3 seconds
                }
            }
        })
        //.target(model)
        .build()

}
test('handler transitions [synchronous]',(assert) => {
    assert.plan(1)
    let model = stampit()
        .refs({ name: 'deadbolt', code: '123'})
        .create()

    let machine = synchronous()
    machine.target(model)

    machine.handle('lock')
    assert.equal(machine.currentState, 'locked')
})

test('deferred transitions [synchronous]', ( assert ) => {
    assert.plan(32)
    let model = stampit()
        .refs({ name: 'deadbolt', code: '123'})
        .create()

    let machine = synchronous({initialState: 'locked'})
    let events = []
    machine.onAny(function(e) {
        if(e) {
            events.push(e)
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

    }, 1100)
})
