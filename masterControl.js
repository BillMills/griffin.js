function masterLoop(dashboard, AlarmServices, waffle, SHARC, HPGE, DESCANT, PACES, DANTE, BAMBINO, SCEPTAR, SPICE, DAQ, Clock, Trigger, callMyself){
	if(!document.webkitHidden && !document.mozHidden){
        var i,j;

        //HV monitor
        var demandVoltage, reportVoltage, reportCurrent, demandVrampUp, demandVrampDown, reportTemperature, channelMask, alarmStatus, rampStatus, voltLimit, currentLimit;
        demandVoltage = [];
        reportVoltage = [];
        reportCurrent = [];
        demandVrampUp = [];
        demandVrampDown = [];
        reportTemperature = [];
        channelMask = [];
        alarmStatus = [];
        rampStatus = [];
        voltLimit = [];
        currentLimit = [];
        for(i=0; i<waffle.rows; i++){
            demandVoltage[i] = [];
            reportVoltage[i] = [];
            reportCurrent[i] = [];
            demandVrampUp[i] = [];
            demandVrampDown[i] = [];
            reportTemperature[i] = [];
            channelMask[i] = [];
            alarmStatus[i] = [];
            rampStatus[i] = [];
            voltLimit[i] = [];
            currentLimit[i] = [];
            for(j=0;j<waffle.cols;j++){
              alarmStatus[i][j] = [];
            }
        }
    	fetchNewData(waffle.rows, waffle.cols, waffle.moduleSizes, waffle.ODBkeys, demandVoltage, reportVoltage, reportCurrent, demandVrampUp, demandVrampDown, reportTemperature, channelMask, alarmStatus, rampStatus, voltLimit, currentLimit, AlarmServices);
    	waffle.update(demandVoltage, reportVoltage, reportCurrent, demandVrampUp, demandVrampDown, reportTemperature, alarmStatus, channelMask, rampStatus, voltLimit, currentLimit, callMyself);
        for(i=0; i<waffle.barCharts.length; i++){
            var barChartData = [];
            var barChartAlarms = [];
            for(var j=0; j<waffle.barCharts[i].nBars; j++){
                var arrayCoords = getPointer(i, j, waffle)
                barChartData[j] = reportVoltage[arrayCoords[0]][arrayCoords[1]];
                barChartAlarms[j] = alarmStatus[arrayCoords[0]][arrayCoords[1]];
            }
            waffle.barCharts[i].update(barChartData, barChartAlarms);
        }

        //SHARC
        var SHARCrates = [];
        fetchNewSHARCData(320, SHARCrates);
        SHARC.update(SHARCrates);

        //HPGE
        var HPGEdata = [];
        var BGOdata = [];
        var detailData = [];
        fetchNewHPGEData(HPGEdata, BGOdata, detailData);
        HPGE.update(HPGEdata, BGOdata, detailData);

        //DESCANT
        var DESCANTrates = [];
        fetchNewDESCANTdata(DESCANTrates);
        DESCANT.update(DESCANTrates);

        //PACES
        var PACESrates = [];
        fetchNewPACESdata(PACESrates);
        PACES.update(PACESrates);        

        //DANTE
        var DANTErates = [];
        fetchNewDANTEdata(DANTErates);
        DANTE.update(DANTErates);        

        //BAMBINO
        var BAMBINOrates = [];
        fetchNewBAMBINOdata(BAMBINOrates);
        BAMBINO.update(BAMBINOrates);

        //SCEPTAR
        var SCEPTARrates = [];
        fetchNewSCEPTARdata(SCEPTARrates);
        SCEPTAR.update(SCEPTARrates);

        //SPICE
        var SPICErates = [];
        fetchNewSPICEdata(SPICErates);
        SPICE.update(SPICErates);

        //DAQ
        var masterRate, masterGroupRate, masterLinkRate, collectorRate, collectorLinkRate, digiSummaryRate, digiGroupSummaryRate, digitizerLinkRate, digitizerRate;
        masterRate = [];
        masterGroupRate = [];
        masterLinkRate = [];
        collectorRate = [];
        collectorLinkRate = [];
        digiSummaryRate = [];
        digiGroupSummaryRate = [];
        digitizerLinkRate = [];
        digitizerRate = [];
        fetchNewDAQData(DAQ.nCollectorGroups, masterRate, masterGroupRate, masterLinkRate, collectorRate, collectorLinkRate, digiSummaryRate, digiGroupSummaryRate, digitizerLinkRate, digitizerRate);
        DAQ.update(masterRate, masterGroupRate, masterLinkRate, collectorRate, collectorLinkRate, digiSummaryRate, digiGroupSummaryRate, digitizerLinkRate, digitizerRate);

        //animate whoever is showing on top, flat draw the rest; force animate for everyone on first pass, since Google fonts don't render in canvas on the first call to draw (investigate):
        if(window.onDisplay == 'DashboardCanvas' || !callMyself) animate(dashboard,0);
        else dashboard.draw(dashboard.nFrames);
        if(window.onDisplay == 'TestWaffle' || !callMyself) animate(waffle, 0);
        else waffle.draw(waffle.nFrames);
        for(i=0; i<waffle.barCharts.length; i++){
            if(window.onDisplay == waffle.barCharts[i].cvas || !callMyself) animate(waffle.barCharts[i], 0);
            else waffle.barCharts[i].draw(waffle.barCharts[i].nFrames);
        }
        if(window.onDisplay == 'SHARCCanvas' || !callMyself) animate(SHARC,0);
        else SHARC.draw(SHARC.nFrames);
        if(window.onDisplay == 'HPGECanvas' || !callMyself) animate(HPGE,0);
        else HPGE.draw(HPGE.nFrames);
        if(window.onDisplay == 'HPGEdetailCanvas' || !callMyself) animateDetail(HPGE,0);
        else HPGE.drawDetail(HPGE.detailContext, HPGE.nFrames);
        if(window.onDisplay == 'DESCANTCanvas' || !callMyself) animate(DESCANT,0);
        else DESCANT.draw(DESCANT.nFrames);
        if(window.onDisplay == 'PACESHVCanvas' || window.onDisplay == 'PACESrateCanvas' ||  !callMyself) animate(PACES,0);
        else PACES.draw(PACES.nFrames);
        if(window.onDisplay == 'DANTECanvas' || !callMyself) animate(DANTE,0);
        else DANTE.draw(DANTE.nFrames);
        if(window.onDisplay == 'BAMBINOCanvas' || !callMyself) animate(BAMBINO,0);
        else BAMBINO.draw(BAMBINO.nFrames);
        if(window.onDisplay == 'SCEPTARCanvas' || !callMyself) animate(SCEPTAR,0);
        else SCEPTAR.draw(SCEPTAR.nFrames);
        if(window.onDisplay == 'SPICECanvas' || !callMyself) animate(SPICE,0);
        else SPICE.draw(SPICE.nFrames);
        if(window.onDisplay == 'DAQcanvas' || !callMyself) animate(DAQ,0);
        else DAQ.draw(DAQ.nFrames);
        if(window.onDisplay == 'DAQdetailCanvas' || !callMyself) animateDetail(DAQ,0);
        else DAQ.drawDetail(DAQ.nFrames);
        if(window.onDisplay == 'ClockCanvas' || !callMyself) animate(Clock,0);
        else Clock.draw(Clock.nFrames);
        if(window.onDisplay == 'TriggerCanvas' || !callMyself) animate(Trigger,0);
        else Trigger.draw(Trigger.nFrames);
    }

    //clearTimeout(window.loop);
    window.loop = setTimeout(function(){masterLoop(dashboard, AlarmServices, waffle, SHARC, HPGE, DESCANT, PACES, DANTE, BAMBINO, SCEPTAR, SPICE, DAQ, Clock, Trigger, 1)}, 60000);
}

//populate HV monitor rows by cols arrays with the appropriate information:
function fetchNewData(rows, cols, moduleSizes, ODBkeys, demandVoltage, reportVoltage, reportCurrent, demandVrampUp, demandVrampDown, reportTemperature, channelMask, alarmStatus, rampStatus, voltLimit, curLimit, AlarmServices){

    var testParameter, i, j, ODBindex, columns, slot;
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
            if (i>0) slot = primaryBin(moduleSizes, j);
            else slot = j;
            //don't populate the primary of a 12 channel card, or any channel corresponding to an empty slot:
            if( (i!=0 || moduleSizes[j]==4) && moduleSizes[slot]!=0 ){
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
            } else if (i!=0 || moduleSizes[j]==4){  //keep the array filled, even for empty slots to avoid unpredictable behavior
                demandVoltage[i][j] = 0;
                reportVoltage[i][j] = 0;
                reportCurrent[i][j] = 0;
                demandVrampUp[i][j] = 0;
                demandVrampDown[i][j] = 0;
                reportTemperature[i][j] = 0;
                channelMask[i][j] = 0;
                rampStatus[i][j] = 0;
                voltLimit[i][j] = 0;
                curLimit[i][j] = 0;
            }

            //give the necessary information to the AlarmService, so it can report the state of any channel that trips an alarm below:
            if(j==0){
                AlarmServices.demandVoltage[i] = [];
                AlarmServices.reportVoltage[i] = [];
                AlarmServices.reportCurrent[i] = [];
                AlarmServices.reportTemperature[i] = [];
            }
            AlarmServices.demandVoltage[i][j] = demandVoltage[i][j];
            AlarmServices.reportVoltage[i][j] = reportVoltage[i][j];
            AlarmServices.reportCurrent[i][j] = reportCurrent[i][j];
            AlarmServices.reportTemperature[i][j] = reportTemperature[i][j];
        }
    }

    //determine alarm status
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
            if(testParameter < AlarmServices.alarmThresholds[0])  alarmStatus[i][j][0] = 0;
            else  alarmStatus[i][j][0] = Math.min( (testParameter - AlarmServices.alarmThresholds[0]) / AlarmServices.scaleMaxima[0], 1);
            if(rampStatus[i][j] == 3 || rampStatus[i][j] == 5){
                alarmStatus[i][j][0] = -2;
            }

            if(reportCurrent[i][j] < AlarmServices.alarmThresholds[1])  alarmStatus[i][j][1] = 0;
            else  alarmStatus[i][j][1] = Math.min( (reportCurrent[i][j] - AlarmServices.alarmThresholds[1]) / AlarmServices.scaleMaxima[1], 1);

            if(reportTemperature[i][j] < AlarmServices.alarmThresholds[2])  alarmStatus[i][j][2] = 0;
            else  alarmStatus[i][j][2] = Math.min( (reportTemperature[i][j] - AlarmServices.alarmThresholds[2]) / AlarmServices.scaleMaxima[2], 1);

            if(channelMask[i][j] == 0){
                alarmStatus[i][j][0] = -1;
                alarmStatus[i][j][1] = -1;
                alarmStatus[i][j][2] = -1;
            }

            //fire an event at the AlarmServices object for every alarm:
            //voltage alarms:
            
            if(alarmStatus[i][j][0] > 0){
                var voltageAlarm = new  CustomEvent("alarmTrip", {
                                            detail: {
                                                alarmType: 'voltage',
                                                alarmStatus: [i,j,alarmStatus[i][j][0]]        
                                            }
                                        });
                AlarmServices.div.dispatchEvent(voltageAlarm);
            }
            //current alarms:
            if(alarmStatus[i][j][1] > 0){
                var currentAlarm = new  CustomEvent("alarmTrip", {
                                            detail: {
                                                alarmType: 'current',
                                                alarmStatus: [i,j,alarmStatus[i][j][1]]        
                                            }
                                        });
                AlarmServices.div.dispatchEvent(currentAlarm);
            }
            //temperature alarms:
            if(alarmStatus[i][j][2] > 0){
                var temperatureAlarm = new  CustomEvent("alarmTrip", {
                                                detail: {
                                                    alarmType: 'temperature',
                                                    alarmStatus: [i,j,alarmStatus[i][j][2]]        
                                                }
                                            });
                AlarmServices.div.dispatchEvent(temperatureAlarm);
            }
        }
    }

    //let the alarm services know the update is complete:
    var allDone = new   CustomEvent("refreshComplete", {
                        });
    AlarmServices.div.dispatchEvent(allDone);   
}

//determine what size cards are in what slot:
function detectCards(){
    var moduleSizes
    //insert ODB magic here
    moduleSizes = [0,4,0,4,0,4,0,4,0,4,0,4];
    return moduleSizes;
}

//fetch new data for the scalar monitor
function fetchNewSHARCData(nChannels, HVdata){
    var i = 0;

    //var variablesRecord = ODBGetRecord(SM_ODBkeys[0]);
    //var settingsRecord  = ODBGetRecord(SM_ODBkeys[1]);

    //var HV              = ODBExtractRecord(variablesRecord, SM_ODBkeys[2]);

    //dummy data for offline dev:
    for(i=0; i<nChannels; i++){

        //HVdata[i] = parseFloat(HV[i]);

        //fake data for offline demo:
        HVdata[i] = Math.random();
    }

}

//fetch new data for the HPGE:
function fetchNewHPGEData(HPGEdata, BGOdata, detailData){
    var i = 0;

    //dummy data for offline dev:
    //HPGE summary
    for(i=0; i<64; i++){
        HPGEdata[i] = Math.random();
        BGOdata[i] = Math.random();
    }

    for(i=0; i<200; i++){
        detailData[i] = Math.random();
    }

}

//fetch new data for the HPGE:
function fetchNewDESCANTdata(rates){
    var i = 0;

    //dummy data for offline dev:
    //rates
    for(i=0; i<70; i++){
        rates[i] = Math.random();
    }

}

//fetch new data for the HPGE:
function fetchNewPACESdata(rates){
    var i = 0;

    //dummy data for offline dev:
    //rates
    for(i=0; i<10; i++){
        rates[i] = Math.random();
    }

}

//fetch new data for the HPGE:
function fetchNewDANTEdata(rates){
    var i = 0;

    //dummy data for offline dev:
    //rates
    for(i=0; i<16; i++){
        rates[i] = Math.random();
    }

}

//fetch new data for the HPGE:
function fetchNewBAMBINOdata(rates){
    var i = 0;

    //dummy data for offline dev:
    //rates
    for(i=0; i<200; i++){
        rates[i] = Math.random();
    }

}

//fetch new data for the HPGE:
function fetchNewSCEPTARdata(rates){
    var i = 0;

    //dummy data for offline dev:
    //rates
    for(i=0; i<21; i++){
        rates[i] = Math.random();
    }

}

//fetch new data for the HPGE:
function fetchNewSPICEdata(rates){
    var i = 0;

    //dummy data for offline dev:
    //rates
    for(i=0; i<120; i++){
        rates[i] = Math.random();
    }

}

//fetch new data for the DAQ:
function fetchNewDAQData(nCollectorGroups, masterRate, masterGroupRate, masterLinkRate, collectorRate, collectorLinkRate, digiSummaryRate, digiGroupSummaryRate, digitizerLinkRate, digitizerRate){
    var i,j,k,m;

    masterRate[0] = Math.random();
    for(i=0; i<nCollectorGroups; i++){
        masterGroupRate[i] = Math.random();
    }
    for(i=0; i<4*nCollectorGroups; i++){
        masterLinkRate[i] = Math.random();
        collectorRate[i] = Math.random();
        collectorLinkRate[i] = Math.random();
        digiSummaryRate[i] = Math.random();
    }
    for(i=0; i<4*4*nCollectorGroups; i++){
        digiGroupSummaryRate[i] = Math.random();
    }
    for(i=0; i<4*4*4*nCollectorGroups; i++){
        digitizerLinkRate[i] = Math.random();
        digitizerRate[i] = Math.random();
    }
}

//force an immediate update, and set the master loop going again from there:
function forceUpdate(){
    clearTimeout(window.loop);
    startLoop(1);
}













