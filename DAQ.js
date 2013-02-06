function DAQ(monitor, canvas, tooltip, minima, maxima){
	var i, j, k, m, n;

	var that = this;

	this.monitorID = monitor;		//div ID of wrapper div
	this.canvasID = canvas;			//ID of canvas to draw DESCANT on
	//this.tooltip = tooltip;			//tooltip associated with this object
	this.minima = minima;			//minima of element scalea: [master, master group, master link, collector, digi summary link, digi summary node, digi group link, digi transfer, digitizer]
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
    this.collectorWidth = 0.9*(this.canvasWidth-10) / this.nCollectors;
    this.collectorHeight = 100;

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
    this.masterRate = [0];
    this.masterColor = [0,0,0];
    this.oldMasterColor = [0,0,0];
    //master group links
    this.masterGroupRate = [];
    this.masterGroupColor = [];
    this.oldMasterGroupColor = [];
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

    for(i=0; i<Math.ceil(nCollectors/4); i++){
        this.masterGroupRate[i] = 0;
        this.masterGroupColor[i] = [];
    	this.oldMasterGroupColor[i] = [];
    	this.masterLinkRate[i] = [];
	    this.masterLinkColor[i] = [];
    	this.oldMasterLinkColor[i] = [];
    	this.collectorRate[i] = [];
    	this.collectorColor[i] = [];
    	this.oldCollectorColor[i] = [];
    	this.collectorLinkRate[i] = [];
   		this.collectorLinkColor[i] = [];
    	this.oldCollectorLinkColor[i] = [];
    	this.digiSummaryRate[i] = [];
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
    		this.masterGroupColor[i][j] = 0;
    		this.oldMasterGroupColor[i][j] = 0;
    	}

    	for(j=0; j<4; j++){
    		this.masterLinkRate[i][j] = 0;
	    	this.masterLinkColor[i][j] = [];
    		this.oldMasterLinkColor[i][j] = [];
    		this.collectorRate[i][j] = 0;
    		this.collectorColor[i][j] = [];
    		this.oldCollectorColor[i][j] = [];
    		this.collectorLinkRate[i][j] = 0
    		this.collectorLinkColor[i][j] = [];
    		this.oldCollectorLinkColor[i][j] = [];
    		this.digiSummaryRate[i][j] = 0;
    		this.digiSummaryColor[i][j] = [];
    		this.oldDigiSummaryColor[i][j] = [];
    		this.digiGroupSummaryRate[i][j] = [];
	    	this.digiGroupSummaryColor[i][j] = [];
	    	this.oldDigiGroupSummaryColor[i][j] = [];
		    this.digitizerLinkRate[i][j] = [];
		   	this.digitizerLinkColor[i][j] = [];
		  	this.oldDigitizerLinkColor[i][j] = [];
		 	this.digitizerRate[i][j] = [];
			this.digitizerColor[i][j] = [];
	   		this.oldDigitizerColor[i][j] = [];

    		for(k=0; k<3; k++){
	      		this.masterLinkColor[i][j][k] = 0;
    			this.oldMasterLinkColor[i][j][k] = 0;
    			this.collectorColor[i][j][k] = 0;
    			this.oldCollectorColor[i][j][k] = 0;
	    		this.collectorLinkColor[i][j][k] = 0;
    			this.oldCollectorLinkColor[i][j][k] = 0;
    			this.digiSummaryColor[i][j][k] = 0;
    			this.oldDigiSummaryColor[i][j][k] = 0;  			
    		}

    		for(k=0; k<4; k++){
    			this.digiGroupSummaryRate[i][j][k] = 0;
	    		this.digiGroupSummaryColor[i][j][k] = [];
		    	this.oldDigiGroupSummaryColor[i][j][k] = [];
		    	this.digitizerLinkRate[i][j][k] = [];
		    	this.digitizerLinkColor[i][j][k] = [];
		   		this.oldDigitizerLinkColor[i][j][k] = [];
		   		this.digitizerRate[i][j][k] = [];
		   		this.digitizerColor[i][j][k] = [];
		   		this.oldDigitizerColor[i][j][k] = [];		    	

		    	for(m=0; m<3; m++){
		    		this.digiGroupSummaryColor[i][j][k][m] = 0;
			    	this.oldDigiGroupSummaryColor[i][j][k][m] = 0;
		    	}

		    	for(m=0; m<4; m++){
		    		this.digitizerLinkRate[i][j][k][m] = 0;
		    		this.digitizerLinkColor[i][j][k][m] = [];
		    		this.oldDigitizerLinkColor[i][j][k][m] = [];
		    		this.digitizerRate[i][j][k][m] = 0;
		    		this.digitizerColor[i][j][k][m] = [];
		    		this.oldDigitizerColor[i][j][k][m] = [];
		    		for(n=0; n<3; n++){
		    			this.digitizerLinkColor[i][j][k][m][n] = 0;
			    		this.oldDigitizerLinkColor[i][j][k][m][n] = 0;
			    		this.digitizerColor[i][j][k][m][n] = 0;
			    		this.oldDigitizerColor[i][j][k][m][n] = 0;
		    		}
		    	}
    		}
    	}

	} //finished declaring data buffers; recall indices go [collector group][collector][digitizer group][digitizer][RGB].

	//update the info for each cell in the monitor
	this.update = function(masterRate, masterGroupRate, masterLinkRate, collectorRate, collectorLinkRate, digiSummaryRate, digiGroupSummaryRate, digitizerLinkRate, digitizerRate){
		var i,j,k,m,n;

		//master
    	this.masterRate[0] = masterRate;
	    for(i=0; i<3; i++){
    		this.oldMasterColor[i] = this.masterColor[i];
	    }
    	this.masterColor = this.parseColor(masterRate[0], 0);

    	//master groups
    	for(i=0; i<Math.ceil(this.nCollectors/4); i++){
    		this.masterGroupRate[i] = masterGroupRate[i];
    		for(j=0; j<3; j++){
    			this.oldMasterGroupColor[i][j] = this.masterGroupColor[i][j];
    		}
    		this.masterGroupColor[i] = this.parseColor(masterGroupRate[i], 1);

		    //links from collectors to master, collectors, links from digitizer summary node to collector, digitizer summary nodes
    		for(j=0; j<4; j++){
    			this.masterLinkRate[i][j] = masterLinkRate[i][j];
	    		this.collectorRate[i][j] = collectorRate[i][j];
	    		this.collectorLinkRate[i][j] = collectorLinkRate[i][j];
    			this.digiSummaryRate[i][j] = digiSummaryRate[i][j];
	    		for(k=0; k<3; k++){
    				this.oldMasterLinkColor[i][j][k] = this.masterLinkColor[i][j][k];
    				this.oldCollectorColor[i][j][k] = this.collectorColor[i][j][k];
	    			this.oldCollectorLinkColor[i][j][k] = this.collectorLinkColor[i][j][k];
		    		this.oldDigiSummaryColor[i][j][k] = this.digiSummaryColor[i][j][k];
    			}
    			this.masterLinkColor[i][j] = this.parseColor(masterLinkRate[i][j], 2);
		    	this.collectorColor[i][j] = this.parseColor(collectorRate[i][j], 3);
    			this.collectorLinkColor[i][j] = this.parseColor(collectorLinkRate[i][j],4);
    			this.digiSummaryColor[i][j] = this.parseColor(digiSummaryRate[i][j],5);
	    		//links from digitizer group to digitizer summary node
	    		for(k=0; k<4; k++){	
    				this.digiGroupSummaryRate[i][j][k] = digiGroupSummaryRate[i][j][k];
	    			for(m=0; m<3; m++){
    					this.oldDigiGroupSummaryColor[i][j][k][m] = this.digiGroupSummaryColor[i][j][k][m];
	    			}
    				this.digiGroupSummaryColor[i][j][k] = this.parseColor(digiGroupSummaryRate[i][j][k], 6);
    				//individual digitizers and links:
    				for(m=0; m<4; m++){
    					this.digitizerLinkRate[i][j][k][m] = digitizerLinkRate[i][j][k][m];
		    			this.digitizerRate[i][j][k][m] = digitizerRate[i][j][k][m];
    					for(n=0; n<3; n++){
    						this.oldDigitizerLinkColor[i][j][k][m][n] = this.digitizerLinkColor[i][j][k][m][n];
    						this.oldDigitizerColor[i][j][k][m][n] = this.digitizerColor[i][j][k][m][n];
    					}
	    				this.digitizerLinkColor[i][j][k][m] = this.parseColor(digitizerLinkRate[i][j][k][m], 7);
    					this.digitizerColor[i][j][k][m] = this.parseColor(digitizerRate[i][j][k][m], 8);    				
    				}	
    			}
	    	}
    	}

    	animate(this,0);

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
    	//if(this.presentCollector != -1)
	    //	this.drawDigiDetail(this.presentCollector, frame, this.nFrames);

    	//master node:
		color = interpolateColor(this.oldMasterColor, this.masterColor, frame/this.nFrames);
		this.drawMasterNode(this.centerX, this.centerY, color);	    

		for(i=0; i<Math.ceil(this.nCollectors/4); i++){
			//master group links
    		color = interpolateColor(this.oldMasterGroupColor[i], this.masterGroupColor[i], frame/this.nFrames);
	    	this.drawMasterGroupLink(i, color);
			for(j=0; j<4; j++){
    			//digi summary nodes:
    			color = interpolateColor(this.oldDigiSummaryColor[i][j], this.digiSummaryColor[i][j], frame/this.nFrames);
	    		this.drawSummaryDigitizerNode(i*Math.ceil(this.nCollectors/4)+j, color);
    			//collector-digi summary links:
    			color = interpolateColor(this.oldCollectorLinkColor[i][j], this.collectorLinkColor[i][j], frame/this.nFrames);
    			this.drawSummaryDigitizerNodeLink(i*4+j, color);
	    		//collecter nodes:
    			color = interpolateColor(this.oldCollectorColor[i][j], this.collectorColor[i][j], frame/this.nFrames);
    			this.drawCollectorNode(i*Math.ceil(this.nCollectors/4)+j, color);    		    		
    			//collector links:
	    		color = interpolateColor(this.oldMasterLinkColor[i][j], this.masterLinkColor[i][j], frame/this.nFrames);
    			this.drawMasterLink(i*Math.ceil(this.nCollectors/4)+j, color);

			}
		}
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
    		//master group links:
    		color = 0;
    		this.drawMasterGroupLink(Math.floor(i/4), color );
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

    	this.context.strokeStyle = '#000000';
    	this.context.fillStyle = '#4C4C4C'//color;		
		roundBox(this.context, 5, 5, this.canvasWidth-10, 100, 5);
		this.context.stroke();
		this.context.fill();
    };

    this.drawCollectorNode = function(index, color){

    	this.context.strokeStyle = '#000000';
    	this.context.fillStyle = '#4C4C4C';
		roundBox(this.context, 5+0.05*this.collectorWidth + index*this.collectorWidth/0.9, 225, this.collectorWidth, this.collectorHeight, 5);
		this.context.stroke();
		this.context.fill();
    };

    this.drawSummaryDigitizerNode = function(index, color){

    	this.context.strokeStyle = '#000000';
    	this.context.fillStyle = '#4C4C4C';
		roundBox(this.context, 5+0.05*this.collectorWidth + index*this.collectorWidth/0.9, 425, this.collectorWidth, this.collectorHeight, 5);
		this.context.stroke();
		this.context.fill();
    };

    this.drawMasterGroupLink = function(index, color){
    	this.context.strokeStyle = '#000000';
    	this.context.fillStyle = '#000000';
 		this.context.moveTo(5+0.1*this.collectorWidth*2 + 2*this.collectorWidth + index*4*this.collectorWidth/0.9, 105);
 		this.context.lineTo(5+0.1*this.collectorWidth*2 + 2*this.collectorWidth + index*4*this.collectorWidth/0.9, 155);
 		this.context.stroke();
    };

    this.drawMasterLink = function(index, color){
    	this.context.strokeStyle = '#000000';
    	this.context.fillStyle = '#000000';
 		this.context.moveTo(5+0.1*this.collectorWidth*2 + 2*this.collectorWidth + Math.floor(index/4)*4*this.collectorWidth/0.9, 155);
 		this.context.lineTo(5 + 0.55*this.collectorWidth + index*this.collectorWidth/0.9, 225)
 		this.context.stroke();
    };

    this.drawSummaryDigitizerNodeLink = function(index, color){
    	
    	this.context.strokeStyle = '#000000';
    	this.context.fillStyle = '#000000';
    	this.context.moveTo(5+0.05*this.collectorWidth + this.collectorWidth*0.5 + index*this.collectorWidth/0.9, 225+this.collectorHeight);
    	this.context.lineTo(5+0.05*this.collectorWidth + this.collectorWidth*0.5 + index*this.collectorWidth/0.9, 425)
    	this.context.stroke();
    	
    };

    this.drawDigiDetail = function(collectorIndex, colorFrame, sizeFrame){
    	/*
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
		*/
    };

    this.swapDetail = function(x, y){
    	/*
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
		*/
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











