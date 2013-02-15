function SCEPTAR(monitor){
	this.monitorID = monitor;		        //div ID of wrapper div
	this.canvasID = 'SCEPTARCanvas'; 		//ID of canvas to draw top level TIGRESS view on

    //establish animation parameters////////////////////////////////////////////////////////////////////
    this.FPS = 30;
    this.duration = 0.5;
    this.nFrames = this.FPS*this.duration;

    //insert & scale canvas//////////////////////////////////////////////////////////////////////////////////////
    this.monitor = document.getElementById(monitor);
    this.canvasWidth = 0.48*$(this.monitor).width();
    this.canvasHeight = 0.8*$(this.monitor).height();
    var newCanvas = document.createElement('canvas');
    newCanvas.setAttribute('id', this.canvasID);
    newCanvas.setAttribute('class', 'monitor');
    newCanvas.setAttribute('style', 'top:' + ($('#SubsystemLinks').height() + 5) +'px;')
    newCanvas.setAttribute('width', this.canvasWidth);
    newCanvas.setAttribute('height', this.canvasHeight);
    document.getElementById(monitor).appendChild(newCanvas);
    this.canvas = document.getElementById(this.canvasID);
    this.context = this.canvas.getContext('2d');

    //drawing parameters
    this.centerX = this.canvasWidth/2;
    this.centerY = this.canvasHeight/2;
    this.cellSide = this.canvasHeight*0.5 / 4;
    this.ZDSradius = this.cellSide;
    this.ZDScenter = this.canvasWidth*0.8;
    this.SCEPTARx0 = this.canvasWidth*0.1;
    this.SCEPTARy0 = this.canvasHeight*0.1;

    //member functions///////////////////////////////////////////////////////////////////
    this.draw = function(frame){
    	var i, row, col;

    	//SCEPTAR
    	this.context.strokeStyle = '#999999';
    	this.context.fillStyle = '#4C4C4C';
    	for(i=0; i<20; i++){
    		row = Math.floor(i/5);
    		col = i%5;
    		this.context.fillRect(this.SCEPTARx0 + this.cellSide*col, this.SCEPTARy0 + this.cellSide*row, this.cellSide, this.cellSide);
    		this.context.strokeRect(this.SCEPTARx0 + this.cellSide*col, this.SCEPTARy0 + this.cellSide*row, this.cellSide, this.cellSide);	
    	}

    	//ZDS
    	this.context.beginPath();
    	this.context.arc(this.ZDScenter, this.SCEPTARy0 + 2*this.cellSide, this.ZDSradius, 0, 2*Math.PI);
    	this.context.closePath();
    	this.context.fill();
    	this.context.stroke();



    


		
    	//titles
        this.context.clearRect(0,this.SCEPTARy0 + 4*this.cellSide + 10,this.canvasWidth,this.canvasHeight);
        this.context.fillStyle = '#999999';
        this.context.font="24px 'Orbitron'";
        this.context.fillText('SCEPTAR', this.SCEPTARx0 + 2.5*this.cellSide - this.context.measureText('SCEPTAR').width/2, this.SCEPTARy0 + 4*this.cellSide + 50);
        this.context.clearRect(this.SCEPTARx0 + 5*this.cellSide+20, this.SCEPTARy0 + 2*this.cellSide + 2*this.ZDSradius+10, this.canvasWidth,this.canvasHeight);
        this.context.fillText('ZDS', this.ZDScenter - this.context.measureText('ZDS').width/2, this.SCEPTARy0 + 2*this.cellSide + 2*this.ZDSradius+50);
	
    };
}