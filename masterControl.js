function masterLoop(rows, cols, ODBkeys, demandVoltage, reportVoltage, reportCurrent, demandVramp, reportTemperature, channelMask, waffle, barchart, callMyself){
	if(!document.webkitHidden && !document.mozHidden){
    	fetchNewData(rows, cols, ODBkeys, demandVoltage, reportVoltage, reportCurrent, demandVramp, reportTemperature, channelMask);
    	waffle.update(demandVoltage, reportVoltage, reportCurrent, demandVramp, reportTemperature, channelMask, callMyself);
    	barchart.update([ reportVoltage[0][0], reportVoltage[1][0], reportVoltage[2][0], reportVoltage[3][0], reportVoltage[4][0], reportVoltage[5][0], reportVoltage[6][0], reportVoltage[7][0], reportVoltage[8][0], reportVoltage[9][0], reportVoltage[10][0], reportVoltage[11][0] ]);
    }
    setTimeout(function(){masterLoop(rows, cols, ODBkeys, demandVoltage, reportVoltage, reportCurrent, demandVramp, reportTemperature, channelMask, waffle, barchart, 1)}, 3000);
}

//populate rows by cols arrays with the appropriate information:
function fetchNewData(rows, cols, ODBkeys, demandVoltage, reportVoltage, reportCurrent, demandVramp, reportTemperature, channelMask){
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
        }
    }   
}