function StripMonitor(monitor, orientation, cvas, rows, columns, nStrips, nRadial, nAzimuthal, minima, maxima){

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

	this.canvas = document.getElementById(this.canvasID);
	this.context = this.canvas.getContext('2d');
	this.monitor = document.getElementById(this.monitorID);

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

    //define dimensions of each detector display/////////////////////////////////////////////////////////
    //gutter width as fraction of detector width:
    this.gutterWidth = 0.1;
    //fraction of canvas height to alocate to box elements (rest is for disk elements):
    this.boxElementFraction = 0.6;
    this.detectorWidth = this.canvasWidth / (this.columns + (this.columns+1)*this.gutterWidth);
    this.detectorHeight = (this.canvasHeight*this.boxElementFraction - this.rows*this.gutterWidth*this.detectorWidth) / this.rows;
    if(orientation == 'vertical')
    	this.stripWidth = this.detectorWidth / this.nStrips;
    else if(orientation == 'horizontal')
    	this.stripWidth = this.detectorHeight / this.nStrips;

    //geometry variables for elliptical displays:
    this.centerX = (5*this.gutterWidth + 4)*this.detectorWidth/2;
    this.centerTopY = (1 - this.boxElementFraction) / 2 * this.canvasHeight / 2;
    this.centerBottomY = this.canvasHeight - (1 - this.boxElementFraction) / 2 * this.canvasHeight / 2;
    this.nAzimuthal = nAzimuthal;
    this.nRadial = nRadial;
    this.nEllipticalChannels = nAzimuthal*nRadial;
    this.minRadius = 10;
    this.maxRadius = 170;
    this.radiusStep = (this.maxRadius - this.minRadius) / this.nRadial;
    this.azimuthalStep = 2*Math.PI / this.nAzimuthal;
    this.topPhase = Math.PI/4;
    this.bottomPhase = 0;

    //establish data buffers////////////////////////////////////////////////////////////////////////////
    this.level = [];
    this.color = [];
    this.oldColor = [];
    for(i=0; i<nStrips*rows*columns + 2*this.nEllipticalChannels; i++){
    	this.color[i] = [];
    	this.oldColor[i] = [];
    	for(j=0; j<3; j++)
    		this.color[i][j] = 0;
	    	this.oldColor[i][j] = 0;
    }

    //member functions/////////////////////////////////////////////////////////////////////////////////

    //draw the empty wireframe
    this.wireframe = function(){
    	var i, j, n, xCorner, yCorner;

    	//loop over box elements:
    	for(i=0; i<this.columns; i++){
    		for(j=0; j<this.rows; j++){

    			//where is the top left hand corner of this box supposed to go?
    			xCorner = (1+this.gutterWidth)*this.detectorWidth*i + this.gutterWidth*this.detectorWidth;
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
    				if(this.orientation == 'horizontal'){
	    				this.context.beginPath();
    					this.context.moveTo(xCorner, yCorner + n*this.detectorHeight/this.nStrips);
    					this.context.lineTo(xCorner+this.detectorWidth, yCorner + n*this.detectorHeight/this.nStrips);
    					this.context.stroke();
    				} else if(this.orientation == 'vertical'){
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
    	if(this.orientation == 'horizontal'){
	    	for(i=0; i<nRadial + 1; i++){
	    		this.context.beginPath();
    			ellipse(this.context, this.centerX, this.centerTopY, this.minRadius+i*this.radiusStep, 0, 2*Math.PI);
    			this.context.beginPath();
    			ellipse(this.context, this.centerX, this.centerBottomY, this.minRadius+i*this.radiusStep, 0, 2*Math.PI);
    		}
		} else if(this.orientation == 'vertical'){
			for(i=0; i<2; i++){
				this.context.beginPath();
				ellipse(this.context, this.centerX, this.centerTopY, this.minRadius+i*this.radiusStep, 0, 2*Math.PI);
				this.context.beginPath();
    			ellipse(this.context, this.centerX, this.centerBottomY, this.minRadius+i*this.radiusStep, 0, 2*Math.PI);	
			}
		}
		//draw spokes
		if(this.orientation == 'horizontal'){
	    	for(i=0; i<this.nRadial + 1; i++){
				ellipseSpoke(this.context, this.centerX, this.centerTopY, this.minRadius, this.maxRadius, this.topPhase, this.nAzimuthal, i);
				ellipseSpoke(this.context, this.centerX, this.centerBottomY, this.minRadius, this.maxRadius, this.bottomPhase, this.nAzimuthal, i);
    		}
		} else if(this.orientation == 'vertical'){
			for(i=0; i<this.nEllipticalChannels; i++){
				ellipseSpoke(this.context, this.centerX, this.centerTopY, this.minRadius, this.maxRadius, 0, this.nEllipticalChannels, i);
				ellipseSpoke(this.context, this.centerX, this.centerBottomY, this.minRadius, this.maxRadius, 0, this.nEllipticalChannels, i);
			}
		}

    };

	//draw the monitor at a particular frame in its current transition
	this.draw = function(frame){
		var i, R, G, B, xCorner, yCorner, boxRow, boxCol, boxNum;

		//loop for the rectangular displays:
		for(i=0; i<this.color.length - 2*this.nEllipticalChannels; i++){
			R = Math.round((this.color[i][0] - this.oldColor[i][0])*frame/this.nFrames + this.oldColor[i][0]);
			G = Math.round((this.color[i][1] - this.oldColor[i][1])*frame/this.nFrames + this.oldColor[i][1]);
			B = Math.round((this.color[i][2] - this.oldColor[i][2])*frame/this.nFrames + this.oldColor[i][2]);

			//in this context, i steps through individual channels; need to map onto which box the channel falls into:
			boxNum = Math.floor(i/this.nStrips);
			boxRow = Math.floor(boxNum/this.columns);
			boxCol = boxNum%this.columns;

    		//where is the top left hand corner of this box supposed to go?
    		xCorner = (1+this.gutterWidth)*this.detectorWidth*boxCol + this.gutterWidth*this.detectorWidth;
    		yCorner = this.canvasHeight*(1-this.boxElementFraction)/2 + (this.detectorHeight + this.gutterWidth*this.detectorWidth)*boxRow;

    		//where is the top left hand corner of the ith cell?
    		if(this.orientation == 'horizontal'){
    			yCorner += (i%this.nStrips)*this.stripWidth;
    		} else {
    			xCorner += (i%this.nStrips)*this.stripWidth
    		}

			this.context.fillStyle = 'rgba('+R+','+G+','+B+',1)';
			if(this.orientation == 'horizontal'){
				this.context.fillRect(xCorner, yCorner, this.detectorWidth, this.stripWidth);
			} else{ 
				this.context.fillRect(xCorner, yCorner, this.stripWidth, this.detectorHeight);
			}
		}

		//loop for top elliptical wheels:
		for(i=this.rows*this.columns*this.nStrips; i<this.rows*this.columns*this.nStrips + this.nEllipticalChannels; i++){
			R = Math.round((this.color[i][0] - this.oldColor[i][0])*frame/this.nFrames + this.oldColor[i][0]);
			G = Math.round((this.color[i][1] - this.oldColor[i][1])*frame/this.nFrames + this.oldColor[i][1]);
			B = Math.round((this.color[i][2] - this.oldColor[i][2])*frame/this.nFrames + this.oldColor[i][2]);
			this.context.fillStyle = 'rgba('+R+','+G+','+B+',1)';

			var azimuthalStart, azimuthalEnd, innerRadius, outerRadius;

			if(this.orientation == 'horizontal'){
				azimuthalStart = this.topPhase + Math.floor(i/this.nRadial)*this.azimuthalStep;
				azimuthalEnd = this.topPhase + Math.floor(i/this.nRadial + 1)*this.azimuthalStep;
				innerRadius = this.minRadius + (i%this.nRadial)*this.radiusStep;
				outerRadius = this.minRadius + (1 + i%this.nRadial)*this.radiusStep;
				fillAnnularSection(this.context, this.centerX, this.centerTopY, innerRadius, outerRadius, azimuthalStart, azimuthalEnd);
			} else if(this.orientation == 'vertical'){
				azimuthalStart = 0 + i*this.azimuthalStep; //no phase on these ones (yet?)
				azimuthalEnd = 0 + (i+1)*this.azimuthalStep;
				innerRadius = this.minRadius;
				outerRadius = this.maxRadius;
				fillAnnularSection(this.context, this.centerX, this.centerTopY, innerRadius, outerRadius, azimuthalStart, azimuthalEnd);
			}

		}

		//loop for bottom elliptical wheels:
		for(i=this.rows*this.columns*this.nStrips + this.nEllipticalChannels; i<this.color.length; i++){
			R = Math.round((this.color[i][0] - this.oldColor[i][0])*frame/this.nFrames + this.oldColor[i][0]);
			G = Math.round((this.color[i][1] - this.oldColor[i][1])*frame/this.nFrames + this.oldColor[i][1]);
			B = Math.round((this.color[i][2] - this.oldColor[i][2])*frame/this.nFrames + this.oldColor[i][2]);
			this.context.fillStyle = 'rgba('+R+','+G+','+B+',1)';

			var azimuthalStart, azimuthalEnd, innerRadius, outerRadius;

			if(this.orientation == 'horizontal'){
				azimuthalStart = this.bottomPhase + Math.floor(i/this.nRadial)*this.azimuthalStep;
				azimuthalEnd = this.bottomPhase + Math.floor(i/this.nRadial + 1)*this.azimuthalStep;
				innerRadius = this.minRadius + (i%this.nRadial)*this.radiusStep;
				outerRadius = this.minRadius + (1 + i%this.nRadial)*this.radiusStep;
				fillAnnularSection(this.context, this.centerX, this.centerBottomY, innerRadius, outerRadius, azimuthalStart, azimuthalEnd);
			} else if(this.orientation == 'vertical'){
				azimuthalStart = 0 + i*this.azimuthalStep; //no phase on these ones (yet?)
				azimuthalEnd = 0 + (i+1)*this.azimuthalStep;
				innerRadius = this.minRadius;
				outerRadius = this.maxRadius;
				fillAnnularSection(this.context, this.centerX, this.centerBottomY, innerRadius, outerRadius, azimuthalStart, azimuthalEnd);
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
			for(j=0; j<3; j++){
				this.oldColor[i][j] = this.color[i][j];
			}
			this.color[i] = this.parseColor(newInfo[i]);
		}

		animate(this, 0);
	};

	//determine which color <scalar> corresponds to
	this.parseColor = function(scalar){

		//how far along the scale are we?
		var scale = (scalar - this.minima[this.trackingIndex]) / (this.maxima[this.trackingIndex] - this.minima[this.trackingIndex]);

		return rainbow(scale);
	};

}

//draw elliptical arc:
ellipse = function(context, centerX, centerY, horizRadius, startAngle, endAngle){
    context.save();
    context.translate(centerX, centerY);
    context.scale(1, 0.3);
    //context.beginPath();
    //recall the internet counts its angles backwards :(
    context.arc(0, 0, horizRadius, 2*Math.PI - startAngle, 2*Math.PI - endAngle);
    context.restore();
    context.stroke();
}

//draw spokes from center ellipse to outer ellipse
ellipseSpoke = function(context, centerX, centerY, horizRadiusInner, horizRadiusOuter, phase, nSpokes, spokeNumber){

	//angle between spokes
	var sectionArc = 2*Math.PI / nSpokes;
	//angle of this spoke; recall the internet counts its angles backwards :(
	var phi = 2*Math.PI - (phase + spokeNumber*sectionArc);

    context.save();
    context.translate(centerX, centerY);
    context.scale(1, 0.3);
    //context.beginPath();
    context.moveTo(horizRadiusInner*Math.cos(phi), horizRadiusInner*Math.sin(phi));
    context.lineTo(horizRadiusOuter*Math.cos(phi), horizRadiusOuter*Math.sin(phi));
    context.restore();
    context.stroke();

}

//color in a particular annular section
fillAnnularSection = function(context, centerX, centerY, innerRadius, outerRadius, startAngle, endAngle){

	context.save();
    context.translate(centerX, centerY);
    context.scale(1, 0.3);
	context.beginPath();
	context.moveTo(innerRadius*Math.cos(2*Math.PI - startAngle), innerRadius*Math.sin(2*Math.PI - startAngle));
	context.arc(0, 0, innerRadius, 2*Math.PI - startAngle, 2*Math.PI - endAngle, true);
	context.lineTo(outerRadius*Math.cos(2*Math.PI - endAngle), outerRadius*Math.sin(2*Math.PI - endAngle));
	context.arc(0, 0, outerRadius, 2*Math.PI - endAngle, 2*Math.PI - startAngle, false);
	context.closePath();
	context.restore();
	context.fill();

}

//map [0,1] onto a rainbow:
rainbow = function(scale){
    //map scale onto [0,360]:
    var H = scale*360 / 60;
   	var R, G, B;
   	if(H>=0 && H<1){
    	R = 255;
    	G = Math.round(255 - 255*Math.abs(H%2 - 1));
   		B = 0;
    } else if(H>=1 && H<2){
   		R = Math.round(255 - 255*Math.abs(H%2 - 1));
   		G = 255;
    	B = 0;
   	} else if(H>=2 && H<3){
   		R = 0;
    	G = 255;
    	B = Math.round(255 - 255*Math.abs(H%2 - 1));
   	} else if(H>=3 && H<4){
    	R = 0;
    	G = Math.round(255 - 255*Math.abs(H%2 - 1));
   		B = 255;
    } else if(H>=4 && H<5){
   		R = Math.round(255 - 255*Math.abs(H%2 - 1));
   		G = 0;
   		B = 255;
   	} else if(H>=5 && H<6){
   		R = 255;
   		G = 0;
    	B = Math.round(255 - 255*Math.abs(H%2 - 1));
   	} 
   	return [R,G,B];

}

