function SCEPTAR(){
	this.monitorID = window.parameters.wrapper;     //div ID of wrapper div
	this.canvasID = 'SCEPTARCanvas'; 		        //ID of canvas to draw top level TIGRESS view on
    this.linkWrapperID = 'SubsystemLinks';          //ID of div wrapping subsystem navigation links
    this.sidebarID = 'SubsystemSidebar';            //ID of right sidebar for this object
    this.topNavID = 'SubsystemsButton';             //ID of top level nav button
    this.TTcanvasID = 'SCEPTARTTCanvas';            //ID of hidden tooltip map canvas
    this.config = window.parameters.SCEPTARconfig;  //subsystems on: [upstream sceptar, downstream sceptar, downstream ZDS]
    this.dataBus = new SCEPTARDS();
    this.subviewLink = 'SCEPTARlink';                   //ID of inter-subsystem nav button

    var that = this;
    //make a pointer at window level back to this object, so we can pass by reference to the nav button onclick
    window.SCEPTARpointer = that;

    //establish animation parameters////////////////////////////////////////////////////////////////////
    this.FPS = 30;
    this.duration = 0.5;
    this.nFrames = this.FPS*this.duration;

    //insert nav link
    insertDOM('button', 'SCEPTARlink', 'navLink', '', this.linkWrapperID, "javascript:swapFade('SCEPTARlink', window.SCEPTARpointer, window.subsystemScalars, window.subdetectorView)", 'SCEPTAR', '', 'button')

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
    this.tooltip = new Tooltip(this.canvasID, 'SCEPTARTipText', 'SCEPTARttCanv', 'SCEPTARTT', this.monitorID, window.parameters.SCEPTARprefix, window.parameters.SCEPTARpostfix);
    this.tooltip.obj = that;

    //drawing parameters
    this.scaleHeight = 80;
    this.ZDSradius = this.canvasHeight*0.5 / 4; 
    this.ZDScenterX = this.canvasWidth*0.5 + Math.max(this.config[0], this.config[1])*this.canvasWidth*0.25;
    this.ZDScenterY = 0.4*this.canvasHeight;
    this.SCEPTARx0 = this.canvasWidth*0.1;
    this.SCEPTARy0 = this.canvasHeight*0.1;

    this.SCEPTARspoke = this.canvasHeight/5;
    this.USSCx0 = 0.25*this.canvasWidth;
    this.USSCy0 = 0.4*this.canvasHeight;
    this.DSSCx0 = 0.75*this.canvasWidth;
    this.DSSCy0 = 0.4*this.canvasHeight;

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
            if(window.subdetectorView == 0) this.context.fillStyle = interpolateColor(parseHexColor(this.oldHVcolor[20]), parseHexColor(this.HVcolor[20]), frame/this.nFrames);
            else if(window.subdetectorView == 1) this.context.fillStyle = interpolateColor(parseHexColor(this.oldThresholdColor[20]), parseHexColor(this.thresholdColor[20]), frame/this.nFrames);
            else if(window.subdetectorView == 2) this.context.fillStyle = interpolateColor(parseHexColor(this.oldRateColor[20]), parseHexColor(this.rateColor[20]), frame/this.nFrames);
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
            this.TTcontext.fillStyle = 'rgba('+20+','+20+','+20+',1)';
            this.TTcontext.fill();
        }
    
    	//titles
        this.context.clearRect(0,this.SCEPTARy0 + 2.5*this.SCEPTARspoke + 10,this.canvasWidth,this.canvasHeight - (this.scaleHeight+this.SCEPTARy0 + 2.5*this.SCEPTARspoke + 10));
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

        //scale
        if(frame==this.nFrames || frame==0) this.drawScale(this.context);
	
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
            if(context == this.context){
                if(window.subdetectorView == 0) context.fillStyle = interpolateColor(parseHexColor(this.oldHVcolor[i+indexStart]), parseHexColor(this.HVcolor[i+indexStart]), frame/this.nFrames);
                else if(window.subdetectorView == 1) context.fillStyle = interpolateColor(parseHexColor(this.oldThresholdColor[i+indexStart]), parseHexColor(this.thresholdColor[i+indexStart]), frame/this.nFrames);
                else if(window.subdetectorView == 2) context.fillStyle = interpolateColor(parseHexColor(this.oldRateColor[i+indexStart]), parseHexColor(this.rateColor[i+indexStart]), frame/this.nFrames);
            }
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
            if(i==20)
                this.HVcolor[i] = this.parseColor(this.dataBus.HV[i], 'ZDS');
            else 
                this.HVcolor[i] = this.parseColor(this.dataBus.HV[i], 'SCEPTAR');
        }
        for(i=0; i<this.dataBus.thresholds.length; i++){
            this.oldThresholdColor[i] = this.thresholdColor[i];
            if(i==20)  
                this.thresholdColor[i] = this.parseColor(this.dataBus.thresholds[i], 'ZDS');
            else 
                this.thresholdColor[i] = this.parseColor(this.dataBus.thresholds[i], 'SCEPTAR');
        }
        for(i=0; i<this.dataBus.rate.length; i++){
            this.oldRateColor[i] = this.rateColor[i];
            if(i==20)
                this.rateColor[i] = this.parseColor(this.dataBus.rate[i], 'ZDS');
            else
                this.rateColor[i] = this.parseColor(this.dataBus.rate[i], 'SCEPTAR');
        }

        this.tooltip.update();
    };

    //determine which color <scalar> corresponds to
    this.parseColor = function(scalar, detectorType){

        //how far along the scale are we?
        var scale;
        if(detectorType == 'SCEPTAR')
            scale = (scalar - window.parameters.SCEPTARminima[window.subdetectorView]) / (window.parameters.SCEPTARmaxima[window.subdetectorView] - window.parameters.SCEPTARminima[window.subdetectorView]);
        else if(detectorType == 'ZDS')
            scale = (scalar - window.parameters.ZDSminima[window.subdetectorView]) / (window.parameters.ZDSmaxima[window.subdetectorView] - window.parameters.ZDSminima[window.subdetectorView]);

        //different scales for different meters to aid visual recognition:
        if(window.subdetectorView==0) return scalepickr(scale, 'rainbow');
        else if(window.subdetectorView==1) return scalepickr(scale, 'twighlight');
        else if(window.subdetectorView==2) return scalepickr(scale, 'thermalScope');
    };

    this.fetchNewData = function(){
        var i;

        //dummy data:
        for(i=0; i<21; i++){
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

        var title, SCEPTARminTick, SCEPTARmaxTick, ZDSminTick, ZDSmaxTick;
        title = window.parameters.monitorValues[window.subdetectorView];
        SCEPTARminTick = 'SCEPTAR: ' + window.parameters.SCEPTARminima[window.subdetectorView] + ' ' + window.parameters.subdetectorUnit[window.subdetectorView];
        SCEPTARmaxTick = 'SCEPTAR: ' + window.parameters.SCEPTARmaxima[window.subdetectorView] + ' ' + window.parameters.subdetectorUnit[window.subdetectorView];
        ZDSminTick = 'ZDS: ' + window.parameters.ZDSminima[window.subdetectorView] + ' ' + window.parameters.subdetectorUnit[window.subdetectorView];
        ZDSmaxTick = 'ZDS: ' + window.parameters.ZDSmaxima[window.subdetectorView] + ' ' + window.parameters.subdetectorUnit[window.subdetectorView];

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
        if(this.config[0] || this.config[1]) context.fillText(SCEPTARminTick, this.canvasWidth*0.05 - context.measureText(SCEPTARminTick).width/2, this.canvasHeight-15);
        if(this.config[2]) context.fillText(ZDSminTick, this.canvasWidth*0.05 - context.measureText(ZDSminTick).width/2, this.canvasHeight-15+12*Math.max(this.config[0],this.config[1]));

        context.beginPath();
        context.moveTo(this.canvasWidth*0.95-1, this.canvasHeight - 40);
        context.lineTo(this.canvasWidth*0.95-1, this.canvasHeight - 30); 
        context.stroke();      
        if(this.config[0] || this.config[1]) context.fillText(SCEPTARmaxTick, this.canvasWidth*0.95 - context.measureText(SCEPTARmaxTick).width/2, this.canvasHeight-15);
        if(this.config[2]) context.fillText(ZDSmaxTick, this.canvasWidth*0.95 - context.measureText(ZDSmaxTick).width/2, this.canvasHeight-15+12*Math.max(this.config[0],this.config[1]));

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