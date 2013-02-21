function HPGE(monitor, enableBGO, minima, maxima, prefix, postfix){

	this.monitorID = monitor;		                //div ID of wrapper div
	this.canvasID = 'HPGECanvas'; 			        //ID of canvas to draw top level TIGRESS view on
	this.detailCanvasID = 'HPGEdetailCanvas';		//ID of canvas to draw single HPGE view on
    this.enableBGO = enableBGO;                     //are BGO suppressors present?
    this.linkWrapperID = 'SubsystemLinks';          //ID of div wrapping subsystem navigation links
    this.sidebarID = 'SubsystemSidebar';            //ID of right sidebar for this object
    this.topNavID = 'SubsystemsButton';             //ID of top level nav button
    this.TTcanvasID = 'HPGETTCanvas';               //ID of hidden tooltip map canvas
    this.minima = minima;                           //array of scale minima: [HPGE HV, HPGE Thresholds, HPGE Rate...]
    this.maxima = maxima;                           //array of scale maxima, arranged as minima.

    var that = this;
    //make a pointer at window level back to this object, so we can pass by reference to the nav button onclick
    window.HPGEpointer = that;

    //establish animation parameters////////////////////////////////////////////////////////////////////
    this.FPS = 30;
    this.duration = 0.5;
    this.nFrames = this.FPS*this.duration;

    //insert nav link
    insertButton('HPGElink', 'navLink', "javascript:swapFade('HPGECanvas', 'HPGElink', window.HPGEpointer)", this.linkWrapperID, 'HPGE');

    //insert & scale canvas//////////////////////////////////////////////////////////////////////////////////////
    this.monitor = document.getElementById(monitor);
    this.canvasWidth = 0.48*$(this.monitor).width();
    this.canvasHeight = 0.8*$(this.monitor).height();
    //top level
    insertCanvas(this.canvasID, 'monitor', 'top:' + ($('#SubsystemLinks').height()*1.25 + 5) +'px;', this.canvasWidth, this.canvasHeight, monitor);
    this.canvas = document.getElementById(this.canvasID);
    this.context = this.canvas.getContext('2d');
    //detail level
    insertCanvas(this.detailCanvasID, 'monitor', 'top:' + ($('#SubsystemLinks').height()*1.25 + 5) +'px;', this.canvasWidth, this.canvasHeight, monitor);
    this.detailCanvas = document.getElementById(this.detailCanvasID);
    this.detailContext = this.detailCanvas.getContext('2d');
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
    this.tooltip = new Tooltip(this.canvasID, 'HPGETipText', 'HPGEttCanv', 'HPGETT', this.monitorID, prefix, postfix);
    this.tooltip.obj = that;

    //drawing parameters/////////////////////////////////////////////////////////////////////////////////////////////
    this.centerX = this.canvasWidth/2;
    this.centerY = this.canvasHeight/2;
    this.lineWeight = 2;

    //summary view
    this.BGOouter = 0.08*this.canvasWidth;
    this.BGOinner = 2/3*this.BGOouter;
    if(this.enableBGO == 1)
        this.HPGEside = 0.4*this.BGOouter;
    else 
        this.HPGEside = this.BGOouter;
    //establish coords of each detector summary; start array index at 1 to correspond to actual detector numbering in TIGRESS:
    this.firstRow = this.canvasHeight*0.05;
    this.secondRow = this.canvasHeight*0.2;
    this.thirdRow = this.canvasHeight*0.35;
    this.fourthRow = this.canvasHeight*0.5;
    this.firstCol = this.canvasWidth*0.185;
    this.secondCol = this.canvasWidth*0.285;
    this.thirdCol = this.canvasWidth*0.385;
    this.fourthCol = this.canvasWidth*0.585;
    this.fifthCol = this.canvasWidth*0.685;
    this.sixthCol = this.canvasWidth*0.785;
    this.summaryCoord = [];
    this.summaryCoord[1] = [this.thirdCol, this.secondRow, 'north'];
    this.summaryCoord[2] = [this.fourthCol, this.firstRow, 'south'];
    this.summaryCoord[3] = [this.fourthCol, this.thirdRow, 'south'];
    this.summaryCoord[4] = [this.thirdCol, this.fourthRow, 'north'];
    this.summaryCoord[5] = [this.secondCol, this.secondRow, 'north'];
    this.summaryCoord[6] = [this.secondCol, this.firstRow, 'north'];
    this.summaryCoord[7] = [this.fifthCol, this.firstRow, 'south'];
    this.summaryCoord[8] = [this.fifthCol, this.secondRow, 'south'];
    this.summaryCoord[9] = [this.fifthCol, this.thirdRow, 'south'];
    this.summaryCoord[10] = [this.fifthCol, this.fourthRow, 'south'];
    this.summaryCoord[11] = [this.secondCol, this.fourthRow, 'north'];
    this.summaryCoord[12] = [this.secondCol, this.thirdRow, 'north'];
    this.summaryCoord[13] = [this.firstCol, this.secondRow, 'north'];
    this.summaryCoord[14] = [this.sixthCol, this.firstRow, 'south'];
    this.summaryCoord[15] = [this.sixthCol, this.thirdRow, 'south'];
    this.summaryCoord[16] = [this.firstCol, this.fourthRow, 'north'];

    //detail view
    this.crystalSide = this.canvasWidth*0.1;
    this.suppressorWidth = this.canvasWidth*0.03;
    this.suppressorSpacing = this.canvasWidth*0.04;
    this.frontBGOinnerWidth = 2*this.crystalSide + 2*this.suppressorSpacing;
    this.frontBGOouterWidth = this.frontBGOinnerWidth + 2*this.suppressorWidth;
    this.backBGOinnerWidth = this.frontBGOouterWidth + 2*this.suppressorSpacing;
    this.backBGOouterWidth = this.backBGOinnerWidth + 2*this.suppressorWidth;
    this.sideBGOinnerWidth = this.backBGOouterWidth + 2*this.suppressorSpacing;
    this.sideBGOouterWidth = this.sideBGOinnerWidth + 2*this.suppressorWidth;
    this.sideSpacer = 20;

    //establish data buffers////////////////////////////////////////////////////////////////////////////
    this.summaryHPGE = [];
    this.summaryHPGEcolor = [];
    this.oldSummaryHPGEcolor = [];

    //Member functions/////////////////////////////////////////////////////////////////////////////////

    this.draw = function(frame){
        var i, j, HPGEcolors;
        this.context.lineWidth = this.lineWeight;
        HPGEcolors = [];
        //once for the display canvas...
        for(i=1; i<17; i++){
            //fill an array with the appropriate colors:
            for(j=0; j<4; j++){
                HPGEcolors[j] = interpolateColor(parseHexColor(this.oldSummaryHPGEcolor[(i-1)*4+j]), parseHexColor(this.summaryHPGEcolor[(i-1)*4+j]), frame/this.nFrames)
            }
            this.context.fillStyle = '#000000';  //TODO: bgo colors
            if(this.enableBGO == 1) this.BGOsummary(this.context, this.summaryCoord[i][0], this.summaryCoord[i][1]);
            this.HPGEsummary(this.context, this.summaryCoord[i][0], this.summaryCoord[i][1], this.summaryCoord[i][2], HPGEcolors);
        }
        //...and once again for the tooltip encoding
        for(i=1; i<17; i++){
            this.TTcontext.fillStyle = 'rgba('+i+','+i+','+i+',1)';
            if(this.enableBGO == 1) this.BGOsummary(this.TTcontext, this.summaryCoord[i][0], this.summaryCoord[i][1]);
            this.HPGEsummary(this.TTcontext, this.summaryCoord[i][0], this.summaryCoord[i][1], this.summaryCoord[i][2]);
        }

        this.context.clearRect(0,0.65*this.canvasHeight,this.canvasWidth,0.35*this.canvasHeight);
        this.context.fillStyle = '#999999';
        this.context.font="24px 'Orbitron'";
        this.context.fillText('North Hemisphere', 0.325*this.canvasWidth - this.context.measureText('North Hemisphere').width/2, 0.7*this.canvasHeight);
        this.context.fillText('South Hemisphere', 0.725*this.canvasWidth - this.context.measureText('North Hemisphere').width/2, 0.7*this.canvasHeight);
    };

    this.drawDetail = function(mode){

        var split;
    	this.detailContext.lineWidth = this.lineWeight;

        if(mode == 'rate')
            split = false;
        else if(mode == 'HV')
            split = true;
 
        if(split){
            this.crystal(this.centerX - this.crystalSide, this.centerY - this.crystalSide, '#00FF00');
            this.crystal(this.centerX + this.lineWeight, this.centerY - this.crystalSide, '#0000FF');
            this.crystal(this.centerX - this.crystalSide, this.centerY + this.lineWeight, '#FF0000');
            this.crystal(this.centerX + this.lineWeight, this.centerY + this.lineWeight, '#FFFFFF');

        } else{
        	//cores
        	this.crystalCore(this.centerX - 2/3*this.crystalSide, this.centerY-2/3*this.crystalSide, '#00FF00');
        	this.crystalCore(this.centerX + 1/3*this.crystalSide + this.lineWeight, this.centerY-2/3*this.crystalSide, '#0000FF');
        	this.crystalCore(this.centerX - 2/3*this.crystalSide, this.centerY+1/3*this.crystalSide + this.lineWeight, '#FF0000');
        	this.crystalCore(this.centerX + 1/3*this.crystalSide + this.lineWeight, this.centerY+1/3*this.crystalSide + this.lineWeight, '#FFFFFF');
    	    //front segs
            this.drawL(0, this.crystalSide/6, 1/3*this.crystalSide, this.centerX - 5*this.crystalSide/6, this.centerY - 5*this.crystalSide/6, '#00FF00');
            this.drawL(Math.PI/2, this.crystalSide/6, 1/3*this.crystalSide, this.centerX - this.crystalSide/6, this.centerY - 5*this.crystalSide/6, '#00FF00');
            this.drawL(Math.PI, this.crystalSide/6, 1/3*this.crystalSide, this.centerX - this.crystalSide/6, this.centerY - this.crystalSide/6, '#00FF00');
            this.drawL(3*Math.PI/2, this.crystalSide/6, 1/3*this.crystalSide, this.centerX - 5*this.crystalSide/6, this.centerY - this.crystalSide/6, '#00FF00');

            this.drawL(0, this.crystalSide/6, 1/3*this.crystalSide, this.centerX + this.crystalSide/6 + this.lineWeight, this.centerY - 5*this.crystalSide/6, '#0000FF');
            this.drawL(Math.PI/2, this.crystalSide/6, 1/3*this.crystalSide, this.centerX + 5*this.crystalSide/6 + this.lineWeight, this.centerY - 5*this.crystalSide/6, '#0000FF');
            this.drawL(Math.PI, this.crystalSide/6, 1/3*this.crystalSide, this.centerX + 5*this.crystalSide/6 + this.lineWeight, this.centerY - this.crystalSide/6, '#0000FF');
            this.drawL(3*Math.PI/2, this.crystalSide/6, 1/3*this.crystalSide, this.centerX + this.crystalSide/6 + this.lineWeight, this.centerY - this.crystalSide/6, '#0000FF');

            this.drawL(0, this.crystalSide/6, 1/3*this.crystalSide, this.centerX + this.crystalSide/6 + this.lineWeight, this.centerY + this.crystalSide/6 + this.lineWeight, '#FFFFFF');
            this.drawL(Math.PI/2, this.crystalSide/6, 1/3*this.crystalSide, this.centerX + 5*this.crystalSide/6 + this.lineWeight, this.centerY + this.crystalSide/6 + this.lineWeight, '#FFFFFF');
            this.drawL(Math.PI, this.crystalSide/6, 1/3*this.crystalSide, this.centerX + 5*this.crystalSide/6 + this.lineWeight, this.centerY + 5*this.crystalSide/6 + this.lineWeight, '#FFFFFF');
            this.drawL(3*Math.PI/2, this.crystalSide/6, 1/3*this.crystalSide, this.centerX + this.crystalSide/6 + this.lineWeight, this.centerY + 5*this.crystalSide/6 + this.lineWeight, '#FFFFFF');

            this.drawL(0, this.crystalSide/6, 1/3*this.crystalSide, this.centerX - 5*this.crystalSide/6, this.centerY + this.crystalSide/6 + this.lineWeight, '#FF0000');
            this.drawL(Math.PI/2, this.crystalSide/6, 1/3*this.crystalSide, this.centerX - this.crystalSide/6, this.centerY + this.crystalSide/6 + this.lineWeight, '#FF0000');
            this.drawL(Math.PI, this.crystalSide/6, 1/3*this.crystalSide, this.centerX - this.crystalSide/6, this.centerY + 5*this.crystalSide/6 + this.lineWeight, '#FF0000');
            this.drawL(3*Math.PI/2, this.crystalSide/6, 1/3*this.crystalSide, this.centerX - 5*this.crystalSide/6, this.centerY + 5*this.crystalSide/6 + this.lineWeight, '#FF0000');

            //back segs
            this.drawL(0, this.crystalSide/6, this.crystalSide/2, this.centerX - this.crystalSide, this.centerY - this.crystalSide, '#00FF00');
            this.drawL(Math.PI/2, this.crystalSide/6, this.crystalSide/2, this.centerX, this.centerY - this.crystalSide, '#00FF00');
            this.drawL(Math.PI, this.crystalSide/6, this.crystalSide/2, this.centerX, this.centerY, '#00FF00');
            this.drawL(3*Math.PI/2, this.crystalSide/6, this.crystalSide/2, this.centerX - this.crystalSide, this.centerY, '#00FF00');        

            this.drawL(0, this.crystalSide/6, this.crystalSide/2, this.centerX + this.lineWeight, this.centerY - this.crystalSide, '#0000FF');
            this.drawL(Math.PI/2, this.crystalSide/6, this.crystalSide/2, this.centerX + this.crystalSide + this.lineWeight, this.centerY - this.crystalSide, '#0000FF');
            this.drawL(Math.PI, this.crystalSide/6, this.crystalSide/2, this.centerX + this.crystalSide + this.lineWeight, this.centerY, '#0000FF');
            this.drawL(3*Math.PI/2, this.crystalSide/6, this.crystalSide/2, this.centerX + this.lineWeight, this.centerY, '#0000FF');

            this.drawL(0, this.crystalSide/6, this.crystalSide/2, this.centerX + this.lineWeight, this.centerY + this.lineWeight, '#FFFFFF');
            this.drawL(Math.PI/2, this.crystalSide/6, this.crystalSide/2, this.centerX + this.crystalSide + this.lineWeight, this.centerY + this.lineWeight, '#FFFFFF');
            this.drawL(Math.PI, this.crystalSide/6, this.crystalSide/2, this.centerX + this.crystalSide + this.lineWeight, this.centerY + this.crystalSide + this.lineWeight, '#FFFFFF');
            this.drawL(3*Math.PI/2, this.crystalSide/6, this.crystalSide/2, this.centerX + this.lineWeight, this.centerY + this.crystalSide + this.lineWeight, '#FFFFFF');

            this.drawL(0, this.crystalSide/6, this.crystalSide/2, this.centerX - this.crystalSide, this.centerY + this.lineWeight, '#FF0000');
            this.drawL(Math.PI/2, this.crystalSide/6, this.crystalSide/2, this.centerX, this.centerY + this.lineWeight, '#FF0000');
            this.drawL(Math.PI, this.crystalSide/6, this.crystalSide/2, this.centerX, this.centerY + this.crystalSide + this.lineWeight, '#FF0000');
            this.drawL(3*Math.PI/2, this.crystalSide/6, this.crystalSide/2, this.centerX - this.crystalSide, this.centerY + this.crystalSide + this.lineWeight, '#FF0000');
        }

        //front suppressors
        this.drawHalfL(-Math.PI/2, this.suppressorWidth, this.frontBGOouterWidth/2, this.centerX - this.frontBGOinnerWidth/2, this.centerY - this.frontBGOinnerWidth/2, 'left', split, '#00FF00');
        this.drawHalfL(0, this.suppressorWidth, this.frontBGOouterWidth/2, this.centerX - this.frontBGOinnerWidth/2, this.centerY - this.frontBGOinnerWidth/2, 'right', split, '#00FF00');

        this.drawHalfL(0, this.suppressorWidth, this.frontBGOouterWidth/2, this.centerX + this.frontBGOinnerWidth/2 + this.lineWeight, this.centerY - this.frontBGOinnerWidth/2, 'left', split, '#0000FF');
        this.drawHalfL(Math.PI/2, this.suppressorWidth, this.frontBGOouterWidth/2, this.centerX + this.frontBGOinnerWidth/2 + this.lineWeight, this.centerY - this.frontBGOinnerWidth/2, 'right', split, '#0000FF');

        this.drawHalfL(Math.PI/2, this.suppressorWidth, this.frontBGOouterWidth/2, this.centerX + this.frontBGOinnerWidth/2 + this.lineWeight, this.centerY + this.frontBGOinnerWidth/2 + this.lineWeight, 'left', split, '#FFFFFF');
        this.drawHalfL(Math.PI, this.suppressorWidth, this.frontBGOouterWidth/2, this.centerX + this.frontBGOinnerWidth/2 + this.lineWeight, this.centerY + this.frontBGOinnerWidth/2 + this.lineWeight, 'right', split, '#FFFFFF');

        this.drawHalfL(Math.PI, this.suppressorWidth, this.frontBGOouterWidth/2, this.centerX - this.frontBGOinnerWidth/2, this.centerY + this.frontBGOinnerWidth/2 + this.lineWeight, 'left', split, '#FF0000');
        this.drawHalfL(3*Math.PI/2, this.suppressorWidth, this.frontBGOouterWidth/2, this.centerX - this.frontBGOinnerWidth/2, this.centerY + this.frontBGOinnerWidth/2 + this.lineWeight, 'right', split, '#FF0000');

        //back suppressors
        this.drawHalfL(-Math.PI/2, this.suppressorWidth, this.backBGOouterWidth/2, this.centerX - this.backBGOinnerWidth/2, this.centerY - this.backBGOinnerWidth/2, 'left', split, '#00FF00');
        this.drawHalfL(0, this.suppressorWidth, this.backBGOouterWidth/2, this.centerX - this.backBGOinnerWidth/2, this.centerY - this.backBGOinnerWidth/2, 'right', split, '#00FF00');

        this.drawHalfL(0, this.suppressorWidth, this.backBGOouterWidth/2, this.centerX + this.backBGOinnerWidth/2 + this.lineWeight, this.centerY - this.backBGOinnerWidth/2, 'left', split, '#0000FF');
        this.drawHalfL(Math.PI/2, this.suppressorWidth, this.backBGOouterWidth/2, this.centerX + this.backBGOinnerWidth/2 + this.lineWeight, this.centerY - this.backBGOinnerWidth/2, 'right', split, '#0000FF');

        this.drawHalfL(Math.PI/2, this.suppressorWidth, this.backBGOouterWidth/2, this.centerX + this.backBGOinnerWidth/2 + this.lineWeight, this.centerY + this.backBGOinnerWidth/2 + this.lineWeight, 'left', split, '#FFFFFF');
        this.drawHalfL(Math.PI, this.suppressorWidth, this.backBGOouterWidth/2, this.centerX + this.backBGOinnerWidth/2 + this.lineWeight, this.centerY + this.backBGOinnerWidth/2 + this.lineWeight, 'right', split, '#FFFFFF');

        this.drawHalfL(Math.PI, this.suppressorWidth, this.backBGOouterWidth/2, this.centerX - this.backBGOinnerWidth/2, this.centerY + this.backBGOinnerWidth/2 + this.lineWeight, 'left', split, '#FF0000');
        this.drawHalfL(3*Math.PI/2, this.suppressorWidth, this.backBGOouterWidth/2, this.centerX - this.backBGOinnerWidth/2, this.centerY + this.backBGOinnerWidth/2 + this.lineWeight, 'right', split, '#FF0000');

        //side suppressors
        this.drawHalfL(-Math.PI/2, this.suppressorWidth, this.sideBGOouterWidth/2 - this.sideSpacer, this.centerX - this.sideBGOinnerWidth/2, this.centerY - this.sideBGOinnerWidth/2 + this.sideSpacer, 'left', split, '#00FF00');
        this.drawHalfL(0, this.suppressorWidth, this.sideBGOouterWidth/2 - this.sideSpacer, this.centerX - this.sideBGOinnerWidth/2 + this.sideSpacer, this.centerY - this.sideBGOinnerWidth/2, 'right', split, '#00FF00');

        this.drawHalfL(0, this.suppressorWidth, this.sideBGOouterWidth/2 - this.sideSpacer, this.centerX + this.sideBGOinnerWidth/2 + this.lineWeight - this.sideSpacer, this.centerY - this.sideBGOinnerWidth/2, 'left', split, '#0000FF');
        this.drawHalfL(Math.PI/2, this.suppressorWidth, this.sideBGOouterWidth/2 - this.sideSpacer, this.centerX + this.sideBGOinnerWidth/2 + this.lineWeight, this.centerY - this.sideBGOinnerWidth/2 + this.sideSpacer, 'right', split, '#0000FF');

        this.drawHalfL(Math.PI/2, this.suppressorWidth, this.sideBGOouterWidth/2 - this.sideSpacer, this.centerX + this.sideBGOinnerWidth/2 + this.lineWeight, this.centerY + this.sideBGOinnerWidth/2 + this.lineWeight - this.sideSpacer, 'left', split, '#FFFFFF');
        this.drawHalfL(Math.PI, this.suppressorWidth, this.sideBGOouterWidth/2 - this.sideSpacer, this.centerX + this.sideBGOinnerWidth/2 + this.lineWeight - this.sideSpacer, this.centerY + this.sideBGOinnerWidth/2 + this.lineWeight, 'right', split, '#FFFFFF');

        this.drawHalfL(Math.PI, this.suppressorWidth, this.sideBGOouterWidth/2 - this.sideSpacer, this.centerX - this.sideBGOinnerWidth/2 + this.sideSpacer, this.centerY + this.sideBGOinnerWidth/2 + this.lineWeight, 'left', split, '#FF0000');
        this.drawHalfL(3*Math.PI/2, this.suppressorWidth, this.sideBGOouterWidth/2 - this.sideSpacer, this.centerX - this.sideBGOinnerWidth/2, this.centerY + this.sideBGOinnerWidth/2 + this.lineWeight - this.sideSpacer, 'right', split, '#FF0000');
    };

    //drawing functions/////////////////////////////////////////////////////////
    //summary view/////////////////////////

    //draw HPGE summary
    this.HPGEsummary = function(context, x0,y0, hemisphere, fillColor){
        var i;
        var colors 
        //cloverleaves are oriented differently in north and south hemispheres in the blueprints, match here:
        if(hemisphere == 'north') colors = ['#00FF00', '#0000FF', '#FF0000', '#FFFFFF'];
        else if(hemisphere == 'south') colors = ['#FFFFFF', '#FF0000', '#0000FF', '#00FF00'];

        for(i=0; i<4; i++){
            //fill the crystal quarter with the appropriate color on the top view, or the tt encoding on the tt layer:
            if(context != this.TTcontext) context.fillStyle = fillColor[i];
            context.fillRect(Math.round(x0 + (this.BGOouter-this.HPGEside)/2 + (i%2)*(this.lineWeight + this.HPGEside/2)), Math.round(y0 + (this.BGOouter-this.HPGEside)/2 + (i>>1)/2*(2*this.lineWeight + this.HPGEside)), Math.round(this.HPGEside/2),Math.round(this.HPGEside/2));
            //give the top view clovers an appropriately-colored outline:
            if(context != this.TTcontext){
                context.strokeStyle = colors[i];
                context.strokeRect(x0 + (this.BGOouter-this.HPGEside)/2 + (i%2)*(this.lineWeight + this.HPGEside/2), y0 + (this.BGOouter-this.HPGEside)/2 + (i>>1)/2*(2*this.lineWeight + this.HPGEside), this.HPGEside/2, this.HPGEside/2);
            }
        }

    };

    //draw BGO summary box
    this.BGOsummary = function(context, x0,y0,fill){
        context.strokeStyle = '#999999';
        context.fillRect(x0,y0,this.BGOouter, this.BGOouter);
        context.strokeRect(x0,y0,this.BGOouter, this.BGOouter);

        context.clearRect(x0 + (this.BGOouter-this.BGOinner)/2, y0 + (this.BGOouter-this.BGOinner)/2, this.BGOinner, this.BGOinner);
        context.strokeRect(x0 + (this.BGOouter-this.BGOinner)/2, y0 + (this.BGOouter-this.BGOinner)/2, this.BGOinner, this.BGOinner);
    };

    //detail view///////////////////////////
    //draw crystal core
    this.crystalCore = function(x0, y0, border, fill){
    	this.detailContext.strokeStyle = border;
        this.detailContext.fillStyle = '#4C4C4C';
    	this.detailContext.fillRect(x0, y0, this.crystalSide/3, this.crystalSide/3);
    	this.detailContext.stroke();
    };

    //draw HV box for one cloverleaf:
    this.crystal = function(x0, y0, border, fill){
        this.detailContext.strokeStyle = border;
        this.detailContext.fillStyle = '#4C4C4C';
        this.detailContext.fillRect(x0, y0, this.crystalSide, this.crystalSide);
        this.detailContext.strokeRect(x0, y0, this.crystalSide, this.crystalSide);
        this.detailContext.stroke();
    };    

    //draw split crystal for HV view
    this.splitCrystal = function(x0, y0, border, fill){
        this.detailContext.strokeStyle = border;
        this.detailContext.fillStyle = '#4C4C4C';
        this.detailContext.beginPath();
        this.detailContext.moveTo(x0+this.crystalSide,y0);
        this.detailContext.lineTo(x0,y0);
        this.detailContext.lineTo(x0,y0+this.crystalSide);
        this.detailContext.closePath();
        this.detailContext.fill();
        this.detailContext.stroke();

        this.detailContext.beginPath();
        this.detailContext.moveTo(x0+this.crystalSide,y0);
        this.detailContext.lineTo(x0+this.crystalSide,y0+this.crystalSide);
        this.detailContext.lineTo(x0,y0+this.crystalSide);
        this.detailContext.closePath();
        this.detailContext.fill();
        this.detailContext.stroke();
    };

    //draw L shape
    this.drawL = function(phi, thickness, length, x0, y0, border, fill){
        this.detailContext.strokeStyle = border;
        this.detailContext.fillStyle = '#4C4C4C';
    	this.detailContext.save();
    	this.detailContext.translate(x0, y0);
    	this.detailContext.rotate(phi);

        this.detailContext.beginPath();
    	this.detailContext.moveTo(0,0);
    	this.detailContext.lineTo(length, 0);
    	this.detailContext.lineTo(length, thickness);
    	this.detailContext.lineTo(thickness, thickness);
    	this.detailContext.lineTo(thickness, length);
    	this.detailContext.lineTo(0,length);
    	this.detailContext.closePath();
        this.detailContext.fill();
    	this.detailContext.stroke();

    	this.detailContext.restore();

    };

    //draw half-L
    this.drawHalfL = function(phi, thickness, length, x0, y0, chirality, split, border, fill){
        this.detailContext.strokeStyle = border;
        this.detailContext.fillStyle = '#4C4C4C';
        this.detailContext.save();
        this.detailContext.translate(x0, y0);
        this.detailContext.rotate(phi);

        if(chirality == 'left'){
            this.detailContext.translate(this.detailContext.width,0);
            this.detailContext.scale(-1,1);   
        }

        if(split){
            this.detailContext.beginPath();
            this.detailContext.moveTo((length-thickness)/2,0);
            this.detailContext.lineTo(length-thickness, 0);
            this.detailContext.lineTo(length-thickness, -thickness);
            this.detailContext.lineTo((length-thickness)/2,-thickness);
            this.detailContext.closePath();
            this.detailContext.fill();
            this.detailContext.stroke();

            this.detailContext.beginPath();
            this.detailContext.moveTo(0,0);
            this.detailContext.lineTo((length-thickness)/2,0);
            this.detailContext.lineTo((length-thickness)/2,-thickness);
            this.detailContext.lineTo(-thickness, -thickness);
            this.detailContext.closePath();
            this.detailContext.fill();
            this.detailContext.stroke();
        } else{
            this.detailContext.beginPath();
            this.detailContext.moveTo(0,0);
            this.detailContext.lineTo(length-thickness, 0);
            this.detailContext.lineTo(length-thickness, -thickness);
            this.detailContext.lineTo(-thickness, -thickness);
            this.detailContext.closePath();
            this.detailContext.fill();
            this.detailContext.stroke();
        }

        this.detailContext.restore();
    };
    //end drawing functions///////////////////////////////////////////////////////////////

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

    this.update = function(HPGEsummaryInfo){
        var i;
        for(i=0; i<HPGEsummaryInfo.length; i++){
            this.summaryHPGE[i] = HPGEsummaryInfo[i];
            this.oldSummaryHPGEcolor[i] = this.summaryHPGEcolor[i];
            this.summaryHPGEcolor[i] = this.parseColor(HPGEsummaryInfo[i]);
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











