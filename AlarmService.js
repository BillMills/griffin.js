function AlarmService(sidebarDivID, alarmThresholds, scaleMaxima){
	this.sidebarDivID = sidebarDivID;		//ID of div wrapping left sidebar
	this.divID = 'alarmDiv';				//ID of alarm div
	this.canvasID = 'alarmCanvas';			//ID of canvas to draw alarms on
	this.pID = 'alarmText';					//ID of <p> to write alarm text in
	this.alarmThresholds = alarmThresholds;	//array containing threshold for alarms: [voltage, current, temperature, rate]
	this.scaleMaxima = scaleMaxima;			//array containing upper scale limit for alarm reporting, as alarmThresholds.

	var that = this;

	//number of alarms to report:
	this.nAlarms = 5;

	//arrays to hold alarm info:
	this.voltageAlarms = [];
	this.currentAlarms = [];
	this.temperatureAlarms = [];
	this.rateAlarms = [];

	//DOM manipulation//////////////////////////////////////////////////////////
	//inserd div into sidebar
	insertDiv(this.divID, '', this.sidebarDivID);
	//insert canvas into alarm div:
    this.wrapper = document.getElementById(this.sidebarDivID);
    this.canvasWidth = 0.8*$(this.wrapper).width();
    this.canvasHeight = 0.05*$(this.wrapper).height();
    insertCanvas(this.canvasID, '', '', this.canvasWidth, this.canvasHeight, this.divID);
	this.canvas = document.getElementById(this.canvasID);
	this.context = this.canvas.getContext('2d');
	//insert <p> into alarm div:
	insertParagraph(this.pID, '', '', this.divID, 'herp derp')
	//end DOM manipulation//////////////////////////////////////////////////////

	//event listeners///////////////////////////////////////////////////////////
	//event listeners register alarms to arrays, and wait for the update to be complete.
	this.div = document.getElementById(this.divID);
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

    	if(this.voltageAlarms.length != 0) alarmText += 'Voltage Alarms<br>'
    	for(i=0; i<Math.min(this.voltageAlarms.length, this.nAlarms); i++){
    		alarmText += this.voltageAlarms[i] + '<br>';
    	}

    	if(this.currentAlarms.length != 0) alarmText += 'Current Alarms<br>'
    	for(i=0; i<Math.min(this.currentAlarms.length, this.nAlarms); i++){
    		alarmText += this.currentAlarms[i] + '<br>';
    	}

    	if(this.temperatureAlarms.length != 0) alarmText += 'Temperature Alarms<br>'
    	for(i=0; i<Math.min(this.temperatureAlarms.length, this.nAlarms); i++){
    		alarmText += this.temperatureAlarms[i] + '<br>';
    	}

    	if(this.rateAlarms.length != 0) alarmText += 'Rate Alarms<br>'
    	for(i=0; i<Math.min(this.rateAlarms.length, this.nAlarms); i++){
    		alarmText += this.rateAlarms[i] + '<br>';
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