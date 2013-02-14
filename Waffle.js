function Waffle(rows, cols, cvas, alarm, scaleMax, wrapperDiv, rowTitles, InputLayer, ODBkeys, alarmPanelDivIDs, alarmPanelCanvIDs, headerDiv, moduleSizes, moduleLabels, voltageSlider, rampSlider, rampDownSlider, tooltip, barChartPrecision){

        //if(!document.webkitHidden && !document.mozHidden){
    	var i, j, n, columns;

        //pointer voodoo:
        var that = this;

        //member data:
        this.rows = rows + 1;                       //number of rows in the waffle; +1 for primary row
        this.cols = cols;                           //numver of columns in the waffle
        this.cvas = cvas;                           //canvas ID to draw the waffle on
        this.alarm = alarm;                         //array of alarm thresholds: [voltage, current, temperature]
        this.scaleMax = scaleMax;                   //array of scale maxima: [voltage, current, temperature]
        this.prevAlarmStatus;                       //previous iteration's alarmStatus
        this.alarmStatus;                           //2D array containing the alarm level for each cell
        this.side = ['left', 'right']               //TODO: depricate
        this.wrapperDiv = wrapperDiv;               //div ID of top level div
        this.rowTitles = rowTitles;                 //array of titles for rows
        this.InputLayer = InputLayer;               //div ID of wrapper for input fields
        this.ODBkeys = ODBkeys;                     //array of strings describing the locations of relevant info in ODB
        this.alarmPanelDivIDs = alarmPanelDivIDs;   //array containing IDs of alarm panel divs
        this.alarmPanelCanvIDs = alarmPanelCanvIDs; //array containing IDs of alarm panel canvases
        this.headerDiv = headerDiv;                 //div ID of waffle header
        this.moduleSizes = moduleSizes;             //array containing sizes of modules in groups of 12 channels
        this.moduleLabels = moduleLabels;           //array containing module labels
        this.chx = 1;                               //x channel of input sidebar focus
        this.chy = 1;                               //y channel of input sidebar focus
        this.voltageSlider = voltageSlider;         //demand voltage slider associated with this waffle
        this.rampSlider = rampSlider;               //voltage ramp up speed slider associated with this waffle
        this.rampDownSlider = rampDownSlider;       //voltage ramp down speed slider associated with this waffle
        this.tooltip = tooltip;                     //tooltip this object will use

        //determine dimesions of canvas:
        this.totalWidth = Math.round(0.5*$('#'+this.wrapperDiv).width());
        //cell dimensions controlled by total width, since width more visually important here:
        this.cellSide = (this.totalWidth - 60) / Math.max(20, this.cols);
        this.totalHeight = 16*this.cellSide;   //this.totalWidth*this.rows/this.cols;  //base height

        //waffle dimensions; leave gutters for labels & title
        this.waffleWidth = this.cellSide*this.cols;
        this.waffleHeight = this.totalHeight;

        //adjust height to accommodate card and module labels:
        this.canvas = document.getElementById(this.cvas);
        this.context = this.canvas.getContext('2d');
        this.context.font = Math.min(16, this.cellSide)+'px Raleway';
        this.longestModuleLabel = 0;
        for(i = 0; i<this.moduleLabels.length; i++){
            this.longestModuleLabel = Math.max(this.longestModuleLabel, this.context.measureText(this.moduleLabels[i]).width);
        }
        this.totalHeight += this.longestModuleLabel + 50;

        //want waffle and navbar centered nicely:
        this.leftEdge = (this.totalWidth - (this.waffleWidth + this.context.measureText('Prim').width))/2;

        //establish animation parameters:
        this.FPS = 30;
        this.duration = 0.5;
        this.nFrames = this.FPS*this.duration;

        //style card nav buttons
        var newRule;
        for(i=0; i<moduleLabels.length; i++){
            var buttonWidth;
            buttonWidth = Math.max(moduleSizes[i],1)*0.9*this.cellSide + (Math.max(moduleSizes[i],1)-1)*0.1*this.cellSide;
            //FF freaks out if you try and overwrite a styleSheet :(
            //newRule = "button#card"+i+"{width:"+buttonWidth+"px; height:"+0.9*this.cellSide+"px; margin-right:"+0.05*this.cellSide+"px; margin-left:"+0.05*this.cellSide+"px; margin-top:"+0.05*this.cellSide+"px; float:left; background: -webkit-gradient(linear, left top, left bottom, from(#DDDDDD), to(#FFFFFF)); background: -moz-linear-gradient(top,  #DDDDDD,  #FFFFFF); -webkit-border-radius: 5; -moz-border-radius: 5; border-radius: 5; font-size:"+this.cellSide/4+"px; padding:0px}";
            //document.styleSheets[0].insertRule(newRule,0);
            if(moduleSizes[i] != 0)
                newRule = "width:"+buttonWidth+"px; height:"+0.9*this.cellSide+"px; margin-right:"+0.05*this.cellSide+"px; margin-left:"+0.05*this.cellSide+"px; margin-top:"+0.05*this.cellSide+"px; float:left; background: -webkit-gradient(linear, left top, left bottom, from(#999999), to(#DDDDDD)); background: -moz-linear-gradient(top,  #999999,  #DDDDDD); -webkit-border-radius: 5; -moz-border-radius: 5; border-radius: 5; font-size:"+this.cellSide/4+"px; padding:0px;";
            else 
                newRule = "width:"+buttonWidth+"px; height:"+0.9*this.cellSide+"px; margin-right:"+0.05*this.cellSide+"px; margin-left:"+0.05*this.cellSide+"px; margin-top:"+0.05*this.cellSide+"px; float:left; background: -webkit-gradient(linear, left top, left bottom, from(#999999), to(#DDDDDD)); background: -moz-linear-gradient(top,  #999999,  #DDDDDD); -webkit-border-radius: 5; -moz-border-radius: 5; border-radius: 5; font-size:"+this.cellSide/4+"px; padding:0px;";
            document.getElementById('card'+i).setAttribute('style', newRule);
        }

        //header size:
        this.headerHeight = $('#'+this.headerDiv).height();
        //make the vertical spacing between the waffle and nav header nice:
        $('#'+this.cvas).css('top', (this.headerHeight)+'px !important;' );

        //declare bar charts & canvases to paint them on:
        this.barCharts = [];
        var newCanvas;
        for(i=0; i<moduleSizes.length; i++){
            newCanvas = document.createElement('canvas');
            newCanvas.setAttribute('id', 'bar'+i);
            newCanvas.setAttribute('style', 'position:absolute; left:24%; opacity:0; z-index:-10000;');
            document.getElementById(wrapperDiv).appendChild(newCanvas);
            this.barCharts[i] = new BarGraph('bar'+i, i, Math.max(moduleSizes[i],1)*12, 'Slot '+i, 'Reported Voltage [V]', 0, scaleMax[0], barChartPrecision, that);
        }

        //set up arrays:
        //ODB info:
        this.demandVoltage = [];
        this.reportVoltage = [];
        this.reportCurrent = [];
        this.demandVrampUp = [];
        this.demandVrampDown = [];
        this.reportTemperature = [];
        this.channelMask = [];
        this.rampStatus = [];
        this.voltLimit = [];
        this.currentLimit = [];
        //computed values:
        this.startColor = [];
        this.endColor = [];
        //second dimension:
        for(i=0; i<this.rows; i++){
            this.demandVoltage[i] = [];
            this.reportVoltage[i] = [];
            this.reportCurrent[i] = [];
            this.demandVrampUp[i] = [];
            this.demandVrampDown[i] = [];
            this.reportTemperature[i] = [];
            this.channelMask[i] = [];
            this.rampStatus[i] = [];
            this.voltLimit[i] = [];
            this.currentLimit[i] = [];
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
                for(var n=0; n<this.alarm.length; n++){
                    this.alarmStatus[i][j][n] = 0;
                    this.prevAlarmStatus[i][j][n] = 0;
                }
            }
        }

        //array of values from the waffle to report in the tooltip
        this.reportedValues = [this.demandVoltage, this.reportVoltage, this.reportCurrent, this.demandVrampUp, this.demandVrampDown, this.reportTemperature, this.rampStatus];
        //give the tooltip a pointer back to this object:
        this.tooltip.obj = that;

        //do an initial populate of the waffle:
        fetchNewData(this.rows, this.cols, moduleSizes, this.ODBkeys, this.demandVoltage, this.reportVoltage, this.reportCurrent, this.demandVrampUp, this.demandVrampDown, this.reportTemperature, this.channelMask, this.alarmStatus, this.rampStatus, this.voltLimit, this.currentLimit, this.alarm, this.scaleMax);

        //make waffles clickable to set a variable for a channel:
        this.canvas.onclick = function(event){clickWaffle(event, that)};

        //make the get channel button do its job:
        document.getElementById('getChannelButton').onclick = function(event){changeChannelButton(event, that)};

        //also, draw the input sidebar for 0,0 on first call:
        channelSelect(that);

        //style the input sidebar background:
        document.getElementById('waffleSidebarBKG').width = parseInt(($('#InputLayer').css('width')).slice(0,3));
        document.getElementById('waffleSidebarBKG').height = parseInt($('#InputLayer').css('height').slice(0,3));
        tabBKG('waffleSidebarBKG', 'right');

        //que up new data:
        this.populate = function(demandVoltage, reportVoltage, reportCurrent, demandVrampUp, demandVrampDown, reportTemperature, channelMask, alarmStatus, rampStatus, voltLimit, currentLimit){

            var columns, i, j;

            //populate new data:
            for(i=0; i<this.rows; i++){
                //primary row spans multi-columns:
                if(i==0) columns = this.moduleSizes.length;
                else columns = this.cols;
                for(j=0; j<columns; j++){

                    this.demandVoltage[i][j] = demandVoltage[i][j];
                    this.reportVoltage[i][j] = reportVoltage[i][j];
                    this.reportCurrent[i][j] = reportCurrent[i][j];
                    this.demandVrampUp[i][j] = demandVrampUp[i][j];
                    this.demandVrampDown[i][j] = demandVrampDown[i][j];
                    this.reportTemperature[i][j] = reportTemperature[i][j];
                    this.channelMask[i][j] = channelMask[i][j];
                    this.rampStatus[i][j] = rampStatus[i][j];
                    this.voltLimit[i][j] = voltLimit[i][j];
                    this.currentLimit[i][j] = currentLimit[i][j];

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

            //adjust canvas to fit:
            $('#'+this.cvas).attr('width', this.totalWidth);
            $('#'+this.cvas).attr('height', this.totalHeight);
            //var headerHeight = $('#'+this.headerDiv).height() + 10;
            $(document.getElementById(this.cvas)).css('top', this.headerHeight);

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
        this.update = function(demandVoltage, reportVoltage, reportCurrent, demandVrampUp, demandVrampDown, reportTemperature, alarmStatus, channelMask, rampStatus, voltLimit, currentLimit, callMyself){

            //update all parameters to prepare for animation transition:
            this.populate(demandVoltage, reportVoltage, reportCurrent, demandVrampUp, demandVrampDown, reportTemperature, channelMask, alarmStatus, rampStatus, voltLimit, currentLimit);
            this.cellColorUpdate();

            //update peripherals:
            AlarmSidebar(this.side[0], this.wrapperDiv, this.waffleHeight, this.prevAlarmStatus, this.alarmStatus, this.rows, this.cols, this.rowTitles, callMyself, this.alarmPanelDivIDs, this.alarmPanelCanvIDs, demandVoltage, reportVoltage, reportCurrent, reportTemperature, this.alarm, ['V', 'A', 'C'], this.moduleLabels, this.moduleSizes);
            channelSelect(that);

            //animate:
            //animate(this, 0);

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
                longestLine = Math.max(longestLine, this.tooltip.context.measureText(nextLine).width);

                //append to tooltip:
                toolTipContent += nextLine;
 
            }
            document.getElementById(this.tooltip.ttTextID).innerHTML = toolTipContent;

            //return length of longest line:
            return longestLine;
        };

}

//define behavior of the change channel button:
function changeChannelButton(event, obj){
    window.refreshInput = 1;
    gotoNewChannel(event, obj);
}

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

            if(chx<obj.cols && chx>=0 && chy<obj.rows && chy>=0 && window.onDisplay == obj.cvas && suppressClick==0){
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
