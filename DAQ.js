function DAQ(monitor, canvas, detailCanvas, tooltip, minima, maxima){
	var i, j, k, m;

	var that = this;

	this.monitorID = monitor;		        //div ID of wrapper div
	this.canvasID = canvas;			        //ID of canvas to draw DAQ on
    this.detailCanvasID = detailCanvas;     //ID of canvas to draw detailed view on
	//this.tooltip = tooltip;			    //tooltip associated with this object
	this.minima = minima;			        //minima of element scalea: [master, master group, master link, collector, digi summary link, digi summary node, digi group link, digi transfer, digitizer]
	this.maxima = maxima;			        //as minima.
    this.nCollectorGroups = 4;
    if(this.nCollectorGroups == 0)
        this.nCollectors = 12;
    else
    	this.nCollectors = this.nCollectorGroups*4;
    this.nDigitizerGroups = 4;
    if(this.nDigitizerGroups == 0)
        this.nDigitizers = 12;
    else
    	this.nDigitizers = this.nDigitizerGroups*4;

	this.canvas = document.getElementById(canvas);
	this.context = this.canvas.getContext('2d');
    this.detailCanvas = document.getElementById(detailCanvas);
    this.detailContext = this.detailCanvas.getContext('2d');
	this.monitor = document.getElementById(this.monitorID);

    //scale canvas//////////////////////////////////////////////////////////////////////////////////////
    this.canvasWidth = 0.48*$(this.monitor).width();
    this.canvasHeight = 0.8*$(this.monitor).height();
    this.canvas.setAttribute('width', this.canvasWidth);
    this.canvas.setAttribute('height', this.canvasHeight);
    this.detailCanvas.setAttribute('width', this.canvasWidth);
    this.detailCanvas.setAttribute('height', this.canvasHeight);

    //position canvas
    $('#'+canvas).css('top', $('#'+'DAQlinks').height() + 5 )
    $('#'+detailCanvas).css('top', $('#'+'DAQlinks').height() + 5 )

    //associate tooltip:
    //this.tooltip.obj = that;

    //drawing parameters//////////////////////////////////////////////
    this.collectorWidth = 0.9*(this.canvasWidth-10) / 16;
    this.collectorHeight = 1.5*this.collectorWidth; //100;

    this.cellColor = '#4C4C4C';
    this.lineweight = 2;

    this.scaleHeight = 110;

    this.margin = 5;
    this.collectorGutter = 0.1*this.collectorWidth;

    this.masterTop = 5;
    this.masterBottom = this.masterTop+1.5*this.collectorHeight;
    this.masterGroupLinkTop = this.masterBottom;
    this.masterGroupLinkBottom = this.masterGroupLinkTop + this.collectorHeight;
    this.masterLinkTop = this.masterGroupLinkBottom;
    this.masterLinkBottom = this.masterLinkTop + this.collectorHeight;
    this.collectorTop = this.masterLinkBottom;
    this.collectorBottom = this.collectorTop + this.collectorHeight;
    this.digiSummaryLinkTop = this.collectorBottom;
    this.digiSummaryLinkBottom = this.digiSummaryLinkTop + this.collectorHeight;
    this.digiSummaryTop = this.digiSummaryLinkBottom;
    this.digiSummaryBottom = this.digiSummaryTop + this.collectorHeight;

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

		this.context.clearRect(0,0, this.canvasWidth, this.canvasHeight - this.scaleHeight);

        if(frame == this.nFrames){
            this.drawScale(this.context);
        }
        this.context.lineWidth = this.lineweight;

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

    this.drawScale = function(context){
        var i, j; 
        context.clearRect(0, this.canvasHeight - this.scaleHeight, this.canvasWidth, this.canvasHeight);

        //titles
        context.fillStyle = '#999999';
        context.font="24px 'Orbitron'";
        context.fillText('Transfer Rate', this.canvasWidth/2 - context.measureText('Transfer Rate').width/2, this.canvasHeight-this.scaleHeight/2-10);
        context.fillText('Trigger Rate', this.canvasWidth/2 - context.measureText('Trigger Rate').width/2, this.canvasHeight-8);

        //tickmark;
        context.strokeStyle = '#999999';
        context.lineWidth = 1;
        context.font="12px 'Raleway'";

        context.beginPath();
        context.moveTo(this.canvasWidth*0.05+1, this.canvasHeight - this.scaleHeight/2);
        context.lineTo(this.canvasWidth*0.05+1, this.canvasHeight - this.scaleHeight/2-10);
        context.stroke();
        context.fillText('0 Mb/s', this.canvasWidth*0.05 - context.measureText('0 Mb/s').width/2, this.canvasHeight-this.scaleHeight/2-15);

        context.beginPath();
        context.moveTo(this.canvasWidth*0.95-1, this.canvasHeight - this.scaleHeight/2);
        context.lineTo(this.canvasWidth*0.95-1, this.canvasHeight - this.scaleHeight/2-10); 
        context.stroke();      
        context.fillText('100 Mb/s', this.canvasWidth*0.95 - context.measureText('100 Mb/s').width/2, this.canvasHeight-this.scaleHeight/2-15);

        context.beginPath();
        context.moveTo(this.canvasWidth*0.05+1, this.canvasHeight - this.scaleHeight/2 + 20);
        context.lineTo(this.canvasWidth*0.05+1, this.canvasHeight - this.scaleHeight/2 + 20 + 10);
        context.stroke();
        context.fillText('0 Hz', this.canvasWidth*0.05 - context.measureText('0 Hz').width/2, this.canvasHeight-this.scaleHeight/2 + 45);

        context.beginPath();
        context.moveTo(this.canvasWidth*0.95-1, this.canvasHeight - this.scaleHeight/2 + 20);
        context.lineTo(this.canvasWidth*0.95-1, this.canvasHeight - this.scaleHeight/2 + 20 + 10); 
        context.stroke();      
        context.fillText('1 MHz', this.canvasWidth*0.95 - context.measureText('1 MHz').width/2, this.canvasHeight-this.scaleHeight/2 + 45);

        for(i=0; i<3000; i++){
            context.fillStyle = redScale(0.001*(i%1000));
            context.fillRect(this.canvasWidth*0.05 + this.canvasWidth*0.9/1000*(i%1000), this.canvasHeight-this.scaleHeight/2, this.canvasWidth*0.9/1000, 20);
        }

    };

    this.drawMasterNode = function(color){

    	this.context.strokeStyle = color;
    	this.context.fillStyle = this.cellColor;		
		roundBox(this.context, this.margin, this.masterTop, this.canvasWidth-2*this.margin, this.masterBottom - this.masterTop, 5);
		this.context.fill();
        this.context.stroke();
    };

    this.drawCollectorNode = function(index, color){

    	this.context.strokeStyle = color;
    	this.context.fillStyle = this.cellColor;
		roundBox(this.context, this.margin + (Math.floor(index/4)+0.5)*(this.canvasWidth - 2*this.margin)/this.nCollectorGroups + (index%4 - 1.5)*(this.collectorWidth + this.collectorGutter) - this.collectorWidth/2, this.collectorTop, this.collectorWidth, this.collectorBottom - this.collectorTop, 5);
		this.context.stroke();
		this.context.fill();
    };

    this.drawSummaryDigitizerNode = function(index, color){

    	this.context.strokeStyle = color;
    	this.context.fillStyle = this.cellColor;
		roundBox(this.context, this.margin + (Math.floor(index/4)+0.5)*(this.canvasWidth - 2*this.margin)/this.nCollectorGroups + (index%4 - 1.5)*(this.collectorWidth + this.collectorGutter) - this.collectorWidth/2, this.digiSummaryTop, this.collectorWidth, this.digiSummaryBottom - this.digiSummaryTop, 5);
		this.context.fill();
        this.context.stroke();
    };

    this.drawMasterGroupLink = function(index, color){
    	this.context.strokeStyle = color;
    	this.context.fillStyle = color;
 		this.context.moveTo(this.margin + (index+0.5)*(this.canvasWidth - 2*this.margin)/this.nCollectorGroups, this.masterGroupLinkTop);
 		this.context.lineTo(this.margin + (index+0.5)*(this.canvasWidth - 2*this.margin)/this.nCollectorGroups, this.masterGroupLinkBottom);
 		this.context.stroke();
    };

    this.drawMasterLink = function(index, color){
    	this.context.strokeStyle = color;
    	this.context.fillStyle = color;
 		this.context.moveTo(this.margin + (Math.floor(index/4)+0.5)*(this.canvasWidth - 2*this.margin)/this.nCollectorGroups, this.masterLinkTop);
 		this.context.lineTo(this.margin + (Math.floor(index/4)+0.5)*(this.canvasWidth - 2*this.margin)/this.nCollectorGroups + (index%4 - 1.5)*(this.collectorWidth + this.collectorGutter), this.masterLinkBottom);
 		this.context.stroke();
    };

    this.drawSummaryDigitizerNodeLink = function(index, color){
    	
    	this.context.strokeStyle = color;
    	this.context.fillStyle = color;
    	this.context.moveTo(this.margin + (Math.floor(index/4)+0.5)*(this.canvasWidth - 2*this.margin)/this.nCollectorGroups + (index%4 - 1.5)*(this.collectorWidth + this.collectorGutter), this.digiSummaryLinkTop);
    	this.context.lineTo(this.margin + (Math.floor(index/4)+0.5)*(this.canvasWidth - 2*this.margin)/this.nCollectorGroups + (index%4 - 1.5)*(this.collectorWidth + this.collectorGutter), this.digiSummaryLinkBottom);
    	this.context.stroke();
    	
    };

    this.drawDetail = function(frame){
        var color, i;

        var topMargin = 30;
        var leftMargin = 5;

        if(frame == this.nFrames){
            this.drawScale(this.detailContext);
        }

        this.detailContext.fillStyle = this.cellColor;
        this.detailContext.lineWidth = this.lineweight;

        //collector index:
        var clctr = window.DAQdetail;

        //group connecters:
        for(i=4*clctr; i<4*clctr + 4; i++){
            this.detailContext.strokeStyle = interpolateColor(parseHexColor(this.oldDigiGroupSummaryColor[i]), parseHexColor(this.digiGroupSummaryColor[i]), frame/this.nFrames);
            this.detailContext.beginPath();
            this.detailContext.moveTo(this.canvasWidth/2 - this.collectorWidth*0.3 + this.collectorWidth*0.2*i, topMargin+this.collectorHeight);
            this.detailContext.lineTo( 0.12*this.canvasWidth + 0.76/3*this.canvasWidth*i, this.canvasHeight*0.4 + topMargin);
            this.detailContext.closePath();
            this.detailContext.stroke();
        }

        //digitizer connecters:
        for(i=16*clctr; i<16*clctr+16; i++){
            this.detailContext.strokeStyle = interpolateColor(parseHexColor(this.oldDigitizerLinkColor[i]), parseHexColor(this.digitizerLinkColor[i]), frame/this.nFrames);
            this.detailContext.beginPath();
            this.detailContext.moveTo( Math.floor( (i - 16*clctr)/4 )*0.76/3*this.canvasWidth + 0.12*this.canvasWidth, this.canvasHeight*0.4 + topMargin );
            this.detailContext.lineTo( Math.floor( (i - 16*clctr)/4 )*0.76/3*this.canvasWidth + 0.12*this.canvasWidth - this.canvasWidth*0.09 + (i%4)*this.canvasWidth*0.06, this.canvasHeight*0.6 + topMargin );
            this.detailContext.closePath();
            this.detailContext.stroke();   
        }

        //parent collector:
        this.detailContext.strokeStyle = interpolateColor(parseHexColor(this.oldCollectorColor[clctr]), parseHexColor(this.collectorColor[clctr]), frame/this.nFrames);
        roundBox(this.detailContext, this.canvasWidth/2 - this.collectorWidth/2, topMargin, this.collectorWidth, this.collectorHeight, 5);
        this.detailContext.fill();
        this.detailContext.stroke();

        //digitizers:
        for(i=16*clctr; i<16*clctr+16; i++){
            this.detailContext.strokeStyle = interpolateColor(parseHexColor(this.oldDigitizerColor[i]), parseHexColor(this.digitizerColor[i]), frame/this.nFrames);
            roundBox(this.detailContext, Math.floor( (i - 16*clctr)/4 )*0.76/3*this.canvasWidth + 0.12*this.canvasWidth - this.canvasWidth*0.09 + (i%4)*this.canvasWidth*0.06 - 0.02*this.canvasWidth , this.canvasHeight*0.6 + topMargin, 0.04*this.canvasWidth, 0.04*this.canvasWidth, 5);
            this.detailContext.fill();
            this.detailContext.stroke();
        }

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











