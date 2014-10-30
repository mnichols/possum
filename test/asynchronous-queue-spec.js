'use strict';


describe('asyncQueue',function(){
    var Promise = require('bluebird')
        ,mockEmitter = require('./mock-emitter')
        ,queue = require('../lib/asynchronous-queue')

    var sut

    describe('when processing invalid input',function(){
        var transition
            ,emitter
        beforeEach(function(){
            emitter =  mockEmitter()
            var model = queue
                .state({
                    Promise: Promise
                    ,collect: function(inputType) {
                        return []
                    }
                })

            sut = model.methods(emitter)()
        })
        beforeEach(function(){
            return sut.handle('enqueue',{
                inputType: 'BAD'
                ,payload: {}
            })

        })
        beforeEach(function(){
            return sut.handle('process')
        })

        it('should raise noHandler',function(){
            var emitted = emitter.emitted('noHandler')
            emitted.length.should.equal(1)
        })
    })
    describe('when processing valid inputs',function(){
        var transition
            ,emitter
        beforeEach(function(){
            emitter =  mockEmitter()
            transition = function(args){
                transition.invoked = (transition.invoked || [])
                transition.invoked.push(args)
                return Promise.resolve(args)
            }
            var model = queue
                .state({
                    Promise: Promise
                    ,collect: function(inputType) {
                        if(inputType === 'transition') {
                            return [transition]
                        }
                    }
                })

            sut = model.methods(emitter)()
        })
        beforeEach(function(){
            return sut.handle('enqueue',{
                inputType: 'transition'
                ,payload: {
                    toState: 'foo'
                    ,fromState: 'bar'
                }
            })

        })
        beforeEach(function(){
            return sut.handle('process')
        })
        it('should invoke each handler',function(){
            transition.invoked.length.should.equal(1)
            transition.invoked[0].should.eql({
                toState: 'foo'
                ,fromState: 'bar'
            })
        })
        it('should raise handled events',function(){
            var emitted = emitter.emitted('handled')
            emitted.length.should.equal(1)
        })
    })

})
