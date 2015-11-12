'use strict';

import test from 'blue-tape'
import possum from '../src/possum'
import tappable from '../src/tappable'
import stampit from 'stampit'

const buildTap = () => {
    return stampit()
    .compose(tappable)
    .init(function(){
        this.handled = {}
        this.transitioned = []
        this.handling = function(inputType,args) {
            console.log('handling',inputType,args);
            let arr = this.handled[inputType] = (this.handled[inputType] || [])
            arr.push(args)
        }
        this.transitioning = function(toState) {
            this.transitioned.push({toState,fromState:this.currentState})
        }
    })
}

test('[tappable] tap shouldnt interfere with behavior of existing possums',(assert) => {
    let tap = buildTap()
    let sut = possum
    .config( { initialState: 'a' })
    .states({
        'a': {
            'b': function(inputType,args) {
                this.transition('b')
            }
        }
        ,'b': {}
    })
    .compose(tap)
    .create()
    sut.handle('b',{arg: 1})
    assert.equal(sut.currentState, 'b')
    //taps
    assert.equal(sut.handled['b'].length,1)
    assert.deepEqual(sut.handled['b'][0], {arg: 1})
    assert.deepEqual(sut.transitioned[0],{toState: 'b',fromState: 'a'})
    assert.end()
})

test('[tappable] deferrals are tapped too',(assert) => {
    let tap = buildTap()
    let sut = possum
    .config( { initialState: 'a' })
    .states({
        'a': {
            'b': function(inputType,args) {
                this.deferUntilTransition()
                this.handle('ping')
                this.transition('b')
            }
            ,'ping': function(){}
        }
        ,'b': {
            'b': function(inputType,args) {
                this.handle('pong')
            }
            ,'pong': function(){}
        }
    })
    .compose(tap)
    .create()
    sut.handle('b',{arg: 1})
    assert.equal(sut.currentState, 'b')
    //taps
    assert.equal(sut.handled['b'].length,2)
    assert.equal(sut.handled['ping'].length,1)
    assert.equal(sut.handled['pong'].length,1)
    assert.deepEqual(sut.handled['b'][0], {arg: 1})
    assert.deepEqual(sut.handled['b'][1], {arg: 1})
    assert.deepEqual(sut.transitioned[0],{toState: 'b',fromState: 'a'})
    assert.end()
})

