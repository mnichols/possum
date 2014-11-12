'use strict';


describe('AsyncQueue2',function(){
    var Promise = require('bluebird')
        ,queue = require('../lib/async-queue')
        ,command = require('../lib/command')
        ,sut
    describe('when processing commands',function(){
        var testRouter

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
            testRouter = function router(spec) {
                var inputType = spec.inputType
                var result = [ {
                        name: inputType
                        ,fn: handlers[inputType]
                    }
                ]
                return result
            }
        })
        describe.only('given deferred',function(){
            var model
                ,events
                ,deferred
            beforeEach(function(){
                events = []
                deferred = queue()
                    .state({
                        router: testRouter
                        ,name: 'possum.deferred.queue'
                    })
                    .methods({
                        raise: events.push.bind(events)
                    })
                    .create()

                deferred.enqueue(command({
                    inputType: 'x'
                    ,payload: 'xxx'
                }))
            })
            beforeEach(function(){
                model = {
                    handled: []
                }
                sut = queue()
                    .state({
                        router: testRouter
                    })
                    .methods({
                        raise: events.push.bind(events)
                    })
                    .create()

                sut.queues.push(deferred)
            })

            beforeEach(function(){
                sut.enqueue([
                    command({ inputType: 'a', payload: 'aaa'})
                    ,command({ inputType: 'b', payload: 'bbb'})
                    ,command({ inputType: 'c', payload: 'ccc'})
                ])
            })
            beforeEach(function(){
                return sut.process(model)
            })

            it('should process deferred commands in proper order',function(){
                model.handled[0].should.equal('aaa')
                model.handled[1].should.equal('xxx')
                model.handled[2].should.equal('bbb')
                model.handled[3].should.equal('ccc')
            })
            it('should raise events in proper order',function(){
                events.length.should.equal(8)
                events[0].topic.should.equal('queue.handled')
                events[1].topic.should.equal('queue.completed')
                events[2].topic.should.equal('queue.handled')
                events[3].topic.should.equal('queue.completed')
                events[4].topic.should.equal('queue.handled')
                events[5].topic.should.equal('queue.completed')
                events[6].topic.should.equal('queue.handled')
                events[7].topic.should.equal('queue.completed')
                events[0].message.inputType.should.equal('a')
                events[2].message.inputType.should.equal('x')
                events[4].message.inputType.should.equal('b')
                events[6].message.inputType.should.equal('c')
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
                sut = queue({ })
                    .state({
                        router: testRouter
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
                return sut.process(model)
            })

            it('should process each command in serial',function(){
                model.handled[0].should.equal('aaa')
                model.handled[1].should.equal('bbb')
                model.handled[2].should.equal('ccc')
            })
            it('should raise events in proper order',function(){
                events.length.should.equal(6)
                events[0].topic.should.equal('queue.handled')
                events[1].topic.should.equal('queue.completed')
                events[2].topic.should.equal('queue.handled')
                events[3].topic.should.equal('queue.completed')
                events[4].topic.should.equal('queue.handled')
                events[5].topic.should.equal('queue.completed')
                events[0].message.inputType.should.equal('a')
                events[2].message.inputType.should.equal('b')
                events[4].message.inputType.should.equal('c')
            })

        })


    })
})

