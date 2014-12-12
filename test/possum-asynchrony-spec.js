'use strict';

describe('PossumAsynchrony',function(){
    var possum = require('..')
        ,mockEmitter = require('./mock-emitter')
        ,Promise = require('bluebird')
    var sut
        ,emitter
    describe('when consecutive `handle` calls are invoked',function(){
        beforeEach(function(){
            emitter = mockEmitter()

            sut = possum({
                initialState: 'a'
                ,namespace: 'foo'
                ,handled: []
                ,states: {
                    'a': {
                        'a': function(){
                            this.handled.push('a.a')
                            return this.handle('a1')
                                .then(this.transition.bind(this,'b'))
                        }
                        ,'b': function(){
                            this.handled.push('a.b')
                        }
                        ,'a1': function() {
                            this.handled.push('a.a1')
                        }
                    }
                    ,'b': {
                        'b': function(){
                            this.handled.push('b.b')
                        }
                    }

                }
            })
            .methods(emitter)
            .create()
            return sut.start()
        })

        beforeEach(function(){
            sut.handle('a')
            return sut.schedule('b')
        })
        /**
         * we want to guarantee that a call to handle will enqueue subsequent calls to handle */
        it('should process them in different contexts',function(){
            sut.handled.length.should.equal(3)
            sut.handled[0].should.equal('a.a')
            sut.handled[1].should.equal('a.a1')
            sut.handled[2].should.equal('b.b')
        })
    })

})
