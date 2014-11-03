'use strict';


describe.only('AsyncQueue',function(){
    var Promise = require('bluebird')
        ,queue = require('../lib/async-queue')
        ,command = require('../lib/command')
        ,sut
    describe('when processing commands',function(){

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
            function collect(inputType) {
                var result = [
                    handlers[inputType]
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
            events.length.should.equal(3)
            events[0].topic.should.equal('handled')
            events[1].topic.should.equal('handled')
            events[2].topic.should.equal('handled')
            events[0].payload.inputType.should.equal('a')
            events[1].payload.inputType.should.equal('b')
            events[2].payload.inputType.should.equal('c')
        })

    })
})

