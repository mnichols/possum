'use strict';

describe('Possum',function(){
    var possum = require('..')
        ,mockEmitter = require('./mock-emitter')
    var sut
        ,emitter
    describe('when created',function(){
        describe('given simple configuration',function(){
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
            it('should not be in the initial state',function(){
                expect(sut.state).to.be.undefined
            })
            it('should be namespaced',function(){
                sut.namespace.should.equal('foo')
            })
            it('should not be started',function(){
                sut.started.should.be.false
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
    describe('when started',function(){
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
        beforeEach(function(){
            return sut.start()
        })
        it('should raise event for transition to initial state',function(){
            var transitioned = emitter.emitted('transitioned')
            transitioned.length.should.equal(1)
            var e = transitioned[0][0]
            e.toState.should.equal('uninitialized')
            expect(e.fromState).to.be.undefined
        })
        it('should be started',function(){
            sut.started.should.be.true
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
                return sut.start()
                    .then(function(){
                        emitter.reset()
                    })
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
                return sut.start()
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
                var emitted = emitter.emitted('invalidTransition')
                emitted.length.should.equal(1)
                var e = emitted[0][0]
                e.toState.should.equal('BAD')
                e.fromState.should.equal('uninitialized')
            })
        })
        describe('given valid transition to new state',function(){
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
                return sut.start()
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
                    var e = transitioned[0][0]
                    e.should.eql({
                        toState: 'a'
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
        var emitter
        describe('given input doesnt have a handler on current state',function(){
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
                return sut.start()
            })
            beforeEach(function(){
                return sut.handle('BAD','foo')
            })

            it('should emit noHandler',function(){
                var emitted = emitter.emitted('noHandler')
                emitted.length.should.equal(1)
            })
        })
        describe('given input has handler on current state',function(){
            beforeEach(function(){

                sut = possum({
                    initialState: 'uninitialized'
                    ,namespace: 'foo'
                    ,states: {
                        'uninitialized': {
                            _onExit: function(){
                                this.exited = this.state
                            }
                            ,'foo': function(arg1,arg2){
                                this.handled = [arg1,arg2]
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
                return sut.start()
            })
            beforeEach(function(){
                emitter.reset()
                return sut.handle('foo','bar','baz')
            })

            it('should emit handled',function(){
                var emitted = emitter.emitted('handled')
                emitted.length.should.equal(1)
            })
            it('should apply input args',function(){
                sut.handled[0].should.equal('bar')
            })
            it('should ignore other arguments',function(){
                expect(sut.handled[1]).to.be.undefined
            })
        })
        describe('given input has handler that defers until next transition',function(){
            beforeEach(function(){

                sut = possum({
                    initialState: 'uninitialized'
                    ,namespace: 'foo'
                    ,states: {
                        'uninitialized': {
                            _onExit: function(){
                                this.exited = this.state
                            }
                            ,'deferrable': function(args){
                                console.log('deferrable invoked',args)
                                this.deferUntilTransition()
                                return this.transition('poo')
                            }
                        }
                        ,'poo': {
                            'deferrable': function(args) {
                                this.poo = args
                            }
                        }
                        ,'bar': {

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
                return sut.start()
            })
            beforeEach(function(){
                return sut.handle('deferrable','meh')

            })
            it('should replay input on new transition',function(){
                sut.poo.should.equal('meh')
            })
        })
        describe('given input has handler that transitions',function(){
            beforeEach(function(){

                sut = possum({
                    initialState: 'uninitialized'
                    ,namespace: 'foo'
                    ,states: {
                        'uninitialized': {
                            _onExit: function(){
                                this.exited = this.state
                            }
                            ,'foo': function(arg1){
                                this.handled = 'foo -> ' + arg1
                                return this.transition(arg1)
                            }
                        }
                        ,'bar': {

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
                return sut.start()
            })
            beforeEach(function(){
                emitter.reset()
                return sut.handle('foo','bar')
            })

            it('should emit handled',function(){
                var emitted = emitter.emitted('handled')
                console.log('emitted',emitted)
                //DO WE WANT TO EMIT HANDLED FOR SYSTEM EVENTS?
                emitted.length.should.equal(1)
                emitted[0][0].should.eql({
                    inputType: 'foo'
                })
            })
            it('should invoke handler',function(){
                sut.handled.should.equal('foo -> bar')
            })
            it('should transition',function(){
                sut.state.should.equal('bar')
            })
        })

    })

})
