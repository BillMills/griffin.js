function Waffle(callMyself, rows, cols, cvas, alarm, scaleMax, prevAlarmStatus, title, sidebar, side, tooltip, TTcontainer, wrapperDiv, unit, rowTitles, colTitles, InputLayer, prefix, postfix, ODBkeys, alarmPanelDivIDs, alarmPanelCanvIDs, headerDiv, moduleDivisions, moduleLabels){

    if(!document.webkitHidden && !document.mozHidden){
    	var i, j, n;
	    var R, G, B, A;
        var ODBindex;

        //determine dimesions of canvas:
        var totalWidth = Math.round(0.5*$('#'+wrapperDiv).width());
        
        var totalHeight = totalWidth*rows/cols + 100;

        //waffle dimensions; leave gutters for labels & title
        var waffleWidth = totalWidth - 60;
        var waffleHeight = totalHeight - 120;

        //cell dimensions controlled by width, since width more visually important here:
        var cellSide = waffleWidth / cols;

        //set up arrays:
        //ODB info:
        var demandVoltage = [];
        var reportVoltage = [];
        var reportCurrent = [];
        var demandVramp = [];
        var reportTemperature = [];
        var channelMask = [];
        //computed values:
        var endData = [];
        var startColor = [];
        var endColor = [];
        //second dimension:
        for(i=0; i<rows; i++){
            demandVoltage[i] = [];
            reportVoltage[i] = [];
            reportCurrent[i] = [];
            demandVramp[i] = [];
            reportTemperature[i] = [];
            channelMask[i] = [];
        	endData[i] = [];
    	    startColor[i] = [];
        	endColor[i] = [];
        }

        //populate new data:
        for(i=0; i<rows; i++){
    	    for(j=0; j<cols; j++){
                /*commented out for offline demo
                ODBindex = getMIDASindex(rows, cols);
                demandVoltage[i][j] = ODBGet(ODBkeys[0]+'['+ODBindex+']');
                reportVoltage[i][j] = ODBGet(ODBkeys[1]+'['+ODBindex+']');
                reportCurrent[i][j] = ODBGet(ODBkeys[2]+'['+ODBindex+']');
                demandVramp[i][j] = ODBGet(ODBkeys[3]+'['+ODBindex+']');
                reportTemperature[i][j] = ODBGet(ODBkeys[4]+'['+ODBindex+']');
                channelMask[i][j] = ODBGet(ODBkeys[5]+'['+ODBindex+']');
                */
                //fake data for offline demo
                demandVoltage[i][j] = Math.random();
                reportVoltage[i][j] = Math.random();
                reportCurrent[i][j] = Math.random();
                demandVramp[i][j] = Math.random();
                reportTemperature[i][j] = Math.random();
                channelMask[i][j] = Math.random();
                if (channelMask[i][j] < 0.1) channelMask[i][j] = 0;
                else channelMask[i][j] = 1;

                endData[i][j] = Math.abs(demandVoltage[i][j] - reportVoltage[i][j]);
    	   }
        }

        //check if prevAlarmStatus is an array; if not, make a dummy array to start from:
        if( Object.prototype.toString.call( prevAlarmStatus ) !== '[object Array]' ) {
            prevAlarmStatus = [];
            for(i=0; i<rows; i++){
              prevAlarmStatus[i] = []
              for(j=0; j<cols; j++){
                prevAlarmStatus[i][j] = [];
                for(n=0; n<alarm.length; n++){
                    prevAlarmStatus[i][j][n] = 0;
                }
              }
            }
        }

        //determine alarm status for each cell, recorded as [i][j][voltage alarm, current alarm, temperature alarm]
        //alarmStatus == 0 indicates all clear, 0 < alarmStatus <= 1 indicates alarm intensity, alarmStatus = -1 indicates channel off.
        var alarmStatus = [];
        for(i=0; i<rows; i++){
            alarmStatus[i] = [];

            for(j=0; j<cols; j++){
                alarmStatus[i][j] = [];

                if(endData[i][j] < alarm[0])  alarmStatus[i][j][0] = 0;
                else  alarmStatus[i][j][0] = Math.min( (endData[i][j] - alarm[0]) / scaleMax[0], 1);

                if(reportCurrent[i][j] < alarm[1])  alarmStatus[i][j][1] = 0;
                else  alarmStatus[i][j][1] = Math.min( (reportCurrent[i][j] - alarm[1]) / scaleMax[1], 1);

                if(reportTemperature[i][j] < alarm[2])  alarmStatus[i][j][2] = 0;
                else  alarmStatus[i][j][2] = Math.min( (reportTemperature[i][j] - alarm[2]) / scaleMax[2], 1);

                if(channelMask[i][j] == 0){
                    alarmStatus[i][j][0] = -1;
                    alarmStatus[i][j][1] = -1;
                    alarmStatus[i][j][2] = -1;
                }
            }
        }

        //determine per cell color info for start and finish.
        //Color info is packed as four numbers: red, green, blue, alpha
        for(i=0; i<rows; i++){
        	for(j=0; j<cols; j++){
    	      	//start values:
    	        if(prevAlarmStatus[i][j][0] == 0 && prevAlarmStatus[i][j][1] == 0 && prevAlarmStatus[i][j][2] == 0){
    		    	R = 0;
    		      	G = 255;
    		      	B = 0;
    		      	A = 0.3;
                } else if(prevAlarmStatus[i][j][0] == -1){
                    R = 0;
                    G = 0;
                    B = 0;
                    A = 0.3;
                } else {
    			    R = 255;
    			    G = 0;
    			    B = 0;
    			    A = Math.max(prevAlarmStatus[i][j][0], prevAlarmStatus[i][j][1], prevAlarmStatus[i][j][2])*0.7 + 0.3;  //enforce minimum 0.3 to make it clearly red
    			    if(A>1) {A = 1;}
    	        }
                startColor[i][j] = [R,G,B,A];

                //end values:
                if(alarmStatus[i][j][0] == 0 && alarmStatus[i][j][1] == 0 && alarmStatus[i][j][2] == 0){
                    R = 0;
                    G = 255;
                    B = 0;
                    A = 0.3;
                } else if(alarmStatus[i][j][0] == -1){
                    R = 0;
                    G = 0;
                    B = 0;
                    A = 0.3;
                } else {
                    R = 255;
                    G = 0;
                    B = 0;
                    A = Math.max(alarmStatus[i][j][0], alarmStatus[i][j][1], alarmStatus[i][j][2])*0.7 + 0.3;  //enforce minimum 0.3 to make it clearly red
                    if(A>1) {A = 1;}
                }
                endColor[i][j] = [R,G,B,A];
    	    }
        }
/*
        //abort flag for sidebar if data hasn't changed or if it's changed but is all still below alarm level:
        var flag = 0;
        if(prevAlarmStatus){
            for(i=0; i<rows; i++){
                for(j=0; j<cols; j++){
                    for(n=0; n<alarmStatus[i][j].length; n++){
                        if(prevAlarmStatus[i][j][n] != alarmStatus[i][j][n]) flag = 1;
                    }
                }
            }
        } else{
            flag = 1;
        }
*/
        //make waffles clickable to set a variable for a channel:
        var canvas = document.getElementById(cvas);
        var context = canvas.getContext('2d');
        canvas.onclick = function(event){

            var superDiv = document.getElementById(wrapperDiv);
            var inputDiv = document.getElementById(InputLayer);

            //form coordinate system chx, chy with origin at the upper left corner of the div, and 
            //bin as the waffle binning: 
            var chx = Math.floor( (event.pageX - superDiv.offsetLeft - canvas.offsetLeft) / cellSide);
            var chy = Math.floor( (event.pageY - superDiv.offsetTop - canvas.offsetTop) / cellSide);

            if(chx<cols && chy<rows){
                channelSelect(wrapperDiv, InputLayer, chx, chy, rowTitles, colTitles, title, unit, channelMask, demandVoltage, demandVramp, rows, cols, event);
            }

        }
        //bind the fetch button behavior here:
        
        var getChannel = document.getElementById('getChannelButton');
        getChannel.onclick = function(event){
            gotoNewChannel(wrapperDiv, InputLayer, rowTitles, colTitles, title, unit, channelMask, demandVoltage, demandVramp, rows, cols, callMyself);
        }

        //also, draw the input sidebar for 0,0 on first call:
        if(!callMyself){
            channelSelect(wrapperDiv, InputLayer, 0, 0, rowTitles, colTitles, title, unit, channelMask, demandVoltage, demandVramp, rows, cols);
        }
        
        
        DrawWaffle(cvas, headerDiv, startColor, endColor, 1, title, rows, cols, totalWidth, totalHeight, cellSide, moduleDivisions, moduleLabels);
        AlarmSidebar(sidebar[0], side[0], wrapperDiv, waffleHeight, prevAlarmStatus, alarmStatus, rows, cols, rowTitles, colTitles, callMyself, alarmPanelDivIDs, alarmPanelCanvIDs, demandVoltage, reportVoltage, reportCurrent, reportTemperature, alarm, ['V', 'mA', 'C']);
        decorateInputSidebar(sidebar[1], side[1], wrapperDiv, waffleHeight);
        Tooltip(cvas, wrapperDiv, tooltip, TTcontainer, rows, cols, cellSide, rowTitles, colTitles, prefix, postfix, demandVoltage, reportVoltage, reportCurrent, demandVramp);
        gotoNewChannel(wrapperDiv, InputLayer, rowTitles, colTitles, title, unit, channelMask, demandVoltage, demandVramp, rows, cols, callMyself);

    } else {
        //make sure endData is defined for the next call to Waffle; keep the same one so the first transition after focus returns is smooth.        
        var alarmStatus = prevAlarmStatus;
    }

    //repeat every update interval:
    setTimeout(function(){Waffle(1, rows, cols, cvas, alarm, scaleMax, alarmStatus, title, sidebar, side, tooltip, TTcontainer, wrapperDiv, unit, rowTitles, colTitles, InputLayer, prefix, postfix, ODBkeys, alarmPanelDivIDs, alarmPanelCanvIDs, headerDiv, moduleDivisions, moduleLabels)},10000);

}

function DrawWaffle(cvas, headerDiv, startColor, endColor, frame, title, rows, cols, totalWidth, totalHeight, cellSide, moduleDivisions, moduleLabels){

	var FPS = 30;
	var duration = 0.5;
    var nFrames = FPS*duration;

	var i, j;
	var R, G, B, A;
	var color;

	var cornerX, cornerY;

    //fetch canvas:
    var canvas = document.getElementById(cvas);
    var context = canvas.getContext('2d');

    //adjust canvas to fit:
    $('#'+cvas).attr('width', totalWidth);
    $('#'+cvas).attr('height', totalHeight);
    var headerHeight = $('#'+headerDiv).height() + 10;
    $(document.getElementById(cvas)).css('top', headerHeight);

    context.globalAlpha = 1;

    context.fillStyle = "rgba(255,255,255,1)"
    context.fillRect(0,0,totalWidth,totalHeight);

    for(i=0; i<rows; i++){
    	for(j=0; j<cols; j++){
		    R = startColor[i][j][0] + (endColor[i][j][0] - startColor[i][j][0])*frame/nFrames;
    		G = startColor[i][j][1] + (endColor[i][j][1] - startColor[i][j][1])*frame/nFrames;
    		B = startColor[i][j][2] + (endColor[i][j][2] - startColor[i][j][2])*frame/nFrames;
    		A = startColor[i][j][3] + (endColor[i][j][3] - startColor[i][j][3])*frame/nFrames;
    		color = "rgba("+R+","+G+","+B+","+A+")";
    		context.fillStyle = color;
    		cornerX = j*cellSide;
    		cornerY = i*cellSide;    		
    		context.fillRect(cornerX, cornerY,cellSide,cellSide);
    	}
    }

    DrawWaffleDecorations(cvas, rows, cols, cellSide, moduleDivisions);
    DrawWaffleLabels(cvas, title, rows, cols, cellSide, moduleDivisions, moduleLabels);

    if(frame < nFrames){
    	frame++;
    	setTimeout(function(){DrawWaffle(cvas, headerDiv, startColor, endColor, frame, title, rows, cols, totalWidth, totalHeight, cellSide, moduleDivisions, moduleLabels)},duration/FPS);
    }

}

function DrawWaffleDecorations(cvas, rows, cols, cellSide, moduleDivisions){
    //fetch canvas:
    var canvas = document.getElementById(cvas);
    var context = canvas.getContext('2d');

    var i, j;

    var modDivCopy = [];
    for(i=1; i < moduleDivisions.length; i++){
        modDivCopy[i-1] = moduleDivisions[i];
    }

    //style lines:
    context.fillStyle = 'rgba(0,0,0,1)';
    context.lineWidth = 1;

    //draw border:
	context.beginPath();
	context.moveTo(0,0);
	context.lineTo(0,cellSide*rows);
	context.lineTo(cellSide*cols,cellSide*rows);
	context.lineTo(cellSide*cols,0);
	context.lineTo(0,0);
    context.stroke();

    //draw inner lines:
	for(i=1; i<rows; i++){
        context.beginPath();
        context.lineWidth = 1;
		context.moveTo(0,i*cellSide);
		context.lineTo(cellSide*cols,i*cellSide);
        context.stroke();		
	}
    for(j=1; j<cols; j++){
        context.beginPath();
        if(j==modDivCopy[0]){
            context.lineWidth = 3;
            modDivCopy.shift();
        }
        else context.lineWidth = 1;
        context.moveTo(j*cellSide,0);
        context.lineTo(j*cellSide,cellSide*rows);
        context.stroke();
    }

}

function DrawWaffleLabels(cvas, title, rows, cols, cellSide, moduleDivisions, moduleLabels){
    var i, j;
    var moduleWidth, modRotation, modAlign, modHeight;

    //fetch canvas:
    var canvas = document.getElementById(cvas);
    var context = canvas.getContext('2d');


    //Tie title font size to plot size:
    var titleFontSize = Math.min(30, context.canvas.width*0.08);
    //make title:
    context.font=titleFontSize+"px Times New Roman";
    context.fillStyle = 'black';
    context.globalAlpha = 0.6;
    //context.fillText(title, cols*cellSide/2 - context.measureText(title).width/2, rows*cellSide+70);

    //channel labels:
    var labelFontSize = Math.min(16, cellSide);
    context.font=labelFontSize+"px Times New Roman";
    for(i=0; i<rows; i++){
        context.fillText(i, cellSide*cols+10, i*cellSide + cellSide/2 +8 );
    }
    for(j=0; j<cols; j++){
        context.save();
        context.translate(j*cellSide + cellSide/2, rows*cellSide+10);
        context.rotate(-Math.PI/2);
        context.textAlign = "right";
        context.fillText(j, 0,labelFontSize/2);
        context.restore();
    }

    //module labels:
    for(j=1; j<moduleDivisions.length; j++){
        var moduleWidth = moduleDivisions[j] - moduleDivisions[j-1];

        if(moduleWidth*cellSide < context.measureText(moduleLabels[j-1]).width){
            modRotation = -Math.PI/2.5;
            modAlign = 'right';
            modHeight = 0;
        } else {
            modRotation = 0;
            modAlign = 'center';
            modHeight = labelFontSize;
        }
        context.save();
        context.translate(( moduleWidth/2 + moduleDivisions[j-1])*cellSide, rows*cellSide+10+2*labelFontSize + modHeight);
        context.rotate(modRotation);
        context.textAlign = modAlign;
        context.fillText(moduleLabels[j-1], 0,labelFontSize/2);
        context.restore();
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
