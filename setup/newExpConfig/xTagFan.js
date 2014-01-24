/*
x-tag for making a fan of options - choosing one hides the rest, unchoosing it re-reveals all options
hacks: 
1.  x-blade dimensions are fixed in css for transitions
*/

(function(){  

    xtag.register('x-fan', {
        lifecycle: {
            created: function() {
                //the fan starts life unlocked and not knowing what it wants:
                this.buffer = { 'selected' : null,
                                'locked' : false};
            },
            inserted: function() {},
            removed: function() {},
            attributeChanged: function() {}
        }, 
        events: { 

        },
        accessors: {
            //selected attribute indicates what choice, if any, has been made for the fan
            'selected':{ 
                get: function(){
                    return this.buffer.selected
                },

                set: function(value){
                    //if the fan is locked, bail out instantly:
                    if(this.buffer.locked) return;

                    if(this.buffer.selected != value){
                        //a new blade has been chosen - fade the other ones out.
                        var i;

                        //register the set value in buffer.selected
                        this.buffer.selected = value;

                        for(i=0; i<this.childNodes.length; i++){
                            //hide all the other blades by setting thier class to 'hidden'
                            if(this.childNodes[i].id != value && this.childNodes[i].tagName == 'X-BLADE')
                                this.childNodes[i].className = 'hidden';
                            //highlight the chosen blade with the 'chosen' class, and call its set callback.
                            else if(this.childNodes[i].id == value && this.childNodes[i].tagName == 'X-BLADE'){
                                this.childNodes[i].className = 'chosen';
                                this.childNodes[i].setCallback;
                            }
                        }
    
                    } else{
                        //return the fan to an agnostic state:
                        this.buffer.selected = null;

                        //blade is being unselected - present all blades by removing special classes
                        for(i=0; i<this.childNodes.length; i++){
                            if(this.childNodes[i].tagName == 'X-BLADE'){
                                this.childNodes[i].className = '';
                                this.childNodes[i].style = '';
                                this.childNodes[i].style.overflow = 'visible';
                                //call the unset callback for the blade being deselected
                                if(this.childNodes[i].id == value)
                                    this.childNodes[i].unsetCallback;
                            }
                        }                        
                    }                    
                }
            },

            //if true, don't allow this fan to change its state
            'locked':{
                get: function(){
                    return this.buffer.locked;
                },

                set: function(value){
                    this.buffer.locked = value;
                }
            }
        }, 
        methods: {

        }
    });

})();

(function(){  

    xtag.register('x-blade', {
        lifecycle: {
            created: function() {
                this.buffer = {};
            },
            inserted: function() {},
            removed: function() {},
            attributeChanged: function() {}
        }, 
        events: { 
            click: function(){
                //set the fan's selected id - triggers all transition animations and set / unset callbacks
                this.parentNode.selected = this.id;
            },

            webkitTransitionEnd: function(){
                if(this.className == 'hidden'){
                    this.style.overflow = 'hidden'
                }
            }
        },
        accessors: {
            'setCallback' : {
                get : function(){
                    if(this.buffer.setCallback)
                        this.buffer.setCallback();
                },

                set : function(value){
                    this.buffer.setCallback = value;
                }
            },
            'unsetCallback' : {
                get : function(){
                    if(this.buffer.unsetCallback)
                        this.buffer.unsetCallback();
                },

                set : function(value){
                    this.buffer.unsetCallback = value;
                }
            }

        }, 
        methods: {

        }
    });

})();

//x-altmodal inspired by x-tags x-modal, but less fancy & easier to make work :)
(function(){  

    xtag.register('x-altmodal', {
        lifecycle: {
            created: function() {
                var that = this;
                //starts life asleep:
                this.buffer = {'active' : false};
                //has its dismiss button living inside it:
                this.innerHTML += '<button id="'+this.id+'Dismiss", class="altmodalDismiss">Dismiss</button>'
                document.getElementById(this.id+'Dismiss').onclick = function(){
                    that.active = false;
                }
            },
            inserted: function() {

            },
            removed: function() {},
            attributeChanged: function() {}
        }, 
        events: { 
            click: function(){
                //set the fan's selected id - triggers all transition animations and set / unset callbacks
                this.parentNode.selected = this.id;
            },

            webkitTransitionEnd: function(){
                if(this.className == 'hiddenModal'){
                    this.style.zIndex = -1000;
                } else if(this.className == 'activeModal'){
                    this.style.zIndex = 1000;
                }
            }
        },
        accessors: {
            'active' : {
                get : function(){
                    return this.buffer.active;
                },

                set : function(value){
                    this.buffer.active = value;
                    if(this.buffer.active)
                        this.className = 'activeModal';
                    else 
                        this.className = 'hiddenModal';
                }
            },
        }, 
        methods: {
        }
    });
})();