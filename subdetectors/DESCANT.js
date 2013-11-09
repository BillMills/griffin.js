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
    //list of elements with distinct minima and maxima on subdetector views:
    this.subdetectors = ['DESCANT'];

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

		var i, j, key, fill;
		this.context.clearRect(0,0,this.canvasWidth, this.canvasHeight-this.scaleHeight);

        for(key in this.dataBus.DESCANT){
            //i = this.dataBus.DESCANT[key].index - 1;
            i = this.chMap(this.dataBus.DESCANT[key].index);
			this.context.save();
			this.context.translate(this.centerX, this.centerY);
			this.context.rotate(this.drawRules[i][3]);
			fill = colors(key, this.dataBus.DESCANT, frame, this.nFrames);
			this.context.fillStyle =  (fill == 0xDEADBEEF) ? this.context.createPattern(window.parameters.warningFill, 'repeat') : fill;

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
    //this.update();

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














