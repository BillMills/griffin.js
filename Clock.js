function Clock(){
    var i, cellSize, clockStyle,
    that = this;
    window.clockPointer = that;

	this.wrapperID = window.parameters.wrapper;	    //ID of wrapping div
	this.canvasID = 'ClockCanvas';		            //ID of canvas to paint clock on
    this.linkWrapperID = 'ClockLinks';              //ID of div to contain clock view header
    this.sidebarID = 'ClockSidebar';                //ID of div to contain clock sidebar
    this.activeClock = 'masterClock';
    this.clockID = [];
    this.noUniqueMaster = 0;

	this.wrapper = document.getElementById(this.wrapperID);

    //add top level nav button:
    insertDOM('button', 'ClockButton', 'navLink', '', 'statusLink', function(){swapView('ClockLinks', 'ClockCanvas', 'clockMenus', 'ClockButton');}, 'Clock');

    //deploy right bar menu:
    deployMenu('clockMenus', ['summary', 'outs', 'CSAC'] , ['Clock Summary','Channel Outs','CSAC Parameters']);

    //nav wrapper div
    insertDOM('div', this.linkWrapperID, 'navPanel', 'text-align:center; width:50%; -moz-box-sizing: border-box; -webkit-box-sizing: border-box; box-sizing: border-box;', this.wrapperID, '', '');
    //nav header
    insertDOM('h1', 'ClockLinksBanner', 'navPanelHeader', 'float:left; margin-top:0px;', this.linkWrapperID, '', window.parameters.ExpName+' Clock Status');
    insertDOM('br', 'break', '', '', this.linkWrapperID, '', '');

    //the clock view is done entirely with dom elements; most convenient to extend the central div to accommodate.
    cellSize = document.getElementById(this.linkWrapperID).offsetWidth / 100;
    insertDOM('div', 'masterClock', 'clock', 'clear:both; width:'+20*cellSize+'px; height:'+10*cellSize+'px; margin-left:auto; margin-right:auto; margin-top:20px;', this.linkWrapperID, function(){showClock(this.id)}, '');
    //slaves
    for(i=0; i<window.parameters.nClocks-1; i++){
        clockStyle = 'display:inline-block; width:'+10*cellSize+'px; height:'+10*cellSize+'px; margin-left:'+(2*cellSize)+'px; margin-right:'+(2*cellSize)+'px; margin-bottom:'+2*cellSize+'px; margin-top:'+2*cellSize+'px;'
        insertDOM('div', 'slaveClock'+i, 'clock', clockStyle , this.linkWrapperID, function(){showClock(this.id)}, '');
        if(i%6==5) insertDOM('br', 'break', '', '', this.linkWrapperID);
    }

	//deploy a canvas for the clock view; this is actually just a dummy to stay consistent with all the other views, so we can use the same transition functions easily.
    insertDOM('canvas', this.canvasID, 'monitor', 'top:' + ($('#ClockLinks').height() + 5) +'px;', this.wrapperID, '', '');

    //update the text & alarms for each clock
    this.update = function(){
        var i, clock, clockData, flag, alarmString;

        //sort clocks into array, check to make sure exactly one of them claims to be the master:
        this.mapClocks();

        //update text for whatever clock is showing:
        showClock(this.activeClock);

        //update alarm status
        //unset all stale alarms:
        for(i=0; i<window.parameters.nClocks; i++){
            unsetClockAlarm(this.clockID[i]);
        }

        //no unique master alarm://////////////////////////////////////////////////
        if(this.noUniqueMaster){
            //set master bin and all slaves claiming to be masters to red:
            for(i=0; i<window.parameters.nClocks; i++){
                if(parseInt(window.localODB['clock'+i][1],10)){
                    setClockAlarm(this.clockID[i]);
                }
            }

            //post an alarm to the alarm service:
            var nMasterAlarm = new  CustomEvent("alarmTrip", {
                                        detail: {
                                            alarmType: 'clock',
                                            alarmStatus: 'Exactly one clock must claim to be the Master.'        
                                        }
                                    });
            window.AlarmServices.div.dispatchEvent(nMasterAlarm);
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
                alarmString = 'Clock claims to be a master, but some of its parameters make it look like a slave.'  
                setClockAlarm(this.clockID[i]);            
            } else if(flag==2){
                alarmString = 'Clock claims to be a slave, but some of its parameters make it look like a master.'
                setClockAlarm(this.clockID[i]);
            }

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

        }

    };

    //map the clocks found in the ODB onto the grid of clock div ID's:
    this.mapClocks = function(){
        var i, nMaster=0, slaveNumber = 0;
        for(i=0; i<window.parameters.nClocks; i++){
            if(parseInt(window.localODB['clock'+i][1],10) && nMaster==0){  //whichever clock shows the Master flag first gets stuck in the master slot
                document.getElementById('masterClock').clockIndex = i;  //index 1 in clock data is the Master indicator bit
                this.clockID[i] = 'masterClock';
                nMaster++;
            } else{
                document.getElementById('slaveClock'+slaveNumber).clockIndex = i;
                this.clockID[i] = 'slaveClock'+slaveNumber;
                slaveNumber++;
                if(parseInt(window.localODB['clock'+i][1],10)) nMaster++; //count the n>1'th clock claiming to be the master, but stick it in a slave slot
            }
        }

        //set flag to trigger alarm if there isn't exactly one master:
        if(nMaster!=1)
            this.noUniqueMaster = 1;
        else
            this.noUniqueMaster = 0;
    };

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

//show the relevant clock information when clicked on
function showClock(id){
    var i, text;

    //clock summary parameters
    text = '';
    for(i=0; i<9; i++){
        text += window.parameters.clockVariableNames[i] + ': ' + window.localODB['clock'+document.getElementById(id).clockIndex][i] + '<br>';
    }
    document.getElementById('summaryContent').innerHTML = text;

    //clock channel outs parameters
    text = '';
    for(i=9; i<41; i++){
        text += window.parameters.clockVariableNames[i] + ': ' + window.localODB['clock'+document.getElementById(id).clockIndex][i] + '<br>';
    }
    document.getElementById('outsContent').innerHTML = text;    

    //clock channel outs parameters
    text = '';
    for(i=41; i<52; i++){
        text += window.parameters.clockVariableNames[i] + ': ' + window.localODB['clock'+document.getElementById(id).clockIndex][i] + '<br>';
    }
    document.getElementById('CSACContent').innerHTML = text;    

    //highlight the clock
    glowMe(id);

    //keep track of which clock is highlit:
    window.clockPointer.activeClock = id;

}



function glowMe(id){
    var i;

    document.getElementById('masterClock').style.boxShadow = '0 0 0px white'; 

    for(i=0; i<window.parameters.nClocks-1; i++){
        if(document.getElementById('slaveClock'+i))
            document.getElementById('slaveClock'+i).style.boxShadow = '0 0 0px white';    
    }
    document.getElementById(id).style.boxShadow = '0 0 20px white';
}
