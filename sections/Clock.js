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
    this.masterFreq = 100;  //master steps down from 200MHz in the spec, but seems to be 100 in practice?  TBD.
    this.channelTitles = ['eSATA 0', 'eSATA 1', 'eSATA 2', 'eSATA 3', 'eSATA 4', 'eSATA 5', 'Left LEMO', 'Right LEMO'];

	this.wrapper = document.getElementById(this.wrapperID);

    //add top level nav button:
    injectDOM('button', 'ClockButton', 'statusLink', {
        'class' : 'navLink',
        'onclick' : function(){swapView('ClockLinks', 'ClockCanvas', 'clockMenus', 'ClockButton');},
        'innerHTML' : 'Clock'
    });

    //deploy right bar menu:
    deployMenu('clockMenus', ['summary', 'outs', 'CSAC'] , ['Clock Summary','Channel Outs','CSAC Parameters']);
    //inject table into div for summary tab:
    injectDOM('table', 'summaryContentTable', 'summaryContent', {'class' : 'sidebarTable'});
    for(i=1; i<10; i++){
        label = window.parameters.clockVariableNames[i];
        injectDOM('tr', 'summaryContentRow'+i, 'summaryContentTable', {});
        injectDOM('td', 'clockSummaryLabel'+i, 'summaryContentRow'+i, {'innerHTML' : label});
        injectDOM('td', 'clockSummaryValue'+i, 'summaryContentRow'+i, {'class' : (i==4) ? 'summaryContentCell' : ''});
    }    
    //inject table for CSAC tab:
    injectDOM('table', 'CSACContentTable', 'CSACContent', {'class' : 'sidebarTable'});
    for(i=43; i<54; i++){
        label = window.parameters.clockVariableNames[i];
        injectDOM('tr', 'CSACContentRow'+i, 'CSACContentTable', {});
        injectDOM('td', 'clockCSACLabel'+i, 'CSACContentRow'+i, {'innerHTML' : label});
        injectDOM('td', 'clockCSACValue'+i, 'CSACContentRow'+i, {});
    }
    //Channel outs packed as 8 badges, with master step down slider at the top:
    injectDOM('div', 'outsContentmasterStepdownSliderDiv', 'outsContent', {
        'style' : 'display:block;',
        'innerHTML' : 'Master Output Freq.<br>'
    });
    injectDOM('input', 'outsContentmasterStepdownSlider', 'outsContentmasterStepdownSliderDiv', {'type' : 'range'});
    injectDOM('label', 'outsContentLabel', 'outsContentmasterStepdownSliderDiv', {
        'style' : 'padding-left:0.5em;',
        'innerHTML' : ' MHz'
    });

    document.getElementById('outsContentLabel').setAttribute('for', 'outsContentmasterStepdownSlider');
    document.getElementById('outsContentmasterStepdownSlider').setAttribute('min', 1); 
    document.getElementById('outsContentmasterStepdownSlider').setAttribute('max', 10);
    document.getElementById('outsContentmasterStepdownSlider').setAttribute('value', 11-parseInt(window.localODB['clock'+findMaster()][11],10) );
    document.getElementById('outsContentLabel').innerHTML = (this.masterFreq / (1-(document.getElementById('outsContentmasterStepdownSlider').valueAsNumber - parseInt(document.getElementById('outsContentmasterStepdownSlider').max,10)-1))  ).toFixed(1) + ' MHz';
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
            masterConfig[11+4*i] = stepdown;
            masterConfig[12+4*i] = stepdown;
        }
        ODBSet('/Equipment/GRIF-Clk'+window.clockPointer.activeElt.slice(5, window.clockPointer.activeElt.length)+'/Variables/Output[*]', masterConfig);
        window.localODB[window.clockPointer.activeElt] = masterConfig;
    };
    for(i=0; i<8; i++){
        injectDOM('div', 'outsContentBadge'+i, 'outsContent', {'class':'clockOutputBadge', 'innerHTML':this.channelTitles[i]+'<br>'});
        //power toggles, don't apply to ch. 5 and 6 (LEMO)
        if(i!=6 && i!=7)
            toggleSwitch('outsContentBadge'+i, 'ch'+i+'Toggle', 'off', 'on', 'on', enableChannel.bind(null,i), disableChannel.bind(null,i), 0);

        //output frequency report
        injectDOM('p', 'frequencyOut'+i, 'outsContentBadge'+i, {'style':'margins:0px; margin-top:1em;'});

        //bypass reporting:
        injectDOM('p', 'bypassReport'+i, 'outsContentBadge'+i, {'style':'margin:0px; margin-top:1em'})

        if(i%2==1)
            injectDOM('br', 'break', 'outsContent', {});
    }
    document.getElementById('outsContentmasterStepdownSlider').onchange();

    //nav wrapper div
    injectDOM('div', this.linkWrapperID, this.wrapperID, {
        'class' : 'navPanel',
        'style' : 'text-align:center; width:50%; -moz-box-sizing: border-box; -webkit-box-sizing: border-box; box-sizing: border-box;'
    })
    //nav header
    injectDOM('h1', 'ClockLinksBanner', this.linkWrapperID, {
        'class' : 'navPanelHeader',
        'style' : 'float:left; margin-top:0px;',
        'innerHTML' : ODB.topLevel.expName+' Clock Status'
    });

    //the clock view is done entirely with dom elements; most convenient to extend the central div to accommodate.
    cellSize = document.getElementById(this.linkWrapperID).offsetWidth / 100;
    //clock divs
    injectDOM('div', 'clockWrapper', this.linkWrapperID, {'style' : 'clear:left'});
    for(i=0; i<window.parameters.nClocks; i++){
        clockStyle = 'display:inline-block; margin-left:'+(2*cellSize)+'px; margin-right:'+(2*cellSize)+'px; margin-bottom:'+2*cellSize+'px; margin-top:'+2*cellSize+'px;'
        injectDOM('div', 'clock'+i, 'clockWrapper', {
            'class' : 'clock',
            'style' : clockStyle,
            'onclick' : function(){showClock(this.id)}
        });
        injectDOM('div', 'clock'+i+'title', 'clock'+i, {'innerHTML':'GRIF-Clk'+i});
        toggleSwitch('clock'+i, 'clock'+i+'Toggle', '', 'Master', 'Slave', setMaster.bind(null,i), setSlave.bind(null,i), parseInt(window.localODB['clock'+i][1],10));
        if(i%5==4)
            injectDOM('br', 'break', 'clockWrapper', {});
    }

	//deploy a canvas for the clock view; this is actually just a dummy to stay consistent with all the other views, so we can use the same transition functions easily.
    injectDOM('canvas', this.canvasID, this.wrapperID, {
        'class' : 'monitor',
        'width' : 1,
        'height': 1,
        'style' : 'top:' + ($('#ClockLinks').height() + 5) +'px;'
    });

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
            window.AlarmServices.clockAlarms[window.AlarmServices.clockAlarms.length] = alarmString;
        }

        //consistency alarms////////////////////////////////////////////////////////
        for(i=0; i<window.parameters.nClocks; i++){
            clockData = window.localODB['clock'+i];
            if(clockData[1] == 1){  //check that something that says it's a master looks like a master
                flag = 0;
                if(clockData[2] != 1) flag = 1;     //Master has NIM input
                if(clockData[3] != 1) flag = 1;     //Master has NIM input
                //if(clockData[4] != 1) flag = 1;     //Master has NIM input
                if(clockData[13] != 0) flag = 1;    //Master should not bypass itelf on any channel:
                if(clockData[17] != 0) flag = 1;
                if(clockData[21] != 0) flag = 1;
                if(clockData[25] != 0) flag = 1;
                if(clockData[29] != 0) flag = 1;
                if(clockData[33] != 0) flag = 1;
                if(clockData[37] != 0) flag = 1;
                if(clockData[41] != 0) flag = 1;
            } else {  //check that something that says it's a slave looks like a slave.
                flag = 0;
                if(clockData[2] != 0) flag = 2;     //Master has NIM input
                if(clockData[3] != 0) flag = 2;     //Master has NIM input
                //if(clockData[4] != 0) flag = 2;     //Master has NIM input
                if(clockData[13] != 1) flag = 2;    //Master should not bypass itelf on any channel:
                if(clockData[17] != 1) flag = 2;
                if(clockData[21] != 1) flag = 2;
                if(clockData[25] != 1) flag = 2;
                if(clockData[29] != 1) flag = 2;
                if(clockData[33] != 1) flag = 2;
                if(clockData[37] != 1) flag = 2;
                if(clockData[41] != 1) flag = 2;
            }
            if(flag==1){
                alarmString = 'GRIF-Clk '+i+' claims to be a Master, but some of its parameters make it look like a Slave.<br>'  
                setClockAlarm('clock'+i);            
            } else if(flag==2){
                alarmString = 'GRIF-Clk '+i+' claims to be a Slave, but some of its parameters make it look like a Master.<br>'
                setClockAlarm('clock'+i);
            }
            if(flag!=0)
                window.AlarmServices.clockAlarms[window.AlarmServices.clockAlarms.length] = alarmString;
        }

    };

    //initial populate, and default the summary tab to open:
    this.update();
    document.getElementById('summaryarrow').onclick();
    //make sure no double counting in the alarm service:
    window.AlarmServices.wipeAlarms();

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
    masterConfig[13] = 0;
    masterConfig[17] = 0;
    masterConfig[21] = 0;
    masterConfig[25] = 0;
    masterConfig[29] = 0;
    masterConfig[33] = 0;
    masterConfig[37] = 0;
    masterConfig[41] = 0;

    ODBSet('/Equipment/GRIF-Clk'+n+'/Variables/Output[*]', masterConfig);
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
    slaveConfig[13] = 1;
    slaveConfig[17] = 1;
    slaveConfig[21] = 1;
    slaveConfig[25] = 1;
    slaveConfig[29] = 1;
    slaveConfig[33] = 1;
    slaveConfig[37] = 1;
    slaveConfig[41] = 1;

    ODBSet('/Equipment/GRIF-Clk'+n+'/Variables/Output[*]', slaveConfig);
    window.localODB['clock'+n] = slaveConfig;
    rePaint();
}

//turn on all four bits corresponding to the ith eSATA channel
function enableChannel(i){
    var newSettingWord = window.localODB[window.clockPointer.activeElt][0],
    clockNo = window.clockPointer.activeElt.slice(5, window.clockPointer.activeElt.length);
    newSettingWord = newSettingWord | (0xF << 4*i);
    //push to ODB
    ODBSet('/Equipment/GRIF-Clk'+clockNo+'/Variables/Output[0]', newSettingWord);
    //push to localODB:
    window.localODB['clock'+clockNo][0] = newSettingWord;
}

function disableChannel(i){
    var newSettingWord = window.localODB[window.clockPointer.activeElt][0],
    clockNo = window.clockPointer.activeElt.slice(5, window.clockPointer.activeElt.length);
    newSettingWord = newSettingWord & ~(0xF << 4*i);
    //push to ODB
    ODBSet('/Equipment/GRIF-Clk'+clockNo+'/Variables/Output[0]', newSettingWord);
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
    ODBSet('/Equipment/GRIF-Clk'+id.slice(5,id.length)+'/Variables/Output[4]', 1);
    //push to localODB so we don't actually have to re-fetch:
    window.localODB['clock'+id.slice(5,id.length)][4] = 1;
    //document.getElementById('clockSummaryValue3').innerHTML = '10 MHz'
    //document.getElementById('outsContentmasterStepdownSlider').onchange();
    //rePaint();
}

//set the master to use the atomic clock as its reference
function masterAC(id){
    //push to ODB:
    ODBSet('/Equipment/GRIF-Clk'+id.slice(5,id.length)+'/Variables/Output[4]', 0);
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

    //master reports NIM clock, slave reports ESATA clock
    if(parseInt(window.localODB[id][1],10)){
        document.getElementById('clockSummaryLabel9').innerHTML = 'Last NIM Sync';
        document.getElementById('clockSummaryValue9').innerHTML = humanReadableClock(10, window.localODB[id][10]);
    } else {
        document.getElementById('clockSummaryLabel9').innerHTML = 'Last eSATA Sync';
        document.getElementById('clockSummaryValue9').innerHTML = humanReadableClock(9, window.localODB[id][9]);
    }

    //kick summary tab to make sure it's the right size
    document.getElementById('summaryTab').style.maxHeight = (document.getElementById('summaryContent').offsetHeight+50)+'px';

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

    document.getElementById('bypassReport0').innerHTML = 'Bypass: ' + humanReadableClock(13, window.localODB[id][13]);
    document.getElementById('bypassReport1').innerHTML = 'Bypass: ' + humanReadableClock(17, window.localODB[id][17]);
    document.getElementById('bypassReport2').innerHTML = 'Bypass: ' + humanReadableClock(21, window.localODB[id][21]);
    document.getElementById('bypassReport3').innerHTML = 'Bypass: ' + humanReadableClock(25, window.localODB[id][25]);
    document.getElementById('bypassReport4').innerHTML = 'Bypass: ' + humanReadableClock(29, window.localODB[id][29]);
    document.getElementById('bypassReport5').innerHTML = 'Bypass: ' + humanReadableClock(41, window.localODB[id][41]);
    document.getElementById('bypassReport6').innerHTML = 'Bypass: ' + humanReadableClock(33, window.localODB[id][33]);
    document.getElementById('bypassReport7').innerHTML = 'Bypass: ' + humanReadableClock(37, window.localODB[id][37]);

    //make sure the LEMO badges match width with the rest:
    document.getElementById('outsContentBadge6').style.minWidth = document.getElementById('outsContentBadge4').offsetWidth;
    document.getElementById('outsContentBadge7').style.minWidth = document.getElementById('outsContentBadge5').offsetWidth;

    //CSAC parameters
    for(i=43; i<54; i++){
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
    else if(i==9 || i==10)
        return Math.floor(v/3600) + ' h: ' + Math.floor((v%3600)/60) + ' m';
    else if(i==13 || i==17 || i==21 || i==25 || i==29 || i==33 || i==37 || i==41)
        return (parseInt(v,10)) ? 'Yes' : 'No';
    else if(i==43)
        return (parseInt(v,10)) ? 'Up' : 'Down';
    else
        return v;

}

//return the index of the first clock claiming to be master
function findMaster(){
    var i, masterIndex = 0;

    for(i=0; i<window.parameters.nClocks; i++){
        if(parseInt(window.localODB['clock'+i][1],10) == 1){
            masterIndex = i;
            break;
        }
    }
    return masterIndex;
}

/*
SYNC:
MASTER == NIM
SLAVE == ESATA
*/