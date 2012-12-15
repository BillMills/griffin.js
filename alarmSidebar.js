/*
title:  "<title> Alarms" will head the sidebar.
sidebar: canvas ID to put the sidebar in.
side: 'left' or 'right', to format spacing and gutters nicely.
frame: initialize to 1, counts frames as animation proceeds. 
wrapperDiv: ID string of the div the sidebar is wrapped in.
waffleHeight: height in px of the center content (for drawing nice gutter lines).
data: a 2D array constructed as data[row][column], which contains the value of the meter at that position.
unit: string indicating the units the measurement is made in.
rows: number of rows (meter banks) for monitoring waffles (meter bank sets).
cols: number of columns (meters per bank) for monitoring waffles (meter bank sets).
alarm: alarm threshold value.
callMyself: initialize to 0, indicates whether AlarmSidebar was called by something else, or by its internal recursion.
*/
function AlarmSidebar(title, sidebar, side, frame, wrapperDiv, waffleHeight, prevAlarmStatus, alarmStatus, unit, rows, cols, alarm, rowTitles, colTitles, callMyself, alarmPanelDivIDs, alarmPanelCanvIDs){

    var i, j, n;

    //abort if nothing to update:
    //if(flag===0) return;

    //number of alarms to report:
    //var nAlarms = 5;
/*
    //find the worst channels:
    function sortFunction(a,b){
        if (a[2] > b[2]) return -1;
        if (a[2] < b[2]) return 1;
        else return 0;
    }
    var dataSet = [];
    n = 0;
    for(i=0; i<rows; i++){
        for(j=0; j<cols; j++) {
            if(channelMask[i][j] === 1){
                dataSet[n] = [];
                dataSet[n][0] = i;
                dataSet[n][1] = j;
                dataSet[n][2] = data[i][j];
                n++;                
            }
        }
    }
    dataSet.sort(sortFunction);

    //don't let nAlarms overshoot length of dataset:
    nAlarms = Math.min(nAlarms, dataSet.length);
*/
    //fetch canvas:
    var canvas = document.getElementById(sidebar);
    var context = canvas.getContext('2d');

    //get container div dimensions:
    var parentWidth = $('#'+wrapperDiv).width();
    var parentHeight = $('#'+wrapperDiv).height();

    //define sidebar dimensions:
    var width = parentWidth*0.2;
    var height = parentHeight;

    //set sidebar dimensions first time:
    if(!callMyself){
       canvas.width = width;
       canvas.height = height;
    }

    //define animation parameters
    //var FPS = 30;
    //var duration = 2; //in seconds
    //var nFrames = FPS*duration;

    //final text opacity:
    //var opacity = 0.6;
    //text opacity at this frame:
    //var alphaB = opacity*frame/nFrames
    //whiteout opacity: (designed so something fading into itself looks static, 
    //for white background / old black drawing of alpha=opacity / new whiteout 
    //layer with alphaW / new black layer with alphaB; works best for black on white.)
    //var alphaW = (1-opacity)*alphaB / (1-alphaB) / opacity;

    //separator line inset
    var inset = 0.1*width;

    //title margin
    //context.font="20px Times New Roman";
    //var leftTitle = width/2 - context.measureText(title+' Alarms').width/2 - inset;
    //var rightTitle = width/2 - context.measureText(title+' Alarms').width/2;
    //title header
    //var headTitle = 0.15*height

    //margins of body text:
    //var leftMargin = 1.2*leftTitle;//width*0.2; 
    //var rightMargin = 1.2*rightTitle;//width*0.15 + inset;

    //body text line height:
    //var lineHeight = 20;

    //top of body text:
    //var textTop = headTitle + 2*lineHeight;//0.19*height;

    //fade out last panel:
    //context.fillStyle = "rgba(255,255,255,"+alphaW+")"
    //context.fillRect(inset*1.1,.15*height+10,width-3*inset,height);

    //draw separator line & scale sidebar
    if(!callMyself){
        //separator line:
        context.strokeStyle = "rgba(0,0,0,0.2)"
        context.beginPath();
        if(side === "left"){
            context.moveTo(width-inset,10);
            context.lineTo(width-inset,waffleHeight*1.3);
        } else if(side === "right"){
            context.moveTo(inset,10);
            context.lineTo(inset,waffleHeight*1.3);
        }
        
        context.stroke();

        //scale:
        for(i=0; i<alarmPanelDivIDs.length; i++){
            $( document.getElementById(alarmPanelDivIDs[i]) ).css('width', 0.8*width);
            $( document.getElementById(alarmPanelCanvIDs[i]) ).css('width', 0.8*width);
        }
    }


/*
    if(side==='left'){
        //generate sidebar content:
        context.font="18px Times New Roman";
        context.fillStyle = "rgba(0,0,0,"+alphaB+")";

        for(i=0; i<nAlarms; i++){
            if(dataSet[i][2]>=alarm){
                //context.fillText(i+1+'.  Channel '+dataSet[i][0]+', '+dataSet[i][1]+': ', leftMargin, textTop+lineHeight*i*3);
                context.fillText(i+1+'.  '+rowTitles[0]+' '+rowTitles[dataSet[i][0]+1]+', '+colTitles[0]+' '+colTitles[dataSet[i][1]+1]+': ', leftMargin, textTop+lineHeight*i*3);
                context.fillText('     '+Math.round(dataSet[i][2]*1000)/1000+' '+unit, leftMargin, textTop+lineHeight*(i*3+1));        
            }
        }

        //if no alarms, display an all-clear icon:
        if(dataSet[0][2] < alarm){
            drawAllClear(side, inset, context, alphaB, headTitle, width)
        }

        //Make sidebar title:
        if(!callMyself){
            context.font="20px Times New Roman";
            context.fillStyle = "rgba(0,0,0,"+opacity+")";
            context.fillText(title+" Alarms", leftTitle, headTitle);
        }

    } 

    if(side==='right'){
        //generate sidebar content:
        context.font="18px Times New Roman";
        context.fillStyle = "rgba(0,0,0,"+alphaB+")";

        for(i=0; i<nAlarms; i++){
            if(dataSet[i][2]>=alarm){
                //context.fillText(i+1+'.  Channel '+dataSet[i][0]+', '+dataSet[i][1]+': ', rightMargin, textTop+lineHeight*i*3);
                context.fillText(i+1+'.  '+rowTitles[0]+' '+rowTitles[dataSet[i][0]+1]+', '+colTitles[0]+' '+colTitles[dataSet[i][1]+1]+': ', rightMargin, textTop+lineHeight*i*3);
                context.fillText('     '+Math.round(dataSet[i][2]*1000)/1000+' '+unit, rightMargin, textTop+lineHeight*(i*3+1));        
            }
        }

        //if no alarms, display an all-clear icon:
        if(dataSet[0][2] < alarm){
            drawAllClear(side, inset, context, alphaB, headTitle, width)
        }

        //Make sidebar title:
        if(!callMyself){
            context.font="20px Times New Roman";
            context.fillStyle = "rgba(0,0,0,"+opacity+")";
            context.fillText(title+" Alarms", rightTitle, headTitle);
        }

    }


    if(frame < nFrames){
        frame++;
        setTimeout(function(){AlarmSidebar(title, sidebar, side, frame, wrapperDiv, waffleHeight, data, channelMask, unit, rows, cols, alarm, rowTitles, colTitles, callMyself)},duration/FPS);
    }
*/


    //draw the appropriate status summary badge in each window:
    var isAlarm, oldAlarm;
    var alarmTitles = ['Voltage Alarms', 'Current Alarms', 'Temperature Alarms'];
    for(n=0; n<alarmStatus[0][0].length; n++){
        isAlarm = 0;
        oldAlarm = 0;
        for(i=0; i<rows; i++){
            for(j=0; j<cols; j++){
                if(alarmStatus[i][j][n] > 0) isAlarm = 1;
                if(prevAlarmStatus[i][j][n] > 0) oldAlarm = 1;
            }
        }

        var allClear = curry(drawAllClear, 70,75,50,alarmTitles[n]);
        var alarmTrip = curry(drawAlarm, 70,90,100,alarmTitles[n]);

        if(oldAlarm != isAlarm || !callMyself){

            if(isAlarm == 1){
                //drawAlarm(70, 90, 100, alarmTitles[n], alarmPanelCanvIDs[n], 1);
                fadeSwapCanvas(alarmPanelCanvIDs[n], allClear, alarmTrip, 0);
            }
            else{
                //fadeSwapCanvas(alarmPanelCanvIDs[n], drawAlarm, drawAllClear, 0);
                fadeSwapCanvas(alarmPanelCanvIDs[n], alarmTrip, allClear, 0);
            }
        }

    }


    return;
}

function drawAllClear(x0, y0, radius, title, canvasID, alphaB){
            var canvas = document.getElementById(canvasID);
            var context = canvas.getContext('2d');

            context.font=(radius*0.6)+"px Times New Roman";    

            context.strokeStyle = "rgba(0,0,0,"+alphaB+")";
            context.lineWidth = 5;
            context.beginPath();
            context.arc(x0+1, y0+1, radius, 0, 2*Math.PI);
            context.moveTo(x0-17+1, y0 +2+1);
            context.lineTo(x0-17+10+1, y0 +2+10+1);
            context.lineTo(x0-17+10+30+1, y0 +2+10-30+1);
            context.stroke();
/*
            context.beginPath();
            context.moveTo(2+1,2+1);
            context.lineTo(canvas.width-2+1, 2+1);
            context.lineTo(canvas.width-2+1, canvas.height-2+1);
            context.lineTo(2+1, canvas.height-2+1);
            context.closePath();
            context.stroke();
*/
            context.strokeStyle = "rgba(0,255,0,"+alphaB+")";
            context.lineWidth = 5;
            context.beginPath();
            context.arc(x0, y0, radius, 0, 2*Math.PI);
            context.moveTo(x0-17, y0 +2);
            context.lineTo(x0-17+10, y0 +2+10);
            context.lineTo(x0-17+10+30, y0 +2+10-30);
            context.stroke();
/*
            context.beginPath();
            context.moveTo(2,2);
            context.lineTo(canvas.width-2, 2);
            context.lineTo(canvas.width-2, canvas.height-2);
            context.lineTo(2, canvas.height-2);
            context.closePath();
            context.stroke();
*/
            context.fillStyle = 'rgba(0,0,0,1)';
            context.font=(2*radius*0.24)+'px Times New Roman';
            context.fillText(title, 0.5*canvas.width - context.measureText(title).width/2+1, canvas.height*0.5+1);

            context.fillStyle = 'rgba(255,255,255,1)';
            context.fillText(title, 0.5*canvas.width - context.measureText(title).width/2, canvas.height*0.5);
            
}

function drawAlarm(x0, y0, L, title, canvasID, alphaB){
            var canvas = document.getElementById(canvasID);
            var context = canvas.getContext('2d');

            context.font=(L*0.6)+"px Times New Roman";

            context.strokeStyle = "rgba(0,0,0,"+alphaB+")";
            context.fillStyle = "rgba(0,0,0,"+alphaB+")";
            context.lineWidth = 5;
            context.beginPath();
            context.moveTo(x0 - L/2+1, y0+L/2*Math.tan(Math.PI/6)+1);
            context.lineTo(x0+1, y0 - L/2/Math.cos(Math.PI/6)+1);
            context.lineTo(x0 + L/2+1, y0 + L/2*Math.tan(Math.PI/6)+1);
            context.closePath();
            context.fillText('!', x0-10+1, y0+1+10);
            context.stroke();
/*
            context.beginPath();
            context.moveTo(2+1,2+1);
            context.lineTo(canvas.width-2+1, 2+1);
            context.lineTo(canvas.width-2+1, canvas.height-2+1);
            context.lineTo(2+1, canvas.height-2+1);
            context.closePath();
            context.stroke();
*/
            context.strokeStyle = "rgba(255,0,0,"+alphaB+")";
            context.fillStyle = "rgba(255,0,0,"+alphaB+")";
            context.lineWidth = 5;
            context.beginPath();
            context.moveTo(x0 - L/2, y0+L/2*Math.tan(Math.PI/6));
            context.lineTo(x0, y0 - L/2/Math.cos(Math.PI/6));
            context.lineTo(x0 + L/2, y0 + L/2*Math.tan(Math.PI/6));
            context.closePath();
            context.fillText('!', x0-10, y0+10);
            context.stroke();
/*
            context.beginPath();
            context.moveTo(2,2);
            context.lineTo(canvas.width-2, 2);
            context.lineTo(canvas.width-2, canvas.height-2);
            context.lineTo(2, canvas.height-2);
            context.closePath();
            context.stroke();
*/
            context.fillStyle = 'rgba(0,0,0,1)';
            context.font=(L*0.24)+'px Times New Roman';
            context.fillText(title, 0.5*canvas.width - context.measureText(title).width/2+1, canvas.height*0.5+1);

            context.fillStyle = 'rgba(255,255,255,1)';
            context.fillText(title, 0.5*canvas.width - context.measureText(title).width/2, canvas.height*0.5);
}

function decorateInputSidebar(sidebar, side, wrapperDiv, waffleHeight){

    //fetch canvas:
    var canvas = document.getElementById(sidebar);
    var context = canvas.getContext('2d');

    //get container div dimensions:
    var parentWidth = $('#'+wrapperDiv).width();
    var parentHeight = $('#'+wrapperDiv).height();

    //define sidebar dimensions:
    var width = parentWidth*0.2;
    var height = parentHeight;

    //set sidebar dimensions:
    canvas.width = width;
    canvas.height = height;

    //separator line inset
    var inset = 0.1*width;

    //draw separator line
    context.strokeStyle = "rgba(0,0,0,0.2)"
    context.beginPath();
    if(side === "left"){
        context.moveTo(width-inset,10);
        context.lineTo(width-inset,waffleHeight*1.3);
    } else if(side === "right"){
        context.moveTo(inset,10);
        context.lineTo(inset,waffleHeight*1.3);
    }
        
    context.stroke();
    

}

//draw old and new canvases accept exactly two arguments: the canvas ID to draw on, and the opacity to draw the picture at.
//use curry to boil down drawing functions to just these two arguments!
function fadeSwapCanvas(cvasID, drawOldCanvas, drawNewCanvas, frame){
    //fetch canvases:
    var canvas = document.getElementById(cvasID);
    var context = canvas.getContext('2d');

    //animation parameters:
    var FPS = 30;
    var duration = 1; //seconds
    var nFrames = FPS*duration;

    var opacity = frame / nFrames;  //opacity of final state

    context.clearRect(0,0,canvas.width, canvas.height);
    //partial(drawOldCanvas, 70,90,100,'', cvasID, 1-opacity )();
    //partial(drawNewCanvas, 70,75,50,'',cvasID, opacity )();
    partial(drawOldCanvas, cvasID, 1-opacity )();
    partial(drawNewCanvas, cvasID, opacity )();

    if(frame<nFrames){
        frame++;
        setTimeout(function(){fadeSwapCanvas(cvasID, drawOldCanvas, drawNewCanvas, frame)},duration/FPS*1000);
    }
    
}

