function DAQ(monitor, canvas, tooltip, minima, maxima){
	var i, j, k, m;

	var that = this;

	this.monitorID = monitor;		//div ID of wrapper div
	this.canvasID = canvas;			//ID of canvas to draw DESCANT on
	//this.tooltip = tooltip;			//tooltip associated with this object
	this.minima = minima;			//minima of element scalea: [master, master group, master link, collector, digi summary link, digi summary node, digi group link, digi transfer, digitizer]
	this.maxima = maxima;			//as minima.
	this.nCollectors = 16;
	this.nDigitizers = this.nCollectors*16;

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
    this.masterColor = '#000000';
    this.oldMasterColor = '#000000';
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

    for(i=0; i<Math.ceil(this.nCollectors/4); i++){
        this.masterGroupRate[i] = 0;
        this.masterGroupColor[i] = '#000000';
        this.oldMasterGroupColor[i] = '#000000';        
    }
    for(i=0; i<4*Math.ceil(this.nCollectors/4); i++){
        this.masterLinkRate[i] = 0;
        this.masterLinkColor[i] = '#000000';
        this.oldMasterLinkColor[i] = '#000000';
        this.collectorRate[i] = 0;
        this.collectorColor[i] = '#000000';
        this.oldCollectorColor[i] = '#000000';
        this.collectorLinkRate[i] = 0;
        this.collectorLinkColor[i] = '#000000';
        this.oldCollectorLinkColor[i] = '#000000';
        this.digiSummaryRate[i] = 0;
        this.digiSummaryColor[i] = '#000000';
        this.oldDigiSummaryColor[i] = '#000000';        
    }
    for(i=0; i<4*4*Math.ceil(this.nCollectors/4); i++){
        this.digiGroupSummaryRate[i] = 0;
        this.digiGroupSummaryColor[i] = '#000000';
        this.oldDigiGroupSummaryColor[i] = '#000000';        
    }
    for(i=0; i<4*4*4*Math.ceil(this.nCollectors/4); i++){
        this.digitizerLinkRate[i] = 0;
        this.digitizerLinkColor[i] = '#000000';
        this.oldDigitizerLinkColor[i] = '#000000';
        this.digitizerRate[i] = 0;
        this.digitizerColor[i] = '#000000';
        this.oldDigitizerColor[i] = '#000000';        
    }

	//update the info for each cell in the monitor
	this.update = function(masterRate, masterGroupRate, masterLinkRate, collectorRate, collectorLinkRate, digiSummaryRate, digiGroupSummaryRate, digitizerLinkRate, digitizerRate){
		var i,j,k,m;

		//master
    	this.masterRate[0] = masterRate;
    	this.oldMasterColor = this.masterColor;
    	this.masterColor = this.parseColor(masterRate[0], 0);

        //master groups
        for(i=0; i<Math.ceil(nCollectors/4); i++){
            this.masterGroupRate[i] = masterGroupRate[i];  
            this.oldMasterGroupColor[i] = this.masterGroupColor[i];
            this.masterGroupColor[i] = this.parseColor(this.masterGroupRate[i],1)    
        }

		//links from collectors to master, collectors, links from digitizer summary node to collector, digitizer summary nodes
    	for(i=0; i<4*Math.ceil(nCollectors/4); i++){
    		this.masterLinkRate[i] = masterLinkRate[i];
	    	this.collectorRate[i] = collectorRate[i];
	   		this.collectorLinkRate[i] = collectorLinkRate[i];
    		this.digiSummaryRate[i] = digiSummaryRate[i];

    		this.oldMasterLinkColor[i] = this.masterLinkColor[i];
    		this.oldCollectorColor[i] = this.collectorColor[i];
	   		this.oldCollectorLinkColor[i] = this.collectorLinkColor[i];
	 		this.oldDigiSummaryColor[i] = this.digiSummaryColor[i];

    		this.masterLinkColor[i] = this.parseColor(masterLinkRate[i], 2);
		  	this.collectorColor[i] = this.parseColor(collectorRate[i], 3);
    		this.collectorLinkColor[i] = this.parseColor(collectorLinkRate[i],4);
			this.digiSummaryColor[i] = this.parseColor(digiSummaryRate[i],5);
        }
	    //links from digitizer group to digitizer summary node
	    for(i=0; i<4*4*Math.ceil(nCollectors/4); i++){	
    		this.digiGroupSummaryRate[i] = digiGroupSummaryRate[i];
    		this.oldDigiGroupSummaryColor[i] = this.digiGroupSummaryColor[i];
			this.digiGroupSummaryColor[i] = this.parseColor(digiGroupSummaryRate[i], 6);
        }

    	//individual digitizers and links:
    	for(i=0; i<4*4*4*Math.ceil(nCollectors/4); i++){
    		this.digitizerLinkRate[i] = digitizerLinkRate[i];
		    this.digitizerRate[i] = digitizerRate[i];
       		this.oldDigitizerLinkColor[i] = this.digitizerLinkColor[i];
    		this.oldDigitizerColor[i] = this.digitizerColor[i];	
	   		this.digitizerLinkColor[i] = this.parseColor(digitizerLinkRate[i], 7);
			this.digitizerColor[i] = this.parseColor(digitizerRate[i], 8);    				
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

		this.context.clearRect(0,0, this.canvasWidth, this.canvasHeight - 110);

        if(frame == this.nFrames){
            this.drawScale();
        }
        this.context.lineWidth = 2;

    	//digitizer summary detail
    	//if(this.presentCollector != -1)
	    //	this.drawDigiDetail(this.presentCollector, frame, this.nFrames);

    	//master node:
		color = interpolateColor(parseHexColor(this.oldMasterColor), parseHexColor(this.masterColor), frame/this.nFrames);
		this.drawMasterNode(color);

		for(i=0; i<Math.ceil(this.nCollectors/4); i++){
			//master group links
    		color = interpolateColor(parseHexColor(this.oldMasterGroupColor[i]), parseHexColor(this.masterGroupColor[i]), frame/this.nFrames);
	    	this.drawMasterGroupLink(i, color);
        }
        for(i=0; i<4*Math.ceil(this.nCollectors/4); i++){
    		//digi summary nodes:
    		color = interpolateColor(parseHexColor(this.oldDigiSummaryColor[i]), parseHexColor(this.digiSummaryColor[i]), frame/this.nFrames);
	   		this.drawSummaryDigitizerNode(i, color);
    		//collector-digi summary links:
    		color = interpolateColor(parseHexColor(this.oldCollectorLinkColor[i]), parseHexColor(this.collectorLinkColor[i]), frame/this.nFrames);
    		this.drawSummaryDigitizerNodeLink(i, color);
	   		//collecter nodes:
    		color = interpolateColor(parseHexColor(this.oldCollectorColor[i]), parseHexColor(this.collectorColor[i]), frame/this.nFrames);
			this.drawCollectorNode(i, color);    		    		
    		//collector links:
	    	color = interpolateColor(parseHexColor(this.oldMasterLinkColor[i]), parseHexColor(this.masterLinkColor[i]), frame/this.nFrames);
    		this.drawMasterLink(i, color); 
		}

	};

    this.drawScale = function(){
        var i, j; 
        var scaleHeight = 110;
        this.context.clearRect(0, this.canvasHeight - scaleHeight, this.canvasWidth, this.canvasHeight);

        //titles
        this.context.fillStyle = '#999999';
        this.context.font="24px 'Orbitron'";
        this.context.fillText('Transfer Rate', this.canvasWidth/2 - this.context.measureText('Transfer Rate').width/2, this.canvasHeight-scaleHeight/2-10);
        this.context.fillText('Trigger Rate', this.canvasWidth/2 - this.context.measureText('Trigger Rate').width/2, this.canvasHeight-8);

        //tickmarks
        this.context.strokeStyle = '#999999';
        this.context.lineWidth = 1;
        this.context.font="12px 'Raleway'";

        this.context.beginPath();
        this.context.moveTo(this.canvasWidth*0.05+1, this.canvasHeight - scaleHeight/2);
        this.context.lineTo(this.canvasWidth*0.05+1, this.canvasHeight - scaleHeight/2-10);
        this.context.stroke();
        this.context.fillText('0 Mb/s', this.canvasWidth*0.05 - this.context.measureText('0 Mb/s').width/2, this.canvasHeight-scaleHeight/2-15);

        this.context.beginPath();
        this.context.moveTo(this.canvasWidth*0.95-1, this.canvasHeight - scaleHeight/2);
        this.context.lineTo(this.canvasWidth*0.95-1, this.canvasHeight - scaleHeight/2-10); 
        this.context.stroke();      
        this.context.fillText('100 Mb/s', this.canvasWidth*0.95 - this.context.measureText('100 Mb/s').width/2, this.canvasHeight-scaleHeight/2-15);

        this.context.beginPath();
        this.context.moveTo(this.canvasWidth*0.05+1, this.canvasHeight - scaleHeight/2 + 20);
        this.context.lineTo(this.canvasWidth*0.05+1, this.canvasHeight - scaleHeight/2 + 20 + 10);
        this.context.stroke();
        this.context.fillText('0 Hz', this.canvasWidth*0.05 - this.context.measureText('0 Hz').width/2, this.canvasHeight-scaleHeight/2 + 45);

        this.context.beginPath();
        this.context.moveTo(this.canvasWidth*0.95-1, this.canvasHeight - scaleHeight/2 + 20);
        this.context.lineTo(this.canvasWidth*0.95-1, this.canvasHeight - scaleHeight/2 + 20 + 10); 
        this.context.stroke();      
        this.context.fillText('1 MHz', this.canvasWidth*0.95 - this.context.measureText('1 MHz').width/2, this.canvasHeight-scaleHeight/2 + 45);

        for(i=0; i<3000; i++){
            this.context.fillStyle = redScale(0.001*(i%1000));
            this.context.fillRect(this.canvasWidth*0.05 + this.canvasWidth*0.9/1000*(i%1000), this.canvasHeight-scaleHeight/2, this.canvasWidth*0.9/1000, 20);
        }

    };

    this.drawMasterNode = function(color){

    	this.context.strokeStyle = color;
    	this.context.fillStyle = '#4C4C4C'//color;		
		roundBox(this.context, 5, 5, this.canvasWidth-10, 100, 5);
		this.context.stroke();
		this.context.fill();
    };

    this.drawCollectorNode = function(index, color){

    	this.context.strokeStyle = color;
    	this.context.fillStyle = '#4C4C4C';
		roundBox(this.context, 5+0.05*this.collectorWidth + index*this.collectorWidth/0.9, 225, this.collectorWidth, this.collectorHeight, 5);
		this.context.stroke();
		this.context.fill();
    };

    this.drawSummaryDigitizerNode = function(index, color){

    	this.context.strokeStyle = color;
    	this.context.fillStyle = '#4C4C4C';
        //this.context.beginPath();
        //this.context.arc( 5+0.05*this.collectorWidth + index*this.collectorWidth/0.9, 525, this.collectorWidth/2, 0, 2*Math.PI);
        //this.context.closePath();
		roundBox(this.context, 5+0.05*this.collectorWidth + index*this.collectorWidth/0.9, 425, this.collectorWidth, this.collectorHeight, 5);
		this.context.stroke();
		this.context.fill();
    };

    this.drawMasterGroupLink = function(index, color){
    	this.context.strokeStyle = color;
    	this.context.fillStyle = color;
 		this.context.moveTo(5+0.1*this.collectorWidth*2 + 2*this.collectorWidth + index*4*this.collectorWidth/0.9, 105);
 		this.context.lineTo(5+0.1*this.collectorWidth*2 + 2*this.collectorWidth + index*4*this.collectorWidth/0.9, 155);
 		this.context.stroke();
    };

    this.drawMasterLink = function(index, color){
    	this.context.strokeStyle = color;
    	this.context.fillStyle = color;
 		this.context.moveTo(5+0.1*this.collectorWidth*2 + 2*this.collectorWidth + Math.floor(index/4)*4*this.collectorWidth/0.9, 155);
 		this.context.lineTo(5 + 0.55*this.collectorWidth + index*this.collectorWidth/0.9, 225)
 		this.context.stroke();
    };

    this.drawSummaryDigitizerNodeLink = function(index, color){
    	
    	this.context.strokeStyle = color;
    	this.context.fillStyle = color;
    	this.context.moveTo(5+0.05*this.collectorWidth + this.collectorWidth*0.5 + index*this.collectorWidth/0.9, 225+this.collectorHeight);
    	this.context.lineTo(5+0.05*this.collectorWidth + this.collectorWidth*0.5 + index*this.collectorWidth/0.9, 425)
    	this.context.stroke();
    	
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
        window.transAnimateLoop = setTimeout(function(){animateDetail(thing, frame)},thing.duration/thing.FPS*1000);
    }
}











