function DAQ(canvas, detailCanvas, prefix, postfix){
	var i, j, k, m;

	var that = this;
    //make a pointer at window level back to this object, so we can pass by reference to the nav button onclick
    window.DAQpointer = that;

	this.monitorID = window.parameters.wrapper;  //div ID of wrapper div
	this.canvasID = 'DAQcanvas';			     //ID of canvas to draw DAQ on
    this.detailCanvasID = 'DAQdetailCanvas';     //ID of canvas to draw detailed view on
    this.linkWrapperID = 'DAQlinks'              //ID of wrapper div for DAQ links
    this.topNavID = 'DAQbutton'                  //ID of button to navigate here in the top nav menu
    this.sidebarID = 'DAQsidebar'                //ID of right sidebar to associate with this object
    this.TTcanvasID = 'DAQTTcanvas'
    this.TTdetailCanvasID = 'DAQdetailTTcanvas'
	this.minima = window.parameters.DAQminima;   //minima of element scalea: [master, master group, master link, collector, digi summary link, digi summary node, digi group link, digi transfer, digitizer]
	this.maxima = window.parameters.DAQmaxima;   //as minima.
    this.detailShowing = 0;                      //is the detail canvas showing?
    this.dataBus = new DAQDS();

    this.nCollectorGroups = 0;  //fixed for now
    this.nCollectors = window.codex.nCollectors;
    this.nDigitizerGroups = 0;  //fixed for now
    this.nDigitizers = window.codex.nDigitizers;
    this.nDigitizersPerCollector = [];
    for(i=0; i<this.nCollectors; i++){
        this.nDigitizersPerCollector[i] = window.codex.nDigitizersPerCollector[i];
    }
    //how many digitizers came before the ith collector?
    this.prevDigi = [];
    this.prevDigi[0] = 0;
    for(i=1; i<this.nCollectors; i++){
        this.prevDigi[i] = this.prevDigi[i-1] + this.nDigitizersPerCollector[i-1];
    }

    //scale & insert DAQ canvases & navigation//////////////////////////////////////////////////////////////////////////////////////
    this.monitor = document.getElementById(this.monitorID);
    this.canvasWidth = 0.48*$(this.monitor).width();
    this.canvasHeight = 0.8*$(this.monitor).height();

    //navigation
    //top level nav button
    insertDOM('button', this.topNavID, 'navLink', '', 'statusLink', "javascript:swapView('DAQlinks', 'DAQcanvas', 'DAQsidebar', '"+this.topNavID+"')", 'DAQ', '', 'button')
    //nav wrapper div
    insertDOM('div', this.linkWrapperID, 'navPanel', '', this.monitorID, '', '')
    //nav header
    insertDOM('h1', 'DAQlinksBanner', 'navPanelHeader', '', this.linkWrapperID, '', window.parameters.ExpName+' DAQ Status')
    insertDOM('br', 'break', '', '', this.linkWrapperID, '', '')
    //nav buttons
    insertDOM('button', 'DAQToplink', 'navLinkDown', '', 'DAQlinks', "{window.DAQpointer.detailShowing=0; window.DAQdetail=-1; swapFade('DAQToplink', window.DAQpointer, 0, 0);}", 'Master', '', 'button')
    insertDOM('br', 'break', '', '', this.linkWrapperID, '', '')
    //p to label row of collector buttons
    insertDOM('p', 'DAQcollectorTitle', '', 'display:inline; color:#999999; margin-right:5px;', 'DAQlinks', '', 'Slave')
    //deploy collector buttons
    for(i=0; i<this.nCollectors; i++){
        insertDOM('button', 'Collector'+i, 'navLink', '', this.linkWrapperID, "{swapFade('Collector"+i+"', window.DAQpointer, 0, 1); window.DAQpointer.detailShowing=1; animateDetail(window.DAQpointer, 0); window.DAQdetail="+i+";}", i, '', 'button')
        $('#Collector'+i).width( ( 0.95*this.canvasWidth - $('#DAQcollectorTitle').width()) / this.nCollectors );
    }
    //right sidebar
    insertDOM('div', this.sidebarID, 'Sidebar', '', this.monitorID, '', '')

    //display canvases
    //top view
    insertDOM('canvas', this.canvasID, 'monitor', 'top: '+ ($('#DAQlinks').height() + 5) +'px;', this.monitorID, '', '')
    this.canvas = document.getElementById(canvas);
    this.context = this.canvas.getContext('2d');
    this.canvas.setAttribute('width', this.canvasWidth);
    this.canvas.setAttribute('height', this.canvasHeight);
    //detailed view
    insertDOM('canvas', this.detailCanvasID, 'monitor', 'top: '+ ($('#DAQlinks').height() + 5) +'px;', this.monitorID, '', '')
    this.detailCanvas = document.getElementById(detailCanvas);
    this.detailContext = this.detailCanvas.getContext('2d');
    this.detailCanvas.setAttribute('width', this.canvasWidth);
    this.detailCanvas.setAttribute('height', this.canvasHeight);
    //Tooltip for summary level
    insertDOM('canvas', this.TTcanvasID, 'monitor', 'top:' + ($('#DAQlinks').height()*1.25 + 5) +'px;', this.monitorID, '', '')
    this.TTcanvas = document.getElementById(this.TTcanvasID);
    this.TTcontext = this.TTcanvas.getContext('2d');
    this.TTcanvas.setAttribute('width', this.canvasWidth);
    this.TTcanvas.setAttribute('height', this.canvasHeight);    
    //hidden Tooltip map layer for detail
    insertDOM('canvas', this.TTdetailCanvasID, 'monitor', 'top:' + ($('#DAQlinks').height()*1.25 + 5) +'px;', this.monitorID, '', '')    
    this.TTdetailCanvas = document.getElementById(this.TTdetailCanvasID);
    this.TTdetailContext = this.TTdetailCanvas.getContext('2d');
    this.TTdetailCanvas.setAttribute('width', this.canvasWidth);
    this.TTdetailCanvas.setAttribute('height', this.canvasHeight);    
    //finished adding to the DOM////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    //onclick switch between top and detail view:
    this.detailCanvas.onclick = function(event){
                                    that.detailShowing = 0;
                                    swapFade('DAQToplink', that, 0, 0);
                                };
    this.canvas.onclick =   function(event){
                                //use TT layer to decide which clover user clicked on
                                var digiGroupClicked = -1;
                                var x,y;
                                x = event.pageX - that.canvas.offsetLeft - that.monitor.offsetLeft;
                                y = event.pageY - that.canvas.offsetTop - that.monitor.offsetTop;
                                digiGroupClicked = that.findCell(x,y);
                                //draw and swap out if user clicked on a valid clover
                                if(digiGroupClicked > that.nCollectors){
                                    window.DAQdetail = digiGroupClicked - that.nCollectors - 1;
                                    that.drawDetail(that.detailContext, that.nFrames);
                                    that.detailShowing = 1;
                                    swapFade('Collector'+(digiGroupClicked - that.nCollectors - 1), that, 0, 1)
                                }
                            };

    //Dirty trick to implement tooltip on obnoxious geometry: make another canvas of the same size hidden beneath, with the 
    //detector drawn on it, but with each element filled in with rgba(0,0,n,1), where n is the channel number; fetching the color from the 
    //hidden canvas at point x,y will then return the appropriate channel index.
    //summary level:
    //paint whole hidden canvas with R!=G!=B to trigger TT suppression:
    this.TTcontext.fillStyle = 'rgba(50,100,150,1)';
    this.TTcontext.fillRect(0,0,this.canvasWidth, this.canvasHeight);
    //set up summary tooltip:
    this.tooltip = new Tooltip(this.canvasID, 'DAQTipText', 'DAQttCanv', 'DAQTT', this.monitorID, prefix, postfix);
    this.tooltip.obj = that;
    //detail level tt:
    //paint whole hidden canvas with R!=G!=B to trigger TT suppression:
    this.TTdetailContext.fillStyle = 'rgba(50,100,150,1)';
    this.TTdetailContext.fillRect(0,0,this.canvasWidth, this.canvasHeight);
    //set up detail tooltip:
    this.detailTooltip = new Tooltip(this.detailCanvasID, 'DAQdetailTipText', 'DAQttDetailCanv', 'DAQTTdetail', this.monitorID, prefix, postfix);
    this.detailTooltip.obj = that;


    //drawing parameters//////////////////////////////////////////////
    this.collectorWidth = 0.9*(this.canvasWidth-10) / 16;
    this.collectorHeight = 1.5*this.collectorWidth;

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
    //this.canvas.onclick = function(event){that.swapDetail(event.pageX - that.canvas.offsetLeft - that.monitor.offsetLeft, event.pageY - that.canvas.offsetTop - that.monitor.offsetTop)};

    //establish data buffers////////////////////////////////////////////////////////////////////////////
    //master
    this.masterColor = '#000000';
    this.oldMasterColor = '#000000';
    //master group links
    this.masterGroupColor = [];
    this.oldMasterGroupColor = [];
    //links from collectors to master
    this.masterLinkColor = [];
    this.oldMasterLinkColor = [];
    //collectors
    this.collectorColor = [];
    this.oldCollectorColor = [];
    //links from digitizer summary node to collector
    this.collectorLinkColor = [];
    this.oldCollectorLinkColor = [];
    //digitizer summary node
    this.digiSummaryColor = [];
    this.oldDigiSummaryColor = [];
    //links from digitizer group to digitizer summary node
    this.digiGroupSummaryColor = [];
    this.oldDigiGroupSummaryColor = [];
    //links from digitizers to digitizer group
    this.digitizerLinkColor = [];
    this.oldDigitizerLinkColor = [];
    //digitizers
    this.digitizerColor = [];
    this.oldDigitizerColor = [];

    for(i=0; i<Math.ceil(this.nCollectors/4); i++){
        this.masterGroupColor[i] = '#000000';
        this.oldMasterGroupColor[i] = '#000000';        
    }
    for(i=0; i<4*Math.ceil(this.nCollectors/4); i++){
        this.masterLinkColor[i] = '#000000';
        this.oldMasterLinkColor[i] = '#000000';
        this.collectorColor[i] = '#000000';
        this.oldCollectorColor[i] = '#000000';
        this.collectorLinkColor[i] = '#000000';
        this.oldCollectorLinkColor[i] = '#000000';
        this.digiSummaryColor[i] = '#000000';
        this.oldDigiSummaryColor[i] = '#000000';        
    }
    for(i=0; i<4*4*Math.ceil(this.nCollectors/4); i++){
        this.digiGroupSummaryColor[i] = '#000000';
        this.oldDigiGroupSummaryColor[i] = '#000000';        
    }
    for(i=0; i<4*4*4*Math.ceil(this.nCollectors/4); i++){
        this.digitizerLinkColor[i] = '#000000';
        this.oldDigitizerLinkColor[i] = '#000000';
        this.digitizerColor[i] = '#000000';
        this.oldDigitizerColor[i] = '#000000';        
    }

    //member functions///////////////////////////////////////////////

    //decide which view to transition to when this object is navigated to
    this.view = function(index){
        if(index == 1)
            return this.detailCanvasID;
        else if(index == 0)
            return this.canvasID;
    }

	//update the info for each cell in the monitor
	this.update = function(){
		var i;

        this.fetchNewData();

        //parse the new data into colors
        this.oldMasterColor = this.masterColor;
        this.masterColor = this.parseColor(this.dataBus.master[0], 0)
    
        for(i=0; i<this.nCollectorGroups; i++){
            this.oldMasterGroupColor[i] = this.masterGroupColor[i];
            this.masterGroupColor[i] = this.parseColor(this.dataBus.collectorGroups[i],1);
        }
        for(i=0; i<this.nCollectors; i++){
            this.oldMasterLinkColor[i] = this.masterLinkColor[i];
            this.oldCollectorColor[i] = this.collectorColor[i];
            this.oldCollectorLinkColor[i] = this.collectorLinkColor[i];
            this.oldDigiSummaryColor[i] = this.digiSummaryColor[i];
            this.masterLinkColor[i] = this.parseColor(this.dataBus.collectorLinks[i], 2);
            this.collectorColor[i] = this.parseColor(this.dataBus.collectors[i], 3);
            this.collectorLinkColor[i] = this.parseColor(this.dataBus.digitizerGroupSummaryLinks[i],4);
            this.digiSummaryColor[i] = this.parseColor(this.dataBus.digitizerSummaries[i],5);
        }
        for(i=0; i<this.nDigitizerGroups; i++){
            this.oldDigiGroupSummaryColor[i] = this.digiGroupSummaryColor[i];
            this.digiGroupSummaryColor[i] = this.parseColor(this.dataBus.digitizerGroupLinks[i], 6);
        }
        for(i=0; i<this.nDigitizers; i++){
            this.oldDigitizerLinkColor[i] = this.digitizerLinkColor[i];
            this.oldDigitizerColor[i] = this.digitizerColor[i]; 
            this.digitizerLinkColor[i] = this.parseColor(this.dataBus.digitizerLinks[i], 7);
            this.digitizerColor[i] = this.parseColor(this.dataBus.digitizers[i], 8); 
        }

        this.tooltip.update();
        this.detailTooltip.update();

	};

	//parse scalar into a color on a color scale bounded by the entries in this.minima[index] and this.maxima[index] 
	this.parseColor = function(scalar, index){
		//how far along the scale are we?
		var scale = (scalar - this.minima[index]) / (this.maxima[index] - this.minima[index]);
        if(scale<0) scale = 0;
        if(scale>1) scale = 1;

		return redScale(scale);
	};

	this.draw = function(frame){
		var color, i, j, k;

		if(frame==0)this.context.clearRect(0,0, this.canvasWidth, this.canvasHeight - this.scaleHeight);

        if(frame == 15){
            this.drawScale(this.context);
        }
        this.context.lineWidth = this.lineweight;

        //GRIFFIN mode:
        if(this.nCollectorGroups != 0){
    		for(i=0; i<this.nCollectorGroups; i++){
                //master group links
                color = interpolateColor(parseHexColor(this.oldMasterGroupColor[i]), parseHexColor(this.masterGroupColor[i]), frame/this.nFrames);
                this.drawMasterGroupLink(i, color);
            }
        }
        for(i=0; i<this.nCollectors; i++){
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

        //master node:
        color = interpolateColor(parseHexColor(this.oldMasterColor), parseHexColor(this.masterColor), frame/this.nFrames);
        this.drawMasterNode(color);

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

        //tooltip encoding level:
        this.TTcontext.fillStyle = 'rgba(0, 0, 0, 1)';
        this.TTcontext.fillRect(Math.round(this.margin), Math.round(this.masterTop), Math.round(this.canvasWidth-2*this.margin), Math.round(this.masterBottom - this.masterTop));
    };

    this.drawCollectorNode = function(index, color){

    	this.context.strokeStyle = color;
    	this.context.fillStyle = this.cellColor;
        if(this.nCollectorGroups != 0){  //GRIFFIN mode:
    		roundBox(this.context, this.margin + (Math.floor(index/4)+0.5)*(this.canvasWidth - 2*this.margin)/this.nCollectorGroups + (index%4 - 1.5)*(this.collectorWidth + this.collectorGutter) - this.collectorWidth/2, this.collectorTop, this.collectorWidth, this.collectorBottom - this.collectorTop, 5);
        } else {  //TIGRESS mode:
            roundBox(this.context, this.margin + (index+0.5)*(this.canvasWidth - 2*this.margin)/this.nCollectors - this.collectorWidth/2, this.collectorTop, this.collectorWidth, this.collectorBottom - this.collectorTop, 5);
        }
        this.context.fill();
		this.context.stroke();

        //tooltip encoding level:
        this.TTcontext.fillStyle = 'rgba('+(1+index)+', '+(1+index)+', '+(1+index)+', 1)';
        if(this.nCollectorGroups != 0) //GRIFFIN mode
            this.TTcontext.fillRect(Math.round(this.margin + (Math.floor(index/4)+0.5)*(this.canvasWidth - 2*this.margin)/this.nCollectorGroups + (index%4 - 1.5)*(this.collectorWidth + this.collectorGutter) - this.collectorWidth/2), Math.round(this.collectorTop), Math.round(this.collectorWidth), Math.round(this.collectorBottom - this.collectorTop));  
        else //TIGRESS mode:
            this.TTcontext.fillRect(Math.round(this.margin + (index+0.5)*(this.canvasWidth - 2*this.margin)/this.nCollectors - this.collectorWidth/2), Math.round(this.collectorTop), Math.round(this.collectorWidth), Math.round(this.collectorBottom - this.collectorTop));
    };

    this.drawSummaryDigitizerNode = function(index, color){

    	this.context.strokeStyle = color;
    	this.context.fillStyle = this.cellColor;
        if(this.nCollectorGroups != 0){ //GRIFFIN mode:
    		roundBox(this.context, this.margin + (Math.floor(index/4)+0.5)*(this.canvasWidth - 2*this.margin)/this.nCollectorGroups + (index%4 - 1.5)*(this.collectorWidth + this.collectorGutter) - this.collectorWidth/2, this.digiSummaryTop, this.collectorWidth, this.digiSummaryBottom - this.digiSummaryTop, 5);
        } else { //TIGRESS mode
            roundBox(this.context, this.margin + (index+0.5)*(this.canvasWidth - 2*this.margin)/this.nCollectors - this.collectorWidth/2, this.digiSummaryTop, this.collectorWidth, this.digiSummaryBottom - this.digiSummaryTop, 5);
        }
		this.context.fill();
        this.context.stroke();

        //tooltip encoding level:
        this.TTcontext.fillStyle = 'rgba('+(1+this.nCollectors+index)+', '+(1+this.nCollectors+index)+', '+(1+this.nCollectors+index)+', 1)';
        if(this.nCollectorGroups != 0) //GRIFFIN mode
            this.TTcontext.fillRect(Math.round(this.margin + (Math.floor(index/4)+0.5)*(this.canvasWidth - 2*this.margin)/this.nCollectorGroups + (index%4 - 1.5)*(this.collectorWidth + this.collectorGutter) - this.collectorWidth/2), Math.round(this.digiSummaryTop), Math.round(this.collectorWidth), Math.round(this.digiSummaryBottom - this.digiSummaryTop));  
        else //TIGRESS mode:
            this.TTcontext.fillRect(Math.round(this.margin + (index+0.5)*(this.canvasWidth - 2*this.margin)/this.nCollectors - this.collectorWidth/2), Math.round(this.digiSummaryTop), Math.round(this.collectorWidth), Math.round(this.digiSummaryBottom - this.digiSummaryTop));

    };

    this.drawMasterGroupLink = function(index, color){
    	this.context.strokeStyle = color;
    	this.context.fillStyle = color;
        this.context.beginPath();
 		this.context.moveTo(this.margin + (index+0.5)*(this.canvasWidth - 2*this.margin)/this.nCollectorGroups, this.masterGroupLinkTop);
 		this.context.lineTo(this.margin + (index+0.5)*(this.canvasWidth - 2*this.margin)/this.nCollectorGroups, this.masterGroupLinkBottom);
        this.context.closePath();
 		this.context.stroke();
    };

    this.drawMasterLink = function(index, color){
    	this.context.strokeStyle = color;
    	this.context.fillStyle = color;
        this.context.beginPath();
        if(this.nCollectorGroups != 0) {  //GRIFFIN mode:
     		this.context.moveTo(this.margin + (Math.floor(index/4)+0.5)*(this.canvasWidth - 2*this.margin)/this.nCollectorGroups, this.masterLinkTop);
     	  	this.context.lineTo(this.margin + (Math.floor(index/4)+0.5)*(this.canvasWidth - 2*this.margin)/this.nCollectorGroups + (index%4 - 1.5)*(this.collectorWidth + this.collectorGutter), this.masterLinkBottom);
        } else { //TIGRESS mode:
            this.context.moveTo(this.margin + (index + 0.5)*(this.canvasWidth - 2*this.margin)/this.nCollectors, this.masterGroupLinkTop );
            this.context.lineTo(this.margin + (index + 0.5)*(this.canvasWidth - 2*this.margin)/this.nCollectors, this.masterLinkBottom );
        }
        this.context.closePath();
 		this.context.stroke();
    };

    this.drawSummaryDigitizerNodeLink = function(index, color){
    	this.context.strokeStyle = color;
    	this.context.fillStyle = color;
        this.context.beginPath();
        if(this.nCollectorGroups != 0){ //GRIFFIN mode:
        	this.context.moveTo(this.margin + (Math.floor(index/4)+0.5)*(this.canvasWidth - 2*this.margin)/this.nCollectorGroups + (index%4 - 1.5)*(this.collectorWidth + this.collectorGutter), this.digiSummaryLinkTop);
        	this.context.lineTo(this.margin + (Math.floor(index/4)+0.5)*(this.canvasWidth - 2*this.margin)/this.nCollectorGroups + (index%4 - 1.5)*(this.collectorWidth + this.collectorGutter), this.digiSummaryLinkBottom);
        } else {  //TIGRESS mode:
            this.context.moveTo(this.margin + (index + 0.5)*(this.canvasWidth - 2*this.margin)/this.nCollectors, this.digiSummaryLinkTop);
            this.context.lineTo(this.margin + (index + 0.5)*(this.canvasWidth - 2*this.margin)/this.nCollectors, this.digiSummaryLinkBottom);
        }
        this.context.closePath();
    	this.context.stroke();
    };

    this.drawDetail = function(context, frame){
        
        var color, i, j;

        var topMargin = 30;
        var leftMargin = 5;

        if(frame == 0){
            this.detailContext.clearRect(0,0,this.canvasWidth, this.canvasHeight - this.scaleHeight);
        }

        if(frame == this.nFrames){
            this.drawScale(this.detailContext);
        }

        this.detailContext.fillStyle = this.cellColor;
        this.detailContext.lineWidth = this.lineweight;

        //clear the tt
        this.TTdetailContext.fillStyle = 'rgba(50,100,150,1)';
        this.TTdetailContext.fillRect(0,0,this.canvasWidth, this.canvasHeight);

        //collector index:
        var clctr = window.DAQdetail;

        if(this.nDigitizerGroups != 0){  //GRIFFIN mode:
            //group connecters:
            
            j=0;
            for(i=4*clctr; i<4*clctr + 4; i++){
                this.detailContext.strokeStyle = interpolateColor(parseHexColor(this.oldDigiGroupSummaryColor[i]), parseHexColor(this.digiGroupSummaryColor[i]), frame/this.nFrames);
                this.detailContext.beginPath();
                this.detailContext.moveTo(this.canvasWidth/2 - this.collectorWidth*0.3 + this.collectorWidth*0.2*j, topMargin+this.collectorHeight);
                this.detailContext.lineTo( 0.12*this.canvasWidth + 0.76/3*this.canvasWidth*j, this.canvasHeight*0.4 + topMargin);
                this.detailContext.closePath();
                this.detailContext.stroke();
                j++
            }
            
            //digitizer connecters:
            for(i=this.prevDigi[clctr]; i<this.prevDigi[clctr]+this.nDigitizersPerCollector[clctr]; i++){
                this.detailContext.strokeStyle = interpolateColor(parseHexColor(this.oldDigitizerLinkColor[i]), parseHexColor(this.digitizerLinkColor[i]), frame/this.nFrames);
                this.detailContext.beginPath();
                this.detailContext.moveTo( Math.floor( (i - this.prevDigi[clctr])/4 )*0.76/3*this.canvasWidth + 0.12*this.canvasWidth, this.canvasHeight*0.4 + topMargin );
                this.detailContext.lineTo( Math.floor( (i - this.prevDigi[clctr])/4 )*0.76/3*this.canvasWidth + 0.12*this.canvasWidth - this.canvasWidth*0.09 + (i%4)*this.canvasWidth*0.06, this.canvasHeight*0.6 + topMargin );
                this.detailContext.closePath();
                this.detailContext.stroke();   
            }

            //digitizers:
            for(i=this.prevDigi[clctr]; i<this.nDigitizersPerCollector[clctr]*clctr+this.nDigitizersPerCollector[clctr]; i++){
                this.detailContext.strokeStyle = interpolateColor(parseHexColor(this.oldDigitizerColor[i]), parseHexColor(this.digitizerColor[i]), frame/this.nFrames);
                roundBox(this.detailContext, Math.floor( (i - this.prevDigi[clctr])/4 )*0.76/3*this.canvasWidth + 0.12*this.canvasWidth - this.canvasWidth*0.09 + (i%4)*this.canvasWidth*0.06 - 0.02*this.canvasWidth , this.canvasHeight*0.6 + topMargin, 0.04*this.canvasWidth, 0.04*this.canvasWidth, 5);
                this.detailContext.fill();
                this.detailContext.stroke();
                //tooltip layer:
                this.TTdetailContext.fillStyle = 'rgba('+(i-this.prevDigi[clctr])+','+(i-this.prevDigi[clctr])+','+(i-this.prevDigi[clctr])+',1)';
                this.TTdetailContext.fillRect(Math.floor(Math.floor( (i - this.prevDigi[clctr])/4 )*0.76/3*this.canvasWidth + 0.12*this.canvasWidth - this.canvasWidth*0.09 + (i%4)*this.canvasWidth*0.06 - 0.02*this.canvasWidth), Math.floor(this.canvasHeight*0.6 + topMargin), Math.floor(0.04*this.canvasWidth), Math.floor(0.04*this.canvasWidth));
            }
        } else {  //TIGRESS mode:
            for(i=this.prevDigi[clctr]; i<this.prevDigi[clctr] + this.nDigitizersPerCollector[clctr]; i++){
                //digitizers:
                this.detailContext.strokeStyle = interpolateColor(parseHexColor(this.oldDigitizerColor[i]), parseHexColor(this.digitizerColor[i]), frame/this.nFrames);
                roundBox(this.detailContext, this.margin + ((i-this.prevDigi[clctr])+0.5)*(this.canvasWidth - 2*this.margin)/this.nDigitizersPerCollector[clctr] - 0.02*this.canvasWidth , this.canvasHeight*0.6 + topMargin, 0.04*this.canvasWidth, 0.04*this.canvasWidth, 5);
                this.detailContext.fill();
                this.detailContext.stroke();
                //tooltip layer:
                this.TTdetailContext.fillStyle = 'rgba('+(i-this.prevDigi[clctr])+','+(i-this.prevDigi[clctr])+','+(i-this.prevDigi[clctr])+',1)';
                this.TTdetailContext.fillRect(Math.round(this.margin + ((i-this.prevDigi[clctr])+0.5)*(this.canvasWidth - 2*this.margin)/this.nDigitizersPerCollector[clctr] - 0.02*this.canvasWidth), Math.round(this.canvasHeight*0.6 + topMargin), Math.round(0.04*this.canvasWidth), Math.round(0.04*this.canvasWidth));

                //digitizer to collector link:
                this.detailContext.strokeStyle = interpolateColor(parseHexColor(this.oldDigitizerLinkColor[i]), parseHexColor(this.digitizerLinkColor[i]), frame/this.nFrames);
                this.detailContext.moveTo(this.margin + ((i-this.prevDigi[clctr])+0.5)*(this.canvasWidth - 2*this.margin)/this.nDigitizersPerCollector[clctr], this.canvasHeight*0.6 + topMargin);
                this.detailContext.lineTo( this.canvasWidth/2 - this.collectorWidth/2 + ((i-this.prevDigi[clctr])+0.5)*this.collectorWidth/this.nDigitizersPerCollector[clctr], topMargin + this.collectorHeight);
                this.detailContext.stroke();
            }
        }

        //parent collector:
        this.detailContext.strokeStyle = interpolateColor(parseHexColor(this.oldCollectorColor[clctr]), parseHexColor(this.collectorColor[clctr]), frame/this.nFrames);
        roundBox(this.detailContext, this.canvasWidth/2 - this.collectorWidth/2, topMargin, this.collectorWidth, this.collectorHeight, 5);
        this.detailContext.fill();
        this.detailContext.stroke();
        //tooltip layer:
        this.TTdetailContext.fillStyle = 'rgba('+(clctr+1)+','+(clctr+1)+','+(clctr+1)+',1)';
        this.TTdetailContext.fillRect(Math.round(this.canvasWidth/2 - this.collectorWidth/2), Math.round(topMargin), Math.round(this.collectorWidth), Math.round(this.collectorHeight));
        
    };

    this.fetchNewData = function(){
        var i;

        //fake demo data
        this.dataBus.master[0] = -9999//Math.random();
        for(i=0; i<this.nCollectorGroups; i++)
            this.dataBus.collectorGroups[i] = -9999//Math.random();
        for(i=0; i<this.nCollectors; i++){
            this.dataBus.collectorLinks[i] = -9999//Math.random();
            this.dataBus.collectors[i] = -9999//Math.random();
            this.dataBus.digitizerGroupSummaryLinks[i] = -9999//Math.random();
            this.dataBus.digitizerSummaries[i] = -9999//Math.random();
        }
        for(i=0; i<this.nDigitizerGroups; i++)
            this.dataBus.digitizerGroupLinks[i] = -9999//Math.random();
        for(i=0; i<this.nDigitizers; i++){
            this.dataBus.digitizerLinks[i] = -9999//Math.random();
            this.dataBus.digitizers[i] = -9999//Math.random();
        }

    };

    this.findCell = function(x, y){
        var imageData 
        if(this.detailShowing == 1){
            imageData = this.TTdetailContext.getImageData(x,y,1,1);
        } else{
            imageData = this.TTcontext.getImageData(x,y,1,1);
        }
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

        if(this.detailShowing){
            document.getElementById(this.detailTooltip.ttTextID).innerHTML = toolTipContent;
        } else{
            document.getElementById(this.tooltip.ttTextID).innerHTML = toolTipContent;
        }

        //return length of longest line:
        return longestLine;
    };

    this.animate = function(){
        if(window.onDisplay == this.canvasID || window.freshLoad) animate(this, 0);
        else this.draw(this.nFrames);

        if(window.onDisplay == this.detailCanvasID || window.freshLoad) animateDetail(this, 0);
        else this.drawDetail(this.nFrames);
    };
}











