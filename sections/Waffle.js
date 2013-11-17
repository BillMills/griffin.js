function Waffle(InputLayer, headerDiv, AlarmServices){

    	var i, j, k, n, columns;

        //pointer voodoo:
        var that = this;
        //make a pointer at window level back to this object, so we can pass by reference to the nav button onclick
        window.HVpointer = that;

        window.HVview = 0; //index of which crate is currently on display in the HV view.
        this.nCrates = window.parameters.moduleSizes.length;

        //columns for HV monitor:
        this.cols = [];
        for(i=0; i<this.nCrates; i++){
          window.parameters.columns[i] = 0;
          for(j=0; j<window.parameters.moduleSizes[i].length; j++){
            window.parameters.columns[i] += window.parameters.moduleSizes[i][j];
            if (window.parameters.moduleSizes[i][j] == 0) window.parameters.columns[i]++;
          }
          this.cols[i] = window.parameters.columns[i];
        }

        //member data:
        this.rows = window.parameters.rows + 1;     //number of rows in the waffle; +1 for primary row
        this.canvasID = [];                         //canvas ID to draw the waffles on
        this.prevAlarmStatus = [];                       //previous iteration's alarmStatus
        this.alarmStatus = [];                           //3D array containing the alarm level for each cell [mainframe][row][column] = alarm level
        this.wrapperDiv = window.parameters.wrapper;//div ID of top level div
        this.InputLayer = InputLayer;               //div ID of wrapper for input fields  TODO: resundant with sidebarID
        //this.headerDiv = headerDiv;                 //div ID of waffle header  TODO: depricated?
        this.chx = 0;                               //x channel of input sidebar focus
        this.chy = 1;                               //y channel of input sidebar focus
        this.linkWrapperID = 'mainframeLinks';      //ID of div containing nav links
        this.topNavID = 'HVmonitorButton';
        this.sidebarID = 'InputLayer';
        this.monitor = document.getElementById(this.wrapperDiv);
        this.AlarmServices = AlarmServices;         //Alarm serivce object the waffle will fire events at
        this.dataBus = [];
        for(i=0; i<this.nCrates; i++){
            this.dataBus[i] = new HVDS(this.rows, this.cols[i]);  //data structure to manage info.
        }
        this.viewStatus = -1;                       //indicates which view is on top: -1=summary, n>-1=bar chart n.  TODO: redundant with window.HVview?
        this.canvas = [];
        this.context = [];
        //index address of where the input panel is pointing:
        this.dialogX;
        this.dialogY;
        //prefix / postfix text to use in HV tooltip:
        this.prefix = ["Demand Voltage: ", "Reported Voltage: ", "Reported Current: ", "Voltage Ramp Up Speed: ", "Voltage Ramp Down Speed", "Temperature: ", "Status: "],
        this.postfix = ["V", "V", "uA", "V/s", "V/s", "C", ""],
        //fill meter limits:
        this.currentMin = 0;
        this.currentMax = 1;
        this.temperatureMin = 0;    


        //make sure the waffle is pointing at a channel that actually has something in it before the initial populate:
        i=0;
        while(window.parameters.moduleSizes[window.HVview][i] == 0) i++;
        this.chx = i;

        //generate the canvas IDs:
        for (i=0; i<this.nCrates; i++){
            this.canvasID[i] = 'HVgrid'+i;
        }

        //deploy the sidebar
        this.deploySidebar = function(){

            //wrapper div
            injectDOM('div', this.sidebarID, this.wrapperDiv, {'class':'RightSidebar'});
            document.getElementById(this.sidebarID).setAttribute('align', 'left');

            //title
            injectDOM('h2', 'inputTitle', this.sidebarID, {'style':'margin-left:10%; margin-top:25px; font-family: "Orbitron", sans-serif;', 'innerHTML':'Sin Titulo'});
            document.getElementById('inputTitle').setAttribute('align', 'left');

            //input form
            injectDOM('form', 'setValues', this.sidebarID, {'style':'margin-bottom:0px;'});

            //on/off radios:
            injectDOM('input', 'offButton', 'setValues', {
                'style' : 'margin-left:10%; margin-bottom:10px',
                'name' : 'HVswitch',
                'type' : 'radio',
                'value' : 'off'
            });
            injectDOM('p', 'offSwitch', 'setValues', {'style':'display:inline', 'innerHTML':'Off'});
            injectDOM('input', 'onButton', 'setValues', {
                'style' : 'margin-left:2%; margin-bottom:10px; display:inline;',
                'name' : 'HVswitch',
                'type' : 'radio',
                'value' : 'on'
            });
            injectDOM('p', 'onSwitch', 'setValues', {'style':'display:inline', 'innerHTML':'On'});
            //submit updates:
            injectDOM('input', 'submitParameters', 'setValues', {
                'class' : 'bigButton',
                'style' : 'z-index:10000',
                'onclick' : function(){updateParameter()},
                'type' : 'button',
                'value' : 'Commit'
            });
            document.getElementById('submitParameters').setAttribute('disabled', 'true');

            //status report:
            injectDOM('p', 'status', 'setValues', {'style':'margin-left:10%', 'innerHTML':'Status:'});

            //voltage fill meter
            injectDOM('p', 'voltageMeterTitle', 'setValues', {
                'style' : 'margin-left:10%; margin-bottom:0px; display:inline; position:relative; top:-18px;',
                'innerHTML' : 'Voltage [V]'
            });
            injectDOM('canvas', 'voltageMeter', 'setValues', {'style':'margin-left:2px', 'align':'right'});
            //current fill meter
            injectDOM('p', 'currentMeterTitle', 'setValues', {
                'style' : 'margin-left:10%; margin-bottom:0px; display:inline; position:relative; top:-18px;',
                'innerHTML' : 'Current [uA]'
            });
            injectDOM('canvas', 'currentMeter', 'setValues', {'style':'margin-left:2px;', 'align':'right'});
            //temperature fill meter
            injectDOM('p', 'temperatureMeterTitle', 'setValues', {
                'style' : 'margin-left:10%; margin-bottom:0px; display:inline; position:relative; top:-18px;',
                'innerHTML' : 'Temperature [C]'
            });                    
            injectDOM('canvas', 'temperatureMeter', 'setValues', {'stlye':'margin-left2px', 'align':'right'});

            //demand voltage
            injectDOM('p', 'FieldText', 'setValues', {'style':'margin-left:10%', 'innerHTML':'Demand Voltage [V]'});
            injectDOM('input', 'demandVoltage', 'setValues', {
                'style' : 'margin-bottom:10px; margin-top: 5px; margin-left:10%; margin-right:5%;',
                'name' : 'textbox',
                'type' : 'text',
                'value' : 'default',
                'size' : '6'
            });
            injectDOM('div', 'voltageSlider', 'setValues', {'class':'slider'});
            //demand voltage ramp up
            injectDOM('p', 'RampText', 'setValues', {'style':'margin:0px; margin-left:10%; margin-top:20px;', 'innerHTML':'Voltage Ramp Up Speed [V/s]'});
            injectDOM('input', 'demandRampSpeed', 'setValues', {
                'style' : 'margin-bottom:10px; margin-top: 5px; margin-left:10%; margin-right:5%;',
                'name' : 'textbox',
                'type' : 'text',
                'value' : 'default',
                'size' : '6'
            });
            injectDOM('div', 'rampSlider', 'setValues', {'class':'slider'});
            //demand voltage ramp down
            injectDOM('p', 'RampTextDown', 'setValues', {'style':'margin:0px; margin-left:10%; margin-top:20px;', 'innerHTML':'Voltage Ramp Down Speed [V/s]'});
            injectDOM('input', 'demandRampDownSpeed', 'setValues', {
                'style' : 'margin-bottom:10px; margin-top: 5px; margin-left:10%; margin-right:5%;',
                'name' : 'textbox',
                'type' : 'text',
                'value' : 'default',
                'size' : '6'
            });
            injectDOM('div', 'rampDownSlider', 'setValues', {'class':'slider'});

            //space canvas:
            injectDOM('canvas', 'inputSpacer', this.sidebarID, {'style' : 'margin-left:10%; margin-top:5%;', 'width':'200px', 'height':'5px'});
            //draw on the canvas:
            var ILcanvas = document.getElementById('inputSpacer');
            var ILcontext = ILcanvas.getContext('2d');
            ILcontext.strokeStyle = 'rgba(255,255,255,0.9)'
            ILcontext.beginPath();
            ILcontext.moveTo(0,0);
            ILcontext.lineTo(200,0);
            ILcontext.stroke();

            //channel changing form:
            injectDOM('form', 'changeChannel', this.sidebarID, {});
            //title
            injectDOM('h4', 'ccTitle', 'changeChannel', {'style':'margin-left:10%; margin-bottom:10px;', 'innerHTML':'Change Channel:'});
            //cards:
            injectDOM('p', 'cardTitle', 'changeChannel', {'style':'display:inline; margin-left:10%; margin-right:1%', 'innerHTML':'Card'});
            injectDOM('select', 'CardList', 'changeChannel', {'style':'width:80px;'});
            injectDOM('br', 'break', 'changeChannel', {});
            //channels:
            injectDOM('p', 'channelTitle', 'changeChannel', {
                'style' : 'display:inline; margin-left:10%; position:relative; top:-20px; margin-right:1%;',
                'innerHTML' : 'Channel'
            });
            injectDOM('select', 'ChannelList', 'changeChannel', {'style':'width:80px; position:relative; top:-20px;'});
            //submit button:
            injectDOM('input', 'getChannelButton', 'changeChannel', {
                'class' : 'link',
                'style' : 'position:relative; top:-30px; width: 50px; height:50px; font-size:24px; margin-left:3%; margin-top:10px; border-color:black',
                'type' : 'button',
                'value' : 'Go',
                'onclick' : function(){window.refreshInput = 1; gotoNewChannel(event, window.HVpointer);}
            });
        };

        //deploy a sidebar to interact with this element:
        this.deploySidebar();

        //deploy some sliders in the sidebar  TODO: push into deploySidebar()?
        var sliderWidth = parseFloat($(document.getElementById('InputLayer')).width())*0.5;
        this.voltageSlider = new Slider(this.sidebarID, 'volageSliderText', 'demandVoltage', 'voltageSlider', 'voltageSliderBKG', 'voltageSliderKnob', 'voltageKnobStyle', 'voltageSliderText', ODB.HV.demandVoltage[0], ODB.HV.demandVoltage[1], window.parameters.statusPrecision, window.parameters.voltUnit, sliderWidth );
        this.rampSlider = new Slider(this.sidebarID, 'rampSliderText', 'demandRampSpeed', 'rampSlider', 'rampSliderBKG', 'rampSliderKnob', 'rampKnobStyle', 'rampSliderText', ODB.HV.voltRampSpeed[0], ODB.HV.voltRampSpeed[1], window.parameters.statusPrecision, window.parameters.rampUnit,  sliderWidth);
        this.rampDownSlider = new Slider(this.sidebarID, 'rampDownSliderText', 'demandRampDownSpeed', 'rampDownSlider', 'rampDownSliderBKG', 'rampDownSliderKnob', 'rampDownKnobStyle', 'rampDownSliderText', ODB.HV.voltRampSpeed[0], ODB.HV.voltRampSpeed[1], window.parameters.statusPrecision, window.parameters.rampUnit,  sliderWidth);

        //fill meters  TODO: put these on the waffle object instead of window?
        window.meter = new FillMeter('voltageMeter', 'InputLayer', 0, ODB.HV.demandVoltage[0], ODB.HV.demandVoltage[1], window.parameters.voltUnit, window.parameters.statusPrecision);
        window.currentMeter = new FillMeter('currentMeter', 'InputLayer', 0, this.currentMin, this.currentMax, window.parameters.currentUnit, window.parameters.statusPrecision);
        window.temperatureMeter = new FillMeter('temperatureMeter', 'InputLayer', 0, this.temperatureMin, ODB.HV.tempTolerance, window.parameters.temperatureUnit, window.parameters.statusPrecision);

        //determine dimesions of canvas:
        this.totalWidth = Math.round(0.5*$('#'+this.wrapperDiv).width());
        //cell dimensions controlled by total width, since width more visually important here:
        this.cellSide = [];
        this.totalHeight = [];
        for(i=0; i<this.nCrates; i++){
            this.cellSide[i] = (this.totalWidth - 60) / Math.max(20, this.cols[i]);
            this.totalHeight[i] = 16*this.cellSide[i];
        }

        //DOM insertions////////////////////////////////////
        //inject top level nav button
        injectDOM('button', this.topNavID, 'statusLink', {
            'class' : 'navLink',
            'innerHTML' : 'HV Monitor',
            'onclick' : function(){
                swapView(window.HVpointer.linkWrapperID, 'HVgrid0', 'InputLayer', window.HVpointer.topNavID); 
                rePaint();
            }
        });

        //header
        injectDOM('div', this.linkWrapperID, this.wrapperDiv, {'class':'navPanel'});
        //title
        injectDOM('h1', this.linkWrapperID+'Banner', this.linkWrapperID, {'class':'navPanelHeader', 'innerHTML':ODB.topLevel.expName+' HV Mainframes'});
        injectDOM('br', 'break', this.linkWrapperID, {});
        //mainframe navigation
        for(i=0; i<this.nCrates; i++){
            injectDOM('button', 'Main'+(i+1), this.linkWrapperID, {
                'class' : (i==0)? 'navLinkDown' : 'navLink',
                'innerHTML' : 'Mainframe '+(i+1),
                'onclick' : function(){swapHVmainframe(this.crate); rePaint();}
            });
            document.getElementById('Main'+(i+1)).crate = i;
        }
        injectDOM('br', 'break', this.linkWrapperID, {});
        //card navigation
        for(i=0; i<this.nCrates; i++){
            injectDOM('div', this.linkWrapperID+i, this.linkWrapperID, {'class':'cardNavPanel'});
            for(j=0; j<window.parameters.moduleSizes[i].length; j++){
                injectDOM('button', 'crate'+i+'card'+j, this.linkWrapperID+i, {
                    'class' : 'navLink',
                    'innerHTML' : 'Slot '+j,
                    'type' : 'button',
                    'onclick' : function(){barChartButton(this)}
                });
                document.getElementById('crate'+i+'card'+j).cardNumber = j;
            }

            //inject canvas into DOM for waffle to paint on:
            injectDOM('canvas', this.canvasID[i], this.wrapperDiv, {
                'class' : 'monitor',
                'width' : this.totalWidth,
                'height' : this.totalHeight[i]
            });
            this.canvas[i] = document.getElementById(this.canvasID[i]);
            this.context[i] = this.canvas[i].getContext('2d');

        }

        //finished DOM insertions//////////////////////////////////////

        //set up module labels:
        this.moduleLabels = [];
        for(i=0; i<16; i++){
            this.moduleLabels[i] = 'Slot ' + i;
        }

        //adjust height to accommodate card and module labels:
        for(i=0; i<this.nCrates; i++){
            this.context[i].font = Math.min(16, this.cellSide[i])+'px Raleway';
            this.longestModuleLabel = 0;
            for(j = 0; j<window.parameters.moduleSizes[i].length; j++){
                this.longestModuleLabel = Math.max(this.longestModuleLabel, this.context[i].measureText(this.moduleLabels[j]).width);
            }
            this.totalHeight[i] += this.longestModuleLabel + 50;
            this.canvas[i].setAttribute('height', this.totalHeight[i]);
        }

        //waffle dimensions; leave gutters for labels & title
        this.waffleWidth = [];
        this.waffleHeight = [];
        this.leftEdge = [];
        for(i=0; i<this.nCrates; i++){
            this.waffleWidth[i] = this.cellSide[i]*this.cols[i];
            this.waffleHeight[i] = this.totalHeight[i];
            //want waffle and navbar centered nicely:
            this.leftEdge[i] = (this.totalWidth - (this.waffleWidth[i] + 1.5*this.context[i].measureText('Prim').width))/2;
            //push navbar over to match:
            document.getElementById(this.linkWrapperID).setAttribute('style', 'left:'+(24 + 100*this.leftEdge[i]/$('#'+this.wrapperDiv).width() )+'%;');
        }

        //make a tooltip for each crate:
        this.tooltip = [];
        for(i=0; i<this.nCrates; i++){
            this.tooltip[i] = new Tooltip(this.canvasID[i], 'MFTT'+i, this.wrapperDiv, this.prefix, this.postfix);
            //give the tooltip a pointer back to this object:
            this.tooltip[i].obj = that;
            //tooltip looks for members canvasWidth and canvasHeight to make sure its in a valid place:
            this.canvasWidth = document.getElementById(this.canvasID[0]).width;
            this.canvasHeight = document.getElementById(this.canvasID[0]).height;
        }

        //establish animation parameters:
        this.FPS = 30;
        this.duration = 0.5;
        this.nFrames = this.FPS*this.duration;

        //style card nav buttons
        var newRule;
        for(j=0; j<this.nCrates; j++){
            for(i=0; i<window.parameters.moduleSizes[j].length; i++){
                var buttonWidth, fontsize;
                buttonWidth = Math.max(window.parameters.moduleSizes[j][i],1)*0.9*this.cellSide[j] + (Math.max(window.parameters.moduleSizes[j][i],1)-1)*0.1*this.cellSide[j];
                if(window.parameters.moduleSizes[j][i] == 4) fontsize = 0.9*this.cellSide[j]*0.5;
                else fontsize = 0.9*this.cellSide[j]*0.3;

                if(window.parameters.moduleSizes[j][i] != 0)
                    newRule = "width:"+buttonWidth+"px; height:"+0.9*this.cellSide[j]+"px; margin-right:"+0.05*this.cellSide[j]+"px; margin-left:"+0.05*this.cellSide[j]+"px; margin-top:"+0.05*this.cellSide[j]+"px; float:left; border-radius: 5px; display: inline; font-family: 'Raleway', sans-serif; font-size:"+fontsize+"px; padding:0px;";
                else{ 
                    newRule = "width:"+buttonWidth+"px; height:"+0.9*this.cellSide[j]+"px; margin-right:"+0.05*this.cellSide[j]+"px; margin-left:"+0.05*this.cellSide[j]+"px; margin-top:"+0.05*this.cellSide[j]+"px; float:left; border-radius: 5px; display: inline; font-family: 'Raleway', sans-serif; font-size:"+this.cellSide[j]/2+"px; padding:0px; color:#CC0000;";
                    document.getElementById('crate'+j+'card'+i).setAttribute('onclick', '');
                    document.getElementById('crate'+j+'card'+i).innerHTML = 'X'
                }
                document.getElementById('crate'+j+'card'+i).setAttribute('style', newRule);
            }
        }

        document.getElementById(this.linkWrapperID+0).style.display = 'block';
        //header size:
        this.headerHeight = [];
        for(i=0; i<this.nCrates; i++){
            document.getElementById(this.linkWrapperID+i).style.display = 'block';
            this.headerHeight[i] = $('#'+this.linkWrapperID).height();
            document.getElementById(this.linkWrapperID+i).style.display = 'none';
            //make the vertical spacing between the waffle and nav header nice:
            $('#'+this.canvasID[i]).css('top', ( $('#mainframeLinks').offset().top + (this.headerHeight[i])+5)+'px !important;' );
        }
        //turn top crate's slot navigation on:
        document.getElementById(this.linkWrapperID+window.HVview).style.display = 'block';


        //declare bar charts & canvases to paint them on:
        this.barCharts = [];
        var newCanvas;
        for(j=0; j<this.nCrates; j++){
            this.barCharts[j] = [];
            for(i=0; i<window.parameters.moduleSizes[j].length; i++){
                injectDOM('canvas', 'crate'+j+'bar'+i, this.wrapperDiv, {
                    'class' : 'monitor',
                    'width' : this.totalWidth,
                    'height' : this.totalHeight[i],
                    'style' : 'top:' + ($('#mainframeLinks').offset().top + $('#mainframeLinks').offset().height +5) + 'px'
                });
                this.barCharts[j][i] = new BarGraph('crate'+j+'bar'+i, i, Math.max(window.parameters.moduleSizes[j][i],1)*12, 'Slot '+i, 'Reported Voltage [V]', 0, window.parameters.scaleMaxima[0], window.parameters.barChartPrecision, that, j);
            }
        }

        //set up arrays:
        this.startColor = [];
        this.endColor = [];
        for(j=0; j<this.nCrates; j++){
            this.startColor[j] = [];
            this.endColor[j] = [];
            for(i=0; i<this.rows; i++){
        	    this.startColor[j][i] = [];
            	this.endColor[j][i] = [];
            }
        }

        //declare alarmStatus and prevAlarmStatus as arrays of appropriate dimension:
        for(k=0; k<this.nCrates; k++){
            this.alarmStatus[k] = [];
            this.prevAlarmStatus[k] = [];
            for(i=0; i<this.rows; i++){
                this.alarmStatus[k][i] = [];
                this.prevAlarmStatus[k][i] = [];
                //primary row spans multi-columns:
                if(i==0) columns = window.parameters.moduleSizes[k].length;
                else columns = this.cols[k];
                for(j=0; j<columns; j++){
                    this.alarmStatus[k][i][j] = [];
                    this.prevAlarmStatus[k][i][j] = [];
                    for(var n=0; n<3; n++){
                        this.alarmStatus[k][i][j][n] = 0;
                        this.prevAlarmStatus[k][i][j][n] = 0;
                    }
                }
            }
        }

        //array of values from the waffle to report in the tooltip
        this.reportedValues = [];
        for(i=0; i<this.nCrates; i++){
            this.reportedValues[i] = [this.dataBus[i].demandVoltage, this.dataBus[i].reportVoltage, this.dataBus[i].reportCurrent, this.dataBus[i].demandVrampUp, this.dataBus[i].demandVrampDown, this.dataBus[i].reportTemperature, this.dataBus[i].rampStatus];
        }

        //make waffles clickable to set a variable for a channel:
        for(i=0; i<this.nCrates; i++){
            this.canvas[i].onclick = function(event){clickWaffle(event, that)};
        }

        //draw the legends on the main views once only:
        this.legendTop = [];
            for(j=0; j<this.nCrates; j++){
                //draw legend:
                this.context[j].strokeStyle = '#000000';
                this.context[j].lineWidth = 2;
                this.legendTop[j] = this.totalHeight[j]*0.85;
                var legendColors = ['rgba(0,255,0,0.3)', 'rgba(255,255,0,0.3)', 'rgba(255,0,0,0.5)', 'rgba(0,0,255,0.5)', 'rgba(0,0,0,0.3)', 'rgba(0,0,0,0.9)'];
                var legendString = ['All OK', 'Ramping', 'Alarm!', 'Ext. Disable', 'Off', 'Absent'];
                for(i = 0; i<6; i++){
                    this.context[j].font = Math.min(16, fitFont(this.context[j], legendString[i], (this.canvasWidth*0.8/6 - this.cellSide[j]*1.1)*0.9  )) + 'px Raleway';
                    this.context[j].fillStyle = '#FFFFFF';
                    this.context[j].fillRect(this.canvasWidth*0.1 + i*this.canvasWidth*0.8/6, this.legendTop[j], this.cellSide[j], this.cellSide[j]);
                    this.context[j].fillStyle = legendColors[i];
                    this.context[j].fillRect(this.canvasWidth*0.1 + i*this.canvasWidth*0.8/6, this.legendTop[j], this.cellSide[j], this.cellSide[j]);
                    this.context[j].strokeRect(this.canvasWidth*0.1 + i*this.canvasWidth*0.8/6, this.legendTop[j], this.cellSide[j], this.cellSide[j]);
                    this.context[j].fillStyle = '#999999';
                    this.context[j].textBaseline = 'middle';
                    this.context[j].fillText(legendString[i], this.canvasWidth*0.1 + i*this.canvasWidth*0.8/6 + this.cellSide[j]*1.1, this.legendTop[j] + this.cellSide[j]/2);
                    this.context[j].textBaseline = 'bottom';
                    
                }
            }
            

        ///////////////////member functions/////////////////////////////////////////////////////////
        //decide which canvas to present:
        this.view = function(){
            if(this.viewStatus == -1)
                return this.canvasID+window.HVview;
            else return 'crate'+window.HVview+'bar'+this.viewStatus;
        };

        //determine per cell color info for start and finish.
        //Color info is packed as four numbers: red, green, blue, alpha
        this.cellColorUpdate = function(crate){
            var R, G, B, A, color, primary;
            for(var i=0; i<this.rows; i++){
                //primary row spans multi-columns:
                if(i==0) columns = window.parameters.moduleSizes[crate].length;
                else columns = this.cols[crate];
            	for(var j=0; j<columns; j++){
                    if(i > 0)
                        primary = primaryBin(window.parameters.moduleSizes[crate],j);
                    else primary = j;

    	         	//start values:
                    //show green on all clear:
    	            if( this.prevAlarmStatus[crate][i][j][0] == 0 && this.prevAlarmStatus[crate][i][j][1] == 0 && this.prevAlarmStatus[crate][i][j][2] == 0){
                        R = 0;
                        G = 255;
                        B = 0;
                        A = 0.3;
                    //else show grey if the channel is off:
                    } else if(this.prevAlarmStatus[crate][i][j][0] == -1){
                        R = 0;
                        G = 0;
                        B = 0;
                        A = 0.3;
                    //else show yellow if channel is ramping & no temperature or current alarms:
                    } else if(this.prevAlarmStatus[crate][i][j][0] == -2 && this.prevAlarmStatus[crate][i][j][1] == 0 && this.prevAlarmStatus[crate][i][j][2] == 0){
                        R = 255;
                        G = 255;
                        B = 0;
                        A = 0.3;
                    //blue for external disable:
                    } else if(this.prevAlarmStatus[crate][i][j][0] == -3){
                        R = 0;
                        G = 0;
                        B = 255;
                        A = 0.5;
                    //else show red for alarm:
                    } else {
                        R = 255;
                        G = 0;
                        B = 0;
                        A = Math.max(this.prevAlarmStatus[crate][i][j][0], this.prevAlarmStatus[crate][i][j][1], this.prevAlarmStatus[crate][i][j][2])*0.7 + 0.3;  //enforce minimum 0.3 to make it clearly red
                        if(A>1) {A = 1;}
    	            }

                    //12-channel cards don't have primary channels, show black (also empty slots):
                    if( (i==0 && window.parameters.moduleSizes[crate][j] == 1) || window.parameters.moduleSizes[crate][primary] == 0 ){
                        R = 0;
                        G = 0;
                        B = 0;
                        A = 0.9;
                    }
                    this.startColor[crate][i][j] = [R,G,B,A];

                    //end values:
                    if(this.alarmStatus[crate][i][j][0] == 0 && this.alarmStatus[crate][i][j][1] == 0 && this.alarmStatus[crate][i][j][2] == 0){
                        R = 0;
                        G = 255;
                        B = 0;
                        A = 0.3;
                    } else if(this.alarmStatus[crate][i][j][0] == -1){
                        R = 0;
                        G = 0;
                        B = 0;
                        A = 0.3;
                    } else if(this.alarmStatus[crate][i][j][0] == -2 && this.alarmStatus[crate][i][j][1] == 0 && this.alarmStatus[crate][i][j][2] == 0){
                        R = 255; 
                        G = 255;
                        B = 0;
                        A =0.3;
                    } else if(this.alarmStatus[crate][i][j][0] == -3){
                        R = 0;
                        G = 0;
                        B = 255;
                        A = 0.5;
                    } else {
                        R = 255;
                        G = 0;
                        B = 0;
                        A = Math.max(this.alarmStatus[crate][i][j][0], this.alarmStatus[crate][i][j][1], this.alarmStatus[crate][i][j][2])*0.7 + 0.3;  //enforce minimum 0.3 to make it clearly red
                        if(A>1) {A = 1;}
                    }
                    if( (i==0 && window.parameters.moduleSizes[crate][j] == 1) || window.parameters.moduleSizes[crate][primary] == 0 ){
                        R = 0;
                        G = 0;
                        B = 0;
                        A = 0.9;
                    }
                    this.endColor[crate][i][j] = [R,G,B,A];
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
            this.context[window.HVview].globalAlpha = 1;
            this.context[window.HVview].clearRect(this.leftEdge[window.HVview],0,this.totalWidth,this.legendTop[window.HVview]);
            this.context[window.HVview].fillStyle = "rgba(255,255,255,1)"
            this.context[window.HVview].fillRect(this.leftEdge[window.HVview],0,this.cellSide[window.HVview]*this.cols[window.HVview],this.cellSide[window.HVview]*this.rows);

            for(i=0; i<this.rows; i++){
                //primary row spans multi-columns:
                if(i==0) columns = window.parameters.moduleSizes[window.HVview].length;
                else columns = this.cols[window.HVview];
                for(var j=0; j<columns; j++){
                    R = this.startColor[window.HVview][i][j][0] + (this.endColor[window.HVview][i][j][0] - this.startColor[window.HVview][i][j][0])*frame/this.nFrames;
                    G = this.startColor[window.HVview][i][j][1] + (this.endColor[window.HVview][i][j][1] - this.startColor[window.HVview][i][j][1])*frame/this.nFrames;
                    B = this.startColor[window.HVview][i][j][2] + (this.endColor[window.HVview][i][j][2] - this.startColor[window.HVview][i][j][2])*frame/this.nFrames;
                    A = this.startColor[window.HVview][i][j][3] + (this.endColor[window.HVview][i][j][3] - this.startColor[window.HVview][i][j][3])*frame/this.nFrames;
                    color = "rgba("+R+","+G+","+B+","+A+")";
            
                    this.context[window.HVview].fillStyle = color;
                    cornerY = i*this.cellSide[window.HVview];
                    //primary row has different size bins than the rest:
                    if(i != 0){
                        cornerX = this.leftEdge[window.HVview] + j*this.cellSide[window.HVview];
                        this.context[window.HVview].fillRect(cornerX, cornerY,this.cellSide[window.HVview],this.cellSide[window.HVview]);
                    }
                    else{
                        cornerX = 0;
                        for(var sum=0; sum<j; sum++){
                            cornerX = cornerX + Math.max(window.parameters.moduleSizes[window.HVview][sum],1);
                        }
                        cornerX = this.leftEdge[window.HVview] + cornerX*this.cellSide[window.HVview];
                        this.context[window.HVview].fillRect(cornerX, cornerY,this.cellSide[window.HVview]*Math.max(window.parameters.moduleSizes[window.HVview][j],1),this.cellSide[window.HVview]);

                    }
                }
            }

            /*
            //highlight cell in focus:
            this.context[window.HVview].strokeStyle = '#FFFFFF';
            this.context[window.HVview].lineWidth = 3;
            this.context[window.HVview].strokeRect(this.leftEdge[window.HVview],0,this.cellSide[window.HVview],this.cellSide[window.HVview])
            //this.context[window.HVview].strokeRect(this.leftEdge[window.HVview] + this.cellSide[window.HVview]*this.chx, this.cellSide[window.HVview]*this.chy, this.cellSide[window.HVview]*Math.max(window.parameters.moduleSizes[window.HVview][j],1),this.cellSide[window.HVview]);
            this.context[window.HVview].stroke();
            this.context[window.HVview].strokeStyle = '#000000';
            this.context[window.HVview].lineWidth = 1;
            */
                        

            this.drawWaffleDecorations(frame);
            this.drawWaffleLabels();
        };

        this.drawWaffleDecorations = function(frame){

            var i, j;

            var modDivCopy = [0];
            for(i=0; i < window.parameters.moduleSizes[window.HVview].length; i++){
                modDivCopy[i+1] = modDivCopy[i] + Math.max(window.parameters.moduleSizes[window.HVview][i],1);
            }
            modDivCopy.shift();

            //style lines:
            this.context[window.HVview].fillStyle = 'rgba(0,0,0,1)';
            this.context[window.HVview].lineWidth = 1;

            //draw border:
            this.context[window.HVview].strokeRect(this.leftEdge[window.HVview],0,this.cellSide[window.HVview]*this.cols[window.HVview], this.cellSide[window.HVview]*this.rows);

            //draw inner lines:
            for(i=1; i<this.rows; i++){
                this.context[window.HVview].beginPath();
                if(i==1) this.context[window.HVview].lineWidth = 3;
                else this.context[window.HVview].lineWidth = 1;
                this.context[window.HVview].moveTo(this.leftEdge[window.HVview],i*this.cellSide[window.HVview]);
                this.context[window.HVview].lineTo(this.leftEdge[window.HVview] + this.cellSide[window.HVview]*this.cols[window.HVview],i*this.cellSide[window.HVview]);
                this.context[window.HVview].stroke();       
            }
            for(j=1; j<this.cols[window.HVview]; j++){
                this.context[window.HVview].beginPath();
                if(j==modDivCopy[0]){
                    this.context[window.HVview].lineWidth = 3;
                    modDivCopy.shift();
                }
                else this.context[window.HVview].lineWidth = 1;
                if(this.context[window.HVview].lineWidth == 1){
                    this.context[window.HVview].moveTo(this.leftEdge[window.HVview] + j*this.cellSide[window.HVview],this.cellSide[window.HVview]);
                    this.context[window.HVview].lineTo(this.leftEdge[window.HVview] + j*this.cellSide[window.HVview],this.cellSide[window.HVview]*this.rows);
                } else {
                    this.context[window.HVview].moveTo(this.leftEdge[window.HVview] + j*this.cellSide[window.HVview],0);
                    this.context[window.HVview].lineTo(this.leftEdge[window.HVview] + j*this.cellSide[window.HVview],this.cellSide[window.HVview]*this.rows);
                }
                this.context[window.HVview].stroke();
            }

        };

        this.drawWaffleLabels = function(){
            var i, j;
            var moduleWidth, modRotation, modAlign, modHeight;
            
            this.context[window.HVview].fillStyle = 'white'; //'black'
            this.context[window.HVview].globalAlpha = 0.3;    //0.6

            //channel labels:
            var labelFontSize = Math.min(16, this.cellSide[window.HVview]);
            this.context[window.HVview].font=labelFontSize+"px Raleway";
            this.context[window.HVview].fillText('Prim', this.leftEdge[window.HVview] + this.cellSide[window.HVview]*this.cols[window.HVview]+10, this.cellSide[window.HVview]/2 +8 );
            for(i=1; i<this.rows; i++){
                this.context[window.HVview].fillText(i-1, this.leftEdge[window.HVview] + this.cellSide[window.HVview]*this.cols[window.HVview]+10, i*this.cellSide[window.HVview] + this.cellSide[window.HVview]/2 +8 );
            }

            //module labels:
            var moduleDivisions = [0];
            var vertOffset;
            for(i=0; i < window.parameters.moduleSizes[window.HVview].length; i++){
                moduleDivisions[i+1] = moduleDivisions[i] + Math.max(window.parameters.moduleSizes[window.HVview][i],1);
            }
            for(j=1; j<moduleDivisions.length; j++){
                var moduleWidth = moduleDivisions[j] - moduleDivisions[j-1];

                if(moduleWidth*this.cellSide[window.HVview] < 1.2*this.context[window.HVview].measureText(this.moduleLabels[j-1]).width){
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
                this.context[window.HVview].save();
                this.context[window.HVview].translate(this.leftEdge[window.HVview] + (moduleWidth/2 + moduleDivisions[j-1])*this.cellSide[window.HVview], this.rows*this.cellSide[window.HVview]+vertOffset);
                this.context[window.HVview].rotate(modRotation);
                this.context[window.HVview].textAlign = modAlign;
                this.context[window.HVview].fillText(this.moduleLabels[j-1], 0,labelFontSize/2);
                this.context[window.HVview].restore();
            }
        };        

        //wrapper for transition from old state to new state via this.animate:
        this.update = function(){
            var i,j,k,columns;

            this.fetchNewData();

            //update alarms & colors to prepare for animation transition:
            for(k=0; k<this.nCrates; k++){
                for(i=0; i<this.rows; i++){
                    //primary row spans multi-columns:
                    if(i==0) columns = window.parameters.moduleSizes[k].length;
                    else columns = this.cols[k];
                    for(j=0; j<columns; j++){
                        this.prevAlarmStatus[k][i][j][0] = this.alarmStatus[k][i][j][0];
                        this.prevAlarmStatus[k][i][j][1] = this.alarmStatus[k][i][j][1];
                        this.prevAlarmStatus[k][i][j][2] = this.alarmStatus[k][i][j][2];
                        this.alarmStatus[k][i][j][0] = this.dataBus[k].alarmStatus[i][j][0];
                        this.alarmStatus[k][i][j][1] = this.dataBus[k].alarmStatus[i][j][1]; 
                        this.alarmStatus[k][i][j][2] = this.dataBus[k].alarmStatus[i][j][2];
                        //this.cellColorUpdate(k);
                    }
                }
                this.cellColorUpdate(k);
            }

            //update peripherals:
            for(k=0; k<this.nCrates; k++){
                for(i=0; i<this.barCharts[k].length; i++){
                    for(j=0; j<this.barCharts[k][i].nBars; j++){
                        var arrayCoords = getPointer(i, j, that, k);
                        this.barCharts[k][i].dataBus.barChartData[j] = this.dataBus[k].reportVoltage[arrayCoords[0]][arrayCoords[1]];
                        this.barCharts[k][i].dataBus.barChartAlarms[j] = this.dataBus[k].alarmStatus[arrayCoords[0]][arrayCoords[1]];
                    }
                    this.barCharts[k][i].update(this.barCharts[k][i].dataBus.barChartData, this.barCharts[k][i].dataBus.barChartAlarms);
                }
            }

            channelSelect(that);
            for(i=0; i<this.nCrates; i++){
                this.tooltip[i].update();
            }

            //animation fires only if canvas is showing:
            this.animate();

        };

        //determine which cell pixel x,y falls in, with this.leftEdge,0 being the top left corner of the canvas; return -1 if no corresponding cell.
        this.findCell = function(x, y){
            var cell, slot;

            var chx = Math.floor((x-this.leftEdge[window.HVview]) / this.cellSide[window.HVview]);
            var chy = Math.floor(y / this.cellSide[window.HVview]);
            slot = primaryBin(window.parameters.moduleSizes[window.HVview], chx)

            if(chx < this.cols[window.HVview] && chx > -1 && chy < this.rows && chy > -1){
                cell = [];
                if(chy == 0){
                    chx = slot;
                }
                cell[0] = chy;
                cell[1] = chx;
                if( (chy == 0 && window.parameters.moduleSizes[window.HVview][chx] == 1) || window.parameters.moduleSizes[window.HVview][slot] == 0 ) cell = -1;
            } else 
                cell = -1;

            return cell   
        };

        //establish the tooltip text for the cell returned by this.findCell; return length of longest line:
        this.defineText = function(cell){
            var toolTipContent = '<br>';
            var nextLine, buffer;
            var cardIndex;
            var i;

            var row = cell[0];
            var col = cell[1];

            //decide which card we're pointing at:
            if(row == 0) cardIndex = col;
            else cardIndex = primaryBin(window.parameters.moduleSizes[window.HVview], col);

            //Title for normal channels:
            if(row != 0) nextLine = this.moduleLabels[cardIndex]+', Ch. '+channelMap(col, row, window.parameters.moduleSizes[window.HVview], this.rows)+'<br>';
            //Title for primary channels:
            else nextLine = this.moduleLabels[cardIndex]+' Primary <br>';
            toolTipContent += nextLine;

            //channel Name
            nextLine = this.dataBus[window.HVview].channelName[row][col]+'<br>';
            toolTipContent += nextLine;            

            //fill out tooltip content:
            for(i=0; i<this.reportedValues[window.HVview].length; i++){
                //establish prefix:
                nextLine = '<br/>'+this.tooltip[window.HVview].prefix[i];
                if(this.tooltip[window.HVview].prefix[i] !== '') nextLine += ' ';

                //pull in content; special cases for the status word and reported current:
                //status word:
                if(i == 6){
                    nextLine += ((this.dataBus[window.HVview].channelMask[row][col] == 0) ? 'Off' : parseStatusWord(this.reportedValues[window.HVview][i][row][col]));
                }
                //current:
                else if(i == 2){
                        if(window.parameters.moduleSizes[window.HVview][cardIndex]==4 && row!=0) nextLine += '--';
                        else nextLine += Math.round( this.reportedValues[window.HVview][i][row][col]*1000)/1000 + ' ' + this.tooltip[window.HVview].postfix[i];                
                } else {
                    nextLine += Math.round( this.reportedValues[window.HVview][i][row][col]*1000)/1000 + ' ' + this.tooltip[window.HVview].postfix[i];
                }

                //append to tooltip:
                toolTipContent += nextLine;
 
            }
            toolTipContent += '<br><br>';
            document.getElementById(this.tooltip[window.HVview].ttDivID).innerHTML = toolTipContent;

            return 0;
        };

        //get new data:
        this.fetchNewData = function(){
            
            var testParameter, i, j, k, data, ODBindex, columns, slot, variablesRecord, settingsRecord,
            chName = [],
            reqVoltage = [],
            measVoltage = [],
            measCurrent = [],
            rampUp = [],
            rampDown = [],
            measTemperature = [],
            repoChState = [],
            repoChStatus = [],
            voltageLimit = [],
            currentLimit = [],
            paths = [];
        
            //fetch all the HV parameters from the chunk of ODB hanging around locally:
            for(k=0; k<this.nCrates; k++){
                chName[k]          = window.localODB['HV'+k].chName;  
                reqVoltage[k]      = window.localODB['HV'+k].reqVoltage;  
                measVoltage[k]     = window.localODB['HV'+k].measVoltage;
                measCurrent[k]     = window.localODB['HV'+k].measCurrent; 
                rampUp[k]          = window.localODB['HV'+k].rampUp;
                rampDown[k]        = window.localODB['HV'+k].rampDown;
                measTemperature[k] = window.localODB['HV'+k].measTemperature;
                repoChState[k]     = window.localODB['HV'+k].repoChState;
                repoChStatus[k]    = window.localODB['HV'+k].repoChStatus;
                voltageLimit[k]    = window.localODB['HV'+k].voltageLimit;
                currentLimit[k]    = window.localODB['HV'+k].currentLimit;        
            }
                


            for(k=0; k<this.nCrates; k++){
                for(i=0; i<this.rows; i++){
                    //primary row spans multi-columns, only has entries for 48 channel cards:        
                    if(i==0) columns = window.parameters.moduleSizes[k].length;
                    else columns = this.cols[k];

                    for(j=0; j<columns; j++){
                  
                        if (i>0) slot = primaryBin(window.parameters.moduleSizes[k], j);
                        else slot = j;
                        //don't populate the primary of a 12 channel card, or any channel corresponding to an empty slot:
                        if( (i!=0 || window.parameters.moduleSizes[k][j]==4) && window.parameters.moduleSizes[k][slot]!=0 ){
                               
                            this.dataBus[k].channelName[i][j] = 'channel'+i+j;
                            this.dataBus[k].demandVoltage[i][j] = -9999;
                            this.dataBus[k].reportVoltage[i][j] = -9999;
                            this.dataBus[k].reportCurrent[i][j] = -9999;
                            this.dataBus[k].demandVrampUp[i][j] = -9999;
                            this.dataBus[k].demandVrampDown[i][j] = -9999;
                            this.dataBus[k].reportTemperature[i][j] = -9999;
                            this.dataBus[k].channelMask[i][j] = 1;
                            this.dataBus[k].rampStatus[i][j] = 7;
                            this.dataBus[k].voltLimit[i][j] = -9999;
                            this.dataBus[k].currentLimit[i][j] = -9999;

                            ODBindex = getMIDASindex(i, j, k);
                            this.dataBus[k].channelName[i][j]       = chName[k][ODBindex];
                            this.dataBus[k].demandVoltage[i][j]     = parseFloat(reqVoltage[k][ODBindex]);
                            this.dataBus[k].reportVoltage[i][j]     = parseFloat(measVoltage[k][ODBindex]);   
                            this.dataBus[k].reportCurrent[i][j]     = parseFloat(measCurrent[k][ODBindex]);
                            
                            this.dataBus[k].demandVrampUp[i][j]     = parseFloat(rampUp[k][ODBindex]);
                            this.dataBus[k].demandVrampDown[i][j]   = parseFloat(rampDown[k][ODBindex]);
                            this.dataBus[k].reportTemperature[i][j] = parseFloat(measTemperature[k][ODBindex]);
                            this.dataBus[k].channelMask[i][j]       = ( parseInt(repoChState[k][ODBindex]) && parseInt(repoChStatus[k][ODBindex]) ) ? 1 : 0 ;
                            this.dataBus[k].rampStatus[i][j]        = parseFloat(repoChStatus[k][ODBindex]);
                            this.dataBus[k].voltLimit[i][j]         = parseFloat(voltageLimit[k][ODBindex]);
                            this.dataBus[k].currentLimit[i][j]      = parseFloat(currentLimit[k][ODBindex]);

                            //48ch cards report the currents in mA, convert to uA: 
                            if(i==0){
                                this.dataBus[k].reportCurrent[i][j] = this.dataBus[k].reportCurrent[i][j]*1000;
                                this.dataBus[k].currentLimit[i][j] = this.dataBus[k].currentLimit[i][j]*1000;
                            }
                                
                        } else if (i!=0 || window.parameters.moduleSizes[k][j]==4){  //keep the array filled, even for empty slots to avoid unpredictable behavior
                            this.dataBus[k].channelName[i][j] = 'channel'+i+j;
                            this.dataBus[k].demandVoltage[i][j] = 0;
                            this.dataBus[k].reportVoltage[i][j] = 0;
                            this.dataBus[k].reportCurrent[i][j] = 0;
                            this.dataBus[k].demandVrampUp[i][j] = 0;
                            this.dataBus[k].demandVrampDown[i][j] = 0;
                            this.dataBus[k].reportTemperature[i][j] = 0;
                            this.dataBus[k].channelMask[i][j] = 0;
                            this.dataBus[k].rampStatus[i][j] = 0;
                            this.dataBus[k].voltLimit[i][j] = 0;
                            this.dataBus[k].currentLimit[i][j] = 0;
                        }

                        //give the necessary information to the AlarmService, so it can report the state of any channel that trips an alarm below:
                        if(j==0){
                            this.AlarmServices.demandVoltage[k][i] = [];
                            this.AlarmServices.reportVoltage[k][i] = [];
                            this.AlarmServices.reportCurrent[k][i] = [];
                            this.AlarmServices.reportTemperature[k][i] = [];
                        }
                        this.AlarmServices.demandVoltage[k][i][j] = this.dataBus[k].demandVoltage[i][j];
                        this.AlarmServices.reportVoltage[k][i][j] = this.dataBus[k].reportVoltage[i][j];
                        this.AlarmServices.reportCurrent[k][i][j] = this.dataBus[k].reportCurrent[i][j];
                        this.AlarmServices.reportTemperature[k][i][j] = this.dataBus[k].reportTemperature[i][j];
                    }
                }
            }

            //see if any of the new data raises any alarms:
            this.raiseAlarm();

        };

        //push problems out to the alarm service
        this.raiseAlarm = function(){
            var i, j, k;
            //determine alarm status
            for(k=0; k<this.nCrates; k++){
                for(i=0; i<this.rows; i++){
                    //primary row spans multi-columns:
                    if(i==0) columns = window.parameters.moduleSizes[k].length;
                    else columns = this.cols[k];
                    for(j=0; j<columns; j++){
                        //construct the parameter to be tested against the voltage alarm:
                        testParameter = Math.abs(this.dataBus[k].demandVoltage[i][j] - this.dataBus[k].reportVoltage[i][j]); 

                        //determine alarm status for each cell, recorded as [i][j][voltage alarm, current alarm, temperature alarm]
                        //alarmStatus == 0 indicates all clear, 0 < alarmStatus <= 1 indicates alarm intensity, alarmStatus = -1 indicates channel off,
                        //and alarmStatus == -2 for the voltage alarm indicates voltage ramping, -3 for misc disabled conditions:
                        if(testParameter < ODB.HV.voltageTolerance)  this.dataBus[k].alarmStatus[i][j][0] = 0;
                        else this.dataBus[k].alarmStatus[i][j][0] = Math.min( (testParameter - ODB.HV.voltageTolerance) / window.parameters.scaleMaxima[0], 1);
                        if(this.dataBus[k].rampStatus[i][j] == 3 || this.dataBus[k].rampStatus[i][j] == 5){
                            this.dataBus[k].alarmStatus[i][j][0] = -2;
                        }
                        if(this.dataBus[k].rampStatus[i][j] == 256)
                            this.dataBus[k].alarmStatus[i][j][0] = -3;

                        if(this.dataBus[k].reportCurrent[i][j] < ODB.HV.currentTolerance)  this.dataBus[k].alarmStatus[i][j][1] = 0;
                        else  this.dataBus[k].alarmStatus[i][j][1] = Math.min( (this.dataBus[k].reportCurrent[i][j] - ODB.HV.currentTolerance) / window.parameters.scaleMaxima[1], 1);

                        if(this.dataBus[k].reportTemperature[i][j] < ODB.HV.tempTolerance)  this.dataBus[k].alarmStatus[i][j][2] = 0;
                        else  this.dataBus[k].alarmStatus[i][j][2] = Math.min( (this.dataBus[k].reportTemperature[i][j] - ODB.HV.tempTolerance) / window.parameters.scaleMaxima[2], 1);

                        if(this.dataBus[k].channelMask[i][j] == 0){
                            this.dataBus[k].alarmStatus[i][j][0] = -1;
                            this.dataBus[k].alarmStatus[i][j][1] = -1;
                            this.dataBus[k].alarmStatus[i][j][2] = -1;
                        }

                        //register alarms in AlarmServices object:
                        //voltage alarms:
                        if(this.dataBus[k].alarmStatus[i][j][0] > 0){
                            AlarmServices.voltageAlarms[AlarmServices.voltageAlarms.length] = [i,j,k,this.dataBus[k].alarmStatus[i][j][0]];
                        }
                        //current alarms:
                        if(this.dataBus[k].alarmStatus[i][j][1] > 0){
                            AlarmServices.currentAlarms[AlarmServices.currentAlarms.length] = [i,j,k,this.dataBus[k].alarmStatus[i][j][0]];
                        }
                        //temperature alarms:
                        if(this.dataBus[k].alarmStatus[i][j][2] > 0){
                            AlarmServices.temperatureAlarms[AlarmServices.temperatureAlarms.length] = [i,j,k,this.dataBus[k].alarmStatus[i][j][0]];   
                        }
                        
                    }
                }
            }
        };

        this.animate = function(){
            //var i, 
            //topHV = window.HVview;

            if(window.onDisplay.slice(0,6) == 'HVgrid' /*|| window.freshLoad*/){
                /*
                for(i=0; i<this.nCrates; i++){  
                    if(i!=topHV){
                        window.HVview = i;
                        this.draw(this.nFrames);
                    }
                }
                */
                //window.HVview = topHV;
                animate(this, 0);
            } /*else{
                for(i=0; i<this.nCrates; i++){
                    window.HVview = i;
                    this.draw(this.nFrames);      
                }
                window.HVview = topHV;
            }*/
        };

        //do an initial populate of the waffle:
        this.fetchNewData();
        //don't double count the alarms:
        window.AlarmServices.wipeAlarms();
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
            var chx = Math.floor( (event.pageX - obj.leftEdge[window.HVview] - superDiv.offsetLeft - obj.canvas[window.HVview].offsetLeft) / obj.cellSide[window.HVview]);
            var chy = Math.floor( (event.pageY - superDiv.offsetTop - obj.canvas[window.HVview].offsetTop) / obj.cellSide[window.HVview]);

            //are we on the primary of a card that doesn't have a primary, or an empty slot??
            var suppressClick = 0;
            var cardIndex = primaryBin(window.parameters.moduleSizes[window.HVview], chx);
            if( (chy==0 && window.parameters.moduleSizes[window.HVview][cardIndex] == 1) || window.parameters.moduleSizes[window.HVview][cardIndex] == 0 ) suppressClick = 1;

            if(chx<obj.cols[window.HVview] && chx>=0 && chy<obj.rows && chy>=0 && window.onDisplay == obj.canvasID[window.HVview] && suppressClick==0){
                obj.chx = chx;
                obj.chy = chy;
                channelSelect(obj);
            }

}

//map the active grid cooridnates onto MIDAS's channel numbering:
function getMIDASindex(row, col, crate){
    
    var MIDASindex = 0;
    var moduleNumber, i;

    if(row != 0){
        //count up regular channels
        MIDASindex += window.parameters.rows*col + row-1;
        moduleNumber = primaryBin(window.parameters.moduleSizes[crate], col);
        for(i=0; i<moduleNumber+1; i++){
            //add on primary channels
            if(window.parameters.moduleSizes[crate][i] == 4) MIDASindex++;
            //remove overcounting for empty cards:
            if(window.parameters.moduleSizes[crate][i] == 0) MIDASindex -= 12;
        }
    } else{
        moduleNumber = col;
        //add up all the channels from previous cards:
        for(i=0; i<moduleNumber; i++){
            if(window.parameters.moduleSizes[crate][i] == 1) MIDASindex += 12;
            if(window.parameters.moduleSizes[crate][i] == 4) MIDASindex += 49;
        }
        //MIDASindex++;
    }

    return MIDASindex;
}

//given a module number and channel number, return the [row, col] that the corresponding data will be found in in the various waffle.<dataArrays>
function getPointer(module, channel, waffle, crate){
    var i;
    var row = 0;
    var col = 0;

    //column:
    for(i=0; i<module; i++){
        col += Math.max(window.parameters.moduleSizes[crate][i],1);
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
        if(parseInt(moduleSizes[i]) ){
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

//swap from one mainframe view to another:
function swapHVmainframe(inbound){
    var i;

    //if a bar chart is showing, dismiss it:
    if(window.HVpointer.viewStatus >= 0){
        fadeOut('crate'+window.HVview+'bar'+window.HVpointer.viewStatus)
        document.getElementById('crate'+window.HVview+'card'+window.HVpointer.viewStatus).setAttribute('class', 'navLink');
    }
    window.HVpointer.viewStatus = -1;

    //fade canvases:
    fadeOut(window.HVpointer.canvasID[window.HVview]);
    fadeIn(window.HVpointer.canvasID[inbound])

    //highlight buttons
    document.getElementById('Main'+(window.HVview+1)).setAttribute('class', 'navLink');
    document.getElementById('Main'+(inbound+1)).setAttribute('class', 'navLinkDown');
    //switch nav bars
    $('#'+window.HVpointer.linkWrapperID+window.HVview).css('display', 'none');
    $('#'+window.HVpointer.linkWrapperID+inbound).css('display', 'block');
    $('#'+window.HVpointer.linkWrapperID+window.HVview).css('z-index', -1);
    $('#'+window.HVpointer.linkWrapperID+inbound).css('z-index', 10);

    //keep tabs on what's showing where
    window.HVpointer.viewStatus=-1;
    window.HVview = inbound;
    window.onDisplay = window.HVpointer.canvasID[inbound];

    //make sure the waffle is pointing at a channel that actually has something in it before the initial populate:
    window.HVpointer.chy = 1;
    i=0;
    while(window.parameters.moduleSizes[inbound][i] == 0) i++;
    window.HVpointer.chx = i;

    //point the input sidebar at the new crate:
    channelSelect(window.HVpointer);
}

//bar chart response:
function barChartButton(button){
    var inbound;

    button.setAttribute('class', 'navLinkDown');
    if(window.HVpointer.viewStatus >= 0){
        document.getElementById('crate'+window.HVview+'card'+window.HVpointer.viewStatus).setAttribute('class', 'navLink');
    }
    window.HVpointer.viewStatus = button.cardNumber;

    inbound = 'crate'+window.HVview+'bar'+window.HVpointer.viewStatus

    if(inbound != window.onDisplay){
        fadeOut(window.onDisplay);
        fadeIn(inbound);
        window.onDisplay = inbound;
    }
}










