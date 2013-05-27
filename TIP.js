TIP.prototype = Object.create(Subsystem.prototype);

function TIP(){
    //detector name, self-pointing pointer, pull in the Subsystem template, 
    //establish a databus and create a global-scope pointer to this object:
    this.name = 'TIP';
    var that = this;
    Subsystem.call(this);
    this.dataBus = new TIPDS();
    //make a pointer at window level back to this object, so we can pass by reference to the nav button onclick
    window.TIPpointer = that;

    //member variables///////////////////////////////////   
    this.nHPGesegments = 8;                         //per GRIFFIN
    this.cloverShowing = 1;                         //index of clover currently showing in detail view
    this.detailShowing = 0;                         //is the detail canvas showing?
    this.mode = 'GRIFFIN';                          //HPGe are all GRIFFIN-configuration
    this.scalePrefix = 'GRG0';                      //prefix for scale titles

    DetailView.call(this);                          //inject the infrastructure for a detail-level view
    HPGeAssets.call(this);                          //inject the HPGe drawing assets

    //onclick switch between top and detail view:
    this.detailCanvas.onclick = function(event){
                                    var y = event.pageY - that.canvas.offsetTop - that.monitor.offsetTop;    
                                    if(y < that.canvasHeight - that.scaleHeight){
                                        that.detailShowing = 0;
                                        swapFade(null, that, 1000, 0);
                                    } else {
                                        parameterDialogue(that.name, [ ['HPGe', window.parameters[that.name].minima['HPGe'][window.state.subdetectorView], window.parameters[that.name].maxima['HPGe'][window.state.subdetectorView],  window.parameters.subdetectorUnit[window.state.subdetectorView], '/DashboardConfig/TIP/HPGe'+scaleType()+'[0]', '/DashboardConfig/TIP/HPGe'+scaleType()+'[1]'], ['BGO', window.parameters[that.name].minima['BGO'][window.state.subdetectorView], window.parameters[that.name].maxima['BGO'][window.state.subdetectorView],  window.parameters.subdetectorUnit[window.state.subdetectorView], '/DashboardConfig/TIP/BGO'+scaleType()+'[0]', '/DashboardConfig/TIP/BGO'+scaleType()+'[1]']], window.parameters.subdetectorColors[window.state.subdetectorView]);
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
                                if(cloverClicked > 23){
                                    that.cloverShowing = Math.floor((cloverClicked - 100)/8);
                                    that.drawDetail(that.detailContext, that.nFrames);
                                    that.drawDetail(that.TTdetailContext, that.nFrames);
                                    that.detailShowing = 1;
                                    swapFade(null, that, 1000, 0)
                                } else if(y > that.canvasHeight - that.scaleHeight){
                                    parameterDialogue(that.name, [['CsI', window.parameters[that.name].minima['CsI'][window.state.subdetectorView], window.parameters[that.name].maxima['CsI'][window.state.subdetectorView], window.parameters.subdetectorUnit[window.state.subdetectorView], '/DashboardConfig/TIP/CsI'+scaleType()+'[0]', '/DashboardConfig/TIP/CsI'+scaleType()+'[1]' ], ['HPGe', window.parameters[that.name].minima['HPGe'][window.state.subdetectorView], window.parameters[that.name].maxima['HPGe'][window.state.subdetectorView],  window.parameters.subdetectorUnit[window.state.subdetectorView], '/DashboardConfig/TIP/HPGe'+scaleType()+'[0]', '/DashboardConfig/TIP/HPGe'+scaleType()+'[1]'], ['BGO', window.parameters[that.name].minima['BGO'][window.state.subdetectorView], window.parameters[that.name].maxima['BGO'][window.state.subdetectorView],  window.parameters.subdetectorUnit[window.state.subdetectorView], '/DashboardConfig/TIP/BGO'+scaleType()+'[0]', '/DashboardConfig/TIP/BGO'+scaleType()+'[1]']], window.parameters.subdetectorColors[window.state.subdetectorView]);
                                }
                            };

    //drawing parameters
    //general
    this.centerX = this.canvasWidth/2;
    this.centerY = this.canvasHeight*0.4;
    this.lineWeight = 1;

    //CsI
    this.CsIx0 = this.canvasWidth*0.1;
    this.CsIy0 = this.canvasHeight*0.1;
    this.CsIcellSide = this.canvasHeight*0.12;

    //HPGe+BGO
    //summary view
    var cloverScale = 1.1;
    this.BGOouter = cloverScale*0.15*this.canvasHeight;
    this.BGOinner = cloverScale*0.67*this.BGOouter;
    this.HPGeside = cloverScale*0.4*this.BGOouter;

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

    //member functions///////////////////////////////////////////////////////////////////

    this.draw = function(frame){
    	var key, iAdj, i;

        this.context.strokeStyle = '#999999';
        this.context.lineWidth = this.lineWeight;

        //CsI wall:
        //once for display canvas...
        for(key in this.dataBus.CsIwall){
            iAdj = this.dataBus.CsIwall[key].index;
            if (iAdj>11) iAdj++;

            if(window.state.subdetectorView == 0) this.context.fillStyle = interpolateColor(parseHexColor(this.dataBus.CsIwall[key].oldHVcolor), parseHexColor(this.dataBus.CsIwall[key].HVcolor), frame/this.nFrames);
            else if(window.state.subdetectorView == 1) this.context.fillStyle = interpolateColor(parseHexColor(this.dataBus.CsIwall[key].oldThresholdColor), parseHexColor(this.dataBus.CsIwall[key].thresholdColor), frame/this.nFrames);
            else if(window.state.subdetectorView == 2) this.context.fillStyle = interpolateColor(parseHexColor(this.dataBus.CsIwall[key].oldRateColor), parseHexColor(this.dataBus.CsIwall[key].rateColor), frame/this.nFrames);

            this.context.fillRect(this.CsIx0 + this.CsIcellSide*(iAdj%5), this.CsIy0 + this.CsIcellSide*Math.floor(iAdj/5), this.CsIcellSide, this.CsIcellSide);
            this.context.strokeRect(this.CsIx0 + this.CsIcellSide*(iAdj%5), this.CsIy0 + this.CsIcellSide*Math.floor(iAdj/5), this.CsIcellSide, this.CsIcellSide);

    	}
        //...and again for tt encoding:
        for(key in this.dataBus.CsIwall){
            i = this.dataBus.CsIwall[key].index;
            iAdj = i;
            if (iAdj>11) iAdj++;

            this.TTcontext.fillStyle = 'rgba('+i+','+i+','+i+',1)';
            this.TTcontext.fillRect(Math.round(this.CsIx0 + this.CsIcellSide*(iAdj%5)), Math.round(this.CsIy0 + this.CsIcellSide*Math.floor(iAdj/5)), Math.round(this.CsIcellSide), Math.round(this.CsIcellSide));
        }

        //HPGe summaries
        this.drawHPGesummary(this.context, this.canvasWidth*0.7, this.canvasHeight*0.1, 'GRG01', frame);
        this.drawHPGesummary(this.context, this.canvasWidth*0.7, this.canvasHeight*0.325, 'GRG02', frame);
        this.drawHPGesummary(this.context, this.canvasWidth*0.7, this.canvasHeight*0.55, 'GRG03', frame);
        this.drawHPGesummary(this.context, this.canvasWidth*0.7, this.canvasHeight*0.1, 'GRS01', frame);
        this.drawHPGesummary(this.context, this.canvasWidth*0.7, this.canvasHeight*0.325, 'GRS02', frame);
        this.drawHPGesummary(this.context, this.canvasWidth*0.7, this.canvasHeight*0.55, 'GRS03', frame);

        //HPGe summary tooltip
        this.drawHPGesummary(this.TTcontext, this.canvasWidth*0.7, this.canvasHeight*0.1, 'GRG01', frame);
        this.drawHPGesummary(this.TTcontext, this.canvasWidth*0.7, this.canvasHeight*0.325, 'GRG02', frame);
        this.drawHPGesummary(this.TTcontext, this.canvasWidth*0.7, this.canvasHeight*0.55, 'GRG03', frame);
        this.drawHPGesummary(this.TTcontext, this.canvasWidth*0.7, this.canvasHeight*0.1, 'GRS01', frame);
        this.drawHPGesummary(this.TTcontext, this.canvasWidth*0.7, this.canvasHeight*0.325, 'GRS02', frame);
        this.drawHPGesummary(this.TTcontext, this.canvasWidth*0.7, this.canvasHeight*0.55, 'GRS03', frame);

        this.drawScale(this.context, frame);
    };

    this.defineText = function(cell){
        var toolTipContent = '';
        var nextLine, key;

        if(!this.detailShowing && cell < 24){
            //CsI wall reporting:
            toolTipContent = '<br>'
            key = this.dataBus.CsIwallTTmap[cell];
            nextLine = key;
            toolTipContent += nextLine + '<br><br>';
            toolTipContent += this.baseTTtext(this.dataBus.CsIwall[key].HV, this.dataBus.CsIwall[key].threshold, this.dataBus.CsIwall[key].rate);
            toolTipContent += '<br>'
        } else {
            toolTipContent += this.defineHPGeText(cell);
        }

        //put the text in the right tooltip:
        toolTipContent += '<br>';
        if(this.detailShowing){
            document.getElementById(this.detailTooltip.ttDivID).innerHTML = toolTipContent;
        } else{
            document.getElementById(this.tooltip.ttDivID).innerHTML = toolTipContent;
        }

        return 0;
    };

    this.update = function(){
        var key, subKey, detType;

        //get new data
        this.fetchNewData();

        //parse the new data into colors
        //CsI
        for(key in this.dataBus.CsIwall){
            this.dataBus.CsIwall[key].oldHVcolor = this.dataBus.CsIwall[key].HVcolor;
            this.dataBus.CsIwall[key].HVcolor = this.parseColor(this.dataBus.CsIwall[key].HV, 'CsI');
            this.dataBus.CsIwall[key].oldThresholdColor = this.dataBus.CsIwall[key].thresholdColor;
            this.dataBus.CsIwall[key].thresholdColor = this.parseColor(this.dataBus.CsIwall[key].threshold, 'CsI');
            this.dataBus.CsIwall[key].oldRateColor = this.dataBus.CsIwall[key].rateColor;
            this.dataBus.CsIwall[key].rateColor = this.parseColor(this.dataBus.CsIwall[key].rate, 'CsI');
        }
                
        this.updateHPGe();
       
        this.tooltip.update();
        this.detailTooltip.update();
        this.displaySwitch();
    };

    //overhauled data fetcher for new key value packing
    this.fetchNewData = function(){
        /*
        //CsI
        for(key in this.dataBus.CsIwall){
            if(window.JSONPstore['parameters'])
                this.dataBus.CsIwall[key]['threshold'] = window.JSONPstore['parameters'][key]['threshold'];
            if(window.JSONPstore['scalar'])
                this.dataBus.CsIwall[key]['rate']      = window.JSONPstore['scalar'][key]['rate'];
        }
        
        //HPGe
        this.fetchHPGeData();
        */  //suppressed until overhaul of data throuhput complete
    };

    //do an initial populate:
    this.update();
}