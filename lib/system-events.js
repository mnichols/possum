'use strict';

module.exports = {
    INVALID_TRANSITION: 'invalidTransition'
    ,NO_HANDLER: 'noHandler'
    ,HANDLING: 'handling'
    ,HANDLED: 'handled'
    ,INVOKED: 'invoked'
    ,DEFERRED: 'deferred'
    ,COMPLETED: 'completed'
    ,TRANSITIONED: 'transitioned'
    ,QUEUE: {
        HANDLED: 'queue.handled'
        ,COMPLETED: 'queue.completed'
        ,NO_HANDLER: 'queue.noHandler'
    }
    ,CONTEXT: {
        COMPLETED: 'context.completed'
        ,PROCESSING: 'context.processing'
    }
}
