'use strict';

import test from 'blue-tape';
import possum from '../src/possum.js';
import stampit from 'stampit'
import {EventEmitter2 as EventEmitter} from 'eventemitter2'

test('_enter callback represents currentState', (assert) => {
    let proto = possum.config({
        initialState: 'a'
    })
    .compose(stampit.convertConstructor(EventEmitter))
    .states({
        a: {
            b() {
                return this.transition('b');
            }
        },
        b: {
            _enter() {
                this.captured = this.currentState
            }
        }
    })
    let sut = proto();
    sut.handle('b');
    assert.equal(sut.captured, 'b')
    assert.end()
})
