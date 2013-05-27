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

    this.nDSSD = 4;
    this.nStrips = 16;

    this.topMargin = 0.05*this.canvasHeight;
    this.bottomMargin = 0.05*this.canvasHeight;
    this.leftMargin = 0.05*this.canvasWidth;
    this.rightMargin = 0.05*this.canvasWidth;

    this.horizGutter = 0.02*this.canvasHeight;
    this.vertGutter = 0.01*this.canvasWidth;

    this.DSSDwidth = (this.canvasWidth - this.leftMargin - this.rightMargin - (this.nDSSD-1)*this.vertGutter)/this.nDSSD;
    this.DSSDheight = (this.canvasHeight - this.topMargin - this.bottomMargin - this.horizGutter) / 2

    this.stripWidth = this.DSSDwidth / this.nStrips;
    this.stripHeight = this.DSSDheight / this.nStrips;

    this.context.strokeStyle = '#999999';


    //member functions////////////////////////////////////////////////////////////////////////////////////
    this.draw = function(frame){

        this.context.clearRect(0,0,this.canvasWidth,this.canvasHeight);
        this.context.font = '24px Orbitron';
        this.context.fillStyle = '#999999';
        this.context.fillText('DSSD Monitor Coming Soon', this.canvasWidth/2 - this.context.measureText('DSSD Monitor Coming Soon').width/2, this.canvasHeight*0.4);

        /*
    	var key, orientation, x, y;
    	this.context.strokeStyle = '#999999';
    	this.TTcontext.strokeStyle = '#123456';

    	//loop over each strip
    	for(key in this.dataBus.DSSD){

    		//choose fill color:
            if(window.subdetectorView == 0) this.context.fillStyle = interpolateColor(parseHexColor(this.dataBus.DSSD[key].oldHVcolor), parseHexColor(this.dataBus.DSSD[key].HVcolor), frame/this.nFrames);
            else if(window.subdetectorView == 1) this.context.fillStyle = interpolateColor(parseHexColor(this.dataBus.DSSD[key].oldThresholdColor), parseHexColor(this.dataBus.DSSD[key].thresholdColor), frame/this.nFrames);
			else if(window.subdetectorView == 2) this.context.fillStyle = interpolateColor(parseHexColor(this.dataBus.DSSD[key].oldRateColor), parseHexColor(this.dataBus.DSSD[key].rateColor), frame/this.nFrames);
			//also for TT layer:
			this.TTcontext.fillStyle = 'rgba('+this.dataBus.DSSD[key].index+','+this.dataBus.DSSD[key].index+','+this.dataBus.DSSD[key].index+',1)';

			x = keyToCornerX(key); //TODO;
			y = keyToCornerY(key); //TODO;
			orientation = keyToOrientation(key); //TODO;

			if(orientation == 'horizontal'){
				this.context.fillRect(x,y,this.DSSDwidth,this.stripHeight);
				this.context.strokeRect(x,y,this.DSSDwidth,this.stripHeight);
				this.TTcontext.fillRect(x,y,this.DSSDwidth,this.stripHeight);
				this.TTcontext.strokeRect(x,y,this.DSSDwidth,this.stripHeight);
			} else if(orientation == 'vertical'){
				this.context.fillRect(x,y,this.stripWidth,this.DSSDheight);
				this.context.strokeRect(x,y,this.stripWidth,this.DSSDheight);
				this.TTcontext.fillRect(x,y,this.stripWidth,this.DSSDheight);
				this.TTcontext.strokeRect(x,y,this.stripWidth,this.DSSDheight);
			}

    	}

        if(frame==this.nFrames || frame==0) {
            //scale
            this.drawScale(this.context);
        }
        */
    }





}