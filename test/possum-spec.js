'use strict';

describe('Possum',function(){
    var possum = require('..')
        ,mockEmitter = require('./mock-emitter')
    var sut
    describe('when created',function(){
        describe('given simple configuration',function(){
            var emitter
            beforeEach(function(){

                sut = possum({
                    initialState: 'uninitialized'
                    ,namespace: 'foo'
                    ,states: {
                        'uninitialized': {}
                    }
                }, {
                    emitter: emitter = mockEmitter()
                })
            })
            it('should be in the initial state',function(){
                sut.state.should.equal('uninitialized')
            })
            it('should be namespaced',function(){
                sut.namespace.should.equal('foo')
            })
            it('should raise event for transition to initial state',function(){
                var transitioned = emitter.emitted('transitioned')
                transitioned.length.should.equal(1)
                transitioned[0][0].should.eql({
                    event: 'transitioned'
                    ,toState: 'uninitialized'
                    ,fromState: undefined
                })

            })
        })
        describe('given no initialState',function(){
            it('should throw',function(){
                var noInitialState = {states:{}}
                possum.bind({},noInitialState)
                    .should.throw(/An initialState is required/)
            })
        })
        describe('given no states',function(){
            it('should throw',function(){
                var noStates = {initialState:'foo'}
                possum.bind({},noStates)
                    .should.throw(/States are required/)
            })
        })
    })

    describe('when transitioning',function(){
        describe('given transition to current state',function(){
            var emitter
            beforeEach(function(){
                sut = possum({
                    initialState: 'uninitialized'
                    ,namespace: 'foo'
                    ,states: {
                        'uninitialized': {}
                        ,'a':{}
                    }
                }, {
                    emitter: emitter = mockEmitter()
                })
            })
            beforeEach(function(){
                emitter.reset()
                return sut.transition('uninitialized')
            })
            it('should not raise events',function(){
                var emitted = emitter.emitted()
                Object.keys(emitted).length.should.equal(0)
            })

            it('should still be on current state',function(){
                sut.state.should.equal('uninitialized')
            })
        })
        describe('given transition to invalid state',function(){
            var emitter
            beforeEach(function(){
                sut = possum({
                    initialState: 'uninitialized'
                    ,namespace: 'foo'
                    ,states: {
                        'uninitialized': {}
                        ,'a':{}
                    }
                }, {
                    emitter: emitter = mockEmitter()
                })
            })
            beforeEach(function(){
                emitter.reset()
                return sut.transition('BAD')
            })
            it('should not raise transitioned event',function(){
                emitter.emitted('transitioned')
                    .length.should.equal(0)
            })
            it('should still be on prior state',function(){
                sut.state.should.equal('uninitialized')
            })
            it('should raise invalidTransition event',function(){
                var emitted = emitter.emitted()
                emitted['invalidTransition'].length.should.equal(1)
            })
        })
        describe.only('given valid transition to new state',function(){
            var emitter
            beforeEach(function(){

                sut = possum({
                    initialState: 'uninitialized'
                    ,namespace: 'foo'
                    ,states: {
                        'uninitialized': {
                            _onExit: function(){
                                this.exited = this.state
                            }
                        }
                        ,'a':{
                            _onEnter: function(){
                                this.entered = this.state
                            }
                        }
                    }
                }, {
                    emitter: emitter = mockEmitter()
                })
            })
            beforeEach(function(){
                emitter.reset()
                return sut.transition('a')
            })
            describe('it should raise transitioned event',function(){
                it('should be on the target state',function(){
                    sut.state.should.equal('a')
                })
                it('should raise event for transition to target state',function(){
                    var transitioned = emitter.emitted('transitioned')
                    transitioned.length.should.equal(1)
                    transitioned[0][0].should.eql({
                        event: 'transitioned'
                        ,toState: 'a'
                        ,fromState: 'uninitialized'
                    })
                })
                it('should mark priorState',function(){
                    sut.priorState.should.equal('uninitialized')
                })
                it('should invoke exit handler for priorState',function(){
                    sut.exited.should.equal('uninitialized')
                })
                it('should invoke entry point to new state',function(){
                    sut.entered.should.equal('a')
                })
            })
        })

    })
    describe('when handling an input',function(){
        describe('given input doesnt have a handler on current state',function(){

        })

    })

})
