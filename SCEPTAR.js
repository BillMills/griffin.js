SCEPTAR.prototype = Object.create(Subsystem.prototype);

function SCEPTAR(){
    //detector name, self-pointing pointer, pull in the Subsystem template, 
    //establish a databus and create a global-scope pointer to this object:
    this.name = 'SCEPTAR';
    var that = this;
    Subsystem.call(this);
    this.dataBus = new SCEPTARDS();
    //make a pointer at window level back to this object, so we can pass by reference to the nav button onclick
    window.SCEPTARpointer = that;

    //member variables///////////////////////////////////
    this.config = window.parameters.SCEPTARconfig;  //subsystems on: [upstream sceptar, downstream sceptar, downstream ZDS]






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

    //establish data buffers////////////////////////////////////////////////////////////////////////////
    this.HVcolor = [];
    this.oldHVcolor = [];
    this.thresholdColor = [];
    this.oldThresholdColor = [];
    this.rateColor = [];
    this.oldRateColor = [];

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
            if(window.subdetectorView == 0) this.context.fillStyle = interpolateColor(parseHexColor(this.oldHVcolor[20]), parseHexColor(this.HVcolor[20]), frame/this.nFrames);
            else if(window.subdetectorView == 1) this.context.fillStyle = interpolateColor(parseHexColor(this.oldThresholdColor[20]), parseHexColor(this.thresholdColor[20]), frame/this.nFrames);
            else if(window.subdetectorView == 2) this.context.fillStyle = interpolateColor(parseHexColor(this.oldRateColor[20]), parseHexColor(this.rateColor[20]), frame/this.nFrames);
        	this.context.beginPath();
    	    this.context.arc(this.ZDScenterX, this.ZDScenterY, this.ZDSradius, 0, 2*Math.PI);
        	this.context.closePath();
        	this.context.fill();
    	    this.context.stroke();
        }

        //...and again for tt encoding:
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
            this.TTcontext.fillStyle = 'rgba('+20+','+20+','+20+',1)';
            this.TTcontext.fill();
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
        var x0, y0, i, indexStart;
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
            if(context == this.context){
                if(window.subdetectorView == 0) context.fillStyle = interpolateColor(parseHexColor(this.oldHVcolor[i+indexStart]), parseHexColor(this.HVcolor[i+indexStart]), frame/this.nFrames);
                else if(window.subdetectorView == 1) context.fillStyle = interpolateColor(parseHexColor(this.oldThresholdColor[i+indexStart]), parseHexColor(this.thresholdColor[i+indexStart]), frame/this.nFrames);
                else if(window.subdetectorView == 2) context.fillStyle = interpolateColor(parseHexColor(this.oldRateColor[i+indexStart]), parseHexColor(this.rateColor[i+indexStart]), frame/this.nFrames);
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
                context.fillStyle = 'rgba('+(indexStart+i)+','+(indexStart+i)+','+(indexStart+i)+',1)';
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

    this.defineText = function(cell){
        var toolTipContent = '<br>';
        var nextLine;
        var cardIndex;
        var i;

        nextLine = this.dataBus.key[cell][0];
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
            if(i==20)
                this.HVcolor[i] = this.parseColor(this.dataBus.HV[i], 'ZDS');
            else 
                this.HVcolor[i] = this.parseColor(this.dataBus.HV[i], 'SCEPTAR');
        }
        for(i=0; i<this.dataBus.thresholds.length; i++){
            this.oldThresholdColor[i] = this.thresholdColor[i];
            if(i==20)  
                this.thresholdColor[i] = this.parseColor(this.dataBus.thresholds[i], 'ZDS');
            else 
                this.thresholdColor[i] = this.parseColor(this.dataBus.thresholds[i], 'SCEPTAR');
        }
        for(i=0; i<this.dataBus.rate.length; i++){
            this.oldRateColor[i] = this.rateColor[i];
            if(i==20)
                this.rateColor[i] = this.parseColor(this.dataBus.rate[i], 'ZDS');
            else
                this.rateColor[i] = this.parseColor(this.dataBus.rate[i], 'SCEPTAR');
        }

        this.tooltip.update();
    };


    this.fetchNewData = function(){
        var i;

        //dummy data:
        for(i=0; i<21; i++){
            this.dataBus.HV[i] = Math.random();
            this.dataBus.thresholds[i] = Math.random();
            this.dataBus.rate[i] = Math.random();
        }
    };

    //do an initial populate:
    this.update();
}