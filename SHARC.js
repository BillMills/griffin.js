SHARC.prototype = Object.create(Subsystem.prototype);
function SHARC(){
    //basic plumbing:
    this.name = 'SHARC';                //name prefix
    var that = this;                    //pointer to self
    Subsystem.call(this);               //inject Subsystem attributes
    window.SHARCpointer = that;         //send a pointer to SHARC up to global scope
    this.dataBus = new SHARCDS();       //build the data structure to manage SHARC's info
    DetailView.call(this);              //inject the infrastructure for a detail level view

    //member variables////////////////////
    this.padsEnabled = 0;               //are the pads present?
    this.detailShowing = 0;             //is the detail view on display?

    //drawing parameters//////////////////


    //member functions////////////////////

    //draw the summary view
    this.draw = function(frame){
        this.context.fillRect(0,0,100,100)
    };

    this.drawDetail = function(frame){

    }

    //define the tooltip text
    this.defineText = function(cell){

    };

    //get new data
    this.fetchNewData = function(){
        var key, normalization;

        //zero out the summary:
        for(key in this.dataBus.summary){
            if(this.dataBus.summary.hasOwnProperty(key)){
                this.dataBus.summary[key].HV = 0;
                this.dataBus.summary[key].threshold = 0;
                this.dataBus.summary[key].rate = 0;
            }
        }

        //fetch data, plug into detail level and increment summary cells:
        for(key in this.dataBus.SHARC){
            if(window.JSONPstore['thresholds']){
                if(window.JSONPstore['thresholds'][key]){
                    this.dataBus.SHARC[key]['threshold'] = window.JSONPstore['thresholds'][key];
                    this.dataBus.summary[key.slice(0,5)].threshold += window.JSONPstore['thresholds'][key];
                } else
                    this.dataBus.SHARC[key]['threshold'] = 0xDEADBEEF;
            }

            if(window.JSONPstore['scalar']){
                if(window.JSONPstore['scalar'][key]){
                    this.dataBus.SHARC[key]['rate'] = window.JSONPstore['scalar'][key]['TRIGREQ'];
                    this.dataBus.summary[key.slice(0,5)].rate += window.JSONPstore['scalar'][key]['TRIGREQ'];
                } else 
                    this.dataBus.SHARC[key]['rate'] = 0xDEADBEEF;
            }
        }

        //average the summary level cells - each is currently the sum of 1/4 of their side of their array position
        for(key in this.dataBus.summary){
            if(this.dataBus.summary.hasOwnProperty(key)){
                if(key.slice(0,3) == 'SHB'){
                    if(key.slice(3,5) == 'DP')
                        normalization = 6;
                    else if(key.slice(3,5) == 'EN')
                        normalization = 12;
                } else if(key.slice(0,3) == 'SHQ'){
                    if(key.slice(3,5) == 'DP')
                        normalization = 4;
                    else if(key.slice(3,5) == 'EN')
                        normalization = 6;
                }
            }
        }

    };



}






/*
SHARC.prototype = Object.create(Subsystem.prototype);

function SHARC(){
	var i,j;
    //detector name, self-pointing pointer, pull in the Subsystem template, 
    //establish a databus and create a global-scope pointer to this object:
	this.name = 'SHARC';	
	var that = this;
	Subsystem.call(this);
	this.dataBus = new SHARCDS();
    window.SHARCpointer = that;

	//member variables/////////////////////////////////////////////////////////////////////////////////
	this.rows = window.parameters.SMrows;			//number of rows of detectors
	this.columns = window.parameters.SMcolumns;		//number of columns of detectors
	this.nStrips = window.parameters.SMnChannels;	//number of sense strips per detector


    //half-width for drawing horizontal and vertical schema on same canvas:
    this.halfWidth = this.canvasWidth/2;

    //define dimensions of each detector display/////////////////////////////////////////////////////////
    //gutter width as fraction of detector width:
    this.gutterWidth = 0.1;
    //fraction of canvas height to alocate to box elements (rest is for disk elements):
    this.boxElementFraction = 0.5;
    this.detectorWidth = this.halfWidth / (this.columns + (this.columns+1)*this.gutterWidth);
    this.detectorHeight = (this.canvasHeight*this.boxElementFraction - this.rows*this.gutterWidth*this.detectorWidth) / this.rows;
    this.vertStripWidth = this.detectorWidth / this.nStrips;
    this.horizStripWidth = this.detectorHeight / this.nStrips;

    //geometry variables for elliptical displays:
    this.centerLeftX = (5*this.gutterWidth + 4)*this.detectorWidth/2;
    this.centerRightX = this.centerLeftX + this.halfWidth;
    this.centerTopY = this.canvasHeight*0.075 //(1 - this.boxElementFraction) / 2 * this.canvasHeight / 2 - this.scaleHeight/2;
    this.centerBottomY = this.canvasHeight*0.725 //this.canvasHeight - (1 - this.boxElementFraction) / 2 * this.canvasHeight / 2 - this.scaleHeight;
    this.nAzimuthalHoriz = window.parameters.nAzimuthalHoriz;
    this.nAzimuthalVert = window.parameters.nAzimuthalVert;
    this.nRadialHoriz = window.parameters.nRadialHoriz;
    this.nRadialVert = window.parameters.nRadialVert;
    this.nEllipticalChannelsHoriz = this.nAzimuthalHoriz*this.nRadialHoriz;
    this.nEllipticalChannelsVert = this.nAzimuthalVert*this.nRadialVert;
    this.minRadius = 10;
    this.maxRadius = 150;
    this.radiusStepHoriz = (this.maxRadius - this.minRadius) / this.nRadialHoriz;
    this.radiusStepVert = (this.maxRadius - this.minRadius) / this.nRadialVert;
    this.azimuthalStepHoriz = 2*Math.PI / this.nAzimuthalHoriz;
    this.azimuthalStepVert = 2*Math.PI / this.nAzimuthalVert;
    this.topPhase = Math.PI/4;
    this.bottomPhase = 0;

    //establish data buffers////////////////////////////////////////////////////////////////////////////
    this.HVcolor = [];
    this.oldHVcolor = [];
    this.thresholdColor = [];
    this.oldThresholdColor = [];
    this.rateColor = [];
    this.oldRateColor = [];

    //member functions/////////////////////////////////////////////////////////////////////////////////

    //wrapper to interface animation <--> drawing
    this.draw = function(frame){
    	this.drawframe(this.context, frame);
    	if(frame == 0){
    		this.TTcontext.fillStyle = '#123456';
    		this.TTcontext.fillRect(0,0,this.canvasWidth, this.canvasHeight);
    		this.drawframe(this.TTcontext, 0);
    	}
    }

	//draw the monitor at a particular frame in its current transition
	this.drawframe = function(context, frame){

		var i, j, xCorner, yCorner, boxRow, boxCol, boxNum, half;
		var index;
		//number of channels per half, for index offset purposes:
		var totalChannels = this.HVcolor.length / 2;

		this.context.strokeStyle = '#000000'

		//repeat for each half:
		for(half=0; half<2; half++){
			//loop for the rectangular displays:
			for(i=0+half*totalChannels; i<half*totalChannels + this.HVcolor.length/2 - this.nEllipticalChannelsHoriz - this.nEllipticalChannelsVert; i++){
				//index modulo half channels:
				j = i%totalChannels;

				//in this context, j steps through individual channels; need to map onto which box the channel falls into:
				boxNum = Math.floor(j/this.nStrips);
				boxRow = Math.floor(boxNum/this.columns);
				boxCol = boxNum%this.columns;

    			//where is the top left hand corner of this box supposed to go?
    			xCorner = half*this.halfWidth + (1+this.gutterWidth)*this.detectorWidth*boxCol + this.gutterWidth*this.detectorWidth;
    			yCorner = (this.canvasHeight)*(1 - this.scaleHeight/this.canvasHeight - this.boxElementFraction)/2 + this.gutterWidth*this.detectorWidth/2 + (this.detectorHeight + this.gutterWidth*this.detectorWidth)*boxRow;

	    		//where is the top left hand corner of the ith cell?
    			if(half == 0){
    				yCorner += (j%this.nStrips)*this.horizStripWidth;
    			} else {
	    			xCorner += (j%this.nStrips)*this.vertStripWidth;
    			}

                if(window.state.subdetectorView == 0) context.fillStyle = interpolateColor(parseHexColor(this.oldHVcolor[i]), parseHexColor(this.HVcolor[i]), frame/this.nFrames);
                else if(window.state.subdetectorView == 1) context.fillStyle = interpolateColor(parseHexColor(this.oldThresholdColor[i]), parseHexColor(this.thresholdColor[i]), frame/this.nFrames);
				else if(window.state.subdetectorView == 2) context.fillStyle = interpolateColor(parseHexColor(this.oldRateColor[i]), parseHexColor(this.rateColor[i]), frame/this.nFrames);
				if(context == this.TTcontext) context.fillStyle = 'rgba('+(i-half*totalChannels)+','+(i-half*totalChannels)+','+(i-half*totalChannels)+',1)';
				if(half == 0){
					context.fillRect(xCorner, yCorner, this.detectorWidth, this.horizStripWidth);
					if(context != this.TTcontext) context.strokeRect(xCorner, yCorner, this.detectorWidth, this.horizStripWidth);
				} else{ 
					context.fillRect(xCorner, yCorner, this.vertStripWidth, this.detectorHeight);
					if(context != this.TTcontext) context.strokeRect(xCorner, yCorner, this.vertStripWidth, this.detectorHeight);
				}
			}

			//loop for top elliptical wheels:
			for(i=half*totalChannels + this.rows*this.columns*this.nStrips; i<half*totalChannels + this.rows*this.columns*this.nStrips + this.nEllipticalChannelsHoriz; i++){
                if(window.state.subdetectorView == 0) context.fillStyle = interpolateColor(parseHexColor(this.oldHVcolor[i]), parseHexColor(this.HVcolor[i]), frame/this.nFrames);
                else if(window.state.subdetectorView == 1) context.fillStyle = interpolateColor(parseHexColor(this.oldThresholdColor[i]), parseHexColor(this.thresholdColor[i]), frame/this.nFrames);
				else if(window.state.subdetectorView == 2) context.fillStyle = interpolateColor(parseHexColor(this.oldRateColor[i]), parseHexColor(this.rateColor[i]), frame/this.nFrames);
				if(context == this.TTcontext) context.fillStyle = 'rgba('+(i-half*totalChannels)+','+(i-half*totalChannels)+','+(i-half*totalChannels)+',1)';

				//index modulo half channels:
				j = i%totalChannels;

				var azimuthalStart, azimuthalEnd, innerRadius, outerRadius;

				if(half == 0){
					azimuthalStart = this.topPhase + Math.floor(j/this.nRadialHoriz)*this.azimuthalStepHoriz;
					azimuthalEnd = this.topPhase + Math.floor(j/this.nRadialHoriz + 1)*this.azimuthalStepHoriz;
					innerRadius = this.minRadius + (j%this.nRadialHoriz)*this.radiusStepHoriz;
					outerRadius = this.minRadius + (1 + j%this.nRadialHoriz)*this.radiusStepHoriz;
					if(context == this.TTcontext) fillAnnularSection('fill', context, this.centerLeftX, this.centerTopY, innerRadius, outerRadius, azimuthalStart, azimuthalEnd);
					else fillAnnularSection('both', context, this.centerLeftX, this.centerTopY, innerRadius, outerRadius, azimuthalStart, azimuthalEnd);
				} else if(half == 1){
					azimuthalStart = 0 + j*this.azimuthalStepVert; //no phase on these ones (yet?)
					azimuthalEnd = 0 + (j+1)*this.azimuthalStepVert;
					innerRadius = this.minRadius;
					outerRadius = this.maxRadius;
					if(context == this.TTcontext) fillAnnularSection('fill', context, this.centerRightX, this.centerTopY, innerRadius, outerRadius, azimuthalStart, azimuthalEnd);
					else fillAnnularSection('both', context, this.centerRightX, this.centerTopY, innerRadius, outerRadius, azimuthalStart, azimuthalEnd);
				}

			}

			//loop for bottom elliptical wheels:
			for(i=half*totalChannels + this.rows*this.columns*this.nStrips + this.nEllipticalChannelsHoriz; i<half*totalChannels + totalChannels; i++){
                if(window.state.subdetectorView == 0) context.fillStyle = interpolateColor(parseHexColor(this.oldHVcolor[i]), parseHexColor(this.HVcolor[i]), frame/this.nFrames);
                else if(window.state.subdetectorView == 1) context.fillStyle = interpolateColor(parseHexColor(this.oldThresholdColor[i]), parseHexColor(this.thresholdColor[i]), frame/this.nFrames);
				else if(window.state.subdetectorView == 2) context.fillStyle = interpolateColor(parseHexColor(this.oldRateColor[i]), parseHexColor(this.rateColor[i]), frame/this.nFrames);
				if(context == this.TTcontext) context.fillStyle = 'rgba('+(i-half*totalChannels)+','+(i-half*totalChannels)+','+(i-half*totalChannels)+',1)';

				//index modulo half channels:
				j = i%totalChannels;

				var azimuthalStart, azimuthalEnd, innerRadius, outerRadius;

				if(half == 0){
					azimuthalStart = this.bottomPhase + Math.floor(j/this.nRadialHoriz)*this.azimuthalStepHoriz;
					azimuthalEnd = this.bottomPhase + Math.floor(j/this.nRadialHoriz + 1)*this.azimuthalStepHoriz;
					innerRadius = this.minRadius + (j%this.nRadialHoriz)*this.radiusStepHoriz;
					outerRadius = this.minRadius + (1 + j%this.nRadialHoriz)*this.radiusStepHoriz;
					if(context == this.TTcontext) fillAnnularSection('fill', context, this.centerLeftX, this.centerBottomY, innerRadius, outerRadius, azimuthalStart, azimuthalEnd);
					else fillAnnularSection('both', context, this.centerLeftX, this.centerBottomY, innerRadius, outerRadius, azimuthalStart, azimuthalEnd);
				} else if(half == 1){
					azimuthalStart = 0 + j*this.azimuthalStepVert; //no phase on these ones (yet?)
					azimuthalEnd = 0 + (j+1)*this.azimuthalStepVert;
					innerRadius = this.minRadius;
					outerRadius = this.maxRadius;
					if(context == this.TTcontext) fillAnnularSection('fill', context, this.centerRightX, this.centerBottomY, innerRadius, outerRadius, azimuthalStart, azimuthalEnd);
					else fillAnnularSection('both', context, this.centerRightX, this.centerBottomY, innerRadius, outerRadius, azimuthalStart, azimuthalEnd);
				}

			}

		}

        if( (frame==this.nFrames || frame==0) && context!=this.TTcontext ) {
            //scale
            this.drawScale(this.context);
        }

	};

	//update the info for each cell in the monitor
	this.update = function(){
		var i;

        //get new data
        this.fetchNewData();

        //parse the new data into colors
        for(i=0; i<this.dataBus.HV.length; i++){
            this.oldHVcolor[i] = this.HVcolor[i];
            this.HVcolor[i] = this.parseColor(this.dataBus.HV[i], 'SHARC');
        }
        for(i=0; i<this.dataBus.thresholds.length; i++){
            this.oldThresholdColor[i] = this.thresholdColor[i];
            this.thresholdColor[i] = this.parseColor(this.dataBus.thresholds[i], 'SHARC');
        }
        for(i=0; i<this.dataBus.rate.length; i++){
            this.oldRateColor[i] = this.rateColor[i];
            this.rateColor[i] = this.parseColor(this.dataBus.rate[i], 'SHARC');
        }

		this.tooltip.update();
	};

    //determine the cell index at canvas position x, y
    this.findCell = function(x, y){
        var imageData = this.TTcontext.getImageData(x,y,1,1);
        var index = -1;
        if(imageData.data[0] == imageData.data[1] && imageData.data[0] == imageData.data[2]) index = imageData.data[0] + Math.round(x/this.canvasWidth)*10*this.nStrips;
        return index;
    };

    //establish the tooltip text for the cell returned by this.findCell; return length of longest line:
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

    this.fetchNewData = function(){
    	var i;

        //dummy data:
        for(i=0; i<320; i++){
            this.dataBus.HV[i] = Math.random();
            this.dataBus.thresholds[i] = Math.random();
            this.dataBus.rate[i] = Math.random();
        }
    };



    //do an initial populate:
    this.update();
}*/


