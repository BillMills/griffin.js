function Waffle(rows, cols, cvas, alarm, scaleMax, sidebar, tooltip, TTcontainer, wrapperDiv, rowTitles, colTitles, InputLayer, prefix, postfix, ODBkeys, alarmPanelDivIDs, alarmPanelCanvIDs, headerDiv, moduleDivisions, moduleLabels, voltageSlider, rampSlider){

        //if(!document.webkitHidden && !document.mozHidden){
    	var i, j, n;

        //pointer voodoo:
        var that = this;

        //member data:
        this.rows = rows;                           //number of rows in the waffle
        this.cols = cols;                           //numver of columns in the waffle
        this.cvas = cvas;                           //canvas ID to draw the waffle on
        this.alarm = alarm;                         //array of alarm thresholds: [voltage, current, temperature]
        this.scaleMax = scaleMax;                   //array of scale maxima: [voltage, current, temperature]
        this.alarmStatus;                           //array containing the current alarm status
        this.prevAlarmStatus;                       //previous iteration's alarmStatus
        this.alarmStatus;                           //2D array containing the alarm level for each cell
        this.sidebar = sidebar;                     //array containing canvas IDs of left and right sidebars, [leftID, rightID]
        this.side = ['left', 'right']               //TODO: depricate
        this.tooltip = tooltip;                     //div ID of floating tooltip
        this.TTcontainer = TTcontainer;             //div ID of tooltip field
        this.wrapperDiv = wrapperDiv;               //div ID of top level div
        this.rowTitles = rowTitles;                 //array of titles for rows
        this.colTitles = colTitles;                 //array of titles for columns
        this.InputLayer = InputLayer;               //div ID of wrapper for input fields
        this.prefix = prefix;                       //array of strings describing the prefix of each line of info in the tooltip
        this.postfix = postfix;                     //array of strings describing the postfix of each line of info in the tooltip
        this.ODBkeys = ODBkeys;                     //array of strings describing the locations of relevant info in ODB: ['/Location/Of/demandVoltage', '/Location/Of/reportVoltage', '/Location/Of/reportCurrent', '/Location/Of/VoltageRampSpeed', '/Location/Of/reportTemperature', '/Location/Of/ChannelOnOffState']
        this.alarmPanelDivIDs = alarmPanelDivIDs;   //array containing IDs of alarm panel divs
        this.alarmPanelCanvIDs = alarmPanelCanvIDs; //array containing IDs of alarm panel canvases
        this.headerDiv = headerDiv;                 //div ID of waffle header
        this.moduleDivisions = moduleDivisions;     //array containing card numbers that divide modules
        this.moduleLabels = moduleLabels;           //array containing module labels
        this.chx = 0;                               //x channel of input sidebar focus
        this.chy = 0;                               //y channel of input sidebar focus
        this.voltageSlider = voltageSlider;         //demand voltage slider associated with this waffle
        this.rampSlider = rampSlider;               //voltage ramp speed slider associated with this waffle

        //determine dimesions of canvas:
        this.totalWidth = Math.round(0.5*$('#'+this.wrapperDiv).width());
        this.totalHeight = this.totalWidth*this.rows/this.cols;  //base height

        //waffle dimensions; leave gutters for labels & title
        this.waffleWidth = this.totalWidth - 60;
        this.waffleHeight = this.totalHeight;

        //cell dimensions controlled by width, since width more visually important here:
        this.cellSide = this.waffleWidth / this.cols;

        //adjust height to accommodate card and module labels:
        this.canvas = document.getElementById(this.cvas);
        this.context = this.canvas.getContext('2d');
        this.context.font = Math.min(16, this.cellSide)+'px Raleway';
        this.longestColTitle = 0;
        this.longestModuleLabel = 0;
        for(i = 1; i<this.colTitles.length; i++){
            this.longestColTitle = Math.max(this.longestColTitle, this.context.measureText(this.colTitles[i]).width);
            this.longestModuleLabel = Math.max(this.longestModuleLabel, this.context.measureText(this.moduleLabels[i]).width);
        }
        this.totalHeight += this.longestColTitle + this.longestModuleLabel + 50;

        //establish animation parameters:
        this.FPS = 30;
        this.duration = 0.5;
        this.nFrames = this.FPS*this.duration;

        //style card nav buttons
        this.newRule = "button.cardNav{width:"+0.9*this.cellSide+"px; height:"+0.9*this.cellSide+"px; margin-right:"+0.05*this.cellSide+"px; margin-left:"+0.05*this.cellSide+"px; float:left; background: -webkit-gradient(linear, left top, left bottom, from(#DDDDDD), to(#FFFFFF)); background: -moz-linear-gradient(top,  #DDDDDD,  #FFFFFF); -webkit-border-radius: 5; -moz-border-radius: 5; border-radius: 5; font-size:"+this.cellSide/4+"px; padding:0px}";
        document.styleSheets[0].insertRule(this.newRule,0);

        //header size:
        this.headerHeight = $('#'+this.headerDiv).height();
        //make the vertical spacing between the waffle and nav header nice:
        $('#'+this.cvas).css('top', (this.headerHeight+this.cellSide/5)+'px !important;' );

        //set up arrays:
        //ODB info:
        this.demandVoltage = [];
        this.reportVoltage = [];
        this.reportCurrent = [];
        this.demandVramp = [];
        this.reportTemperature = [];
        this.channelMask = [];
        this.rampStatus = [];
        //computed values:
        this.startColor = [];
        this.endColor = [];
        //second dimension:
        for(i=0; i<this.rows; i++){
            this.demandVoltage[i] = [];
            this.reportVoltage[i] = [];
            this.reportCurrent[i] = [];
            this.demandVramp[i] = [];
            this.reportTemperature[i] = [];
            this.channelMask[i] = [];
            this.rampStatus[i] = [];
    	    this.startColor[i] = [];
        	this.endColor[i] = [];
        }

        //declare alarmStatus and prevAlarmStatus as arrays of appropriate dimension:
        this.alarmStatus = [];
        this.prevAlarmStatus = [];
        for(i=0; i<this.rows; i++){
            this.alarmStatus[i] = [];
            this.prevAlarmStatus[i] = [];
            for(j=0; j<this.cols; j++){
                this.alarmStatus[i][j] = [];
                this.prevAlarmStatus[i][j] = [];
                for(var n=0; n<this.alarm.length; n++){
                    this.alarmStatus[i][j][n] = 0;
                    this.prevAlarmStatus[i][j][n] = 0;
                }
            }
        }

        //do an initial populate of the waffle:
        fetchNewData(this.rows, this.cols, this.ODBkeys, this.demandVoltage, this.reportVoltage, this.reportCurrent, this.demandVramp, this.reportTemperature, this.channelMask, this.alarmStatus, this.rampStatus, this.alarm, this.scaleMax);

        //make waffles clickable to set a variable for a channel:
        this.canvas.onclick = function(event){clickWaffle(event, that)};

        //make the get channel button do its job:
        document.getElementById('getChannelButton').onclick = function(event){changeChannelButton(event, that)};

        //also, draw the input sidebar for 0,0 on first call:
        channelSelect(that);

        //que up new data:
        this.populate = function(demandVoltage, reportVoltage, reportCurrent, demandVramp, reportTemperature, channelMask, alarmStatus, rampStatus){
            //populate new data:
            for(var i=0; i<this.rows; i++){
                for(var j=0; j<this.cols; j++){

                    this.demandVoltage[i][j] = demandVoltage[i][j];
                    this.reportVoltage[i][j] = reportVoltage[i][j];
                    this.reportCurrent[i][j] = reportCurrent[i][j];
                    this.demandVramp[i][j] = demandVramp[i][j];
                    this.reportTemperature[i][j] = reportTemperature[i][j];
                    this.channelMask[i][j] = channelMask[i][j];
                    this.rampStatus[i][j] = rampStatus[i][j];

                    this.prevAlarmStatus[i][j][0] = this.alarmStatus[i][j][0];
                    this.prevAlarmStatus[i][j][1] = this.alarmStatus[i][j][1];
                    this.prevAlarmStatus[i][j][2] = this.alarmStatus[i][j][2];

                    this.alarmStatus[i][j][0] = alarmStatus[i][j][0];
                    this.alarmStatus[i][j][1] = alarmStatus[i][j][1];
                    this.alarmStatus[i][j][2] = alarmStatus[i][j][2];
                }
            }

        };
        
        //determine per cell color info for start and finish.
        //Color info is packed as four numbers: red, green, blue, alpha
        this.cellColorUpdate = function(){
            var R, G, B, A;
            for(var i=0; i<this.rows; i++){
            	for(var j=0; j<this.cols; j++){
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
                    this.endColor[i][j] = [R,G,B,A];
    	       }
            }
        };

        //formerly drawWaffle:
        this.draw = function(frame){

            var i, j;
            var R, G, B, A;
            var color;

            var cornerX, cornerY;

            //adjust canvas to fit:
            $('#'+this.cvas).attr('width', this.totalWidth);
            $('#'+this.cvas).attr('height', this.totalHeight);
            //var headerHeight = $('#'+this.headerDiv).height() + 10;
            $(document.getElementById(this.cvas)).css('top', this.headerHeight);

            //whiteout old canvas:
            this.context.globalAlpha = 1;
            this.context.fillStyle = "rgba(255,255,255,1)"
            this.context.fillRect(0,0,this.totalWidth,this.totalHeight);

            for(i=0; i<this.rows; i++){
                for(j=0; j<this.cols; j++){
                    R = this.startColor[i][j][0] + (this.endColor[i][j][0] - this.startColor[i][j][0])*frame/this.nFrames;
                    G = this.startColor[i][j][1] + (this.endColor[i][j][1] - this.startColor[i][j][1])*frame/this.nFrames;
                    B = this.startColor[i][j][2] + (this.endColor[i][j][2] - this.startColor[i][j][2])*frame/this.nFrames;
                    A = this.startColor[i][j][3] + (this.endColor[i][j][3] - this.startColor[i][j][3])*frame/this.nFrames;
                    color = "rgba("+R+","+G+","+B+","+A+")";
                    this.context.fillStyle = color;
                    cornerX = j*this.cellSide;
                    cornerY = i*this.cellSide;           
                    this.context.fillRect(cornerX, cornerY,this.cellSide,this.cellSide);
                }
            }

            this.drawWaffleDecorations();
            this.drawWaffleLabels();
        };

        this.drawWaffleDecorations = function(){

            var i, j;

            var modDivCopy = [];
            for(i=1; i < this.moduleDivisions.length; i++){
                modDivCopy[i-1] = this.moduleDivisions[i];
            }

            //style lines:
            this.context.fillStyle = 'rgba(0,0,0,1)';
            this.context.lineWidth = 1;

            //draw border:
            this.context.beginPath();
            this.context.moveTo(0,0);
            this.context.lineTo(0,this.cellSide*this.rows);
            this.context.lineTo(this.cellSide*this.cols,this.cellSide*this.rows);
            this.context.lineTo(this.cellSide*this.cols,0);
            this.context.lineTo(0,0);
            this.context.stroke();

            //draw inner lines:
            for(i=1; i<this.rows; i++){
                this.context.beginPath();
                this.context.lineWidth = 1;
                this.context.moveTo(0,i*this.cellSide);
                this.context.lineTo(this.cellSide*this.cols,i*this.cellSide);
                this.context.stroke();       
            }
            for(j=1; j<this.cols; j++){
                this.context.beginPath();
                if(j==modDivCopy[0]){
                    this.context.lineWidth = 3;
                    modDivCopy.shift();
                }
                else this.context.lineWidth = 1;
                this.context.moveTo(j*this.cellSide,0);
                if(this.context.lineWidth == 1){
                    this.context.lineTo(j*this.cellSide,this.cellSide*this.rows);
                } else {
                    this.context.lineTo(j*this.cellSide,this.cellSide*this.rows + this.longestColTitle + this.longestModuleLabel + 25);
                }
                this.context.stroke();
            }

            //style card link buttons:
        };

        this.drawWaffleLabels = function(){
            var i, j;
            var moduleWidth, modRotation, modAlign, modHeight;
            
            this.context.fillStyle = 'black';
            this.context.globalAlpha = 0.6;

            //channel labels:
            var labelFontSize = Math.min(16, this.cellSide);
            this.context.font=labelFontSize+"px Raleway";
            for(i=0; i<this.rows; i++){
                this.context.fillText(i, this.cellSide*this.cols+10, i*this.cellSide + this.cellSide/2 +8 );
            }
            for(j=0; j<this.cols; j++){
                this.context.save();
                this.context.translate(j*this.cellSide + this.cellSide/2, this.rows*this.cellSide+10);
                this.context.rotate(-Math.PI/2);
                this.context.textAlign = "right";
                this.context.fillText(this.colTitles[j+1], 0,labelFontSize/2);
                this.context.restore();
            }

            //module labels:
            for(j=1; j<this.moduleDivisions.length; j++){
                var moduleWidth = this.moduleDivisions[j] - this.moduleDivisions[j-1];

                if(moduleWidth*this.cellSide < this.context.measureText(this.moduleLabels[j-1]).width){
                    modRotation = -Math.PI/2;  //2.4
                    modAlign = 'right';
                    modHeight = 0;
                } else {
                    modRotation = 0;
                    modAlign = 'center';
                    modHeight = labelFontSize;
                }
                this.context.save();
                this.context.translate(( moduleWidth/2 + this.moduleDivisions[j-1])*this.cellSide, this.rows*this.cellSide + modHeight + this.longestColTitle + this.longestModuleLabel/2 + 10);
                this.context.rotate(modRotation);
                this.context.textAlign = modAlign;
                this.context.fillText(this.moduleLabels[j-1], 0,labelFontSize/2);
                this.context.restore();
            }
        };        

        //wrapper for transition from old state to new state via this.animate:
        this.update = function(demandVoltage, reportVoltage, reportCurrent, demandVramp, reportTemperature, alarmStatus, channelMask, rampStatus, callMyself){

            //update all parameters to prepare for animation transition:
            this.populate(demandVoltage, reportVoltage, reportCurrent, demandVramp, reportTemperature, channelMask, alarmStatus, rampStatus);
            this.cellColorUpdate();

            //update peripherals:
            AlarmSidebar(this.sidebar[0], this.side[0], this.wrapperDiv, this.waffleHeight, this.prevAlarmStatus, this.alarmStatus, this.rows, this.cols, this.rowTitles, this.colTitles, callMyself, this.alarmPanelDivIDs, this.alarmPanelCanvIDs, demandVoltage, reportVoltage, reportCurrent, reportTemperature, this.alarm, ['V', 'mA', 'C']);
            channelSelect(that);
            Tooltip(this.cvas, this.wrapperDiv, this.tooltip, this.TTcontainer, this.rows, this.cols, this.cellSide, this.rowTitles, this.colTitles, this.prefix, this.postfix, this.demandVoltage, this.reportVoltage, this.reportCurrent, this.demandVramp);

            //animate:
            animate(this, 0);

        };

}

//define behavior of the change channel button:
function changeChannelButton(event, obj){
    gotoNewChannel(event, obj);
}

//define the onclick behavior of the waffle:
function clickWaffle(event, obj){

            var superDiv = document.getElementById(obj.wrapperDiv);
            var inputDiv = document.getElementById(obj.InputLayer);

            //form coordinate system chx, chy with origin at the upper left corner of the div, and 
            //bin as the waffle binning: 
            var chx = Math.floor( (event.pageX - superDiv.offsetLeft - obj.canvas.offsetLeft) / obj.cellSide);
            var chy = Math.floor( (event.pageY - superDiv.offsetTop - obj.canvas.offsetTop) / obj.cellSide);

            obj.chx = chx;
            obj.chy = chy;

            if(chx<obj.cols && chy<obj.rows){
                channelSelect(obj);
            }

}

//map the active grid cooridnates onto MIDAS's channel numbering:
function getMIDASindex(row, col){
    //do something
    return 0;
}

//function to tell if channel i, j is active:
function isChannelOn(i,j){
    return 1;
}
