function Clock(){
    var i, cellSize, clockStyle,
    that = this;
    window.clockPointer = that;

	this.wrapperID = window.parameters.wrapper;	    //ID of wrapping div
	this.canvasID = 'ClockCanvas';		            //ID of canvas to paint clock on
    this.linkWrapperID = 'ClockLinks';              //ID of div to contain clock view header
    this.sidebarID = 'ClockSidebar';                //ID of div to contain clock sidebar
    this.activeClock = 'clock0';
    this.noUniqueMaster = 0;
    this.channelTitles = ['eSATA 0', 'eSATA 1', 'eSATA 2', 'eSATA 3', 'eSATA 4', 'eSATA 5', 'Left LEMO', 'Right LEMO'];

	this.wrapper = document.getElementById(this.wrapperID);

    //add top level nav button:
    insertDOM('button', 'ClockButton', 'navLink', '', 'statusLink', function(){swapView('ClockLinks', 'ClockCanvas', 'clockMenus', 'ClockButton');}, 'Clock');

    //deploy right bar menu:
    deployMenu('clockMenus', ['summary', 'outs', 'CSAC'] , ['Clock Summary','Channel Outs','CSAC Parameters']);
    //inject table into div for summary & CSAC:
    insertDOM('table', 'summaryContentTable', 'sidebarTable', '', 'summaryContent', '', '');
    insertDOM('table', 'CSACContentTable', 'sidebarTable', '', 'CSACContent', '', '');
    //Channel outs packed as 8 badges:
    for(i=0; i<8; i++){
        insertDOM('div', 'outsContentBadge'+i, 'clockOutputBadge', '', 'outsContent', '', this.channelTitles[i]+'<br>');

        //power toggles, don't apply to ch. 5 and 6 (LEMO)
        if(i!=6 && i!=7)
            toggleSwitch('outsContentBadge'+i, 'ch'+i+'Toggle', 'off', 'on', 'on', enableChannel.bind(null,i), disableChannel.bind(null,i), 0);
        //insertDOM('br', 'break', '', '', 'outsContentBadge'+i);

        //frequency control
        insertDOM('label', 'frequencyLabel'+i, '', '', 'outsContentBadge'+i, '', 'freq.');
        insertDOM('input', 'frequencyField'+i, '', 'width:5em; margin:2px; margin-top:0.75em', 'outsContentBadge'+i, '', '', '', 'number');
        insertDOM('label', 'frequencyUnit'+i, '', '', 'outsContentBadge'+i, '', 'MHz');
        document.getElementById('frequencyLabel'+i).setAttribute('for', 'frequencyField'+i);

        //bypass reporting:
        insertDOM('p', 'bypassReport'+i, '', 'margin:0px; margin-top:1em', 'outsContentBadge'+i, '', '');

        if(i%2==1) insertDOM('br', 'break', '', '', 'outsContent');
    }

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
        showClock(this.activeClock);

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
                if(clockData[4] != 1) flag = 1;     //Master has NIM input
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
                if(clockData[4] != 0) flag = 2;     //Master has NIM input
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
    ODBSet('/Equipment/GRIF-Clk'+n+'/Variables/Input[1]', 1);
    ODBSet('/Equipment/GRIF-Clk'+n+'/Variables/Input[2]', 1);
    ODBSet('/Equipment/GRIF-Clk'+n+'/Variables/Input[3]', 1);
    ODBSet('/Equipment/GRIF-Clk'+n+'/Variables/Input[4]', 1);
    ODBSet('/Equipment/GRIF-Clk'+n+'/Variables/Input[11]', 0);
    ODBSet('/Equipment/GRIF-Clk'+n+'/Variables/Input[15]', 0);
    ODBSet('/Equipment/GRIF-Clk'+n+'/Variables/Input[19]', 0);
    ODBSet('/Equipment/GRIF-Clk'+n+'/Variables/Input[23]', 0);
    ODBSet('/Equipment/GRIF-Clk'+n+'/Variables/Input[27]', 0);
    ODBSet('/Equipment/GRIF-Clk'+n+'/Variables/Input[31]', 0);
    ODBSet('/Equipment/GRIF-Clk'+n+'/Variables/Input[35]', 0);
    ODBSet('/Equipment/GRIF-Clk'+n+'/Variables/Input[39]', 0);
    forceUpdate();
}

function setSlave(n){
    ODBSet('/Equipment/GRIF-Clk'+n+'/Variables/Input[1]', 0);
    ODBSet('/Equipment/GRIF-Clk'+n+'/Variables/Input[2]', 0);
    ODBSet('/Equipment/GRIF-Clk'+n+'/Variables/Input[3]', 0);
    ODBSet('/Equipment/GRIF-Clk'+n+'/Variables/Input[4]', 0);
    ODBSet('/Equipment/GRIF-Clk'+n+'/Variables/Input[11]', 1);
    ODBSet('/Equipment/GRIF-Clk'+n+'/Variables/Input[15]', 1);
    ODBSet('/Equipment/GRIF-Clk'+n+'/Variables/Input[19]', 1);
    ODBSet('/Equipment/GRIF-Clk'+n+'/Variables/Input[23]', 1);
    ODBSet('/Equipment/GRIF-Clk'+n+'/Variables/Input[27]', 1);
    ODBSet('/Equipment/GRIF-Clk'+n+'/Variables/Input[31]', 1);
    ODBSet('/Equipment/GRIF-Clk'+n+'/Variables/Input[35]', 1);
    ODBSet('/Equipment/GRIF-Clk'+n+'/Variables/Input[39]', 1);
    forceUpdate();
}

//turn on all four bits corresponding to the ith eSATA channel
function enableChannel(i){
    var newSettingWord = window.localODB[window.clockPointer.activeClock][0];
    newSettingWord = newSettingWord | (0xF << 4*i);
    ODBSet('/Equipment/GRIF-Clk'+window.clockPointer.activeClock.slice(5, window.clockPointer.activeClock.length)+'/Variables/Input[0]', newSettingWord);
    forceUpdate();
}

function disableChannel(i){
    var newSettingWord = window.localODB[window.clockPointer.activeClock][0];
    newSettingWord = newSettingWord & ~(0xF << 4*i);
    ODBSet('/Equipment/GRIF-Clk'+window.clockPointer.activeClock.slice(5, window.clockPointer.activeClock.length)+'/Variables/Input[0]', newSettingWord);
    forceUpdate();
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
    ODBSet('/Equipment/GRIF-Clk'+id.slice(5,id.length)+'/Variables/Input[4]', 1);
    forceUpdate();
}

//set the master to use the atomic clock as its reference
function masterAC(id){
    ODBSet('/Equipment/GRIF-Clk'+id.slice(5,id.length)+'/Variables/Input[4]', 0);
    forceUpdate();
}

//show the relevant clock information when clicked on
function showClock(id){
    var i, text, label, value, isOn;

    //keep track of which clock is highlit:
    window.clockPointer.activeClock = id;

    //clock summary parameters
    document.getElementById('summaryContentTable').innerHTML = '';
    for(i=1; i<9; i++){
        if(parseInt(window.localODB[id][1],10) && i==3) continue; //don't report FanSel for the master.
        label = window.parameters.clockVariableNames[i];
        value = humanReadableClock(i, window.localODB[id][i]);
        insertDOM('tr', 'summaryContentRow'+i, '', '', 'summaryContentTable', '', '');
        insertDOM('td', 'clockSummaryLabel'+i, '', '', 'summaryContentRow'+i, '', label);
        insertDOM('td', 'clockSummaryValue'+i, '', '', 'summaryContentRow'+i, '', value);
    }
    //master needs switch for LEMO or AC Ref. Clock:
    if(parseInt(window.localODB[id][1],10)){
        document.getElementById('clockSummaryValue4').innerHTML = '';
        toggleSwitch('clockSummaryValue4', 'masterRefToggle', 'AC', 'LEMO', 'LEMO', masterLEMO.bind(null,id), masterAC.bind(null,id), parseInt(window.localODB[id][4],10));
    }


/*
    //clock channel outs parameters
    document.getElementById('outsContent').innerHTML = '';
    //special placement for i=0 at user request:
    text = window.parameters.clockVariableNames[0] + ': ' + humanReadableClock(i, window.localODB[id][0]) + '<br>';
    insertDOM('p', 'outsContent0', 'hanging', '', 'outsContent', '', text);    
    for(i=9; i<41; i++){
        text = window.parameters.clockVariableNames[i] + ': ' + humanReadableClock(i, window.localODB[id][i]) + '<br>';
        insertDOM('p', 'outsContent'+i, 'hanging', '', 'outsContent', '', text);
    }
*/
    //manage clock channel out tab
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

    //CSAC parameters
    document.getElementById('CSACContentTable').innerHTML = '';
    for(i=41; i<52; i++){
        label = window.parameters.clockVariableNames[i];
        value = humanReadableClock(i, window.localODB[id][i]);
        insertDOM('tr', 'CSACContentRow'+i, '', '', 'CSACContentTable', '', '');
        insertDOM('td', 'clockCSACLabel'+i, '', '', 'CSACContentRow'+i, '', label);
        insertDOM('td', 'clockCSACValue'+i, '', '', 'CSACContentRow'+i, '', value);
    }

    //highlight the clock
    glowMe(id);

    

}

function glowMe(id){
    var i, index;

    for(i=0; i<window.parameters.nClocks; i++){
        if(document.getElementById('clock'+i))
            document.getElementById('clock'+i).style.boxShadow = '0 0 0px white';    
    }
    document.getElementById(id).style.boxShadow = '0 0 20px white';
    index = parseInt(id.slice(5,id.length),10);
    if(parseInt(window.localODB['clock'+index][1],10) )
        document.getElementById('CSACTab').style.opacity = 1;
    else
        document.getElementById('CSACTab').style.opacity = 0;

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
