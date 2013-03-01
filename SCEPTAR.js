function SCEPTAR(monitor, maxima, minima, config){
	this.monitorID = monitor;		        //div ID of wrapper div
	this.canvasID = 'SCEPTARCanvas'; 		//ID of canvas to draw top level TIGRESS view on
    this.linkWrapperID = 'SubsystemLinks';  //ID of div wrapping subsystem navigation links
    this.sidebarID = 'SubsystemSidebar';    //ID of right sidebar for this object
    this.topNavID = 'SubsystemsButton';     //ID of top level nav button
    this.TTcanvasID = 'SCEPTARTTCanvas';    //ID of hidden tooltip map canvas
    this.minima = minima;                   //array of meter minima [HV, thresholds, rate]
    this.maxima = maxima;                   //array of meter maxima, arranged as minima
    this.config = config;                   //subsystems on: [upstream sceptar, downstream sceptar, downstream ZDS]

    var that = this;
    //make a pointer at window level back to this object, so we can pass by reference to the nav button onclick
    window.SCEPTARpointer = that;

    //establish animation parameters////////////////////////////////////////////////////////////////////
    this.FPS = 30;
    this.duration = 0.5;
    this.nFrames = this.FPS*this.duration;

    //establish which canvas should be displayed when the subsystem is navigated to, as a function of which scalar button is active:
    this.view = ['SCEPTARCanvas', 'SCEPTARCanvas', 'SCEPTARCanvas'];
    //insert nav link
    insertButton('SCEPTARlink', 'navLink', "javascript:swapFade('SCEPTARlink', window.SCEPTARpointer, window.subsystemScalars, window.subdetectorView)", this.linkWrapperID, 'SCEPTAR');

    //insert & scale canvas//////////////////////////////////////////////////////////////////////////////////////
    this.monitor = document.getElementById(monitor);
    this.canvasWidth = 0.48*$(this.monitor).width();
    this.canvasHeight = 0.8*$(this.monitor).height();
    //detector view
    insertCanvas(this.canvasID, 'monitor', 'top:' + ($('#SubsystemLinks').height()*1.25 + 5) +'px;', this.canvasWidth, this.canvasHeight, monitor);
    this.canvas = document.getElementById(this.canvasID);
    this.context = this.canvas.getContext('2d');
    //hidden Tooltip map layer
    insertCanvas(this.TTcanvasID, 'monitor', 'top:' + ($('#SubsystemLinks').height()*1.25 + 5) +'px;', this.canvasWidth, this.canvasHeight, monitor);
    this.TTcanvas = document.getElementById(this.TTcanvasID);
    this.TTcontext = this.TTcanvas.getContext('2d');

    //Dirty trick to implement tooltip on obnoxious geometry: make another canvas of the same size hidden beneath, with the 
    //detector drawn on it, but with each element filled in with rgba(0,0,n,1), where n is the channel number; fetching the color from the 
    //hidden canvas at point x,y will then return the appropriate channel index.
    //paint whole hidden canvas with R!=G!=B to trigger TT suppression:
    this.TTcontext.fillStyle = 'rgba(50,100,150,1)';
    this.TTcontext.fillRect(0,0,this.canvasWidth, this.canvasHeight);
    //set up tooltip:
    this.tooltip = new Tooltip(this.canvasID, 'SCEPTARTipText', 'SCEPTARttCanv', 'SCEPTARTT', this.monitorID, prefix, postfix);
    this.tooltip.obj = that;

    //drawing parameters
    this.ZDSradius = this.canvasHeight*0.5 / 4; 
    this.ZDScenterX = this.canvasWidth*0.75;
    this.ZDScenterY = 0.4*this.canvasHeight;
    this.SCEPTARx0 = this.canvasWidth*0.1;
    this.SCEPTARy0 = this.canvasHeight*0.1;

    this.SCEPTARspoke = this.canvasHeight/5;
    this.USSCx0 = 0.25*this.canvasWidth;
    this.USSCy0 = 0.4*this.canvasHeight;
    this.DSSCx0 = 0.75*this.canvasWidth;
    this.DSSCy0 = 0.4*this.canvasHeight;

    //establish data buffers////////////////////////////////////////////////////////////////////////////
    this.rate = [];
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
            this.context.fillStyle = interpolateColor(parseHexColor(this.oldRateColor[20]), parseHexColor(this.rateColor[20]), frame/this.nFrames);
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
            this.TTcontext.fillStyle = 'rgba('+21+','+21+','+21+',1)';
            this.TTcontext.fill();
        }
    
    	//titles
        this.context.clearRect(0,this.SCEPTARy0 + 2.5*this.SCEPTARspoke + 10,this.canvasWidth,this.canvasHeight);
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
            if(context == this.context) context.fillStyle = interpolateColor(parseHexColor(this.oldRateColor[i+indexStart]), parseHexColor(this.rateColor[i+indexStart]), frame/this.nFrames);
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

        nextLine = 'Channel '+cell;

        //keep track of the longest line of text:
        longestLine = Math.max(longestLine, this.tooltip.context.measureText(nextLine).width)
        toolTipContent += nextLine;

        document.getElementById(this.tooltip.ttTextID).innerHTML = toolTipContent;

        //return length of longest line:
        return longestLine;
    };

    this.update = function(rateInfo){
        var i;
        for(i=0; i<rateInfo.length; i++){
            this.rate[i] = rateInfo[i];
            this.oldRateColor[i] = this.rateColor[i];
            this.rateColor[i] = this.parseColor(rateInfo[i]);
        }

        this.tooltip.update();
    };

    //determine which color <scalar> corresponds to
    this.parseColor = function(scalar){

        //how far along the scale are we?
        var scale = (scalar - this.minima[window.subdetectorView]) / (this.maxima[window.subdetectorView] - this.minima[window.subdetectorView]);

        //different scales for different meters to aid visual recognition:
        return colorScale(window.colorScales[window.subdetectorView],scale);
    };

    //do an initial populate:
    fetchNewSCEPTARdata(this.rate);
    this.update(this.rate);
}