'use strict';

var stampit = require('stampit')
    ,cuid = require('cuid')
module.exports =stampit()
    .state({
        inputType: undefined
        ,payload: undefined
        ,state: undefined
        ,timestamp: undefined
        ,id: undefined
    })
    .enclose(function(){
        stampit.mixIn(this,{
            timestamp: new Date().toUTCString()
            ,id: cuid()
        })
    })
