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
    this.cloversAbsent = [];                        //are any clovers removed to accomodate other subsystems?
    if(ODB.HPGe.upstreamLampAbsent)
        this.cloversAbsent = this.cloversAbsent.concat([13,14,15,16]);
    if(ODB.HPGe.downstreamLampAbsent)
        this.cloversAbsent = this.cloversAbsent.concat([1,2,3,4]);    

    this.mode = ODB.topLevel.HPGeArray;         //mode to run in, either 'TIGRESS' or 'GRIFFIN'
    this.dataBus = new cloverDS(16, this.mode);     //called after mode is fetched in order to know what kind of HPGe to deploy
    this.nHPGesegments = 0;
    if(this.mode == 'TIGRESS')
        this.nHPGesegments = 40;
    else if(this.mode == 'GRIFFIN')
        this.nHPGesegments = 8;

    this.BGOenable = window.parameters.BGOenable;   //are the suppresors present?

    DetailView.call(this);                          //inject the infrastructure for a detail-level view
    HPGeAssets.call(this);                          //inject the HPGe drawing assets

    //list of elements with distinct minima and maxima on subdetector views:
    this.subdetectors = ['HPGe', 'BGO'];

    //onclick switch between top and detail view:
    this.detailCanvas.onclick = function(event){
                                    var y = event.pageY - that.canvas.offsetTop - that.monitor.offsetTop;    
                                    if(y < that.canvasHeight - that.scaleHeight){
                                        that.detailShowing = 0;
                                        swapFade(null, that, 1000);
                                    } else{
                                        parameterDialogue(that.name, [['HPGe', ODB[that.name][that.constructMinMaxKey('HPGe')][0], ODB[that.name][that.constructMinMaxKey('HPGe')][1], window.parameters.subdetectorUnit[window.state.subdetectorView], '/DashboardConfig/HPGe/'+scaleType()+'[0]', '/DashboardConfig/HPGe/'+scaleType()+'[1]'], ['BGO', ODB[that.name][that.constructMinMaxKey('BGO')][0], ODB[that.name][that.constructMinMaxKey('BGO')][1],  window.parameters.subdetectorUnit[window.state.subdetectorView], '/DashboardConfig/HPGe/BGO'+scaleType()+'[0]', '/DashboardConfig/HPGe/BGO'+scaleType()+'[1]'] ], window.parameters.subdetectorColors[window.state.subdetectorView]);
                                    }
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
                                    that.TTdetailLayerDone = 0;  //need to redraw detail TT layer for different detail views
                                    if(that.cloversAbsent.indexOf(cloverClicked)==-1){
                                        that.cloverShowing = cloverClicked
                                        that.drawDetail(that.detailContext, that.nFrames);
                                        that.drawDetail(that.TTdetailContext, that.nFrames);
                                        that.detailShowing = 1;
                                        swapFade(null, that, 1000)
                                    }
                                } else if(y > that.canvasHeight - that.scaleHeight){
                                    parameterDialogue(that.name, [['HPGe', ODB[that.name][that.constructMinMaxKey('HPGe')][0], ODB[that.name][that.constructMinMaxKey('HPGe')][1], window.parameters.subdetectorUnit[window.state.subdetectorView], '/DashboardConfig/HPGe/'+scaleType()+'[0]', '/DashboardConfig/HPGe/'+scaleType()+'[1]'], ['BGO', ODB[that.name][that.constructMinMaxKey('BGO')][0], ODB[that.name][that.constructMinMaxKey('BGO')][1],  window.parameters.subdetectorUnit[window.state.subdetectorView], '/DashboardConfig/HPGe/BGO'+scaleType()+'[0]', '/DashboardConfig/HPGe/BGO'+scaleType()+'[1]'] ], window.parameters.subdetectorColors[window.state.subdetectorView]);
                                }
                            };


    //drawing parameters/////////////////////////////////////////////////////////////////////////////////////////////
    this.centerX = this.canvasWidth/2;
    this.centerY = this.canvasHeight*0.4;
    this.lineWeight = 1;
    this.context.lineWidth = this.lineWeight;
    this.context.strokeStyle = '#999999';

    this.BGOouter = 0.09*this.canvasWidth;
    this.BGOinner = 0.67*this.BGOouter;
    this.HPGeside = 0.4*this.BGOouter;

    this.firstRow = this.centerY - this.BGOouter/2 - .112*this.canvasWidth;
    this.secondRow = this.centerY - this.BGOouter/2;
    this.thirdRow = this.centerY - this.BGOouter/2 + .112*this.canvasWidth;

    this.firstCol = this.canvasWidth*0.022;
    this.secondCol = this.canvasWidth*0.134;
    this.thirdCol = this.canvasWidth*0.246;
    this.fourthCol = this.canvasWidth*0.358;
    this.fifthCol = this.canvasWidth*0.540;
    this.sixthCol = this.canvasWidth*0.652;
    this.seventhCol = this.canvasWidth*0.764;
    this.eighthCol = this.canvasWidth*0.876;

    this.summaryCoord = [];
    this.summaryCoord[5] = [this.thirdCol, this.secondRow, 'north'];
    this.summaryCoord[6] = [this.fourthCol, this.secondRow, 'north'];
    this.summaryCoord[7] = [this.fifthCol, this.secondRow, 'south'];
    this.summaryCoord[8] = [this.sixthCol, this.secondRow, 'south'];
    this.summaryCoord[9] = [this.seventhCol, this.secondRow, 'south']; 
    this.summaryCoord[10] = [this.eighthCol, this.secondRow, 'south'];
    this.summaryCoord[11] = [this.firstCol, this.secondRow, 'north'];
    this.summaryCoord[12] = [this.secondCol, this.secondRow, 'north'];
    if(this.mode == 'TIGRESS'){
        this.summaryCoord[1] = [this.thirdCol, this.firstRow, 'north'];
        this.summaryCoord[2] = [this.fifthCol, this.firstRow, 'south'];
        this.summaryCoord[3] = [this.seventhCol, this.firstRow, 'south'];
        this.summaryCoord[4] = [this.firstCol, this.firstRow, 'north'];
        this.summaryCoord[13] = [this.thirdCol, this.thirdRow, 'north'];
        this.summaryCoord[14] = [this.fifthCol, this.thirdRow, 'south'];
        this.summaryCoord[15] = [this.seventhCol, this.thirdRow, 'south'];
        this.summaryCoord[16] = [this.firstCol, this.thirdRow, 'north'];
    } else if(this.mode == 'GRIFFIN'){
        this.summaryCoord[1] = [this.fourthCol, this.firstRow, 'north'];
        this.summaryCoord[2] = [this.sixthCol, this.firstRow, 'south'];
        this.summaryCoord[3] = [this.eighthCol, this.firstRow, 'south'];
        this.summaryCoord[4] = [this.secondCol, this.firstRow, 'north'];
        this.summaryCoord[13] = [this.fourthCol, this.thirdRow, 'north'];
        this.summaryCoord[14] = [this.sixthCol, this.thirdRow, 'south'];
        this.summaryCoord[15] = [this.eighthCol, this.thirdRow, 'south'];
        this.summaryCoord[16] = [this.secondCol, this.thirdRow, 'north'];
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
        var i, summaryKey,
            pfx = (this.mode == 'TIGRESS') ? 'TI' : 'GR';

        //beam arrow
        this.context.clearRect(this.centerX-0.04*this.canvasWidth, 0, 0.07*this.canvasWidth, 0.7*this.canvasHeight);
        this.context.fillStyle = '#999999';
        this.context.font="24px 'Orbitron'";
        this.context.moveTo(this.centerX, 0.7*this.canvasHeight);
        this.context.lineTo(this.centerX, 0.1*this.canvasHeight);
        this.context.lineTo(this.centerX + 10, 0.1*this.canvasHeight + 10);
        this.context.stroke();
        this.context.save();
        this.context.translate(this.centerX-5, 0.1*this.canvasHeight);
        this.context.rotate(-Math.PI/2);
        this.context.fillText('Beam', -this.context.measureText('Beam').width-10, 0);
        this.context.restore();

        for(i=1; i<17; i++){
            summaryKey = pfx+'G' + ( (i<10) ? '0'+i : i );
            this.drawHPGesummary(this.context, this.summaryCoord[i][0], this.summaryCoord[i][1], summaryKey, frame);
            if(!this.TTlayerDone)
                this.drawHPGesummary(this.TTcontext, this.summaryCoord[i][0], this.summaryCoord[i][1], summaryKey, frame);

            summaryKey = pfx+'S' + ( (i<10) ? '0'+i : i );
            this.drawHPGesummary(this.context, this.summaryCoord[i][0], this.summaryCoord[i][1], summaryKey, frame);
            if(!this.TTlayerDone)
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

        this.TTlayerDone = 1;
    };

    this.defineText = function(cell){
        var toolTipContent = '';
        var nextLine;

        toolTipContent += this.defineHPGeText(cell) + '<br>';

        if(this.detailShowing){
            document.getElementById(this.detailTooltip.ttDivID).innerHTML = toolTipContent;
        } else{
            if( !( ((cell-100)%8 < 4) && this.mode=='TIGRESS') ){  //HPGe summaries on TIGRESS have so much stuff in them, they need to build their own table :(
                document.getElementById(this.tooltip.ttDivID).innerHTML = toolTipContent;
            }
        }

        return 0;

    };

    this.update = function(){
        //get new data
        this.fetchNewData();

        //update the databus
        this.updateHPGe();

        //update tooltips
        this.tooltip.update();
        this.detailTooltip.update();
        //this.displaySwitch();

        //animate if on top:
        this.animate();
    };

    this.fetchNewData = function(){
        this.fetchHPGeData();
    };

    //do an initial populate
    //console.log('first Update')
    //this.update();
}