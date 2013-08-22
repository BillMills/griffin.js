function Clock(){
    var i, cellSize, clockStyle,
    that = this;
    window.clockPointer = that;

	this.wrapperID = window.parameters.wrapper;	    //ID of wrapping div
	this.canvasID = 'ClockCanvas';		            //ID of canvas to paint clock on
    this.linkWrapperID = 'ClockLinks';              //ID of div to contain clock view header
    this.sidebarID = 'ClockSidebar';                //ID of div to contain clock sidebar
    this.activeElt = 'clock0';
    this.noUniqueMaster = 0;
    this.masterFreq = 200;  //master always steps down from 200MHz, at least for GRIFFIN.
    this.channelTitles = ['eSATA 0', 'eSATA 1', 'eSATA 2', 'eSATA 3', 'eSATA 4', 'eSATA 5', 'Left LEMO', 'Right LEMO'];

	this.wrapper = document.getElementById(this.wrapperID);

    //add top level nav button:
    insertDOM('button', 'ClockButton', 'navLink', '', 'statusLink', function(){swapView('ClockLinks', 'ClockCanvas', 'clockMenus', 'ClockButton');}, 'Clock');

    //deploy right bar menu:
    deployMenu('clockMenus', ['summary', 'outs', 'CSAC'] , ['Clock Summary','Channel Outs','CSAC Parameters']);
    //inject table into div for summary tab:
    insertDOM('table', 'summaryContentTable', 'sidebarTable', '', 'summaryContent', '', '');
    for(i=1; i<9; i++){
        label = window.parameters.clockVariableNames[i];
        insertDOM('tr', 'summaryContentRow'+i, '', '', 'summaryContentTable', '', '');
        insertDOM('td', 'clockSummaryLabel'+i, '', '', 'summaryContentRow'+i, '', label);
        insertDOM('td', 'clockSummaryValue'+i, (i==4) ? 'summaryContentCell' : '', '', 'summaryContentRow'+i, '', '');
    }    
    //inject table for CSAC tab:
    insertDOM('table', 'CSACContentTable', 'sidebarTable', '', 'CSACContent', '', '');
    for(i=41; i<52; i++){
        label = window.parameters.clockVariableNames[i];
        insertDOM('tr', 'CSACContentRow'+i, '', '', 'CSACContentTable', '', '');
        insertDOM('td', 'clockCSACLabel'+i, '', '', 'CSACContentRow'+i, '', label);
        insertDOM('td', 'clockCSACValue'+i, '', '', 'CSACContentRow'+i, '', '');
    }
    //Channel outs packed as 8 badges, with master step down slider at the top:
    insertDOM('div', 'outsContentmasterStepdownSliderDiv', '', 'display:block;', 'outsContent', '', 'Master Output Freq.<br>');
    insertDOM('input', 'outsContentmasterStepdownSlider', '', '', 'outsContentmasterStepdownSliderDiv', '', '', '', 'range');
    insertDOM('label', 'outsContentLabel', '', 'padding-left:0.5em;', 'outsContentmasterStepdownSliderDiv', '', ' MHz');
    document.getElementById('outsContentLabel').setAttribute('for', 'outsContentmasterStepdownSlider');
    document.getElementById('outsContentmasterStepdownSlider').setAttribute('min', 1); 
    document.getElementById('outsContentmasterStepdownSlider').setAttribute('max', 10);
    document.getElementById('outsContentmasterStepdownSlider').setAttribute('value', 11-parseInt(window.localODB['clock'+0][9],10) );
    document.getElementById('outsContentLabel').innerHTML = (this.masterFreq / (1-(document.getElementById('outsContentmasterStepdownSlider').valueAsNumber - parseInt(document.getElementById('outsContentmasterStepdownSlider').max,10)-1))).toFixed(1) + ' MHz';
    document.getElementById('outsContentmasterStepdownSlider').onchange = function(){
        var stepdown = -(this.valueAsNumber - parseInt(this.max,10)-1),
            freqOut = window.clockPointer.masterFreq / (1+stepdown), 
            i, masterConfig=[];
            window.clockPointer.masterFreqOut = freqOut;

        document.getElementById('outsContentLabel').innerHTML = freqOut.toFixed(1) + ' MHz';
        for(i=0; i<8; i++){
            document.getElementById('frequencyOut'+i).innerHTML = freqOut.toFixed(1) + ' MHz out'
        }

        //commit new stepdown to ODB:
        for(i=0; i<window.localODB['clock0'].length; i++){
            masterConfig[i] = window.localODB[window.clockPointer.activeElt][i];
        }
        for(i=0; i<8; i++){
            masterConfig[9+4*i] = stepdown;
            masterConfig[10+4*i] = stepdown;
        }
        ODBSet('/Equipment/GRIF-Clk'+window.clockPointer.activeElt.slice(5, window.clockPointer.activeElt.length)+'/Variables/Input[*]', masterConfig);
        window.localODB[window.clockPointer.activeElt] = masterConfig;
    };
    for(i=0; i<8; i++){
        insertDOM('div', 'outsContentBadge'+i, 'clockOutputBadge', '', 'outsContent', '', this.channelTitles[i]+'<br>');

        //power toggles, don't apply to ch. 5 and 6 (LEMO)
        if(i!=6 && i!=7)
            toggleSwitch('outsContentBadge'+i, 'ch'+i+'Toggle', 'off', 'on', 'on', enableChannel.bind(null,i), disableChannel.bind(null,i), 0);
        //insertDOM('br', 'break', '', '', 'outsContentBadge'+i);

        //output frequency report
        insertDOM('p', 'frequencyOut'+i, '', 'margins:0px; margin-top:1em;', 'outsContentBadge'+i, '', '');

        //bypass reporting:
        insertDOM('p', 'bypassReport'+i, '', 'margin:0px; margin-top:1em', 'outsContentBadge'+i, '', '');

        if(i%2==1) insertDOM('br', 'break', '', '', 'outsContent');
    }
    document.getElementById('outsContentmasterStepdownSlider').onchange();

    //nav wrapper div
    insertDOM('div', this.linkWrapperID, 'navPanel', 'text-align:center; width:50%; -moz-box-sizing: border-box; -webkit-box-sizing: border-box; box-sizing: border-box;', this.wrapperID, '', '');
    //nav header
    insertDOM('h1', 'ClockLinksBanner', 'navPanelHeader', 'float:left; margin-top:0px;', this.linkWrapperID, '', window.parameters.ExpName+' Clock Status');

    //the clock view is done entirely with dom elements; most convenient to extend the central div to accommodate.
    cellSize = document.getElementById(this.linkWrapperID).offsetWidth / 100;
    //clock divs
    insertDOM('div', 'clockWrapper', '', 'clear:left;', this.linkWrapperID, '', '');
    for(i=0; i<window.parameters.nClocks; i++){
        clockStyle = 'display:inline-block; margin-left:'+(2*cellSize)+'px; margin-right:'+(2*cellSize)+'px; margin-bottom:'+2*cellSize+'px; margin-top:'+2*cellSize+'px;'
        insertDOM('div', 'clock'+i, 'clock', clockStyle , 'clockWrapper', function(){showClock(this.id)}, '');
        insertDOM('div', 'clock'+i+'title', '', '', 'clock'+i, '', 'GRIF-Clk '+i);
        toggleSwitch('clock'+i, 'clock'+i+'Toggle', '', 'Master', 'Slave', setMaster.bind(null,i), setSlave.bind(null,i), parseInt(window.localODB['clock'+i][1],10));
        if(i%5==4) insertDOM('br', 'break', '', '', 'clockWrapper');
    }

	//deploy a canvas for the clock view; this is actually just a dummy to stay consistent with all the other views, so we can use the same transition functions easily.
    insertDOM('canvas', this.canvasID, 'monitor', 'top:' + ($('#ClockLinks').height() + 5) +'px;', this.wrapperID, '', '');

    //update the text & alarms for each clock
    this.update = function(){
        var i, clock, clockData, flag, alarmString, clockAlarms = [];

        //check to make sure exactly one clock claims to be the master:
        this.noUniqueMaster = 0;
        for(i=0; i<window.parameters.nClocks; i++){
            if(window.localODB['clock'+i][1] == 1)
                this.noUniqueMaster++;
        }
        if(this.noUniqueMaster != 1)
            this.noUniqueMaster = 1;
        else
            this.noUniqueMaster = 0;

        //update text for whatever clock is showing:
        showClock(this.activeElt);

        //update alarm status
        //unset all stale alarms:
        for(i=0; i<window.parameters.nClocks; i++){
            unsetClockAlarm('clock'+i);
        }

        //no unique master alarm://////////////////////////////////////////////////
        if(this.noUniqueMaster){
            clockAlarms = [];
            //set master bin and all slaves claiming to be masters to red:
            for(i=0; i<window.parameters.nClocks; i++){
                if(parseInt(window.localODB['clock'+i][1],10)){
                    setClockAlarm('clock'+i);
                    clockAlarms[clockAlarms.length] = 'GRIF-Clk '+i;
                }
            }

            alarmString = 'Exactly one clock must claim to be the Master.  Currently, ';
            if(clockAlarms.length == 0){
                alarmString += 'none are claiming to be Master.';
                for(i=0; i<window.parameters.nClocks; i++){
                    setClockAlarm('clock'+i);
                }                
            }
            else{
                for(i=0; i<clockAlarms.length; i++){
                    alarmString += clockAlarms[i];
                    if(i==clockAlarms.length-2)
                        alarmString += ' and '
                    else if(i!=clockAlarms.length-1)
                        alarmString += ', '
                }
                if(clockAlarms.length == 2)
                    alarmString += ' are both claiming to be Master.<br>'
                else
                    alarmString += ' are all claiming to be Master.<br>'
            }
            /*
            //post an alarm to the alarm service:
            var nMasterAlarm = new  CustomEvent("alarmTrip", {
                                        detail: {
                                            alarmType: 'clock',
                                            alarmStatus: alarmString
                                        }
                                    });
            window.AlarmServices.div.dispatchEvent(nMasterAlarm);
            */
        }

        //consistency alarms////////////////////////////////////////////////////////
        for(i=0; i<window.parameters.nClocks; i++){
            clockData = window.localODB['clock'+i];
            if(clockData[1] == 1){  //check that something that says it's a master looks like a master
                flag = 0;
                if(clockData[2] != 1) flag = 1;     //Master has NIM input
                if(clockData[3] != 1) flag = 1;     //Master has NIM input
                //if(clockData[4] != 1) flag = 1;     //Master has NIM input
                if(clockData[11] != 0) flag = 1;    //Master should not bypass itelf on any channel:
                if(clockData[15] != 0) flag = 1;
                if(clockData[19] != 0) flag = 1;
                if(clockData[23] != 0) flag = 1;
                if(clockData[27] != 0) flag = 1;
                if(clockData[31] != 0) flag = 1;
                if(clockData[35] != 0) flag = 1;
                if(clockData[39] != 0) flag = 1;
            } else {  //check that something that says it's a slave looks like a slave.
                flag = 0;
                if(clockData[2] != 0) flag = 2;     //Master has NIM input
                if(clockData[3] != 0) flag = 2;     //Master has NIM input
                //if(clockData[4] != 0) flag = 2;     //Master has NIM input
                if(clockData[11] != 1) flag = 2;    //Master should not bypass itelf on any channel:
                if(clockData[15] != 1) flag = 2;
                if(clockData[19] != 1) flag = 2;
                if(clockData[23] != 1) flag = 2;
                if(clockData[27] != 1) flag = 2;
                if(clockData[31] != 1) flag = 2;
                if(clockData[35] != 1) flag = 2;
                if(clockData[39] != 1) flag = 2;
            }
            if(flag==1){
                alarmString = 'GRIF-Clk '+i+' claims to be a Master, but some of its parameters make it look like a Slave.<br>'  
                setClockAlarm('clock'+i);            
            } else if(flag==2){
                alarmString = 'GRIF-Clk '+i+' claims to be a Slave, but some of its parameters make it look like a Master.<br>'
                setClockAlarm('clock'+i);
            }
            /*
            //post an alarm to the alarm service:
            if(flag!=0){
                var consistencyAlarm = new  CustomEvent("alarmTrip", {
                                            detail: {
                                                alarmType: 'clock',
                                                alarmStatus: alarmString        
                                            }
                                        });
                window.AlarmServices.div.dispatchEvent(consistencyAlarm);
            }
            */
        }

    };

    //initial populate, and default the summary tab to open:
    this.update();
    document.getElementById('summaryarrow').onclick();

}

function setMaster(n){
    var i, masterConfig = []
    for(i=0; i<window.localODB['clock0'].length; i++){
        masterConfig[i] = window.localODB['clock'+n][i];
    }
    masterConfig[1] = 1;
    masterConfig[2] = 1;
    masterConfig[3] = 1;
    //masterConfig[4] = 1;
    masterConfig[11] = 0;
    masterConfig[15] = 0;
    masterConfig[19] = 0;
    masterConfig[23] = 0;
    masterConfig[27] = 0;
    masterConfig[31] = 0;
    masterConfig[35] = 0;
    masterConfig[39] = 0;

    ODBSet('/Equipment/GRIF-Clk'+n+'/Variables/Input[*]', masterConfig);
    window.localODB['clock'+n] = masterConfig;
    rePaint();
}

function setSlave(n){
    var i, slaveConfig = []
    for(i=0; i<window.localODB['clock0'].length; i++){
        slaveConfig[i] = window.localODB['clock'+n][i];
    }
    slaveConfig[1] = 0;
    slaveConfig[2] = 0;
    slaveConfig[3] = 0;
    //slaveConfig[4] = 0;
    slaveConfig[11] = 1;
    slaveConfig[15] = 1;
    slaveConfig[19] = 1;
    slaveConfig[23] = 1;
    slaveConfig[27] = 1;
    slaveConfig[31] = 1;
    slaveConfig[35] = 1;
    slaveConfig[39] = 1;

    ODBSet('/Equipment/GRIF-Clk'+n+'/Variables/Input[*]', slaveConfig);
    window.localODB['clock'+n] = slaveConfig;
    rePaint();
}

//turn on all four bits corresponding to the ith eSATA channel
function enableChannel(i){
    var newSettingWord = window.localODB[window.clockPointer.activeElt][0],
    clockNo = window.clockPointer.activeElt.slice(5, window.clockPointer.activeElt.length);
    newSettingWord = newSettingWord | (0xF << 4*i);
    //push to ODB
    ODBSet('/Equipment/GRIF-Clk'+clockNo+'/Variables/Input[0]', newSettingWord);
    //push to localODB:
    window.localODB['clock'+clockNo][0] = newSettingWord;
}

function disableChannel(i){
    var newSettingWord = window.localODB[window.clockPointer.activeElt][0],
    clockNo = window.clockPointer.activeElt.slice(5, window.clockPointer.activeElt.length);
    newSettingWord = newSettingWord & ~(0xF << 4*i);
    //push to ODB
    ODBSet('/Equipment/GRIF-Clk'+clockNo+'/Variables/Input[0]', newSettingWord);
    //push to localODB:
    window.localODB['clock'+clockNo][0] = newSettingWord;
}

//do something when a clock alarm is detected
function setClockAlarm(id){
    var clock =document.getElementById(id);
    clock.style.borderColor = "#FF0000";
}

//do something else when a clock alarm is unset
function unsetClockAlarm(id){
    var clock =document.getElementById(id);
    //clock.style['border-color'] = "#88FF88";  //okay in Chrome, does nothing in FF!
    clock.style.borderColor = "#88FF88";        //camel case versions of names are spec standard, Chrome and IE give CSS-literal option as a bonus.
    //$('#'+id).css('border-color', '#88FF88');  //Zepto works too

}

//set the master to use the LEMO as its reference
function masterLEMO(id){
    //push to the ODB:
    ODBSet('/Equipment/GRIF-Clk'+id.slice(5,id.length)+'/Variables/Input[4]', 1);
    //push to localODB so we don't actually have to re-fetch:
    window.localODB['clock'+id.slice(5,id.length)][4] = 1;
    //document.getElementById('clockSummaryValue3').innerHTML = '10 MHz'
    //document.getElementById('outsContentmasterStepdownSlider').onchange();
    //rePaint();
}

//set the master to use the atomic clock as its reference
function masterAC(id){
    //push to ODB:
    ODBSet('/Equipment/GRIF-Clk'+id.slice(5,id.length)+'/Variables/Input[4]', 0);
    //push to local ODB:
    window.localODB['clock'+id.slice(5,id.length)][4] = 0;
    //document.getElementById('clockSummaryValue3').innerHTML = '10 MHz';
    //document.getElementById('outsContentmasterStepdownSlider').onchange();
    //rePaint();
}

//deploy the input field for master input frequency:
function masterInputFrequency(targetID){
    document.getElementById(targetID).innerHTML = '10 MHz' //'<input id="summaryContentMasterLEMOfreq" type="number" min=0 value='+window.localODB.masterLEMOfreq+'></input>';
    /*
    document.getElementById('summaryContentMasterLEMOfreq').onchange = function(){
        ODBSet('/DashboardConfig/Clock/Master LEMO freq', parseInt(this.value,10) );
        window.localODB.masterLEMOfreq = parseInt(this.value,10);
        document.getElementById('outsContentmasterStepdownSlider').onchange();
    } 
    */   
}

//show the relevant clock information when clicked on
function showClock(id){
    var i, text, label, value, isOn, index;

    glowMe.apply(window.clockPointer, [id]);
    //only show CSAC tab for Master:
    index = parseInt(id.slice(5,id.length),10);
    if(parseInt(window.localODB['clock'+index][1],10) )
        document.getElementById('CSACTab').style.opacity = 1;
    else
        document.getElementById('CSACTab').style.opacity = 0;

    //keep track of which clock is highlit:
    window.clockPointer.activeElt = id;

    //clock summary parameters
    for(i=1; i<9; i++){
        value = humanReadableClock(i, window.localODB[id][i]);
        document.getElementById('clockSummaryValue'+i).innerHTML = value;
    }

    //master needs switch for LEMO or AC Ref. Clock:
    if(parseInt(window.localODB[id][1],10)){
        document.getElementById('clockSummaryLabel3').innerHTML = 'Ref. Clock';
        document.getElementById('clockSummaryValue3').innerHTML = '';
        toggleSwitch('clockSummaryValue3', 'masterRefToggle', 'AC', 'LEMO', 'LEMO', masterLEMO.bind(null,id), masterAC.bind(null,id), parseInt(window.localODB[id][4],10));

        //also, don't report FanSel for the master, replace with frequency info:
        document.getElementById('clockSummaryLabel4').innerHTML = 'Input Freq.:';
        document.getElementById('clockSummaryValue4').innerHTML = '10 MHz';
    } else{
        document.getElementById('clockSummaryLabel3').innerHTML = 'Clock Source';
        document.getElementById('clockSummaryLabel4').innerHTML = 'Ref. Clock';
        document.getElementById('clockSummaryValue4').innerHTML = 'N/A';
    }

    //manage clock channel out tab
    //only need master slider for master view:
    if(parseInt(window.localODB[id][1],10)){
        document.getElementById('outsContentmasterStepdownSliderDiv').style.display='block';
    } else{
        document.getElementById('outsContentmasterStepdownSliderDiv').style.display='none';
    }


    //decode which channels are on / off:
    for(i=0; i<6; i++){
        isOn = (0xF << 4*i) & window.localODB[id][0];
        if( (document.getElementById('toggleSwitch'+'ch'+i+'Toggle').style.left=='0em' && isOn) || (document.getElementById('toggleSwitch'+'ch'+i+'Toggle').style.left=='1em' && !isOn) ){
            document.getElementById('toggleWrap'+'ch'+i+'Toggle').ready = 1;
            document.getElementById('toggleSwitch'+'ch'+i+'Toggle').onmouseup();
        }
    }

    document.getElementById('bypassReport0').innerHTML = 'Bypass: ' + humanReadableClock(11, window.localODB[id][11]);
    document.getElementById('bypassReport1').innerHTML = 'Bypass: ' + humanReadableClock(15, window.localODB[id][15]);
    document.getElementById('bypassReport2').innerHTML = 'Bypass: ' + humanReadableClock(19, window.localODB[id][19]);
    document.getElementById('bypassReport3').innerHTML = 'Bypass: ' + humanReadableClock(23, window.localODB[id][23]);
    document.getElementById('bypassReport4').innerHTML = 'Bypass: ' + humanReadableClock(27, window.localODB[id][27]);
    document.getElementById('bypassReport5').innerHTML = 'Bypass: ' + humanReadableClock(39, window.localODB[id][39]);
    document.getElementById('bypassReport6').innerHTML = 'Bypass: ' + humanReadableClock(31, window.localODB[id][31]);
    document.getElementById('bypassReport7').innerHTML = 'Bypass: ' + humanReadableClock(35, window.localODB[id][35]);

    //make sure the LEMO badges match width with the rest:
    document.getElementById('outsContentBadge6').style.minWidth = document.getElementById('outsContentBadge4').offsetWidth;
    document.getElementById('outsContentBadge7').style.minWidth = document.getElementById('outsContentBadge5').offsetWidth;

    //CSAC parameters
    for(i=41; i<52; i++){
        value = humanReadableClock(i, window.localODB[id][i]);
        document.getElementById('clockCSACValue'+i).innerHTML = value;
    }

}

function glowMe(id){
    document.getElementById(this.activeElt).style.boxShadow = '0 0 0px white';
    document.getElementById(id).style.boxShadow = '0 0 20px white';
}

//translate clock parameter i of value v into something a human can comprehend:
function humanReadableClock(i, v){
    if(i == 1)
        return (parseInt(v,10)) ? 'Master' : 'Slave';
    else if(i == 2)
        return (parseInt(v,10)) ? 'LEMO' : 'eSATA';
    else if(i == 3)
        return (parseInt(v,10)) ? 'LEMO' : 'eSATA';
    else if(i == 4)
        return (parseInt(v,10)) ? 'LEMO' : 'Atomic Clock'
    else if(i>4 && i<9)
        return (parseInt(v,10)) ? 'Present' : 'Absent';
    else if(i==11 || i==15 || i==19 || i==23 || i==27 || i==31 || i==35 || i==39)
        return (parseInt(v,10)) ? 'Yes' : 'No';
    else if(i==41)
        return (parseInt(v,10)) ? 'Up' : 'Down';
    else
        return v;

}
