/*
function AlarmMonitor(rows, cols, divID, canvasID, dashboardDivID){

    this.nAlarms = 5;                       //Maximum number of alarms to report at once
    this.divID = divID;                     //ID of alarm div
    this.canvasID = canvasID;               //ID of alarm canvas
    this.dashboardDivID = dashboardDivID;   //ID of dashboard div
    this.rows  = rows;

    this.div = document.getElementById(divID);
    this.canvas = document.getElementById(canvasID);
    this.context = this.canvas.getContext('2d');

    //set scale of sleeping alarm monitors:
    var dashboardWidth = $('#'+dashboardDivID).width();
    $( this.div.css('width', 0.16*dashboardWidth);
    this.canvas.width  = 0.16*dashboardWidth;    

    this.update = function(previousAlarmStatus, currentAlarmStatus){

        var i, j;
        var isAlarm, oldAlarm;

        //determine & update badge status

        //update alarm text

    };

}
*/

//TODO: clean up by passing in waffle object?
function AlarmSidebar(side, wrapperDiv, waffleHeight, prevAlarmStatus, alarmStatus, rows, cols, rowTitles, callMyself, alarmPanelDivIDs, alarmPanelCanvIDs, demandVoltage, reportVoltage, reportCurrent, reportTemperature, alarm, units, moduleLabels, moduleSizes){

    var i, j, n, columns;

    //number of alarms to report:
    var nAlarms = 5;

    //get container div dimensions:
    var parentWidth = $('#'+wrapperDiv).width();
    var parentHeight = $('#'+wrapperDiv).height();

    //define sidebar dimensions:
    var width = parentWidth*0.2;
    var height = parentHeight;

    //separator line inset
    var inset = 0.1*width;

    //draw separator line & scale sidebar
    if(!callMyself){
        //scale:
        for(i=0; i<alarmPanelDivIDs.length; i++){
            $( document.getElementById(alarmPanelDivIDs[i]) ).css('width', 0.8*width);
            document.getElementById(alarmPanelCanvIDs[i]).width  = 0.8*width;
        }
    }

    //draw the appropriate status summary badge in each window:
    var isAlarm, oldAlarm;
    var alarmTitles = ['Voltage Alarms', 'Current Alarms', 'Temperature Alarms'];
    for(n=0; n<alarmStatus[0][0].length; n++){
        isAlarm = 0;
        oldAlarm = 0;
        for(i=0; i<rows; i++){
            if(i==0) columns = moduleSizes.length;
            else columns = cols;
            for(j=0; j<columns; j++){
                if(alarmStatus[i][j][n] > 0) isAlarm = 1;
                if(prevAlarmStatus[i][j][n] > 0) oldAlarm = 1;
            }
        }

        var allClear = curry(drawAllClear, 70,75,50,alarmTitles[n]);
        var alarmTrip = curry(drawAlarm, 70,90,100,alarmTitles[n]);
        var blank = curry(drawBlank,0,0,0,alarmTitles[n]);

        if(!callMyself){
            if(isAlarm == 1){
                fadeSwapCanvas(alarmPanelCanvIDs[n], blank, alarmTrip, 0);
            }
            else{
                fadeSwapCanvas(alarmPanelCanvIDs[n], blank, allClear, 0);
            }            
        }

        if(oldAlarm != isAlarm){

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
        var columns;
        if(i==0) columns = moduleLabels.length;
        else columns = cols;
        for(j=0; j<columns; j++) {
            if(i>0 || moduleSizes[j]!=1){  //don't look for alarms on the primary channels of cards that don't have primary channels
                voltageAlarmArray[n] = [];  currentAlarmArray[n] = [];  temperatureAlarmArray[n] = [];
                voltageAlarmArray[n][0] = i;  currentAlarmArray[n][0] = i;  temperatureAlarmArray[n][0] = i;
                voltageAlarmArray[n][1] = j;  currentAlarmArray[n][1] = j;  temperatureAlarmArray[n][1] = j;
                voltageAlarmArray[n][2] = alarmStatus[i][j][0];
                currentAlarmArray[n][2] = alarmStatus[i][j][1];
                temperatureAlarmArray[n][2] = alarmStatus[i][j][2];
                n++;                
            }
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
        if(channelMap(voltageAlarmArray[n][1], voltageAlarmArray[n][0], moduleSizes, rows) != -1)
           alarmString += moduleLabels[ primaryBin(moduleSizes, voltageAlarmArray[n][1]) ] + ', ' + rowTitles[0] + ' ' + channelMap(voltageAlarmArray[n][1], voltageAlarmArray[n][0], moduleSizes, rows) + '<br>Demand Voltage: ' + demandVoltage[voltageAlarmArray[n][0]][voltageAlarmArray[n][1]].toFixed(window.precision) + ' ' + units[0] + '<br>Reported Voltage: ' + reportVoltage[voltageAlarmArray[n][0]][voltageAlarmArray[n][1]].toFixed(window.precision) + ' ' + units[0] + '<br><br>';
        else {
           alarmString += moduleLabels[ voltageAlarmArray[n][1] ] + ' Primary<br>Demand Voltage: ' + demandVoltage[voltageAlarmArray[n][0]][voltageAlarmArray[n][1]].toFixed(window.precision) + ' ' + units[0] + '<br>Reported Voltage: ' + reportVoltage[voltageAlarmArray[n][0]][voltageAlarmArray[n][1]].toFixed(window.precision) + ' ' + units[0] + '<br><br>'; 
        }
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
        if(channelMap(currentAlarmArray[n][1], currentAlarmArray[n][0], moduleSizes, rows) != -1)
            alarmString += moduleLabels[ primaryBin(moduleSizes, currentAlarmArray[n][1]) ] + ', ' + rowTitles[0] + ' ' + channelMap(currentAlarmArray[n][1], currentAlarmArray[n][0], moduleSizes, rows) + '<br>Current: ' + reportCurrent[currentAlarmArray[n][0]][currentAlarmArray[n][1]].toFixed(window.precision) + ' ' + units[1] + '<br><br>';
        else
            alarmString += moduleLabels[ currentAlarmArray[n][1] ] + ' Primary<br>Current: ' + reportCurrent[currentAlarmArray[n][0]][currentAlarmArray[n][1]].toFixed(window.precision) + ' ' + units[1] + '<br><br>';
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
        if(channelMap(temperatureAlarmArray[n][1], temperatureAlarmArray[n][0], moduleSizes, rows) != -1)
            alarmString += moduleLabels[ primaryBin(moduleSizes, temperatureAlarmArray[n][1]) ] + ', ' + rowTitles[0] + ' ' + channelMap(temperatureAlarmArray[n][1], temperatureAlarmArray[n][0], moduleSizes, rows) + '<br>Temperature: ' + reportTemperature[temperatureAlarmArray[n][0]][temperatureAlarmArray[n][1]].toFixed(window.precision) + ' ' + units[2] + '<br><br>';
        else
            alarmString += moduleLabels[ temperatureAlarmArray[n][1] ] + 'Primary<br>Temperature: ' + reportTemperature[temperatureAlarmArray[n][0]][temperatureAlarmArray[n][1]].toFixed(window.precision) + ' ' + units[2] + '<br><br>';
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
            context.font=($('#'+canvasID).width()*0.07)+'px Raleway';
            context.fillText(title, 0.9*canvas.width - context.measureText(title).width+1, canvas.height*0.5+1);

            context.fillStyle = 'rgba(255,255,255,1)';
            context.fillText(title, 0.9*canvas.width - context.measureText(title).width, canvas.height*0.5);
            
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
            context.font=($('#'+canvasID).width()*0.07)+'px Raleway';
            context.fillText(title, 0.9*canvas.width - context.measureText(title).width+1, canvas.height*0.5+1);

            context.fillStyle = 'rgba(255,255,255,1)';
            context.fillText(title, 0.9*canvas.width - context.measureText(title).width, canvas.height*0.5);
}

function drawBlank(x0, y0, L, title, canvasID, alphaB){
            var canvas = document.getElementById(canvasID);
            var context = canvas.getContext('2d');

            context.font=(L*0.6)+"px TImes New Roman";    
            context.fillStyle = 'rgba(0,0,0,1)';
            context.font=($('#'+canvasID).width()*0.07)+'px Raleway';
            context.fillText(title, 0.9*canvas.width - context.measureText(title).width+1, canvas.height*0.5+1);

            context.fillStyle = 'rgba(255,255,255,1)';
            context.fillText(title, 0.9*canvas.width - context.measureText(title).width, canvas.height*0.5);
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
function alarmTransition(panelID, hiddenTop, alarmTop){

    //alarm reporting font size:
    var alarmTextSize = $('#voltageText').width()*0.08;

    if($('#'+panelID).css('z-index') == 10000){
        $('#'+panelID).css('height', 150);
        $('#'+panelID).css('z-index', 1);
        $('#'+panelID).css('top', hiddenTop+'px !important;');
    } else{
        $('#'+panelID).css('height', 200+25*alarmTextSize);
        $('#'+panelID).css('z-index', 10000);
        $('#'+panelID).css('top', alarmTop+'px !important;');
    }
}