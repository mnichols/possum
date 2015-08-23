'use strict';

var stampit = require('stampit')
    ,cuid = require('cuid')
    ;

module.exports = stampit()
    .refs({
        topic: undefined
         , payload: undefined
         , state: undefined
         , timestamp: undefined
         , id: undefined
         , namespace: undefined
    })
    .init(function({ instance, stamp }){
        this.timestamp = new Date().toUTCString()
        this.id = cuid()
    })
