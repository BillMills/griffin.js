function masterLoop(rows, cols, ODBkeys, demandVoltage, reportVoltage, reportCurrent, demandVrampUp, demandVrampDown, reportTemperature, channelMask, alarmStatus, rampStatus, alarmTripLevel, scaleMax, waffle, barchart, callMyself){
	if(!document.webkitHidden && !document.mozHidden){
    	fetchNewData(rows, cols, ODBkeys, demandVoltage, reportVoltage, reportCurrent, demandVrampUp, demandVrampDown, reportTemperature, channelMask, alarmStatus, rampStatus, alarmTripLevel, scaleMax);
    	waffle.update(demandVoltage, reportVoltage, reportCurrent, demandVrampUp, demandVrampDown, reportTemperature, alarmStatus, channelMask, rampStatus, callMyself);
    	barchart.update([ reportVoltage[1][0], reportVoltage[2][0], reportVoltage[3][0], reportVoltage[4][0], reportVoltage[5][0], reportVoltage[6][0], reportVoltage[7][0], reportVoltage[8][0], reportVoltage[9][0], reportVoltage[10][0], reportVoltage[11][0], reportVoltage[12][0] ], [alarmStatus[1][0], alarmStatus[2][0], alarmStatus[3][0], alarmStatus[4][0], alarmStatus[5][0], alarmStatus[6][0], alarmStatus[7][0], alarmStatus[8][0], alarmStatus[9][0], alarmStatus[10][0], alarmStatus[11][0], alarmStatus[12][0] ] );
    }
    setTimeout(function(){masterLoop(rows, cols, ODBkeys, demandVoltage, reportVoltage, reportCurrent, demandVrampUp, demandVrampDown, reportTemperature, channelMask, alarmStatus, rampStatus, alarmTripLevel, scaleMax, waffle, barchart, 1)}, 60000);
}

//populate rows by cols arrays with the appropriate information:
function fetchNewData(rows, cols, ODBkeys, demandVoltage, reportVoltage, reportCurrent, demandVrampUp, demandVrampDown, reportTemperature, channelMask, alarmStatus, rampStatus, alarmTripLevel, scaleMax){

    var testParameter, i, j, ODBindex, columns;
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
*/          
    for(i=0; i<rows; i++){
        //primary row spans multi-columns:
        if(i==0) columns = 8;
        else columns = cols;
        for(j=0; j<columns; j++){
            /*
            ODBindex = getMIDASindex(i, j);
            demandVoltage[i][j]     = reqVoltage[ODBindex];
            reportVoltage[i][j]     = measVoltage[ODBindex];   
            reportCurrent[i][j]     = measCurrent[ODBindex];
            demandVrampUp[i][j]     = rampUp[ODBindex];
            demandVrampDown[i][j]   = rampDown[ODBindex];
            reportTemperature[i][j] = measTemperature[ODBindex];
            channelMask[i][j]       = repoChState[ODBindex];
            rampStatus[i][j]        = repoChStatus[ODBindex];
            */
            //fake data for offline demo
            demandVoltage[i][j] = Math.random();
            reportVoltage[i][j] = Math.random();
            reportCurrent[i][j] = Math.random();
            demandVrampUp[i][j] = Math.random();
            demandVrampDown[i][j] = Math.random();
            reportTemperature[i][j] = Math.random();
            channelMask[i][j] = Math.random();
            if (channelMask[i][j] < 0.1) channelMask[i][j] = 0;
            else channelMask[i][j] = 1;
            rampStatus[i][j] = Math.floor(10*Math.random());
        }
    }

    for(i=0; i<rows; i++){
        //primary row spans multi-columns:
        if(i==0) columns = 8;
        else columns = cols;
        for(j=0; j<columns; j++){

            //construct the parameter to be tested against the voltage alarm:
            testParameter = Math.abs(demandVoltage[i][j] - reportVoltage[i][j]); 

            //determine alarm status for each cell, recorded as [i][j][voltage alarm, current alarm, temperature alarm]
            //alarmStatus == 0 indicates all clear, 0 < alarmStatus <= 1 indicates alarm intensity, alarmStatus = -1 indicates channel off,
            //and alarmStatus == -2 for the voltage alarm indicates voltage ramping.
            if(testParameter < alarmTripLevel[0])  alarmStatus[i][j][0] = 0;
            else  alarmStatus[i][j][0] = Math.min( (testParameter - alarmTripLevel[0]) / scaleMax[0], 1);
            if(rampStatus[i][j] == 3 || rampStatus[i][j] == 5){
                alarmStatus[i][j][0] = -2;
            }

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