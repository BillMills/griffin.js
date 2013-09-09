function AlarmService(sidebarDivID, sidebarDetailDivID){
    var i;

	this.sidebarDivID = sidebarDivID;					//ID of div wrapping left sidebar
	this.sidebarDetailDivID = sidebarDetailDivID;		//ID of div wrapping detail level sidebar elements
	this.canvasID = 'alarmCanvas';						//ID of canvas to draw alarms on
	this.pID = 'alarmText';								//ID of <p> to write alarm text in

    this.nCrates = window.parameters.moduleSizes.length;

	//arrays of info for state reporting - repopulated every loop
	this.demandVoltage = [];
	this.reportVoltage = [];
	this.reportCurrent = [];
	this.reportTemperature = [];
    for(i=0; i<this.nCrates; i++){
        this.demandVoltage[i] = [];
        this.reportVoltage[i] = [];
        this.reportCurrent[i] = [];
        this.reportTemperature[i] = [];
    }

	var that = this;

	//number of alarms to report:
	this.nAlarms = 200;

	//arrays to hold alarm info:
	this.voltageAlarms = [];
	this.currentAlarms = [];
	this.temperatureAlarms = [];
	this.rateAlarms = [];
    this.clockAlarms = [];

    //remember last message printed to the message log, only print when the message changes:
    this.lastVoltageMessage = '';
    this.lastCurrentMessage = '';
    this.lastTemperatureMessage = '';
    this.lastRateMessage = '';
    this.lastClockMessage = '';

	//establish animation parameters:
    this.FPS = 30;
    this.duration = 0.3;
    this.nFrames = this.FPS*this.duration;

    //minimum height of detail-level canvas:
    this.minBKGheight = $('#'+window.parameters.wrapper).height()*0.9;
    //height of detail-level canvas in previous update:
    this.bkgCanvasHeight = this.minBKGheight;

	//DOM manipulation//////////////////////////////////////////////////////////

	//insert canvas into alarm div:
	/*
    this.wrapper = document.getElementById(this.sidebarDivID);
    this.canvasWidth = 0.8*$(this.wrapper).width();
    this.canvasHeight = 0.05*$(this.wrapper).height();
    insertCanvas(this.canvasID, 'alarmDetailBackground', 'z-index:-1;', this.canvasWidth, this.canvasHeight, this.divID);
	this.canvas = document.getElementById(this.canvasID);
	this.context = this.canvas.getContext('2d');
	*/
	//insert <p> into detail-level left div:
    insertDOM('p', this.pID, 'alarmPara', '', this.sidebarDetailDivID, '', '')
	//make detail paragraph disappear onclick:
	document.getElementById(this.pID).setAttribute('onclick', 'javascript:hideDetail()');
	//insert button to call out alarm detail:
    if(window.parameters.topDeployment.HV) insertDOM('button', 'alarmDetailButton', 'alarmButton', '', this.sidebarDivID, function(){showDetail()}, 'Alarms')
    //document.getElementById('alarmDetailButton').setAttribute('disabled', 'true');
	//end DOM manipulation//////////////////////////////////////////////////////

	//event listeners///////////////////////////////////////////////////////////
	//event listeners register alarms to arrays, and wait for the update to be complete.
	this.div = document.getElementById(this.sidebarDivID);
	this.div.addEventListener("alarmTrip", function(e){
    	registerAlarm(that,e);
    });

    //another listener waits for all the alarms to be in before triggering sort & publish:
    this.div.addEventListener("refreshComplete", function(e){
    	publishAlarms(that);
    });
    //end event listeners//////////////////////////////////////////////////////

    //member functions/////////////////////////////////////////////////////////

    //sort the alarms by severity:
    this.sortAlarms = function(){

    	//define sort function:
    	function sortAlarms(a, b){
        	if (a[3] > b[3]) return -1;
        	if (a[3] < b[3]) return 1;
        	else return 0;
    	}

    	this.voltageAlarms.sort(sortAlarms);
    	this.currentAlarms.sort(sortAlarms);
    	this.temperatureAlarms.sort(sortAlarms);
    	this.rateAlarms.sort(sortAlarms);

    };

    //print the alarms to the <p>:
    this.printAlarms = function(){
    	var i,
    	    alarmText = '',
    	    slot = -1,
    	    channel = -1,
            messageLogText = '',
            MIDASalarms = ODBGetAlarms();

        //include all the MIDAS alarms:
        if(MIDASalarms.length > 0){
            alarmText += '<h2>MIDAS Alarms</h2>'
            for(i=0; i<MIDASalarms.length; i++){
                alarmText += MIDASalarms[i] + '<br><br>';
            }
        }

        //Voltage, loop this with current and temperature plz
        messageLogText = '';
    	if(this.voltageAlarms.length != 0){
            alarmText += '<h2>Voltage Alarms</h2>';
            messageLogText = 'Voltage alarms thrown by ';
        }
    	for(i=0; i<Math.min(this.voltageAlarms.length, this.nAlarms); i++){
    		slot = primaryBin(window.parameters.moduleSizes[this.voltageAlarms[i][2]], this.voltageAlarms[i][1]);
    		channel = channelMap(this.voltageAlarms[i][1], this.voltageAlarms[i][0], window.parameters.moduleSizes[this.voltageAlarms[i][2]], window.parameters.rows + 1);
    		if(channel == -1){
    			alarmText += 'Slot ' + slot + ' Primary' + '<br>';	
    		} else
	    		alarmText += 'Slot ' + slot + ', Ch. ' + channel + '<br>';

    		alarmText += 'Demand Voltage: ' + (this.demandVoltage[this.voltageAlarms[i][2]][this.voltageAlarms[i][0]][this.voltageAlarms[i][1]]).toFixed(window.parameters.alarmPrecision) + ' V<br>';
    		alarmText += 'Report Voltage: ' + (this.reportVoltage[this.voltageAlarms[i][2]][this.voltageAlarms[i][0]][this.voltageAlarms[i][1]]).toFixed(window.parameters.alarmPrecision) + ' V<br><br>';

            if(i>0) messageLogText += ', ';
            messageLogText += (channel == -1) ? ('Slot ' + slot + ' Primary') : ('Slot ' + slot + ', Ch. ' + channel);

    	}
        if(messageLogText != this.lastVoltageMessage){
            if(messageLogText == '')
                ODBSet('/DashboardConfig/CustomAlarms/Voltage', 0);
            else{    
                ODBSet('/DashboardConfig/CustomAlarms/Voltage', 1);
                ODBGenerateMsg(messageLogText);
                this.lastVoltageMessage = messageLogText;
            }
        }

        //current
        messageLogText = '';
    	if(this.currentAlarms.length != 0){ 
            alarmText += '<h2>Current Alarms</h2>';
            messageLogText = 'Current alarms thrown by ';
        }
    	for(i=0; i<Math.min(this.currentAlarms.length, this.nAlarms); i++){
    		slot = primaryBin(window.parameters.moduleSizes[this.currentAlarms[i][2]], this.currentAlarms[i][1]);
    		channel = channelMap(this.currentAlarms[i][1], this.currentAlarms[i][0], window.parameters.moduleSizes[this.currentAlarms[i][2]], window.parameters.rows + 1);
    		if(channel == -1){
    			alarmText += 'Slot ' + slot + ' Primary' + '<br>';	
    		} else
	    		alarmText += 'Slot ' + slot + ', Ch. ' + channel + '<br>';
    		alarmText += (this.reportCurrent[this.currentAlarms[i][2]][this.currentAlarms[i][0]][this.currentAlarms[i][1]]).toFixed(window.parameters.alarmPrecision) + ' uA<br><br>';

            if(i>0) messageLogText += ', ';
            messageLogText += (channel == -1) ? ('Slot ' + slot + ' Primary') : ('Slot ' + slot + ', Ch. ' + channel);
    	}
        if(messageLogText != this.lastCurrentMessage){
            if(messageLogText == '')
                ODBSet('/DashboardConfig/CustomAlarms/Current', 0);
            else{    
                ODBSet('/DashboardConfig/CustomAlarms/Current', 1);
                ODBGenerateMsg(messageLogText);
                this.lastCurrentMessage = messageLogText;
            }
        }

        //temperature
        messageLogText = '';
    	if(this.temperatureAlarms.length != 0){
            alarmText += '<h2>Temperature Alarms</h2>';
            messageLogText = 'Temperature alarms thrown by ';
        }
    	for(i=0; i<Math.min(this.temperatureAlarms.length, this.nAlarms); i++){
	   		slot = primaryBin(window.parameters.moduleSizes[this.temperatureAlarms[i][2]], this.temperatureAlarms[i][1]);
    		channel = channelMap(this.temperatureAlarms[i][1], this.temperatureAlarms[i][0], window.parameters.moduleSizes[this.temperatureAlarms[i][2]], window.parameters.rows + 1);
    		if(channel == -1){
    			alarmText += 'Slot ' + slot + ' Primary' + '<br>';	
    		} else
	    		alarmText += 'Slot ' + slot + ', Ch. ' + channel + '<br>';
    		alarmText += (this.reportTemperature[this.temperatureAlarms[i][2]][this.temperatureAlarms[i][0]][this.temperatureAlarms[i][1]]).toFixed(window.parameters.alarmPrecision) + ' C<br><br>';

            if(i>0) messageLogText += ', ';
            messageLogText += (channel == -1) ? ('Slot ' + slot + ' Primary') : ('Slot ' + slot + ', Ch. ' + channel);            
    	}
        if(messageLogText != this.lastCurrentMessage){
            if(messageLogText == '')
                ODBSet('/DashboardConfig/CustomAlarms/Temperature', 0);
            else{    
                ODBSet('/DashboardConfig/CustomAlarms/Temperature', 1);
                ODBGenerateMsg(messageLogText);
                this.lastTemperatureMessage = messageLogText;
            }
        }

        //rate TBD
    	if(this.rateAlarms.length != 0) alarmText += '<h2>Rate Alarms</h2>'
    	for(i=0; i<Math.min(this.rateAlarms.length, this.nAlarms); i++){
    		alarmText += this.rateAlarms[i] + '<br>';
    	}

        //clock TBD
        if(this.clockAlarms.length !=0) alarmText += '<h2>Clock Alarms</h2>'
        for(i=0; i<this.clockAlarms.length; i++){
            alarmText += this.clockAlarms[i]+'<br>';
        }

    	if(alarmText != ''){
    		$('#alarmDetailButton').css('background-color', '#FF0000');
    	} else {
    		alarmText = 'All Clear';
    		$('#alarmDetailButton').css('background-color', '#999999');
    	}

    	//document.getElementById(this.pID).innerHTML = alarmText;
    	this.updateText(alarmText);
    };

    //dump alarm data in preperation for next update:
    this.wipeAlarms = function(){
		this.voltageAlarms = [];
		this.currentAlarms = [];
		this.temperatureAlarms = [];
		this.rateAlarms = [];
        this.clockAlarms = [];
    };

    //update the text:
    this.updateText = function(content){
	    document.getElementById('alarmText').innerHTML = content;
    };

}



function registerAlarm(object, e){
	if(e.detail.alarmType == 'voltage'){
		object.voltageAlarms[object.voltageAlarms.length] = e.detail.alarmStatus;
	} else if(e.detail.alarmType == 'current'){
		object.currentAlarms[object.currentAlarms.length] = e.detail.alarmStatus;
	} else if(e.detail.alarmType == 'temperature'){
		object.temperatureAlarms[object.temperatureAlarms.length] = e.detail.alarmStatus;
	} else if(e.detail.alarmType == 'rate'){
		object.rateAlarms[object.rateAlarms.length] = e.detail.alarmStatus;
	} else if(e.detail.alarmType == 'clock'){
        object.clockAlarms[object.clockAlarms.length] = e.detail.alarmStatus;
    }
}

function publishAlarms(object){
	object.sortAlarms();
	object.printAlarms();
	object.wipeAlarms();
}


function showDetail(){
	//tabBKG('LeftSidebarDetailBKG', 'left');

    //$('#LeftSidebarDetailBKG').css('z-index', '0');
    //$('#LeftSidebarDetailBKG').css('opacity', '1');

	$('#leftSidebarDetail').css('z-index', '10');
	$('#leftSidebarDetail').css('opacity', '1');

    $('#leftSidebar').css('z-index', '-1');
    $('#leftSidebar').css('opacity', '0');
}

function hideDetail(){
	$('#leftSidebarDetail').css('z-index', '-1');
	$('#leftSidebarDetail').css('opacity', '0');

    $('#leftSidebar').css('z-index', '10');
    $('#leftSidebar').css('opacity', '1');
}