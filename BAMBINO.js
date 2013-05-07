BAMBINO.prototype = Object.create(Subsystem.prototype);

function BAMBINO(){
    //detector name, self-pointing pointer, pull in the Subsystem template, 
    //establish a databus and create a global-scope pointer to this object:
    this.name = 'BAMBINO';
    var that = this;
    Subsystem.call(this);
    this.dataBus = new BAMBINODS(this.mode);
    //make a pointer at window level back to this object, so we can pass by reference to the nav button onclick
    window.BAMBINOpointer = that;

    //member variables///////////////////////////////////
    this.mode = window.parameters.BAMBINOmode;      //'S2' or 'S3'
    this.nRadial = 24;
    if(this.mode=='S2')
    	this.nAzimuthal = 16;
    else if(this.mode=='S3')
        this.nAzimuthal = 32;






    //drawing parameters//////////////////////////////////////////////////
    this.centerX = this.canvasWidth/2;
    this.centerY = this.canvasHeight/2;
    this.CDinnerRadius = this.canvasWidth*0.01;
    this.CDradius = this.canvasHeight*0.17;
    this.centerLeft = this.canvasWidth*0.25;
    this.centerRight = this.canvasWidth*0.75;
    this.centerTop = this.canvasHeight*0.2;
    this.centerBottom = this.canvasHeight*0.6;
    this.radialWidth = (this.CDradius - this.CDinnerRadius) / this.nRadial;
    this.azimuthalArc = 2*Math.PI / this.nAzimuthal;

    //establish data buffers////////////////////////////////////////////////////////////////////////////
    this.HVcolor = [];
    this.oldHVcolor = [];
    this.thresholdColor = [];
    this.oldThresholdColor = [];
    this.rateColor = [];
    this.oldRateColor = [];

    //member functions///////////////////////////////////////////////////////////////////


    this.draw = function(frame){

    	var i, j, m, x0, y0;

    	this.context.strokeStyle = '#999999';

        //once for display canvas...
    	for(i=0; i<4; i++){
	    	if(i == 0){
	    		x0 = this.centerLeft; y0 = this.centerTop;  //downstream radial
	    	} else if(i == 1){
	    		x0 = this.centerLeft; y0 = this.centerBottom; //downstream azimuthal
	    	} else if(i == 2){
	    		x0 = this.centerRight; y0 = this.centerTop; //upstream radial
	    	} else if(i == 3){
	    		x0 = this.centerRight; y0 = this.centerBottom; //upstream azimuthal
	    	}
	    	if(i == 0 || i == 2){
	    		for(j=0; j<this.nRadial; j++){
    				this.context.beginPath()
                    if(window.subdetectorView == 0) this.context.fillStyle = interpolateColor(parseHexColor(this.oldHVcolor[i/2*(this.nRadial+this.nAzimuthal)+j]), parseHexColor(this.HVcolor[i/2*(this.nRadial+this.nAzimuthal)+j]), frame/this.nFrames);
                    else if(window.subdetectorView == 1) this.context.fillStyle = interpolateColor(parseHexColor(this.oldThresholdColor[i/2*(this.nRadial+this.nAzimuthal)+j]), parseHexColor(this.thresholdColor[i/2*(this.nRadial+this.nAzimuthal)+j]), frame/this.nFrames);
                    else if(window.subdetectorView == 2) this.context.fillStyle = interpolateColor(parseHexColor(this.oldRateColor[i/2*(this.nRadial+this.nAzimuthal)+j]), parseHexColor(this.rateColor[i/2*(this.nRadial+this.nAzimuthal)+j]), frame/this.nFrames);
	    			this.context.arc(x0, y0, this.CDradius - j*this.radialWidth, 0, 2*Math.PI);
	    			this.context.closePath();
    				this.context.fill();
	    			this.context.stroke();
    			}
                //clear inner circle:
                this.context.fillStyle = '#333333';
                this.context.beginPath();
                this.context.arc(x0, y0, this.CDradius - j*this.radialWidth, 0, 2*Math.PI);
                this.context.closePath();
                this.context.fill();   
    			
    		} else {
    
	    		for(j=0; j<this.nAzimuthal; j++){
    				this.context.beginPath()
                    if(window.subdetectorView == 0) this.context.fillStyle = interpolateColor(parseHexColor(this.oldHVcolor[this.nRadial+(i-1)/2*(this.nRadial+this.nAzimuthal)+j]), parseHexColor(this.HVcolor[this.nRadial+(i-1)/2*(this.nRadial+this.nAzimuthal)+j]), frame/this.nFrames);
                    else if(window.subdetectorView == 1) this.context.fillStyle = interpolateColor(parseHexColor(this.oldThresholdColor[this.nRadial+(i-1)/2*(this.nRadial+this.nAzimuthal)+j]), parseHexColor(this.thresholdColor[this.nRadial+(i-1)/2*(this.nRadial+this.nAzimuthal)+j]), frame/this.nFrames);
                    else if(window.subdetectorView == 2) this.context.fillStyle = interpolateColor(parseHexColor(this.oldRateColor[this.nRadial+(i-1)/2*(this.nRadial+this.nAzimuthal)+j]), parseHexColor(this.rateColor[this.nRadial+(i-1)/2*(this.nRadial+this.nAzimuthal)+j]), frame/this.nFrames);
                    this.context.moveTo(x0 + this.CDinnerRadius*Math.cos(j*this.azimuthalArc), y0 - this.CDinnerRadius*Math.sin(j*this.azimuthalArc));
                    this.context.arc(x0,y0, this.CDinnerRadius, -j*this.azimuthalArc, -(j+1)*this.azimuthalArc, true);
                    this.context.lineTo(x0 + this.CDradius*Math.cos((j+1)*this.azimuthalArc), y0 - this.CDradius*Math.sin((j+1)*this.azimuthalArc));
                    this.context.arc(x0,y0, this.CDradius, -(j+1)*this.azimuthalArc, -j*this.azimuthalArc, false);
    				this.context.closePath();
    				this.context.fill();
	    			this.context.stroke();
    			}
    		}
    	}
        //...and again for TT encoding; loop twice to suppress antialiasing:
        for(var aa=0; aa<2; aa++){
            m=0;
            for(i=0; i<4; i++){
                if(i == 0){
                    x0 = this.centerLeft; y0 = this.centerTop;  //downstream radial
                } else if(i == 1){
                    x0 = this.centerLeft; y0 = this.centerBottom; //downstream azimuthal
                } else if(i == 2){
                    x0 = this.centerRight; y0 = this.centerTop; //upstream radial
                } else if(i == 3){
                    x0 = this.centerRight; y0 = this.centerBottom; //upstream azimuthal
                }
                if(i == 0 || i == 2){
                    for(j=0; j<this.nRadial; j++){
                        this.TTcontext.beginPath()
                        if(aa==0) this.TTcontext.fillStyle = '#123456';
                        else this.TTcontext.fillStyle = 'rgba('+m+','+m+','+m+',1)';
                        this.TTcontext.arc(x0, y0, this.CDradius - j*this.radialWidth, 0, 2*Math.PI);
                        this.TTcontext.closePath();
                        this.TTcontext.fill();
                        m++;
                    }
                    //clear inner circle:
                    this.TTcontext.fillStyle = '#123456';
                    this.TTcontext.beginPath();
                    this.TTcontext.arc(x0, y0, this.CDradius - j*this.radialWidth, 0, 2*Math.PI);
                    this.TTcontext.closePath();
                    this.TTcontext.fill();
                
                } else {
    
                    for(j=0; j<this.nAzimuthal; j++){
                        this.TTcontext.beginPath()
                        if(aa==0) this.TTcontext.fillStyle = '#123456';
                        else this.TTcontext.fillStyle = 'rgba('+m+','+m+','+m+',1)';
                        this.TTcontext.moveTo(x0 + this.CDinnerRadius*Math.cos(j*this.azimuthalArc), y0 - this.CDinnerRadius*Math.sin(j*this.azimuthalArc));
                        this.TTcontext.arc(x0,y0, this.CDinnerRadius, -j*this.azimuthalArc, -(j+1)*this.azimuthalArc, true);
                        this.TTcontext.lineTo(x0 + this.CDradius*Math.cos((j+1)*this.azimuthalArc), y0 - this.CDradius*Math.sin((j+1)*this.azimuthalArc));
                        this.TTcontext.arc(x0,y0, this.CDradius, -(j+1)*this.azimuthalArc, -j*this.azimuthalArc, false);
                        this.TTcontext.closePath();
                        this.TTcontext.fill();
                        m++;
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
            this.context.fillText('Downstream', this.centerLeft - this.context.measureText('Downstream').width/2, 0.85*this.canvasHeight);
            this.context.fillText('Upstream', this.centerRight - this.context.measureText('Upstream').width/2, 0.85*this.canvasHeight);
        }

    };

    this.defineText = function(cell){
        var toolTipContent = '<br>';
        var nextLine;
        var cardIndex;
        var i;

        nextLine = 'Channel '+cell;
        toolTipContent += nextLine;
        
        toolTipContent += '<br><br>';
        document.getElementById(this.tooltip.ttDivID).innerHTML = toolTipContent;

        return 0;
    };

    this.update = function(){
        var i;

        //get new data
        this.fetchNewData();

        //parse the new data into colors
        for(i=0; i<this.dataBus.HV.length; i++){
            this.oldHVcolor[i] = this.HVcolor[i];
            this.HVcolor[i] = this.parseColor(this.dataBus.HV[i], 'BAMBINO');
        }
        for(i=0; i<this.dataBus.thresholds.length; i++){
            this.oldThresholdColor[i] = this.thresholdColor[i];
            this.thresholdColor[i] = this.parseColor(this.dataBus.thresholds[i], 'BAMBINO');
        }
        for(i=0; i<this.dataBus.rate.length; i++){
            this.oldRateColor[i] = this.rateColor[i];
            this.rateColor[i] = this.parseColor(this.dataBus.rate[i], 'BAMBINO');
        }

        this.tooltip.update();
    };


    this.fetchNewData = function(){
        var i;
        var nChannels = 2*this.nRadial + 2*this.nAzimuthal;

        //dummy data:
        for(i=0; i<nChannels; i++){
            this.dataBus.HV[i] = Math.random();
            this.dataBus.thresholds[i] = Math.random();
            this.dataBus.rate[i] = Math.random();
        }
    };

    //do an initial populate:
    this.update();

}