'use strict';

var Promise = require('bluebird')
describe.skip('asyncQueue',function(){
    var sut
    describe('when processing mix of sync and promised fns',function(){
        beforeEach(function(){
            var queue = require('../lib/async-queue')
            sut = queue({
                Promise: Promise
            })
        })
        it('should be ok',function(){
            var promiseCount = 0
                ,syncCount = 0
            function promised(){
                return new Promise(function(resolve){
                    return resolve(++promiseCount)
                })
            }
            function synch(){
                return ++syncCount
            }

            sut.enqueue(promised)
            sut.enqueue(synch)
            sut.enqueue(promised)
            return sut.process()
                .then(function(){
                    promiseCount.should.equal(2)
                    syncCount.should.equal(1)
                })

        })

    })

})
