'use strict';

import test from 'blue-tape'
import possum from '../lib/possum'
import stampit from 'stampit'
import Promise from 'bluebird'

const promiseBased = () => {
    let machine = possum()
        .config({
            initialState: 'unlocked'
            , namespace: 'door'
        })
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
                    return Promise.resolve()
                        .then(this.transition.bind(this,'locked'))
                }
            }
            , 'denied': {
                'deny': function( args, target ) {
                    setTimeout(function(){
                        return this.transition('locked')
                    }.bind(this), 3000) //prevent retries for 3 seconds
                }
            }
        })
        //.target(model)
        .build()

}

const synchronous = () => {
    let machine = possum()
        .config({
            initialState: 'unlocked'
            , namespace: 'door'
        })
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
                    }.bind(this), 3000) //prevent retries for 3 seconds
                }
            }
        })
        //.target(model)
        .build()

}
test('handler transitions [promise based]',(assert) => {
    assert.plan(1)
    let model = stampit()
        .refs({ name: 'deadbolt', code: '123'})

    let machine = promiseBased()
    machine.target(model)

    return machine.handle('lock').then(function(){
        assert.equal(machine.currentState, 'locked')
    })
})
test('handler transitions [synchronous]',(assert) => {
    assert.plan(1)
    let model = stampit()
        .refs({ name: 'deadbolt', code: '123'})

    let machine = synchronous()
    machine.target(model)

    machine.handle('lock')
    assert.equal(machine.currentState, 'locked')
})

