'use strict';

describe.only('States',function(){
    var Promise = require('bluebird')
        ,states = require('../lib/states')
        ,mockEmitter = require('./mock-emitter')

    var sut
    describe('given synchronous',function(){
        var model
        beforeEach(function(){
            model = states({
            })
        })
        describe('when transitioning to state that isnt configured',function(){
            var emitter
            beforeEach(function(){
                emitter = mockEmitter()
                sut = model.state({
                    entered: {}
                    ,exited: {}
                    ,count: 0
                    ,state: 'a'
                    ,states: {
                        'a': {
                            _onEnter: function(){
                                this.entered['a'] = ++this.count
                            }
                            ,_onExit: function(){
                                this.exited['a'] = ++this.count
                            }
                        }
                        ,'b': {
                            _onEnter: function(){
                                this.entered['b'] = ++this.count
                            }
                            ,_onExit: function(){
                                this.exited['b'] = ++this.count
                            }
                        }
                        ,'c': {

                        }
                    }
                })
                .methods(emitter)
                .create()

                var event = {
                    fromState: 'a'
                    ,toState: 'NOEXIST'
                }

                return sut.transition(event)
            })
            it('should emit invalid event',function(){
                var emitted = emitter.emitted('invalidTransition')
                emitted.length.should.equal(1)
                emitted[0][0].should.eql({
                    fromState: 'a'
                    ,toState: 'NOEXIST'
                })
            })

        })

        describe('when transitioning to same state',function(){
            var emitter
            beforeEach(function(){
                emitter = mockEmitter()
                sut = model.state({
                    entered: {}
                    ,exited: {}
                    ,count: 0
                    ,state: 'b'
                    ,priorState: 'a'
                    ,states: {
                        'a': {
                            _onEnter: function(){
                                this.entered['a'] = ++this.count
                            }
                            ,_onExit: function(){
                                this.exited['a'] = ++this.count
                            }
                        }
                        ,'b': {
                            _onEnter: function(){
                                this.entered['b'] = ++this.count
                            }
                            ,_onExit: function(){
                                this.exited['b'] = ++this.count
                            }
                        }
                        ,'c': {

                        }
                    }
                })
                .methods(emitter)
                .create()

                var event = {
                    fromState: 'a'
                    ,toState: 'b'
                }

                return sut.transition(event)
            })
            it('should not invoke fromState _onExit',function(){
                expect(sut.exited['a']).not.to.exist
            })
            it('should not invoke toState _onEnter',function(){
                expect(sut.entered['b']).not.to.exist
            })
            it('should remain on state',function(){
                sut.state.should.equal('b')
            })
            it('should not change priorState',function(){
                sut.priorState.should.equal('a')
            })
            it('should not emit transitioned',function(){
                var emitted = emitter.emitted('transitioned')
                emitted.length.should.equal(0)
            })
        })
        describe('when transitioning to different state',function(){
            var emitter
            beforeEach(function(){
                emitter = mockEmitter()
                sut = model.state({
                    entered: {}
                    ,exited: {}
                    ,count: 0
                    ,states: {
                        'a': {
                            _onEnter: function(){
                                this.entered['a'] = ++this.count
                            }
                            ,_onExit: function(){
                                this.exited['a'] = ++this.count
                            }
                        }
                        ,'b': {
                            _onEnter: function(){
                                this.entered['b'] = ++this.count
                            }
                            ,_onExit: function(){
                                this.exited['b'] = ++this.count
                            }
                        }
                        ,'c': {

                        }
                    }
                })
                .methods(emitter)
                .create()

                var event = {
                    fromState: 'a'
                    ,toState: 'b'
                }

                return sut.transition(event)
            })
            it('should invoke fromState _onExit',function(){
                sut.exited['a'].should.equal(1)
            })
            it('should invoke toState _onEnter',function(){
                sut.entered['b'].should.equal(2)
            })
            it('should change state',function(){
                sut.state.should.equal('b')
            })
            it('should change priorState',function(){
                sut.priorState.should.equal('a')
            })
            it('should emit transitioned',function(){
                var emitted = emitter.emitted('transitioned')
                emitted.length.should.equal(1)
            })
        })

    })

    describe('given asynchronous',function(){
        var model
        beforeEach(function(){
            model = states({
                Promise: Promise
            })
        })


        describe('when transitioning to state that isnt configured',function(){
            var emitter
            beforeEach(function(){
                emitter = mockEmitter()
                sut = model.state({
                    entered: {}
                    ,exited: {}
                    ,count: 0
                    ,state: 'a'
                    ,states: {
                        'a': {
                            _onEnter: function(){
                                this.entered['a'] = ++this.count
                            }
                            ,_onExit: function(){
                                this.exited['a'] = ++this.count
                            }
                        }
                        ,'b': {
                            _onEnter: function(){
                                this.entered['b'] = ++this.count
                            }
                            ,_onExit: function(){
                                this.exited['b'] = ++this.count
                            }
                        }
                        ,'c': {

                        }
                    }
                })
                .methods(emitter)
                .create()

                var event = {
                    fromState: 'a'
                    ,toState: 'NOEXIST'
                }

                return sut.transition(event)
            })
            it('should emit invalid event',function(){
                var emitted = emitter.emitted('invalidTransition')
                emitted.length.should.equal(1)
                emitted[0][0].should.eql({
                    fromState: 'a'
                    ,toState: 'NOEXIST'
                })
            })

        })

        describe('when transitioning to same state',function(){
            var emitter
            beforeEach(function(){
                emitter = mockEmitter()
                sut = model.state({
                    entered: {}
                    ,exited: {}
                    ,count: 0
                    ,state: 'b'
                    ,priorState: 'a'
                    ,states: {
                        'a': {
                            _onEnter: function(){
                                this.entered['a'] = ++this.count
                            }
                            ,_onExit: function(){
                                this.exited['a'] = ++this.count
                            }
                        }
                        ,'b': {
                            _onEnter: function(){
                                this.entered['b'] = ++this.count
                            }
                            ,_onExit: function(){
                                this.exited['b'] = ++this.count
                            }
                        }
                        ,'c': {

                        }
                    }
                })
                .methods(emitter)
                .create()

                var event = {
                    fromState: 'a'
                    ,toState: 'b'
                }

                return sut.transition(event)
            })
            it('should not invoke fromState _onExit',function(){
                expect(sut.exited['a']).not.to.exist
            })
            it('should not invoke toState _onEnter',function(){
                expect(sut.entered['b']).not.to.exist
            })
            it('should remain on state',function(){
                sut.state.should.equal('b')
            })
            it('should not change priorState',function(){
                sut.priorState.should.equal('a')
            })
            it('should not emit transitioned',function(){
                var emitted = emitter.emitted('transitioned')
                emitted.length.should.equal(0)
            })
        })
        describe('when transitioning to different state',function(){
            var emitter
            beforeEach(function(){
                emitter = mockEmitter()
                sut = model.state({
                    entered: {}
                    ,exited: {}
                    ,count: 0
                    ,states: {
                        'a': {
                            _onEnter: function(){
                                this.entered['a'] = ++this.count
                            }
                            ,_onExit: function(){
                                this.exited['a'] = ++this.count
                            }
                        }
                        ,'b': {
                            _onEnter: function(){
                                this.entered['b'] = ++this.count
                            }
                            ,_onExit: function(){
                                this.exited['b'] = ++this.count
                            }
                        }
                        ,'c': {

                        }
                    }
                })
                .methods(emitter)
                .create()

                var event = {
                    fromState: 'a'
                    ,toState: 'b'
                }

                return sut.transition(event)
            })
            it('should invoke fromState _onExit',function(){
                sut.exited['a'].should.equal(1)
            })
            it('should invoke toState _onEnter',function(){
                sut.entered['b'].should.equal(2)
            })
            it('should change state',function(){
                sut.state.should.equal('b')
            })
            it('should change priorState',function(){
                sut.priorState.should.equal('a')
            })
            it('should emit transitioned',function(){
                var emitted = emitter.emitted('transitioned')
                emitted.length.should.equal(1)
            })
        })
    })
})
