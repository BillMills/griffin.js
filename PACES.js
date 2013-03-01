function PACES(monitor, minima, maxima, prefix, postfix){
	this.monitorID = monitor;		        //div ID of wrapper div
	this.HVcanvasID = 'PACESHVCanvas'; 	    //ID of canvas to draw HV view
    this.RateCanvasID = 'PACESrateCanvas';  //ID of canvas to draw rate / threshold view
    this.linkWrapperID = 'SubsystemLinks';  //ID of div wrapping subsystem navigation links
    this.sidebarID = 'SubsystemSidebar';    //ID of right sidebar for this object
    this.topNavID = 'SubsystemsButton';     //ID of top level nav button
    this.TTcanvasID = 'PACESTTCanvas';      //ID of hidden tooltip map canvas
    this.minima = minima;                   //array of meter minima [HV, thresholds, rate]
    this.maxima = maxima;                   //array of meter maxima, arranged as minima
    this.prefix = prefix;                   //array of tooltip prefixes
    this.postfix = postfix;                 //array of tooltip suffixes.

    var that = this;
    //make a pointer at window level back to this object, so we can pass by reference to the nav button onclick
    window.PACESpointer = that;

    //establish animation parameters////////////////////////////////////////////////////////////////////
    this.FPS = 30;
    this.duration = 0.5;
    this.nFrames = this.FPS*this.duration;

    //establish which canvas should be displayed when the subsystem is navigated to, as a function of which scalar button is active:
    this.view = ['PACESHVCanvas', 'PACESrateCanvas', 'PACESrateCanvas'];
    insertButton('PACESlink', 'navLink', "javascript:swapFade('PACESlink', window.PACESpointer, window.subsystemScalars, window.subdetectorView)", this.linkWrapperID, 'PACES');

    //insert & scale canvas//////////////////////////////////////////////////////////////////////////////////////
    this.monitor = document.getElementById(monitor);
    this.canvasWidth = 0.48*$(this.monitor).width();
    this.canvasHeight = 0.8*$(this.monitor).height();
    //HV view
    insertCanvas(this.HVcanvasID, 'monitor', 'top:' + ($('#SubsystemLinks').height()*1.25 + 5) +'px;', this.canvasWidth, this.canvasHeight, monitor);
    this.HVcanvas = document.getElementById(this.HVcanvasID);
    this.HVcontext = this.HVcanvas.getContext('2d');
    //Rate view
    insertCanvas(this.RateCanvasID, 'monitor', 'top:' + ($('#SubsystemLinks').height()*1.25 + 5) +'px;', this.canvasWidth, this.canvasHeight, monitor);
    this.RateCanvas = document.getElementById(this.RateCanvasID);
    this.RateContext = this.RateCanvas.getContext('2d');
    //hidden Tooltip map layer for Rate view:
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
    this.tooltip = new Tooltip(this.RateCanvasID, 'PACESTipText', 'PACESttCanv', 'PACESTT', this.monitorID, prefix, postfix);
    this.tooltip.obj = that;

    //drawing parameters
    this.centerX = this.canvasWidth/2;
    this.centerY = this.canvasHeight/2;
    this.arrayRadius = this.canvasHeight*0.3;
    this.SiLiRadius = this.canvasHeight*0.1;

    //establish data buffers////////////////////////////////////////////////////////////////////////////
    this.rate = [];
    this.rateColor = [];
    this.oldRateColor = [];

    //member functions///////////////////////////////////////////////////////////////////
    this.draw = function(frame){

    	var i;
    	this.RateContext.strokeStyle = '#999999'

        //Rate view///////////////////////////////////////
        //once for the display canvas....
    	for(i=0; i<5; i++){

    		this.RateContext.save();
    		this.RateContext.translate(this.centerX, this.centerY);
    		this.RateContext.rotate(i*Math.PI*72/180);

            this.RateContext.fillStyle = interpolateColor(parseHexColor(this.oldRateColor[2*i]), parseHexColor(this.rateColor[2*i]), frame/this.nFrames);
    		this.RateContext.beginPath();
    		this.RateContext.arc(0, -this.arrayRadius, this.SiLiRadius, 0, Math.PI);
    		this.RateContext.closePath();
            this.RateContext.fill();
    		this.RateContext.stroke();

            this.RateContext.fillStyle = interpolateColor(parseHexColor(this.oldRateColor[2*i+1]), parseHexColor(this.rateColor[2*i+1]), frame/this.nFrames);
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
            this.HVcontext.fillStyle = interpolateColor(parseHexColor(this.oldRateColor[i]), parseHexColor(this.rateColor[i]), frame/this.nFrames);

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
        //...and again for the tooltip encoding
        //TODO
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

    this.update = function(rateInfo){
        var i;
        for(i=0; i<rateInfo.length; i++){
            this.rate[i] = rateInfo[i];
            this.oldRateColor[i] = this.rateColor[i];
            this.rateColor[i] = this.parseColor(rateInfo[i]);
        }

        this.tooltip.update();
        this.displaySwitch();
    };

    //determine which color <scalar> corresponds to
    this.parseColor = function(scalar){

        //how far along the scale are we?
        var scale = (scalar - this.minima[window.subdetectorView]) / (this.maxima[window.subdetectorView] - this.minima[window.subdetectorView]);

        //different scales for different meters to aid visual recognition:
        return colorScale(window.colorScales[window.subdetectorView],scale);
    };

    //decide which display version to show:
    this.displaySwitch = function(){
        //handle putting the right canvas on top:
        if(window.subdetectorView == 0){
            if($('#'+this.RateCanvasID).css('opacity') > 0)
                swapCanv(this.HVcanvasID, this.RateCanvasID);
        } else{
            if($('#'+this.HVcanvasID).css('opacity') > 0)
                swapCanv(this.RateCanvasID, this.HVcanvasID);
        }
        //redeclare tooltip so it's pointing at the visible canvas:
        if(window.subdetectorView == 0)
            this.tooltip = new Tooltip(this.HVcanvasID, 'PACESTipText', 'PACESttCanv', 'PACESTT', this.monitorID, this.prefix, this.postfix);
        else if(window.subdetectorView == 1 || window.subdetectorView == 2)
            this.tooltip = new Tooltip(this.RateCanvasID, 'PACESTipText', 'PACESttCanv', 'PACESTT', this.monitorID, this.prefix, this.postfix);

            this.tooltip.obj = that;
    }

    //do an initial populate:
    fetchNewPACESdata(this.rate);
    this.update(this.rate);
}