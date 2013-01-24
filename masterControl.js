function masterLoop(rows, cols, moduleSizes, ODBkeys, demandVoltage, reportVoltage, reportCurrent, demandVrampUp, demandVrampDown, reportTemperature, channelMask, alarmStatus, rampStatus, voltLimit, currentLimit, alarmTripLevel, scaleMax, waffle, barCharts, tooltip, callMyself){
	if(!document.webkitHidden && !document.mozHidden){
    	fetchNewData(rows, cols, moduleSizes, ODBkeys, demandVoltage, reportVoltage, reportCurrent, demandVrampUp, demandVrampDown, reportTemperature, channelMask, alarmStatus, rampStatus, voltLimit, currentLimit, alarmTripLevel, scaleMax);
    	waffle.update(demandVoltage, reportVoltage, reportCurrent, demandVrampUp, demandVrampDown, reportTemperature, alarmStatus, channelMask, rampStatus, voltLimit, currentLimit, callMyself);
        for(var i=0; i<barCharts.length; i++){
            var barChartData = [];
            var barChartAlarms = [];
            for(var j=0; j<barCharts[i].nBars; j++){
                var arrayCoords = getPointer(i, j, waffle)
                barChartData[j] = reportVoltage[arrayCoords[0]][arrayCoords[1]];
                barChartAlarms[j] = alarmStatus[arrayCoords[0]][arrayCoords[1]];
            }
            barCharts[i].update(barChartData, barChartAlarms);
        }
        tooltip.update();
    }
    window.loop = setTimeout(function(){masterLoop(rows, cols, moduleSizes, ODBkeys, demandVoltage, reportVoltage, reportCurrent, demandVrampUp, demandVrampDown, reportTemperature, channelMask, alarmStatus, rampStatus, voltLimit, currentLimit, alarmTripLevel, scaleMax, waffle, barCharts, tooltip, 1)}, 3000);
}

//populate rows by cols arrays with the appropriate information:
function fetchNewData(rows, cols, moduleSizes, ODBkeys, demandVoltage, reportVoltage, reportCurrent, demandVrampUp, demandVrampDown, reportTemperature, channelMask, alarmStatus, rampStatus, voltLimit, curLimit, alarmTripLevel, scaleMax){

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
    var voltageLimit    = ODBExtractRecord(settingsRecord,  ODBkeys[10]);
    var currentLimit    = ODBExtractRecord(settingsRecord,  ODBkeys[11]);
*/          
    for(i=0; i<rows; i++){
        //primary row spans multi-columns, only has entries for 48 channel cards:        
        if(i==0) columns = moduleSizes.length;
        else columns = cols;
        for(j=0; j<columns; j++){
            //only populate primaries that actually exist:
            if(i!=0 || moduleSizes[j]==4){
                /*
                ODBindex = getMIDASindex(i, j);
                demandVoltage[i][j]     = parseFloat(reqVoltage[ODBindex]);
                reportVoltage[i][j]     = parseFloat(measVoltage[ODBindex]);   
                reportCurrent[i][j]     = parseFloat(measCurrent[ODBindex]);
                demandVrampUp[i][j]     = parseFloat(rampUp[ODBindex]);
                demandVrampDown[i][j]   = parseFloat(rampDown[ODBindex]);
                reportTemperature[i][j] = parseFloat(measTemperature[ODBindex]);
                channelMask[i][j]       = parseFloat(repoChState[ODBindex]);
                rampStatus[i][j]        = parseFloat(repoChStatus[ODBindex]);
                voltLimit[i][j]         = parseFloat(voltageLimit[ODBindex]);
                curLimit[i][j]          = parseFloat(currentLimit[ODBindex]);
                //48ch cards report the currents in mA, convert to uA:
                if(i==0){
                    reportCurrent[i][j] = reportCurrent[i][j]*1000;
                    curLimit[i][j] = curLimit[i][j]*1000;
                }

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
                voltLimit[i][j] = 1+Math.random();
                curLimit[i][j] = 1+Math.random();
            }
        }
    }

    for(i=0; i<rows; i++){
        //primary row spans multi-columns:
        if(i==0) columns = moduleSizes.length;
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