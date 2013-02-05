function DAQ(monitor, canvas, tooltip, minima, maxima){
	var i, j, k, m;

	var that = this;

	this.monitorID = monitor;		//div ID of wrapper div
	this.canvasID = canvas;			//ID of canvas to draw DESCANT on
	//this.tooltip = tooltip;			//tooltip associated with this object
	this.minima = minima;			//minima of element scalea: [master, master link, collector, digi summary link, digi summary node, digi group link, digi transfer, digitizer]
	this.maxima = maxima;			//as minima.
	this.nCollectors = 16;
	this.nDigitizers = 256;

	this.canvas = document.getElementById(canvas);
	this.context = this.canvas.getContext('2d');
	this.monitor = document.getElementById(this.monitorID);

    //scale canvas//////////////////////////////////////////////////////////////////////////////////////
    this.canvasWidth = 0.48*$(this.monitor).width();
    this.canvasHeight = 0.8*$(this.monitor).height();
    this.canvas.setAttribute('width', this.canvasWidth);
    this.canvas.setAttribute('height', this.canvasHeight);

    //position canvas
    $('#'+canvas).css('top', $('#'+'DAQlinks').height() + 5 )

    //associate tooltip:
    //this.tooltip.obj = that;

    //drawing parameters//////////////////////////////////////////////
    //diagram center:
    this.centerX = this.canvasWidth / 2;
    this.centerY = this.canvasHeight / 2;
    //default node color
    this.nodeColor = 'rgba(0,0,0,1)';
    //background color
    this.bkgColor = '#333333';
    //radius of collector ring:
    this.collectorRingRadius = 100;

    //establish animation parameters////////////////////////////////////////////////////////////////////
    this.FPS = 30;
    this.duration = 0.5;
    this.nFrames = this.FPS*this.duration;

    this.inboundCollector = -1;
    this.presentCollector = -1;

    //establish animation transition to detailed view:
    this.canvas.onclick = function(event){that.swapDetail(event.pageX - that.canvas.offsetLeft - that.monitor.offsetLeft, event.pageY - that.canvas.offsetTop - that.monitor.offsetTop)};

    //establish data buffers////////////////////////////////////////////////////////////////////////////
    //master
    this.masterRate = 0;
    this.masterColor = [0,0,0];
    this.oldMasterColor = [0,0,0];
    //links from collectors to master
    this.masterLinkRate = [];
    this.masterLinkColor = [];
    this.oldMasterLinkColor = [];
    //collectors
    this.collectorRate = [];
    this.collectorColor = [];
    this.oldCollectorColor = [];
    //links from digitizer summary node to collector
    this.collectorLinkRate = [];
    this.collectorLinkColor = [];
    this.oldCollectorLinkColor = [];
    //digitizer summary node
    this.digiSummaryRate = [];
    this.digiSummaryColor = [];
    this.oldDigiSummaryColor = [];
    //links from digitizer group to digitizer summary node
    this.digiGroupSummaryRate = [];
    this.digiGroupSummaryColor = [];
    this.oldDigiGroupSummaryColor = [];
    //links from digitizers to digitizer group
    this.digitizerLinkRate = [];
    this.digitizerLinkColor = [];
    this.oldDigitizerLinkColor = [];
    //digitizers
    this.digitizerRate = [];
    this.digitizerColor = [];
    this.oldDigitizerColor = [];

    for(i=0; i<16; i++){
    	this.masterLinkRate[i] = 0;
    	this.masterLinkColor[i] = [];
    	this.oldMasterLinkColor[i] = [];
    	this.collectorRate[i] = 0;
    	this.collectorColor[i] = [];
    	this.oldCollectorColor[i] = [];
    	this.collectorLinkRate[i] = 0
    	this.collectorLinkColor[i] = [];
    	this.oldCollectorLinkColor[i] = [];
    	this.digiSummaryRate[i] = 0;
    	this.digiSummaryColor[i] = [];
    	this.oldDigiSummaryColor[i] = [];

	    this.digiGroupSummaryRate[i] = [];
    	this.digiGroupSummaryColor[i] = [];
	    this.oldDigiGroupSummaryColor[i] = [];

    	this.digitizerLinkRate[i] = [];
    	this.digitizerLinkColor[i] = [];
    	this.oldDigitizerLinkColor[i] = [];
    	this.digitizerRate[i] = [];
    	this.digitizerColor[i] = [];
    	this.oldDigitizerColor[i] = [];

    	for(j=0; j<3; j++){
    		this.masterLinkColor[i][j] = 0;
    		this.oldMasterLinkColor[i][j] = 0;
    		this.collectorColor[i][j] = 0;
    		this.oldCollectorColor[i][j] = 0;
    		this.collectorLinkColor[i][j] = 0;
    		this.oldCollectorLinkColor[i][j] = 0;
    		this.digiSummaryColor[i][j] = 0;
    		this.oldDigiSummaryColor[i][j] = 0;
    	}
	
		for(j=0; j<4; j++){
			this.digiGroupSummaryRate[i][j] = 0;
    		this.digiGroupSummaryColor[i][j] = [];
    		this.oldDigiGroupSummaryColor[i][j] = [];

	    	this.digitizerLinkRate[i][j] = [];
    		this.digitizerLinkColor[i][j] = [];
    		this.oldDigitizerLinkColor[i][j] = [];
	    	this.digitizerRate[i][j] = [];
    		this.digitizerColor[i][j] = [];
    		this.oldDigitizerColor[i][j] = [];

	    	for(m=0; m<4; m++){
		    	this.digitizerLinkRate[i][j][m] = 0;
    			this.digitizerLinkColor[i][j][m] = [];
    			this.oldDigitizerLinkColor[i][j][m] = [];
	    		this.digitizerRate[i][j][m] = 0;
    			this.digitizerColor[i][j][m] = [];
    			this.oldDigitizerColor[i][j][m] = [];    		
	    	
    			for(k=0; k<3; k++){
    				this.digiGroupSummaryColor[i][j][k] = 0;
	    			this.oldDigiGroupSummaryColor[i][j][k] = 0;

		    		this.digitizerLinkColor[i][j][m][k] = 0;
    				this.oldDigitizerLinkColor[i][j][m][k] = 0;
    				this.digitizerColor[i][j][m][k] = 0;
    				this.oldDigitizerColor[i][j][m][k] = 0; 
    			}
    		}
		}
	} //finished declaring data buffers

	//update the info for each cell in the monitor
	this.update = function(masterRate, masterLinkRate, collectorRate, collectorLinkRate, digiSummaryRate, digiGroupSummaryRate, digitizerLinkRate, digitizerRate){
		var i,j,k,m;

		//master
    	this.masterRate[0] = masterRate;
	    for(i=0; i<3; i++){
    		this.oldMasterColor[i] = this.masterColor[i];
	    }
    	this.masterColor = this.parseColor(masterRate[0], 0);

	    //links from collectors to master, collectors, links from digitizer summary node to collector, digitizer summary nodes
    	for(i=0; i<16; i++){
    		this.masterLinkRate[i] = masterLinkRate[i];
	    	this.collectorRate[i] = collectorRate[i];
    		this.collectorLinkRate[i] = collectorLinkRate[i];
    		this.digiSummaryRate[i] = digiSummaryRate[i];
	    	for(j=0; j<3; j++){
    			this.oldMasterLinkColor[i][j] = this.masterLinkColor[i][j];
    			this.oldCollectorColor[i][j] = this.collectorColor[i][j];
    			this.oldCollectorLinkColor[i][j] = this.collectorLinkColor[i][j];
	    		this.oldDigiSummaryColor[i][j] = this.digiSummaryColor[i][j];
    		}
    		this.masterLinkColor[i] = this.parseColor(masterLinkRate[i], 1);
	    	this.collectorColor[i] = this.parseColor(collectorRate[i], 2);
    		this.collectorLinkColor[i] = this.parseColor(collectorLinkRate[i],3);
    		this.digiSummaryColor[i] = this.parseColor(digiSummaryRate[i],4);
	    }

    	//links from digitizer group to digitizer summary node
	    for(i=0; i<16; i++){
    		for(j=0; j<4; j++){
    			this.digiGroupSummaryRate[i][j] = digiGroupSummaryRate[i][j];
    			for(k=0; k<3; k++){
    				this.oldDigiGroupSummaryColor[i][j][k] = this.digiGroupSummaryColor[i][j][k];
	    		}
    			this.digiGroupSummaryColor[i][j] = this.parseColor(digiGroupSummaryRate[i][j], 5);
    		}
    	}

	    //links from digitizers to digitizer group, and digitizers
    	for(i=0; i<16; i++){
    		for(j=0; j<4; j++){
    			for(k=0; k<4; k++){
    				this.digitizerLinkRate[i][j][k] = digitizerLinkRate[i][j][k];
	    			this.digitizerRate[i][j][k] = digitizerRate[i][j][k];
    				for(m=0; m<3; m++){
    					this.oldDigitizerLinkColor[i][j][k][m] = this.digitizerLinkColor[i][j][k][m];
    					this.oldDigitizerColor[i][j][k][m] = this.digitizerColor[i][j][k][m];
    				}
	    			this.digitizerLinkColor[i][j][k] = this.parseColor(digitizerLinkRate[i][j][k], 6);
    				this.digitizerColor[i][j][k] = this.parseColor(digitizerRate[i][j][k], 7);
    			}
    		}
    	}

    	//animate(this,0);

	};

	//parse scalar into a color on a color scale bounded by the entries in this.minima[index] and this.maxima[index] 
	this.parseColor = function(scalar, index){
		//how far along the scale are we?
		var scale = (scalar - this.minima[index]) / (this.maxima[index] - this.minima[index]);

		return redScale(scale);
	};

	this.draw = function(frame){
		var color, i, j, k;

		this.context.clearRect(0,0, this.canvasWidth, this.canvasWidth);

    	//digitizer summary detail
    	if(this.presentCollector != -1)
	    	this.drawDigiDetail(this.presentCollector, frame, this.nFrames);

    	for(i=0; i<16; i++){
    		//digi summary nodes:
    		color = interpolateColor(this.oldDigiSummaryColor[i], this.digiSummaryColor[i], frame/this.nFrames);
    		this.drawSummaryDigitizerNode(i, color);
    		//collector-digi summary links:
    		color = interpolateColor(this.oldCollectorLinkColor[i], this.collectorLinkColor[i], frame/this.nFrames);
    		this.drawSummaryDigitizerNodeLink(i, color);
    		//collecter nodes:
    		color = interpolateColor(this.oldCollectorColor[i], this.collectorColor[i], frame/this.nFrames);
    		this.drawCollectorNode(i, color);    		    		
    		//collector-master links:
    		color = interpolateColor(this.oldMasterLinkColor[i], this.masterLinkColor[i], frame/this.nFrames);
    		this.drawMasterLink(i, color);
    	}		

    	//master node:
		color = interpolateColor(this.oldMasterColor, this.masterColor, frame/this.nFrames);
		this.drawMasterNode(this.centerX, this.centerY, color);



	};

    this.drawNodeMap = function(){
    	var i;

    	for(i=0; i<16; i++){
    		//digi summary nodes:
    		color = interpolateColor(this.oldDigiSummaryColor[i], this.digiSummaryColor[i], 1);
    		this.drawSummaryDigitizerNode(i, color);
    		//collector-digi summary links:
    		color = interpolateColor(this.oldCollectorLinkColor[i], this.collectorLinkColor[i], 1);
    		this.drawSummaryDigitizerNodeLink(i, color);
    		//collecter nodes:
    		color = interpolateColor(this.oldCollectorColor[i], this.collectorColor[i], 1);
    		this.drawCollectorNode(i, color);    		    		
    		//collector-master links:
    		color = interpolateColor(this.oldMasterLinkColor[i], this.masterLinkColor[i], 1);
    		this.drawMasterLink(i, color);
    	}		

    	//master node:
		color = interpolateColor(this.oldMasterColor, this.masterColor, 1);
		this.drawMasterNode(this.centerX, this.centerY, color);
    };

    this.drawDetail = function(frame){
    	this.context.clearRect(0,0, this.canvasWidth, this.canvasWidth);
    	this.drawNodeMap();
    	if(this.presentCollector != this.inboundCollector){
	    	this.drawDigiDetail(this.inboundCollector, frame, frame)
    		if(this.presentCollector != -1) this.drawDigiDetail(this.presentCollector,this.nFrames - frame, this.nFrames - frame);
    		if(frame == this.nFrames) this.presentCollector = this.inboundCollector;
    	} else {
    		this.drawDigiDetail(this.inboundCollector, this.nFrames - frame, this.nFrames - frame);
    		if(frame == this.nFrames) this.presentCollector = -1;
    	}
    }

    this.drawMasterNode = function(xCenter, yCenter, color){

    	this.context.strokeStyle = color;
    	this.context.fillStyle = color;
    	this.context.beginPath();
    	this.context.arc(xCenter, yCenter, 14, 0, 2*Math.PI);
    	this.context.closePath();
		this.context.fill();
		this.context.stroke();

    	this.context.fillStyle = this.bkgColor;
    	this.context.beginPath();
    	this.context.arc(xCenter, yCenter, 12, 0, 2*Math.PI);
    	this.context.closePath();
		this.context.fill();

    	this.context.fillStyle = color;
    	this.context.beginPath();
    	this.context.arc(xCenter, yCenter, 10, 0, 2*Math.PI);
    	this.context.closePath();
		this.context.fill();
		this.context.stroke();

    	this.context.fillStyle = this.bkgColor;
    	this.context.beginPath();
    	this.context.arc(xCenter, yCenter, 8, 0, 2*Math.PI);
    	this.context.closePath();
		this.context.fill();

		this.context.fillStyle = color;
    	this.context.beginPath();
    	this.context.arc(xCenter, yCenter, 5, 0, 2*Math.PI);
    	this.context.closePath();
		this.context.fill();
		this.context.stroke();			
    };

    this.drawCollectorNode = function(index, color){
    	this.context.save();
    	this.context.translate(this.centerX, this.centerY);
    	this.context.rotate(-Math.PI/2 + index*22.5/180*Math.PI);

    	this.context.fillStyle = color;
    	this.context.beginPath();
    	this.context.arc(0, -this.collectorRingRadius, 8, 0, 2*Math.PI);
    	this.context.closePath();
		this.context.fill();

    	this.context.fillStyle = this.bkgColor;
    	this.context.beginPath();
    	this.context.arc(0, -this.collectorRingRadius, 6, 0, 2*Math.PI);
    	this.context.closePath();
		this.context.fill();

		this.context.fillStyle = color;
    	this.context.beginPath();
    	this.context.arc(0, -this.collectorRingRadius, 3, 0, 2*Math.PI);
    	this.context.closePath();
		this.context.fill();	

		this.context.restore();
    };

    this.drawSummaryDigitizerNode = function(index, color){
    	this.context.strokeStyle = color;
		this.context.fillStyle = color;
    	this.context.save();
    	this.context.translate(this.centerX, this.centerY);
    	this.context.rotate(-Math.PI/2 + index*22.5/180*Math.PI);
    	this.context.beginPath();
    	this.context.arc(0, -2*this.collectorRingRadius, 3, 0, 2*Math.PI);
    	this.context.closePath();
		this.context.fill();	
		this.context.stroke();
		this.context.restore();	
    };

    this.drawMasterLink = function(index, color){
    	this.context.strokeStyle = color;
    	this.context.save();
    	this.context.translate(this.centerX, this.centerY);
    	this.context.rotate(-Math.PI/2 + index*22.5/180*Math.PI);
    	this.context.moveTo(0, -14);
    	this.context.lineTo(0, -this.collectorRingRadius + 8);
    	this.context.stroke();
    	this.context.restore();
    };

    this.drawSummaryDigitizerNodeLink = function(index, color){
    	this.context.strokeStyle = color;
    	this.context.save();
    	this.context.translate(this.centerX, this.centerY);
    	this.context.rotate(-Math.PI/2 + index*22.5/180*Math.PI);
    	this.context.moveTo(0, -this.collectorRingRadius-8);
    	this.context.lineTo(0, -2*this.collectorRingRadius+3);
    	this.context.stroke();
    	this.context.restore();
    };

    this.drawDigiDetail = function(collectorIndex, colorFrame, sizeFrame){
    	var i, j; 

    	var groupLinkLength = 100*Math.min(sizeFrame/(this.nFrames/2), 1 );
    	var digiLinkLength = 30*Math.max(0,(sizeFrame-this.nFrames/2)/(this.nFrames/2));

    	//rotate canvas to place this collector due north:
    	this.context.save();
    	this.context.translate(this.centerX, this.centerY);
    	this.context.rotate((90 - 22.5*collectorIndex)/180*Math.PI);

    	//draw digitizer group links:
    	for(i=0; i<4; i++){    		
    		var groupLinkEndX = 0 - groupLinkLength*Math.cos( (30+i*40)/180*Math.PI);
    		var groupLinkEndY = -2*this.collectorRingRadius - groupLinkLength*Math.sin( (30+i*40)/180*Math.PI);
    		this.context.strokeStyle = interpolateColor(this.oldDigiGroupSummaryColor[collectorIndex][i], this.digiGroupSummaryColor[collectorIndex][i], colorFrame);
    		this.context.beginPath();
    		this.context.moveTo(0, -2*this.collectorRingRadius);
    		this.context.lineTo(groupLinkEndX, groupLinkEndY);
    		this.context.stroke();

    		//draw individual digitizer links
    		for(j=0; j<4; j++){
    			var digiLinkEndX = groupLinkEndX - digiLinkLength*Math.cos( (30+j*40 - (60-40*i) )/180*Math.PI);
    			var digiLinkEndY = groupLinkEndY - digiLinkLength*Math.sin( (30+j*40 - (60-40*i) )/180*Math.PI);
    			this.context.strokeStyle = interpolateColor(this.oldDigitizerLinkColor[collectorIndex][i][j], this.digitizerLinkColor[collectorIndex][i][j], colorFrame);
    			this.context.beginPath();
    			this.context.moveTo(groupLinkEndX, groupLinkEndY);
    			this.context.lineTo(digiLinkEndX, digiLinkEndY);
    			this.context.stroke();

    			//draw digitizer node on the end:
    			this.context.fillStyle = interpolateColor(this.oldDigitizerColor[collectorIndex][i][j], this.digitizerColor[collectorIndex][i][j], colorFrame);
    			this.context.beginPath();
    			this.context.arc(digiLinkEndX, digiLinkEndY, 3, 0, 2*Math.PI);
    			this.context.closePath();	
    			this.context.fill();
    		}
    	}

    	this.context.restore();

    };

    this.swapDetail = function(x, y){
    	//decide which collector the user is clicking on:
		var phi = -Math.atan( (y-this.centerY)/(x-this.centerX) );
		var radius = Math.sqrt( Math.pow(x-this.centerX ,2) + Math.pow(y-this.centerY ,2) );
		//need to correct for atan mapping only onto [-pi/2, pi/2];
		if(x < this.centerX)
			phi = Math.PI + phi;
		else if(y > this.centerY)
			phi = 2*Math.PI + phi;
		
			var collector = Math.floor((phi + 22.5/2*Math.PI/180) / (22.5/180*Math.PI) );
			collector = collector%16;
			this.inboundCollector = collector

		if(radius < 2*this.collectorRingRadius && radius > 14){
			animateDetail(this,0)
		}

    };

}

//copy of animate from utilities, for use on a different animation process than the passive updates
function animateDetail(thing, frame){

    thing.drawDetail(frame);
    if(frame < thing.nFrames){
        frame++;
        setTimeout(function(){animateDetail(thing, frame)},thing.duration/thing.FPS*1000);
    }
}











