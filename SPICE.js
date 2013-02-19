function SPICE(monitor){
	this.monitorID = monitor;		        //div ID of wrapper div
	this.canvasID = 'SPICECanvas'; 			//ID of canvas to draw top level TIGRESS view on
    this.linkWrapperID = 'SubsystemLinks';  //ID of div wrapping subsystem navigation links
    this.sidebarID = 'SubsystemSidebar';    //ID of right sidebar for this object
    this.topNavID = 'SubsystemsButton';     //ID of top level nav button

    var that = this;
    //make a pointer at window level back to this object, so we can pass by reference to the nav button onclick
    window.SPICEpointer = that;

	this.nRadial = 10;
	this.nAzimuthal = 12;

    //establish animation parameters////////////////////////////////////////////////////////////////////
    this.FPS = 30;
    this.duration = 0.5;
    this.nFrames = this.FPS*this.duration;

    //insert navigation/////////////////////////////////////////////////////////////////////////////////
    var newButton = document.createElement('button');
    newButton.setAttribute('id', 'SPICElink');
    newButton.setAttribute('class', 'navLink');
    newButton.setAttribute('type', 'button');
    newButton.setAttribute('onclick', "javascript:swapFade('SPICECanvas', 'SPICElink', window.SPICEpointer)");
    document.getElementById(this.linkWrapperID).appendChild(newButton);
    document.getElementById('SPICElink').innerHTML = 'SPICE';

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
    this.innerRadius = this.canvasHeight*0.02;
    this.outerRadius = this.canvasHeight*0.4;
    this.azimuthalStep = 2*Math.PI / this.nAzimuthal;
    this.radialStep = (this.outerRadius - this.innerRadius) / this.nRadial;



    //member functions///////////////////////////////////////////////////////////////////
    this.draw = function(frame){
    	var i, ring, sector;

    	this.context.strokeStyle = '#999999';
    	
    	for(i=0; i<120; i++){
    		sector = i%12;
    		ring = Math.floor(i/12);
    		this.context.fillStyle = '#4C4C4C';

		    this.context.beginPath();
		    this.context.arc(this.centerX, this.centerY, this.innerRadius + ring*this.radialStep, -sector*this.azimuthalStep, -(sector+1)*this.azimuthalStep, true);
    		this.context.lineTo(this.centerX + (this.innerRadius + (ring+1)*this.radialStep)*Math.cos(2*Math.PI - (sector+1)*this.azimuthalStep), this.centerY + (this.innerRadius + (ring+1)*this.radialStep)*Math.sin(2*Math.PI - (sector+1)*this.azimuthalStep));
	    	this.context.arc(this.centerX, this.centerY, this.innerRadius + (ring+1)*this.radialStep, - (sector+1)*this.azimuthalStep, - sector*this.azimuthalStep, false);
    		this.context.closePath();
    		this.context.fill();
    		this.context.stroke();
    	}



    

/*
		
    	//titles
        this.context.clearRect(0,this.SCEPTARy0 + 4*this.cellSide + 10,this.canvasWidth,this.canvasHeight);
        this.context.fillStyle = '#999999';
        this.context.font="24px 'Orbitron'";
        this.context.fillText('SCEPTAR', this.SCEPTARx0 + 2.5*this.cellSide - this.context.measureText('SCEPTAR').width/2, this.SCEPTARy0 + 4*this.cellSide + 50);
        this.context.clearRect(this.SCEPTARx0 + 5*this.cellSide+20, this.SCEPTARy0 + 2*this.cellSide + 2*this.ZDSradius+10, this.canvasWidth,this.canvasHeight);
        this.context.fillText('ZDS', this.ZDScenter - this.context.measureText('ZDS').width/2, this.SCEPTARy0 + 2*this.cellSide + 2*this.ZDSradius+50);
*/	
    };
}