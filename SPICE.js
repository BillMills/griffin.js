function SPICE(){
	this.monitorID = window.parameters.wrapper;  //div ID of wrapper div
	this.canvasID = 'SPICECanvas'; 			     //ID of canvas to draw top level TIGRESS view on
    this.linkWrapperID = 'SubsystemLinks';       //ID of div wrapping subsystem navigation links
    this.sidebarID = 'SubsystemSidebar';         //ID of right sidebar for this object
    this.topNavID = 'SubsystemsButton';          //ID of top level nav button
    this.TTcanvasID = 'SPICETTCanvas';           //ID of hidden tooltip map canvas
    this.minima = window.parameters.SPICEminima; //array of meter minima [HV, thresholds, rate]
    this.maxima = window.parameters.SPICEmaxima; //array of meter maxima, arranged as minima
    this.dataBus = new SPICEDS();

    var that = this;
    //make a pointer at window level back to this object, so we can pass by reference to the nav button onclick
    window.SPICEpointer = that;

	this.nRadial = 10;
	this.nAzimuthal = 12;

    //establish animation parameters////////////////////////////////////////////////////////////////////
    this.FPS = 30;
    this.duration = 0.5;
    this.nFrames = this.FPS*this.duration;

    //insert nav link
    insertDOM('button', 'SPICElink', 'navLink', '', this.linkWrapperID, "javascript:swapFade('SPICElink', window.SPICEpointer, window.subsystemScalars, window.subdetectorView)", 'SPICE', '', 'button')

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
    this.tooltip = new Tooltip(this.canvasID, 'SPICETipText', 'SPICEttCanv', 'SPICETT', this.monitorID, window.parameters.SPICEprefix, window.parameters.SPICEpostfix);
    this.tooltip.obj = that;

    //drawing parameters
    this.centerX = this.canvasWidth/2;
    this.centerY = this.canvasHeight/2-20;
    this.innerRadius = this.canvasHeight*0.02;
    this.outerRadius = this.canvasHeight*0.4;
    this.azimuthalStep = 2*Math.PI / this.nAzimuthal;
    this.radialStep = (this.outerRadius - this.innerRadius) / this.nRadial;
    this.scaleHeight = 80;

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
    	var i, ring, sector;

    	this.context.strokeStyle = '#999999';
    	
        //once for display canvas...
    	for(i=0; i<120; i++){
    		sector = i%12;
    		ring = Math.floor(i/12);

            if(window.subdetectorView == 0) this.context.fillStyle = interpolateColor(parseHexColor(this.oldHVcolor[i]), parseHexColor(this.HVcolor[i]), frame/this.nFrames);
            else if(window.subdetectorView == 1) this.context.fillStyle = interpolateColor(parseHexColor(this.oldThresholdColor[i]), parseHexColor(this.thresholdColor[i]), frame/this.nFrames);
            else if(window.subdetectorView == 2) this.context.fillStyle = interpolateColor(parseHexColor(this.oldRateColor[i]), parseHexColor(this.rateColor[i]), frame/this.nFrames);

		    this.context.beginPath();
		    this.context.arc(this.centerX, this.centerY, this.innerRadius + ring*this.radialStep, -sector*this.azimuthalStep, -(sector+1)*this.azimuthalStep, true);
    		this.context.lineTo(this.centerX + (this.innerRadius + (ring+1)*this.radialStep)*Math.cos(2*Math.PI - (sector+1)*this.azimuthalStep), this.centerY + (this.innerRadius + (ring+1)*this.radialStep)*Math.sin(2*Math.PI - (sector+1)*this.azimuthalStep));
	    	this.context.arc(this.centerX, this.centerY, this.innerRadius + (ring+1)*this.radialStep, - (sector+1)*this.azimuthalStep, - sector*this.azimuthalStep, false);
    		this.context.closePath();
    		this.context.fill();
    		this.context.stroke();
    	}
        //...and again for tt encoding:
        for(i=0; i<120; i++){
            sector = i%12;
            ring = Math.floor(i/12);

            this.TTcontext.fillStyle = 'rgba('+i+','+i+','+i+',1)';
            this.TTcontext.beginPath();
            this.TTcontext.arc(this.centerX, this.centerY, this.innerRadius + ring*this.radialStep, -sector*this.azimuthalStep, -(sector+1)*this.azimuthalStep, true);
            this.TTcontext.lineTo(this.centerX + (this.innerRadius + (ring+1)*this.radialStep)*Math.cos(2*Math.PI - (sector+1)*this.azimuthalStep), this.centerY + (this.innerRadius + (ring+1)*this.radialStep)*Math.sin(2*Math.PI - (sector+1)*this.azimuthalStep));
            this.TTcontext.arc(this.centerX, this.centerY, this.innerRadius + (ring+1)*this.radialStep, - (sector+1)*this.azimuthalStep, - sector*this.azimuthalStep, false);
            this.TTcontext.closePath();
            this.TTcontext.fill();
            //suppress antialiasing problems between cells:
            this.TTcontext.strokeStyle = '#123456';
            this.TTcontext.stroke();
        }

        //scale
        if(frame==this.nFrames || frame==0) this.drawScale(this.context);
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

        nextLine = this.dataBus.key[cell][0];

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

        //dummy data:
        for(i=0; i<120; i++){
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
        minTick = window.parameters.SPICEminima[window.subdetectorView] + ' ' + window.parameters.subdetectorUnit[window.subdetectorView];
        maxTick = window.parameters.SPICEmaxima[window.subdetectorView] + ' ' + window.parameters.subdetectorUnit[window.subdetectorView];

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