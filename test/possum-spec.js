'use strict';

describe('Possum',function(){
    var possum = require('..')
        ,mockEmitter = require('./mock-emitter')
        ,Promise = require('bluebird')
    var sut
        ,emitter
    describe('its prototype',function(){
        it('should should expose its EVENTS',function(){
            possum.EVENTS.HANDLED.should.equal('handled')
            possum.EVENTS.COMPLETED.should.equal('completed')
            possum.EVENTS.DEFERRED.should.equal('deferred')
            possum.EVENTS.TRANSITIONED.should.equal('transitioned')

        })
    })
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
            it('should should expose its EVENTS',function(){
                sut.EVENTS.HANDLED.should.equal('handled')
                sut.EVENTS.COMPLETED.should.equal('completed')
                sut.EVENTS.DEFERRED.should.equal('deferred')
                sut.EVENTS.TRANSITIONED.should.equal('transitioned')

            })
            it('should throw when accessing state before started',function(){
                function accessingState(){
                    return sut.state
                }
                accessingState.should.throw(/`state` is not set on unstarted possums./)
            })
            it('should be namespaced',function(){
                sut.namespace.should.equal('foo')
            })
            it('should not be started',function(){
                sut.started.should.be.false
            })
            it('should mixin additional methods with proper context',function(){
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
    describe('when started via the api',function(){
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
            sut.on('handled', events.push.bind(events))
            return sut.start().then(function(result){
                return result

            },function(err){
                console.error('err',err)
            })
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
    describe('when started manually', function() {
        beforeEach(function () {
            sut = possum({
                initialState: 'uninitialized'
                , namespace: 'foo'
                , states: {
                    'uninitialized': {}
                    , 'initialized': {}
                }
            })
            .create()
        })
        beforeEach(function () {
            return sut.handle('_start', {
                toState: 'uninitialized'
            })
        })
        it('should be started', function() {
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
                sut.onAny(events.push.bind(events))
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
                sut.on('foo.invalidTransition',events.push.bind(events))
                return sut.transition('BAD')
            })
            it('should still be on prior state',function(){
                sut.state.should.equal('uninitialized')
            })
            it('should only raise invalidTransition event',function(){
                events.length.should.equal(1)
                events[0].payload.toState.should.equal('BAD')
                events[0].payload.fromState.should.equal('uninitialized')
            })
        })
        describe('given valid transition to new state',function(){
            var handled
                ,transitioned
            beforeEach(function(){
                handled = []
                transitioned = []

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
                sut.on('foo.handled',handled.push.bind(handled))
                sut.on('foo.transitioned',transitioned.push.bind(transitioned))
                return sut.transition('a')
            })
            it('should raise event for transition to target state',function(){
                handled.length.should.equal(3)
                handled[1].inputType.should.equal('_transition')
                handled[1].payload.toState.should.equal('a')
                handled[1].payload.fromState.should.equal('uninitialized')
            })
            it('should be on the target state',function(){
                sut.state.should.equal('a')
            })
            it('should mark priorState',function(){
                sut.priorState.should.equal('uninitialized')
            })
            it('should have exited old state',function(){
                handled[0].inputType.should.equal('_onExit')
                handled[0].payload.fromState.should.equal('uninitialized')
                sut.exited.should.equal('uninitialized')
            })
            it('should have entered new state',function(){
                handled[2].inputType.should.equal('_onEnter')
                handled[2].payload.toState.should.equal('a')
                sut.entered.should.equal('a')
            })
            it('should emit a transitioned event',function(){
                transitioned.length.should.equal(1)
                transitioned[0].toState.should.equal('a')
                transitioned[0].fromState.should.equal('uninitialized')
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
                sut.on('foo.noHandler',events.push.bind(events))
                return sut.handle('BAD','foo')
            })

            it('should emit noHandler',function(){
                events.length.should.equal(1)
                events[0].inputType.should.equal('BAD')
            })
        })
        describe('given global catchall handler',function(){
            var events
            beforeEach(function(){
                events = []
                sut = possum({
                    initialState: 'uninitialized'
                    ,namespace: 'foo'
                    ,handled: []
                    ,foo: function(action,args) {
                        this.handled.push(action + ' -> ' + args)
                    }
                    ,ready: false
                    ,states: {
                        'uninitialized': {
                            _onEnter: function(){
                                this.ready = true
                            }
                            ,_onExit: function(){
                               this.exited = this.state
                            }
                            ,'foo': function(args) {
                                return this.foo('foo',args)
                            }
                        }
                    }
                    ,handlers: [ {
                        '*': function(args) {
                            if(this.ready) {
                                this.foo('*',args)
                            }
                        }
                    }]
                })
                .create()
            })
            beforeEach(function(){
                return sut.start()
            })
            beforeEach(function(){
                sut.on(sut.namespaced('handled'),events.push.bind(events))
                return sut.handle('foo','bar','baz')
            })
            it('should raise events for each handler',function(){
                events.length.should.equal(2)
                events[0].action.should.equal('*')
                events[1].action.should.equal('uninitialized.foo')
            })
            it('should handle catchall handler first',function(){
                sut.handled[1].should.equal('foo -> bar')
                sut.handled[0].should.equal('* -> bar')
            })
        })
        describe('given input has async handler',function(){
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
                                return Promise.resolve()
                                    .bind(this)
                                    .then(function(){
                                        this.handled = [arg1,arg2]
                                        return arg1
                                    })
                                    .then(this.handle.bind(this,'bar'))
                            }
                            ,'bar': function(){
                                this.barred = true
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
                sut.on(sut.namespaced('completed'),events.push.bind(events))
                return sut.handle('foo','bar','baz')
            })

            it('should emit handled in proper order',function(){
                events.length.should.equal(2)
                events[0].topic.should.equal('completed')
                events[0].inputType.should.equal('bar')
                events[1].topic.should.equal('completed')
                events[1].inputType.should.equal('foo')
                events[1].payload.should.eql('bar')
            })
            it('should apply input args',function(){
                sut.handled[0].should.equal('bar')
            })
            it('should ignore other arguments',function(){
                expect(sut.handled[1]).to.be.undefined
            })
            it('should handle asynchronously',function(){
                sut.barred.should.be.true

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
                sut.on(sut.namespaced('handled'),events.push.bind(events))
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
        describe('given input has handler that defers until next transition',function(){
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
                })
                .create()
            })
            beforeEach(function(){
                return sut.start()
            })
            beforeEach(function(){
                sut.on(sut.namespaced('deferred'),events.push.bind(events))
                sut.on(sut.namespaced('handled'),events.push.bind(events))
                sut.on(sut.namespaced('completed'),events.push.bind(events))
                return sut.handle('deferrable','meh')
            })
            it('should raise events in proper order',function(){
                events[0].topic.should.equal('deferred')
                events[0].inputType.should.equal('deferrable')

                events[1].topic.should.equal('handled')
                events[1].inputType.should.equal('deferrable')

                events[2].topic.should.equal('handled')
                events[2].inputType.should.equal('_onExit')

                events[3].topic.should.equal('completed')
                events[3].inputType.should.equal('_onExit')

                events[4].topic.should.equal('handled')
                events[4].inputType.should.equal('_transition')

                events[5].topic.should.equal('completed')
                events[5].inputType.should.equal('_transition')

                events[6].topic.should.equal('handled')
                events[6].inputType.should.equal('_onEnter')

                events[7].topic.should.equal('completed')
                events[7].inputType.should.equal('_onEnter')

                events[8].topic.should.equal('completed')
                events[8].inputType.should.equal('deferrable')

                //the replay events
                events[9].topic.should.equal('handled')
                events[9].inputType.should.equal('deferrable')

                events[10].topic.should.equal('completed')
                events[10].inputType.should.equal('deferrable')
            })
            it('should raise only expected events',function(){
                events.length.should.equal(11)
            })
            it('should replay input on new transition',function(){
                sut.poo.should.equal('meh')
            })
        })
        describe('given input has handler that defers until next handler',function(){
            var events
            beforeEach(function(){
                events = []

                sut = possum({
                    initialState: 'uninitialized'
                    ,namespace: 'foo'
                    ,defs: []
                    ,states: {
                        'uninitialized': {
                            'deferrable': function(args){
                                this.defs.push('deferrable -> ' + args)
                                //this needs to be deferred until a 'real' handle
                                //has been made
                                this.deferUntilNextHandler()
                            }
                            ,'deferrable2': function(args) {
                                this.normalArgs = args
                                return this.transition('foo')
                            }
                        }
                        ,'foo': {
                            'deferrable': function(args) {
                                this.defs.push('foo -> ' + args)
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
                sut.onAny(events.push.bind(events))
                return sut.handle('deferrable','meh')
            })
            beforeEach(function(){
                return sut.handle('deferrable2','bleh')
            })
            it('should not affect other handlers',function(){
                sut.normalArgs.should.equal('bleh')
            })
            it('should replay input after next handler',function(){
                sut.defs.length.should.equal(2)
                sut.defs[0].should.equal('deferrable -> meh')
                sut.defs[1].should.equal('foo -> meh')
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
                sut.on(sut.namespaced('completed'),events.push.bind(events))
                return sut.handle('foo','bar')
            })

            it('should emit completed events in order',function(){
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
    describe('when accessing api before starting',function(){
        beforeEach(function(){
            sut = possum({
                initialState: 'foo'
                ,states: {
                    'foo': {}
                }
            })
            .create()
        })
        it('should throw on transition',function(){
            sut.transition.bind(sut)
                .should.throw(/This possum has not been `start`ed/)

        })
        it('should throw on any non "_start" handle', function(){
            sut.handle.bind(sut)
                .should.throw(/This possum has not been `start`ed/)
        })
        it('should allow handling "_start" manually', function () {
            sut.handle.bind(sut, '_start')
                .should.not.throw()
        })
    })
})
