DANTE.prototype = Object.create(Subsystem.prototype);

function DANTE(){
    this.name = 'DANTE';
    var that = this;
    this.prefix = window.parameters.DANTEprefix;
    this.postfix = window.parameters.DANTEpostfix;
    Subsystem.call(this);
    this.dataBus = new DANTEDS();
    //make a pointer at window level back to this object, so we can pass by reference to the nav button onclick
    window.DANTEpointer = that;




    //drawing parameters
    this.centerX = this.canvasWidth/2;
    this.centerY = this.canvasHeight/2;
    this.leftRingCenter = this.canvasWidth*0.25;
    this.rightRingCenter = this.canvasWidth*0.75;
    this.ringRadius = this.canvasHeight*0.2;
    this.detectorRadius = this.canvasWidth*0.03;
    this.shieldInnerRadius = this.canvasWidth*0.05;
    this.shieldOuterRadius = this.canvasWidth*0.06;
    this.scaleHeight = 80;

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

    //determine which color <scalar> corresponds to
    this.parseColor = function(scalar, detectorType){

        //how far along the scale are we?
        var scale;
        if(detectorType == 'BaF')
            scale = (scalar - window.parameters.DANTEBaFminima[window.subdetectorView]) / (window.parameters.DANTEBaFmaxima[window.subdetectorView] - window.parameters.DANTEBaFminima[window.subdetectorView]);
        if(detectorType == 'BGO')
            scale = (scalar - window.parameters.DANTEBGOminima[window.subdetectorView]) / (window.parameters.DANTEBGOmaxima[window.subdetectorView] - window.parameters.DANTEBGOminima[window.subdetectorView]);

        //different scales for different meters to aid visual recognition:
        if(window.subdetectorView==0) return scalepickr(scale, 'rainbow');
        else if(window.subdetectorView==1) return scalepickr(scale, 'twighlight');
        else if(window.subdetectorView==2) return scalepickr(scale, 'thermalScope');
    };

    this.animate = function(){
        if(window.onDisplay == this.canvasID || window.freshLoad) animate(this, 0);
        else this.draw(this.nFrames);
    };

    this.drawScale = function(context){
        var i, j; 
        context.clearRect(0, this.canvasHeight - this.scaleHeight, this.canvasWidth, this.canvasHeight);

        var title, BaFminTick, BaFmaxTick, BGOminTick, BGOmaxTick;
        title = window.parameters.monitorValues[window.subdetectorView];
        BaFminTick = 'BaF: ' + window.parameters.DANTEBaFminima[window.subdetectorView] + ' ' + window.parameters.subdetectorUnit[window.subdetectorView];
        BaFmaxTick = 'BaF: ' + window.parameters.DANTEBaFmaxima[window.subdetectorView] + ' ' + window.parameters.subdetectorUnit[window.subdetectorView];
        BGOminTick = 'BGO: ' + window.parameters.DANTEBGOminima[window.subdetectorView] + ' ' + window.parameters.subdetectorUnit[window.subdetectorView];
        BGOmaxTick = 'BGO: ' + window.parameters.DANTEBGOmaxima[window.subdetectorView] + ' ' + window.parameters.subdetectorUnit[window.subdetectorView];

        //titles
        context.fillStyle = '#999999';
        context.font="24px 'Orbitron'";
        context.fillText(title, this.canvasWidth/2 - context.measureText(title).width/2, this.canvasHeight-8);

        //tickmark;
        context.strokeStyle = '#999999';
        context.lineWidth = 1;
        context.font="12px 'Raleway'";

        context.beginPath();
        context.moveTo(this.canvasWidth*0.05+1, this.canvasHeight - 40);
        context.lineTo(this.canvasWidth*0.05+1, this.canvasHeight - 30);
        context.stroke();
        context.fillText(BaFminTick, this.canvasWidth*0.05 - context.measureText(BaFminTick).width/2, this.canvasHeight-15);
        context.fillText(BGOminTick, this.canvasWidth*0.05 - context.measureText(BGOminTick).width/2, this.canvasHeight-3);

        context.beginPath();
        context.moveTo(this.canvasWidth*0.95-1, this.canvasHeight - 40);
        context.lineTo(this.canvasWidth*0.95-1, this.canvasHeight - 30); 
        context.stroke();      
        context.fillText(BaFmaxTick, this.canvasWidth*0.95 - context.measureText(BaFmaxTick).width/2, this.canvasHeight-15);
        context.fillText(BGOmaxTick, this.canvasWidth*0.95 - context.measureText(BGOmaxTick).width/2, this.canvasHeight-3);

        for(i=0; i<3000; i++){
            if(window.subdetectorView == 0) context.fillStyle = scalepickr(0.001*(i%1000), 'rainbow');
            if(window.subdetectorView == 1) context.fillStyle = scalepickr(0.001*(i%1000), 'twighlight');
            if(window.subdetectorView == 2) context.fillStyle = scalepickr(0.001*(i%1000), 'thermalScope');
            context.fillRect(this.canvasWidth*0.05 + this.canvasWidth*0.9/1000*(i%1000), this.canvasHeight-60, this.canvasWidth*0.9/1000, 20);
        }

    };

    //do an initial populate:
    this.update();
}