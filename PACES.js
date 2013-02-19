function PACES(monitor){
	this.monitorID = monitor;		        //div ID of wrapper div
	this.canvasID = 'PACESCanvas'; 			//ID of canvas to draw top level TIGRESS view on
    this.linkWrapperID = 'SubsystemLinks';  //ID of div wrapping subsystem navigation links
    this.sidebarID = 'SubsystemSidebar';    //ID of right sidebar for this object
    this.topNavID = 'SubsystemsButton';     //ID of top level nav button

    var that = this;
    //make a pointer at window level back to this object, so we can pass by reference to the nav button onclick
    window.PACESpointer = that;

    //establish animation parameters////////////////////////////////////////////////////////////////////
    this.FPS = 30;
    this.duration = 0.5;
    this.nFrames = this.FPS*this.duration;

    //insert navigation/////////////////////////////////////////////////////////////////////////////////
    var newButton = document.createElement('button');
    newButton.setAttribute('id', 'PACESlink');
    newButton.setAttribute('class', 'navLink');
    newButton.setAttribute('type', 'button');
    newButton.setAttribute('onclick', "javascript:swapFade('PACESCanvas', 'PACESlink', window.PACESpointer)");
    document.getElementById(this.linkWrapperID).appendChild(newButton);
    document.getElementById('PACESlink').innerHTML = 'PACES';

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
    this.arrayRadius = this.canvasHeight*0.3;
    this.SiLiRadius = this.canvasHeight*0.1;

    //member functions///////////////////////////////////////////////////////////////////
    this.draw = function(frame){

    	var i;
    	this.context.strokeStyle = '#999999'

    	for(i=0; i<5; i++){
    		this.context.save();
    		this.context.translate(this.centerX, this.centerY);
    		this.context.rotate(i*Math.PI*72/180);
    		this.context.beginPath();
    		this.context.arc(0, -this.arrayRadius, this.SiLiRadius, 0, 2*Math.PI);
    		this.context.closePath();
    		this.context.stroke();
    		this.context.restore();
    	}

    };
}