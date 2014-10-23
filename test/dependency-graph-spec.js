'use strict';

describe('DependencyGraph',function(){
    var DependencyGraph = require('../lib/dependency-graph')
    describe('when creating a dependency graph',function(){
        describe('given a map',function(){
            var sut
            beforeEach(function(){
                var include = [
                    'a','b','c','d','e','f'
                ]
                var exclude = ['@impl']
                var map = {
                    a: ['b','c']
                    ,b: []
                    ,c: ['d','e']
                    ,d: ['f','unknown']
                }
                sut = new DependencyGraph(map,include,exclude)
            })
            it('should generate a graph map',function(){
                var graph = sut.toMap()
                graph.a.should.eql([
                    ['a','b']
                    ,['a','c']
                ])
                graph.b.should.eql([])
                graph.c.should.eql([
                    ['c','d']
                    ,['c','e']
                ])
                graph.d.should.eql([
                    ['d','f']
                ])

            })
            it('should generate a graph array',function(){
                var graph = sut.toArray()
                graph.length.should.equal(4)
                graph[0][0].should.equal('a')
                graph[0][1].should.eql([
                    ['a','b']
                    ,['a','c']
                ])

                graph[1][0].should.equal('b')
                graph[1][1].should.eql([])

                graph[2][0].should.equal('c')
                graph[2][1].should.eql([
                    ['c','d']
                    ,['c','e']
                ])

                graph[3][0].should.equal('d')
                graph[3][1].should.eql([
                    ['d','f']
                ])

            })
            it('should generate a graph array with order',function(){
                var graph = sut.toArray(['c','b','d'])
                graph.length.should.equal(4)

                graph[0][0].should.equal('c')
                graph[0][1].should.eql([
                    ['c','d']
                    ,['c','e']
                ])

                graph[1][0].should.equal('b')
                graph[1][1].should.eql([])


                graph[2][0].should.equal('d')
                graph[2][1].should.eql([
                    ['d','f']
                ])

                graph[3][0].should.equal('a')
                graph[3][1].should.eql([
                    ['a','b']
                    ,['a','c']
                ])

            })

        })

    })
    describe('when detecting circular dependencies',function(){
        var sut
            ,mod
        describe('given circular dep',function(){
            beforeEach(function(){
                var include = ['bar','foo']
                var exclude = ['@impl']
                var map = {
                    foo: ['bar']
                    ,bar: ['foo']
                }
                sut = new DependencyGraph(map,include,exclude)
            })
            it('should reject simple circular dep',function(){
                return sut.validate.bind(sut)
                    .should.throw(/Cyclic dependency: "bar"/)
            })

        })
        describe('given special keys',function(){
            it('should ignore them',function(){
                var include = ['bar','foo']
                var exclude = ['@impl']
                var map = {
                    foo: ['bar']
                    ,bar: []
                    ,dec: ['@impl']
                }
                sut = new DependencyGraph(map,include,exclude)
                return sut.validate('foo')
                    .should.be.ok

            })

        })
        describe('given complex circular deps',function(){
            it('should reject them',function(){
                var include = [
                    'foo'
                    ,'bar'
                    ,'ron'
                    ,'john'
                    ,'tom'
                ]
                var exclude = [
                ]
                var map = {
                    foo: ['bar']
                    ,bar: ['ron']
                    ,john: ['bar']
                    ,tom: ['john']
                    ,ron: ['tom']

                }
                sut = new DependencyGraph(map,include,exclude)

                return sut.validate.bind(sut)
                    .should.throw(/Cyclic dependency: "tom"/)
            })
        })
        it('should resolve acyclic deps, appending services without deps',function(){
            var include = [
                'foo'
                ,'bar'
                ,'mee'
            ]
            var exclude = []
            var map = {
                foo: ['bar']
                ,bar: ['mee']
                ,none: []
            }
            sut = new DependencyGraph(map,include,exclude)

            return sut.legal()
                .should.eql(['mee','bar','foo','none'])

        })
    })

})
