'use strict';

import possum from './possum'
import stampit from 'stampit'

export default stampit()
.init(function(){
    let originalHandle = this.handle
    let originalTransition = this.transition
    const noop = () => { }
    this.handling = (this.handling || noop)
    this.transitioning = (this.transitioning || noop)
    this.handle = function(inputType,args) {
        //tap
        this.handling.call(this,inputType,args)
        return originalHandle.call(this,inputType,args)
    }
    this.transition = function(toState) {
        //tap
        this.transitioning(toState)
        return originalTransition.call(this,toState)
    }
})

