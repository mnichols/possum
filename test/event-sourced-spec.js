'use strict';

describe('EventSourcing',function({

    describe('kitchen sink',function(){
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
                            this.thing(this.state,'uninitialized',args)
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
                        'A': function(args) {
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
        it('should remount events',function(){
            target.done.should.be.true
        })
    })
}))
