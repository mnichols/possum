'use strict';

describe('EventSourcing',function(){
    var possum = require('..')
        ,mockEmitter = require('./mock-emitter')
        ,Promise = require('bluebird')
    var sut
        ,emitter
    describe('basic',function(){
        var spec
            ,target
            ,events
            ,handling
        beforeEach(function(){
            events = []
            handling = []
            spec = {
                initialState: 'uninitialized'
                ,namespace: 'foo'
                ,things: []
                ,thing: function(state,handler,args) {
                    this.things.push([
                        state
                        ,handler
                        ,args
                    ])
                }
                ,states: {
                    'uninitialized': {
                        'initialize': function(args) {
                            this.thing(this.state,'initialize',args)
                            return this.transition('a')
                        }
                    }
                    ,'a': {
                        _onEnter: function(){
                            this.thing(this.state,'_onEnter')
                        }
                        ,'A': function(args) {
                            this.thing(this.state,'A',args)
                            this.deferUntilTransition()
                            return this.transition('b')
                        }
                        ,_onExit: function(){
                            this.thing(this.state,'_onExit')
                        }
                    }
                    ,'b': {
                        _onEnter: function(){
                            this.thing(this.state,'_onEnter')
                        }
                        ,'A': function(args) {
                            this.thing(this.state,'A',args)
                        }
                        ,'B': function(args){
                            this.thing(this.state,'B',args)
                            this.done = true
                        }
                    }
                }

            }
            sut = possum(spec).create()
            target = possum(spec).create()
        })
        beforeEach(function(){
            var count = 0
            sut.on('handled',events.push.bind(events))
            return sut.start()
                .bind(sut)
                .then(function(){
                    return this.handle('initialize',++count)
                        .then(this.handle.bind(this,'A',++count))
                        .then(this.handle.bind(this,'B',++count))
                })
        })
        beforeEach(function(){
            return target.mount(events)
        })
        it('should remount events in proper order',function(){
            target.things[0].should.eql(['uninitialized','initialize',1])
            target.things[1].should.eql(['a','_onEnter',undefined])
            target.things[2].should.eql(['a','A',2])
            target.things[3].should.eql(['a','_onExit',undefined])
            target.things[4].should.eql(['b','_onEnter',undefined])
            target.things[5].should.eql(['b','A',2])
            target.things[6].should.eql(['b','B',3])
            target.done.should.be.true
        })
    })
})
