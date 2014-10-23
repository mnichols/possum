'use strict';

describe('Registrations',function(){
    var Registrations = require('../lib/registrations')
        ,ComponentModel = require('../lib/component-model')


    it('should return models having `startable` attribute according to their dependency graph',function(){
        var sut = new Registrations()
        function NotStartable(){}
        function Startable(){}
        function StartableToo(){}
        Startable.startable = 'start'
        Startable.inject = [
            'startable2'
        ]
        StartableToo.startable = 'start'
        sut.put(new ComponentModel('not',NotStartable))
        sut.put(new ComponentModel('startable',Startable))
        sut.put(new ComponentModel('startable2',StartableToo))
        var starts = sut.startables()
            .map(function(comp){
                return comp.key
            })
        starts.length.should.equal(2)
        starts[0].should.equal('startable')
        starts[1].should.equal('startable2')
    })

})
