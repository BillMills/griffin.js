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
    this.lastMessage = ['', '', '', '', '']; //voltage, current, temperature, clock, rate

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
    	var i, j,
    	    alarmText = '',
    	    slot = -1,
    	    channel = -1,
            messageLogText = '',
            MIDASalarms = ODBGetAlarms(),
            alarmClasses = [this.voltageAlarms, this.currentAlarms, this.temperatureAlarms, this.clockAlarms],
            alarmTitles = ['Voltage Alarms', 'Current Alarms', 'Temperature Alarms', 'Clock Alarms'],
            messageHeader = ['Voltage alarms thrown by ', 'Current alarms thrown by ', 'Temperature alarms thrown by ', 'Clock alarms '],
            ODBalarmLocations = ['/DashboardConfig/CustomAlarms/Voltage', '/DashboardConfig/CustomAlarms/Current', '/DashboardConfig/CustomAlarms/Temperature', '/DashboardConfig/CustomAlarms/Clock']


        //include all the MIDAS alarms:
        if(MIDASalarms.length > 0){
            alarmText += '<h2>MIDAS Alarms</h2>'
            for(i=0; i<MIDASalarms.length; i++){
                alarmText += MIDASalarms[i] + '<br><br>';
            }
        }

        //loop over alarm classes: voltage, current, temperature, clock
        for(j=0; j<4; j++){
            //prepare message block as needed:
            messageLogText = '';
            if(alarmClasses[j].length != 0){
                alarmText += '<h2>'+alarmTitles[j]+'</h2>';
                messageLogText = messageHeader[j];
            }
            //assemble error report:
            for(i=0; i<Math.min(alarmClasses[j].length, this.nAlarms); i++){
                if(j<3){  //HV crate alarms
                    slot = primaryBin(window.parameters.moduleSizes[alarmClasses[j][i][2]], alarmClasses[j][i][1]);
                    channel = channelMap(alarmClasses[j][i][1], alarmClasses[j][i][0], window.parameters.moduleSizes[alarmClasses[j][i][2]], window.parameters.rows + 1);
                    if(channel == -1){
                        alarmText += 'Slot ' + slot + ' Primary' + '<br>';  
                    } else
                        alarmText += 'Slot ' + slot + ', Ch. ' + channel + '<br>';

                    if(j==0){ //voltage
                        alarmText += 'Demand Voltage: ' + (this.demandVoltage[this.voltageAlarms[i][2]][this.voltageAlarms[i][0]][this.voltageAlarms[i][1]]).toFixed(window.parameters.alarmPrecision) + ' V<br>';
                        alarmText += 'Report Voltage: ' + (this.reportVoltage[this.voltageAlarms[i][2]][this.voltageAlarms[i][0]][this.voltageAlarms[i][1]]).toFixed(window.parameters.alarmPrecision) + ' V<br><br>';
                    } else if(j==1){ //current
                        alarmText += (this.reportCurrent[this.currentAlarms[i][2]][this.currentAlarms[i][0]][this.currentAlarms[i][1]]).toFixed(window.parameters.alarmPrecision) + ' uA<br><br>';
                    } else if(j==2){ //temperature
                        alarmText += (this.reportTemperature[this.temperatureAlarms[i][2]][this.temperatureAlarms[i][0]][this.temperatureAlarms[i][1]]).toFixed(window.parameters.alarmPrecision) + ' C<br><br>';
                    }

                    if(i>0) messageLogText += ', ';
                    messageLogText += (channel == -1) ? ('Slot ' + slot + ' Primary') : ('Slot ' + slot + ', Ch. ' + channel);
                } else if(j==3){ //clock
                    alarmText += this.clockAlarms[i]+'<br>';
                    if(i>0) messageLogText += ', ';
                    messageLogText += this.clockAlarms[i]+'<br>';
                }                
            }
            //raise alarm and throw message on error state change only:
            if(messageLogText != this.lastMessage[j]){
                if(messageLogText == '')
                    ODBSet(ODBalarmLocations[j], 0);
                else{    
                    ODBSet(ODBalarmLocations[j], 1);
                    //ODBGenerateMsg(messageLogText);
                    this.lastMessage[j] = messageLogText;
                }
            }
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

    this.publishAlarms = function(){
        this.sortAlarms();
        this.printAlarms();
        this.wipeAlarms();    
    };

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