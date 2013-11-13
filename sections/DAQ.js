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
    injectDOM('p', 'DAQcollectorTitle', 'DAQlinks', {'style':'display:inline; color:#999999; margin-right:5px;', 'innerHTML':'Collector'});
    //deploy collector buttons
    for(i=0; i<this.nCollectors; i++){
        injectDOM('button', 'Collector'+i, this.linkWrapperID, {
            'class' : 'navLink',
            'innerHTML' : ((ODB.topLevel.HPGeArray == 'GRIFFIN') ? i : i+1),
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
                                //use TT layer to decide which collector user clicked on
                                var collectorClicked = -1;
                                var x,y;
                                x = event.pageX - that.canvas.offsetLeft - that.monitor.offsetLeft;
                                y = event.pageY - that.canvas.offsetTop - that.monitor.offsetTop;
                                collectorClicked = that.findCell(x,y);
                                //draw and swap out if user clicked on a valid collector
                                if(collectorClicked > -1 && collectorClicked < 255){
                                    window.DAQdetail = collectorClicked;
                                    that.drawDetail(that.detailContext, that.nFrames);
                                    that.detailShowing = 1;
                                    swapFade('Collector'+(window.DAQdetail), that, 0)
                                }
                                //set up scale range dialogue:
                                if(y>that.canvasHeight - that.scaleHeight){
                                    parameterDialogue('DAQ', [ ['Transfer Rate', ODB.DAQ.transferMinTopView, ODB.DAQ.transferMaxTopView, 'Bps', '/DashboardConfig/DAQ/transferMinTopView', '/DashboardConfig/DAQ/transferMaxTopView' ], ['Trigger Rate', ODB.DAQ.rateMinTopView, ODB.DAQ.rateMaxTopView, 'Hz', '/DashboardConfig/DAQ/rateMinTopView', '/DashboardConfig/DAQ/rateMaxTopView']  ], window.parameters.colorScale[window.DAQpointer.DAQcolor]);
                                } else if(y<that.masterBottom){
                                    parameterDialogue('Device Summary',[ ['Trig Requests', ODB.DAQ.rateMinMaster, ODB.DAQ.transferMaxMaster, 'Hz', '/DashboardConfig/DAQ/rateMinMaster', '/DashboardConfig/DAQ/rateMaxMaster'], ['Data Rate', ODB.DAQ.transferMinMaster, ODB.DAQ.transferMaxMaster, 'Bps', '/DashboardConfig/DAQ/transferMinMaster', '/DashboardConfig/DAQ/transferMaxMaster']  ], false, true);
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


       
    this.masterTop = 5;
    this.masterBottom = this.masterTop + (2+nBars)*this.canvasHeight*0.1;
    this.cableLength = 2*(this.canvasHeight*0.7 - (this.masterBottom-this.masterTop) - this.canvasHeight*0.1);
    this.masterGroupLinkTop = this.masterBottom;
    this.masterGroupLinkBottom = this.masterGroupLinkTop + this.cableLength/2;
    this.masterLinkTop = this.masterGroupLinkBottom;
    this.masterLinkBottom = this.masterLinkTop + this.cableLength/2;
    this.collectorTop = this.masterLinkBottom;
    this.collectorBottom = this.canvasHeight*0.78;

    this.masterWidth = this.canvasWidth-2*this.margin;
    this.collectorHeight = this.collectorBottom - this.collectorTop;

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

        this.tooltip.update();
        this.detailTooltip.update();

        //animate if DAQ is showing:
        this.animate();

	};

    this.draw = function(frame){
        var color, oldColor, i, j, x0, x1, branchColor, combWidth, combColors = [], masterChannel, masterChannelID,
            codex = window.codex,
            headerString, headerHeight, detectors=0, key; 

        this.context.lineWidth = this.lineweight;

        //master node//////////////////////////////////////////////////////
        color = interpolateColor(parseHexColor(codex.DAQmap.oldMasterColor), parseHexColor(codex.DAQmap.masterColor), frame / this.nFrames);
        this.drawMasterNode(this.context, this.TTcontext, color);

        
        if(ODB.topLevel.HPGeArray == 'TIGRESS'){
            //TIGRESS uses simple 1-1 connectors:
            for(i=0; i<codex.nCollectors; i++){
                //master-collector links///////////////////////////////////////////////
                x0 = this.margin + (i+0.5)*(this.masterWidth / codex.nCollectors);
                context.strokeStyle = '#000000';
                context.beginPath();
                context.moveTo(x0, this.masterBottom);
                context.lineTo(x0, this.masterLinkBottom);
                context.stroke();

                //collectors///////////////////////////////////////////////////////////
                for(j=0; j<codex.nCollectors; j++){
                    this.drawCollectorNode(this.context, this.TTcontext, 0, '#000000', x0 - this.collectorWidth/2, this.masterLinkBottom);
                }

            }
        } else if(ODB.topLevel.HPGeArray == 'GRIFFIN'){
            //draw combs for each 1-4 connection from master to collectors:
            combWidth = this.masterWidth / (codex.nMasterGroups*1.3 + 0.3);
            for(i=0; i<codex.nMasterGroups; i++){
                //horizontal coord of branch / comb join:
                x1 = this.margin + (i+0.5)*combWidth + (i+1)*0.3*combWidth;
                //collectors///////////////////////////////////////////////////////////
                for(j=0; j<4; j++){
                    //step through all 4 possible master channels on this master group, check if they exist, and if so, draw a collector.
                    masterChannel = (4*parseInt(codex.masterGroupID[i].slice(11, codex.masterGroupID[i].length),10) + j);
                    masterChannelID = 'master' + masterChannel;
                
                    if(codex.DAQmap[masterChannelID]){
                        color = codex.DAQmap[masterChannelID].collectorColor;
                        oldColor = codex.DAQmap[masterChannelID].oldCollectorColor;
                        color = interpolateColor(   parseHexColor(oldColor),
                                                    parseHexColor(color),
                                                    frame/this.nFrames);

                        this.drawCollectorNode(this.context, this.TTcontext, masterChannel, color, x1 - combWidth/2 + j*combWidth/3 - this.collectorWidth/2, this.masterLinkBottom);
                        //determine the master channel color for this connector:
                        color = codex.DAQmap[masterChannelID].masterChannelColor;
                        oldColor = codex.DAQmap[masterChannelID].oldMasterChannelColor;
                        combColors[j] = interpolateColor(   parseHexColor(oldColor),
                                                            parseHexColor(color),
                                                            frame/this.nFrames);
                    } else {
                         combColors[j] = '#000000';                      
                    }
                }
                //master-collector links///////////////////////////////////////////////
                //horizontal coord of branch root:
                //x0 = this.margin + (i+0.5)*(this.masterWidth / codex.nMasterGroups);
                //color of branch and comb spine:
                branchColor = interpolateColor( parseHexColor(codex.DAQmap[codex.masterGroupID[i]].oldMasterGroupColor),
                                                parseHexColor(codex.DAQmap[codex.masterGroupID[i]].masterGroupColor),
                                                frame/this.nFrames
                                            );
                drawBranch(this.context, combColors, combWidth, this.masterLinkBottom - this.masterLinkTop, branchColor, x1, this.masterBottom, x1, this.masterGroupLinkBottom);

                //terminate any dangling wire with a red X:
                for(j=0; j<4; j++){
                    masterChannel = (4*parseInt(codex.masterGroupID[i].slice(11, codex.masterGroupID[i].length),10) + j);
                    masterChannelID = 'master' + masterChannel;
                    if(!codex.DAQmap[masterChannelID]){
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

        if(frame == 0){
            this.context.clearRect(0, 0, this.margin, this.canvasHeight - this.scaleHeight);
            this.drawScale(this.context);

            //labels:
            this.context.fillStyle = '#FFFFFF';
            fontSize = fitFont(this.context, 'Collectors', this.collectorHeight + this.cableLength/2);
            this.context.font = fontSize + 'px Raleway';
            this.context.save();
            this.context.rotate(-Math.PI/2);
            this.context.fillText('Collectors', -(this.collectorTop + this.context.measureText('Collectors').width/2 ),0.7*this.margin);
            this.context.restore();

            fontSize = fitFont(this.context, 'Master', this.collectorHeight + this.cableLength/2);
            this.context.font = fontSize + 'px Raleway';
            this.context.save();
            this.context.rotate(-Math.PI/2);
            this.context.fillText('Master', -( (this.masterBottom-this.masterTop)/2 + this.context.measureText('Master').width/2 ),0.7*this.margin);
            this.context.restore();
        }

        //rate chart
        rateChart(frame, window.codex.detSummary, this.context, this.canvasWidth*0.2, this.masterBottom*0.8, this.canvasWidth*0.6, this.collectorWidth );

        //trigger & event builder reporting:
        //decide how many valid keys are in the det summary:
        for(key in window.codex.detSummary){
            if(window.parameters.validDetectors.indexOf(key) != -1)
                detectors++;
        }
        headerString = 'TRIGGER: Events: ' + parseFloat(window.codex.triggerRate).toFixed(0) + ' Hz; Data: ' + parseFloat(window.codex.triggerDataRate/1000).toFixed(0) + ' Mb/s  EVENT BUILDER: ' + parseFloat(window.codex.EBrate).toFixed(0) + ' Hz; Data: ' + parseFloat(window.codex.EBdataRate/1000).toFixed(0) + ' Mb/s'
        headerHeight = (this.masterBottom*0.8 - detectors*this.collectorWidth - this.masterTop)/2 + this.masterTop;
        this.context.fillStyle = '#FFFFFF';
        this.context.font = fitFont(this.context, headerString, this.canvasWidth*0.8)+'px Raleway';
        this.context.fillText(headerString, this.canvasWidth/2 - this.context.measureText(headerString).width/2, headerHeight);
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

        //make a tooltip hook for the scale; leave a 5px border to kick the cursor back to normal without an onmouseout
        if(context == this.context){
            this.TTcontext.fillStyle = 'rgba(254,254,254,1)';
            this.TTcontext.fillRect(5, this.canvasHeight - this.scaleHeight+5, this.canvasWidth-10, this.canvasHeight-10);
        } else{
        //same for the detail view
            this.TTdetailContext.fillStyle = 'rgba(254,254,254,1)';
            this.TTdetailContext.fillRect(5, this.canvasHeight - this.scaleHeight+5, this.canvasWidth-10, this.canvasHeight-10);
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
        roundBox(context, x0, y0, this.collectorWidth, this.collectorBottom - this.collectorTop, 5);
        context.fill();
		context.stroke();

        //tooltip encoding level:
        TTcontext.fillStyle = 'rgba('+index+', '+index+', '+index+', 1)';
        TTcontext.fillRect(Math.round(x0), Math.round(y0), Math.round(this.collectorWidth), Math.round(this.collectorBottom - this.collectorTop) );
    };

    this.drawDetail = function(context, frame){
        var codex = window.codex,   
            masterID = 'master'+window.DAQdetail,
            collectorChannel, collectorChannelID, collectorGroupID, x1, branchColor, combColors = [], combWidth, color, oldColor,
            channelCode = [], triggers = [], transfers = [], oldTriggers = [], oldTransfers = [],
            topMargin = 30;

        context.lineWidth = this.lineweight;

        //white out last frame
        context.clearRect(0, 0, this.canvasWidth, this.canvasHeight);
        this.TTdetailContext.fillStyle = '#123456';
        this.TTdetailContext.fillRect(0,0,this.canvasWidth,this.canvasHeight);

        //collector node//////////////////////////////////////////////////////
        color = codex.DAQmap[masterID].collectorColor;
        oldColor = codex.DAQmap[masterID].oldCollectorColor;
        this.drawMasterNode(context, this.TTdetailContext, color); //(use drawMasterNode, looks the same on this view)

        if(ODB.topLevel.HPGeArray == 'TIGRESS'){

        } else if(ODB.topLevel.HPGeArray == 'GRIFFIN'){
            combWidth = this.masterWidth / (codex.collectorGroupID[masterID].length*1.3 + 0.3);
            //loop over collector groups
            for(i=0; i<codex.collectorGroupID[masterID].length; i++){
                collectorGroupID = codex.collectorGroupID[masterID][i];
                //collector-digitizer links///////////////////////////////////////////////
                //horizontal coord of branch / comb join:
                x1 = this.margin + (i+0.5)*combWidth + (i+1)*0.3*combWidth;
                //color of branch and comb spine reflects total data rate leaving the group of digitizers:
                branchColor = interpolateColor( parseHexColor(codex.DAQmap[masterID][collectorGroupID].oldCollectorGroupColor), 
                                                parseHexColor(codex.DAQmap[masterID][collectorGroupID].collectorGroupColor), 
                                                frame/this.nFrames);
                //step through the collectors in this group, interpolate their color and assign it to combColors if the collector exists.
                for(j=0; j<4; j++){
                    collectorChannelID = 'collector'+( 4*parseInt(codex.collectorGroupID[masterID][i].slice(14),10) + j);
                    if(codex.DAQmap[masterID][collectorChannelID]){
                        oldColor = codex.DAQmap[masterID][collectorChannelID].oldCollectorChannelColor;
                        color = codex.DAQmap[masterID][collectorChannelID].collectorChannelColor;
                        combColors[j] = interpolateColor(parseHexColor(oldColor), parseHexColor(color), frame/this.nFrames);
                    } else
                        combColors[j] = '#000000';
                }

                drawBranch(context, combColors, combWidth, this.masterLinkBottom - this.masterLinkTop, branchColor, x1, this.masterBottom+parseFloat(context.lineWidth)/2, x1, this.masterGroupLinkBottom);
                
                //digitizers///////////////////////////////////////////////////////////
                for(j=0; j<4; j++){
                    //step through all 4 possible collector channels on this collector group, check if they exist, and if so, draw a digitizer.
                    collectorChannel = (4*parseInt(codex.collectorGroupID[masterID][i].slice(14),10) + j);
                    collectorChannelID = 'collector' + collectorChannel;
                
                    if(codex.DAQmap[masterID][collectorChannelID]){
                        color = interpolateColor(parseHexColor(codex.DAQmap[masterID][collectorChannelID].oldDigiColor), parseHexColor(codex.DAQmap[masterID][collectorChannelID].digiColor), frame/this.nFrames);
                        this.drawCollectorNode(context, this.TTdetailContext, collectorChannel, color, x1 - combWidth/2 + j*combWidth/3 - this.collectorWidth/2, this.masterLinkBottom);        
                    } else {
                        //terminate an empty cable with a red X
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

        //draw scale
        this.drawScale(this.detailContext);
        //generate collector chart:
        //make list of digitizer codes:
        for(key in window.codex.DAQmap['master'+window.DAQdetail]){
            if(codex.dataKeys.indexOf(key) != -1 || key.indexOf('Group') != -1) continue;
            channelCode[channelCode.length] = key;
            triggers[triggers.length] = codex.DAQmap['master'+window.DAQdetail][key].trigRequestRate;
            transfers[transfers.length] = codex.DAQmap['master'+window.DAQdetail][key].dataRate;
            oldTriggers[oldTriggers.length] = codex.DAQmap['master'+window.DAQdetail][key].oldTrigRequestRate;
            oldTransfers[oldTransfers.length] = codex.DAQmap['master'+window.DAQdetail][key].oldDataRate;
        }
        collectorChart(frame,this.detailContext, this.margin + 0.1*(this.canvasWidth-2*this.margin), this.masterBottom*0.9, channelCode, triggers, transfers, oldTriggers, oldTransfers);

        //title
        this.detailContext.fillStyle = '#FFFFFF';
        this.detailContext.textBaseline = 'alphabetic'
        fontSize = fitFont(this.detailContext, 'Digitizers', this.collectorHeight + this.cableLength/2)*1.2;
        this.detailContext.font = fontSize + 'px Raleway';
        this.detailContext.save();
        this.detailContext.rotate(-Math.PI/2);
        this.detailContext.fillText('Digitizers', -this.collectorTop - this.detailContext.measureText('Digitizers').width/2,0.7*this.margin);
        this.detailContext.restore();  

        fontSize = fitFont(this.detailContext, 'Collector '+(window.DAQdetail+1), this.collectorHeight + this.cableLength/2);
        this.detailContext.font = fontSize + 'px Raleway';
        this.detailContext.save();
        this.detailContext.rotate(-Math.PI/2);
        this.detailContext.fillText('Collector '+window.DAQdetail, -( 0.40*this.canvasHeight/2 + topMargin + this.detailContext.measureText('Collector '+window.DAQdetail).width/2 ),0.7*this.margin);
        this.detailContext.restore();
        
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
        //tooltip target encoding:
            //top level view: 
                //master = 255
                //master channel n = n
            //detail level view:
                //collector = 255
                //collector channel n = n

        var toolTipContent, key, data = {}, objects = [], masterKey, collectorKey, channelCodes = [], split = [0],
            table, mezRow, mezCell0, mezCell1,
            keys = ['detector','trigRequestRate', 'dataRate'],
            encodingType = (ODB.topLevel.HPGeArray == 'GRIFFIN') ? 'MSC' : 'FSPC';

        //top level view////////////////////////////////////////////////////////////////////////
        if(window.onDisplay == this.canvasID){
            if(cell == 255){
                masterSummary();
            } else if(cell == 254){
                toolTipContent = 'Click to adjust scale.'
                document.getElementById(this.tooltip.ttDivID).innerHTML = toolTipContent;
            } else {
                collectorSummary(cell, 'DAQTT');
            }
        //detail level view/////////////////////////////////////////////////////////////////////
        } else if(window.onDisplay == this.detailCanvasID){
            masterKey = 'master' + window.DAQdetail;
            collectorKey = 'collector' + cell;
            //collector:
            if(cell == 255){
                collectorSummary(window.DAQdetail, 'DAQTTdetail');
            //digitizers:
            } else if(cell == 254){
                toolTipContent = 'Click to adjust scale.'
                document.getElementById(this.detailTooltip.ttDivID).innerHTML = toolTipContent;
            } else if(cell >= 0 && cell < 254) {
                //title and summary
                toolTipContent = '<h3>Digitizer on Master Ch. ' + window.DAQdetail + ', Collector Ch. ' + cell + '</h3><br>';
                toolTipContent += 'Total Trigger Rate: ' + window.codex.DAQmap[masterKey][collectorKey].trigRequestRate.toFixed() + ' Hz<br>';
                toolTipContent += 'Total Inbound Data Rate: ' + window.codex.DAQmap[masterKey][collectorKey].dataRate.toFixed() + ' Bps<br><br>';
                document.getElementById(this.detailTooltip.ttDivID).innerHTML = toolTipContent;

                //build up arrays and objects to pass to tooltip table builder in the format it expects:
                for(key in window.codex.DAQmap[masterKey][collectorKey]){
                    if(window.codex.dataKeys.indexOf(key) == -1){
                        data[key] = window.codex.DAQmap[masterKey][collectorKey][key];
                        objects[objects.length] = key;
                        channelCodes[channelCodes.length] = hexString(window.codex.DAQmap[masterKey][collectorKey][key].DAQcode, 4);
                        //stick the first 32 things in the first super column
                        //==everything is one column except TIG64's, which have 1 col per mezannine.
                        if(split[0] < 32) split[0]++;
                        else if(split.length == 1){
                            split[1] = 1;
                            window.state.staticTT = 1; //giant TT can run off of small screens, keep fixed and centered
                        }
                        else split[1]++;
                    }
                }
                TTtable('DAQTTdetail', data, objects, keys, channelCodes, '', [encodingType,'Device','Trig Request Rate [Hz]', 'Outbound Data Rate [Bps]'], split);
                //fudge in a title row for mezzanines:
                if(split.length>1){
                    table = document.getElementById('DAQTTdetailtable');
                    mezRow = table.insertRow(0);
                    mezCell0 = mezRow.insertCell(0);
                    mezCell1 = mezRow.insertCell(1);
                    mezCell0.innerHTML = '<h3>Mezzanine 1</h3>';
                    mezCell1.innerHTML = '<h3>Mezzanine 2</h3>';
                    mezCell0.setAttribute('colspan', 4);
                    mezCell1.setAttribute('colspan', 4);
                }
            }
        }

        return 0
    };

    this.animate = function(){
        if(window.onDisplay == this.canvasID) animate(this, 0);
        if(window.onDisplay == this.detailCanvasID) animateDetail(this, 0);
    };
}

//factor out the collector tooltip construction since it is used in both top level and detail level views:
function collectorSummary(masterCh, ttID){
    var masterKey = 'master' + masterCh,
        keys = ['trigRequestRate', 'dataRate'],
        key, data = {}, objects = [], channelCodes = [], split = [0];

    //title and summary
    toolTipContent = '<h3>Collector on Master Ch. ' + masterCh + '</h3><br>';
    toolTipContent += 'Total Trigger Rate: ' + window.codex.DAQmap[masterKey].trigRequestRate.toFixed() + ' Hz<br>';
    toolTipContent += 'Total Inbound Data Rate: ' + window.codex.DAQmap[masterKey].dataRate.toFixed() + ' Bps<br><br>';                
    document.getElementById(ttID).innerHTML = toolTipContent;

    //make a table of all the collector summaries
    //build up arrays and objects to pass to tooltip table builder in the format it expects:
    for(key in window.codex.DAQmap[masterKey]){
        if(window.codex.dataKeys.indexOf(key) == -1 && key.indexOf('Group') == -1 ){
            data[key] = window.codex.DAQmap[masterKey][key];
            objects[objects.length] = key;
            channelCodes[channelCodes.length] = key.slice(9,key.length);
            //stick the first 32 things in the first super column
            //==everything is one column except TIG64's, which have 1 col per mezannine.
            if(split[0] < 32) split[0]++;
            else if(split.length == 1){
                split[1] = 1;
                window.state.staticTT = 1; //giant TT can run off of small screens, keep fixed and centered
            }
            else split[1]++;
        }
    }

    TTtable(ttID, data, objects, keys, channelCodes, '', ['Collector Ch.','Trig Request Rate [Hz]', 'Outbound Data Rate [Bps]'], split);
}

//TODO: this is almost the same as collectorSummary(), combine?
function masterSummary(){
    var keys = ['trigRequestRate', 'dataRate'],
        key, data = {}, objects = [], channelCodes = [], split = [0];

    //title and summary
    toolTipContent = '<h3>DAQ Master</h3><br>';
    toolTipContent += 'Total Trigger Rate: ' + window.codex.DAQmap.trigRequestRate.toFixed() + ' Hz<br><br>';                
    document.getElementById('DAQTT').innerHTML = toolTipContent;

    //make a table of all the collector summaries
    //build up arrays and objects to pass to tooltip table builder in the format it expects:
    for(key in window.codex.DAQmap){
        if(window.codex.dataKeys.indexOf(key) == -1 && key.indexOf('Group') == -1 ){
            data[key] = window.codex.DAQmap[key];
            objects[objects.length] = key;
            channelCodes[channelCodes.length] = key.slice(6,key.length);
            //stick the first 32 things in the first super column
            //==everything is one column except TIG64's, which have 1 col per mezannine.
            if(split[0] < 32) split[0]++;
            else if(split.length == 1){
                split[1] = 1;
                window.state.staticTT = 1; //giant TT can run off of small screens, keep fixed and centered
            }
            else split[1]++;
        }
    }

    TTtable('DAQTT', data, objects, keys, channelCodes, '', ['Master Ch.','Trig Request Rate [Hz]', 'Outbound Data Rate [Bps]'], split);   
}

//vertical bar chart for digitizer data; x0 y0 represents origin of chart
function collectorChart(frame, context, x0, y0, FSPC, triggers, transfers, oldTriggers, oldTransfers){
    var chartWidth = (window.DAQpointer.canvasWidth - 2*window.DAQpointer.margin)*0.8,
    chartHeight = window.DAQpointer.masterBottom*0.7,
    nDigitizers = FSPC.length,
    barWidth = chartWidth / (nDigitizers*2) *0.95,
    tickmarkLength = 5,
    innerMargin = (window.DAQpointer.canvasWidth - chartWidth - 2*window.DAQpointer.margin)/2,
    i, key;

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
    legendFont = Math.min(fontSize, 16),
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

    context.font = legendFont*0.7+'px Raleway';
    //trig request labels
    context.fillText('Trig Requests: '+(rateScaleMin/1000).toFixed(0)+' kHz', 1.1*x0-2 - context.measureText('Trig Requests: 0 kHz').width/2, y0+5+legendFont*0.7 );
    context.fillText('Trig Requests: '+(rateScaleMax/1000).toFixed(0)+' kHz', 1.1*x0+maxLength - context.measureText('Trig Requests: '+(rateScaleMax/1000).toFixed(0)+' kHz').width/2, y0+5+legendFont*0.7 );
    context.fillStyle = '#222222';
    context.strokeStyle = '#00FF00';
    context.fillRect(1.1*x0+maxLength - context.measureText('Trig Requests: '+(rateScaleMax/1000).toFixed(0)+' kHz').width/2 - legendFont*0.7*1.5, y0+5+legendFont*0.35, legendFont*0.7, legendFont*0.7);
    context.strokeRect(1.1*x0+maxLength - context.measureText('Trig Requests: '+(rateScaleMax/1000).toFixed(0)+' kHz').width/2 - legendFont*0.7*1.5, y0+5+legendFont*0.35, legendFont*0.7, legendFont*0.7);
    context.fillRect(1.1*x0-2 - context.measureText('Trig Requests: '+(rateScaleMin/1000).toFixed(0)+' kHz').width/2 - legendFont*0.7*1.5, y0+5+legendFont*0.35, legendFont*0.7, legendFont*0.7);
    context.strokeRect(1.1*x0-2 - context.measureText('Trig Requests: '+(rateScaleMin/1000).toFixed(0)+' kHz').width/2 - legendFont*0.7*1.5, y0+5+legendFont*0.35, legendFont*0.7, legendFont*0.7);

    //data rate labels, left aligned with trig request labels
    context.fillStyle = '#FFFFFF';
    context.fillText('Data Rate: '+(dataScaleMin/1000).toFixed(0)+' kBps', 1.1*x0-2 - context.measureText('Trig Requests: 0 kHz').width/2, y0+10+2*legendFont*0.7 );
    context.fillText('Data Rate: '+(dataScaleMax/1000).toFixed(0)+' kBps', 1.1*x0+maxLength - context.measureText('Trig Requests: '+(rateScaleMax/1000).toFixed(0)+' kHz').width/2, y0+10+2*legendFont*0.7 );
    context.fillStyle = '#222222';
    context.strokeStyle = '#0000FF';
    context.fillRect(1.1*x0+maxLength - context.measureText('Trig Requests: '+(rateScaleMax/1000).toFixed(0)+' kHz').width/2 - legendFont*0.7*1.5, y0+10+legendFont*1.05, legendFont*0.7, legendFont*0.7);
    context.strokeRect(1.1*x0+maxLength - context.measureText('Trig Requests: '+(rateScaleMax/1000).toFixed(0)+' kHz').width/2 - legendFont*0.7*1.5, y0+10+legendFont*1.05, legendFont*0.7, legendFont*0.7);
    context.fillRect(1.1*x0-2 - context.measureText('Trig Requests: '+(rateScaleMin/1000).toFixed(0)+' kHz').width/2 - legendFont*0.7*1.5, y0+10+legendFont*1.05, legendFont*0.7, legendFont*0.7);
    context.strokeRect(1.1*x0-2 - context.measureText('Trig Requests: '+(rateScaleMin/1000).toFixed(0)+' kHz').width/2 - legendFont*0.7*1.5, y0+10+legendFont*1.05, legendFont*0.7, legendFont*0.7);
}








//Codex imports a table from which the DAQ is mapped
DAQcodex = function(){
    var i, j, k, masterKey, collectorKey, digiKey, collectorGroupKey;

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
    this.collectorChannel = [];   //channel collector is recieving on
    this.digiChannel = [];    //individual digitizer channel
    //this.DAQmap = {};
    //this.detSummary = {};

    if(ODB.HPGeArray == 'TIGRESS'){
        for(i=0; i<this.nRows; i++){
            this.masterChannel = (this.encodedDAQ[i] & 0xFF00000) >> 20;
            this.collectorChannel = (this.encodedDAQ[i] & 0xFFF00) >> 8;
            this.digiChannel = this.encodedDAQ[i] & 0xFF;
            this.table.push({
                master: this.masterChannel[i],
                collector: this.collectorChannel[i],
                digi: this.digiChannel[i],
                Name: this.Name[i],
                encoded: this.encodedDAQ[i]
            });
        }
    } else { //GRIFFIN
        for(i=0; i<this.nRows; i++){
            this.masterChannel[i] = (this.encodedDAQ[i] & 0xF000) >> 12; //corresponds to 'M' in GRIFFIN MSC, the master channel
            this.collectorChannel[i] = (this.encodedDAQ[i] & 0x0F00) >> 8; //corresponds to 'S' in GRIFFIN MSC, the collector channel
            this.digiChannel[i] = this.encodedDAQ[i] & 0x00FF; //corresponds to 'C' in GRIFFIN MSC, the individual digitizer
            this.table.push({
                master : this.masterChannel[i],
                collector : this.collectorChannel[i],
                digi : this.digiChannel[i],
                Name : this.Name[i],
                encoded : this.encodedDAQ[i]
            });             
        }
    }

    function sortDAQ(a, b){
        if(a.master == b.master){
            if(a.collector == b.collector){
                if(a.digi == b.digi){
                    return -9999; //this should never happen, indicates a channel appearing in the ODB DAQ table twice.
                } else {
                    if (a.digi > b.digi) return 1;
                    if (a.digi < b.digi) return -1;
                    else return 0;                        
                }                 
            } else {
                if (a.collector > b.collector) return 1;
                if (a.collector < b.collector) return -1;
                else return 0;                    
            }
        } else {
            if (a.master > b.master) return 1;
            if (a.master < b.master) return -1;
            else return 0;                
        }
    } 

    this.table.sort(sortDAQ);  
    this.master = []; this.collector = []; this.digi = []; this.Name = [], this.encoded = [];

    for(i=0; i<this.table.length; i++){
        this.master[i] = this.table[i].master;
        this.collector[i] = this.table[i].collector;
        this.digi[i] = this.table[i].digi;
        this.Name[i] = this.table[i].Name.slice(0,10).toUpperCase();
        this.encoded[i] = this.table[i].encoded;
    }
    this.nRows = this.table.length;

    //loop over all rows, creating an object that reflects the structure of the DAQ:
    this.DAQmap = {};
    this.detSummary = {};
    this.nMasterGroups = 0;
    this.nCollectorGroups = 0;
    for(i=0; i<this.nRows; i++){

        //build keys
        masterKey = 'master'+this.master[i];
        collectorKey  = 'collector'+this.collector[i];
        digiKey   = 'digi'+this.digi[i];
        //GRIFFIN uses 4-1 cables to plug 4 digitizers into one channel on the collector, will need its own color:
        collectorGroupKey = 'collectorGroup' + Math.floor(this.collector[i]/4);
        //...and similarly for 4-1 cables between collectors and master:
        masterGroupKey = 'masterGroup' + Math.floor(this.master[i]/4);

        //navigate through the DAQmap to declare the data object for each channel, creating new child objects as necessary.
        //DAQmap structure is 
        //DAQmap{
        //    masterXX : {
        //        collectorYY : {
        //            digiZZ : {<raw data>},
        //            <more digitizers>, 
        //            collectorYY summary data: <data>
        //            collectorYY colors
        //        },
        //        <more collector channels>,
        //        masterXX summary data: <data>,
        //        <collector groups for GRIFFIN>
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
            this.DAQmap[masterKey].oldCollectorColor = '#00FF00';
            this.DAQmap[masterKey].collectorColor = '#00FF00';
            this.DAQmap[masterKey].oldMasterChannelColor = '#00FF00';
            this.DAQmap[masterKey].masterChannelColor = '#00FF00';
            if(this.DAQmap[masterKey][collectorKey]){
                //data pointers
                this.DAQmap[masterKey][collectorKey].trigRequestRate = 0;  //how many trig requests are arriving at this collector on this channel?
                this.DAQmap[masterKey][collectorKey].dataRate = 0;         //what is the inbound data rate to this collector on this channel?              
                this.DAQmap[masterKey][collectorKey][digiKey] = {'detector' : this.Name[i], 'DAQcode' : this.encoded[i], 'trigRequestRate' : 0, 'dataRate' : 0};
                this.detSummary[this.Name[i].slice(0,3)] = {'totalTrigRequestRate' : 0, 'prevTrigReqRate' : 0, 'totalDataRate' : 0, 'prevDataRate' : 0};
                //colors
                this.DAQmap[masterKey][collectorKey].oldDigiColor = '#00FF00';
                this.DAQmap[masterKey][collectorKey].digiColor = '#00FF00';
                this.DAQmap[masterKey][collectorKey].oldCollectorChannelColor = '#00FF00';
                this.DAQmap[masterKey][collectorKey].collectorChannelColor = '#00FF00';               
            } else{
                this.DAQmap[masterKey][collectorKey] = {};
                i--;
            }
            //GRIFFIN uses 1-4 connectors between digitizers and collectors:
            if(this.DAQmap[masterKey][collectorGroupKey]){
                //data pointer
                this.DAQmap[masterKey][collectorGroupKey].dataRate = 0;
                //colors
                this.DAQmap[masterKey][collectorGroupKey].oldCollectorGroupColor = '#00FF00';
                this.DAQmap[masterKey][collectorGroupKey].collectorGroupColor = '#00FF00';
            } else{
                this.DAQmap[masterKey][collectorGroupKey] = {};
                this.nCollectorGroups++;
            }
            
        } else{
            this.DAQmap[masterKey] = {};
            i--;
        }
        //GRIFFIN uses 1-4 connectors between master and collectors:
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
                      'oldCollectorColor', 'collectorColor', 'oldMasterChannelColor', 'masterChannelColor', 
                      'oldDigiColor', 'digiColor', 'oldCollectorChannelColor', 'collectorChannelColor',
                      'oldCollectorGroupColor', 'collectorGroupColor', 'oldMasterGroupColor', 'masterGroupColor',
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
            for(collectorKey in this.DAQmap[masterKey]){
                if(this.dataKeys.indexOf(collectorKey) == -1){
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
    //make an object containing all the collector groups present as arrays pointed at by their corresponding masterID:
    this.collectorGroupID = {};
    i=0;
    k=0;
    while(k<this.nCollectors){
        if(this.DAQmap['master'+i]){
            this.collectorGroupID['master'+i] = [];
            for(j=0; j<Object.keys(this.DAQmap['master'+i]).length; j++){
                if(Object.keys(this.DAQmap['master'+i])[j].indexOf('Group') != -1)
                    this.collectorGroupID['master'+i][this.collectorGroupID['master'+i].length] = Object.keys(this.DAQmap['master'+i])[j];
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
        
        var key, masterKey, collectorKey, digiKey, collectorGroupKey, masterGroupKey, name;

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

            //bail out if this key isn't a master, collector or digitizer
            if(this.dataKeys.indexOf(masterKey) != -1 || masterKey.indexOf('Group') != -1) continue;

            //construct which master group we're in (only matters for GRIFFIN)
            masterGroupKey = 'masterGroup' + Math.floor(parseInt(masterKey.slice(6,masterKey.length),10)/4);

            //reset all the master-link level summaries:
            this.DAQmap[masterKey].trigRequestRate = 0;
            this.DAQmap[masterKey].dataRate = 0;

            //move on to per-collector link level:
            for(collectorKey in this.DAQmap[masterKey]){
                //reset any GRIFFIN-style collector group link summaries:
                if(collectorKey.indexOf('Group') != -1)
                    this.DAQmap[masterKey][collectorKey].dataRate = 0;

                //bail out if this key isn't a master, collector or digitizer
                if(this.dataKeys.indexOf(collectorKey) != -1 || collectorKey.indexOf('Group') != -1 ) continue;

                //construct which collector group we're in (only matters for GRIFFIN)
                collectorGroupKey = 'collectorGroup' + Math.floor(parseInt(collectorKey.slice(9,collectorKey.length),10)/4);

                //reset all the collector-link level summaries:
                this.DAQmap[masterKey][collectorKey].oldTrigRequestRate = this.DAQmap[masterKey][collectorKey].trigRequestRate;
                this.DAQmap[masterKey][collectorKey].oldDataRate = this.DAQmap[masterKey][collectorKey].dataRate;                
                this.DAQmap[masterKey][collectorKey].trigRequestRate = 0;
                this.DAQmap[masterKey][collectorKey].dataRate = 0;

                //move on to per-digitzer level:
                for(digiKey in this.DAQmap[masterKey][collectorKey]){
                    //bail out if this key isn't a master, collector or digitizer
                    if(this.dataKeys.indexOf(digiKey) != -1) continue;

                    //codename of the detector we're pointing at
                    name = this.DAQmap[masterKey][collectorKey][digiKey].detector; 

                    //get the base per channel data from the JSON store if it exists:
                    if(window.JSONPstore['scalar'] && window.JSONPstore['scalar'][name]){
                        this.DAQmap[masterKey][collectorKey][digiKey].trigRequestRate = window.JSONPstore['scalar'][name]['TRIGREQ'];
                        this.DAQmap[masterKey][collectorKey][digiKey].dataRate = window.JSONPstore['scalar'][name]['dataRate'];
                    }

                    //add the triggers and data rates from each digitizer to the downstream objects they contribute to:
                    //digitizer trigger rate:
                    this.DAQmap[masterKey][collectorKey].trigRequestRate += this.DAQmap[masterKey][collectorKey][digiKey].trigRequestRate;
                    //outbound digitizer link:
                    this.DAQmap[masterKey][collectorKey].dataRate += this.DAQmap[masterKey][collectorKey][digiKey].dataRate;
                    //collector group data rate (the 1 side of GRIFFIN 4-1 cables)
                    this.DAQmap[masterKey][collectorGroupKey].dataRate += this.DAQmap[masterKey][collectorKey][digiKey].dataRate;
                    //collector trigger rate:
                    this.DAQmap[masterKey].trigRequestRate += this.DAQmap[masterKey][collectorKey][digiKey].trigRequestRate;
                    //collector outbound data rate:
                    this.DAQmap[masterKey].dataRate += this.DAQmap[masterKey][collectorKey][digiKey].dataRate;
                    //master group data rate (the 1 side of GRIFFIN 4-1 cables)
                    this.DAQmap[masterGroupKey].dataRate += this.DAQmap[masterKey][collectorKey][digiKey].dataRate;
                    //master triger rate
                    this.DAQmap.trigRequestRate += this.DAQmap[masterKey][collectorKey][digiKey].trigRequestRate;

                    //also add these numbers to the per-subsystem summary statistics:
                    this.detSummary[ name.slice(0,3) ].totalTrigRequestRate += this.DAQmap[masterKey][collectorKey][digiKey].trigRequestRate;
                    this.detSummary[ name.slice(0,3) ].totalDataRate += this.DAQmap[masterKey][collectorKey][digiKey].dataRate;
                }
                //use the totals to pick a color for the digitizer:
                this.DAQmap[masterKey][collectorKey].oldDigiColor = this.DAQmap[masterKey][collectorKey].digiColor;
                this.DAQmap[masterKey][collectorKey].digiColor = this.parseColor(this.DAQmap[masterKey][collectorKey].trigRequestRate, ODB.DAQ.rateMinDetailView, ODB.DAQ.rateMaxDetailView);
                //pick a color for the outbound digitizer to collector link:
                this.DAQmap[masterKey][collectorKey].oldCollectorChannelColor = this.DAQmap[masterKey][collectorKey].collectorChannelColor;
                this.DAQmap[masterKey][collectorKey].collectorChannelColor = this.parseColor(this.DAQmap[masterKey][collectorKey].dataRate, ODB.DAQ.transferMinDetailView, ODB.DAQ.transferMaxDetailView);
            }
            //loop over collector groups and assign their colors
            for(collectorKey in this.DAQmap[masterKey]){
                //bail out if this key isn't a collector group
                if(collectorKey.indexOf('Group') == -1 ) continue;
                //pick a color for the collector group link (GRIFFIN)
                this.DAQmap[masterKey][collectorKey].oldCollectorGroupColor = this.DAQmap[masterKey][collectorKey].collectorGroupColor;
                this.DAQmap[masterKey][collectorKey].collectorGroupColor = this.parseColor(this.DAQmap[masterKey][collectorKey].dataRate, ODB.DAQ.transferMinDetailView, ODB.DAQ.transferMaxDetailView);
            }
            //use the totals to pick a color for the collector:
            this.DAQmap[masterKey].oldCollectorColor = this.DAQmap[masterKey].collectorColor;
            this.DAQmap[masterKey].collectorColor = this.parseColor(this.DAQmap[masterKey].trigRequestRate, ODB.DAQ.rateMinTopView, ODB.DAQ.rateMaxTopView);
            //pick a color for the outbound collector to master link:
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





