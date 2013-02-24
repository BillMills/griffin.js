function AlarmService(sidebarDivID, sidebarDetailDivID, alarmThresholds, scaleMaxima, precision){
	this.sidebarDivID = sidebarDivID;					//ID of div wrapping left sidebar
	this.sidebarDetailDivID = sidebarDetailDivID;		//ID of div wrapping detail level sidebar elements
	this.canvasID = 'alarmCanvas';						//ID of canvas to draw alarms on
	this.pID = 'alarmText';								//ID of <p> to write alarm text in
	this.alarmThresholds = alarmThresholds;				//array containing threshold for alarms: [voltage, current, temperature, rate]
	this.scaleMaxima = scaleMaxima;						//array containing upper scale limit for alarm reporting, as alarmThresholds.
	this.precision = precision;							//number of decimals to keep in alarm reporting

	//arrays of info for state reporting - repopulated every loop
	this.demandVoltage = [];
	this.reportVoltage = [];
	this.reportCurrent = [];
	this.reportTemperature = [];

	var that = this;

	//number of alarms to report:
	this.nAlarms = 5000;

	//arrays to hold alarm info:
	this.voltageAlarms = [];
	this.currentAlarms = [];
	this.temperatureAlarms = [];
	this.rateAlarms = [];

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
	insertParagraph(this.pID, 'alarmPara', 'width:'+this.canvasWidth+'px;', this.sidebarDetailDivID, '');
	//make detail paragraph disappear onclick:
	document.getElementById(this.pID).setAttribute('onclick', 'javascript:hideDetail()');
	//insert button to call out alarm detail:
	insertButton('alarmDetailButton', 'alarmButton', 'javascript:showDetail()', this.sidebarDivID, 'Alarms');
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
        	if (a[2] > b[2]) return -1;
        	if (a[2] < b[2]) return 1;
        	else return 0;
    	}

    	this.voltageAlarms.sort(sortAlarms);
    	this.currentAlarms.sort(sortAlarms);
    	this.temperatureAlarms.sort(sortAlarms);
    	this.rateAlarms.sort(sortAlarms);

    };

    //print the alarms to the <p>:
    this.printAlarms = function(){
    	var i;
    	var alarmText = '';
    	var slot = -1;
    	var cahnnel = -1;
    	if(this.voltageAlarms.length != 0) alarmText += 'Voltage Alarms<br>'
    	for(i=0; i<Math.min(this.voltageAlarms.length, this.nAlarms); i++){
    		slot = primaryBin(window.moduleSizes, this.voltageAlarms[i][1]);
    		channel = channelMap(this.voltageAlarms[i][1], this.voltageAlarms[i][0], window.moduleSizes, window.rows + 1);
    		if(channel == -1){
    			alarmText += 'Slot ' + slot + ' Primary' + '<br>';	
    		} else
	    		alarmText += 'Slot ' + slot + ', Ch. ' + channel + '<br>';
    		alarmText += 'Demand Voltage: ' + (this.demandVoltage[this.voltageAlarms[i][0]][this.voltageAlarms[i][1]]).toFixed(this.precision) + ' V<br>';
    		alarmText += 'Report Voltage: ' + (this.reportVoltage[this.voltageAlarms[i][0]][this.voltageAlarms[i][1]]).toFixed(this.precision) + ' V<br><br>';

    	}

    	if(this.currentAlarms.length != 0) alarmText += '<br>Current Alarms<br>'
    	for(i=0; i<Math.min(this.currentAlarms.length, this.nAlarms); i++){
    		slot = primaryBin(window.moduleSizes, this.currentAlarms[i][1]);
    		channel = channelMap(this.currentAlarms[i][1], this.currentAlarms[i][0], window.moduleSizes, window.rows + 1);
    		if(channel == -1){
    			alarmText += 'Slot ' + slot + ' Primary' + '<br>';	
    		} else
	    		alarmText += 'Slot ' + slot + ', Ch. ' + channel + '<br>';
    		alarmText += (this.reportCurrent[this.currentAlarms[i][0]][this.currentAlarms[i][1]]).toFixed(this.precision) + ' uA<br><br>';
    	}

    	if(this.temperatureAlarms.length != 0) alarmText += '<br>Temperature Alarms<br>'
    	for(i=0; i<Math.min(this.temperatureAlarms.length, this.nAlarms); i++){
	   		slot = primaryBin(window.moduleSizes, this.temperatureAlarms[i][1]);
    		channel = channelMap(this.temperatureAlarms[i][1], this.temperatureAlarms[i][0], window.moduleSizes, window.rows + 1);
    		if(channel == -1){
    			alarmText += 'Slot ' + slot + ' Primary' + '<br>';	
    		} else
	    		alarmText += 'Slot ' + slot + ', Ch. ' + channel + '<br>';
    		alarmText += (this.reportTemperature[this.temperatureAlarms[i][0]][this.temperatureAlarms[i][1]]).toFixed(this.precision) + ' C<br><br>';
    	}

    	if(this.rateAlarms.length != 0) alarmText += '<br>Rate Alarms<br>'
    	for(i=0; i<Math.min(this.rateAlarms.length, this.nAlarms); i++){
    		alarmText += this.rateAlarms[i] + '<br>';
    	}

    	if(alarmText != ''){
    		$('#alarmDetailButton').css('background-color', '#FF0000');
    	} else {
    		$('#alarmDetailButton').css('background-color', '#00FF00');
    	}

    	document.getElementById(this.pID).innerHTML = alarmText;
    };

    //dump alarm data in preperation for next update:
    this.wipeAlarms = function(){
		this.voltageAlarms = [];
		this.currentAlarms = [];
		this.temperatureAlarms = [];
		this.rateAlarms = [];
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
	}
}

function publishAlarms(object){
	object.sortAlarms();
	object.printAlarms();
	object.wipeAlarms();
}


function showDetail(){
	document.getElementById('LeftSidebarDetailBKG').setAttribute('height', Math.max($('#alarmText').height() + 150, 695) );
	tabBKG('LeftSidebarDetailBKG', 'left');
	$('#leftSidebarDetail').css('z-index', '10');
	$('#leftSidebarDetail').css('opacity', '1');
}

function hideDetail(){
	$('#leftSidebarDetail').css('z-index', '-1');
	$('#leftSidebarDetail').css('opacity', '0');
}