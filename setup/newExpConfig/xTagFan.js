/*
x-tag for making a fan of options - choosing one hides the rest, unchoosing it re-reveals all options
hacks: 
1.  x-blade dimensions are fixed in css for transitions
2.  callbacks only apply to setting the choice of x-blade; unsetting is assumed to just return to the original state.
*/

(function(){  

    xtag.register('x-fan', {
        lifecycle: {
            created: function() {
                this.buffer = {};
            },
            inserted: function() {},
            removed: function() {},
            attributeChanged: function() {}
        }, 
        events: { 

        },
        accessors: {
            'selected':{ 
                get: function(){
                    return this.buffer.selected
                },

                set: function(value){
                    if(this.buffer.selected != value){
                        //a new blade has been chosen - fade the other ones out.
                        var i;

                        for(i=0; i<this.childNodes.length; i++){
                            if(this.childNodes[i].id != value && this.childNodes[i].tagName == 'X-BLADE')
                                this.childNodes[i].className = 'hidden';
                            else{
                                this.childNodes[i].className = 'chosen';
                                this.childNodes[i].callback;
                            }
                        }

                        this.buffer.selected = value;    
                    } else{
                        //this blade is unselected - present all blades

                        for(i=0; i<this.childNodes.length; i++){
                            this.childNodes[i].className = '';
                            this.childNodes[i].style = '';
                            this.childNodes[i].style.overflow = 'visible';
                        }                        

                        this.buffer.selected = null;
                    }                    
                }
                
            },
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
                //set the fan's selected id:
                this.parentNode.selected = this.id;
            },

            webkitTransitionEnd: function(){
                if(this.className == 'hidden'){
                    this.style.overflow = 'hidden'
                }
            }
        },
        accessors: {
            'callback' : {
                get : function(){
                    if(this.buffer.callback)
                        this.buffer.callback();
                },

                set : function(value){
                    this.buffer.callback = value;
                }
            }

        }, 
        methods: {

        }
    });

})();