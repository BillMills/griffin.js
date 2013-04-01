//the subsystem class from which all subsystems will inherit.
function Subsystem(){
	var that = this;

	//names of things
	this.monitorID = window.parameters.wrapper;		//div ID of wrapper div
	this.linkWrapperID = 'SubsystemLinks';	        //ID of div wrapping subsystem navigation links
	this.sidebarID = 'SubsystemSidebar';			//ID of right sidebar for this object
	this.topNavID = 'SubsystemsButton';				//ID of top level nav button
	this.canvasID = this.name+'Canvas';		        //ID of canvas to draw main view on; this.name defined downstream in prototype chain
    this.subviewLink = this.name+'link';            //ID of inter-subsystem nav button
    this.TTcanvasID = this.name+'TTCanvas';         //ID of hidden tooltip map canvas for main view

    //animation parameters
    this.FPS = 30;
    this.duration = 0.5;
    this.nFrames = this.FPS*this.duration;
    
    //DOM insertions
    //insert nav link
	insertDOM('button', this.name+'link', 'navLink', '', this.linkWrapperID, "javascript:swapFade('"+this.name+"link', window."+this.name+"pointer, window.subsystemScalars, window.subdetectorView)", this.name, '', 'button');
    //scale canvas
	this.monitor = document.getElementById(this.monitorID);
    this.canvasWidth = 0.48*$(this.monitor).width();
    this.canvasHeight = 0.8*$(this.monitor).height();
    //detector view
    insertDOM('canvas', this.canvasID, 'monitor', 'top:' + ($('#'+this.linkWrapperID).height()*1.25 + 5) +'px;', this.monitorID, '', '')
    this.canvas = document.getElementById(this.canvasID);
    this.context = this.canvas.getContext('2d');
    this.canvas.setAttribute('width', this.canvasWidth);
    this.canvas.setAttribute('height', this.canvasHeight);
    //hidden Tooltip map layer
    insertDOM('canvas', this.TTcanvasID, 'monitor', 'top:' + ($('#'+this.linkWrapperID).height()*1.25 + 5) +'px;', this.monitorID, '', '')    
    this.TTcanvas = document.getElementById(this.TTcanvasID);
    this.TTcontext = this.TTcanvas.getContext('2d');
    this.TTcanvas.setAttribute('width', this.canvasWidth);
    this.TTcanvas.setAttribute('height', this.canvasHeight);

    //Dirty trick to implement tooltip on arbitrary geometry: make another canvas of the same size hidden beneath, with the 
    //detector drawn on it, but with each element filled in with rgba(0,0,n,1), where n is the channel number; fetching the color from the 
    //hidden canvas at point x,y will then return the appropriate channel index.
    //paint whole hidden canvas with R!=G!=B to trigger TT suppression:
    this.TTcontext.fillStyle = '#123456';
    this.TTcontext.fillRect(0,0,this.canvasWidth, this.canvasHeight);

    //set up tooltip:
    this.tooltip = new Tooltip(this.canvasID, this.name+'TipText', this.name+'TT', this.monitorID, this.prefix, this.postfix);
    this.tooltip.obj = that;


    //member functions
    //determine which color <scalar> corresponds to
    this.parseColor = function(scalar){

        //how far along the scale are we?  Technically this will produce the wrong color for canvases not currently on display.
        var scale = (scalar - this.minima[window.subdetectorView]) / (this.maxima[window.subdetectorView] - this.minima[window.subdetectorView]);

        //different scales for different meters to aid visual recognition:
        if(window.subdetectorView==0) return scalepickr(scale, 'rainbow');
        else if(window.subdetectorView==1) return scalepickr(scale, 'twighlight');
        else if(window.subdetectorView==2) return scalepickr(scale, 'thermalScope');
    };

}