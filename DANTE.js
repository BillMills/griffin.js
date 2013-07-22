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
}