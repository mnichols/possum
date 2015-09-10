'use strict';

import test from 'blue-tape'
import possum from '../src/possum'
import stampit from 'stampit'
import Promise from 'bluebird'


test('composing with possum builder stamp is sensible', (assert) => {
    assert.plan(5)
    let cloneable = stampit()
    .init(function({instance, stamp}){
        instance.clone = () => stamp(instance)
    })

    let machine = possum
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
test('composition into possum builder stamps is sensible', (assert) => {
    assert.plan(2)
    let cloneable = stampit()
    .init(function({instance, stamp}){
        instance.clone = () => stamp(instance)
    })

    let machine = possum
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
        .create()


    assert.ok(machine.clone)
    let clone = machine.clone()
    assert.equal(clone.foo,'bar')
})

test('composition into possum factory is sensible', (assert) => {
    assert.plan(9)
    let cloneable = stampit()
    .init(function({instance, stamp}){
        instance.clone = () => stamp(instance)
    })

    let reliesOnPossum = stampit()
        .init(function({instance}){
            this.on('foo',function(){
                this.emitted = 'FOO'
            }.bind(this))
        })

    let p = possum
        .compose(cloneable) //compose our behaviors in for all instances!
        .compose(reliesOnPossum)
        .refs({
            goo: 'begone'
        })
        .methods({
            print: function(){
                console.log('marsupial')
            }
        })
    let machine = p
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
        .create()
    let machine2 = p
        .config({
            initialState: 'x'
        })
        .states({
            'x': {
                'y': function(args, target) {

                }
            }
        })
        .props({
            'fooz': 'barz'
        })
        .create()


    assert.ok(machine.clone)
    assert.ok(machine2.clone)
    assert.ok(machine.print)
    assert.ok(machine2.print)
    assert.equal(machine.goo,'begone')
    assert.equal(machine2.goo,'begone')
    let clone = machine.clone()
    assert.equal(clone.foo,'bar')
    clone = machine2.clone()
    assert.equal(clone.fooz,'barz')

    clone.emit('foo')
    assert.equal(clone.emitted,'FOO')
})

test('compositions are discrete', (assert) => {
    assert.plan(2)

    let beh1 = stampit().refs({ foo: 'bar'})
    let beh2 = stampit().refs({ boo: 'far'})
    let p = possum.compose(beh1)
    let p2 = possum.compose(beh2)
    let model = p.config({ initialState: 'a' }).create()
    let model2 = p2.config({ initialState: 'a' }).create()

    assert.notOk(model.boo)
    assert.notOk(model2.foo)

})
