function BarGraph(cvas, nBars, title, yAxisTitle, barTitles, scaleMin, scaleMax, masterWaffle){

	//bar chart levels:
	this.oldLevels = [];
	this.levels = [];

	//alarms:
	this.oldAlarms = [];
	this.alarms = [];

	//scale:
	this.scaleMin = scaleMin;
	this.scaleMax = scaleMax;

	//number of y-axis scale ticks:
	this.yAxisTicks = 6;

	//waffle canvas ID of which these meters are a subset:
	this.masterWaffle = masterWaffle;

	//chart title:
	this.title = title;

	//y-axis title:
	this.yAxisTitle = yAxisTitle;

	//color, [R,G,B,A]:
	this.oldColor = [255,0,0,1];
	this.color = [0,0,0,1];

    //fetch canvas:
    this.canvas = document.getElementById(cvas);
    this.context = this.canvas.getContext('2d');

    //canvas dimensions:
    this.width = masterWaffle.totalWidth;
    this.height = masterWaffle.waffleHeight;
    this.headerHeight = masterWaffle.headerHeight;
    $('#'+cvas).attr('width', this.width);
    $('#'+cvas).attr('height', this.height);
    $(document.getElementById(cvas)).css('top', this.headerHeight);

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
    	this.channelNames[i] = barTitles[i];
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
			this.context.fillStyle = this.colorGradient(i, frame);
			barHeight = this.oldLevels[i]*this.barMax + (this.levels[i] - this.oldLevels[i])*this.barMax*frame/this.nFrames;
			barTop = this.height - this.bottomMargin - barHeight;
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

        //alert(this.oldAlarms[0]);
        //alert(this.alarms[0]);

        //animate:
        animate(this, 0);

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

		var i = 0;

		//set label font:
		this.context.font=0.25*this.barWidth+"px 'Raleway'";

		//set text color:
		this.context.fillStyle = 'rgba(0,0,0,1)';

		//draw principle axes:
		this.context.beginPath();
		this.context.moveTo(this.width*0.9, this.height - this.bottomMargin);
		this.context.lineTo(this.width*0.1, this.height - this.bottomMargin);
		this.context.lineTo(this.width*0.1, this.topMargin);
		this.context.stroke();

		//draw x-axis labels:
		for(i=0; i<this.nBars; i++){
			this.context.save();
			this.context.translate(this.width*0.1+(i+0.5)*1.05*this.barWidth,this.height - 0.9*this.bottomMargin);
			this.context.rotate(-Math.PI/2.4);
			this.context.textAlign = 'right';
			this.context.fillText(this.channelNames[i], 0, 0);
			this.context.restore();
		}

		//draw y-axis ticks and labels:
		for(i=0; i<this.yAxisTicks; i++){
			this.context.beginPath();
			this.context.moveTo(this.width*0.1, this.height - this.bottomMargin - i*(this.height - this.topMargin - this.bottomMargin)/(this.yAxisTicks-1) );
			this.context.lineTo(this.width*0.1 - 10, this.height - this.bottomMargin - i*(this.height - this.topMargin - this.bottomMargin)/(this.yAxisTicks-1) );
			this.context.stroke();
			this.context.fillText( ((this.scaleMax-this.scaleMin)/(this.yAxisTicks-1)*i).toFixed(1),  this.width*0.1 - 10 - 20, this.height - this.bottomMargin - i*(this.height - this.topMargin - this.bottomMargin)/(this.yAxisTicks-1) + 5);
		}

		//draw y-axis title:
		this.context.font=0.4*this.barWidth+"px 'Raleway'";
		this.context.save();
		this.context.translate(this.width*0.05, this.topMargin + this.context.measureText(this.yAxisTitle).width);
		this.context.rotate(-Math.PI/2);
		this.context.fillText(this.yAxisTitle, 0, 0);
		this.context.restore();

		//draw chart title:
		this.context.font=0.7*this.barWidth+"px 'Raleway'";
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
		} else {
			this.oldColor = [255,0,0, Math.max(this.oldAlarms[index][0], this.oldAlarms[index][1], this.oldAlarms[index][2])*0.7 + 0.3];
		}

		if(this.alarms[index][0] == 0 && this.alarms[index][1] == 0 && this.alarms[index][2] == 0){
			this.color = [0,255,0,0.3];
		} else if(this.alarms[index][0] == -1){
			this.color = [0,0,0,0.3];
		} else if(this.alarms[index][0] == -2){
			this.color = [255,255,0,0.3];
		} else {
			this.color = [255,0,0, Math.max(this.alarms[index][0], this.alarms[index][1], this.alarms[index][2])*0.7 + 0.3];
		}

		R = this.oldColor[0] + (this.color[0] - this.oldColor[0])*frame/this.nFrames;
		G = this.oldColor[1] + (this.color[1] - this.oldColor[1])*frame/this.nFrames;
		B = this.oldColor[2] + (this.color[2] - this.oldColor[2])*frame/this.nFrames;
		A = this.oldColor[3] + (this.color[3] - this.oldColor[3])*frame/this.nFrames;

		return 'rgba('+R+', '+G+', '+B+', '+A+')'
	};

	//bring this bar graph into the limelight:
	this.wake = function(){

	};

	//dismiss this graph:
	this.sleep = function(){

	};

}