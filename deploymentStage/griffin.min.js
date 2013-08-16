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
    	var i;
    	var alarmText = '';
    	var slot = -1;
    	var channel = -1;

    	if(this.voltageAlarms.length != 0) alarmText += 'Voltage Alarms<br>'
    	for(i=0; i<Math.min(this.voltageAlarms.length, this.nAlarms); i++){
    		slot = primaryBin(window.parameters.moduleSizes[this.voltageAlarms[i][2]], this.voltageAlarms[i][1]);
    		channel = channelMap(this.voltageAlarms[i][1], this.voltageAlarms[i][0], window.parameters.moduleSizes[this.voltageAlarms[i][2]], window.parameters.rows + 1);
    		if(channel == -1){
    			alarmText += 'Slot ' + slot + ' Primary' + '<br>';	
    		} else
	    		alarmText += 'Slot ' + slot + ', Ch. ' + channel + '<br>';

    		alarmText += 'Demand Voltage: ' + (this.demandVoltage[this.voltageAlarms[i][2]][this.voltageAlarms[i][0]][this.voltageAlarms[i][1]]).toFixed(window.parameters.alarmPrecision) + ' V<br>';
    		alarmText += 'Report Voltage: ' + (this.reportVoltage[this.voltageAlarms[i][2]][this.voltageAlarms[i][0]][this.voltageAlarms[i][1]]).toFixed(window.parameters.alarmPrecision) + ' V<br><br>';

    	}

    	if(this.currentAlarms.length != 0) alarmText += '<br>Current Alarms<br>'
    	for(i=0; i<Math.min(this.currentAlarms.length, this.nAlarms); i++){
    		slot = primaryBin(window.parameters.moduleSizes[this.currentAlarms[i][2]], this.currentAlarms[i][1]);
    		channel = channelMap(this.currentAlarms[i][1], this.currentAlarms[i][0], window.parameters.moduleSizes[this.currentAlarms[i][2]], window.parameters.rows + 1);
    		if(channel == -1){
    			alarmText += 'Slot ' + slot + ' Primary' + '<br>';	
    		} else
	    		alarmText += 'Slot ' + slot + ', Ch. ' + channel + '<br>';
    		alarmText += (this.reportCurrent[this.currentAlarms[i][2]][this.currentAlarms[i][0]][this.currentAlarms[i][1]]).toFixed(window.parameters.alarmPrecision) + ' uA<br><br>';
    	}

    	if(this.temperatureAlarms.length != 0) alarmText += '<br>Temperature Alarms<br>'
    	for(i=0; i<Math.min(this.temperatureAlarms.length, this.nAlarms); i++){
	   		slot = primaryBin(window.parameters.moduleSizes[this.temperatureAlarms[i][2]], this.temperatureAlarms[i][1]);
    		channel = channelMap(this.temperatureAlarms[i][1], this.temperatureAlarms[i][0], window.parameters.moduleSizes[this.temperatureAlarms[i][2]], window.parameters.rows + 1);
    		if(channel == -1){
    			alarmText += 'Slot ' + slot + ' Primary' + '<br>';	
    		} else
	    		alarmText += 'Slot ' + slot + ', Ch. ' + channel + '<br>';
    		alarmText += (this.reportTemperature[this.temperatureAlarms[i][2]][this.temperatureAlarms[i][0]][this.temperatureAlarms[i][1]]).toFixed(window.parameters.alarmPrecision) + ' C<br><br>';
    	}

    	if(this.rateAlarms.length != 0) alarmText += '<br>Rate Alarms<br>'
    	for(i=0; i<Math.min(this.rateAlarms.length, this.nAlarms); i++){
    		alarmText += this.rateAlarms[i] + '<br>';
    	}

        if(this.clockAlarms.length !=0) alarmText += '<br>Clock Alarms<br>'
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
}BAMBINO.prototype = Object.create(Subsystem.prototype);

function BAMBINO(spiceMode){
    //detector name, self-pointing pointer, pull in the Subsystem template, 
    //establish a databus and create a global-scope pointer to this object:
    this.name = 'BAMBINO';
    var that = this;
    Subsystem.call(this);
    //make a pointer at window level back to this object, so we can pass by reference to the nav button onclick
    window.BAMBINOpointer = that;

    //change the button name if we're deploying in spice mode:
    if(window.parameters.SPICEaux)
        document.getElementById('BAMBINOlink').innerHTML = 'SPICE '+window.parameters.SPICEaux

    //member variables///////////////////////////////////
    this.spiceAux = (spiceMode) ? 1 : 0;
    this.mode = (this.spiceAux) ? spiceMode : window.parameters.BAMBINOmode;      //'S2' or 'S3'
    this.layers = (this.spiceAux) ? window.parameters.SPICEauxLayers : window.parameters.BAMBINOlayers;
    console.log([this.mode, this.layers])
    this.dataBus = new BAMBINODS(this.mode, this.layers, spiceMode);
    this.nRadial = 24;
    if(this.mode=='S2')
    	this.nAzimuthal = 16;
    else if(this.mode=='S3')
        this.nAzimuthal = 32;

    //drawing parameters//////////////////////////////////////////////////
    this.centerX = this.canvasWidth/2;
    this.centerY = this.canvasHeight/2;
    this.CDinnerRadius = this.canvasWidth*0.01;
    this.CDradius = (this.layers == 1) ? this.canvasHeight*0.17 : this.canvasWidth*0.12;
    if(this.layers==1 && !(window.parameters.BAMBINOdeployment[0] && window.parameters.BAMBINOdeployment[1]) )
        this.CDradius *= 1.5
    this.centerLeft = this.canvasWidth*0.25;
    this.centerRight = this.canvasWidth*0.75;
    this.centerLeftE = this.canvasWidth*0.13;
    this.centerLeftD = this.canvasWidth*0.375;
    this.centerRightD = this.canvasWidth*0.625;
    this.centerRightE = this.canvasWidth*0.87;
    this.centerTop = this.canvasHeight*0.2;
    this.centerBottom = this.canvasHeight*0.6;
    this.radialWidth = (this.CDradius - this.CDinnerRadius) / this.nRadial;
    this.azimuthalArc = 2*Math.PI / this.nAzimuthal;

    if(this.layers==1 && window.parameters.BAMBINOdeployment[1]==0)
        this.upstreamTitleCenter = this.canvasWidth/2;
    else if(this.layers==1)
        this.upstreamTitleCenter = this.centerLeft;
    else if(window.parameters.BAMBINOdeployment[1]==1)
        this.upstreamTitleCenter = (this.centerLeftD + this.centerLeftE)/2
    else
        this.upstreamTitleCenter = this.canvasWidth/2;

    if(this.layers==1 && window.parameters.BAMBINOdeployment[0]==0)
        this.downstreamTitleCenter = this.canvasWidth/2;
    else if(this.layers==1)
        this.downstreamTitleCenter = this.centerRight;
    else if(window.parameters.BAMBINOdeployment[0]==1)
        this.downstreamTitleCenter = (this.centerRightD + this.centerRightE)/2   
    else
        this.downstreamTitleCenter = this.canvasWidth/2;    

    //which detectors are present: [upstream layer D, downstream layer D, upstream layer E, downstream layer E];
    this.detPresent = [0,0,0,0]; 
    if(window.parameters.BAMBINOdeployment[0]){
        this.detPresent[0] = 1
        if(this.layers == 2){
            this.detPresent[2] = 1   
        }
    }
    if(window.parameters.BAMBINOdeployment[1]){
        this.detPresent[1] = 1
        if(this.layers == 2){
            this.detPresent[3] = 1   
        }
    }    

    //member functions///////////////////////////////////////////////////////////////////

    this.draw = function(frame){

    	var i, j, m, x0, y0, name;

    	this.context.strokeStyle = '#999999';
        this.TTcontext.strokeStyle = '#123456';

        //each layer -> 1 or 2 disks (up and downstream) times 2 sides (front and back).
        //index i counts upstream/layerD/front, upstream/layerD/back, downstream/layerD/front, downstream/layerD/back, etc incrementing layers.
    	for(i=0; i<4*this.layers; i++){ 
            //bail out if this iteration's disk isn't there:
            if(!this.detPresent[Math.floor(i/2)]) continue;

            //determine disk image center
            //upstream layer D front || back:
            if(i==0 || i==1){
                if(this.layers == 2){
                    x0 = this.centerLeftD; y0 = (i==0) ? this.centerTop : this.centerBottom;
                } else if(window.parameters.BAMBINOdeployment[1]){
                    x0 = this.centerLeft; y0 = (i==0) ? this.centerTop : this.centerBottom;
                } else{
                    x0 = (i==0) ? this.centerLeft : this.centerRight; y0 = this.canvasHeight*0.4;
                }
            } else if(i==2 || i==3){ //downstream layer D front || back:
                if(this.layers == 2 && !window.parameters.BAMBINOdeployment[0]){
                    x0 = this.centerLeftD; y0 = (i==2) ? this.centerTop : this.centerBottom;
                } else if(this.layers==2){
                    x0 = this.centerRightD; y0 = (i==2) ? this.centerTop : this.centerBottom;
                } else if(window.parameters.BAMBINOdeployment[0]){
                    x0 = this.centerRight; y0 = (i==2) ? this.centerTop : this.centerBottom;
                } else{
                    x0 = (i==2) ? this.centerLeft : this.centerRight; y0 = this.canvasHeight*0.4;
                }
            } else if(i==4 || i==5){ //upstream layer E front || back:
                if(window.parameters.BAMBINOdeployment[1]){
                    x0 = this.centerLeftE; y0 = (i==4) ? this.centerTop : this.centerBottom;
                } else{
                    x0 = this.centerRightD; y0 = (i==4) ? this.centerTop : this.centerBottom;
                }
            } else if(i==6 || i==7){ //downstream layer E front || back:
                if(window.parameters.BAMBINOdeployment[0]){
                    x0 = this.centerRightE; y0 = (i==6) ? this.centerTop : this.centerBottom;
                } else{
                    x0 = this.centerRightD; y0 = (i==6) ? this.centerTop : this.centerBottom;
                }
            }

            //fronts    
	    	if(i%2 == 0){

	    		for(j=0; j<this.nRadial; j++){
                    name = ((this.spiceAux) ? 'SP' : 'BA' ) + ((this.mode=='S2') ? 'Z0' : 'E0') + (Math.floor((i%4)/2)+1) + this.dataBus.waypoints[Math.floor(i/4)] + 'P' +( (j<10) ? '0'+j : j ) + 'X';
    				this.context.beginPath()
                    this.context.fillStyle = colors(name, this.dataBus.BAMBINO, frame, this.nFrames)
	    			this.context.arc(x0, y0, this.CDradius - j*this.radialWidth, 0, 2*Math.PI);
	    			this.context.closePath();
    				this.context.fill();
	    			this.context.stroke();

                    //and again for tooltip:
                    if(!this.TTlayerDone){
                        this.TTcontext.fillStyle = 'rgba('+this.dataBus.BAMBINO[name].index+','+this.dataBus.BAMBINO[name].index+','+this.dataBus.BAMBINO[name].index+',1)';
                        this.TTcontext.beginPath();
                        this.TTcontext.arc(x0, y0, this.CDradius - j*this.radialWidth, 0, 2*Math.PI);
                        this.TTcontext.closePath();
                        this.TTcontext.fill();
                        this.TTcontext.stroke();
                    }
    			}
                //clear inner circle:
                this.context.fillStyle = '#333333';
                this.context.beginPath();
                this.context.arc(x0, y0, this.CDradius - j*this.radialWidth, 0, 2*Math.PI);
                this.context.closePath();
                this.context.fill(); 
                //and again in TT:
                if(!this.TTlayerDone){
                    this.TTcontext.fillStyle = '#987654';
                    this.TTcontext.beginPath();
                    this.TTcontext.arc(x0, y0, this.CDradius - j*this.radialWidth, 0, 2*Math.PI);
                    this.TTcontext.closePath();
                    this.TTcontext.fill();
    		    }	
            //backs
    		} else {
    
	    		for(j=0; j<this.nAzimuthal; j++){
                    name = ((this.spiceAux) ? 'SP' : 'BA' ) + ((this.mode=='S2') ? 'Z0' : 'E0') + (Math.floor((i%4)/2)+1) + this.dataBus.waypoints[Math.floor(i/4)] + 'N' +( (j<10) ? '0'+j : j ) + 'X';
    				this.context.beginPath()
                    this.context.fillStyle = colors(name, this.dataBus.BAMBINO, frame, this.nFrames)
                    
                    this.context.moveTo(x0 + this.CDinnerRadius*Math.cos(j*this.azimuthalArc), y0 - this.CDinnerRadius*Math.sin(j*this.azimuthalArc));
                    this.context.arc(x0,y0, this.CDinnerRadius, -j*this.azimuthalArc, -(j+1)*this.azimuthalArc, true);
                    this.context.lineTo(x0 + this.CDradius*Math.cos((j+1)*this.azimuthalArc), y0 - this.CDradius*Math.sin((j+1)*this.azimuthalArc));
                    this.context.arc(x0,y0, this.CDradius, -(j+1)*this.azimuthalArc, -j*this.azimuthalArc, false);
    				this.context.closePath();
    				this.context.fill();
	    			this.context.stroke();
                    
                    //and again for tooltip:
                    if(!this.TTlayerDone){
                        this.TTcontext.fillStyle = 'rgba('+this.dataBus.BAMBINO[name].index+','+this.dataBus.BAMBINO[name].index+','+this.dataBus.BAMBINO[name].index+',1)';
                        this.TTcontext.beginPath();
                        this.TTcontext.moveTo(x0 + this.CDinnerRadius*Math.cos(j*this.azimuthalArc), y0 - this.CDinnerRadius*Math.sin(j*this.azimuthalArc));
                        this.TTcontext.arc(x0,y0, this.CDinnerRadius, -j*this.azimuthalArc, -(j+1)*this.azimuthalArc, true);
                        this.TTcontext.lineTo(x0 + this.CDradius*Math.cos((j+1)*this.azimuthalArc), y0 - this.CDradius*Math.sin((j+1)*this.azimuthalArc));
                        this.TTcontext.arc(x0,y0, this.CDradius, -(j+1)*this.azimuthalArc, -j*this.azimuthalArc, false);
                        this.TTcontext.closePath();
                        this.TTcontext.fill();
                        this.TTcontext.stroke();                  
                    }

    			}

    		}
    	}

        if(frame==this.nFrames || frame==0) {
            //scale
            this.drawScale(this.context);
    	    //titles
            this.context.clearRect(0,0.80*this.canvasHeight,this.canvasWidth,0.20*this.canvasHeight - this.scaleHeight);
            this.context.fillStyle = '#999999';
            this.context.font="24px 'Orbitron'";
            if(window.parameters.BAMBINOdeployment[0]) this.context.fillText('Upstream', this.upstreamTitleCenter - this.context.measureText('Upstream').width/2, 0.85*this.canvasHeight);
            if(window.parameters.BAMBINOdeployment[1]) this.context.fillText('Downstream', this.downstreamTitleCenter - this.context.measureText('Downstream').width/2, 0.85*this.canvasHeight);
        }

        this.TTlayerDone = 1;

    };

    //do an initial populate:
    this.update();

}function BarGraph(cvas, moduleNumber, nBars, title, yAxisTitle, scaleMin, scaleMax, barChartPrecision, masterWaffle, crate){

	var i;

	//which crate is this card in?
	this.crate = crate;

	this.dataBus = new HVBarDS();

	//bar chart levels:
	this.oldLevels = [];
	this.levels = [];

	//alarms:
	this.oldAlarms = [];
	this.alarms = [];

	//module index:
	this.modIndex = moduleNumber;

	//scale:
	this.scaleMin = scaleMin;
	this.scaleMax = scaleMax;

	//number of y-axis scale ticks:
	this.yAxisTicks = 6;

	//precision:
	this.precision = barChartPrecision;

	//waffle of which these meters are a subset:
	this.masterWaffle = masterWaffle;

	//chart title:
	this.title = title;

	//y-axis title:
	this.yAxisTitle = yAxisTitle;

	//color, [R,G,B,A]:
	this.oldColor = [255,0,0,1];
	this.color = [0,0,0,1];

    //fetch canvas:
    this.cvas = cvas;
    this.canvas = document.getElementById(cvas);
    this.context = this.canvas.getContext('2d');

    //canvas dimensions:
    this.width = masterWaffle.totalWidth;
    this.height = masterWaffle.waffleHeight[crate];
    this.headerHeight = masterWaffle.headerHeight[crate];
    $('#'+cvas).attr('width', this.width);
    $('#'+cvas).attr('height', this.height);
    $('#'+cvas).css('top', this.headerHeight);

    //determine optimal font sizes for labels:
    //determine longest y-axis tick label:
    this.context.font="12px 'Raleway'"; 
    var longestLabel = 0;
    var longestLabelIndex = 0;
    for(i=0; i<this.yAxisTicks; i++){
    	if(this.context.measureText( ((this.scaleMax-this.scaleMin)/(this.yAxisTicks-1)*i).toFixed(this.precision) ).width > longestLabel){
	    	longestLabel = Math.max(longestLabel, this.context.measureText( ((this.scaleMax-this.scaleMin)/(this.yAxisTicks-1)*i).toFixed(this.precision) ).width);
	    	longestLabelIndex = i;
	    }
    }
    //seek largest fontsize such that the longest label + height of y axis title fit into margin:
    this.fontscale = 1;
    this.context.font=this.fontscale+"px 'Raleway'";
    while( this.context.measureText( ((this.scaleMax-this.scaleMin)/(this.yAxisTicks-1)*longestLabelIndex).toFixed(this.precision) ).width + 1.5*this.fontscale < 0.1*this.width/2 ){
    	this.fontscale++ 
	    this.context.font=this.fontscale+"px 'Raleway'";
	}

    //number of bars:
    this.nBars = nBars;

    //channel names:
    this.channelNames = [];

    //bar width:
    this.barWidth = this.width*0.8 / (1.05*nBars);
    //vertical margins:
    this.topMargin = 0.1*this.height;
    this.bottomMargin = 0.2*this.height;
    //bar max height:
    this.barMax = this.height - this.topMargin - this.bottomMargin;

    //animation parameters:
    this.duration = 0.5; //seconds
    this.FPS = 30;
    this.nFrames = this.duration*this.FPS;

    //initialize arrays:
    for(var i = 0; i<nBars; i++){
    	this.oldLevels[i] = 0.01;
    	this.levels[i] = 0.01;
    	this.oldAlarms[i] = [0,0,0];
    	this.alarms[i] = [0,0,0];
    	this.channelNames[i] = i;
    }

    //make barchart clickable to set a variable for a channel:
    var that = this;
    this.canvas.onclick = function(event){clickBarChart(event, that)};

	//define the onclick behavior of the bar chart:
	function clickBarChart(event, obj){

        window.refreshInput = 1;

		var superDiv = document.getElementById(obj.masterWaffle.wrapperDiv);

        var module = obj.modIndex;
        var channel = Math.floor((event.pageX - superDiv.offsetLeft -  obj.canvas.offsetLeft - obj.width*0.1)/(1.05*obj.barWidth));
        var gridCoords = getPointer(module, channel, obj.masterWaffle, window.HVview);

        if(gridCoords[1]<obj.masterWaffle.cols[obj.crate] && gridCoords[0]>0 && gridCoords[0]<obj.masterWaffle.rows && channel<obj.nBars && window.onDisplay == obj.cvas){
            obj.masterWaffle.chx = gridCoords[1];
            obj.masterWaffle.chy = gridCoords[0];
            channelSelect(obj.masterWaffle);
        }

	}

	//draw a frame of a bar chart transition from previous levels to new levels:
	this.draw = function(frame){

		var i = 0;
		var leftEdge = this.width*0.1; //left edge of the first bar
		var barTop;
		var barHeight;

		//clear old canvas:
		this.context.clearRect(0, 0, this.width, this.height);

		//loop over bars:
		for(i=0; i<this.nBars; i++){
			barHeight = this.oldLevels[i]*this.barMax + (this.levels[i] - this.oldLevels[i])*this.barMax*frame/this.nFrames;
			barTop = this.height - this.bottomMargin - barHeight;
			this.context.fillStyle = '#FFFFFF';
			this.context.fillRect(leftEdge, barTop, this.barWidth, barHeight);			
			this.context.fillStyle = this.colorGradient(i, frame);
			this.context.fillRect(leftEdge, barTop, this.barWidth, barHeight);
			this.context.strokeRect(leftEdge, barTop, this.barWidth, barHeight);
			leftEdge += 1.05*this.barWidth;
		}

		//redraw frame:
		this.drawFrame();

	};

    //wrapper for transition from old state to new state via this.animate:
    this.update = function(newLevel, alarmStatus){

        //set up member variables for animation:
        this.setNewLevels(newLevel, alarmStatus);

        //animate:
        this.animate(this, 0);

    };

    //manage animation
    this.animate = function(){
        if(window.onDisplay == this.cvas) animate(this, 0);
    };

	//set new levels:
	this.setNewLevels = function(data, alarmStatus){

		//data must have one entry for each bar:
		if(data.length !== this.nBars){ 
			alert('Pass exactly one value to the bar chart for each bar on update!');
			return;
		}

		//loop over bars:
		for(var i=0; i<this.nBars; i++){
			//adjust scaleMax:
			if(data[i] > this.scaleMax)
				this.scaleMax = data[i];

			this.oldLevels[i] = this.levels[i];
			this.levels[i] = (data[i] - this.scaleMin) / (this.scaleMax - this.scaleMin);
			if(this.levels[i] <= 0.01) this.levels[i] = 0.01;
			if(this.levels[i] > 1) this.levels[i] = 1;

			for(var j=0; j<3; j++){
				this.oldAlarms[i][j] = this.alarms[i][j];
				this.alarms[i][j] = alarmStatus[i][j];
			}
		}


	};

	//draw axes and decorations:
	this.drawFrame = function(){

		var i = 0,
		longestyLabel = 0;

		//set label font:
		this.context.font=this.fontscale+"px Raleway";         ///Math.min(16, 0.8*this.barWidth)+"px 'Raleway'";    //0.25*this.barWidth+"px 'Raleway'";

		//set text color:
		this.context.fillStyle = 'rgba(255,255,255,0.3)';
		this.context.strokeStyle = 'rgba(255,255,255,0.3)';

		//draw principle axes:
		this.context.beginPath();
		this.context.moveTo(this.width*0.9, this.height - this.bottomMargin);
		this.context.lineTo(this.width*0.1, this.height - this.bottomMargin);
		this.context.lineTo(this.width*0.1, this.topMargin);
		this.context.stroke();

		//draw x-axis labels:
		for(i=0; i<this.nBars; i++){
			this.context.save();
			this.context.translate(this.width*0.1+(i+0.6)*1.05*this.barWidth,this.height - 0.9*this.bottomMargin);
			this.context.rotate(-Math.PI/2);  // -pi/2.4
			this.context.textAlign = 'right';
			this.context.fillText(this.channelNames[i], 0, 0);
			this.context.restore();
		}

		//draw y-axis ticks and labels:
		var yLabel;
		for(i=0; i<this.yAxisTicks; i++){
			this.context.beginPath();
			this.context.moveTo(this.width*0.1, this.height - this.bottomMargin - i*(this.height - this.topMargin - this.bottomMargin)/(this.yAxisTicks-1) );
			this.context.lineTo(this.width*0.1 - 10, this.height - this.bottomMargin - i*(this.height - this.topMargin - this.bottomMargin)/(this.yAxisTicks-1) );
			this.context.stroke();
			yLabel = ((this.scaleMax-this.scaleMin)/(this.yAxisTicks-1)*i).toFixed(this.precision);
			if(this.context.measureText(yLabel).width > longestyLabel) longestyLabel = this.context.measureText(yLabel).width;
			this.context.fillText( yLabel,  this.width*0.1 - this.context.measureText(yLabel).width - 10, this.height - this.bottomMargin - i*(this.height - this.topMargin - this.bottomMargin)/(this.yAxisTicks-1) + 5);
		}

		//draw y-axis title:
		this.context.font= 1.5*this.fontscale+'px Raleway';   //Math.max(0.4*this.barWidth,26)+"px 'Raleway'";
		this.context.save();
		this.context.translate(this.width*0.1-10-longestyLabel-10, this.topMargin + this.context.measureText(this.yAxisTitle).width);
		this.context.rotate(-Math.PI/2);
		this.context.fillText(this.yAxisTitle, 0, 0);
		this.context.restore();

		//draw chart title:
		this.context.font=Math.max(0.7*this.barWidth,42)+"px 'Raleway'";
		this.context.fillText(this.title, this.width*0.9 - this.context.measureText(this.title).width, this.height - 0.35*this.bottomMargin);

	};

	//determine the color for this bar at <frame>
	this.colorGradient = function(index, frame){
		var R, G, B, A;

		if(this.oldAlarms[index][0] == 0 && this.oldAlarms[index][1] == 0 && this.oldAlarms[index][2] == 0){
			this.oldColor = [0,255,0,0.3];
		} else if(this.oldAlarms[index][0] == -1){
			this.oldColor = [0,0,0,0.3];
		} else if(this.oldAlarms[index][0] == -2){
			this.oldColor = [255,255,0,0.3];
		} else if(this.oldAlarms[index][0] == -3){
			this.oldColor = [0,0,255,0.5];
		} else {
			this.oldColor = [255,0,0, Math.max(this.oldAlarms[index][0], this.oldAlarms[index][1], this.oldAlarms[index][2])*0.7 + 0.3];
		}

		if(this.alarms[index][0] == 0 && this.alarms[index][1] == 0 && this.alarms[index][2] == 0){
			this.color = [0,255,0,0.3];
		} else if(this.alarms[index][0] == -1){
			this.color = [0,0,0,0.3];
		} else if(this.alarms[index][0] == -2){
			this.color = [255,255,0,0.3];
		} else if(this.alarms[index][0] == -3){
			this.color = [0,0,255,0.5];
		} else {
			this.color = [255,0,0, Math.max(this.alarms[index][0], this.alarms[index][1], this.alarms[index][2])*0.7 + 0.3];
		}

		R = this.oldColor[0] + (this.color[0] - this.oldColor[0])*frame/this.nFrames;
		G = this.oldColor[1] + (this.color[1] - this.oldColor[1])*frame/this.nFrames;
		B = this.oldColor[2] + (this.color[2] - this.oldColor[2])*frame/this.nFrames;
		A = this.oldColor[3] + (this.color[3] - this.oldColor[3])*frame/this.nFrames;

		return 'rgba('+R+', '+G+', '+B+', '+A+')'
	};

    this.animate = function(){
        if(window.onDisplay == this.cvas /*|| window.freshLoad*/) animate(this, 0);
        else this.draw(this.nFrames);
    };

}function Clock(){
    var i, cellSize, clockStyle,
    that = this;
    window.clockPointer = that;

	this.wrapperID = window.parameters.wrapper;	    //ID of wrapping div
	this.canvasID = 'ClockCanvas';		            //ID of canvas to paint clock on
    this.linkWrapperID = 'ClockLinks';              //ID of div to contain clock view header
    this.sidebarID = 'ClockSidebar';                //ID of div to contain clock sidebar
    this.activeClock = 'clock0';
    this.noUniqueMaster = 0;
    this.masterLEMOfreq = 200;
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
    document.getElementById('outsContentLabel').innerHTML = (window.localODB.masterLEMOfreq / (1-(document.getElementById('outsContentmasterStepdownSlider').valueAsNumber - parseInt(document.getElementById('outsContentmasterStepdownSlider').max,10)-1))).toFixed(1) + ' MHz';
    document.getElementById('outsContentmasterStepdownSlider').onchange = function(){
        var stepdown = -(this.valueAsNumber - parseInt(this.max,10)-1),
            freqOut = window.localODB.masterLEMOfreq / (1+stepdown), 
            i, masterConfig=[];
            window.clockPointer.masterFreqOut = freqOut;

        document.getElementById('outsContentLabel').innerHTML = freqOut.toFixed(1) + ' MHz';
        for(i=0; i<8; i++){
            document.getElementById('frequencyOut'+i).innerHTML = freqOut.toFixed(1) + ' MHz out'
        }

        //commit new stepdown to ODB:
        for(i=0; i<window.localODB['clock0'].length; i++){
            masterConfig[i] = window.localODB[window.clockPointer.activeClock][i];
        }
        for(i=0; i<8; i++){
            masterConfig[9+4*i] = stepdown;
            masterConfig[10+4*i] = stepdown;
        }
        ODBSet('/Equipment/GRIF-Clk'+window.clockPointer.activeClock.slice(5, window.clockPointer.activeClock.length)+'/Variables/Input[*]', masterConfig);
        window.localODB[window.clockPointer.activeClock] = masterConfig;
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
    var i, masterConfig = []
    for(i=0; i<window.localODB['clock0'].length; i++){
        masterConfig[i] = window.localODB['clock'+n][i];
    }
    masterConfig[1] = 1;
    masterConfig[2] = 1;
    masterConfig[3] = 1;
    masterConfig[4] = 1;
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
    slaveConfig[4] = 0;
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
    var newSettingWord = window.localODB[window.clockPointer.activeClock][0],
    clockNo = window.clockPointer.activeClock.slice(5, window.clockPointer.activeClock.length);
    newSettingWord = newSettingWord | (0xF << 4*i);
    //push to ODB
    ODBSet('/Equipment/GRIF-Clk'+clockNo+'/Variables/Input[0]', newSettingWord);
    //push to localODB:
    window.localODB['clock'+clockNo][0] = newSettingWord;
}

function disableChannel(i){
    var newSettingWord = window.localODB[window.clockPointer.activeClock][0],
    clockNo = window.clockPointer.activeClock.slice(5, window.clockPointer.activeClock.length);
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
    masterInputFrequency('clockSummaryValue3');
    window.localODB.masterLEMOfreq = window.clockPointer.masterLEMOfreq;  //restore previously selected value
    document.getElementById('outsContentmasterStepdownSlider').onchange();
    rePaint();
}

//set the master to use the atomic clock as its reference
function masterAC(id){
    //push to ODB:
    ODBSet('/Equipment/GRIF-Clk'+id.slice(5,id.length)+'/Variables/Input[4]', 0);
    //push to local ODB:
    window.localODB['clock'+id.slice(5,id.length)][4] = 0;
    document.getElementById('clockSummaryValue3').innerHTML = '200 MHz';
    window.clockPointer.masterLEMOfreq = window.localODB.masterLEMOfreq // going to co-opt this variable in AC mode to keep slider code simple, hang onto value to replace later
    window.localODB.masterLEMOfreq = 200;
    document.getElementById('outsContentmasterStepdownSlider').onchange();
    rePaint();
}

//deploy the input field for master input frequency:
function masterInputFrequency(targetID){
    document.getElementById(targetID).innerHTML = '<input id="summaryContentMasterLEMOfreq" type="number" min=0 value='+window.localODB.masterLEMOfreq+'></input>';
    document.getElementById('summaryContentMasterLEMOfreq').onchange = function(){
        ODBSet('/DashboardConfig/Clock/Master LEMO freq', parseInt(this.value,10) );
        window.localODB.masterLEMOfreq = parseInt(this.value,10);
        document.getElementById('outsContentmasterStepdownSlider').onchange();
    }    
}

//show the relevant clock information when clicked on
function showClock(id){
    var i, text, label, value, isOn;

    glowMe(id);

    //keep track of which clock is highlit:
    window.clockPointer.activeClock = id;

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
        document.getElementById('clockSummaryLabel4').innerHTML = 'Input Freq. (MHz):';
        if(document.getElementById('toggleSwitchmasterRefToggle').style.left=='1em'){
            masterInputFrequency('clockSummaryValue4');
        } else{
            document.getElementById('clockSummaryValue4').innerHTML = '200 MHz';
        }
    } else{
        document.getElementById('clockSummaryLabel3').innerHTML = 'Clock Source';
        document.getElementById('clockSummaryLabel4').innerHTML = 'Ref. Clock';
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
    var i, index;

    document.getElementById(window.clockPointer.activeClock).style.boxShadow = '0 0 0px white';
    document.getElementById(id).style.boxShadow = '0 0 20px white';

    //only show CSAC tab for Master:
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
DANTE.prototype = Object.create(Subsystem.prototype);

function DANTE(){
    //detector name, self-pointing pointer, pull in the Subsystem template, 
    //establish a databus and create a global-scope pointer to this object:
    this.name = 'DANTE';
    var that = this;
    Subsystem.call(this);
    this.dataBus = new DANTEDS();
    //make a pointer at window level back to this object, so we can pass by reference to the nav button onclick
    window.DANTEpointer = that;

    //member variables///////////////////////////////////


    //set up scale adjust dialog:
    this.canvas.onclick = function(event){
        var y = event.pageY - that.canvas.offsetTop - that.monitor.offsetTop,
            limitIndex = (window.state.subdetectorView < 3) ? window.state.subdetectorView : window.state.subdetectorView-2;
        if(y > that.canvasHeight - that.scaleHeight)
            parameterDialogue(that.name, [ ['LaBrPMT', window.parameters[that.name].minima['LaBrPMT'][limitIndex], window.parameters[that.name].maxima['LaBrPMT'][limitIndex], window.parameters.subdetectorUnit[limitIndex], '/DashboardConfig/DANTE/LaBrPMT'+scaleType()+'[0]', '/DashboardConfig/DANTE/LaBrPMT'+scaleType()+'[1]'], ['LaBrTAC', window.parameters[that.name].minima['LaBrTAC'][limitIndex], window.parameters[that.name].maxima['LaBrTAC'][limitIndex], window.parameters.subdetectorUnit[limitIndex], '/DashboardConfig/DANTE/LaBrTAC'+scaleType()+'[0]', '/DashboardConfig/DANTE/LaBrTAC'+scaleType()+'[1]'],  ['BGO', window.parameters[that.name].minima['BGO'][limitIndex], window.parameters[that.name].maxima['BGO'][limitIndex], window.parameters.subdetectorUnit[limitIndex], '/DashboardConfig/DANTE/BGO'+scaleType()+'[0]', '/DashboardConfig/DANTE/BGO'+scaleType()+'[1]'] ], window.parameters.subdetectorColors[limitIndex]);
    }

    //drawing parameters/////////////////////////////////
    this.centerX = this.canvasWidth/2;
    this.centerY = this.canvasHeight/2;
    this.leftRingCenter = this.canvasWidth*0.25;
    this.rightRingCenter = this.canvasWidth*0.75;
    this.ringRadius = this.canvasHeight*0.2;
    this.detectorRadius = this.canvasWidth*0.03;
    this.shieldInnerRadius = this.canvasWidth*0.05;
    this.shieldOuterRadius = this.canvasWidth*0.06;

    //member functions///////////////////////////////////////////////////////////////////

    this.draw = function(frame){

    	var j, ringCenter, x0, y0, name;
    	this.context.strokeStyle = '#999999';

    	this.context.beginPath();
    	this.context.arc(this.leftRingCenter, this.canvasHeight*0.4, this.ringRadius, 0, 2*Math.PI);
    	this.context.stroke();
    	this.context.beginPath();
    	this.context.arc(this.rightRingCenter, this.canvasHeight*0.4, this.ringRadius, 0, 2*Math.PI);
    	this.context.stroke();

        //once for the display canvas....
    	for(j=0; j<8; j++){
    		if(j<4) ringCenter = this.leftRingCenter;
    		else ringCenter = this.rightRingCenter;

    		x0 = ringCenter + this.ringRadius*Math.cos(Math.PI/2*j);
    		y0 = this.canvasHeight*0.4 - this.ringRadius*Math.sin(Math.PI/2*j);

            //suppressors
            name = 'DAS0'+(j+1)+'XN00X';
            this.context.fillStyle = colors(name, this.dataBus.DANTE, frame, this.nFrames);
    		this.context.beginPath();
    		this.context.arc(x0,y0,this.shieldOuterRadius,0,2*Math.PI);
    		this.context.closePath();
    		this.context.fill();
    		this.context.stroke();

    		this.context.fillStyle = '#333333';
    		this.context.beginPath();
    		this.context.arc(x0,y0,this.shieldInnerRadius,0,2*Math.PI);
    		this.context.closePath();
    		this.context.fill();
    		this.context.stroke();

            //LaBr
            //PMT
            if(window.state.subdetectorView < 3)
                name = 'DAL0'+(j+1)+'XN00X';
            //TAC
            else
                name = 'DAL0'+(j+1)+'XT00X'
            this.context.fillStyle = colors(name, this.dataBus.DANTE, frame, this.nFrames);
    		this.context.beginPath();
    		this.context.arc(x0,y0,this.detectorRadius,0,2*Math.PI);
    		this.context.closePath();
    		this.context.fill();    		
    		this.context.stroke();
    	}
        if(!this.TTlayerDone){
            //....and again for the tooltip encoding
            for(j=0; j<8; j++){
                if(j<4) ringCenter = this.leftRingCenter;
                else ringCenter = this.rightRingCenter;

                x0 = ringCenter + this.ringRadius*Math.cos(Math.PI/2*j);
                y0 = this.canvasHeight*0.4 - this.ringRadius*Math.sin(Math.PI/2*j);

                //hack around to defeat antialiasing problems, fix once there's an option to suppress aa
                this.TTcontext.fillStyle = '#123456';
                this.TTcontext.beginPath();
                this.TTcontext.arc(x0,y0,1.05*this.shieldOuterRadius,0,2*Math.PI);
                this.TTcontext.closePath();
                this.TTcontext.fill();
                //end hack around 

                //suppressors
                name = 'DAS0'+(j+1)+'XN00X';
                this.TTcontext.fillStyle = 'rgba('+this.dataBus.DANTE[name].index+','+this.dataBus.DANTE[name].index+','+this.dataBus.DANTE[name].index+',1)';
                this.TTcontext.beginPath();
                this.TTcontext.arc(x0,y0,this.shieldOuterRadius,0,2*Math.PI);
                this.TTcontext.closePath();
                this.TTcontext.fill();

                this.TTcontext.fillStyle = '#123456';
                this.TTcontext.beginPath();
                this.TTcontext.arc(x0,y0,this.shieldInnerRadius,0,2*Math.PI);
                this.TTcontext.closePath();
                this.TTcontext.fill();

                //LaBr
                //PMT
                if(window.state.subdetectorView < 3)
                    name = 'DAL0'+(j+1)+'XN00X';
                //TAC
                else
                    name = 'DAL0'+(j+1)+'XT00X'
                this.TTcontext.fillStyle = 'rgba('+this.dataBus.DANTE[name].index+','+this.dataBus.DANTE[name].index+','+this.dataBus.DANTE[name].index+',1)';
                this.TTcontext.beginPath();
                this.TTcontext.arc(x0,y0,this.detectorRadius,0,2*Math.PI);
                this.TTcontext.closePath();
                this.TTcontext.fill();            
            }
            this.TTlayerDone = 1;
        }
		
        if(frame==this.nFrames || frame==0) {
            //scale
            this.drawScale(this.context);
    	    //titles
            this.context.clearRect(0,0.75*this.canvasHeight,this.canvasWidth,0.25*this.canvasHeight - this.scaleHeight);
            this.context.fillStyle = '#999999';
            this.context.font="24px 'Orbitron'";
            this.context.fillText('West Ring', this.leftRingCenter - this.context.measureText('West Ring').width/2, 0.8*this.canvasHeight);
            this.context.fillText('East Ring', this.rightRingCenter - this.context.measureText('East Ring').width/2, 0.8*this.canvasHeight);
        }

    };

    this.detectorType = function(name){
        if(name.slice(0,3) == 'DAS') return 'BGO';
        else if(name.slice(6,7) == 'N') return 'LaBrPMT';
        else if(name.slice(6,7) == 'T') return 'LaBrTAC';
    };

    //do an initial populate:
    this.update();
}function DAQ(canvas, detailCanvas, prefix, postfix){
	var i, j, k, m, nBars, key;

	var that = this;
    //make a pointer at window level back to this object, so we can pass by reference to the nav button onclick
    window.DAQpointer = that;

    this.monitorID = window.parameters.wrapper;  //div ID of wrapper div
    this.canvasID = 'DAQcanvas';			     //ID of canvas to draw DAQ on
    this.detailCanvasID = 'DAQdetailCanvas';     //ID of canvas to draw detailed view on
    this.linkWrapperID = 'DAQlinks'              //ID of wrapper div for DAQ links
    this.topNavID = 'DAQbutton'                  //ID of button to navigate here in the top nav menu
    this.sidebarID = 'DAQsidebar'                //ID of right sidebar to associate with this object
    this.TTcanvasID = 'DAQTTcanvas'
    this.TTdetailCanvasID = 'DAQdetailTTcanvas'
    this.detailShowing = 0;                      //is the detail canvas showing?
    window.codex = new DAQcodex();               //builds a map of the DAQ

    this.nCollectorGroups = 0;  //fixed for now
    this.nCollectors = window.codex.nCollectors;
    this.nDigitizerGroups = 0;  //fixed for now
    this.nDigitizers = window.codex.nDigitizers;
    this.nDigitizersPerCollector = [];
    for(i=0; i<this.nCollectors; i++){
        this.nDigitizersPerCollector[i] = window.codex.nDigitizersPerCollector[i];
    }
    //how many digitizers came before the ith collector?
    this.prevDigi = [];
    this.prevDigi[0] = 0;
    for(i=1; i<this.nCollectors; i++){
        this.prevDigi[i] = this.prevDigi[i-1] + this.nDigitizersPerCollector[i-1];
    }

    this.dataBus = new DAQDS();
    this.DAQcolor = 3;

    //scale & insert DAQ canvases & navigation//////////////////////////////////////////////////////////////////////////////////////
    this.monitor = document.getElementById(this.monitorID);
    this.canvasWidth = 0.48*$(this.monitor).width();
    this.collectorWidth = 0.9*(this.canvasWidth-10) / 16;

    //height adjusts to accomodate bar chart in master node:
    nBars = 0;
    for(key in window.codex.detSummary){
        if(window.parameters.validDetectors.indexOf(key) != -1)
            nBars++
    }

    this.canvasHeight = 0.7*$(this.monitor).height() + this.collectorWidth/2*nBars;

    //navigation
    //top level nav button
    insertDOM('button', this.topNavID, 'navLink', '', 'statusLink', function(){swapView('DAQlinks', 'DAQcanvas', 'DAQsidebar', window.DAQpointer.topNavID); rePaint();}, 'DAQ', '', 'button')
    //nav wrapper div
    insertDOM('div', this.linkWrapperID, 'navPanel', '', this.monitorID, '', '')
    //nav header
    insertDOM('h1', 'DAQlinksBanner', 'navPanelHeader', '', this.linkWrapperID, '', window.parameters.ExpName+' DAQ Status')
    insertDOM('br', 'break', '', '', this.linkWrapperID, '', '')
    //nav buttons
    insertDOM('button', 'DAQToplink', 'navLinkDown', '', 'DAQlinks', function(){window.DAQpointer.detailShowing=0; window.DAQdetail=-1; swapFade('DAQToplink', window.DAQpointer, 0);}, 'Master', '', 'button')
    insertDOM('br', 'break', '', '', this.linkWrapperID, '', '')
    //p to label row of collector buttons
    insertDOM('p', 'DAQcollectorTitle', '', 'display:inline; color:#999999; margin-right:5px;', 'DAQlinks', '', 'Slave')
    //deploy collector buttons
    for(i=0; i<this.nCollectors; i++){
        insertDOM('button', 'Collector'+i, 'navLink', '', this.linkWrapperID, function(){window.DAQpointer.detailShowing=1; swapFade(this.id, window.DAQpointer, 0); animateDetail(window.DAQpointer, 0); window.DAQdetail=this.collectorNumber;}, i+1, '', 'button')
        $('#Collector'+i).width( ( 0.95*this.canvasWidth - $('#DAQcollectorTitle').width()) / this.nCollectors );
        document.getElementById('Collector'+i).collectorNumber = i;
    }

    //right sidebar
    insertDOM('div', this.sidebarID, 'RightSidebar', '', this.monitorID, '', '')

    //display canvases
    //top view
    insertDOM('canvas', this.canvasID, 'monitor', 'top: '+ ($('#DAQlinks').height() + 5) +'px;', this.monitorID, '', '')
    this.canvas = document.getElementById(canvas);
    this.context = this.canvas.getContext('2d');
    this.canvas.setAttribute('width', this.canvasWidth);
    this.canvas.setAttribute('height', this.canvasHeight);
    //detailed view
    insertDOM('canvas', this.detailCanvasID, 'monitor', 'top: '+ ($('#DAQlinks').height() + 5) +'px;', this.monitorID, '', '')
    this.detailCanvas = document.getElementById(detailCanvas);
    this.detailContext = this.detailCanvas.getContext('2d');
    this.detailCanvas.setAttribute('width', this.canvasWidth);
    this.detailCanvas.setAttribute('height', this.canvasHeight);
    //Tooltip for summary level
    insertDOM('canvas', this.TTcanvasID, 'monitor', 'top:' + ($('#DAQlinks').height()*1.25 + 5) +'px;', this.monitorID, '', '')
    this.TTcanvas = document.getElementById(this.TTcanvasID);
    this.TTcontext = this.TTcanvas.getContext('2d');
    this.TTcanvas.setAttribute('width', this.canvasWidth);
    this.TTcanvas.setAttribute('height', this.canvasHeight);    
    //hidden Tooltip map layer for detail
    insertDOM('canvas', this.TTdetailCanvasID, 'monitor', 'top:' + ($('#DAQlinks').height()*1.25 + 5) +'px;', this.monitorID, '', '')    
    this.TTdetailCanvas = document.getElementById(this.TTdetailCanvasID);
    this.TTdetailContext = this.TTdetailCanvas.getContext('2d');
    this.TTdetailCanvas.setAttribute('width', this.canvasWidth);
    this.TTdetailCanvas.setAttribute('height', this.canvasHeight);    
    //finished adding to the DOM////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    this.scaleHeight = this.canvasHeight*0.2;//110;

    //onclick switch between top and detail view:
    this.detailCanvas.onclick = function(event){
                                    var y;
                                    y = event.pageY - that.canvas.offsetTop - that.monitor.offsetTop;
                                    if(y>that.canvasHeight - that.scaleHeight){
                                        parameterDialogue('DAQ', [ ['Transfer Rate', window.parameters.DAQminima[3], window.parameters.DAQmaxima[3], 'Bps', '/DashboardConfig/DAQ/transferMinDetailView', '/DashboardConfig/DAQ/transferMaxDetailView' ], ['Trigger Rate', window.parameters.DAQminima[2], window.parameters.DAQmaxima[2], 'Hz', '/DashboardConfig/DAQ/rateMinDetailView', '/DashboardConfig/DAQ/rateMaxDetailView']  ], window.parameters.colorScale[window.DAQpointer.DAQcolor]);
                                    } else {
                                        that.detailShowing = 0;
                                        swapFade('DAQToplink', that, 0);
                                    }
                                };
    this.canvas.onclick =   function(event){
                                //use TT layer to decide which clover user clicked on
                                var digiGroupClicked = -1;
                                var x,y;
                                x = event.pageX - that.canvas.offsetLeft - that.monitor.offsetLeft;
                                y = event.pageY - that.canvas.offsetTop - that.monitor.offsetTop;
                                digiGroupClicked = that.findCell(x,y);
                                //draw and swap out if user clicked on a valid clover
                                if(digiGroupClicked > 0){
                                    window.DAQdetail = (digiGroupClicked-1)%that.nCollectors;
                                    that.drawDetail(that.detailContext, that.nFrames);
                                    that.detailShowing = 1;
                                    swapFade('Collector'+(window.DAQdetail), that, 0)
                                }
                                //set up scale range dialogue:
                                if(y>that.canvasHeight - that.scaleHeight){
                                    parameterDialogue('DAQ', [ ['Transfer Rate', window.parameters.DAQminima[1], window.parameters.DAQmaxima[1], 'Bps', '/DashboardConfig/DAQ/transferMinTopView', '/DashboardConfig/DAQ/transferMaxTopView' ], ['Trigger Rate', window.parameters.DAQminima[0], window.parameters.DAQmaxima[0], 'Hz', '/DashboardConfig/DAQ/rateMinTopView', '/DashboardConfig/DAQ/rateMaxTopView']  ], window.parameters.colorScale[window.DAQpointer.DAQcolor]);
                                } else if(y<that.masterBottom){
                                    parameterDialogue('Device Summary',[ ['Trig Requests', window.parameters.DAQminima[4], window.parameters.DAQmaxima[5], 'Hz', '/DashboardConfig/DAQ/rateMinMaster', '/DashboardConfig/DAQ/rateMaxMaster'], ['Data Rate', window.parameters.DAQminima[5], window.parameters.DAQmaxima[5], 'Bps', '/DashboardConfig/DAQ/transferMinMaster', '/DashboardConfig/DAQ/transferMaxMaster']  ]);
                                }
                            };

    //Dirty trick to implement tooltip on obnoxious geometry: make another canvas of the same size hidden beneath, with the 
    //detector drawn on it, but with each element filled in with rgba(0,0,n,1), where n is the channel number; fetching the color from the 
    //hidden canvas at point x,y will then return the appropriate channel index.
    //summary level:
    //paint whole hidden canvas with R!=G!=B to trigger TT suppression:
    this.TTcontext.fillStyle = '#123456';
    this.TTcontext.fillRect(0,0,this.canvasWidth, this.canvasHeight);
    //set up summary tooltip:
    this.tooltip = new Tooltip(this.canvasID, 'DAQTT', this.monitorID, prefix, postfix);
    this.tooltip.obj = that;
    //detail level tt:
    //paint whole hidden canvas with R!=G!=B to trigger TT suppression:
    this.TTdetailContext.fillStyle = 'rgba(50,100,150,1)';
    this.TTdetailContext.fillRect(0,0,this.canvasWidth, this.canvasHeight);
    //set up detail tooltip:
    this.detailTooltip = new Tooltip(this.detailCanvasID, 'DAQTTdetail', this.monitorID, prefix, postfix);
    this.detailTooltip.obj = that;


    //drawing parameters//////////////////////////////////////////////


    this.cellColor = '#4C4C4C';
    this.lineweight = 5;

    this.margin = this.canvasWidth*0.05;
    this.collectorGutter = 0.1*this.collectorWidth;


    this.collectorHeight = this.canvasHeight*0.1;   
    this.masterTop = 5;
    this.masterBottom = this.masterTop + (1+nBars/2)*this.collectorHeight;
    this.cableLength = (this.canvasHeight*0.7 - (this.masterBottom-this.masterTop) - 2*this.collectorHeight)/2;
    this.masterGroupLinkTop = this.masterBottom;
    this.masterGroupLinkBottom = this.masterGroupLinkTop + ( (this.nCollectorGroups == 0) ? this.cableLength : this.cableLength/2 ) //this.collectorHeight/2;
    this.masterLinkTop = this.masterGroupLinkBottom;
    this.masterLinkBottom = this.masterLinkTop + this.cableLength/2   //this.collectorHeight/2;
    this.collectorTop = this.masterLinkBottom;
    this.collectorBottom = this.collectorTop + this.collectorHeight;
    this.digiSummaryLinkTop = this.collectorBottom;
    this.digiSummaryLinkBottom = this.digiSummaryLinkTop + this.cableLength; //this.collectorHeight;
    this.digiSummaryTop = this.digiSummaryLinkBottom;
    this.digiSummaryBottom = this.digiSummaryTop + this.collectorHeight;

    //establish animation parameters////////////////////////////////////////////////////////////////////
    this.FPS = 30;
    this.duration = 0.5;
    this.nFrames = this.FPS*this.duration;

    this.inboundCollector = -1;
    this.presentCollector = -1;

    //member functions///////////////////////////////////////////////

    //decide which view to transition to when this object is navigated to
    this.view = function(){
        if(this.detailShowing == 1)
            return this.detailCanvasID;
        else if(this.detailShowing == 0)
            return this.canvasID;
    }

	//update the info for each cell in the monitor
	this.update = function(){
		var i;

        this.fetchNewData();

        //parse the new data into colors
        this.dataBus.oldMasterColor = this.dataBus.masterColor;
        this.dataBus.masterColor = this.parseColor(this.dataBus.master[0], 0)
    
        for(i=0; i<this.nCollectorGroups; i++){
            this.dataBus.oldMasterGroupColor[i] = this.dataBus.masterGroupColor[i];
            this.dataBus.masterGroupColor[i] = this.parseColor(this.dataBus.collectorGroups[i],1);
        }
        for(i=0; i<this.nCollectors; i++){
            this.dataBus.oldMasterLinkColor[i] = this.dataBus.masterLinkColor[i];
            this.dataBus.oldCollectorColor[i] = this.dataBus.collectorColor[i];
            this.dataBus.oldDetailCollectorColor[i] = this.dataBus.detailCollectorColor[i];
            this.dataBus.oldCollectorLinkColor[i] = this.dataBus.collectorLinkColor[i];
            this.dataBus.oldDetailCollectorLinkColor[i] = this.dataBus.detailCollectorLinkColor[i];
            this.dataBus.oldDigiSummaryColor[i] = this.dataBus.digiSummaryColor[i];
            this.dataBus.masterLinkColor[i] = this.parseColor(this.dataBus.collectorLinks[i], 1);
            this.dataBus.collectorColor[i] = this.parseColor(this.dataBus.collectors[i], 0);
            this.dataBus.detailCollectorColor[i] = this.parseColor(this.dataBus.collectors[i], 2);
            this.dataBus.collectorLinkColor[i]       = this.parseColor(this.dataBus.digitizerGroupSummaryLinks[i],1);
            this.dataBus.detailCollectorLinkColor[i] = this.parseColor(this.dataBus.digitizerGroupSummaryLinks[i],3);
            this.dataBus.digiSummaryColor[i] = this.parseColor(this.dataBus.digitizerSummaries[i],0);

        }
        for(i=0; i<this.nDigitizerGroups; i++){
            this.dataBus.oldDigiGroupSummaryColor[i] = this.dataBus.digiGroupSummaryColor[i];
            this.dataBus.digiGroupSummaryColor[i] = this.dataBus.parseColor(this.dataBus.digitizerGroupLinks[i], 3);
        }
        for(i=0; i<this.nDigitizers; i++){
            this.dataBus.oldDigitizerLinkColor[i] = this.dataBus.digitizerLinkColor[i];
            this.dataBus.oldDigitizerColor[i] = this.dataBus.digitizerColor[i]; 
            this.dataBus.digitizerLinkColor[i] = this.parseColor(this.dataBus.digitizerLinks[i], 3);
            this.dataBus.digitizerColor[i] = this.parseColor(this.dataBus.digitizers[i], 2); 
        }

        this.tooltip.update();
        this.detailTooltip.update();

        //animate if DAQ is showing:
        this.animate();

	};

	//parse scalar into a color on a color scale bounded by the entries in window.parameters.DAQminima[index] and window.parameters.DAQmaxima[index] 
	this.parseColor = function(scalar, index){
		//how far along the scale are we?
		var scale 
        if(window.parameters.detectorLogMode.DAQbutton){
            scale = (Math.log(scalar) - Math.log(window.parameters.DAQminima[index])) / (Math.log(window.parameters.DAQmaxima[index]) - Math.log(window.parameters.DAQminima[index]));
        } else {
            scale = (scalar - window.parameters.DAQminima[index]) / (window.parameters.DAQmaxima[index] - window.parameters.DAQminima[index]);
        }
        if(scale<0) scale = 0;
        if(scale>1) scale = 1;

		//return redScale(scale);
        return scalepickr(scale, window.parameters.colorScale[this.DAQcolor])
	};

	this.draw = function(frame){
		var color, i, j, k, fontSize, headerString;

        this.context.textBaseline = 'alphabetic';
		if(frame==0){
            this.context.clearRect(0,0, this.canvasWidth, this.canvasHeight - this.scaleHeight);
            //labels:
            this.context.fillStyle = '#FFFFFF';
            fontSize = fitFont(this.context, 'Slaves', this.collectorHeight);
            this.context.font = fontSize + 'px Raleway';
            this.context.save();
            this.context.rotate(-Math.PI/2);
            this.context.fillText('Slaves', -this.collectorBottom,0.7*this.margin);
            this.context.restore();

            fontSize = fitFont(this.context, 'Digi Summary', this.collectorHeight)*1.2;
            this.context.font = fontSize + 'px Raleway';
            this.context.save();
            this.context.rotate(-Math.PI/2);
            this.context.fillText('Digi Summary', -(this.digiSummaryBottom + this.digiSummaryTop + this.context.measureText('Digi Summary').width)/2,0.7*this.margin);
            this.context.restore();  

            fontSize = fitFont(this.context, 'Master', 2*this.collectorWidth);
            this.context.font = fontSize + 'px Raleway';
            this.context.save();
            this.context.rotate(-Math.PI/2);
            this.context.fillText('Master', -( (this.masterBottom-this.masterTop)/2 + this.context.measureText('Master').width/2 ),0.7*this.margin);
            this.context.restore();

        }

        if(frame == 15){
            this.drawScale(this.context);
        }
        this.context.lineWidth = this.lineweight;

        //GRIFFIN mode:
        if(this.nCollectorGroups != 0){
    		for(i=0; i<this.nCollectorGroups; i++){
                //master group links
                color = interpolateColor(parseHexColor(this.dataBus.oldMasterGroupColor[i]), parseHexColor(this.dataBus.masterGroupColor[i]), frame/this.nFrames);
                this.drawMasterGroupLink(i, color);
            }
        }
        for(i=0; i<this.nCollectors; i++){
    		//digi summary nodes:
    		color = interpolateColor(parseHexColor(this.dataBus.oldDigiSummaryColor[i]), parseHexColor(this.dataBus.digiSummaryColor[i]), frame/this.nFrames);
	   		this.drawSummaryDigitizerNode(i, color);
    		//collector-digi summary links:
    		color = interpolateColor(parseHexColor(this.dataBus.oldCollectorLinkColor[i]), parseHexColor(this.dataBus.collectorLinkColor[i]), frame/this.nFrames);
    		this.drawSummaryDigitizerNodeLink(i, color);
	   		//collecter nodes:
    		color = interpolateColor(parseHexColor(this.dataBus.oldCollectorColor[i]), parseHexColor(this.dataBus.collectorColor[i]), frame/this.nFrames);
			this.drawCollectorNode(i, color);   		    		
    		//collector links:
	    	color = interpolateColor(parseHexColor(this.dataBus.oldMasterLinkColor[i]), parseHexColor(this.dataBus.masterLinkColor[i]), frame/this.nFrames);
    		this.drawMasterLink(i, color); 
		}

        //master node:
        color = interpolateColor(parseHexColor(this.dataBus.oldMasterColor), parseHexColor(this.dataBus.masterColor), frame/this.nFrames);
        this.drawMasterNode(color);

        //trigger & event builder reporting:
        headerString = 'TRIGGER: Events: ' + parseFloat(window.codex.triggerRate).toFixed(0) + ' Hz; Data: ' + parseFloat(window.codex.triggerDataRate/1000).toFixed(0) + ' Mb/s  EVENT BUILDER: ' + parseFloat(window.codex.EBrate).toFixed(0) + ' Hz; Data: ' + parseFloat(window.codex.EBdataRate/1000).toFixed(0) + ' Mb/s'
        this.context.textBaseline = 'top';
        this.context.fillStyle = '#FFFFFF';
        this.context.font = fitFont(this.context, headerString, this.canvasWidth*0.8)+'px Raleway';
        this.context.fillText(headerString, this.canvasWidth/2 - this.context.measureText(headerString).width/2, this.masterTop*2);
        this.context.textBaseline = 'alphabetic';

        //rate chart
        rateChart(frame, window.codex.detSummary, this.context, this.canvasWidth*0.2, this.masterTop + nBars*this.collectorWidth/2+50, this.canvasWidth*0.6, this.collectorWidth/2 )

	};

    this.drawScale = function(context){

        var i, j, string, unit, transferTitle, triggerTitle; 

        context.clearRect(0, this.canvasHeight - this.scaleHeight, this.canvasWidth, this.canvasHeight);

        //titles
        context.fillStyle = '#999999';
        context.font="24px 'Orbitron'";
        context.textBaseline = 'middle';
        if(window.parameters.detectorLogMode.DAQbutton){
            transferTitle = 'log(Transfer Rate)';
            triggerTitle = 'log(Trigger Rate)';
        } else {
            transferTitle = 'Transfer Rate';
            triggerTitle = 'Trigger Rate';
        }
        context.fillText(transferTitle, this.canvasWidth/2 - context.measureText(transferTitle).width/2, this.canvasHeight-this.scaleHeight/2 - 15);
        context.fillText(triggerTitle, this.canvasWidth/2 - context.measureText(triggerTitle).width/2, this.canvasHeight-this.scaleHeight/2 + 20 + 20);
        context.textBaseline = 'alphabetic';

        //tickmark;
        context.strokeStyle = '#999999';
        context.lineWidth = 1;
        context.font="12px 'Raleway'";

        //transfer rate
        //determine unit
        unit = ((context == this.detailContext) ? window.parameters.DAQmaxima[3] : window.parameters.DAQmaxima [1]);
        if(unit > 1000000) unit = ' MBps';
        else if(unit > 1000) unit = ' kBps';
        else unit = ' Bps';
        if(window.parameters.detectorLogMode.DAQbutton) unit = ' log(Bps)';

        context.beginPath();
        context.moveTo(this.canvasWidth*0.05+1, this.canvasHeight - this.scaleHeight/2);
        context.lineTo(this.canvasWidth*0.05+1, this.canvasHeight - this.scaleHeight/2-10);
        context.stroke();
        if(window.parameters.detectorLogMode.DAQbutton) string = Math.log( ((context == this.detailContext) ? window.parameters.DAQminima[3] : window.parameters.DAQminima [1]) ) + ' log(Bps)';
        else string = ((context == this.detailContext) ? window.parameters.DAQminima[3] : window.parameters.DAQminima [1]) + ' Bps';
        context.fillText( string, this.canvasWidth*0.05 - context.measureText(string).width/2, this.canvasHeight-this.scaleHeight/2-15);

        context.beginPath();
        context.moveTo(this.canvasWidth*0.95-1, this.canvasHeight - this.scaleHeight/2);
        context.lineTo(this.canvasWidth*0.95-1, this.canvasHeight - this.scaleHeight/2-10); 
        context.stroke();  

        string = ((context == this.detailContext) ? window.parameters.DAQmaxima[3] : window.parameters.DAQmaxima [1]);
        if(window.parameters.detectorLogMode.DAQbutton){
            string = Math.log(string).toFixed(1) + unit;
        } else{
            if(string > 1000000) string = string/1000000 + unit;
            else if(string > 1000) string = string/1000 + unit;
            else string = string + unit;
        }            
        context.fillText(string, this.canvasWidth*0.95 - context.measureText(string).width/2, this.canvasHeight-this.scaleHeight/2-15);


        //trigger rate
        //determine unit:
        unit = ((context == this.detailContext) ? window.parameters.DAQmaxima[2] : window.parameters.DAQmaxima [0]);
        if(unit > 1000000) unit = ' MHz';
        else if(unit > 1000) unit = ' kHz';
        else unit = ' Hz';
        if(window.parameters.detectorLogMode.DAQbutton) unit = ' log(Hz)';

        context.beginPath();
        context.moveTo(this.canvasWidth*0.05+1, this.canvasHeight - this.scaleHeight/2 + 20);
        context.lineTo(this.canvasWidth*0.05+1, this.canvasHeight - this.scaleHeight/2 + 20 + 10);
        context.stroke();
        if(window.parameters.detectorLogMode.DAQbutton) string = Math.log( ((context == this.detailContext) ? window.parameters.DAQminima[2] : window.parameters.DAQminima [0]) ) + ' log(Hz)';
        else string = ((context == this.detailContext) ? window.parameters.DAQminima[2] : window.parameters.DAQminima [0]) + ' Hz';
        context.fillText( string, this.canvasWidth*0.05 - context.measureText(string).width/2, this.canvasHeight-this.scaleHeight/2 + 45);

        context.beginPath();
        context.moveTo(this.canvasWidth*0.95-1, this.canvasHeight - this.scaleHeight/2 + 20);
        context.lineTo(this.canvasWidth*0.95-1, this.canvasHeight - this.scaleHeight/2 + 20 + 10); 
        context.stroke();

        string = ((context == this.detailContext) ? window.parameters.DAQmaxima[2] : window.parameters.DAQmaxima [0]);
        if(window.parameters.detectorLogMode.DAQbutton){
            string = Math.log(string).toFixed(1) + unit;
        } else {
            if(string > 1000000) string = string/1000000 + unit;
            else if(string > 1000) string = string/1000 + unit;
            else string = string + unit;
        }
        context.fillText(string, this.canvasWidth*0.95 - context.measureText(string).width/2, this.canvasHeight-this.scaleHeight/2 + 45);

        for(i=0; i<3000; i++){
            context.fillStyle = scalepickr(0.001*(i%1000), window.parameters.colorScale[this.DAQcolor])//redScale(0.001*(i%1000));
            context.fillRect(this.canvasWidth*0.05 + this.canvasWidth*0.9/1000*(i%1000), this.canvasHeight-this.scaleHeight/2, this.canvasWidth*0.9/1000, 20);
        }

    };

    this.drawMasterNode = function(color){

    	this.context.strokeStyle = color;
    	this.context.fillStyle = this.cellColor;		
		roundBox(this.context, this.margin, this.masterTop, this.canvasWidth-2*this.margin, this.masterBottom - this.masterTop, 5);
		this.context.fill();
        this.context.stroke();

        //tooltip encoding level:
        this.TTcontext.fillStyle = 'rgba(0, 0, 0, 1)';
        this.TTcontext.fillRect(Math.round(this.margin), Math.round(this.masterTop), Math.round(this.canvasWidth-2*this.margin), Math.round(this.masterBottom - this.masterTop));

    };

    this.drawCollectorNode = function(index, color){

    	this.context.strokeStyle = color;
    	this.context.fillStyle = this.cellColor;
        if(this.nCollectorGroups != 0){  //GRIFFIN mode:
    		roundBox(this.context, this.margin + (Math.floor(index/4)+0.5)*(this.canvasWidth - 2*this.margin)/this.nCollectorGroups + (index%4 - 1.5)*(this.collectorWidth + this.collectorGutter) - this.collectorWidth/2, this.collectorTop, this.collectorWidth, this.collectorBottom - this.collectorTop, 5);
        } else {  //TIGRESS mode:
            roundBox(this.context, this.margin + (index+0.5)*(this.canvasWidth - 2*this.margin)/this.nCollectors - this.collectorWidth/2, this.collectorTop, this.collectorWidth, this.collectorBottom - this.collectorTop, 5);
        }
        this.context.fill();
		this.context.stroke();

        //tooltip encoding level:
        this.TTcontext.fillStyle = 'rgba('+(1+index)+', '+(1+index)+', '+(1+index)+', 1)';
        if(this.nCollectorGroups != 0) //GRIFFIN mode
            this.TTcontext.fillRect(Math.round(this.margin + (Math.floor(index/4)+0.5)*(this.canvasWidth - 2*this.margin)/this.nCollectorGroups + (index%4 - 1.5)*(this.collectorWidth + this.collectorGutter) - this.collectorWidth/2), Math.round(this.collectorTop), Math.round(this.collectorWidth), Math.round(this.collectorBottom - this.collectorTop));  
        else //TIGRESS mode:
            this.TTcontext.fillRect(Math.round(this.margin + (index+0.5)*(this.canvasWidth - 2*this.margin)/this.nCollectors - this.collectorWidth/2), Math.round(this.collectorTop), Math.round(this.collectorWidth), Math.round(this.collectorBottom - this.collectorTop));
    };

    this.drawSummaryDigitizerNode = function(index, color){
        var i, ttColors;

    	this.context.strokeStyle = color;
    	this.context.fillStyle = this.cellColor;
        this.context.lineWidth = this.lineweight;
        if(this.nCollectorGroups != 0){ //GRIFFIN mode:
            this.context.beginPath();
            this.context.arc(this.margin + (Math.floor(index/4)+0.5)*(this.canvasWidth - 2*this.margin)/this.nCollectorGroups + (index%4 - 1.5)*(this.collectorWidth + this.collectorGutter), this.digiSummaryLinkBottom + this.collectorWidth/2,  this.collectorWidth/2, 0, Math.PI*2);
            this.context.closePath();
    		//roundBox(this.context, this.margin + (Math.floor(index/4)+0.5)*(this.canvasWidth - 2*this.margin)/this.nCollectorGroups + (index%4 - 1.5)*(this.collectorWidth + this.collectorGutter) - this.collectorWidth/2, this.digiSummaryTop, this.collectorWidth, this.digiSummaryBottom - this.digiSummaryTop, 5);
        } else { //TIGRESS mode
            this.context.beginPath();
            this.context.arc(this.margin + (index + 0.5)*(this.canvasWidth - 2*this.margin)/this.nCollectors, this.digiSummaryLinkBottom + this.collectorWidth/2, this.collectorWidth/2, 0, Math.PI*1.999);  //managed to cause a rendering bug in Chrome if drawing arc to full 2pi??
            this.context.closePath();
            //roundBox(this.context, this.margin + (index+0.5)*(this.canvasWidth - 2*this.margin)/this.nCollectors - this.collectorWidth/2, this.digiSummaryTop, this.collectorWidth, this.digiSummaryBottom - this.digiSummaryTop, 5);
        }
		this.context.fill();
        this.context.stroke();


        //tooltip encoding level:
        ttColors = ['#123456', 'rgba('+(1+this.nCollectors+index)+', '+(1+this.nCollectors+index)+', '+(1+this.nCollectors+index)+', 1)'];
        for(i=0; i<2; i++){
            this.TTcontext.fillStyle = ttColors[i];  //first suppress AA, then paint code color
            if(this.nCollectorGroups != 0){ //GRIFFIN mode
                this.TTcontext.beginPath();
                this.TTcontext.arc(this.margin + (Math.floor(index/4)+0.5)*(this.canvasWidth - 2*this.margin)/this.nCollectorGroups + (index%4 - 1.5)*(this.collectorWidth + this.collectorGutter), this.digiSummaryLinkBottom + this.collectorWidth/2,  this.collectorWidth/2, 0, Math.PI*2);
                this.TTcontext.closePath();
                this.TTcontext.fill();
                //this.TTcontext.fillRect(Math.round(this.margin + (Math.floor(index/4)+0.5)*(this.canvasWidth - 2*this.margin)/this.nCollectorGroups + (index%4 - 1.5)*(this.collectorWidth + this.collectorGutter) - this.collectorWidth/2), Math.round(this.digiSummaryTop), Math.round(this.collectorWidth), Math.round(this.digiSummaryBottom - this.digiSummaryTop));  
            }else {//TIGRESS mode:
                this.TTcontext.beginPath();
                this.TTcontext.arc(this.margin + (index + 0.5)*(this.canvasWidth - 2*this.margin)/this.nCollectors, this.digiSummaryLinkBottom + this.collectorWidth/2, this.collectorWidth/2, 0, Math.PI*1.999);
                this.TTcontext.closePath();
                this.TTcontext.fill();
                //this.TTcontext.fillRect(Math.round(this.margin + (index+0.5)*(this.canvasWidth - 2*this.margin)/this.nCollectors - this.collectorWidth/2), Math.round(this.digiSummaryTop), Math.round(this.collectorWidth), Math.round(this.digiSummaryBottom - this.digiSummaryTop));
            }
        }
    };

    this.drawMasterGroupLink = function(index, color){
    	this.context.strokeStyle = color;
    	this.context.fillStyle = color;
        this.context.beginPath();
 		this.context.moveTo(this.margin + (index+0.5)*(this.canvasWidth - 2*this.margin)/this.nCollectorGroups, this.masterGroupLinkTop);
 		this.context.lineTo(this.margin + (index+0.5)*(this.canvasWidth - 2*this.margin)/this.nCollectorGroups, this.masterGroupLinkBottom);
        this.context.closePath();
 		this.context.stroke();
    };

    this.drawMasterLink = function(index, color){
    	this.context.strokeStyle = color;
    	this.context.fillStyle = color;
        this.context.beginPath();
        if(this.nCollectorGroups != 0) {  //GRIFFIN mode:
     		this.context.moveTo(this.margin + (Math.floor(index/4)+0.5)*(this.canvasWidth - 2*this.margin)/this.nCollectorGroups, this.masterLinkTop);
     	  	this.context.lineTo(this.margin + (Math.floor(index/4)+0.5)*(this.canvasWidth - 2*this.margin)/this.nCollectorGroups + (index%4 - 1.5)*(this.collectorWidth + this.collectorGutter), this.masterLinkBottom);
        } else { //TIGRESS mode:
            this.context.moveTo(this.margin + (index + 0.5)*(this.canvasWidth - 2*this.margin)/this.nCollectors, this.masterGroupLinkTop );
            this.context.lineTo(this.margin + (index + 0.5)*(this.canvasWidth - 2*this.margin)/this.nCollectors, this.masterLinkBottom -this.lineweight/2 );
        }
        this.context.closePath();
 		this.context.stroke();
    };

    this.drawSummaryDigitizerNodeLink = function(index, color){
    	this.context.strokeStyle = color;
    	this.context.fillStyle = color;
        this.context.beginPath();
        if(this.nCollectorGroups != 0){ //GRIFFIN mode:
        	this.context.moveTo(this.margin + (Math.floor(index/4)+0.5)*(this.canvasWidth - 2*this.margin)/this.nCollectorGroups + (index%4 - 1.5)*(this.collectorWidth + this.collectorGutter), this.digiSummaryLinkTop);
        	this.context.lineTo(this.margin + (Math.floor(index/4)+0.5)*(this.canvasWidth - 2*this.margin)/this.nCollectorGroups + (index%4 - 1.5)*(this.collectorWidth + this.collectorGutter), this.digiSummaryLinkBottom);
        } else {  //TIGRESS mode:
            this.context.moveTo(this.margin + (index + 0.5)*(this.canvasWidth - 2*this.margin)/this.nCollectors, this.digiSummaryLinkTop);
            this.context.lineTo(this.margin + (index + 0.5)*(this.canvasWidth - 2*this.margin)/this.nCollectors, this.digiSummaryLinkBottom - this.lineweight/2);
        }
        this.context.closePath();
    	this.context.stroke();
    };

    this.drawDetail = function(context, frame){
        var color, i, j, key;

        var topMargin = 30;
        var leftMargin = 5;

        //if(frame == 0){
            this.detailContext.clearRect(0,0,this.canvasWidth, this.canvasHeight - this.scaleHeight);
        //}

        if(frame == this.nFrames){
            this.drawScale(this.detailContext);
        }

        this.detailContext.fillStyle = this.cellColor;
        this.detailContext.lineWidth = this.lineweight;

        //clear the tt
        this.TTdetailContext.fillStyle = 'rgba(50,100,150,1)';
        this.TTdetailContext.fillRect(0,0,this.canvasWidth, this.canvasHeight);

        //collector index:
        var clctr = window.DAQdetail;

        if(this.nDigitizerGroups != 0){  //GRIFFIN mode:
            //group connecters:
            
            j=0;
            for(i=4*clctr; i<4*clctr + 4; i++){
                this.detailContext.strokeStyle = interpolateColor(parseHexColor(this.dataBus.oldDigiGroupSummaryColor[i]), parseHexColor(this.dataBus.digiGroupSummaryColor[i]), frame/this.nFrames);
                this.detailContext.beginPath();
                this.detailContext.moveTo(this.canvasWidth/2 - this.collectorWidth*0.3 + this.collectorWidth*0.2*j, topMargin+this.collectorHeight);
                this.detailContext.lineTo( 0.12*this.canvasWidth + 0.76/3*this.canvasWidth*j, this.canvasHeight*0.4 + topMargin);
                this.detailContext.closePath();
                this.detailContext.stroke();
                j++
            }
            
            //digitizer connecters:
            for(i=this.prevDigi[clctr]; i<this.prevDigi[clctr]+this.nDigitizersPerCollector[clctr]; i++){
                this.detailContext.strokeStyle = interpolateColor(parseHexColor(this.dataBus.oldDigitizerLinkColor[i]), parseHexColor(this.dataBus.digitizerLinkColor[i]), frame/this.nFrames);
                this.detailContext.beginPath();
                this.detailContext.moveTo( Math.floor( (i - this.prevDigi[clctr])/4 )*0.76/3*this.canvasWidth + 0.12*this.canvasWidth, this.canvasHeight*0.4 + topMargin );
                this.detailContext.lineTo( Math.floor( (i - this.prevDigi[clctr])/4 )*0.76/3*this.canvasWidth + 0.12*this.canvasWidth - this.canvasWidth*0.09 + (i%4)*this.canvasWidth*0.06, this.canvasHeight*0.6 + topMargin );
                this.detailContext.closePath();
                this.detailContext.stroke();   
            }

            //digitizers:
            for(i=this.prevDigi[clctr]; i<this.nDigitizersPerCollector[clctr]*clctr+this.nDigitizersPerCollector[clctr]; i++){
                this.detailContext.strokeStyle = interpolateColor(parseHexColor(this.dataBus.oldDigitizerColor[i]), parseHexColor(this.dataBus.digitizerColor[i]), frame/this.nFrames);
                roundBox(this.detailContext, Math.floor( (i - this.prevDigi[clctr])/4 )*0.76/3*this.canvasWidth + 0.12*this.canvasWidth - this.canvasWidth*0.09 + (i%4)*this.canvasWidth*0.06 - 0.02*this.canvasWidth , this.canvasHeight*0.6 + topMargin, 0.04*this.canvasWidth, 0.04*this.canvasWidth, 5);
                this.detailContext.fill();
                this.detailContext.stroke();
                //tooltip layer:
                this.TTdetailContext.fillStyle = 'rgba('+(i+1+2*this.nCollectors)+','+(i+1+2*this.nCollectors)+','+(i+1+2*this.nCollectors)+',1)';
                this.TTdetailContext.fillRect(Math.floor(Math.floor( (i - this.prevDigi[clctr])/4 )*0.76/3*this.canvasWidth + 0.12*this.canvasWidth - this.canvasWidth*0.09 + (i%4)*this.canvasWidth*0.06 - 0.02*this.canvasWidth), Math.floor(this.canvasHeight*0.6 + topMargin), Math.floor(0.04*this.canvasWidth), Math.floor(0.04*this.canvasWidth));
            }
        } else {  //TIGRESS mode:
            for(i=this.prevDigi[clctr]; i<this.prevDigi[clctr] + this.nDigitizersPerCollector[clctr]; i++){
                //digitizer to collector link:
                this.detailContext.strokeStyle = interpolateColor(parseHexColor(this.dataBus.oldDigitizerLinkColor[i]), parseHexColor(this.dataBus.digitizerLinkColor[i]), frame/this.nFrames);
                this.detailContext.beginPath();
                //old style, direct from digitizer to collector:
                //this.detailContext.moveTo(this.margin + ((i-this.prevDigi[clctr])+0.5)*(this.canvasWidth - 2*this.margin)/this.nDigitizersPerCollector[clctr], this.canvasHeight*0.6 + topMargin);
                //this.detailContext.lineTo( this.canvasWidth/2 - this.collectorWidth/2 + ((i-this.prevDigi[clctr])+0.5)*this.collectorWidth/this.nDigitizersPerCollector[clctr], topMargin + this.collectorHeight);
                //two-tiered links:
                //from digitizers:
                this.detailContext.moveTo(this.margin + ((i-this.prevDigi[clctr])+0.5)*(this.canvasWidth - 2*this.margin)/this.nDigitizersPerCollector[clctr], this.canvasHeight*0.6 + topMargin);
                this.detailContext.lineTo(this.margin + ((i-this.prevDigi[clctr])+0.5)*(this.canvasWidth - 2*this.margin)/this.nDigitizersPerCollector[clctr], this.canvasHeight*0.6 + topMargin - this.collectorHeight);
                this.detailContext.stroke();
                //digitizers:
                this.detailContext.strokeStyle = interpolateColor(parseHexColor(this.dataBus.oldDigitizerColor[i]), parseHexColor(this.dataBus.digitizerColor[i]), frame/this.nFrames);
                roundBox(this.detailContext, this.margin + ((i-this.prevDigi[clctr])+0.5)*(this.canvasWidth - 2*this.margin)/this.nDigitizersPerCollector[clctr] - 0.02*this.canvasWidth , this.canvasHeight*0.6 + topMargin, 0.04*this.canvasWidth, 0.04*this.canvasWidth, 5);
                this.detailContext.fill();
                this.detailContext.stroke();
                //tooltip layer:
                this.TTdetailContext.fillStyle = 'rgba('+(i+1+2*this.nCollectors)+','+(i+1+2*this.nCollectors)+','+(i+1+2*this.nCollectors)+',1)';
                this.TTdetailContext.fillRect(Math.round(this.margin + ((i-this.prevDigi[clctr])+0.5)*(this.canvasWidth - 2*this.margin)/this.nDigitizersPerCollector[clctr] - 0.02*this.canvasWidth), Math.round(this.canvasHeight*0.6 + topMargin), Math.round(0.04*this.canvasWidth), Math.round(0.04*this.canvasWidth));
            }
        }

        //parent collector:
        this.detailContext.strokeStyle = interpolateColor(parseHexColor(this.dataBus.oldDetailCollectorColor[clctr]), parseHexColor(this.dataBus.detailCollectorColor[clctr]), frame/this.nFrames);
        //roundBox(this.detailContext, this.canvasWidth/2 - this.collectorWidth/2, topMargin, this.collectorWidth, this.collectorHeight, 5);
        roundBox(this.detailContext, this.margin, topMargin, this.canvasWidth - 2*this.margin, 0.40*this.canvasHeight, 5)
        this.detailContext.fill();
        this.detailContext.stroke();

        //total data transfer:
        this.detailContext.strokeStyle = interpolateColor(parseHexColor(this.dataBus.oldDetailCollectorLinkColor[clctr]), parseHexColor(this.dataBus.detailCollectorLinkColor[clctr]), frame/this.nFrames);
        this.detailContext.lineWidth = 2*this.lineweight;
        this.detailContext.beginPath();
        this.detailContext.moveTo(this.margin + 0.5*(this.canvasWidth - 2*this.margin)/this.nDigitizersPerCollector[clctr] - this.lineweight/2, this.canvasHeight*0.6 + topMargin - this.collectorHeight);
        this.detailContext.lineTo(this.margin + ((this.nDigitizersPerCollector[clctr]-1)+0.5)*(this.canvasWidth - 2*this.margin)/this.nDigitizersPerCollector[clctr] + this.lineweight/2, this.canvasHeight*0.6 + topMargin - this.collectorHeight);
        this.detailContext.moveTo(this.canvasWidth/2, this.canvasHeight*0.6 + topMargin - this.collectorHeight);
        this.detailContext.lineTo(this.canvasWidth/2, topMargin+ 0.40*this.canvasHeight + this.lineweight/2);
        this.detailContext.stroke();

        //tooltip layer:
        this.TTdetailContext.fillStyle = 'rgba('+(clctr+1)+','+(clctr+1)+','+(clctr+1)+',1)';
        this.TTdetailContext.fillRect(Math.round(this.margin), Math.round(topMargin), Math.round(this.canvasWidth-2*this.margin), Math.round(0.25*this.canvasHeight));

        //title
        this.detailContext.fillStyle = '#FFFFFF';
        this.detailContext.textBaseline = 'alphabetic'
        fontSize = fitFont(this.detailContext, 'Digitizers', this.collectorHeight)*1.2;
        this.detailContext.font = fontSize + 'px Raleway';
        this.detailContext.save();
        this.detailContext.rotate(-Math.PI/2);
        this.detailContext.fillText('Digitizers', -this.canvasHeight*0.6 - topMargin - 0.02*this.canvasWidth - this.detailContext.measureText('Digitizers').width/2,0.7*this.margin);
        this.detailContext.restore();  

        fontSize = fitFont(this.detailContext, 'Slave '+(window.DAQdetail+1), 2*this.collectorWidth);
        this.detailContext.font = fontSize + 'px Raleway';
        this.detailContext.save();
        this.detailContext.rotate(-Math.PI/2);
        this.detailContext.fillText('Slave '+(window.DAQdetail+1), -( 0.40*this.canvasHeight/2 + topMargin + this.detailContext.measureText('Slave '+(window.DAQdetail+1)).width/2 ),0.7*this.margin);
        this.detailContext.restore();

        //generate slave chart:
        //make list of digitizer FSPCs:
        var FSPC = [], triggers = [], transfers = [], oldTriggers = [], oldTransfers = [];
        for(key in window.codex.DAQmap['0x0XXXXXX']['0x0'+(window.DAQdetail+1)+'XXXXX']){
            if(key.slice(7,9)=='XX'){
                FSPC[FSPC.length] = key.slice(6,7);
                triggers[triggers.length] = window.codex.DAQmap['0x0XXXXXX']['0x0'+(window.DAQdetail+1)+'XXXXX'][key].trigRequestRate;
                transfers[transfers.length] = window.codex.DAQmap['0x0XXXXXX']['0x0'+(window.DAQdetail+1)+'XXXXX'][key].dataRate;
                oldTriggers[oldTriggers.length] = window.codex.DAQmap['0x0XXXXXX']['0x0'+(window.DAQdetail+1)+'XXXXX'][key].oldTrigRequestRate;
                oldTransfers[oldTransfers.length] = window.codex.DAQmap['0x0XXXXXX']['0x0'+(window.DAQdetail+1)+'XXXXX'][key].oldDataRate;
            }
        }
        slaveChart(frame,this.detailContext, this.margin + 0.1*(this.canvasWidth-2*this.margin), topMargin+0.36*this.canvasHeight, FSPC, triggers, transfers, oldTriggers, oldTransfers);



    };

    this.fetchNewData = function(){
        var i, j, Fkey, Skey, Pkey;

        window.codex.update();
        i=0; j=0;
        for(Fkey in window.codex.DAQmap){
            if(window.codex.dataKeys.indexOf(Fkey) == -1){
                this.dataBus.master[0] = window.codex.DAQmap[Fkey].trigRequestRate;
                for(Skey in window.codex.DAQmap[Fkey]){
                    if(window.codex.dataKeys.indexOf(Skey) == -1){
                        this.dataBus.collectors[j] = window.codex.DAQmap[Fkey][Skey].trigRequestRate;
                        this.dataBus.digitizerSummaries[j] = window.codex.DAQmap[Fkey][Skey].trigRequestRate;  //currently the same as the collector level since no filtering.
                        this.dataBus.collectorLinks[j] = window.codex.DAQmap[Fkey][Skey].dataRate;
                        this.dataBus.digitizerGroupSummaryLinks[j] = window.codex.DAQmap[Fkey][Skey].dataRate;  //again, redundant with collectors until some busy blocking or something is available
                        j++;
                        for(Pkey in window.codex.DAQmap[Fkey][Skey]){
                            if(window.codex.dataKeys.indexOf(Pkey) == -1){
                                this.dataBus.digitizers[i] = window.codex.DAQmap[Fkey][Skey][Pkey].trigRequestRate;
                                this.dataBus.digitizerLinks[i] = window.codex.DAQmap[Fkey][Skey][Pkey].dataRate;
                                i++;
                            }
                        }
                    }
                }
            }
        }

    };

    this.findCell = function(x, y){
        var imageData 
        if(this.detailShowing == 1){
            imageData = this.TTdetailContext.getImageData(x,y,1,1);
        } else{
            imageData = this.TTcontext.getImageData(x,y,1,1);
        }
        var index = -1;
        if(imageData.data[0] == imageData.data[1] && imageData.data[0] == imageData.data[2]) index = imageData.data[0];

        return index;
    };

    this.defineText = function(cell){
        var toolTipContent = '',
            nextLine, cardIndex, i, key, objects = [], split = [], table, mezRow, mezCell0, mezCell1,
            keys = ['detector','trigRequestRate', 'dataRate'],
            data = {};

        
        nextLine = '';
        if(this.dataBus.key[cell]){
            nextLine = 'FSPC: ' + this.dataBus.key[cell][this.dataBus.key[cell].length-1] + '<br>';

            //collectors
            if(this.dataBus.key[cell].length == 2){
                nextLine += '<br>Trig Request Rate: ' + window.codex.DAQmap[this.dataBus.key[cell][0]][this.dataBus.key[cell][1]]['trigRequestRate'].toFixed(1) + ' Hz<br>';
                nextLine += 'Inbound Data Rate: ' + window.codex.DAQmap[this.dataBus.key[cell][0]][this.dataBus.key[cell][1]]['dataRate'].toFixed(1) + ' Bps';
            }

            //digitizers
            if(this.dataBus.key[cell].length == 3){
                nextLine += '<br>Total Trig Request Rate: ' + window.codex.DAQmap[this.dataBus.key[cell][0]][this.dataBus.key[cell][1]][this.dataBus.key[cell][2]]['trigRequestRate'].toFixed(1) + ' Hz<br>';
                nextLine += 'Total Outbound Data Rate: ' + window.codex.DAQmap[this.dataBus.key[cell][0]][this.dataBus.key[cell][1]][this.dataBus.key[cell][2]]['dataRate'].toFixed(1) + ' Bps<br><br>';

                //build up arrays and objects to pass to tooltip table builder in the format it expects:
                for(key in window.codex.DAQmap[this.dataBus.key[cell][0]][this.dataBus.key[cell][1]][this.dataBus.key[cell][2]]){
                    if(window.codex.dataKeys.indexOf(key) == -1){
                        data[key] = window.codex.DAQmap[this.dataBus.key[cell][0]][this.dataBus.key[cell][1]][this.dataBus.key[cell][2]][key]
                        objects[objects.length] = key;
                    }
                }
            } 
        }

        toolTipContent += nextLine;
        if(this.detailShowing){
            document.getElementById(this.detailTooltip.ttDivID).innerHTML = toolTipContent;
            if(cell > this.nCollectors){
                //split TIG64s by mezzanine:
                if(objects.length>10){  //TODO: need more robust decision on whether we're looking at a TIG64 or not
                    split = [0,0];
                    for(i=0; i<objects.length; i++){
                        if(parseInt(objects[i].slice(7,9), 16) < 32 ) split[0]++;
                        else split[1]++;
                    }
                    window.state.staticTT = 1;
                } else
                    split = [objects.length]
                TTtable('DAQTTdetail', data, objects, keys, '', ['FSPC','Device','Trig Request Rate [Hz]', 'Outbound Data Rate [Bps]'], split);
                //fudge in a title row for mezzanines:
                if(objects.length>10){
                    table = document.getElementById('DAQTTdetailtable');
                    mezRow = table.insertRow(0);
                    mezCell0 = mezRow.insertCell(0);
                    mezCell1 = mezRow.insertCell(1);
                    mezCell0.innerHTML = 'Mezzanine 1';
                    mezCell1.innerHTML = 'Mezzanine 2';
                    mezCell0.setAttribute('colspan', 4);
                    mezCell1.setAttribute('colspan', 4);
                }
            }
        } else{
            document.getElementById(this.tooltip.ttDivID).innerHTML = toolTipContent;
        }

        //return length of longest line:
        return 0;
    };

    this.animate = function(){
        if(window.onDisplay == this.canvasID /*|| window.freshLoad*/) animate(this, 0);
        //else this.draw(this.nFrames);

        if(window.onDisplay == this.detailCanvasID /*|| window.freshLoad*/) animateDetail(this, 0);
        //else this.drawDetail(this.nFrames);
    };
}

//vertical bar chart for digitizer data; x0 y0 represents origin of chart
function slaveChart(frame, context, x0, y0, FSPC, triggers, transfers, oldTriggers, oldTransfers){
    var chartWidth = (window.DAQpointer.canvasWidth - 2*window.DAQpointer.margin)*0.8,
    chartHeight = 0.25*window.DAQpointer.canvasHeight,
    nDigitizers = window.DAQpointer.nDigitizersPerCollector[window.DAQdetail],
    barWidth = chartWidth / (nDigitizers*2) *0.95,
    tickmarkLength = 5,
    innerMargin = (window.DAQpointer.canvasWidth - chartWidth - 2*window.DAQpointer.margin)/2,
    i;

    context.font = Math.min( 12, fitFont(context, '9.9kBps', innerMargin/1.1 ) ) +'px Raleway';
    //label horizontal axis & draw bars
    context.textBaseline = 'top';
    for(i=0; i<nDigitizers; i++){
        context.fillStyle = '#FFFFFF';
        context.lineWidth = 1;
        context.fillText(FSPC[i], x0+barWidth+i*chartWidth/nDigitizers-context.measureText(FSPC[i]).width/2, y0+2);
        triggerBar(frame, oldTriggers[i], triggers[i], x0+i*chartWidth/nDigitizers, y0);
        transferBar(frame, oldTransfers[i], transfers[i], x0+barWidth+i*chartWidth/nDigitizers+1, y0);
    }

    //draw frame
    context.lineWidth = 1;
    context.fillStyle = '#FFFFFF'
    context.strokeStyle = '#FFFFFF';
    context.beginPath();
    context.moveTo(x0-tickmarkLength,y0 - chartHeight);
    context.lineTo(x0, y0-chartHeight);
    context.lineTo(x0,y0);
    context.moveTo(x0-tickmarkLength,y0);
    context.lineTo(x0+chartWidth+tickmarkLength, y0);
    context.moveTo(x0+chartWidth, y0);
    context.lineTo(x0+chartWidth, y0 - chartHeight);
    context.lineTo(x0+chartWidth+tickmarkLength, y0-chartHeight);
    context.stroke();

    //label vertical axes
    context.textBaseline = 'middle';
    context.fillText(window.parameters.DAQminima[3]/1000 + ' kBps', x0-tickmarkLength-context.measureText(window.parameters.DAQminima[3]/1000 + ' kBps').width, y0 );
    context.fillText(window.parameters.DAQmaxima[3]/1000 + ' kBps', x0-tickmarkLength-context.measureText(window.parameters.DAQmaxima[3]/1000 + ' kBps').width, y0-chartHeight );
    context.fillText(window.parameters.DAQminima[2]/1000 + ' kHz', x0+chartWidth+tickmarkLength, y0);
    context.fillText(window.parameters.DAQmaxima[2]/1000 + ' kHz', x0+chartWidth+tickmarkLength, y0-chartHeight);
    context.save();
    context.translate(x0-innerMargin/2, y0-chartHeight/2)
    context.rotate(-Math.PI/2);
    context.fillText('Transfer', -context.measureText('Transfer').width/2,0);
    context.fillStyle = '#222222';
    context.strokeStyle = '#0000FF';
    context.fillRect(-context.measureText('Transfer').width/2 - innerMargin/5-3,-innerMargin/5/2,innerMargin/5,innerMargin/5);
    context.strokeRect(-context.measureText('Transfer').width/2 - innerMargin/5-3,-innerMargin/5/2,innerMargin/5,innerMargin/5);
    context.restore();
    context.save();
    context.translate(x0+chartWidth+innerMargin/2, y0-chartHeight/2)
    context.rotate(Math.PI/2);
    context.fillText('Triggers', -context.measureText('Triggers').width/2,0);
    context.fillStyle = '#222222';
    context.strokeStyle = '#00FF00';
    context.fillRect(-context.measureText('Triggers').width/2 - innerMargin/5-3,-innerMargin/5/2,innerMargin/5,innerMargin/5);
    context.strokeRect(-context.measureText('Triggers').width/2 - innerMargin/5-3,-innerMargin/5/2,innerMargin/5,innerMargin/5);
    context.restore();


    function transferBar(frame, oldLevel, level, x0, y0){
        var height = (oldLevel - window.parameters.DAQminima[3]) / (window.parameters.DAQmaxima[3] - window.parameters.DAQminima[3])*chartHeight + (  (level - window.parameters.DAQminima[3])/(window.parameters.DAQmaxima[3] - window.parameters.DAQminima[3]) - (oldLevel - window.parameters.DAQminima[3]) / (window.parameters.DAQmaxima[3] - window.parameters.DAQminima[3]) )*chartHeight*frame/window.DAQpointer.nFrames;
        if(height>chartHeight) height = chartHeight;
        if(height<0) height = 0;
        context.strokeStyle = '#0000FF';
        context.fillStyle = '#222222';
        context.fillRect(x0,y0-height,barWidth,height)
        context.strokeRect(x0,y0-height,barWidth,height);
        context.save();
        context.translate(x0+barWidth/2, y0-height-2);
        context.rotate(-Math.PI/2);
        context.textBaseline = 'middle';
        context.fillStyle = '#FFFFFF';
        context.fillText(level.toFixed(0) + ' Bps', 0,0);
        context.restore();
    }

    function triggerBar(frame, oldLevel, level, x0, y0){
        var height = (oldLevel - window.parameters.DAQminima[2]) / (window.parameters.DAQmaxima[2] - window.parameters.DAQminima[2])*chartHeight + (  (level - window.parameters.DAQminima[2])/(window.parameters.DAQmaxima[2] - window.parameters.DAQminima[2]) - (oldLevel - window.parameters.DAQminima[2]) / (window.parameters.DAQmaxima[2] - window.parameters.DAQminima[2]) )*chartHeight*frame/window.DAQpointer.nFrames;
        if(height>chartHeight) height = chartHeight;
        if(height<0) height = 0;
        context.strokeStyle = '#00FF00';
        context.fillStyle = '#222222';
        context.fillRect(x0,y0-height,barWidth,height);
        context.strokeRect(x0,y0-height,barWidth,height);   
        context.save();
        context.translate(x0+barWidth/2, y0-height-2);
        context.rotate(-Math.PI/2);
        context.textBaseline = 'middle';
        context.fillStyle = '#FFFFFF';
        context.fillText(level.toFixed(0) + ' Hz', 0,0);
        context.restore();     
    }
}


//horizontal bar chart for DAQ data, x0 y0 represent bottom left corner of rendered area:
function rateChart(frame, data, context, x0, y0, maxLength, barWidth){

    var fontSize = 0.8*barWidth,
    row = 0,  //counts up from bottom
    key,
    rateScaleMin = window.parameters.DAQminima[4],
    dataScaleMin = window.parameters.DAQminima[5];    
    rateScaleMax = window.parameters.DAQmaxima[4],
    dataScaleMax = window.parameters.DAQmaxima[5];

    context.font = fontSize+'px Raleway';
    context.lineWidth = 1;

    //draw chart
    for(key in data){
        
        if(window.parameters.validDetectors.indexOf(key) != -1){  //only accept reports from actual devices listed in the parameters
            context.fillStyle = '#FFFFFF';
            context.textBaseline = 'middle';
            context.font = fontSize+'px Raleway';
            context.fillText(key+':', x0 - context.measureText(key+':').width, y0 - (barWidth+4)*(row+1/2) );
            drawTrigBar(key, frame);
            drawDataBar(key, frame);

            row++;
        }
        
    }

    function drawTrigBar(key, frame){
        var length = (data[key].prevTrigReqRate-rateScaleMin)/(rateScaleMax-rateScaleMin)*maxLength + ((data[key].totalTrigRequestRate-rateScaleMin)/(rateScaleMax-rateScaleMin) - (data[key].prevTrigReqRate-rateScaleMin)/(rateScaleMax-rateScaleMin))*maxLength*frame/window.DAQpointer.nFrames;
        if(length > maxLength) length = maxLength;
        if(length < 0) length = 0;
        context.strokeStyle = '#00FF00';
        context.fillStyle = '#222222';
        context.fillRect(1.1*x0, y0 - (barWidth+4)*(row+1), length, barWidth/2-2);
        context.strokeRect(1.1*x0, y0 - (barWidth+4)*(row+1), length, barWidth/2-2);
        context.fillStyle = '#FFFFFF';
        context.font = fontSize*0.6+'px Raleway';
        var text = (data[key].totalTrigRequestRate/1000 > 9999) ? (data[key].totalTrigRequestRate/1000).toExponential(0) : (data[key].totalTrigRequestRate/1000).toFixed(0);
        text += ' kHz';
        context.fillText( text, 1.1*x0 + length + 5,  y0 - (barWidth+4)*(row+1) + barWidth/4 - 1);
    }

    function drawDataBar(key, frame){
        var length = (data[key].prevDataRate-dataScaleMin)/(dataScaleMax-dataScaleMin)*maxLength + ((data[key].totalDataRate-dataScaleMin)/(dataScaleMax-dataScaleMin) - (data[key].prevDataRate-dataScaleMin)/(dataScaleMax-dataScaleMin))*maxLength*frame/window.DAQpointer.nFrames;
        if(length > maxLength) length = maxLength;
        if(length < 0) length = 0;
        context.strokeStyle = '#0000FF';
        context.fillStyle = '#222222';
        context.fillRect(1.1*x0, y0 - (barWidth+4)*(row+1) + barWidth/2+2, length, barWidth/2-2);
        context.strokeRect(1.1*x0, y0 - (barWidth+4)*(row+1) + barWidth/2+2, length, barWidth/2-2);
        context.fillStyle = '#FFFFFF';
        context.font = fontSize*0.6+'px Raleway';
       //console.log(data[key].totalDataRate/1000)
// window.codex.DAQmap[this.dataBus.key[cell][0]][this.dataBus.key[cell][1]]['dataRate'].toFixed(1)
        var text = (data[key].totalDataRate/1000 > 9999) ? (data[key].totalDataRate/1000).toExponential(0) : (data[key].totalDataRate/1000).toFixed(0);
        text += ' kBps';
        context.fillText( text, 1.1*x0 + length + 5,  y0 - (barWidth+4)*(row+1) + barWidth/2+2 + barWidth/4 - 1);
    }

    //draw decorations:
    context.strokeStyle = '#FFFFFF';
    context.fillStyle = '#FFFFFF';
    context.beginPath();
    context.moveTo(1.1*x0-2, y0 - (barWidth+4)*row);
    context.lineTo(1.1*x0-2, y0);
    context.lineTo(1.1*x0+maxLength, y0);
    context.lineTo(1.1*x0+maxLength, y0+5);
    context.stroke();
    context.moveTo(1.1*x0-2, y0);
    context.lineTo(1.1*x0-2, y0+5);
    context.stroke();

    context.font = fontSize*0.7+'px Raleway';
    //trig request labels
    context.fillText('Trig Requests: '+(rateScaleMin/1000).toFixed(0)+' kHz', 1.1*x0-2 - context.measureText('Trig Requests: 0 kHz').width/2, y0+5+fontSize*0.7 );
    context.fillText('Trig Requests: '+(rateScaleMax/1000).toFixed(0)+' kHz', 1.1*x0+maxLength - context.measureText('Trig Requests: '+(rateScaleMax/1000).toFixed(0)+' kHz').width/2, y0+5+fontSize*0.7 );
    context.fillStyle = '#222222';
    context.strokeStyle = '#00FF00';
    context.fillRect(1.1*x0+maxLength - context.measureText('Trig Requests: '+(rateScaleMax/1000).toFixed(0)+' kHz').width/2 - fontSize*0.7*1.5, y0+5+fontSize*0.35, fontSize*0.7, fontSize*0.7);
    context.strokeRect(1.1*x0+maxLength - context.measureText('Trig Requests: '+(rateScaleMax/1000).toFixed(0)+' kHz').width/2 - fontSize*0.7*1.5, y0+5+fontSize*0.35, fontSize*0.7, fontSize*0.7);
    context.fillRect(1.1*x0-2 - context.measureText('Trig Requests: '+(rateScaleMin/1000).toFixed(0)+' kHz').width/2 - fontSize*0.7*1.5, y0+5+fontSize*0.35, fontSize*0.7, fontSize*0.7);
    context.strokeRect(1.1*x0-2 - context.measureText('Trig Requests: '+(rateScaleMin/1000).toFixed(0)+' kHz').width/2 - fontSize*0.7*1.5, y0+5+fontSize*0.35, fontSize*0.7, fontSize*0.7);

    //data rate labels, left aligned with trig request labels
    context.fillStyle = '#FFFFFF';
    context.fillText('Data Rate: '+(dataScaleMin/1000).toFixed(0)+' kBps', 1.1*x0-2 - context.measureText('Trig Requests: 0 kHz').width/2, y0+10+2*fontSize*0.7 );
    context.fillText('Data Rate: '+(dataScaleMax/1000).toFixed(0)+' kBps', 1.1*x0+maxLength - context.measureText('Trig Requests: '+(rateScaleMax/1000).toFixed(0)+' kHz').width/2, y0+10+2*fontSize*0.7 );
    context.fillStyle = '#222222';
    context.strokeStyle = '#0000FF';
    context.fillRect(1.1*x0+maxLength - context.measureText('Trig Requests: '+(rateScaleMax/1000).toFixed(0)+' kHz').width/2 - fontSize*0.7*1.5, y0+10+fontSize*1.05, fontSize*0.7, fontSize*0.7);
    context.strokeRect(1.1*x0+maxLength - context.measureText('Trig Requests: '+(rateScaleMax/1000).toFixed(0)+' kHz').width/2 - fontSize*0.7*1.5, y0+10+fontSize*1.05, fontSize*0.7, fontSize*0.7);
    context.fillRect(1.1*x0-2 - context.measureText('Trig Requests: '+(rateScaleMin/1000).toFixed(0)+' kHz').width/2 - fontSize*0.7*1.5, y0+10+fontSize*1.05, fontSize*0.7, fontSize*0.7);
    context.strokeRect(1.1*x0-2 - context.measureText('Trig Requests: '+(rateScaleMin/1000).toFixed(0)+' kHz').width/2 - fontSize*0.7*1.5, y0+10+fontSize*1.05, fontSize*0.7, fontSize*0.7);
}



//masterCodex imports a table from which the DAQ is mapped
DAQcodex = function(){
    var i, Fkey, Skey, Pkey, Ckey;

    //Parse DAQ Assets///////////////////////////////////////////////////////////////////////
    //pull the FSPC table info in from the ODB
    this.DAQpath = ['/Analyzer/Parameters/Cathode/Config/FSCP[*]', '/Analyzer/Parameters/Cathode/Config/Name[*]', '/Analyzer/Parameters/Cathode/Config/N'];       
    this.DAQtable = ODBMGet(this.DAQpath);
    this.FSPC  = this.DAQtable[0];
    this.Name  = this.DAQtable[1];
    this.nRows = this.DAQtable[2];

    //parse into DAQ levels, and sort:    
    this.table = [];
    this.F = [];
    this.S = [];
    this.P = [];
    this.C = [];
    this.DAQmap = {};
    this.detSummary = {};

    for(i=0; i<this.nRows; i++){
        this.F[i] = Math.floor(this.FSPC[i] / 0x10000000);                                          //first digit (on left)
        this.S[i] = Math.floor(this.FSPC[i] / 0x100000) - this.F[i]*0x100;                          //second
        this.P[i] = Math.floor(this.FSPC[i] / 0x100) - this.F[i]*0x100000 - this.S[i]*0x1000;       //third-fifth
        this.C[i] = this.FSPC[i] - this.F[i]*0x10000000 - this.S[i]*0x100000 - this.P[i]*0x100;     //sixth and seventh
        if(this.S[i] <= 12){
            this.table.push({
                F : this.F[i],
                S : this.S[i],
                P : this.P[i],
                C : this.C[i],
                Name : this.Name[i]
            })
        }
    }

    function sortFSPC(a, b){
        if(a.F == b.F){
            if(a.S == b.S){
                if(a.P == b.P){
                    if(a.C == b.C){
                        return -9999; //this should never happen
                    } else {
                        if (a.C > b.C) return 1;
                        if (a.C < b.C) return -1;
                        else return 0;                        
                    }                 
                } else {
                    if (a.P > b.P) return 1;
                    if (a.P < b.P) return -1;
                    else return 0;                    
                }
            } else {
                if (a.S > b.S) return 1;
                if (a.S < b.S) return -1;
                else return 0;                
            }
        } else {
            if (a.F > b.F) return 1;
            if (a.F < b.F) return -1;
            else return 0;          
        }
    } 

    this.table.sort(sortFSPC);  
    this.F = []; this.S = []; this.P = []; this.C = []; this.Name = [];

    for(i=0; i<this.table.length; i++){
        this.F[i] = this.table[i].F;
        this.S[i] = this.table[i].S;
        this.C[i] = this.table[i].C;
        this.P[i] = this.table[i].P;
        this.Name[i] = this.table[i].Name.slice(0,10).toUpperCase();        
    }
    this.nRows = this.table.length;

    //loop over all rows, creating a 4-level object that reflects the structure of the DAQ:
    for(i=0; i<this.nRows; i++){

        //build keys
        Fkey = '0x'+this.F[i].toString(16).toUpperCase()+'XXXXXX';
        Skey = '0x'+this.F[i].toString(16).toUpperCase()+this.S[i].toString(16).toUpperCase()+'XXXXX';
        Pkey = '0x'+this.F[i].toString(16).toUpperCase()+this.S[i].toString(16).toUpperCase()+'00'+this.P[i].toString(16).toUpperCase()+'XX';
        Ckey = '0x'+this.F[i].toString(16).toUpperCase()+this.S[i].toString(16).toUpperCase()+'00'+this.P[i].toString(16).toUpperCase() + ( (this.C[i] < 10) ? '0' : '' ) + this.C[i].toString(16).toUpperCase();

        if(this.DAQmap[Fkey]){
            this.DAQmap[Fkey].trigRequestRate = 0;
            if(this.DAQmap[Fkey][Skey]){
                this.DAQmap[Fkey][Skey].trigRequestRate = 0;
                this.DAQmap[Fkey][Skey].dataRate = 0;  //how much data is this collector pushing upstream?
                if(this.DAQmap[Fkey][Skey][Pkey]){
                    this.DAQmap[Fkey][Skey][Pkey].trigRequestRate = 0;
                    this.DAQmap[Fkey][Skey][Pkey].dataRate = 0;  //how much data is this digitizer pushing upstream?
                    this.DAQmap[Fkey][Skey][Pkey].oldTrigRequestRate = 0;  //values from previous iteration
                    this.DAQmap[Fkey][Skey][Pkey].oldDataRate = 0;
                    this.DAQmap[Fkey][Skey][Pkey][Ckey] = {'detector' : this.Name[i], 'FSPC' : Ckey, 'trigRequestRate' : 0, 'dataRate' : 0};
                    this.detSummary[this.Name[i].slice(0,3)] = {'totalTrigRequestRate' : 0, 'prevTrigReqRate' : 0, 'totalDataRate' : 0, 'prevDataRate' : 0};
                } else {
                    this.DAQmap[Fkey][Skey][Pkey] = {};
                    i--;
                }
            } else {
                this.DAQmap[Fkey][Skey] = {};
                i--;
            }
        } else {
            this.DAQmap[Fkey] = {};
            i--;
        }
    }

    //keep track of all the key names in the DAQmap that contain data directly, and aren't part of the hierarchy, so we can ignore them when traversing the DAQ tree:
    this.dataKeys = ['detector', 'FSPC', 'trigRequestRate', 'dataRate', 'oldTrigRequestRate', 'oldDataRate'];

    //0x0XXXXXX == currently hard coded to only look at one master, loop over Fkey to generalize
    this.nCollectors = 0;
    for(Skey in this.DAQmap['0x0XXXXXX']){
        if(this.dataKeys.indexOf(Skey) == -1)
            this.nCollectors++;
    }
    this.nDigitizers = 0;
    this.nDigitizersPerCollector = [];
    i = 0;
    for(Skey in this.DAQmap['0x0XXXXXX']){
        if(this.dataKeys.indexOf(Skey) == -1){
            this.nDigitizersPerCollector[i] = 0;
            for(Pkey in this.DAQmap['0x0XXXXXX'][Skey]){
                if(this.dataKeys.indexOf(Pkey) == -1){
                    this.nDigitizers++;
                    this.nDigitizersPerCollector[i]++;
                }
            }
            i++;
        }
    }

    //populate this.DAQmap with all the relevant information from the JSONPstore.
    this.update = function(){
        
        var key, Fkey, Skey, Pkey, Ckey, ODBpaths, data;

        //get summary data from ODB
        this.triggerRate = parseFloat(window.localODB.TrigEPS).toFixed(1);
        this.triggerDataRate = parseFloat(window.localODB.TrigDPS).toFixed(1);
        this.EBrate = parseFloat(window.localODB.EBEPS).toFixed(1);
        this.EBdataRate = parseFloat(window.localODB.EBDPS).toFixed(1);


        //zero out the detector totals from last iteration:
        for(key in this.detSummary){
            this.detSummary[key].prevTrigReqRate = this.detSummary[key].totalTrigRequestRate;
            this.detSummary[key].totalTrigRequestRate = 0;

            this.detSummary[key].prevDataRate = this.detSummary[key].totalDataRate;
            this.detSummary[key].totalDataRate = 0;            
        }

        //map data from the JSONP store into the DAQ object, summing rates as we move upstream:
        for(Fkey in this.DAQmap){
            if(this.dataKeys.indexOf(Fkey) == -1){
                this.DAQmap[Fkey].trigRequestRate = 0;
                for(Skey in this.DAQmap[Fkey]){
                    if(this.dataKeys.indexOf(Skey) == -1){
                        this.DAQmap[Fkey][Skey].trigRequestRate = 0;
                        this.DAQmap[Fkey][Skey].dataRate = 0;
                        for(Pkey in this.DAQmap[Fkey][Skey]){
                            if(this.dataKeys.indexOf(Pkey) == -1){
                                this.DAQmap[Fkey][Skey][Pkey].oldTrigRequestRate = this.DAQmap[Fkey][Skey][Pkey].trigRequestRate;
                                this.DAQmap[Fkey][Skey][Pkey].oldDataRate = this.DAQmap[Fkey][Skey][Pkey].dataRate;
                                this.DAQmap[Fkey][Skey][Pkey].trigRequestRate = 0;
                                this.DAQmap[Fkey][Skey][Pkey].dataRate = 0;
                                for(Ckey in this.DAQmap[Fkey][Skey][Pkey]){
                                    if(window.JSONPstore['scalar']){
                                        if( window.JSONPstore['scalar'][this.DAQmap[Fkey][Skey][Pkey][Ckey].detector] ){
                                            this.DAQmap[Fkey][Skey][Pkey][Ckey].trigRequestRate = window.JSONPstore['scalar'][this.DAQmap[Fkey][Skey][Pkey][Ckey].detector]['TRIGREQ'];
                                            this.DAQmap[Fkey][Skey][Pkey][Ckey].dataRate = window.JSONPstore['scalar'][this.DAQmap[Fkey][Skey][Pkey][Ckey].detector]['dataRate'];
                                            this.DAQmap[Fkey][Skey][Pkey].trigRequestRate += this.DAQmap[Fkey][Skey][Pkey][Ckey].trigRequestRate;
                                            this.DAQmap[Fkey][Skey][Pkey].dataRate += this.DAQmap[Fkey][Skey][Pkey][Ckey].dataRate;
                                            this.detSummary[ this.DAQmap[Fkey][Skey][Pkey][Ckey].detector.slice(0,3) ].totalTrigRequestRate += this.DAQmap[Fkey][Skey][Pkey][Ckey].trigRequestRate;
                                            this.detSummary[ this.DAQmap[Fkey][Skey][Pkey][Ckey].detector.slice(0,3) ].totalDataRate += this.DAQmap[Fkey][Skey][Pkey][Ckey].dataRate;
                                        }
                                    }
                                }
                                this.DAQmap[Fkey][Skey].trigRequestRate += this.DAQmap[Fkey][Skey][Pkey].trigRequestRate;
                                this.DAQmap[Fkey][Skey].dataRate += this.DAQmap[Fkey][Skey][Pkey].dataRate;
                            }
                        }
                        this.DAQmap[Fkey].trigRequestRate += this.DAQmap[Fkey][Skey].trigRequestRate;
                    }
                }
            }
        }

    };

}






DESCANT.prototype = Object.create(Subsystem.prototype);

function DESCANT(){
    var i, j;
    //detector name, self-pointing pointer, pull in the Subsystem template, 
    //establish a databus and create a global-scope pointer to this object:
    this.name = 'DESCANT';
    var that = this;
    Subsystem.call(this);
    this.dataBus = new DESCANTDS();
    window.DESCANTpointer = that;

    //member variables///////////////////////////////////

    //drawing parameters//////////////////////////////////////////////////////////////////////////////////
	//center of DESCANT
	this.centerX = $(this.canvas).width() / 2;
	this.centerY = $(this.canvas).height()*0.43;

	//scale at which to draw DESCANT in pixels relative mm in blueprint:
	this.scale = 0.28;

	//pixels to explode DESCANT view by:
	this.explode = 10;

	//linewidth
	this.context.lineWidth = 3;

	//side length of pentagon hole:
	this.pentagonSide = 83*this.scale;
	//shortest distance from center of pentagon to side
	this.pentagonNormal = this.pentagonSide / 2 / Math.tan(36/180 * Math.PI);
	//longest distance from center of pentagon to side
	this.pentagonVertex = this.pentagonSide / 2 / Math.sin(36/180 * Math.PI);

	//member functions//////////////////////////////////////////////////////


	this.draw = function(frame){
		var i, j, key;
		this.context.clearRect(0,0,this.canvasWidth, this.canvasHeight-this.scaleHeight);

		//for(i=0; i<70; i++){
        for(key in this.dataBus.DESCANT){
            //i = this.dataBus.DESCANT[key].index - 1;
            i = this.chMap(this.dataBus.DESCANT[key].index);
			this.context.save();
			this.context.translate(this.centerX, this.centerY);
			this.context.rotate(this.drawRules[i][3]);

			this.context.fillStyle = colors(key, this.dataBus.DESCANT, frame, this.nFrames)

			if(this.drawRules[i][0] == 'white')whiteDetector(this.context, this.drawRules[i][1], this.drawRules[i][2], this.scale, 0, 0);
			else if(this.drawRules[i][0] == 'red') redDetector(this.context, this.drawRules[i][1], this.drawRules[i][2], this.scale, 0, this.drawRules[i][4], 0);
			else if(this.drawRules[i][0] == 'blue') blueDetector(this.context, this.drawRules[i][1], this.drawRules[i][2], this.scale, 0, this.drawRules[i][4], 0);
			else if(this.drawRules[i][0] == 'greenLeft') greenLeftDetector(this.context, this.drawRules[i][1], this.drawRules[i][2], this.scale, 0, this.drawRules[i][4], 0);
			else if(this.drawRules[i][0] == 'greenRight') greenRightDetector(this.context, this.drawRules[i][1], this.drawRules[i][2], this.scale, 0, this.drawRules[i][4], 0);

			this.context.restore();
		}

		if(!this.TTlayerDone){
			//and the same again for the hidden TT info canvas:
			this.TTcontext.fillStyle = '#123456'
			this.TTcontext.fillRect(0,0,this.canvasWidth, this.canvasHeight);
			for(key in this.dataBus.DESCANT){
	            //i = this.dataBus.DESCANT[key].index - 1;
	            i = this.chMap(this.dataBus.DESCANT[key].index);
				this.TTcontext.save();
				this.TTcontext.translate(this.centerX, this.centerY);
				this.TTcontext.rotate(this.drawRules[i][3]);

				this.TTcontext.fillStyle = 'rgba('+this.dataBus.DESCANT[key].index+','+this.dataBus.DESCANT[key].index+','+this.dataBus.DESCANT[key].index+',1)';

				if(this.drawRules[i][0] == 'white')whiteDetector(this.TTcontext, this.drawRules[i][1], this.drawRules[i][2], this.scale, 0, 1);
				else if(this.drawRules[i][0] == 'red') redDetector(this.TTcontext, this.drawRules[i][1], this.drawRules[i][2], this.scale, 0, this.drawRules[i][4], 1);
				else if(this.drawRules[i][0] == 'blue') blueDetector(this.TTcontext, this.drawRules[i][1], this.drawRules[i][2], this.scale, 0, this.drawRules[i][4], 1);
				else if(this.drawRules[i][0] == 'greenLeft') greenLeftDetector(this.TTcontext, this.drawRules[i][1], this.drawRules[i][2], this.scale, 0, this.drawRules[i][4], 1);
				else if(this.drawRules[i][0] == 'greenRight') greenRightDetector(this.TTcontext, this.drawRules[i][1], this.drawRules[i][2], this.scale, 0, this.drawRules[i][4], 1);

				this.TTcontext.restore();
				this.TTlayerDone = 1;
			}
		}
		

        if(frame==this.nFrames || frame==0) {
            //scale
            this.drawScale(this.context);
        }

	};

	//array of rules for drawing DESCANT channels.  Array index should correspond to real channel number; packed as [type, center x, center y, canvas rotation, element rotation]
	this.drawRules = [];
	for(i=0; i<5; i++){
		this.drawRules[1+0 + i*8] = ['white', 0, 0 - this.pentagonNormal-71.9*this.scale, (i-1)*72/180*Math.PI];
		this.drawRules[1+1 + i*8] = ['white', 0, 0 - this.pentagonNormal-(223.4 + this.explode/0.4)*this.scale, (i-1)*72/180*Math.PI];
		this.drawRules[1+2 + i*8] = ['white', 0, 0 - this.pentagonNormal-(374.9 + 2*this.explode/0.4)*this.scale, (i-1)*72/180*Math.PI];
		this.drawRules[1+3 + i*8] = ['white', 0, 0 - this.pentagonNormal-(526.4 + 3*this.explode/0.4)*this.scale, (i-1)*72/180*Math.PI];
		this.drawRules[1+4 + i*8] = ['greenLeft',  0, 0 - this.pentagonNormal - this.scale*(706.25 + this.explode), (i*72 - 60)/180*Math.PI, 10/180*Math.PI];
		this.drawRules[1+5 + i*8] = ['greenLeft',  0, 0 - this.pentagonNormal - this.scale*(681.25 + this.explode), (i*72 - 45)/180*Math.PI, 0];
		this.drawRules[1+6 + i*8] = ['greenRight', 0, 0 - this.pentagonNormal - this.scale*(681.25 + this.explode), (i*72 - 27)/180*Math.PI, -3/180*Math.PI];
		this.drawRules[1+7 + i*8] = ['greenRight', 0, 0 - this.pentagonNormal - this.scale*(706.25 + this.explode), (i*72 - 12)/180*Math.PI, -13/180*Math.PI];
		this.drawRules[1+40 + i*3] = ['red', 0, 0 - this.pentagonVertex - this.scale*(167.9 + this.explode), (i*72 + 324)/180*Math.PI, Math.PI/2];
		this.drawRules[1+41 + i*3] = ['red', 0, 0 - this.pentagonNormal - this.scale*(516.25 + this.explode), (i*72 - 55)/180*Math.PI, Math.PI/2 + 15/180*Math.PI]
		this.drawRules[1+42 + i*3] = ['red', 0, 0 - this.pentagonNormal - this.scale*(516.25 + this.explode), (i*72 - 16)/180*Math.PI, Math.PI/2 - 15/180*Math.PI]
		this.drawRules[1+55 + i*3] = ['blue',0, 0 - this.pentagonNormal - this.scale*(356.25 + this.explode), (i*72 - 49)/180*Math.PI, -Math.PI*22/180]
		this.drawRules[1+56 + i*3] = ['blue',0, 0 - this.pentagonNormal - this.scale*(356.25 + this.explode), (i*72 - 23)/180*Math.PI, Math.PI*22/180]
		this.drawRules[1+57 + i*3] = ['blue',0, 0 - this.pentagonNormal - this.scale*(516.25 + this.explode), (i*72 - 36)/180*Math.PI, Math.PI*90/180]
	}

    //do an initial populate:
    this.update();

    //they changed the detector numbering on me.  Here's a function to map from the new numbering scheme to the old one used in the rest of the code.
    this.chMap = function(newIndex){
    	var oldIndex;

    	if(newIndex < 6)
    		oldIndex = newIndex + (newIndex-1)*7;
    	else if(newIndex < 16){
    		if(newIndex%2 == 0)
    			oldIndex = 2 + (newIndex-6)/2*8;
    		else
    			oldIndex = 41 + (newIndex-7)/2*3;
    	} else if(newIndex < 31){
    		if( newIndex%3 == 1 )
    			oldIndex = 3 + (newIndex-16)/3*8;
    		else
    			oldIndex = 57 + newIndex-18;
    	} else if(newIndex < 51){
    		if( newIndex%4 == 3 )
    			oldIndex = 4 + (newIndex-31)/4*8;
    		else if( newIndex%4 == 0 )
    			oldIndex = 42 + (newIndex-32)/4*3;
    		else if( newIndex%4 == 1 )
    			oldIndex = 58 + (newIndex-33)/4*3;
    		else
    			oldIndex = 43 + (newIndex-34)/4*3;
    	} else{
    		if( newIndex==51 ) oldIndex = 40;
    		else
    			oldIndex = newIndex - 47 + 4*Math.floor((newIndex-52)/4)
    	}
    	return oldIndex;
    }

}














DSSD.prototype = Object.create(Subsystem.prototype);

function DSSD(){
    var i, j;
    //detector name, self-pointing pointer, pull in the Subsystem template, 
    //establish a databus and create a global-scope pointer to this object:
    this.name = 'DSSD';
    var that = this;
    Subsystem.call(this);
    this.dataBus = new DSSDDS();
    window.DSSDpointer = that;

    //drawing parameters//////////////////////////////////////////////////////////////////////////////////

    //3 rows by 4 column grid
    this.gutterSize = 0.1*this.canvasHeight*0.8;
    this.DSSDside = 0.2*this.canvasHeight*0.8;
    this.stripWidth = this.DSSDside/16;
    this.margin = (this.canvasWidth - 1.1*this.canvasHeight*0.8)/2;

    this.context.strokeStyle = '#999999';

    //member functions////////////////////////////////////////////////////////////////////////////////////
    this.draw = function(frame){
        this.context.font = '14px Raleway'
        this.context.clearRect(0,0,this.canvasWidth,this.canvasHeight*0.8);
        
        //DSSDs:
        //column 1:
        this.drawStrips('MAD01DP', this.margin, this.gutterSize, frame);
        this.drawStrips('MAD01DN', this.margin, 2*this.gutterSize+this.DSSDside, frame);

        //column 2:
        this.drawStrips('MAD02DP', this.margin+this.gutterSize+this.DSSDside, this.gutterSize, frame);
        this.drawStrips('MAD02DN', this.margin+this.gutterSize+this.DSSDside, 2*this.gutterSize+this.DSSDside, frame);

        //column 3:
        this.drawStrips('MAD03DP', this.margin+2*this.gutterSize+2*this.DSSDside, this.gutterSize, frame);
        this.drawStrips('MAD03DN', this.margin+2*this.gutterSize+2*this.DSSDside, 2*this.gutterSize+this.DSSDside, frame);

        //column 4:
        this.drawStrips('MAD04DP', this.margin+3*this.gutterSize+3*this.DSSDside, this.gutterSize, frame);
        this.drawStrips('MAD04EP', this.margin+3*this.gutterSize+3*this.DSSDside, 2*this.gutterSize+this.DSSDside, frame);
        this.drawStrips('MAD04EN', this.margin+3*this.gutterSize+3*this.DSSDside, 3*this.gutterSize+2*this.DSSDside, frame);

        //Pads:
        var pads = ['MAD01ENXXX', 'MAD02ENXXX', 'MAD03ENXXX'], key;
        for(var i=0; i<3; i++){
            key = pads[i];
            //if(window.JSONPstore['scalar'][key]){
                //choose fill color:
                if(window.state.subdetectorView == 0) this.context.fillStyle = interpolateColor(parseHexColor(this.dataBus.DSSD[key].oldHVcolor), parseHexColor(this.dataBus.DSSD[key].HVcolor), frame/this.nFrames);
                else if(window.state.subdetectorView == 1) this.context.fillStyle = interpolateColor(parseHexColor(this.dataBus.DSSD[key].oldThresholdColor), parseHexColor(this.dataBus.DSSD[key].thresholdColor), frame/this.nFrames);
                else if(window.state.subdetectorView == 2) this.context.fillStyle = interpolateColor(parseHexColor(this.dataBus.DSSD[key].oldRateColor), parseHexColor(this.dataBus.DSSD[key].rateColor), frame/this.nFrames); 
                if(this.context.fillStyle == 0xDEADBEEF) this.context.fillStyle = this.context.createPattern(window.parameters.warningFill, 'repeat');
                this.TTcontext.fillStyle = 'rgba('+this.dataBus.DSSD[key].index+','+this.dataBus.DSSD[key].index+','+this.dataBus.DSSD[key].index+',1)';

                this.context.fillRect(this.margin+i*(this.DSSDside+this.gutterSize), 3*this.gutterSize+2*this.DSSDside, this.DSSDside, this.DSSDside );
                this.context.strokeRect(this.margin+i*(this.DSSDside+this.gutterSize), 3*this.gutterSize+2*this.DSSDside, this.DSSDside, this.DSSDside );
                this.TTcontext.fillRect(this.margin+i*(this.DSSDside+this.gutterSize), 3*this.gutterSize+2*this.DSSDside, this.DSSDside, this.DSSDside );

                //draw title
                this.context.textBaseline = 'top';
                this.context.fillStyle = '#999999';
                this.context.clearRect(this.margin+i*(this.DSSDside+this.gutterSize), 3*this.gutterSize+3*this.DSSDside+2 , this.DSSDside, this.gutterSize*0.8);
                this.context.fillText(pads[i], this.margin+i*(this.DSSDside+this.gutterSize)+this.DSSDside/2 - this.context.measureText(pads[i]).width/2, 3*this.gutterSize+3*this.DSSDside+5 );
                this.context.closePath();
            //}
        }        

        //titles
        this.context.clearRect(0,0,this.canvasWidth, 0.98*this.gutterSize);
        for(i=0; i<4; i++){
            this.context.font = '16px Raleway';
            this.context.textBaseline = 'alphabetic';
            this.context.fillText('MAD0'+(i+1), this.margin + this.DSSDside/2 + i*(this.DSSDside+this.gutterSize) - this.context.measureText('MAD0'+(i+1)).width/2, this.gutterSize*0.85 )
        }

        //draw a frame around the DSSDs:
        this.context.strokeRect(this.margin-5, this.gutterSize-5, this.DSSDside+10, 2*this.DSSDside+this.gutterSize+5+25);
        this.context.strokeRect(this.margin-5 + this.DSSDside+this.gutterSize, this.gutterSize-5, this.DSSDside+10, 2*this.DSSDside+this.gutterSize+5+25);
        this.context.strokeRect(this.margin-5 + 2*this.DSSDside+2*this.gutterSize, this.gutterSize-5, this.DSSDside+10, 2*this.DSSDside+this.gutterSize+5+25);
        this.context.strokeRect(this.margin-5 + 3*this.DSSDside+3*this.gutterSize, this.gutterSize-5 + this.DSSDside+this.gutterSize, this.DSSDside+10, 2*this.DSSDside+this.gutterSize+5+25);

        if(frame==this.nFrames || frame==0) {
            //scale
            this.drawScale(this.context);
        }

    };

    //draw a DSSD array
    this.drawStrips = function(DSSDid, x0, y0, frame){
        var i=0, j,
        key, x, y,
        keys = this.genKeys(DSSDid);

        //draw strips
        for(j=0; j<keys.length; j++){
            key = keys[j];
            //choose fill color:
            if(window.state.subdetectorView == 0) this.context.fillStyle = interpolateColor(parseHexColor(this.dataBus.DSSD[key].oldHVcolor), parseHexColor(this.dataBus.DSSD[key].HVcolor), frame/this.nFrames);
            else if(window.state.subdetectorView == 1) this.context.fillStyle = interpolateColor(parseHexColor(this.dataBus.DSSD[key].oldThresholdColor), parseHexColor(this.dataBus.DSSD[key].thresholdColor), frame/this.nFrames);
            else if(window.state.subdetectorView == 2) this.context.fillStyle = interpolateColor(parseHexColor(this.dataBus.DSSD[key].oldRateColor), parseHexColor(this.dataBus.DSSD[key].rateColor), frame/this.nFrames);
            if(this.context.fillStyle == 0xDEADBEEF) this.context.fillStyle = this.context.createPattern(window.parameters.warningFill, 'repeat');
            
            //also for TT layer:
            this.TTcontext.fillStyle = 'rgba('+this.dataBus.DSSD[key].index+','+this.dataBus.DSSD[key].index+','+this.dataBus.DSSD[key].index+',1)';

            if(DSSDid[6] == 'N'){
                x = x0;
                y = y0+this.stripWidth*i;
                this.context.fillRect(x,y,this.DSSDside,this.stripWidth);
                this.context.strokeRect(x,y,this.DSSDside,this.stripWidth);
                this.TTcontext.fillRect(x,y,this.DSSDside,this.stripWidth);
            } else if(DSSDid[6] == 'P'){
                x = x0+this.stripWidth*i;
                y = y0;
                this.context.fillRect(x,y,this.stripWidth,this.DSSDside);
                this.context.strokeRect(x,y,this.stripWidth,this.DSSDside);
                this.TTcontext.fillRect(x,y,this.stripWidth,this.DSSDside);
            }

            i++;
        }

        //draw title
        this.context.textBaseline = 'top';
        this.context.fillStyle = '#999999';
        this.context.clearRect(x0, y0+this.DSSDside+2 , this.DSSDside, this.gutterSize*0.8);
        this.context.fillText(DSSDid, x0+this.DSSDside/2 - this.context.measureText(DSSDid).width/2, y0+this.DSSDside+5 );
    };

    //generate the keys for one set of 16 DSSD strips from minimal info, return in an array:
    this.genKeys = function(DSSD){
        var i, keys = [];

        for(i=0; i<16; i++){
            keys[i] = DSSD + ((i<10) ? ('0'+i) : i ) + 'X';
        }

        return keys;
    };




}function Dashboard(){

    var subsPresent, key;

	this.wrapperID = window.parameters.wrapper;             //ID of wrapping div
	this.canvasID = 'DashboardCanvas';	                    //ID of canvas to paint dashboard on
    this.linkWrapperID = 'DashboardLinks';                  //ID of div to contain clock view header
    this.sidebarID = 'dashboardMenus';                      //ID of dashboard sidebar div
    this.labels = [window.parameters.ExpName, window.parameters.ExpName, window.parameters.ExpName, 0, 0, 0, 'DUMP']      //names of corona, downstream lamp, upstream lamp, corona auxilary, chamber ds, chamber us, beamdump detectors

    //determine which detectors go where:
    //corona auxilary
    if(window.parameters.deployment.DANTE)
        this.labels[3] = 'DANTE';
    //chamber
    if(window.parameters.BAMBINOdeployment[0])  //upstream BAMBINO
        this.labels[5] = 'BAMBINO';
    if(window.parameters.BAMBINOdeployment[1])  //downstream BAMBINO
        this.labels[4] = 'BAMBINO';
    if(window.parameters.deployment.SHARC){
        this.labels[4] = 'SHARC';
    }
    if(window.parameters.deployment.TIP && window.parameters.TIPmode == 'Wall')
        this.labels[4] = 'TIP Wall'
    if(window.parameters.deployment.TIP && window.parameters.TIPmode == 'Ball')
        this.labels[4] = 'TIP Ball'
    if(window.parameters.deployment.SCEPTAR && window.parameters.SCEPTARconfig[0]) //upstream SCEPTAR
        this.labels[5] = 'SCEPTAR'
    if(window.parameters.deployment.SCEPTAR && window.parameters.SCEPTARconfig[1]) //downstream SCEPTAR
        this.labels[4] = 'SCEPTAR'
    if(window.parameters.deployment.SCEPTAR && window.parameters.SCEPTARconfig[2]) //ZDS
        this.labels[4] = 'ZDS'    
    if(window.parameters.deployment.PACES)
        this.labels[5] = 'PACES'
    if(window.parameters.deployment.SPICE)
        this.labels[5] = 'SPICE'
    //downstream lampshade
    if(window.parameters.deployment.DESCANT)
        this.labels[1] = 'DESCANT';
    //upstream lampshade
    if(window.parameters.deployment.SPICE)
        this.labels[2] = 0;

	this.wrapper = document.getElementById(this.wrapperID);

    //right sidebar menus
    subsPresent = [window.parameters.ExpName];
    for(key in window.parameters.deployment){
        if(window.parameters.deployment[key] && key!='HPGe')
            subsPresent[subsPresent.length] = key;
    }
    deployMenu(this.sidebarID, subsPresent , subsPresent);

    //add top level nav button:
    insertDOM('button', 'DashboardButton', 'navLinkDown', '', 'statusLink', function(){swapView('DashboardLinks', 'DashboardCanvas', 'dashboardMenus', 'DashboardButton')}, 'Dashboard', '', 'button')

    //nav wrapper div
    insertDOM('div', this.linkWrapperID, 'navPanel', '', this.wrapperID, '', '')
    //dashboard is the initial view, put the navbar on top:
    document.getElementById(this.linkWrapperID).setAttribute('style', 'z-index:1; opacity:1;')

    //nav header
    insertDOM('h1', 'DashboardLinksBanner', 'navPanelHeader', '', this.linkWrapperID, '', window.parameters.ExpName+' Dashboard')
    insertDOM('br', 'break', '', '', this.linkWrapperID, '', '')

	//deploy a canvas for the dashboard view:
    this.canvasWidth = 0.48*$(this.wrapper).width();
    this.canvasHeight = 0.8*$(this.wrapper).height();
    insertDOM('canvas', this.canvasID, 'monitor', 'position:absolute; left:24%; top:' + ($('#DashboardLinks').height() + 5) +'px;', this.wrapperID, '', '')
    this.canvas = document.getElementById('DashboardCanvas');
    this.context = this.canvas.getContext('2d');
    this.canvas.setAttribute('width', this.canvasWidth)
    this.canvas.setAttribute('height', this.canvasHeight)

    //drawing parameters:
    this.x0 = this.canvasWidth / 2;
    this.y0 = this.canvasHeight / 2;
    this.outerRad = this.canvasHeight*0.4;
    this.innerRad = this.canvasHeight*0.25;
    this.gapArc = Math.PI/180 * 5;
    this.lampshadeArc = Math.PI/180 * 25;
    this.coronaArc = Math.PI/180 * 60;
    this.auxCoronaArc = Math.PI/180 * 10;
    this.beampipeArc = Math.PI - this.coronaArc - 2*this.auxCoronaArc - 4*this.gapArc - 2*this.lampshadeArc;



    //establish animation parameters////////////////////////////////////////////////////////////////////
    this.FPS = 30;
    this.duration = 0.5;
    this.nFrames = this.FPS*this.duration;

    //data buffers///////////////////////////

    //member functions/////////////////////////////////////////////

    this.draw = function(frame){

        this.context.strokeStyle = '#999999';
        this.context.lineWidth = 1;

        //downstream lampshade
        //port side
        this.context.beginPath();
        this.context.arc(this.x0, this.y0, this.outerRad, -this.coronaArc/2 - 2*this.gapArc - this.auxCoronaArc - 2*this.lampshadeArc - this.beampipeArc, -this.coronaArc/2 - 2*this.gapArc - this.auxCoronaArc - this.lampshadeArc - this.beampipeArc, false);
        this.context.arc(this.x0, this.y0, this.innerRad, -this.coronaArc/2 - 2*this.gapArc - this.auxCoronaArc - this.lampshadeArc - this.beampipeArc, -this.coronaArc/2 - 2*this.gapArc - this.auxCoronaArc - 2*this.lampshadeArc - this.beampipeArc, true);
        this.context.closePath();
        this.context.stroke();
        //starboard side
        this.context.beginPath();
        this.context.arc(this.x0, this.y0, this.outerRad, -this.coronaArc/2 - 2*this.gapArc - this.auxCoronaArc - this.lampshadeArc, -this.coronaArc/2 - 2*this.gapArc - this.auxCoronaArc, false);
        this.context.arc(this.x0, this.y0, this.innerRad, -this.coronaArc/2 - 2*this.gapArc - this.auxCoronaArc, -this.coronaArc/2 - 2*this.gapArc - this.auxCoronaArc - this.lampshadeArc, true);
        this.context.closePath();
        this.context.stroke();      

        //upstream lampshade  
        //port side
        this.context.beginPath();
        this.context.arc(this.x0, this.y0, this.outerRad, -1.5*this.coronaArc - 6*this.gapArc - 3*this.auxCoronaArc - 3*this.lampshadeArc - this.beampipeArc, -1.5*this.coronaArc - 6*this.gapArc - 3*this.auxCoronaArc - 2*this.lampshadeArc - this.beampipeArc, false);
        this.context.arc(this.x0, this.y0, this.innerRad, -1.5*this.coronaArc - 6*this.gapArc - 3*this.auxCoronaArc - 2*this.lampshadeArc - this.beampipeArc, -1.5*this.coronaArc - 6*this.gapArc - 3*this.auxCoronaArc - 3*this.lampshadeArc - this.beampipeArc, true);
        this.context.closePath();
        this.context.stroke();
        //starboard side
        this.context.beginPath();
        this.context.arc(this.x0, this.y0, this.outerRad, this.coronaArc/2 + 2*this.gapArc + this.auxCoronaArc, this.coronaArc/2 + 2*this.gapArc + this.auxCoronaArc + this.lampshadeArc, false);
        this.context.arc(this.x0, this.y0, this.innerRad, this.coronaArc/2 + 2*this.gapArc + this.auxCoronaArc + this.lampshadeArc, this.coronaArc/2 + 2*this.gapArc + this.auxCoronaArc, true);
        this.context.closePath();
        this.context.stroke();  

        if(this.labels[3]){
            //downstream auxillary corona
            //port side
            this.context.beginPath();
            this.context.arc(this.x0, this.y0, this.outerRad, -this.coronaArc/2 - 3*this.gapArc - 2*this.auxCoronaArc - 2*this.lampshadeArc - this.beampipeArc, -this.coronaArc/2 - 3*this.gapArc - this.auxCoronaArc - 2*this.lampshadeArc - this.beampipeArc, false);
            this.context.arc(this.x0, this.y0, this.innerRad, -this.coronaArc/2 - 3*this.gapArc - this.auxCoronaArc - 2*this.lampshadeArc - this.beampipeArc, -this.coronaArc/2 - 3*this.gapArc - 2*this.auxCoronaArc - 2*this.lampshadeArc - this.beampipeArc, true);
            this.context.closePath();
            this.context.stroke();
            //starboard side
            this.context.beginPath();
            this.context.arc(this.x0, this.y0, this.outerRad, -this.coronaArc/2 - this.gapArc - this.auxCoronaArc, -this.coronaArc/2 - this.gapArc, false);
            this.context.arc(this.x0, this.y0, this.innerRad, -this.coronaArc/2 - this.gapArc, -this.coronaArc/2 - this.gapArc - this.auxCoronaArc, true);
            this.context.closePath();
            this.context.stroke();      

            //upstream auxilary corona
            //port side
            this.context.beginPath();
            this.context.arc(this.x0, this.y0, this.outerRad, -1.5*this.coronaArc - 5*this.gapArc - 3*this.auxCoronaArc - 2*this.lampshadeArc - this.beampipeArc, -1.5*this.coronaArc - 5*this.gapArc - 2*this.auxCoronaArc - 2*this.lampshadeArc - this.beampipeArc, false);
            this.context.arc(this.x0, this.y0, this.innerRad, -1.5*this.coronaArc - 5*this.gapArc - 2*this.auxCoronaArc - 2*this.lampshadeArc - this.beampipeArc, -1.5*this.coronaArc - 5*this.gapArc - 3*this.auxCoronaArc - 2*this.lampshadeArc - this.beampipeArc, true);
            this.context.closePath();
            this.context.stroke();
            //starboard side
            this.context.beginPath();
            this.context.arc(this.x0, this.y0, this.outerRad, this.coronaArc/2 + this.gapArc, this.coronaArc/2 + this.gapArc + this.auxCoronaArc, false);
            this.context.arc(this.x0, this.y0, this.innerRad, this.coronaArc/2 + this.gapArc + this.auxCoronaArc, this.coronaArc/2 + this.gapArc, true);
            this.context.closePath();
            this.context.stroke();      
        }
        //port corona
        this.context.beginPath();
        this.context.arc(this.x0, this.y0, this.outerRad, -Math.PI -0.5*this.coronaArc, -Math.PI + 0.5*this.coronaArc, false);
        this.context.arc(this.x0, this.y0, this.innerRad, -Math.PI + 0.5*this.coronaArc, -Math.PI - 0.5*this.coronaArc, true);
        this.context.closePath();
        this.context.stroke();
        //starboard corona
        this.context.beginPath();
        this.context.arc(this.x0, this.y0, this.outerRad, -0.5*this.coronaArc, 0.5*this.coronaArc, false);
        this.context.arc(this.x0, this.y0, this.innerRad, 0.5*this.coronaArc, -0.5*this.coronaArc, true);
        this.context.closePath();
        this.context.stroke();

        //target chamber
        if(this.labels[4]){
            //downstream
            this.context.strokeRect(this.x0 - 0.75*this.innerRad/2, this.y0-this.innerRad/2, 0.75*this.innerRad, this.innerRad/10);
        }
        if(this.labels[5]){
            //upstream
            this.context.strokeRect(this.x0 - 0.75*this.innerRad/2, this.y0+this.innerRad/2 - this.innerRad/10, 0.75*this.innerRad, this.innerRad/10);
        }

        //beamdump
        this.context.strokeRect(this.x0 - this.canvasHeight*0.1, this.canvasHeight*0.01, this.canvasHeight*0.2, this.canvasHeight*0.5 - this.outerRad - 2*this.canvasHeight*0.01);

        //beam arrow
        this.context.lineWidth = 2;
        this.context.beginPath();
        this.context.moveTo(this.x0, this.canvasHeight*0.98);
        this.context.lineTo(this.x0, this.canvasHeight*0.78);
        this.context.lineTo(this.x0 - this.canvasHeight*0.02, this.canvasHeight*0.78 + this.canvasHeight*0.02);
        this.context.stroke();

        //labels
        this.context.font = Math.min(20,fitFont(this.context, this.labels[3], this.outerRad*(this.gapArc+this.auxCoronaArc)))+'px Orbitron';
        this.context.fillStyle = '#999999';
        this.context.textBaseline = 'alphabetic';
        //corona
        curveText(this.labels[0], this.context, this.x0, this.y0, this.outerRad*1.02, -Math.PI/2 - this.context.measureText(this.labels[0]).width/2/this.outerRad*1.02);
        curveText(this.labels[0], this.context, this.x0, this.y0, this.outerRad*1.02, Math.PI/2 - this.context.measureText(this.labels[0]).width/2/this.outerRad*1.02);
        //downstream auxilary corona
        curveText(this.labels[3], this.context, this.x0, this.y0, this.outerRad*1.02, -(this.beampipeArc/2+this.lampshadeArc+this.gapArc+this.auxCoronaArc/2) - this.context.measureText(this.labels[3]).width/2/this.outerRad*1.02);
        curveText(this.labels[3], this.context, this.x0, this.y0, this.outerRad*1.02, this.beampipeArc/2+this.lampshadeArc+this.gapArc+this.auxCoronaArc/2 - this.context.measureText(this.labels[3]).width/2/this.outerRad*1.02);        
        //upstream auxilary corona
        curveText(this.labels[3], this.context, this.x0, this.y0, this.outerRad*1.02, Math.PI-(this.beampipeArc/2+this.lampshadeArc+this.gapArc+this.auxCoronaArc/2) - this.context.measureText(this.labels[3]).width/2/this.outerRad*1.02);
        curveText(this.labels[3], this.context, this.x0, this.y0, this.outerRad*1.02, Math.PI+this.beampipeArc/2+this.lampshadeArc+this.gapArc+this.auxCoronaArc/2 - this.context.measureText(this.labels[3]).width/2/this.outerRad*1.02); 
        //downstream lampshade
        curveText(this.labels[1], this.context, this.x0, this.y0, this.outerRad*1.02, -(this.beampipeArc + this.lampshadeArc)/2 - this.context.measureText(this.labels[1]).width/2/this.outerRad*1.02);
        curveText(this.labels[1], this.context, this.x0, this.y0, this.outerRad*1.02, (this.beampipeArc + this.lampshadeArc)/2 - this.context.measureText(this.labels[1]).width/2/this.outerRad*1.02);
        //upstream lampshade
        curveText(this.labels[2], this.context, this.x0, this.y0, this.outerRad*1.02, Math.PI-(this.beampipeArc + this.lampshadeArc)/2 - this.context.measureText(this.labels[2]).width/2/this.outerRad*1.02);
        curveText(this.labels[2], this.context, this.x0, this.y0, this.outerRad*1.02, Math.PI+(this.beampipeArc + this.lampshadeArc)/2 - this.context.measureText(this.labels[2]).width/2/this.outerRad*1.02);  
        //target chamber (downstream)
        if(this.labels[4]){
            this.context.font = Math.min(20,fitFont(this.context, this.labels[4], this.innerRad*1.9))+'px Orbitron';
            this.context.textBaseline = 'top';
            this.context.fillText(this.labels[4], this.x0 - this.context.measureText(this.labels[4]).width/2, this.y0 - 0.34*this.innerRad);
        }
        //target chamber (upstream)        
        if(this.labels[5]){
            this.context.font = Math.min(20,fitFont(this.context, this.labels[5], this.innerRad*1.9))+'px Orbitron';
            this.context.textBaseline = 'bottom';
            this.context.fillText(this.labels[5], this.x0 - this.context.measureText(this.labels[5]).width/2, this.y0 + 0.4*this.innerRad);
        }
        //beam dump
        this.context.font = Math.min(20,fitFont(this.context, this.labels[6], this.canvasHeight*0.16))+'px Orbitron';
        this.context.textBaseline = 'top';
        this.context.fillText(this.labels[6], this.x0 - this.context.measureText(this.labels[6]).width/2, this.canvasHeight*0.5 - this.outerRad);        
    };

    this.animate = function(){
        if(window.onDisplay == this.canvasID /*|| window.freshLoad*/) animate(this, 0);
        else this.draw(this.nFrames);
    };

    this.draw(0);


    //alarm animation test:
    //fadeRed('TIGRESSTab')
    function fadeBlack(tabID){
        $('#'+tabID).off();
        $('#'+tabID).on('transitionend', function(){fadeRed(tabID)});
        document.getElementById(tabID).style.border = '2px solid black';
        document.getElementById(tabID).style['border-right'] = 'none';
    }
    function fadeRed(tabID){
        $('#'+tabID).off();
        $('#'+tabID).on('transitionend', function(){fadeBlack(tabID)});
        document.getElementById(tabID).style.border = '2px solid red';
        document.getElementById(tabID).style['border-right'] = 'none';
    }    


}//Each detector will have its own data structure for ferrying information 
//from the ODB (or elsewhere) to the instance of the monitoring service
//for that detector.  Also, each detector will have a key map which matches
//monitoring service array indices to detector element name, and to ODB
//index.

HVDS = function(rows, cols){
	var i,j;
	//data arrays:
	this.channelName = [];
    this.demandVoltage = [];
    this.reportVoltage = [];
    this.reportCurrent = [];
    this.demandVrampUp = [];
    this.demandVrampDown = [];
    this.reportTemperature = [];
    this.channelMask = [];
    this.alarmStatus = [];
    this.rampStatus = [];
    this.voltLimit = [];
    this.currentLimit = [];
    for(i=0; i<rows; i++){
    	this.channelName[i] = [];
        this.demandVoltage[i] = [];
        this.reportVoltage[i] = [];
        this.reportCurrent[i] = [];
        this.demandVrampUp[i] = [];
        this.demandVrampDown[i] = [];
        this.reportTemperature[i] = [];
        this.channelMask[i] = [];
        this.alarmStatus[i] = [];
        this.rampStatus[i] = [];
        this.voltLimit[i] = [];
        this.currentLimit[i] = [];
        for(j=0;j<cols;j++){
        	this.alarmStatus[i][j] = [0,0,0];
        }
    }
}

HVBarDS = function(){
    this.barChartData = [];
    this.barChartAlarms = [];
}

function cloverDS(nClovers, mode){
	var i, j, k;

	this.colorQuads = ['G', 'B', 'W', 'R'];
	var pfx = (mode == 'TIGRESS') ? 'TI' : 'GR';
	this.HPGe = {};
	for(i=1; i<1+nClovers; i++){
		//loop over quadrants
		for(j=0; j<4; j++){
			this.HPGe[pfx+'G'+( (i<10) ? '0'+i : i)+this.colorQuads[j]+'N00A'] = {
				'HV'		: 0,		//note both A and B carry the same HV for GRIFFIN style HPGe
				'threshold' : 0,
				'rate'		: 0,
				'index'     : ((mode== 'TIGRESS')? 10:2)*j+((mode== 'TIGRESS')? 60:30)*(i-1),

				'oldHVcolor' : '#000000',
				'HVcolor'	 : '#000000',
				'oldThresholdColor' : '#000000',
				'thresholdColor' : '#000000',
				'oldRateColor' : '#000000',
				'rateColor' : '#000000'				
			}
			this.HPGe[pfx+'G'+( (i<10) ? '0'+i : i)+this.colorQuads[j]+'N00B'] = {
				'HV'		: 0,		//note both A and B carry the same HV for GRIFFIN style HPGe
				'threshold' : 0,
				'rate'		: 0,
				'index'		: ((mode== 'TIGRESS')? 10:2)*j+1+((mode== 'TIGRESS')? 60:30)*(i-1),

				'oldHVcolor' : '#000000',
				'HVcolor'	 : '#000000',
				'oldThresholdColor' : '#000000',
				'thresholdColor' : '#000000',
				'oldRateColor' : '#000000',
				'rateColor' : '#000000'				
			}

			if(mode == 'TIGRESS'){
				for(k=1; k<9; k++){
					this.HPGe['TIG'+( (i<10) ? '0'+i : i)+this.colorQuads[j]+'P0'+k+'X'] = {
						'HV'		: 0,
						'threshold' : 0,
						'rate'		: 0,
						'index'     : 10*j+1+k + 60*(i-1),

						'oldHVcolor' : '#000000',
						'HVcolor'	 : '#000000',
						'oldThresholdColor' : '#000000',
						'thresholdColor' : '#000000',
						'oldRateColor' : '#000000',
						'rateColor' : '#000000'							
					}
				}
			}
		}

		//BGO channels
		var ID;
		//loop over quadrants
		for(j=0; j<4; j++){
			//five BGO segments in each quadrant: front, front, side, side, back
			for(k=1; k<6; k++){
				if(k==1) ID = ((mode== 'TIGRESS')? 53:21)+2*j;	//front suppressors
				if(k==2) ID = ((mode== 'TIGRESS')? 52:20)+2*j;
				if(k==3) ID = ((mode== 'TIGRESS')? 45:13)+2*j;	//side suppressors
				if(k==4) ID = ((mode== 'TIGRESS')? 44:12)+2*j;
				if(k==5) ID = ((mode== 'TIGRESS')? 40:8)+j; 		//back suppressors
				this.HPGe[pfx+'S'+( (i<10) ? '0'+i : i)+this.colorQuads[j]+'N0'+k+'X'] = {
				'HVA'		: 0,		//each rate channel has two HV hookups.
				'HVB'		: 0,
				'threshold' : 0,
				'rate'		: 0,
				'index'		: ID+((mode== 'TIGRESS')? 60:30)*(i-1),

				'oldHVAcolor' : '#000000',
				'HVAcolor'	 : '#000000',
				'oldHVBcolor' : '#000000',
				'HVBcolor'	 : '#000000',				
				'oldThresholdColor' : '#000000',
				'thresholdColor' : '#000000',
				'oldRateColor' : '#000000',
				'rateColor' : '#000000'					
				}
			}
		}

	}

	//invert the index map for the TT:
	this.HPGeTTmap = [];
	for(key in this.HPGe){
		this.HPGeTTmap[this.HPGe[key].index] = key;
	}

	this.summary = {};
	for(i=1; i<1+nClovers; i++){
		//HPGe summaries
		for(j=0; j<4; j++){
			this.summary[pfx+'G'+( (i<10) ? '0'+i : i)+this.colorQuads[j]] = {
				'clover' : i,
				'quadrant' : j,

				'HV'		: 0,
				'threshold' : 0,
				'rate'		: 0,

				'oldHVcolor' : '#000000',
				'HVcolor'	 : '#000000',
				'oldThresholdColor' : '#000000',
				'thresholdColor' : '#000000',
				'oldRateColor' : '#000000',
				'rateColor' : '#000000'					
			}
		}

		//BGO summaries
		for(j=0; j<4; j++){
			this.summary[pfx+'S'+( (i<10) ? '0'+i : i)+this.colorQuads[j]] = {
				'clover' : i,
				'quadrant' : j,

				'HV'		: 0,
				'threshold' : 0,
				'rate'		: 0,

				'oldHVcolor' : '#000000',
				'HVcolor'	 : '#000000',
				'oldThresholdColor' : '#000000',
				'thresholdColor' : '#000000',
				'oldRateColor' : '#000000',
				'rateColor' : '#000000'					
			}			
		}
	}
}

SHARCDS = function(padsEnabled){
	var i, j, name,
	that = this;
	this.SHARC = {};
	this.TTmap = [];
	this.summary = {};
	//SHARC detail level index logic: hundreds correspond to Array Position, ones and tens count through Segments front to back to pads. 
	//boxes:
	for(i=5; i<13; i++){
		//fronts:
		for(j=0; j<24; j++){
			name = 'SHB' + ( (i<10) ? '0'+i : i ) + 'DP' + ( (j<10) ? '0'+j : j ) + 'X';
			deployKeys('SHARC', name, 100*i + j);
		}
		//backs:
		for(j=0; j<48; j++){
			name = 'SHB' + ( (i<10) ? '0'+i : i ) + 'DN' + ( (j<10) ? '0'+j : j ) + 'X';
			deployKeys('SHARC', name, 100*i + 24 + j);
		}		
		//pads
		for(j=1; j<2; j++){ //only fronts actually instrumented?
			name = 'SHB' + ( (i<10) ? '0'+i : i ) + 'E' + ( (j==0) ? 'N' : 'P' ) + '00X';
			deployKeys('SHARC', name, 100*i+72 + j);
			deployKeys('summary', name, 10*i+8 + j); //summary level, see below
		}
	}

	//quadrants:
	for(i=1; i<5; i++){
		//fronts:
		for(j=0; j<16; j++){
			name = 'SHQ' + '0'+i + 'DP' + ( (j<10) ? '0'+j : j ) + 'X';  //upstream
			deployKeys('SHARC', name, 100*i + j);
			name = 'SHQ' + (i+12) + 'DP' + ( (j<10) ? '0'+j : j ) + 'X';  //downstream
			deployKeys('SHARC', name, 100*(i+12) + j);
		}
		//backs:
		for(j=0; j<24; j++){
			name = 'SHQ' + '0'+i + 'DN' + ( (j<10) ? '0'+j : j ) + 'X'; //upstream
			deployKeys('SHARC', name, 100*i + 16 + j);
			name = 'SHQ' + (i+12) + 'DN' + ( (j<10) ? '0'+j : j ) + 'X'; //downstream
			deployKeys('SHARC', name, 100*(i+12) + 16 + j);
		}
		//pads
		for(j=1; j<2; j++){  //only fronts actually instrumented?
			name = 'SHQ0' + i + 'E' + ( (j==0) ? 'N' : 'P' ) + '00X';
			deployKeys('SHARC', name, 100*i+40 + j);
			deployKeys('summary', name, 10*i+8 + j);
			name = 'SHQ' + (i+12) + 'E' + ( (j==0) ? 'N' : 'P' ) + '00X';
			deployKeys('SHARC', name, 100*(i+12)+40 + j);
			deployKeys('summary', name, 10*(i+12)+8 + j);
		}


	}

	//invert the index map for the TT:
	for(key in this.SHARC){
		this.TTmap[this.SHARC[key].index] = key;
	}

	//sumaries - split each detector into 4 groups of segments:
	//SHARC summary level index logic: index = 10*(Array Position) + { (Front Q1->Q4, Back Q1->Q4, front pad, back pad) -> [0,9] }
	//boxes:
	for(i=5; i<13; i++){
		//fronts:
		for(j=0; j<4; j++){
			name = 'SHB' + ( (i<10) ? '0'+i : i ) + 'DP' + j;
			deployKeys('summary', name, 10*i + j);
		}
		//backs:
		for(j=0; j<4; j++){
			name = 'SHB' + ( (i<10) ? '0'+i : i ) + 'DN' + j;
			deployKeys('summary', name, 10*i + 4 + j);
		}		
	}

	//quadrants:
	for(i=1; i<5; i++){
		//fronts:
		for(j=0; j<4; j++){
			name = 'SHQ' + '0'+i + 'DP' + j;  //upstream
			deployKeys('summary', name, 10*i + j);
			name = 'SHQ' + (i+12) + 'DP' + j;  //downstream
			deployKeys('summary', name, 10*(i+12) + j);
		}
		//backs:
		for(j=0; j<4; j++){
			name = 'SHQ' + '0'+i + 'DN' + j; //upstream
			deployKeys('summary', name, 10*i + 4 + j);
			name = 'SHQ' + (i+12) + 'DN' + j; //downstream
			deployKeys('summary', name, 10*(i+12) + 4 + j);
		}
	}
 
	function deployKeys(object, name, index){
		that[object][name] = {
			'HV'		: 0,
			'threshold' : 0,
			'rate' 		: 0,
			'index'		: index,

			'oldHVcolor' : '#000000',
			'HVcolor'	 : '#000000',
			'oldThresholdColor' : '#000000',
			'thresholdColor' : '#000000',
			'oldRateColor' : '#000000',
			'rateColor' : '#000000'	
		}
		that.TTmap[index] = name;		
	};
}

DESCANTDS = function(){

	var i, name;

	this.DESCANT = {};
	this.TTmap = [];
	for(i=1; i<71; i++){
		name = (i<10) ? 'DSC00'+i+'P00X' : 'DSC0'+i+'P00X';
		this.DESCANT[name] = {
			'HV'		: 0,
			'threshold' : 0,
			'rate' 		: 0,
			'index'		: i,

			'oldHVcolor' : '#000000',
			'HVcolor'	 : '#000000',
			'oldThresholdColor' : '#000000',
			'thresholdColor' : '#000000',
			'oldRateColor' : '#000000',
			'rateColor' : '#000000'	
		}
		this.TTmap[i] = name;
	}

	//this.DESCANT['DSC034P00X'].rate = 10000;

}

PACESDS = function(){
	var i, name;

	this.PACES = {};
	this.TTmap = [];
	for(i=1; i<6; i++){
		name = 'PAC0'+i+'XN00A';
		this.PACES[name] = {
			'HV'		: 0,
			'threshold' : 0,
			'rate' 		: 0,
			'index'		: 2*i-1,

			'oldHVcolor' : '#000000',
			'HVcolor'	 : '#000000',
			'oldThresholdColor' : '#000000',
			'thresholdColor' : '#000000',
			'oldRateColor' : '#000000',
			'rateColor' : '#000000'	
		}
		this.TTmap[2*i-1] = name;

		name = 'PAC0'+i+'XN00B';
		this.PACES[name] = {
			'HV'		: 0,
			'threshold' : 0,
			'rate' 		: 0,
			'index'		: 2*i,

			'oldHVcolor' : '#000000',
			'HVcolor'	 : '#000000',
			'oldThresholdColor' : '#000000',
			'thresholdColor' : '#000000',
			'oldRateColor' : '#000000',
			'rateColor' : '#000000'	
		}
		this.TTmap[2*i] = name;
	}
}

DANTEDS = function(){
	var i, name;

	this.DANTE = {};
	this.TTmap = [];
	for(i=1; i<11; i++){
		//LaBr PMT channels
		name = (i<10) ? 'DAL0'+i+'XN00X' : 'DAL'+i+'XN00X';
		this.DANTE[name] = {
			'HV'		: 0,
			'threshold' : 0,
			'rate' 		: 0,
			'index'		: i,

			'oldHVcolor' : '#000000',
			'HVcolor'	 : '#000000',
			'oldThresholdColor' : '#000000',
			'thresholdColor' : '#000000',
			'oldRateColor' : '#000000',
			'rateColor' : '#000000',
		}

		//LaBr TAC channels
		name = (i<10) ? 'DAL0'+i+'XT00X' : 'DAL'+i+'XT00X';
		this.DANTE[name] = {
			'HV'		: 0,
			'threshold' : 0,
			'rate' 		: 0,
			'index'		: i+10,

			'oldHVcolor' : '#000000',
			'HVcolor'	 : '#000000',
			'oldThresholdColor' : '#000000',
			'thresholdColor' : '#000000',
			'oldRateColor' : '#000000',
			'rateColor' : '#000000',
		}

		//Suppressors:
		name = (i<10) ? 'DAS0'+i+'XN00X' : 'DAS'+i+'XN00X';
		this.DANTE[name] = {
			'HV'		: 0,
			'threshold' : 0,
			'rate' 		: 0,
			'index'		: i+20,

			'oldHVcolor' : '#000000',
			'HVcolor'	 : '#000000',
			'oldThresholdColor' : '#000000',
			'thresholdColor' : '#000000',
			'oldRateColor' : '#000000',
			'rateColor' : '#000000',
		}
	}

	for(name in this.DANTE){
		if(this.DANTE.hasOwnProperty(name)){
			this.TTmap[this.DANTE[name].index] = name;
		}
	}
}

DSSDDS = function(){

	var i, j, name, layer, charge, 
	index = 0,
	prefix = 'MAD',
	layers = ['D', 'E'],
	charges = ['N', 'P'];

	this.DSSD = {};
	this.TTmap = [];
	
	//quick hack only supports what's getting used in Madrid experiment May/June 2013 - last time this will ever be used?
	for(i=1; i<5; i++){
		for(layer=0; layer<2; layer++){
			for(charge=0; charge<2; charge++){
				for(j=0; j<16; j++){
					if( !(layer==1 && (i==1 || i==2 || i==3)) ){
						name = prefix + ((i<10) ? '0'+i : i) + layers[layer] + charges[charge] + ((j<10) ? '0'+j : j) + 'X';
						this.DSSD[name] = {
							'HV'		: 0,
							'threshold' : 0,
							'rate' 		: 0,
							'index'		: index,

							'oldHVcolor' : '#000000',
							'HVcolor'	 : '#000000',
							'oldThresholdColor' : '#000000',
							'thresholdColor' : '#000000',
							'oldRateColor' : '#000000',
							'rateColor' : '#000000'	
						}
						this.TTmap[index] = name;
						index++;
					}
				}
			}
		}
	}

	//pads:
	var padID = ['MAD01ENXXX', 'MAD02ENXXX', 'MAD03ENXXX'];
	for(i=0; i<3; i++){
						this.DSSD[padID[i]] = {
							'HV'		: 0,
							'threshold' : 0,
							'rate' 		: 0,
							'index'		: index,

							'oldHVcolor' : '#000000',
							'HVcolor'	 : '#000000',
							'oldThresholdColor' : '#000000',
							'thresholdColor' : '#000000',
							'oldRateColor' : '#000000',
							'rateColor' : '#000000'	
						}
						this.TTmap[index] = padID[i];
						index++;
	}
	
}

BAMBINODS = function(mode, layers, spiceMode){
	var i, j, k, index=0, name, prefix;
	if(spiceMode)
		prefix = ((mode=='S2') ? 'SPZ0' : 'SPE0');
	else
		prefix = ((mode=='S2') ? 'BAZ0' : 'BAE0');
	this.waypoints = ['D', 'E'];  //note tooltip indices only support two layers in S3 mode

	this.BAMBINO = {};
	this.TTmap = [];
	for(i=1; i<3; i++){  //1 for upstream, 2 for downstream
		for(j=0; j<layers; j++){ //telescope layers
			for(k=0; k<24+( (mode=='S2') ? 16 : 32 ); k++ ){  //segments, 16 azimuthal in S2 mode, 32 in S3
				name = prefix + i + this.waypoints[j] + ( (k<24) ? 'P'+( (k<10) ? '0'+k : k ) : 'N' + ( (k-24<10) ? '0'+(k-24) : k-24 ) ) + 'X';
				this.BAMBINO[name] = {
					'HV'		: 0,
					'threshold' : 0,
					'rate' 		: 0,
					'index'		: index,

					'oldHVcolor' : '#000000',
					'HVcolor'	 : '#000000',
					'oldThresholdColor' : '#000000',
					'thresholdColor' : '#000000',
					'oldRateColor' : '#000000',
					'rateColor' : '#000000'	
				}
				this.TTmap[index] = name;
				index++;
			}
		}
	}
}

SCEPTARDS = function(config){
	var i, name;

	this.SCEPTAR = {};
	this.TTmap = [];

	//upstream SCEPTAR
	if(config[0]){
		for(i=1; i<11; i++){
			name = (i<10) ? 'SEP0'+i+'XN00X' : 'SEP'+i+'XN00X';
			this.SCEPTAR[name] = {
				'HV'		: 0,
				'threshold' : 0,
				'rate' 		: 0,
				'index'		: i,

				'oldHVcolor' : '#000000',
				'HVcolor'	 : '#000000',
				'oldThresholdColor' : '#000000',
				'thresholdColor' : '#000000',
				'oldRateColor' : '#000000',
				'rateColor' : '#000000'	
			}
			this.TTmap[i] = name;
		}
	}

	//downstream SCEPTAR
	if(config[1]){
		for(i=11; i<21; i++){
			name = 'SEP'+i+'XN00X';
			this.SCEPTAR[name] = {
				'HV'		: 0,
				'threshold' : 0,
				'rate' 		: 0,
				'index'		: i,

				'oldHVcolor' : '#000000',
				'HVcolor'	 : '#000000',
				'oldThresholdColor' : '#000000',
				'thresholdColor' : '#000000',
				'oldRateColor' : '#000000',
				'rateColor' : '#000000'	
			}
			this.TTmap[i] = name;
		}
	}

	//ZDS:
	if(config[2]){
		this.SCEPTAR['ZDS01XN00X'] = {
			'HV'		: 0,
			'threshold' : 0,
			'rate' 		: 0,
			'index'		: 21,

			'oldHVcolor' : '#000000',
			'HVcolor'	 : '#000000',
			'oldThresholdColor' : '#000000',
			'thresholdColor' : '#000000',
			'oldRateColor' : '#000000',
			'rateColor' : '#000000'		
		}
		this.TTmap[21] = 'ZDS01XN00X';
	}
}

SPICEDS = function(){
	var i, name;

	this.SPICE = {};
	this.TTmap = [];
	for(i=1; i<121; i++){
		name = 'SPI00XN';
		if(i<10) name += '00'+i;
		else if(i<100) name += '0'+i;
		else name += i;
		this.SPICE[name] = {
			'HV'		: 0,
			'threshold' : 0,
			'rate' 		: 0,
			'index'		: i,

			'oldHVcolor' : '#000000',
			'HVcolor'	 : '#000000',
			'oldThresholdColor' : '#000000',
			'thresholdColor' : '#000000',
			'oldRateColor' : '#000000',
			'rateColor' : '#000000'	
		}
		this.TTmap[i] = name;
	}
}

TIPwallDS = function(){
	var i, j, k, name, key, subKey;

	this.TIPwall = {};
	for(i=1; i<25; i++){
		var name = (i<10) ? 'TPW00'+i+'P00X' : 'TPW0'+i+'P00X';
		this.TIPwall[name] = {
			'HV'		: 0,
			'threshold' : 0,
			'rate' 		: 0,

			'oldHVcolor' : '#000000',
			'HVcolor'	 : '#000000',
			'oldThresholdColor' : '#000000',
			'thresholdColor' : '#000000',
			'oldRateColor' : '#000000',
			'rateColor' : '#000000'	
		}
	}
	this.TIPwall['TPW011P00X']['index'] = 0;
	this.TIPwall['TPW012P00X']['index'] = 1;
	this.TIPwall['TPW013P00X']['index'] = 2;
	this.TIPwall['TPW014P00X']['index'] = 3;
	this.TIPwall['TPW015P00X']['index'] = 4;
	this.TIPwall['TPW010P00X']['index'] = 5;
	this.TIPwall['TPW002P00X']['index'] = 6;
	this.TIPwall['TPW003P00X']['index'] = 7;
	this.TIPwall['TPW004P00X']['index'] = 8;
	this.TIPwall['TPW016P00X']['index'] = 9;
	this.TIPwall['TPW009P00X']['index'] = 10;
	this.TIPwall['TPW001P00X']['index'] = 11;
	this.TIPwall['TPW005P00X']['index'] = 12;
	this.TIPwall['TPW017P00X']['index'] = 13;
	this.TIPwall['TPW024P00X']['index'] = 14;
	this.TIPwall['TPW008P00X']['index'] = 15;
	this.TIPwall['TPW007P00X']['index'] = 16;
	this.TIPwall['TPW006P00X']['index'] = 17;
	this.TIPwall['TPW018P00X']['index'] = 18;
	this.TIPwall['TPW023P00X']['index'] = 19;
	this.TIPwall['TPW022P00X']['index'] = 20;
	this.TIPwall['TPW021P00X']['index'] = 21;
	this.TIPwall['TPW020P00X']['index'] = 22;
	this.TIPwall['TPW019P00X']['index'] = 23;

	//invert the above index map for TT lookup
	this.TTmap = []
	for(key in this.TIPwall){
		this.TTmap[this.TIPwall[key].index] = key;
	}

}

TIPballDS = function(){
	var i, j, k, name, key, subKey;

	this.TIPball = {};
	for(i=1; i<129; i++){
		var name = (i<10) ? 'TPC00'+i+'P00X' : ( (i<100) ? 'TCW0'+i+'P00X' : 'TCW'+i+'P00X');
		this.TIPball[name] = {
			'HV'		: 0,
			'threshold' : 0,
			'rate' 		: 0,
			'index'		: i,

			'oldHVcolor' : '#000000',
			'HVcolor'	 : '#000000',
			'oldThresholdColor' : '#000000',
			'thresholdColor' : '#000000',
			'oldRateColor' : '#000000',
			'rateColor' : '#000000'	
		}
	}

	//invert the above index map for TT lookup
	this.TTmap = []
	for(key in this.TIPball){
		this.TTmap[this.TIPball[key].index] = key;
	}

}

DAQDS = function(){

	//data arrays:
	this.master = [];
	this.collectorGroups = [];
	this.collectorLinks = [];
	this.collectors = [];
	this.digitizerGroupSummaryLinks = [];
	this.digitizerSummaries = [];
	this.digitizerGroupLinks = [];
	this.digitizerLinks = [];
	this.digitizers = [];

    //master
    this.masterColor = '#000000';
    this.oldMasterColor = '#000000';
    //master group links
    this.masterGroupColor = [];
    this.oldMasterGroupColor = [];
    //links from collectors to master
    this.masterLinkColor = [];
    this.oldMasterLinkColor = [];
    //collectors; different colors for top level view and detail view:
    this.collectorColor = [];
    this.oldCollectorColor = [];
    this.detailCollectorColor = [];
    this.oldDetailCollectorColor = [];
    //links from digitizer summary node to collector in top level view, and from all digitizers to collector in detail view
    this.collectorLinkColor = [];
    this.oldCollectorLinkColor = [];
    this.detailCollectorLinkColor = [];
    this.oldDetailCollectorLinkColor = [];
    //digitizer summary node
    this.digiSummaryColor = [];
    this.oldDigiSummaryColor = [];
    //links from digitizer group to digitizer summary node
    this.digiGroupSummaryColor = [];
    this.oldDigiGroupSummaryColor = [];
    //links from digitizers to digitizer group
    this.digitizerLinkColor = [];
    this.oldDigitizerLinkColor = [];
    //digitizers
    this.digitizerColor = [];
    this.oldDigitizerColor = [];

    for(i=0; i<Math.ceil(window.DAQpointer.nCollectors/4); i++){
        this.masterGroupColor[i] = '#000000';
        this.oldMasterGroupColor[i] = '#000000';        
    }
    for(i=0; i<4*Math.ceil(window.DAQpointer.nCollectors/4); i++){
        this.masterLinkColor[i] = '#000000';
        this.oldMasterLinkColor[i] = '#000000';
        this.collectorColor[i] = '#000000';
        this.oldCollectorColor[i] = '#000000';
        this.detailCollectorColor[i] = '#000000';
        this.oldDetailCollectorColor[i] = '#000000';
        this.collectorLinkColor[i] = '#000000';
        this.oldCollectorLinkColor[i] = '#000000';
        this.detailCollectorLinkColor[i] = '#000000';
        this.oldDetailCollectorLinkColor[i] = '#000000';
        this.digiSummaryColor[i] = '#000000';
        this.oldDigiSummaryColor[i] = '#000000';        
    }
    for(i=0; i<4*4*Math.ceil(window.DAQpointer.nCollectors/4); i++){
        this.digiGroupSummaryColor[i] = '#000000';
        this.oldDigiGroupSummaryColor[i] = '#000000';        
    }
    for(i=0; i<4*4*4*Math.ceil(window.DAQpointer.nCollectors/4); i++){
        this.digitizerLinkColor[i] = '#000000';
        this.oldDigitizerLinkColor[i] = '#000000';
        this.digitizerColor[i] = '#000000';
        this.oldDigitizerColor[i] = '#000000';        
    }

	/*
	key map, format: key[griffin.js index number] = array containing parsed FSPC keys from masterCodex for this node, down to digitizer level

	FSPC key array packed like [master key, collector key, digitizer key];
	note that the master node only has a master key, collector nodes only have master + collector keys etc, so length of array
	corresponds to type of node.  Example: FSPC = 0x0700604 -> ['0x0XXXXXX', '0x07XXXXX', '0x07006XX']

	griffin.js index counts from 0: first master -> collectors -> digitizer summary nodes -> digitizers, next master... etc 
	*/

	this.key = [];
	var Fkey, Skey, Pkey, Ckey;
	var i = 0;
	var j = 0;
	var k = 0;
	for(Fkey in window.codex.DAQmap){
		this.key[i] = [Fkey];
		i++;
		for(Skey in window.codex.DAQmap[Fkey]){
			if(window.codex.dataKeys.indexOf(Skey) == -1){
				this.key[i] = [Fkey, Skey];
				i++;
				j++;
			}
		}

		for(k=0; k<j; k++){
			this.key[i+k] = this.key[1+k];
		}
		i += j //leave an index for a summary node to go with each collector node
		j = 0;


		//now count through digitizers, starting with the first collector:
		for(Skey in window.codex.DAQmap[Fkey]){
			if(window.codex.dataKeys.indexOf(Skey) == -1){
				for(Pkey in window.codex.DAQmap[Fkey][Skey]){
					if(window.codex.dataKeys.indexOf(Pkey) == -1){
						this.key[i] = [Fkey, Skey, Pkey];
						i++;
					}
				}
			}
		}
	}

}



















HPGe.prototype = Object.create(Subsystem.prototype);

function HPGe(){
    //detector name, self-pointing pointer, pull in the Subsystem template, 
    //establish a databus and create a global-scope pointer to this object:
    this.name = 'HPGe';
    var that = this;
    Subsystem.call(this);
    window.HPGepointer = that;

    //member variables////////////////////////////////////////////////////////
    this.cloverShowing = 1;                         //index of clover currently showing in detail view
    this.detailShowing = 0;                         //is the detail canvas showing?
    this.scalePrefix = 'Clover ';                   //prefix for scale title

    this.mode = window.parameters.HPGemode;         //mode to run in, either 'TIGRESS' or 'GRIFFIN'
    this.dataBus = new cloverDS(16, this.mode);                    //called after mode is fetched in order to know what kind of HPGe to deploy
    this.nHPGesegments = 0;
    if(this.mode == 'TIGRESS')
        this.nHPGesegments = 40;
    else if(this.mode == 'GRIFFIN')
        this.nHPGesegments = 8;

    this.BGOenable = window.parameters.BGOenable;   //are the suppresors present?

    DetailView.call(this);                          //inject the infrastructure for a detail-level view
    HPGeAssets.call(this);                          //inject the HPGe drawing assets

    //onclick switch between top and detail view:
    this.detailCanvas.onclick = function(event){
                                    var y = event.pageY - that.canvas.offsetTop - that.monitor.offsetTop;    
                                    if(y < that.canvasHeight - that.scaleHeight){
                                        that.detailShowing = 0;
                                        swapFade(null, that, 1000);
                                    } else{
                                        parameterDialogue(that.name, [['HPGe', window.parameters[that.name].minima['HPGe'][window.state.subdetectorView], window.parameters[that.name].maxima['HPGe'][window.state.subdetectorView], window.parameters.subdetectorUnit[window.state.subdetectorView], '/DashboardConfig/HPGe/'+scaleType()+'[0]', '/DashboardConfig/HPGe/'+scaleType()+'[1]'], ['BGO', window.parameters[that.name].minima['BGO'][window.state.subdetectorView], window.parameters[that.name].maxima['BGO'][window.state.subdetectorView],  window.parameters.subdetectorUnit[window.state.subdetectorView], '/DashboardConfig/HPGe/BGO'+scaleType()+'[0]', '/DashboardConfig/HPGe/BGO'+scaleType()+'[1]'] ], window.parameters.subdetectorColors[window.state.subdetectorView]);
                                    }
                                };
    this.canvas.onclick =   function(event){
                                //use TT layer to decide which clover user clicked on
                                var cloverClicked = -1;
                                var x,y;
                                x = event.pageX - that.canvas.offsetLeft - that.monitor.offsetLeft;
                                y = event.pageY - that.canvas.offsetTop - that.monitor.offsetTop;
                                cloverClicked = that.findCell(x,y);
                                //draw and swap out if user clicked on a valid clover
                                if(cloverClicked != -1){
                                    cloverClicked = Math.floor( (cloverClicked - 108) / 8)+1;
                                    that.TTdetailLayerDone = 0;  //need to redraw detail TT layer for different detail views
                                    if(window.parameters.cloversAbsent.indexOf(cloverClicked)==-1){
                                        that.cloverShowing = cloverClicked
                                        that.drawDetail(that.detailContext, that.nFrames);
                                        that.drawDetail(that.TTdetailContext, that.nFrames);
                                        that.detailShowing = 1;
                                        swapFade(null, that, 1000)
                                    }
                                } else if(y > that.canvasHeight - that.scaleHeight){
                                    parameterDialogue(that.name, [['HPGe', window.parameters[that.name].minima['HPGe'][window.state.subdetectorView], window.parameters[that.name].maxima['HPGe'][window.state.subdetectorView], window.parameters.subdetectorUnit[window.state.subdetectorView], '/DashboardConfig/HPGe/'+scaleType()+'[0]', '/DashboardConfig/HPGe/'+scaleType()+'[1]'], ['BGO', window.parameters[that.name].minima['BGO'][window.state.subdetectorView], window.parameters[that.name].maxima['BGO'][window.state.subdetectorView],  window.parameters.subdetectorUnit[window.state.subdetectorView], '/DashboardConfig/HPGe/BGO'+scaleType()+'[0]', '/DashboardConfig/HPGe/BGO'+scaleType()+'[1]'] ], window.parameters.subdetectorColors[window.state.subdetectorView]);
                                }
                            };


    //drawing parameters/////////////////////////////////////////////////////////////////////////////////////////////
    this.centerX = this.canvasWidth/2;
    this.centerY = this.canvasHeight*0.4;
    this.lineWeight = 1;
    this.context.lineWidth = this.lineWeight;
    this.context.strokeStyle = '#999999';

    this.BGOouter = 0.09*this.canvasWidth;
    this.BGOinner = 0.67*this.BGOouter;
    this.HPGeside = 0.4*this.BGOouter;

    this.firstRow = this.centerY - this.BGOouter/2 - .112*this.canvasWidth;
    this.secondRow = this.centerY - this.BGOouter/2;
    this.thirdRow = this.centerY - this.BGOouter/2 + .112*this.canvasWidth;

    this.firstCol = this.canvasWidth*0.022;
    this.secondCol = this.canvasWidth*0.134;
    this.thirdCol = this.canvasWidth*0.246;
    this.fourthCol = this.canvasWidth*0.358;
    this.fifthCol = this.canvasWidth*0.540;
    this.sixthCol = this.canvasWidth*0.652;
    this.seventhCol = this.canvasWidth*0.764;
    this.eighthCol = this.canvasWidth*0.876;

    this.summaryCoord = [];
    this.summaryCoord[5] = [this.thirdCol, this.secondRow, 'north'];
    this.summaryCoord[6] = [this.fourthCol, this.secondRow, 'north'];
    this.summaryCoord[7] = [this.fifthCol, this.secondRow, 'south'];
    this.summaryCoord[8] = [this.sixthCol, this.secondRow, 'south'];
    this.summaryCoord[9] = [this.seventhCol, this.secondRow, 'south']; 
    this.summaryCoord[10] = [this.eighthCol, this.secondRow, 'south'];
    this.summaryCoord[11] = [this.firstCol, this.secondRow, 'north'];
    this.summaryCoord[12] = [this.secondCol, this.secondRow, 'north'];
    if(this.mode == 'TIGRESS'){
        this.summaryCoord[1] = [this.thirdCol, this.firstRow, 'north'];
        this.summaryCoord[2] = [this.fifthCol, this.firstRow, 'south'];
        this.summaryCoord[3] = [this.seventhCol, this.firstRow, 'south'];
        this.summaryCoord[4] = [this.firstCol, this.firstRow, 'north'];
        this.summaryCoord[13] = [this.thirdCol, this.thirdRow, 'north'];
        this.summaryCoord[14] = [this.fifthCol, this.thirdRow, 'south'];
        this.summaryCoord[15] = [this.seventhCol, this.thirdRow, 'south'];
        this.summaryCoord[16] = [this.firstCol, this.thirdRow, 'north'];
    } else if(this.mode == 'GRIFFIN'){
        this.summaryCoord[1] = [this.fourthCol, this.firstRow, 'north'];
        this.summaryCoord[2] = [this.sixthCol, this.firstRow, 'south'];
        this.summaryCoord[3] = [this.eighthCol, this.firstRow, 'south'];
        this.summaryCoord[4] = [this.secondCol, this.firstRow, 'north'];
        this.summaryCoord[13] = [this.fourthCol, this.thirdRow, 'north'];
        this.summaryCoord[14] = [this.sixthCol, this.thirdRow, 'south'];
        this.summaryCoord[15] = [this.eighthCol, this.thirdRow, 'south'];
        this.summaryCoord[16] = [this.secondCol, this.thirdRow, 'north'];
    }

    //detail view
    this.crystalSide = this.canvasWidth*0.1*0.8;
    this.suppressorWidth = this.canvasWidth*0.03*0.8;
    this.suppressorSpacing = this.canvasWidth*0.04*0.8;
    this.backBGOinnerWidth = 2*this.crystalSide + 2*this.suppressorSpacing;
    this.backBGOouterWidth = this.backBGOinnerWidth + 2*this.suppressorWidth;
    this.sideBGOinnerWidth = this.backBGOouterWidth + 2*this.suppressorSpacing;
    this.sideBGOouterWidth = this.sideBGOinnerWidth + 2*this.suppressorWidth;
    this.frontBGOinnerWidth = this.sideBGOouterWidth + 2*this.suppressorSpacing;
    this.frontBGOouterWidth = this.frontBGOinnerWidth + 2*this.suppressorWidth;
    this.sideSpacer = 20;

    //Member functions/////////////////////////////////////////////////////////////////////////////////

    //function to wrap drawing for animate
    this.draw = function(frame){
        var i, summaryKey,
            pfx = (this.mode == 'TIGRESS') ? 'TI' : 'GR';

        //beam arrow
        this.context.clearRect(this.centerX-0.04*this.canvasWidth, 0, 0.07*this.canvasWidth, 0.7*this.canvasHeight);
        this.context.fillStyle = '#999999';
        this.context.font="24px 'Orbitron'";
        this.context.moveTo(this.centerX, 0.7*this.canvasHeight);
        this.context.lineTo(this.centerX, 0.1*this.canvasHeight);
        this.context.lineTo(this.centerX + 10, 0.1*this.canvasHeight + 10);
        this.context.stroke();
        this.context.save();
        this.context.translate(this.centerX-5, 0.1*this.canvasHeight);
        this.context.rotate(-Math.PI/2);
        this.context.fillText('Beam', -this.context.measureText('Beam').width-10, 0);
        this.context.restore();

        for(i=1; i<17; i++){
            summaryKey = pfx+'G' + ( (i<10) ? '0'+i : i );
            this.drawHPGesummary(this.context, this.summaryCoord[i][0], this.summaryCoord[i][1], summaryKey, frame);
            if(!this.TTlayerDone)
                this.drawHPGesummary(this.TTcontext, this.summaryCoord[i][0], this.summaryCoord[i][1], summaryKey, frame);

            summaryKey = pfx+'S' + ( (i<10) ? '0'+i : i );
            this.drawHPGesummary(this.context, this.summaryCoord[i][0], this.summaryCoord[i][1], summaryKey, frame);
            if(!this.TTlayerDone)
                this.drawHPGesummary(this.TTcontext, this.summaryCoord[i][0], this.summaryCoord[i][1], summaryKey, frame);            
        }

        //titles
        this.context.clearRect(0,0.75*this.canvasHeight,this.canvasWidth,0.25*this.canvasHeight - this.scaleHeight);
        this.context.fillStyle = '#999999';
        this.context.font="24px 'Orbitron'";
        if(this.mode == 'TIGRESS'){
            this.context.fillText('North Hemisphere', 0.201*this.canvasWidth + this.BGOouter/2 - this.context.measureText('North Hemisphere').width/2, 0.78*this.canvasHeight);
            this.context.fillText('South Hemisphere', 0.701*this.canvasWidth + this.BGOouter/2 - this.context.measureText('North Hemisphere').width/2, 0.78*this.canvasHeight);
        } else if(this.mode == 'GRIFFIN'){
            this.context.fillText('West Hemisphere', 0.201*this.canvasWidth + this.BGOouter/2 - this.context.measureText('West Hemisphere').width/2, 0.78*this.canvasHeight);
            this.context.fillText('East Hemisphere', 0.701*this.canvasWidth + this.BGOouter/2 - this.context.measureText('East Hemisphere').width/2, 0.78*this.canvasHeight);
        }

        if(frame==this.nFrames || frame==0) this.drawScale(this.context);

        this.TTlayerDone = 1;
    };

    this.defineText = function(cell){
        var toolTipContent = '';
        var nextLine;

        toolTipContent += this.defineHPGeText(cell) + '<br>';

        if(this.detailShowing){
            document.getElementById(this.detailTooltip.ttDivID).innerHTML = toolTipContent;
        } else{
            if( !( ((cell-100)%8 < 4) && this.mode=='TIGRESS') ){  //HPGe summaries on TIGRESS have so much stuff in them, they need to build their own table :(
                document.getElementById(this.tooltip.ttDivID).innerHTML = toolTipContent;
            }
        }

        return 0;

    };

    this.update = function(){
        //get new data
        this.fetchNewData();

        //update the databus
        this.updateHPGe();

        //update tooltips
        this.tooltip.update();
        this.detailTooltip.update();
        //this.displaySwitch();

        //animate if on top:
        this.animate();
    };

    this.fetchNewData = function(){
        this.fetchHPGeData();
    };

    //do an initial populate
    this.update();
}PACES.prototype = Object.create(Subsystem.prototype);

function PACES(){
    //detector name, self-pointing pointer, pull in the Subsystem template, 
    //establish a databus and create a global-scope pointer to this object:
    this.name = 'PACES';
    var that = this;
    Subsystem.call(this);
    this.dataBus = new PACESDS();
    //make a pointer at window level back to this object, so we can pass by reference to the nav button onclick
    window.PACESpointer = that;

    //member variables///////////////////////////////////

    //drawing parameters
    this.centerX = this.canvasWidth/2;
    this.centerY = this.canvasHeight*0.45;
    this.arrayRadius = this.canvasHeight*0.3;
    this.SiLiRadius = this.canvasHeight*0.1;

    //member functions///////////////////////////////////////////////////////////////////

    this.draw = function(frame){

    	var i, name;
    	this.context.strokeStyle = '#999999'

        //Thresholds & Rate view///////////////////////////////////////
        //once for the display canvas....
        if(window.state.subdetectorView == 1 || window.state.subdetectorView == 2){
        	for(i=0; i<5; i++){

                name = 'PAC0'+(i+1)+'XN00A';

        		this.context.save();
        		this.context.translate(this.centerX, this.centerY);
        		this.context.rotate(i*Math.PI*72/180);

                if(window.state.subdetectorView == 1) this.context.fillStyle = interpolateColor(parseHexColor(this.dataBus.PACES[name].oldThresholdColor), parseHexColor(this.dataBus.PACES[name].thresholdColor), frame/this.nFrames);
                else if(window.state.subdetectorView == 2) this.context.fillStyle = interpolateColor(parseHexColor(this.dataBus.PACES[name].oldRateColor), parseHexColor(this.dataBus.PACES[name].rateColor), frame/this.nFrames);
        		this.context.beginPath();
        		this.context.arc(0, -this.arrayRadius, this.SiLiRadius, 0, Math.PI);
        		this.context.closePath();
                this.context.fill();
        		this.context.stroke();

                name = 'PAC0'+(i+1)+'XN00B';

                if(window.state.subdetectorView == 1) this.context.fillStyle = interpolateColor(parseHexColor(this.dataBus.PACES[name].oldThresholdColor), parseHexColor(this.dataBus.PACES[name].thresholdColor), frame/this.nFrames);
                else if(window.state.subdetectorView == 2) this.context.fillStyle = interpolateColor(parseHexColor(this.dataBus.PACES[name].oldRateColor), parseHexColor(this.dataBus.PACES[name].rateColor), frame/this.nFrames);
                this.context.beginPath();
                this.context.arc(0, -this.arrayRadius, this.SiLiRadius, Math.PI, 0);
                this.context.closePath();
                this.context.fill();
                this.context.stroke();

        		this.context.restore();
        	}
        }
        //...and again for the tooltip encoding
        if(!this.TTlayerDone){
            for(i=0; i<5; i++){
                this.TTcontext.save();
                this.TTcontext.translate(this.centerX, this.centerY);
                this.TTcontext.rotate(i*Math.PI*72/180);

                this.TTcontext.fillStyle = 'rgba('+(2*i+1)+','+(2*i+1)+','+(2*i+1)+',1)';
                this.TTcontext.beginPath();
                this.TTcontext.arc(0, -this.arrayRadius, this.SiLiRadius, 0, Math.PI);
                this.TTcontext.closePath();
                this.TTcontext.fill();

                this.TTcontext.fillStyle = 'rgba('+(2*i+2)+','+(2*i+2)+','+(2*i+2)+',1)';
                this.TTcontext.beginPath();
                this.TTcontext.arc(0, -this.arrayRadius, this.SiLiRadius, Math.PI, 0);
                this.TTcontext.closePath();
                this.TTcontext.fill();

                this.TTcontext.restore();

            }
            this.TTlayerDone = 1;
        }

        //HV view///////////////////////////////////////////
        if(window.state.subdetectorView == 0){
            for(i=0; i<5; i++){

                name = 'PAC0'+(i+1)+'XN00A';  //real voltage is plugged into seg. A; seg B voltage contains garbage data, don't use.

                this.context.fillStyle = interpolateColor(parseHexColor(this.dataBus.PACES[name].oldHVcolor), parseHexColor(this.dataBus.PACES[name].HVcolor), frame/this.nFrames);
                this.context.save();
                this.context.translate(this.centerX, this.centerY);
                this.context.rotate(i*Math.PI*72/180);
                this.context.beginPath();
                this.context.arc(0, -this.arrayRadius, this.SiLiRadius, 0, 2*Math.PI);
                this.context.closePath();
                this.context.fill();
                this.context.stroke();
                this.context.restore();
            }
        }

        if(frame==this.nFrames || frame==0) {
            //scale
            this.drawScale(this.context);
        }
    };

    //do an initial populate:
    this.update();
}SCEPTAR.prototype = Object.create(Subsystem.prototype);

function SCEPTAR(){
    //detector name, self-pointing pointer, pull in the Subsystem template, 
    //establish a databus and create a global-scope pointer to this object:
    this.name = 'SCEPTAR';
    var that = this;
    Subsystem.call(this);
    this.dataBus = new SCEPTARDS(window.parameters.SCEPTARconfig);
    //make a pointer at window level back to this object, so we can pass by reference to the nav button onclick
    window.SCEPTARpointer = that;

    //member variables///////////////////////////////////
    this.config = window.parameters.SCEPTARconfig;  //subsystems on: [upstream sceptar, downstream sceptar, downstream ZDS]


    //set up scale adjust dialog:
    this.canvas.onclick = function(event){
        var y = event.pageY - that.canvas.offsetTop - that.monitor.offsetTop;
        if(y > that.canvasHeight - that.scaleHeight){
            if(that.config[2]) parameterDialogue(that.name, [['SCEPTAR', window.parameters[that.name].minima['SCEPTAR'][window.state.subdetectorView], window.parameters[that.name].maxima['SCEPTAR'][window.state.subdetectorView], window.parameters.subdetectorUnit[window.state.subdetectorView], '/DashboardConfig/SCEPTAR/'+scaleType()+'[0]', '/DashboardConfig/SCEPTAR/'+scaleType()+'[1]'],   ['ZDS', window.parameters[that.name].minima['ZDS'][window.state.subdetectorView], window.parameters[that.name].maxima['ZDS'][window.state.subdetectorView], window.parameters.subdetectorUnit[window.state.subdetectorView], '/DashboardConfig/ZDS/'+scaleType()+'[0]', '/DashboardConfig/ZDS/'+scaleType()+'[1]'] ], window.parameters.subdetectorColors[window.state.subdetectorView]);
            else parameterDialogue(that.name, [['SCEPTAR', window.parameters[that.name].minima['SCEPTAR'][window.state.subdetectorView], window.parameters[that.name].maxima['SCEPTAR'][window.state.subdetectorView], window.parameters.subdetectorUnit[window.state.subdetectorView], '/DashboardConfig/SCEPTAR/'+scaleType()+'[0]', '/DashboardConfig/SCEPTAR/'+scaleType()+'[1]']], window.parameters.subdetectorColors[window.state.subdetectorView]);

        }
    }

    //drawing parameters///////////////////////////////////////
    this.ZDSradius = this.canvasHeight*0.5 / 4; 
    this.ZDScenterX = this.canvasWidth*0.5 + Math.max(this.config[0], this.config[1])*this.canvasWidth*0.25;
    this.ZDScenterY = 0.4*this.canvasHeight;
    this.SCEPTARx0 = this.canvasWidth*0.1;
    this.SCEPTARy0 = this.canvasHeight*0.1;

    this.SCEPTARspoke = this.canvasHeight/5;
    this.USSCx0 = 0.25*this.canvasWidth;
    this.USSCy0 = 0.4*this.canvasHeight;
    this.DSSCx0 = 0.75*this.canvasWidth;
    this.DSSCy0 = 0.4*this.canvasHeight;

    //member functions///////////////////////////////////////////////////////////////////


    this.draw = function(frame){
    	var i, row, col;

        //once for display view...
    	this.context.strokeStyle = '#999999';
        //upstream SCEPTAR
        if(this.config[0] == 1){
            this.drawSceptar('upstream', frame, this.context);
        }
        //downstream SCEPTAR
        if(this.config[1] == 1){
            this.drawSceptar('downstream', frame, this.context);
        }
    	//ZDS
        if(this.config[2] == 1){
            this.context.fillStyle = colors('ZDS01XN00X', this.dataBus.SCEPTAR, frame, this.nFrames)
        	this.context.beginPath();
    	    this.context.arc(this.ZDScenterX, this.ZDScenterY, this.ZDSradius, 0, 2*Math.PI);
        	this.context.closePath();
        	this.context.fill();
    	    this.context.stroke();
        }

        //...and again for tt encoding:
        if(!this.TTlayerDone){
            //upstream SCEPTAR
            if(this.config[0] == 1){
                this.drawSceptar('upstream', frame, this.TTcontext);
            }
            //downstream SCEPTAR
            if(this.config[1] == 1){
                this.drawSceptar('downstream', frame, this.TTcontext);
            }
            //ZDS
            if(this.config[2] == 1){
                //antialiasing hackaround:
                this.TTcontext.beginPath();
                this.TTcontext.arc(this.ZDScenterX, this.ZDScenterY, 1.05*this.ZDSradius, 0, 2*Math.PI);
                this.TTcontext.closePath();
                this.TTcontext.fillStyle = '#123456';
                this.TTcontext.fill();
                //end hack around
                this.TTcontext.beginPath();
                this.TTcontext.arc(this.ZDScenterX, this.ZDScenterY, this.ZDSradius, 0, 2*Math.PI);
                this.TTcontext.closePath();
                this.TTcontext.fillStyle = 'rgba('+21+','+21+','+21+',1)';
                this.TTcontext.fill();
            }
            this.TTlayerDone = 1;
        }
   

    	//titles
        this.context.clearRect(0,this.SCEPTARy0 + 2.5*this.SCEPTARspoke + 10,this.canvasWidth,this.canvasHeight - (this.scaleHeight+this.SCEPTARy0 + 2.5*this.SCEPTARspoke + 10));
        this.context.fillStyle = '#999999';
        this.context.font="24px 'Orbitron'";
        if(this.config[0] == 1){
            this.context.fillText('Upstream SCEPTAR', this.USSCx0 - this.context.measureText('Upstream SCEPTAR').width/2, this.USSCy0 + 1.4*this.SCEPTARspoke);
        }
        if(this.config[1] == 1){
            this.context.fillText('Downstream SCEPTAR', this.DSSCx0 - this.context.measureText('Downstream SCEPTAR').width/2, this.DSSCy0 + 1.4*this.SCEPTARspoke);
        }
        if(this.config[2] == 1){
            this.context.fillText('ZDS', this.ZDScenterX - this.context.measureText('ZDS').width/2, this.ZDScenterY + 1.4*this.SCEPTARspoke);    
        }

        //scale
        if(frame==this.nFrames || frame==0) this.drawScale(this.context);
	
    };

    this.drawSceptar = function(side, frame, context){
        var x0, y0, i, indexStart, name;
        if(side == 'upstream'){
            x0 = this.USSCx0;
            y0 = this.USSCy0;
            indexStart = 0;
        } else if(side == 'downstream'){
            x0 = this.DSSCx0;
            y0 = this.DSSCy0;
            indexStart = 10;
        }

        for(i=0; i<10; i++){
            name = (indexStart+i+1<10) ? 'SEP0'+(indexStart+i+1)+'XN00X' : 'SEP'+(indexStart+i+1)+'XN00X'

            if(context == this.context){
                context.fillStyle = colors(name, this.dataBus.SCEPTAR, frame, this.nFrames)
            }
            else if(context == this.TTcontext) context.fillStyle = '#123456'; //anti-antialiasing
            context.save();
            context.translate(x0, y0);
            context.rotate((i%5)*Math.PI/180*72);
            context.beginPath();
            context.moveTo(0,0);
            context.lineTo(0, -this.SCEPTARspoke/2*( 2 - Math.floor(i/5) ) );
            context.rotate(Math.PI/180*72);
            context.lineTo(0, -this.SCEPTARspoke/2*( 2 - Math.floor(i/5) ) );
            context.closePath();
            context.fill();
            if(context == this.context) context.stroke();
            context.restore();

            if(context == this.TTcontext){
                context.fillStyle = 'rgba('+(indexStart+1+i)+','+(indexStart+1+i)+','+(indexStart+1+i)+',1)';
                context.save();
                context.translate(x0, y0);
                context.rotate((i%5)*Math.PI/180*72);
                context.beginPath();
                context.moveTo(0,0);
                context.lineTo(0, -this.SCEPTARspoke/2*( 2 - Math.floor(i/5) ) );
                context.rotate(Math.PI/180*72);
                context.lineTo(0, -this.SCEPTARspoke/2*( 2 - Math.floor(i/5) ) );
                context.closePath();
                context.fill();
                context.restore();
            }
        }   
    }

    //do an initial populate:
    this.update();
}SHARC.prototype = Object.create(Subsystem.prototype);
function SHARC(){
    //basic plumbing:
    this.name = 'SHARC';                //name prefix
    var that = this;                    //pointer to self
    Subsystem.call(this);               //inject Subsystem attributes
    window.SHARCpointer = that;         //send a pointer to SHARC up to global scope
    this.dataBus = new SHARCDS();       //build the data structure to manage SHARC's info
    DetailView.call(this);              //inject the infrastructure for a detail level view

    //member variables////////////////////
    this.padsEnabled = window.parameters.SHARCpads;     //are the pads present?
    this.detailShowing = 0;                             //is the detail view on display?

    //drawing parameters:
    //summary view is laid out on a 15x12 grid:
    this.cellWidth = this.canvasWidth/15;
    this.cellHeight = (this.canvasHeight - this.scaleHeight)/12
    this.quadInnerRad = 0.05*this.cellWidth;
    this.quadOuterRad = 0.98*this.cellWidth;
    this.quadSquish = 0.98*this.cellHeight/this.quadOuterRad/2;
    this.context.strokeStyle = '#999999';

    //detail view
    this.innerQuadRadDetail = this.canvasHeight*0.1;
    this.outerQuadRadDetail = this.canvasHeight*0.6;
    this.quadArcDetail = 0.45*Math.PI/2;
    this.detailTitles = ['Upstream Quadrant 1', 'Upstream Quadrant 2', 'Upstream Quadrant 3', 'Upstream Quadrant 4', 'Upstream Box 1', 'Upstream Box 2', 'Upstream Box 3', 'Upstream Box 4', 'Downstream Box 1', 'Downstream Box 2', 'Downstream Box 3', 'Downstream Box 4', 'Downstream Quadrant 1', 'Downstream Quadrant 2', 'Downstream Quadrant 3', 'Downstream Quadrant 4']
    this.quadDetailFrontCenter = (0.3 - 0.1*this.padsEnabled)*this.canvasWidth;
    this.quadDetailBackCenter = (0.7 - 0.1*this.padsEnabled)*this.canvasWidth;
    this.boxDetailFrontLeftEdge = 0.1*this.canvasWidth*(1-this.padsEnabled);
    this.boxDetailBackLeftEdge = (0.52-0.1*this.padsEnabled)*this.canvasWidth;
    this.scaleDown = 0.9;

    //member functions////////////////////

    this.draw = function(frame){
        var dummyColors4 = ['#000000', '#444444', '#AAAAAA', '#FFFFFF'], i, dummyColors16 = [], x, TTcolors = [];
        for(i=0; i<16; i++){
            x = i.toString(16);
            dummyColors16[i] = '#'+x+x+x+x+x+x;
        }

        //UPSTREAM//////////////////////////////////////
        if(this.padsEnabled){
            //upstream quad pad back
            //quadBack(this.context, 1*this.cellWidth, 11.5*this.cellHeight, this.quadInnerRad, this.quadOuterRad, this.quadSquish, colors(['SHQ13FN00X', 'SHQ14FN00X', 'SHQ15FN00X', 'SHQ16FN00X'], this.dataBus.SHARC, frame, this.nFrames), 0);
            //upstream quad pad front
            quadBack(this.context, 1.5*this.cellWidth, 10.5*this.cellHeight, this.quadInnerRad, this.quadOuterRad, this.quadSquish, colors(['SHQ13EP00X', 'SHQ14EP00X', 'SHQ15EP00X', 'SHQ16EP00X'], this.dataBus.SHARC, frame, this.nFrames), 0);       

            //tooltip:
            if(!this.TTlayerDone){
                TTcolors = ['rgba(113,113,113,1)', 'rgba(114,114,114,1)', 'rgba(115,115,115,1)', 'rgba(116,116,116,1)'];
                //upstream quad pad back
                //quadBack(this.TTcontext, 1*this.cellWidth, 11.5*this.cellHeight, this.quadInnerRad, this.quadOuterRad, this.quadSquish, TTcolors, 1);
                //upstream quad pad front
                quadBack(this.TTcontext, 1.5*this.cellWidth, 10.5*this.cellHeight, this.quadInnerRad, this.quadOuterRad, this.quadSquish, TTcolors, 1); 
            }
        }

        //upstream quad back
        quadBack(this.context, 2*this.cellWidth, 9.5*this.cellHeight, this.quadInnerRad, this.quadOuterRad, this.quadSquish, this.meanColor('SHQ13DN', frame, 0).concat(this.meanColor('SHQ14DN', frame, 0), this.meanColor('SHQ15DN', frame, 0), this.meanColor('SHQ16DN', frame, 0)), 0);
        //upstream quad front
        quadFront(this.context, 2.5*this.cellWidth, 8.5*this.cellHeight, this.quadInnerRad, this.quadOuterRad, this.quadSquish, this.meanColor('SHQ13DP', frame, 0).concat(this.meanColor('SHQ14DP', frame, 0), this.meanColor('SHQ15DP', frame, 0), this.meanColor('SHQ16DP', frame, 0)), 0);
        //upstream quad tooltip:
        if(!this.TTlayerDone){
            //upstream quad back
            TTcolors = ['rgba(26,26,26,1)', 'rgba(28,28,28,1)', 'rgba(30,30,30,1)', 'rgba(32,32,32,1)'];
            quadBack(this.TTcontext, 2*this.cellWidth, 9.5*this.cellHeight, this.quadInnerRad, this.quadOuterRad, this.quadSquish, TTcolors, 1);
            //upstream quad front
            TTcolors = ['rgba(25,25,25,1)', 'rgba(27,27,27,1)', 'rgba(29,29,29,1)', 'rgba(31,31,31,1)'];
            quadBack(this.TTcontext, 2.5*this.cellWidth, 8.5*this.cellHeight, this.quadInnerRad, this.quadOuterRad, this.quadSquish, TTcolors, 1);
        }

        //3 o'clock upstream DSSD:
        //pads
        if(this.padsEnabled){
            //horizStack(this.context, 7.5*this.cellWidth, 3.5*this.cellHeight, this.scaleDown*this.cellWidth, this.scaleDown*this.cellHeight, colors(['SHB11FP00X'], this.dataBus.SHARC, frame, this.nFrames), 'h', 0);
            //horizStack(this.context, 7.5*this.cellWidth, 4.5*this.cellHeight, this.scaleDown*this.cellWidth, this.scaleDown*this.cellHeight, colors(['SHB11FN00X'], this.dataBus.SHARC, frame, this.nFrames), 'h', 0);
            vertStack(this.context, 7.5*this.cellWidth, 4*this.cellHeight, this.scaleDown*this.cellWidth, this.scaleDown*2*this.cellHeight*1.7, colors(['SHB11EP00X'], this.dataBus.SHARC, frame, this.nFrames), 'v', 0);

            //tooltip:
            if(!this.TTlayerDone){
                TTcolors = ['rgba(111,111,111,1)'];
                //horizStack(this.TTcontext, 7.5*this.cellWidth, 3.5*this.cellHeight, this.scaleDown*this.cellWidth, this.scaleDown*this.cellHeight, TTcolors, 'h', 1);
                //horizStack(this.TTcontext, 7.5*this.cellWidth, 4.5*this.cellHeight, this.scaleDown*this.cellWidth, this.scaleDown*this.cellHeight, TTcolors, 'h', 1);
                vertStack(this.TTcontext, 7.5*this.cellWidth, 4*this.cellHeight, this.scaleDown*this.cellWidth, this.scaleDown*2*this.cellHeight*1.7, TTcolors, 'v', 1);
            }
        }
        //back
        vertStack(this.context, 6.5*this.cellWidth, 4*this.cellHeight, this.scaleDown*this.cellWidth, this.scaleDown*2*this.cellHeight*1.7, this.meanColor('SHB11DN', frame, 1), 'v', 0);
        //front
        horizStack(this.context, 5.5*this.cellWidth, 4*this.cellHeight, this.scaleDown*this.cellWidth, this.scaleDown*2*this.cellHeight*1.7, this.meanColor('SHB11DP', frame, 1), 'v', 0);
        //tooltip:
        if(!this.TTlayerDone){
            //back
            TTcolors = ['rgba(21,21,21,1)'];
            vertStack(this.TTcontext, 6.5*this.cellWidth, 4*this.cellHeight, this.scaleDown*this.cellWidth, this.scaleDown*2*this.cellHeight*1.7, TTcolors, 'v', 1);
            //front
            TTcolors = ['rgba(22,22,22,1)'];
            horizStack(this.TTcontext, 5.5*this.cellWidth, 4*this.cellHeight, this.scaleDown*this.cellWidth, this.scaleDown*2*this.cellHeight*1.7, TTcolors, 'v', 1);
        }

        //12 o'clock upstream DSSD:
        //pads
        if(this.padsEnabled){
            //horizStack(this.context, 3.5*this.cellWidth, 0.5*this.cellHeight, this.scaleDown*this.cellWidth, this.scaleDown*this.cellHeight, colors(['SHB10FP00X'], this.dataBus.SHARC, frame, this.nFrames), 'h', 0);
            //horizStack(this.context, 4.5*this.cellWidth, 0.5*this.cellHeight, this.scaleDown*this.cellWidth, this.scaleDown*this.cellHeight, colors(['SHB10FN00X'], this.dataBus.SHARC, frame, this.nFrames), 'h', 0);
            horizStack(this.context, 4*this.cellWidth, 0.5*this.cellHeight, this.scaleDown*2*this.cellWidth, this.scaleDown*this.cellHeight, colors(['SHB10EP00X'], this.dataBus.SHARC, frame, this.nFrames), 'h', 0);
            //tooltip:
            if(!this.TTlayerDone){
                TTcolors = ['rgba(110,110,110,1)'];
                //horizStack(this.TTcontext, 3.5*this.cellWidth, 0.5*this.cellHeight, this.scaleDown*this.cellWidth, this.scaleDown*this.cellHeight, TTcolors, 'h', 1);
                //horizStack(this.TTcontext, 4.5*this.cellWidth, 0.5*this.cellHeight, this.scaleDown*this.cellWidth, this.scaleDown*this.cellHeight, TTcolors, 'h', 1);                
                horizStack(this.TTcontext, 4*this.cellWidth, 0.5*this.cellHeight, this.scaleDown*2*this.cellWidth, this.scaleDown*this.cellHeight, TTcolors, 'h', 1);
            }            
        }
        //back
        horizStack(this.context, 4*this.cellWidth, 1.5*this.cellHeight, this.scaleDown*2*this.cellWidth, this.scaleDown*this.cellHeight, this.meanColor('SHB10DN', frame, 1), 'h', 0);
        //front
        vertStack(this.context, 4*this.cellWidth, 2.5*this.cellHeight, this.scaleDown*2*this.cellWidth, this.scaleDown*this.cellHeight, this.meanColor('SHB10DP', frame, 0), 'h', 0);
        //tooltip:
        if(!this.TTlayerDone){
            //back
            TTcolors = ['rgba(19,19,19,1)'];
            horizStack(this.TTcontext, 4*this.cellWidth, 1.5*this.cellHeight, this.scaleDown*2*this.cellWidth, this.scaleDown*this.cellHeight, TTcolors, 'h', 1);
            //front
            TTcolors = ['rgba(20,20,20,1)'];
            vertStack(this.TTcontext, 4*this.cellWidth, 2.5*this.cellHeight, this.scaleDown*2*this.cellWidth, this.scaleDown*this.cellHeight, TTcolors, 'h', 1);
        }

        //9 o'clock upstream DSSD:
        //pads
        if(this.padsEnabled){
            //horizStack(this.context, 0.5*this.cellWidth, 3.5*this.cellHeight, this.scaleDown*this.cellWidth, this.scaleDown*this.cellHeight, colors(['SHB09FP00X'], this.dataBus.SHARC, frame, this.nFrames), 'h', 0);
            //horizStack(this.context, 0.5*this.cellWidth, 4.5*this.cellHeight, this.scaleDown*this.cellWidth, this.scaleDown*this.cellHeight, colors(['SHB09FN00X'], this.dataBus.SHARC, frame, this.nFrames), 'h', 0);
            vertStack(this.context, 0.5*this.cellWidth, 4*this.cellHeight, this.scaleDown*this.cellWidth, this.scaleDown*2*this.cellHeight*1.7, colors(['SHB09EP00X'], this.dataBus.SHARC, frame, this.nFrames), 'v', 0);
            //tooltip:
            if(!this.TTlayerDone){
                TTcolors = ['rgba(109,109,109,1)'];
                //horizStack(this.TTcontext, 0.5*this.cellWidth, 3.5*this.cellHeight, this.scaleDown*this.cellWidth, this.scaleDown*this.cellHeight, TTcolors, 'h', 1);
                //horizStack(this.TTcontext, 0.5*this.cellWidth, 4.5*this.cellHeight, this.scaleDown*this.cellWidth, this.scaleDown*this.cellHeight, TTcolors, 'h', 1);                
                vertStack(this.TTcontext, 0.5*this.cellWidth, 4*this.cellHeight, this.scaleDown*this.cellWidth, this.scaleDown*2*this.cellHeight*1.7, TTcolors, 'v', 0);
            } 
        }
        //back
        vertStack(this.context, 1.5*this.cellWidth, 4*this.cellHeight, this.scaleDown*this.cellWidth, this.scaleDown*2*this.cellHeight*1.7, this.meanColor('SHB09DN', frame, 1), 'v', 0);
        //front
        horizStack(this.context, 2.5*this.cellWidth, 4*this.cellHeight, this.scaleDown*this.cellWidth, this.scaleDown*2*this.cellHeight*1.7, this.meanColor('SHB09DP', frame, 0), 'v', 0);
        //tooltip:
        if(!this.TTlayerDone){
            //back
            TTcolors = ['rgba(17,17,17,1)'];
            vertStack(this.TTcontext, 1.5*this.cellWidth, 4*this.cellHeight, this.scaleDown*this.cellWidth, this.scaleDown*2*this.cellHeight*1.7, TTcolors, 'v', 1);
            //front
            TTcolors = ['rgba(18,18,18,1)'];
            horizStack(this.TTcontext, 2.5*this.cellWidth, 4*this.cellHeight, this.scaleDown*this.cellWidth, this.scaleDown*2*this.cellHeight*1.7, TTcolors, 'v', 1);
        }

        //6 o'clock upstream DSSD:
        //pads
        if(this.padsEnabled){
            //horizStack(this.context, 3.5*this.cellWidth, 7.5*this.cellHeight, this.scaleDown*this.cellWidth, this.scaleDown*this.cellHeight, colors(['SHB12FP00X'], this.dataBus.SHARC, frame, this.nFrames), 'h', 0);
            //horizStack(this.context, 4.5*this.cellWidth, 7.5*this.cellHeight, this.scaleDown*this.cellWidth, this.scaleDown*this.cellHeight, colors(['SHB12FN00X'], this.dataBus.SHARC, frame, this.nFrames), 'h', 0);
            horizStack(this.context, 4*this.cellWidth, 7.5*this.cellHeight, this.scaleDown*2*this.cellWidth, this.scaleDown*this.cellHeight, colors(['SHB12EP00X'], this.dataBus.SHARC, frame, this.nFrames), 'h', 0);
            //tooltip:
            if(!this.TTlayerDone){
                TTcolors = ['rgba(112,112,112,1)'];
                //horizStack(this.TTcontext, 3.5*this.cellWidth, 7.5*this.cellHeight, this.scaleDown*this.cellWidth, this.scaleDown*this.cellHeight, TTcolors, 'h', 1);
                //horizStack(this.TTcontext, 4.5*this.cellWidth, 7.5*this.cellHeight, this.scaleDown*this.cellWidth, this.scaleDown*this.cellHeight, TTcolors, 'h', 1);              
                horizStack(this.TTcontext, 4*this.cellWidth, 7.5*this.cellHeight, this.scaleDown*2*this.cellWidth, this.scaleDown*this.cellHeight, TTcolors, 'h', 1);
            } 
        }
        //back
        horizStack(this.context, 4*this.cellWidth, 6.5*this.cellHeight, this.scaleDown*2*this.cellWidth, this.scaleDown*this.cellHeight, this.meanColor('SHB12DN', frame, 1), 'h', 0);
        //front
        vertStack(this.context, 4*this.cellWidth, 5.5*this.cellHeight, this.scaleDown*2*this.cellWidth, this.scaleDown*this.cellHeight, this.meanColor('SHB12DP', frame, 1), 'h', 0);
        //tooltip:
        if(!this.TTlayerDone){
            //back
            TTcolors = ['rgba(23,23,23,1)'];
            horizStack(this.TTcontext, 4*this.cellWidth, 6.5*this.cellHeight, this.scaleDown*2*this.cellWidth, this.scaleDown*this.cellHeight, TTcolors, 'h', 1);
            //front
            TTcolors = ['rgba(24,24,24,1)'];
            vertStack(this.TTcontext, 4*this.cellWidth, 5.5*this.cellHeight, this.scaleDown*2*this.cellWidth, this.scaleDown*this.cellHeight, TTcolors, 'h', 1);
        }

        //DOWNSTREAM//////////////////////////////////
        if(this.padsEnabled){
            //downstream quad pad back
            //quadBack(this.context, 14*this.cellWidth, 0.5*this.cellHeight, this.quadInnerRad, this.quadOuterRad, this.quadSquish, colors(['SHQ01FN00X', 'SHQ02FN00X', 'SHQ03FN00X', 'SHQ04FN00X'], this.dataBus.SHARC, frame, this.nFrames), 0);
            //upstream quad pad front
            quadBack(this.context, 13.5*this.cellWidth, 1.5*this.cellHeight, this.quadInnerRad, this.quadOuterRad, this.quadSquish, colors(['SHQ01EP00X', 'SHQ02EP00X', 'SHQ03EP00X', 'SHQ04EP00X'], this.dataBus.SHARC, frame, this.nFrames), 0);

            //tooltip:
            if(!this.TTlayerDone){
                TTcolors = ['rgba(101,101,101,1)', 'rgba(102,102,102,1)', 'rgba(103,103,103,1)', 'rgba(104,104,104,1)'];
                //downstream quad pad back
                //quadBack(this.TTcontext, 14*this.cellWidth, 0.5*this.cellHeight, this.quadInnerRad, this.quadOuterRad, this.quadSquish, TTcolors, 1);
                //upstream quad pad front
                quadBack(this.TTcontext, 13.5*this.cellWidth, 1.5*this.cellHeight, this.quadInnerRad, this.quadOuterRad, this.quadSquish, TTcolors, 1);
            }

        }

        //downstream quad back
        quadBack(this.context, 13*this.cellWidth, 2.5*this.cellHeight, this.quadInnerRad, this.quadOuterRad, this.quadSquish, this.meanColor('SHQ01DN', frame, 0).concat(this.meanColor('SHQ02DN', frame, 0), this.meanColor('SHQ03DN', frame, 0), this.meanColor('SHQ04DN', frame, 0)), 0);
        //downstream quad front
        quadFront(this.context, 12.5*this.cellWidth, 3.5*this.cellHeight, this.quadInnerRad, this.quadOuterRad, this.quadSquish, this.meanColor('SHQ01DP', frame, 0).concat(this.meanColor('SHQ02DP', frame, 0), this.meanColor('SHQ03DP', frame, 0), this.meanColor('SHQ04DP', frame, 0)), 0);
        //downstream quad tooltip:
        if(!this.TTlayerDone){
            //downstream quad back
            TTcolors = ['rgba(2,2,2,1)', 'rgba(4,4,4,1)', 'rgba(6,6,6,1)', 'rgba(8,8,8,1)'];
            quadBack(this.TTcontext, 13*this.cellWidth, 2.5*this.cellHeight, this.quadInnerRad, this.quadOuterRad, this.quadSquish, TTcolors, 1);
            //downstream quad front
            TTcolors = ['rgba(1,1,1,1)', 'rgba(3,3,3,1)', 'rgba(5,5,5,1)', 'rgba(7,7,7,1)']; 
            quadBack(this.TTcontext, 12.5*this.cellWidth, 3.5*this.cellHeight, this.quadInnerRad, this.quadOuterRad, this.quadSquish, TTcolors, 1);
        }

        //3 o'clock downstream DSSD:
        //pads
        if(this.padsEnabled){
            //horizStack(this.context, 14.5*this.cellWidth, 7.5*this.cellHeight, this.scaleDown*this.cellWidth, this.scaleDown*this.cellHeight, colors(['SHB07FP00X'], this.dataBus.SHARC, frame, this.nFrames), 'h', 0);
            //horizStack(this.context, 14.5*this.cellWidth, 8.5*this.cellHeight, this.scaleDown*this.cellWidth, this.scaleDown*this.cellHeight, colors(['SHB07FN00X'], this.dataBus.SHARC, frame, this.nFrames), 'h', 0);
            vertStack(this.context, 14.5*this.cellWidth, 8*this.cellHeight, this.scaleDown*this.cellWidth, this.scaleDown*2*this.cellHeight*1.7, colors(['SHB07EP00X'], this.dataBus.SHARC, frame, this.nFrames), 'v', 0);
            //tooltip:
            if(!this.TTlayerDone){
                TTcolors = ['rgba(107,107,107,1)'];
                //horizStack(this.TTcontext, 14.5*this.cellWidth, 7.5*this.cellHeight, this.scaleDown*this.cellWidth, this.scaleDown*this.cellHeight, TTcolors, 'h', 1);
                //horizStack(this.TTcontext, 14.5*this.cellWidth, 8.5*this.cellHeight, this.scaleDown*this.cellWidth, this.scaleDown*this.cellHeight, TTcolors, 'h', 1);             
                vertStack(this.TTcontext, 14.5*this.cellWidth, 8*this.cellHeight, this.scaleDown*this.cellWidth, this.scaleDown*2*this.cellHeight*1.7, TTcolors, 'v', 1);
            } 
        }
        //back
        vertStack(this.context, 13.5*this.cellWidth, 8*this.cellHeight, this.scaleDown*this.cellWidth, this.scaleDown*2*this.cellHeight*1.7, this.meanColor('SHB07DN', frame, 1), 'v', 0);
        //front
        horizStack(this.context, 12.5*this.cellWidth, 8*this.cellHeight, this.scaleDown*this.cellWidth, this.scaleDown*2*this.cellHeight*1.7, this.meanColor('SHB07DP', frame, 1), 'v', 0);
        //tooltip:
        if(!this.TTlayerDone){
            //back
            TTcolors = ['rgba(13,13,13,1)'];
            vertStack(this.TTcontext, 13.5*this.cellWidth, 8*this.cellHeight, this.scaleDown*this.cellWidth, this.scaleDown*2*this.cellHeight*1.7, TTcolors, 'v', 1);
            //front
            TTcolors = ['rgba(14,14,14,1)'];
            horizStack(this.TTcontext, 12.5*this.cellWidth, 8*this.cellHeight, this.scaleDown*this.cellWidth, this.scaleDown*2*this.cellHeight*1.7, TTcolors, 'v', 1);
        }

        //12 o'clock downstream DSSD:
        //pads
        if(this.padsEnabled){
            //horizStack(this.context, 10.5*this.cellWidth, 4.5*this.cellHeight, this.scaleDown*this.cellWidth, this.scaleDown*this.cellHeight, colors(['SHB06FP00X'], this.dataBus.SHARC, frame, this.nFrames), 'h', 0);
            //horizStack(this.context, 11.5*this.cellWidth, 4.5*this.cellHeight, this.scaleDown*this.cellWidth, this.scaleDown*this.cellHeight, colors(['SHB06FN00X'], this.dataBus.SHARC, frame, this.nFrames), 'h', 0);
            horizStack(this.context, 11*this.cellWidth, 4.5*this.cellHeight, this.scaleDown*2*this.cellWidth, this.scaleDown*this.cellHeight, colors(['SHB06EP00X'], this.dataBus.SHARC, frame, this.nFrames), 'h', 0);
            //tooltip:
            if(!this.TTlayerDone){
                TTcolors = ['rgba(106,106,106,1)'];
                //horizStack(this.TTcontext, 10.5*this.cellWidth, 4.5*this.cellHeight, this.scaleDown*this.cellWidth, this.scaleDown*this.cellHeight, TTcolors, 'h', 1);
                //horizStack(this.TTcontext, 11.5*this.cellWidth, 4.5*this.cellHeight, this.scaleDown*this.cellWidth, this.scaleDown*this.cellHeight, TTcolors, 'h', 1);
                horizStack(this.TTcontext, 11*this.cellWidth, 4.5*this.cellHeight, this.scaleDown*2*this.cellWidth, this.scaleDown*this.cellHeight, TTcolors, 'h', 1);        
            }
        }
        //back
        horizStack(this.context, 11*this.cellWidth, 5.5*this.cellHeight, this.scaleDown*2*this.cellWidth, this.scaleDown*this.cellHeight, this.meanColor('SHB06DN', frame, 1), 'h', 0);
        //front
        vertStack(this.context, 11*this.cellWidth, 6.5*this.cellHeight, this.scaleDown*2*this.cellWidth, this.scaleDown*this.cellHeight, this.meanColor('SHB06DP', frame, 0), 'h', 0);
        //tooltip:
        if(!this.TTlayerDone){
            //back
            TTcolors = ['rgba(11,11,11,1)'];
            horizStack(this.TTcontext, 11*this.cellWidth, 5.5*this.cellHeight, this.scaleDown*2*this.cellWidth, this.scaleDown*this.cellHeight, TTcolors, 'h', 1);
            //front
            TTcolors = ['rgba(12,12,12,1)'];
            vertStack(this.TTcontext, 11*this.cellWidth, 6.5*this.cellHeight, this.scaleDown*2*this.cellWidth, this.scaleDown*this.cellHeight, TTcolors, 'h', 1);
        }

        //9 o'clock downstream DSSD:
        //pads
        if(this.padsEnabled){
            //horizStack(this.context, 7.5*this.cellWidth, 7.5*this.cellHeight, this.scaleDown*this.cellWidth, this.scaleDown*this.cellHeight, colors(['SHB05FP00X'], this.dataBus.SHARC, frame, this.nFrames), 'h', 0);
            //horizStack(this.context, 7.5*this.cellWidth, 8.5*this.cellHeight, this.scaleDown*this.cellWidth, this.scaleDown*this.cellHeight, colors(['SHB05FN00X'], this.dataBus.SHARC, frame, this.nFrames), 'h', 0);
            vertStack(this.context, 7.5*this.cellWidth, 8*this.cellHeight, this.scaleDown*this.cellWidth, this.scaleDown*2*this.cellHeight*1.7, colors(['SHB05EP00X'], this.dataBus.SHARC, frame, this.nFrames), 'v', 0);
            //tooltip:
            if(!this.TTlayerDone){
                TTcolors = ['rgba(105,105,105,1)'];
                //horizStack(this.TTcontext, 7.5*this.cellWidth, 7.5*this.cellHeight, this.scaleDown*this.cellWidth, this.scaleDown*this.cellHeight, TTcolors, 'h', 1);
                //horizStack(this.TTcontext, 7.5*this.cellWidth, 8.5*this.cellHeight, this.scaleDown*this.cellWidth, this.scaleDown*this.cellHeight, TTcolors, 'h', 1);
                vertStack(this.TTcontext, 7.5*this.cellWidth, 8*this.cellHeight, this.scaleDown*this.cellWidth, this.scaleDown*2*this.cellHeight*1.7, TTcolors, 'v', 1);
            }
        }
        //back
        vertStack(this.context, 8.5*this.cellWidth, 8*this.cellHeight, this.scaleDown*this.cellWidth, this.scaleDown*2*this.cellHeight*1.7, this.meanColor('SHB05DN', frame, 1), 'v', 0);
        //front
        horizStack(this.context, 9.5*this.cellWidth, 8*this.cellHeight, this.scaleDown*this.cellWidth, this.scaleDown*2*this.cellHeight*1.7, this.meanColor('SHB05DP', frame, 0), 'v', 0);
        //tooltip:
        if(!this.TTlayerDone){
            //back
            TTcolors = ['rgba(9,9,9,1)'];
            vertStack(this.TTcontext, 8.5*this.cellWidth, 8*this.cellHeight, this.scaleDown*this.cellWidth, this.scaleDown*2*this.cellHeight*1.7, TTcolors, 'v', 1);
            //front
            TTcolors = ['rgba(10,10,10,1)'];
            horizStack(this.TTcontext, 9.5*this.cellWidth, 8*this.cellHeight, this.scaleDown*this.cellWidth, this.scaleDown*2*this.cellHeight*1.7, TTcolors, 'v', 1);
        }

        //6 o'clock downstream DSSD:
        //pads
        if(this.padsEnabled){
            //horizStack(this.context, 10.5*this.cellWidth, 11.5*this.cellHeight, this.scaleDown*this.cellWidth, this.scaleDown*this.cellHeight, colors(['SHB08FP00X'], this.dataBus.SHARC, frame, this.nFrames), 'h', 0);
            //horizStack(this.context, 11.5*this.cellWidth, 11.5*this.cellHeight, this.scaleDown*this.cellWidth, this.scaleDown*this.cellHeight, colors(['SHB08FN00X'], this.dataBus.SHARC, frame, this.nFrames), 'h', 0);
            horizStack(this.context, 11*this.cellWidth, 11.5*this.cellHeight, this.scaleDown*2*this.cellWidth, this.scaleDown*this.cellHeight, colors(['SHB08EP00X'], this.dataBus.SHARC, frame, this.nFrames), 'h', 0);
            //tooltip:
            if(!this.TTlayerDone){
                TTcolors = ['rgba(108,108,108,1)'];
                //horizStack(this.TTcontext, 10.5*this.cellWidth, 11.5*this.cellHeight, this.scaleDown*this.cellWidth, this.scaleDown*this.cellHeight, TTcolors, 'h', 1);
                //horizStack(this.TTcontext, 11.5*this.cellWidth, 11.5*this.cellHeight, this.scaleDown*this.cellWidth, this.scaleDown*this.cellHeight, TTcolors, 'h', 1);         
                horizStack(this.TTcontext, 11*this.cellWidth, 11.5*this.cellHeight, this.scaleDown*2*this.cellWidth, this.scaleDown*this.cellHeight, TTcolors, 'h', 1);
            }
        }
        //back
        horizStack(this.context, 11*this.cellWidth, 10.5*this.cellHeight, this.scaleDown*2*this.cellWidth, this.scaleDown*this.cellHeight, this.meanColor('SHB08DN', frame, 1), 'h', 0);
        //front
        vertStack(this.context, 11*this.cellWidth, 9.5*this.cellHeight, this.scaleDown*2*this.cellWidth, this.scaleDown*this.cellHeight, this.meanColor('SHB08DP', frame, 1), 'h', 0);
        //tooltip:
        if(!this.TTlayerDone){
            //back
            TTcolors = ['rgba(15,15,15,1)'];
            horizStack(this.TTcontext, 11*this.cellWidth, 10.5*this.cellHeight, this.scaleDown*2*this.cellWidth, this.scaleDown*this.cellHeight, TTcolors, 'h', 1);
            //front
            TTcolors = ['rgba(16,16,16,1)'];
            vertStack(this.TTcontext, 11*this.cellWidth, 9.5*this.cellHeight, this.scaleDown*2*this.cellWidth, this.scaleDown*this.cellHeight, TTcolors, 'h', 1);
        }

        if(frame==this.nFrames || frame==0){ 
            //scale:
            this.drawScale(this.context);

            //orienting arrows:
            this.context.lineWidth = 2;
            //upstream
            this.context.beginPath();
            this.context.moveTo(2.5*this.cellWidth, 11.5*this.cellHeight);
            this.context.lineTo(4*this.cellWidth, 8.5*this.cellHeight);
            this.context.lineTo(4.2*this.cellWidth, 8.7*this.cellHeight);
            this.context.stroke();
            //downstream
            this.context.beginPath();
            this.context.moveTo(11*this.cellWidth, 3.5*this.cellHeight);
            this.context.lineTo(12.5*this.cellWidth, 0.5*this.cellHeight);
            this.context.lineTo(12.1*this.cellWidth, 0.7*this.cellHeight);
            this.context.stroke();

            this.context.lineWidth = 1;

            //titles:
            this.context.fillStyle = '#999999';
            this.context.font = '20px Orbitron';
            this.context.textBaseline = 'top';
            this.context.fillText('Upstream', this.cellWidth*4 - this.context.measureText('Upstream').width/2, this.canvasHeight - this.scaleHeight*0.95);
            this.context.fillText('Downstream', this.cellWidth*11 - this.context.measureText('Downstream').width/2, this.canvasHeight - this.scaleHeight*0.95);
            this.context.textBaseline = 'alphabetic';
        }

        this.TTlayerDone = 1;
    };

    this.drawDetail = function(x, frame){  //animatedetail expects the first argument to be the detail context - refactor to eliminate.
        var colors = [], TTcolors = [],
            i, name,
            arrayElt = Math.ceil(this.detailShowing/2);

        this.detailContext.clearRect(0,0, this.canvasWidth, this.canvasHeight-this.scaleHeight);
        if(!this.TTdetailLayerDone){
            this.TTdetailContext.fillStyle = '#FEDCBA'
            this.TTdetailContext.fillRect(0,0, this.canvasWidth, this.canvasHeight);
        }
        //title
        this.detailContext.fillStyle = '#999999';
        this.detailContext.font = '20px Orbitron';
        this.detailContext.fillText(this.detailTitles[arrayElt-1], this.canvasWidth/2 - this.detailContext.measureText(this.detailTitles[arrayElt-1]).width/2, this.canvasHeight*0.75 );

        //quadrant details
        if(arrayElt < 5 || arrayElt > 12){

            //subtitles:
            this.detailContext.fillText('Front', this.quadDetailFrontCenter - this.detailContext.measureText('Front').width/2, this.canvasHeight*0.67);
            this.detailContext.fillText('Back', this.quadDetailBackCenter - this.detailContext.measureText('Back').width/2, this.canvasHeight*0.67);
            if(this.padsEnabled) this.detailContext.fillText('Pads', this.canvasWidth*0.9 - this.detailContext.measureText('Pads').width/2, this.canvasHeight*0.67);

            //front side:
            colors = [];
            TTcolors = [];
            for(i=0; i<16; i++){
                name = 'SHQ' + ( (arrayElt < 10) ? '0'+arrayElt : arrayElt ) + 'DP' + ( (i<10) ? '0'+i : i ) + 'X';
                colors[colors.length] = frameColor(this.dataBus.SHARC[name], frame, this.nFrames);
                TTcolors[TTcolors.length] = 'rgba('+i+','+i+','+i+',1)';
            }
            radialQuadrant(this.detailContext, this.quadDetailFrontCenter, this.canvasHeight*0.7, this.innerQuadRadDetail, this.outerQuadRadDetail, this.quadArcDetail, -Math.PI/2, colors);
            if(!this.TTdetailLayerDone)
                radialQuadrant(this.TTdetailContext, this.quadDetailFrontCenter, this.canvasHeight*0.7, this.innerQuadRadDetail, this.outerQuadRadDetail, this.quadArcDetail, -Math.PI/2, TTcolors, 1);

            //back side:
            colors = [];
            TTcolors = [];
            for(i=0; i<24; i++){
                name = 'SHQ' + ( (arrayElt < 10) ? '0'+arrayElt : arrayElt ) + 'DN' + ( (i<10) ? '0'+i : i ) + 'X';
                colors[colors.length] = frameColor(this.dataBus.SHARC[name], frame, this.nFrames);
                TTcolors[TTcolors.length] = 'rgba('+(i+16)+','+(i+16)+','+(i+16)+',1)';
            }
            azimuthalQuadrant(this.detailContext, this.quadDetailBackCenter, this.canvasHeight*0.7, this.innerQuadRadDetail, this.outerQuadRadDetail, this.quadArcDetail, -Math.PI/2, colors);
            if(!this.TTdetailLayerDone)
                azimuthalQuadrant(this.TTdetailContext, this.quadDetailBackCenter, this.canvasHeight*0.7, this.innerQuadRadDetail, this.outerQuadRadDetail, this.quadArcDetail, -Math.PI/2, TTcolors, 1);

            //pads
            colors = [];
            TTcolors = [];
            if(this.padsEnabled){
                name = 'SHQ' + ( (arrayElt < 10) ? '0'+arrayElt : arrayElt ) + 'EN00X';
                colors[0] = frameColor(this.dataBus.SHARC[name], frame, this.nFrames);
                TTcolors[0] = 'rgba(40,40,40,1)';
                radialQuadrant(this.detailContext, this.canvasWidth*0.9, this.canvasHeight*0.4, this.innerQuadRadDetail/2, this.innerQuadRadDetail*2, this.quadArcDetail, -Math.PI/2, colors);
                if(!this.TTdetailLayerDone)
                    radialQuadrant(this.TTdetailContext, this.canvasWidth*0.9, this.canvasHeight*0.4, this.innerQuadRadDetail/2, this.innerQuadRadDetail*2, this.quadArcDetail, -Math.PI/2, TTcolors, 1);
                name = 'SHQ' + ( (arrayElt < 10) ? '0'+arrayElt : arrayElt ) + 'EP00X';
                colors[0] = frameColor(this.dataBus.SHARC[name], frame, this.nFrames);
                TTcolors[0] = 'rgba(41,41,41,1)';
                radialQuadrant(this.detailContext, this.canvasWidth*0.9, this.canvasHeight*0.6, this.innerQuadRadDetail/2, this.innerQuadRadDetail*2, this.quadArcDetail, -Math.PI/2, colors);
                if(!this.TTdetailLayerDone)
                    radialQuadrant(this.TTdetailContext, this.canvasWidth*0.9, this.canvasHeight*0.6, this.innerQuadRadDetail/2, this.innerQuadRadDetail*2, this.quadArcDetail, -Math.PI/2, TTcolors, 1);
            }

        } else{  //box details

            //subtitles:
            this.detailContext.fillText('Front', this.canvasWidth*0.19+this.boxDetailFrontLeftEdge - this.detailContext.measureText('Front').width/2, this.canvasHeight*0.7);
            this.detailContext.fillText('Back', this.canvasWidth*0.19+this.boxDetailBackLeftEdge - this.detailContext.measureText('Back').width/2, this.canvasHeight*0.7);
            if(this.padsEnabled) this.detailContext.fillText('Pads', this.canvasWidth*0.9 - this.detailContext.measureText('Pads').width/2, this.canvasHeight*0.7);

            //front side:
            colors = [];
            TTcolors = [];
            for(i=0; i<24; i++){
                name = 'SHB' + ( (arrayElt < 10) ? '0'+arrayElt : arrayElt ) + 'DP' + ( (i<10) ? '0'+i : i ) + 'X';
                colors[colors.length] = frameColor(this.dataBus.SHARC[name], frame, this.nFrames);
                TTcolors[TTcolors.length] = 'rgba('+i+','+i+','+i+',1)';
            }
            boxFront(this.detailContext, this.boxDetailFrontLeftEdge,0.05*this.canvasHeight, 0.60*this.canvasHeight, 0.38*this.canvasWidth, colors);
            if(!this.TTdetailLayerDone)
                boxFront(this.TTdetailContext, this.boxDetailFrontLeftEdge,0.05*this.canvasHeight, 0.60*this.canvasHeight, 0.38*this.canvasWidth, TTcolors, 1);

            //back side:
            colors = [];
            TTcolors = [];
            for(i=0; i<48; i++){
                name = 'SHB' + ( (arrayElt < 10) ? '0'+arrayElt : arrayElt ) + 'DN' + ( (i<10) ? '0'+i : i ) + 'X';
                colors[colors.length] = frameColor(this.dataBus.SHARC[name], frame, this.nFrames);
                TTcolors[TTcolors.length] = 'rgba('+(i+24)+','+(i+24)+','+(i+24)+',1)';
            }
            boxBack(this.detailContext, this.boxDetailBackLeftEdge, 0.05*this.canvasHeight, 0.60*this.canvasHeight, 0.38*this.canvasWidth, colors);
            if(!this.TTdetailLayerDone)
                boxBack(this.TTdetailContext, this.boxDetailBackLeftEdge, 0.05*this.canvasHeight, 0.60*this.canvasHeight, 0.38*this.canvasWidth, TTcolors, 1);

            //pads
            colors = [];
            TTcolors = [];
            if(this.padsEnabled){
                name = 'SHB' + ( (arrayElt < 10) ? '0'+arrayElt : arrayElt ) + 'EN00X';
                colors[0] = frameColor(this.dataBus.SHARC[name], frame, this.nFrames);
                TTcolors[0] = 'rgba(72,72,72,1)';
                boxFront(this.detailContext, this.canvasWidth*0.85, this.canvasHeight*0.175, 0.15*this.canvasHeight, 0.1*this.canvasWidth, colors);
                if(!this.TTdetailLayerDone)
                    boxFront(this.TTdetailContext, this.canvasWidth*0.85, this.canvasHeight*0.175, 0.15*this.canvasHeight, 0.1*this.canvasWidth, TTcolors, 1);
                name = 'SHB' + ( (arrayElt < 10) ? '0'+arrayElt : arrayElt ) + 'EP00X';
                colors[0] = frameColor(this.dataBus.SHARC[name], frame, this.nFrames);
                TTcolors[0] = 'rgba(73,73,73,1)';
                boxFront(this.detailContext, this.canvasWidth*0.85, this.canvasHeight*0.375, 0.15*this.canvasHeight, 0.1*this.canvasWidth, colors);
                if(!this.TTdetailLayerDone)
                    boxFront(this.TTdetailContext, this.canvasWidth*0.85, this.canvasHeight*0.375, 0.15*this.canvasHeight, 0.1*this.canvasWidth, TTcolors, 1);
            }            
        }

        this.TTdetailLayerDone = 1;

        //decorations & TT:
        if(frame==this.nFrames || frame==0){ 
            //scale:
            this.drawScale(this.detailContext);
        }
    }

    this.defineText = function(cell){
        var i, name,
            objects = [], 
            keys = ['HV', 'threshold', 'rate'],
            arrayElt;

        if(this.detailShowing == 0){

            //strip elements:
            if(cell < 100){
                arrayElt = Math.ceil(cell/2);
                //quadrants
                if(arrayElt < 5 || arrayElt > 12){
                    //fronts
                    if(cell%2){
                        for(i=0; i<16; i++){
                            objects[objects.length] = 'SHQ' + ( (arrayElt < 10) ? '0'+arrayElt : arrayElt ) + 'DP' + ( (i<10) ? '0'+i : i ) + 'X';
                        }
                    } else { //backs
                        for(i=0; i<24; i++){
                            objects[objects.length] = 'SHQ' + ( (arrayElt < 10) ? '0'+arrayElt : arrayElt ) + 'DN' + ( (i<10) ? '0'+i : i ) + 'X';
                        }
                    }            
                } else{ //boxes
                    //fronts
                    if(cell%2 == 0){
                        for(i=0; i<24; i++){
                            objects[objects.length] = 'SHB' + ( (arrayElt < 10) ? '0'+arrayElt : arrayElt ) + 'DP' + ( (i<10) ? '0'+i : i ) + 'X';
                        }
                    } else { //backs
                        //backs
                        for(i=0; i<48; i++){
                            objects[objects.length] = 'SHB' + ( (arrayElt < 10) ? '0'+arrayElt : arrayElt ) + 'DN' + ( (i<10) ? '0'+i : i ) + 'X';
                        } 
                    }

                }
                document.getElementById(this.name+'TT').innerHTML = '';
                window.state.staticTT = 1;
                TTtable(this.name+'TT', this.dataBus.SHARC , objects, keys, objects[0].slice(0,5) + ( (objects[0].slice(5,7) == 'DP') ? ' (front)' : ' (back)' ), ['Device','HV [V]', 'Threhsold [ADC Units]', 'Rate [Hz]'], [Math.ceil(objects.length/2),Math.floor(objects.length/2)] );
            } else {  //pads:
                arrayElt = cell - 100;
                //quadrants
                if(arrayElt < 5 || arrayElt > 12){
                    objects[0] = 'SHQ' + ( (arrayElt < 10) ? '0'+arrayElt : arrayElt ) + 'EP00X';
                    //objects[1] = 'SHQ' + ( (arrayElt < 10) ? '0'+arrayElt : arrayElt ) + 'FN00X';
                } else { //boxes
                    objects[0] = 'SHB' + ( (arrayElt < 10) ? '0'+arrayElt : arrayElt ) + 'EP00X';
                    //objects[1] = 'SHB' + ( (arrayElt < 10) ? '0'+arrayElt : arrayElt ) + 'FN00X';
                }
                document.getElementById(this.name+'TT').innerHTML = '';
                TTtable(this.name+'TT', this.dataBus.SHARC ,objects, keys, objects[0].slice(0,5) + ' pads', ['Device','HV [V]', 'Threhsold [ADC Units]', 'Rate [Hz]'], [objects.length]);
            }
        } else {
            arrayElt = Math.ceil(this.detailShowing/2);
            if(arrayElt < 5 || arrayElt > 12){
                if(cell < 40)
                    name = 'SHQ' + ( (arrayElt < 10) ? '0'+arrayElt : arrayElt ) + ( (cell < 16) ? ('DP' + ((cell<10)?'0'+cell:cell) ) : ('DN' + ((cell-16<10)?'0'+(cell-16):(cell-16))) ) + 'X';
                else 
                    name = 'SHQ' + ( (arrayElt < 10) ? '0'+arrayElt : arrayElt ) + 'E' + ( (cell==40) ? 'N' : 'P' ) + '00X';
            } else {
                if(cell < 72)
                    name = 'SHB' + ( (arrayElt < 10) ? '0'+arrayElt : arrayElt ) + ( (cell < 24) ? ('DP' + ((cell<10)?'0'+cell:cell) ) : ('DN' + ((cell-24<10)?'0'+(cell-24):(cell-24))) ) + 'X';
                else
                    name = 'SHB' + ( (arrayElt < 10) ? '0'+arrayElt : arrayElt ) + 'E' + ( (cell==72) ? 'N' : 'P' ) + '00X';
            }
            
            document.getElementById(this.detailTooltip.ttDivID).innerHTML = name + '<br><br>' + this.baseTTtext(this.dataBus.SHARC[name].HV, this.dataBus.SHARC[name].threshold, this.dataBus.SHARC[name].rate);

        }

    };

    //get new data
    this.fetchNewData = function(){
        
        var key, normalization, quarter;

        //zero out the summary:
        for(key in this.dataBus.summary){
            if(this.dataBus.summary.hasOwnProperty(key)){
                this.dataBus.summary[key].HV = 0;
                this.dataBus.summary[key].threshold = 0;
                this.dataBus.summary[key].rate = 0;
            }
        }

        //fetch data, plug into detail level and increment summary cells:
        for(key in this.dataBus.SHARC){
            if(window.JSONPstore['thresholds']){
                quarter = Math.floor(parseInt(key.slice(7,9)) / this.sizeOfQuarter(key));
                if(window.JSONPstore['thresholds'][key]){
                    this.dataBus.SHARC[key]['threshold'] = window.JSONPstore['thresholds'][key];
                    if(key.slice(5,6) != 'E'){ //treat pads differently since they don't need to be averaged:
                        if(this.dataBus.summary[key.slice(0,7) + quarter].threshold != 0xDEADBEEF) 
                            this.dataBus.summary[key.slice(0,7) + quarter].threshold += window.JSONPstore['thresholds'][key];
                    } else 
                        this.dataBus.summary[key].threshold = window.JSONPstore['thresholds'][key];
                } else{
                    this.dataBus.SHARC[key]['threshold'] = 0xDEADBEEF;
                    if(key.slice(5,6) != 'E')
                        this.dataBus.summary[key.slice(0,7) + quarter].threshold = 0xDEADBEEF;
                    else
                       this.dataBus.summary[key].threshold = 0xDEADBEEF; 
                }
            } 

            if(window.JSONPstore['scalar']){
                quarter = Math.floor(parseInt(key.slice(7,9)) / this.sizeOfQuarter(key));
                if(window.JSONPstore['scalar'][key]){
                    this.dataBus.SHARC[key]['rate'] = window.JSONPstore['scalar'][key]['TRIGREQ'];
                    if(key.slice(5,6) != 'E'){ //treat pads differently since they don't need to be averaged:
                        if(this.dataBus.summary[key.slice(0,7) + quarter].rate != 0xDEADBEEF) 
                            this.dataBus.summary[key.slice(0,7) + quarter].rate += window.JSONPstore['scalar'][key]['TRIGREQ'];
                    } else 
                        this.dataBus.summary[key].rate = window.JSONPstore['scalar'][key]['TRIGREQ'];
                } else{ 
                    this.dataBus.SHARC[key]['rate'] = 0xDEADBEEF;
                    if(key.slice(5,6) != 'E')
                        this.dataBus.summary[key.slice(0,7) + quarter].rate = 0xDEADBEEF;
                    else
                        this.dataBus.summary[key].rate = 0xDEADBEEF;
                }
            }
        }

        //average the summary level cells:
        for(key in this.dataBus.summary){
            if(this.dataBus.summary.hasOwnProperty(key) && key.slice(5,6)!='E' ){
                if(this.dataBus.summary[key].HV != 0xDEADBEEF) this.dataBus.summary[key].HV /= this.sizeOfQuarter(key);
                if(this.dataBus.summary[key].threshold != 0xDEADBEEF) this.dataBus.summary[key].threshold /= this.sizeOfQuarter(key);
                if(this.dataBus.summary[key].rate != 0xDEADBEEF) this.dataBus.summary[key].rate /= this.sizeOfQuarter(key);
            }
        }
        

    };

    //given a SHARC key, return 1/4 the number of segments in that type of detector
    this.sizeOfQuarter = function(key){

        if(key.slice(0,3) == 'SHB'){
            if(key.slice(5,7) == 'DP')
                return 6;
            else if(key.slice(5,7) == 'DN')
                return 12;
        } else if(key.slice(0,3) == 'SHQ'){
            if(key.slice(5,7) == 'DP')
                return 4;
            else if(key.slice(5,7) == 'DN')
                return 6;
        }        
    };

    //determine the color corresponding to the average value across a quarter of an element prefixed by prefix (7 characters ie SHB09DP) for the summary view.
    //colors packed in order [1st quarter, 2nd, 3rd, 4th], unless reversed flag is set, then returns [4th, 3rd, 2nd, 1st].
    this.meanColor = function(prefix, frame, reversed){
        var i,
            colors=[];

        for(i=0; i<4; i++){
            if(window.state.subdetectorView == 0) colors[i] = interpolateColor(parseHexColor(this.dataBus.summary[prefix+i].oldHVcolor), parseHexColor(this.dataBus.summary[prefix+i].HVcolor), frame/this.nFrames);
            else if(window.state.subdetectorView == 1) colors[i] = interpolateColor(parseHexColor(this.dataBus.summary[prefix+i].oldThresholdColor), parseHexColor(this.dataBus.summary[prefix+i].thresholdColor), frame/this.nFrames);
            else if(window.state.subdetectorView == 2) colors[i] = interpolateColor(parseHexColor(this.dataBus.summary[prefix+i].oldRateColor), parseHexColor(this.dataBus.summary[prefix+i].rateColor), frame/this.nFrames);
        }

        if(reversed)
            colors = colors.reverse();

        return colors;
    };

}


SPICE.prototype = Object.create(Subsystem.prototype);

function SPICE(){
    //detector name, self-pointing pointer, pull in the Subsystem template, 
    //establish a databus and create a global-scope pointer to this object:
    this.name = 'SPICE';
    var that = this;
    Subsystem.call(this);
    this.dataBus = new SPICEDS();
    //SPICE can be deployed with an S2 or S3 downstream in the chamber;
    //these are identical to BAMBINO, so we deploy BAMBINO in 'SPICE mode':
    if(window.parameters.SPICEaux == 'S2' || window.parameters.SPICEaux == 'S3'){
        window.parameters.deployment.BAMBINO = 1;
        window.parameters.BAMBINOdeployment = [0,1];
    }
    //make a pointer at window level back to this object, so we can pass by reference to the nav button onclick
    window.SPICEpointer = that;

    //member variables///////////////////////////////////
	this.nRadial = 10;
	this.nAzimuthal = 12;


    //drawing parameters///////////////////////////////////////
    this.centerX = this.canvasWidth/2;
    this.centerY = this.canvasHeight*0.42;
    this.innerRadius = this.canvasHeight*0.02;
    this.outerRadius = this.canvasHeight*0.36;
    this.azimuthalStep = 2*Math.PI / this.nAzimuthal;
    this.radialStep = (this.outerRadius - this.innerRadius) / this.nRadial;

    //member functions///////////////////////////////////////////////////////////////////


    this.draw = function(frame){
    	var i=0, key, ring, sector;

    	this.context.strokeStyle = '#999999';
    	
        //once for display canvas...
    	for(key in this.dataBus.SPICE){
    		sector = i%12;
    		ring = Math.floor(i/12);

            this.context.fillStyle = colors(key, this.dataBus.SPICE, frame, this.nFrames)

		    this.context.beginPath();
		    this.context.arc(this.centerX, this.centerY, this.innerRadius + ring*this.radialStep, -sector*this.azimuthalStep, -(sector+1)*this.azimuthalStep, true);
    		this.context.lineTo(this.centerX + (this.innerRadius + (ring+1)*this.radialStep)*Math.cos(2*Math.PI - (sector+1)*this.azimuthalStep), this.centerY + (this.innerRadius + (ring+1)*this.radialStep)*Math.sin(2*Math.PI - (sector+1)*this.azimuthalStep));
	    	this.context.arc(this.centerX, this.centerY, this.innerRadius + (ring+1)*this.radialStep, - (sector+1)*this.azimuthalStep, - sector*this.azimuthalStep, false);
    		this.context.closePath();
    		this.context.fill();
    		this.context.stroke();

            i++;
    	}
        //...and again for tt encoding:
        if(!this.TTlayerDone){
        i=0;
            for(key in this.dataBus.SPICE){
                sector = i%12;
                ring = Math.floor(i/12);

                this.TTcontext.fillStyle = 'rgba('+this.dataBus.SPICE[key].index+','+this.dataBus.SPICE[key].index+','+this.dataBus.SPICE[key].index+',1)';
                this.TTcontext.beginPath();
                this.TTcontext.arc(this.centerX, this.centerY, this.innerRadius + ring*this.radialStep, -sector*this.azimuthalStep, -(sector+1)*this.azimuthalStep, true);
                this.TTcontext.lineTo(this.centerX + (this.innerRadius + (ring+1)*this.radialStep)*Math.cos(2*Math.PI - (sector+1)*this.azimuthalStep), this.centerY + (this.innerRadius + (ring+1)*this.radialStep)*Math.sin(2*Math.PI - (sector+1)*this.azimuthalStep));
                this.TTcontext.arc(this.centerX, this.centerY, this.innerRadius + (ring+1)*this.radialStep, - (sector+1)*this.azimuthalStep, - sector*this.azimuthalStep, false);
                this.TTcontext.closePath();
                this.TTcontext.fill();
                //suppress antialiasing problems between cells:
                this.TTcontext.strokeStyle = '#123456';
                this.TTcontext.stroke();

                i++;
            }
            this.TTlayerDone = 1;
        }

        //scale
        if(frame==this.nFrames || frame==0) this.drawScale(this.context);
    };

    
    //do an initial populate:
    this.update();
}function StatusBar(wrapper){
	this.wrapperID = wrapper;
	this.titleID = 'experimentTitle';
	this.runInfoID = 'runInfo';

	var that = this;

    //header info
    insertDOM('div', 'statusHeader', '', 'background:rgba(0,0,0,0.7); border: 5px solid; border-radius:10px; width:80%; margin-top:5%; margin-bottom:5%; margin-left:auto; margin-right:auto; padding-left:5%; padding-right:5%; transition:border-color 0.5s; -moz-transition:border-color 0.5s; -webkit-transition:border-color 0.5s;', this.wrapperID, '', '')

    //deploy tooltip:
    //this.tooltip = new Tooltip('LeftSidebarBKG', 'leftSidebarTT', this.wrapperID, [], []);
    //this.tooltip.obj = that;

    //tooltip actually attaches to a canvas - attach it to the background canvas, but then pull the event listners up to the top-level div:
    //document.getElementById('statusHeader').onmousemove = document.getElementById('LeftSidebarBKG').onmousemove
    //document.getElementById('statusHeader').onmouseout = document.getElementById('LeftSidebarBKG').onmouseout
    //document.getElementById('statusHeader').onmouseover = document.getElementById('LeftSidebarBKG').onmouseover
    //tooltip will also look for members canvasWidth and canvasHeight:
    //this.canvasWidth = document.getElementById('LeftSidebarBKG').width
    //this.canvasHeight = document.getElementById('LeftSidebarBKG').height

    //experiment title
    insertDOM('h2', this.titleID, '', 'margin-top:25px; font-family: "Orbitron", sans-serif;', 'statusHeader', '', '')

    //run info
	insertDOM('p', this.runInfoID, '', 'position:relative; margin-top:10px; margin-left:auto; margin-right:auto; padding-left:5%; padding-right:5%; text-align:center; font-size:16px; width: 80%;', 'statusHeader', '', 'Run Info Unavailable in pre-2011 MIDAS');

    //Alarm Service
    window.AlarmServices = new AlarmService('leftSidebar', 'leftSidebarDetail');

    //JSONP monitor
    insertDOM('p', 'JSONPmonitor', '', 'width:80%; margin-left:auto; margin-right:auto; padding-left:5%; padding-right:5%; margin-top:5%;', this.wrapperID, '', '')

    if(!window.parameters.MIDASlegacyMode){
        //message service
        //insertDOM('table', 'messageTable', '', 'padding:10px; font-family:10px Raleway;', this.wrapperID, '', '');
        /*  //message input diabled until further notice///////////////////////////////////
        insertDOM('tr', 'inputRow', '', '', 'messageTable', '', '');
        insertDOM('td', 'inputCell', 'messageServiceCell', 'background:#333333;', 'inputRow', '');
        document.getElementById('inputCell').innerHTML = ''
        //insertDOM('input', 'inputMessage', '', '', 'inputCell', '', '', '', 'text', '');
        insertDOM('textarea', 'inputMessage', '', 'background:#333333; color:#FFFFFF', 'inputCell', '', '', '', '', '');
        document.getElementById('inputMessage').rows = 3;
        document.getElementById('inputMessage').cols = 30;
        //expand the text box to fill the sidebar on larger monitors:
        while(document.getElementById('messageTable').offsetWidth + 10 < document.getElementById(this.wrapperID).offsetWidth)
            document.getElementById('inputMessage').cols++;
        document.getElementById('inputMessage').value = 'Enter log message here; press return to commit.';
        document.getElementById('inputMessage').onclick = function(){
            this.value = '';
        }
        document.getElementById('inputMessage').onkeypress = function(event){
            if(event.keyCode == 13 && this.value!=''){
                ODBGenerateMsg(this.value);
                forceUpdate();
                this.value = 'Enter log message here; press return to commit.';
            }
        }
        */ //end message input///////////////////////////////////////////////////////////////
        insertDOM('div', 'message0', 'messageServiceCell', 'background:#777777;', this.wrapperID, '');
        insertDOM('div', 'message1', 'messageServiceCell', 'background:#333333;', this.wrapperID, '');
        insertDOM('div', 'message2', 'messageServiceCell', 'background:#777777;', this.wrapperID, '');
        insertDOM('div', 'message3', 'messageServiceCell', 'background:#333333;', this.wrapperID, '');
        insertDOM('div', 'message4', 'messageServiceCell', 'background:#777777; margin-bottom:20px;', this.wrapperID, '');
    }

    this.update = function(){
        if(!window.parameters.MIDASlegacyMode){
            var i;
        	//experiment title 
            this.expTitle = window.localODB.expTitle + ' Experiment';
        	document.getElementById(this.titleID).innerHTML = this.expTitle;

    	    //run # 
            this.runInfo = 'Run # '+window.localODB.runInfo;

        	//run state
        	this.runInfo += ': ';
            this.runstate = window.localODB.runstate;
        	if(this.runstate == 1){ 
                this.runInfo += 'Stopped';
                $('#statusHeader').css('border-color', '#FF3333');
            }
        	else if(this.runstate == 2){
                this.runInfo += 'Paused';
                $('#statusHeader').css('border-color', '#FFFF33');   
            }
        	else if (this.runstate == 3){
                this.runInfo += 'Live';
                $('#statusHeader').css('border-color', '#66FF66');
            }
        	else this.runInfo += 'State Unknown';
        
    	    //run time
        	this.startInfo = 'Start: '+window.localODB.startInfo;
        	this.elapsed;
        	if(this.runstate == 1){
    	   	    this.elapsed = 'Stop: '+window.localODB.elapsed;
    	    } else {
                this.elapsed = 'Up: ';
                this.binaryStart = window.localODB.binaryStart;
                var date = new Date(); 
                var now = date.getTime() / 1000;
                var uptime = now - this.binaryStart;
                var hours = Math.floor(uptime / 3600);
                var minutes = Math.floor( (uptime%3600)/60 );
                var seconds = Math.floor(uptime%60);
                this.elapsed += hours + ' h, ' + minutes + ' m, ' + seconds +' s'
  		    }

            //run comment
            this.comment = window.localODB.comment;

            document.getElementById(this.runInfoID).innerHTML = '<br>' + this.runInfo + '<br>' + this.startInfo + '<br>' + this.elapsed + '<br><br>' + this.comment + '<br><br>';
        }

        //JSONP monitor:
        var JSONPtext = 'JSONP Services<br>';
        JSONPtext += 'Thresholds: ';
        JSONPtext += window.JSONPstatus[0]+'<br>';
        JSONPtext += 'Rates: ';
        JSONPtext += window.JSONPstatus[1]+'<br>';
        document.getElementById('JSONPmonitor').innerHTML = JSONPtext;
        
        //message service:
        if(!window.parameters.MIDASlegacyMode){
            //var messages = ODBGetMsg(5);
            for(i=0; i<5; i++){
                document.getElementById('message'+i).innerHTML = window.localODB.messages[4-i]; //most recent on top
            }
        }
        
        //pull in status table from traditional status page, and put it in the TT: - disabled until id's available in MIDAS
        if(!window.parameters.MIDASlegacyMode && 1==0){
            $.get(window.parameters.statusURL, function(response){
                var i, headStart, headEnd = '', rowNode;

                //remove the <head> before html is parsed: (todo: oneline this with regex and replace?)
                i=0;
                while(headEnd==''){
                    if(response[i] == '<' && response[i+1] == 'h' && response[i+2] == 'e' && response[i+3] == 'a' && response[i+4] == 'd' && response[i+5] == '>' )
                        headStart = i;
                    else if (response[i] == '<' && response[i+1] == '/' && response[i+2] == 'h' && response[i+3] == 'e' && response[i+4] == 'a' && response[i+5] == 'd' && response[i+6] == '>' )
                        headEnd = i+7;
                    i++;
                }
                response = response.slice(0, headStart) + response.slice(headEnd, response.length);

                //change some colors - tags don't have IDs so easiest to do this as text:
                response = response.replace(/#E0E0FF/g, '#333333');

                //replace some font colors to make them legible against their backgrounds
                response = response.replace(/bgcolor="#00FF00"/g, 'bgcolor="#00FF00" style="color:#000000;"'); //green backgrounds
                response = response.replace(/bgcolor="00FF00"/g, 'bgcolor="#00FF00" style="color:#000000;"'); //green backgrounds, sometimes MIDAS leaves off the hash...
                response = response.replace(/bgcolor=#00FF00/g, 'bgcolor="#00FF00" style="color:#000000;"'); //green backgrounds, sometimes MIDAS leaves off the quotes...
                response = response.replace(/bgcolor="#FFFF00"/g, 'bgcolor="#FFFF00" style="color:#000000;"'); //yellow backgrounds
                response = response.replace(/bgcolor="FFFF00"/g, 'bgcolor="#FFFF00" style="color:#000000;"'); //yellow backgrounds, sometimes MIDAS leaves off the hash...
                response = response.replace(/bgcolor=#FFFF00/g, 'bgcolor="#FFFF00" style="color:#000000;"'); //yellow backgrounds, sometimes MIDAS leaves off the quotes...

                //stick the result in the TT - html parsing happens now:
                //document.getElementById('leftSidebarTT').innerHTML = response;
                /*
                //now strip out unwanted table elements, easiest to do after html parsing:
                var rowTags = getTag('tr', 'leftSidebarTT');
                if(rowTags){
                    for(i=0; i<4; i++){
                        rowTags[0].id = 'rowNodeID';
                        rowNode = document.getElementById('rowNodeID');
                        rowNode.parentNode.removeChild(rowNode);                    
                    }
                }

                $('#leftSidebarTT').css('padding', 0);
                */
            });

        }
        
    };

    this.findCell = function(event){
    	if(!window.parameters.MIDASlegacyMode)return 1;
        else return -1;
    };

    this.defineText = function(cell){        
        return 0;
    };

    this.update();

}//the subsystem object from which all subsystems will inherit.
function Subsystem(){
	var that = this;

	//names of things
	this.monitorID = window.parameters.wrapper;		//div ID of wrapper div
	this.linkWrapperID = 'SubsystemLinks';	        //ID of div wrapping subsystem navigation links
	this.sidebarID = 'SubsystemSidebar';			//ID of right sidebar for this object
	this.topNavID = 'SubsystemsButton';				//ID of top level nav button
	this.canvasID = this.name+'Canvas';		        //ID of canvas to draw main view on; this.name defined downstream in prototype chain
    this.subviewLink = this.name+'link';            //ID of inter-subsystem nav button
    this.TTcanvasID = this.name+'TTCanvas';         //ID of hidden tooltip map canvas for main view

    //other member data
    this.prefix = window.parameters[this.name].prefix;
    this.postfix = window.parameters[this.name].postfix;
    this.TTlayerDone = 0;                           //set to 1 when TT layer painted, don't paint again.

    //animation parameters
    this.FPS = 30;
    this.duration = 0.5;
    this.nFrames = this.FPS*this.duration;
    
    //DOM insertions
    //insert nav link
	insertDOM('button', this.name+'link', 'navLink', '', this.linkWrapperID, function(){ swapFade(this.id, this.parentPointer, window.subsystemScalars); rePaint();}, this.name, '', 'button');
    document.getElementById(this.name+'link').parentPointer = this;
    //scale canvas
	this.monitor = document.getElementById(this.monitorID);
    this.canvasWidth = 0.48*$(this.monitor).width();
    this.canvasHeight = 0.8*$(this.monitor).height();
    //detector view
    insertDOM('canvas', this.canvasID, 'monitor', 'top:' + ($('#'+this.linkWrapperID).height()*1.25 + 5) +'px;', this.monitorID, '', '')
    this.canvas = document.getElementById(this.canvasID);
    this.context = this.canvas.getContext('2d');
    this.canvas.setAttribute('width', this.canvasWidth);
    this.canvas.setAttribute('height', this.canvasHeight);
    //hidden Tooltip map layer
    insertDOM('canvas', this.TTcanvasID, 'monitor', 'top:' + ($('#'+this.linkWrapperID).height()*1.25 + 5) +'px;', this.monitorID, '', '')    
    this.TTcanvas = document.getElementById(this.TTcanvasID);
    this.TTcontext = this.TTcanvas.getContext('2d');
    this.TTcanvas.setAttribute('width', this.canvasWidth);
    this.TTcanvas.setAttribute('height', this.canvasHeight);

    //Dirty trick to implement tooltip on arbitrary geometry: make another canvas of the same size hidden beneath, with the 
    //detector drawn on it, but with each element filled in with rgba(0,0,n,1), where n is the channel number; fetching the color from the 
    //hidden canvas at point x,y will then return the appropriate channel index.
    //paint whole hidden canvas with R!=G!=B to trigger TT suppression:
    this.TTcontext.fillStyle = '#123456';
    this.TTcontext.fillRect(0,0,this.canvasWidth, this.canvasHeight);

    //set up tooltip:
    this.tooltip = new Tooltip(this.canvasID, this.name+'TT', this.monitorID, this.prefix, this.postfix);
    this.tooltip.obj = that;

    //what fraction of the canvas does the scale take up?  need this for onclick behavior:
    this.scaleHeight = this.canvasHeight*0.2;
    //set up scale adjust dialog:
    
    this.canvas.onclick = function(event){
        var y = event.pageY - that.canvas.offsetTop - that.monitor.offsetTop;
        if(y > that.canvasHeight - that.scaleHeight)
            parameterDialogue(that.name, [[that.name, window.parameters[that.name].minima[that.name][window.state.subdetectorView], window.parameters[that.name].maxima[that.name][window.state.subdetectorView], window.parameters.subdetectorUnit[window.state.subdetectorView], '/DashboardConfig/'+that.name+'/'+scaleType()+'[0]', '/DashboardConfig/'+that.name+'/'+scaleType()+'[1]']], window.parameters.subdetectorColors[window.state.subdetectorView]);
    }
    
    //member functions
    //determine which color <scalar> corresponds to
    this.parseColor = function(scalar, detector){
        var scale, limitIndex;

        if(scalar == 0xDEADBEEF) return 0xDEADBEEF

        limitIndex = (window.state.subdetectorView < 3) ? window.state.subdetectorView : window.state.subdetectorView-2;

        //how far along the scale are we?  Technically this will produce the wrong color for canvases not currently on display.
        if(window.parameters.detectorLogMode.SubsystemsButton){
            scale = (Math.log(scalar) - Math.log(window.parameters[this.name].minima[detector][limitIndex])) / (Math.log(window.parameters[this.name].maxima[detector][limitIndex]) - Math.log(window.parameters[this.name].minima[detector][limitIndex]));
        } else {
            scale = (scalar - window.parameters[this.name].minima[detector][limitIndex]) / (window.parameters[this.name].maxima[detector][limitIndex] - window.parameters[this.name].minima[detector][limitIndex]);
        }

        //different scales for different meters to aid visual recognition:
        if(window.state.subdetectorView==0) return scalepickr(scale, window.parameters.subdetectorColors[0]);
        else if(window.state.subdetectorView==1 || window.state.subdetectorView==3) return scalepickr(scale, window.parameters.subdetectorColors[1]);
        else if(window.state.subdetectorView==2 || window.state.subdetectorView==4) return scalepickr(scale, window.parameters.subdetectorColors[2]);
    };

    //draw the color scale
    this.drawScale = function(context, frame){
        var i, j, key, nKeys=0, label, limitIndex;
        var scaleFraction = 0.8  //fraction of canvas to span with the scale
        //clear the scale region
        context.clearRect(0, this.canvasHeight - this.scaleHeight, this.canvasWidth, this.canvasHeight);

        //compressed unit for scales, as a function of window.state.subdetectorView:
        var scaleUnit = [' k', String.fromCharCode(2406)+'10'+String.fromCharCode(179)+' ', ' k']

        //where in the array of minima / maxima will we find the appropriate limit:
        limitIndex = (window.state.subdetectorView < 3) ? window.state.subdetectorView : window.state.subdetectorView-2;

        //define the strings to use for each minima and maxima label:
        var minTicks = [];
        var maxTicks = [];
        title = window.parameters.monitorValues[limitIndex];
        if(window.parameters.detectorLogMode.SubsystemsButton) title = 'log(' + title + ')';
        for(key in window.parameters[this.name].minima){
            if(window.parameters.detectorLogMode.SubsystemsButton){
                //minimas
                minTicks[key] = key+': ' + Math.log(window.parameters[this.name].minima[key][limitIndex]).toFixed(1) + ' log(' + window.parameters.subdetectorUnit[limitIndex]+')';
                //maximas:
                maxTicks[key] = key+': ' + Math.log(window.parameters[this.name].maxima[key][limitIndex]).toFixed(1) + ' log(' + window.parameters.subdetectorUnit[limitIndex]+')';
            } else {
                //minimas
                if(window.parameters[this.name].minima[key][limitIndex] < 1000) minTicks[key] = key+': ' + window.parameters[this.name].minima[key][limitIndex] + ' ' + window.parameters.subdetectorUnit[limitIndex];
                else minTicks[key] = key + ': ' + window.parameters[this.name].minima[key][limitIndex]/1000 + scaleUnit[limitIndex] + window.parameters.subdetectorUnit[limitIndex];
                //maximas:
                if(window.parameters[this.name].maxima[key][limitIndex] < 1000) maxTicks[key] = key+': ' + window.parameters[this.name].maxima[key][limitIndex] + ' ' + window.parameters.subdetectorUnit[limitIndex];
                else maxTicks[key] = key + ': ' + window.parameters[this.name].maxima[key][limitIndex]/1000 + scaleUnit[limitIndex] + window.parameters.subdetectorUnit[limitIndex];
            }
            nKeys++;
        }

        //titles
        context.fillStyle = '#999999';
        context.font="24px 'Orbitron'";
        context.fillText(title, this.canvasWidth/2 - context.measureText(title).width/2, this.canvasHeight*0.95);

        //tickmark;
        context.strokeStyle = '#999999';
        context.lineWidth = 1;
        context.font="12px 'Raleway'";

        //min tick
        context.beginPath();
        context.moveTo(this.canvasWidth*(1-scaleFraction)/2+1, this.canvasHeight - this.scaleHeight/2);
        context.lineTo(this.canvasWidth*(1-scaleFraction)/2+1, this.canvasHeight - this.scaleHeight/2 + 10);
        context.stroke();
        i=0;
        for(key in window.parameters[this.name].minima){
            label = (nKeys == 1) ? minTicks[key].slice(minTicks[key].indexOf(':')+2, minTicks[key].length+1) : minTicks[key];
            context.fillText( label, this.canvasWidth*(1-scaleFraction)/2 - context.measureText(label).width/2, this.canvasHeight-this.scaleHeight/2 + 25+12*i);
            i++;
        }

        //max tick
        context.beginPath();
        context.moveTo(this.canvasWidth*(1-(1-scaleFraction)/2)-1, this.canvasHeight - this.scaleHeight/2);
        context.lineTo(this.canvasWidth*(1-(1-scaleFraction)/2)-1, this.canvasHeight - this.scaleHeight/2 + 10); 
        context.stroke();
        i=0;
        for(key in window.parameters[this.name].minima){
            label = (nKeys == 1) ? maxTicks[key].slice(maxTicks[key].indexOf(':')+2, maxTicks[key].length+1) : maxTicks[key]
            context.fillText(label, this.canvasWidth*(1-(1-scaleFraction)/2) - context.measureText(label).width/2, this.canvasHeight-this.scaleHeight/2 + 25+12*i);
            i++;
        }

        var colorSteps = 150
        for(i=0; i<3*colorSteps; i++){
            if(window.state.subdetectorView == 0) context.fillStyle = scalepickr((i%colorSteps)/colorSteps, window.parameters.subdetectorColors[0]);
            if(window.state.subdetectorView == 1 || window.state.subdetectorView == 3) context.fillStyle = scalepickr((i%colorSteps)/colorSteps, window.parameters.subdetectorColors[1]);
            if(window.state.subdetectorView == 2 || window.state.subdetectorView == 4) context.fillStyle = scalepickr((i%colorSteps)/colorSteps, window.parameters.subdetectorColors[2]);
            context.fillRect(this.canvasWidth*(1-scaleFraction)/2 + this.canvasWidth*scaleFraction/colorSteps*(i%colorSteps), this.canvasHeight-this.scaleHeight/2-20, this.canvasWidth*scaleFraction/colorSteps, 20);
        }

    };

    //decide which view to transition to when this object is navigated to
    this.view = function(){
        return this.canvasID;
    };

    //determine the cell index at canvas position x, y
    this.findCell = function(x, y){
        var imageData = this.TTcontext.getImageData(x,y,1,1);
        var index = -1;
        if(imageData.data[0] == imageData.data[1] && imageData.data[0] == imageData.data[2]) index = imageData.data[0];
        return index;
    };

    //manage animation
    this.animate = function(){
        if(window.onDisplay == this.canvasID) animate(this, 0);
    };

    //make the base HV / thresholds / rate summary text for the tooltip
    this.baseTTtext = function(HV, thresh, rate, HVB){
        var nextLine, toolTipContent;
        toolTipContent = '';

        //HV
        if(arguments.length == 4){
            nextLine = window.parameters.monitorValues[0] + '-A: ';
            nextLine += HV.toFixed() + ' ' + window.parameters.subdetectorUnit[0];
            toolTipContent += nextLine + '<br>';
            nextLine = window.parameters.monitorValues[0] + '-B: ';
            nextLine += HVB.toFixed() + ' ' + window.parameters.subdetectorUnit[0];
            toolTipContent += nextLine + '<br>';
        } else if(arguments.length == 3){
            nextLine = window.parameters.monitorValues[0] + ': ';
            nextLine += HV.toFixed() + ' ' + window.parameters.subdetectorUnit[0];
            toolTipContent += nextLine + '<br>';            
        }

        //Thresholds
        nextLine = window.parameters.monitorValues[1] + ': ';
        if(thresh >= 0xDEADBEEF) nextLine += 'Not Reporting';
        else nextLine += thresh.toFixed() + ' ' + window.parameters.subdetectorUnit[1];
        toolTipContent += nextLine + '<br>';
        //Rate
        nextLine = window.parameters.monitorValues[2] + ': ';
        if(rate >= 0xDEADBEEF) nextLine += 'Not Reporting';
        else nextLine += rate.toFixed() + ' ' + window.parameters.subdetectorUnit[2];
        toolTipContent += nextLine;

        return toolTipContent;
    };

    //a more generic tt text.  lines is an array, where each entry is another array packed as [prefix, value, suffix]
    this.TTtext = function(lines){
        var i, nextLine, toolTipContent;
        toolTipContent = '';

        for(i=0; i<lines.length; i++){
            nextLine = lines[i][0] + ': ';
            nextLine += lines[i][1].toFixed() + ' ' + lines[i][2];
            toolTipContent += nextLine + '<br>'
        }

        return toolTipContent;
    };

    //simple data fetcher.  Some subsystems will have more sophisticated data routing.
    this.fetchNewData = function(){
        
        var key;

        for(key in this.dataBus[this.name]){
            
            if(window.JSONPstore['thresholds']){
                if(typeof window.JSONPstore['thresholds'][key] == 'number')
                    this.dataBus[this.name][key]['threshold'] = window.JSONPstore['thresholds'][key];
            }

            if(window.JSONPstore['scalar']){
                if(window.JSONPstore['scalar'][key]){
                    if(typeof window.JSONPstore['scalar'][key]['TRIGREQ'] == 'number')
                        this.dataBus[this.name][key]['rate'] = window.JSONPstore['scalar'][key]['TRIGREQ'];
                }
            }

        }
        
    };

    //generic update routine.  Again, some subsystems are more complcated versions of this:
    this.update = function(){
        var key;

        //get new data
        this.fetchNewData();

        //parse the new data into colors
        for(key in this.dataBus[this.name]){
            this.dataBus[this.name][key].oldHVcolor = this.dataBus[this.name][key].HVcolor;
            this.dataBus[this.name][key].HVcolor = this.parseColor(this.dataBus[this.name][key].HV, this.detectorType(key));
            this.dataBus[this.name][key].oldThresholdColor = this.dataBus[this.name][key].thresholdColor;
            this.dataBus[this.name][key].thresholdColor = this.parseColor(this.dataBus[this.name][key].threshold, this.detectorType(key));
            this.dataBus[this.name][key].oldRateColor = this.dataBus[this.name][key].rateColor;
            this.dataBus[this.name][key].rateColor = this.parseColor(this.dataBus[this.name][key].rate, this.detectorType(key));
        }

        //do the same for the summary level, if it exists:
        if(this.dataBus.summary){
            for(key in this.dataBus.summary){
                this.dataBus.summary[key].oldHVcolor = this.dataBus.summary[key].HVcolor;
                this.dataBus.summary[key].HVcolor = this.parseColor(this.dataBus.summary[key].HV, this.detectorType(key));
                this.dataBus.summary[key].oldThresholdColor = this.dataBus.summary[key].thresholdColor;
                this.dataBus.summary[key].thresholdColor = this.parseColor(this.dataBus.summary[key].threshold, this.detectorType(key));
                this.dataBus.summary[key].oldRateColor = this.dataBus.summary[key].rateColor;
                this.dataBus.summary[key].rateColor = this.parseColor(this.dataBus.summary[key].rate, this.detectorType(key));
            }            
        }

        //update tooltip
        this.tooltip.update();
        //update detail level tooltip if it exists:
        if(this.detailTooltip)
            this.detailTooltip.update();

        //animate if on top:
        this.animate();

    };

    //return the detector code from the parameters store that corresponds to the input detector <name> - trivial case
    //here will work for subsystems with only one kind of element like DESCANT or SHARC, 
    //subsystems with multiple detector types like DANTE and TIP will have to define their own.
    this.detectorType = function(name){
        return this.name;
    };
    
    //write the simplest possible subsystem tooltip contents:
    this.defineText = function(cell){
        
        var key, nextLine, toolTipContent;

        toolTipContent = '<br>'
        key = this.dataBus.TTmap[cell];
        nextLine = key;
        toolTipContent += nextLine + '<br><br>';
        toolTipContent += this.baseTTtext(this.dataBus[this.name][key].HV, this.dataBus[this.name][key].threshold, this.dataBus[this.name][key].rate);
        toolTipContent += '<br><br>'

        document.getElementById(this.tooltip.ttDivID).innerHTML = toolTipContent;
        
    };
    
}









//another object to inject into subsystems that need a detail-level view:
function DetailView(){
    var that = this;
    this.detailCanvasID = this.name+'detailCanvas';       //ID of canvas to draw single HPGe view on
    this.TTdetailCanvasID = this.name+'TTdetailCanvas';   //ID of hidden tooltip map canvas for detail level
    this.TTdetailLayerDone = 0;

    //insert & scale canvas
    insertDOM('canvas', this.detailCanvasID, 'monitor', 'top:' + ($('#'+this.linkWrapperID).height()*1.25 + 5) +'px; transition:opacity 0.5s, z-index 0.5s; -moz-transition:opacity 0.5s, z-index 0.5s; -webkit-transition:opacity 0.5s, z-index 0.5s;', this.monitorID, '', '');
    this.detailCanvas = document.getElementById(this.detailCanvasID);
    this.detailContext = this.detailCanvas.getContext('2d');
    this.detailCanvas.setAttribute('width', this.canvasWidth);
    this.detailCanvas.setAttribute('height', this.canvasHeight);
    //hidden Tooltip map layer for detail
    insertDOM('canvas', this.TTdetailCanvasID, 'monitor', 'top:' + ($('#'+this.linkWrapperID).height()*1.25 + 5) +'px;', this.monitorID, '', '')
    this.TTdetailCanvas = document.getElementById(this.TTdetailCanvasID);
    this.TTdetailContext = this.TTdetailCanvas.getContext('2d');
    this.TTdetailCanvas.setAttribute('width', this.canvasWidth);
    this.TTdetailCanvas.setAttribute('height', this.canvasHeight);

    //detail level tt:
    //paint whole hidden canvas with R!=G!=B to trigger TT suppression:
    this.TTdetailContext.fillStyle = 'rgba(50,100,150,1)';
    this.TTdetailContext.fillRect(0,0,this.canvasWidth, this.canvasHeight);
    //set up detail tooltip:
    this.detailTooltip = new Tooltip(this.detailCanvasID, this.name+'TTdetail', this.monitorID, window.parameters.HPGeprefix, window.parameters.HPGepostfix);
    this.detailTooltip.obj = that;

    //onclick switch between top and detail view - only appropriate for detectors with a single scale (so ie not HPGe, which has HPGe+BGO)
    this.detailCanvas.onclick = function(event){
                                    var y = event.pageY - that.canvas.offsetTop - that.monitor.offsetTop;    
                                    if(y < that.canvasHeight - that.scaleHeight){
                                        that.detailShowing = 0;
                                        swapFade(null, that, 1000);
                                    } else{
                                        parameterDialogue(that.name, [[that.name, window.parameters[that.name].minima[that.name][window.state.subdetectorView], window.parameters[that.name].maxima[that.name][window.state.subdetectorView], window.parameters.subdetectorUnit[window.state.subdetectorView], '/DashboardConfig/'+that.name+'/'+scaleType()+'[0]', '/DashboardConfig/'+that.name+'/'+scaleType()+'[1]']], window.parameters.subdetectorColors[window.state.subdetectorView]);
                                    }
                                };
    this.canvas.onclick =   function(event){
                                //use TT layer to decide which detail group user clicked on
                                var detailClicked = -1;
                                var x,y;
                                x = event.pageX - that.canvas.offsetLeft - that.monitor.offsetLeft;
                                y = event.pageY - that.canvas.offsetTop - that.monitor.offsetTop;
                                detailClicked = that.findCell(x,y);
                                //draw and swap out if user clicked on a valid detail group
                                if(detailClicked != -1){
                                    //detailClicked = Math.floor( (detailClicked - 108) / 8)+1;  //transformation from HPGe implementation of this, drop in general?
                                    that.detailShowing = detailClicked;
                                    that.TTdetailLayerDone = 0 //get ready to draw a new TT layer for the detail view
                                    //draw detail chooses which detail group to draw as a function of that.detailShowing:
                                    that.drawDetail(0,that.nFrames);  //draw detail wants a context for first arg, eliminate
                                    //that.detailShowing = 1;
                                    swapFade(null, that, 1000)
                                } else if(y > that.canvasHeight - that.scaleHeight){
                                    parameterDialogue(that.name, [[that.name, window.parameters[that.name].minima[that.name][window.state.subdetectorView], window.parameters[that.name].maxima[that.name][window.state.subdetectorView], window.parameters.subdetectorUnit[window.state.subdetectorView], '/DashboardConfig/'+that.name+'/'+scaleType()+'[0]', '/DashboardConfig/'+that.name+'/'+scaleType()+'[1]']], window.parameters.subdetectorColors[window.state.subdetectorView]);
                                }
                            };

    //member functions
    //decide which view to transition to when this object is navigated to; overwrites equivalent in Subsystem.
    this.view = function(){
        if(this.detailShowing == 0)
            return this.canvasID;
        else if(this.detailShowing > 0)
            return this.detailCanvasID;
    };

    //determine the cell index at canvas position x, y; overwrites equivalent in Subsystem.
    this.findCell = function(x, y){
        var imageData 
        if(this.detailShowing){
            imageData = this.TTdetailContext.getImageData(x,y,1,1);
        } else{
            imageData = this.TTcontext.getImageData(x,y,1,1);
        }
        var index = -1;
        if(imageData.data[0] == imageData.data[1] && imageData.data[0] == imageData.data[2]) index = imageData.data[0];

        return index;
    };

    //manage animation
    this.animate = function(){
        if(window.onDisplay == this.canvasID) animate(this, 0);
        if(window.onDisplay == this.detailCanvasID) animateDetail(this, 0);
    };

    //decide which display version to show: (depricated?)
    this.displaySwitch = function(){
        this.TTdetailContext.fillStyle = 'rgba(50,100,150,1)';
        this.TTdetailContext.fillRect(0,0,this.canvasWidth,this.canvasHeight);
        this.drawDetail(this.detailContext, this.nFrames);
        this.drawDetail(this.TTdetailContext, this.nFrames);
    };

}








//function wrapping all the specialized drawing tools for HPGe displays:
function HPGeAssets(){
    //draw crystal core
    this.crystalCore = function(context, x0, y0, border, fill){
        context.strokeStyle = border;
        context.fillStyle = fill;
        context.fillRect(Math.round(x0), Math.round(y0), Math.round(this.crystalSide/3), Math.round(this.crystalSide/3));
        if(context == this.context || context == this.detailContext) context.stroke();
    };

    //draw HV box for one cloverleaf:
    this.crystal = function(context, x0, y0, border, fill){
        context.strokeStyle = border;
        context.fillStyle = fill;
        context.fillRect(Math.round(x0), Math.round(y0), Math.round(this.crystalSide), Math.round(this.crystalSide));
        if(context == this.context || context == this.detailContext){
            context.strokeRect(x0, y0, this.crystalSide, this.crystalSide);
        }

    }; 

    //draw split crystal for HV view
    this.splitCrystal = function(context, x0, y0, side, cloverLeaf, border, fill, fillB){
        //antialiasing hack: draw this first on the tooltip level
        if(context == this.TTdetailContext && fill != '#123456'){
            this.splitCrystal(context, x0, y0, side, border, '#123456', '#123456');
        }

        context.save();
        context.translate(x0+side/2, y0+side/2);
        context.rotate(Math.PI/2*cloverLeaf);
        context.strokeStyle = border;

        context.fillStyle = fill;
        context.beginPath();
        context.moveTo(side/2,-side/2);
        context.lineTo(-side/2,-side/2);
        context.lineTo(-side/2,side/2);
        context.closePath();
        context.fill();
        if(context == this.context || context == this.detailContext) context.stroke();

        context.fillStyle = fillB;
        context.beginPath();
        context.moveTo(side/2,-side/2);
        context.lineTo(side/2,side/2);
        context.lineTo(-side/2,side/2);
        context.closePath();
        context.fill();
        if(context == this.context || context == this.detailContext) context.stroke();
        
        context.restore();
    };

    //draw L shape
    this.drawL = function(context, phi, thickness, length, x0, y0, border, fill){
        //antialiasing hack: draw this first on the tooltip level
        if(context == this.TTdetailContext && fill != '#123456'){
            this.drawL(context, phi, thickness, length, x0, y0, border, '#123456');
        }

        context.strokeStyle = border;
        context.fillStyle = fill;
        context.save();
        context.translate(Math.round(x0), Math.round(y0));
        context.rotate(phi);

        context.beginPath();
        context.moveTo(0,0);
        context.lineTo(Math.round(length), 0);
        context.lineTo(Math.round(length), Math.round(thickness));
        context.lineTo(Math.round(thickness), Math.round(thickness));
        context.lineTo(Math.round(thickness), Math.round(length));
        context.lineTo(0,Math.round(length));
        context.closePath();
        context.fill();
        if(context == this.context || context == this.detailContext) context.stroke();

        context.restore();

    };

    //draw half-L
    this.drawHalfL = function(context, phi, thickness, length, x0, y0, chirality, split, border, fill, fillB){
        //antialiasing hack: draw this first on the tooltip level
        if(context == this.TTdetailContext && fill != '#123456'){
            this.drawHalfL(context, phi, thickness, length, x0, y0, chirality, split, border, '#123456', '#123456');
        }

        context.save();
        context.strokeStyle = border;
        context.fillStyle = fill;
        context.translate(x0, y0);
        context.rotate(phi);

        if(chirality == 'left'){
            context.translate(this.detailContext.width,0);
            context.scale(-1,1);   
        }

        if(split){
            context.beginPath();
            context.moveTo((length-thickness)/2,0);
            context.lineTo(length-thickness, 0);
            context.lineTo(length-thickness, -thickness);
            context.lineTo((length-thickness)/2,-thickness);
            context.closePath();
            context.fill();
            if(context == this.context || context == this.detailContext) context.stroke();

            context.fillStyle = fillB;
            context.beginPath();
            context.moveTo(0,0);
            context.lineTo((length-thickness)/2,0);
            context.lineTo((length-thickness)/2,-thickness);
            context.lineTo(-thickness, -thickness);
            context.closePath();
            context.fill();
            if(context == this.context || context == this.detailContext) context.stroke();
        } else{
            context.beginPath();
            context.moveTo(0,0);
            context.lineTo(length-thickness, 0);
            context.lineTo(length-thickness, -thickness);
            context.lineTo(-thickness, -thickness);
            context.closePath();
            context.fill();
            if(context == this.context || context == this.detailContext) context.stroke();
        }

        context.restore();
    };

    this.drawHPGesummary = function(context, x0,y0, cloverSummaryKey, frame){
        var key, i, q, iprime;
        var color1, color2, fillColor;

        for(q=0; q<4; q++){
            key = cloverSummaryKey + this.dataBus.colorQuads[q];
            i = this.dataBus.summary[key].quadrant;
            if(i==3) i = 2;
            else if(i==2) i = 3;
            
            if(key[2] == 'G'){
                //HPGE
                if(context == this.TTcontext){
                    iprime = 100+this.dataBus.summary[key].clover*8+i;
                    context.fillStyle = 'rgba('+iprime+','+iprime+','+iprime+',1)';
                } else{
                    if(window.state.subdetectorView == 0){
                        color1 = parseHexColor(this.dataBus.summary[key].oldHVcolor);
                        color2 = parseHexColor(this.dataBus.summary[key].HVcolor);
                    } else if(window.state.subdetectorView == 1){
                        color1 = parseHexColor(this.dataBus.summary[key].oldThresholdColor);
                        color2 = parseHexColor(this.dataBus.summary[key].thresholdColor);
                    } else if(window.state.subdetectorView == 2){
                        color1 = parseHexColor(this.dataBus.summary[key].oldRateColor);
                        color2 = parseHexColor(this.dataBus.summary[key].rateColor);
                    }
                    context.fillStyle = interpolateColor(color1, color2, frame/this.nFrames);
                    if(interpolateColor(color1, color2, frame/this.nFrames) == 0xDEADBEEF)
                        context.fillStyle = context.createPattern(window.parameters.warningFill, 'repeat');
                }
                if( window.parameters.cloversAbsent.indexOf(parseInt(cloverSummaryKey.slice(3,5),10)) != -1 && context!= this.TTcontext)
                    context.fillStyle = '#333333' //absent clovers transparent

                context.fillRect(Math.round(x0 + (this.BGOouter-this.HPGeside)/2 + (i%2)*(this.lineWeight + this.HPGeside/2)), Math.round(y0 + (this.BGOouter-this.HPGeside)/2 + (i>>1)/2*(2*this.lineWeight + this.HPGeside)), Math.round(this.HPGeside/2),Math.round(this.HPGeside/2));
                if(context != this.TTcontext){
                    context.strokeStyle = '#999999';
                    context.strokeRect(x0 + (this.BGOouter-this.HPGeside)/2 + (i%2)*(this.lineWeight + this.HPGeside/2), y0 + (this.BGOouter-this.HPGeside)/2 + (i>>1)/2*(2*this.lineWeight + this.HPGeside), this.HPGeside/2, this.HPGeside/2);
                }
            } else if(key[2] == 'S'){       
                //BGO
                var rotation 
                if(i<2) rotation = i*Math.PI/2;
                else if(i==2) rotation = 3*Math.PI/2;
                else if(i==3) rotation = Math.PI;
                var color = '#999999';
                if(context == this.TTcontext){
                    iprime = 100+this.dataBus.summary[key].clover*8+i+4;
                    fillColor = 'rgba('+iprime+','+iprime+','+iprime+',1)';
                } else{
                    if(window.state.subdetectorView == 0){
                        color1 = parseHexColor(this.dataBus.summary[key].oldHVcolor);
                        color2 = parseHexColor(this.dataBus.summary[key].HVcolor);
                    } else if(window.state.subdetectorView == 1){
                        color1 = parseHexColor(this.dataBus.summary[key].oldThresholdColor);
                        color2 = parseHexColor(this.dataBus.summary[key].thresholdColor);
                    } else if(window.state.subdetectorView == 2){
                        color1 = parseHexColor(this.dataBus.summary[key].oldRateColor);
                        color2 = parseHexColor(this.dataBus.summary[key].rateColor);
                    }
                    fillColor = interpolateColor(color1, color2, frame/this.nFrames);
                    if(fillColor == 0xDEADBEEF)
                        fillColor = context.createPattern(window.parameters.warningFill, 'repeat');
                    if( window.parameters.cloversAbsent.indexOf(parseInt(cloverSummaryKey.slice(3,5),10)) != -1 )
                    fillColor = '#333333' //absent clovers transparent
                }

                this.drawL(context, rotation, Math.round((this.BGOouter - this.BGOinner)/2), Math.round(this.BGOouter/2), Math.round(x0 + (this.BGOouter+this.lineWeight)*(i%2)), Math.round(y0 + (this.BGOouter+this.lineWeight)*(i>>1)), color, fillColor);
            }
            
        }

    };

    this.drawDetail = function(context, frame){
        
        if(context==this.TTdetailContext && this.TTdetailLayerDone) return 0; //only draw the TT layer once

        var i, j, quad;

        //state variables select the segmentation state of HPGe and services of BGO 
        var HPGestate, BGOstate;

        this.detailContext.lineWidth = this.lineWeight;

        //colorWheel enumerates the standard configuration of color sectors:
        var colorWheel =  ['#999999','#999999','#999999','#999999'];//['#00FF00', '#0000FF', '#FFFFFF', '#FF0000'];
        //orientation enumerates orientations of half-BGOs
        var orientation = ['left', 'right'];

        var fillColor, fillColor2;
        var pfx = (this.mode == 'TIGRESS') ? 'TI' : 'GR';

        //clover HPGe and BGO keys:
        var HPGeName = pfx+'G'+ ( (this.cloverShowing<10) ? '0'+this.cloverShowing : this.cloverShowing );
        var BGOname  = pfx+'S'+ ( (this.cloverShowing<10) ? '0'+this.cloverShowing : this.cloverShowing );
        var HPGeKey, BGOkey, BGOsuffix;

        if(window.state.subdetectorView == 0){
            HPGestate = 0; //no segmentation
            BGOstate = 1;  //two services per sector per side per suppressor
        }else if(window.state.subdetectorView == 1 || window.state.subdetectorView == 2){
            HPGestate = 1; //9-element segmentation
            BGOstate = 0;  //one service per sector per side per suppressor
        }
        
        //loop over quadrents:
        for(i=0; i<4; i++){
            
            //useful switches:
            var PBC = Math.ceil((i%3)/3);               //positive for i=1,2, 0 OW
            var NAD = Math.ceil((i%3)/3) - 1;           //negative for i=0,3, 0 OW
            var NAB = Math.floor(i/2) - 1;              //negative for i=0,1, 0 OW
            var PCD = Math.floor(i/2);                  //positive for i=2,3, 0 OW

            //append quadrant color to keys:
            HPGeKey = HPGeName + this.dataBus.colorQuads[i];
            BGOkey = BGOname + this.dataBus.colorQuads[i];

            //HPGe/////////////////////////////
            if(HPGestate == 0){
                
                if(context == this.detailContext){
                    fillColor  =  interpolateColor(parseHexColor(this.dataBus.HPGe[HPGeKey+'N00A'].oldHVcolor), parseHexColor(this.dataBus.HPGe[HPGeKey+'N00A'].HVcolor), frame/this.nFrames);
                } else{
                    fillColor  = 'rgba('+i+', '+i+', '+i+', 1)';
                }
                this.crystal(context, this.centerX + PBC*this.lineWeight + NAD*this.crystalSide, this.centerY + NAB*this.crystalSide + PCD*this.lineWeight, colorWheel[i], fillColor);
                
            } else if(HPGestate == 1){
                
                if(this.mode == 'TIGRESS'){

                    //cores - same as GRIFFIN for core, factor out
                    if(context == this.detailContext){
                        if(window.state.subdetectorView == 1){
                            fillColor  = interpolateColor(parseHexColor(this.dataBus.HPGe[HPGeKey+'N00A'].oldThresholdColor), parseHexColor(this.dataBus.HPGe[HPGeKey+'N00A'].thresholdColor), frame/this.nFrames );
                            fillColor2 = interpolateColor(parseHexColor(this.dataBus.HPGe[HPGeKey+'N00B'].oldThresholdColor), parseHexColor(this.dataBus.HPGe[HPGeKey+'N00B'].thresholdColor), frame/this.nFrames );
                        }
                        else if(window.state.subdetectorView == 2){ 
                            fillColor  = interpolateColor(parseHexColor(this.dataBus.HPGe[HPGeKey+'N00A'].oldRateColor), parseHexColor(this.dataBus.HPGe[HPGeKey+'N00A'].rateColor), frame/this.nFrames );
                            fillColor2 = interpolateColor(parseHexColor(this.dataBus.HPGe[HPGeKey+'N00B'].oldRateColor), parseHexColor(this.dataBus.HPGe[HPGeKey+'N00B'].rateColor), frame/this.nFrames );
                        }
                        if(fillColor==0xDEADBEEF) fillColor = this.detailContext.createPattern(window.parameters.warningFill, 'repeat');
                        if(fillColor2==0xDEADBEEF) fillColor2 = this.detailContext.createPattern(window.parameters.warningFill, 'repeat');
                    } else {
                        fillColor  = 'rgba('+10*i+', '+10*i+', '+10*i+', 1)';
                        fillColor2 = 'rgba('+(10*i+1)+', '+(10*i+1)+', '+(10*i+1)+', 1)';
                    }

                    this.splitCrystal(context, this.centerX + NAD*2/3*this.crystalSide + PBC*1/3*this.crystalSide + PBC*this.lineWeight, this.centerY + NAB*2/3*this.crystalSide + PCD*1/3*this.crystalSide + PCD*this.lineWeight, this.crystalSide/3, i, colorWheel[i], fillColor, fillColor2);

                    for(j=0; j<4; j++){
                        //useful switches:
                        var PBC2 = Math.ceil((j%3)/3);               //positive for i=1,2, 0 OW
                        var NAD2 = Math.ceil((j%3)/3) - 1;           //negative for i=0,3, 0 OW
                        var NAB2 = Math.floor(j/2) - 1;              //negative for i=0,1, 0 OW
                        var PCD2 = Math.floor(j/2);                  //positive for i=2,3, 0 OW
                        //segements drawn in different order than numbering; use jprime to get the right mapping:
                        var jprime = (((1-j)+4)%4 + i)%4;
                        if (jprime==0) jprime = 4;

                        //segs 1-4
                        if(context == this.detailContext){
                            if(window.state.subdetectorView == 1) fillColor = interpolateColor(parseHexColor(this.dataBus.HPGe[HPGeKey+'P0'+jprime+'X'].oldThresholdColor), parseHexColor(this.dataBus.HPGe[HPGeKey+'P0'+jprime+'X'].thresholdColor), frame/this.nFrames);
                            else if(window.state.subdetectorView == 2) fillColor = interpolateColor(parseHexColor(this.dataBus.HPGe[HPGeKey+'P0'+jprime+'X'].oldRateColor), parseHexColor(this.dataBus.HPGe[HPGeKey+'P0'+jprime+'X'].rateColor), frame/this.nFrames);
                            if(fillColor==0xDEADBEEF) fillColor = this.detailContext.createPattern(window.parameters.warningFill, 'repeat');
                        } else
                            fillColor = 'rgba('+(this.nHPGesegments/4*i+jprime+1)+', '+(this.nHPGesegments/4*i+jprime+1)+', '+(this.nHPGesegments/4*i+jprime+1)+', 1)';
                        this.drawL(context, j*Math.PI/2, this.crystalSide/6, 1/3*this.crystalSide, this.centerX + PBC*this.lineWeight + NAD*(-NAD2)*5/6*this.crystalSide + NAD*PBC2*1/6*this.crystalSide + PBC*(-NAD2)*1/6*this.crystalSide + PBC*PBC2*5/6*this.crystalSide, this.centerY + NAB*(-NAB2)*5/6*this.crystalSide + NAB*PCD2*1/6*this.crystalSide + PCD*(-NAB2)*1/6*this.crystalSide + PCD*PCD2*5/6*this.crystalSide + PCD*this.lineWeight, colorWheel[i], fillColor);

                        //segs 5-8
                        if(context == this.detailContext){
                            if(window.state.subdetectorView == 1) fillColor = interpolateColor(parseHexColor(this.dataBus.HPGe[HPGeKey+'P0'+(jprime+4)+'X'].oldThresholdColor), parseHexColor(this.dataBus.HPGe[HPGeKey+'P0'+(jprime+4)+'X'].thresholdColor), frame/this.nFrames);
                            else if(window.state.subdetectorView == 2) fillColor = interpolateColor(parseHexColor(this.dataBus.HPGe[HPGeKey+'P0'+(jprime+4)+'X'].oldRateColor), parseHexColor(this.dataBus.HPGe[HPGeKey+'P0'+(jprime+4)+'X'].rateColor), frame/this.nFrames);
                            if(fillColor==0xDEADBEEF) fillColor = this.detailContext.createPattern(window.parameters.warningFill, 'repeat');
                        } else
                            fillColor = 'rgba('+(this.nHPGesegments/4*i+jprime+1+4)+', '+(this.nHPGesegments/4*i+jprime+1+4)+', '+(this.nHPGesegments/4*i+jprime+1+4)+', 1)';
                        this.drawL(context, j*Math.PI/2, this.crystalSide/6, this.crystalSide/2, this.centerX + (-NAD)*NAD2*this.crystalSide + PBC*PBC2*this.crystalSide + PBC*this.lineWeight, this.centerY + (-NAB)*NAB2*this.crystalSide + PCD*PCD2*this.crystalSide + PCD*this.lineWeight, colorWheel[i], fillColor);
                        
                    }

                    
                } else if(this.mode == 'GRIFFIN'){
                    
                    //cores
                    if(context == this.detailContext){
                        if(window.state.subdetectorView == 1){
                            fillColor  = interpolateColor(parseHexColor(this.dataBus.HPGe[HPGeKey+'N00A'].oldThresholdColor), parseHexColor(this.dataBus.HPGe[HPGeKey+'N00A'].thresholdColor), frame/this.nFrames );
                            fillColor2 = interpolateColor(parseHexColor(this.dataBus.HPGe[HPGeKey+'N00B'].oldThresholdColor), parseHexColor(this.dataBus.HPGe[HPGeKey+'N00B'].thresholdColor), frame/this.nFrames );
                        }
                        else if(window.state.subdetectorView == 2){ 
                            fillColor  = interpolateColor(parseHexColor(this.dataBus.HPGe[HPGeKey+'N00A'].oldRateColor), parseHexColor(this.dataBus.HPGe[HPGeKey+'N00A'].rateColor), frame/this.nFrames );
                            fillColor2 = interpolateColor(parseHexColor(this.dataBus.HPGe[HPGeKey+'N00B'].oldRateColor), parseHexColor(this.dataBus.HPGe[HPGeKey+'N00B'].rateColor), frame/this.nFrames );
                        }
                        if(fillColor==0xDEADBEEF) fillColor = this.detailContext.createPattern(window.parameters.warningFill, 'repeat');
                        if(fillColor2==0xDEADBEEF) fillColor2 = this.detailContext.createPattern(window.parameters.warningFill, 'repeat');
                    } else {
                        fillColor  = 'rgba('+2*i+', '+2*i+', '+2*i+', 1)';
                        fillColor2 = 'rgba('+(2*i+1)+', '+(2*i+1)+', '+(2*i+1)+', 1)';
                    }

                    this.splitCrystal(context, this.centerX + NAD*this.crystalSide + PBC*this.lineWeight, this.centerY + NAB*this.crystalSide + PCD*this.lineWeight, this.crystalSide, i, colorWheel[i], fillColor, fillColor2);                    
                    
                }
                
            }
            
            //BGO//////////////////////////////
            for(j=0; j<2; j++){
                //useful switches
                var NA = j-1;
                var NB = (-1)*j;
                var PA = (j+1)%2;
                var PB = j;

                //are we on channel A or B for HV?
                var HVchan = 'HVA';
                if(j==1) HVchan = 'HVB';

                //back suppressors
                if(context == this.detailContext){
                    if(window.state.subdetectorView == 0) fillColor = interpolateColor(parseHexColor(this.dataBus.HPGe[BGOkey+'N05X']['old'+HVchan+'color']), parseHexColor(this.dataBus.HPGe[BGOkey+'N05X'][HVchan+'color']), frame/this.nFrames);
                    else if(window.state.subdetectorView == 1) fillColor = interpolateColor(parseHexColor(this.dataBus.HPGe[BGOkey+'N05X'].oldThresholdColor), parseHexColor(this.dataBus.HPGe[BGOkey+'N05X'].thresholdColor), frame/this.nFrames);
                    else if(window.state.subdetectorView == 2) fillColor = interpolateColor(parseHexColor(this.dataBus.HPGe[BGOkey+'N05X'].oldRateColor), parseHexColor(this.dataBus.HPGe[BGOkey+'N05X'].rateColor), frame/this.nFrames);
                    if(fillColor==0xDEADBEEF) fillColor = this.detailContext.createPattern(window.parameters.warningFill, 'repeat');

                } else{
                    if(window.state.subdetectorView == 0){
                        fillColor  ='rgba('+(4+2*i+j)+', '+(4+2*i+j)+', '+(4+2*i+j)+', 1)';
                    }
                    else
                        fillColor = 'rgba('+(this.nHPGesegments+i)+', '+(this.nHPGesegments+i)+', '+(this.nHPGesegments+i)+', 1)';
                }
                if(window.state.subdetectorView == 0){
                    this.drawHalfL(context, (i-1+j)*(Math.PI/2), this.suppressorWidth, this.backBGOouterWidth/2, this.centerX + NAD*this.backBGOinnerWidth/2 + PBC*this.backBGOinnerWidth/2 + PBC*2*this.lineWeight + (-NAB)*NA*this.lineWeight + PCD*NB*this.lineWeight, this.centerY + (NAB+PCD)*this.backBGOinnerWidth/2 + PCD*2*this.lineWeight + (-NAD)*NB*this.lineWeight + PBC*NA*this.lineWeight, orientation[j], false, colorWheel[i], fillColor);
                } else if(window.state.subdetectorView == 1 || window.state.subdetectorView == 2){
                    if(j==0) this.drawL(context, i*(Math.PI/2), this.suppressorWidth, this.backBGOouterWidth/2, this.centerX + NAD*this.backBGOinnerWidth/2 + PBC*this.backBGOinnerWidth/2 + PBC*this.lineWeight + (NAD+PBC)*this.suppressorWidth, this.centerY + (NAB+PCD)*this.backBGOinnerWidth/2 + PCD*this.lineWeight + (NAB+PCD)*this.suppressorWidth, colorWheel[i], fillColor);    
                }
                
                //side suppressors
                BGOsuffix = 'N0'+(3+1-j)+'X'; //side suppressors labeled -N03X and -N04X j->1-j here since drawing happens in reverse order
                if(context == this.detailContext){
                    if(window.state.subdetectorView == 0){
                        fillColor  = interpolateColor(parseHexColor(this.dataBus.HPGe[BGOkey+BGOsuffix].oldHVAcolor), parseHexColor(this.dataBus.HPGe[BGOkey+BGOsuffix].HVAcolor), frame/this.nFrames);
                        fillColor2 = interpolateColor(parseHexColor(this.dataBus.HPGe[BGOkey+BGOsuffix].oldHVBcolor), parseHexColor(this.dataBus.HPGe[BGOkey+BGOsuffix].HVBcolor), frame/this.nFrames);
                    }
                    else if(window.state.subdetectorView == 1) fillColor = interpolateColor(parseHexColor(this.dataBus.HPGe[BGOkey+BGOsuffix].oldThresholdColor), parseHexColor(this.dataBus.HPGe[BGOkey+BGOsuffix].thresholdColor), frame/this.nFrames);
                    else if(window.state.subdetectorView == 2) fillColor = interpolateColor(parseHexColor(this.dataBus.HPGe[BGOkey+BGOsuffix].oldRateColor), parseHexColor(this.dataBus.HPGe[BGOkey+BGOsuffix].rateColor), frame/this.nFrames);
                    if(fillColor==0xDEADBEEF) fillColor = this.detailContext.createPattern(window.parameters.warningFill, 'repeat');
                    if(fillColor2==0xDEADBEEF) fillColor2 = this.detailContext.createPattern(window.parameters.warningFill, 'repeat');
                } else{
                    if(window.state.subdetectorView == 0){
                        fillColor  = 'rgba('+(4+8+4*i+2*j)+', '+(4+8+4*i+2*j)+', '+(4+8+4*i+2*j)+', 1)';
                        fillColor2 = 'rgba('+(4+8+4*i+2*j+1)+', '+(4+8+4*i+2*j+1)+', '+(4+8+4*i+2*j+1)+', 1)';
                    }
                    else
                        fillColor = 'rgba('+(this.nHPGesegments+4+2*i+j)+', '+(this.nHPGesegments+4+2*i+j)+', '+(this.nHPGesegments+4+2*i+j)+', 1)';
                }
                this.drawHalfL(context, (i-1+j)*(Math.PI/2), this.suppressorWidth, this.sideBGOouterWidth/2, this.centerX +NAD*this.sideBGOinnerWidth/2 + PBC*this.sideBGOinnerWidth/2 + PBC*2*this.lineWeight + (-NAB)*NA*this.lineWeight + PCD*NB*this.lineWeight     , this.centerY + (NAB+PCD)*this.sideBGOinnerWidth/2 + PCD*2*this.lineWeight + (-NAD)*NB*this.lineWeight + PBC*NA*this.lineWeight, orientation[j], BGOstate, colorWheel[i], fillColor, fillColor2);

                //front suppressors
                BGOsuffix = 'N0'+(1+1-j)+'X'; //front suppressors labeled -N01X and -N02X; j->1-j here since drawing happens in reverse order
                if(context == this.detailContext){
                    if(window.state.subdetectorView == 0){
                        fillColor  = interpolateColor(parseHexColor(this.dataBus.HPGe[BGOkey+BGOsuffix].oldHVAcolor), parseHexColor(this.dataBus.HPGe[BGOkey+BGOsuffix].HVAcolor), frame/this.nFrames);
                        fillColor2 = interpolateColor(parseHexColor(this.dataBus.HPGe[BGOkey+BGOsuffix].oldHVBcolor), parseHexColor(this.dataBus.HPGe[BGOkey+BGOsuffix].HVBcolor), frame/this.nFrames);
                    }
                    else if(window.state.subdetectorView == 1) fillColor = interpolateColor(parseHexColor(this.dataBus.HPGe[BGOkey+BGOsuffix].oldThresholdColor), parseHexColor(this.dataBus.HPGe[BGOkey+BGOsuffix].thresholdColor), frame/this.nFrames);
                    else if(window.state.subdetectorView == 2) fillColor = interpolateColor(parseHexColor(this.dataBus.HPGe[BGOkey+BGOsuffix].oldRateColor), parseHexColor(this.dataBus.HPGe[BGOkey+BGOsuffix].rateColor), frame/this.nFrames);
                    if(fillColor==0xDEADBEEF) fillColor = this.detailContext.createPattern(window.parameters.warningFill, 'repeat');
                    if(fillColor2==0xDEADBEEF) fillColor2 = this.detailContext.createPattern(window.parameters.warningFill, 'repeat');
                } else{
                    if(window.state.subdetectorView == 0){
                        fillColor  = 'rgba('+(4+8+16+4*i+2*j)+', '+(4+8+16+4*i+2*j)+', '+(4+8+16+4*i+2*j)+', 1)';
                        fillColor2 = 'rgba('+(4+8+16+4*i+2*j+1)+', '+(4+8+16+4*i+2*j+1)+', '+(4+8+16+4*i+2*j+1)+', 1)';
                    }
                    else
                        fillColor = 'rgba('+(this.nHPGesegments+4+8+2*i+j)+', '+(this.nHPGesegments+4+8+2*i+j)+', '+(this.nHPGesegments+4+8+2*i+j)+', 1)';
                }

                this.drawHalfL(context, (i-1+j)*(Math.PI/2), this.suppressorWidth, this.frontBGOouterWidth/2 - this.sideSpacer, this.centerX + (PBC+NAD)*this.frontBGOinnerWidth/2 + PBC*this.lineWeight + (-NAB)*NA*this.sideSpacer + PCD*NB*this.sideSpacer + (-NAD)*this.sideSpacer, this.centerY + (NAB+PCD)*this.frontBGOinnerWidth/2 + PCD*this.lineWeight + (-NAB*PA + PBC*NA + PBC*PB + PCD*NB)*this.sideSpacer, orientation[j], BGOstate, colorWheel[i], fillColor, fillColor2);
            }  

        }
        
        //scale
        this.drawScale(this.detailContext);
        //title
        this.detailContext.fillStyle = '#999999';
        this.detailContext.font="24px 'Orbitron'";
        this.detailContext.fillText(this.scalePrefix+this.cloverShowing, 0.5*this.canvasWidth - this.detailContext.measureText(this.scalePrefix+this.cloverShowing).width/2, 0.85*this.canvasHeight);
        
        if(context == this.TTdetailContext) this.TTdetailLayerDone = 1;
    };

    this.updateHPGe = function(){
        //HPGe + BGO
        //summary level
        for(key in this.dataBus.summary){

            detType = (key[2] == 'G') ? 'HPGe' : 'BGO';

            this.dataBus.summary[key].oldHVcolor = this.dataBus.summary[key].HVcolor;
            this.dataBus.summary[key].HVcolor = this.parseColor(this.dataBus.summary[key].HV, detType);
            this.dataBus.summary[key].oldThresholdColor = this.dataBus.summary[key].thresholdColor;
            this.dataBus.summary[key].thresholdColor = this.parseColor(this.dataBus.summary[key].threshold, detType);
            this.dataBus.summary[key].oldRateColor = this.dataBus.summary[key].rateColor;
            this.dataBus.summary[key].rateColor = this.parseColor(this.dataBus.summary[key].rate, detType);
        }
        

        //detail level
        //loop over detector elements
        for(key in this.dataBus.HPGe){
            detType = (key[2] == 'G') ? 'HPGe' : 'BGO';

            if(detType == 'HPGe'){
                this.dataBus.HPGe[key].oldHVcolor = this.dataBus.HPGe[key].HVcolor;
                this.dataBus.HPGe[key].HVcolor = this.parseColor(this.dataBus.HPGe[key].HV, detType);                    
            } else{
                this.dataBus.HPGe[key].oldHVAcolor = this.dataBus.HPGe[key].HVAcolor;
                this.dataBus.HPGe[key].HVAcolor = this.parseColor(this.dataBus.HPGe[key].HVA, detType);
                this.dataBus.HPGe[key].oldHVBcolor = this.dataBus.HPGe[key].HVBcolor;
                this.dataBus.HPGe[key].HVBcolor = this.parseColor(this.dataBus.HPGe[key].HVB,detType);
            }
            this.dataBus.HPGe[key].oldThresholdColor = this.dataBus.HPGe[key].thresholdColor;
            this.dataBus.HPGe[key].thresholdColor = this.parseColor(this.dataBus.HPGe[key].threshold, detType);
            this.dataBus.HPGe[key].oldRateColor = this.dataBus.HPGe[key].rateColor;
            this.dataBus.HPGe[key].rateColor = this.parseColor(this.dataBus.HPGe[key].rate, detType);
        }
    };

    this.fetchHPGeData = function(){
        var i, j, key;

        //HPGe + BGO detail
        for(key in this.dataBus.HPGe){

            if(window.JSONPstore['thresholds']){
                if(typeof window.JSONPstore['thresholds'][key] == 'number')
                    this.dataBus.HPGe[key]['threshold'] = window.JSONPstore['thresholds'][key];
                else
                    this.dataBus.HPGe[key]['threshold'] = 0xDEADBEEF;
            }

            if(window.JSONPstore['scalar']){
                if(window.JSONPstore['scalar'][key]){
                    if(typeof window.JSONPstore['scalar'][key]['TRIGREQ'] == 'number')
                        this.dataBus.HPGe[key]['rate'] = window.JSONPstore['scalar'][key]['TRIGREQ'];
                    else 
                        this.dataBus.HPGe[key]['rate'] = 0xDEADBEEF;
                } else
                    this.dataBus.HPGe[key]['rate'] = 0xDEADBEEF;
            }
        }

        //HPGe + BGO summary
        for(key in this.dataBus.summary){
            //summary            
            for(i=0; i<4; i++){
                if(key[2] == 'G'){
                    this.dataBus.summary[key].HV = this.dataBus.HPGe[key+'N00A']['HV'];
                    if(this.mode == 'GRIFFIN'){
                        this.dataBus.summary[key].threshold = (this.dataBus.HPGe[key+'N00A']['threshold'] + this.dataBus.HPGe[key+'N00B']['threshold'])/2;
                        this.dataBus.summary[key].rate = (this.dataBus.HPGe[key+'N00A']['rate'] + this.dataBus.HPGe[key+'N00B']['rate'])/2;
                    } else if (this.mode == 'TIGRESS'){
                        this.dataBus.summary[key].threshold = this.dataBus.HPGe[key+'N00A']['threshold'] + this.dataBus.HPGe[key+'N00B']['threshold'];
                        this.dataBus.summary[key].rate = this.dataBus.HPGe[key+'N00A']['rate'] + this.dataBus.HPGe[key+'N00B']['rate'];
                        for(j=1; j<9; j++){
                            this.dataBus.summary[key].threshold += this.dataBus.HPGe[key+'P0'+j+'X']['threshold'];
                            this.dataBus.summary[key].rate += this.dataBus.HPGe[key+'P0'+j+'X']['rate'];
                        }
                        //this.dataBus.summary[key].threshold = this.dataBus.summary[key].threshold%0xDEADBEEF;  //drop any DEADBEEF that got added in
                        //this.dataBus.summary[key].rate = this.dataBus.summary[key].rate%0xDEADBEEF;
                        //this.dataBus.summary[key].threshold /= 10;
                        //this.dataBus.summary[key].rate /= 10;
                        if(this.dataBus.summary[key].threshold >= 0xDEADBEEF) 
                            this.dataBus.summary[key].threshold = 0xDEADBEEF;
                        else
                            this.dataBus.summary[key].threshold /= 10;
                        if(this.dataBus.summary[key].rate >= 0xDEADBEEF) 
                            this.dataBus.summary[key].rate = 0xDEADBEEF;
                        else
                            this.dataBus.summary[key].rate /= 10;
                    }
                } else if(key[2] == 'S'){
                    this.dataBus.summary[key].HV = 0;
                    for(j=1; j<6; j++){
                        this.dataBus.summary[key].HV += this.dataBus.HPGe[key+'N0'+j+'A'] / 10;
                        this.dataBus.summary[key].HV += this.dataBus.HPGe[key+'N0'+j+'B'] / 10;
                    }
                    this.dataBus.summary[key].threshold = this.dataBus.HPGe[key+'N01X']['threshold'] + this.dataBus.HPGe[key+'N02X']['threshold'] + this.dataBus.HPGe[key+'N03X']['threshold'] + this.dataBus.HPGe[key+'N04X']['threshold'] + this.dataBus.HPGe[key+'N05X']['threshold'];
                    this.dataBus.summary[key].rate = this.dataBus.HPGe[key+'N01X']['rate'] + this.dataBus.HPGe[key+'N02X']['rate'] + this.dataBus.HPGe[key+'N03X']['rate'] + this.dataBus.HPGe[key+'N04X']['rate'] + this.dataBus.HPGe[key+'N05X']['rate'];
                    //this.dataBus.summary[key].threshold = (this.dataBus.summary[key].threshold%0xDEADBEEF)/5;  //drop any DEADBEEF that got added in
                    //this.dataBus.summary[key].rate = (this.dataBus.summary[key].rate%0xDEADBEEF)/5;
                    if(this.dataBus.summary[key].threshold >= 0xDEADBEEF)
                        this.dataBus.summary[key].threshold = 0xDEADBEEF;
                    else
                        this.dataBus.summary[key].threshold /= 5;
                    if(this.dataBus.summary[key].rate >= 0xDEADBEEF)
                        this.dataBus.summary[key].rate = 0xDEADBEEF;
                    else
                        this.dataBus.summary[key].rate /= 5;
                }
            }
        }
        
    };

    this.defineHPGeText = function(cell){
        var i, segA, segB, cloverNumber, cloverName, quadrant, BGO, channelName, detName, suffix, title, ABX;
        var BGO = [];
        var toolTipContent = '';
        var pfx = (this.mode == 'TIGRESS') ? 'TI' : 'GR';

        //summary level//////////////////////////////////////////////////

        if(!this.detailShowing) {

            cloverNumber = Math.floor((cell-100)/8);
            cloverName = pfx+'G'+((cloverNumber<10) ? '0'+cloverNumber : cloverNumber );  //will match the HPGe summary ID of this clover
            if(window.parameters.cloversAbsent.indexOf(cloverNumber) == -1){  //not in the absentee list
                quadrant = ((cell-100)%8)%4;
                if (quadrant==2) quadrant = 3;
                else if(quadrant==3) quadrant = 2;
                //HPGE
                if( (cell-100)%8 < 4 ){
                    if(this.mode == 'GRIFFIN'){
                        segA = cloverName+this.dataBus.colorQuads[quadrant]+'N00A';
                        segB = cloverName+this.dataBus.colorQuads[quadrant]+'N00B';

                        //report segment A:
                        nextLine = segA;
                        toolTipContent = '<br>' + nextLine + '<br>';
                        toolTipContent += this.baseTTtext(this.dataBus.HPGe[segA].HV, this.dataBus.HPGe[segA].threshold, this.dataBus.HPGe[segA].rate)

                        //report segment B:
                        nextLine = segB;
                        toolTipContent += '<br><br>' + nextLine + '<br>';
                        toolTipContent += this.baseTTtext(this.dataBus.HPGe[segA].HV, this.dataBus.HPGe[segB].threshold, this.dataBus.HPGe[segB].rate)
                    } else if(this.mode == 'TIGRESS'){
                        createTIGRESSsummaryTT(this.tooltip.ttDivID, cloverName+this.dataBus.colorQuads[quadrant], this.dataBus);
                    }
                //BGO 
                } else {
                    cloverName = pfx+'S'+((cloverNumber<10) ? '0'+cloverNumber : cloverNumber );
                    toolTipContent = '';
                    for(i=1; i<6; i++){
                        BGO[i] = cloverName+this.dataBus.colorQuads[quadrant]+'N0'+i+'X';
                        toolTipContent += ((i==1) ? '<br>' : '<br><br>') + BGO[i] + '<br>';
                        toolTipContent += this.baseTTtext(this.dataBus.HPGe[BGO[i]].HVA, this.dataBus.HPGe[BGO[i]].threshold, this.dataBus.HPGe[BGO[i]].rate, this.dataBus.HPGe[BGO[i]].HVB);
                    }
                }
            } else {
                toolTipContent = '<br>'+cloverName + ' absent.'
            }
        }
        //HPGe detail level///////////////////////////////////////////////
        else{
            //HV view decodes detector from cell index algorithmically; rate view uses lookup table from DataStructures.  Haven't decided which I dislike less.
            if(window.state.subdetectorView == 0){ 
                toolTipContent = cell;
                cloverName = pfx+'S'+((this.cloverShowing<10) ? '0'+this.cloverShowing : this.cloverShowing);
                //HPGe, front, side or back BGO?
                if(cell<4){
                    cloverName = pfx+'G'+((this.cloverShowing<10) ? '0'+this.cloverShowing : this.cloverShowing);
                    detName = cloverName+this.dataBus.colorQuads[cell]+'N00A';
                    title = detName.slice(0,9) + 'X';
                    nextLine = this.TTtext([['HV',this.dataBus.HPGe[detName].HV,window.parameters.subdetectorUnit[0]],['Thresholds-A',this.dataBus.HPGe[detName].threshold,window.parameters.subdetectorUnit[1]],['Thresholds-B',this.dataBus.HPGe[detName.slice(0,9)+'B'].threshold,window.parameters.subdetectorUnit[1]],['Rate-A',this.dataBus.HPGe[detName].rate,window.parameters.subdetectorUnit[2]],['Rate-B',this.dataBus.HPGe[detName.slice(0,9)+'B'].rate,window.parameters.subdetectorUnit[2]]]);
                } else if(cell<12){ //back
                    detName = cloverName+this.dataBus.colorQuads[Math.floor((cell-4)/2)]+'N05X';
                } else if(cell<28){ //sides
                    suffix = (Math.floor( ((cell-12)%4) /2) == 0) ? 'N03X' : 'N04X';
                    detName = cloverName+this.dataBus.colorQuads[Math.floor((cell-12)/4)]+suffix;
                } else{ //front
                    suffix = (Math.floor( ((cell-28)%4) /2) == 0) ? 'N01X' : 'N02X';
                    detName = cloverName+this.dataBus.colorQuads[Math.floor((cell-28)/4)]+suffix;
                }
                if(cell>3){
                    ABX = (cell%2 == 0) ? 'A' : 'B';
                    title = detName.slice(0,9) + ABX;
                    nextLine = this.baseTTtext(this.dataBus.HPGe[detName]['HV'+ABX], this.dataBus.HPGe[detName].threshold, this.dataBus.HPGe[detName].rate );
                }

                toolTipContent = '<br>' + title + '<br><br>' + nextLine;

            } else {
                
                channelName = this.dataBus.HPGeTTmap[(this.cloverShowing-1)*((this.mode=='TIGRESS')? 60:30) + cell];
                detName = channelName.slice(0,5);

                toolTipContent = '<br>' + channelName + '<br><br>';
                if(detName.slice(2,3) == 'G')
                    toolTipContent += this.baseTTtext(this.dataBus.HPGe[channelName].HV, this.dataBus.HPGe[channelName].threshold, this.dataBus.HPGe[channelName].rate);
                else if(detName.slice(2,3) == 'S')
                    toolTipContent += this.baseTTtext(this.dataBus.HPGe[channelName].HVA, this.dataBus.HPGe[channelName].threshold, this.dataBus.HPGe[channelName].rate, this.dataBus.HPGe[channelName].HVB);
                
            }
        }

        toolTipContent += '<br>'
        return toolTipContent;

    };

    function createTIGRESSsummaryTT(wrapperID, cloverLeaf, dataBus){
        var i, elt, eltName1, eltName2;

        document.getElementById(wrapperID).innerHTML = ''; //kill off whatever used to be in there
        insertDOM('table', 'tigressTTtable', '', 'text-align:center; margin:10px; ', wrapperID, '', '');  //new table
        insertDOM('tr', 'coreTitles', '', '', 'tigressTTtable', '', '');
        insertDOM('td', 'blank', '', '', 'coreTitles', '', '');
        insertDOM('td', 'spacer', '', 'width:10px', 'coreTitles', '', '');
        insertDOM('td', 'coreAname', '', '', 'coreTitles', '', cloverLeaf+'N00A');
        insertDOM('td', 'spacer', '', 'width:50px', 'coreTitles', '', '');
        insertDOM('td', 'coreBname', '', '', 'coreTitles', '', cloverLeaf+'N00B');

        insertDOM('tr', 'coreVolt', '', '', 'tigressTTtable', '', '');
        insertDOM('td', 'coreVoltTitle', '', 'text-align:right;', 'coreVolt', '', window.parameters.monitorValues[0])
        insertDOM('td', 'spacer', '', 'width:10px', 'coreVolt', '', '');
        insertDOM('td', 'coreAhv', '', '', 'coreVolt', '', dataBus.HPGe[cloverLeaf+'N00A'].HV.toFixed(0) + ' ' + window.parameters.subdetectorUnit[0]);
        insertDOM('td', 'spacer', '', 'width:50px', 'coreVolt', '', '');
        insertDOM('td', 'coreBhv', '', '', 'coreVolt', '', dataBus.HPGe[cloverLeaf+'N00B'].HV.toFixed(0) + ' ' + window.parameters.subdetectorUnit[0]);

        insertDOM('tr', 'coreThreshold', '', '', 'tigressTTtable', '', '');
        insertDOM('td', 'coreThresholdTitle', '', 'text-align:right;', 'coreThreshold', '', window.parameters.monitorValues[1])
        insertDOM('td', 'spacer', '', 'width:10px', 'coreThreshold', '', '');
        insertDOM('td', 'coreAthreshold', '', '', 'coreThreshold', '', ( (dataBus.HPGe[cloverLeaf+'N00A'].threshold < 0xDEADBEEF) ? dataBus.HPGe[cloverLeaf+'N00A'].threshold.toFixed(0) + ' ' + window.parameters.subdetectorUnit[1] : 'Not Reporting') );
        insertDOM('td', 'spacer', '', 'width:50px', 'coreThreshold', '', '');
        insertDOM('td', 'coreBthreshold', '', '', 'coreThreshold', '', ( (dataBus.HPGe[cloverLeaf+'N00B'].threshold < 0xDEADBEEF) ? dataBus.HPGe[cloverLeaf+'N00B'].threshold.toFixed(0) + ' ' + window.parameters.subdetectorUnit[1] : 'Not Reporting') ); 

        insertDOM('tr', 'coreRate', '', '', 'tigressTTtable', '', '');
        insertDOM('td', 'coreRateTitle', '', 'text-align:right;', 'coreRate', '', window.parameters.monitorValues[2])
        insertDOM('td', 'spacer', '', 'width:10px', 'coreRate', '', '');
        insertDOM('td', 'coreArate', '', '', 'coreRate', '', ( (dataBus.HPGe[cloverLeaf+'N00A'].rate < 0xDEADBEEF) ? dataBus.HPGe[cloverLeaf+'N00A'].rate.toFixed(0) + ' ' + window.parameters.subdetectorUnit[2] : 'Not Reporting') );
        insertDOM('td', 'spacer', '', 'width:50px;', 'coreRate', '', '');
        insertDOM('td', 'coreBrate', '', '', 'coreRate', '', ((dataBus.HPGe[cloverLeaf+'N00B'].rate < 0xDEADBEEF) ? dataBus.HPGe[cloverLeaf+'N00B'].rate.toFixed(0) + ' ' + window.parameters.subdetectorUnit[2] : 'Not Reporting') ); 

        insertDOM('tr', 'divider', '', '', 'tigressTTtable', '', '');
        insertDOM('td', 'line', '', 'border-bottom-style:solid; border-color:white; border-width:1px;', 'divider', '', '');
        document.getElementById('line').setAttribute('colspan', 5);

        for(i=0; i<4; i++){
            elt = cloverLeaf+i;
            eltName1 = cloverLeaf + 'P0' + (2*i+1) + 'X';
            eltName2 = cloverLeaf + 'P0' + (2*i+2) + 'X';

            insertDOM('tr', elt+'Titles', '', '', 'tigressTTtable', '', '');
            insertDOM('td', 'blank', '', '', elt+'Titles', '', '');
            insertDOM('td', 'spacer', '', 'width:10px', elt+'Titles', '', '');
            insertDOM('td', elt+'Aname', '', '', elt+'Titles', '', eltName1);
            insertDOM('td', 'spacer', '', 'width:50px', elt+'Titles', '', '');
            insertDOM('td', elt+'Bname', '', '', elt+'Titles', '', eltName2);

            insertDOM('tr', elt+'Volt', '', '', 'tigressTTtable', '', '');
            insertDOM('td', elt+'VoltTitle', '', 'text-align:right;', elt+'Volt', '', window.parameters.monitorValues[0])
            insertDOM('td', 'spacer', '', 'width:10px', elt+'Volt', '', '');
            insertDOM('td', elt+'Ahv', '', '', elt+'Volt', '', dataBus.HPGe[eltName1].HV.toFixed(0) + ' ' + window.parameters.subdetectorUnit[0]);
            insertDOM('td', 'spacer', '', 'width:50px', elt+'Volt', '', '');
            insertDOM('td', elt+'Bhv', '', '', elt+'Volt', '', dataBus.HPGe[eltName2].HV.toFixed(0) + ' ' + window.parameters.subdetectorUnit[0]);

            insertDOM('tr', elt+'Threshold', '', '', 'tigressTTtable', '', '');
            insertDOM('td', elt+'ThresholdTitle', '', 'text-align:right;', elt+'Threshold', '', window.parameters.monitorValues[1])
            insertDOM('td', 'spacer', '', 'width:10px', elt+'Threshold', '', '');
            insertDOM('td', elt+'Athreshold', '', '', elt+'Threshold', '', ((dataBus.HPGe[eltName1].threshold < 0xDEADBEEF) ? dataBus.HPGe[eltName1].threshold.toFixed(0) + ' ' + window.parameters.subdetectorUnit[1] : 'Not Reporting') );
            insertDOM('td', 'spacer', '', 'width:50px', elt+'Threshold', '', '');
            insertDOM('td', elt+'Bthreshold', '', '', elt+'Threshold', '', ( (dataBus.HPGe[eltName2].threshold < 0xDEADBEEF) ? dataBus.HPGe[eltName2].threshold.toFixed(0) + ' ' + window.parameters.subdetectorUnit[1] : 'Not Reporting') ); 

            insertDOM('tr', elt+'Rate', '', '', 'tigressTTtable', '', '');
            insertDOM('td', elt+'RateTitle', '', 'text-align:right;', elt+'Rate', '', window.parameters.monitorValues[2])
            insertDOM('td', 'spacer', '', 'width:10px', elt+'Rate', '', '');
            insertDOM('td', elt+'Arate', '', '', elt+'Rate', '', ( (dataBus.HPGe[eltName1].rate < 0xDEADBEEF) ? dataBus.HPGe[eltName1].rate.toFixed(0) + ' ' + window.parameters.subdetectorUnit[2] : 'Not Reporting') );
            insertDOM('td', 'spacer', '', 'width:50px;', elt+'Rate', '', '');
            insertDOM('td', elt+'Brate', '', '', elt+'Rate', '', ( (dataBus.HPGe[eltName2].rate < 0xDEADBEEF) ? dataBus.HPGe[eltName2].rate.toFixed(0) + ' ' + window.parameters.subdetectorUnit[2] : 'Not Reporting') ); 

            if(i!=3){
                insertDOM('tr', elt+'divider', '', '', 'tigressTTtable', '', '');
                insertDOM('td', elt+'line', '', 'border-bottom-style:solid; border-color:white; border-width:1px;', elt+'divider', '', '');
                document.getElementById(elt+'line').setAttribute('colspan', 5);
            }   

        }
    }

}










TIPwall.prototype = Object.create(Subsystem.prototype);

function TIPwall(){
    //detector name, self-pointing pointer, pull in the Subsystem template, 
    //establish a databus and create a global-scope pointer to this object:
    this.name = 'TIPwall';
    var that = this;
    Subsystem.call(this);
    this.dataBus = new TIPwallDS();
    //make a pointer at window level back to this object, so we can pass by reference to the nav button onclick
    window.TIPwallpointer = that;

    //drawing parameters
    //general
    this.centerX = this.canvasWidth/2;
    this.centerY = this.canvasHeight*0.4;
    this.lineWeight = 1;

    //CsI
    this.CsIy0 = this.canvasHeight*0.1;
    this.CsIcellSide = this.canvasHeight*0.12;
    this.CsIx0 = this.canvasWidth/2 - 2.5*this.CsIcellSide;

    document.getElementById('TIPwalllink').innerHTML = 'TIP Wall';

    //member functions///////////////////////////////////////////////////////////////////

    this.draw = function(frame){
    	var key, iAdj, i;

        this.context.strokeStyle = '#999999';
        this.context.lineWidth = this.lineWeight;

        //CsI wall:
        //once for display canvas...
        for(key in this.dataBus.TIPwall){
            iAdj = this.dataBus.TIPwall[key].index;
            if (iAdj>11) iAdj++;

            this.context.fillStyle = colors(key, this.dataBus.TIPwall, frame, this.nFrames);

            this.context.fillRect(this.CsIx0 + this.CsIcellSide*(iAdj%5), this.CsIy0 + this.CsIcellSide*Math.floor(iAdj/5), this.CsIcellSide, this.CsIcellSide);
            this.context.strokeRect(this.CsIx0 + this.CsIcellSide*(iAdj%5), this.CsIy0 + this.CsIcellSide*Math.floor(iAdj/5), this.CsIcellSide, this.CsIcellSide);

    	}
        if(!this.TTlayerDone){
        //...and again for tt encoding:
            for(key in this.dataBus.TIPwall){
                i = this.dataBus.TIPwall[key].index;
                iAdj = i;
                if (iAdj>11) iAdj++;

                this.TTcontext.fillStyle = 'rgba('+i+','+i+','+i+',1)';
                this.TTcontext.fillRect(Math.round(this.CsIx0 + this.CsIcellSide*(iAdj%5)), Math.round(this.CsIy0 + this.CsIcellSide*Math.floor(iAdj/5)), Math.round(this.CsIcellSide), Math.round(this.CsIcellSide));
            }
            this.TTlayerDone = 1;
        }

        this.drawScale(this.context, frame);
    };

    //do an initial populate:
    this.update();
}

TIPball.prototype = Object.create(Subsystem.prototype);

function TIPball(){
    //detector name, self-pointing pointer, pull in the Subsystem template, 
    //establish a databus and create a global-scope pointer to this object:
    this.name = 'TIPball';
    var that = this;
    Subsystem.call(this);
    this.dataBus = new TIPballDS();
    //make a pointer at window level back to this object, so we can pass by reference to the nav button onclick
    window.TIPballpointer = that;

    //member variables
    this.detsPerRing = [4,6,12,16,20,18,18,14,12,8];  //how many detectors are in each ring?
    this.ringTheta = [8, 17.5, 33, 48.5, 64, 79.5, 95, 111.9, 130.2, 148.5]; //average theta for each ring

    //drawing parameters
    this.cellSide = this.canvasWidth/25;
    this.gutterWidth = (0.9*(this.canvasHeight - this.scaleHeight) - 10*this.cellSide)/11; //this.cellSide*0.2;
    this.rowTop = 0.05*this.canvasHeight;  //incremented for each row.
    this.context.strokeStyle = '#999999';
    this.TTcontext.strokeStyle = '#987654';
    this.context.lineWidth = this.lineWeight;

    document.getElementById('TIPballlink').innerHTML = 'TIP Ball';

    //member functions///////////////////////////////////////////////////////////////////

    this.draw = function(frame){
        var i, j, index=0;

        if(frame==0) {
            this.context.clearRect(0,0,this.canvasWidth, this.canvasHeight-this.scaleHeight)
            this.context.textBaseline = 'top';
            this.context.font = '16px Raleway';
            this.context.fillStyle = '#999999';
            this.context.fillText('Av. Theta:', this.gutterWidth, 0);  //String.fromCharCode(0x03B8)
            this.context.fillText('Ring No.', this.canvasWidth - this.gutterWidth - this.context.measureText('Ring No.').width, 0);
        }

        for(i=0; i<this.detsPerRing.length; i++){
            for(j=0; j<this.detsPerRing[i]; j++){
                this.context.fillStyle = colors(this.dataBus.TTmap[this.DAQmap(index)], this.dataBus.TIPball, frame, this.nFrames);
                //draw dashboard:
                this.context.fillRect(this.canvasWidth/2 - this.cellSide*this.detsPerRing[i]/2 + this.cellSide*j, this.rowTop, this.cellSide, this.cellSide);
                this.context.strokeRect(this.canvasWidth/2 - this.cellSide*this.detsPerRing[i]/2 + this.cellSide*j, this.rowTop, this.cellSide, this.cellSide);

                //and for the tooltip:
                if(!this.TTlayerDone){
                    this.TTcontext.fillStyle = 'rgba('+this.DAQmap(index)+','+this.DAQmap(index)+','+this.DAQmap(index)+',1)';
                    this.TTcontext.fillRect(this.canvasWidth/2 - this.cellSide*this.detsPerRing[i]/2 + this.cellSide*j, this.rowTop, this.cellSide, this.cellSide);
                    this.TTcontext.strokeRect(this.canvasWidth/2 - this.cellSide*this.detsPerRing[i]/2 + this.cellSide*j, this.rowTop, this.cellSide, this.cellSide);
                }

                index++;
            
            }
            //labels:
            if(frame==0){
                this.context.textBaseline = 'middle';
                this.context.font = '16px Raleway'
                this.context.fillStyle = '#999999';
                this.context.fillText(this.ringTheta[i].toFixed(1)+String.fromCharCode(0x00B0), this.gutterWidth, this.rowTop+this.cellSide/2);
                this.context.fillText(i, this.canvasWidth - this.gutterWidth - this.context.measureText(i).width, this.rowTop+this.cellSide/2);
            } 

            //move down to the next row:
            this.rowTop += this.cellSide + this.gutterWidth;
            //Ring 0 is a bit extra offset:
            if(i==0) this.rowTop += 2*this.gutterWidth;
        }
        this.rowTop = 0.05*this.canvasHeight;
        this.TTlayerDone = 1;

        if(frame==0 || frame == this.nFrames){
            this.context.textBaseline = 'alphabetic'
            this.drawScale(this.context, frame);
        }
    };

    //this.draw indexes each cell starting from 0 and counting up along each ring, starting from ring 0;
    //this function takes that index, and maps it onto the dataBus index for the channel that should be in that position.
    this.DAQmap = function(index){
        return index+1;
    };

    //do an initial populate:
    this.update();
}function Trigger(){

	this.wrapperID = window.parameters.wrapper;	//ID of wrapping div
	this.canvasID = 'TriggerCanvas';	        //ID of canvas to paint trigger on
    this.linkWrapperID = 'TriggerLinks';        //ID of div to contain clock view header
    this.sidebarID = 'TriggerSidebar';          //ID of sidebar div

	this.wrapper = document.getElementById(this.wrapperID);

    //add top level nav button:
    insertDOM('button', 'TriggerButton', 'navLink', '', 'statusLink', function(){swapView('TriggerLinks', 'TriggerCanvas', 'TriggerSidebar', 'TriggerButton')}, 'Trigger', '', 'button')

    //nav wrapper div
    insertDOM('div', this.linkWrapperID, 'navPanel', '', this.wrapperID, '', '')
    //nav header
    insertDOM('h1', 'TriggerLinksBanner', 'navPanelHeader', '', this.linkWrapperID, '', window.parameters.ExpName+' Trigger Status')
    insertDOM('br', 'break', '', '', this.linkWrapperID, '', '')

	//deploy a canvas for the trigger view:
    this.canvasWidth = 0.48*$(this.wrapper).width();
    this.canvasHeight = 0.8*$(this.wrapper).height();
    insertDOM('canvas', this.canvasID, 'monitor', 'top:' + ($('#TriggerLinks').height() + 5) +'px;', this.wrapperID, '', '')
    this.canvas = document.getElementById('TriggerCanvas');
    this.context = this.canvas.getContext('2d');
    this.canvas.setAttribute('width', this.canvasWidth)
    this.canvas.setAttribute('height', this.canvasHeight)

    //right sidebar
    insertDOM('div', this.sidebarID, 'Sidebar', '', this.wrapperID, '', '')

    //drawing parameters:

    //establish animation parameters////////////////////////////////////////////////////////////////////
    this.FPS = 30;
    this.duration = 0.5;
    this.nFrames = this.FPS*this.duration;

    //data buffers///////////////////////////

    //member functions/////////////////////////////////////////////

    this.draw = function(frame){

    };

    this.animate = function(){
        if(window.onDisplay == this.canvasID /*|| window.freshLoad*/) animate(this, 0);
        else this.draw(this.nFrames);
    };
}function Waffle(InputLayer, headerDiv, AlarmServices){

    	var i, j, k, n, columns;

        //pointer voodoo:
        var that = this;
        //make a pointer at window level back to this object, so we can pass by reference to the nav button onclick
        window.HVpointer = that;

        window.HVview = 0; //index of which crate is currently on display in the HV view.
        this.nCrates = window.parameters.moduleSizes.length;

        //columns for HV monitor:
        this.cols = [];
        for(i=0; i<this.nCrates; i++){
          window.parameters.columns[i] = 0;
          for(j=0; j<window.parameters.moduleSizes[i].length; j++){
            window.parameters.columns[i] += window.parameters.moduleSizes[i][j];
            if (window.parameters.moduleSizes[i][j] == 0) window.parameters.columns[i]++;
          }
          this.cols[i] = window.parameters.columns[i];
        }

        //member data:
        this.rows = window.parameters.rows + 1;     //number of rows in the waffle; +1 for primary row
        this.canvasID = [];                         //canvas ID to draw the waffles on
        this.prevAlarmStatus = [];                       //previous iteration's alarmStatus
        this.alarmStatus = [];                           //3D array containing the alarm level for each cell [mainframe][row][column] = alarm level
        this.wrapperDiv = window.parameters.wrapper;//div ID of top level div
        this.InputLayer = InputLayer;               //div ID of wrapper for input fields  TODO: resundant with sidebarID
        //this.headerDiv = headerDiv;                 //div ID of waffle header  TODO: depricated?
        this.chx = 0;                               //x channel of input sidebar focus
        this.chy = 1;                               //y channel of input sidebar focus
        this.linkWrapperID = 'mainframeLinks';      //ID of div containing nav links
        this.topNavID = 'HVmonitorButton';
        this.sidebarID = 'InputLayer';
        this.monitor = document.getElementById(this.wrapperDiv);
        this.AlarmServices = AlarmServices;         //Alarm serivce object the waffle will fire events at
        this.dataBus = [];
        for(i=0; i<this.nCrates; i++){
            this.dataBus[i] = new HVDS(this.rows, this.cols[i]);  //data structure to manage info.
        }
        this.viewStatus = -1;                       //indicates which view is on top: -1=summary, n>-1=bar chart n.  TODO: redundant with window.HVview?
        this.canvas = [];
        this.context = [];
        //index address of where the input panel is pointing:
        this.dialogX;
        this.dialogY;


        //make sure the waffle is pointing at a channel that actually has something in it before the initial populate:
        i=0;
        while(window.parameters.moduleSizes[window.HVview][i] == 0) i++;
        this.chx = i;

        //generate the canvas IDs:
        for (i=0; i<this.nCrates; i++){
            this.canvasID[i] = 'HVgrid'+i;
        }

        //deploy the sidebar
        this.deploySidebar = function(){

            //wrapper div
            insertDOM('div', this.sidebarID, 'RightSidebar', '', this.wrapperDiv, '', '');
            document.getElementById(this.sidebarID).setAttribute('align', 'left');

            //title
            insertDOM('h2', 'inputTitle', '', 'margin-left:10%; margin-top:25px; font-family: "Orbitron", sans-serif;', this.sidebarID, '', 'Sin Titulo');
            document.getElementById('inputTitle').setAttribute('align', 'left');

            //input form
            insertDOM('form', 'setValues', '', 'margin-bottom:0px;', this.sidebarID, '', '');

            //on/off radios:
            insertDOM('input', 'offButton', '', 'margin-left:10%; margin-bottom:10px', 'setValues', '', '', 'HVswitch', 'radio', 'off');
            insertDOM('p', 'offSwitch', '', 'display:inline', 'setValues', '', 'Off');
            insertDOM('input', 'onButton', '', 'margin-left:2%; margin-bottom:10px; display:inline;', 'setValues', '', '', 'HVswitch', 'radio', 'on');
            insertDOM('p', 'onSwitch', '', 'display:inline', 'setValues', '', 'On');
            //submit updates:
            insertDOM('input', 'submitParameters', 'bigButton', 'z-index:10000;', 'setValues', function(){updateParameter()}, '', '', 'button', 'Commit')
            document.getElementById('submitParameters').setAttribute('disabled', 'true');

            //status report:
            insertDOM('p', 'status', '', 'margin-left:10%;', 'setValues', '', 'Status:')

            //voltage fill meter
            insertDOM('p', 'voltageMeterTitle', '', 'margin-left:10%; margin-bottom:0px; display:inline; position:relative; top:-18px;', 'setValues', '', 'Voltage [V]')
            insertDOM('canvas', 'voltageMeter', '', 'margin-left:2px;', 'setValues', '', '')
            document.getElementById('voltageMeter').setAttribute('align', 'right');
            //current fill meter
            insertDOM('p', 'currentMeterTitle', '', 'margin-left:10%; margin-bottom:0px; display:inline; position:relative; top:-18px;', 'setValues', '', 'Current [uA]')
            insertDOM('canvas', 'currentMeter', '', 'margin-left:2px;', 'setValues', '', '')
            document.getElementById('currentMeter').setAttribute('align', 'right');
            //temperature fill meter
            insertDOM('p', 'temperatureMeterTitle', '', 'margin-left:10%; margin-bottom:0px; display:inline; position:relative; top:-18px;', 'setValues', '', 'Temperature [C]')
            insertDOM('canvas', 'temperatureMeter', '', 'margin-left:2px;', 'setValues', '', '')
            document.getElementById('temperatureMeter').setAttribute('align', 'right');                        

            //demand voltage
            insertDOM('p', 'FieldText', '', 'margin-left:10%', 'setValues', '', 'Demand Voltage [V]')
            insertDOM('input', 'demandVoltage', '', 'margin-bottom:10px; margin-top: 5px; margin-left:10%; margin-right:5%;', 'setValues', '', '', 'textbox', 'text', 'default')
            document.getElementById('demandVoltage').setAttribute('size', '6');
            insertDOM('div', 'voltageSlider', 'slider', '', 'setValues', '', '');
            //demand voltage ramp up
            insertDOM('p', 'RampText', '', 'margin:0px; margin-left:10%; margin-top:20px;', 'setValues', '', 'Voltage Ramp Up Speed [V/s]')
            insertDOM('input', 'demandRampSpeed', '', 'margin-bottom:10px; margin-top: 5px; margin-left:10%; margin-right:5%;', 'setValues', '', '', 'textbox', 'text', 'default')
            document.getElementById('demandRampSpeed').setAttribute('size', '6');
            insertDOM('div', 'rampSlider', 'slider', '', 'setValues', '', '');
            //demand voltage ramp down
            insertDOM('p', 'RampTextDown', '', 'margin:0px; margin-left:10%; margin-top:20px;', 'setValues', '', 'Demand Ramp Down Speed [V/s]')
            insertDOM('input', 'demandRampDownSpeed', '', 'margin-bottom:10px; margin-top: 5px; margin-left:10%; margin-right:5%;', 'setValues', '', '', 'textbox', 'text', 'default')
            document.getElementById('demandRampDownSpeed').setAttribute('size', '6');
            insertDOM('div', 'rampDownSlider', 'slider', '', 'setValues', '', '');

            //space canvas:
            insertDOM('canvas', 'inputSpacer', '', 'margin-left:10%; margin-top:5%;', this.sidebarID, '', '');
            document.getElementById('inputSpacer').setAttribute('width', '200px');
            document.getElementById('inputSpacer').setAttribute('height', '5px');
            //draw on the canvas:
            var ILcanvas = document.getElementById('inputSpacer');
            var ILcontext = ILcanvas.getContext('2d');
            ILcontext.strokeStyle = 'rgba(255,255,255,0.9)'
            ILcontext.beginPath();
            ILcontext.moveTo(0,0);
            ILcontext.lineTo(200,0);
            ILcontext.stroke();

            //channel changing form:
            insertDOM('form', 'changeChannel', '', '', this.sidebarID, '', '')
            //title
            insertDOM('h4', 'ccTitle', '', 'margin-left:10%; margin-bottom:10px;', 'changeChannel', '', 'Change Channel:')
            //cards:
            insertDOM('p', 'cardTitle', '', 'display:inline; margin-left:10%; margin-right:1%', 'changeChannel', '', 'Card')
            insertDOM('select', 'CardList', '', 'width:80px;', 'changeChannel', '', '')
            insertDOM('br', 'break', '', '', 'changeChannel', '', '')
            //channels:
            insertDOM('p', 'channelTitle', '', 'display:inline; margin-left:10%; position:relative; top:-20px; margin-right:1%;', 'changeChannel', '', 'Channel')
            insertDOM('select', 'ChannelList', '', 'width:80px; position:relative; top:-20px;', 'changeChannel', '', '')
            //submit button:
            insertDOM('input', 'getChannelButton', 'link', 'position:relative; top:-30px; width: 50px; height:50px; font-size:24px; margin-left:3%; margin-top:10px; border-color:black', 'changeChannel', function(){window.refreshInput = 1; gotoNewChannel(event, window.HVpointer);}, '', '', 'button', 'Go')
        };

        //deploy a sidebar to interact with this element:
        this.deploySidebar();

        //deploy some sliders in the sidebar  TODO: push into deploySidebar()?
        var sliderWidth = parseFloat($(document.getElementById('InputLayer')).width())*0.5;
        this.voltageSlider = new Slider(this.sidebarID, 'volageSliderText', 'demandVoltage', 'voltageSlider', 'voltageSliderBKG', 'voltageSliderKnob', 'voltageKnobStyle', 'voltageSliderText', window.parameters.minVoltage, window.parameters.maxVoltage, window.parameters.statusPrecision, window.parameters.voltUnit, sliderWidth );
        this.rampSlider = new Slider(this.sidebarID, 'rampSliderText', 'demandRampSpeed', 'rampSlider', 'rampSliderBKG', 'rampSliderKnob', 'rampKnobStyle', 'rampSliderText', window.parameters.minRampSpeed, window.parameters.maxRampSpeed, window.parameters.statusPrecision, window.parameters.rampUnit,  sliderWidth);
        this.rampDownSlider = new Slider(this.sidebarID, 'rampDownSliderText', 'demandRampDownSpeed', 'rampDownSlider', 'rampDownSliderBKG', 'rampDownSliderKnob', 'rampDownKnobStyle', 'rampDownSliderText', window.parameters.minRampSpeed, window.parameters.maxRampSpeed, window.parameters.statusPrecision, window.parameters.rampUnit,  sliderWidth);

        //fill meters  TODO: put these on the waffle object instead of window?
        window.meter = new FillMeter('voltageMeter', 'InputLayer', 0, window.parameters.minVoltage, window.parameters.maxVoltage, window.parameters.voltUnit, window.parameters.statusPrecision);
        window.currentMeter = new FillMeter('currentMeter', 'InputLayer', 0, window.parameters.minCurrent, window.parameters.maxCurrent, window.parameters.currentUnit, window.parameters.statusPrecision);
        window.temperatureMeter = new FillMeter('temperatureMeter', 'InputLayer', 0, window.parameters.minTemperature, window.parameters.maxTemperature, window.parameters.temperatureUnit, window.parameters.statusPrecision);

        //determine dimesions of canvas:
        this.totalWidth = Math.round(0.5*$('#'+this.wrapperDiv).width());
        //cell dimensions controlled by total width, since width more visually important here:
        this.cellSide = [];
        this.totalHeight = [];
        for(i=0; i<this.nCrates; i++){
            this.cellSide[i] = (this.totalWidth - 60) / Math.max(20, this.cols[i]);
            this.totalHeight[i] = 16*this.cellSide[i];
        }

        //DOM insertions////////////////////////////////////
        //inject top level nav button
        insertDOM('button', this.topNavID, 'navLink', '', 'statusLink', function(){swapView(window.HVpointer.linkWrapperID, 'HVgrid0', 'InputLayer', window.HVpointer.topNavID); rePaint();}, 'HV Monitor')

        //header
        insertDOM('div', this.linkWrapperID, 'navPanel', '', this.wrapperDiv, '', '');
        //title
        insertDOM('h1', this.linkWrapperID+'Banner', 'navPanelHeader', '', this.linkWrapperID, '', window.parameters.ExpName+' HV Mainframes');
        insertDOM('br', 'break', '', '', this.linkWrapperID, '', '');
        //mainframe navigation
        for(i=0; i<this.nCrates; i++){
            insertDOM('button', 'Main'+(i+1), (i==0)? 'navLinkDown' : 'navLink', '', this.linkWrapperID, function(){swapHVmainframe(this.crate); rePaint();}, 'Mainframe '+(i+1) );
            document.getElementById('Main'+(i+1)).crate = i;
        }
        insertDOM('br', 'break', '', '', this.linkWrapperID, '', '');
        //card navigation
        for(i=0; i<this.nCrates; i++){
            insertDOM('div', this.linkWrapperID+i, 'cardNavPanel', '', this.linkWrapperID, '', '');
            for(j=0; j<window.parameters.moduleSizes[i].length; j++){
                insertDOM('button', 'crate'+i+'card'+j, 'navLink', '', this.linkWrapperID+i, function(){barChartButton(this)}, 'Slot '+j, '', 'button');
                document.getElementById('crate'+i+'card'+j).cardNumber = j;
            }

            //inject canvas into DOM for waffle to paint on:
            insertDOM('canvas', this.canvasID[i], 'monitor', '', this.wrapperDiv, '', '');
            document.getElementById(this.canvasID[i]).setAttribute('width', this.totalWidth);
            document.getElementById(this.canvasID[i]).setAttribute('height', this.totalHeight[i]);
            this.canvas[i] = document.getElementById(this.canvasID[i]);
            this.context[i] = this.canvas[i].getContext('2d');

        }

        //finished DOM insertions//////////////////////////////////////

        //set up module labels:
        this.moduleLabels = [];
        for(i=0; i<16; i++){
            this.moduleLabels[i] = 'Slot ' + i;
        }

        //adjust height to accommodate card and module labels:
        for(i=0; i<this.nCrates; i++){
            this.context[i].font = Math.min(16, this.cellSide[i])+'px Raleway';
            this.longestModuleLabel = 0;
            for(j = 0; j<window.parameters.moduleSizes[i].length; j++){
                this.longestModuleLabel = Math.max(this.longestModuleLabel, this.context[i].measureText(this.moduleLabels[j]).width);
            }
            this.totalHeight[i] += this.longestModuleLabel + 50;
            this.canvas[i].setAttribute('height', this.totalHeight[i]);
        }

        //waffle dimensions; leave gutters for labels & title
        this.waffleWidth = [];
        this.waffleHeight = [];
        this.leftEdge = [];
        for(i=0; i<this.nCrates; i++){
            this.waffleWidth[i] = this.cellSide[i]*this.cols[i];
            this.waffleHeight[i] = this.totalHeight[i];
            //want waffle and navbar centered nicely:
            this.leftEdge[i] = (this.totalWidth - (this.waffleWidth[i] + 1.5*this.context[i].measureText('Prim').width))/2;
            //push navbar over to match:
            document.getElementById(this.linkWrapperID).setAttribute('style', 'left:'+(24 + 100*this.leftEdge[i]/$('#'+this.wrapperDiv).width() )+'%;');
        }

        //make a tooltip for each crate:
        this.tooltip = [];
        for(i=0; i<this.nCrates; i++){
            this.tooltip[i] = new Tooltip(this.canvasID[i], 'MFTT'+i, this.wrapperDiv, window.parameters.prefix, window.parameters.postfix);
            //give the tooltip a pointer back to this object:
            this.tooltip[i].obj = that;
            //tooltip looks for members canvasWidth and canvasHeight to make sure its in a valid place:
            this.canvasWidth = document.getElementById(this.canvasID[0]).width;
            this.canvasHeight = document.getElementById(this.canvasID[0]).height;
        }

        //establish animation parameters:
        this.FPS = 30;
        this.duration = 0.5;
        this.nFrames = this.FPS*this.duration;

        //style card nav buttons
        var newRule;
        for(j=0; j<this.nCrates; j++){
            for(i=0; i<window.parameters.moduleSizes[j].length; i++){
                var buttonWidth, fontsize;
                buttonWidth = Math.max(window.parameters.moduleSizes[j][i],1)*0.9*this.cellSide[j] + (Math.max(window.parameters.moduleSizes[j][i],1)-1)*0.1*this.cellSide[j];
                if(window.parameters.moduleSizes[j][i] == 4) fontsize = 0.9*this.cellSide[j]*0.5;
                else fontsize = 0.9*this.cellSide[j]*0.3;

                if(window.parameters.moduleSizes[j][i] != 0)
                    newRule = "width:"+buttonWidth+"px; height:"+0.9*this.cellSide[j]+"px; margin-right:"+0.05*this.cellSide[j]+"px; margin-left:"+0.05*this.cellSide[j]+"px; margin-top:"+0.05*this.cellSide[j]+"px; float:left; border-radius: 5px; display: inline; font-family: 'Raleway', sans-serif; font-size:"+fontsize+"px; padding:0px;";
                else{ 
                    newRule = "width:"+buttonWidth+"px; height:"+0.9*this.cellSide[j]+"px; margin-right:"+0.05*this.cellSide[j]+"px; margin-left:"+0.05*this.cellSide[j]+"px; margin-top:"+0.05*this.cellSide[j]+"px; float:left; border-radius: 5px; display: inline; font-family: 'Raleway', sans-serif; font-size:"+this.cellSide[j]/2+"px; padding:0px; color:#CC0000;";
                    document.getElementById('crate'+j+'card'+i).setAttribute('onclick', '');
                    document.getElementById('crate'+j+'card'+i).innerHTML = 'X'
                }
                document.getElementById('crate'+j+'card'+i).setAttribute('style', newRule);
            }
        }

        document.getElementById(this.linkWrapperID+0).style.display = 'block';
        //header size:
        this.headerHeight = [];
        for(i=0; i<this.nCrates; i++){
            document.getElementById(this.linkWrapperID+i).style.display = 'block';
            this.headerHeight[i] = $('#'+this.linkWrapperID).height();
            document.getElementById(this.linkWrapperID+i).style.display = 'none';
            //make the vertical spacing between the waffle and nav header nice:
            $('#'+this.canvasID[i]).css('top', ((this.headerHeight[i])+5)+'px !important;' );
        }
        //turn top crate's slot navigation on:
        document.getElementById(this.linkWrapperID+window.HVview).style.display = 'block';


        //declare bar charts & canvases to paint them on:
        this.barCharts = [];
        var newCanvas;
        for(j=0; j<this.nCrates; j++){
            this.barCharts[j] = [];
            for(i=0; i<window.parameters.moduleSizes[j].length; i++){
                insertDOM('canvas', 'crate'+j+'bar'+i, 'monitor', '', this.wrapperDiv, '', '');
                document.getElementById('crate'+j+'bar'+i).setAttribute('width', this.totalWidth);
                document.getElementById('crate'+j+'bar'+i).setAttribute('height', this.totalHeight[i]);
                this.barCharts[j][i] = new BarGraph('crate'+j+'bar'+i, i, Math.max(window.parameters.moduleSizes[j][i],1)*12, 'Slot '+i, 'Reported Voltage [V]', 0, window.parameters.scaleMaxima[0], window.parameters.barChartPrecision, that, j);
            }
        }

        //set up arrays:
        this.startColor = [];
        this.endColor = [];
        for(j=0; j<this.nCrates; j++){
            this.startColor[j] = [];
            this.endColor[j] = [];
            for(i=0; i<this.rows; i++){
        	    this.startColor[j][i] = [];
            	this.endColor[j][i] = [];
            }
        }

        //declare alarmStatus and prevAlarmStatus as arrays of appropriate dimension:
        for(k=0; k<this.nCrates; k++){
            this.alarmStatus[k] = [];
            this.prevAlarmStatus[k] = [];
            for(i=0; i<this.rows; i++){
                this.alarmStatus[k][i] = [];
                this.prevAlarmStatus[k][i] = [];
                //primary row spans multi-columns:
                if(i==0) columns = window.parameters.moduleSizes[k].length;
                else columns = this.cols[k];
                for(j=0; j<columns; j++){
                    this.alarmStatus[k][i][j] = [];
                    this.prevAlarmStatus[k][i][j] = [];
                    for(var n=0; n<3; n++){
                        this.alarmStatus[k][i][j][n] = 0;
                        this.prevAlarmStatus[k][i][j][n] = 0;
                    }
                }
            }
        }

        //array of values from the waffle to report in the tooltip
        this.reportedValues = [];
        for(i=0; i<this.nCrates; i++){
            this.reportedValues[i] = [this.dataBus[i].demandVoltage, this.dataBus[i].reportVoltage, this.dataBus[i].reportCurrent, this.dataBus[i].demandVrampUp, this.dataBus[i].demandVrampDown, this.dataBus[i].reportTemperature, this.dataBus[i].rampStatus];
        }

        //make waffles clickable to set a variable for a channel:
        for(i=0; i<this.nCrates; i++){
            this.canvas[i].onclick = function(event){clickWaffle(event, that)};
        }

        //draw the legends on the main views once only:
        this.legendTop = [];
            for(j=0; j<this.nCrates; j++){
                //draw legend:
                this.context[j].strokeStyle = '#000000';
                this.context[j].lineWidth = 2;
                this.legendTop[j] = this.totalHeight[j]*0.85;
                var legendColors = ['rgba(0,255,0,0.3)', 'rgba(255,255,0,0.3)', 'rgba(255,0,0,0.5)', 'rgba(0,0,255,0.5)', 'rgba(0,0,0,0.3)', 'rgba(0,0,0,0.9)'];
                var legendString = ['All OK', 'Ramping', 'Alarm!', 'Ext. Disable', 'Off', 'Absent'];
                for(i = 0; i<6; i++){
                    this.context[j].font = Math.min(16, fitFont(this.context[j], legendString[i], (this.canvasWidth*0.8/6 - this.cellSide[j]*1.1)*0.9  )) + 'px Raleway';
                    this.context[j].fillStyle = '#FFFFFF';
                    this.context[j].fillRect(this.canvasWidth*0.1 + i*this.canvasWidth*0.8/6, this.legendTop[j], this.cellSide[j], this.cellSide[j]);
                    this.context[j].fillStyle = legendColors[i];
                    this.context[j].fillRect(this.canvasWidth*0.1 + i*this.canvasWidth*0.8/6, this.legendTop[j], this.cellSide[j], this.cellSide[j]);
                    this.context[j].strokeRect(this.canvasWidth*0.1 + i*this.canvasWidth*0.8/6, this.legendTop[j], this.cellSide[j], this.cellSide[j]);
                    this.context[j].fillStyle = '#999999';
                    this.context[j].textBaseline = 'middle';
                    this.context[j].fillText(legendString[i], this.canvasWidth*0.1 + i*this.canvasWidth*0.8/6 + this.cellSide[j]*1.1, this.legendTop[j] + this.cellSide[j]/2);
                    this.context[j].textBaseline = 'bottom';
                    
                }
            }
            

        ///////////////////member functions/////////////////////////////////////////////////////////
        //decide which canvas to present:
        this.view = function(){
            if(this.viewStatus == -1)
                return this.canvasID+window.HVview;
            else return 'crate'+window.HVview+'bar'+this.viewStatus;
        };

        //determine per cell color info for start and finish.
        //Color info is packed as four numbers: red, green, blue, alpha
        this.cellColorUpdate = function(crate){
            var R, G, B, A, color, primary;
            for(var i=0; i<this.rows; i++){
                //primary row spans multi-columns:
                if(i==0) columns = window.parameters.moduleSizes[crate].length;
                else columns = this.cols[crate];
            	for(var j=0; j<columns; j++){
                    if(i > 0)
                        primary = primaryBin(window.parameters.moduleSizes[crate],j);
                    else primary = j;

    	         	//start values:
                    //show green on all clear:
    	            if( this.prevAlarmStatus[crate][i][j][0] == 0 && this.prevAlarmStatus[crate][i][j][1] == 0 && this.prevAlarmStatus[crate][i][j][2] == 0){
                        R = 0;
                        G = 255;
                        B = 0;
                        A = 0.3;
                    //else show grey if the channel is off:
                    } else if(this.prevAlarmStatus[crate][i][j][0] == -1){
                        R = 0;
                        G = 0;
                        B = 0;
                        A = 0.3;
                    //else show yellow if channel is ramping & no temperature or current alarms:
                    } else if(this.prevAlarmStatus[crate][i][j][0] == -2 && this.prevAlarmStatus[crate][i][j][1] == 0 && this.prevAlarmStatus[crate][i][j][2] == 0){
                        R = 255;
                        G = 255;
                        B = 0;
                        A = 0.3;
                    //blue for external disable:
                    } else if(this.prevAlarmStatus[crate][i][j][0] == -3){
                        R = 0;
                        G = 0;
                        B = 255;
                        A = 0.5;
                    //else show red for alarm:
                    } else {
                        R = 255;
                        G = 0;
                        B = 0;
                        A = Math.max(this.prevAlarmStatus[crate][i][j][0], this.prevAlarmStatus[crate][i][j][1], this.prevAlarmStatus[crate][i][j][2])*0.7 + 0.3;  //enforce minimum 0.3 to make it clearly red
                        if(A>1) {A = 1;}
    	            }

                    //12-channel cards don't have primary channels, show black (also empty slots):
                    if( (i==0 && window.parameters.moduleSizes[crate][j] == 1) || window.parameters.moduleSizes[crate][primary] == 0 ){
                        R = 0;
                        G = 0;
                        B = 0;
                        A = 0.9;
                    }
                    this.startColor[crate][i][j] = [R,G,B,A];

                    //end values:
                    if(this.alarmStatus[crate][i][j][0] == 0 && this.alarmStatus[crate][i][j][1] == 0 && this.alarmStatus[crate][i][j][2] == 0){
                        R = 0;
                        G = 255;
                        B = 0;
                        A = 0.3;
                    } else if(this.alarmStatus[crate][i][j][0] == -1){
                        R = 0;
                        G = 0;
                        B = 0;
                        A = 0.3;
                    } else if(this.alarmStatus[crate][i][j][0] == -2 && this.alarmStatus[crate][i][j][1] == 0 && this.alarmStatus[crate][i][j][2] == 0){
                        R = 255; 
                        G = 255;
                        B = 0;
                        A =0.3;
                    } else if(this.alarmStatus[crate][i][j][0] == -3){
                        R = 0;
                        G = 0;
                        B = 255;
                        A = 0.5;
                    } else {
                        R = 255;
                        G = 0;
                        B = 0;
                        A = Math.max(this.alarmStatus[crate][i][j][0], this.alarmStatus[crate][i][j][1], this.alarmStatus[crate][i][j][2])*0.7 + 0.3;  //enforce minimum 0.3 to make it clearly red
                        if(A>1) {A = 1;}
                    }
                    if( (i==0 && window.parameters.moduleSizes[crate][j] == 1) || window.parameters.moduleSizes[crate][primary] == 0 ){
                        R = 0;
                        G = 0;
                        B = 0;
                        A = 0.9;
                    }
                    this.endColor[crate][i][j] = [R,G,B,A];
    	       }
            }
        };

        this.draw = function(frame){

            var i, j;
            var R, G, B, A;
            var color;
            var columns;
            var cornerX, cornerY;

            //whiteout old canvas:
            this.context[window.HVview].globalAlpha = 1;
            this.context[window.HVview].clearRect(this.leftEdge[window.HVview],0,this.totalWidth,this.legendTop[window.HVview]);
            this.context[window.HVview].fillStyle = "rgba(255,255,255,1)"
            this.context[window.HVview].fillRect(this.leftEdge[window.HVview],0,this.cellSide[window.HVview]*this.cols[window.HVview],this.cellSide[window.HVview]*this.rows);

            for(i=0; i<this.rows; i++){
                //primary row spans multi-columns:
                if(i==0) columns = window.parameters.moduleSizes[window.HVview].length;
                else columns = this.cols[window.HVview];
                for(var j=0; j<columns; j++){
                    R = this.startColor[window.HVview][i][j][0] + (this.endColor[window.HVview][i][j][0] - this.startColor[window.HVview][i][j][0])*frame/this.nFrames;
                    G = this.startColor[window.HVview][i][j][1] + (this.endColor[window.HVview][i][j][1] - this.startColor[window.HVview][i][j][1])*frame/this.nFrames;
                    B = this.startColor[window.HVview][i][j][2] + (this.endColor[window.HVview][i][j][2] - this.startColor[window.HVview][i][j][2])*frame/this.nFrames;
                    A = this.startColor[window.HVview][i][j][3] + (this.endColor[window.HVview][i][j][3] - this.startColor[window.HVview][i][j][3])*frame/this.nFrames;
                    color = "rgba("+R+","+G+","+B+","+A+")";
            
                    this.context[window.HVview].fillStyle = color;
                    cornerY = i*this.cellSide[window.HVview];
                    //primary row has different size bins than the rest:
                    if(i != 0){
                        cornerX = this.leftEdge[window.HVview] + j*this.cellSide[window.HVview];
                        this.context[window.HVview].fillRect(cornerX, cornerY,this.cellSide[window.HVview],this.cellSide[window.HVview]);
                    }
                    else{
                        cornerX = 0;
                        for(var sum=0; sum<j; sum++){
                            cornerX = cornerX + Math.max(window.parameters.moduleSizes[window.HVview][sum],1);
                        }
                        cornerX = this.leftEdge[window.HVview] + cornerX*this.cellSide[window.HVview];
                        this.context[window.HVview].fillRect(cornerX, cornerY,this.cellSide[window.HVview]*Math.max(window.parameters.moduleSizes[window.HVview][j],1),this.cellSide[window.HVview]);

                    }
                }
            }

            /*
            //highlight cell in focus:
            this.context[window.HVview].strokeStyle = '#FFFFFF';
            this.context[window.HVview].lineWidth = 3;
            this.context[window.HVview].strokeRect(this.leftEdge[window.HVview],0,this.cellSide[window.HVview],this.cellSide[window.HVview])
            //this.context[window.HVview].strokeRect(this.leftEdge[window.HVview] + this.cellSide[window.HVview]*this.chx, this.cellSide[window.HVview]*this.chy, this.cellSide[window.HVview]*Math.max(window.parameters.moduleSizes[window.HVview][j],1),this.cellSide[window.HVview]);
            this.context[window.HVview].stroke();
            this.context[window.HVview].strokeStyle = '#000000';
            this.context[window.HVview].lineWidth = 1;
            */
                        

            this.drawWaffleDecorations(frame);
            this.drawWaffleLabels();
        };

        this.drawWaffleDecorations = function(frame){

            var i, j;

            var modDivCopy = [0];
            for(i=0; i < window.parameters.moduleSizes[window.HVview].length; i++){
                modDivCopy[i+1] = modDivCopy[i] + Math.max(window.parameters.moduleSizes[window.HVview][i],1);
            }
            modDivCopy.shift();

            //style lines:
            this.context[window.HVview].fillStyle = 'rgba(0,0,0,1)';
            this.context[window.HVview].lineWidth = 1;

            //draw border:
            this.context[window.HVview].strokeRect(this.leftEdge[window.HVview],0,this.cellSide[window.HVview]*this.cols[window.HVview], this.cellSide[window.HVview]*this.rows);

            //draw inner lines:
            for(i=1; i<this.rows; i++){
                this.context[window.HVview].beginPath();
                if(i==1) this.context[window.HVview].lineWidth = 3;
                else this.context[window.HVview].lineWidth = 1;
                this.context[window.HVview].moveTo(this.leftEdge[window.HVview],i*this.cellSide[window.HVview]);
                this.context[window.HVview].lineTo(this.leftEdge[window.HVview] + this.cellSide[window.HVview]*this.cols[window.HVview],i*this.cellSide[window.HVview]);
                this.context[window.HVview].stroke();       
            }
            for(j=1; j<this.cols[window.HVview]; j++){
                this.context[window.HVview].beginPath();
                if(j==modDivCopy[0]){
                    this.context[window.HVview].lineWidth = 3;
                    modDivCopy.shift();
                }
                else this.context[window.HVview].lineWidth = 1;
                if(this.context[window.HVview].lineWidth == 1){
                    this.context[window.HVview].moveTo(this.leftEdge[window.HVview] + j*this.cellSide[window.HVview],this.cellSide[window.HVview]);
                    this.context[window.HVview].lineTo(this.leftEdge[window.HVview] + j*this.cellSide[window.HVview],this.cellSide[window.HVview]*this.rows);
                } else {
                    this.context[window.HVview].moveTo(this.leftEdge[window.HVview] + j*this.cellSide[window.HVview],0);
                    this.context[window.HVview].lineTo(this.leftEdge[window.HVview] + j*this.cellSide[window.HVview],this.cellSide[window.HVview]*this.rows);
                }
                this.context[window.HVview].stroke();
            }

        };

        this.drawWaffleLabels = function(){
            var i, j;
            var moduleWidth, modRotation, modAlign, modHeight;
            
            this.context[window.HVview].fillStyle = 'white'; //'black'
            this.context[window.HVview].globalAlpha = 0.3;    //0.6

            //channel labels:
            var labelFontSize = Math.min(16, this.cellSide[window.HVview]);
            this.context[window.HVview].font=labelFontSize+"px Raleway";
            this.context[window.HVview].fillText('Prim', this.leftEdge[window.HVview] + this.cellSide[window.HVview]*this.cols[window.HVview]+10, this.cellSide[window.HVview]/2 +8 );
            for(i=1; i<this.rows; i++){
                this.context[window.HVview].fillText(i-1, this.leftEdge[window.HVview] + this.cellSide[window.HVview]*this.cols[window.HVview]+10, i*this.cellSide[window.HVview] + this.cellSide[window.HVview]/2 +8 );
            }

            //module labels:
            var moduleDivisions = [0];
            var vertOffset;
            for(i=0; i < window.parameters.moduleSizes[window.HVview].length; i++){
                moduleDivisions[i+1] = moduleDivisions[i] + Math.max(window.parameters.moduleSizes[window.HVview][i],1);
            }
            for(j=1; j<moduleDivisions.length; j++){
                var moduleWidth = moduleDivisions[j] - moduleDivisions[j-1];

                if(moduleWidth*this.cellSide[window.HVview] < 1.2*this.context[window.HVview].measureText(this.moduleLabels[j-1]).width){
                    modRotation = -Math.PI/2;  //2.4
                    modAlign = 'right';
                    modHeight = 0;
                    vertOffset = 15;
                } else {
                    modRotation = 0;
                    modAlign = 'center';
                    modHeight = labelFontSize;
                    vertOffset = 25;
                }
                this.context[window.HVview].save();
                this.context[window.HVview].translate(this.leftEdge[window.HVview] + (moduleWidth/2 + moduleDivisions[j-1])*this.cellSide[window.HVview], this.rows*this.cellSide[window.HVview]+vertOffset);
                this.context[window.HVview].rotate(modRotation);
                this.context[window.HVview].textAlign = modAlign;
                this.context[window.HVview].fillText(this.moduleLabels[j-1], 0,labelFontSize/2);
                this.context[window.HVview].restore();
            }
        };        

        //wrapper for transition from old state to new state via this.animate:
        this.update = function(){
            var i,j,k,columns;

            this.fetchNewData();

            //update alarms & colors to prepare for animation transition:
            for(k=0; k<this.nCrates; k++){
                for(i=0; i<this.rows; i++){
                    //primary row spans multi-columns:
                    if(i==0) columns = window.parameters.moduleSizes[k].length;
                    else columns = this.cols[k];
                    for(j=0; j<columns; j++){
                        this.prevAlarmStatus[k][i][j][0] = this.alarmStatus[k][i][j][0];
                        this.prevAlarmStatus[k][i][j][1] = this.alarmStatus[k][i][j][1];
                        this.prevAlarmStatus[k][i][j][2] = this.alarmStatus[k][i][j][2];
                        this.alarmStatus[k][i][j][0] = this.dataBus[k].alarmStatus[i][j][0];
                        this.alarmStatus[k][i][j][1] = this.dataBus[k].alarmStatus[i][j][1]; 
                        this.alarmStatus[k][i][j][2] = this.dataBus[k].alarmStatus[i][j][2];
                        //this.cellColorUpdate(k);
                    }
                }
                this.cellColorUpdate(k);
            }

            //update peripherals:
            for(k=0; k<this.nCrates; k++){
                for(i=0; i<this.barCharts[k].length; i++){
                    for(j=0; j<this.barCharts[k][i].nBars; j++){
                        var arrayCoords = getPointer(i, j, that, k);
                        this.barCharts[k][i].dataBus.barChartData[j] = this.dataBus[k].reportVoltage[arrayCoords[0]][arrayCoords[1]];
                        this.barCharts[k][i].dataBus.barChartAlarms[j] = this.dataBus[k].alarmStatus[arrayCoords[0]][arrayCoords[1]];
                    }
                    this.barCharts[k][i].update(this.barCharts[k][i].dataBus.barChartData, this.barCharts[k][i].dataBus.barChartAlarms);
                }
            }

            channelSelect(that);
            for(i=0; i<this.nCrates; i++){
                this.tooltip[i].update();
            }

            //animation fires only if canvas is showing:
            this.animate();

        };

        //determine which cell pixel x,y falls in, with this.leftEdge,0 being the top left corner of the canvas; return -1 if no corresponding cell.
        this.findCell = function(x, y){
            var cell, slot;

            var chx = Math.floor((x-this.leftEdge[window.HVview]) / this.cellSide[window.HVview]);
            var chy = Math.floor(y / this.cellSide[window.HVview]);
            slot = primaryBin(window.parameters.moduleSizes[window.HVview], chx)

            if(chx < this.cols[window.HVview] && chx > -1 && chy < this.rows && chy > -1){
                cell = [];
                if(chy == 0){
                    chx = slot;
                }
                cell[0] = chy;
                cell[1] = chx;
                if( (chy == 0 && window.parameters.moduleSizes[window.HVview][chx] == 1) || window.parameters.moduleSizes[window.HVview][slot] == 0 ) cell = -1;
            } else 
                cell = -1;

            return cell   
        };

        //establish the tooltip text for the cell returned by this.findCell; return length of longest line:
        this.defineText = function(cell){
            var toolTipContent = '<br>';
            var nextLine, buffer;
            var cardIndex;
            var i;

            var row = cell[0];
            var col = cell[1];

            //decide which card we're pointing at:
            if(row == 0) cardIndex = col;
            else cardIndex = primaryBin(window.parameters.moduleSizes[window.HVview], col);

            //Title for normal channels:
            if(row != 0) nextLine = this.moduleLabels[cardIndex]+', '+window.parameters.rowTitles[0]+' '+channelMap(col, row, window.parameters.moduleSizes[window.HVview], this.rows)+'<br>';
            //Title for primary channels:
            else nextLine = this.moduleLabels[cardIndex]+' Primary <br>';
            toolTipContent += nextLine;

            //channel Name
            nextLine = this.dataBus[window.HVview].channelName[row][col]+'<br>';
            toolTipContent += nextLine;            

            //fill out tooltip content:
            for(i=0; i<this.reportedValues[window.HVview].length; i++){
                //establish prefix:
                nextLine = '<br/>'+this.tooltip[window.HVview].prefix[i];
                if(this.tooltip[window.HVview].prefix[i] !== '') nextLine += ' ';

                //pull in content; special cases for the status word and reported current:
                //status word:
                if(i == 6){
                    nextLine += ((this.dataBus[window.HVview].channelMask[row][col] == 0) ? 'Off' : parseStatusWord(this.reportedValues[window.HVview][i][row][col]));
                }
                //current:
                else if(i == 2){
                        if(window.parameters.moduleSizes[window.HVview][cardIndex]==4 && row!=0) nextLine += '--';
                        else nextLine += Math.round( this.reportedValues[window.HVview][i][row][col]*1000)/1000 + ' ' + this.tooltip[window.HVview].postfix[i];                
                } else {
                    nextLine += Math.round( this.reportedValues[window.HVview][i][row][col]*1000)/1000 + ' ' + this.tooltip[window.HVview].postfix[i];
                }

                //append to tooltip:
                toolTipContent += nextLine;
 
            }
            toolTipContent += '<br><br>';
            document.getElementById(this.tooltip[window.HVview].ttDivID).innerHTML = toolTipContent;

            return 0;
        };

        //get new data:
        this.fetchNewData = function(){
            
            var testParameter, i, j, k, data, ODBindex, columns, slot, variablesRecord, settingsRecord,
            chName = [],
            reqVoltage = [],
            measVoltage = [],
            measCurrent = [],
            rampUp = [],
            rampDown = [],
            measTemperature = [],
            repoChState = [],
            repoChStatus = [],
            voltageLimit = [],
            currentLimit = [],
            paths = [];
        
            //batch fetch all in one big lump: -depricated, moved out to ODBgrab
            /*
            for(k=0; k<this.nCrates; k++){

                for(i=0; i<window.parameters.ODBkeys.length; i++){
                    paths[k*window.parameters.ODBkeys.length + i] = '/Equipment/'+window.parameters.HVequipmentNames[k]+'/'+window.parameters.ODBkeys[i]+'[*]';
                }
                
            }
            
            data = ODBMGet(paths);

            for(k=0; k<this.nCrates; k++){
                chName[k]          = data[k*window.parameters.ODBkeys.length + 10];
                reqVoltage[k]      = data[k*window.parameters.ODBkeys.length + 0];
                measVoltage[k]     = data[k*window.parameters.ODBkeys.length + 1];
                measCurrent[k]     = data[k*window.parameters.ODBkeys.length + 2];
                rampUp[k]          = data[k*window.parameters.ODBkeys.length + 3];
                rampDown[k]        = data[k*window.parameters.ODBkeys.length + 4];
                measTemperature[k] = data[k*window.parameters.ODBkeys.length + 5];
                repoChState[k]     = data[k*window.parameters.ODBkeys.length + 6];
                repoChStatus[k]    = data[k*window.parameters.ODBkeys.length + 7];
                voltageLimit[k]    = data[k*window.parameters.ODBkeys.length + 8];
                currentLimit[k]    = data[k*window.parameters.ODBkeys.length + 9];                    
            }
            */
            //fetch all the HV parameters from the chunk of ODB hanging around locally:
            for(k=0; k<this.nCrates; k++){
                chName[k]          = window.localODB['HV'+k].chName;  
                reqVoltage[k]      = window.localODB['HV'+k].reqVoltage;  
                measVoltage[k]     = window.localODB['HV'+k].measVoltage;
                measCurrent[k]     = window.localODB['HV'+k].measCurrent; 
                rampUp[k]          = window.localODB['HV'+k].rampUp;
                rampDown[k]        = window.localODB['HV'+k].rampDown;
                measTemperature[k] = window.localODB['HV'+k].measTemperature;
                repoChState[k]     = window.localODB['HV'+k].repoChState;
                repoChStatus[k]    = window.localODB['HV'+k].repoChStatus;
                voltageLimit[k]    = window.localODB['HV'+k].voltageLimit;
                currentLimit[k]    = window.localODB['HV'+k].currentLimit;        
            }
                


            for(k=0; k<this.nCrates; k++){
                for(i=0; i<this.rows; i++){
                    //primary row spans multi-columns, only has entries for 48 channel cards:        
                    if(i==0) columns = window.parameters.moduleSizes[k].length;
                    else columns = this.cols[k];

                    for(j=0; j<columns; j++){
                  
                        if (i>0) slot = primaryBin(window.parameters.moduleSizes[k], j);
                        else slot = j;
                        //don't populate the primary of a 12 channel card, or any channel corresponding to an empty slot:
                        if( (i!=0 || window.parameters.moduleSizes[k][j]==4) && window.parameters.moduleSizes[k][slot]!=0 ){
                               
                            this.dataBus[k].channelName[i][j] = 'channel'+i+j;
                            this.dataBus[k].demandVoltage[i][j] = -9999;
                            this.dataBus[k].reportVoltage[i][j] = -9999;
                            this.dataBus[k].reportCurrent[i][j] = -9999;
                            this.dataBus[k].demandVrampUp[i][j] = -9999;
                            this.dataBus[k].demandVrampDown[i][j] = -9999;
                            this.dataBus[k].reportTemperature[i][j] = -9999;
                            this.dataBus[k].channelMask[i][j] = 1;
                            this.dataBus[k].rampStatus[i][j] = 7;
                            this.dataBus[k].voltLimit[i][j] = -9999;
                            this.dataBus[k].currentLimit[i][j] = -9999;

                            ODBindex = getMIDASindex(i, j, k);
                            this.dataBus[k].channelName[i][j]       = chName[k][ODBindex];
                            this.dataBus[k].demandVoltage[i][j]     = parseFloat(reqVoltage[k][ODBindex]);
                            this.dataBus[k].reportVoltage[i][j]     = parseFloat(measVoltage[k][ODBindex]);   
                            this.dataBus[k].reportCurrent[i][j]     = parseFloat(measCurrent[k][ODBindex]);
                            
                            this.dataBus[k].demandVrampUp[i][j]     = parseFloat(rampUp[k][ODBindex]);
                            this.dataBus[k].demandVrampDown[i][j]   = parseFloat(rampDown[k][ODBindex]);
                            this.dataBus[k].reportTemperature[i][j] = parseFloat(measTemperature[k][ODBindex]);
                            this.dataBus[k].channelMask[i][j]       = ( parseFloat(repoChState[k][ODBindex]) && parseFloat(repoChStatus[k][ODBindex]) ) ? 1 : 0 ;
                            this.dataBus[k].rampStatus[i][j]        = parseFloat(repoChStatus[k][ODBindex]);
                            this.dataBus[k].voltLimit[i][j]         = parseFloat(voltageLimit[k][ODBindex]);
                            this.dataBus[k].currentLimit[i][j]      = parseFloat(currentLimit[k][ODBindex]);

                            //48ch cards report the currents in mA, convert to uA: 
                            if(i==0){
                                this.dataBus[k].reportCurrent[i][j] = this.dataBus[k].reportCurrent[i][j]*1000;
                                this.dataBus[k].currentLimit[i][j] = this.dataBus[k].currentLimit[i][j]*1000;
                            }
                                
                        } else if (i!=0 || window.parameters.moduleSizes[k][j]==4){  //keep the array filled, even for empty slots to avoid unpredictable behavior
                            this.dataBus[k].channelName[i][j] = 'channel'+i+j;
                            this.dataBus[k].demandVoltage[i][j] = 0;
                            this.dataBus[k].reportVoltage[i][j] = 0;
                            this.dataBus[k].reportCurrent[i][j] = 0;
                            this.dataBus[k].demandVrampUp[i][j] = 0;
                            this.dataBus[k].demandVrampDown[i][j] = 0;
                            this.dataBus[k].reportTemperature[i][j] = 0;
                            this.dataBus[k].channelMask[i][j] = 0;
                            this.dataBus[k].rampStatus[i][j] = 0;
                            this.dataBus[k].voltLimit[i][j] = 0;
                            this.dataBus[k].currentLimit[i][j] = 0;
                        }

                        //give the necessary information to the AlarmService, so it can report the state of any channel that trips an alarm below:
                        if(j==0){
                            this.AlarmServices.demandVoltage[k][i] = [];
                            this.AlarmServices.reportVoltage[k][i] = [];
                            this.AlarmServices.reportCurrent[k][i] = [];
                            this.AlarmServices.reportTemperature[k][i] = [];
                        }
                        this.AlarmServices.demandVoltage[k][i][j] = this.dataBus[k].demandVoltage[i][j];
                        this.AlarmServices.reportVoltage[k][i][j] = this.dataBus[k].reportVoltage[i][j];
                        this.AlarmServices.reportCurrent[k][i][j] = this.dataBus[k].reportCurrent[i][j];
                        this.AlarmServices.reportTemperature[k][i][j] = this.dataBus[k].reportTemperature[i][j];
                    }
                }
            }

            //see if any of the new data raises any alarms:
            this.raiseAlarm();

        };

        //push problems out to the alarm service
        this.raiseAlarm = function(){
            var i, j, k;
            //determine alarm status
            for(k=0; k<this.nCrates; k++){
                for(i=0; i<this.rows; i++){
                    //primary row spans multi-columns:
                    if(i==0) columns = window.parameters.moduleSizes[k].length;
                    else columns = this.cols[k];
                    for(j=0; j<columns; j++){
                        //construct the parameter to be tested against the voltage alarm:
                        testParameter = Math.abs(this.dataBus[k].demandVoltage[i][j] - this.dataBus[k].reportVoltage[i][j]); 

                        //determine alarm status for each cell, recorded as [i][j][voltage alarm, current alarm, temperature alarm]
                        //alarmStatus == 0 indicates all clear, 0 < alarmStatus <= 1 indicates alarm intensity, alarmStatus = -1 indicates channel off,
                        //and alarmStatus == -2 for the voltage alarm indicates voltage ramping, -3 for misc disabled conditions:
                        if(testParameter < window.parameters.alarmThresholds[0])  this.dataBus[k].alarmStatus[i][j][0] = 0;
                        else this.dataBus[k].alarmStatus[i][j][0] = Math.min( (testParameter - window.parameters.alarmThresholds[0]) / window.parameters.scaleMaxima[0], 1);
                        if(this.dataBus[k].rampStatus[i][j] == 3 || this.dataBus[k].rampStatus[i][j] == 5){
                            this.dataBus[k].alarmStatus[i][j][0] = -2;
                        }
                        if(this.dataBus[k].rampStatus[i][j] == 256)
                            this.dataBus[k].alarmStatus[i][j][0] = -3;

                        if(this.dataBus[k].reportCurrent[i][j] < window.parameters.alarmThresholds[1])  this.dataBus[k].alarmStatus[i][j][1] = 0;
                        else  this.dataBus[k].alarmStatus[i][j][1] = Math.min( (this.dataBus[k].reportCurrent[i][j] - window.parameters.alarmThresholds[1]) / window.parameters.scaleMaxima[1], 1);

                        if(this.dataBus[k].reportTemperature[i][j] < window.parameters.alarmThresholds[2])  this.dataBus[k].alarmStatus[i][j][2] = 0;
                        else  this.dataBus[k].alarmStatus[i][j][2] = Math.min( (this.dataBus[k].reportTemperature[i][j] - window.parameters.alarmThresholds[2]) / window.parameters.scaleMaxima[2], 1);

                        if(this.dataBus[k].channelMask[i][j] == 0){
                            this.dataBus[k].alarmStatus[i][j][0] = -1;
                            this.dataBus[k].alarmStatus[i][j][1] = -1;
                            this.dataBus[k].alarmStatus[i][j][2] = -1;
                        }

                        //fire an event at the AlarmServices object for every alarm:
                        //voltage alarms:
                        /*
                        if(this.dataBus[k].alarmStatus[i][j][0] > 0){
                            var voltageAlarm = new  CustomEvent("alarmTrip", {
                                                        detail: {
                                                            alarmType: 'voltage',
                                                            alarmStatus: [i,j,k,this.dataBus[k].alarmStatus[i][j][0]]        
                                                        }
                                                    });
                            AlarmServices.div.dispatchEvent(voltageAlarm);
                        }
                        //current alarms:
                        if(this.dataBus[k].alarmStatus[i][j][1] > 0){
                            var currentAlarm = new  CustomEvent("alarmTrip", {
                                                        detail: {
                                                            alarmType: 'current',
                                                            alarmStatus: [i,j,k,this.dataBus[k].alarmStatus[i][j][1]]        
                                                        }
                                                    });
                            AlarmServices.div.dispatchEvent(currentAlarm);
                        }
                        //temperature alarms:
                        if(this.dataBus[k].alarmStatus[i][j][2] > 0){
                            var temperatureAlarm = new  CustomEvent("alarmTrip", {
                                                            detail: {
                                                                alarmType: 'temperature',
                                                                alarmStatus: [i,j,k,this.dataBus[k].alarmStatus[i][j][2]]        
                                                            }
                                                        });
                            AlarmServices.div.dispatchEvent(temperatureAlarm);
                        }
                        */
                    }
                }
            }

            //let the alarm services know the update is complete:
            //why is this in the HV service?  moved out to the masterLoop, hopefully nothing breaks:
            //var allDone = new   CustomEvent("refreshComplete", {
            //                    });
            //AlarmServices.div.dispatchEvent(allDone);
        };

        this.animate = function(){
            //var i, 
            //topHV = window.HVview;

            if(window.onDisplay.slice(0,6) == 'HVgrid' /*|| window.freshLoad*/){
                /*
                for(i=0; i<this.nCrates; i++){  
                    if(i!=topHV){
                        window.HVview = i;
                        this.draw(this.nFrames);
                    }
                }
                */
                //window.HVview = topHV;
                animate(this, 0);
            } /*else{
                for(i=0; i<this.nCrates; i++){
                    window.HVview = i;
                    this.draw(this.nFrames);      
                }
                window.HVview = topHV;
            }*/
        };

        //do an initial populate of the waffle:
        this.fetchNewData();
        //also, draw the input sidebar for 0,0 on first call:
        channelSelect(that);
}











//some useful globals

//define the onclick behavior of the waffle:
function clickWaffle(event, obj){

            window.refreshInput = 1;

            var superDiv = document.getElementById(obj.wrapperDiv);
            var inputDiv = document.getElementById(obj.InputLayer);

            //form coordinate system chx, chy with origin at the upper left corner of the div, and 
            //bin as the waffle binning: 
            var chx = Math.floor( (event.pageX - obj.leftEdge[window.HVview] - superDiv.offsetLeft - obj.canvas[window.HVview].offsetLeft) / obj.cellSide[window.HVview]);
            var chy = Math.floor( (event.pageY - superDiv.offsetTop - obj.canvas[window.HVview].offsetTop) / obj.cellSide[window.HVview]);

            //are we on the primary of a card that doesn't have a primary, or an empty slot??
            var suppressClick = 0;
            var cardIndex = primaryBin(window.parameters.moduleSizes[window.HVview], chx);
            if( (chy==0 && window.parameters.moduleSizes[window.HVview][cardIndex] == 1) || window.parameters.moduleSizes[window.HVview][cardIndex] == 0 ) suppressClick = 1;

            if(chx<obj.cols[window.HVview] && chx>=0 && chy<obj.rows && chy>=0 && window.onDisplay == obj.canvasID[window.HVview] && suppressClick==0){
                obj.chx = chx;
                obj.chy = chy;
                channelSelect(obj);
            }

}

//map the active grid cooridnates onto MIDAS's channel numbering:
function getMIDASindex(row, col, crate){
    
    var MIDASindex = 0;
    var moduleNumber, i;

    if(row != 0){
        //count up regular channels
        MIDASindex += window.parameters.rows*col + row-1;
        moduleNumber = primaryBin(window.parameters.moduleSizes[crate], col);
        for(i=0; i<moduleNumber+1; i++){
            //add on primary channels
            if(window.parameters.moduleSizes[crate][i] == 4) MIDASindex++;
            //remove overcounting for empty cards:
            if(window.parameters.moduleSizes[crate][i] == 0) MIDASindex -= 12;
        }
    } else{
        moduleNumber = col;
        //add up all the channels from previous cards:
        for(i=0; i<moduleNumber; i++){
            if(window.parameters.moduleSizes[crate][i] == 1) MIDASindex += 12;
            if(window.parameters.moduleSizes[crate][i] == 4) MIDASindex += 49;
        }
        //MIDASindex++;
    }

    return MIDASindex;
}

//given a module number and channel number, return the [row, col] that the corresponding data will be found in in the various waffle.<dataArrays>
function getPointer(module, channel, waffle, crate){
    var i;
    var row = 0;
    var col = 0;

    //column:
    for(i=0; i<module; i++){
        col += Math.max(window.parameters.moduleSizes[crate][i],1);
    }
    col += Math.floor(channel/(waffle.rows-1));

    row = 1 + channel%(waffle.rows-1);

    return [row, col];
}

//map the channel-sized bins in the primary row into the appropriate primary groups:
function primaryBin(moduleSizes, chx){
    var primary = 0;
    var i = 0;
    while(chx>=0){
        chx = chx - Math.max(moduleSizes[i],1);
        i++;
    }
    return i-1;
}

//map the bin coordinates chx and chy onto a channel number:
function channelMap(chx, chy, moduleSizes, rows){
    var primary = primaryBin(moduleSizes, chx);
    if (moduleSizes[primary] == 1) return chy - 1;
    else{
        var channelNo = (rows-1)*chx + chy-1;
        for(var i=0; i<primary; i++){
            channelNo -= (rows-1)*Math.max(moduleSizes[i],1);
        }
        return channelNo;
    }
}

//set up channel navigation dropdowns and modify on the fly:
function configureDropdowns(ChannelListDD, CardListDD, moduleLabels, moduleSizes){

    var i;
    var option = [];

    //establish card list
    var colDD = document.getElementById(CardListDD);
    for(i=0; i<moduleLabels.length; i++){
        if(moduleSizes[i] != 0){
            option[i] = document.createElement('option');
            option[i].text = moduleLabels[i];
            colDD.add(option[i], null);
        }
    }

    //establish channel list
    var rowDD = document.getElementById(ChannelListDD);
    for(i=0; i<12; i++){
        option[i] = document.createElement('option');
        option[i].text = i;
        rowDD.add(option[i], null);
    }

}

//reconfigure channel drop down to respond to changes in module:
function reconfigureChannelList(moduleLabels, moduleSizes, ChannelListDD){

    var i, index, nChan;

    //fetch whatever's in the card dropdown:
    var cardName = getInput('changeChannel', 0);

    //...and channel dropdown:
    var channelNumber = getInput('changeChannel', 1);

    //translate cardName into an index:
    for(i=0; i<moduleLabels.length; i++){
        if(cardName == moduleLabels[i]) index = i;
    }

    //decide how many channels should be in the channel dropdown:
    if(moduleSizes[index] == 4) nChan = 48;
    else nChan = 12;

    //establish channel list
    var option = [];
    var rowDD = document.getElementById(ChannelListDD);
    for(i=0; i<49; i++){
        rowDD.remove(0);
    }
    var startIndex = 0;
    if(nChan == 48){
        option[0] = document.createElement('option');
        option[0].text = 'Primary';
        rowDD.add(option[0], null);
        startIndex++;
    }
    for(i=startIndex; i<nChan+startIndex; i++){
        option[i] = document.createElement('option');
        option[i].text = i-startIndex;
        rowDD.add(option[i], null);
    }

    //keep the channel number in the same place if possible:
    if(channelNumber == 'Primary' && nChan==12) setInput('changeChannel',1,0); 
    else if(channelNumber >= nChan) setInput('changeChannel',1,0);
    else setInput('changeChannel',1,channelNumber);

}

//swap from one mainframe view to another:
function swapHVmainframe(inbound){
    var i;

    //if a bar chart is showing, dismiss it:
    if(window.HVpointer.viewStatus >= 0){
        fadeOut('crate'+window.HVview+'bar'+window.HVpointer.viewStatus)
        document.getElementById('crate'+window.HVview+'card'+window.HVpointer.viewStatus).setAttribute('class', 'navLink');
    }
    window.HVpointer.viewStatus = -1;

    //fade canvases:
    fadeOut(window.HVpointer.canvasID[window.HVview]);
    fadeIn(window.HVpointer.canvasID[inbound])

    //highlight buttons
    document.getElementById('Main'+(window.HVview+1)).setAttribute('class', 'navLink');
    document.getElementById('Main'+(inbound+1)).setAttribute('class', 'navLinkDown');
    //switch nav bars
    $('#'+window.HVpointer.linkWrapperID+window.HVview).css('display', 'none');
    $('#'+window.HVpointer.linkWrapperID+inbound).css('display', 'block');
    $('#'+window.HVpointer.linkWrapperID+window.HVview).css('z-index', -1);
    $('#'+window.HVpointer.linkWrapperID+inbound).css('z-index', 10);

    //keep tabs on what's showing where
    window.HVpointer.viewStatus=-1;
    window.HVview = inbound;
    window.onDisplay = window.HVpointer.canvasID[inbound];

    //make sure the waffle is pointing at a channel that actually has something in it before the initial populate:
    window.HVpointer.chy = 1;
    i=0;
    while(window.parameters.moduleSizes[inbound][i] == 0) i++;
    window.HVpointer.chx = i;

    //point the input sidebar at the new crate:
    channelSelect(window.HVpointer);
}

//bar chart response:
function barChartButton(button){
    var inbound;

    button.setAttribute('class', 'navLinkDown');
    if(window.HVpointer.viewStatus >= 0){
        document.getElementById('crate'+window.HVview+'card'+window.HVpointer.viewStatus).setAttribute('class', 'navLink');
    }
    window.HVpointer.viewStatus = button.cardNumber;

    inbound = 'crate'+window.HVview+'bar'+window.HVpointer.viewStatus

    if(inbound != window.onDisplay){
        fadeOut(window.onDisplay);
        fadeIn(inbound);
        window.onDisplay = inbound;
    }
}










//SHARC////////////////////////////////////////////////////////////
//SHARC assets: x0, y0 = center of shape
//Quad back summary - azimuthal segments, colors sorted azimuthally
quadBack = function(context, x0, y0, innerRad, outerRad, squish, colors, TT){
    
    var angularStep = (2*Math.PI)/colors.length;

    for(i=0; i<colors.length; i++){
        azimuthalSegment(context, x0, y0, innerRad, outerRad, angularStep, Math.PI-(i+1)*angularStep, squish, colors[i], TT);
    }

}

//draws a wedge shaped segment
azimuthalSegment = function(context, x0, y0, innerRad, outerRad, arc, orientation, squish, color, TT){
    context.fillStyle = (color==0xDEADBEEF) ? context.createPattern(window.parameters.warningFill, 'repeat') : color;
    context.strokeStyle = ( (TT) ? '#123456' : '#999999' );

    context.save();
    context.translate(x0, y0);
    context.scale(1,squish);
    context.rotate(-orientation);
    context.beginPath();
    context.arc(0,0,innerRad, 0, -arc, true);
    context.lineTo(outerRad*Math.cos(arc), -outerRad*Math.sin(arc));
    context.arc(0,0,outerRad, -arc, 0, false);
    context.closePath();
    context.fill();
    context.stroke();
    context.restore();
}

//Quad front summary - radial segments.  Colors should be sorted first by array position (ie quadrant), then by smallest to largest radius.
quadFront = function(context, x0, y0, innerRad, outerRad, squish, colors, TT){

    var radStep = (outerRad - innerRad)/4;

    for(i=0; i<colors.length; i++){
        annularSegment(context, x0, y0, innerRad+(i%4)*radStep, innerRad + ((i%4)+1)*radStep, Math.PI/2, Math.PI/2*Math.floor(i/4), squish, colors[i], TT);
    }

}

//draws a macaroni-shaped segment that extends <arc> radians CCW from angle <orientation>
annularSegment = function(context, x0, y0, innerRad, outerRad, arc, orientation, squish, color, TT){
    context.fillStyle = (color==0xDEADBEEF) ? context.createPattern(window.parameters.warningFill, 'repeat') : color;
    context.strokeStyle = ( (TT) ? '#123456' : '#999999' );

    context.save();
    context.translate(x0, y0);
    context.scale(-1,squish);
    context.rotate(-orientation);
    context.beginPath();
    context.arc(0,0,innerRad, 0, -arc, true);
    context.lineTo(outerRad*Math.cos(arc), -outerRad*Math.sin(arc));
    context.arc(0,0,outerRad, -arc, 0, false);
    context.closePath();
    context.fill();
    context.stroke();
    context.restore();

}

//stack of four horizontal parallelograms for summary view; colors stack bottom to top:
horizStack = function(context, X0, Y0, width, height, colors, pitch, TT){
    var i, y0, x0, dX, dY, stripWidth;

    context.strokeStyle = ( (TT) ? '#123456' : '#999999' );

    //for the pads:
    if(colors.length==1){
        horizPara(context, X0, Y0, width, height, colors[0], pitch, TT);  
        return;
    }

    if(pitch == 'h'){
        //center of first strip:
        y0 = Y0 + 1.5*height/4,
        x0 = X0 - 1.5*height/4*Math.tan(Math.PI/6),
        dX = height/4*Math.tan(Math.PI/6),
        dY = height/4;
        for(i=0; i<4; i++){
            horizPara(context, x0+i*dX, y0-i*dY, width - 0.75*height*Math.tan(Math.PI/6), height/4, colors[i], pitch, TT );
        }
    } else {
        stripWidth = (height-width*Math.tan(Math.PI/6))/4;
        x0 = X0;
        y0 = Y0 + 1.5*stripWidth;
        dY = stripWidth;
        dX = 0;
        for(i=0; i<4; i++){
            horizPara(context, x0+i*dX, y0-i*dY, width, (height-width*Math.tan(Math.PI/6))/4+width*Math.tan(Math.PI/6), colors[i], pitch, TT );
        }
    }



}

//paralellogram with horizontal stripes - pitch = 'h' for top and bottom parallel to x or 'v' for left and right parallel to y
horizPara = function(context, x0, y0, width, height, color, pitch, TT){

    var theta = Math.PI/6,
        yLength, xLength,
        //cx, cy coords of bottom left corner
        cx = x0 - width/2,
        cy = y0 + height/2;

    context.fillStyle = (color==0xDEADBEEF) ? context.createPattern(window.parameters.warningFill, 'repeat') : color;
    context.beginPath();
    context.moveTo(cx,cy);
    if(pitch == 'h'){
        yLength = height / Math.cos(theta);
        xLength = width - height*Math.tan(theta);
        context.lineTo(cx + height*Math.tan(theta), cy - height);
        context.lineTo(cx+width, cy-height);
        context.lineTo(cx+xLength, cy);
    } else{
        xLength = width / Math.cos(theta);
        yLength = height - width*Math.tan(theta);
        context.lineTo(cx, cy-yLength);
        context.lineTo(cx+width, cy-height);
        context.lineTo(cx+width, cy - (height-yLength) )
    }
    context.closePath();
    context.fill();
    context.stroke();

}

//stack of four vertical parallelograms for summary view; colors stack left to right:
vertStack = function(context, X0, Y0, width, height, colors, pitch, TT){
    var i, y0, x0, dX, dY, stripWidth;

    context.strokeStyle = ( (TT) ? '#123456' : '#999999' );

    //for the pads:
    if(colors.length==1){
        vertPara(context, X0, Y0, width, height, colors[0], pitch, TT);  
        return;
    }

    if(pitch == 'h'){
        //center of first strip:
        y0 = Y0,
        x0 = X0 - 1.5*(width - height*Math.tan(Math.PI/6))/4,
        dX = (width - height*Math.tan(Math.PI/6))/4,
        dY = 0;
        for(i=0; i<4; i++){
            vertPara(context, x0+i*dX, y0, (width + 3*height*Math.tan(Math.PI/6))/4, height, colors[i], pitch, TT );
        }
    } else {
        stripWidth = width/4/Math.cos(Math.PI/6);
        dY = stripWidth*Math.sin(Math.PI/6);
        dX = width/4;
        x0 = X0 - 1.5*dX;
        y0 = Y0 + 1.5*dY;
        for(i=0; i<4; i++){
            vertPara(context, x0+i*dX, y0-i*dY, width/4, (height-0.75*width*Math.tan(Math.PI/6)), colors[i], pitch, TT );
        }
    }



}

//paralellogram with vertical stripes
vertPara = function(context, x0, y0, width, height, color, pitch, TT){

    var theta = Math.PI/6,
        yLength, xLength,
        //cx, cy coords of bottom left corner
        cx = x0 - width/2,
        cy = y0 + height/2;

    context.fillStyle = (color==0xDEADBEEF) ? context.createPattern(window.parameters.warningFill, 'repeat') : color;
    context.beginPath();
    context.moveTo(cx,cy);
    if(pitch == 'h'){
        yLength = height / Math.cos(theta);
        xLength = width - height*Math.tan(theta);
        context.lineTo(cx + height*Math.tan(theta), cy - height);
        context.lineTo(cx+width, cy-height);
        context.lineTo(cx+xLength, cy);
    } else{
        xLength = width / Math.cos(theta);
        yLength = height - width*Math.tan(theta);
        context.lineTo(cx, cy-yLength);
        context.lineTo(cx+width, cy-height);
        context.lineTo(cx+width, cy - (height-yLength) )
    }
    context.closePath();
    context.fill();
    context.stroke();

}

radialQuadrant = function(context, x0, y0, innerRad, outerRad, arc, orientation, colors, TT){
    var i,
        segments = colors.length,
        radStep = (outerRad - innerRad) / segments;

    context.save();
    context.translate(x0,y0);
    context.rotate(orientation);

    //outline cell or suppress antialiasing, as appropriate
    if(TT)
        context.strokeStyle = '#123456';
    else
        context.strokeStyle = '#999999';

    for(i=0; i<segments; i++){
        context.fillStyle = colors[i];
        context.beginPath();
        context.arc(0,0,innerRad + i*radStep, -arc/2, arc/2, false);
        context.arc(0,0,innerRad + (i+1)*radStep, arc/2, -arc/2, true);
        context.closePath();
        context.fill();
        context.stroke();
    }

    context.restore();

}

azimuthalQuadrant = function(context, x0, y0, innerRad, outerRad, arc, orientation, colors, TT){
    var i,
        segments = colors.length,
        angleStep = arc / segments;

    context.save();
    context.translate(x0,y0);
    context.rotate(orientation);

    //outline cell or suppress antialiasing, as appropriate
    if(TT)
        context.strokeStyle = '#123456';
    else
        context.strokeStyle = '#999999';

    for(i=0; i<segments; i++){
        context.fillStyle = colors[i];
        context.beginPath();
        context.arc(0,0,innerRad, -arc/2 + i*angleStep, -arc/2 + (i+1)*angleStep  , false);
        context.arc(0,0,outerRad, -arc/2 + (i+1)*angleStep, -arc/2 + i*angleStep, true);
        context.closePath();
        context.fill();
        context.stroke();
    }

    context.restore();

}

boxFront = function(context, x0,y0, height, width, colors, TT){
    var i,
        nStrips = colors.length,
        stripWidth = height/nStrips;

    //outline cell or suppress antialiasing, as appropriate
    if(TT)
        context.strokeStyle = '#123456';
    else
        context.strokeStyle = '#999999';

    for(i=0; i<nStrips; i++){
        context.fillStyle = (colors[i]==0xDEADBEEF) ? context.createPattern(window.parameters.warningFill, 'repeat') : colors[i];
        context.fillRect(x0, y0+i*stripWidth, width, stripWidth);
        context.strokeRect(x0, y0+i*stripWidth, width, stripWidth);
    }
}

boxBack = function(context, x0,y0, height, width, colors, TT){
    var i,
        nStrips = colors.length,
        stripWidth = width/nStrips;

    //outline cell or suppress antialiasing, as appropriate
    if(TT)
        context.strokeStyle = '#123456';
    else
        context.strokeStyle = '#999999';

    for(i=0; i<nStrips; i++){
        context.fillStyle = (colors[i]==0xDEADBEEF) ? context.createPattern(window.parameters.warningFill, 'repeat') : colors[i];
        context.fillRect(x0+i*stripWidth, y0, stripWidth, height);
        context.strokeRect(x0+i*stripWidth, y0, stripWidth, height);
    }
}

padSummaries = function(context, x0, y0, scale, colors, TT){

    //outline cell or suppress antialiasing, as appropriate
    if(TT)
        context.strokeStyle = '#123456';
    else
        context.strokeStyle = '#999999';   

    context.fillStyle = colors[0];
    context.fillRect(x0-1.5*scale, y0-scale/2, scale, scale);
    context.strokeRect(x0-1.5*scale, y0-scale/2, scale, scale);

    context.fillStyle = colors[1];
    context.fillRect(x0+0.5*scale, y0-scale/2, scale, scale);
    context.strokeRect(x0+0.5*scale, y0-scale/2, scale, scale);    

}

//draw elliptical arc:
ellipse = function(context, centerX, centerY, horizRadius, startAngle, endAngle){
    context.save();
    context.translate(centerX, centerY);
    context.scale(1, 0.3);
    context.beginPath();
    context.arc(0, 0, horizRadius, 2*Math.PI - startAngle, 2*Math.PI - endAngle);
    context.restore();
    context.closePath();
    context.stroke();
}

//draw spokes from center ellipse to outer ellipse
ellipseSpoke = function(context, centerX, centerY, horizRadiusInner, horizRadiusOuter, phase, nSpokes, spokeNumber){

    //angle between spokes
    var sectionArc = 2*Math.PI / nSpokes;
    //angle of this spoke; recall the internet counts its angles backwards :(
    var phi = 2*Math.PI - (phase + spokeNumber*sectionArc);

    context.save();
    context.translate(centerX, centerY);
    context.scale(1, 0.3);
    //context.beginPath();
    context.moveTo(horizRadiusInner*Math.cos(phi), horizRadiusInner*Math.sin(phi));
    context.lineTo(horizRadiusOuter*Math.cos(phi), horizRadiusOuter*Math.sin(phi));
    context.restore();
    context.stroke();

}

//color in a particular annular section
fillAnnularSection = function(drawOption, context, centerX, centerY, innerRadius, outerRadius, startAngle, endAngle){

    context.save();
    context.translate(centerX, centerY);
    context.scale(1, 0.3);
    context.beginPath();
    context.moveTo(innerRadius*Math.cos(2*Math.PI - startAngle), innerRadius*Math.sin(2*Math.PI - startAngle));
    context.arc(0, 0, innerRadius, 2*Math.PI - startAngle, 2*Math.PI - endAngle, true);
    context.lineTo(outerRadius*Math.cos(2*Math.PI - endAngle), outerRadius*Math.sin(2*Math.PI - endAngle));
    context.arc(0, 0, outerRadius, 2*Math.PI - endAngle, 2*Math.PI - startAngle, false);
    context.closePath();
    context.restore();
    if(drawOption == 'fill' || drawOption == 'both') context.fill();
    if(drawOption == 'stroke' || drawOption == 'both')context.stroke();

}

//DESCANT////////////////////////////////////////////////////////////////////////////////////////

hex = function(context, centerX, centerY, side, phi){

    var i;

    //center to vertex distance:
    var spoke = side / 2 / Math.sin(Math.PI/6);

    //find coords of 6 vertices relative to center:
    var x = [];
    var y = [];

    for(i=0; i<6; i++){
        x[i] = spoke*Math.cos(phi + i*Math.PI/3);
        y[i] = spoke*Math.sin(phi + i*Math.PI/3);

        //alert(x[i]+' '+y[i]);
    }

    //draw hexagon:
    context.save();
    context.translate(centerX, centerY);
    context.beginPath();
    context.moveTo(x[0], y[0]);
    for(i=1; i<7; i++){
        context.lineTo(x[i%6], y[i%6]);
    }
    context.restore();
    context.stroke();

}

whiteDetector = function(context, centerX, centerY, scale, phi, bkg){
    context.strokeStyle = '#999999';//'rgba(255,255,255,1)';
    context.save();
    context.translate(centerX, centerY);
    context.beginPath();
    context.moveTo(scale*41.5, scale*(71.9));
    context.lineTo(scale*(-41.5), scale*(71.9));
    context.lineTo(scale*(-93), 0);
    context.lineTo(scale*(-41.5), scale*(-79.6));
    context.lineTo(scale*41.5, scale*(-79.6));
    context.lineTo(scale*93, 0);
    context.closePath();
    context.restore();
    context.fill();
    if(bkg == 0)context.stroke();
}

redDetector = function(context, centerX, centerY, scale, phi, rotation, bkg){
    context.strokeStyle = '#999999'; //'rgba(255,0,0,1)'
    context.save();
    context.translate(centerX, centerY);
    context.rotate(rotation);
    context.beginPath();
    context.moveTo(scale*37.4, scale*(-87.1));
    context.lineTo(scale*(-51.6), scale*(-83.3));
    context.lineTo(scale*(-101.8), 0);
    context.lineTo(scale*(-51.6), scale*(83.3));
    context.lineTo(scale*37.4, scale*(87.1));
    context.lineTo(scale*73.1, 0);
    context.closePath();
    context.restore();
    context.fill();
    if(bkg == 0)context.stroke();
}

blueDetector = function(context, centerX, centerY, scale, phi, rotation, bkg){
    context.strokeStyle = '#999999';//'rgba(0,150,255,1)'
    context.save();
    context.translate(centerX, centerY);
    context.rotate(rotation);
    context.beginPath();
    context.moveTo(scale*52.6, scale*(-79.4));
    context.lineTo(scale*(-45.1), scale*(-79.4));
    context.lineTo(scale*(-97.6), 0);
    context.lineTo(scale*(-45.1), scale*(79.4));
    context.lineTo(scale*52.6, scale*(79.4));
    context.lineTo(scale*99.2, 0);
    context.closePath();
    context.restore();
    context.fill();
    if(bkg == 0)context.stroke();
}

greenLeftDetector = function(context, centerX, centerY, scale, phi, rotation, bkg){
    context.strokeStyle = '#999999';//'rgba(0,255,0,1)'
    context.save();
    context.translate(centerX, centerY);
    context.rotate(-1*Math.PI/2 + rotation);
    context.beginPath();
    context.moveTo(scale*41.5, scale*(-71.9));
    context.lineTo(scale*(-41.5), scale*(-71.9));
    context.lineTo(scale*(-93), 0);
    context.lineTo(scale*(-41.5), scale*(79.6));
    context.lineTo(scale*41.5, scale*(79.6));
    context.lineTo(scale*62.3, scale*47.6);
    context.closePath();
    context.restore();  
    context.fill();
    if(bkg == 0)context.stroke(); 
}

greenRightDetector = function(context, centerX, centerY, scale, phi, rotation, bkg){
    context.strokeStyle = '#999999';//'rgba(0,255,0,1)'
    context.save();
    context.translate(centerX, centerY);
    context.rotate(Math.PI/2 + rotation);
    context.beginPath();
    context.moveTo(scale*41.5, scale*(-71.9));
    context.lineTo(scale*(-41.5), scale*(-71.9));
    context.lineTo(scale*(-62.3), scale*47.6);
    context.lineTo(scale*(-41.5), scale*(79.6));
    context.lineTo(scale*41.5, scale*(79.6));
    context.lineTo(scale*93, 0);
    context.closePath();
    context.restore();   
    context.fill();
    if(bkg == 0)context.stroke();
}

//Color Scales///////////////////////////////////////////////////////////////////////////////////

//map [0,1] onto [#000000, #FF0000]
redScale = function(scale){
    var R = scale*255;
    return constructHexColor([R,0,0]);
}

//map [0,1] onto [#000000, #0000FF]
blueScale = function(scale){
    var B = scale*255;
    return constructHexColor([0,0,B]);
}

//map [0,1] onto [#000000, #00FF00]
greenScale = function(scale){
    var G = scale*255;
    return constructHexColor([0,G,0]);
}

colorScale = function(colors,scale){
    return constructHexColor([scale*(colors[3]-colors[0])+colors[0], scale*(colors[4]-colors[1])+colors[1], scale*(colors[5]-colors[2])+colors[2]]);
}

//map [0,1] onto black->purple->red->orange->yellow->white
scalepickr = function(scale, palette){
    //map scale onto [0,360]:
    var H = scale*300 / 60;
    if(H>5) H=5;
    if(H<0) H=0;
    var R, G, B;
    var start0, start1, start2, start3, start4, start5;
    if (palette == 'Sunset'){
        start0 = [0,0,0];
        start1 = [0,0,0x52];
        start2 = [0xE6,0,0x5C];
        start3 = [255,255,0];        
        start4 = [255,0x66,0];
        start5 = [255,0,0];        
    } else if (palette == 'ROOT Rainbow'){
        start0 = [0xFF,0x00,0x00];
        start1 = [0xFF,0xFF,0x00];
        start2 = [0x00,0xFF,0x00];
        start3 = [0x00,0xFF,0xFF];
        start4 = [0x00,0x00,0xFF];
        start5 = [0x66,0x00,0xCC];
        H = -1*(H-5);
    } else if (palette == 'Greyscale'){
        start0 = [0x00,0x00,0x00];
        start1 = [0x22,0x22,0x22];
        start2 = [0x55,0x55,0x55];
        start3 = [0x88,0x88,0x88];        
        start4 = [0xBB,0xBB,0xBB];
        start5 = [0xFF,0xFF,0xFF];
    } else if (palette == 'Red Scale'){
        start0 = [0x00,0x00,0x00];
        start1 = [0x33,0x00,0x00];
        start2 = [0x66,0x00,0x00];
        start3 = [0x99,0x00,0x00];
        start4 = [0xCC,0x00,0x00];
        start5 = [0xFF,0x00,0x00];
    } else if (palette == 'Mayfair'){
        start0 = [0x1E,0x4B,0x0F];
        start1 = [0x0E,0xBE,0x57];
        start2 = [0xE4,0xAB,0x33];
        start3 = [0xEC,0x95,0xF7];
        start4 = [0x86,0x19,0x4A];
        start5 = [0xFF,0x10,0x10];
    } else if (palette == 'Test'){
        start0 = [0x5E,0x1F,0x14];
        start1 = [0x74,0x4D,0x3E];
        start2 = [0x9D,0x47,0x05];
        start3 = [0xDF,0x67,0x19];
        start4 = [0xFE,0x83,0x54];
        start5 = [0x251,0x15,0x29];
    }
    if(H>=0 && H<1){
        R = start0[0] + Math.round(H*(start1[0]-start0[0]));
        G = start0[1] + Math.round(H*(start1[1]-start0[1]));
        B = start0[2] + Math.round(H*(start1[2]-start0[2]));
    } else if(H>=1 && H<2){
        R = start1[0] + Math.round((H-1)*(start2[0]-start1[0]));
        G = start1[1] + Math.round((H-1)*(start2[1]-start1[1]));
        B = start1[2] + Math.round((H-1)*(start2[2]-start1[2]));
    } else if(H>=2 && H<3){
        R = start2[0] + Math.round((H-2)*(start3[0]-start2[0]));
        G = start2[1] + Math.round((H-2)*(start3[1]-start2[1]));
        B = start2[2] + Math.round((H-2)*(start3[2]-start2[2]));
    } else if(H>=3 && H<4){
        R = start3[0] + Math.round((H-3)*(start4[0]-start3[0]));
        G = start3[1] + Math.round((H-3)*(start4[1]-start3[1]));
        B = start3[2] + Math.round((H-3)*(start4[2]-start3[2]));
    } else if(H>=4 && H<=5){
        R = start4[0] + Math.round((H-4)*(start5[0]-start4[0]));
        G = start4[1] + Math.round((H-4)*(start5[1]-start4[1]));
        B = start4[2] + Math.round((H-4)*(start5[2]-start4[2]));  
    }

    return constructHexColor([R,G,B]);

}

//Misc///////////////////////////////////////////////////////////////////////////


function interpolateColor(oldColor, newColor, scale){
    var R, G, B;

    if(oldColor == 0xDEADBEEF || newColor == 0xDEADBEEF) return 0xDEADBEEF;

    R = Math.round((newColor[0] - oldColor[0])*scale + oldColor[0]);
    G = Math.round((newColor[1] - oldColor[1])*scale + oldColor[1]);
    B = Math.round((newColor[2] - oldColor[2])*scale + oldColor[2]);

    return 'rgba('+R+','+G+','+B+',1)';
}

function roundBox(context, leftX, topY, width, height, cornerRadius){
    
    context.moveTo(leftX, topY+cornerRadius);
    context.beginPath();
    context.arc(leftX+cornerRadius, topY+cornerRadius, cornerRadius, Math.PI, 3*Math.PI/2);
    context.lineTo(leftX+width-cornerRadius,topY);
    context.arc(leftX+width-cornerRadius, topY+cornerRadius, cornerRadius, 3*Math.PI/2, 0);
    context.lineTo(leftX+width, topY+height-cornerRadius);
    context.arc(leftX+width-cornerRadius, topY+height-cornerRadius, cornerRadius, 0, Math.PI/2);
    context.lineTo(leftX + cornerRadius, topY+height);
    context.arc(leftX+cornerRadius, topY+height-cornerRadius, cornerRadius, Math.PI/2, Math.PI);
    context.closePath();
}

function strokePolygon(context, nSides, x0, y0, spoke, phi){
    var i;
    context.save();
    context.translate(x0, y0);
    context.rotate(phi);
    context.moveTo(0, -spoke);
    for(i=0; i<nSides; i++){
        context.rotate(2*Math.PI/nSides);
        context.lineTo(0, -spoke);
    }
    context.stroke();
    context.restore();
}

//take a hex color string '#012345' and parse it into [R,G,B]
function parseHexColor(color){
    var R, G, B;

    if(color==0xDEADBEEF) return 0xDEADBEEF
        
    var number = String(color).slice(1,7)

    R = parseInt(number.slice(0,2), 16);
    G = parseInt(number.slice(2,4), 16);
    B = parseInt(number.slice(4,6), 16);

    return [R,G,B];
}

//invert the above function:
function constructHexColor(color){
    var R = Math.round(color[0]);
    var G = Math.round(color[1]);
    var B = Math.round(color[2]);

    R = R.toString(16);
    G = G.toString(16);
    B = B.toString(16);

    if(R.length == 1) R = '0'+R;
    if(G.length == 1) G = '0'+G;
    if(B.length == 1) B = '0'+B;

    return '#'+R+G+B;
}
/*
//draw a nicer sidebar background
function tabBKG(canvasID, side){

    var canvas = document.getElementById(canvasID);
    var context = canvas.getContext('2d');

    var width = $(canvas).width();
    var height = $(canvas).height();
    //console.log(canvasID + ': ' + height)
    var cornerRad = 20;
    var tailRad = 50;
    var lineWeight = 2;

    context.clearRect(0,0,width,height);

    if(side == 'left'){
        context.save()
        context.translate(width,0);
        context.scale(-1,1);   
    }

    context.fillStyle = '#4C4C4C';
    context.lineWidth = lineWeight;
    context.beginPath();
    context.moveTo(width,lineWeight);
    context.lineTo(cornerRad, lineWeight);
    context.arc(cornerRad+lineWeight, cornerRad+lineWeight, cornerRad, -Math.PI/2, -Math.PI, true);
    context.lineTo(lineWeight, height - cornerRad - tailRad);
    context.arc(cornerRad+lineWeight, height - tailRad - cornerRad, cornerRad, -Math.PI, Math.PI/2, true);
    context.lineTo(width - tailRad, height - tailRad);
    context.arc(width - tailRad, height, tailRad, -Math.PI/2, 0);
    context.closePath();
    context.fill();
    context.stroke();

    if(side== 'left'){
        context.restore();
    }

}
*/
//atom spinner:
function drawSpinner(canvasID, label){
    
    var canvas = document.getElementById(canvasID);
    var context = canvas.getContext('2d');
    var string = (label) ? label : 'LOADING';

        $('#spinner').css('left', window.innerWidth/2 - 100);
        $('#spinner').css('top', window.innerHeight/2 - 100);

    context.lineWidth = 5;
    context.strokeStyle = '#FFFFFF';
    context.fillStyle = 'rgba(0,0,0,0.7)';
    roundBox(context, 5, 5, 190, 190, 5);
    context.lineWidth = 1;
    context.fill();
    context.stroke();

    context.fillStyle = '#FFFFFF';
    context.font = '16px Arial'
    context.fillText(string, 100-context.measureText(string).width/2, 145);
    window.nProtons = 0;
    window.nNucleons = 0;

/*
    window.spinLoop = setInterval(function(){
        context = document.getElementById('spinner').getContext('2d');

        //choose proton or neutron:
        var nucleon = (Math.random() < 0.5) ? 'p' : 'n';
        window.nNucleons++;
        if(nucleon == 'p') window.nProtons++;
        //choose position on canvas
        var radius = Math.random()*15;
        var phi = Math.random()*Math.PI*2;

        //draw:
        context.strokeStyle = '#FFFFFF';
        context.fillStyle = (nucleon == 'p') ? '#FF0000' : '#0000FF';
        context.beginPath();
        context.arc(100+radius*Math.cos(phi), 100+radius*Math.sin(phi), 5, 0, Math.PI*2);
        context.closePath();
        context.fill();
        context.stroke();

        context.clearRect(20,20, 160, 55);
        context.fillStyle = 'rgba(0,0,0,0.7)'
        context.fillRect(20,20, 160, 55);
        context.fillStyle = '#FFFFFF';
        context.fillText('Z = '+window.nProtons, 70-context.measureText('Z = '+window.nProtons).width/2, 70);
        context.fillText('A = '+window.nNucleons, 130-context.measureText('N = '+window.nProtons).width/2, 70);

    }, 3);
*/    
}

function curveText(text, context, x0, y0, rad, startAngle){
    var textWidth = context.measureText(text).width,
        charRotation = startAngle,
        character, charWidth, nextChar, nextWidth, bothWidth, kern, extraRotation, charSegment;

    for (var i=0, l=text.length; i<l; i++) {
        character = nextChar || text[i];
        charWidth = nextWidth || context.measureText(character).width;

        // Rotate so the letter base makes a circle segment instead of a tangent
        extraRotation = (Math.PI/2) - Math.acos((charWidth/2) / rad);

        context.save();
        context.translate(x0, y0);
        context.rotate(charRotation);
        context.translate(0, -rad);
        context.rotate(extraRotation);
        context.fillText(character,0,0);
        context.restore();

        nextChar = text[i+1] || '';
        nextWidth = context.measureText(nextChar).width;

        bothWidth = context.measureText(character+nextChar).width;
        kern = bothWidth - charWidth - nextWidth;

        charSegment = (charWidth+kern) / textWidth; // percent of total text size this takes up
        charRotation += charSegment * (context.measureText(text).width/rad);
    }           
}


//meter that fills to show the level of a scalar, with decorations.
function FillMeter(cvas, wrapperDiv, width, min, max, unit, precision){

    this.oldFillLevel = 0;
    this.fillLevel = 0;
    this.min = min;
    this.max = max;
    this.unit = unit;
    this.xPos = 0;  //left margin of value label
    this.wrapperDiv = wrapperDiv;
    this.precision = precision;

    //fetch canvas:
    this.canvas = document.getElementById(cvas);
    this.context = this.canvas.getContext('2d');
    this.context.font = "16px Raleway";

    //determine canvas width:
    var divWidth = parseFloat($('#'+wrapperDiv).css('width'));
    //remove margins and spacing:
    var canvWidth = 0.88*divWidth;
    //remove title length:
    canvWidth = canvWidth - $(document.getElementById(cvas+'Title')).width()*1.1;
    //set canvas dimensions
    this.canvas.width = canvWidth;
    this.canvas.height = 45;

    //width == 0 requests autoscaling of bar 
    if(width == 0){
        //leave some room for max reporting and right margin:
        this.width = canvWidth - 0.25*divWidth;
        
    } else this.width = width;

    //center of left end semicircle:
    this.leftX0 = divWidth*0.02;//this.width*0.1;
    this.leftY0 = this.canvas.height / 2;
    //meter half-thickness:
    this.radius = 5;
    //center of right end semicircle:
    this.rightX0 = this.leftX0 + this.width; //this.width*0.8;
    this.rightY0 = this.canvas.height / 2;
    //boundary of fill line:
    this.fillTo = this.fillLevel*(this.rightX0 - this.leftX0) + this.leftX0;

    //animation parameters:
    this.duration = 0.4; //seconds
    this.FPS = 30;
    this.nFrames = this.duration*this.FPS;

    //flag to indicate bar is pointing at a channel that doesn't report current
    this.notReporting = 0;

    //set up empty meter:
       //draw bar shadow:
        this.context.lineWidth = 1;
        this.context.beginPath();
        this.context.arc(this.leftX0+1, this.leftY0+1, this.radius, Math.PI/2, 3*Math.PI/2);
        this.context.arc(this.rightX0+1, this.rightY0+1, this.radius, 3*Math.PI/2, Math.PI/2);
        this.context.closePath();
        this.context.stroke();

        //draw empty bar:
        this.context.lineWidth = 1;
        this.context.beginPath();
        this.context.arc(this.leftX0, this.leftY0, this.radius, Math.PI/2, 3*Math.PI/2);
        this.context.arc(this.rightX0, this.rightY0, this.radius, 3*Math.PI/2, Math.PI/2);
        this.context.closePath();
        this.context.stroke();    

    //change the fill level and related parameters
    this.setNewFillLevel = function(newLevel){
        //empty meter if nothing to report:
        if(newLevel == '--') newLevel = this.min;

        //establish fill level
        this.oldFillLevel = this.fillLevel;
        this.fillLevel = this.fillLevel = (newLevel - this.min) / (this.max - this.min);
        this.fillTo = newLevel*(this.rightX0 - this.leftX0) + this.leftX0;

    };

    //draw a meter at frame <frame> when transitioning between this.oldFillLevel and this.fillLevel:
    this.draw = function(frame){

        //fill level for this frame:
        var frameFill = this.oldFillLevel + (this.fillLevel - this.oldFillLevel) * frame / this.nFrames;

        //determine fill coordinate:
        var fillLimit = frameFill*(this.rightX0 - this.leftX0) + this.leftX0;

        //draw empty bar:
        this.context.lineWidth = 1;
        this.context.fillStyle = 'rgba(255,255,255,1)';
        this.context.beginPath();
        this.context.arc(this.leftX0, this.leftY0, this.radius, Math.PI/2, 3*Math.PI/2);
        this.context.arc(this.rightX0, this.rightY0, this.radius, 3*Math.PI/2, Math.PI/2);
        this.context.closePath();
        this.context.fill();
        this.context.stroke();

        //draw bar fill:
        this.context.lineWidth = 1;
        this.context.fillStyle = 'rgba(0,0,255,0.3)';
        this.context.beginPath();
        this.context.arc(this.leftX0, this.leftY0, this.radius, Math.PI/2, 3*Math.PI/2);
        this.context.arc(fillLimit, this.rightY0, this.radius, 3*Math.PI/2, Math.PI/2);
        this.context.closePath();
        this.context.fill();    

        //quote value above fill position:
        this.context.clearRect(0,0, this.rightX0+this.width, this.rightY0-this.radius);
        this.context.fillStyle = 'rgba(255,255,255,0.9)';
        this.context.font = "16px Raleway";
        if(this.notReporting){ 
            fillString = 'Unavailable';
            this.context.font = '10px Raleway';
        } 
        else fillString = (frameFill*(this.max-this.min)+this.min).toFixed(this.precision)+' '+this.unit;
        this.xPos = fillLimit - this.context.measureText(fillString).width/2;
        if(this.xPos < this.leftX0) {
            this.xPos = this.leftX0
        }
        if(this.xPos + this.context.measureText(fillString).width > this.rightX0){
            this.xPos = this.rightX0 - this.context.measureText(fillString).width;
        }
        this.context.fillText(fillString, this.xPos, this.leftY0-1.7*this.radius);

        //quote meter max to right of meter:
        this.context.font = '12px Raleway';
        this.context.clearRect(this.rightX0+this.radius, 0, this.width, 45);
        if(this.notReporting == 0) this.context.fillText('Max: '+this.max.toFixed(0)+' '+this.unit, this.rightX0 + 1.5*this.radius, this.rightY0 + 5);
        
    };

    //wrapper for transition from old state to new state via this.animate:
    this.update = function(newLevel){

        if(newLevel == '--'){
            this.notReporting = 1;
        } else {
            this.notReporting = 0;
        }
            //set up member variables for animation:
            this.setNewFillLevel(newLevel);

            //animate:
            animate(this, 0);

    };

}//collect the form input and do something with it.  Expect form 'setValues', which
//begins with a pair of radio buttons for channel on off, then has an arbitrary 
//no. of text fields for inputting whatever else.

function updateParameter(){

	var i;
    
	var userInputs = [];

    //clear commit button highlighting:
    unhighlight('submitParameters');

    //loop over all elements in the form except the first three (off/on/submit)
	for(i=3; i<document.getElementById('setValues').elements.length; i++){
		userInputs[i-3] = getInput('setValues', i);
	}

    //determine where this cell falls in MIDAS vector:
    var ODBindex = getMIDASindex(window.HVpointer.dialogY, window.HVpointer.dialogX, window.HVview);

    //switch channel on/off
    if(document.getElementById('onButton').checked == true){
      ODBSet("/Equipment/HV/Settings/ChState["+ODBindex+"]",1);
    }
    else{
      ODBSet("/Equipment/HV/Settings/ChState["+ODBindex+"]",0);
    }

    //set demand voltage:
    ODBSet("/Equipment/HV/Variables/Demand["+ODBindex+"]", parseFloat(userInputs[0]));

    //set ramp up voltage:
    ODBSet("/Equipment/HV/Settings/Ramp Up Speed["+ODBindex+"]", parseFloat(userInputs[1]));

    //set ramp down voltage:
    ODBSet("/Equipment/HV/Settings/Ramp Down Speed["+ODBindex+"]", parseFloat(userInputs[2]));

    //once the ODB has been updated, kick the loop to update immediately:
    clearTimeout(window.loop);
    startLoop();

}

//extract information from the field at position <fieldIndex> from a form with id = <formID>
function getInput(formId, fieldIndex){
    var oForm = document.getElementById(formId);
    var oText = oForm.elements[fieldIndex];
    return oText.value;
}

//set values in fields:
function setInput(formId, fieldIndex, setval){
    var oForm = document.getElementById(formId);
    var oText = oForm.elements[fieldIndex];
    oText.value = setval;
}

//dismiss the form without doing anything else:
function abortUpdate(InputLayer){
	var inputDiv = document.getElementById(InputLayer);
	divFade(inputDiv, 'out', 0);
}

//fade the form in / out:
function divFade(targetDiv, direction, frame){

	var FPS = 40;
	var duration = 0.1;
	var nFrames = FPS*duration;
	var alpha;
	var maxOpacity = 0;

	if(frame <= nFrames){
		if(direction === 'in'){
			alpha = maxOpacity*frame/nFrames;
			$(targetDiv).css('background', 'rgba(0,0,0,'+alpha+')');
			targetDiv.style.display = 'block';

		} else if(direction === 'out'){
			alpha = maxOpacity-maxOpacity*frame/nFrames;
			$(targetDiv).css('background', 'rgba(0,0,0,'+alpha+')');
		}
		frame++;

		setTimeout(function(){divFade(targetDiv, direction, frame)}, 1000/FPS);
	} else if(direction === 'out'){
		targetDiv.style.display = 'none';
	}

}

//plugs a new cell into the input interface; used for both onclicks on the waffles, and on button submits 
//in the sidepanel view.
function channelSelect(waffle){

    var inputTitle

    //determine horizontal binning
    var xIndex;
    if(waffle.chy == 0) xIndex = primaryBin(window.parameters.moduleSizes[window.HVview], waffle.chx);
    else xIndex = waffle.chx;

    //Throw up to global so the setter remembers where we're pointing.  TODO: refactor without globals?
    window.HVpointer.dialogX = xIndex;//waffle.chx;
    window.HVpointer.dialogY = waffle.chy;
	
    var superDiv = document.getElementById(waffle.wrapperDiv);
    var inputDiv = document.getElementById(waffle.InputLayer);

    //set text in dialog box:
    if(waffle.chy != 0) inputTitle = 'Parameters for <br>'+waffle.moduleLabels[primaryBin(window.parameters.moduleSizes[window.HVview], waffle.chx)]+', '+window.parameters.rowTitles[0]+' '+channelMap(waffle.chx, waffle.chy, window.parameters.moduleSizes[window.HVview], waffle.rows) + ' (' + waffle.dataBus[window.HVview].channelName[waffle.chy][xIndex] + ')';
    else inputTitle = 'Parameters for <br>'+waffle.moduleLabels[primaryBin(window.parameters.moduleSizes[window.HVview], waffle.chx)]+' Primary';
    document.getElementById('inputTitle').innerHTML = inputTitle;

    //these objects get updated every masterLoop:
    //report status word:
    document.getElementById('status').innerHTML = 'Status: '+ ((waffle.dataBus[window.HVview].channelMask[waffle.chy][xIndex] == 0) ? 'Off' : parseStatusWord(waffle.dataBus[window.HVview].rampStatus[waffle.chy][xIndex]));
    //report current & update voltage slider and meter maximum:
    if(waffle.chy == 0 || window.parameters.moduleSizes[window.HVview][primaryBin(window.parameters.moduleSizes[window.HVview], waffle.chx)]==1){
        waffle.voltageSlider.max = waffle.dataBus[window.HVview].voltLimit[waffle.chy][xIndex];
        meter.max = waffle.dataBus[window.HVview].voltLimit[waffle.chy][xIndex];
        currentMeter.max = waffle.dataBus[window.HVview].currentLimit[waffle.chy][xIndex];
        currentMeter.update(Math.round(waffle.dataBus[window.HVview].reportCurrent[waffle.chy][xIndex]*10000)/10000)
    }
    else{
        waffle.voltageSlider.max = waffle.dataBus[window.HVview].voltLimit[0][primaryBin(window.parameters.moduleSizes[window.HVview], waffle.chx)];
        meter.max = waffle.dataBus[window.HVview].voltLimit[0][primaryBin(window.parameters.moduleSizes[window.HVview], waffle.chx)];
        currentMeter.max = waffle.dataBus[window.HVview].currentLimit[0][primaryBin(window.parameters.moduleSizes[window.HVview], waffle.chx)];
        currentMeter.update('--');
    }

    //update meter position after maximum has been adjusted:
    meter.update(Math.round(waffle.dataBus[window.HVview].reportVoltage[waffle.chy][xIndex]*10000)/10000);
    temperatureMeter.update(Math.round(waffle.dataBus[window.HVview].reportTemperature[waffle.chy][xIndex]*100)/100);

    if(window.refreshInput){
        //set defaults
        if (waffle.dataBus[window.HVview].channelMask[waffle.chy][xIndex] == 1) document.getElementById('onButton').checked = true;
        else document.getElementById('offButton').checked = true;

        //manage sliders
        waffle.voltageSlider.update(Math.round(waffle.dataBus[window.HVview].demandVoltage[waffle.chy][xIndex]*10000)/10000);
        waffle.rampSlider.update(Math.round(waffle.dataBus[window.HVview].demandVrampUp[waffle.chy][xIndex]*10000)/10000);
        waffle.rampDownSlider.update(Math.round(waffle.dataBus[window.HVview].demandVrampDown[waffle.chy][xIndex]*10000)/10000);
        window.refreshInput = 0;

        //set the module
        setInput('changeChannel',0,waffle.moduleLabels[primaryBin(window.parameters.moduleSizes[window.HVview], waffle.chx)]);
        //update channel number list
        reconfigureChannelList(waffle.moduleLabels, window.parameters.moduleSizes[window.HVview], 'ChannelList');
        //set the channel number
        setInput('changeChannel',1,channelMap(waffle.chx, waffle.chy, window.parameters.moduleSizes[window.HVview], waffle.rows));
        if(waffle.chy==0) setInput('changeChannel',1,'Primary');

        //abandon the please update me flag when navigating away from the channel:
        unhighlight('submitParameters');
    }

    //only actually display if the click was on the waffle and not the rest of the canvas:
    if(waffle.chx < waffle.cols && waffle.chy < waffle.rows){
        divFade(inputDiv, 'in', 0);
    }

}

//point interface at new channel indicated by user in the 'changeChannel' form.
function gotoNewChannel(event, waffle){
    var i;
 
    //determine y bin:
    var yVal = getInput('changeChannel', 1);
    if(yVal != 'Primary') yVal = parseInt(yVal);
    if (yVal == 'Primary') waffle.chy = 0;
    else waffle.chy = yVal%(waffle.rows-1)+1;

    //determine x bin:
    var xName = getInput('changeChannel', 0);
    //have to map column titles onto index
    var xVal;
    for(var i=0; i<window.parameters.moduleSizes[window.HVview].length; i++){
        if(waffle.moduleLabels[i] == xName) xVal = i;
    }
    waffle.chx = 0;
    for(i=0; i<xVal; i++) waffle.chx += Math.max(window.parameters.moduleSizes[window.HVview][i], 1);
    if(yVal != 'Primary') waffle.chx += Math.floor(yVal/(waffle.rows-1));

    channelSelect(waffle);
}

function parseStatusWord(statusCode){

    if(statusCode == 0) return 'Off';
    else if(statusCode == 1) return 'On';
    else if(statusCode == 3) return 'Ramping Up';
    else if(statusCode == 5) return 'Ramping Down';
    else if(statusCode == 256) return 'External Disable';
    else return 'Unknown Error';
}




function loadJSONP(gatekeeper, callback) {
    var i;

    if(document.getElementById('spinner')){
        drawSpinner('spinner', 'Waiting for JSONP');
    }

    window.JSONPstore = {'scalar':{}, 'thresholds':{}}; //dump the old store so old junk doesn't persist.
    for(i=0; i<window.parameters.JSONPrepos.length; i++){

        var script  = document.createElement('script');

        //either make some fake data to replace the JSONP service offline in devMode, or use the real thing online:
        if(window.parameters.devMode){
            script.setAttribute('src', ' ');
            if(callback != 'main'){
                parseResponse(fakeScalars());
                parseThreshold(fakeThresholds());
            }
        } else
            script.setAttribute('src', window.parameters.JSONPrepos[i]);    //fetch the ith repo

        script.setAttribute('id', 'tempScript'+i);

        script.onload = function(){
            for(var i=0; i<window.parameters.JSONPrepos.length; i++){
                if (window.parameters.JSONPrepos[i] == this.src) window.JSONPstatus[i] = 'Online';
            }
            //post to GK:
            var gatekeeperReport = new  CustomEvent("gatekeeperReport", {
                                            detail: {
                                                status: 'loaded',
                                                cb: callback        
                                            }
                                        });
            gatekeeper.listener.dispatchEvent(gatekeeperReport);
        }

        script.onerror = function(){
            for(var i=0; i<window.parameters.JSONPrepos.length; i++){
                if (window.parameters.JSONPrepos[i] == this.src) window.JSONPstatus[i] = 'Not Responding';
            }
            //post to GK:
            var gatekeeperReport = new  CustomEvent("gatekeeperReport", {
                                            detail: {
                                                status: 'failed',        
                                                cb: callback
                                            }
                                        });
            gatekeeper.listener.dispatchEvent(gatekeeperReport);
        }

        document.head.appendChild(script);
    }
}

//an object to block the page update until all the JSONP requests have reported back. 
function gatekeeper(){
    this.listener = document.getElementById('waffleplate')

    //how many JSONP assets have checked in?
    this.copyBack = 0;

    this.listener.addEventListener("gatekeeperReport", function(e){
        window.Gatekeeper.copyBack++;

        if(window.Gatekeeper.copyBack == window.parameters.JSONPrepos.length){
            window.Gatekeeper.copyBack = 0;
            if(e.detail.cb == 'main') main();
            else masterLoop(e.detail.cb);
        }
    });
}

function masterLoop(callMyself, noFetch){
    var i,j;
	if(!document.webkitHidden && !document.mozHidden){

        //one big ODB grab:
        if(!noFetch) ODBgrab();

        //update all assets
        //status bar
        window.statusBar.update();
        //HV
    	if(window.parameters.topDeployment['HV']) window.waffle.update();
        //DAQ
        if(window.parameters.topDeployment['DAQ']) window.DAQ.update();
        //Subsystems
        if(window.parameters.topDeployment['Subsystems']){
            for(i=0; i<window.Subdetectors.length; i++){
                window.Subdetectors[i].update();
            }
        }
        //Clock
        if(window.parameters.topDeployment['Clock']) window.clockPointer.update();
/*
        //let the alarm services know the update is complete:
        var allDone = new   CustomEvent("refreshComplete", {
                            });
        window.AlarmServices.div.dispatchEvent(allDone);
*/
    }
    
    //remove all temporary scripts from the head so they don't accrue:
    for(i=0; i<window.parameters.JSONPrepos.length; i++){
        var element = document.getElementById('tempScript'+i);
        if(element)
            element.parentNode.removeChild(element);
    }

    //next iteration:
    window.loop = setTimeout(function(){loadJSONP(window.Gatekeeper, 1)}, 60000);
}

//determine what size cards are in what slot:
function detectCards(){
    var i, j, crateCode, nSlots;
    
    //fetch cratemap code: subsequent pairs of bits correspond to slots in ascending order: 00 => empty slot; 01 => 12 channel card; 10 => 48 channel card.
    //crate size indicated by terminating bitpattern = 111: at bit 12 -> 6 slot crate, at bit 24 -> 12 slot crate, absent -> 16 slot crate:
    for(j=0; j<window.parameters.HVequipmentNames.length; j++){
        crateCode = ODBGet('/Equipment/'+window.parameters.HVequipmentNames[j]+'/Settings/CrateMap[0]');
        if( ((crateCode & (7<<12)) >> 12) == 7) nSlots = 6;
        else if( ((crateCode & (7<<24)) >> 24) == 7) nSlots = 12;
        else nSlots = 16;

        window.parameters.moduleSizes[j] = [];    
        for(i=0; i<nSlots; i++){
            if( ((crateCode>>(2*i)) & 3) == 1 ) window.parameters.moduleSizes[j][window.parameters.moduleSizes[j].length] = 1;
            else if( ((crateCode>>(2*i)) & 3) == 2 ) window.parameters.moduleSizes[j][window.parameters.moduleSizes[j].length] = 4;
            else window.parameters.moduleSizes[j][window.parameters.moduleSizes[j].length] = 0;
        }
    }
}

//force an immediate update, and set the master loop going again from there:
function forceUpdate(){
    clearTimeout(window.loop);
    startLoop(1);
}

//like forceUpdate, but doesn't fetch data - just draws with current parameters
function rePaint(){
    clearTimeout(window.loop);
    masterLoop(1, true);
}

//handle everybody's interval-based fetch from the ODB in one network request: (+1 more for the message service, weird...)
function ODBgrab(){
    var paths = [], i, j, k,
    SIDEBAR, DAQ, HV, CLOCK,
    data;


    //sidebar
    SIDEBAR = 0;
    paths[SIDEBAR] = '/Experiment/Name';
    paths[SIDEBAR+1] = '/Runinfo/Run number';
    paths[SIDEBAR+2] = '/Runinfo/State';
    paths[SIDEBAR+3] = '/Runinfo/Start time';
    paths[SIDEBAR+4] = 'Runinfo/Stop time';
    paths[SIDEBAR+5] = 'Runinfo/Start time binary';
    paths[SIDEBAR+6] = '/Experiment/Run Parameters/Comment';
    //DAQ
    DAQ = SIDEBAR+7;
    paths[DAQ] = '/Equipment/Trigger/Statistics/Events per sec.';
    paths[DAQ+1] = '/Equipment/Trigger/Statistics/kBytes per sec.';
    paths[DAQ+2] = '/Equipment/Event Builder/Statistics/Events per sec.';
    paths[DAQ+3] = '/Equipment/Event Builder/Statistics/kBytes per sec.';
    //HV
    HV = DAQ+4
    for(k=0; k<window.parameters.moduleSizes.length; k++){  //recall length of module sizes = number of HV crates declared
        for(i=0; i<window.parameters.ODBkeys.length; i++){
            paths[HV + k*window.parameters.ODBkeys.length + i] = '/Equipment/'+window.parameters.HVequipmentNames[k]+'/'+window.parameters.ODBkeys[i]+'[*]';
        }       
    }
    //Clock
    CLOCK = HV + window.parameters.moduleSizes.length*window.parameters.ODBkeys.length;
    for(i=0; i<window.parameters.nClocks; i++){
        paths[CLOCK + i] = '/Equipment/GRIF-Clk'+i+'/Variables/Input[*]';
    }
    paths[CLOCK + window.parameters.nClocks] = '/DashboardConfig/Clock/Master LEMO freq';

    data = ODBMGet(paths);

    //sidebar
    window.localODB.expTitle = data[SIDEBAR];
    window.localODB.runInfo = data[SIDEBAR+1];
    window.localODB.runstate = data[SIDEBAR+2];
    window.localODB.startInfo = data[SIDEBAR+3];
    window.localODB.elapsed = data[SIDEBAR+4];
    window.localODB.binaryStart = data[SIDEBAR+5];
    window.localODB.comment = data[SIDEBAR+6];
    //DAQ
    window.localODB.TrigEPS = data[DAQ];
    window.localODB.TrigDPS = data[DAQ+1];
    window.localODB.EBEPS = data[DAQ+2];
    window.localODB.EBDPS = data[DAQ+3];  
    //HV
    for(k=0; k<window.parameters.moduleSizes.length; k++){  //recall length of module sizes = number of HV crates declared
        window.localODB['HV'+k] = [];
        window.localODB['HV'+k].reqVoltage      = data[HV + k*window.parameters.ODBkeys.length + 0];
        window.localODB['HV'+k].measVoltage     = data[HV + k*window.parameters.ODBkeys.length + 1];
        window.localODB['HV'+k].measCurrent     = data[HV + k*window.parameters.ODBkeys.length + 2];
        window.localODB['HV'+k].rampUp          = data[HV + k*window.parameters.ODBkeys.length + 3];
        window.localODB['HV'+k].rampDown        = data[HV + k*window.parameters.ODBkeys.length + 4];
        window.localODB['HV'+k].measTemperature = data[HV + k*window.parameters.ODBkeys.length + 5];
        window.localODB['HV'+k].repoChState     = data[HV + k*window.parameters.ODBkeys.length + 6];
        window.localODB['HV'+k].repoChStatus    = data[HV + k*window.parameters.ODBkeys.length + 7];
        window.localODB['HV'+k].voltageLimit    = data[HV + k*window.parameters.ODBkeys.length + 8];
        window.localODB['HV'+k].currentLimit    = data[HV + k*window.parameters.ODBkeys.length + 9];
        window.localODB['HV'+k].chName          = data[HV + k*window.parameters.ODBkeys.length + 10];      
    }    
    //Clock
    for(i=0; i<window.parameters.nClocks; i++){
        window.localODB['clock'+i] = data[CLOCK+i];
    }
    window.localODB.masterLEMOfreq = data[CLOCK + window.parameters.nClocks];

    //Message service:
    window.localODB.messages = ODBGetMsg(5);

}

//handle pulling the initial config parameters out of the ODB and replacing the default values in the JSONP-loaded parameter store:
function fetchCustomParameters(){

    var topLevel=0, HV, BAMBINO, DANTE, DESCANT, HPGe, PACES, SCEPTAR, SHARC, SPICE, ZDS, TIPwall, TIPball, DAQ, DSSD;

    //define keys
    var paths = [];
    paths[topLevel]  = '/DashboardConfig/topLevel/HPGeArray'            //GRIFFIN or TIGRESS
    
    paths[topLevel+1]  = '/DashboardConfig/topLevel/statusURL'            //URL of MIDAS status page
    paths[topLevel+2]  = '/DashboardConfig/topLevel/expName'              //Experiment name

    HV = topLevel+3
    paths[HV]  = '/DashboardConfig/HV/voltageTolerance'           //tolerance for voltage alarms
    paths[HV+1]  = '/DashboardConfig/HV/currentTolerance'           //threshold for current alarms
    paths[HV+2]  = '/DashboardConfig/HV/tempTolerance'              //threshold for temperature alarms
    paths[HV+3]  = '/DashboardConfig/HV/demandVoltage[*]'           //range of allowed demand voltages
    paths[HV+4]  = '/DashboardConfig/HV/voltRampSpeed[*]'           //range of allowed voltage ramp speeds

    BAMBINO = HV+5
    paths[BAMBINO]  = '/DashboardConfig/BAMBINO/deploy'                //deploy BAMBINO?
    paths[BAMBINO+1]  = '/DashboardConfig/BAMBINO/HVscale[*]'            //[min HV, max HV] on color scale
    paths[BAMBINO+2] = '/DashboardConfig/BAMBINO/thresholdScale[*]'     //[min thresh, max thresh] on color scale
    paths[BAMBINO+3] = '/DashboardConfig/BAMBINO/rateScale[*]'          //[min rate, max rate] on color scale
    paths[BAMBINO+4] = '/DashboardConfig/BAMBINO/mode'                  //'S2' or 'S3'
    paths[BAMBINO+5] = '/DashboardConfig/BAMBINO/targetSide[*]'         //[upstream, downstream] deployment
    paths[BAMBINO+6] = '/DashboardConfig/BAMBINO/layers'                //how many layers (1 or 2)?

    DANTE = BAMBINO+7;
    paths[DANTE] = '/DashboardConfig/DANTE/deploy'
    paths[DANTE+1] = '/DashboardConfig/DANTE/LaBrPMTHVscale[*]'
    paths[DANTE+2] = '/DashboardConfig/DANTE/LaBrPMTthresholdScale[*]'
    paths[DANTE+3] = '/DashboardConfig/DANTE/LaBrPMTrateScale[*]'
    paths[DANTE+4] = '/DashboardConfig/DANTE/LaBrTACHVscale[*]'
    paths[DANTE+5] = '/DashboardConfig/DANTE/LaBrTACthresholdScale[*]'
    paths[DANTE+6] = '/DashboardConfig/DANTE/LaBrTACrateScale[*]'    
    paths[DANTE+7] = '/DashboardConfig/DANTE/BGOHVscale[*]'
    paths[DANTE+8] = '/DashboardConfig/DANTE/BGOthresholdScale[*]'
    paths[DANTE+9] = '/DashboardConfig/DANTE/BGOrateScale[*]'

    DESCANT = DANTE+10;
    paths[DESCANT] = '/DashboardConfig/DESCANT/deploy'
    paths[DESCANT+1] = '/DashboardConfig/DESCANT/HVscale[*]'
    paths[DESCANT+2] = '/DashboardConfig/DESCANT/thresholdScale[*]'
    paths[DESCANT+3] = '/DashboardConfig/DESCANT/rateScale[*]'

    HPGe = DESCANT+4;
    paths[HPGe] = '/DashboardConfig/HPGe/deploy'
    paths[HPGe+1] = '/DashboardConfig/HPGe/BGOHVscale[*]'
    paths[HPGe+2] = '/DashboardConfig/HPGe/BGOthresholdScale[*]'
    paths[HPGe+3] = '/DashboardConfig/HPGe/BGOrateScale[*]'
    paths[HPGe+4] = '/DashboardConfig/HPGe/HVscale[*]'
    paths[HPGe+5] = '/DashboardConfig/HPGe/thresholdScale[*]'
    paths[HPGe+6] = '/DashboardConfig/HPGe/rateScale[*]'
    paths[HPGe+7] = '/DashboardConfig/HPGe/upstreamLampAbsent'
    paths[HPGe+8] = '/DashboardConfig/HPGe/downstreamLampAbsent'

    PACES = HPGe+9;
    paths[PACES] = '/DashboardConfig/PACES/deploy'
    paths[PACES+1] = '/DashboardConfig/PACES/HVscale[*]'
    paths[PACES+2] = '/DashboardConfig/PACES/thresholdScale[*]'
    paths[PACES+3] = '/DashboardConfig/PACES/rateScale[*]'    

    SCEPTAR = PACES+4;
    paths[SCEPTAR] = '/DashboardConfig/SCEPTAR/USdeploy'
    paths[SCEPTAR+1] = '/DashboardConfig/SCEPTAR/DSdeploy'
    paths[SCEPTAR+2] = '/DashboardConfig/SCEPTAR/HVscale[*]'
    paths[SCEPTAR+3] = '/DashboardConfig/SCEPTAR/thresholdScale[*]'
    paths[SCEPTAR+4] = '/DashboardConfig/SCEPTAR/rateScale[*]'

    SHARC = SCEPTAR+5;
    paths[SHARC] = '/DashboardConfig/SHARC/deploy'
    paths[SHARC+1] = '/DashboardConfig/SHARC/HVscale[*]'
    paths[SHARC+2] = '/DashboardConfig/SHARC/thresholdScale[*]'
    paths[SHARC+3] = '/DashboardConfig/SHARC/rateScale[*]'

    SPICE = SHARC+4;
    paths[SPICE] = '/DashboardConfig/SPICE/deploy'
    paths[SPICE+1] = '/DashboardConfig/SPICE/HVscale[*]'
    paths[SPICE+2] = '/DashboardConfig/SPICE/thresholdScale[*]'
    paths[SPICE+3] = '/DashboardConfig/SPICE/rateScale[*]'
    paths[SPICE+4] = '/DashboardConfig/SPICE/SPICEauxiliary'
    paths[SPICE+5] = '/DashboardConfig/SPICE/SPICEauxLayers'

    ZDS = SPICE+6;
    paths[ZDS] = '/DashboardConfig/ZDS/deploy'
    paths[ZDS+1] = '/DashboardConfig/ZDS/HVscale[*]'
    paths[ZDS+2] = '/DashboardConfig/ZDS/thresholdScale[*]'
    paths[ZDS+3] = '/DashboardConfig/ZDS/rateScale[*]'

    TIPwall = ZDS+4;
    paths[TIPwall] = '/DashboardConfig/TIPwall/deploy'
    paths[TIPwall+1] = '/DashboardConfig/TIPwall/HVscale[*]'
    paths[TIPwall+2] = '/DashboardConfig/TIPwall/thresholdScale[*]'
    paths[TIPwall+3] = '/DashboardConfig/TIPwall/rateScale[*]'            

    TIPball = TIPwall+4;
    paths[TIPball] = '/DashboardConfig/TIPball/deploy'
    paths[TIPball+1] = '/DashboardConfig/TIPball/HVscale[*]'
    paths[TIPball+2] = '/DashboardConfig/TIPball/thresholdScale[*]'
    paths[TIPball+3] = '/DashboardConfig/TIPball/rateScale[*]'   

    DAQ = TIPball+4; //63-74
    paths[DAQ] = '/DashboardConfig/DAQ/rateMinTopView';
    paths[DAQ+1] = '/DashboardConfig/DAQ/rateMaxTopView';
    paths[DAQ+2] = '/DashboardConfig/DAQ/rateMinDetailView';
    paths[DAQ+3] = '/DashboardConfig/DAQ/rateMaxDetailView';
    paths[DAQ+4] = '/DashboardConfig/DAQ/transferMinTopView';
    paths[DAQ+5] = '/DashboardConfig/DAQ/transferMaxTopView';
    paths[DAQ+6] = '/DashboardConfig/DAQ/transferMinDetailView';
    paths[DAQ+7] = '/DashboardConfig/DAQ/transferMaxDetailView';
    paths[DAQ+8] = '/DashboardConfig/DAQ/rateMinMaster';
    paths[DAQ+9] = '/DashboardConfig/DAQ/rateMaxMaster';
    paths[DAQ+10] = '/DashboardConfig/DAQ/transferMinMaster';
    paths[DAQ+11] = '/DashboardConfig/DAQ/transferMaxMaster';

    DSSD = DAQ+12;
    paths[DSSD] = '/DashboardConfig/DSSD/HVscale[*]';
    paths[DSSD+1] = '/DashboardConfig/DSSD/thresholdScale[*]';
    paths[DSSD+2] = '/DashboardConfig/DSSD/rateScale[*]';

    //fetch:
    var data = ODBMGet(paths);
    //console.log(data[78].slice(0,11) == '<DB_NO_KEY>')

    //alert(data[0].slice(data[0].length-1,data[0].length).charCodeAt(0));  //ODBGet sticks a \n onto the end of all returned strings :(
    //also all numbers are returned as strings with \n suffix, and all arrays have an empty array position stuck on the back :( :( :(

    //plug data in
    
    window.parameters['HPGemode'] = data[topLevel].slice(0, data[topLevel].length-1);
    
    window.parameters['statusURL'] = data[topLevel+1].slice(0, data[topLevel+1].length-1);
    window.parameters['ExpName'] = data[topLevel+2].slice(0, data[topLevel+2].length-1);

    window.parameters['alarmThresholds'][0] = parseFloat(data[HV]);
    window.parameters['alarmThresholds'][1] = parseFloat(data[HV+1]);
    window.parameters['alarmThresholds'][2] = parseFloat(data[HV+2]);
    window.parameters['maxTemperature'] = parseFloat(data[HV+2]);
    window.parameters['minVoltage'] = parseFloat(data[HV+3][0]);
    window.parameters['maxVoltage'] = parseFloat(data[HV+3][1]);
    window.parameters['minRampSpeed'] = parseFloat(data[HV+4][0]);
    window.parameters['maxRampSpeed'] = parseFloat(data[HV+4][1]);

    window.parameters.deployment.BAMBINO = parseFloat(data[BAMBINO]);
    window.parameters.BAMBINO.minima.BAMBINO = [parseFloat(data[BAMBINO+1][0]), parseFloat(data[BAMBINO+2][0]), parseFloat(data[BAMBINO+3][0])];
    window.parameters.BAMBINO.maxima.BAMBINO = [parseFloat(data[BAMBINO+1][1]), parseFloat(data[BAMBINO+2][1]), parseFloat(data[BAMBINO+3][1])];
    window.parameters.BAMBINOmode = data[BAMBINO+4].slice(0, data[BAMBINO+4].length-1);
    window.parameters.BAMBINOdeployment[0] = parseInt(data[BAMBINO+5][0],10);
    window.parameters.BAMBINOdeployment[1] = parseInt(data[BAMBINO+5][1],10);
    window.parameters.BAMBINOlayers = parseInt(data[BAMBINO+6],10);

    window.parameters.deployment.DANTE = parseFloat(data[DANTE]);
    window.parameters.DANTE.minima.LaBrPMT = [parseFloat(data[DANTE+1][0]), parseFloat(data[DANTE+2][0]), parseFloat(data[DANTE+3][0])];
    window.parameters.DANTE.maxima.LaBrPMT = [parseFloat(data[DANTE+1][1]), parseFloat(data[DANTE+2][1]), parseFloat(data[DANTE+3][1])];
    window.parameters.DANTE.minima.LaBrTAC = [parseFloat(data[DANTE+4][0]), parseFloat(data[DANTE+5][0]), parseFloat(data[DANTE+6][0])];
    window.parameters.DANTE.maxima.LaBrTAC = [parseFloat(data[DANTE+4][1]), parseFloat(data[DANTE+5][1]), parseFloat(data[DANTE+6][1])];
    window.parameters.DANTE.minima.BGO = [parseFloat(data[DANTE+7][0]), parseFloat(data[DANTE+8][0]), parseFloat(data[DANTE+9][0])];
    window.parameters.DANTE.maxima.BGO = [parseFloat(data[DANTE+7][1]), parseFloat(data[DANTE+8][1]), parseFloat(data[DANTE+9][1])];

    window.parameters.deployment.DESCANT = parseFloat(data[DESCANT]);
    window.parameters.DESCANT.minima.DESCANT = [parseFloat(data[DESCANT+1][0]), parseFloat(data[DESCANT+2][0]), parseFloat(data[DESCANT+3][0])];
    window.parameters.DESCANT.maxima.DESCANT = [parseFloat(data[DESCANT+1][1]), parseFloat(data[DESCANT+2][1]), parseFloat(data[DESCANT+3][1])];

    window.parameters.deployment.HPGe = parseFloat(data[HPGe]);
    window.parameters.HPGe.minima.BGO = [parseFloat(data[HPGe+1][0]), parseFloat(data[HPGe+2][0]), parseFloat(data[HPGe+3][0])];
    window.parameters.HPGe.maxima.BGO = [parseFloat(data[HPGe+1][1]), parseFloat(data[HPGe+2][1]), parseFloat(data[HPGe+3][1])];
    window.parameters.HPGe.minima.HPGe = [parseFloat(data[HPGe+4][0]), parseFloat(data[HPGe+5][0]), parseFloat(data[HPGe+6][0])];
    window.parameters.HPGe.maxima.HPGe = [parseFloat(data[HPGe+4][1]), parseFloat(data[HPGe+5][1]), parseFloat(data[HPGe+6][1])];
    if(parseInt(data[HPGe+7], 10))
        window.parameters.cloversAbsent = window.parameters.cloversAbsent.concat([13,14,15,16]);
    if(parseInt(data[HPGe+8], 10))
        window.parameters.cloversAbsent = window.parameters.cloversAbsent.concat([1,2,3,4]);

    window.parameters.deployment.PACES = parseFloat(data[PACES]);
    window.parameters.PACES.minima.PACES = [parseFloat(data[PACES+1][0]), parseFloat(data[PACES+2][0]), parseFloat(data[PACES+3][0])];
    window.parameters.PACES.maxima.PACES = [parseFloat(data[PACES+1][1]), parseFloat(data[PACES+2][1]), parseFloat(data[PACES+3][1])];    

    if(parseFloat(data[SCEPTAR]) || parseFloat(data[SCEPTAR+1]) || parseFloat(data[51])) window.parameters.deployment.SCEPTAR = 1;
    else window.parameters.deployment.SCEPTAR = 0;
    window.parameters.SCEPTARconfig = [parseFloat(data[SCEPTAR]), parseFloat(data[SCEPTAR+1]), parseFloat(data[ZDS])];
    window.parameters.SCEPTAR.minima.SCEPTAR = [parseFloat(data[SCEPTAR+2][0]), parseFloat(data[SCEPTAR+3][0]), parseFloat(data[SCEPTAR+4][0])];
    window.parameters.SCEPTAR.maxima.SCEPTAR = [parseFloat(data[SCEPTAR+2][1]), parseFloat(data[SCEPTAR+3][1]), parseFloat(data[SCEPTAR+4][1])];
    window.parameters.SCEPTAR.minima.ZDS = [parseFloat(data[ZDS+1][0]), parseFloat(data[ZDS+2][0]), parseFloat(data[ZDS+3][0])];
    window.parameters.SCEPTAR.maxima.ZDS = [parseFloat(data[ZDS+1][1]), parseFloat(data[ZDS+2][1]), parseFloat(data[ZDS+3][1])];

    window.parameters.deployment.SHARC = parseFloat(data[SHARC]);
    window.parameters.SHARC.minima.SHARC = [parseFloat(data[SHARC+1][0]), parseFloat(data[SHARC+2][0]), parseFloat(data[SHARC+3][0])];
    window.parameters.SHARC.maxima.SHARC = [parseFloat(data[SHARC+1][1]), parseFloat(data[SHARC+2][1]), parseFloat(data[SHARC+3][1])];

    window.parameters.deployment.SPICE = parseFloat(data[SPICE]);
    window.parameters.SPICE.minima.SPICE = [parseFloat(data[SPICE+1][0]), parseFloat(data[SPICE+2][0]), parseFloat(data[SPICE+3][0])];
    window.parameters.SPICE.maxima.SPICE = [parseFloat(data[SPICE+1][1]), parseFloat(data[SPICE+2][1]), parseFloat(data[SPICE+3][1])];
    window.parameters.SPICEaux = data[SPICE+4].slice(0,2);
    window.parameters.SPICEauxLayers = parseInt(data[SPICE+5],10);

    window.parameters.deployment.TIPwall = parseFloat(data[TIPwall]);
    window.parameters.TIPwall.minima.TIPwall = [parseFloat(data[TIPwall+1][0]), parseFloat(data[TIPwall+2][0]), parseFloat(data[TIPwall+3][0])];
    window.parameters.TIPwall.maxima.TIPwall = [parseFloat(data[TIPwall+1][1]), parseFloat(data[TIPwall+2][1]), parseFloat(data[TIPwall+3][1])];

    window.parameters.deployment.TIPball = parseFloat(data[TIPball]);
    window.parameters.TIPball.minima.TIPball = [parseFloat(data[TIPball+1][0]), parseFloat(data[TIPball+2][0]), parseFloat(data[TIPball+3][0])];
    window.parameters.TIPball.maxima.TIPball = [parseFloat(data[TIPball+1][1]), parseFloat(data[TIPball+2][1]), parseFloat(data[TIPball+3][1])];

    window.parameters.DAQminima = [parseFloat(data[DAQ]), parseFloat(data[DAQ+4]), parseFloat(data[DAQ+2]), parseFloat(data[DAQ+6]), parseFloat(data[DAQ+8]), parseFloat(data[DAQ+10])];
    window.parameters.DAQmaxima = [parseFloat(data[DAQ+3]), parseFloat(data[DAQ+5]), parseFloat(data[DAQ+3]), parseFloat(data[DAQ+7]), parseFloat(data[DAQ+9]), parseFloat(data[DAQ+11])];

    window.parameters.DSSD.minima.DSSD = [parseFloat(data[DSSD][0]), parseFloat(data[DSSD+1][0]), parseFloat(data[DSSD+2][0])];
    window.parameters.DSSD.maxima.DSSD = [parseFloat(data[DSSD][1]), parseFloat(data[DSSD+1][1]), parseFloat(data[DSSD+2][1])];
    
}

//wrap ODBMGet in a function that accepts a key value store populated with ODBpaths, and returns the same object
//with paths replaced by actual values fetched from the ODB
//coming soon








//create a vertical collapsible menu that occupies a target div.
function deployMenu(targetDivID, headings, titles){
	var i;

	//listener tool for Buchner's dom insertion listener:
	window.parameters.insertListener = function(event){
		var prefix, tab;
		if (event.animationName == "nodeInserted") {
			prefix = event.target.id.slice(0, event.target.id.search('Content'));
			tab = document.getElementById(prefix+'Tab');
			resizeMenu(prefix);
		}
	}

	//inject the appropriate html into the target div:
	for(i=0; i<headings.length; i++){
		insertDOM('div', headings[i]+'Tab', 'collapsableMenu', 'max-height:50px; text-align:left; margin-top:2%;', targetDivID, '', '', '', '', '');
		insertDOM('h3', headings[i]+'arrow', '', 'display:inline; float:left;', headings[i]+'Tab', function(){toggleMenu(targetDivID, headings, this.id)}, String.fromCharCode(0x25B6));
		insertDOM('h3', headings[i]+'title', '', 'display:inline-block; font:20px Orbitron; padding-left:1em', headings[i]+'Tab', '', titles[i]);
		insertDOM('div', headings[i]+'Content', 'menuContent', '', headings[i]+'Tab', '', '');

		//make sure the expanded divs maintain an appropriate height even if their contents change:
		document.addEventListener("animationstart", window.parameters.insertListener, false); // standard + firefox
		document.addEventListener("webkitAnimationStart", window.parameters.insertListener, false); // Chrome + Safari
	}

}

//menu toggler for clock view - wrapperDivID wraps the menu, headings is the same array containing menu item IDs as in menu(), and thisOne is the item ID being interacted with.
function toggleMenu(wrapperDivID, headings, thisID){

    var totalHeight = parseInt(document.getElementById(wrapperDivID).offsetHeight),  //total height of menu bar
        fullHeight = totalHeight*0.98 - 100,
        assocDiv, string, i,
        thisOne = thisID.slice(0, thisID.length-5) + 'Tab';  //reconstruct the tab ID from the arrow ID

    if(document.getElementById(thisOne).style.maxHeight == '50px'){ //expand menu:
        //change the title arrows as appropriate, and resize menus
        for(i=0; i<headings.length; i++){
        	//force others to collapse so only one open at a time?
        	if(thisOne != headings[i]+'Tab'){
	        	//document.getElementById(headings[i]+'arrow').innerHTML = String.fromCharCode(0x25B6);
	        	//document.getElementById(headings[i]+'Tab').style.height = '50px';
	        } else{
	        	document.getElementById(headings[i]+'arrow').innerHTML = String.fromCharCode(0x25BC);
	        	//document.getElementById(headings[i]+'Tab').style.height = fullHeight+'px';
	        	//document.getElementById(headings[i]+'Tab').setAttribute('style', 'height: -webkit-max-content');
	        	document.getElementById(headings[i]+'Tab').style.maxHeight = (document.getElementById(headings[i]+'Content').offsetHeight+50)+'px';
	        }
        }
    } else {
	    document.getElementById(thisOne.slice(0,thisOne.length-3)+'arrow').innerHTML = String.fromCharCode(0x25B6);
	    document.getElementById(thisOne).style.maxHeight = '50px';
    }
}

//resize expanded menu when its Content div changes
function resizeMenu(id){
	if(document.getElementById(id+'Tab').style.maxHeight != '50px')
		document.getElementById(id+'Tab').style.maxHeight = (document.getElementById(id+'Content').offsetHeight+50)+'px';
}



//build a toggle switch out of divs:
function toggleSwitch(parentID, id, title, enabled, disabled, onActivate, onDeactivate, initialState){

	//wrapper div:
	insertDOM('div', 'toggleWrap'+id, 'toggleWrap',  ( (title=='') ? 'text-align:center;' : '' ), parentID, '', '');
	//label:
	if(title != '')
		insertDOM('div', 'toggleLabel'+id, 'toggleLabel', '', 'toggleWrap'+id, '', title);
	//toggle groove:
	insertDOM('div', 'toggleGroove'+id, 'toggleGroove',  ( (title=='') ? '' : 'float:left;' ), 'toggleWrap'+id, '', '');
	//toggle switch:
	insertDOM('div', 'toggleSwitch'+id, 'toggleSwitch', ((initialState) ? 'left:1em;' : 'left:0em;'), 'toggleGroove'+id,'', '');	
	document.getElementById('toggleSwitch'+id).onmousedown = function(event){
		document.getElementById('toggleWrap'+id).ready = 1;
	};
	document.getElementById('toggleSwitch'+id).onmouseup = function(event){
		flipToggle(event, id, enabled, disabled, onActivate, onDeactivate);
	};
	document.getElementById('toggleSwitch'+id).onmouseout = function(event){
		flipToggle(event, id, enabled, disabled, onActivate, onDeactivate)
	};
	//state description
	if(title=='')
		insertDOM('br', 'break', '', '', 'toggleWrap'+id);
	insertDOM('div', 'toggleDescription'+id, 'toggleDescription', ( (title=='') ? 'width:100%' : '' ), 'toggleWrap'+id, '', ((initialState) ? enabled : disabled));


}

function flipToggle(event, id, enabled, disabled, onActivate, onDeactivate){
	var switchID = 'toggleSwitch'+id,
	//grooveID = 'toggleGroove' + id,
	descriptionID = 'toggleDescription' + id;
	if(document.getElementById('toggleWrap'+id).ready != 1) return

	if(document.getElementById(switchID).style.left == '0em'){
		document.getElementById(switchID).style.left = '1em';
		document.getElementById(descriptionID).innerHTML = enabled;
		onActivate();
	} else{
		document.getElementById(switchID).style.left = '0em';
		document.getElementById(descriptionID).innerHTML = disabled;
		onDeactivate();
	}

	document.getElementById('toggleWrap'+id).ready =0;	
}






document.onmousemove = getMouseXY;

function getMouseXY(e)
{
   try {
      var x = e.pageX;
      var y = e.pageY;
      var p = 'abs: ' + x + '/' + y;
      i = document.getElementById('refimg');
      if (i == null)
         return false;
      document.body.style.cursor = 'crosshair';
      x -= i.offsetLeft;
      y -= i.offsetTop;
      while (i = i.offsetParent) {
         x -= i.offsetLeft;
         y -= i.offsetTop;
      }
      p += '   rel: ' + x + '/' + y;
      window.status = p;
      return true;
      }
   catch (e) {
      return false;
   }
}

function XMLHttpRequestGeneric()
{
   var request;
   try {
      request = new XMLHttpRequest(); // Firefox, Opera 8.0+, Safari
   }
   catch (e) {
      try {
         request = new ActiveXObject('Msxml2.XMLHTTP'); // Internet Explorer
      }
      catch (e) {
         try {
            request = new ActiveXObject('Microsoft.XMLHTTP');
         }
         catch (e) {
           alert('Your browser does not support AJAX!');
           return undefined;
         }
      }
   }

   return request;
}

function ODBSet(path, value, pwdname)
{
   var value, request, url;

   if (pwdname != undefined)
      pwd = prompt('Please enter password', '');
   else
      pwd = '';

   var request = XMLHttpRequestGeneric();

   url = '?cmd=jset&odb=' + path + '&value=' + value;

   if (pwdname != undefined)
      url += '&pnam=' + pwdname;

   request.open('GET', url, false);

   if (pwdname != undefined)
      request.setRequestHeader('Cookie', 'cpwd='+pwd);

   request.send(null);

   if (request.status != 200 || request.responseText != 'OK') 
      alert('ODBSet error:\nPath: '+path+'\nHTTP Status: '+request.status+'\nMessage: '+request.responseText+'\n'+document.location) ;
}

function ODBGet(path, format, defval, len, type)
{
   var request = XMLHttpRequestGeneric();

   var url = '?cmd=jget&odb=' + path;
   if (format != undefined && format != '')
      url += '&format=' + format;
   request.open('GET', url, false);
   request.send(null);

   if (path.match(/[*]/)) {
      if (request.responseText == null)
         return null;
      if (request.responseText == '<DB_NO_KEY>') {
         url = '?cmd=jset&odb=' + path + '&value=' + defval + '&len=' + len + '&type=' + type;

         request.open('GET', url, false);
         request.send(null);
         return defval;
      } else {
         var array = request.responseText.split('\n');
         return array;
      }
   } else {
      if ((request.responseText == '<DB_NO_KEY>' ||
           request.responseText == '<DB_OUT_OF_RANGE>') && defval != undefined) {
         url = '?cmd=jset&odb=' + path + '&value=' + defval + '&len=' + len + '&type=' + type;

         request.open('GET', url, false);
         request.send(null);
         return defval;
      }
      return request.responseText;
   }
}

function ODBMGet(paths, callback, formats)
{
   var request = XMLHttpRequestGeneric();

   var url = '?cmd=jget';
   for (var i=0 ; i<paths.length ; i++) {
      url += '&odb'+i+'='+paths[i];
      if (formats != undefined && formats != '')
         url += '&format'+i+'=' + formats[i];
   }

   if (callback != undefined) {
      request.onreadystatechange = function() 
         {
         if (request.readyState == 4) {
            if (request.status == 200) {
               var array = request.responseText.split('$#----#$\n');
               for (var i=0 ; i<array.length ; i++)
                  if (paths[i].match(/[*]/))
                     array[i] = array[i].split('\n');
               callback(array);
            }
         }
      }
      request.open('GET', url, true);
   } else
      request.open('GET', url, false);
   request.send(null);

   if (callback == undefined) {
      var array = request.responseText.split('$#----#$\n');
      for (var i=0 ; i<array.length ; i++)
         if (paths[i].match(/[*]/))
            array[i] = array[i].split('\n');
      return array;
   }
}

function ODBGetRecord(path)
{
   var request = XMLHttpRequestGeneric();

   var url = '?cmd=jget&odb=' + path + '&name=1';
   request.open('GET', url, false);
   request.send(null);
   return request.responseText;
}

function ODBExtractRecord(record, key)
{
   var array = record.split('\n');
   for (var i=0 ; i<array.length ; i++) {
      var ind = array[i].indexOf(':');
      if (ind > 0) {
         var k = array[i].substr(0, ind);
         if (k == key)
            return array[i].substr(ind+1, array[i].length);
      }
      var ind = array[i].indexOf('[');
      if (ind > 0) {
         var k = array[i].substr(0, ind);
         if (k == key) {
            var a = new Array();
            for (var j=0 ; ; j++,i++) {
               if (array[i].substr(0, ind) != key)
                  break;
               var k = array[i].indexOf(':');
               a[j] = array[i].substr(k+1, array[i].length);
            }
            return a;
         }
      }
   }
   return null;
}

function ODBKey(path)
{
   var request = XMLHttpRequestGeneric();

   var url = '?cmd=jkey&odb=' + path;
   request.open('GET', url, false);
   request.send(null);
   if (request.responseText == null)
      return null;
   var key = request.responseText.split('\n');
   this.name = key[0];
   this.type = key[1];
   this.num_values = key[2];
   this.item_size = key[3];
}

function ODBRpc_rev0(name, rpc, args)
{
   var request = XMLHttpRequestGeneric();

   var url = '?cmd=jrpc_rev0&name=' + name + '&rpc=' + rpc;
   for (var i = 2; i < arguments.length; i++) {
     url += '&arg'+(i-2)+'='+arguments[i];
   };
   request.open('GET', url, false);
   request.send(null);
   if (request.responseText == null)
      return null;
   this.reply = request.responseText.split('\n');
}

function ODBRpc_rev1(name, rpc, max_reply_length, args)
{
   var request = XMLHttpRequestGeneric();

   var url = '?cmd=jrpc_rev1&name=' + name + '&rpc=' + rpc + '&max_reply_length=' + max_reply_length;
   for (var i = 3; i < arguments.length; i++) {
     url += '&arg'+(i-3)+'='+arguments[i];
   };
   request.open('GET', url, false);
   request.send(null);
   if (request.responseText == null)
      return null;
   return request.responseText;
}

function ODBGetMsg(n)
{
   var request = XMLHttpRequestGeneric();

   var url = '?cmd=jmsg&n=' + n;
   request.open('GET', url, false);
   request.send(null);

   if (n > 1) {
      var array = request.responseText.split('\n');
      return array;
   } else
      return request.responseText;
}

function ODBGenerateMsg(m)
{
   var request = XMLHttpRequestGeneric();

   var url = '?cmd=jgenmsg&msg=' + m;
   request.open('GET', url, false);
   request.send(null);
   return request.responseText;
}

function ODBGetAlarms()
{
   var request = XMLHttpRequestGeneric();
   request.open('GET', '?cmd=jalm', false);
   request.send(null);
   var a = request.responseText.split('\n');
   a.length = a.length-1;
   return a;
}

function ODBEdit(path)
{
   var value = ODBGet(path);
   var new_value = prompt('Please enter new value', value);
   if (new_value != undefined) {
      ODBSet(path, new_value);
      window.location.reload();
   }
}

/* MIDAS type definitions */
var TID_BYTE = 1;
var TID_SBYTE = 2;
var TID_CHAR = 3;
var TID_WORD = 4;
var TID_SHORT = 5;
var TID_DWORD = 6;
var TID_INT = 7;
var TID_BOOL = 8;
var TID_FLOAT = 9;
var TID_DOUBLE = 10;
var TID_BITFIELD = 11;
var TID_STRING = 12;
var TID_ARRAY = 13;
var TID_STRUCT = 14;
var TID_KEY = 15;
var TID_LINK = 16;
function loadParameters(){

				window.parameters = {
				"devMode" : 0,
				"MIDASlegacyMode" : 0,
				"ExpName" : "",
				"statusURL" : "",
				"topDeployment" : {"HV":1, "Subsystems":1, "DAQ":1, "Clock":0, "Trigger":0},
				"deployment" : {"BAMBINO":1, "DANTE":1, "DESCANT":1, "HPGe":1, "PACES":1, "SCEPTAR":1, "SHARC":1, "SPICE":1, "TIPwall":1, "TIPball":1, "DSSD":0},
				//"topDeployment" : {"HV":0, "Subsystems":1, "DAQ":1, "Clock":0, "Trigger":0},
				//"deployment" : {"BAMBINO":0, "DANTE":0, "DESCANT":0, "HPGe":1, "PACES":0, "SCEPTAR":0, "SHARC":1, "SPICE":0, "TIPwall":0, "TIPball":0, "DSSD":0},
				"wrapper" : "waffleplate",
				"subdetectorUnit" : ["V", "ADC units", "Hz"],
				"monitorValues" : ["HV", "Thresholds", "Rate", "TAC-Thresholds", "TAC-Rate"],  //for filling tooltip
				"keyLookup" : ['HV', 'threshold', 'rate'], //for mapping subdetectorView index onto keys
				//"ODBkeys" : ["/Location/Of/Device/Varibles", "/Location/Of/Device/Settings", "Demand Voltage Key", "Measured Voltage Key", "Measured Current Key", "Voltage Ramp Up Key", "Voltage Ramp Down Key", "Temperature Key", "ChState Key", "ChStatus Key", "Voltage Limit Key", "Current Limit Key", "Channel Name Key"],
				//"ODBkeys" : ["/Equipment/HV/Variables", "/Equipment/HV/Settings", "Demand", "Measured", "Current", "Ramp Up Speed", "Ramp Down Speed", "Temperature", "ChState", "ChStatus", "Voltage Limit", "Current Limit", "Names"],
				"ODBkeys" : ["Variables/Demand", "Variables/Measured", "Variables/Current", "Settings/Ramp Up Speed", "Settings/Ramp Down Speed", "Variables/Temperature", "Settings/ChState", "Variables/ChStatus", "Settings/Voltage Limit", "Settings/Current Limit", "Settings/Names"],
				"rows" : 12,
				"columns": [],
				"rowTitles" : ["Ch.", "0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11"],
				"alarmThresholds" : [20, 10000, 100, 0],
				"scaleMaxima" : [1,1,1,1],
				"prefix" : ["Demand Voltage: ", "Reported Voltage: ", "Reported Current: ", "Voltage Ramp Up Speed: ", "Voltage Ramp Down Speed", "Temperature: ", "Status: "],
				"postfix" : ["V", "V", "uA", "V/s", "V/s", "C", ""],
				//min voltage and max voltage seem unnecessary, TODO: investigate removal.
				"minVoltage" : 0,
				"maxVoltage" : 1,
				"minCurrent" : 0,
				"maxCurrent" : 1,
				"minTemperature" : 0,
				"maxTemperature" : 1,
				"minRampSpeed" : 0,
				"maxRampSpeed" : 1,
				"statusPrecision" : 0,
				"barChartPrecision" : 0,
				"alarmPrecision" : 0,
				"tooltipPrecision" : 0,
				"voltUnit" : "V",
				"rampUnit" : "V/s",
				"currentUnit" : "uA",
				"temperatureUnit" : "C",
				"HVequipmentNames" : ["HV-0", "HV-1", "HV-2"],
				"moduleSizes" : [],
				"colorScale"  : ["ROOT Rainbow", "Greyscale", "Sunset", "Red Scale", "Mayfair"],
				"subdetectorColors" : ["ROOT Rainbow", "ROOT Rainbow", "Sunset"],
				"validDetectors" : ["TIG", "TIS", "GRG", "GRS", "HPG", "HPS", "BAE", "BAZ", "SHQ", "SHB", "MAD", "MAM", "CSD", "CSM", "SPI", "SPE", "DSC", "SEP", "SET", "PAC", "DAL", "DAB", "DAS", "TPC", "TPW", "TPP", "TPG", "TPE", "ZDS", "ZDP", "ZDM", "ZDD", "TBR", "YBP", "YBB", "TRF", "RFL", "RFS"],
				"detectorLogMode" : {'SubsystemsButton' : 0, 'DAQbutton' : 0},  //log state a function of ID of button used to summon current view state 
				"warningFill" : 0, //an img to fill detector channels absent from the JSONP post


				"BAMBINO" : {
								"minima" : {
												"BAMBINO" : [0,0,0]
										   },
								"maxima" : {
												"BAMBINO" : [1,1,1]
										   }
							},
				"BAMBINOmode" : "S3",
				"BAMBINOlayers" : 2,
				"BAMBINOdeployment" : [1,0],  //upstream, downstream

				"DANTE" : {
							"minima" : {
											"LaBrPMT" : [0,0,0],
											"LaBrTAC" : [0,0,0],
											"BGO" : [0,0,0]
									   },
							"maxima" : {
											"LaBrPMT" : [1,1,1],
											"LaBrTAC" : [1,1,1],
											"BGO" : [1,1,1]
									   }
						  },

				"DESCANT" : {
								"minima" : {
												"DESCANT" : [0,0,0]
										   },
								"maxima" : {
												"DESCANT" : [1,1,1]
										   },
							},

				"HPGe" : {
							"minima" : {
											"HPGe" : [0,0,0],
											"BGO" : [0,0,0]
									   },
							"maxima" : {
											"HPGe" : [1,1,1],
											"BGO" : [100,100,100]
							           },
						 },
				"HPGemode" : "GRIFFIN",
				"BGOenable" : 1,
				"cloversAbsent" : [],

				"PACES" : {
							"minima" : {
											"PACES" : [0,0,0]
									   },
							"maxima" : {
											"PACES" : [1,1,1]
									   }
						  },


				"SCEPTAR" : {
								"minima" : {
												"SCEPTAR" : [0,0,0],
												"ZDS" : [0,0,0]
										   },
								"maxima" : {
												"SCEPTAR" : [1,1,1],
												"ZDS" : [1,1,1]
										   }
							},
				"SCEPTARconfig" : [1,0,1],

				"SHARC" : {
							"minima" : {
											"SHARC" : [0,0,0]
								       },
							"maxima" : {
											"SHARC" : [1,1,1]
							           },
						  },  
				"SHARCpads" : 0,

				"SPICE" : {
							"minima" : {
											"SPICE" : [0,0,0]
									   },
							"maxima" : {
											"SPICE" : [1,1,1]
									   }
						  },
				"SPICEaux" : '',
				"SPICEauxLayers" : 2,

				"TIPwall" : {
							"minima" : {
											"TIPwall" : [0,0,0],
									   },
							"maxima" : {
											"TIPwall" : [1,1,1],
									   }
						},

				"TIPball" : {
							"minima" : {
											"TIPball" : [0,0,0],
									   },
							"maxima" : {
											"TIPball" : [1,1,1],
									   }
						},

				"DSSD" : {
								"minima" : {
												"DSSD" : [0,0,0]
										   },
								"maxima" : {
												"DSSD" : [1,1,1]
										   },
						},

				"DAQminima" : [0, 0, 0, 0, 0, 0], //minima of element scales: [top level view rate, top level transfer, detail view rate, detail view transfer, master rate, master transfer]
				"DAQmaxima" : [10000, 100000, 1000, 1000, 50000, 50000],

				"nClocks" : 0,
				"clockVariableNames" : ['Clock Enable', 'Configuration', 'Sync Source', 'Clock Source', 'Ref. Clock', 'LEMO Clock', 'LEMO Sync', 'eSATA Clock', 'eSATA Sync', 'Ch. 0 Hi Cycles', 'Ch. 0 Lo Cycles', 'Ch. 0 Bypass', 'Ch. 0 Phase', 'Ch. 1 Hi Cycles', 'Ch. 1 Lo Cycles', 'Ch. 1 Bypass', 'Ch. 1 Phase', 'Ch. 2 Hi Cycles', 'Ch. 2 Lo Cycles', 'Ch. 2 Bypass', 'Ch. 2 Phase', 'Ch. 3 Hi Cycles', 'Ch. 3 Lo Cycles', 'Ch. 3 Bypass', 'Ch. 3 Phase', 'Ch. 4 Hi Cycles', 'Ch. 4 Lo Cycles', 'Ch. 4 Bypass', 'Ch. 4 Phase', 'Ch. 5 Hi Cycles', 'Ch. 5 Lo Cycles', 'Ch. 5 Bypass', 'Ch. 5 Phase', 'Ch. 6 Hi Cycles', 'Ch. 6 Lo Cycles', 'Ch. 6 Bypass', 'Ch. 6 Phase', 'Ch. 7 Hi Cycles', 'Ch. 7 Lo Cycles', 'Ch. 7 Bypass', 'Ch. 7 Phase', 'Power', 'Status', 'Mode', 'Alarm', 'Unit Power', 'Tuning Voltage', 'Laser Current', 'Clock Heater Power', 'Temperature', 'Serial No.', 'Firmware Version'],

				"JSONPrepos" : ["http://midtig06.xtriumf.ca:8091/mother/parameters?jsonp=parseThreshold", "http://midtig06.xtriumf.ca:8091/mother/scalar?jsonp=parseResponse"]
				}

				window.parameters.warningFill = document.getElementById('warningFill');

			}

/*Parameter Dictionary//////////////////////////////////////
//Global
devMode							Flag that toggles between actually fetching ODB values and generating dummy values
statusURL:						String containing the url of the MIDAS status page
topDeployment:                  switches to turn top level assets on/off
deployment						switches to turn subsystems on/off
wrapper							ID of div that wraps all both sidebars + main display region
subdetectorUnit                 units for the scale in each of the subdetector views [HV, thresholds, rates]
monitorValues					monitoring options on the subdetector pages

//HV monitor
ODBkeys: 						["/Location/Of/Device/Varibles", "/Location/Of/Device/Settings", "Demand Voltage Key", "Measured Voltage Key", "Measured Current Key", "Voltage Ramp Up Key", "Voltage Ramp Down Key", "Temperature Key", "ChState Key", "ChStatus Key", "Voltage Limit Key", "Current Limit Key"]
rows:							number of rows in the HV monitor, not counting the primary row
columns:						number of columns in HV monitor.
rowTitles:						Array of strings descrbing the row titles
alarmThresholds:				Maximum values before an alarm is tripped [abs(demand-measured voltage), current, temperature, rate]
scaleMaxima:					Saturation point for color scale
prefix:							Array of strings which will be prepended to corresponding lines in the HV tooltip
postfix:						As prefix
minVoltage:						minimum voltage represented in sliders and fillmeters
maxVoltage:						""
minCurrent:						""
maxCurrent:						""
minTemperature:					""
maxTemperature:					""
minRampSpeed:					""
maxRampSpeed:					""
statusPrecision:				number of decimal places to keep in the status sidebar
barChartPrecision:				number of decimal places to keep in the barchart scale
alarmPrecision:					number of decimal places to keep in the alarm reporting sidebar
voltUnit:						unit to be used for voltage reporting
rampUnit:						""
currentUnit:					""
temperatureUnit:				""
moduleSizes:                    Array containing a size code for each slot in the HV crate: 0=empty, 1=12 ch card, 4=48 ch card.

//SHARC
SMrows:							number of rows of strip diplays
SMcolumns:						number of cols of strip displays
SM_ODBkeys:						["/Location/Of/Device/Varibles", "/Location/Of/Device/Settings", "HV Key"]
SMnChannels:					number of channels per display
SMminima:						array containing scale minima
SMmaxima:						""
nRadialHoriz					number of radial bins in the disks corresponding to the horizontal strip display 
nAzimuthalHoriz					number of azimuthal bins "" 
nRadialVert						number of radial bins in disks associated with the vertical strip display 
nAzimuthalVert					number of azimuthal bins ""

//HPGe
HPGemode						'GRIFFIN' or 'TIGRESS'
BGOenable						are the suppressors present?
HPGeminima						array of scale minima: [HPGe HV, HPGe Thresholds, HPGe Rate...]
HPGemaxima						""

DESACNTminima					array of scale minima: [HV, Thresholds, Rate...]
DESCANTmaxima					""

PACESminima						array of scale minima: [HV, Thresholds, Rate...]
PACESmaxima						""

DANTEminima						array of scale minima: [HV, Thresholds, Rate...]
DANTEmaxima						""

SPICEminima						array of scale minima: [HV, Thresholds, Rate...]
SPICEmaxima						""

SCEPTARminima					array of scale minima: [HV, Thresholds, Rate...]
SCEPTARmaxima					""
SCEPTARconfig                   subsystems on: [upstream sceptar, downstream sceptar, downstream ZDS]

TIPminima						array of scale minima: [HV, Thresholds, Rate...]
TIPmaxima						""

//DAQ
DAQminima:						array containing minima of DAQ rate reporting scale: [master, collector groups, collector links, collectors, digitizer summary links, digitizer summaries, digitizer groups, digitizer links, digitizers]
DAQmaxima:						""


//JSONP
JSONPrepos						array containing URLs of all JSONP data to be pulled in at each update: [thresholds, scalars, dummy]

*/


function Slider(wrapperID, titleID, inputBoxID, sliderContainerID, sliderBackgroundID, sliderKnobID, sliderCanvID, sliderTextID, min, max, decimal, unit, length){

    //slider limits:
    this.min = min;
    this.max = max;

    //value unit:
    this.unit = unit;

    //number of decimal places to keep:
    this.dec = decimal;

    //length of slider; if user enters 0, use default size:
    this.length = length;
    if(this.length == 0) this.length = 220;
    //left bound of slider rail:
    this.leftRail = 20;
    //right bound of slider rail:
    this.rightRail = this.leftRail + this.length;
    //leftmost limit of knob's left edge:
    this.leftKnob = this.leftRail - 10;
    //rightmost limit of knob's left edge:
    this.rightKnob = this.rightRail - 10;

    //previous physical value:
    this.oldValue = 0;
    //current value:
    this.newValue = 0;
    //value of field on click:
    this.valueOnFocus = 0;

    //animation parameters:
    this.duration = 0.4; //seconds
    this.FPS = 30;
    this.nFrames = this.duration*this.FPS;

    //IDs:
    this.wrapperID = wrapperID;
    this.titleID = titleID;
    this.inputBoxID = inputBoxID;
    this.sliderContainerID = sliderContainerID;
    this.sliderBackgroundID = sliderBackgroundID;
    this.sliderKnobID = sliderKnobID;
    this.sliderCanvID = sliderCanvID;
    this.sliderTextID = sliderTextID;

    //DOM manipulation/////////////////////////////////////////////
    //slider background canvas:
    insertDOM('canvas', this.sliderBackgroundID, 'sliderBKG', '', this.sliderContainerID, '', '')
    document.getElementById(this.sliderBackgroundID).setAttribute('width', '0');
    document.getElementById(this.sliderBackgroundID).setAttribute('height', '24');
    //slider knob div
    insertDOM('div', this.sliderKnobID, 'sliderKnob', '', this.sliderContainerID, '', '')
    //knob style canvas
    insertDOM('canvas', this.sliderCanvID, 'knobStyle', '', this.sliderKnobID, '', '')
    document.getElementById(this.sliderCanvID).setAttribute('width', '24');
    document.getElementById(this.sliderCanvID).setAttribute('height', '16');
    //position feedback paragraph
    insertDOM('p', this.sliderTextID, 'sliderText', '', this.sliderKnobID, '', '0%')

    //finished DOM injections//////////////////////////////////////

    //pointers by ID:
    this.wrapper = document.getElementById(wrapperID);
    this.inputBox = document.getElementById(inputBoxID);
    this.sliderContainer = document.getElementById(sliderContainerID);
    this.sliderBackground = document.getElementById(sliderBackgroundID);
    this.sliderKnob = document.getElementById(sliderKnobID);
    this.sliderCanv = document.getElementById(sliderCanvID);
    this.sliderText = document.getElementById(sliderTextID);

    $(this.sliderContainer).css('left', $(this.inputBox).width() +  0.1*$(this.wrapper).width()*1.5 );

    //configure slider div and canvas css:
    this.sliderContainer.width = 1.2*length;
    this.sliderBackground.width = 1.2*length;

    //draw the slider canvases:
    this.sliderContext = this.sliderBackground.getContext('2d');
    this.knobContext = this.sliderCanv.getContext('2d');

    //knob rail:
    this.sliderContext.strokeStyle = 'rgba(255,255,255,0.7)'
    this.sliderContext.lineWidth = 1;
    this.sliderContext.beginPath();
    this.sliderContext.moveTo(this.leftRail, 8);
    this.sliderContext.lineTo(this.rightRail, 8);
    this.sliderContext.stroke();

    //knob surface:
    this.knobContext.fillStyle = 'rgba(255,255,255,1)';
    this.knobContext.lineWidth = 1;
    this.knobContext.beginPath();
    this.knobContext.moveTo(0,4);
    this.knobContext.lineTo(0,12);         
    this.knobContext.arcTo(0,16, 4,16, 4);
    this.knobContext.lineTo(16,16);
    this.knobContext.arcTo(20,16,20,12,4);
    this.knobContext.lineTo(20,4);
    this.knobContext.arcTo(20,0,16,0,4);
    this.knobContext.lineTo(4,0);
    this.knobContext.arcTo(0,0,0,4,4);
    this.knobContext.fill();
    this.knobContext.stroke();

    //establish slider response:
    this.active = 0;
    this.sliderWasAt = 0;
    this.cursorWasAt = 0;
    this.dragX = 0;
    this.sliderTo = 0;
    this.scale = 0;
    this.sliderString;  

    //turn off slider focus glow:
    $(this.sliderKnob).css('outline', '0px none transparent');

    var that = this;

    this.sliderCanv.onmousedown = function(event){
        that.sliderWasAt = parseFloat($(that.sliderKnob).css('left'));
        that.sliderKnob.tabIndex = '1';
        that.sliderKnob.focus();
        that.active = 1;
        that.cursorWasAt = event.pageX;
    }

    this.sliderContainer.onmouseup = function(event){
        that.active = 0;
        that.sliderWasAt = that.sliderWasAt + that.dragX;
    }

    this.sliderContainer.onmouseout = function(event){
        that.active = 0;
        that.sliderWasAt = that.sliderWasAt + that.dragX;
    }

    this.sliderContainer.onmousemove = function(event){
        if(that.active){

            that.dragX = event.pageX - that.cursorWasAt;
            that.sliderTo = that.sliderWasAt + that.dragX;
            //keep slider in range:
            if(that.sliderTo < that.leftKnob) that.sliderTo = that.leftKnob;
            if(that.sliderTo > that.rightKnob) that.sliderTo = that.rightKnob;

            that.scale = (that.sliderTo-that.leftKnob) / that.length;

            //establish new position:
            that.oldValue = that.newValue;
            that.newValue = (that.scale*(that.max-that.min) + that.min);

            //estabish slider label content
            that.sliderString =  that.newValue.toFixed(that.dec)+' '+that.unit;

            //center label under knob, but don't let it fall off the end of the slider.
            var stringWidth = that.knobContext.measureText(that.sliderString).width*1.2
            $('#'+sliderTextID).css('left',(-1*stringWidth/2 -10) );
            if(stringWidth/2+that.sliderTo+0+10> that.rightRail){
                $('#'+sliderTextID).css('left', that.rightKnob - stringWidth - that.sliderTo - 10);
            }
            if(that.sliderTo - stringWidth/2 -0-10 < that.leftRail){
                $('#'+sliderTextID).css('left', that.leftKnob + 0+10 - that.sliderTo );
            }

            that.sliderText.innerHTML = '<br>'+that.sliderString;

            $(that.sliderKnob).css('left', that.sliderTo);

            that.inputBox.value = (that.scale*(that.max-that.min)+that.min).toFixed(that.dec);

            highlight('submitParameters');
        }
    }

    this.sliderKnob.onkeydown = function(event){
        if(event.keyCode == 39) {
            that.step(Math.pow(10, -1*that.dec));
            highlight('submitParameters');
        }
        else if(event.keyCode == 37) {
            that.step(-1*Math.pow(10, -1*that.dec));
            highlight('submitParameters');
        }
    }

    this.inputBox.onblur = function(event){
         
        //note: need to skip animation here (ie can't just use update) since when clicking 'submit'
        //an intermediate value might be grabbed and sent to HW as the knob scrolls and drags the text
        //with it.  TODO: scroll knob without changing text box.
        
        //keep things in bounds:
        var newSliderVal = that.inputBox.value;
        if(newSliderVal > that.max) newSliderVal = that.max;
        if(newSliderVal < that.min) newSliderVal = that.min;
        
        //keep the animation parameters updated:
        that.oldValue = that.newValue;
        that.newValue = newSliderVal;
  
        //find the fraction of the way along the rail the knob should jump to:
        var sliderPosition = (newSliderVal-that.min)/(that.max-that.min);
        
        that.jump(parseFloat(sliderPosition));
        
    }

    //move the slider discontinuously to a new <position>, expressed as a fraction of the way between scale min and scale max:
    this.jump = function(position){
        this.sliderTo = position*this.length;
        $(this.sliderKnob).css('left', this.sliderTo+this.leftKnob);   
        this.scale = (this.sliderTo) / this.length;

        //estabish slider label content
        this.sliderString = (position*(this.max-this.min)+this.min).toFixed(this.dec)+' '+this.unit;

        //center label under knob, but don't let it fall off the end of the slider.
        var stringWidth = this.knobContext.measureText(this.sliderString).width*1.2;
        $('#'+this.sliderTextID).css('left',(-1*stringWidth/2 - 10) );
        if(stringWidth/2+this.sliderTo+this.leftKnob+0 +10 > this.rightKnob){
            $('#'+this.sliderTextID).css('left', -1*stringWidth - this.sliderTo -this.leftKnob-0 -10 + this.rightKnob );
        }
        if(this.sliderTo+this.leftKnob - stringWidth/2 -0 -10 < this.leftKnob){
            $('#'+this.sliderTextID).css('left', this.leftKnob+0+10-this.sliderTo-this.leftKnob );
        }

        this.sliderText.innerHTML = '<br>'+this.sliderString;

        this.inputBox.value = (this.scale*(this.max-this.min)+this.min).toFixed(this.dec);        
    };

    //top function for handling slider updates from everything other than the slider knob:
    this.update = function(inputValue){

        //keep value inbounds:
        var newValue = inputValue;

        if(newValue > this.max) newValue = this.max;
        if(newValue < this.min) newValue = this.min;

        //set up member variables for animation:
        this.oldValue = parseFloat(this.newValue);
        this.newValue = parseFloat(newValue);

        //animate:
        animate(this, 0);
    };

    //draw function used by animate():
    this.draw = function(frame){
        //this frame is this fraction of the way between scale min and scale max:
        var position = ((this.newValue - this.oldValue)*frame/this.nFrames + this.oldValue - this.min)/(this.max-this.min);

        this.jump(position);

    };

    //like update, but handles an un-animated single step from a cursor stroke:
    this.step = function(stepSize){
        //keep value inbounds:
        var newValue = this.newValue + stepSize; 
        if(newValue > this.max) newValue = this.max;
        if(newValue < this.min) newValue = this.min;

        //set up member variables for animation:
        this.oldValue = this.newValue;
        this.newValue = newValue;

        //use draw at the last frame to skip the animation:
        this.draw(this.nFrames);
    };

}function Tooltip(ttCanvasID, ttDivID, wrapperID, prefix, postfix){

    this.obj;                                       //the object that this tooltip is associated with
    this.canvasID = ttCanvasID;                     //target canvas
    this.ttDivID = ttDivID;                         //tooltip div
    this.wrapperID = wrapperID;                     //ID of div which wraps the tooltip's canvas
    this.prefix = prefix;                           //prefixes to tooltip content lines
    this.postfix = postfix;                         //postfixes to tooltip content lines

    //inject the necessary DOM elements for this tooltip:
    //wrapper div
    insertDOM('div', this.ttDivID, 'tooltip', '', 'body', '', '')

    this.canvas = document.getElementById(this.canvasID);
    this.context = this.canvas.getContext('2d'); 
    this.ttDiv = document.getElementById(this.ttDivID);
    this.ttParent = document.getElementById(this.wrapperID);

    //old tt bin, for updates when the mouse is just sitting in the same place:
    this.oldCellIndex = -1;
    this.allowUpdate = 0;

    var that = this;

    //suppresses some flaky positioning when TT changes size:
    this.canvas.onmouseover = function(event){
        that.ttDiv.style.display = 'none';
        that.allowUpdate = 0; 
    }

    this.canvas.onmousemove = function(event){

        //force the tooltip off - patches persistency problem when moving down off the waffle.  TODO: understand persistency problem.
        that.ttDiv.style.display = 'none';

        //get mouse coords:
        var x = event.pageX - that.canvas.offsetLeft - that.ttParent.offsetLeft;   
        var y = event.pageY - that.canvas.offsetTop - that.ttParent.offsetTop;

        //turn mouse coords into the index pointing to where the relevant info is stored in obj's info arrays:
        var cellIndex = that.obj.findCell(x, y);

        //only continue if the cursor is actually on a valid channel; x and y>0 suppresses an antialiasing bug:
        if(cellIndex != -1 && x>1 && y>1 && x<that.obj.canvasWidth-1 && y<that.obj.canvasHeight-1){

            document.body.style.cursor = 'pointer';

            //establish text:
            that.obj.defineText(cellIndex);

            //set the display on so offsetHeight and Width work:
            that.ttDiv.style.display = 'block';
            that.ttDiv.style.opacity = 0;

            //decide how to position the TT:
            if(window.state.staticTT){
                that.ttDiv.style.top = window.innerHeight/2 - that.ttDiv.offsetHeight/2;
                that.ttDiv.style.left = window.innerWidth/2 - that.ttDiv.offsetWidth/2;
                that.ttDiv.style.right = 'auto';
            } else {
                //make the tool tip follow the mouse, but keep it on the screen:
                that.ttDiv.style.top = Math.min(event.pageY - 10, window.innerHeight + window.pageYOffset - that.ttDiv.offsetHeight);
                if(event.pageX < that.canvas.offsetWidth || window.renderWidth>15000){
                    that.ttDiv.style.right = 'auto'
                    that.ttDiv.style.left = event.pageX  + 10;
                }else{
                    that.ttDiv.style.left = 'auto';
                    that.ttDiv.style.right = window.innerWidth - event.pageX + 10;
                }
            }
            //turn the TT on:
            that.ttDiv.style.opacity = 1;

            //keep track of tooltip position
            that.oldCellIndex = cellIndex;
            that.allowUpdate = 1;

            //return to default TT positioning:
            window.state.staticTT = 0;

        } else {
            document.body.style.cursor = 'auto';
            that.allowUpdate = 0;
        }
    }

    //turn the tool tip off if it's outside the canvas:
    this.canvas.onmouseout = function(event){
        that.ttDiv.style.display = 'none';
        that.allowUpdate = 0;
    }

    //updater for if the tooltip is stationary on the waffle during a master loop transition:
    this.update = function(){
        if(this.allowUpdate){
            //establish text:
            this.obj.defineText(this.oldCellIndex);
        }
    };

}function partial(func /*, 0..n args */) {
  var args = Array.prototype.slice.call(arguments, 1);
  return function() {
    var allArguments = args.concat(Array.prototype.slice.call(arguments));
    return func.apply(this, allArguments);
  };
}

function curry (fn) {
    var slice = Array.prototype.slice,
        args = slice.apply(arguments, [1]);
    return function () {
        fn.apply(null, args.concat(slice.apply(arguments)));
    };
}

//generic function to execute the animation of some object <thing>, which has memeber function .draw which draws
//the thing only as a function of what frame the animation is on, and member data .duration, .FPS and .nFrames.
function animate(thing, frame){

    //clearTimeout(window.animateLoop);

    thing.draw(frame);
    if(frame < thing.nFrames){
        frame++;
        window.animateLoop = setTimeout(function(){animate(thing, frame)},thing.duration/thing.FPS*1000);
    }
}

//copy of animate, but for use on detail level view:  todo: combine with animate
function animateDetail(thing, frame){

    thing.drawDetail(thing.detailContext, frame);
    if(frame < thing.nFrames){
        frame++;
        window.transAnimateLoop = setTimeout(function(){animateDetail(thing, frame)},thing.duration/thing.FPS*1000);
    }
}

//styling functions to highlight / unhighlight submit button
function unhighlight(buttonID){
    clearTimeout(window.commitBlink);
    $('#'+buttonID).css('background-color', '#FFFFFF');
}

function highlight(buttonID){

    //$('#'+buttonID).css('background-color', '#FFFF00');
    clearTimeout(window.commitBlink);
    function blinkHighlight(color){
        $('#'+buttonID).css('background-color', color);

        if(color == '#FFFFFF') window.commitBlink = setTimeout(function(){blinkHighlight('#FFFF00')},1000);
        if(color == '#FFFF00') window.commitBlink = setTimeout(function(){blinkHighlight('#FFFFFF')},1000);
    }

    blinkHighlight('#FFFF00')


}

//insert something in the DOM
function insertDOM(element, id, classTag, style, wrapperID, onclick, content, name, type, value){
    var newElement = document.createElement(element);
    newElement.setAttribute('id', id);
    newElement.setAttribute('class', classTag);
    newElement.setAttribute('style', style);
    newElement.setAttribute('name', name);
    newElement.setAttribute('type', type);
    newElement.setAttribute('value', value);
    if(wrapperID == 'body')
        document.body.appendChild(newElement)
    else
        document.getElementById(wrapperID).appendChild(newElement);
    document.getElementById(id).innerHTML = content;
    document.getElementById(id).onclick = onclick;
}

//devName = device Name, scales = [ [scale title, parameter service minima, parameter service maxima, unit, ODBminpath, ODBmaxpath], ...]
function parameterDialogue(devName, scales, currentColorScale){
    var i, j, ODBpath;

    //insert div and title
    insertDOM('div', 'tempDiv', '', 'z-index:10; position:absolute; text-align:center; opacity:0; transition:opacity 0.5s; -moz-transition:opacity 0.5s; -webkit-transition:opacity 0.5s; background:rgba(0,0,0,0.8); border: 5px solid; border-radius:10px;', 'waffleplate', '', '', '');
    var dialogue = document.getElementById('tempDiv');
    insertDOM('h2', 'dialogHeader', '', 'position:relative; font:24px Orbitron; top:10px; margin-bottom:6%', 'tempDiv', '', 'Adjust '+devName+' Scale');

    //fix dimensions
    var width = 0.35*window.innerWidth;
    $('#dialogHeader').width(width)

    //center dialogue
    $('#tempDiv').css('left', ($('#waffleplate').width()/2 - width/2))

    //insert form fields
    insertDOM('form', 'dialogueValues', '', '', 'tempDiv', '', '');
    for(i=0; i<scales.length; i++){
        insertDOM('p', 'title'+i, '', 'font-size:16px; margin-top:3%;', 'dialogueValues', '', scales[i][0]+'<br>');
        insertDOM('p', 'minlabel'+i, '', 'display:inline;', 'dialogueValues', '', 'Minimum: ');
        insertDOM('input', 'minfield'+i, '', 'display:inline;', 'dialogueValues', '', '', 'textbox', 'number', scales[i][1]);
        document.getElementById('minfield'+i).setAttribute('size', 6);
        insertDOM('p', 'minunit'+i, '', 'display:inline; margin-right:3%', 'dialogueValues', '', scales[i][3]);
        insertDOM('p', 'maxlabel'+i, '', 'display:inline', 'dialogueValues', '', 'Maximum: ');
        insertDOM('input', 'maxfield'+i, '', 'display:inline;', 'dialogueValues', '', '', 'textbox', 'number', scales[i][2])
        document.getElementById('maxfield'+i).setAttribute('size', 6);
        insertDOM('p', 'maxunit'+i, '', 'display:inline;', 'dialogueValues', '', scales[i][3] + '<br>');
        //don't allow min > max:
        document.getElementById('minfield'+i).onchange = function(){document.getElementById('maxfield'+this.id[8]).min = document.getElementById(this.id).valueAsNumber;};

    }

    //insert color scale picker:
    if(currentColorScale){
        insertDOM('p', 'colorPickerLabel', '', 'display:inline', 'dialogueValues', '', '<br><br>Palette: ');
        var colorScales = window.parameters.colorScale;
        insertDOM('select', 'colorOptions', '', '', 'dialogueValues', '', '');
        var colorDD = document.getElementById('colorOptions');
        var option = [];
        for(i=0; i<colorScales.length; i++){
            option[i] = document.createElement('option');
            option[i].text = colorScales[i];
            option[i].value = colorScales[i];
            colorDD.add(option[i], null);
        }
        colorDD.value = currentColorScale;
        insertDOM('br', 'break', '', '', 'dialogueValues', '', '');
    }

    //insert scale linear / log choice:
    insertDOM('p', 'scalePickerLabel', '', 'display:inline; margin-right:2%', 'dialogueValues', '', '<br><br>Scale: ');
    insertDOM('p', 'linearRadioLabel', '', 'display:inline', 'dialogueValues', '', 'Linear');
    insertDOM('input', 'linearRadio', '', 'display:inline; margin-right:2%;', 'dialogueValues', '', '', 'scaleSwitch', 'radio', 'linear');
    insertDOM('p', 'logRadioLabel', '', 'display:inline;', 'dialogueValues', '', 'Log');
    insertDOM('input', 'logRadio', '', 'display:inline;', 'dialogueValues', '', '', 'scaleSwitch', 'radio', 'log');
    insertDOM('br', 'break', '', '', 'dialogueValues', '', '');
    if (window.parameters.detectorLogMode[window.viewState] == 1) document.getElementById('logRadio').checked = true;
    else document.getElementById('linearRadio').checked = true;

    //insert submit button
    insertDOM('input', 'updateParameters', 'bigButton', 'width:20%; margin-right:2%; margin-top:6%', 'dialogueValues', '', '', '', 'button', 'Commit')
    insertDOM('input', 'dismiss', 'bigButton', 'width:20%; margin-top:6%; margin-bottom:6%;', 'dialogueValues', '', '', '', 'button', 'Dismiss')

    document.getElementById('updateParameters').onclick = function(event){
        var i;
        if(document.getElementById('dialogueValues').checkValidity()){
            
            for(i=0; i<scales.length; i++){
                //commit
                scales[i][1] = parseFloat(document.getElementById('minfield'+i).value);
                scales[i][2] = parseFloat(document.getElementById('maxfield'+i).value);
                ODBSet(scales[i][4], scales[i][1]);
                ODBSet(scales[i][5], scales[i][2]);
                //fetchCustomParameters(); //pushes back to the parameter store
            }
            fetchCustomParameters(); //pushes back to the parameter store

            if(currentColorScale){
                if(window.onDisplay.slice(0,3) == 'DAQ'){
                    window.DAQpointer.DAQcolor = window.parameters.colorScale.indexOf(colorDD.value);
                } else {
                    window.parameters.subdetectorColors[window.state.subdetectorView] = colorDD.value;
                }
            }

            if(document.getElementById('logRadio').checked) window.parameters.detectorLogMode[window.viewState] = 1;
            else if(document.getElementById('linearRadio').checked) window.parameters.detectorLogMode[window.viewState] = 0;
            
            //remove dialogue
            document.getElementById('tempDiv').style.opacity = 0;
            setTimeout(function(){
                var element = document.getElementById('tempDiv');
                element.parentNode.removeChild(element);            
            }, 500);

            rePaint();

        } else{
            alert("Something doesn't make sense.  Check fields for mistakes, highlighted in red.");
        }
    }

    document.getElementById('dismiss').onclick = function(event){
        document.getElementById('tempDiv').style.opacity = 0;
        setTimeout(function(){
            var element = document.getElementById('tempDiv');
            element.parentNode.removeChild(element);            
        }, 500);
    }

    //fade the div in:
    dialogue.style.opacity = 1
}

//help build the ODB path string for the above parameter dialogue:
function scaleType(){
    if (window.state.subdetectorView == 0) return 'HVscale';
    else if (window.state.subdetectorView == 1 || window.state.subdetectorView == 3) return 'thresholdScale';
    else if (window.state.subdetectorView == 2 || window.state.subdetectorView == 4) return 'rateScale';    
}

//Crockford's prototype magics:
function DCobject(o) {
    function F() {}
    F.prototype = o;
    return new F();
}


//return the biggest font size that fits a string into a given length in a given context:
function fitFont(context, string, length){
    var i, size = 1;
    context.font = size+'px Raleway';
    
    while(context.measureText(string).width < length){
        size++;
        context.font = size+'px Raleway';
    }
    
    return size-1;
}

//get the <tag> elements inside a given <parent> (for stripping the head out of the imported status page, since those objects currently have no id's :/ )
function getTag(tag, parentID){
    parent = document.getElementById(parentID);
    var descendants = parent.getElementsByTagName(tag);
    if ( descendants.length )
        return descendants;
    return null;
}

//generate a fake JSONP scalar post to use for offline development:
function fakeScalars(){
    
    var JSONP = {'scalar' : {} },
        key, subKey;


    for(key in window.parameters.deployment){
        if(window.parameters.deployment[key]){            
            for(subKey in window[key+'pointer'].dataBus[key]){
                JSONP.scalar[subKey] = {"TRIGREQ" : Math.random()};
            }
        }
    }

    return JSONP;
    
}
//like fake scalars, but now thresholds:
function fakeThresholds(){

    var JSONP = {'parameters' : {'thresholds' : {} } },
        key, subKey;

    for(key in window.parameters.deployment){
        if(window.parameters.deployment[key]){
            for(subKey in window[key+'pointer'].dataBus[key]){
                JSONP.parameters.thresholds[subKey] = Math.random();
            }
        }
    }

    return JSONP;

}

//take a standard object from datastructures and a frame, and determine the appropriate fill color:
function frameColor(obj, frame, nFrames){
    var oldKey, newKey;

    //pick the right keys
    if(window.state.subdetectorView == 0){
        if(obj.HV == 0xDEADBEEF) return 0xDEADBEEF;
        oldKey = 'oldHVcolor';
        newKey = 'HVcolor';
    } else if(window.state.subdetectorView == 1){
        if(obj.threshold == 0xDEADBEEF) return 0xDEADBEEF;
        oldKey = 'oldThresholdColor';
        newKey = 'thresholdColor';
    } else if(window.state.subdetectorView == 2){
        if(obj.rate == 0xDEADBEEF) return 0xDEADBEEF;
        oldKey = 'oldRateColor';
        newKey = 'rateColor';
    }

    return interpolateColor(parseHexColor(obj[oldKey]), parseHexColor(obj[newKey]), frame/nFrames);

}

//make a table for a tooltip using <objects> as rows and <keys> as columns, where the objects are keys of <data>, and insert it into DOM element <id>.  
//[split] indicates how many elements to put in each supercolumn:
function TTtable(id, data, objects, keys, tableTitle, titles, split){
    var i, j, k, n, nContentRows, cellContent;

    insertDOM('table', id + 'table', 'TTtab', 'border-collapse:collapse;', id, '', '');
    insertDOM('colgroup', id+'colgroup', '', '', id+'table');
    for(i=0; i<split.length-1; i++){
        insertDOM('col', id+'colSpace'+i, '', '', id+'colgroup');
        document.getElementById(id+'colSpace'+i).setAttribute('span', keys.length+1)        
        insertDOM('col', id+'col'+i, '', 'border-left:1px solid white;', id+'colgroup');
        document.getElementById(id+'col'+i).setAttribute('span', '1')
    }


    if(tableTitle != ''){
        insertDOM('tr', id+'tableTitleRow', '', '', id+'table', '', '');
        insertDOM('td', id+'tableTitle', '', '', id+'tableTitleRow', '', tableTitle);
        document.getElementById(id+'tableTitle'). setAttribute('colspan', (1+keys.length)*split.length)
    }

    insertDOM('tr', id+'tableHeaderRow', '', '', id+'table', '', '');
    for(k=0; k<split.length; k++){
        //insertDOM('td', 'spacerCell'+k, '', '', id+'tableHeaderRow','','');  
        for(j=0; j<titles.length; j++){
            insertDOM('td', id+'headerCell'+j+'col'+k, '', 'padding-left:'+( (j==0 && k!=0) ? 25:10 )+'px; padding-right:'+( (j==titles.length-1) ? 25:10 )+'px;', id+'tableHeaderRow','',titles[j]);    
        }
    }
    
    nContentRows = Math.max.apply(null, split);

    //build table:
    for(i=0; i<nContentRows; i++){
        //rows
        insertDOM('tr', id+'row'+i, '', '', id+'table', '', '');
        //cells
        for(j=0; j<titles.length*split.length; j++){
            insertDOM('td', id+'row'+i+'cell'+j, '', 'padding:0px; padding-right:'+( (j%(titles.length+1)==0 && j!=0) ? 25:10 )+'px; padding-left:'+( (j%titles.length == 0 && j!=0) ? 25:10 )+'px', id+'row'+i, '', '' );
            //if(j%(keys.length+1)==keys.length && j!=titles.length*split.length-1 ){
            //    document.getElementById(id+'row'+i+'cell'+j).setAttribute('style', 'border-right:1px solid white');
            //}
        }
    }

    //fill table:
    n=0;
    for(i=0; i<split.length; i++){
        for(j=0; j<split[i]; j++){
            document.getElementById(id+'row'+j+'cell'+(titles.length*i)).innerHTML = objects[n];
            for(k=0; k<keys.length; k++){
                if(typeof data[objects[n]][keys[k]] == 'string')
                    cellContent = data[objects[n]][keys[k]];
                else 
                    cellContent = data[objects[n]][keys[k]].toFixed(window.parameters.tooltipPrecision)
                if(cellContent == 0xDEADBEEF) cellContent = '0xDEADBEEF'
                document.getElementById(id+'row'+j+'cell'+(1+titles.length*i+k)).innerHTML = cellContent;
            }
            n++;
        }
    }

}

//return an array with the appropriate colors chosen from <dataStore> (typically dataBus[this.name] for detectors) corresponding to the elements listed in [elements]
function colors(elements, dataStore, frame, nFrames){
    var i,
        colors=[];

    if(Array.isArray(elements)){
        for(i=0; i<elements.length; i++){
            colors[i] = viewMap(elements[i], dataStore, frame, nFrames);
        }
    } else {
        colors = viewMap(elements, dataStore, frame, nFrames);
    }

    function viewMap(elements, dataStore, frame, nFrames){
        if(window.state.subdetectorView == 0) return interpolateColor(parseHexColor(dataStore[elements].oldHVcolor), parseHexColor(dataStore[elements].HVcolor), frame/nFrames);
        else if(window.state.subdetectorView == 1 || window.state.subdetectorView == 3) return interpolateColor(parseHexColor(dataStore[elements].oldThresholdColor), parseHexColor(dataStore[elements].thresholdColor), frame/nFrames);
        else if(window.state.subdetectorView == 2 || window.state.subdetectorView == 4) return interpolateColor(parseHexColor(dataStore[elements].oldRateColor), parseHexColor(dataStore[elements].rateColor), frame/nFrames);        
    }

    return colors;
}








//trigger css transition on opacity to fade element out, then send it to bottom of stack on completion:
function fadeOut(elementID){
	//set element to come off top of stack once it's faded out:
	document.getElementById(elementID).addEventListener('transitionend', function(){
			if( $('#'+elementID).css('opacity')==0 )
	            $('#'+elementID).css('z-index', 0);    
    });

    //fade the element out:
    $('#'+elementID).css('opacity', 0);
}

function fadeIn(elementID){
	$('#'+elementID).css('z-index', 1);
	$('#'+elementID).css('opacity', 1);
	//window.onDisplay = canvasID;
}

//swap two canvases, for use in subdetector view transitions:
function swapFade(buttonID, object, leaveOff){
	var i;
	//parse which view is requested, and fetch the corresponding canvas ID to bring to the front:
	var inbound = object.view();

	//introduce TAC display buttons as needed (currently only for DANTE):
	if(buttonID == 'DANTElink'){
		document.getElementById('subsystemTAC-Thresholds').style.display = 'inline';
		document.getElementById('subsystemTAC-Rate').style.display = 'inline';
	} else {
		document.getElementById('subsystemTAC-Thresholds').style.display = 'none';
		document.getElementById('subsystemTAC-Rate').style.display = 'none';
		if(window.state.subdetectorView > 2)
			document.getElementById('subsystemRate').onclick();
	}

	//turn off other buttons, except for some at the end:
	for(i=0; i<document.getElementById(object.linkWrapperID).children.length - leaveOff; i++){
		if(document.getElementById(object.linkWrapperID).children[i].type == 'button')
			document.getElementById(object.linkWrapperID).children[i].setAttribute('class', 'navLink');
	}
	//highlight this button:
	if(buttonID != null) document.getElementById(buttonID).setAttribute('class','navLinkDown');
	//make sure the top level nav button navigates back to this config if user leaves & returns:
	document.getElementById(object.topNavID).setAttribute('onclick', "javascript:swapView('"+object.linkWrapperID+"', '"+inbound+"', '"+object.sidebarID+"', '"+object.topNavID+"')");

	if(inbound != window.onDisplay){
		fadeIn(inbound);
		fadeOut(window.onDisplay);
		window.onDisplay = inbound;
	}
}

//swap what values are being presented in the subsystem view:
function swapSubsystemView(buttonID, navWrapperID, viewIndex){
	var i;

	//turn off the other view options:
	for(i=document.getElementById(navWrapperID).children.length - window.subsystemScalars; i<document.getElementById(navWrapperID).children.length; i++){
		if(document.getElementById(navWrapperID).children[i].type == 'button')
			document.getElementById(navWrapperID).children[i].setAttribute('class', 'navLink');
	}
	//highlight this button:
	document.getElementById(buttonID).setAttribute('class','navLinkDown');

	//change the corresponding state variable:
	window.state.subdetectorView = viewIndex;

	//imediately update the display:
	rePaint();
}

//swap top level views
function swapView(inboundNav, inboundCanvas, inboundSidebar, buttonID){

	if(inboundNav != window.navOnDisplay){

		fadeIn(inboundCanvas, 0);
		fadeOut(window.onDisplay, 0);
		window.onDisplay = inboundCanvas;

		fadeIn(inboundNav);
		fadeOut(window.navOnDisplay);
		window.navOnDisplay = inboundNav;

		fadeIn(inboundSidebar);
		fadeOut(window.sidebarOnDisplay);
		window.sidebarOnDisplay = inboundSidebar;

		document.getElementById(window.viewState).setAttribute('class', 'navLink');
		document.getElementById(buttonID).setAttribute('class', 'navLinkDown');		
		window.viewState = buttonID;


	    //move local title around:
	   	var context = document.getElementById(inboundCanvas).getContext('2d');
    	context.font = '24px Raleway'
    	var title = document.getElementById(inboundNav+'Banner').innerHTML;
    	$('#youAreHere').css('width', context.measureText(title).width*1.1);
    	$('#youAreHere').css('left', renderWidth - 50 - context.measureText(title).width);
		document.getElementById('youAreHere').innerHTML = title;

	}
}
/* Zepto v1.0rc1 - polyfill zepto event detect fx ajax form touch - zeptojs.com/license */
(function(a){String.prototype.trim===a&&(String.prototype.trim=function(){return this.replace(/^\s+/,"").replace(/\s+$/,"")}),Array.prototype.reduce===a&&(Array.prototype.reduce=function(b){if(this===void 0||this===null)throw new TypeError;var c=Object(this),d=c.length>>>0,e=0,f;if(typeof b!="function")throw new TypeError;if(d==0&&arguments.length==1)throw new TypeError;if(arguments.length>=2)f=arguments[1];else do{if(e in c){f=c[e++];break}if(++e>=d)throw new TypeError}while(!0);while(e<d)e in c&&(f=b.call(a,f,c[e],e,c)),e++;return f})})();var Zepto=function(){function A(a){return v.call(a)=="[object Function]"}function B(a){return a instanceof Object}function C(b){var c,d;if(v.call(b)!=="[object Object]")return!1;d=A(b.constructor)&&b.constructor.prototype;if(!d||!hasOwnProperty.call(d,"isPrototypeOf"))return!1;for(c in b);return c===a||hasOwnProperty.call(b,c)}function D(a){return a instanceof Array}function E(a){return typeof a.length=="number"}function F(b){return b.filter(function(b){return b!==a&&b!==null})}function G(a){return a.length>0?[].concat.apply([],a):a}function H(a){return a.replace(/::/g,"/").replace(/([A-Z]+)([A-Z][a-z])/g,"$1_$2").replace(/([a-z\d])([A-Z])/g,"$1_$2").replace(/_/g,"-").toLowerCase()}function I(a){return a in i?i[a]:i[a]=new RegExp("(^|\\s)"+a+"(\\s|$)")}function J(a,b){return typeof b=="number"&&!k[H(a)]?b+"px":b}function K(a){var b,c;return h[a]||(b=g.createElement(a),g.body.appendChild(b),c=j(b,"").getPropertyValue("display"),b.parentNode.removeChild(b),c=="none"&&(c="block"),h[a]=c),h[a]}function L(b,d){return d===a?c(b):c(b).filter(d)}function M(a,b,c,d){return A(b)?b.call(a,c,d):b}function N(a,b,d){var e=a%2?b:b.parentNode;e?e.insertBefore(d,a?a==1?e.firstChild:a==2?b:null:b.nextSibling):c(d).remove()}function O(a,b){b(a);for(var c in a.childNodes)O(a.childNodes[c],b)}var a,b,c,d,e=[],f=e.slice,g=window.document,h={},i={},j=g.defaultView.getComputedStyle,k={"column-count":1,columns:1,"font-weight":1,"line-height":1,opacity:1,"z-index":1,zoom:1},l=/^\s*<(\w+|!)[^>]*>/,m=[1,3,8,9,11],n=["after","prepend","before","append"],o=g.createElement("table"),p=g.createElement("tr"),q={tr:g.createElement("tbody"),tbody:o,thead:o,tfoot:o,td:p,th:p,"*":g.createElement("div")},r=/complete|loaded|interactive/,s=/^\.([\w-]+)$/,t=/^#([\w-]+)$/,u=/^[\w-]+$/,v={}.toString,w={},x,y,z=g.createElement("div");return w.matches=function(a,b){if(!a||a.nodeType!==1)return!1;var c=a.webkitMatchesSelector||a.mozMatchesSelector||a.oMatchesSelector||a.matchesSelector;if(c)return c.call(a,b);var d,e=a.parentNode,f=!e;return f&&(e=z).appendChild(a),d=~w.qsa(e,b).indexOf(a),f&&z.removeChild(a),d},x=function(a){return a.replace(/-+(.)?/g,function(a,b){return b?b.toUpperCase():""})},y=function(a){return a.filter(function(b,c){return a.indexOf(b)==c})},w.fragment=function(b,d){d===a&&(d=l.test(b)&&RegExp.$1),d in q||(d="*");var e=q[d];return e.innerHTML=""+b,c.each(f.call(e.childNodes),function(){e.removeChild(this)})},w.Z=function(a,b){return a=a||[],a.__proto__=arguments.callee.prototype,a.selector=b||"",a},w.isZ=function(a){return a instanceof w.Z},w.init=function(b,d){if(!b)return w.Z();if(A(b))return c(g).ready(b);if(w.isZ(b))return b;var e;if(D(b))e=F(b);else if(C(b))e=[c.extend({},b)],b=null;else if(m.indexOf(b.nodeType)>=0||b===window)e=[b],b=null;else if(l.test(b))e=w.fragment(b.trim(),RegExp.$1),b=null;else{if(d!==a)return c(d).find(b);e=w.qsa(g,b)}return w.Z(e,b)},c=function(a,b){return w.init(a,b)},c.extend=function(c){return f.call(arguments,1).forEach(function(d){for(b in d)d[b]!==a&&(c[b]=d[b])}),c},w.qsa=function(a,b){var c;return a===g&&t.test(b)?(c=a.getElementById(RegExp.$1))?[c]:e:a.nodeType!==1&&a.nodeType!==9?e:f.call(s.test(b)?a.getElementsByClassName(RegExp.$1):u.test(b)?a.getElementsByTagName(b):a.querySelectorAll(b))},c.isFunction=A,c.isObject=B,c.isArray=D,c.isPlainObject=C,c.inArray=function(a,b,c){return e.indexOf.call(b,a,c)},c.trim=function(a){return a.trim()},c.uuid=0,c.map=function(a,b){var c,d=[],e,f;if(E(a))for(e=0;e<a.length;e++)c=b(a[e],e),c!=null&&d.push(c);else for(f in a)c=b(a[f],f),c!=null&&d.push(c);return G(d)},c.each=function(a,b){var c,d;if(E(a)){for(c=0;c<a.length;c++)if(b.call(a[c],c,a[c])===!1)return a}else for(d in a)if(b.call(a[d],d,a[d])===!1)return a;return a},c.fn={forEach:e.forEach,reduce:e.reduce,push:e.push,indexOf:e.indexOf,concat:e.concat,map:function(a){return c.map(this,function(b,c){return a.call(b,c,b)})},slice:function(){return c(f.apply(this,arguments))},ready:function(a){return r.test(g.readyState)?a(c):g.addEventListener("DOMContentLoaded",function(){a(c)},!1),this},get:function(b){return b===a?f.call(this):this[b]},toArray:function(){return this.get()},size:function(){return this.length},remove:function(){return this.each(function(){this.parentNode!=null&&this.parentNode.removeChild(this)})},each:function(a){return this.forEach(function(b,c){a.call(b,c,b)}),this},filter:function(a){return c([].filter.call(this,function(b){return w.matches(b,a)}))},add:function(a,b){return c(y(this.concat(c(a,b))))},is:function(a){return this.length>0&&w.matches(this[0],a)},not:function(b){var d=[];if(A(b)&&b.call!==a)this.each(function(a){b.call(this,a)||d.push(this)});else{var e=typeof b=="string"?this.filter(b):E(b)&&A(b.item)?f.call(b):c(b);this.forEach(function(a){e.indexOf(a)<0&&d.push(a)})}return c(d)},eq:function(a){return a===-1?this.slice(a):this.slice(a,+a+1)},first:function(){var a=this[0];return a&&!B(a)?a:c(a)},last:function(){var a=this[this.length-1];return a&&!B(a)?a:c(a)},find:function(a){var b;return this.length==1?b=w.qsa(this[0],a):b=this.map(function(){return w.qsa(this,a)}),c(b)},closest:function(a,b){var d=this[0];while(d&&!w.matches(d,a))d=d!==b&&d!==g&&d.parentNode;return c(d)},parents:function(a){var b=[],d=this;while(d.length>0)d=c.map(d,function(a){if((a=a.parentNode)&&a!==g&&b.indexOf(a)<0)return b.push(a),a});return L(b,a)},parent:function(a){return L(y(this.pluck("parentNode")),a)},children:function(a){return L(this.map(function(){return f.call(this.children)}),a)},siblings:function(a){return L(this.map(function(a,b){return f.call(b.parentNode.children).filter(function(a){return a!==b})}),a)},empty:function(){return this.each(function(){this.innerHTML=""})},pluck:function(a){return this.map(function(){return this[a]})},show:function(){return this.each(function(){this.style.display=="none"&&(this.style.display=null),j(this,"").getPropertyValue("display")=="none"&&(this.style.display=K(this.nodeName))})},replaceWith:function(a){return this.before(a).remove()},wrap:function(a){return this.each(function(){c(this).wrapAll(c(a)[0].cloneNode(!1))})},wrapAll:function(a){return this[0]&&(c(this[0]).before(a=c(a)),a.append(this)),this},unwrap:function(){return this.parent().each(function(){c(this).replaceWith(c(this).children())}),this},clone:function(){return c(this.map(function(){return this.cloneNode(!0)}))},hide:function(){return this.css("display","none")},toggle:function(b){return(b===a?this.css("display")=="none":b)?this.show():this.hide()},prev:function(){return c(this.pluck("previousElementSibling"))},next:function(){return c(this.pluck("nextElementSibling"))},html:function(b){return b===a?this.length>0?this[0].innerHTML:null:this.each(function(a){var d=this.innerHTML;c(this).empty().append(M(this,b,a,d))})},text:function(b){return b===a?this.length>0?this[0].textContent:null:this.each(function(){this.textContent=b})},attr:function(c,d){var e;return typeof c=="string"&&d===a?this.length==0||this[0].nodeType!==1?a:c=="value"&&this[0].nodeName=="INPUT"?this.val():!(e=this[0].getAttribute(c))&&c in this[0]?this[0][c]:e:this.each(function(a){if(this.nodeType!==1)return;if(B(c))for(b in c)this.setAttribute(b,c[b]);else this.setAttribute(c,M(this,d,a,this.getAttribute(c)))})},removeAttr:function(a){return this.each(function(){this.nodeType===1&&this.removeAttribute(a)})},prop:function(b,c){return c===a?this[0]?this[0][b]:a:this.each(function(a){this[b]=M(this,c,a,this[b])})},data:function(b,c){var d=this.attr("data-"+H(b),c);return d!==null?d:a},val:function(b){return b===a?this.length>0?this[0].value:a:this.each(function(a){this.value=M(this,b,a,this.value)})},offset:function(){if(this.length==0)return null;var a=this[0].getBoundingClientRect();return{left:a.left+window.pageXOffset,top:a.top+window.pageYOffset,width:a.width,height:a.height}},css:function(c,d){if(d===a&&typeof c=="string")return this.length==0?a:this[0].style[x(c)]||j(this[0],"").getPropertyValue(c);var e="";for(b in c)typeof c[b]=="string"&&c[b]==""?this.each(function(){this.style.removeProperty(H(b))}):e+=H(b)+":"+J(b,c[b])+";";return typeof c=="string"&&(d==""?this.each(function(){this.style.removeProperty(H(c))}):e=H(c)+":"+J(c,d)),this.each(function(){this.style.cssText+=";"+e})},index:function(a){return a?this.indexOf(c(a)[0]):this.parent().children().indexOf(this[0])},hasClass:function(a){return this.length<1?!1:I(a).test(this[0].className)},addClass:function(a){return this.each(function(b){d=[];var e=this.className,f=M(this,a,b,e);f.split(/\s+/g).forEach(function(a){c(this).hasClass(a)||d.push(a)},this),d.length&&(this.className+=(e?" ":"")+d.join(" "))})},removeClass:function(b){return this.each(function(c){if(b===a)return this.className="";d=this.className,M(this,b,c,d).split(/\s+/g).forEach(function(a){d=d.replace(I(a)," ")}),this.className=d.trim()})},toggleClass:function(b,d){return this.each(function(e){var f=M(this,b,e,this.className);(d===a?!c(this).hasClass(f):d)?c(this).addClass(f):c(this).removeClass(f)})}},["width","height"].forEach(function(b){c.fn[b]=function(d){var e,f=b.replace(/./,function(a){return a[0].toUpperCase()});return d===a?this[0]==window?window["inner"+f]:this[0]==g?g.documentElement["offset"+f]:(e=this.offset())&&e[b]:this.each(function(a){var e=c(this);e.css(b,M(this,d,a,e[b]()))})}}),n.forEach(function(a,b){c.fn[a]=function(){var a=c.map(arguments,function(a){return B(a)?a:w.fragment(a)});if(a.length<1)return this;var d=this.length,e=d>1,f=b<2;return this.each(function(c,g){for(var h=0;h<a.length;h++){var i=a[f?a.length-h-1:h];O(i,function(a){a.nodeName!=null&&a.nodeName.toUpperCase()==="SCRIPT"&&(!a.type||a.type==="text/javascript")&&window.eval.call(window,a.innerHTML)}),e&&c<d-1&&(i=i.cloneNode(!0)),N(b,g,i)}})},c.fn[b%2?a+"To":"insert"+(b?"Before":"After")]=function(b){return c(b)[a](this),this}}),w.Z.prototype=c.fn,w.camelize=x,w.uniq=y,c.zepto=w,c}();window.Zepto=Zepto,"$"in window||(window.$=Zepto),function(a){function f(a){return a._zid||(a._zid=d++)}function g(a,b,d,e){b=h(b);if(b.ns)var g=i(b.ns);return(c[f(a)]||[]).filter(function(a){return a&&(!b.e||a.e==b.e)&&(!b.ns||g.test(a.ns))&&(!d||f(a.fn)===f(d))&&(!e||a.sel==e)})}function h(a){var b=(""+a).split(".");return{e:b[0],ns:b.slice(1).sort().join(" ")}}function i(a){return new RegExp("(?:^| )"+a.replace(" "," .* ?")+"(?: |$)")}function j(b,c,d){a.isObject(b)?a.each(b,d):b.split(/\s/).forEach(function(a){d(a,c)})}function k(b,d,e,g,i,k){k=!!k;var l=f(b),m=c[l]||(c[l]=[]);j(d,e,function(c,d){var e=i&&i(d,c),f=e||d,j=function(a){var c=f.apply(b,[a].concat(a.data));return c===!1&&a.preventDefault(),c},l=a.extend(h(c),{fn:d,proxy:j,sel:g,del:e,i:m.length});m.push(l),b.addEventListener(l.e,j,k)})}function l(a,b,d,e){var h=f(a);j(b||"",d,function(b,d){g(a,b,d,e).forEach(function(b){delete c[h][b.i],a.removeEventListener(b.e,b.proxy,!1)})})}function p(b){var c=a.extend({originalEvent:b},b);return a.each(o,function(a,d){c[a]=function(){return this[d]=m,b[a].apply(b,arguments)},c[d]=n}),c}function q(a){if(!("defaultPrevented"in a)){a.defaultPrevented=!1;var b=a.preventDefault;a.preventDefault=function(){this.defaultPrevented=!0,b.call(this)}}}var b=a.zepto.qsa,c={},d=1,e={};e.click=e.mousedown=e.mouseup=e.mousemove="MouseEvents",a.event={add:k,remove:l},a.proxy=function(b,c){if(a.isFunction(b)){var d=function(){return b.apply(c,arguments)};return d._zid=f(b),d}if(typeof c=="string")return a.proxy(b[c],b);throw new TypeError("expected function")},a.fn.bind=function(a,b){return this.each(function(){k(this,a,b)})},a.fn.unbind=function(a,b){return this.each(function(){l(this,a,b)})},a.fn.one=function(a,b){return this.each(function(c,d){k(this,a,b,null,function(a,b){return function(){var c=a.apply(d,arguments);return l(d,b,a),c}})})};var m=function(){return!0},n=function(){return!1},o={preventDefault:"isDefaultPrevented",stopImmediatePropagation:"isImmediatePropagationStopped",stopPropagation:"isPropagationStopped"};a.fn.delegate=function(b,c,d){var e=!1;if(c=="blur"||c=="focus")a.iswebkit?c=c=="blur"?"focusout":c=="focus"?"focusin":c:e=!0;return this.each(function(f,g){k(g,c,d,b,function(c){return function(d){var e,f=a(d.target).closest(b,g).get(0);if(f)return e=a.extend(p(d),{currentTarget:f,liveFired:g}),c.apply(f,[e].concat([].slice.call(arguments,1)))}},e)})},a.fn.undelegate=function(a,b,c){return this.each(function(){l(this,b,c,a)})},a.fn.live=function(b,c){return a(document.body).delegate(this.selector,b,c),this},a.fn.die=function(b,c){return a(document.body).undelegate(this.selector,b,c),this},a.fn.on=function(b,c,d){return c==undefined||a.isFunction(c)?this.bind(b,c):this.delegate(c,b,d)},a.fn.off=function(b,c,d){return c==undefined||a.isFunction(c)?this.unbind(b,c):this.undelegate(c,b,d)},a.fn.trigger=function(b,c){return typeof b=="string"&&(b=a.Event(b)),q(b),b.data=c,this.each(function(){"dispatchEvent"in this&&this.dispatchEvent(b)})},a.fn.triggerHandler=function(b,c){var d,e;return this.each(function(f,h){d=p(typeof b=="string"?a.Event(b):b),d.data=c,d.target=h,a.each(g(h,b.type||b),function(a,b){e=b.proxy(d);if(d.isImmediatePropagationStopped())return!1})}),e},"focusin focusout load resize scroll unload click dblclick mousedown mouseup mousemove mouseover mouseout change select keydown keypress keyup error".split(" ").forEach(function(b){a.fn[b]=function(a){return this.bind(b,a)}}),["focus","blur"].forEach(function(b){a.fn[b]=function(a){if(a)this.bind(b,a);else if(this.length)try{this.get(0)[b]()}catch(c){}return this}}),a.Event=function(a,b){var c=document.createEvent(e[a]||"Events"),d=!0;if(b)for(var f in b)f=="bubbles"?d=!!b[f]:c[f]=b[f];return c.initEvent(a,d,!0,null,null,null,null,null,null,null,null,null,null,null,null),c}}(Zepto),function(a){function b(a){var b=this.os={},c=this.browser={},d=a.match(/WebKit\/([\d.]+)/),e=a.match(/(Android)\s+([\d.]+)/),f=a.match(/(iPad).*OS\s([\d_]+)/),g=!f&&a.match(/(iPhone\sOS)\s([\d_]+)/),h=a.match(/(webOS|hpwOS)[\s\/]([\d.]+)/),i=h&&a.match(/TouchPad/),j=a.match(/Kindle\/([\d.]+)/),k=a.match(/Silk\/([\d._]+)/),l=a.match(/(BlackBerry).*Version\/([\d.]+)/);if(c.webkit=!!d)c.version=d[1];e&&(b.android=!0,b.version=e[2]),g&&(b.ios=b.iphone=!0,b.version=g[2].replace(/_/g,".")),f&&(b.ios=b.ipad=!0,b.version=f[2].replace(/_/g,".")),h&&(b.webos=!0,b.version=h[2]),i&&(b.touchpad=!0),l&&(b.blackberry=!0,b.version=l[2]),j&&(b.kindle=!0,b.version=j[1]),k&&(c.silk=!0,c.version=k[1]),!k&&b.android&&a.match(/Kindle Fire/)&&(c.silk=!0)}b.call(a,navigator.userAgent),a.__detect=b}(Zepto),function(a,b){function l(a){return a.toLowerCase()}function m(a){return d?d+a:l(a)}var c="",d,e,f,g={Webkit:"webkit",Moz:"",O:"o",ms:"MS"},h=window.document,i=h.createElement("div"),j=/^((translate|rotate|scale)(X|Y|Z|3d)?|matrix(3d)?|perspective|skew(X|Y)?)$/i,k={};a.each(g,function(a,e){if(i.style[a+"TransitionProperty"]!==b)return c="-"+l(a)+"-",d=e,!1}),k[c+"transition-property"]=k[c+"transition-duration"]=k[c+"transition-timing-function"]=k[c+"animation-name"]=k[c+"animation-duration"]="",a.fx={off:d===b&&i.style.transitionProperty===b,cssPrefix:c,transitionEnd:m("TransitionEnd"),animationEnd:m("AnimationEnd")},a.fn.animate=function(b,c,d,e){return a.isObject(c)&&(d=c.easing,e=c.complete,c=c.duration),c&&(c/=1e3),this.anim(b,c,d,e)},a.fn.anim=function(d,e,f,g){var h,i={},l,m=this,n,o=a.fx.transitionEnd;e===b&&(e=.4),a.fx.off&&(e=0);if(typeof d=="string")i[c+"animation-name"]=d,i[c+"animation-duration"]=e+"s",o=a.fx.animationEnd;else{for(l in d)j.test(l)?(h||(h=[]),h.push(l+"("+d[l]+")")):i[l]=d[l];h&&(i[c+"transform"]=h.join(" ")),!a.fx.off&&typeof d=="object"&&(i[c+"transition-property"]=Object.keys(d).join(", "),i[c+"transition-duration"]=e+"s",i[c+"transition-timing-function"]=f||"linear")}return n=function(b){if(typeof b!="undefined"){if(b.target!==b.currentTarget)return;a(b.target).unbind(o,arguments.callee)}a(this).css(k),g&&g.call(this)},e>0&&this.bind(o,n),setTimeout(function(){m.css(i),e<=0&&setTimeout(function(){m.each(function(){n.call(this)})},0)},0),this},i=null}(Zepto),function($){function triggerAndReturn(a,b,c){var d=$.Event(b);return $(a).trigger(d,c),!d.defaultPrevented}function triggerGlobal(a,b,c,d){if(a.global)return triggerAndReturn(b||document,c,d)}function ajaxStart(a){a.global&&$.active++===0&&triggerGlobal(a,null,"ajaxStart")}function ajaxStop(a){a.global&&!--$.active&&triggerGlobal(a,null,"ajaxStop")}function ajaxBeforeSend(a,b){var c=b.context;if(b.beforeSend.call(c,a,b)===!1||triggerGlobal(b,c,"ajaxBeforeSend",[a,b])===!1)return!1;triggerGlobal(b,c,"ajaxSend",[a,b])}function ajaxSuccess(a,b,c){var d=c.context,e="success";c.success.call(d,a,e,b),triggerGlobal(c,d,"ajaxSuccess",[b,c,a]),ajaxComplete(e,b,c)}function ajaxError(a,b,c,d){var e=d.context;d.error.call(e,c,b,a),triggerGlobal(d,e,"ajaxError",[c,d,a]),ajaxComplete(b,c,d)}function ajaxComplete(a,b,c){var d=c.context;c.complete.call(d,b,a),triggerGlobal(c,d,"ajaxComplete",[b,c]),ajaxStop(c)}function empty(){}function mimeToDataType(a){return a&&(a==htmlType?"html":a==jsonType?"json":scriptTypeRE.test(a)?"script":xmlTypeRE.test(a)&&"xml")||"text"}function appendQuery(a,b){return(a+"&"+b).replace(/[&?]{1,2}/,"?")}function serializeData(a){isObject(a.data)&&(a.data=$.param(a.data)),a.data&&(!a.type||a.type.toUpperCase()=="GET")&&(a.url=appendQuery(a.url,a.data))}function serialize(a,b,c,d){var e=$.isArray(b);$.each(b,function(b,f){d&&(b=c?d:d+"["+(e?"":b)+"]"),!d&&e?a.add(f.name,f.value):(c?$.isArray(f):isObject(f))?serialize(a,f,c,b):a.add(b,f)})}var jsonpID=0,isObject=$.isObject,document=window.document,key,name,rscript=/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,scriptTypeRE=/^(?:text|application)\/javascript/i,xmlTypeRE=/^(?:text|application)\/xml/i,jsonType="application/json",htmlType="text/html",blankRE=/^\s*$/;$.active=0,$.ajaxJSONP=function(a){var b="jsonp"+ ++jsonpID,c=document.createElement("script"),d=function(){$(c).remove(),b in window&&(window[b]=empty),ajaxComplete("abort",e,a)},e={abort:d},f;return a.error&&(c.onerror=function(){e.abort(),a.error()}),window[b]=function(d){clearTimeout(f),$(c).remove(),delete window[b],ajaxSuccess(d,e,a)},serializeData(a),c.src=a.url.replace(/=\?/,"="+b),$("head").append(c),a.timeout>0&&(f=setTimeout(function(){e.abort(),ajaxComplete("timeout",e,a)},a.timeout)),e},$.ajaxSettings={type:"GET",beforeSend:empty,success:empty,error:empty,complete:empty,context:null,global:!0,xhr:function(){return new window.XMLHttpRequest},accepts:{script:"text/javascript, application/javascript",json:jsonType,xml:"application/xml, text/xml",html:htmlType,text:"text/plain"},crossDomain:!1,timeout:0},$.ajax=function(options){var settings=$.extend({},options||{});for(key in $.ajaxSettings)settings[key]===undefined&&(settings[key]=$.ajaxSettings[key]);ajaxStart(settings),settings.crossDomain||(settings.crossDomain=/^([\w-]+:)?\/\/([^\/]+)/.test(settings.url)&&RegExp.$2!=window.location.host);var dataType=settings.dataType,hasPlaceholder=/=\?/.test(settings.url);if(dataType=="jsonp"||hasPlaceholder)return hasPlaceholder||(settings.url=appendQuery(settings.url,"callback=?")),$.ajaxJSONP(settings);settings.url||(settings.url=window.location.toString()),serializeData(settings);var mime=settings.accepts[dataType],baseHeaders={},protocol=/^([\w-]+:)\/\//.test(settings.url)?RegExp.$1:window.location.protocol,xhr=$.ajaxSettings.xhr(),abortTimeout;settings.crossDomain||(baseHeaders["X-Requested-With"]="XMLHttpRequest"),mime&&(baseHeaders.Accept=mime,mime.indexOf(",")>-1&&(mime=mime.split(",",2)[0]),xhr.overrideMimeType&&xhr.overrideMimeType(mime));if(settings.contentType||settings.data&&settings.type.toUpperCase()!="GET")baseHeaders["Content-Type"]=settings.contentType||"application/x-www-form-urlencoded";settings.headers=$.extend(baseHeaders,settings.headers||{}),xhr.onreadystatechange=function(){if(xhr.readyState==4){clearTimeout(abortTimeout);var result,error=!1;if(xhr.status>=200&&xhr.status<300||xhr.status==304||xhr.status==0&&protocol=="file:"){dataType=dataType||mimeToDataType(xhr.getResponseHeader("content-type")),result=xhr.responseText;try{dataType=="script"?(1,eval)(result):dataType=="xml"?result=xhr.responseXML:dataType=="json"&&(result=blankRE.test(result)?null:JSON.parse(result))}catch(e){error=e}error?ajaxError(error,"parsererror",xhr,settings):ajaxSuccess(result,xhr,settings)}else ajaxError(null,"error",xhr,settings)}};var async="async"in settings?settings.async:!0;xhr.open(settings.type,settings.url,async);for(name in settings.headers)xhr.setRequestHeader(name,settings.headers[name]);return ajaxBeforeSend(xhr,settings)===!1?(xhr.abort(),!1):(settings.timeout>0&&(abortTimeout=setTimeout(function(){xhr.onreadystatechange=empty,xhr.abort(),ajaxError(null,"timeout",xhr,settings)},settings.timeout)),xhr.send(settings.data?settings.data:null),xhr)},$.get=function(a,b){return $.ajax({url:a,success:b})},$.post=function(a,b,c,d){return $.isFunction(b)&&(d=d||c,c=b,b=null),$.ajax({type:"POST",url:a,data:b,success:c,dataType:d})},$.getJSON=function(a,b){return $.ajax({url:a,success:b,dataType:"json"})},$.fn.load=function(a,b){if(!this.length)return this;var c=this,d=a.split(/\s/),e;return d.length>1&&(a=d[0],e=d[1]),$.get(a,function(a){c.html(e?$(document.createElement("div")).html(a.replace(rscript,"")).find(e).html():a),b&&b.call(c)}),this};var escape=encodeURIComponent;$.param=function(a,b){var c=[];return c.add=function(a,b){this.push(escape(a)+"="+escape(b))},serialize(c,a,b),c.join("&").replace("%20","+")}}(Zepto),function(a){a.fn.serializeArray=function(){var b=[],c;return a(Array.prototype.slice.call(this.get(0).elements)).each(function(){c=a(this);var d=c.attr("type");this.nodeName.toLowerCase()!="fieldset"&&!this.disabled&&d!="submit"&&d!="reset"&&d!="button"&&(d!="radio"&&d!="checkbox"||this.checked)&&b.push({name:c.attr("name"),value:c.val()})}),b},a.fn.serialize=function(){var a=[];return this.serializeArray().forEach(function(b){a.push(encodeURIComponent(b.name)+"="+encodeURIComponent(b.value))}),a.join("&")},a.fn.submit=function(b){if(b)this.bind("submit",b);else if(this.length){var c=a.Event("submit");this.eq(0).trigger(c),c.defaultPrevented||this.get(0).submit()}return this}}(Zepto),function(a){function d(a){return"tagName"in a?a:a.parentNode}function e(a,b,c,d){var e=Math.abs(a-b),f=Math.abs(c-d);return e>=f?a-b>0?"Left":"Right":c-d>0?"Up":"Down"}function h(){g=null,b.last&&(b.el.trigger("longTap"),b={})}function i(){g&&clearTimeout(g),g=null}var b={},c,f=750,g;a(document).ready(function(){var j,k;a(document.body).bind("touchstart",function(e){j=Date.now(),k=j-(b.last||j),b.el=a(d(e.touches[0].target)),c&&clearTimeout(c),b.x1=e.touches[0].pageX,b.y1=e.touches[0].pageY,k>0&&k<=250&&(b.isDoubleTap=!0),b.last=j,g=setTimeout(h,f)}).bind("touchmove",function(a){i(),b.x2=a.touches[0].pageX,b.y2=a.touches[0].pageY}).bind("touchend",function(a){i(),b.isDoubleTap?(b.el.trigger("doubleTap"),b={}):b.x2&&Math.abs(b.x1-b.x2)>30||b.y2&&Math.abs(b.y1-b.y2)>30?(b.el.trigger("swipe")&&b.el.trigger("swipe"+e(b.x1,b.x2,b.y1,b.y2)),b={}):"last"in b&&(b.el.trigger("tap"),c=setTimeout(function(){c=null,b.el.trigger("singleTap"),b={}},250))}).bind("touchcancel",function(){c&&clearTimeout(c),g&&clearTimeout(g),g=c=null,b={}})}),["swipe","swipeLeft","swipeRight","swipeUp","swipeDown","doubleTap","tap","singleTap","longTap"].forEach(function(b){a.fn[b]=function(a){return this.bind(b,a)}})}(Zepto);