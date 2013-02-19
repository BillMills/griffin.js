function DANTE(monitor){
	this.monitorID = monitor;		        //div ID of wrapper div
	this.canvasID = 'DANTECanvas'; 			//ID of canvas to draw top level TIGRESS view on
    this.linkWrapperID = 'SubsystemLinks';  //ID of div wrapping subsystem navigation links
    this.sidebarID = 'SubsystemSidebar';    //ID of right sidebar for this object
    this.topNavID = 'SubsystemsButton';     //ID of top level nav button

    var that = this;
    //make a pointer at window level back to this object, so we can pass by reference to the nav button onclick
    window.DANTEpointer = that;

    //establish animation parameters////////////////////////////////////////////////////////////////////
    this.FPS = 30;
    this.duration = 0.5;
    this.nFrames = this.FPS*this.duration;

    //insert navigation/////////////////////////////////////////////////////////////////////////////////
    var newButton = document.createElement('button');
    newButton.setAttribute('id', 'DANTElink');
    newButton.setAttribute('class', 'navLink');
    newButton.setAttribute('type', 'button');
    newButton.setAttribute('onclick', "javascript:swapFade('DANTECanvas', 'DANTElink', window.DANTEpointer)");
    document.getElementById(this.linkWrapperID).appendChild(newButton);
    document.getElementById('DANTElink').innerHTML = 'DANTE';
    
    //insert & scale canvas//////////////////////////////////////////////////////////////////////////////////////
    this.monitor = document.getElementById(monitor);
    this.canvasWidth = 0.48*$(this.monitor).width();
    this.canvasHeight = 0.8*$(this.monitor).height();
    var newCanvas = document.createElement('canvas');
    newCanvas.setAttribute('id', this.canvasID);
    newCanvas.setAttribute('class', 'monitor');
    newCanvas.setAttribute('style', 'top:' + ($('#SubsystemLinks').height() + 5)*1.25 +'px;')
    newCanvas.setAttribute('width', this.canvasWidth);
    newCanvas.setAttribute('height', this.canvasHeight);
    document.getElementById(monitor).appendChild(newCanvas);
    this.canvas = document.getElementById(this.canvasID);
    this.context = this.canvas.getContext('2d');

    //drawing parameters
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

    	var j, ringCenter, x0, y0;
    	this.context.strokeStyle = '#999999';

    	this.context.beginPath();
    	this.context.arc(this.leftRingCenter, this.canvasHeight*0.4, this.ringRadius, 0, 2*Math.PI);
    	this.context.stroke();
    	this.context.beginPath();
    	this.context.arc(this.rightRingCenter, this.canvasHeight*0.4, this.ringRadius, 0, 2*Math.PI);
    	this.context.stroke();

    	for(j=0; j<8; j++){
    		if(j<4) ringCenter = this.leftRingCenter;
    		else ringCenter = this.rightRingCenter;

    		x0 = ringCenter + this.ringRadius*Math.cos(Math.PI/2*j);
    		y0 = this.canvasHeight*0.4 - this.ringRadius*Math.sin(Math.PI/2*j);

    		this.context.fillStyle = '#4C4C4C';
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

    		this.context.fillStyle = '#4C4C4C';
    		this.context.beginPath();
    		this.context.arc(x0,y0,this.detectorRadius,0,2*Math.PI);
    		this.context.closePath();
    		this.context.fill();    		
    		this.context.stroke();

    	}
		
    	//titles
        this.context.clearRect(0,0.75*this.canvasHeight,this.canvasWidth,0.35*this.canvasHeight);
        this.context.fillStyle = '#999999';
        this.context.font="24px 'Orbitron'";
        this.context.fillText('West Ring', this.leftRingCenter - this.context.measureText('West Ring').width/2, 0.8*this.canvasHeight);
        this.context.fillText('East Ring', this.rightRingCenter - this.context.measureText('East Ring').width/2, 0.8*this.canvasHeight);

    };
}