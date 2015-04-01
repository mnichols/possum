'use strict';

describe('States',function(){
    var states = require('../lib/states')
        ,Promise = require('bluebird')
        ,sut
    describe('when adding handlers',function(){
        var model
        beforeEach(function(){
            model = {
                handled: []
            }
            var spec = {
                states: {
                    'a': {
                        'a1': function(args) {
                            this.handled.push(['a.a1',args])
                        }
                        ,'a2': function(args){
                            this.handled.push(['a.a2',args])
                        }
                    }
                    ,'b': {
                        'b1': function(args) {
                            this.handled.push(['b.b1',args])
                        }
                    }
                }
                ,handlers: [ {
                    match: function(cfg) {
                        return cfg.inputType === '_start'
                    }
                    ,fn: function(e) {
                        this.started = true
                        this.handled.push(['_start',e])
                        return this
                    }
                }, {
                    '*': function(args) {
                        this.handled.push(['*',args])
                    }
                }]
            }
            sut = states({ })
            .state(spec)
            .create()
        })
        it('should collect those',function(){
            var handlers = sut.collect({
                inputType: '_start'
                ,state: 'ANY'
            })
            handlers.length.should.equal(2)
            handlers[0].fn.call(model,'foo')
            handlers[1].fn.call(model,'foo')
            model.handled[0].should.eql(['*','foo'])
            model.handled[1].should.eql(['_start','foo'])
            model.started.should.be.true
        })
    })
    describe('when collecting handlers',function(){
        describe('given global handlers',function(){
            var model
            beforeEach(function(){
                model = {
                    handled: []
                }
                var spec = {
                    states: {
                        'a': {
                            'a1': function(args) {
                                this.handled.push(['a.a1',args])
                            }
                            ,'a2': function(args){
                                this.handled.push(['a.a2',args])
                            }
                        }
                        ,'b': {
                            'b1': function(args) {
                                this.handled.push(['b.b1',args])
                            }
                        }
                    }
                    ,handlers: [ {
                        match: function(cfg) {
                            return cfg.inputType === '_start'
                        }
                        ,fn: function(e) {
                            this.started = true
                            return this
                        }
                    }, {
                        '*': function(args) {
                            this.handled.push(['*',args])
                        }
                    }]
                }
                sut = states({
                })
                .state(spec)
                .create()
            })

            it('should return handlers in proper order',function(){
                var handlers = sut.collect({
                    state: 'a'
                    ,inputType: 'a1'
                })
                handlers.length.should.equal(2)
                handlers[0].fn.call(model,'foo')
                handlers[1].fn.call(model,'foo')
                model.handled[0].should.eql(['*','foo'])
                model.handled[1].should.eql(['a.a1','foo'])
            })
        })
        describe('given simple spec',function(){
            var model
            beforeEach(function(){
                model = {
                    handled: []
                }
                var spec = {
                    states: {
                        'a': {
                            'a1': function(args) {
                                this.handled.push(['a.a1',args])
                            }
                            ,'a2': function(args){
                                this.handled.push(['a.a2',args])
                            }
                        }
                        ,'b': {
                            'b1': function(args) {
                                this.handled.push(['b.b1',args])
                            }
                        }
                    }
                }
                sut = states({
                })
                .state({
                    states: spec.states
                })
                .create()
            })
            it('should not match unknown inputs',function(){
                var handlers = sut.collect({
                    inputType: 'zzz'
                    ,state: 'a'
                })
                handlers.length.should.equal(0)
            })
            it('should not match wrong state inputs',function(){
                var handlers = sut.collect({
                    inputType: 'a1'
                    ,state: 'b'
                })
                handlers.length.should.equal(0)
            })
            it('should match input handlers',function(){
                var handlers = sut.collect({
                    state: 'a'
                    ,inputType: 'a1'
                })
                handlers.length.should.equal(1)
                handlers[0].fn.call(model,'foo')
                model.handled[0].should.eql(['a.a1','foo'])
            })
        })

    })

})
