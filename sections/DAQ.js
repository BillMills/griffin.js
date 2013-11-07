function DAQ(canvas, detailCanvas, prefix, postfix){
	var i, j, k, m, nBars, key;

	var that = this;
    //make a pointer at window level back to this object, so we can pass by reference to the nav button onclick
    window.DAQpointer = that;

    //member variables//////////////////////////////////////////////////////////////////////////////////////////////////////////////
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
    injectDOM('button', this.topNavID, 'statusLink', {
        'class' : 'navLink',
        'innerHTML' : 'DAQ',
        'type' : 'button',
        'onclick' : function(){swapView('DAQlinks', 'DAQcanvas', 'DAQsidebar', window.DAQpointer.topNavID); rePaint();}
    });
    //nav wrapper div
    injectDOM('div', this.linkWrapperID, this.monitorID, {'class':'navPanel'});
    //nav header
    injectDOM('h1', 'DAQlinksBanner', this.linkWrapperID, {'class':'navPanelHeader', 'innerHTML':ODB.topLevel.expName+' DAQ Status'});
    injectDOM('br', 'break', this.linkWrapperID, {});
    //nav buttons
    injectDOM('button', 'DAQToplink', 'DAQlinks', {
        'class' : 'navLinkDown',
        'innerHTML' : 'Master',
        'type' : 'button',
        'onclick' : function(){window.DAQpointer.detailShowing=0; window.DAQdetail=-1; swapFade('DAQToplink', window.DAQpointer, 0);}
    });
    injectDOM('br', 'break', this.linkWrapperID, {});
    //p to label row of collector buttons
    injectDOM('p', 'DAQcollectorTitle', 'DAQlinks', {'style':'display:inline; color:#999999; margin-right:5px;', 'innerHTML':'Slave'});
    //deploy collector buttons
    for(i=0; i<this.nCollectors; i++){
        injectDOM('button', 'Collector'+i, this.linkWrapperID, {
            'class' : 'navLink',
            'innerHTML' : i+1,
            'type' : 'button',
            'onclick' : function(){
                window.DAQpointer.detailShowing=1; 
                swapFade(this.id, window.DAQpointer, 0); 
                window.DAQdetail=this.collectorNumber;
                animateDetail(window.DAQpointer, 0); 
            }
        });
        $('#Collector'+i).width( ( 0.95*this.canvasWidth - $('#DAQcollectorTitle').width()) / this.nCollectors );
        document.getElementById('Collector'+i).collectorNumber = i;
    }

    //right sidebar
    //injectDOM('div', this.sidebarID, this.monitorID, {'class':'RightSidebar'});
    injectDOM('div', this.sidebarID, this.monitorID, {}); //dummy sidebar for transitions

    //display canvases
    //top view
    injectDOM('canvas', this.canvasID, this.monitorID, {'class':'monitor', 'style':'top: '+ ($('#DAQlinks').offset().top + $('#DAQlinks').height() + 5) +'px;'});
    this.canvas = document.getElementById(canvas);
    this.context = this.canvas.getContext('2d');
    this.canvas.setAttribute('width', this.canvasWidth);
    this.canvas.setAttribute('height', this.canvasHeight);
    //detailed view
    injectDOM('canvas', this.detailCanvasID, this.monitorID, {'class':'monitor', 'style':'top: '+ ($('#DAQlinks').offset().top + $('#DAQlinks').height() + 5) +'px;'});
    this.detailCanvas = document.getElementById(detailCanvas);
    this.detailContext = this.detailCanvas.getContext('2d');
    this.detailCanvas.setAttribute('width', this.canvasWidth);
    this.detailCanvas.setAttribute('height', this.canvasHeight);
    //Tooltip for summary level
    injectDOM('canvas', this.TTcanvasID, this.monitorID, {'class':'monitor', 'style':'top:' + ($('#DAQlinks').offset().top + $('#DAQlinks').height()*1.25 + 5) +'px;'});
    this.TTcanvas = document.getElementById(this.TTcanvasID);
    this.TTcontext = this.TTcanvas.getContext('2d');
    this.TTcanvas.setAttribute('width', this.canvasWidth);
    this.TTcanvas.setAttribute('height', this.canvasHeight);    
    //hidden Tooltip map layer for detail
    injectDOM('canvas', this.TTdetailCanvasID, this.monitorID, {'class':'monitor', 'style':'top:' + ($('#DAQlinks').offset().top + $('#DAQlinks').height()*1.25 + 5) +'px;'});
    this.TTdetailCanvas = document.getElementById(this.TTdetailCanvasID);
    this.TTdetailContext = this.TTdetailCanvas.getContext('2d');
    this.TTdetailCanvas.setAttribute('width', this.canvasWidth);
    this.TTdetailCanvas.setAttribute('height', this.canvasHeight);    


    //interactions & tooltip setup////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    this.scaleHeight = this.canvasHeight*0.2;

    //onclick switch between top and detail view:
    this.detailCanvas.onclick = function(event){
                                    var y;
                                    y = event.pageY - that.canvas.offsetTop - that.monitor.offsetTop;
                                    if(y>that.canvasHeight - that.scaleHeight){
                                        parameterDialogue('DAQ', [ ['Transfer Rate', ODB.DAQ.transferMinDetailView, ODB.DAQ.transferMaxDetailView, 'Bps', '/DashboardConfig/DAQ/transferMinDetailView', '/DashboardConfig/DAQ/transferMaxDetailView' ], ['Trigger Rate', ODB.DAQ.rateMinDetailView, ODB.DAQ.rateMaxDetailView, 'Hz', '/DashboardConfig/DAQ/rateMinDetailView', '/DashboardConfig/DAQ/rateMaxDetailView']  ], window.parameters.colorScale[window.DAQpointer.DAQcolor]);
                                    } else {
                                        that.detailShowing = 0;
                                        swapFade('DAQToplink', that, 0);
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
                                    swapFade('Collector'+(window.DAQdetail), that, 0)
                                }
                                //set up scale range dialogue:
                                if(y>that.canvasHeight - that.scaleHeight){
                                    parameterDialogue('DAQ', [ ['Transfer Rate', ODB.DAQ.transferMinTopView, ODB.DAQ.transferMaxTopView, 'Bps', '/DashboardConfig/DAQ/transferMinTopView', '/DashboardConfig/DAQ/transferMaxTopView' ], ['Trigger Rate', ODB.DAQ.rateMinTopView, ODB.DAQ.rateMaxTopView, 'Hz', '/DashboardConfig/DAQ/rateMinTopView', '/DashboardConfig/DAQ/rateMaxTopView']  ], window.parameters.colorScale[window.DAQpointer.DAQcolor]);
                                } else if(y<that.masterBottom){
                                    parameterDialogue('Device Summary',[ ['Trig Requests', ODB.DAQ.rateMinMaster, ODB.DAQ.transferMaxMaster, 'Hz', '/DashboardConfig/DAQ/rateMinMaster', '/DashboardConfig/DAQ/rateMaxMaster'], ['Data Rate', ODB.DAQ.transferMinMaster, ODB.DAQ.transferMaxMaster, 'Bps', '/DashboardConfig/DAQ/transferMinMaster', '/DashboardConfig/DAQ/transferMaxMaster']  ]);
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


    //drawing parameters////////////////////////////////////////////////////////////////////////////////////////////////////////


    this.cellColor = '#4C4C4C';
    this.lineweight = 5;

    this.margin = this.canvasWidth*0.05;
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

    this.masterWidth = this.canvasWidth-2*this.margin;

    //animation parameters
    this.FPS = 30;
    this.duration = 0.5;
    this.nFrames = this.FPS*this.duration;

    this.inboundCollector = -1;
    this.presentCollector = -1;

    //member functions////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    //decide which view to transition to when this object is navigated to
    this.view = function(){
        if(this.detailShowing == 1)
            return this.detailCanvasID;
        else if(this.detailShowing == 0)
            return this.canvasID;
    }

	//update the info for each cell in the monitor
	this.update = function(){
		var i;

        //this.fetchNewData();
        window.codex.update();

        //this.tooltip.update();
        //this.detailTooltip.update();

        //animate if DAQ is showing:
        this.animate();

	};
/*
	this.draw = function(frame){
		var color, i, j, k, fontSize, headerString;

        this.context.textBaseline = 'alphabetic';
		if(frame==0){
            this.context.clearRect(0,0, this.canvasWidth, this.canvasHeight - this.scaleHeight);
            //labels:
            this.context.fillStyle = '#FFFFFF';
            fontSize = fitFont(this.context, 'Slaves', this.collectorHeight);
            this.context.font = fontSize + 'px Raleway';
            this.context.save();
            this.context.rotate(-Math.PI/2);
            this.context.fillText('Slaves', -this.collectorBottom,0.7*this.margin);
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
*/
    this.draw = function(frame){
        var color, i, j, x0, x1, branchColor, combWidth, combColors, masterChannel, masterChannelID,
            codex = window.codex; 

        this.context.lineWidth = this.lineweight;

        //master node//////////////////////////////////////////////////////
        color = interpolateColor(parseHexColor(codex.DAQmap.oldMasterColor), parseHexColor(codex.DAQmap.masterColor), frame / this.nFrames);
        this.drawMasterNode(this.context, this.TTcontext, color);

        
        if(ODB.topLevel.HPGeArray == 'TIGRESS'){
            //TIGRESS uses simple 1-1 connectors:
            for(i=0; i<codex.nCollectors; i++){
                //master-slave links///////////////////////////////////////////////
                x0 = this.margin + (i+0.5)*(this.masterWidth / codex.nCollectors);
                context.strokeStyle = '#000000';
                context.beginPath();
                context.moveTo(x0, this.masterBottom);
                context.lineTo(x0, this.masterLinkBottom);
                context.stroke();

                //slaves///////////////////////////////////////////////////////////
                for(j=0; j<codex.nCollectors; j++){
                    this.drawCollectorNode(this.context, this.TTcontext, 0, '#000000', x0 - this.collectorWidth/2, this.masterLinkBottom);
                }

            }
        } else if(ODB.topLevel.HPGeArray == 'GRIFFIN'){
            //draw combs for each 1-4 connection from master to slaves:
            combWidth = this.masterWidth / (codex.nMasterGroups*1.3 + 0.3);
            for(i=0; i<codex.nMasterGroups; i++){
                //master-slave links///////////////////////////////////////////////
                //horizontal coord of branch root:
                //x0 = this.margin + (i+0.5)*(this.masterWidth / codex.nMasterGroups);
                //horizontal coord of branch / comb join:
                x1 = this.margin + (i+0.5)*combWidth + (i+1)*0.3*combWidth;
                //color of branch and comb spine:
                branchColor = interpolateColor( parseHexColor(codex.DAQmap[codex.masterGroupID[i]].masterGroupColor),
                                                parseHexColor(codex.DAQmap[codex.masterGroupID[i]].oldMasterGroupColor),
                                                frame/this.nFrames
                                            );
                combColors = ['#000000', '#000000', '#000000', '#000000'];

                drawBranch(this.context, combColors, combWidth, this.masterLinkBottom - this.masterLinkTop, branchColor, x1, this.masterBottom, x1, this.masterGroupLinkBottom);
               
                //slaves///////////////////////////////////////////////////////////
                for(j=0; j<4; j++){
                    //step through all 4 possible master channels on this master group, check if they exist, and if so, draw a slave.
                    masterChannel = (4*parseInt(codex.masterGroupID[i].slice(11, codex.masterGroupID[i].length),10) + j);
                    masterChannelID = 'master' + masterChannel;
                
                    if(codex.DAQmap[masterChannelID]){
                        this.drawCollectorNode(this.context, this.TTcontext, masterChannel, '#000000', x1 - combWidth/2 + j*combWidth/3 - this.collectorWidth/2, this.masterLinkBottom);        
                    } else {
                        this.context.strokeStyle = '#FF0000';
                        this.context.beginPath();
                        this.context.moveTo(x1 - combWidth/2 + j*combWidth/3 -10, this.masterLinkBottom -10);
                        this.context.lineTo(x1 - combWidth/2 + j*combWidth/3 +10, this.masterLinkBottom +10);
                        this.context.moveTo(x1 - combWidth/2 + j*combWidth/3 +10, this.masterLinkBottom -10);
                        this.context.lineTo(x1 - combWidth/2 + j*combWidth/3 -10, this.masterLinkBottom +10);
                        this.context.stroke();                        
                    }

                }
            }
        }
    };

    this.drawScale = function(context){

        var i, j, string, unit, transferTitle, triggerTitle; 

        context.clearRect(0, this.canvasHeight - this.scaleHeight, this.canvasWidth, this.canvasHeight);

        //titles
        context.fillStyle = '#999999';
        context.font="24px 'Orbitron'";
        context.textBaseline = 'middle';
        if(window.parameters.detectorLogMode.DAQbutton){
            transferTitle = 'log(Transfer Rate)';
            triggerTitle = 'log(Trigger Rate)';
        } else {
            transferTitle = 'Transfer Rate';
            triggerTitle = 'Trigger Rate';
        }
        context.fillText(transferTitle, this.canvasWidth/2 - context.measureText(transferTitle).width/2, this.canvasHeight-this.scaleHeight/2 - 15);
        context.fillText(triggerTitle, this.canvasWidth/2 - context.measureText(triggerTitle).width/2, this.canvasHeight-this.scaleHeight/2 + 20 + 20);
        context.textBaseline = 'alphabetic';

        //tickmark;
        context.strokeStyle = '#999999';
        context.lineWidth = 1;
        context.font="12px 'Raleway'";

        //transfer rate
        //determine unit
        unit = ((context == this.detailContext) ? ODB.DAQ.transferMaxDetailView : ODB.DAQ.transferMaxTopView);
        if(unit > 1000000) unit = ' MBps';
        else if(unit > 1000) unit = ' kBps';
        else unit = ' Bps';
        if(window.parameters.detectorLogMode.DAQbutton) unit = ' log(Bps)';

        context.beginPath();
        context.moveTo(this.canvasWidth*0.05+1, this.canvasHeight - this.scaleHeight/2);
        context.lineTo(this.canvasWidth*0.05+1, this.canvasHeight - this.scaleHeight/2-10);
        context.stroke();
        if(window.parameters.detectorLogMode.DAQbutton) string = Math.log( ((context == this.detailContext) ? ODB.DAQ.transferMinDetailView : ODB.DAQ.transferMinTopView) ) + ' log(Bps)';
        else string = ((context == this.detailContext) ? ODB.DAQ.transferMinDetailView : ODB.DAQ.transferMinTopView) + ' Bps';
        context.fillText( string, this.canvasWidth*0.05 - context.measureText(string).width/2, this.canvasHeight-this.scaleHeight/2-15);

        context.beginPath();
        context.moveTo(this.canvasWidth*0.95-1, this.canvasHeight - this.scaleHeight/2);
        context.lineTo(this.canvasWidth*0.95-1, this.canvasHeight - this.scaleHeight/2-10); 
        context.stroke();  

        string = ((context == this.detailContext) ? ODB.DAQ.transferMaxDetailView : ODB.DAQ.transferMaxTopView);
        if(window.parameters.detectorLogMode.DAQbutton){
            string = Math.log(string).toFixed(1) + unit;
        } else{
            if(string > 1000000) string = string/1000000 + unit;
            else if(string > 1000) string = string/1000 + unit;
            else string = string + unit;
        }            
        context.fillText(string, this.canvasWidth*0.95 - context.measureText(string).width/2, this.canvasHeight-this.scaleHeight/2-15);


        //trigger rate
        //determine unit:
        unit = ((context == this.detailContext) ? ODB.DAQ.rateMaxDetailView : ODB.DAQ.rateMaxTopView);
        if(unit > 1000000) unit = ' MHz';
        else if(unit > 1000) unit = ' kHz';
        else unit = ' Hz';
        if(window.parameters.detectorLogMode.DAQbutton) unit = ' log(Hz)';

        context.beginPath();
        context.moveTo(this.canvasWidth*0.05+1, this.canvasHeight - this.scaleHeight/2 + 20);
        context.lineTo(this.canvasWidth*0.05+1, this.canvasHeight - this.scaleHeight/2 + 20 + 10);
        context.stroke();
        if(window.parameters.detectorLogMode.DAQbutton) string = Math.log( ((context == this.detailContext) ? ODB.DAQ.rateMinDetailView : ODB.DAQ.rateMinTopView) ) + ' log(Hz)';
        else string = ((context == this.detailContext) ? ODB.DAQ.rateMinDetailView : ODB.DAQ.rateMinTopView) + ' Hz';
        context.fillText( string, this.canvasWidth*0.05 - context.measureText(string).width/2, this.canvasHeight-this.scaleHeight/2 + 45);

        context.beginPath();
        context.moveTo(this.canvasWidth*0.95-1, this.canvasHeight - this.scaleHeight/2 + 20);
        context.lineTo(this.canvasWidth*0.95-1, this.canvasHeight - this.scaleHeight/2 + 20 + 10); 
        context.stroke();

        string = ((context == this.detailContext) ? ODB.DAQ.rateMaxDetailView : ODB.DAQ.rateMaxTopView);
        if(window.parameters.detectorLogMode.DAQbutton){
            string = Math.log(string).toFixed(1) + unit;
        } else {
            if(string > 1000000) string = string/1000000 + unit;
            else if(string > 1000) string = string/1000 + unit;
            else string = string + unit;
        }
        context.fillText(string, this.canvasWidth*0.95 - context.measureText(string).width/2, this.canvasHeight-this.scaleHeight/2 + 45);

        for(i=0; i<3000; i++){
            context.fillStyle = scalepickr(0.001*(i%1000), window.parameters.colorScale[this.DAQcolor])//redScale(0.001*(i%1000));
            context.fillRect(this.canvasWidth*0.05 + this.canvasWidth*0.9/1000*(i%1000), this.canvasHeight-this.scaleHeight/2, this.canvasWidth*0.9/1000, 20);
        }

    };

    this.drawMasterNode = function(context, TTcontext, color){

    	context.strokeStyle = color;
    	context.fillStyle = this.cellColor;		
		roundBox(context, this.margin, this.masterTop, this.canvasWidth-2*this.margin, this.masterBottom - this.masterTop, 5);
		context.fill();
        context.stroke();

        //tooltip encoding level:
        TTcontext.fillStyle = 'rgba(255, 255, 255, 1)';
        TTcontext.fillRect(Math.round(this.margin), Math.round(this.masterTop), Math.round(this.masterWidth), Math.round(this.masterBottom - this.masterTop));

    };

    this.drawCollectorNode = function(context, TTcontext, index, color, x0, y0){

    	context.strokeStyle = color;
    	context.fillStyle = this.cellColor;
        roundBox(context, x0, y0, this.collectorWidth, this.collectorBottom - this.collectorHeight, 5);
        context.fill();
		context.stroke();

        //tooltip encoding level:
        TTcontext.fillStyle = 'rgba('+index+', '+index+', '+index+', 1)';
        TTcontext.fillRect(Math.round(x0), Math.round(y0), Math.round(this.collectorWidth), Math.round(this.collectorBottom - this.collectorHeight) );
    };
/*
    this.drawDetail = function(context, frame){
        var color, i, j, key;

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
                //from digitizers:
                this.detailContext.beginPath();
                this.detailContext.moveTo(this.margin + ((i-this.prevDigi[clctr])+0.5)*(this.canvasWidth - 2*this.margin)/this.nDigitizersPerCollector[clctr], this.canvasHeight*0.6 + topMargin);
                this.detailContext.lineTo(this.margin + ((i-this.prevDigi[clctr])+0.5)*(this.canvasWidth - 2*this.margin)/this.nDigitizersPerCollector[clctr], this.canvasHeight*0.6 + topMargin - this.collectorHeight);
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
        //roundBox(this.detailContext, this.canvasWidth/2 - this.collectorWidth/2, topMargin, this.collectorWidth, this.collectorHeight, 5);
        roundBox(this.detailContext, this.margin, topMargin, this.canvasWidth - 2*this.margin, 0.40*this.canvasHeight, 5)
        this.detailContext.fill();
        this.detailContext.stroke();

        //total data transfer:
        this.detailContext.strokeStyle = interpolateColor(parseHexColor(this.dataBus.oldDetailCollectorLinkColor[clctr]), parseHexColor(this.dataBus.detailCollectorLinkColor[clctr]), frame/this.nFrames);
        this.detailContext.lineWidth = 2*this.lineweight;
        this.detailContext.beginPath();
        this.detailContext.moveTo(this.margin + 0.5*(this.canvasWidth - 2*this.margin)/this.nDigitizersPerCollector[clctr] - this.lineweight/2, this.canvasHeight*0.6 + topMargin - this.collectorHeight);
        this.detailContext.lineTo(this.margin + ((this.nDigitizersPerCollector[clctr]-1)+0.5)*(this.canvasWidth - 2*this.margin)/this.nDigitizersPerCollector[clctr] + this.lineweight/2, this.canvasHeight*0.6 + topMargin - this.collectorHeight);
        this.detailContext.moveTo(this.canvasWidth/2, this.canvasHeight*0.6 + topMargin - this.collectorHeight);
        this.detailContext.lineTo(this.canvasWidth/2, topMargin+ 0.40*this.canvasHeight + this.lineweight/2);
        this.detailContext.stroke();

        //tooltip layer:
        this.TTdetailContext.fillStyle = 'rgba('+(clctr+1)+','+(clctr+1)+','+(clctr+1)+',1)';
        this.TTdetailContext.fillRect(Math.round(this.margin), Math.round(topMargin), Math.round(this.canvasWidth-2*this.margin), Math.round(0.25*this.canvasHeight));

        //title
        this.detailContext.fillStyle = '#FFFFFF';
        this.detailContext.textBaseline = 'alphabetic'
        fontSize = fitFont(this.detailContext, 'Digitizers', this.collectorHeight)*1.2;
        this.detailContext.font = fontSize + 'px Raleway';
        this.detailContext.save();
        this.detailContext.rotate(-Math.PI/2);
        this.detailContext.fillText('Digitizers', -this.canvasHeight*0.6 - topMargin - 0.02*this.canvasWidth - this.detailContext.measureText('Digitizers').width/2,0.7*this.margin);
        this.detailContext.restore();  

        fontSize = fitFont(this.detailContext, 'Slave '+(window.DAQdetail+1), 2*this.collectorWidth);
        this.detailContext.font = fontSize + 'px Raleway';
        this.detailContext.save();
        this.detailContext.rotate(-Math.PI/2);
        this.detailContext.fillText('Slave '+(window.DAQdetail+1), -( 0.40*this.canvasHeight/2 + topMargin + this.detailContext.measureText('Slave '+(window.DAQdetail+1)).width/2 ),0.7*this.margin);
        this.detailContext.restore();

        //generate slave chart:
        //make list of digitizer FSPCs:
        var FSPC = [], triggers = [], transfers = [], oldTriggers = [], oldTransfers = [];
        for(key in window.codex.DAQmap['0x0XXXXXX']['0x0'+(window.DAQdetail+1)+'XXXXX']){
            if(key.slice(7,9)=='XX'){
                FSPC[FSPC.length] = key.slice(6,7);
                triggers[triggers.length] = window.codex.DAQmap['0x0XXXXXX']['0x0'+(window.DAQdetail+1)+'XXXXX'][key].trigRequestRate;
                transfers[transfers.length] = window.codex.DAQmap['0x0XXXXXX']['0x0'+(window.DAQdetail+1)+'XXXXX'][key].dataRate;
                oldTriggers[oldTriggers.length] = window.codex.DAQmap['0x0XXXXXX']['0x0'+(window.DAQdetail+1)+'XXXXX'][key].oldTrigRequestRate;
                oldTransfers[oldTransfers.length] = window.codex.DAQmap['0x0XXXXXX']['0x0'+(window.DAQdetail+1)+'XXXXX'][key].oldDataRate;
            }
        }
        slaveChart(frame,this.detailContext, this.margin + 0.1*(this.canvasWidth-2*this.margin), topMargin+0.36*this.canvasHeight, FSPC, triggers, transfers, oldTriggers, oldTransfers);
    };
*/
    this.drawDetail = function(context, frame){
        var codex = window.codex,   
            masterID = 'master'+window.DAQdetail,
            slaveChannel, slaveChannelID;

        context.lineWidth = this.lineweight;

        //white out last frame
        context.clearRect(0, 0, this.canvasWidth, this.canvasHeight);
        this.TTdetailContext.fillStyle = '#123456';
        this.TTdetailContext.fillRect(0,0,this.canvasWidth,this.canvasHeight);

        //slave node//////////////////////////////////////////////////////
        color = '#000000';
        this.drawMasterNode(context, this.TTdetailContext, color); //(use drawMasterNode, looks the same on this view)

        if(ODB.topLevel.HPGeArray == 'TIGRESS'){

        } else if(ODB.topLevel.HPGeArray == 'GRIFFIN'){
            //draw the 4-1 connectors from the slave to the digitizers
            combWidth = this.masterWidth / (codex.slaveGroupID[masterID].length*1.3 + 0.3);
            for(i=0; i<codex.slaveGroupID[masterID].length; i++){
                //slave-digitizer links///////////////////////////////////////////////
                //horizontal coord of branch root:
                //x0 = this.margin + (i+0.5)*(this.masterWidth / codex.slaveGroupID[masterID].length);
                //horizontal coord of branch / comb join:
                x1 = this.margin + (i+0.5)*combWidth + (i+1)*0.3*combWidth;
                //color of branch and comb spine:
                branchColor = '#000000'//interpolateColor( '#000000', '#000000', frame/this.nFrames);
                combColors = ['#000000', '#000000', '#000000', '#000000'];

                drawBranch(context, combColors, combWidth, this.masterLinkBottom - this.masterLinkTop, branchColor, x1, this.masterBottom, x1, this.masterGroupLinkBottom);
                
                //digitizers///////////////////////////////////////////////////////////
                for(j=0; j<4; j++){
                    //step through all 4 possible slave channels on this slave group, check if they exist, and if so, draw a digitizer.
                    slaveChannel = (4*parseInt(codex.slaveGroupID[masterID][i].slice(10, codex.slaveGroupID[masterID][i].length),10) + j);
                    slaveChannelID = 'slave' + slaveChannel;
                
                    if(codex.DAQmap[masterID][slaveChannelID]){
                        this.drawCollectorNode(context, this.TTdetailContext, slaveChannel, '#000000', x1 - combWidth/2 + j*combWidth/3 - this.collectorWidth/2, this.masterLinkBottom);        
                    } else {
                        context.strokeStyle = '#FF0000';
                        context.beginPath();
                        context.moveTo(x1 - combWidth/2 + j*combWidth/3 -10, this.masterLinkBottom -10);
                        context.lineTo(x1 - combWidth/2 + j*combWidth/3 +10, this.masterLinkBottom +10);
                        context.moveTo(x1 - combWidth/2 + j*combWidth/3 +10, this.masterLinkBottom -10);
                        context.lineTo(x1 - combWidth/2 + j*combWidth/3 -10, this.masterLinkBottom +10);
                        context.stroke();                        
                    }

                }
                
            }
        }

        //console.log(codex.DAQmap[masterID])
    }

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
        //tooltip target encoding:
            //top level view: 
                //master = 255
                //master channel n = n
            //detail level view:
                //collector = 255
                //collector channel n = n


        /*
        var toolTipContent = '',
            nextLine, cardIndex, i, key, objects = [], split = [], table, mezRow, mezCell0, mezCell1,
            keys = ['detector','trigRequestRate', 'dataRate'],
            data = {};

        
        nextLine = '';
        if(this.dataBus.key[cell]){
            nextLine = 'FSPC: ' + this.dataBus.key[cell][this.dataBus.key[cell].length-1] + '<br>';

            //collectors
            if(this.dataBus.key[cell].length == 2){
                nextLine += '<br>Trig Request Rate: ' + window.codex.DAQmap[this.dataBus.key[cell][0]][this.dataBus.key[cell][1]]['trigRequestRate'].toFixed(1) + ' Hz<br>';
                nextLine += 'Inbound Data Rate: ' + window.codex.DAQmap[this.dataBus.key[cell][0]][this.dataBus.key[cell][1]]['dataRate'].toFixed(1) + ' Bps';
            }

            //digitizers
            if(this.dataBus.key[cell].length == 3){
                nextLine += '<br>Total Trig Request Rate: ' + window.codex.DAQmap[this.dataBus.key[cell][0]][this.dataBus.key[cell][1]][this.dataBus.key[cell][2]]['trigRequestRate'].toFixed(1) + ' Hz<br>';
                nextLine += 'Total Outbound Data Rate: ' + window.codex.DAQmap[this.dataBus.key[cell][0]][this.dataBus.key[cell][1]][this.dataBus.key[cell][2]]['dataRate'].toFixed(1) + ' Bps<br><br>';

                //build up arrays and objects to pass to tooltip table builder in the format it expects:
                for(key in window.codex.DAQmap[this.dataBus.key[cell][0]][this.dataBus.key[cell][1]][this.dataBus.key[cell][2]]){
                    if(window.codex.dataKeys.indexOf(key) == -1){
                        data[key] = window.codex.DAQmap[this.dataBus.key[cell][0]][this.dataBus.key[cell][1]][this.dataBus.key[cell][2]][key]
                        objects[objects.length] = key;
                    }
                }
            } 
        }

        toolTipContent += nextLine;
        if(this.detailShowing){
            document.getElementById(this.detailTooltip.ttDivID).innerHTML = toolTipContent;
            if(cell > this.nCollectors){
                //split TIG64s by mezzanine:
                if(objects.length>10){  //TODO: need more robust decision on whether we're looking at a TIG64 or not
                    split = [0,0];
                    for(i=0; i<objects.length; i++){
                        if(parseInt(objects[i].slice(7,9), 16) < 32 ) split[0]++;
                        else split[1]++;
                    }
                    window.state.staticTT = 1;
                } else
                    split = [objects.length]
                TTtable('DAQTTdetail', data, objects, keys, '', ['FSPC','Device','Trig Request Rate [Hz]', 'Outbound Data Rate [Bps]'], split);
                //fudge in a title row for mezzanines:
                if(objects.length>10){
                    table = document.getElementById('DAQTTdetailtable');
                    mezRow = table.insertRow(0);
                    mezCell0 = mezRow.insertCell(0);
                    mezCell1 = mezRow.insertCell(1);
                    mezCell0.innerHTML = 'Mezzanine 1';
                    mezCell1.innerHTML = 'Mezzanine 2';
                    mezCell0.setAttribute('colspan', 4);
                    mezCell1.setAttribute('colspan', 4);
                }
            }
        } else{
            document.getElementById(this.tooltip.ttDivID).innerHTML = toolTipContent;
        }
        
        //return length of longest line:
        return 0;
        */
        document.getElementById(this.tooltip.ttDivID).innerHTML = cell;
        document.getElementById(this.detailTooltip.ttDivID).innerHTML = cell;
        return 0
    };

    this.animate = function(){
        if(window.onDisplay == this.canvasID) animate(this, 0);
        if(window.onDisplay == this.detailCanvasID) animateDetail(this, 0);
    };
}

//vertical bar chart for digitizer data; x0 y0 represents origin of chart
function slaveChart(frame, context, x0, y0, FSPC, triggers, transfers, oldTriggers, oldTransfers){
    var chartWidth = (window.DAQpointer.canvasWidth - 2*window.DAQpointer.margin)*0.8,
    chartHeight = 0.25*window.DAQpointer.canvasHeight,
    nDigitizers = window.DAQpointer.nDigitizersPerCollector[window.DAQdetail],
    barWidth = chartWidth / (nDigitizers*2) *0.95,
    tickmarkLength = 5,
    innerMargin = (window.DAQpointer.canvasWidth - chartWidth - 2*window.DAQpointer.margin)/2,
    i;

    context.font = Math.min( 12, fitFont(context, '9.9kBps', innerMargin/1.1 ) ) +'px Raleway';
    //label horizontal axis & draw bars
    context.textBaseline = 'top';
    for(i=0; i<nDigitizers; i++){
        context.fillStyle = '#FFFFFF';
        context.lineWidth = 1;
        context.fillText(FSPC[i], x0+barWidth+i*chartWidth/nDigitizers-context.measureText(FSPC[i]).width/2, y0+2);
        triggerBar(frame, oldTriggers[i], triggers[i], x0+i*chartWidth/nDigitizers, y0);
        transferBar(frame, oldTransfers[i], transfers[i], x0+barWidth+i*chartWidth/nDigitizers+1, y0);
    }

    //draw frame
    context.lineWidth = 1;
    context.fillStyle = '#FFFFFF'
    context.strokeStyle = '#FFFFFF';
    context.beginPath();
    context.moveTo(x0-tickmarkLength,y0 - chartHeight);
    context.lineTo(x0, y0-chartHeight);
    context.lineTo(x0,y0);
    context.moveTo(x0-tickmarkLength,y0);
    context.lineTo(x0+chartWidth+tickmarkLength, y0);
    context.moveTo(x0+chartWidth, y0);
    context.lineTo(x0+chartWidth, y0 - chartHeight);
    context.lineTo(x0+chartWidth+tickmarkLength, y0-chartHeight);
    context.stroke();

    //label vertical axes
    context.textBaseline = 'middle';
    context.fillText(ODB.DAQ.transferMinDetailView/1000 + ' kBps', x0-tickmarkLength-context.measureText(ODB.DAQ.transferMinDetailView/1000 + ' kBps').width, y0 );
    context.fillText(ODB.DAQ.transferMaxDetailView/1000 + ' kBps', x0-tickmarkLength-context.measureText(ODB.DAQ.transferMaxDetailView/1000 + ' kBps').width, y0-chartHeight );
    context.fillText(ODB.DAQ.rateMinDetailView/1000 + ' kHz', x0+chartWidth+tickmarkLength, y0);
    context.fillText(ODB.DAQ.rateMaxDetailView/1000 + ' kHz', x0+chartWidth+tickmarkLength, y0-chartHeight);
    context.save();
    context.translate(x0-innerMargin/2, y0-chartHeight/2)
    context.rotate(-Math.PI/2);
    context.fillText('Transfer', -context.measureText('Transfer').width/2,0);
    context.fillStyle = '#222222';
    context.strokeStyle = '#0000FF';
    context.fillRect(-context.measureText('Transfer').width/2 - innerMargin/5-3,-innerMargin/5/2,innerMargin/5,innerMargin/5);
    context.strokeRect(-context.measureText('Transfer').width/2 - innerMargin/5-3,-innerMargin/5/2,innerMargin/5,innerMargin/5);
    context.restore();
    context.save();
    context.translate(x0+chartWidth+innerMargin/2, y0-chartHeight/2)
    context.rotate(Math.PI/2);
    context.fillText('Triggers', -context.measureText('Triggers').width/2,0);
    context.fillStyle = '#222222';
    context.strokeStyle = '#00FF00';
    context.fillRect(-context.measureText('Triggers').width/2 - innerMargin/5-3,-innerMargin/5/2,innerMargin/5,innerMargin/5);
    context.strokeRect(-context.measureText('Triggers').width/2 - innerMargin/5-3,-innerMargin/5/2,innerMargin/5,innerMargin/5);
    context.restore();

    function transferBar(frame, oldLevel, level, x0, y0){
        var height = (oldLevel - ODB.DAQ.transferMinDetailView) / (ODB.DAQ.transferMaxDetailView - ODB.DAQ.transferMinDetailView)*chartHeight + (  (level - ODB.DAQ.transferMinDetailView)/(ODB.DAQ.transferMaxDetailView - ODB.DAQ.transferMinDetailView) - (oldLevel - ODB.DAQ.transferMinDetailView) / (ODB.DAQ.transferMaxDetailView - ODB.DAQ.transferMinDetailView) )*chartHeight*frame/window.DAQpointer.nFrames;
        if(height>chartHeight) height = chartHeight;
        if(height<0) height = 0;
        context.strokeStyle = '#0000FF';
        context.fillStyle = '#222222';
        context.fillRect(x0,y0-height,barWidth,height)
        context.strokeRect(x0,y0-height,barWidth,height);
        context.save();
        context.translate(x0+barWidth/2, y0-height-2);
        context.rotate(-Math.PI/2);
        context.textBaseline = 'middle';
        context.fillStyle = '#FFFFFF';
        context.fillText(level.toFixed(0) + ' Bps', 0,0);
        context.restore();
    }

    function triggerBar(frame, oldLevel, level, x0, y0){
        var height = (oldLevel - ODB.DAQ.rateMinDetailView) / (ODB.DAQ.rateMaxDetailView - ODB.DAQ.rateMinDetailView)*chartHeight + (  (level - ODB.DAQ.rateMinDetailView)/(ODB.DAQ.rateMaxDetailView - ODB.DAQ.rateMinDetailView) - (oldLevel - ODB.DAQ.rateMinDetailView) / (ODB.DAQ.rateMaxDetailView - ODB.DAQ.rateMinDetailView) )*chartHeight*frame/window.DAQpointer.nFrames;
        if(height>chartHeight) height = chartHeight;
        if(height<0) height = 0;
        context.strokeStyle = '#00FF00';
        context.fillStyle = '#222222';
        context.fillRect(x0,y0-height,barWidth,height);
        context.strokeRect(x0,y0-height,barWidth,height);   
        context.save();
        context.translate(x0+barWidth/2, y0-height-2);
        context.rotate(-Math.PI/2);
        context.textBaseline = 'middle';
        context.fillStyle = '#FFFFFF';
        context.fillText(level.toFixed(0) + ' Hz', 0,0);
        context.restore();     
    }
}


//horizontal bar chart for DAQ data, x0 y0 represent bottom left corner of rendered area:
function rateChart(frame, data, context, x0, y0, maxLength, barWidth){

    var fontSize = 0.8*barWidth,
    row = 0,  //counts up from bottom
    key,
    rateScaleMin = ODB.DAQ.rateMinMaster,
    dataScaleMin = ODB.DAQ.transferMinMaster;    
    rateScaleMax = ODB.DAQ.rateMaxMaster,
    dataScaleMax = ODB.DAQ.transferMaxMaster;

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
        text += ' kBps';
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
    context.beginPath();
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
    context.fillText('Data Rate: '+(dataScaleMin/1000).toFixed(0)+' kBps', 1.1*x0-2 - context.measureText('Trig Requests: 0 kHz').width/2, y0+10+2*fontSize*0.7 );
    context.fillText('Data Rate: '+(dataScaleMax/1000).toFixed(0)+' kBps', 1.1*x0+maxLength - context.measureText('Trig Requests: '+(rateScaleMax/1000).toFixed(0)+' kHz').width/2, y0+10+2*fontSize*0.7 );
    context.fillStyle = '#222222';
    context.strokeStyle = '#0000FF';
    context.fillRect(1.1*x0+maxLength - context.measureText('Trig Requests: '+(rateScaleMax/1000).toFixed(0)+' kHz').width/2 - fontSize*0.7*1.5, y0+10+fontSize*1.05, fontSize*0.7, fontSize*0.7);
    context.strokeRect(1.1*x0+maxLength - context.measureText('Trig Requests: '+(rateScaleMax/1000).toFixed(0)+' kHz').width/2 - fontSize*0.7*1.5, y0+10+fontSize*1.05, fontSize*0.7, fontSize*0.7);
    context.fillRect(1.1*x0-2 - context.measureText('Trig Requests: '+(rateScaleMin/1000).toFixed(0)+' kHz').width/2 - fontSize*0.7*1.5, y0+10+fontSize*1.05, fontSize*0.7, fontSize*0.7);
    context.strokeRect(1.1*x0-2 - context.measureText('Trig Requests: '+(rateScaleMin/1000).toFixed(0)+' kHz').width/2 - fontSize*0.7*1.5, y0+10+fontSize*1.05, fontSize*0.7, fontSize*0.7);
}








//Codex imports a table from which the DAQ is mapped
DAQcodex = function(){
    var i, j, k, masterKey, slaveKey, digiKey, slaveGroupKey;

    //Parse DAQ Assets///////////////////////////////////////////////////////////////////////
    //pull the FSPC (TIGRESS) or MSC (GRIFFIN) table info in from the ODB
    if(ODB.HPGeArray == 'TIGRESS'){
        this.DAQpath = ['/Analyzer/Parameters/Cathode/Config/Name[*]', '/Analyzer/Parameters/Cathode/Config/FSCP[*]'];       
        this.DAQtable = ODBMGet(this.DAQpath);
    } else {
        this.DAQpath = ['/DashboardConfig/DAQ/Channel', '/DashboardConfig/DAQ/MSC'];
        this.DAQtable = JSON.parse(ODBMCopy(this.DAQpath));
        this.DAQtable[0] = this.DAQtable[0]['Channel'] //crush the metadata
        this.DAQtable[1] = this.DAQtable[1]['MSC']
    }
    this.Name        = this.DAQtable[0];
    this.encodedDAQ  = this.DAQtable[1];
    this.nRows       = this.DAQtable[0].length;

    //parse into DAQ levels, and sort:    
    this.table = [];
    this.masterChannel = [];  //channel master is recieving this data on
    this.slaveChannel = [];   //channel collector is recieving on
    this.digiChannel = [];    //individual digitizer channel
    //this.DAQmap = {};
    //this.detSummary = {};

    if(ODB.HPGeArray == 'TIGRESS'){
        for(i=0; i<this.nRows; i++){
            this.masterChannel = (this.encodedDAQ[i] & 0xFF00000) >> 20;
            this.slaveChannel = (this.encodedDAQ[i] & 0xFFF00) >> 8;
            this.digiChannel = this.encodedDAQ[i] & 0xFF;
            this.table.push({
                master: this.masterChannel[i],
                slave: this.slaveChannel[i],
                digi: this.digiChannel[i],
                Name: this.Name[i],
                encoded: this.encodedDAQ[i]
            });
        }
    } else { //GRIFFIN
        for(i=0; i<this.nRows; i++){
            this.masterChannel[i] = (this.encodedDAQ[i] & 0xF000) >> 12; //corresponds to 'M' in GRIFFIN MSC, the master channel
            this.slaveChannel[i] = (this.encodedDAQ[i] & 0x0F00) >> 8; //corresponds to 'S' in GRIFFIN MSC, the slave channel
            this.digiChannel[i] = this.encodedDAQ[i] & 0x00FF; //corresponds to 'C' in GRIFFIN MSC, the individual digitizer
            this.table.push({
                master : this.masterChannel[i],
                slave : this.slaveChannel[i],
                digi : this.digiChannel[i],
                Name : this.Name[i],
                encoded : this.encodedDAQ[i]
            });             
        }
    }

    function sortDAQ(a, b){
        if(a.master == b.master){
            if(a.slave == b.slave){
                if(a.digi == b.digi){
                    return -9999; //this should never happen, indicates a channel appearing in the ODB DAQ table twice.
                } else {
                    if (a.digi > b.digi) return 1;
                    if (a.digi < b.digi) return -1;
                    else return 0;                        
                }                 
            } else {
                if (a.slave > b.slave) return 1;
                if (a.slave < b.slave) return -1;
                else return 0;                    
            }
        } else {
            if (a.master > b.master) return 1;
            if (a.master < b.master) return -1;
            else return 0;                
        }
    } 

    this.table.sort(sortDAQ);  
    this.master = []; this.slave = []; this.digi = []; this.Name = [], this.encoded = [];

    for(i=0; i<this.table.length; i++){
        this.master[i] = this.table[i].master;
        this.slave[i] = this.table[i].slave;
        this.digi[i] = this.table[i].digi;
        this.Name[i] = this.table[i].Name.slice(0,10).toUpperCase();
        this.encoded[i] = this.table[i].encoded;
    }
    this.nRows = this.table.length;

    //loop over all rows, creating an object that reflects the structure of the DAQ:
    this.DAQmap = {};
    this.detSummary = {};
    this.nMasterGroups = 0;
    this.nSlaveGroups = 0;
    for(i=0; i<this.nRows; i++){

        //build keys
        masterKey = 'master'+this.master[i];
        slaveKey  = 'slave'+this.slave[i];
        digiKey   = 'digi'+this.digi[i];
        //GRIFFIN uses 4-1 cables to plug 4 digitizers into one channel on the slave, will need its own color:
        slaveGroupKey = 'slaveGroup' + Math.floor(this.slave[i]/4);
        //...and similarly for 4-1 cables between slaves and master:
        masterGroupKey = 'masterGroup' + Math.floor(this.master[i]/4);

        //navigate through the DAQmap to declare the data object for each channel, creating new child objects as necessary.
        //DAQmap structure is 
        //DAQmap{
        //    masterXX : {
        //        slaveYY : {
        //            digiZZ : {<raw data>},
        //            <more digitizers>, 
        //            slaveYY summary data: <data>
        //            slaveYY colors
        //        },
        //        <more slave channels>,
        //        masterXX summary data: <data>,
        //        <slave groups for GRIFFIN>
        //        masterXX colors
        //    },
        //    <more master channels>,
        //    top level summary data: <data>
        //    <master groups for GRIFFIN>
        //}

        if(this.DAQmap[masterKey]){
            //data pointers
            this.DAQmap[masterKey].trigRequestRate = 0; //how many trig requests are arriving at master on this master channel?
            this.DAQmap[masterKey].dataRate = 0; //what is the data rate arriving at master on this master channel?
            //colors
            this.DAQmap[masterKey].oldSlaveColor = '#00FF00';
            this.DAQmap[masterKey].slaveColor = '#00FF00';
            this.DAQmap[masterKey].oldMasterChannelColor = '#00FF00';
            this.DAQmap[masterKey].masterChannelColor = '#00FF00';
            if(this.DAQmap[masterKey][slaveKey]){
                //data pointers
                this.DAQmap[masterKey][slaveKey].trigRequestRate = 0;  //how many trig requests are arriving at this slave on this channel?
                this.DAQmap[masterKey][slaveKey].dataRate = 0;         //what is the inbound data rate to this slave on this channel?              
                this.DAQmap[masterKey][slaveKey][digiKey] = {'detector' : this.Name[i], 'DAQcode' : this.encoded[i], 'trigRequestRate' : 0, 'dataRate' : 0};
                this.detSummary[this.Name[i].slice(0,3)] = {'totalTrigRequestRate' : 0, 'prevTrigReqRate' : 0, 'totalDataRate' : 0, 'prevDataRate' : 0};
                //colors
                this.DAQmap[masterKey][slaveKey].oldDigiColor = '#00FF00';
                this.DAQmap[masterKey][slaveKey].digiColor = '#00FF00';
                this.DAQmap[masterKey][slaveKey].oldSlaveChannelColor = '#00FF00';
                this.DAQmap[masterKey][slaveKey].slaveChannelColor = '#00FF00';               
            } else{
                this.DAQmap[masterKey][slaveKey] = {};
                i--;
            }
            //GRIFFIN uses 1-4 connectors between digitizers and slaves:
            if(this.DAQmap[masterKey][slaveGroupKey]){
                //data pointer
                this.DAQmap[masterKey][slaveGroupKey].dataRate = 0;
                //colors
                this.DAQmap[masterKey][slaveGroupKey].oldSlaveGroupColor = '#00FF00';
                this.DAQmap[masterKey][slaveGroupKey].slaveGroupColor = '#00FF00';
            } else{
                this.DAQmap[masterKey][slaveGroupKey] = {};
                this.nSlaveGroups++;
            }
            
        } else{
            this.DAQmap[masterKey] = {};
            i--;
        }
        //GRIFFIN uses 1-4 connectors between master and slaves:
        if(this.DAQmap[masterGroupKey]){
            //data pointer
            this.DAQmap[masterGroupKey].dataRate = 0;
            //colors
            this.DAQmap[masterGroupKey].oldMasterGroupColor = '#00FF00';
            this.DAQmap[masterGroupKey].masterGroupColor = '#00FF00';
        } else{
            this.DAQmap[masterGroupKey] = {};
            this.nMasterGroups++;
        }
        
    }
    this.DAQmap.trigRequestRate = 0; //what is the total trigger request rate to master?
    this.DAQmap.oldMasterColor = '#00FF00';
    this.DAQmap.masterColor = '#00FF00';

    //keep track of all the key names in the DAQmap that contain data directly, and aren't part of the hierarchy, so we can ignore them when traversing the DAQ tree:
    this.dataKeys = [ 'detector', 'DAQcode', 'trigRequestRate', 'dataRate', 'oldTrigRequestRate', 'oldDataRate',
                      'oldSlaveColor', 'slaveColor', 'oldMasterChannelColor', 'masterChannelColor', 
                      'oldDigiColor', 'digiColor', 'oldSlaveChannelColor', 'slaveChannelColor',
                      'oldSlaveGroupColor', 'slaveGroupColor', 'oldMasterGroupColor', 'masterGroupColor',
                      'oldMasterColor', 'masterColor'];
    //construct some convenient summaries of keys and structures//////////////////////////////////////////////////
    //count how many collectors are present == number of distinct master channels
    this.nCollectors = 0;
    for(masterKey in this.DAQmap){
        if(this.dataKeys.indexOf(masterKey) == -1 && masterKey.indexOf('Group') == -1)
            this.nCollectors++;
    }
    //count how many digitizers are present in total and also on each collector:
    this.nDigitizers = 0;
    this.nDigitizersPerCollector = [];
    i = 0;
    for(masterKey in this.DAQmap){
        if(this.dataKeys.indexOf(masterKey) == -1){
            this.nDigitizersPerCollector[i] = 0;
            for(slaveKey in this.DAQmap[masterKey]){
                if(this.dataKeys.indexOf(slaveKey) == -1){
                    this.nDigitizers++;
                    this.nDigitizersPerCollector[i]++;
                }
            }
            i++;
        }
    }
    //make an array of all the master groups present
    this.masterGroupID = [];
    for(i=0; i<Object.keys(this.DAQmap).length; i++){
        if(Object.keys(this.DAQmap)[i].indexOf('Group') != -1)
            this.masterGroupID[this.masterGroupID.length] = Object.keys(this.DAQmap)[i];
    }
    //make an object containing all the slave groups present as arrays pointed at by their corresponding masterID:
    this.slaveGroupID = {};
    i=0;
    k=0;
    while(k<this.nCollectors){
        if(this.DAQmap['master'+i]){
            this.slaveGroupID['master'+i] = [];
            for(j=0; j<Object.keys(this.DAQmap['master'+i]).length; j++){
                if(Object.keys(this.DAQmap['master'+i])[j].indexOf('Group') != -1)
                    this.slaveGroupID['master'+i][this.slaveGroupID['master'+i].length] = Object.keys(this.DAQmap['master'+i])[j];
            }
            k++;          
        }
        i++;
    }

    //member functions////////////////////////////////////////////////////////////////////////////////////////////////
    //parse scalar into a color on a color scale bounded by min and max 
    this.parseColor = function(scalar, min, max){
        //how far along the scale are we?
        var scale 
        if(window.parameters.detectorLogMode.DAQbutton){
            scale = (Math.log(scalar) - Math.log(min)) / (Math.log(max) - Math.log(min));
        } else {
            scale = (scalar - min) / (max - min);
        }
        if(scale<0) scale = 0;
        if(scale>1) scale = 1;

        //return redScale(scale);
        return scalepickr(scale, window.parameters.colorScale[window.DAQpointer.DAQcolor])
    };

    //populate this.DAQmap with all the relevant information from the JSONPstore.
    this.update = function(){
        
        var key, masterKey, slaveKey, digiKey, slaveGroupKey, masterGroupKey, name;

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

        //sort data from JSON post into the DAQmap every update///////////////////////////////////////////
        //reset the master level summary:
        this.DAQmap.trigRequestRate = 0;
        //loop over the DAQmap:
        for(masterKey in this.DAQmap){
            //reset any GRIFFIN-style master group link summaries:
            if(masterKey.indexOf('Group') != -1)
                this.DAQmap[masterKey].dataRate = 0;  

            //bail out if this key isn't a master, slave or digitizer
            if(this.dataKeys.indexOf(masterKey) != -1 || masterKey.indexOf('Group') != -1) continue;

            //construct which master group we're in (only matters for GRIFFIN)
            masterGroupKey = 'masterGroup' + Math.floor(parseInt(masterKey.slice(6,masterKey.length),10)/4);

            //reset all the master-link level summaries:
            this.DAQmap[masterKey].trigRequestRate = 0;
            this.DAQmap[masterKey].dataRate = 0;

            //move on to per-slave link level:
            for(slaveKey in this.DAQmap[masterKey]){
                //reset any GRIFFIN-style slave group link summaries:
                if(slaveKey.indexOf('Group') != -1)
                    this.DAQmap[masterKey][slaveKey].dataRate = 0;

                //bail out if this key isn't a master, slave or digitizer
                if(this.dataKeys.indexOf(slaveKey) != -1 || slaveKey.indexOf('Group') != -1 ) continue;

                //construct which slave group we're in (only matters for GRIFFIN)
                slaveGroupKey = 'slaveGroup' + Math.floor(parseInt(slaveKey.slice(5,slaveKey.length),10)/4);

                //reset all the slave-link level summaries:
                this.DAQmap[masterKey][slaveKey].trigRequestRate = 0;
                this.DAQmap[masterKey][slaveKey].dataRate = 0;

                //move on to per-digitzer level:
                for(digiKey in this.DAQmap[masterKey][slaveKey]){
                    //bail out if this key isn't a master, slave or digitizer
                    if(this.dataKeys.indexOf(digiKey) != -1) continue;

                    //codename of the detector we're pointing at
                    name = this.DAQmap[masterKey][slaveKey][digiKey].detector; 

                    //get the base per channel data from the JSON store if it exists:
                    if(window.JSONPstore['scalar'] && window.JSONPstore['scalar'][name]){
                        this.DAQmap[masterKey][slaveKey][digiKey].trigRequestRate = window.JSONPstore['scalar'][name]['TRIGREQ'];
                        this.DAQmap[masterKey][slaveKey][digiKey].dataRate = window.JSONPstore['scalar'][name]['dataRate'];
                    }

                    //add the triggers and data rates from each digitizer to the downstream objects they contribute to:
                    //digitizer trigger rate:
                    this.DAQmap[masterKey][slaveKey].trigRequestRate += this.DAQmap[masterKey][slaveKey][digiKey].trigRequestRate;
                    //outbound digitizer link:
                    this.DAQmap[masterKey][slaveKey].dataRate += this.DAQmap[masterKey][slaveKey][digiKey].dataRate;
                    //slave group data rate (the 1 side of GRIFFIN 4-1 cables)
                    this.DAQmap[masterKey][slaveGroupKey].dataRate += this.DAQmap[masterKey][slaveKey][digiKey].dataRate;
                    //slave trigger rate:
                    this.DAQmap[masterKey].trigRequestRate += this.DAQmap[masterKey][slaveKey][digiKey].trigRequestRate;
                    //slave outbound data rate:
                    this.DAQmap[masterKey].dataRate += this.DAQmap[masterKey][slaveKey][digiKey].dataRate;
                    //master group data rate (the 1 side of GRIFFIN 4-1 cables)
                    this.DAQmap[masterGroupKey].dataRate += this.DAQmap[masterKey][slaveKey][digiKey].dataRate;
                    //master triger rate
                    this.DAQmap.trigRequestRate += this.DAQmap[masterKey][slaveKey][digiKey].trigRequestRate;

                    //also add these numbers to the per-subsystem summary statistics:
                    this.detSummary[ name.slice(0,3) ].totalTrigRequestRate += this.DAQmap[masterKey][slaveKey][digiKey].trigRequestRate;
                    this.detSummary[ name.slice(0,3) ].totalDataRate += this.DAQmap[masterKey][slaveKey][digiKey].dataRate;
                }
                //use the totals to pick a color for the digitizer:
                this.DAQmap[masterKey][slaveKey].oldDigiColor = this.DAQmap[masterKey][slaveKey].digiColor;
                this.DAQmap[masterKey][slaveKey].digiColor = this.parseColor(this.DAQmap[masterKey][slaveKey].trigRequestRate, ODB.DAQ.rateMinDetailView, ODB.DAQ.rateMaxDetailView);
                //pick a color for the outbound digitizer to slave link:
                this.DAQmap[masterKey][slaveKey].oldSlaveChannelColor = this.DAQmap[masterKey][slaveKey].slaveChannelColor;
                this.DAQmap[masterKey][slaveKey].slaveChannelColor = this.parseColor(this.DAQmap[masterKey][slaveKey].dataRate, ODB.DAQ.transferMinDetailView, ODB.DAQ.transferMaxDetailView);
                //pick a color for the slave group link (GRIFFIN)
                this.DAQmap[masterKey][slaveGroupKey].oldSlaveGroupColor = this.DAQmap[masterKey][slaveGroupKey].slaveGroupColor;
                this.DAQmap[masterKey][slaveGroupKey].slaveGroupColor = this.parseColor(this.DAQmap[masterKey][slaveGroupKey].dataRate, ODB.DAQ.transferMinDetailView, ODB.DAQ.transferMaxDetailView);
            }
            //use the totals to pick a color for the slave:
            this.DAQmap[masterKey].oldSlaveColor = this.DAQmap[masterKey].slaveColor;
            this.DAQmap[masterKey].slaveColor = this.parseColor(this.DAQmap[masterKey].trigRequestRate, ODB.DAQ.rateMinTopView, ODB.DAQ.rateMaxTopView);
            //pick a color for the outbound slave to master link:
            this.DAQmap[masterKey].oldMasterChannelColor = this.DAQmap[masterKey].masterChannelColor;
            this.DAQmap[masterKey].masterChannelColor = this.parseColor(this.DAQmap[masterKey].dataRate, ODB.DAQ.transferMinTopView, ODB.DAQ.transferMaxTopView);
            //pick a color for the master group link (GRIFFIN)
            this.DAQmap[masterGroupKey].oldMasterGroupColor = this.DAQmap[masterGroupKey].masterGroupColor;
            this.DAQmap[masterGroupKey].masterGroupColor = this.parseColor(this.DAQmap[masterGroupKey].dataRate, ODB.DAQ.transferMinTopView, ODB.DAQ.transferMaxTopView);
        }
        //use the totals to pick a color for the master:
        this.DAQmap.oldMasterColor = this.DAQmap.masterColor;
        this.DAQmap.masterColor = this.parseColor(this.DAQmap.trigRequestRate, ODB.DAQ.rateMinMaster, ODB.DAQ.rateMaxMaster);
    };

}






