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
		this.TTcontext.fillStyle = '#123456'
		this.TTcontext.fillRect(0,0,this.canvasWidth, this.canvasHeight);
		//for(i=0; i<70; i++){
        for(key in this.dataBus.DESCANT){
            i = this.dataBus.DESCANT[key].index - 1;
			this.context.save();
			this.context.translate(this.centerX, this.centerY);
			this.context.rotate(this.drawRules[i][3]);

            if(window.subdetectorView == 0) this.context.fillStyle = interpolateColor(parseHexColor(this.dataBus.DESCANT[key].oldHVcolor), parseHexColor(this.dataBus.DESCANT[key].HVcolor), frame/this.nFrames);
            else if(window.subdetectorView == 1) this.context.fillStyle = interpolateColor(parseHexColor(this.dataBus.DESCANT[key].oldThresholdColor), parseHexColor(this.dataBus.DESCANT[key].thresholdColor), frame/this.nFrames);
			else if(window.subdetectorView == 2) this.context.fillStyle = interpolateColor(parseHexColor(this.dataBus.DESCANT[key].oldRateColor), parseHexColor(this.dataBus.DESCANT[key].rateColor), frame/this.nFrames);

			if(this.drawRules[i][0] == 'white')whiteDetector(this.context, this.drawRules[i][1], this.drawRules[i][2], this.scale, 0, 0);
			else if(this.drawRules[i][0] == 'red') redDetector(this.context, this.drawRules[i][1], this.drawRules[i][2], this.scale, 0, this.drawRules[i][4], 0);
			else if(this.drawRules[i][0] == 'blue') blueDetector(this.context, this.drawRules[i][1], this.drawRules[i][2], this.scale, 0, this.drawRules[i][4], 0);
			else if(this.drawRules[i][0] == 'greenLeft') greenLeftDetector(this.context, this.drawRules[i][1], this.drawRules[i][2], this.scale, 0, this.drawRules[i][4], 0);
			else if(this.drawRules[i][0] == 'greenRight') greenRightDetector(this.context, this.drawRules[i][1], this.drawRules[i][2], this.scale, 0, this.drawRules[i][4], 0);

			this.context.restore();
		}

		//and the same again for the hidden TT info canvas:
		for(key in this.dataBus.DESCANT){
            i = this.dataBus.DESCANT[key].index - 1;
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
		}
		

        if(frame==this.nFrames || frame==0) {
            //scale
            this.drawScale(this.context);
        }

	};



    //establish the tooltip text for the cell returned by this.findCell; return length of longest line:
	this.defineText = function(cell){
        var toolTipContent = '<br>';
        var nextLine;
        var cardIndex;
        var i;

        nextLine = this.dataBus.DESCANTTTmap[cell];
        toolTipContent += nextLine;

        toolTipContent += '<br><br>';
        document.getElementById(this.tooltip.ttDivID).innerHTML = toolTipContent;

        return 0;
	};

	this.update = function(){
        var key;

        //get new data
        this.fetchNewData();

        //parse the new data into colors
        for(key in this.dataBus.DESCANT){
            this.dataBus.DESCANT[key].oldHVcolor = this.dataBus.DESCANT[key].HVcolor;
            this.dataBus.DESCANT[key].HVcolor = this.parseColor(this.dataBus.DESCANT[key].HV, this.name);
            this.dataBus.DESCANT[key].oldThresholdColor = this.dataBus.DESCANT[key].thresholdColor;
            this.dataBus.DESCANT[key].thresholdColor = this.parseColor(this.dataBus.DESCANT[key].threshold, this.name);
            this.dataBus.DESCANT[key].oldRateColor = this.dataBus.DESCANT[key].rateColor;
            this.dataBus.DESCANT[key].rateColor = this.parseColor(this.dataBus.DESCANT[key].rate, this.name);
        }

		this.tooltip.update();
	}

    this.fetchNewData = function(){
        var key;

        //dummy data:
        for(key in this.dataBus.DESCANT){
            this.dataBus.DESCANT[key].HV = Math.random();
            this.dataBus.DESCANT[key].threshold = Math.random();
            this.dataBus.DESCANT[key].rate = Math.random();
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














