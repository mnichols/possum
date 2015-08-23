'use strict';

import test from 'blue-tape'
import possum from '../lib'
import stampit from 'stampit'
import Promise from 'bluebird'


test('composing with possum is sensible', (assert) => {
    assert.plan(5)
    let cloneable = stampit()
    .init(function({instance, stamp}){
        instance.clone = () => stamp(instance)
    })

    let machine = possum()
        .config({
            initialState: 'a'
        })
        .states({
            'a': {
                'b': function(args, target) {
                    return this.transition('b')
                }
                , 'c': function(){
                    return this.transition('c')
                }
            }
            ,'b': {
                'c': function(args) {
                    return this.transition('c')
                }
            }
            ,'c': {}
        })
        .props({
            'foo': 'bar'
        })
        .stamp()

    let first = cloneable.compose(machine)({},machine.emitterOpts)
    assert.ok(first.handle)
    first.handle('b')
    assert.equal(first.currentState,'b')
    let second = first.clone({},machine.emitterOpts)
    assert.equal(second.currentState,'a')
    second.handle('c')
    assert.equal(second.currentState,'c')
    assert.equal(first.currentState,'b')

})
test('composition into possum is sensible', (assert) => {
    assert.plan(2)
    let cloneable = stampit()
    .init(function({instance, stamp}){
        instance.clone = () => stamp(instance)
    })

    let machine = possum()
        .config({
            initialState: 'a'
        })
        .states({
            'a': {
                'b': function(args, target) {

                }
            }
        })
        .props({
            'foo': 'bar'
        })
        .compose(cloneable) //compose our behaviors in!
        .build()


    assert.ok(machine.clone)
    let clone = machine.clone()
    assert.equal(clone.foo,'bar')
})
