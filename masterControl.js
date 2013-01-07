function masterLoop(rows, cols, ODBkeys, demandVoltage, reportVoltage, reportCurrent, demandVramp, reportTemperature, channelMask, alarmStatus, alarmTripLevel, scaleMax, waffle, barchart, callMyself){
	if(!document.webkitHidden && !document.mozHidden){
    	fetchNewData(rows, cols, ODBkeys, demandVoltage, reportVoltage, reportCurrent, demandVramp, reportTemperature, channelMask, alarmStatus, alarmTripLevel, scaleMax);
    	waffle.update(demandVoltage, reportVoltage, reportCurrent, demandVramp, reportTemperature, alarmStatus, channelMask, callMyself);
    	barchart.update([ reportVoltage[0][0], reportVoltage[1][0], reportVoltage[2][0], reportVoltage[3][0], reportVoltage[4][0], reportVoltage[5][0], reportVoltage[6][0], reportVoltage[7][0], reportVoltage[8][0], reportVoltage[9][0], reportVoltage[10][0], reportVoltage[11][0] ], [alarmStatus[0][0], alarmStatus[1][0], alarmStatus[2][0], alarmStatus[3][0], alarmStatus[4][0], alarmStatus[5][0], alarmStatus[6][0], alarmStatus[7][0], alarmStatus[8][0], alarmStatus[9][0], alarmStatus[10][0], alarmStatus[11][0] ] );
    }
    setTimeout(function(){masterLoop(rows, cols, ODBkeys, demandVoltage, reportVoltage, reportCurrent, demandVramp, reportTemperature, channelMask, alarmStatus, alarmTripLevel, scaleMax, waffle, barchart, 1)}, 5000);
}

//populate rows by cols arrays with the appropriate information:
function fetchNewData(rows, cols, ODBkeys, demandVoltage, reportVoltage, reportCurrent, demandVramp, reportTemperature, channelMask, alarmStatus, alarmTripLevel, scaleMax){

    var testParameter;

    //populate new data:
    for(var i=0; i<rows; i++){
        for(var j=0; j<cols; j++){
            /*commented out for offline demo
            var ODBindex = getMIDASindex(rows, cols);
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

            //construct the parameter to be tested against the voltage alarm:
            testParameter = Math.abs(demandVoltage[i][j] - reportVoltage[i][j]); 

            //determine alarm status for each cell, recorded as [i][j][voltage alarm, current alarm, temperature alarm]
            //alarmStatus == 0 indicates all clear, 0 < alarmStatus <= 1 indicates alarm intensity, alarmStatus = -1 indicates channel off.
            if(testParameter < alarmTripLevel[0])  alarmStatus[i][j][0] = 0;
            else  alarmStatus[i][j][0] = Math.min( (testParameter - alarmTripLevel[0]) / scaleMax[0], 1);

            if(reportCurrent[i][j] < alarmTripLevel[1])  alarmStatus[i][j][1] = 0;
            else  alarmStatus[i][j][1] = Math.min( (reportCurrent[i][j] - alarmTripLevel[1]) / scaleMax[1], 1);

            if(reportTemperature[i][j] < alarmTripLevel[2])  alarmStatus[i][j][2] = 0;
            else  alarmStatus[i][j][2] = Math.min( (reportTemperature[i][j] - alarmTripLevel[2]) / scaleMax[2], 1);

            if(channelMask[i][j] == 0){
                alarmStatus[i][j][0] = -1;
                alarmStatus[i][j][1] = -1;
                alarmStatus[i][j][2] = -1;
            }

        }
    }   
}