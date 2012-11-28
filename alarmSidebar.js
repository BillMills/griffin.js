/*
title:  "<title> Alarms" will head the sidebar.
sidebar: canvas ID to put the sidebar in.
side: 'left' or 'right', to format spacing and gutters nicely.
frame: initialize to 1, counts frames as animation proceeds. 
wrapperDiv: ID string of the div the sidebar is wrapped in.
waffleHeight: height in px of the center content (for drawing nice gutter lines).
data: a 2D array constructed as data[meter bank][meter], which contains the value of the meter at that position.
unit: string indicating the units the measurement is made in.
rows: number of rows (meter banks) for monitoring waffles (meter bank sets).
cols: number of columns (meters per bank) for monitoring waffles (meter bank sets).
alarm: alarm threshold value.
callMyself: initialize to 0, indicates whether AlarmSidebar was called by something else, or by its internal recursion.
*/
function AlarmSidebar(title, sidebar, side, frame, wrapperDiv, waffleHeight, data, unit, rows, cols, alarm, rowTitles, colTitles, callMyself, flag){

    //abort if nothing to update:
    if(flag===0) return;

    //number of alarms to report:
    var nAlarms = 5;

    //find the worst channels:
    function sortFunction(a,b){
        if (a[2] > b[2]) return -1;
        if (a[2] < b[2]) return 1;
        else return 0;
    }

    var dataSet = [];
    for(i=0; i<rows; i++){
        for(j=0; j<cols; j++) {
            dataSet[i*cols+j] = [];
            dataSet[i*cols+j][0] = i;
            dataSet[i*cols+j][1] = j;
            dataSet[i*cols+j][2] = data[i][j];
        }
    }
    dataSet.sort(sortFunction);

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
    var FPS = 30;
    var duration = 2; //in seconds
    var nFrames = FPS*duration;

    //final text opacity:
    var opacity = 0.6;
    //text opacity at this frame:
    var alphaB = opacity*frame/nFrames
    //whiteout opacity:
    var alphaW = (1-opacity)*alphaB / (1-alphaB) / opacity;

    //separator line inset
    var inset = 0.1*width;

    //title margin
    context.font="20px Times New Roman";
    var leftTitle = width/2 - context.measureText(title+' Alarms').width/2 - inset;
    var rightTitle = width/2 - context.measureText(title+' Alarms').width/2;
    //title header
    var headTitle = 0.15*height

    //margins of body text:
    var leftMargin = 1.2*leftTitle;//width*0.2; 
    var rightMargin = 1.2*rightTitle;//width*0.15 + inset;

    //body text line height:
    var lineHeight = 20;

    //top of body text:
    var textTop = headTitle + 2*lineHeight;//0.19*height;

    //fade out last panel:
    context.fillStyle = "rgba(255,255,255,"+alphaW+")"
    context.fillRect(inset*1.1,.15*height+10,width-3*inset,height);

    //draw separator line
    if(!callMyself){
        context.strokeStyle = "rgba(0,0,0,0.2)"
        context.beginPath();
        if(side === "left"){
            context.moveTo(width-inset,10);
            context.lineTo(width-inset,waffleHeight*1.5);
        } else if(side === "right"){
            context.moveTo(inset,10);
            context.lineTo(inset,waffleHeight*1.5);
        }
        
        context.stroke();
    }

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
            
            context.strokeStyle = "rgba(0,0,0,"+alphaB+")";
            context.lineWidth = 5;
            context.beginPath();
            context.arc(width/2 - inset+1,headTitle+70+1, 50, 0, 2*Math.PI);
            context.moveTo(width/2 - inset-17+1,headTitle+72+1);
            context.lineTo(width/2 - inset-17+10+1,headTitle+72+10+1);
            context.lineTo(width/2 - inset-17+10+30+1,headTitle+72+10-30+1);
            context.stroke();

            context.strokeStyle = "rgba(0,255,0,"+alphaB+")";
            context.lineWidth = 5;
            context.beginPath();
            context.arc(width/2 - inset,headTitle+70, 50, 0, 2*Math.PI);
            context.moveTo(width/2 - inset-17,headTitle+72);
            context.lineTo(width/2 - inset-17+10,headTitle+72+10);
            context.lineTo(width/2 - inset-17+10+30,headTitle+72+10-30);
            context.stroke();
            context.fillText('All Okay', width/2 - context.measureText('All Okay').width/2 - inset, headTitle+150)
            
        }

        //Make sidebar title:
        
        if(!callMyself){
            context.font="20px Times New Roman";
            context.fillStyle = "rgba(0,0,0,opacity)";
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
            context.strokeStyle = "rgba(0,0,0,"+opacity*frame/nFrames+")";
            context.lineWidth = 5;
            context.beginPath();
            context.arc(width/2 +1,headTitle+70+1, 50, 0, 2*Math.PI);
            context.moveTo(width/2 -17+1,headTitle+72+1);
            context.lineTo(width/2 -17+10+1,headTitle+72+10+1);
            context.lineTo(width/2 -17+10+30+1,headTitle+72+10-30+1);
            context.stroke();

            context.strokeStyle = "rgba(0,255,0,"+opacity*frame/nFrames+")";
            context.lineWidth = 5;
            context.beginPath();
            context.arc(width/2 ,headTitle+70, 50, 0, 2*Math.PI);
            context.moveTo(width/2 -17,headTitle+72);
            context.lineTo(width/2 -17+10,headTitle+72+10);
            context.lineTo(width/2 -17+10+30,headTitle+72+10-30);
            context.stroke();
            context.fillText('All Okay', width/2 - context.measureText('All Okay').width/2, headTitle+150)
        }

        //Make sidebar title:
        if(!callMyself){
            context.font="20px Times New Roman";
            context.fillStyle = "rgba(0,0,0,opacity)";
            context.fillText(title+" Alarms", rightTitle, headTitle);
        }

    }


    if(frame < nFrames){
        frame++;
        setTimeout(function(){AlarmSidebar(title, sidebar, side, frame, wrapperDiv, waffleHeight, data, unit, rows, cols, alarm, rowTitles, colTitles, callMyself)},duration/FPS);
    }

    return;
}

