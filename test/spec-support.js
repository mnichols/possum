'use strict';
//global stuff
require('source-map-support').install()
var chai = require('chai')
    ,should = require('chai').should() //touch All The Things
    ,chaiAsPromised = require('chai-as-promised')


chai.config.includeStack = true
chai.use(chaiAsPromised)

global.expect = chai.expect
global.AssertionError = chai.AssertionError
global.Assertion = chai.Assertion
global.assert = chai.assert

global.check = function asyncCheck(done, f) {
    try {
        f()
        done()
    } catch(e){
        done(e)
    }
}
