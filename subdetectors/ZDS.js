ZDS.prototype = Object.create(Subsystem.prototype);

function ZDS(){
    //detector name, self-pointing pointer, pull in the Subsystem template, 
    //establish a databus and create a global-scope pointer to this object:
    this.name = 'ZDS';
    var that = this;
    Subsystem.call(this);
    this.dataBus = new ZDSDS();

    //make a pointer at window level back to this object, so we can pass by reference to the nav button onclick
    window.ZDSpointer = that;

    //list of elements with distinct minima and maxima on subdetector views:
    this.subdetectors = ['ZDS'];

    //drawing parameters///////////////////////////////////////
    this.centerX = this.canvasWidth/2;
    this.centerY = this.canvasHeight*0.42;
    this.radius  = this.canvasHeight*0.3;

    //member functions///////////////////////////////////////////////////////////////////


    this.draw = function(frame){
    	var i=0, key, ring, sector, fill;

    	this.context.strokeStyle = '#999999';
        fill = colors('ZDS01XN00X', this.dataBus.ZDS, frame, this.nFrames);
        this.context.fillStyle = (fill==0xDEADBEEF) ? this.context.createPattern(window.parameters.warningFill, 'repeat') : fill;

        this.context.beginPath();
        this.context.arc(this.centerX, this.centerY, this.radius, 0, Math.PI*2);
        this.context.closePath();
        this.context.fill();
        this.context.stroke();

        if(!this.TTlayerDone){
	        this.TTcontext.fillStyle = 'rgba(0,0,0,1)';
    	    this.TTcontext.beginPath();
        	this.TTcontext.arc(this.centerX, this.centerY, this.radius, 0, Math.PI*2);
	        this.TTcontext.closePath();
    	    this.TTcontext.fill();
    	    this.TTlayerDone = 1;
    	}

        //scale
        if(frame==this.nFrames || frame==0) this.drawScale(this.context);
    };
}