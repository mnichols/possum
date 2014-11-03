'use strict';

var transaction = stampit()
    .state({
        command: undefined
        ,handler: undefined
    })
    .methods({
        execute: function(context) {
            return this.handler.call(context, this.command.payload)
                .then(function(result){
                    if(self.DEFERRED) {
                        return self
                    }
                    return self.complete()
                })
        }
        ,complete: function(){
            stampit.mixIn(this,{
                IN_PROCESS: false
                ,HANDLED: true
                ,DEFERRED: false
            })
            var e = event({
                topic: EVENTS.HANDLED
                ,payload: this.command.payload
                ,inputType: this.command.inputType
            })
            notify(e)
            return this
        }
        ,defer: function(){
            stampit.mixIn(this, {
                IN_PROCESS: false
                ,HANDLED: false
                ,DEFERRED: true
            })
            var e = event({
                topic: EVENTS.DEFERRED
                ,inputType: this.command.inputType
                ,payload: this.command.payload
            })
            notify(e)
            return this
        }
    })

var unitOfWork = stampit()
    .state({
        command: undefined
        ,current: undefined
    })
    .enclose(function(){
        var transactions = []
            ,current = undefined

        function commit(context) {
            if(transactions.length < 1) {
                current = undefined
                return this
            }
            current = transactions.shift()
            var result = current.execute.call(current, context)
            if(result && result.then) {
                return result.then(commit.bind(this,context))
            }
            return commit.call(this, context)
        }

        this.deferCurrent = function(){
            current.defer()
            return current.command
        }

        this.commit = function(context) {
            //@todo need to get a handle to the collection of handlers

            transactions = states.collect(this.command.inputType, context)
                .map(function(handler){
                    return transaction({
                        command: this.command
                        ,handler: handler
                    })
                },this)

            if(transactions.length < 1) {
                var e = event({
                    topic: EVENTS.NO_HANDLER
                    ,payload: this.command
                })
                notify(e)
                return this
            }
            return commit.call(this,context)
        }
    })
module.exports = stampit()
    .enclose(function(){
        var buffer = []
            ,processing = []
            ;
        function process(context) {
            if(!processing.length) {
                this.unitOfWork = undefined
                return context
            }
            var command = processing.shift()
            this.unitOfWork = unitOfWork({
                command: command
            })
            return this.Promise.resolve(context)
                .then(this.unitOfWork.commit.bind(this.unitOfWork))
                .then(this.processDeferrals.bind(this, command, context ))
                .then(process.bind(this, context))
        }
        stampit.mixIn(this,{
            enqueue: function(msgs) {
                push.apply(buffer,[].concat(msgs))
                return this
            }
            ,process: function(context, messages) {
                messages = (messages || buffer)
                processing = splice.call(messages, 0, messages.length)
                return process.call(this, context)
            }
            ,deferUntilNextHandler: function(){
                push.call(this.deferrals,handlerDeferral({
                    command: this.unitOfWork.deferCurrent()
                }))
                return this
            }
            ,deferUntilTransition: function(state) {
                push.call(this.deferrals,transitionDeferral({
                    command: this.unitOfWork.deferCurrent()
                    ,state: state
                }))
                return this
            }
        })
    })

