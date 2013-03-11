function Waffle(rows, cols, wrapperDiv, rowTitles, InputLayer, ODBkeys, headerDiv, moduleSizes, barChartPrecision, prefix, postfix, AlarmServices){

    	var i, j, n, columns;

        //pointer voodoo:
        var that = this;
        //make a pointer at window level back to this object, so we can pass by reference to the nav button onclick
        window.HVpointer = that;

        //member data:
        this.rows = rows + 1;                       //number of rows in the waffle; +1 for primary row
        this.cols = cols;                           //numver of columns in the waffle
        this.canvasID = 'TestWaffle';               //canvas ID to draw the waffle on
        this.prevAlarmStatus;                       //previous iteration's alarmStatus
        this.alarmStatus;                           //2D array containing the alarm level for each cell
        this.wrapperDiv = wrapperDiv;               //div ID of top level div
        this.rowTitles = rowTitles;                 //array of titles for rows
        this.InputLayer = InputLayer;               //div ID of wrapper for input fields
        this.ODBkeys = ODBkeys;                     //array of strings describing the locations of relevant info in ODB
        this.headerDiv = headerDiv;                 //div ID of waffle header
        this.moduleSizes = moduleSizes;             //array containing sizes of modules in groups of 12 channels
        this.chx = 0;                               //x channel of input sidebar focus
        this.chy = 1;                               //y channel of input sidebar focus
        this.linkWrapperID = 'mainframeLinks';      //ID of div containing nav links
        this.topNavID = 'HVmonitorButton';
        this.sidebarID = 'InputLayer';
        this.monitor = document.getElementById(this.wrapperDiv);
        this.AlarmServices = AlarmServices;         //Alarm serivce object the waffle will fire events at
        this.dataBus = new HVDS(this.rows, this.cols);  //data structure to manage info.
        this.viewStatus = -1;                       //indicates which view is on top: -1=summary, n>-1=bar chart n.

        //make sure the waffle is pointing at a channel that actually has something in it before the initial populate:
        i=0;
        while(this.moduleSizes[i] == 0) i++;
        this.chx = i;

        //deploy the sidebar
        this.deploySidebar = function(){

            //wrapper div
            insertDiv(this.sidebarID, 'Sidebar', this.wrapperDiv);
            document.getElementById(this.sidebarID).setAttribute('align', 'left');

            //title
            insertH2('inputTitle', '', this.sidebarID, 'Sin Titulo');
            document.getElementById('inputTitle').setAttribute('align', 'left');
            document.getElementById('inputTitle').setAttribute('style','margin-left:10%; margin-top:25px; font-family: "Orbitron", sans-serif;');

            //input form
            insertForm('setValues', 'margin-bottom:0px;', this.sidebarID);

            //on/off radios:
            insertInput('offButton', 'margin-left:10%; margin-bottom:10px', 'radio', 'HVswitch', 'off', 'setValues');
            insertParagraph('offSwitch', '', 'display:inline;', 'setValues', 'Off');
            insertInput('onButton', 'margin-left:10px; margin-bottom:10px; display:inline;', 'radio', 'HVswitch', 'on', 'setValues');
            insertParagraph('onSwtich', '', 'display:inline;', 'setValues', 'On');
            //submit updates:
            insertInput('submitParameters', '', 'button', '', 'Commit', 'setValues');
           
            //status report:
            insertParagraph('status', '', 'margin-left:10%;', 'setValues', 'Status:');

            //voltage fill meter
            insertParagraph('voltageMeterTitle', '', 'margin-left:10%; margin-bottom:0px; display:inline; position:relative; top:-18px;', 'setValues', 'Voltage [V]');
            insertCanvas('voltageMeter', '', 'margin-left:2px;', '', '', 'setValues');
            document.getElementById('voltageMeter').setAttribute('align', 'right');
            //current fill meter
            insertParagraph('currentMeterTitle', '', 'margin-left:10%; margin-bottom:0px; display:inline; position:relative; top:-18px;', 'setValues', 'Current [uA]');
            insertCanvas('currentMeter', '', 'margin-left:2px;', '', '', 'setValues');
            document.getElementById('currentMeter').setAttribute('align', 'right');
            //temperature fill meter
            insertParagraph('temperatureMeterTitle', '', 'margin-left:10%; margin-bottom:0px; display:inline; position:relative; top:-18px;', 'setValues', 'Temperature [C]');
            insertCanvas('temperatureMeter', '', 'margin-left:2px;', '', '', 'setValues');
            document.getElementById('temperatureMeter').setAttribute('align', 'right');                        

            //demand voltage
            insertParagraph('FieldText', '', 'margin-left:10%', 'setValues', 'Demand Voltage [V]');
            insertInput('demandVoltage', 'margin-bottom:10px; margin-top: 5px; margin-left:10%; margin-right:5%;', 'text', 'textbox', 'default', 'setValues')
            document.getElementById('demandVoltage').setAttribute('size', '6');
            insertDiv('voltageSlider', 'slider', 'setValues');
            //demand voltage ramp up
            insertParagraph('RampText', '', 'margin:0px; margin-left:10%; margin-top:20px;', 'setValues', 'Voltage Ramp Up Speed [V/s]');
            insertInput('demandRampSpeed', 'margin-bottom:10px; margin-top: 5px; margin-left:10%; margin-right:5%;', 'text', 'textbox', 'default', 'setValues')
            document.getElementById('demandRampSpeed').setAttribute('size', '6');
            insertDiv('rampSlider', 'slider', 'setValues');
            //demand voltage ramp down
            insertParagraph('RampTextDown', '', 'margin:0px; margin-left:10%; margin-top:20px;', 'setValues', 'Demand Ramp Down Speed [V/s]');
            insertInput('demandRampDownSpeed', 'margin-bottom:10px; margin-top: 5px; margin-left:10%; margin-right:5%;', 'text', 'textbox', 'default', 'setValues')
            document.getElementById('demandRampDownSpeed').setAttribute('size', '6');
            insertDiv('rampDownSlider', 'slider', 'setValues');

            //space canvas:
            insertCanvas('inputSpacer', '', 'margin-left:10%; margin-top:5%;', '200px', '5px', this.sidebarID);
            //draw on the canvas:
            var ILcanvas = document.getElementById('inputSpacer');
            var ILcontext = ILcanvas.getContext('2d');
            ILcontext.strokeStyle = 'rgba(255,255,255,0.9)'
            ILcontext.beginPath();
            ILcontext.moveTo(0,0);
            ILcontext.lineTo(200,0);
            ILcontext.stroke();

            //channel changing form:
            insertForm('changeChannel', '', this.sidebarID);
            //title
            insertH4('ccTitle', '', 'changeChannel', 'Change Channel:');
            document.getElementById('ccTitle').setAttribute('style', 'margin-left:10%; margin-bottom:10px;');
            //cards:
            insertParagraph('cardTitle', '', 'display:inline; margin-left:10%; margin-right:1%', 'changeChannel', 'Card');
            insertSelect('CardList', 'width:80px;', 'changeChannel');
            insertLinebreak('changeChannel');
            //channels:
            insertParagraph('channelTitle', '', 'display:inline; margin-left:10%; position:relative; top:-20px; margin-right:1%;', 'changeChannel', 'Channel');
            insertSelect('ChannelList', 'width:75px; position:relative; top:-20px;', 'changeChannel');
            //submit button:
            insertInput('getChannelButton', 'position:relative; top:-30px; width: 50px; height:50px; font-size:24px; margin-left:3%; margin-top:10px; border-color:black', 'button', '', 'Go', 'changeChannel');
            document.getElementById('getChannelButton').setAttribute('class', 'link');
            document.getElementById('getChannelButton').setAttribute('onclick', '{window.refreshInput = 1; gotoNewChannel(event, window.HVpointer);}');
        };

        //deploy a sidebar to interact with this element:
        this.deploySidebar();

        //deploy some sliders in the sidebar
        var sliderWidth = parseFloat($(document.getElementById('InputLayer')).width())*0.5;
        this.voltageSlider = new Slider('SidebarBKG', 'volageSliderText', 'demandVoltage', 'voltageSlider', 'voltageSliderBKG', 'voltageSliderKnob', 'voltageKnobStyle', 'voltageSliderText', window.parameters.minVoltage, window.parameters.maxVoltage, window.parameters.statusPrecision, window.parameters.voltUnit, sliderWidth );
        this.rampSlider = new Slider('SidebarBKG', 'rampSliderText', 'demandRampSpeed', 'rampSlider', 'rampSliderBKG', 'rampSliderKnob', 'rampKnobStyle', 'rampSliderText', window.parameters.minRampSpeed, window.parameters.maxRampSpeed, window.parameters.statusPrecision, window.parameters.rampUnit,  sliderWidth);
        this.rampDownSlider = new Slider('SidebarBKG', 'rampDownSliderText', 'demandRampDownSpeed', 'rampDownSlider', 'rampDownSliderBKG', 'rampDownSliderKnob', 'rampDownKnobStyle', 'rampDownSliderText', window.parameters.minRampSpeed, window.parameters.maxRampSpeed, window.parameters.statusPrecision, window.parameters.rampUnit,  sliderWidth);

        //fill meters
        window.meter = new FillMeter('voltageMeter', 'InputLayer', 0, window.parameters.minVoltage, window.parameters.maxVoltage, window.parameters.voltUnit, window.parameters.statusPrecision);
        window.currentMeter = new FillMeter('currentMeter', 'InputLayer', 0, window.parameters.minCurrent, window.parameters.maxCurrent, window.parameters.currentUnit, window.parameters.statusPrecision);
        window.temperatureMeter = new FillMeter('temperatureMeter', 'InputLayer', 0, window.parameters.minTemperature, window.parameters.maxTemperature, window.parameters.temperatureUnit, window.parameters.statusPrecision);

        //determine dimesions of canvas:
        this.totalWidth = Math.round(0.5*$('#'+this.wrapperDiv).width());
        //cell dimensions controlled by total width, since width more visually important here:
        this.cellSide = (this.totalWidth - 60) / Math.max(20, this.cols);
        this.totalHeight = 16*this.cellSide;

        //DOM insertions///////////////////////////////////////////////////////////////////////
        //navigation
        //top level nav button
        insertButton(this.topNavID, 'navLink', "javascript:swapView('mainframeLinks', 'TestWaffle', 'InputLayer', '"+this.topNavID+"')", 'statusLink', 'HV Monitor');
        //nav wrapper div
        insertDiv(this.linkWrapperID, 'navPanel', wrapperDiv);
        //nav header
        insertH1('mainframeLinksBanner', 'navPanelHeader', this.linkWrapperID, 'GRIFFIN HV Mainframes');
        insertLinebreak(this.linkWrapperID);
        //nav buttons
        insertButton('Main1', 'navLinkDown', "{window.HVpointer.viewStatus=-1; swapFade('Main1', window.HVpointer, 0, 0)}", 'mainframeLinks', 'Mainframe 1');
        insertLinebreak(this.linkWrapperID);

        //deploy slot buttons
        for(i=0; i<this.moduleSizes.length; i++){
            insertButton('card'+i, 'navLink', "{window.HVpointer.viewStatus="+i+"; swapFade('card"+i+"', window.HVpointer, 0, 0);}", this.linkWrapperID, 'Slot '+i);
        }

        //inject canvas into DOM for waffle to paint on:
        insertCanvas(this.canvasID, 'monitor', '', this.totalWidth, this.totalHeight, wrapperDiv);
        this.canvas = document.getElementById(this.canvasID);
        this.context = this.canvas.getContext('2d');
        //finished DOM insertions///////////////////////////////////////////////////////////////

        //set up module labels
        this.moduleLabels = [];
        for(i=0; i<this.moduleSizes.length; i++){
            this.moduleLabels[i] = 'Slot ' + i;
        }

        //adjust height to accommodate card and module labels:
        this.context.font = Math.min(16, this.cellSide)+'px Raleway';
        this.longestModuleLabel = 0;
        for(i = 0; i<this.moduleLabels.length; i++){
            this.longestModuleLabel = Math.max(this.longestModuleLabel, this.context.measureText(this.moduleLabels[i]).width);
        }
        this.totalHeight += this.longestModuleLabel + 50;
        this.canvas.setAttribute('height', this.totalHeight);

        //waffle dimensions; leave gutters for labels & title
        this.waffleWidth = this.cellSide*this.cols;
        this.waffleHeight = this.totalHeight;
        //want waffle and navbar centered nicely:
        this.leftEdge = (this.totalWidth - (this.waffleWidth + 1.5*this.context.measureText('Prim').width))/2;
        //push navbar over to match:
        document.getElementById(this.linkWrapperID).setAttribute('style', 'left:'+(24 + 100*this.leftEdge/$('#'+this.wrapperDiv).width() )+'%;')

        //make a tooltip for this object:
        this.tooltip = new Tooltip(this.canvasID, 'MFTipText', 'MFtipCanv', 'MFTT', this.wrapperDiv, prefix, postfix);
        //give the tooltip a pointer back to this object:
        this.tooltip.obj = that;

        //establish animation parameters:
        this.FPS = 30;
        this.duration = 0.5;
        this.nFrames = this.FPS*this.duration;

        //style card nav buttons
        var newRule;
        for(i=0; i<this.moduleLabels.length; i++){
            var buttonWidth;
            buttonWidth = Math.max(moduleSizes[i],1)*0.9*this.cellSide + (Math.max(moduleSizes[i],1)-1)*0.1*this.cellSide;
            //FF freaks out if you try and overwrite a styleSheet :(
            //newRule = "button#card"+i+"{width:"+buttonWidth+"px; height:"+0.9*this.cellSide+"px; margin-right:"+0.05*this.cellSide+"px; margin-left:"+0.05*this.cellSide+"px; margin-top:"+0.05*this.cellSide+"px; float:left; background: -webkit-gradient(linear, left top, left bottom, from(#DDDDDD), to(#FFFFFF)); background: -moz-linear-gradient(top,  #DDDDDD,  #FFFFFF); -webkit-border-radius: 5; -moz-border-radius: 5; border-radius: 5; font-size:"+this.cellSide/4+"px; padding:0px}";
            //document.styleSheets[0].insertRule(newRule,0);
            if(moduleSizes[i] != 0)
                newRule = "width:"+buttonWidth+"px; height:"+0.9*this.cellSide+"px; margin-right:"+0.05*this.cellSide+"px; margin-left:"+0.05*this.cellSide+"px; margin-top:"+0.05*this.cellSide+"px; float:left; -webkit-border-radius: 5;  -moz-border-radius: 5; border-radius: 5; display: inline; font-family: 'Raleway', sans-serif; font-size:"+buttonWidth/8+"px; padding:0px;";
            else{ 
                newRule = "width:"+buttonWidth+"px; height:"+0.9*this.cellSide+"px; margin-right:"+0.05*this.cellSide+"px; margin-left:"+0.05*this.cellSide+"px; margin-top:"+0.05*this.cellSide+"px; float:left; -webkit-border-radius: 5;  -moz-border-radius: 5; border-radius: 5; display: inline; font-family: 'Raleway', sans-serif; font-size:"+this.cellSide/2+"px; padding:0px; color:#CC0000;";
                document.getElementById('card'+i).setAttribute('onclick', '');
                document.getElementById('card'+i).innerHTML = 'X'
            }
            document.getElementById('card'+i).setAttribute('style', newRule);
        }

        //header size:
        this.headerHeight = $('#'+this.headerDiv).height();
        //make the vertical spacing between the waffle and nav header nice:
        $('#'+this.canvasID).css('top', (this.headerHeight)+'px !important;' );

        //declare bar charts & canvases to paint them on:
        this.barCharts = [];
        var newCanvas;
        for(i=0; i<moduleSizes.length; i++){
            insertCanvas('bar'+i, 'monitor', '', this.totalWidth, this.totalHeight, wrapperDiv);
            this.barCharts[i] = new BarGraph('bar'+i, i, Math.max(moduleSizes[i],1)*12, 'Slot '+i, 'Reported Voltage [V]', 0, this.AlarmServices.scaleMaxima[0], barChartPrecision, that);
        }

        //set up arrays:
        this.startColor = [];
        this.endColor = [];
        for(i=0; i<this.rows; i++){
    	    this.startColor[i] = [];
        	this.endColor[i] = [];
        }

        //declare alarmStatus and prevAlarmStatus as arrays of appropriate dimension:
        this.alarmStatus = [];
        this.prevAlarmStatus = [];
        for(i=0; i<this.rows; i++){
            this.alarmStatus[i] = [];
            this.prevAlarmStatus[i] = [];
            //primary row spans multi-columns:
            if(i==0) columns = this.moduleSizes.length;
            else columns = this.cols;
            for(j=0; j<columns; j++){
                this.alarmStatus[i][j] = [];
                this.prevAlarmStatus[i][j] = [];
                for(var n=0; n<3; n++){
                    this.alarmStatus[i][j][n] = 0;
                    this.prevAlarmStatus[i][j][n] = 0;
                }
            }
        }

        //array of values from the waffle to report in the tooltip
        this.reportedValues = [this.dataBus.demandVoltage, this.dataBus.reportVoltage, this.dataBus.reportCurrent, this.dataBus.demandVrampUp, this.dataBus.demandVrampDown, this.dataBus.reportTemperature, this.dataBus.rampStatus];

        //make waffles clickable to set a variable for a channel:
        this.canvas.onclick = function(event){clickWaffle(event, that)};
        
        //decide which canvas to present:
        this.view = function(){
            if(this.viewStatus == -1)
                return this.canvasID;
            else return 'bar'+this.viewStatus;
        };

        //determine per cell color info for start and finish.
        //Color info is packed as four numbers: red, green, blue, alpha
        this.cellColorUpdate = function(){
            var R, G, B, A, color, primary;
            for(var i=0; i<this.rows; i++){
                //primary row spans multi-columns:
                if(i==0) columns = this.moduleSizes.length;
                else columns = this.cols;
            	for(var j=0; j<columns; j++){
                    if(i > 0)
                        primary = primaryBin(this.moduleSizes,j);
                    else primary = j;

    	         	//start values:
                    //show green on all clear:
    	            if( this.prevAlarmStatus[i][j][0] == 0 && this.prevAlarmStatus[i][j][1] == 0 && this.prevAlarmStatus[i][j][2] == 0){
                        R = 0;
                        G = 255;
                        B = 0;
                        A = 0.3;
                    //else show grey if the channel is off:
                    } else if(this.prevAlarmStatus[i][j][0] == -1){
                        R = 0;
                        G = 0;
                        B = 0;
                        A = 0.3;
                    //else show yellow if channel is ramping & no temperature or current alarms:
                    } else if(this.prevAlarmStatus[i][j][0] == -2 && this.prevAlarmStatus[i][j][1] == 0 && this.prevAlarmStatus[i][j][2] == 0){
                        R = 255;
                        G = 255;
                        B = 0;
                        A = 0.3;
                    //else show red for alarm:
                    } else {
                        R = 255;
                        G = 0;
                        B = 0;
                        A = Math.max(this.prevAlarmStatus[i][j][0], this.prevAlarmStatus[i][j][1], this.prevAlarmStatus[i][j][2])*0.7 + 0.3;  //enforce minimum 0.3 to make it clearly red
                        if(A>1) {A = 1;}
    	            }
                    //12-channel cards don't have primary channels, show black (also empty slots):
                    if( (i==0 && this.moduleSizes[j] == 1) || this.moduleSizes[primary] == 0 ){
                        R = 0;
                        G = 0;
                        B = 0;
                        A = 0.9;
                    }
                    this.startColor[i][j] = [R,G,B,A];

                    //end values:
                    if(this.alarmStatus[i][j][0] == 0 && this.alarmStatus[i][j][1] == 0 && this.alarmStatus[i][j][2] == 0){
                        R = 0;
                        G = 255;
                        B = 0;
                        A = 0.3;
                    } else if(this.alarmStatus[i][j][0] == -1){
                        R = 0;
                        G = 0;
                        B = 0;
                        A = 0.3;
                    } else if(this.alarmStatus[i][j][0] == -2 && this.alarmStatus[i][j][1] == 0 && this.alarmStatus[i][j][2] == 0){
                        R = 255; 
                        G = 255;
                        B = 0;
                        A =0.3;
                    } else {
                        R = 255;
                        G = 0;
                        B = 0;
                        A = Math.max(this.alarmStatus[i][j][0], this.alarmStatus[i][j][1], this.alarmStatus[i][j][2])*0.7 + 0.3;  //enforce minimum 0.3 to make it clearly red
                        if(A>1) {A = 1;}
                    }
                    if( (i==0 && this.moduleSizes[j] == 1) || this.moduleSizes[primary] == 0 ){
                        R = 0;
                        G = 0;
                        B = 0;
                        A = 0.9;
                    }
                    this.endColor[i][j] = [R,G,B,A];
    	       }
            }
        };

        this.draw = function(frame){

            var i, j;
            var R, G, B, A;
            var color;
            var columns;
            var cornerX, cornerY;

            //whiteout old canvas:
            this.context.globalAlpha = 1;
            this.context.clearRect(this.leftEdge,0,this.totalWidth,this.totalHeight);
            this.context.fillStyle = "rgba(255,255,255,1)"
            this.context.fillRect(this.leftEdge,0,this.cellSide*this.cols,this.cellSide*this.rows);

            for(i=0; i<this.rows; i++){
                //primary row spans multi-columns:
                if(i==0) columns = this.moduleSizes.length;
                else columns = this.cols;
                for(var j=0; j<columns; j++){
                    R = this.startColor[i][j][0] + (this.endColor[i][j][0] - this.startColor[i][j][0])*frame/this.nFrames;
                    G = this.startColor[i][j][1] + (this.endColor[i][j][1] - this.startColor[i][j][1])*frame/this.nFrames;
                    B = this.startColor[i][j][2] + (this.endColor[i][j][2] - this.startColor[i][j][2])*frame/this.nFrames;
                    A = this.startColor[i][j][3] + (this.endColor[i][j][3] - this.startColor[i][j][3])*frame/this.nFrames;
                    color = "rgba("+R+","+G+","+B+","+A+")";
            
                    this.context.fillStyle = color;
                    cornerY = i*this.cellSide;
                    //primary row has different size bins than the rest:
                    if(i != 0){
                        cornerX = this.leftEdge + j*this.cellSide;
                        this.context.fillRect(cornerX, cornerY,this.cellSide,this.cellSide);
                    }
                    else{
                        cornerX = 0;
                        for(var sum=0; sum<j; sum++){
                            cornerX = cornerX + Math.max(this.moduleSizes[sum],1);
                        }
                        cornerX = this.leftEdge + cornerX*this.cellSide;
                        this.context.fillRect(cornerX, cornerY,this.cellSide*Math.max(this.moduleSizes[j],1),this.cellSide);
                    }
                }
            }

            this.drawWaffleDecorations();
            this.drawWaffleLabels();
        };

        this.drawWaffleDecorations = function(){

            var i, j;

            var modDivCopy = [0];
            for(i=0; i < this.moduleSizes.length; i++){
                modDivCopy[i+1] = modDivCopy[i] + Math.max(this.moduleSizes[i],1);
            }
            modDivCopy.shift();

            //style lines:
            this.context.fillStyle = 'rgba(0,0,0,1)';
            this.context.lineWidth = 1;

            //draw border:
            this.context.strokeRect(this.leftEdge,0,this.cellSide*this.cols, this.cellSide*this.rows);

            //draw inner lines:
            for(i=1; i<this.rows; i++){
                this.context.beginPath();
                if(i==1) this.context.lineWidth = 3;
                else this.context.lineWidth = 1;
                this.context.moveTo(this.leftEdge,i*this.cellSide);
                this.context.lineTo(this.leftEdge + this.cellSide*this.cols,i*this.cellSide);
                this.context.stroke();       
            }
            for(j=1; j<this.cols; j++){
                this.context.beginPath();
                if(j==modDivCopy[0]){
                    this.context.lineWidth = 3;
                    modDivCopy.shift();
                }
                else this.context.lineWidth = 1;
                if(this.context.lineWidth == 1){
                    this.context.moveTo(this.leftEdge + j*this.cellSide,this.cellSide);
                    this.context.lineTo(this.leftEdge + j*this.cellSide,this.cellSide*this.rows);
                } else {
                    this.context.moveTo(this.leftEdge + j*this.cellSide,0);
                    //this.context.lineTo(j*this.cellSide,this.cellSide*this.rows + this.longestColTitle + this.longestModuleLabel + 25);
                    this.context.lineTo(this.leftEdge + j*this.cellSide,this.cellSide*this.rows);
                }
                this.context.stroke();
            }
        };

        this.drawWaffleLabels = function(){
            var i, j;
            var moduleWidth, modRotation, modAlign, modHeight;
            
            this.context.fillStyle = 'white'; //'black'
            this.context.globalAlpha = 0.3;    //0.6

            //channel labels:
            var labelFontSize = Math.min(16, this.cellSide);
            this.context.font=labelFontSize+"px Raleway";
            this.context.fillText('Prim', this.leftEdge + this.cellSide*this.cols+10, this.cellSide/2 +8 );
            for(i=1; i<this.rows; i++){
                this.context.fillText(i-1, this.leftEdge + this.cellSide*this.cols+10, i*this.cellSide + this.cellSide/2 +8 );
            }

            //module labels:
            var moduleDivisions = [0];
            var vertOffset;
            for(i=0; i < this.moduleSizes.length; i++){
                moduleDivisions[i+1] = moduleDivisions[i] + Math.max(this.moduleSizes[i],1);
            }
            for(j=1; j<moduleDivisions.length; j++){
                var moduleWidth = moduleDivisions[j] - moduleDivisions[j-1];

                if(moduleWidth*this.cellSide < 1.2*this.context.measureText(this.moduleLabels[j-1]).width){
                    modRotation = -Math.PI/2;  //2.4
                    modAlign = 'right';
                    modHeight = 0;
                    vertOffset = 15;
                } else {
                    modRotation = 0;
                    modAlign = 'center';
                    modHeight = labelFontSize;
                    vertOffset = 25;
                }
                this.context.save();
                this.context.translate(this.leftEdge + (moduleWidth/2 + moduleDivisions[j-1])*this.cellSide, this.rows*this.cellSide+vertOffset);
                this.context.rotate(modRotation);
                this.context.textAlign = modAlign;
                this.context.fillText(this.moduleLabels[j-1], 0,labelFontSize/2);
                this.context.restore();
            }
        };        

        //wrapper for transition from old state to new state via this.animate:
        this.update = function(){
            var i,j,columns;

            this.fetchNewData();
 
            //update alarms & colors to prepare for animation transition:
            for(i=0; i<this.rows; i++){
                //primary row spans multi-columns:
                if(i==0) columns = this.moduleSizes.length;
                else columns = this.cols;
                for(j=0; j<columns; j++){

                    this.prevAlarmStatus[i][j][0] = this.alarmStatus[i][j][0];
                    this.prevAlarmStatus[i][j][1] = this.alarmStatus[i][j][1];
                    this.prevAlarmStatus[i][j][2] = this.alarmStatus[i][j][2];
                    this.alarmStatus[i][j][0] = this.dataBus.alarmStatus[i][j][0];
                    this.alarmStatus[i][j][1] = this.dataBus.alarmStatus[i][j][1];
                    this.alarmStatus[i][j][2] = this.dataBus.alarmStatus[i][j][2];
                    this.cellColorUpdate();
                }
            }

            //update peripherals:
            for(i=0; i<this.barCharts.length; i++){
                for(j=0; j<this.barCharts[i].nBars; j++){
                    var arrayCoords = getPointer(i, j, that);
                    this.barCharts[i].dataBus.barChartData[j] = this.dataBus.reportVoltage[arrayCoords[0]][arrayCoords[1]];
                    this.barCharts[i].dataBus.barChartAlarms[j] = this.dataBus.alarmStatus[arrayCoords[0]][arrayCoords[1]];
                }
                this.barCharts[i].update(this.barCharts[i].dataBus.barChartData, this.barCharts[i].dataBus.barChartAlarms);
            }

            channelSelect(that);
            this.tooltip.update();

        };

        //determine which cell pixel x,y falls in, with this.leftEdge,0 being the top left corner of the canvas; return -1 if no corresponding cell.
        this.findCell = function(x, y){
            var cell, slot;

            var chx = Math.floor((x-this.leftEdge) / this.cellSide);
            var chy = Math.floor(y / this.cellSide);
            slot = primaryBin(this.moduleSizes, chx)

            if(chx < this.cols && chx > -1 && chy < this.rows && chy > -1){
                cell = [];
                if(chy == 0){
                    chx = slot;
                }
                cell[0] = chy;
                cell[1] = chx;
                if( (chy == 0 && this.moduleSizes[chx] == 1) || this.moduleSizes[slot] == 0 ) cell = -1;
            } else 
                cell = -1;

            return cell   
        };

        //establish the tooltip text for the cell returned by this.findCell; return length of longest line:
        this.defineText = function(cell){
            var toolTipContent = '<br>';
            var nextLine;
            var longestLine = 0;
            var cardIndex;
            var i;

            var row = cell[0];
            var col = cell[1];

            //decide which card we're pointing at:
            if(row == 0) cardIndex = col;
            else cardIndex = primaryBin(this.moduleSizes, col);

            //Title for normal channels:
            if(row != 0) nextLine = this.moduleLabels[cardIndex]+', '+this.rowTitles[0]+' '+channelMap(col, row, this.moduleSizes, this.rows)+'<br>';
            //Title for primary channels:
            else nextLine = this.moduleLabels[cardIndex]+' Primary <br>';

            //keep track of the longest line of text:
            longestLine = Math.max(longestLine, this.tooltip.context.measureText(nextLine).width)
            toolTipContent += nextLine;

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
                longestLine = Math.max(longestLine, this.tooltip.BKGcontext.measureText(nextLine).width);

                //append to tooltip:
                toolTipContent += nextLine;
 
            }
            document.getElementById(this.tooltip.ttTextID).innerHTML = toolTipContent;

            //return length of longest line:
            return longestLine;
        };

        //get new data:
        this.fetchNewData = function(){
            var testParameter, i, j, ODBindex, columns, slot;
            /*
            //batch fetch all in one big lump:
            var variablesRecord = ODBGetRecord(ODBkeys[0]);
            var settingsRecord  = ODBGetRecord(ODBkeys[1]);
    
            var reqVoltage      = ODBExtractRecord(variablesRecord, ODBkeys[2]);
            var measVoltage     = ODBExtractRecord(variablesRecord, ODBkeys[3]);
            var measCurrent     = ODBExtractRecord(variablesRecord, ODBkeys[4]);
            var rampUp          = ODBExtractRecord(settingsRecord,  ODBkeys[5]);
            var rampDown        = ODBExtractRecord(settingsRecord,  ODBkeys[6]);
            var measTemperature = ODBExtractRecord(variablesRecord, ODBkeys[7]);
            var repoChState     = ODBExtractRecord(settingsRecord,  ODBkeys[8]);
            var repoChStatus    = ODBExtractRecord(variablesRecord, ODBkeys[9]);
            var voltageLimit    = ODBExtractRecord(settingsRecord,  ODBkeys[10]);
            var currentLimit    = ODBExtractRecord(settingsRecord,  ODBkeys[11]);
            */          
            for(i=0; i<this.rows; i++){
                //primary row spans multi-columns, only has entries for 48 channel cards:        
                if(i==0) columns = this.moduleSizes.length;
                else columns = this.cols;

                for(j=0; j<columns; j++){
                    if (i>0) slot = primaryBin(this.moduleSizes, j);
                    else slot = j;
                    //don't populate the primary of a 12 channel card, or any channel corresponding to an empty slot:
                    if( (i!=0 || this.moduleSizes[j]==4) && this.moduleSizes[slot]!=0 ){
                    /*
                        ODBindex = getMIDASindex(i, j);
                        demandVoltage[i][j]     = parseFloat(reqVoltage[ODBindex]);
                        reportVoltage[i][j]     = parseFloat(measVoltage[ODBindex]);   
                        reportCurrent[i][j]     = parseFloat(measCurrent[ODBindex]);
                        demandVrampUp[i][j]     = parseFloat(rampUp[ODBindex]);
                        demandVrampDown[i][j]   = parseFloat(rampDown[ODBindex]);
                        reportTemperature[i][j] = parseFloat(measTemperature[ODBindex]);
                        channelMask[i][j]       = parseFloat(repoChState[ODBindex]);
                        rampStatus[i][j]        = parseFloat(repoChStatus[ODBindex]);
                        voltLimit[i][j]         = parseFloat(voltageLimit[ODBindex]);
                        curLimit[i][j]          = parseFloat(currentLimit[ODBindex]);
                        //48ch cards report the currents in mA, convert to uA:
                        if(i==0){
                            reportCurrent[i][j] = reportCurrent[i][j]*1000;
                            curLimit[i][j] = curLimit[i][j]*1000;
                        }

                    */
                    //fake data for offline demo
                        this.dataBus.demandVoltage[i][j] = Math.random();
                        this.dataBus.reportVoltage[i][j] = Math.random();
                        this.dataBus.reportCurrent[i][j] = Math.random();
                        this.dataBus.demandVrampUp[i][j] = Math.random();
                        this.dataBus.demandVrampDown[i][j] = Math.random();
                        this.dataBus.reportTemperature[i][j] = Math.random();
                        this.dataBus.channelMask[i][j] = Math.random();
                        if (this.dataBus.channelMask[i][j] < 0.1) this.dataBus.channelMask[i][j] = 0;
                        else this.dataBus.channelMask[i][j] = 1;
                        this.dataBus.rampStatus[i][j] = Math.floor(10*Math.random());
                        this.dataBus.voltLimit[i][j] = 1+Math.random();
                        this.dataBus.currentLimit[i][j] = 1+Math.random();
                    } else if (i!=0 || this.moduleSizes[j]==4){  //keep the array filled, even for empty slots to avoid unpredictable behavior
                        this.dataBus.demandVoltage[i][j] = 0;
                        this.dataBus.reportVoltage[i][j] = 0;
                        this.dataBus.reportCurrent[i][j] = 0;
                        this.dataBus.demandVrampUp[i][j] = 0;
                        this.dataBus.demandVrampDown[i][j] = 0;
                        this.dataBus.reportTemperature[i][j] = 0;
                        this.dataBus.channelMask[i][j] = 0;
                        this.dataBus.rampStatus[i][j] = 0;
                        this.dataBus.voltLimit[i][j] = 0;
                        this.dataBus.currentLimit[i][j] = 0;
                    }

                    //give the necessary information to the AlarmService, so it can report the state of any channel that trips an alarm below:
                    if(j==0){
                        this.AlarmServices.demandVoltage[i] = [];
                        this.AlarmServices.reportVoltage[i] = [];
                        this.AlarmServices.reportCurrent[i] = [];
                        this.AlarmServices.reportTemperature[i] = [];
                    }
                    this.AlarmServices.demandVoltage[i][j] = this.dataBus.demandVoltage[i][j];
                    this.AlarmServices.reportVoltage[i][j] = this.dataBus.reportVoltage[i][j];
                    this.AlarmServices.reportCurrent[i][j] = this.dataBus.reportCurrent[i][j];
                    this.AlarmServices.reportTemperature[i][j] = this.dataBus.reportTemperature[i][j];
                }
            }

            //see if any of the new data raises any alarms:
            this.raiseAlarm();
        };

        //push problems out to the alarm service
        this.raiseAlarm = function(){
            //determine alarm status
            for(i=0; i<this.rows; i++){
                //primary row spans multi-columns:
                if(i==0) columns = this.moduleSizes.length;
                else columns = this.cols;
                for(j=0; j<columns; j++){
                    //construct the parameter to be tested against the voltage alarm:
                    testParameter = Math.abs(this.dataBus.demandVoltage[i][j] - this.dataBus.reportVoltage[i][j]); 

                    //determine alarm status for each cell, recorded as [i][j][voltage alarm, current alarm, temperature alarm]
                    //alarmStatus == 0 indicates all clear, 0 < alarmStatus <= 1 indicates alarm intensity, alarmStatus = -1 indicates channel off,
                    //and alarmStatus == -2 for the voltage alarm indicates voltage ramping.
                    if(testParameter < AlarmServices.alarmThresholds[0])  this.dataBus.alarmStatus[i][j][0] = 0;
                    else  this.dataBus.alarmStatus[i][j][0] = Math.min( (testParameter - AlarmServices.alarmThresholds[0]) / AlarmServices.scaleMaxima[0], 1);
                    if(this.dataBus.rampStatus[i][j] == 3 || this.dataBus.rampStatus[i][j] == 5){
                        this.dataBus.alarmStatus[i][j][0] = -2;
                    }

                    if(this.dataBus.reportCurrent[i][j] < AlarmServices.alarmThresholds[1])  this.dataBus.alarmStatus[i][j][1] = 0;
                    else  this.dataBus.alarmStatus[i][j][1] = Math.min( (this.dataBus.reportCurrent[i][j] - AlarmServices.alarmThresholds[1]) / AlarmServices.scaleMaxima[1], 1);

                    if(this.dataBus.reportTemperature[i][j] < AlarmServices.alarmThresholds[2])  this.dataBus.alarmStatus[i][j][2] = 0;
                    else  this.dataBus.alarmStatus[i][j][2] = Math.min( (this.dataBus.reportTemperature[i][j] - AlarmServices.alarmThresholds[2]) / AlarmServices.scaleMaxima[2], 1);

                    if(this.dataBus.channelMask[i][j] == 0){
                        this.dataBus.alarmStatus[i][j][0] = -1;
                        this.dataBus.alarmStatus[i][j][1] = -1;
                        this.dataBus.alarmStatus[i][j][2] = -1;
                    }

                    //fire an event at the AlarmServices object for every alarm:
                    //voltage alarms:
            
                    if(this.dataBus.alarmStatus[i][j][0] > 0){
                        var voltageAlarm = new  CustomEvent("alarmTrip", {
                                                    detail: {
                                                        alarmType: 'voltage',
                                                        alarmStatus: [i,j,this.dataBus.alarmStatus[i][j][0]]        
                                                    }
                                                });
                        AlarmServices.div.dispatchEvent(voltageAlarm);
                    }
                    //current alarms:
                    if(this.dataBus.alarmStatus[i][j][1] > 0){
                        var currentAlarm = new  CustomEvent("alarmTrip", {
                                                    detail: {
                                                        alarmType: 'current',
                                                        alarmStatus: [i,j,this.dataBus.alarmStatus[i][j][1]]        
                                                    }
                                                });
                        AlarmServices.div.dispatchEvent(currentAlarm);
                    }
                    //temperature alarms:
                    if(this.dataBus.alarmStatus[i][j][2] > 0){
                        var temperatureAlarm = new  CustomEvent("alarmTrip", {
                                                        detail: {
                                                            alarmType: 'temperature',
                                                            alarmStatus: [i,j,this.dataBus.alarmStatus[i][j][2]]        
                                                        }
                                                    });
                        AlarmServices.div.dispatchEvent(temperatureAlarm);
                    }
                }
            }

            //let the alarm services know the update is complete:
            var allDone = new   CustomEvent("refreshComplete", {
                                });
            AlarmServices.div.dispatchEvent(allDone);
        };

        //do an initial populate of the waffle:
        this.fetchNewData();
        //also, draw the input sidebar for 0,0 on first call:
        channelSelect(that);
}





//some useful globals

//define the onclick behavior of the waffle:
function clickWaffle(event, obj){

            window.refreshInput = 1;

            var superDiv = document.getElementById(obj.wrapperDiv);
            var inputDiv = document.getElementById(obj.InputLayer);

            //form coordinate system chx, chy with origin at the upper left corner of the div, and 
            //bin as the waffle binning: 
            var chx = Math.floor( (event.pageX - obj.leftEdge - superDiv.offsetLeft - obj.canvas.offsetLeft) / obj.cellSide);
            var chy = Math.floor( (event.pageY - superDiv.offsetTop - obj.canvas.offsetTop) / obj.cellSide);

            //are we on the primary of a card that doesn't have a primary, or an empty slot??
            var suppressClick = 0;
            var cardIndex = primaryBin(obj.moduleSizes, chx);
            if( (chy==0 && obj.moduleSizes[cardIndex] == 1) || obj.moduleSizes[cardIndex] == 0 ) suppressClick = 1;

            if(chx<obj.cols && chx>=0 && chy<obj.rows && chy>=0 && window.onDisplay == obj.canvasID && suppressClick==0){
                obj.chx = chx;
                obj.chy = chy;
                channelSelect(obj);
            }

}

//map the active grid cooridnates onto MIDAS's channel numbering:
function getMIDASindex(row, col){
    
    var MIDASindex = 0;
    var moduleNumber, i;

    if(row != 0){
        //count up regular channels
        MIDASindex += (window.rows-1 +1)*col + row-1;
        //add on primary channels
        moduleNumber = primaryBin(window.moduleSizes, col);
        for(i=0; i<moduleNumber+1; i++){
            if(window.moduleSizes[i] == 4) MIDASindex++;
        }
    } else{
        moduleNumber = col;
        //add up all the channels from previous cards; recall empty slots occupy a 12-channel card in the arrays:
        for(i=0; i<moduleNumber; i++){
            if( (window.moduleSizes[i] == 1) || (window.moduleSizes[i] == 0) ) MIDASindex += 12;
            if(window.moduleSizes[i] == 4) MIDASindex += 49;
        }
        //MIDASindex++;
    }

    return MIDASindex;
}

//given a module number and channel number, return the [row, col] that the corresponding data will be found in in the various waffle.<dataArrays>
function getPointer(module, channel, waffle){
    var i;
    var row = 0;
    var col = 0;

    //column:
    for(i=0; i<module; i++){
        col += Math.max(waffle.moduleSizes[i],1);
    }
    col += Math.floor(channel/(waffle.rows-1));

    row = 1 + channel%(waffle.rows-1);

    return [row, col];
}

//map the channel-sized bins in the primary row into the appropriate primary groups:
function primaryBin(moduleSizes, chx){
    var primary = 0;
    var i = 0;
    while(chx>=0){
        chx = chx - Math.max(moduleSizes[i],1);
        i++;
    }
    return i-1;
}

//map the bin coordinates chx and chy onto a channel number:
function channelMap(chx, chy, moduleSizes, rows){
    var primary = primaryBin(moduleSizes, chx);
    if (moduleSizes[primary] == 1) return chy - 1;
    else{
        var channelNo = (rows-1)*chx + chy-1;
        for(var i=0; i<primary; i++){
            channelNo -= (rows-1)*Math.max(moduleSizes[i],1);
        }
        return channelNo;
    }
}

//set up channel navigation dropdowns and modify on the fly:
function configureDropdowns(ChannelListDD, CardListDD, moduleLabels, moduleSizes){

    var i;
    var option = [];

    //establish card list
    var colDD = document.getElementById(CardListDD);
    for(i=0; i<moduleLabels.length; i++){
        if(moduleSizes[i] != 0){
            option[i] = document.createElement('option');
            option[i].text = moduleLabels[i];
            colDD.add(option[i], null);
        }
    }

    //establish channel list
    var rowDD = document.getElementById(ChannelListDD);
    for(i=0; i<12; i++){
        option[i] = document.createElement('option');
        option[i].text = i;
        rowDD.add(option[i], null);
    }

}

//reconfigure channel drop down to respond to changes in module:
function reconfigureChannelList(moduleLabels, moduleSizes, ChannelListDD){

    var i, index, nChan;

    //fetch whatever's in the card dropdown:
    var cardName = getInput('changeChannel', 0);

    //...and channel dropdown:
    var channelNumber = getInput('changeChannel', 1);

    //translate cardName into an index:
    for(i=0; i<moduleLabels.length; i++){
        if(cardName == moduleLabels[i]) index = i;
    }

    //decide how many channels should be in the channel dropdown:
    if(moduleSizes[index] == 4) nChan = 48;
    else nChan = 12;

    //establish channel list
    var option = [];
    var rowDD = document.getElementById(ChannelListDD);
    for(i=0; i<49; i++){
        rowDD.remove(0);
    }
    var startIndex = 0;
    if(nChan == 48){
        option[0] = document.createElement('option');
        option[0].text = 'Primary';
        rowDD.add(option[0], null);
        startIndex++;
    }
    for(i=startIndex; i<nChan+startIndex; i++){
        option[i] = document.createElement('option');
        option[i].text = i-startIndex;
        rowDD.add(option[i], null);
    }

    //keep the channel number in the same place if possible:
    if(channelNumber == 'Primary' && nChan==12) setInput('changeChannel',1,0); 
    else if(channelNumber >= nChan) setInput('changeChannel',1,0);
    else setInput('changeChannel',1,channelNumber);

}
