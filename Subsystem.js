//the subsystem object from which all subsystems will inherit.
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

    //other member data
    this.prefix = window.parameters[this.name].prefix;
    this.postfix = window.parameters[this.name].postfix;

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

    //what fraction of the canvas does the scale take up?  need this for onclick behavior:
    this.scaleHeight = this.canvasHeight*0.2;

    //member functions
    //determine which color <scalar> corresponds to
    this.parseColor = function(scalar, detector){

        //how far along the scale are we?  Technically this will produce the wrong color for canvases not currently on display.
        var scale = (scalar - window.parameters[this.name].minima[detector][window.subdetectorView]) / (window.parameters[this.name].maxima[detector][window.subdetectorView] - window.parameters[this.name].minima[detector][window.subdetectorView]);

        //different scales for different meters to aid visual recognition:
        if(window.subdetectorView==0) return scalepickr(scale, 'rainbow');
        else if(window.subdetectorView==1) return scalepickr(scale, 'twighlight');
        else if(window.subdetectorView==2) return scalepickr(scale, 'thermalScope');
    };

    //draw the color scale
    this.drawScale = function(context, frame){
        var i, j, key;
        var scaleFraction = 0.8  //fraction of canvas to span with the scale
        //clear the scale region
        context.clearRect(0, this.canvasHeight - this.scaleHeight, this.canvasWidth, this.canvasHeight);

        //compressed unit for scales, as a function of window.subdetectorView:
        var scaleUnit = [' k', String.fromCharCode(2406)+'10'+String.fromCharCode(179)+' ', ' k']

        var minTicks = [];
        var maxTicks = [];
        title = window.parameters.monitorValues[window.subdetectorView];
        for(key in window.parameters[this.name].minima){
            //minimas
            if(window.parameters[this.name].minima[key][window.subdetectorView] < 1000) minTicks[key] = key+': ' + window.parameters[this.name].minima[key][window.subdetectorView] + ' ' + window.parameters.subdetectorUnit[window.subdetectorView];
            else minTicks[key] = key + ': ' + window.parameters[this.name].minima[key][window.subdetectorView]/1000 + scaleUnit[window.subdetectorView] + window.parameters.subdetectorUnit[window.subdetectorView];
            //maximas:
            if(window.parameters[this.name].maxima[key][window.subdetectorView] < 1000) maxTicks[key] = key+': ' + window.parameters[this.name].maxima[key][window.subdetectorView] + ' ' + window.parameters.subdetectorUnit[window.subdetectorView];
            else maxTicks[key] = key + ': ' + window.parameters[this.name].maxima[key][window.subdetectorView]/1000 + scaleUnit[window.subdetectorView] + window.parameters.subdetectorUnit[window.subdetectorView];
        }

        //titles
        context.fillStyle = '#999999';
        context.font="24px 'Orbitron'";
        context.fillText(title, this.canvasWidth/2 - context.measureText(title).width/2, this.canvasHeight*0.95);

        //tickmark;
        context.strokeStyle = '#999999';
        context.lineWidth = 1;
        context.font="12px 'Raleway'";

        //min tick
        context.beginPath();
        context.moveTo(this.canvasWidth*(1-scaleFraction)/2+1, this.canvasHeight - this.scaleHeight/2);
        context.lineTo(this.canvasWidth*(1-scaleFraction)/2+1, this.canvasHeight - this.scaleHeight/2 + 10);
        context.stroke();
        i=0;
        for(key in window.parameters[this.name].minima){
            context.fillText(minTicks[key], this.canvasWidth*(1-scaleFraction)/2 - context.measureText(minTicks[key]).width/2, this.canvasHeight-this.scaleHeight/2 + 25+12*i);
            i++;
        }

        //max tick
        context.beginPath();
        context.moveTo(this.canvasWidth*(1-(1-scaleFraction)/2)-1, this.canvasHeight - this.scaleHeight/2);
        context.lineTo(this.canvasWidth*(1-(1-scaleFraction)/2)-1, this.canvasHeight - this.scaleHeight/2 + 10); 
        context.stroke();
        i=0;
        for(key in window.parameters[this.name].minima){
            context.fillText(maxTicks[key], this.canvasWidth*(1-(1-scaleFraction)/2) - context.measureText(maxTicks[key]).width/2, this.canvasHeight-this.scaleHeight/2 + 25+12*i);
            i++;
        }

        var colorSteps = 150
        for(i=0; i<3*colorSteps; i++){
            if(window.subdetectorView == 0) context.fillStyle = scalepickr((i%colorSteps)/colorSteps, 'rainbow');
            if(window.subdetectorView == 1) context.fillStyle = scalepickr((i%colorSteps)/colorSteps, 'twighlight');
            if(window.subdetectorView == 2) context.fillStyle = scalepickr((i%colorSteps)/colorSteps, 'thermalScope');
            context.fillRect(this.canvasWidth*(1-scaleFraction)/2 + this.canvasWidth*scaleFraction/colorSteps*(i%colorSteps), this.canvasHeight-this.scaleHeight/2-20, this.canvasWidth*scaleFraction/colorSteps, 20);
        }

    };

    //decide which view to transition to when this object is navigated to
    this.view = function(){
        return this.canvasID;
    };

    //determine the cell index at canvas position x, y
    this.findCell = function(x, y){
        var imageData = this.TTcontext.getImageData(x,y,1,1);
        var index = -1;
        if(imageData.data[0] == imageData.data[1] && imageData.data[0] == imageData.data[2]) index = imageData.data[0];
        return index;
    };

    //manage animation
    this.animate = function(){
        if(window.onDisplay == this.canvasID || window.freshLoad) animate(this, 0);
        else this.draw(this.nFrames);
    };

}

//another object to inject into subsystems that need a detail-level view:
function DetailView(){
    this.detailCanvasID = this.name+'detailCanvas';       //ID of canvas to draw single HPGe view on
    this.TTdetailCanvasID = this.name+'TTdetailCanvas';   //ID of hidden tooltip map canvas for detail level

    //insert & scale canvas
    insertDOM('canvas', this.detailCanvasID, 'monitor', 'top:' + ($('#'+this.linkWrapperID).height()*1.25 + 5) +'px; transition:opacity 0.5s, z-index 0.5s; -moz-transition:opacity 0.5s, z-index 0.5s; -webkit-transition:opacity 0.5s, z-index 0.5s;', this.monitorID, '', '');
    this.detailCanvas = document.getElementById(this.detailCanvasID);
    this.detailContext = this.detailCanvas.getContext('2d');
    this.detailCanvas.setAttribute('width', this.canvasWidth);
    this.detailCanvas.setAttribute('height', this.canvasHeight);
    //hidden Tooltip map layer for detail
    insertDOM('canvas', this.TTdetailCanvasID, 'monitor', 'top:' + ($('#'+this.linkWrapperID).height()*1.25 + 5) +'px;', this.monitorID, '', '')
    this.TTdetailCanvas = document.getElementById(this.TTdetailCanvasID);
    this.TTdetailContext = this.TTdetailCanvas.getContext('2d');
    this.TTdetailCanvas.setAttribute('width', this.canvasWidth);
    this.TTdetailCanvas.setAttribute('height', this.canvasHeight);

    //member functions
    //decide which view to transition to when this object is navigated to; overwrites equivalent in Subsystem.
    this.view = function(){
        if(this.detailShowing == 0)
            return this.canvasID;
        else if(this.detailShowing == 1)
            return this.detailCanvasID;
    };

    //determine the cell index at canvas position x, y; overwrites equivalent in Subsystem.
    this.findCell = function(x, y){
        var imageData 
        if(this.detailShowing){
            imageData = this.TTdetailContext.getImageData(x,y,1,1);
        } else{
            imageData = this.TTcontext.getImageData(x,y,1,1);
        }
        var index = -1;
        if(imageData.data[0] == imageData.data[1] && imageData.data[0] == imageData.data[2]) index = imageData.data[0];

        return index;
    };

    //manage animation
    this.animate = function(){
        if(window.onDisplay == this.canvasID || window.freshLoad) animate(this, 0);
        else this.draw(this.nFrames);
        if(window.onDisplay == this.detailCanvasID || window.freshLoad) animateDetail(this, 0);
        else this.drawDetail(this.detailContext, this.nFrames);
    };

    //decide which display version to show:
    this.displaySwitch = function(){
        this.TTdetailContext.fillStyle = 'rgba(50,100,150,1)';
        this.TTdetailContext.fillRect(0,0,this.canvasWidth,this.canvasHeight);
        this.drawDetail(this.detailContext, this.nFrames);
        this.drawDetail(this.TTdetailContext, this.nFrames);
    };
}












