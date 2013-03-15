function PACES(){
	this.monitorID = window.parameters.wrapper; //div ID of wrapper div
	this.HVcanvasID = 'PACESHVCanvas'; 	        //ID of canvas to draw HV view
    this.RateCanvasID = 'PACESrateCanvas';      //ID of canvas to draw rate / threshold view
    this.linkWrapperID = 'SubsystemLinks';      //ID of div wrapping subsystem navigation links
    this.sidebarID = 'SubsystemSidebar';        //ID of right sidebar for this object
    this.topNavID = 'SubsystemsButton';         //ID of top level nav button
    this.TTcanvasID = 'PACESTTCanvas';          //ID of hidden tooltip map canvas
    this.minima = window.parameters.PACESminima;//array of meter minima [HV, thresholds, rate]
    this.maxima = window.parameters.PACESmaxima;//array of meter maxima, arranged as minima
    this.dataBus = new PACESDS();           

    var that = this;
    //make a pointer at window level back to this object, so we can pass by reference to the nav button onclick
    window.PACESpointer = that;

    //establish animation parameters////////////////////////////////////////////////////////////////////
    this.FPS = 30;
    this.duration = 0.5;
    this.nFrames = this.FPS*this.duration;

    insertButton('PACESlink', 'navLink', "javascript:swapFade('PACESlink', window.PACESpointer, window.subsystemScalars, window.subdetectorView)", this.linkWrapperID, 'PACES');

    //insert & scale canvas//////////////////////////////////////////////////////////////////////////////////////
    this.monitor = document.getElementById(this.monitorID);
    this.canvasWidth = 0.48*$(this.monitor).width();
    this.canvasHeight = 0.8*$(this.monitor).height();
    //HV view
    insertCanvas(this.HVcanvasID, 'monitor', 'top:' + ($('#SubsystemLinks').height()*1.25 + 5) +'px;', this.canvasWidth, this.canvasHeight, this.monitorID);
    this.HVcanvas = document.getElementById(this.HVcanvasID);
    this.HVcontext = this.HVcanvas.getContext('2d');
    //Rate view
    insertCanvas(this.RateCanvasID, 'monitor', 'top:' + ($('#SubsystemLinks').height()*1.25 + 5) +'px;', this.canvasWidth, this.canvasHeight, this.monitorID);
    this.RateCanvas = document.getElementById(this.RateCanvasID);
    this.RateContext = this.RateCanvas.getContext('2d');
    //hidden Tooltip map layer
    insertCanvas(this.TTcanvasID, 'monitor', 'top:' + ($('#SubsystemLinks').height()*1.25 + 5) +'px;', this.canvasWidth, this.canvasHeight, this.monitorID);
    this.TTcanvas = document.getElementById(this.TTcanvasID);
    this.TTcontext = this.TTcanvas.getContext('2d');

    //Dirty trick to implement tooltip on obnoxious geometry: make another canvas of the same size hidden beneath, with the 
    //detector drawn on it, but with each element filled in with rgba(0,0,n,1), where n is the channel number; fetching the color from the 
    //hidden canvas at point x,y will then return the appropriate channel index.
    //paint whole hidden canvas with R!=G!=B to trigger TT suppression:
    this.TTcontext.fillStyle = 'rgba(50,100,150,1)';
    this.TTcontext.fillRect(0,0,this.canvasWidth, this.canvasHeight);

    //set up tooltip:
    this.RateTooltip = new Tooltip(this.RateCanvasID, 'PACESTipText', 'PACESttCanv', 'PACESTT', this.monitorID, window.parameters.PACESprefix, window.parameters.PACESpostfix);
    this.HVTooltip =  new Tooltip(this.HVcanvasID, 'PACESTipTextHV', 'PACESttCanvHV', 'PACESTTHV', this.monitorID, window.parameters.PACESprefix, window.parameters.PACESpostfix);
    this.RateTooltip.obj = that;
    this.HVTooltip.obj = that;
    this.tooltip = this.RateTooltip;

    //drawing parameters
    this.scaleHeight = 80;
    this.centerX = this.canvasWidth/2;
    this.centerY = this.canvasHeight*0.45;
    this.arrayRadius = this.canvasHeight*0.3;
    this.SiLiRadius = this.canvasHeight*0.1;

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
        if(window.subdetectorView == 0)
            return this.HVcanvasID;
        else if(window.subdetectorView == 1 || window.subdetectorView == 2)
            return this.RateCanvasID;
    }

    this.draw = function(frame){

    	var i;
    	this.RateContext.strokeStyle = '#999999'

        //Thresholds & Rate view///////////////////////////////////////
        //once for the display canvas....
    	for(i=0; i<5; i++){

    		this.RateContext.save();
    		this.RateContext.translate(this.centerX, this.centerY);
    		this.RateContext.rotate(i*Math.PI*72/180);

            if(window.subdetectorView == 1) this.RateContext.fillStyle = interpolateColor(parseHexColor(this.oldThresholdColor[2*i]), parseHexColor(this.thresholdColor[2*i]), frame/this.nFrames);
            else if(window.subdetectorView == 2) this.RateContext.fillStyle = interpolateColor(parseHexColor(this.oldRateColor[2*i]), parseHexColor(this.rateColor[2*i]), frame/this.nFrames);
    		this.RateContext.beginPath();
    		this.RateContext.arc(0, -this.arrayRadius, this.SiLiRadius, 0, Math.PI);
    		this.RateContext.closePath();
            this.RateContext.fill();
    		this.RateContext.stroke();

            if(window.subdetectorView == 1) this.RateContext.fillStyle = interpolateColor(parseHexColor(this.oldThresholdColor[2*i+1]), parseHexColor(this.thresholdColor[2*i+1]), frame/this.nFrames);
            else if(window.subdetectorView == 2) this.RateContext.fillStyle = interpolateColor(parseHexColor(this.oldRateColor[2*i+1]), parseHexColor(this.rateColor[2*i+1]), frame/this.nFrames);
            this.RateContext.beginPath();
            this.RateContext.arc(0, -this.arrayRadius, this.SiLiRadius, Math.PI, 0);
            this.RateContext.closePath();
            this.RateContext.fill();
            this.RateContext.stroke();

    		this.RateContext.restore();
    	}
        //...and again for the tooltip encoding
        for(i=0; i<5; i++){
            this.TTcontext.save();
            this.TTcontext.translate(this.centerX, this.centerY);
            this.TTcontext.rotate(i*Math.PI*72/180);

            this.TTcontext.fillStyle = 'rgba('+(2*i)+','+(2*i)+','+(2*i)+',1)';
            this.TTcontext.beginPath();
            this.TTcontext.arc(0, -this.arrayRadius, this.SiLiRadius, 0, Math.PI);
            this.TTcontext.closePath();
            this.TTcontext.fill();

            this.TTcontext.fillStyle = 'rgba('+(2*i+1)+','+(2*i+1)+','+(2*i+1)+',1)';
            this.TTcontext.beginPath();
            this.TTcontext.arc(0, -this.arrayRadius, this.SiLiRadius, Math.PI, 0);
            this.TTcontext.closePath();
            this.TTcontext.fill();

            this.TTcontext.restore();

        }

        //HV view///////////////////////////////////////////
        for(i=0; i<5; i++){
            this.HVcontext.fillStyle = interpolateColor(parseHexColor(this.oldHVcolor[i]), parseHexColor(this.HVcolor[i]), frame/this.nFrames);
            this.HVcontext.save();
            this.HVcontext.translate(this.centerX, this.centerY);
            this.HVcontext.rotate(i*Math.PI*72/180);
            this.HVcontext.beginPath();
            this.HVcontext.arc(0, -this.arrayRadius, this.SiLiRadius, 0, 2*Math.PI);
            this.HVcontext.closePath();
            this.HVcontext.fill();
            this.HVcontext.stroke();
            this.HVcontext.restore();
        }

        if(frame==this.nFrames || frame==0) {
            //scale
            this.drawScale(this.HVcontext);
            this.drawScale(this.RateContext);
        }
    };

    this.findCell = function(x, y){
        var imageData = this.TTcontext.getImageData(x,y,1,1);
        var index = -1;
        if(imageData.data[0] == imageData.data[1] && imageData.data[0] == imageData.data[2]) index = imageData.data[0];
        //different behvior for rate VS. HV views:
        if(window.onDisplay == this.RateCanvasID || index == -1)
            return index;
        else if(window.onDisplay == this.HVcanvasID)
            return Math.floor(index/2);
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
        this.displaySwitch();
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

    //decide which display version to show:
    this.displaySwitch = function(){
        //handle putting the right canvas on top:
        if(window.subdetectorView == 0){
            if($('#'+this.RateCanvasID).css('opacity') > 0){
                swapCanv(this.HVcanvasID, this.RateCanvasID);
                this.tooltip = this.HVTooltip;
            }
        } else{
            if($('#'+this.HVcanvasID).css('opacity') > 0){
                swapCanv(this.RateCanvasID, this.HVcanvasID);
                this.tooltip = this.RateTooltip;
            }
        }

    };

    this.fetchNewData = function(){
        var i;

        //dummy data:
        for(i=0; i<5; i++){
            this.dataBus.HV[i] = Math.random();
        }
        for(i=0; i<10; i++){
            this.dataBus.thresholds[i] = Math.random();
            this.dataBus.rate[i] = Math.random();
        }

    };

    this.animate = function(){
        if(window.onDisplay == this.RateCanvasID || window.onDisplay == this.HVcanvasID || window.freshLoad) animate(this, 0);
        else this.draw(this.nFrames);
    };

    this.drawScale = function(context){
        var i, j; 
        context.clearRect(0, this.canvasHeight - this.scaleHeight, this.canvasWidth, this.canvasHeight);

        var title, minTick, maxTick;
        title = window.parameters.monitorValues[window.subdetectorView];
        minTick = window.parameters.PACESminima[window.subdetectorView] + ' ' + window.parameters.subdetectorUnit[window.subdetectorView];
        maxTick = window.parameters.PACESmaxima[window.subdetectorView] + ' ' + window.parameters.subdetectorUnit[window.subdetectorView];

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