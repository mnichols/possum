'use strict';

import possum from './possum'
import stampit from 'stampit'
import tappable from './tappable'

//convenience
export {  tappable }

export default possum
.config({
    initialState: 'UNDEFINED'
    , namespace: 'spec-support'
})
.init(function(){
    this.handled = (this.handled || {})
    this.transitioned = (this.transitioned || [])
    this.handling = function(inputType, args) {
        let arr = this.handled[inputType] = (this.handled[inputType] || [])
        arr.push(args)
    }
    this.transitioning = function(toState) {
        let fromState = this.currentState
        this.transitioned.push({toState,fromState})
    }
})
.compose(tappable)

