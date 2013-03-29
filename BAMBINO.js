BAMBINO.prototype = Object.create(Subsystem.prototype);

function BAMBINO(){
    Subsystem.call(this);
    
    this.name = 'BAMBINO';
	//this.monitorID = window.parameters.wrapper;     //div ID of wrapper div
    this.mode = window.parameters.BAMBINOmode;      //'S2' or 'S3'
	this.canvasID = 'BAMBINOCanvas'; 		        //ID of canvas to draw top level TIGRESS view on
    this.TTcanvasID = 'BAMBINOTTCanvas';            //ID of hidden tooltip map canvas
    this.minima = window.parameters.BAMBINOminima;  //array of meter minima [HV, thresholds, rate]
    this.maxima = window.parameters.BAMBINOmaxima;  //array of meter maxima, arranged as minima
    this.subviewLink = 'BAMBINOlink';                   //ID of inter-subsystem nav button

    this.nRadial = 24;
    if(this.mode=='S2')
    	this.nAzimuthal = 16;
    else
        this.nAzimuthal = 32;
    this.dataBus = new BAMBINODS(this.mode);

    var that = this;
    //make a pointer at window level back to this object, so we can pass by reference to the nav button onclick
    window.BAMBINOpointer = that;

    //insert nav link
    insertDOM('button', 'BAMBINOlink', 'navLink', '', this.linkWrapperID, "javascript:swapFade('BAMBINOlink', window.BAMBINOpointer, window.subsystemScalars, window.subdetectorView)", 'BAMBINO', '', 'button')

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

    //Dirty trick to implement tooltip on obnoxious geometry: make another canvas of the same size hidden beneath, with the 
    //detector drawn on it, but with each element filled in with rgba(0,0,n,1), where n is the channel number; fetching the color from the 
    //hidden canvas at point x,y will then return the appropriate channel index.
    //paint whole hidden canvas with R!=G!=B to trigger TT suppression:
    this.TTcontext.fillStyle = 'rgba(50,100,150,1)';
    this.TTcontext.fillRect(0,0,this.canvasWidth, this.canvasHeight);
    //set up tooltip:
    this.tooltip = new Tooltip(this.canvasID, 'BAMBINOTipText', 'BAMBINOTT', this.monitorID, window.parameters.BAMBINOprefix, window.parameters.BAMBINOpostfix);
    this.tooltip.obj = that;

    //drawing parameters
    this.scaleHeight = 80;
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
    //decide which view to transition to when this object is navigated to
    this.view = function(){
        return this.canvasID;
    }

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

    this.findCell = function(x, y){
        var imageData = this.TTcontext.getImageData(x,y,1,1);
        var index = -1;
        if(imageData.data[0] == imageData.data[1] && imageData.data[0] == imageData.data[2]) index = imageData.data[0];
        return index;
    };

    this.defineText = function(cell){
        var toolTipContent = '<br>';
        var nextLine;
        var longestLine = 0;
        var cardIndex;
        var i;

        nextLine = 'Channel '+cell;

        //keep track of the longest line of text:
        longestLine = Math.max(longestLine, this.tooltip.context.measureText(nextLine).width)
        toolTipContent += nextLine;

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
    };

    //determine which color <scalar> corresponds to
    this.parseColor = function(scalar){

        //how far along the scale are we?
        var scale = (scalar - this.minima[window.subdetectorView]) / (this.maxima[window.subdetectorView] - this.minima[window.subdetectorView]);

        //different scales for different meters to aid visual recognition:
        if(window.subdetectorView==0) return scalepickr(scale, 'rainbow');
        else if(window.subdetectorView==1) return scalepickr(scale, 'twighlight');
        else if(window.subdetectorView==2) return scalepickr(scale, 'thermalScope');
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

    this.animate = function(){
        if(window.onDisplay == this.canvasID || window.freshLoad) animate(this, 0);
        else this.draw(this.nFrames);
    };

    this.drawScale = function(context){
        var i, j; 
        context.clearRect(0, this.canvasHeight - this.scaleHeight, this.canvasWidth, this.canvasHeight);

        var title, minTick, maxTick;
        title = window.parameters.monitorValues[window.subdetectorView];
        minTick = window.parameters.BAMBINOminima[window.subdetectorView] + ' ' + window.parameters.subdetectorUnit[window.subdetectorView];
        maxTick = window.parameters.BAMBINOmaxima[window.subdetectorView] + ' ' + window.parameters.subdetectorUnit[window.subdetectorView];

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
    //do an initial populate:
    this.update();

}