function HPGE(monitor, BGOenable, minima, maxima, prefix, postfix, mode){

	this.monitorID = monitor;		                //div ID of wrapper div
	this.canvasID = 'HPGECanvas'; 			        //ID of canvas to draw top level TIGRESS view on
	this.detailCanvasID = 'HPGEdetailCanvas';		//ID of canvas to draw single HPGE view on
    this.linkWrapperID = 'SubsystemLinks';          //ID of div wrapping subsystem navigation links
    this.sidebarID = 'SubsystemSidebar';            //ID of right sidebar for this object
    this.topNavID = 'SubsystemsButton';             //ID of top level nav button
    this.TTcanvasID = 'HPGETTCanvas';               //ID of hidden tooltip map canvas for summary level
    this.TTdetailCanvasID = 'HPGETTdetailCanvas';   //ID of hidden tooltip map canvas for detail level
    this.minima = minima;                           //array of scale minima: [HPGE HV, HPGE Thresholds, HPGE Rate...]
    this.maxima = maxima;                           //array of scale maxima, arranged as minima.
    this.mode = mode;                               //mode to run in, either 'TIGRESS' or 'GRIFFIN'
    this.BGOenable = BGOenable;                     //are the suppresors present?

    this.cloverShowing = 1;                         //index of clover currently showing in detail view
    this.detailShowing = 0;                         //is the detail canvas showing?

    var that = this;
    //make a pointer at window level back to this object, so we can pass by reference to the nav button onclick
    window.HPGEpointer = that;

    //establish animation parameters////////////////////////////////////////////////////////////////////
    this.FPS = 30;
    this.duration = 0.5;
    this.nFrames = this.FPS*this.duration;

    //subsystem navigation//////////////////////////////////////////////////////////////////////////////
    //establish which canvas should be displayed when the subsystem is navigated to, as a function of which scalar button is active:
    this.view = ['HPGECanvas', 'HPGECanvas', 'HPGECanvas'];
    //insert nav link
    insertButton('HPGElink', 'navLink', "javascript:swapFade('HPGElink', window.HPGEpointer, window.subsystemScalars, window.subdetectorView)", this.linkWrapperID, 'HPGE');

    //insert & scale canvas//////////////////////////////////////////////////////////////////////////////////////
    this.monitor = document.getElementById(monitor);
    this.canvasWidth = 0.48*$(this.monitor).width();
    this.canvasHeight = 0.8*$(this.monitor).height();
    //top level
    insertCanvas(this.canvasID, 'monitor', 'top:' + ($('#SubsystemLinks').height()*1.25 + 5) +'px; transition:opacity 0.5s, z-index 0.5s; -moz-transition:opacity 0.5s, z-index 0.5s; -webkit-transition:opacity 0.5s, z-index 0.5s;', this.canvasWidth, this.canvasHeight, monitor);
    this.canvas = document.getElementById(this.canvasID);
    this.context = this.canvas.getContext('2d');
    //detail level
    insertCanvas(this.detailCanvasID, 'monitor', 'top:' + ($('#SubsystemLinks').height()*1.25 + 5) +'px; transition:opacity 0.5s, z-index 0.5s; -moz-transition:opacity 0.5s, z-index 0.5s; -webkit-transition:opacity 0.5s, z-index 0.5s;', this.canvasWidth, this.canvasHeight, monitor);
    this.detailCanvas = document.getElementById(this.detailCanvasID);
    this.detailContext = this.detailCanvas.getContext('2d');
    //hidden Tooltip map layer for summary
    insertCanvas(this.TTcanvasID, 'monitor', 'top:' + ($('#SubsystemLinks').height()*1.25 + 5) +'px;', this.canvasWidth, this.canvasHeight, monitor);
    this.TTcanvas = document.getElementById(this.TTcanvasID);
    this.TTcontext = this.TTcanvas.getContext('2d');
    //hidden Tooltip map layer for detail
    insertCanvas(this.TTdetailCanvasID, 'monitor', 'top:' + ($('#SubsystemLinks').height()*1.25 + 5) +'px;', this.canvasWidth, this.canvasHeight, monitor);
    this.TTdetailCanvas = document.getElementById(this.TTdetailCanvasID);
    this.TTdetailContext = this.TTdetailCanvas.getContext('2d');

    //onclick switch between top and detail view:
    this.detailCanvas.onclick = function(event){
                                    swapCanv(that.canvasID, that.detailCanvasID);
                                    that.detailShowing = 0;
                                };
    this.canvas.onclick =   function(event){
                                //use TT layer to decide which clover user clicked on
                                var cloverClicked = -1;
                                var x,y;
                                x = event.pageX - that.canvas.offsetLeft - that.monitor.offsetLeft;
                                y = event.pageY - that.canvas.offsetTop - that.monitor.offsetTop;
                                cloverClicked = that.findCell(x,y);
                                //draw and swap out if user clicked on a valid clover
                                if(cloverClicked != -1){
                                    that.cloverShowing = cloverClicked
                                    that.drawDetail(that.detailContext, that.nFrames);
                                    that.drawDetail(that.TTdetailContext, that.nFrames);
                                    swapCanv(that.detailCanvasID, that.canvasID);
                                    that.detailShowing = 1;
                                }
                            };

    //Dirty trick to implement tooltip on obnoxious geometry: make another canvas of the same size hidden beneath, with the 
    //detector drawn on it, but with each element filled in with rgba(0,0,n,1), where n is the channel number; fetching the color from the 
    //hidden canvas at point x,y will then return the appropriate channel index.
    //summary level:
    //paint whole hidden canvas with R!=G!=B to trigger TT suppression:
    this.TTcontext.fillStyle = 'rgba(50,100,150,1)';
    this.TTcontext.fillRect(0,0,this.canvasWidth, this.canvasHeight);
    //set up summary tooltip:
    this.tooltip = new Tooltip(this.canvasID, 'HPGETipText', 'HPGEttCanv', 'HPGETT', this.monitorID, prefix, postfix);
    this.tooltip.obj = that;
    //detail level tt:
    //paint whole hidden canvas with R!=G!=B to trigger TT suppression:
    this.TTdetailContext.fillStyle = 'rgba(50,100,150,1)';
    this.TTdetailContext.fillRect(0,0,this.canvasWidth, this.canvasHeight);
    //set up detail tooltip:
    this.detailTooltip = new Tooltip(this.detailCanvasID, 'HPGEdetailTipText', 'HPGEttDetailCanv', 'HPGETTdetail', this.monitorID, prefix, postfix);
    this.detailTooltip.obj = that;

    //drawing parameters/////////////////////////////////////////////////////////////////////////////////////////////
    this.centerX = this.canvasWidth/2;
    this.centerY = this.canvasHeight/2*0.9;
    this.lineWeight = 2;

    //summary view
    this.BGOouter = 0.08*this.canvasWidth;
    this.BGOinner = 0.67*this.BGOouter;
    this.HPGEside = 0.4*this.BGOouter;
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
    this.summaryCoord[5] = [this.secondCol, this.secondRow, 'north'];
    this.summaryCoord[6] = [this.secondCol, this.firstRow, 'north'];
    this.summaryCoord[7] = [this.fifthCol, this.firstRow, 'south'];
    this.summaryCoord[8] = [this.fifthCol, this.secondRow, 'south'];
    this.summaryCoord[9] = [this.fifthCol, this.thirdRow, 'south']; 
    this.summaryCoord[10] = [this.fifthCol, this.fourthRow, 'south'];
    this.summaryCoord[11] = [this.secondCol, this.fourthRow, 'north'];
    this.summaryCoord[12] = [this.secondCol, this.thirdRow, 'north'];
    if(this.mode == 'TIGRESS'){
        this.summaryCoord[1] = [this.thirdCol, this.secondRow, 'north'];
        this.summaryCoord[2] = [this.fourthCol, this.firstRow, 'south'];
        this.summaryCoord[3] = [this.fourthCol, this.thirdRow, 'south'];
        this.summaryCoord[4] = [this.thirdCol, this.fourthRow, 'north'];
        this.summaryCoord[13] = [this.firstCol, this.secondRow, 'north'];
        this.summaryCoord[14] = [this.sixthCol, this.firstRow, 'south'];
        this.summaryCoord[15] = [this.sixthCol, this.thirdRow, 'south'];
        this.summaryCoord[16] = [this.firstCol, this.fourthRow, 'north'];
    } else if(this.mode == 'GRIFFIN'){
        this.summaryCoord[1] = [this.thirdCol, this.firstRow, 'north'];
        this.summaryCoord[2] = [this.fourthCol, this.secondRow, 'south'];
        this.summaryCoord[3] = [this.fourthCol, this.fourthRow, 'south'];
        this.summaryCoord[4] = [this.thirdCol, this.thirdRow, 'north'];
        this.summaryCoord[13] = [this.firstCol, this.firstRow, 'north'];
        this.summaryCoord[14] = [this.sixthCol, this.secondRow, 'south'];
        this.summaryCoord[15] = [this.sixthCol, this.fourthRow, 'south'];
        this.summaryCoord[16] = [this.firstCol, this.thirdRow, 'north'];
    }

    //detail view
    this.crystalSide = this.canvasWidth*0.1*0.9;
    this.suppressorWidth = this.canvasWidth*0.03*0.9;
    this.suppressorSpacing = this.canvasWidth*0.04*0.9;
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

    this.summaryBGO = [];
    this.summaryBGOcolor = [];
    this.oldSummaryBGOcolor = [];

    this.detailDummy = [];
    this.detailDummyColor = [];
    this.oldDetailDummyColor = [];

    //Member functions/////////////////////////////////////////////////////////////////////////////////

    this.draw = function(frame){
        var i;
        this.context.lineWidth = this.lineWeight;

        for(i=0; i<16; i++){
            this.drawSummary(this.summaryCoord[i+1][0], this.summaryCoord[i+1][1], this.summaryCoord[i+1][2], i+1, frame);
        }

        //titles
        this.context.clearRect(0,0.65*this.canvasHeight,this.canvasWidth,0.35*this.canvasHeight);
        this.context.fillStyle = '#999999';
        this.context.font="24px 'Orbitron'";
        if(this.mode == 'TIGRESS'){
            this.context.fillText('North Hemisphere', 0.325*this.canvasWidth - this.context.measureText('North Hemisphere').width/2, 0.7*this.canvasHeight);
            this.context.fillText('South Hemisphere', 0.725*this.canvasWidth - this.context.measureText('North Hemisphere').width/2, 0.7*this.canvasHeight);
        } else if(this.mode == 'GRIFFIN'){
            this.context.fillText('West Hemisphere', 0.325*this.canvasWidth - this.context.measureText('West Hemisphere').width/2, 0.7*this.canvasHeight);
            this.context.fillText('East Hemisphere', 0.725*this.canvasWidth - this.context.measureText('East Hemisphere').width/2, 0.7*this.canvasHeight);
        }
    };


    //drawing functions/////////////////////////////////////////////////////////
    //summary view/////////////////////////

    this.drawSummary = function(x0,y0, hemisphere, cloverNumber, frame){
        var i;
        var colors 
        //cloverleaves are oriented differently in north and south hemispheres in the blueprints, match here:
        if(hemisphere == 'north') colors = ['#00FF00', '#0000FF', '#FF0000', '#FFFFFF'];
        else if(hemisphere == 'south') colors = ['#FFFFFF', '#FF0000', '#0000FF', '#00FF00'];

        for(i=0; i<4; i++){

            //HPGE
            //fill the crystal quarter with the appropriate color on the top view, or the tt encoding on the tt layer:
            this.context.fillStyle = interpolateColor(parseHexColor(this.oldSummaryHPGEcolor[(cloverNumber-1)*4 + i]), parseHexColor(this.summaryHPGEcolor[(cloverNumber-1)*4 + i]), frame/this.nFrames);
            this.context.fillRect(Math.round(x0 + (this.BGOouter-this.HPGEside)/2 + (i%2)*(this.lineWeight + this.HPGEside/2)), Math.round(y0 + (this.BGOouter-this.HPGEside)/2 + (i>>1)/2*(2*this.lineWeight + this.HPGEside)), Math.round(this.HPGEside/2),Math.round(this.HPGEside/2));
            //give the top view clovers an appropriately-colored outline:
            this.context.strokeStyle = colors[i];
            this.context.strokeRect(x0 + (this.BGOouter-this.HPGEside)/2 + (i%2)*(this.lineWeight + this.HPGEside/2), y0 + (this.BGOouter-this.HPGEside)/2 + (i>>1)/2*(2*this.lineWeight + this.HPGEside), this.HPGEside/2, this.HPGEside/2);

            //BGO
            var rotation 
            if(i<2) rotation = i*Math.PI/2;
            else if(i==2) rotation = 3*Math.PI/2;
            else if(i==3) rotation = Math.PI;
            var color = '#000000';
            if(this.BGOenable)
                color = interpolateColor(parseHexColor(this.oldSummaryBGOcolor[(cloverNumber-1)*4 + i]), parseHexColor(this.summaryBGOcolor[(cloverNumber-1)*4 + i]), frame/this.nFrames);
            this.drawL(this.context, rotation, Math.round((this.BGOouter - this.BGOinner)/2), Math.round(this.BGOouter/2), Math.round(x0 + (this.BGOouter+this.lineWeight)*(i%2)), Math.round(y0 + (this.BGOouter+this.lineWeight)*(i>>1)), colors[i], color);

            //reproduce encoded shadow on the summary tooltip canvas:
            this.TTcontext.fillStyle = 'rgba('+cloverNumber+', '+cloverNumber+', '+cloverNumber+', 1)';
            this.TTcontext.fillRect(Math.round(x0), Math.round(y0), Math.round(this.BGOouter), Math.round(this.BGOouter) );
        }
    }

    //detail view///////////////////////////

    this.drawDetail = function(context, frame){

        var split;
        this.detailContext.lineWidth = this.lineWeight;

        //construct the color for each cell
        var fillColor = [];
        for(i=0; i<200; i++){
            if(context == this.detailContext)
                fillColor[i] = interpolateColor(parseHexColor(this.oldDetailDummyColor[i]), parseHexColor(this.detailDummyColor[i]), frame/this.nFrames);
            else
                fillColor[i] = 'rgba('+i+', '+i+', '+i+', 1)';
        }

        if(window.subdetectorView == 0)
            split = true;
        else if(window.subdetectorView == 1 || window.subdetectorView == 2)
            split = false;
 
        if(split){
            this.crystal(context, this.centerX - this.crystalSide, this.centerY - this.crystalSide, '#00FF00', fillColor[0]);
            this.crystal(context, this.centerX + this.lineWeight, this.centerY - this.crystalSide, '#0000FF', fillColor[1]);
            this.crystal(context, this.centerX - this.crystalSide, this.centerY + this.lineWeight, '#FF0000', fillColor[2]);
            this.crystal(context, this.centerX + this.lineWeight, this.centerY + this.lineWeight, '#FFFFFF', fillColor[3]);

        } else{
            //cores
            this.crystalCore(context, this.centerX - 2/3*this.crystalSide, this.centerY-2/3*this.crystalSide, '#00FF00', fillColor[4]);
            this.crystalCore(context, this.centerX + 1/3*this.crystalSide + this.lineWeight, this.centerY-2/3*this.crystalSide, '#0000FF', fillColor[5]);
            this.crystalCore(context, this.centerX - 2/3*this.crystalSide, this.centerY+1/3*this.crystalSide + this.lineWeight, '#FF0000', fillColor[6]);
            this.crystalCore(context, this.centerX + 1/3*this.crystalSide + this.lineWeight, this.centerY+1/3*this.crystalSide + this.lineWeight, '#FFFFFF', fillColor[7]);
            //front segs
            this.drawL(context, 0, this.crystalSide/6, 1/3*this.crystalSide, this.centerX - 5*this.crystalSide/6, this.centerY - 5*this.crystalSide/6, '#00FF00', fillColor[8]);
            this.drawL(context, Math.PI/2, this.crystalSide/6, 1/3*this.crystalSide, this.centerX - this.crystalSide/6, this.centerY - 5*this.crystalSide/6, '#00FF00', fillColor[9]);
            this.drawL(context, Math.PI, this.crystalSide/6, 1/3*this.crystalSide, this.centerX - this.crystalSide/6, this.centerY - this.crystalSide/6, '#00FF00', fillColor[10]);
            this.drawL(context, 3*Math.PI/2, this.crystalSide/6, 1/3*this.crystalSide, this.centerX - 5*this.crystalSide/6, this.centerY - this.crystalSide/6, '#00FF00', fillColor[11]);

            this.drawL(context, 0, this.crystalSide/6, 1/3*this.crystalSide, this.centerX + this.crystalSide/6 + this.lineWeight, this.centerY - 5*this.crystalSide/6, '#0000FF', fillColor[12]);
            this.drawL(context, Math.PI/2, this.crystalSide/6, 1/3*this.crystalSide, this.centerX + 5*this.crystalSide/6 + this.lineWeight, this.centerY - 5*this.crystalSide/6, '#0000FF', fillColor[13]);
            this.drawL(context, Math.PI, this.crystalSide/6, 1/3*this.crystalSide, this.centerX + 5*this.crystalSide/6 + this.lineWeight, this.centerY - this.crystalSide/6, '#0000FF', fillColor[14]);
            this.drawL(context, 3*Math.PI/2, this.crystalSide/6, 1/3*this.crystalSide, this.centerX + this.crystalSide/6 + this.lineWeight, this.centerY - this.crystalSide/6, '#0000FF', fillColor[15]);

            this.drawL(context, 0, this.crystalSide/6, 1/3*this.crystalSide, this.centerX + this.crystalSide/6 + this.lineWeight, this.centerY + this.crystalSide/6 + this.lineWeight, '#FFFFFF', fillColor[16]);
            this.drawL(context, Math.PI/2, this.crystalSide/6, 1/3*this.crystalSide, this.centerX + 5*this.crystalSide/6 + this.lineWeight, this.centerY + this.crystalSide/6 + this.lineWeight, '#FFFFFF', fillColor[17]);
            this.drawL(context, Math.PI, this.crystalSide/6, 1/3*this.crystalSide, this.centerX + 5*this.crystalSide/6 + this.lineWeight, this.centerY + 5*this.crystalSide/6 + this.lineWeight, '#FFFFFF', fillColor[18]);
            this.drawL(context, 3*Math.PI/2, this.crystalSide/6, 1/3*this.crystalSide, this.centerX + this.crystalSide/6 + this.lineWeight, this.centerY + 5*this.crystalSide/6 + this.lineWeight, '#FFFFFF', fillColor[19]);

            this.drawL(context, 0, this.crystalSide/6, 1/3*this.crystalSide, this.centerX - 5*this.crystalSide/6, this.centerY + this.crystalSide/6 + this.lineWeight, '#FF0000', fillColor[20]);
            this.drawL(context, Math.PI/2, this.crystalSide/6, 1/3*this.crystalSide, this.centerX - this.crystalSide/6, this.centerY + this.crystalSide/6 + this.lineWeight, '#FF0000', fillColor[21]);
            this.drawL(context, Math.PI, this.crystalSide/6, 1/3*this.crystalSide, this.centerX - this.crystalSide/6, this.centerY + 5*this.crystalSide/6 + this.lineWeight, '#FF0000', fillColor[22]);
            this.drawL(context, 3*Math.PI/2, this.crystalSide/6, 1/3*this.crystalSide, this.centerX - 5*this.crystalSide/6, this.centerY + 5*this.crystalSide/6 + this.lineWeight, '#FF0000', fillColor[23]);

            //back segs
            this.drawL(context, 0, this.crystalSide/6, this.crystalSide/2, this.centerX - this.crystalSide, this.centerY - this.crystalSide, '#00FF00', fillColor[24]);
            this.drawL(context, Math.PI/2, this.crystalSide/6, this.crystalSide/2, this.centerX, this.centerY - this.crystalSide, '#00FF00', fillColor[25]);
            this.drawL(context, Math.PI, this.crystalSide/6, this.crystalSide/2, this.centerX, this.centerY, '#00FF00', fillColor[26]);
            this.drawL(context, 3*Math.PI/2, this.crystalSide/6, this.crystalSide/2, this.centerX - this.crystalSide, this.centerY, '#00FF00', fillColor[27]);        

            this.drawL(context, 0, this.crystalSide/6, this.crystalSide/2, this.centerX + this.lineWeight, this.centerY - this.crystalSide, '#0000FF', fillColor[28]);
            this.drawL(context, Math.PI/2, this.crystalSide/6, this.crystalSide/2, this.centerX + this.crystalSide + this.lineWeight, this.centerY - this.crystalSide, '#0000FF', fillColor[29]);
            this.drawL(context, Math.PI, this.crystalSide/6, this.crystalSide/2, this.centerX + this.crystalSide + this.lineWeight, this.centerY, '#0000FF', fillColor[30]);
            this.drawL(context, 3*Math.PI/2, this.crystalSide/6, this.crystalSide/2, this.centerX + this.lineWeight, this.centerY, '#0000FF', fillColor[31]);

            this.drawL(context, 0, this.crystalSide/6, this.crystalSide/2, this.centerX + this.lineWeight, this.centerY + this.lineWeight, '#FFFFFF', fillColor[32]);
            this.drawL(context, Math.PI/2, this.crystalSide/6, this.crystalSide/2, this.centerX + this.crystalSide + this.lineWeight, this.centerY + this.lineWeight, '#FFFFFF', fillColor[33]);
            this.drawL(context, Math.PI, this.crystalSide/6, this.crystalSide/2, this.centerX + this.crystalSide + this.lineWeight, this.centerY + this.crystalSide + this.lineWeight, '#FFFFFF', fillColor[34]);
            this.drawL(context, 3*Math.PI/2, this.crystalSide/6, this.crystalSide/2, this.centerX + this.lineWeight, this.centerY + this.crystalSide + this.lineWeight, '#FFFFFF', fillColor[35]);

            this.drawL(context, 0, this.crystalSide/6, this.crystalSide/2, this.centerX - this.crystalSide, this.centerY + this.lineWeight, '#FF0000', fillColor[36]);
            this.drawL(context, Math.PI/2, this.crystalSide/6, this.crystalSide/2, this.centerX, this.centerY + this.lineWeight, '#FF0000', fillColor[37]);
            this.drawL(context, Math.PI, this.crystalSide/6, this.crystalSide/2, this.centerX, this.centerY + this.crystalSide + this.lineWeight, '#FF0000', fillColor[38]);
            this.drawL(context, 3*Math.PI/2, this.crystalSide/6, this.crystalSide/2, this.centerX - this.crystalSide, this.centerY + this.crystalSide + this.lineWeight, '#FF0000', fillColor[39]);
        }

        //front suppressors
        this.drawHalfL(context, -Math.PI/2, this.suppressorWidth, this.frontBGOouterWidth/2, this.centerX - this.frontBGOinnerWidth/2 - this.lineWeight, this.centerY - this.frontBGOinnerWidth/2, 'left', split, '#00FF00', fillColor[40], fillColor[64]);
        this.drawHalfL(context, 0, this.suppressorWidth, this.frontBGOouterWidth/2, this.centerX - this.frontBGOinnerWidth/2, this.centerY - this.frontBGOinnerWidth/2 - this.lineWeight, 'right', split, '#00FF00', fillColor[41], fillColor[65]);

        this.drawHalfL(context, 0, this.suppressorWidth, this.frontBGOouterWidth/2, this.centerX + this.frontBGOinnerWidth/2 + this.lineWeight, this.centerY - this.frontBGOinnerWidth/2 - this.lineWeight, 'left', split, '#0000FF', fillColor[42], fillColor[66]);
        this.drawHalfL(context, Math.PI/2, this.suppressorWidth, this.frontBGOouterWidth/2, this.centerX + this.frontBGOinnerWidth/2 + 2*this.lineWeight, this.centerY - this.frontBGOinnerWidth/2, 'right', split, '#0000FF', fillColor[43], fillColor[67]);

        this.drawHalfL(context, Math.PI/2, this.suppressorWidth, this.frontBGOouterWidth/2, this.centerX + this.frontBGOinnerWidth/2 + 2*this.lineWeight, this.centerY + this.frontBGOinnerWidth/2 + this.lineWeight, 'left', split, '#FFFFFF', fillColor[44], fillColor[68]);
        this.drawHalfL(context, Math.PI, this.suppressorWidth, this.frontBGOouterWidth/2, this.centerX + this.frontBGOinnerWidth/2 + this.lineWeight, this.centerY + this.frontBGOinnerWidth/2 + 2*this.lineWeight, 'right', split, '#FFFFFF', fillColor[45], fillColor[69]);

        this.drawHalfL(context, Math.PI, this.suppressorWidth, this.frontBGOouterWidth/2, this.centerX - this.frontBGOinnerWidth/2, this.centerY + this.frontBGOinnerWidth/2 + 2*this.lineWeight, 'left', split, '#FF0000', fillColor[46], fillColor[70]);
        this.drawHalfL(context, 3*Math.PI/2, this.suppressorWidth, this.frontBGOouterWidth/2, this.centerX - this.frontBGOinnerWidth/2 - this.lineWeight, this.centerY + this.frontBGOinnerWidth/2 + this.lineWeight, 'right', split, '#FF0000', fillColor[47], fillColor[71]);

        //back suppressors
        this.drawHalfL(context, -Math.PI/2, this.suppressorWidth, this.backBGOouterWidth/2, this.centerX - this.backBGOinnerWidth/2 - this.lineWeight, this.centerY - this.backBGOinnerWidth/2, 'left', split, '#00FF00', fillColor[48], fillColor[72]);
        this.drawHalfL(context, 0, this.suppressorWidth, this.backBGOouterWidth/2, this.centerX - this.backBGOinnerWidth/2, this.centerY - this.backBGOinnerWidth/2 - this.lineWeight, 'right', split, '#00FF00', fillColor[49], fillColor[73]);

        this.drawHalfL(context, 0, this.suppressorWidth, this.backBGOouterWidth/2, this.centerX + this.backBGOinnerWidth/2 + this.lineWeight, this.centerY - this.backBGOinnerWidth/2 - this.lineWeight, 'left', split, '#0000FF', fillColor[50], fillColor[74]);
        this.drawHalfL(context, Math.PI/2, this.suppressorWidth, this.backBGOouterWidth/2, this.centerX + this.backBGOinnerWidth/2 + 2*this.lineWeight, this.centerY - this.backBGOinnerWidth/2, 'right', split, '#0000FF', fillColor[51], fillColor[75]);

        this.drawHalfL(context, Math.PI/2, this.suppressorWidth, this.backBGOouterWidth/2, this.centerX + this.backBGOinnerWidth/2 + 2*this.lineWeight, this.centerY + this.backBGOinnerWidth/2 + this.lineWeight, 'left', split, '#FFFFFF', fillColor[52], fillColor[76]);
        this.drawHalfL(context, Math.PI, this.suppressorWidth, this.backBGOouterWidth/2, this.centerX + this.backBGOinnerWidth/2 + this.lineWeight, this.centerY + this.backBGOinnerWidth/2 + 2*this.lineWeight, 'right', split, '#FFFFFF', fillColor[53], fillColor[77]);

        this.drawHalfL(context, Math.PI, this.suppressorWidth, this.backBGOouterWidth/2, this.centerX - this.backBGOinnerWidth/2, this.centerY + this.backBGOinnerWidth/2 + 2*this.lineWeight, 'left', split, '#FF0000', fillColor[54], fillColor[78]);
        this.drawHalfL(context, 3*Math.PI/2, this.suppressorWidth, this.backBGOouterWidth/2, this.centerX - this.backBGOinnerWidth/2 - this.lineWeight, this.centerY + this.backBGOinnerWidth/2 + this.lineWeight, 'right', split, '#FF0000', fillColor[55], fillColor[79]);

        //side suppressors
        this.drawHalfL(context, -Math.PI/2, this.suppressorWidth, this.sideBGOouterWidth/2 - this.sideSpacer, this.centerX - this.sideBGOinnerWidth/2, this.centerY - this.sideBGOinnerWidth/2 + this.sideSpacer, 'left', split, '#00FF00', fillColor[56], fillColor[80]);
        this.drawHalfL(context, 0, this.suppressorWidth, this.sideBGOouterWidth/2 - this.sideSpacer, this.centerX - this.sideBGOinnerWidth/2 + this.sideSpacer, this.centerY - this.sideBGOinnerWidth/2, 'right', split, '#00FF00', fillColor[57], fillColor[81]);

        this.drawHalfL(context, 0, this.suppressorWidth, this.sideBGOouterWidth/2 - this.sideSpacer, this.centerX + this.sideBGOinnerWidth/2 + this.lineWeight - this.sideSpacer, this.centerY - this.sideBGOinnerWidth/2, 'left', split, '#0000FF', fillColor[58], fillColor[82]);
        this.drawHalfL(context, Math.PI/2, this.suppressorWidth, this.sideBGOouterWidth/2 - this.sideSpacer, this.centerX + this.sideBGOinnerWidth/2 + this.lineWeight, this.centerY - this.sideBGOinnerWidth/2 + this.sideSpacer, 'right', split, '#0000FF', fillColor[59], fillColor[83]);

        this.drawHalfL(context, Math.PI/2, this.suppressorWidth, this.sideBGOouterWidth/2 - this.sideSpacer, this.centerX + this.sideBGOinnerWidth/2 + this.lineWeight, this.centerY + this.sideBGOinnerWidth/2 + this.lineWeight - this.sideSpacer, 'left', split, '#FFFFFF', fillColor[60], fillColor[84]);
        this.drawHalfL(context, Math.PI, this.suppressorWidth, this.sideBGOouterWidth/2 - this.sideSpacer, this.centerX + this.sideBGOinnerWidth/2 + this.lineWeight - this.sideSpacer, this.centerY + this.sideBGOinnerWidth/2 + this.lineWeight, 'right', split, '#FFFFFF', fillColor[61], fillColor[85]); 

        this.drawHalfL(context, Math.PI, this.suppressorWidth, this.sideBGOouterWidth/2 - this.sideSpacer, this.centerX - this.sideBGOinnerWidth/2 + this.sideSpacer, this.centerY + this.sideBGOinnerWidth/2 + this.lineWeight, 'left', split, '#FF0000', fillColor[62], fillColor[85]);
        this.drawHalfL(context, 3*Math.PI/2, this.suppressorWidth, this.sideBGOouterWidth/2 - this.sideSpacer, this.centerX - this.sideBGOinnerWidth/2, this.centerY + this.sideBGOinnerWidth/2 + this.lineWeight - this.sideSpacer, 'right', split, '#FF0000', fillColor[63], fillColor[86]);

        //title
        this.detailContext.clearRect(0,0.85*this.canvasHeight,this.canvasWidth,0.15*this.canvasHeight);
        this.detailContext.fillStyle = '#999999';
        this.detailContext.font="24px 'Orbitron'";
        this.detailContext.fillText('Clover '+this.cloverShowing, 0.5*this.canvasWidth - this.detailContext.measureText('Clover '+this.cloverShowing).width/2, 0.95*this.canvasHeight);
    };

    //draw crystal core
    this.crystalCore = function(context, x0, y0, border, fill){
        context.strokeStyle = border;
        context.fillStyle = fill;
    	context.fillRect(Math.round(x0), Math.round(y0), Math.round(this.crystalSide/3), Math.round(this.crystalSide/3));
    	if(context == this.context || context == this.detailContext) context.stroke();
    };

    //draw HV box for one cloverleaf:
    this.crystal = function(context, x0, y0, border, fill){
        context.strokeStyle = border;
        context.fillStyle = fill;
        context.fillRect(Math.round(x0), Math.round(y0), Math.round(this.crystalSide), Math.round(this.crystalSide));
        if(context == this.context || context == this.detailContext){
            context.stroke();
            context.strokeRect(x0, y0, this.crystalSide, this.crystalSide);
        }
    };    

    //draw split crystal for HV view
    this.splitCrystal = function(context, x0, y0, border, fill){
        //antialiasing hack: draw this first on the tooltip level
        if(context == this.TTdetailContext && fill != '#123456'){
            this.splitCrystal(context, x0, y0, border, '#123456');
        }

        context.strokeStyle = border;
        context.fillStyle = fill;
        context.beginPath();
        context.moveTo(x0+this.crystalSide,y0);
        context.lineTo(x0,y0);
        context.lineTo(x0,y0+this.crystalSide);
        context.closePath();
        context.fill();
        if(context == this.context || context == this.detailContext) context.stroke();

        context.beginPath();
        context.moveTo(x0+this.crystalSide,y0);
        context.lineTo(x0+this.crystalSide,y0+this.crystalSide);
        context.lineTo(x0,y0+this.crystalSide);
        context.closePath();
        context.fill();
        if(context == this.context || context == this.detailContext) context.stroke();
    };

    //draw L shape
    this.drawL = function(context, phi, thickness, length, x0, y0, border, fill){
        //antialiasing hack: draw this first on the tooltip level
        if(context == this.TTdetailContext && fill != '#123456'){
            this.drawL(context, phi, thickness, length, x0, y0, border, '#123456');
        }

        context.strokeStyle = border;
        context.fillStyle = fill;
    	context.save();
    	context.translate(Math.round(x0), Math.round(y0));
    	context.rotate(phi);

        context.beginPath();
    	context.moveTo(0,0);
    	context.lineTo(Math.round(length), 0);
    	context.lineTo(Math.round(length), Math.round(thickness));
    	context.lineTo(Math.round(thickness), Math.round(thickness));
    	context.lineTo(Math.round(thickness), Math.round(length));
    	context.lineTo(0,Math.round(length));
    	context.closePath();
        context.fill();
    	if(context == this.context || context == this.detailContext) context.stroke();

    	context.restore();

    };

    //draw half-L
    this.drawHalfL = function(context, phi, thickness, length, x0, y0, chirality, split, border, fill, fillB){
        //antialiasing hack: draw this first on the tooltip level
        if(context == this.TTdetailContext && fill != '#123456'){
            this.drawHalfL(context, phi, thickness, length, x0, y0, chirality, split, border, '#123456', '#123456');
        }


        context.strokeStyle = border;
        context.fillStyle = fill;
        context.save();
        context.translate(x0, y0);
        context.rotate(phi);

        if(chirality == 'left'){
            context.translate(this.detailContext.width,0);
            context.scale(-1,1);   
        }

        if(split){
            context.beginPath();
            context.moveTo((length-thickness)/2,0);
            context.lineTo(length-thickness, 0);
            context.lineTo(length-thickness, -thickness);
            context.lineTo((length-thickness)/2,-thickness);
            context.closePath();
            context.fill();
            context.stroke();

            context.fillStyle = fillB;
            context.beginPath();
            context.moveTo(0,0);
            context.lineTo((length-thickness)/2,0);
            context.lineTo((length-thickness)/2,-thickness);
            context.lineTo(-thickness, -thickness);
            context.closePath();
            context.fill();
            if(context == this.context || context == this.detailContext) context.stroke();
        } else{
            context.beginPath();
            context.moveTo(0,0);
            context.lineTo(length-thickness, 0);
            context.lineTo(length-thickness, -thickness);
            context.lineTo(-thickness, -thickness);
            context.closePath();
            context.fill();
            if(context == this.context || context == this.detailContext) context.stroke();
        }

        context.restore();
    };
    //end drawing functions///////////////////////////////////////////////////////////////

    this.findCell = function(x, y){
        var imageData 
        if(this.detailShowing){
            imageData = this.TTdetailContext.getImageData(x,y,1,1);
        } else{
            imageData = this.TTcontext.getImageData(x,y,1,1);
        }
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

        if(this.detailShowing){
            document.getElementById(this.detailTooltip.ttTextID).innerHTML = toolTipContent;
        } else{
            document.getElementById(this.tooltip.ttTextID).innerHTML = toolTipContent;
        }

        //return length of longest line:
        return longestLine;
    };

    this.update = function(HPGEsummaryInfo, BGOsummaryInfo, detailDummyInfo){
        var i;
        for(i=0; i<HPGEsummaryInfo.length; i++){
            this.summaryHPGE[i] = HPGEsummaryInfo[i];
            this.oldSummaryHPGEcolor[i] = this.summaryHPGEcolor[i];
            this.summaryHPGEcolor[i] = this.parseColor(HPGEsummaryInfo[i]);
        }

        for(i=0; i<BGOsummaryInfo.length; i++){
            this.summaryBGO[i] = BGOsummaryInfo[i];
            this.oldSummaryBGOcolor[i] = this.summaryBGOcolor[i];
            this.summaryBGOcolor[i] = this.parseColor(BGOsummaryInfo[i]);
        }

        for(i=0; i<detailDummyInfo.length; i++){
            this.detailDummy[i] = detailDummyInfo[i];
            this.oldDetailDummyColor[i] = this.detailDummyColor[i];
            this.detailDummyColor[i] = this.parseColor(detailDummyInfo[i]);
        }

        this.tooltip.update();
        this.detailTooltip.update();
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
        this.drawDetail(this.detailContext, this.nFrames);
        this.drawDetail(this.TTdetailContext, this.nFrames);
    };

    //do an initial populate
    fetchNewHPGEData(this.summaryHPGE, this.summaryHPGE, this.detailDummy);
    this.update(this.summaryHPGE, this.summaryHPGE, this.detailDummy);
}











