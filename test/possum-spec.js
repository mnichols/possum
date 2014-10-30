'use strict';

describe('Possum',function(){
    var possum = require('..')
        ,mockEmitter = require('./mock-emitter')
    var sut
        ,emitter
    describe('when created',function(){
        describe('given simple configuration',function(){
            beforeEach(function(){
                emitter = mockEmitter()

                sut = possum({
                    initialState: 'uninitialized'
                    ,namespace: 'foo'
                    ,states: {
                        'uninitialized': {}
                    }
                    ,additionalMethod: function(){
                        this.added = true
                    }
                    ,additionalProperty: 'foo'
                })
                .methods(emitter)
                .create()
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
            it('should mixin additional methods',function(){
                sut.additionalMethod()
                sut.added.should.be.true
            })
            it('should mixin additional properties',function(){
                sut.additionalProperty.should.equal('foo')

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
        var events
        beforeEach(function(){
            events = []
            sut = possum({
                initialState: 'uninitialized'
                ,namespace: 'foo'
                ,states: {
                    'uninitialized': {}
                }
            })
            .create()
        })
        beforeEach(function(){
            sut.on('handled', function(e){
                events.push(e)
            })
            return sut.start()
        })
        it('should raise event for transition to initial state',function(){
            events.length.should.equal(3)
            events[0].inputType.should.equal('_transition')
            events[0].payload.toState.should.equal('uninitialized')
            events[1].inputType.should.equal('_onEnter')
            events[1].payload.toState.should.equal('uninitialized')
            events[2].inputType.should.equal('_start')
            events[2].payload.toState.should.equal('uninitialized')
            expect(events[0].fromState).to.be.undefined
        })
        it('should be started',function(){
            sut.started.should.be.true
        })
        it('should be on initialState',function(){
            sut.state.should.equal('uninitialized')
        })
        it('should have an undefined priorState',function(){
            sut.should.contain.keys('priorState')
            expect(sut.priorState).to.be.undefined
        })

    })

    describe('when transitioning',function(){
        var events
        describe('given transition to current state',function(){

            beforeEach(function(){
                events = []
                sut = possum({
                    initialState: 'uninitialized'
                    ,namespace: 'foo'
                    ,states: {
                        'uninitialized': {}
                        ,'a':{}
                    }
                })
                .create()
            })
            beforeEach(function(){
                return sut.start()
            })

            beforeEach(function(){
                sut.on('handled',events.push.bind(events))
                return sut.transition('uninitialized')
            })
            it('should not raise new events',function(){
                events.length.should.equal(0)
            })

            it('should still be on current state',function(){
                sut.state.should.equal('uninitialized')
            })
        })
        describe('given transition to invalid state',function(){
            var emitter
            beforeEach(function(){
                events = []
                sut = possum({
                    initialState: 'uninitialized'
                    ,namespace: 'foo'
                    ,states: {
                        'uninitialized': {}
                        ,'a':{}
                    }
                })
                .create()
            })
            beforeEach(function(){
                return sut.start()
            })
            beforeEach(function(){
                sut.on('invalidTransition',events.push.bind(events))
                return sut.transition('BAD')
            })
            it('should still be on prior state',function(){
                sut.state.should.equal('uninitialized')
            })
            it('should only raise invalidTransition event',function(){
                events.length.should.equal(1)
                events[0].toState.should.equal('BAD')
                events[0].fromState.should.equal('uninitialized')
            })
        })
        describe('given valid transition to new state',function(){
            var events
            beforeEach(function(){
                events = []

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
                })
                .create()
            })
            beforeEach(function(){
                return sut.start()
            })
            beforeEach(function(){
                sut.on('handled',events.push.bind(events))
                return sut.transition('a')
            })
            it('should raise event for transition to target state',function(){
                events.length.should.equal(3)
                events[1].inputType.should.equal('_transition')
                events[1].payload.toState.should.equal('a')
                events[1].payload.fromState.should.equal('uninitialized')
            })
            it('should be on the target state',function(){
                sut.state.should.equal('a')
            })
            it('should mark priorState',function(){
                sut.priorState.should.equal('uninitialized')
            })
            it('should have exited old state',function(){
                events[0].inputType.should.equal('_onExit')
                events[0].payload.fromState.should.equal('uninitialized')
                //here is the fail...
                //we want to alter THIS not the queue
                sut.exited.should.equal('uninitialized')
            })
            it('should have entered new state',function(){
                events[2].inputType.should.equal('_onEnter')
                events[2].payload.toState.should.equal('a')
                sut.entered.should.equal('a')
            })
        })

    })
    describe('when handling an input',function(){
        var events
        describe('given input doesnt have a handler on current state',function(){

            beforeEach(function(){
                events = []

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
                })
                .create()
            })
            beforeEach(function(){
                return sut.start()
            })
            beforeEach(function(){
                sut.on('noHandler',events.push.bind(events))
                return sut.handle('BAD','foo')
            })

            it('should emit noHandler',function(){
                events.length.should.equal(1)
                events[0].inputType.should.equal('BAD')
            })
        })
        describe('given input has handler on current state',function(){
            var events
            beforeEach(function(){
                events = []
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
                })
                .create()
            })
            beforeEach(function(){
                return sut.start()
            })
            beforeEach(function(){
                sut.on('handled',events.push.bind(events))
                return sut.handle('foo','bar','baz')
            })

            it('should emit handled',function(){
                events.length.should.equal(1)
                events[0].inputType.should.equal('foo')
                events[0].payload.should.eql('bar')
            })
            it('should apply input args',function(){
                sut.handled[0].should.equal('bar')
            })
            it('should ignore other arguments',function(){
                expect(sut.handled[1]).to.be.undefined
            })
        })
        describe.only('given input has handler that defers until next transition',function(){
            var events
            beforeEach(function(){
                events = []

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
                                console.log('POO invoked deferrable',args)
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
                })
                .create()
            })
            beforeEach(function(){
                return sut.start()
            })
            beforeEach(function(){
                sut.on('handled',events.push.bind(events))
                //sut.onAny(events.push.bind(events))
                return sut.handle('deferrable','meh')
            })
            it('should invoke handled events for that handle',function(){
                console.log('events',events)
                throw new Error('check each event')
                events.length.should.equal(5)
                var first = events.shift()
                first.inputType.should.equal('_onExit')
                var last = events.shift()
                last.inputType.should.equal('deferrable')
            })
            it('should replay input on new transition',function(){
                sut.poo.should.equal('meh')
            })
        })
        describe('given input has handler that transitions',function(){
            var events
            beforeEach(function(){
                events = []
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
                })
                .create()
            })
            beforeEach(function(){
                return sut.start()
            })
            beforeEach(function(){
                sut.on('handled',events.push.bind(events))
                return sut.handle('foo','bar')
            })

            it('should emit handled events in order',function(){
                events.length.should.equal(4)
                //first ones is transition
                events[0].inputType.should.equal('_onExit')
                events[1].inputType.should.equal('_transition')
                events[2].inputType.should.equal('_onEnter')

                events[3].inputType.should.equal('foo')
                events[3].payload.should.equal('bar')
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
