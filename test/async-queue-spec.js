'use strict';


describe('AsyncQueue',function(){
    var Promise = require('bluebird')
        ,queue = require('../lib/async-queue')
        ,command = require('../lib/command')
        ,sut
    describe('when processing commands',function(){
        describe('given deferred',function(){
            var model
                ,events
            beforeEach(function(){
                events = []
                model = {
                    handled: []
                }
                sut = queue({
                    Promise: Promise
                })
                .methods({
                    deferred: function(handled){
                        if(handled.inputType === 'b') {
                            return [
                                command({ inputType: 'x', payload: 'xxx'})
                            ]
                        }
                        return []
                    }
                    ,raise: events.push.bind(events)
                })
                .create()
            })
            beforeEach(function(){
                sut.enqueue([
                    command({ inputType: 'a', payload: 'aaa'})
                    ,command({ inputType: 'b', payload: 'bbb'})
                    ,command({ inputType: 'c', payload: 'ccc'})
                ])
            })
            beforeEach(function(){
                var handlers = {
                    a: function(args) {
                        this.handled.push(args)
                    }
                    ,b: function(args) {
                        this.handled.push(args)
                    }
                    ,c: function(args) {
                        this.handled.push(args)
                    }
                    ,x: function(args) {
                        this.handled.push(args)
                    }
                }
                function collect(spec) {
                    var inputType = spec.inputType
                    var result = [ {
                            name: inputType
                            ,fn: handlers[inputType]
                        }
                    ]
                    return result
                }
                return sut.process(model, collect)
            })

            it('should process deferred commands in proper order',function(){
                model.handled[0].should.equal('aaa')
                model.handled[1].should.equal('bbb')
                model.handled[2].should.equal('xxx')
                model.handled[3].should.equal('ccc')
            })
            it('should raise events in proper order',function(){
                events.length.should.equal(8)
                events[0].topic.should.equal('handled')
                events[1].topic.should.equal('completed')
                events[2].topic.should.equal('handled')
                events[3].topic.should.equal('completed')
                events[4].topic.should.equal('handled')
                events[5].topic.should.equal('completed')
                events[6].topic.should.equal('handled')
                events[7].topic.should.equal('completed')
                events[0].inputType.should.equal('a')
                events[2].inputType.should.equal('b')
                events[4].inputType.should.equal('x')
                events[6].inputType.should.equal('c')
            })

        })
        describe('given none deferred',function(){
            var model
                ,events
            beforeEach(function(){
                events = []
                model = {
                    handled: []
                }
                sut = queue({
                    Promise: Promise
                })
                .methods({
                    raise: events.push.bind(events)
                })
                .create()
            })
            beforeEach(function(){
                sut.enqueue([
                    command({ inputType: 'a', payload: 'aaa'})
                    ,command({ inputType: 'b', payload: 'bbb'})
                    ,command({ inputType: 'c', payload: 'ccc'})
                ])
            })
            beforeEach(function(){
                var handlers = {
                    a: function(args) {
                        this.handled.push(args)
                    }
                    ,b: function(args) {
                        this.handled.push(args)
                    }
                    ,c: function(args) {
                        this.handled.push(args)
                    }
                }
                function collect(spec) {
                    var inputType = spec.inputType
                    var result = [ {
                            name: inputType
                            ,fn: handlers[inputType]
                        }
                    ]
                    return result
                }
                return sut.process(model, collect)
            })

            it('should process each command in serial',function(){
                model.handled[0].should.equal('aaa')
                model.handled[1].should.equal('bbb')
                model.handled[2].should.equal('ccc')
            })
            it('should raise events in proper order',function(){
                events.length.should.equal(6)
                events[0].topic.should.equal('handled')
                events[1].topic.should.equal('completed')
                events[2].topic.should.equal('handled')
                events[3].topic.should.equal('completed')
                events[4].topic.should.equal('handled')
                events[5].topic.should.equal('completed')
                events[0].inputType.should.equal('a')
                events[2].inputType.should.equal('b')
                events[4].inputType.should.equal('c')
            })

        })


    })
})

