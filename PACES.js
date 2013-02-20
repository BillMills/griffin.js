function PACES(monitor, minima, maxima, prefix, postfix){
	this.monitorID = monitor;		        //div ID of wrapper div
	this.canvasID = 'PACESCanvas'; 			//ID of canvas to draw top level TIGRESS view on
    this.linkWrapperID = 'SubsystemLinks';  //ID of div wrapping subsystem navigation links
    this.sidebarID = 'SubsystemSidebar';    //ID of right sidebar for this object
    this.topNavID = 'SubsystemsButton';     //ID of top level nav button
    this.TTcanvasID = 'PACESTTCanvas';      //ID of hidden tooltip map canvas
    this.minima = minima;                   //array of meter minima [HV, thresholds, rate]
    this.maxima = maxima;                   //array of meter maxima, arranged as minima

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

    //hidden Tooltip map layer
    newCanvas = document.createElement('canvas');
    newCanvas.setAttribute('id', this.TTcanvasID);
    newCanvas.setAttribute('class', 'monitor');
    newCanvas.setAttribute('style', 'top:' + ($('#SubsystemLinks').height() + 5)*1.25 +'px;')
    newCanvas.setAttribute('width', this.canvasWidth);
    newCanvas.setAttribute('height', this.canvasHeight);
    document.getElementById(monitor).appendChild(newCanvas);
    this.TTcanvas = document.getElementById(this.TTcanvasID);
    this.TTcontext = this.TTcanvas.getContext('2d');
    //Dirty trick to implement tooltip on obnoxious geometry: make another canvas of the same size hidden beneath, with the 
    //detector drawn on it, but with each element filled in with rgba(0,0,n,1), where n is the channel number; fetching the color from the 
    //hidden canvas at point x,y will then return the appropriate channel index.
    //paint whole hidden canvas with R!=G!=B to trigger TT suppression:
    this.TTcontext.fillStyle = 'rgba(50,100,150,1)';
    this.TTcontext.fillRect(0,0,this.canvasWidth, this.canvasHeight);
    //set up tooltip:
    this.tooltip = new Tooltip(this.canvasID, 'PACESTipText', 'PACESttCanv', 'PACESTT', this.monitorID, prefix, postfix);
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
    	this.context.strokeStyle = '#999999'

        //once for the display canvas....
    	for(i=0; i<5; i++){
            this.context.fillStyle = interpolateColor(parseHexColor(this.oldRateColor[i]), parseHexColor(this.rateColor[i]), frame/this.nFrames);

    		this.context.save();
    		this.context.translate(this.centerX, this.centerY);
    		this.context.rotate(i*Math.PI*72/180);
    		this.context.beginPath();
    		this.context.arc(0, -this.arrayRadius, this.SiLiRadius, 0, 2*Math.PI);
    		this.context.closePath();
            this.context.fill();
    		this.context.stroke();
    		this.context.restore();
    	}
        //...and again for the tooltip encoding
        for(i=0; i<5; i++){
            this.TTcontext.fillStyle = 'rgba('+i+','+i+','+i+',1)';
            this.TTcontext.save();
            this.TTcontext.translate(this.centerX, this.centerY);
            this.TTcontext.rotate(i*Math.PI*72/180);
            this.TTcontext.beginPath();
            this.TTcontext.arc(0, -this.arrayRadius, this.SiLiRadius, 0, 2*Math.PI);
            this.TTcontext.closePath();
            this.TTcontext.fill();
            this.TTcontext.restore();
        }

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
}