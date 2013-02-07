function SHARC(monitor, orientation, cvas, rows, columns, nStrips, nRadialHoriz, nAzimuthalHoriz, nRadialVert, nAzimuthalVert, minima, maxima, tooltip){

	var i,j;

	//argument member variables/////////////////////////////////////////////////////////////////////////////////
	this.monitorID = monitor;		//div ID of wrapper div
	this.orientation = orientation;	//'vertical' or 'horizontal', the direction of the strips for this instance.
	this.canvasID = cvas;			//the canvas ID on which to draw the strip monitor
	this.rows = rows;				//number of rows of detectors
	this.columns = columns;			//number of columns of detectors
	this.nStrips = nStrips;			//number of sense strips per detector
	this.minima = minima;			//array of scale minima, one entry for each scalar option
	this.maxima = maxima;			//array of scale maxima, one entry for each scalar option
	this.tooltip = tooltip;			//tooltip belonging to this object

	this.canvas = document.getElementById(this.canvasID);
	this.context = this.canvas.getContext('2d');
	this.monitor = document.getElementById(this.monitorID);

	that = this;

    //establish animation parameters////////////////////////////////////////////////////////////////////
    this.FPS = 30;
    this.duration = 0.5;
    this.nFrames = this.FPS*this.duration;

    //which of the scalars are we tracking now? (corresponds to the index in this.maxima)
    this.trackingIndex = 0;

    //scale canvas//////////////////////////////////////////////////////////////////////////////////////
    this.canvasWidth = 0.48*$(this.monitor).width();
    this.canvasHeight = 0.8*$(this.monitor).height();
    this.canvas.setAttribute('width', this.canvasWidth);
    this.canvas.setAttribute('height', this.canvasHeight);

    //half-width for drawing horizontal and vertical schema on same canvas:
    this.halfWidth = this.canvasWidth/2;

    //position canvas
    $('#'+cvas).css('top', $('#'+'SubsystemLinks').height() + 5 )

    //set up tooltip:
    this.tooltip.obj = that;

    //define dimensions of each detector display/////////////////////////////////////////////////////////
    //gutter width as fraction of detector width:
    this.gutterWidth = 0.1;
    //fraction of canvas height to alocate to box elements (rest is for disk elements):
    this.boxElementFraction = 0.6;
    this.detectorWidth = this.halfWidth / (this.columns + (this.columns+1)*this.gutterWidth);
    this.detectorHeight = (this.canvasHeight*this.boxElementFraction - this.rows*this.gutterWidth*this.detectorWidth) / this.rows;
    this.vertStripWidth = this.detectorWidth / this.nStrips;
    this.horizStripWidth = this.detectorHeight / this.nStrips;

    //geometry variables for elliptical displays:
    this.centerLeftX = (5*this.gutterWidth + 4)*this.detectorWidth/2;
    this.centerRightX = this.centerLeftX + this.halfWidth;
    this.centerTopY = (1 - this.boxElementFraction) / 2 * this.canvasHeight / 2;
    this.centerBottomY = this.canvasHeight - (1 - this.boxElementFraction) / 2 * this.canvasHeight / 2;
    this.nAzimuthalHoriz = nAzimuthalHoriz;
    this.nAzimuthalVert = nAzimuthalVert;
    this.nRadialHoriz = nRadialHoriz;
    this.nRadialVert = nRadialVert;
    this.nEllipticalChannelsHoriz = nAzimuthalHoriz*nRadialHoriz;
    this.nEllipticalChannelsVert = nAzimuthalVert*nRadialVert;
    this.minRadius = 10;
    this.maxRadius = 170;
    this.radiusStepHoriz = (this.maxRadius - this.minRadius) / this.nRadialHoriz;
    this.radiusStepVert = (this.maxRadius - this.minRadius) / this.nRadialVert;
    this.azimuthalStepHoriz = 2*Math.PI / this.nAzimuthalHoriz;
    this.azimuthalStepVert = 2*Math.PI / this.nAzimuthalVert;
    this.topPhase = Math.PI/4;
    this.bottomPhase = 0;

    //establish data buffers////////////////////////////////////////////////////////////////////////////
    this.level = [];
    this.color = [];
    this.oldColor = [];

    //member functions/////////////////////////////////////////////////////////////////////////////////

    //draw the empty wireframe
    this.wireframe = function(){
    	var i, j, n, xCorner, yCorner, half;

    	//repeat for each half:
    	for(half=0; half<2; half++){
	    	//loop over box elements:
    		for(i=0; i<this.columns; i++){
    			for(j=0; j<this.rows; j++){

    				//where is the top left hand corner of this box supposed to go?
    				xCorner = this.halfWidth*half + (1+this.gutterWidth)*this.detectorWidth*i + this.gutterWidth*this.detectorWidth;
	    			yCorner = this.canvasHeight*(1-this.boxElementFraction)/2 + (this.detectorHeight + this.gutterWidth*this.detectorWidth)*j;

    				//draw the outer frames
    				this.context.beginPath();
    				this.context.lineWidth = 2;
    				this.context.strokeStyle = 'rgba(0,0,0,0.3)';
	    			this.context.moveTo(xCorner + this.detectorWidth+1, yCorner+1);
    				this.context.lineTo(xCorner + this.detectorWidth+1, yCorner + this.detectorHeight+1);
    				this.context.lineTo(xCorner + 1, yCorner + this.detectorHeight+1);
    				this.context.stroke();
    				this.context.strokeStyle = 'rgba(0,0,0,0.9)';
	    			this.context.strokeRect(xCorner, yCorner, this.detectorWidth, this.detectorHeight);
    				this.context.stroke();

    				//draw the inner divisions
    				this.context.lineWidth = 1;
    				for(n=1; n<this.nStrips; n++){
    					if(half==0){
	    					this.context.beginPath();
	    					this.context.moveTo(xCorner, yCorner + n*this.detectorHeight/this.nStrips);
    						this.context.lineTo(xCorner+this.detectorWidth, yCorner + n*this.detectorHeight/this.nStrips);
    						this.context.stroke();
    					} else if(half==1){
    						this.context.beginPath();
    						this.context.moveTo(xCorner + n*this.detectorWidth/this.nStrips, yCorner);
    						this.context.lineTo(xCorner + n*this.detectorWidth/this.nStrips, yCorner + this.detectorHeight);
	    					this.context.stroke();
    					}
    				}
    			}
	    	}
    	
	    	//draw elliptical wheels:
    		//draw disks
    		if(half == 0){
	    		for(i=0; i<nRadialHoriz + 1; i++){
	    			this.context.beginPath();
	    			ellipse(this.context, this.centerLeftX, this.centerTopY, this.minRadius+i*this.radiusStepHoriz, 0, 2*Math.PI);
    				this.context.beginPath();
    				ellipse(this.context, this.centerLeftX, this.centerBottomY, this.minRadius+i*this.radiusStepHoriz, 0, 2*Math.PI);
    			}
			} else if(half == 1){
				for(i=0; i<2; i++){
					this.context.beginPath();
					ellipse(this.context, this.centerRightX, this.centerTopY, this.minRadius+i*this.radiusStepVert, 0, 2*Math.PI);
					this.context.beginPath();
	    			ellipse(this.context, this.centerRightX, this.centerBottomY, this.minRadius+i*this.radiusStepVert, 0, 2*Math.PI);	
				}
			}
			//draw spokes
			if(half == 0){
	    		for(i=0; i<this.nRadialHoriz + 1; i++){
					ellipseSpoke(this.context, this.centerLeftX, this.centerTopY, this.minRadius, this.maxRadius, this.topPhase, this.nAzimuthalHoriz, i);
					ellipseSpoke(this.context, this.centerLeftX, this.centerBottomY, this.minRadius, this.maxRadius, this.bottomPhase, this.nAzimuthalHoriz, i);
	    		}
			} else if(half == 1){
				for(i=0; i<this.nEllipticalChannelsVert; i++){
					ellipseSpoke(this.context, this.centerRightX, this.centerTopY, this.minRadius, this.maxRadius, 0, this.nEllipticalChannelsVert, i);
					ellipseSpoke(this.context, this.centerRightX, this.centerBottomY, this.minRadius, this.maxRadius, 0, this.nEllipticalChannelsVert, i);
				}
			}

		}
    };

	//draw the monitor at a particular frame in its current transition
	this.draw = function(frame){
		var i, j, xCorner, yCorner, boxRow, boxCol, boxNum, half;

		//number of channels per half, for index offset purposes:
		var totalChannels = this.color.length / 2;

		//repeat for each half:
		for(half=0; half<2; half++){
			//loop for the rectangular displays:
			for(i=0+half*totalChannels; i<half*totalChannels + this.color.length/2 - this.nEllipticalChannelsHoriz - this.nEllipticalChannelsVert; i++){

				//index modulo half channels:
				j = i%totalChannels;

				//in this context, j steps through individual channels; need to map onto which box the channel falls into:
				boxNum = Math.floor(j/this.nStrips);
				boxRow = Math.floor(boxNum/this.columns);
				boxCol = boxNum%this.columns;

    			//where is the top left hand corner of this box supposed to go?
    			xCorner = half*this.halfWidth + (1+this.gutterWidth)*this.detectorWidth*boxCol + this.gutterWidth*this.detectorWidth;
    			yCorner = this.canvasHeight*(1-this.boxElementFraction)/2 + (this.detectorHeight + this.gutterWidth*this.detectorWidth)*boxRow;

	    		//where is the top left hand corner of the ith cell?
    			if(half == 0){
    				yCorner += (j%this.nStrips)*this.horizStripWidth;
    			} else {
	    			xCorner += (j%this.nStrips)*this.vertStripWidth;
    			}

				this.context.fillStyle = interpolateColor(parseHexColor(this.oldColor[i]), parseHexColor(this.color[i]), frame/this.nFrames);
				if(half == 0){
					this.context.fillRect(xCorner, yCorner, this.detectorWidth, this.horizStripWidth);
				} else{ 
					this.context.fillRect(xCorner, yCorner, this.vertStripWidth, this.detectorHeight);
				}
			}

			//loop for top elliptical wheels:
			for(i=half*totalChannels + this.rows*this.columns*this.nStrips; i<half*totalChannels + this.rows*this.columns*this.nStrips + this.nEllipticalChannelsHoriz; i++){
				this.context.fillStyle = interpolateColor(parseHexColor(this.oldColor[i]), parseHexColor(this.color[i]), frame/this.nFrames);

				//index modulo half channels:
				j = i%totalChannels;

				var azimuthalStart, azimuthalEnd, innerRadius, outerRadius;

				if(half == 0){
					azimuthalStart = this.topPhase + Math.floor(j/this.nRadialHoriz)*this.azimuthalStepHoriz;
					azimuthalEnd = this.topPhase + Math.floor(j/this.nRadialHoriz + 1)*this.azimuthalStepHoriz;
					innerRadius = this.minRadius + (j%this.nRadialHoriz)*this.radiusStepHoriz;
					outerRadius = this.minRadius + (1 + j%this.nRadialHoriz)*this.radiusStepHoriz;
					fillAnnularSection(this.context, this.centerLeftX, this.centerTopY, innerRadius, outerRadius, azimuthalStart, azimuthalEnd);
				} else if(half == 1){
					azimuthalStart = 0 + j*this.azimuthalStepVert; //no phase on these ones (yet?)
					azimuthalEnd = 0 + (j+1)*this.azimuthalStepVert;
					innerRadius = this.minRadius;
					outerRadius = this.maxRadius;
					fillAnnularSection(this.context, this.centerRightX, this.centerTopY, innerRadius, outerRadius, azimuthalStart, azimuthalEnd);
				}

			}

			//loop for bottom elliptical wheels:
			for(i=half*totalChannels + this.rows*this.columns*this.nStrips + this.nEllipticalChannelsHoriz; i<half*totalChannels + totalChannels; i++){
				this.context.fillStyle = interpolateColor(parseHexColor(this.oldColor[i]), parseHexColor(this.color[i]), frame/this.nFrames);

				//index modulo half channels:
				j = i%totalChannels;

				var azimuthalStart, azimuthalEnd, innerRadius, outerRadius;

				if(half == 0){
					azimuthalStart = this.bottomPhase + Math.floor(j/this.nRadialHoriz)*this.azimuthalStepHoriz;
					azimuthalEnd = this.bottomPhase + Math.floor(j/this.nRadialHoriz + 1)*this.azimuthalStepHoriz;
					innerRadius = this.minRadius + (j%this.nRadialHoriz)*this.radiusStepHoriz;
					outerRadius = this.minRadius + (1 + j%this.nRadialHoriz)*this.radiusStepHoriz;
					fillAnnularSection(this.context, this.centerLeftX, this.centerBottomY, innerRadius, outerRadius, azimuthalStart, azimuthalEnd);
				} else if(half == 1){
					azimuthalStart = 0 + j*this.azimuthalStepVert; //no phase on these ones (yet?)
					azimuthalEnd = 0 + (j+1)*this.azimuthalStepVert;
					innerRadius = this.minRadius;
					outerRadius = this.maxRadius;
					fillAnnularSection(this.context, this.centerRightX, this.centerBottomY, innerRadius, outerRadius, azimuthalStart, azimuthalEnd);
				}

			}

		}

		//redraw frame:
		this.wireframe();

	};

	//update the info for each cell in the monitor
	this.update = function(newInfo){
		var i, j;
		for(i=0; i<newInfo.length; i++){
			this.level[i] = newInfo[i];
			this.oldColor[i] = this.color[i];
			this.color[i] = this.parseColor(newInfo[i]);
		}

		//animate(this, 0);
	};

	//determine which color <scalar> corresponds to
	this.parseColor = function(scalar){

		//how far along the scale are we?
		var scale = (scalar - this.minima[this.trackingIndex]) / (this.maxima[this.trackingIndex] - this.minima[this.trackingIndex]);

		return rainbow(scale);
	};

	//determine which cell pixel x,y falls in, with 0,0 being the top left corner of the canvas; return -1 if no corresponding cell.
	this.findCell = function(x, y){
		var cell = -1;
		var radius, phi, row, col, phiBin, radBin;

		//which half of the canvas are we in?
		var half;
		if(x < this.halfWidth) half = 0;
		else{
			half = 1;
		}

		var xCenter, radStep, azimuthalStep, nAzimuthal, nRadial;
		if(half == 0){
			xCenter = this.centerLeftX;
			radStep = this.radiusStepHoriz;
			azimuthalStep = this.azimuthalStepHoriz;
			nAzimuthal = this.nAzimuthalHoriz;
			nRadial = this.nRadialHoriz;
		}
		else{
			xCenter = this.centerRightX;
			radStep = this.radiusStepVert;
			azimuthalStep = this.azimuthalStepVert;
			nAzimuthal = this.nAzimuthalVert;
			nRadial = this.nRadialVert;
		}

		//decide which bin we're on, modulo canvas half:
		if(y <= this.canvasHeight*(1-this.boxElementFraction)/2){  //top disk

			radius = Math.sqrt(Math.pow( x - xCenter, 2 ) + Math.pow( (y - this.centerTopY)/0.3, 2 ));
			phi = Math.asin( (this.centerTopY-y)/0.3/ Math.sqrt(Math.pow( x - xCenter, 2 ) + Math.pow( (this.centerTopY - y)/0.3, 2 )) );
			//need to correct for asin mapping only onto [-pi/2, pi/2]:
			if(x < xCenter)
				phi = Math.PI - phi;
			else if(y > this.centerTopY)
				phi = 2*Math.PI + phi;

			if(radius < this.maxRadius && radius > this.minRadius){
				radBin = Math.floor( (radius-this.minRadius) / radStep);
				phiBin = Math.floor( (phi - this.topPhase) / azimuthalStep);
				if(phiBin < 0) phiBin += nAzimuthal;
				cell = phiBin*nRadial + radBin;
			}

			//add on all the cells in the corresponding strip arrays:
			if(cell != -1) cell += this.color.length / 2 - this.nEllipticalChannelsHoriz - this.nEllipticalChannelsVert;

		} else if (y <= this.canvasHeight - this.canvasHeight*(1-this.boxElementFraction)/2){ //strips
			//measure from the top of where we start drawing the boxes, and the left edge of the appropriate half of the canvas:
			var Y = y - this.canvasHeight*(1-this.boxElementFraction)/2;
			var X = x;
			if(half == 1) X -= this.halfWidth;
			//determine the row and coulmn of the box being pointed at:
			row = Math.floor( Y / (this.detectorHeight + this.gutterWidth*this.detectorWidth));
			col = Math.floor((X - this.gutterWidth*this.detectorWidth)/(this.detectorWidth*(1+this.gutterWidth)));
			cell = row*this.columns*this.nStrips + col*this.nStrips;

			//determine which cell we're on within the box:
			if(half == 0){
				cell += Math.floor((Y - row*(this.detectorHeight + this.detectorWidth*this.gutterWidth)) / this.horizStripWidth);
			} else if(half == 1){
				cell += Math.floor((X - this.detectorWidth*this.gutterWidth - col*this.detectorWidth*(1+this.gutterWidth)) / this.vertStripWidth);
			}
			//suppress when pointing at a gutter:
			if( (Y % (this.detectorHeight+this.detectorWidth*this.gutterWidth)) > this.detectorHeight )
				cell = -1;
			if( (X % (this.detectorWidth*(1+this.gutterWidth))) < this.detectorWidth*this.gutterWidth )
				cell = -1;

		} else {  //bottom disk

			radius = Math.sqrt(Math.pow( x - xCenter, 2 ) + Math.pow( (y - this.centerBottomY)/0.3, 2 ));
			phi = Math.asin( (this.centerBottomY-y)/0.3/ Math.sqrt(Math.pow( x - xCenter, 2 ) + Math.pow( (this.centerBottomY - y)/0.3, 2 )) );
			//need to correct for asin mapping only onto [-pi/2, pi/2]:
			if(x < xCenter)
				phi = Math.PI - phi;
			else if(y > this.centerBottomY)
				phi = 2*Math.PI + phi;

			if(radius < this.maxRadius && radius > this.minRadius){
				radBin = Math.floor( (radius-this.minRadius) / radStep);
				phiBin = Math.floor( (phi - this.bottomPhase) / azimuthalStep);
				if(phiBin < 0) phiBin += nAzimuthal;
				cell = phiBin*nRadial + radBin;
			}

			//if(cell!=-1) cell += (half+1)*this.color.length/2 - this.nEllipticalChannelsVert
			//add on all the cells in the corresponding strip arrays and upper disk:
			if(cell != -1) cell += this.color.length / 2 - this.nEllipticalChannelsHoriz;

		}

		//add channels from the left half back on if we're in the right half to undo modulo above:
		if(cell!=-1 && half == 1) cell += this.color.length/2;
		return cell;
	};

    //establish the tooltip text for the cell returned by this.findCell; return length of longest line:
	this.defineText = function(cell){
        var toolTipContent = '<br>';
        var nextLine;
        var longestLine = 0;
        var cardIndex;
        var i;

        nextLine = cell;

        //keep track of the longest line of text:
        longestLine = Math.max(longestLine, this.tooltip.context.measureText(nextLine).width)
        toolTipContent += nextLine;
/*
        //fill out tooltip content:
        for(i=0; i<this.reportedValues.length; i++){
            //establish prefix:
            nextLine = '<br/>'+this.tooltip.prefix[i];
            if(this.tooltip.prefix[i] !== '') nextLine += ' ';

            //pull in content; special cases for the status word and reported current:
            //status word:
            if(i == 6){
                nextLine += parseStatusWord(this.reportedValues[i][row][col]);
            }
            //current:
            else if(i == 2){
                    if(this.moduleSizes[cardIndex]==4 && row!=0) nextLine += '--';
                    else nextLine += Math.round( this.reportedValues[i][row][col]*1000)/1000 + ' ' + this.tooltip.postfix[i];                
            } else {
                nextLine += Math.round( this.reportedValues[i][row][col]*1000)/1000 + ' ' + this.tooltip.postfix[i];
            }

            //keep track of longest line:
            longestLine = Math.max(longestLine, this.tooltip.context.measureText(nextLine).width);

            //append to tooltip:
            toolTipContent += nextLine;
 
        }
*/
        document.getElementById(this.tooltip.ttTextID).innerHTML = toolTipContent;

        //return length of longest line:
        return longestLine;
	};

}


