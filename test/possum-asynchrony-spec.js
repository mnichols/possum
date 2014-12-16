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
                            return Promise.delay(500)
                                .then(this.handle.bind(this,'a1'))
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

        beforeEach(function(done){
            sut.handle('a')
            sut.schedule('b')
            //be sure this delay is > delay in Promise.delay(..) above
            setTimeout(done,1000)
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
    describe('when configuring complex interleaving of event listeners with promises',function(){
        var inner
        beforeEach(function(){
            emitter = mockEmitter()

            sut = possum({
                initialState: 'a'
                ,namespace: 'foo'
                ,handled: []
                ,states: {
                    'a': {
                        _onEnter: function(){

                            this.inner.on(this.inner.namespaced('transitioned'),function(e){
                                var ctx = this.currentProcessContext()
                                if(e.toState === 'z') {
                                    //note that this use of `schedule` will hang the current context
                                    //and could potentially _never_ resolve
                                    //but this was resolved by relying on context.completed event
                                    return this.schedule('z')
                                }
                                return null //superfluous
                            }.bind(this))
                        }
                        ,'a': function(){
                            this.handled.push('a.a')
                            //note that we are _not_ returning the result from
                            //inner since that would cause the context to hang
                            //when using `schedule` above
                            return this.inner.handle('foo')
                                .then(function(result){
                                    return result
                                })
                        }
                        ,'z': function(){
                            this.handled.push('a.z')
                            this.deferUntilTransition()
                            return this.transition('b')

                        }
                    }
                    ,'b': {
                        'z': function(){
                            this.handled.push('b.z')
                        }
                    }

                }
            })
            .methods(emitter)
            .create()

            var innerPossum = possum({
                initialState: 'x'
                ,states: {
                    'x': {
                        'foo': function(){
                            this.deferUntilTransition()
                            return this.transition('y')
                        }
                    }
                    ,'y': {
                        'foo': function(){
                            return this.transition('z')
                        }
                    }
                    ,'z': {

                    }
                }
            })
            sut.inner = inner = innerPossum()

            return sut.inner.start()
                .then(sut.start.bind(sut))
        })
        beforeEach(function(done){
            sut.handle('a')
            setTimeout(function(){
                done()
            },100)
        })
        it('should work ok',function(){
            sut.handled.length.should.equal(3)
            sut.handled[0].should.equal('a.a')
            sut.handled[1].should.equal('a.z')
            sut.handled[2].should.equal('b.z')
        })
        it('should transition properly',function(){
            sut.state.should.equal('b')
        })
        it('should not interfere with inner',function(){
            inner.state.should.equal('z')
        })

    })

})
