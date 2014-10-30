'use strict';

describe('Api',function(){
    var api = require('../lib/api')
    var sut
        ,mockQueue

    beforeEach(function(){
        mockQueue = {
            start: function(){
                this.started = true
                return this
            }
            ,handle: function(inputType, msg) {
                var arr = (this.handled[inputType] || [])
                arr.push(msg)
                this.handled[inputType] = arr
                return this
            }
            ,handled: {}
        }

    })
    describe('when starting',function(){

        beforeEach(function(){
            sut = api({
                queue: mockQueue
                ,initialState: 'foo'
            })

        })
        beforeEach(function(){
            return sut.start()
        })
        it('should be started',function(){
            sut.started.should.be.true
        })
        it('should start at initialState',function(){
            var enqueued = mockQueue.handled['enqueue']
            enqueued.length.should.equal(1)
            enqueued[0].inputType.should.equal('start')
            enqueued[0].payload.toState.should.equal('foo')
        })
    })
    describe('when handling input',function(){
        beforeEach(function(){
            sut = api({
                queue: mockQueue
            })
        })
        beforeEach(function(){
            return sut.handle('a',{
                b: 1
                ,deep: { thoughts: 'Jack Handy'}
            })
        })
        it('should queue the input',function(){
            var enqueued = mockQueue.handled['enqueue']
            enqueued.length.should.equal(1)
            enqueued[0].inputType.should.equal('a')
            enqueued[0].payload.should.eql({
                b: 1
                , deep: {
                    thoughts: 'Jack Handy'
                }
            })
        })
        it('should process the queue for `this`',function(){
            var process = mockQueue.handled['process']
            process.length.should.equal(1)
            process[0].should.eql(sut)
        })
    })
})
