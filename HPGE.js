HPGe.prototype = Object.create(Subsystem.prototype);

function HPGe(){
    //detector name, self-pointing pointer, pull in the Subsystem template, 
    //establish a databus and create a global-scope pointer to this object:
    this.name = 'HPGe';
    var that = this;
    Subsystem.call(this);
    this.dataBus = new HPGeDS();
    window.HPGepointer = that;

    //member variables////////////////////////////////////////////////////////
    this.cloverShowing = 1;                         //index of clover currently showing in detail view
    this.detailShowing = 0;                         //is the detail canvas showing?
    this.scalePrefix = 'Clover ';                   //prefix for scale title

    this.nHPGesegments = 0;
    if(this.mode == 'TIGRESS')
        this.nHPGesegments = 40;
    else if(this.mode == 'GRIFFIN')
        this.nHPGesegments = 8;

    this.mode = window.parameters.HPGemode;         //mode to run in, either 'TIGRESS' or 'GRIFFIN'
    this.BGOenable = window.parameters.BGOenable;   //are the suppresors present?

    DetailView.call(this);                          //inject the infrastructure for a detail-level view
    HPGeAssets.call(this);                          //inject the HPGe drawing assets

    //onclick switch between top and detail view:
    this.detailCanvas.onclick = function(event){
                                    that.detailShowing = 0;
                                    swapFade(null, that, 1000, 0);
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
                                    cloverClicked = Math.floor( (cloverClicked - 108) / 8)+1;
                                    that.cloverShowing = cloverClicked
                                    that.drawDetail(that.detailContext, that.nFrames);
                                    that.drawDetail(that.TTdetailContext, that.nFrames);
                                    that.detailShowing = 1;
                                    swapFade(null, that, 1000, 0)
                                }
                            };


    //drawing parameters/////////////////////////////////////////////////////////////////////////////////////////////
    this.centerX = this.canvasWidth/2;
    this.centerY = this.canvasHeight*0.4;
    this.lineWeight = 1;

    //summary view
    this.BGOouter = 0.1*this.canvasWidth;
    this.BGOinner = 0.67*this.BGOouter;
    this.HPGeside = 0.4*this.BGOouter;
    //establish coords of each detector summary; start array index at 1 to correspond to actual detector numbering in TIGRESS:
    this.firstRow = this.canvasHeight*0.05;
    this.secondRow = this.canvasHeight*0.22;
    this.thirdRow = this.canvasHeight*0.39;
    this.fourthRow = this.canvasHeight*0.56;
    this.firstCol = this.canvasWidth*0.061;
    this.secondCol = this.canvasWidth*0.201;
    this.thirdCol = this.canvasWidth*0.341;
    this.fourthCol = this.canvasWidth*0.561;
    this.fifthCol = this.canvasWidth*0.701;
    this.sixthCol = this.canvasWidth*0.841;

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
    this.crystalSide = this.canvasWidth*0.1*0.8;
    this.suppressorWidth = this.canvasWidth*0.03*0.8;
    this.suppressorSpacing = this.canvasWidth*0.04*0.8;
    this.backBGOinnerWidth = 2*this.crystalSide + 2*this.suppressorSpacing;
    this.backBGOouterWidth = this.backBGOinnerWidth + 2*this.suppressorWidth;
    this.sideBGOinnerWidth = this.backBGOouterWidth + 2*this.suppressorSpacing;
    this.sideBGOouterWidth = this.sideBGOinnerWidth + 2*this.suppressorWidth;
    this.frontBGOinnerWidth = this.sideBGOouterWidth + 2*this.suppressorSpacing;
    this.frontBGOouterWidth = this.frontBGOinnerWidth + 2*this.suppressorWidth;
    this.sideSpacer = 20;

    //establish data buffers////////////////////////////////////////////////////////////////////////////
    this.summaryHPGeHVcolor = [];
    this.oldSummaryHPGeHVcolor = [];
    this.summaryHPGethresholdColor = [];
    this.oldSummaryHPGethresholdColor = [];
    this.summaryHPGerateColor = [];
    this.oldSummaryHPGerateColor = [];
    this.summaryBGOHVcolor = [];
    this.oldSummaryBGOHVcolor = [];
    this.summaryBGOthresholdColor = [];
    this.oldSummaryBGOthresholdColor = [];
    this.summaryBGOrateColor = [];
    this.oldSummaryBGOrateColor = [];

    this.detailHPGeHVcolor = [];
    this.oldDetailHPGeHVcolor = [];
    this.detailHPGethresholdColor = [];
    this.oldDetailHPGethresholdColor = [];
    this.detailHPGerateColor = [];
    this.oldDetailHPGerateColor = [];
    this.detailBGOHVcolor = [];
    this.oldDetailBGOHVcolor = [];
    this.detailBGOthresholdColor = [];
    this.oldDetailBGOthresholdColor = [];
    this.detailBGOrateColor = [];
    this.oldDetailBGOrateColor = [];

    //Member functions/////////////////////////////////////////////////////////////////////////////////

    //function to wrap drawing for animate
    this.draw = function(frame){
        var i;
        this.context.lineWidth = this.lineWeight;

        for(i=0; i<16; i++){
            this.drawHPGesummary(this.context, this.summaryCoord[i+1][0], this.summaryCoord[i+1][1], i, frame);
            this.drawHPGesummary(this.TTcontext, this.summaryCoord[i+1][0], this.summaryCoord[i+1][1], i, frame);
        }

        //titles
        this.context.clearRect(0,0.75*this.canvasHeight,this.canvasWidth,0.25*this.canvasHeight - this.scaleHeight);
        this.context.fillStyle = '#999999';
        this.context.font="24px 'Orbitron'";
        if(this.mode == 'TIGRESS'){
            this.context.fillText('North Hemisphere', 0.201*this.canvasWidth + this.BGOouter/2 - this.context.measureText('North Hemisphere').width/2, 0.78*this.canvasHeight);
            this.context.fillText('South Hemisphere', 0.701*this.canvasWidth + this.BGOouter/2 - this.context.measureText('North Hemisphere').width/2, 0.78*this.canvasHeight);
        } else if(this.mode == 'GRIFFIN'){
            this.context.fillText('West Hemisphere', 0.201*this.canvasWidth + this.BGOouter/2 - this.context.measureText('West Hemisphere').width/2, 0.78*this.canvasHeight);
            this.context.fillText('East Hemisphere', 0.701*this.canvasWidth + this.BGOouter/2 - this.context.measureText('East Hemisphere').width/2, 0.78*this.canvasHeight);
        }

        if(frame==this.nFrames || frame==0) this.drawScale(this.context);
    };

    this.defineText = function(cell){
        var toolTipContent = '<br>';
        var nextLine;
        var cardIndex;
        var i;

        nextLine = 'Channel '+cell;
        toolTipContent += nextLine;

        toolTipContent += '<br><br>';
        if(this.detailShowing){
            document.getElementById(this.detailTooltip.ttDivID).innerHTML = toolTipContent;
        } else{
            document.getElementById(this.tooltip.ttDivID).innerHTML = toolTipContent;
        }

        return 0;
    };

    this.update = function(){

        var i;

        //get new data
        this.fetchNewData();

        //parse colors
        for(i=0; i<16*4; i++){
            this.oldSummaryHPGeHVcolor[i] = this.summaryHPGeHVcolor[i];
            this.summaryHPGeHVcolor[i] = this.parseColor(this.dataBus.summaryHPGeHV[i], 'HPGe');
            this.oldSummaryHPGethresholdColor[i] = this.summaryHPGethresholdColor[i];
            this.summaryHPGethresholdColor[i] = this.parseColor(this.dataBus.summaryHPGethreshold[i], 'HPGe');
            this.oldSummaryHPGerateColor[i] = this.summaryHPGerateColor[i];
            this.summaryHPGerateColor[i] = this.parseColor(this.dataBus.summaryHPGerate[i], 'HPGe');

            this.oldSummaryBGOHVcolor[i] = this.summaryBGOHVcolor[i];
            this.summaryBGOHVcolor[i] = this.parseColor(this.dataBus.summaryBGOHV[i], 'BGO');
            this.oldSummaryBGOthresholdColor[i] = this.summaryBGOthresholdColor[i];
            this.summaryBGOthresholdColor[i] = this.parseColor(this.dataBus.summaryBGOthreshold[i], 'BGO');
            this.oldSummaryBGOrateColor[i] = this.summaryBGOrateColor[i];
            this.summaryBGOrateColor[i] = this.parseColor(this.dataBus.summaryBGOrate[i], 'BGO');
        }

        //detail level
        for(i=0; i<16*this.nHPGesegments; i++){
            this.oldDetailHPGethresholdColor[i] = this.detailHPGethresholdColor[i];
            this.detailHPGethresholdColor[i] = this.parseColor(this.dataBus.detailHPGethreshold[i], 'HPGe');
            this.oldDetailHPGerateColor[i] = this.detailHPGerateColor[i];
            this.detailHPGerateColor[i] = this.parseColor(this.dataBus.detailHPGerate[i], 'HPGe');
        }
        for(i=0; i<16*4; i++){
            this.oldDetailHPGeHVcolor[i] = this.detailHPGeHVcolor[i];
            this.detailHPGeHVcolor[i] = this.parseColor(this.dataBus.detailHPGeHV[i], 'HPGe');
        }
        for(i=0; i<16*20; i++){
            this.oldDetailBGOthresholdColor[i] = this.detailBGOthresholdColor[i];
            this.detailBGOthresholdColor[i] = this.parseColor(this.dataBus.detailBGOthreshold[i], 'BGO');
            this.oldDetailBGOrateColor[i] = this.detailBGOrateColor[i];
            this.detailBGOrateColor[i] = this.parseColor(this.dataBus.detailBGOrate[i], 'BGO');
        }
        for(i=0; i<16*40; i++){
            this.oldDetailBGOHVcolor[i] = this.detailBGOHVcolor[i];
            this.detailBGOHVcolor[i] = this.parseColor(this.dataBus.detailBGOHV[i], 'BGO');
        }

        this.tooltip.update();
        this.detailTooltip.update();
        this.displaySwitch();
    };




    this.fetchNewData = function(){
        var i;

        //dummy data
        //summary level
        for(i=0; i<16*4; i++){
            this.dataBus.summaryHPGeHV[i] = Math.random();
            this.dataBus.summaryHPGethreshold[i] = Math.random();
            this.dataBus.summaryHPGerate[i] = Math.random();
            this.dataBus.summaryBGOHV[i] = Math.random();
            this.dataBus.summaryBGOthreshold[i] = Math.random();
            this.dataBus.summaryBGOrate[i] = Math.random();
        }

        //detail level
        for(i=0; i<16*this.nHPGesegments; i++){
                this.dataBus.detailHPGethreshold[i] = Math.random();
                this.dataBus.detailHPGerate[i] = Math.random();
        }
        for(i=0; i<16*4; i++){
            this.dataBus.detailHPGeHV[i] = Math.random();
        }
        for(i=0; i<16*20; i++){
            this.dataBus.detailBGOthreshold[i] = Math.random();
            this.dataBus.detailBGOrate[i] = Math.random();
        }
        for(i=0; i<16*40; i++){
            this.dataBus.detailBGOHV[i] = Math.random();        
        }

    };



    //do an initial populate
    this.update();
}