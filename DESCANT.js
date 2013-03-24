function DESCANT(){

	var i, j;

	this.monitorID = window.parameters.wrapper;		//div ID of wrapper div
	this.canvasID = 'DESCANTCanvas';		        //ID of canvas to draw DESCANT on
	this.TTcanvasID = 'DESCANTTTCanvas';	        //ID of hidden tooltip map canvas
	this.linkWrapperID = 'SubsystemLinks';	        //ID of div wrapping subsystem navigation links
	this.sidebarID = 'SubsystemSidebar';	        //ID of right sidebar for this object
	this.topNavID = 'SubsystemsButton';		        //ID of top level nav button
	this.minima = window.parameters.DESCANTminima;  //array of meter minima [HV, thresholds, rate]
	this.maxima = window.parameters.DESCANTmaxima;  //array of meter maxima, arranged as minima
    this.dataBus = new DESCANTDS();
    this.subviewLink = 'DESCANTlink';                   //ID of inter-subsystem nav button

	var that = this;
    //make a pointer at window level back to this object, so we can pass by reference to the nav button onclick
    window.DESCANTpointer = that;

    //establish animation parameters////////////////////////////////////////////////////////////////////
    this.FPS = 30;
    this.duration = 0.5;
    this.nFrames = this.FPS*this.duration;

    //insert nav link
    insertDOM('button', 'DESCANTlink', 'navLink', '', this.linkWrapperID, "javascript:swapFade('DESCANTlink', window.DESCANTpointer, window.subsystemScalars, window.subdetectorView)", 'DESCANT', '', 'button')

    //insert & scale canvas//////////////////////////////////////////////////////////////////////////////////////
	this.monitor = document.getElementById(this.monitorID);
    this.canvasWidth = 0.48*$(this.monitor).width();
    this.canvasHeight = 0.8*$(this.monitor).height();
    //detector view
    insertDOM('canvas', this.canvasID, 'monitor', 'top:' + ($('#SubsystemLinks').height()*1.25 + 5) +'px;', this.monitorID, '', '')
    this.canvas = document.getElementById(this.canvasID);
    this.context = this.canvas.getContext('2d');
    this.canvas.setAttribute('width', this.canvasWidth);
    this.canvas.setAttribute('height', this.canvasHeight);
    //hidden Tooltip map layer
    insertDOM('canvas', this.TTcanvasID, 'monitor', 'top:' + ($('#SubsystemLinks').height()*1.25 + 5) +'px;', this.monitorID, '', '')    
    this.TTcanvas = document.getElementById(this.TTcanvasID);
    this.TTcontext = this.TTcanvas.getContext('2d');
    this.TTcanvas.setAttribute('width', this.canvasWidth);
    this.TTcanvas.setAttribute('height', this.canvasHeight);

    //Dirty trick to implement DESCANT's tooltip on its obnoxious geometry: make another canvas of the same size hidden beneath, with the 
    //detector drawn on it, but with each element filled in with rgba(0,0,n,1), where n is the channel number; fetching the color from the 
    //hidden canvas at point x,y will then return the appropriate channel index.
    //paint whole hidden canvas with R!=G!=B to trigger TT suppression:
    this.TTcontext.fillStyle = '#123456';
    this.TTcontext.fillRect(0,0,this.canvasWidth, this.canvasHeight);

    //set up tooltip:
    this.tooltip = new Tooltip(this.canvasID, 'DESCANTTipText', 'DESCANTTT', this.monitorID, window.parameters.DESCANTprefix, window.parameters.DESCANTpostfix);
    this.tooltip.obj = that;

    //drawing parameters//////////////////////////////////////////////////////////////////////////////////
	//center of DESCANT
	this.centerX = $(this.canvas).width() / 2;
	this.centerY = $(this.canvas).height()*0.45;

	//scale at which to draw DESCANT in pixels relative mm in blueprint:
	this.scale = 0.3;

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

    this.scaleHeight = 80;

    //establish data buffers////////////////////////////////////////////////////////////////////////////
    this.HVcolor = [];
    this.oldHVcolor = [];
    this.thresholdColor = [];
    this.oldThresholdColor = [];
    this.rateColor = [];
    this.oldRateColor = [];

	//member functions//////////////////////////////////////////////////////

    //decide which view to transition to when this object is navigated to
    this.view = function(){
        return this.canvasID;
    }

	this.draw = function(frame){
		var i, j;
		this.context.clearRect(0,0,this.canvasWidth, this.canvasHeight-this.scaleHeight);
		this.TTcontext.fillStyle = '#123456'
		this.TTcontext.fillRect(0,0,this.canvasWidth, this.canvasHeight);
		if(this.drawRules[i]!=0){
			for(i=0; i<70; i++){
				this.context.save();
				this.context.translate(this.centerX, this.centerY);
				this.context.rotate(this.drawRules[i][3]);

                if(window.subdetectorView == 0) this.context.fillStyle = interpolateColor(parseHexColor(this.oldHVcolor[i]), parseHexColor(this.HVcolor[i]), frame/this.nFrames);
                else if(window.subdetectorView == 1) this.context.fillStyle = interpolateColor(parseHexColor(this.oldThresholdColor[i]), parseHexColor(this.thresholdColor[i]), frame/this.nFrames);
				else if(window.subdetectorView == 2) this.context.fillStyle = interpolateColor(parseHexColor(this.oldRateColor[i]), parseHexColor(this.rateColor[i]), frame/this.nFrames);

				if(this.drawRules[i][0] == 'white')whiteDetector(this.context, this.drawRules[i][1], this.drawRules[i][2], this.scale, 0, 0);
				else if(this.drawRules[i][0] == 'red') redDetector(this.context, this.drawRules[i][1], this.drawRules[i][2], this.scale, 0, this.drawRules[i][4], 0);
				else if(this.drawRules[i][0] == 'blue') blueDetector(this.context, this.drawRules[i][1], this.drawRules[i][2], this.scale, 0, this.drawRules[i][4], 0);
				else if(this.drawRules[i][0] == 'greenLeft') greenLeftDetector(this.context, this.drawRules[i][1], this.drawRules[i][2], this.scale, 0, this.drawRules[i][4], 0);
				else if(this.drawRules[i][0] == 'greenRight') greenRightDetector(this.context, this.drawRules[i][1], this.drawRules[i][2], this.scale, 0, this.drawRules[i][4], 0);

				this.context.restore();
			}

			//and the same again for the hidden TT info canvas:
			for(i=0; i<70; i++){
				this.TTcontext.save();
				this.TTcontext.translate(this.centerX, this.centerY);
				this.TTcontext.rotate(this.drawRules[i][3]);

				this.TTcontext.fillStyle = 'rgba('+i+','+i+','+i+',1)';

				if(this.drawRules[i][0] == 'white')whiteDetector(this.TTcontext, this.drawRules[i][1], this.drawRules[i][2], this.scale, 0, 1);
				else if(this.drawRules[i][0] == 'red') redDetector(this.TTcontext, this.drawRules[i][1], this.drawRules[i][2], this.scale, 0, this.drawRules[i][4], 1);
				else if(this.drawRules[i][0] == 'blue') blueDetector(this.TTcontext, this.drawRules[i][1], this.drawRules[i][2], this.scale, 0, this.drawRules[i][4], 1);
				else if(this.drawRules[i][0] == 'greenLeft') greenLeftDetector(this.TTcontext, this.drawRules[i][1], this.drawRules[i][2], this.scale, 0, this.drawRules[i][4], 1);
				else if(this.drawRules[i][0] == 'greenRight') greenRightDetector(this.TTcontext, this.drawRules[i][1], this.drawRules[i][2], this.scale, 0, this.drawRules[i][4], 1);

				this.TTcontext.restore();
			}
		}

        if(frame==this.nFrames || frame==0) {
            //scale
            this.drawScale(this.context);
        }

	};

	//fetch the channel number that pixel x,y sits on by parsing the info encoded in the blue entry of the hidden tooltip canvas
	this.fetchChannel = function(x, y){
		var imageData = this.TTcontext.getImageData(x,y,1,1);
		var index = -1;
		if(imageData.data[0] == imageData.data[1] && imageData.data[0] == imageData.data[2]) index = imageData.data[0];
		return index;
	};

	this.findCell = function(x, y){
		return this.fetchChannel(x,y);
	};

    //establish the tooltip text for the cell returned by this.findCell; return length of longest line:
	this.defineText = function(cell){
        var toolTipContent = '<br>';
        var nextLine;
        var longestLine = 0;
        var cardIndex;
        var i;

        nextLine = this.dataBus.key[cell][0];
        //keep track of the longest line of text:
        longestLine = Math.max(longestLine, this.tooltip.context.measureText(nextLine).width)
        toolTipContent += nextLine;
/*
        //fill out tooltip content:
        for(i=0; i<this.reportedValues.length; i++){
            //establish prefix:
            nextLine = '<br/>'+this.tooltip.prefix[i];
            if(this.tooltip.prefix[i] !== '') nextLine += ' ';

            //pull in content; special cases for the status word and reported current:
            //status word:
            if(i == 6){
                nextLine += parseStatusWord(this.reportedValues[i][row][col]);
            }
            //current:
            else if(i == 2){
                    if(this.moduleSizes[cardIndex]==4 && row!=0) nextLine += '--';
                    else nextLine += Math.round( this.reportedValues[i][row][col]*1000)/1000 + ' ' + this.tooltip.postfix[i];                
            } else {
                nextLine += Math.round( this.reportedValues[i][row][col]*1000)/1000 + ' ' + this.tooltip.postfix[i];
            }

            //keep track of longest line:
            longestLine = Math.max(longestLine, this.tooltip.context.measureText(nextLine).width);

            //append to tooltip:
            toolTipContent += nextLine;
 
        }
*/
        document.getElementById(this.tooltip.ttTextID).innerHTML = toolTipContent;

        //return length of longest line:
        return longestLine;
	};

	this.update = function(){
        var i;

        //get new data
        this.fetchNewData();

        //parse the new data into colors
        for(i=0; i<this.dataBus.HV.length; i++){
            this.oldHVcolor[i] = this.HVcolor[i];
            this.HVcolor[i] = this.parseColor(this.dataBus.HV[i]);
        }
        for(i=0; i<this.dataBus.thresholds.length; i++){
            this.oldThresholdColor[i] = this.thresholdColor[i];
            this.thresholdColor[i] = this.parseColor(this.dataBus.thresholds[i]);
        }
        for(i=0; i<this.dataBus.rate.length; i++){
            this.oldRateColor[i] = this.rateColor[i];
            this.rateColor[i] = this.parseColor(this.dataBus.rate[i]);
        }

		this.tooltip.update();
        this.displaySwitch();
	}

    //determine which color <scalar> corresponds to
    this.parseColor = function(scalar){

        //how far along the scale are we?  Technically this will produce the wrong color for canvases not currently on display.
        var scale = (scalar - this.minima[window.subdetectorView]) / (this.maxima[window.subdetectorView] - this.minima[window.subdetectorView]);

        //different scales for different meters to aid visual recognition:
        if(window.subdetectorView==0) return scalepickr(scale, 'rainbow');
        else if(window.subdetectorView==1) return scalepickr(scale, 'twighlight');
        else if(window.subdetectorView==2) return scalepickr(scale, 'thermalScope');
    };

    //decide which display version to show:
    this.displaySwitch = function(){
        //all views look the same, so do nothing.
    };

    this.fetchNewData = function(){
        var i, j;

        //dummy data:
        for(i=0; i<70; i++){
            this.dataBus.HV[i] = Math.random();
            this.dataBus.thresholds[i] = Math.random();
            this.dataBus.rate[i] = Math.random();
        }
        /*
        //get the data out of the ODB in whatever order its packed in:
        var rawHV = ODBGet(this.dataBus.HVpath+'[*]');
        var rawThresholds = ODBGet(this.dataBus.thresholdsPath+'[*]');
        var rawRate = ODBGet(this.dataBus.ratePath+'[*]');
        //re-sort the data in the order we expect it in:
        for(i=0; i<70; i++){
            this.dataBus.HV[i] = rawHV[ this.dataBus.key[i][1] ];
            this.dataBus.thresholds[i] = rawThresholds[ this.dataBus.key[i][1] ];
            this.dataBus.rate[i] = rawRate[ this.dataBus.key[i][1] ];
        }
        */
    };

    this.animate = function(){
        if(window.onDisplay == this.canvasID || window.freshLoad) animate(this, 0);
        else this.draw(this.nFrames);
    };

    this.drawScale = function(context){
        var i, j; 
        context.clearRect(0, this.canvasHeight - this.scaleHeight, this.canvasWidth, this.canvasHeight);

        var title, minTick, maxTick;
        title = window.parameters.monitorValues[window.subdetectorView];
        minTick = window.parameters.DESCANTminima[window.subdetectorView] + ' ' + window.parameters.subdetectorUnit[window.subdetectorView];
        maxTick = window.parameters.DESCANTmaxima[window.subdetectorView] + ' ' + window.parameters.subdetectorUnit[window.subdetectorView];

        //titles
        context.fillStyle = '#999999';
        context.font="24px 'Orbitron'";
        context.fillText(title, this.canvasWidth/2 - context.measureText(title).width/2, this.canvasHeight-8);

        //tickmark;
        context.strokeStyle = '#999999';
        context.lineWidth = 1;
        context.font="12px 'Raleway'";

        context.beginPath();
        context.moveTo(this.canvasWidth*0.05+1, this.canvasHeight - 40);
        context.lineTo(this.canvasWidth*0.05+1, this.canvasHeight - 30);
        context.stroke();
        context.fillText(minTick, this.canvasWidth*0.05 - context.measureText(minTick).width/2, this.canvasHeight-15);

        context.beginPath();
        context.moveTo(this.canvasWidth*0.95-1, this.canvasHeight - 40);
        context.lineTo(this.canvasWidth*0.95-1, this.canvasHeight - 30); 
        context.stroke();      
        context.fillText(maxTick, this.canvasWidth*0.95 - context.measureText(maxTick).width/2, this.canvasHeight-15);

        for(i=0; i<3000; i++){
            if(window.subdetectorView == 0) context.fillStyle = scalepickr(0.001*(i%1000), 'rainbow');
            if(window.subdetectorView == 1) context.fillStyle = scalepickr(0.001*(i%1000), 'twighlight');
            if(window.subdetectorView == 2) context.fillStyle = scalepickr(0.001*(i%1000), 'thermalScope');
            context.fillRect(this.canvasWidth*0.05 + this.canvasWidth*0.9/1000*(i%1000), this.canvasHeight-60, this.canvasWidth*0.9/1000, 20);
        }

    };

	//array of rules for drawing DESCANT channels.  Array index should correspond to real channel number; packed as [type, center x, center y, canvas rotation, element rotation]
	this.drawRules = [];
	for(i=0; i<5; i++){
		this.drawRules[0 + i*8] = ['white', 0, 0 - this.pentagonNormal-71.9*this.scale, (i-1)*72/180*Math.PI];
		this.drawRules[1 + i*8] = ['white', 0, 0 - this.pentagonNormal-(223.4 + this.explode/0.4)*this.scale, (i-1)*72/180*Math.PI];
		this.drawRules[2 + i*8] = ['white', 0, 0 - this.pentagonNormal-(374.9 + 2*this.explode/0.4)*this.scale, (i-1)*72/180*Math.PI];
		this.drawRules[3 + i*8] = ['white', 0, 0 - this.pentagonNormal-(526.4 + 3*this.explode/0.4)*this.scale, (i-1)*72/180*Math.PI];
		this.drawRules[4 + i*8] = ['greenLeft',  0, 0 - this.pentagonNormal - this.scale*(706.25 + this.explode), (i*72 - 60)/180*Math.PI, 10/180*Math.PI];
		this.drawRules[5 + i*8] = ['greenLeft',  0, 0 - this.pentagonNormal - this.scale*(681.25 + this.explode), (i*72 - 45)/180*Math.PI, 0];
		this.drawRules[6 + i*8] = ['greenRight', 0, 0 - this.pentagonNormal - this.scale*(681.25 + this.explode), (i*72 - 27)/180*Math.PI, -3/180*Math.PI];
		this.drawRules[7 + i*8] = ['greenRight', 0, 0 - this.pentagonNormal - this.scale*(706.25 + this.explode), (i*72 - 12)/180*Math.PI, -13/180*Math.PI];
		this.drawRules[40 + i*3] = ['red', 0, 0 - this.pentagonVertex - this.scale*(167.9 + this.explode), (i*72 + 324)/180*Math.PI, Math.PI/2];
		this.drawRules[41 + i*3] = ['red', 0, 0 - this.pentagonNormal - this.scale*(516.25 + this.explode), (i*72 - 55)/180*Math.PI, Math.PI/2 + 15/180*Math.PI]
		this.drawRules[42 + i*3] = ['red', 0, 0 - this.pentagonNormal - this.scale*(516.25 + this.explode), (i*72 - 16)/180*Math.PI, Math.PI/2 - 15/180*Math.PI]
		this.drawRules[55 + i*3] = ['blue',0, 0 - this.pentagonNormal - this.scale*(356.25 + this.explode), (i*72 - 49)/180*Math.PI, -Math.PI*22/180]
		this.drawRules[56 + i*3] = ['blue',0, 0 - this.pentagonNormal - this.scale*(356.25 + this.explode), (i*72 - 23)/180*Math.PI, Math.PI*22/180]
		this.drawRules[57 + i*3] = ['blue',0, 0 - this.pentagonNormal - this.scale*(516.25 + this.explode), (i*72 - 36)/180*Math.PI, Math.PI*90/180]
	}

    //do an initial populate:
    this.update();

}














