var possum = require('possum')
var log = console.log.bind(console)

//DOM elements
var playerElm = document.querySelector('.player')
var controls = {
    pullTrigger: document.querySelector('.pull-trigger')
    ,load: document.querySelector('.load')
    ,aim: document.querySelector('.aim')
    ,liftNeedle: document.querySelector('.lift-needle')
    ,initialize: document.querySelector('.initialize')
    ,reload: document.querySelector('.reload')
}

//dependency. a fake record player that performs actions asynchronously
var recordPlayer = {
    returnArm: function(){
        return Promise.resolve()
            .then(function(){
                playerElm.innerHTML = 'Arm returned'
            })
    }
    ,play: function(song) {
        return Promise.resolve(song)
            .then(function(it){
                playerElm.innerHTML = 'Playing : ' + song
            })
    }
    ,hoverNeedleOver: function(song) {
        return Promise.resolve(song)
            .then(function(it){
                playerElm.innerHTML = 'Hovering Needle over :' + song
            })
    }
    ,turnOn: function(){
        return Promise.resolve()
            .then(function(){
                playerElm.innerHTML = 'Turned On'
            })
    }
    ,spinRecord: function(){
        playerElm.innerHTML = 'Platter Spin starting...'
        return new Promise(function(resolve){
            setTimeout(function(){
                playerElm.innerHTML = 'Platter Spinning!'
                resolve('done')
            },1000)
        })
    }

}

//define our state machine spec
var gun = {
    namespace: 'kiss'
    ,initialState: 'uninitialized'
    ,enable: function(actions) {
        Object.keys(controls).forEach(function(key){
            controls[key].setAttribute('disabled','disabled')
        })
        if(!actions || !actions.length) {
            return
        }
        actions.forEach(function(action){
            controls[action].removeAttribute('disabled')
        })
    }
    ,states: {
        'uninitialized': {
            _onEnter: function(){
                this.enable(['initialize'])
                return this.recordPlayer.turnOn()
            }
            ,'initialize': function(args) {
                return this.recordPlayer.spinRecord()
                    .then(this.transition.bind(this,'initialized'))
            }
        }
        ,'initialized': {
            _onEnter: function(){
                this.enable(['pullTrigger','load'])
            }
            ,'pullTrigger': function() {
                this.deferUntilTransition('aimed')
            }
            ,'load': function(args) {
                this.deferUntilTransition('loading')
                return this.transition('loading')
            }
        }
        ,'loading': {
            _onEnter: function(){
                this.enable(['load'])
            }
            ,'load': function(args) {
                this.loadWeapon(args && args.bullets)
                return this.transition('loaded')
            }
            ,'reload': function() {
                return this.handle('load')
            }
        }
        ,'loaded': {
            _onEnter: function(){
                document.querySelector('.remaining').innerHTML = ''
                this.enable(['aim'])
            }
            ,'aim': function(args) {
                this.song = (args && args.target) || this.bullets.shift()
                this.recordPlayer.hoverNeedleOver(this.song)
                return this.transition('aimed')
            }
        }
        ,'aimed':{
            _onEnter: function(){
                this.enable(['pullTrigger'])
            }
            ,'pullTrigger': function() {
                return this.fire()
                    .then(this.transition.bind(this,'smoking'))
            }
        }
        ,'smoking': {
            _onEnter: function(){
                console.log('light cigarette, sit back and relax')
                this.enable(['liftNeedle'])
            }
            ,'aim': function(args){
                this.deferUntilNextHandler()
                return this.handle('liftNeedle')
            }
            ,'liftNeedle': function(){
                if(this.bullets.length) {
                    return this.transition('loaded')
                }
                return this.transition('emptied')
            }
        }
        ,'emptied': {
            _onEnter: function(){
                this.enable(['reload'])
                return this.handle('aim')
            }
            ,'aim': function(args){
                return this.recordPlayer.returnArm()
            }
            ,'reload': function(){
                this.deferUntilTransition('loading')
                return this.transition('loading')
            }
        }
    }
    ,loadWeapon: function(bullets){
        return this.bullets = bullets || [
            'I Stole Your Love'
            ,'Shock Me'
            ,'Love Gun'
        ]
    }
    ,fire: function(){
        //asynchronous, returns a Promise
        return this.recordPlayer.play(this.song)
            .bind(this)
            .then(function(result){
                var msg = 'No more songs remaining'
                if(this.bullets.length) {
                    msg = 'Songs Remaining:' + this.bullets.join(', ')
                }

                document.querySelector('.remaining').innerHTML = msg
                return result
            })
    }
}

var model = possum(gun)
    .state({
        recordPlayer: recordPlayer
        ,bullets: []
    })
    .create()

model.on('transitioned',function(e){
    document.querySelector('.state')
        .innerHTML = model.state
})
model.start().then(function(){
    model.state === 'uninitialized'
    Object.keys(controls).forEach(function(key){
        var ctrl = controls[key]
        ctrl.addEventListener('click',function(e){
            console.log('clicked',key)
            model.handle(key)
        })

    })
})


