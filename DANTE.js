DANTE.prototype = Object.create(Subsystem.prototype);

function DANTE(){
    //detector name, self-pointing pointer, pull in the Subsystem template, 
    //establish a databus and create a global-scope pointer to this object:
    this.name = 'DANTE';
    var that = this;
    Subsystem.call(this);
    this.dataBus = new DANTEDS();
    //make a pointer at window level back to this object, so we can pass by reference to the nav button onclick
    window.DANTEpointer = that;

    //member variables///////////////////////////////////


    //set up scale adjust dialog:
    this.canvas.onclick = function(event){
        var y = event.pageY - that.canvas.offsetTop - that.monitor.offsetTop;
        if(y > that.canvasHeight - that.scaleHeight)
            parameterDialogue([['BaF', window.parameters[that.name].minima['BaF'], window.parameters[that.name].maxima['BaF']], ['BGO', window.parameters[that.name].minima['BGO'], window.parameters[that.name].maxima['BGO']]]);
    }

    //drawing parameters/////////////////////////////////
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
		
        if(frame==this.nFrames || frame==0) {
            //scale
            this.drawScale(this.context);
    	    //titles
            this.context.clearRect(0,0.75*this.canvasHeight,this.canvasWidth,0.25*this.canvasHeight - this.scaleHeight);
            this.context.fillStyle = '#999999';
            this.context.font="24px 'Orbitron'";
            this.context.fillText('West Ring', this.leftRingCenter - this.context.measureText('West Ring').width/2, 0.8*this.canvasHeight);
            this.context.fillText('East Ring', this.rightRingCenter - this.context.measureText('East Ring').width/2, 0.8*this.canvasHeight);
        }

    };

    this.defineText = function(cell){
        var toolTipContent = '<br>';
        var nextLine;
        var cardIndex;
        var i;

        nextLine = 'Channel '+cell;
        toolTipContent += nextLine;

        toolTipContent += '<br><br>';
        document.getElementById(this.tooltip.ttDivID).innerHTML = toolTipContent;

        return 0;
    };

    this.update = function(){
        var i;

        //get new data
        this.fetchNewData();

        var detectorType;
        //parse the new data into colors
        for(i=0; i<this.dataBus.HV.length; i++){
            if(i%2 == 0) detectorType = 'BaF';
            else detectorType = 'BGO';
            this.oldHVcolor[i] = this.HVcolor[i];
            this.HVcolor[i] = this.parseColor(this.dataBus.HV[i], detectorType);
            this.oldThresholdColor[i] = this.thresholdColor[i];
            this.thresholdColor[i] = this.parseColor(this.dataBus.thresholds[i], detectorType);
            this.oldRateColor[i] = this.rateColor[i];
            this.rateColor[i] = this.parseColor(this.dataBus.rate[i], detectorType);
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

    //do an initial populate:
    this.update();
}