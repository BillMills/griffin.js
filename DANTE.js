function DANTE(){
	this.monitorID = window.parameters.wrapper;  //div ID of wrapper div
	this.canvasID = 'DANTECanvas'; 			     //ID of canvas to draw top level TIGRESS view on
    this.linkWrapperID = 'SubsystemLinks';       //ID of div wrapping subsystem navigation links
    this.sidebarID = 'SubsystemSidebar';         //ID of right sidebar for this object
    this.topNavID = 'SubsystemsButton';          //ID of top level nav button
    this.TTcanvasID = 'DANTETTCanvas';           //ID of hidden tooltip map canvas
    this.minima = window.parameters.DANTEminima; //array of meter minima [HV, thresholds, rate]
    this.maxima = window.parameters.DANTEmaxima; //array of meter maxima, arranged as minima
    this.dataBus = new DANTEDS();

    var that = this;
    //make a pointer at window level back to this object, so we can pass by reference to the nav button onclick
    window.DANTEpointer = that;

    //establish animation parameters////////////////////////////////////////////////////////////////////
    this.FPS = 30;
    this.duration = 0.5;
    this.nFrames = this.FPS*this.duration;

    //insert nav link
    insertButton('DANTElink', 'navLink', "javascript:swapFade('DANTElink', window.DANTEpointer, window.subsystemScalars, window.subdetectorView)", this.linkWrapperID, 'DANTE');
    
    //insert & scale canvas//////////////////////////////////////////////////////////////////////////////////////
    this.monitor = document.getElementById(this.monitorID);
    this.canvasWidth = 0.48*$(this.monitor).width();
    this.canvasHeight = 0.8*$(this.monitor).height();
    //detector view
    insertCanvas(this.canvasID, 'monitor', 'top:' + ($('#SubsystemLinks').height()*1.25 + 5) +'px;', this.canvasWidth, this.canvasHeight, this.monitorID);
    this.canvas = document.getElementById(this.canvasID);
    this.context = this.canvas.getContext('2d');
    //hidden Tooltip map layer
    insertCanvas(this.TTcanvasID, 'monitor', 'top:' + ($('#SubsystemLinks').height()*1.25 + 5) +'px;', this.canvasWidth, this.canvasHeight, this.monitorID);
    this.TTcanvas = document.getElementById(this.TTcanvasID);
    this.TTcontext = this.TTcanvas.getContext('2d');

    //Dirty trick to implement tooltip on obnoxious geometry: make another canvas of the same size hidden beneath, with the 
    //detector drawn on it, but with each element filled in with rgba(0,0,n,1), where n is the channel number; fetching the color from the 
    //hidden canvas at point x,y will then return the appropriate channel index.
    //paint whole hidden canvas with R!=G!=B to trigger TT suppression:
    this.TTcontext.fillStyle = 'rgba(50,100,150,1)';
    this.TTcontext.fillRect(0,0,this.canvasWidth, this.canvasHeight);
    //set up tooltip:
    this.tooltip = new Tooltip(this.canvasID, 'DANTETipText', 'DANTEttCanv', 'DANTETT', this.monitorID, window.parameters.DANTEprefix, window.parameters.DANTEpostfix);
    this.tooltip.obj = that;

    //drawing parameters
    this.centerX = this.canvasWidth/2;
    this.centerY = this.canvasHeight/2;
    this.leftRingCenter = this.canvasWidth*0.25;
    this.rightRingCenter = this.canvasWidth*0.75;
    this.ringRadius = this.canvasHeight*0.2;
    this.detectorRadius = this.canvasWidth*0.03;
    this.shieldInnerRadius = this.canvasWidth*0.05;
    this.shieldOuterRadius = this.canvasWidth*0.06;

    //establish data buffers////////////////////////////////////////////////////////////////////////////
    this.HVcolor = [];
    this.oldHVcolor = [];
    this.thresholdColor = [];
    this.oldThresholdColor = [];
    this.rateColor = [];
    this.oldRateColor = [];

    //member functions///////////////////////////////////////////////////////////////////
    //decide which view to transition to when this object is navigated to
    this.view = function(){
        return this.canvasID;
    }

    this.draw = function(frame){

    	var j, ringCenter, x0, y0;
    	this.context.strokeStyle = '#999999';

    	this.context.beginPath();
    	this.context.arc(this.leftRingCenter, this.canvasHeight*0.4, this.ringRadius, 0, 2*Math.PI);
    	this.context.stroke();
    	this.context.beginPath();
    	this.context.arc(this.rightRingCenter, this.canvasHeight*0.4, this.ringRadius, 0, 2*Math.PI);
    	this.context.stroke();

        //once for the display canvas....
    	for(j=0; j<8; j++){
    		if(j<4) ringCenter = this.leftRingCenter;
    		else ringCenter = this.rightRingCenter;

    		x0 = ringCenter + this.ringRadius*Math.cos(Math.PI/2*j);
    		y0 = this.canvasHeight*0.4 - this.ringRadius*Math.sin(Math.PI/2*j);

            //suppressors
            if(window.subdetectorView == 0) this.context.fillStyle = interpolateColor(parseHexColor(this.oldHVcolor[j*2+1]), parseHexColor(this.HVcolor[j*2+1]), frame/this.nFrames);
            else if(window.subdetectorView == 1) this.context.fillStyle = interpolateColor(parseHexColor(this.oldThresholdColor[j*2+1]), parseHexColor(this.thresholdColor[j*2+1]), frame/this.nFrames);
            else if(window.subdetectorView == 2) this.context.fillStyle = interpolateColor(parseHexColor(this.oldRateColor[j*2+1]), parseHexColor(this.rateColor[j*2+1]), frame/this.nFrames);
    		this.context.beginPath();
    		this.context.arc(x0,y0,this.shieldOuterRadius,0,2*Math.PI);
    		this.context.closePath();
    		this.context.fill();
    		this.context.stroke();

    		this.context.fillStyle = '#333333';
    		this.context.beginPath();
    		this.context.arc(x0,y0,this.shieldInnerRadius,0,2*Math.PI);
    		this.context.closePath();
    		this.context.fill();
    		this.context.stroke();

            //inner detectors
            if(window.subdetectorView == 0) this.context.fillStyle = interpolateColor(parseHexColor(this.oldHVcolor[j*2]), parseHexColor(this.HVcolor[j*2]), frame/this.nFrames);
            else if(window.subdetectorView == 1) this.context.fillStyle = interpolateColor(parseHexColor(this.oldThresholdColor[j*2]), parseHexColor(this.thresholdColor[j*2]), frame/this.nFrames);
            else if(window.subdetectorView == 2) this.context.fillStyle = interpolateColor(parseHexColor(this.oldRateColor[j*2]), parseHexColor(this.rateColor[j*2]), frame/this.nFrames);
    		this.context.beginPath();
    		this.context.arc(x0,y0,this.detectorRadius,0,2*Math.PI);
    		this.context.closePath();
    		this.context.fill();    		
    		this.context.stroke();
    	}
        //....and again for the tooltip encoding
        for(j=0; j<8; j++){
            if(j<4) ringCenter = this.leftRingCenter;
            else ringCenter = this.rightRingCenter;

            x0 = ringCenter + this.ringRadius*Math.cos(Math.PI/2*j);
            y0 = this.canvasHeight*0.4 - this.ringRadius*Math.sin(Math.PI/2*j);

            //hack around to defeat antialiasing problems, fix once there's an option to suppress aa
            this.TTcontext.fillStyle = '#123456';
            this.TTcontext.beginPath();
            this.TTcontext.arc(x0,y0,1.05*this.shieldOuterRadius,0,2*Math.PI);
            this.TTcontext.closePath();
            this.TTcontext.fill();
            //end hack around 
            this.TTcontext.fillStyle = 'rgba('+(2*j+1)+','+(2*j+1)+','+(2*j+1)+',1)';
            this.TTcontext.beginPath();
            this.TTcontext.arc(x0,y0,this.shieldOuterRadius,0,2*Math.PI);
            this.TTcontext.closePath();
            this.TTcontext.fill();

            this.TTcontext.fillStyle = '#123456';
            this.TTcontext.beginPath();
            this.TTcontext.arc(x0,y0,this.shieldInnerRadius,0,2*Math.PI);
            this.TTcontext.closePath();
            this.TTcontext.fill();

            this.TTcontext.fillStyle = 'rgba('+(2*j)+','+(2*j)+','+(2*j)+',1)';
            this.TTcontext.beginPath();
            this.TTcontext.arc(x0,y0,this.detectorRadius,0,2*Math.PI);
            this.TTcontext.closePath();
            this.TTcontext.fill();            
        }
		
    	//titles
        this.context.clearRect(0,0.75*this.canvasHeight,this.canvasWidth,0.35*this.canvasHeight);
        this.context.fillStyle = '#999999';
        this.context.font="24px 'Orbitron'";
        this.context.fillText('West Ring', this.leftRingCenter - this.context.measureText('West Ring').width/2, 0.8*this.canvasHeight);
        this.context.fillText('East Ring', this.rightRingCenter - this.context.measureText('East Ring').width/2, 0.8*this.canvasHeight);

    };

    this.findCell = function(x, y){
        var imageData = this.TTcontext.getImageData(x,y,1,1);
        var index = -1;
        if(imageData.data[0] == imageData.data[1] && imageData.data[0] == imageData.data[2]) index = imageData.data[0];
        return index;
    };

    this.defineText = function(cell){
        var toolTipContent = '<br>';
        var nextLine;
        var longestLine = 0;
        var cardIndex;
        var i;

        nextLine = 'Channel '+cell;

        //keep track of the longest line of text:
        longestLine = Math.max(longestLine, this.tooltip.context.measureText(nextLine).width)
        toolTipContent += nextLine;

        document.getElementById(this.tooltip.ttTextID).innerHTML = toolTipContent;

        //return length of longest line:
        return longestLine;
    };

    this.update = function(){
        var i;

        //get new data
        this.fetchNewData();

        //parse the new data into colors
        for(i=0; i<this.dataBus.HV.length; i++){
            this.oldHVcolor[i] = this.HVcolor[i];
            this.HVcolor[i] = this.parseColor(this.dataBus.HV[i]);
        }
        for(i=0; i<this.dataBus.thresholds.length; i++){
            this.oldThresholdColor[i] = this.thresholdColor[i];
            this.thresholdColor[i] = this.parseColor(this.dataBus.thresholds[i]);
        }
        for(i=0; i<this.dataBus.rate.length; i++){
            this.oldRateColor[i] = this.rateColor[i];
            this.rateColor[i] = this.parseColor(this.dataBus.rate[i]);
        }

        this.tooltip.update();
    };

    this.fetchNewData = function(){
        var i;

        //dummy data:
        for(i=0; i<16; i++){
            this.dataBus.HV[i] = Math.random();
            this.dataBus.thresholds[i] = Math.random();
            this.dataBus.rate[i] = Math.random();
        }

    };

    //determine which color <scalar> corresponds to
    this.parseColor = function(scalar){

        //how far along the scale are we?
        var scale = (scalar - this.minima[window.subdetectorView]) / (this.maxima[window.subdetectorView] - this.minima[window.subdetectorView]);

        //different scales for different meters to aid visual recognition:
        return colorScale(window.colorScales[window.subdetectorView],scale);
    };

    this.animate = function(force){
        if(window.onDisplay == this.canvasID || !force) animate(this, 0);
        else this.draw(this.nFrames);
    };

    //do an initial populate:
    this.update();
}