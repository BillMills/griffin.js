function AlarmSidebar(sidebar, side, wrapperDiv, waffleHeight, prevAlarmStatus, alarmStatus, rows, cols, rowTitles, colTitles, callMyself, alarmPanelDivIDs, alarmPanelCanvIDs, demandVoltage, reportVoltage, reportCurrent, reportTemperature, alarm, units){

    var i, j, n;

    //number of alarms to report:
    var nAlarms = 5;

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

    //separator line inset
    var inset = 0.1*width;

    //draw separator line & scale sidebar
    if(!callMyself){
        //scale:
        for(i=0; i<alarmPanelDivIDs.length; i++){
            $( document.getElementById(alarmPanelDivIDs[i]) ).css('width', 0.8*width);
            //$( document.getElementById(alarmPanelCanvIDs[i]) ).css('width', 0.8*width);
        }
    }

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
                fadeSwapCanvas(alarmPanelCanvIDs[n], allClear, alarmTrip, 0);
            }
            else{
                fadeSwapCanvas(alarmPanelCanvIDs[n], alarmTrip, allClear, 0);
            }
        } 

    }

    //Populate each alarm panel with the appropriate info:
    //Define sort functions:
    function sortAlarms(a, b){
        if (a[2] > b[2]) return -1;
        if (a[2] < b[2]) return 1;
        else return 0;
    }
    var voltageAlarmArray = [];
    var currentAlarmArray = [];
    var temperatureAlarmArray = [];
    n = 0;  
    for(i=0; i<rows; i++){
        for(j=0; j<cols; j++) {
            voltageAlarmArray[n] = [];  currentAlarmArray[n] = [];  temperatureAlarmArray[n] = [];
            voltageAlarmArray[n][0] = i;  currentAlarmArray[n][0] = i;  temperatureAlarmArray[n][0] = i;
            voltageAlarmArray[n][1] = j;  currentAlarmArray[n][1] = j;  temperatureAlarmArray[n][1] = j;
            voltageAlarmArray[n][2] = alarmStatus[i][j][0];
            currentAlarmArray[n][2] = alarmStatus[i][j][1];
            temperatureAlarmArray[n][2] = alarmStatus[i][j][2];
            n++;                
        }
    }  
    voltageAlarmArray.sort(sortAlarms);
    currentAlarmArray.sort(sortAlarms);
    temperatureAlarmArray.sort(sortAlarms);

    //alarm reporting font size:
    var alarmTextSize = $('#voltageText').width()*0.08;

    //report Voltage alarms
    n = 0;
    var alarmString = '';
    while(n<nAlarms && voltageAlarmArray[n][2]>0){
        alarmString += colTitles[0] + ' ' + voltageAlarmArray[n][1] + ', ' + rowTitles[0] + ' ' + voltageAlarmArray[n][0] + '<br>Demand Voltage: ' + demandVoltage[voltageAlarmArray[n][0]][voltageAlarmArray[n][1]].toFixed(3) + ' ' + units[0] + '<br>Reported Voltage: ' + reportVoltage[voltageAlarmArray[n][0]][voltageAlarmArray[n][1]].toFixed(3) + ' ' + units[0] + '<br><br>';
        n++;
    }
    if(alarmString == ''){
        alarmString = 'All Clear';
    }
    $('#voltageText').css('font-size', alarmTextSize);
    document.getElementById('voltageText').innerHTML = alarmString;

    //report Current alarms
    n = 0;
    alarmString = '';
    while(n<nAlarms && (currentAlarmArray[n][2]>0 || currentAlarmArray[n][2]==-2) ){
        if(n == 0) alarmString = 'Alarm Threshold: ' + alarm[1] + ' ' + units[1] + '<br><br>'
        alarmString += colTitles[0] + ' ' + currentAlarmArray[n][1] + ', ' + rowTitles[0] + ' ' + currentAlarmArray[n][0] + '<br>Current: ' + reportCurrent[currentAlarmArray[n][0]][currentAlarmArray[n][1]].toFixed(3) + ' ' + units[1] + '<br><br>';
        n++;
    }
    if(alarmString == ''){
        alarmString = 'All Clear';
    }
    $('#currentText').css('font-size', alarmTextSize);
    document.getElementById('currentText').innerHTML = alarmString;

    //report Temperature alarms
    n = 0;
    alarmString = '';
    while(n<nAlarms && (temperatureAlarmArray[n][2]>0 || temperatureAlarmArray[n][2]==-2) ){
        if(n == 0) alarmString = 'Alarm Threshold: ' + alarm[2] + ' ' + units[2] + '<br><br>'
        alarmString += colTitles[0] + ' ' + temperatureAlarmArray[n][1] + ', ' + rowTitles[0] + ' ' + temperatureAlarmArray[n][0] + '<br>Temperature: ' + reportTemperature[temperatureAlarmArray[n][0]][temperatureAlarmArray[n][1]].toFixed(3) + ' ' + units[2] + '<br><br>';
        n++;
    }
    if(alarmString == ''){
        alarmString = 'All Clear';
    }
    $('#temperatureText').css('font-size', alarmTextSize);
    document.getElementById('temperatureText').innerHTML = alarmString;

    return;
}

function drawAllClear(x0, y0, radius, title, canvasID, alphaB){
            var canvas = document.getElementById(canvasID);
            var context = canvas.getContext('2d');

            context.font=(radius*0.6)+"px 'Orbitron'";    

            context.strokeStyle = "rgba(0,0,0,"+alphaB+")";
            context.lineWidth = 5;
            context.beginPath();
            context.arc(x0+1, y0+1, radius, 0, 2*Math.PI);
            context.moveTo(x0-17+1, y0 +2+1);
            context.lineTo(x0-17+10+1, y0 +2+10+1);
            context.lineTo(x0-17+10+30+1, y0 +2+10-30+1);
            context.stroke();

            context.strokeStyle = "rgba(0,255,0,"+alphaB+")";
            context.lineWidth = 5;
            context.beginPath();
            context.arc(x0, y0, radius, 0, 2*Math.PI);
            context.moveTo(x0-17, y0 +2);
            context.lineTo(x0-17+10, y0 +2+10);
            context.lineTo(x0-17+10+30, y0 +2+10-30);
            context.stroke();

            context.fillStyle = 'rgba(0,0,0,1)';
            //context.font=(2*radius*0.24)+'px Raleway';
            context.font=($('#'+canvasID).width()*0.052)+'px Raleway';
            context.fillText(title, 0.5*canvas.width - context.measureText(title).width/2+1, canvas.height*0.5+1);

            context.fillStyle = 'rgba(255,255,255,1)';
            context.fillText(title, 0.5*canvas.width - context.measureText(title).width/2, canvas.height*0.5);
            
}

function drawAlarm(x0, y0, L, title, canvasID, alphaB){
            var canvas = document.getElementById(canvasID);
            var context = canvas.getContext('2d');

            context.font=(L*0.6)+"px TImes New Roman";

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

            context.fillStyle = 'rgba(0,0,0,1)';
            //context.font=(L*0.24)+'px Raleway';
            context.font=($('#'+canvasID).width()*0.052)+'px Raleway';
            context.fillText(title, 0.5*canvas.width - context.measureText(title).width/2+1, canvas.height*0.5+1);

            context.fillStyle = 'rgba(255,255,255,1)';
            context.fillText(title, 0.5*canvas.width - context.measureText(title).width/2, canvas.height*0.5);
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

//funciton to define the onclick behavior of the alarm sidebar panels:
function alarmTransition(panelID, hiddenTop){
    if($('#'+panelID).css('z-index') == 10000){
        $('#'+panelID).css('height', 150);
        $('#'+panelID).css('background', 'rgba(0,0,0,0.7)');
        $('#'+panelID).css('z-index', 1);
        $('#'+panelID).css('top', hiddenTop+'px !important;');
    } else{
        $('#'+panelID).css('height', 600);
        $('#'+panelID).css('background', 'rgba(0,0,0,1)');
        $('#'+panelID).css('z-index', 10000);
        $('#'+panelID).css('top', '0px !important;');
    }
}