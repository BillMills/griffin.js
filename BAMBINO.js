function BAMBINO(monitor, canvas){
	this.monitorID = monitor;		        //div ID of wrapper div
	this.canvasID = canvas; 				//ID of canvas to draw top level TIGRESS view on

	this.monitor = document.getElementById(monitor);
	this.canvas = document.getElementById(canvas);
	this.context = this.canvas.getContext('2d');
	this.nRadial = 16;
	this.nAzimuthal = 16;

    //establish animation parameters////////////////////////////////////////////////////////////////////
    this.FPS = 30;
    this.duration = 0.5;
    this.nFrames = this.FPS*this.duration;

    //scale canvas//////////////////////////////////////////////////////////////////////////////////////
    this.canvasWidth = 0.48*$(this.monitor).width();
    this.canvasHeight = 0.8*$(this.monitor).height();
    this.canvas.setAttribute('width', this.canvasWidth);
    this.canvas.setAttribute('height', this.canvasHeight);

    //position canvas
    $('#'+canvas).css('top', $('#'+'SubsystemLinks').height() + 5 );

    //drawing parameters
    this.centerX = this.canvasWidth/2;
    this.centerY = this.canvasHeight/2;
    this.CDinnerRadius = this.canvasWidth*0.01;
    this.CDradius = this.canvasHeight*0.17;
    this.centerLeft = this.canvasWidth*0.25;
    this.centerRight = this.canvasWidth*0.75;
    this.centerTop = this.canvasHeight*0.25;
    this.centerBottom = this.canvasHeight*0.65;
    this.radialWidth = (this.CDradius - this.CDinnerRadius) / this.nRadial;
    this.azimuthalArc = 2*Math.PI / this.nAzimuthal;

    //member functions///////////////////////////////////////////////////////////////////
    this.draw = function(frame){

    	var i, x0, y0;

    	this.context.strokeStyle = '#999999';

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
	    		for(j=0; j<this.nRadial+1; j++){
    				this.context.beginPath()
    				this.context.fillStyle = '#4C4C4C';
	    			this.context.arc(x0, y0, this.CDradius - j*this.radialWidth, 0, 2*Math.PI);
	    			this.context.closePath();
    				this.context.fill();
	    			this.context.stroke();
    			}
    			
    		} else {
    
	    		for(j=0; j<this.nAzimuthal; j++){
    				this.context.beginPath()
    				this.context.fillStyle = '#4C4C4C';
    				this.context.moveTo(x0, y0);
    				this.context.lineTo(x0 + this.CDradius*Math.cos(j*this.azimuthalArc), y0 - this.CDradius*Math.sin(j*this.azimuthalArc));
    				this.context.arc(x0,y0, this.CDradius, -j*this.azimuthalArc, -(j+1)*this.azimuthalArc, true);
    				this.context.closePath();
    				this.context.fill();
	    			this.context.stroke();
    			}
    		}
    	}

		
    	//titles
        this.context.clearRect(0,0.85*this.canvasHeight,this.canvasWidth,0.15*this.canvasHeight);
        this.context.fillStyle = '#999999';
        this.context.font="24px 'Orbitron'";
        this.context.fillText('Downstream', this.centerLeft - this.context.measureText('Downstream').width/2, 0.9*this.canvasHeight);
        this.context.fillText('Upstream', this.centerRight - this.context.measureText('Upstream').width/2, 0.9*this.canvasHeight);

    };
}