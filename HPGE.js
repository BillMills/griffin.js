HPGe.prototype = Object.create(Subsystem.prototype);

function HPGe(){
    //detector name, self-pointing pointer, pull in the Subsystem template, 
    //establish a databus and create a global-scope pointer to this object:
    this.name = 'HPGe';
    var that = this;
    Subsystem.call(this);
    window.HPGepointer = that;

    //member variables////////////////////////////////////////////////////////
    this.cloverShowing = 1;                         //index of clover currently showing in detail view
    this.detailShowing = 0;                         //is the detail canvas showing?
    this.scalePrefix = 'Clover ';                   //prefix for scale title

    this.mode = window.parameters.HPGemode;         //mode to run in, either 'TIGRESS' or 'GRIFFIN'
    this.dataBus = new HPGeDS(this.mode);                    //called after mode is fetched in order to know what kind of HPGe to deploy
    this.nHPGesegments = 0;
    if(this.mode == 'TIGRESS')
        this.nHPGesegments = 40;
    else if(this.mode == 'GRIFFIN')
        this.nHPGesegments = 8;

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

    //Member functions/////////////////////////////////////////////////////////////////////////////////

    //function to wrap drawing for animate
    this.draw = function(frame){
        var i, summaryKey;
        this.context.lineWidth = this.lineWeight;

        for(i=1; i<17; i++){
            summaryKey = 'GRG' + ( (i<10) ? '0'+i : i );
            this.drawHPGesummary(this.context, this.summaryCoord[i][0], this.summaryCoord[i][1], summaryKey, frame);
            this.drawHPGesummary(this.TTcontext, this.summaryCoord[i][0], this.summaryCoord[i][1], summaryKey, frame);

            summaryKey = 'GRS' + ( (i<10) ? '0'+i : i );
            this.drawHPGesummary(this.context, this.summaryCoord[i][0], this.summaryCoord[i][1], summaryKey, frame);
            this.drawHPGesummary(this.TTcontext, this.summaryCoord[i][0], this.summaryCoord[i][1], summaryKey, frame);            
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
        
        var toolTipContent = '';
        var nextLine;

        toolTipContent += this.defineHPGeText(cell) + '<br>';

        if(this.detailShowing){
            document.getElementById(this.detailTooltip.ttDivID).innerHTML = toolTipContent;
        } else{
            document.getElementById(this.tooltip.ttDivID).innerHTML = toolTipContent;
        }

        return 0;

    };

    this.update = function(){
        //get new data
        this.fetchNewData();

        //update the databus
        this.updateHPGe();

        //update tooltips & display
        this.tooltip.update();
        this.detailTooltip.update();
        this.displaySwitch();
    };

    this.fetchNewData = function(){
        this.fetchHPGeData();
    };

    //do an initial populate
    this.update();
}