function DAQ(canvas, detailCanvas, prefix, postfix){
	var i, j, k, m, nBars, key;

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
    this.detailShowing = 0;                      //is the detail canvas showing?
    window.codex = new DAQcodex();               //builds a map of the DAQ

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

    this.dataBus = new DAQDS();
    this.DAQcolor = 3;

    //scale & insert DAQ canvases & navigation//////////////////////////////////////////////////////////////////////////////////////
    this.monitor = document.getElementById(this.monitorID);
    this.canvasWidth = 0.48*$(this.monitor).width();
    this.collectorWidth = 0.9*(this.canvasWidth-10) / 16;

    //height adjusts to accomodate bar chart in master node:
    nBars = 0;
    for(key in window.codex.detSummary){
        if(window.parameters.validDetectors.indexOf(key) != -1)
            nBars++
    }

    this.canvasHeight = 0.7*$(this.monitor).height() + this.collectorWidth/2*nBars;

    //navigation
    //top level nav button
    insertDOM('button', this.topNavID, 'navLink', '', 'statusLink', function(){swapView('DAQlinks', 'DAQcanvas', 'DAQsidebar', window.DAQpointer.topNavID)}, 'DAQ', '', 'button')
    //nav wrapper div
    insertDOM('div', this.linkWrapperID, 'navPanel', '', this.monitorID, '', '')
    //nav header
    insertDOM('h1', 'DAQlinksBanner', 'navPanelHeader', '', this.linkWrapperID, '', window.parameters.ExpName+' DAQ Status')
    insertDOM('br', 'break', '', '', this.linkWrapperID, '', '')
    //nav buttons
    insertDOM('button', 'DAQToplink', 'navLinkDown', '', 'DAQlinks', function(){window.DAQpointer.detailShowing=0; window.DAQdetail=-1; swapFade('DAQToplink', window.DAQpointer, 0, 0);}, 'Master', '', 'button')
    insertDOM('br', 'break', '', '', this.linkWrapperID, '', '')
    //p to label row of collector buttons
    insertDOM('p', 'DAQcollectorTitle', '', 'display:inline; color:#999999; margin-right:5px;', 'DAQlinks', '', 'Slave')
    //deploy collector buttons
    for(i=0; i<this.nCollectors; i++){
        insertDOM('button', 'Collector'+i, 'navLink', '', this.linkWrapperID, function(){swapFade(this.id, window.DAQpointer, 0, 1); window.DAQpointer.detailShowing=1; animateDetail(window.DAQpointer, 0); window.DAQdetail=this.collectorNumber;}, i+1, '', 'button')
        $('#Collector'+i).width( ( 0.95*this.canvasWidth - $('#DAQcollectorTitle').width()) / this.nCollectors );
        document.getElementById('Collector'+i).collectorNumber = i;
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

    this.scaleHeight = this.canvasHeight*0.2;//110;

    //onclick switch between top and detail view:
    this.detailCanvas.onclick = function(event){
                                    var y;
                                    y = event.pageY - that.canvas.offsetTop - that.monitor.offsetTop;
                                    if(y>that.canvasHeight - that.scaleHeight){
                                        parameterDialogue('DAQ', [ ['Transfer Rate', window.parameters.DAQminima[3], window.parameters.DAQmaxima[3], 'bps', '/DashboardConfig/DAQ/transferMinDetailView', '/DashboardConfig/DAQ/transferMaxDetailView' ], ['Trigger Rate', window.parameters.DAQminima[2], window.parameters.DAQmaxima[2], 'Hz', '/DashboardConfig/DAQ/rateMinDetailView', '/DashboardConfig/DAQ/rateMaxDetailView']  ], window.parameters.colorScale[window.DAQpointer.DAQcolor]);
                                    } else {
                                        that.detailShowing = 0;
                                        swapFade('DAQToplink', that, 0, 0);
                                    }
                                };
    this.canvas.onclick =   function(event){
                                //use TT layer to decide which clover user clicked on
                                var digiGroupClicked = -1;
                                var x,y;
                                x = event.pageX - that.canvas.offsetLeft - that.monitor.offsetLeft;
                                y = event.pageY - that.canvas.offsetTop - that.monitor.offsetTop;
                                digiGroupClicked = that.findCell(x,y);
                                //draw and swap out if user clicked on a valid clover
                                if(digiGroupClicked > 0){
                                    window.DAQdetail = (digiGroupClicked-1)%that.nCollectors;
                                    that.drawDetail(that.detailContext, that.nFrames);
                                    that.detailShowing = 1;
                                    swapFade('Collector'+(window.DAQdetail), that, 0, 1)
                                }
                                //set up scale range dialogue:
                                if(y>that.canvasHeight - that.scaleHeight){
                                    parameterDialogue('DAQ', [ ['Transfer Rate', window.parameters.DAQminima[1], window.parameters.DAQmaxima[1], 'bps', '/DashboardConfig/DAQ/transferMinTopView', '/DashboardConfig/DAQ/transferMaxTopView' ], ['Trigger Rate', window.parameters.DAQminima[0], window.parameters.DAQmaxima[0], 'Hz', '/DashboardConfig/DAQ/rateMinTopView', '/DashboardConfig/DAQ/rateMaxTopView']  ], window.parameters.colorScale[window.DAQpointer.DAQcolor]);
                                } else if(y<that.masterBottom){
                                    parameterDialogue('Device Summary',[ ['Trig Requests', window.parameters.DAQminima[4], window.parameters.DAQmaxima[5], 'Hz', '/DashboardConfig/DAQ/rateMinMaster', '/DashboardConfig/DAQ/rateMaxMaster'], ['Data Rate', window.parameters.DAQminima[5], window.parameters.DAQmaxima[5], 'bps', '/DashboardConfig/DAQ/transferMinMaster', '/DashboardConfig/DAQ/transferMaxMaster']  ]);
                                }
                            };

    //Dirty trick to implement tooltip on obnoxious geometry: make another canvas of the same size hidden beneath, with the 
    //detector drawn on it, but with each element filled in with rgba(0,0,n,1), where n is the channel number; fetching the color from the 
    //hidden canvas at point x,y will then return the appropriate channel index.
    //summary level:
    //paint whole hidden canvas with R!=G!=B to trigger TT suppression:
    this.TTcontext.fillStyle = '#123456';
    this.TTcontext.fillRect(0,0,this.canvasWidth, this.canvasHeight);
    //set up summary tooltip:
    this.tooltip = new Tooltip(this.canvasID, 'DAQTT', this.monitorID, prefix, postfix);
    this.tooltip.obj = that;
    //detail level tt:
    //paint whole hidden canvas with R!=G!=B to trigger TT suppression:
    this.TTdetailContext.fillStyle = 'rgba(50,100,150,1)';
    this.TTdetailContext.fillRect(0,0,this.canvasWidth, this.canvasHeight);
    //set up detail tooltip:
    this.detailTooltip = new Tooltip(this.detailCanvasID, 'DAQTTdetail', this.monitorID, prefix, postfix);
    this.detailTooltip.obj = that;


    //drawing parameters//////////////////////////////////////////////


    this.cellColor = '#4C4C4C';
    this.lineweight = 5;

    this.margin = 30;
    this.collectorGutter = 0.1*this.collectorWidth;


    this.collectorHeight = this.canvasHeight*0.1;   
    this.masterTop = 5;
    this.masterBottom = this.masterTop + (1+nBars/2)*this.collectorHeight;
    this.cableLength = (this.canvasHeight*0.7 - (this.masterBottom-this.masterTop) - 2*this.collectorHeight)/2;
    this.masterGroupLinkTop = this.masterBottom;
    this.masterGroupLinkBottom = this.masterGroupLinkTop + ( (this.nCollectorGroups == 0) ? this.cableLength : this.cableLength/2 ) //this.collectorHeight/2;
    this.masterLinkTop = this.masterGroupLinkBottom;
    this.masterLinkBottom = this.masterLinkTop + this.cableLength/2   //this.collectorHeight/2;
    this.collectorTop = this.masterLinkBottom;
    this.collectorBottom = this.collectorTop + this.collectorHeight;
    this.digiSummaryLinkTop = this.collectorBottom;
    this.digiSummaryLinkBottom = this.digiSummaryLinkTop + this.cableLength; //this.collectorHeight;
    this.digiSummaryTop = this.digiSummaryLinkBottom;
    this.digiSummaryBottom = this.digiSummaryTop + this.collectorHeight;

    //establish animation parameters////////////////////////////////////////////////////////////////////
    this.FPS = 30;
    this.duration = 0.5;
    this.nFrames = this.FPS*this.duration;

    this.inboundCollector = -1;
    this.presentCollector = -1;

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
        this.dataBus.oldMasterColor = this.dataBus.masterColor;
        this.dataBus.masterColor = this.parseColor(this.dataBus.master[0], 0)
    
        for(i=0; i<this.nCollectorGroups; i++){
            this.dataBus.oldMasterGroupColor[i] = this.dataBus.masterGroupColor[i];
            this.dataBus.masterGroupColor[i] = this.parseColor(this.dataBus.collectorGroups[i],1);
        }
        for(i=0; i<this.nCollectors; i++){
            this.dataBus.oldMasterLinkColor[i] = this.dataBus.masterLinkColor[i];
            this.dataBus.oldCollectorColor[i] = this.dataBus.collectorColor[i];
            this.dataBus.oldDetailCollectorColor[i] = this.dataBus.detailCollectorColor[i];
            this.dataBus.oldCollectorLinkColor[i] = this.dataBus.collectorLinkColor[i];
            this.dataBus.oldDetailCollectorLinkColor[i] = this.dataBus.detailCollectorLinkColor[i];
            this.dataBus.oldDigiSummaryColor[i] = this.dataBus.digiSummaryColor[i];
            this.dataBus.masterLinkColor[i] = this.parseColor(this.dataBus.collectorLinks[i], 1);
            this.dataBus.collectorColor[i] = this.parseColor(this.dataBus.collectors[i], 0);
            this.dataBus.detailCollectorColor[i] = this.parseColor(this.dataBus.collectors[i], 2);
            this.dataBus.collectorLinkColor[i]       = this.parseColor(this.dataBus.digitizerGroupSummaryLinks[i],1);
            this.dataBus.detailCollectorLinkColor[i] = this.parseColor(this.dataBus.digitizerGroupSummaryLinks[i],3);
            this.dataBus.digiSummaryColor[i] = this.parseColor(this.dataBus.digitizerSummaries[i],0);

        }
        for(i=0; i<this.nDigitizerGroups; i++){
            this.dataBus.oldDigiGroupSummaryColor[i] = this.dataBus.digiGroupSummaryColor[i];
            this.dataBus.digiGroupSummaryColor[i] = this.dataBus.parseColor(this.dataBus.digitizerGroupLinks[i], 3);
        }
        for(i=0; i<this.nDigitizers; i++){
            this.dataBus.oldDigitizerLinkColor[i] = this.dataBus.digitizerLinkColor[i];
            this.dataBus.oldDigitizerColor[i] = this.dataBus.digitizerColor[i]; 
            this.dataBus.digitizerLinkColor[i] = this.parseColor(this.dataBus.digitizerLinks[i], 3);
            this.dataBus.digitizerColor[i] = this.parseColor(this.dataBus.digitizers[i], 2); 
        }

        this.tooltip.update();
        this.detailTooltip.update();

	};

	//parse scalar into a color on a color scale bounded by the entries in window.parameters.DAQminima[index] and window.parameters.DAQmaxima[index] 
	this.parseColor = function(scalar, index){
		//how far along the scale are we?
		var scale = (scalar - window.parameters.DAQminima[index]) / (window.parameters.DAQmaxima[index] - window.parameters.DAQminima[index]);
        if(scale<0) scale = 0;
        if(scale>1) scale = 1;

		//return redScale(scale);
        return scalepickr(scale, window.parameters.colorScale[this.DAQcolor])
	};

	this.draw = function(frame){
		var color, i, j, k, fontSize, headerString;

        this.context.textBaseline = 'alphabetic';
		if(frame==0){
            this.context.clearRect(0,0, this.canvasWidth, this.canvasHeight - this.scaleHeight);
            //labels:
            this.context.fillStyle = '#FFFFFF';
            fontSize = fitFont(this.context, 'Collectors', this.collectorHeight);
            this.context.font = fontSize + 'px Raleway';
            this.context.save();
            this.context.rotate(-Math.PI/2);
            this.context.fillText('Collectors', -this.collectorBottom,0.7*this.margin);
            this.context.restore();

            fontSize = fitFont(this.context, 'Digi Summary', this.collectorHeight)*1.2;
            this.context.font = fontSize + 'px Raleway';
            this.context.save();
            this.context.rotate(-Math.PI/2);
            this.context.fillText('Digi Summary', -(this.digiSummaryBottom + this.digiSummaryTop + this.context.measureText('Digi Summary').width)/2,0.7*this.margin);
            this.context.restore();  

            fontSize = fitFont(this.context, 'Master', 2*this.collectorWidth);
            this.context.font = fontSize + 'px Raleway';
            this.context.save();
            this.context.rotate(-Math.PI/2);
            this.context.fillText('Master', -( (this.masterBottom-this.masterTop)/2 + this.context.measureText('Master').width/2 ),0.7*this.margin);
            this.context.restore();

        }

        if(frame == 15){
            this.drawScale(this.context);
        }
        this.context.lineWidth = this.lineweight;

        //GRIFFIN mode:
        if(this.nCollectorGroups != 0){
    		for(i=0; i<this.nCollectorGroups; i++){
                //master group links
                color = interpolateColor(parseHexColor(this.dataBus.oldMasterGroupColor[i]), parseHexColor(this.dataBus.masterGroupColor[i]), frame/this.nFrames);
                this.drawMasterGroupLink(i, color);
            }
        }
        for(i=0; i<this.nCollectors; i++){
    		//digi summary nodes:
    		color = interpolateColor(parseHexColor(this.dataBus.oldDigiSummaryColor[i]), parseHexColor(this.dataBus.digiSummaryColor[i]), frame/this.nFrames);
	   		this.drawSummaryDigitizerNode(i, color);
    		//collector-digi summary links:
    		color = interpolateColor(parseHexColor(this.dataBus.oldCollectorLinkColor[i]), parseHexColor(this.dataBus.collectorLinkColor[i]), frame/this.nFrames);
    		this.drawSummaryDigitizerNodeLink(i, color);
	   		//collecter nodes:
    		color = interpolateColor(parseHexColor(this.dataBus.oldCollectorColor[i]), parseHexColor(this.dataBus.collectorColor[i]), frame/this.nFrames);
			this.drawCollectorNode(i, color);   		    		
    		//collector links:
	    	color = interpolateColor(parseHexColor(this.dataBus.oldMasterLinkColor[i]), parseHexColor(this.dataBus.masterLinkColor[i]), frame/this.nFrames);
    		this.drawMasterLink(i, color); 
		}

        //master node:
        color = interpolateColor(parseHexColor(this.dataBus.oldMasterColor), parseHexColor(this.dataBus.masterColor), frame/this.nFrames);
        this.drawMasterNode(color);

        //trigger & event builder reporting:
        headerString = 'TRIGGER: Events: ' + parseFloat(window.codex.triggerRate).toFixed(0) + ' Hz; Data: ' + parseFloat(window.codex.triggerDataRate/1000).toFixed(0) + ' Mb/s  EVENT BUILDER: ' + parseFloat(window.codex.EBrate).toFixed(0) + ' Hz; Data: ' + parseFloat(window.codex.EBdataRate/1000).toFixed(0) + ' Mb/s'
        this.context.textBaseline = 'top';
        this.context.fillStyle = '#FFFFFF';
        this.context.font = fitFont(this.context, headerString, this.canvasWidth*0.8)+'px Raleway';
        this.context.fillText(headerString, this.canvasWidth/2 - this.context.measureText(headerString).width/2, this.masterTop*2);
        this.context.textBaseline = 'alphabetic';

        //rate chart
        rateChart(frame, window.codex.detSummary, this.context, this.canvasWidth*0.2, this.masterTop + nBars*this.collectorWidth/2+50, this.canvasWidth*0.6, this.collectorWidth/2 )

	};

    this.drawScale = function(context){

        var i, j, string, unit; 

        context.clearRect(0, this.canvasHeight - this.scaleHeight, this.canvasWidth, this.canvasHeight);

        //titles
        context.fillStyle = '#999999';
        context.font="24px 'Orbitron'";
        context.textBaseline = 'middle';
        context.fillText('Transfer Rate', this.canvasWidth/2 - context.measureText('Transfer Rate').width/2, this.canvasHeight-this.scaleHeight/2 - 15);
        context.fillText('Trigger Rate', this.canvasWidth/2 - context.measureText('Trigger Rate').width/2, this.canvasHeight-this.scaleHeight/2 + 20 + 20);
        context.textBaseline = 'alphabetic';

        //tickmark;
        context.strokeStyle = '#999999';
        context.lineWidth = 1;
        context.font="12px 'Raleway'";

        //transfer rate
        //determine unit
        unit = ((context == this.detailContext) ? window.parameters.DAQmaxima[3] : window.parameters.DAQmaxima [1]);
        if(unit > 1000000) unit = ' Mbps';
        else if(unit > 1000) unit = ' kbps';
        else unit = ' bps';

        context.beginPath();
        context.moveTo(this.canvasWidth*0.05+1, this.canvasHeight - this.scaleHeight/2);
        context.lineTo(this.canvasWidth*0.05+1, this.canvasHeight - this.scaleHeight/2-10);
        context.stroke();
        context.fillText( ((context == this.detailContext) ? window.parameters.DAQminima[3] : window.parameters.DAQminima [1])+unit, this.canvasWidth*0.05 - context.measureText('0'+unit).width/2, this.canvasHeight-this.scaleHeight/2-15);

        context.beginPath();
        context.moveTo(this.canvasWidth*0.95-1, this.canvasHeight - this.scaleHeight/2);
        context.lineTo(this.canvasWidth*0.95-1, this.canvasHeight - this.scaleHeight/2-10); 
        context.stroke();  

        string = ((context == this.detailContext) ? window.parameters.DAQmaxima[3] : window.parameters.DAQmaxima [1]);
        if(string > 1000000) string = string/1000000 + unit;
        else if(string > 1000) string = string/1000 + unit;
        else string = string + unit;            
        context.fillText(string, this.canvasWidth*0.95 - context.measureText(string).width/2, this.canvasHeight-this.scaleHeight/2-15);


        //trigger rate
        //determine unit:
        unit = ((context == this.detailContext) ? window.parameters.DAQmaxima[2] : window.parameters.DAQmaxima [0]);
        if(unit > 1000000) unit = ' MHz';
        else if(unit > 1000) unit = ' kHz';
        else unit = ' Hz';        

        context.beginPath();
        context.moveTo(this.canvasWidth*0.05+1, this.canvasHeight - this.scaleHeight/2 + 20);
        context.lineTo(this.canvasWidth*0.05+1, this.canvasHeight - this.scaleHeight/2 + 20 + 10);
        context.stroke();
        context.fillText( ((context == this.detailContext) ? window.parameters.DAQminima[2] : window.parameters.DAQminima [0])+unit, this.canvasWidth*0.05 - context.measureText('0'+unit).width/2, this.canvasHeight-this.scaleHeight/2 + 45);

        context.beginPath();
        context.moveTo(this.canvasWidth*0.95-1, this.canvasHeight - this.scaleHeight/2 + 20);
        context.lineTo(this.canvasWidth*0.95-1, this.canvasHeight - this.scaleHeight/2 + 20 + 10); 
        context.stroke();

        string = ((context == this.detailContext) ? window.parameters.DAQmaxima[2] : window.parameters.DAQmaxima [0]);
        if(string > 1000000) string = string/1000000 + unit;
        else if(string > 1000) string = string/1000 + unit;
        else string = string + unit;
        context.fillText(string, this.canvasWidth*0.95 - context.measureText(string).width/2, this.canvasHeight-this.scaleHeight/2 + 45);

        for(i=0; i<3000; i++){
            context.fillStyle = scalepickr(0.001*(i%1000), window.parameters.colorScale[this.DAQcolor])//redScale(0.001*(i%1000));
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
        var i, ttColors;

    	this.context.strokeStyle = color;
    	this.context.fillStyle = this.cellColor;
        this.context.lineWidth = this.lineweight;
        if(this.nCollectorGroups != 0){ //GRIFFIN mode:
            this.context.beginPath();
            this.context.arc(this.margin + (Math.floor(index/4)+0.5)*(this.canvasWidth - 2*this.margin)/this.nCollectorGroups + (index%4 - 1.5)*(this.collectorWidth + this.collectorGutter), this.digiSummaryLinkBottom + this.collectorWidth/2,  this.collectorWidth/2, 0, Math.PI*2);
            this.context.closePath();
    		//roundBox(this.context, this.margin + (Math.floor(index/4)+0.5)*(this.canvasWidth - 2*this.margin)/this.nCollectorGroups + (index%4 - 1.5)*(this.collectorWidth + this.collectorGutter) - this.collectorWidth/2, this.digiSummaryTop, this.collectorWidth, this.digiSummaryBottom - this.digiSummaryTop, 5);
        } else { //TIGRESS mode
            this.context.beginPath();
            this.context.arc(this.margin + (index + 0.5)*(this.canvasWidth - 2*this.margin)/this.nCollectors, this.digiSummaryLinkBottom + this.collectorWidth/2, this.collectorWidth/2, 0, Math.PI*1.999);  //managed to cause a rendering bug in Chrome if drawing arc to full 2pi??
            this.context.closePath();
            //roundBox(this.context, this.margin + (index+0.5)*(this.canvasWidth - 2*this.margin)/this.nCollectors - this.collectorWidth/2, this.digiSummaryTop, this.collectorWidth, this.digiSummaryBottom - this.digiSummaryTop, 5);
        }
		this.context.fill();
        this.context.stroke();


        //tooltip encoding level:
        ttColors = ['#123456', 'rgba('+(1+this.nCollectors+index)+', '+(1+this.nCollectors+index)+', '+(1+this.nCollectors+index)+', 1)'];
        for(i=0; i<2; i++){
            this.TTcontext.fillStyle = ttColors[i];  //first suppress AA, then paint code color
            if(this.nCollectorGroups != 0){ //GRIFFIN mode
                this.TTcontext.beginPath();
                this.TTcontext.arc(this.margin + (Math.floor(index/4)+0.5)*(this.canvasWidth - 2*this.margin)/this.nCollectorGroups + (index%4 - 1.5)*(this.collectorWidth + this.collectorGutter), this.digiSummaryLinkBottom + this.collectorWidth/2,  this.collectorWidth/2, 0, Math.PI*2);
                this.TTcontext.closePath();
                this.TTcontext.fill();
                //this.TTcontext.fillRect(Math.round(this.margin + (Math.floor(index/4)+0.5)*(this.canvasWidth - 2*this.margin)/this.nCollectorGroups + (index%4 - 1.5)*(this.collectorWidth + this.collectorGutter) - this.collectorWidth/2), Math.round(this.digiSummaryTop), Math.round(this.collectorWidth), Math.round(this.digiSummaryBottom - this.digiSummaryTop));  
            }else {//TIGRESS mode:
                this.TTcontext.beginPath();
                this.TTcontext.arc(this.margin + (index + 0.5)*(this.canvasWidth - 2*this.margin)/this.nCollectors, this.digiSummaryLinkBottom + this.collectorWidth/2, this.collectorWidth/2, 0, Math.PI*1.999);
                this.TTcontext.closePath();
                this.TTcontext.fill();
                //this.TTcontext.fillRect(Math.round(this.margin + (index+0.5)*(this.canvasWidth - 2*this.margin)/this.nCollectors - this.collectorWidth/2), Math.round(this.digiSummaryTop), Math.round(this.collectorWidth), Math.round(this.digiSummaryBottom - this.digiSummaryTop));
            }
        }
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
            this.context.lineTo(this.margin + (index + 0.5)*(this.canvasWidth - 2*this.margin)/this.nCollectors, this.masterLinkBottom -this.lineweight/2 );
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
            this.context.lineTo(this.margin + (index + 0.5)*(this.canvasWidth - 2*this.margin)/this.nCollectors, this.digiSummaryLinkBottom - this.lineweight/2);
        }
        this.context.closePath();
    	this.context.stroke();
    };

    this.drawDetail = function(context, frame){
        var color, i, j;

        var topMargin = 30;
        var leftMargin = 5;

        //if(frame == 0){
            this.detailContext.clearRect(0,0,this.canvasWidth, this.canvasHeight - this.scaleHeight);
        //}

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
                this.detailContext.strokeStyle = interpolateColor(parseHexColor(this.dataBus.oldDigiGroupSummaryColor[i]), parseHexColor(this.dataBus.digiGroupSummaryColor[i]), frame/this.nFrames);
                this.detailContext.beginPath();
                this.detailContext.moveTo(this.canvasWidth/2 - this.collectorWidth*0.3 + this.collectorWidth*0.2*j, topMargin+this.collectorHeight);
                this.detailContext.lineTo( 0.12*this.canvasWidth + 0.76/3*this.canvasWidth*j, this.canvasHeight*0.4 + topMargin);
                this.detailContext.closePath();
                this.detailContext.stroke();
                j++
            }
            
            //digitizer connecters:
            for(i=this.prevDigi[clctr]; i<this.prevDigi[clctr]+this.nDigitizersPerCollector[clctr]; i++){
                this.detailContext.strokeStyle = interpolateColor(parseHexColor(this.dataBus.oldDigitizerLinkColor[i]), parseHexColor(this.dataBus.digitizerLinkColor[i]), frame/this.nFrames);
                this.detailContext.beginPath();
                this.detailContext.moveTo( Math.floor( (i - this.prevDigi[clctr])/4 )*0.76/3*this.canvasWidth + 0.12*this.canvasWidth, this.canvasHeight*0.4 + topMargin );
                this.detailContext.lineTo( Math.floor( (i - this.prevDigi[clctr])/4 )*0.76/3*this.canvasWidth + 0.12*this.canvasWidth - this.canvasWidth*0.09 + (i%4)*this.canvasWidth*0.06, this.canvasHeight*0.6 + topMargin );
                this.detailContext.closePath();
                this.detailContext.stroke();   
            }

            //digitizers:
            for(i=this.prevDigi[clctr]; i<this.nDigitizersPerCollector[clctr]*clctr+this.nDigitizersPerCollector[clctr]; i++){
                this.detailContext.strokeStyle = interpolateColor(parseHexColor(this.dataBus.oldDigitizerColor[i]), parseHexColor(this.dataBus.digitizerColor[i]), frame/this.nFrames);
                roundBox(this.detailContext, Math.floor( (i - this.prevDigi[clctr])/4 )*0.76/3*this.canvasWidth + 0.12*this.canvasWidth - this.canvasWidth*0.09 + (i%4)*this.canvasWidth*0.06 - 0.02*this.canvasWidth , this.canvasHeight*0.6 + topMargin, 0.04*this.canvasWidth, 0.04*this.canvasWidth, 5);
                this.detailContext.fill();
                this.detailContext.stroke();
                //tooltip layer:
                this.TTdetailContext.fillStyle = 'rgba('+(i+1+2*this.nCollectors)+','+(i+1+2*this.nCollectors)+','+(i+1+2*this.nCollectors)+',1)';
                this.TTdetailContext.fillRect(Math.floor(Math.floor( (i - this.prevDigi[clctr])/4 )*0.76/3*this.canvasWidth + 0.12*this.canvasWidth - this.canvasWidth*0.09 + (i%4)*this.canvasWidth*0.06 - 0.02*this.canvasWidth), Math.floor(this.canvasHeight*0.6 + topMargin), Math.floor(0.04*this.canvasWidth), Math.floor(0.04*this.canvasWidth));
            }
        } else {  //TIGRESS mode:
            for(i=this.prevDigi[clctr]; i<this.prevDigi[clctr] + this.nDigitizersPerCollector[clctr]; i++){
                //digitizer to collector link:
                this.detailContext.strokeStyle = interpolateColor(parseHexColor(this.dataBus.oldDigitizerLinkColor[i]), parseHexColor(this.dataBus.digitizerLinkColor[i]), frame/this.nFrames);
                this.detailContext.beginPath();
                //old style, direct from digitizer to collector:
                //this.detailContext.moveTo(this.margin + ((i-this.prevDigi[clctr])+0.5)*(this.canvasWidth - 2*this.margin)/this.nDigitizersPerCollector[clctr], this.canvasHeight*0.6 + topMargin);
                //this.detailContext.lineTo( this.canvasWidth/2 - this.collectorWidth/2 + ((i-this.prevDigi[clctr])+0.5)*this.collectorWidth/this.nDigitizersPerCollector[clctr], topMargin + this.collectorHeight);
                //two-tiered links:
                //from digitizers:
                this.detailContext.moveTo(this.margin + ((i-this.prevDigi[clctr])+0.5)*(this.canvasWidth - 2*this.margin)/this.nDigitizersPerCollector[clctr], this.canvasHeight*0.6 + topMargin);
                this.detailContext.lineTo(this.margin + ((i-this.prevDigi[clctr])+0.5)*(this.canvasWidth - 2*this.margin)/this.nDigitizersPerCollector[clctr], (this.canvasHeight*0.6 - this.collectorHeight)/2+topMargin+this.collectorHeight);
                this.detailContext.stroke();
                //digitizers:
                this.detailContext.strokeStyle = interpolateColor(parseHexColor(this.dataBus.oldDigitizerColor[i]), parseHexColor(this.dataBus.digitizerColor[i]), frame/this.nFrames);
                roundBox(this.detailContext, this.margin + ((i-this.prevDigi[clctr])+0.5)*(this.canvasWidth - 2*this.margin)/this.nDigitizersPerCollector[clctr] - 0.02*this.canvasWidth , this.canvasHeight*0.6 + topMargin, 0.04*this.canvasWidth, 0.04*this.canvasWidth, 5);
                this.detailContext.fill();
                this.detailContext.stroke();
                //tooltip layer:
                this.TTdetailContext.fillStyle = 'rgba('+(i+1+2*this.nCollectors)+','+(i+1+2*this.nCollectors)+','+(i+1+2*this.nCollectors)+',1)';
                this.TTdetailContext.fillRect(Math.round(this.margin + ((i-this.prevDigi[clctr])+0.5)*(this.canvasWidth - 2*this.margin)/this.nDigitizersPerCollector[clctr] - 0.02*this.canvasWidth), Math.round(this.canvasHeight*0.6 + topMargin), Math.round(0.04*this.canvasWidth), Math.round(0.04*this.canvasWidth));
            }
        }

        //parent collector:
        this.detailContext.strokeStyle = interpolateColor(parseHexColor(this.dataBus.oldDetailCollectorColor[clctr]), parseHexColor(this.dataBus.detailCollectorColor[clctr]), frame/this.nFrames);
        roundBox(this.detailContext, this.canvasWidth/2 - this.collectorWidth/2, topMargin, this.collectorWidth, this.collectorHeight, 5);
        this.detailContext.fill();
        this.detailContext.stroke();

        //total data transfer:
        this.detailContext.strokeStyle = interpolateColor(parseHexColor(this.dataBus.oldDetailCollectorLinkColor[clctr]), parseHexColor(this.dataBus.detailCollectorLinkColor[clctr]), frame/this.nFrames);
        this.detailContext.lineWidth = 2*this.lineweight;
        this.detailContext.beginPath();
        this.detailContext.moveTo(this.margin + 0.5*(this.canvasWidth - 2*this.margin)/this.nDigitizersPerCollector[clctr] - this.lineweight/2, (this.canvasHeight*0.6 - this.collectorHeight)/2+topMargin+this.collectorHeight);
        this.detailContext.lineTo(this.margin + ((this.nDigitizersPerCollector[clctr]-1)+0.5)*(this.canvasWidth - 2*this.margin)/this.nDigitizersPerCollector[clctr] + this.lineweight/2, (this.canvasHeight*0.6 - this.collectorHeight)/2+topMargin+this.collectorHeight);
        this.detailContext.moveTo(this.canvasWidth/2, (this.canvasHeight*0.6 - this.collectorHeight)/2+topMargin+this.collectorHeight);
        this.detailContext.lineTo(this.canvasWidth/2, topMargin+this.collectorHeight + this.lineweight/2);
        this.detailContext.stroke();

        //tooltip layer:
        this.TTdetailContext.fillStyle = 'rgba('+(clctr+1)+','+(clctr+1)+','+(clctr+1)+',1)';
        this.TTdetailContext.fillRect(Math.round(this.canvasWidth/2 - this.collectorWidth/2), Math.round(topMargin), Math.round(this.collectorWidth), Math.round(this.collectorHeight));
        
    };

    this.fetchNewData = function(){
        var i, j, Fkey, Skey, Pkey;

        window.codex.update();
        i=0; j=0;
        for(Fkey in window.codex.DAQmap){
            if(window.codex.dataKeys.indexOf(Fkey) == -1){
                this.dataBus.master[0] = window.codex.DAQmap[Fkey].trigRequestRate;
                for(Skey in window.codex.DAQmap[Fkey]){
                    if(window.codex.dataKeys.indexOf(Skey) == -1){
                        this.dataBus.collectors[j] = window.codex.DAQmap[Fkey][Skey].trigRequestRate;
                        this.dataBus.digitizerSummaries[j] = window.codex.DAQmap[Fkey][Skey].trigRequestRate;  //currently the same as the collector level since no filtering.
                        this.dataBus.collectorLinks[j] = window.codex.DAQmap[Fkey][Skey].dataRate;
                        this.dataBus.digitizerGroupSummaryLinks[j] = window.codex.DAQmap[Fkey][Skey].dataRate;  //again, redundant with collectors until some busy blocking or something is available
                        j++;
                        for(Pkey in window.codex.DAQmap[Fkey][Skey]){
                            if(window.codex.dataKeys.indexOf(Pkey) == -1){
                                this.dataBus.digitizers[i] = window.codex.DAQmap[Fkey][Skey][Pkey].trigRequestRate;
                                this.dataBus.digitizerLinks[i] = window.codex.DAQmap[Fkey][Skey][Pkey].dataRate;
                                i++;
                            }
                        }
                    }
                }
            }
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
        var cardIndex;
        var i, key;

        
        nextLine = '';
        if(this.dataBus.key[cell]){
            nextLine = 'FSPC: ' + this.dataBus.key[cell][this.dataBus.key[cell].length-1] + '<br><br>';

            //collectors
            if(this.dataBus.key[cell].length == 2){
                nextLine += 'Trig Request Rate: ' + window.codex.DAQmap[this.dataBus.key[cell][0]][this.dataBus.key[cell][1]]['trigRequestRate'].toFixed(1) + ' Hz<br>';
                nextLine += 'Inbound Data Rate: ' + window.codex.DAQmap[this.dataBus.key[cell][0]][this.dataBus.key[cell][1]]['dataRate'].toFixed(1) + ' bps';
            }

            //digitizers
            if(this.dataBus.key[cell].length == 3){
                nextLine += 'Total Trig Request Rate: ' + window.codex.DAQmap[this.dataBus.key[cell][0]][this.dataBus.key[cell][1]][this.dataBus.key[cell][2]]['trigRequestRate'].toFixed(1) + ' Hz<br>';
                nextLine += 'Total Outbound Data Rate: ' + window.codex.DAQmap[this.dataBus.key[cell][0]][this.dataBus.key[cell][1]][this.dataBus.key[cell][2]]['dataRate'].toFixed(1) + ' bps<br><br>';

                for(key in window.codex.DAQmap[this.dataBus.key[cell][0]][this.dataBus.key[cell][1]][this.dataBus.key[cell][2]]){
                    if(window.codex.dataKeys.indexOf(key) == -1){
                        nextLine +=  window.codex.DAQmap[this.dataBus.key[cell][0]][this.dataBus.key[cell][1]][this.dataBus.key[cell][2]][key]['FSPC'] + ': ' + window.codex.DAQmap[this.dataBus.key[cell][0]][this.dataBus.key[cell][1]][this.dataBus.key[cell][2]][key]['detector'];
                        nextLine += '<br>';
                        nextLine += 'Trig Request Rate: ' + window.codex.DAQmap[this.dataBus.key[cell][0]][this.dataBus.key[cell][1]][this.dataBus.key[cell][2]][key]['trigRequestRate'].toFixed(1) + ' Hz; Data Rate: ' + window.codex.DAQmap[this.dataBus.key[cell][0]][this.dataBus.key[cell][1]][this.dataBus.key[cell][2]][key]['dataRate'].toFixed(1) + ' bps';
                        nextLine += '<br><br>'
                    }
                }
            } 
        }
        
        toolTipContent += nextLine;
        toolTipContent += '<br><br>';
        if(this.detailShowing){
            document.getElementById(this.detailTooltip.ttDivID).innerHTML = toolTipContent;
        } else{
            document.getElementById(this.tooltip.ttDivID).innerHTML = toolTipContent;
        }

        //return length of longest line:
        return 0;
    };

    this.animate = function(){
        if(window.onDisplay == this.canvasID || window.freshLoad) animate(this, 0);
        else this.draw(this.nFrames);

        if(window.onDisplay == this.detailCanvasID || window.freshLoad) animateDetail(this, 0);
        else this.drawDetail(this.nFrames);
    };
}


//horizontal bar chart for DAQ data, x0 y0 represent bottom left corner of rendered area:
function rateChart(frame, data, context, x0, y0, maxLength, barWidth){

    var fontSize = 0.8*barWidth,
    row = 0,  //counts up from bottom
    key,
    rateScaleMin = window.parameters.DAQminima[4],
    dataScaleMin = window.parameters.DAQminima[5];    
    rateScaleMax = window.parameters.DAQmaxima[4],
    dataScaleMax = window.parameters.DAQmaxima[5];

    context.font = fontSize+'px Raleway';
    context.lineWidth = 1;

    //draw chart
    for(key in data){
        
        if(window.parameters.validDetectors.indexOf(key) != -1){  //only accept reports from actual devices listed in the parameters
            context.fillStyle = '#FFFFFF';
            context.textBaseline = 'middle';
            context.font = fontSize+'px Raleway';
            context.fillText(key+':', x0 - context.measureText(key+':').width, y0 - (barWidth+4)*(row+1/2) );
            drawTrigBar(key, frame);
            drawDataBar(key, frame);

            row++;
        }
        
    }

    function drawTrigBar(key, frame){
        var length = (data[key].prevTrigReqRate-rateScaleMin)/(rateScaleMax-rateScaleMin)*maxLength + ((data[key].totalTrigRequestRate-rateScaleMin)/(rateScaleMax-rateScaleMin) - (data[key].prevTrigReqRate-rateScaleMin)/(rateScaleMax-rateScaleMin))*maxLength*frame/window.DAQpointer.nFrames;
        if(length > maxLength) length = maxLength;
        if(length < 0) length = 0;
        context.strokeStyle = '#00FF00';
        context.fillStyle = '#222222';
        context.fillRect(1.1*x0, y0 - (barWidth+4)*(row+1), length, barWidth/2-2);
        context.strokeRect(1.1*x0, y0 - (barWidth+4)*(row+1), length, barWidth/2-2);
        context.fillStyle = '#FFFFFF';
        context.font = fontSize*0.6+'px Raleway';
        var text = (data[key].totalTrigRequestRate/1000 > 9999) ? (data[key].totalTrigRequestRate/1000).toExponential(0) : (data[key].totalTrigRequestRate/1000).toFixed(0);
        text += ' kHz';
        context.fillText( text, 1.1*x0 + length + 5,  y0 - (barWidth+4)*(row+1) + barWidth/4 - 1);
    }

    function drawDataBar(key, frame){
        var length = (data[key].prevDataRate-dataScaleMin)/(dataScaleMax-dataScaleMin)*maxLength + ((data[key].totalDataRate-dataScaleMin)/(dataScaleMax-dataScaleMin) - (data[key].prevDataRate-dataScaleMin)/(dataScaleMax-dataScaleMin))*maxLength*frame/window.DAQpointer.nFrames;
        if(length > maxLength) length = maxLength;
        if(length < 0) length = 0;
        context.strokeStyle = '#0000FF';
        context.fillStyle = '#222222';
        context.fillRect(1.1*x0, y0 - (barWidth+4)*(row+1) + barWidth/2+2, length, barWidth/2-2);
        context.strokeRect(1.1*x0, y0 - (barWidth+4)*(row+1) + barWidth/2+2, length, barWidth/2-2);
        context.fillStyle = '#FFFFFF';
        context.font = fontSize*0.6+'px Raleway';
        var text = (data[key].totalDataRate/1000 > 9999) ? (data[key].totalDataRate/1000).toExponential(0) : (data[key].totalDataRate/1000).toFixed(0);
        text += ' kbps';
        context.fillText( text, 1.1*x0 + length + 5,  y0 - (barWidth+4)*(row+1) + barWidth/2+2 + barWidth/4 - 1);
    }

    //draw decorations:
    context.strokeStyle = '#FFFFFF';
    context.fillStyle = '#FFFFFF';
    context.beginPath();
    context.moveTo(1.1*x0-2, y0 - (barWidth+4)*row);
    context.lineTo(1.1*x0-2, y0);
    context.lineTo(1.1*x0+maxLength, y0);
    context.lineTo(1.1*x0+maxLength, y0+5);
    context.stroke();
    context.moveTo(1.1*x0-2, y0);
    context.lineTo(1.1*x0-2, y0+5);
    context.stroke();

    context.font = fontSize*0.7+'px Raleway';
    //trig request labels
    context.fillText('Trig Requests: '+(rateScaleMin/1000).toFixed(0)+' kHz', 1.1*x0-2 - context.measureText('Trig Requests: 0 kHz').width/2, y0+5+fontSize*0.7 );
    context.fillText('Trig Requests: '+(rateScaleMax/1000).toFixed(0)+' kHz', 1.1*x0+maxLength - context.measureText('Trig Requests: '+(rateScaleMax/1000).toFixed(0)+' kHz').width/2, y0+5+fontSize*0.7 );
    context.fillStyle = '#222222';
    context.strokeStyle = '#00FF00';
    context.fillRect(1.1*x0+maxLength - context.measureText('Trig Requests: '+(rateScaleMax/1000).toFixed(0)+' kHz').width/2 - fontSize*0.7*1.5, y0+5+fontSize*0.35, fontSize*0.7, fontSize*0.7);
    context.strokeRect(1.1*x0+maxLength - context.measureText('Trig Requests: '+(rateScaleMax/1000).toFixed(0)+' kHz').width/2 - fontSize*0.7*1.5, y0+5+fontSize*0.35, fontSize*0.7, fontSize*0.7);
    context.fillRect(1.1*x0-2 - context.measureText('Trig Requests: '+(rateScaleMin/1000).toFixed(0)+' kHz').width/2 - fontSize*0.7*1.5, y0+5+fontSize*0.35, fontSize*0.7, fontSize*0.7);
    context.strokeRect(1.1*x0-2 - context.measureText('Trig Requests: '+(rateScaleMin/1000).toFixed(0)+' kHz').width/2 - fontSize*0.7*1.5, y0+5+fontSize*0.35, fontSize*0.7, fontSize*0.7);

    //data rate labels, left aligned with trig request labels
    context.fillStyle = '#FFFFFF';
    context.fillText('Data Rate: '+(dataScaleMin/1000).toFixed(0)+' kbps', 1.1*x0-2 - context.measureText('Trig Requests: 0 kHz').width/2, y0+10+2*fontSize*0.7 );
    context.fillText('Data Rate: '+(dataScaleMax/1000).toFixed(0)+' kbps', 1.1*x0+maxLength - context.measureText('Trig Requests: '+(rateScaleMax/1000).toFixed(0)+' kHz').width/2, y0+10+2*fontSize*0.7 );
    context.fillStyle = '#222222';
    context.strokeStyle = '#0000FF';
    context.fillRect(1.1*x0+maxLength - context.measureText('Trig Requests: '+(rateScaleMax/1000).toFixed(0)+' kHz').width/2 - fontSize*0.7*1.5, y0+10+fontSize*1.05, fontSize*0.7, fontSize*0.7);
    context.strokeRect(1.1*x0+maxLength - context.measureText('Trig Requests: '+(rateScaleMax/1000).toFixed(0)+' kHz').width/2 - fontSize*0.7*1.5, y0+10+fontSize*1.05, fontSize*0.7, fontSize*0.7);
    context.fillRect(1.1*x0-2 - context.measureText('Trig Requests: '+(rateScaleMin/1000).toFixed(0)+' kHz').width/2 - fontSize*0.7*1.5, y0+10+fontSize*1.05, fontSize*0.7, fontSize*0.7);
    context.strokeRect(1.1*x0-2 - context.measureText('Trig Requests: '+(rateScaleMin/1000).toFixed(0)+' kHz').width/2 - fontSize*0.7*1.5, y0+10+fontSize*1.05, fontSize*0.7, fontSize*0.7);
}



//masterCodex imports a table from which the DAQ is mapped
DAQcodex = function(){
    var i, Fkey, Skey, Pkey, Ckey;

    //Parse DAQ Assets///////////////////////////////////////////////////////////////////////
    //pull the FSPC table info in from the ODB
    this.DAQpath = ['/Analyzer/Parameters/Cathode/Config/FSCP[*]', '/Analyzer/Parameters/Cathode/Config/Name[*]', '/Analyzer/Parameters/Cathode/Config/N'];       
    this.DAQtable = ODBMGet(this.DAQpath);
    this.FSPC  = this.DAQtable[0];
    this.Name  = this.DAQtable[1];
    this.nRows = this.DAQtable[2]; 

    //parse into DAQ levels, and sort:    
    this.table = [];
    this.F = [];
    this.S = [];
    this.P = [];
    this.C = [];
    this.DAQmap = {};
    this.detSummary = {};

    for(i=0; i<this.nRows; i++){
        this.F[i] = Math.floor(this.FSPC[i] / 0x10000000);                                          //first digit (on left)
        this.S[i] = Math.floor(this.FSPC[i] / 0x100000) - this.F[i]*0x100;                          //second
        this.P[i] = Math.floor(this.FSPC[i] / 0x100) - this.F[i]*0x100000 - this.S[i]*0x1000;       //third-fifth
        this.C[i] = this.FSPC[i] - this.F[i]*0x10000000 - this.S[i]*0x100000 - this.P[i]*0x100;     //sixth and seventh
        if(this.S[i] <= 12){
            this.table.push({
                F : this.F[i],
                S : this.S[i],
                P : this.P[i],
                C : this.C[i],
                Name : this.Name[i]
            })
        }
    }

    function sortFSPC(a, b){
        if(a.F == b.F){
            if(a.S == b.S){
                if(a.P == b.P){
                    if(a.C == b.C){
                        return -9999; //this should never happen
                    } else {
                        if (a.C > b.C) return 1;
                        if (a.C < b.C) return -1;
                        else return 0;                        
                    }                 
                } else {
                    if (a.P > b.P) return 1;
                    if (a.P < b.P) return -1;
                    else return 0;                    
                }
            } else {
                if (a.S > b.S) return 1;
                if (a.S < b.S) return -1;
                else return 0;                
            }
        } else {
            if (a.F > b.F) return 1;
            if (a.F < b.F) return -1;
            else return 0;          
        }
    } 

    this.table.sort(sortFSPC);  
    this.F = []; this.S = []; this.P = []; this.C = []; this.Name = [];

    for(i=0; i<this.table.length; i++){
        this.F[i] = this.table[i].F;
        this.S[i] = this.table[i].S;
        this.C[i] = this.table[i].C;
        this.P[i] = this.table[i].P;
        this.Name[i] = this.table[i].Name.slice(0,10).toUpperCase();        
    }
    this.nRows = this.table.length;

    //loop over all rows, creating a 4-level object that reflects the structure of the DAQ:
    for(i=0; i<this.nRows; i++){

        Fkey = '0x'+this.F[i].toString(16).toUpperCase()+'XXXXXX';
        Skey = '0x'+this.F[i].toString(16).toUpperCase()+this.S[i].toString(16).toUpperCase()+'XXXXX';
        Pkey = '0x'+this.F[i].toString(16).toUpperCase()+this.S[i].toString(16).toUpperCase()+'00'+this.P[i].toString(16).toUpperCase()+'XX';
        Ckey = '0x'+this.F[i].toString(16).toUpperCase()+this.S[i].toString(16).toUpperCase()+'00'+this.P[i].toString(16).toUpperCase()+'0'+this.C[i].toString(16).toUpperCase();

        if(this.DAQmap[Fkey]){
            this.DAQmap[Fkey].trigRequestRate = 0;
            if(this.DAQmap[Fkey][Skey]){
                this.DAQmap[Fkey][Skey].trigRequestRate = 0;
                this.DAQmap[Fkey][Skey].dataRate = 0;  //how much data is this collector pushing upstream?
                if(this.DAQmap[Fkey][Skey][Pkey]){
                    this.DAQmap[Fkey][Skey][Pkey].trigRequestRate = 0;
                    this.DAQmap[Fkey][Skey][Pkey].dataRate = 0;  //how much data is this digitizer pushing upstream?
                    this.DAQmap[Fkey][Skey][Pkey][Ckey] = {'detector' : this.Name[i], 'FSPC' : Ckey, 'trigRequestRate' : 0, 'dataRate' : 0};
                    this.detSummary[this.Name[i].slice(0,3)] = {'totalTrigRequestRate' : 0, 'prevTrigReqRate' : 0, 'totalDataRate' : 0, 'prevDataRate' : 0};
                } else {
                    this.DAQmap[Fkey][Skey][Pkey] = {};
                    i--;
                }
            } else {
                this.DAQmap[Fkey][Skey] = {};
                i--;
            }
        } else {
            this.DAQmap[Fkey] = {};
            i--;
        }
    }

    //keep track of all the key names in the DAQmap that contain data directly, and aren't part of the hierarchy, so we can ignore them when traversing the DAQ tree:
    this.dataKeys = ['detector', 'FSPC', 'trigRequestRate', 'dataRate'];

    //0x0XXXXXX == currently hard coded to only look at one master, loop over Fkey to generalize
    this.nCollectors = 0;
    for(Skey in this.DAQmap['0x0XXXXXX']){
        if(this.dataKeys.indexOf(Skey) == -1)
            this.nCollectors++;
    }
    this.nDigitizers = 0;
    this.nDigitizersPerCollector = [];
    i = 0;
    for(Skey in this.DAQmap['0x0XXXXXX']){
        if(this.dataKeys.indexOf(Skey) == -1){
            this.nDigitizersPerCollector[i] = 0;
            for(Pkey in this.DAQmap['0x0XXXXXX'][Skey]){
                if(this.dataKeys.indexOf(Pkey) == -1){
                    this.nDigitizers++;
                    this.nDigitizersPerCollector[i]++;
                }
            }
            i++;
        }
    }

    //populate this.DAQmap with all the relevant information from the JSONPstore.
    this.update = function(){
        
        var key, Fkey, Skey, Pkey, Ckey, ODBpaths, data;

        //get summary data from ODB
        this.triggerRate = parseFloat(window.localODB.TrigEPS).toFixed(1);
        this.triggerDataRate = parseFloat(window.localODB.TrigDPS).toFixed(1);
        this.EBrate = parseFloat(window.localODB.EBEPS).toFixed(1);
        this.EBdataRate = parseFloat(window.localODB.EBDPS).toFixed(1);


        //zero out the detector totals from last iteration:
        for(key in this.detSummary){
            this.detSummary[key].prevTrigReqRate = this.detSummary[key].totalTrigRequestRate;
            this.detSummary[key].totalTrigRequestRate = 0;

            this.detSummary[key].prevDataRate = this.detSummary[key].totalDataRate;
            this.detSummary[key].totalDataRate = 0;            
        }

        //map data from the JSONP store into the DAQ object, summing rates as we move upstream:
        for(Fkey in this.DAQmap){
            if(this.dataKeys.indexOf(Fkey) == -1){
                this.DAQmap[Fkey].trigRequestRate = 0;
                for(Skey in this.DAQmap[Fkey]){
                    if(this.dataKeys.indexOf(Skey) == -1){
                        this.DAQmap[Fkey][Skey].trigRequestRate = 0;
                        this.DAQmap[Fkey][Skey].dataRate = 0;
                        for(Pkey in this.DAQmap[Fkey][Skey]){
                            if(this.dataKeys.indexOf(Pkey) == -1){
                                this.DAQmap[Fkey][Skey][Pkey].trigRequestRate = 0;
                                this.DAQmap[Fkey][Skey][Pkey].dataRate = 0;
                                for(Ckey in this.DAQmap[Fkey][Skey][Pkey]){
                                    if( window.JSONPstore['scalar'][this.DAQmap[Fkey][Skey][Pkey][Ckey].detector] ){
                                        this.DAQmap[Fkey][Skey][Pkey][Ckey].trigRequestRate = window.JSONPstore['scalar'][this.DAQmap[Fkey][Skey][Pkey][Ckey].detector]['TRIGREQ'];
                                        this.DAQmap[Fkey][Skey][Pkey][Ckey].dataRate = window.JSONPstore['scalar'][this.DAQmap[Fkey][Skey][Pkey][Ckey].detector]['dataRate'];
                                        this.DAQmap[Fkey][Skey][Pkey].trigRequestRate += this.DAQmap[Fkey][Skey][Pkey][Ckey].trigRequestRate;
                                        this.DAQmap[Fkey][Skey][Pkey].dataRate += this.DAQmap[Fkey][Skey][Pkey][Ckey].dataRate;
                                        this.detSummary[ this.DAQmap[Fkey][Skey][Pkey][Ckey].detector.slice(0,3) ].totalTrigRequestRate += this.DAQmap[Fkey][Skey][Pkey][Ckey].trigRequestRate;
                                        this.detSummary[ this.DAQmap[Fkey][Skey][Pkey][Ckey].detector.slice(0,3) ].totalDataRate += this.DAQmap[Fkey][Skey][Pkey][Ckey].dataRate;
                                    }
                                }
                                this.DAQmap[Fkey][Skey].trigRequestRate += this.DAQmap[Fkey][Skey][Pkey].trigRequestRate;
                                this.DAQmap[Fkey][Skey].dataRate += this.DAQmap[Fkey][Skey][Pkey].dataRate;
                            }
                        }
                        this.DAQmap[Fkey].trigRequestRate += this.DAQmap[Fkey][Skey].trigRequestRate;
                    }
                }
            }
        }

    };

}






