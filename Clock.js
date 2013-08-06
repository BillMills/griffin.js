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
    //insert some paragraphs to hold text in the default sidebars:
    insertDOM('p', 'clockSummaryText', '', 'padding-left:3em; font-size:110%;', 'summaryTab', '', '');
    insertDOM('p', 'clockOutsText', '', 'padding-left:3em; font-size:110%;', 'outsTab', '', '');
    insertDOM('p', 'clockCSACText', '', 'padding-left:3em; font-size:110%;', 'CSACTab', '', '');

    //nav wrapper div
    insertDOM('div', this.linkWrapperID, 'navPanel', 'width:50%; -moz-box-sizing: border-box; -webkit-box-sizing: border-box; box-sizing: border-box;', this.wrapperID, '', '');
    //nav header
    insertDOM('h1', 'ClockLinksBanner', 'navPanelHeader', '', this.linkWrapperID, '', window.parameters.ExpName+' Clock Status');
    insertDOM('br', 'break', '', '', this.linkWrapperID, '', '');

    //the clock view is done entirely with dom elements; most convenient to extend the central div to accommodate.
    cellSize = document.getElementById(this.linkWrapperID).offsetWidth / 100;
    insertDOM('div', 'masterClock', 'clock', 'width:'+20*cellSize+'px; height:'+10*cellSize+'px; margin-left:auto; margin-right:auto; margin-top:20px;', this.linkWrapperID, function(){showClock(this.id)}, '');
    //slaves
    for(i=0; i<24; i++){
        clockStyle = 'display:inline-block; width:'+10*cellSize+'px; height:'+10*cellSize+'px; margin-left:'+( (i%6==0) ? 10*cellSize : 2*cellSize )+'px; margin-right:'+( (i%6==5) ? 10*cellSize : 2*cellSize )+'px; margin-bottom:'+2*cellSize+'px; margin-top:'+2*cellSize+'px;'
        insertDOM('div', 'slaveClock'+i, 'clock', clockStyle , this.linkWrapperID, function(){showClock(this.id)}, '');
        if(i%6==5) insertDOM('br', 'break', '', '', this.linkWrapperID);
    }

	//deploy a canvas for the clock view; this is actually just a dummy to stay consistent with all the other views, so we can use the same transition functions easily.
    insertDOM('canvas', this.canvasID, 'monitor', 'top:' + ($('#ClockLinks').height() + 5) +'px;', this.wrapperID, '', '');

    //update the text & alarms for each clock
    this.update = function(){
        var i;

        //sort clocks into array, check to make sure exactly one of them claims to be the master:
        this.mapClocks();

        //update text for whatever clock is showing:
        showClock(this.activeClock);

        //update alarm status
        //unset all stale alarms:
        for(i=0; i<window.parameters.nClocks; i++){
            unsetClockAlarm(this.clockID[i]);
        }

        //no unique master alarm:
        if(this.noUniqueMaster){
            //set master bin and all slaves claiming to be masters to red:
            for(i=0; i<window.parameters.nClocks; i++){
                if(parseInt(window.localODB['clock'+i][1],10))
                    setClockAlarm(this.clockID[i]);
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
    clock.style['border-color'] = "#FF0000";
}

//do something else when a clock alarm is unset
function unsetClockAlarm(id){
    var clock =document.getElementById(id);
    clock.style['border-color'] = "#88FF88";
}

//show the relevant clock information when clicked on
function showClock(id){
    var i, text;

    //clock summary parameters
    text = '';
    for(i=0; i<9; i++){
        text += window.parameters.clockVariableNames[i] + ': ' + window.localODB['clock'+document.getElementById(id).clockIndex][i] + '<br>';
    }
    document.getElementById('clockSummaryText').innerHTML = text;

    //clock channel outs parameters
    text = '';
    for(i=9; i<41; i++){
        text += window.parameters.clockVariableNames[i] + ': ' + window.localODB['clock'+document.getElementById(id).clockIndex][i] + '<br>';
    }
    document.getElementById('clockOutsText').innerHTML = text;    

    //clock channel outs parameters
    text = '';
    for(i=41; i<52; i++){
        text += window.parameters.clockVariableNames[i] + ': ' + window.localODB['clock'+document.getElementById(id).clockIndex][i] + '<br>';
    }
    document.getElementById('clockCSACText').innerHTML = text;    

    //highlight the clock
    glowMe(id);

    //keep track of which clock is highlit:
    window.clockPointer.activeClock = id;

}



function glowMe(id){
    var i;

    document.getElementById('masterClock').style['box-shadow'] = '0 0 0px white'; 

    for(i=0; i<24; i++){
        if(document.getElementById('slaveClock'+i))
            document.getElementById('slaveClock'+i).style['box-shadow'] = '0 0 0px white';    
    }
    document.getElementById(id).style['box-shadow'] = '0 0 20px white';
}
