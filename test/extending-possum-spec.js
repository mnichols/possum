'use strict';

describe('Extending Possum',function(){
    var possum = require('..')
        ,mockEmitter = require('./mock-emitter')
        ,Promise = require('bluebird')
    var sut
        ,emitter
    describe('when mixing in states',function(){
        beforeEach(function(){
            var spec = {
                initialState: 'uninit'
                ,states: {
                    'uninit': {
                        'a': function(args){
                            this.a = args
                        }
                    }
                }
            }
            var spec2 = {
                states: {
                    'disposed': {
                        _onEnter: function(){
                            this.disposed = true
                        }
                    }
                }
                ,custom: function(args){
                    this.customCalled = args
                }
                ,handlers: [ {
                        match: function(spec) {
                            return spec.inputType === 'b'
                        }
                        ,fn: function(args) {
                            return this.specialHandler = args
                        }
                        ,name: 'beematcher'
                    }
                ]
            }
            sut = possum(spec)
                .extend(spec2)
                .create()

            return sut.start()
        })

        it('should not affect original states',function(){
            return sut.handle('a','foo')
                .then(function(){
                    sut.a.should.equal('foo')
                })

        })
        it('should include other states',function(){
            return sut.transition('disposed')
                .then(function(){
                    sut.disposed.should.be.true
                })

        })
        it('should include other handlers',function(){
            return sut.handle('b','goo')
                .then(function(){
                    sut.specialHandler.should.equal('goo')
                })

        })
        it('should mixin additional attrs',function(){
            sut.custom('foo')
            sut.customCalled.should.equal('foo')


        })
    })

})
