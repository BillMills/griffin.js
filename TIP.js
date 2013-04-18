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
                                        parameterDialogue([['CsI', window.parameters[window.TIPpointer.name].minima['CsI'], window.parameters[window.TIPpointer.name].maxima['CsI']], ['HPGe', window.parameters[window.TIPpointer.name].minima['HPGe'], window.parameters[window.TIPpointer.name].maxima['HPGe']], ['BGO', window.parameters[window.TIPpointer.name].minima['BGO'], window.parameters[window.TIPpointer.name].maxima['BGO']]]);
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
                                } else if(y > that.canvasHeight - that.scaleHeight)
                                    //parameterDialogue([['CsI', window.parameters.TIPCsIminima, window.parameters.TIPCsImaxima], ['HPGe', window.parameters.TIPHPGeminima, window.parameters.TIPHPGemaxima], ['BGO',window.parameters.TIPBGOminima, window.parameters.TIPBGOmaxima]]);
                                    parameterDialogue([['CsI', window.parameters[window.TIPpointer.name].minima['CsI'], window.parameters[window.TIPpointer.name].maxima['CsI']], ['HPGe', window.parameters[window.TIPpointer.name].minima['HPGe'], window.parameters[window.TIPpointer.name].maxima['HPGe']], ['BGO', window.parameters[window.TIPpointer.name].minima['BGO'], window.parameters[window.TIPpointer.name].maxima['BGO']]]);
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

            if(window.subdetectorView == 0) this.context.fillStyle = interpolateColor(parseHexColor(this.dataBus.CsIwall[key].oldHVcolor), parseHexColor(this.dataBus.CsIwall[key].HVcolor), frame/this.nFrames);
            else if(window.subdetectorView == 1) this.context.fillStyle = interpolateColor(parseHexColor(this.dataBus.CsIwall[key].oldThresholdColor), parseHexColor(this.dataBus.CsIwall[key].thresholdColor), frame/this.nFrames);
            else if(window.subdetectorView == 2) this.context.fillStyle = interpolateColor(parseHexColor(this.dataBus.CsIwall[key].oldRateColor), parseHexColor(this.dataBus.CsIwall[key].rateColor), frame/this.nFrames);

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

        //HPGe summary tooltip
        this.drawHPGesummary(this.TTcontext, this.canvasWidth*0.7, this.canvasHeight*0.1, 'GRG01', frame);
        this.drawHPGesummary(this.TTcontext, this.canvasWidth*0.7, this.canvasHeight*0.325, 'GRG02', frame);
        this.drawHPGesummary(this.TTcontext, this.canvasWidth*0.7, this.canvasHeight*0.55, 'GRG03', frame);

        this.drawScale(this.context, frame);
    };

    this.defineText = function(cell){ //!!!HV todo in all HPGE reporting!///////////////////
        var toolTipContent = '<br>';
        var nextLine;
        var cardIndex;
        var i, key, segA, segB, cloverNumber, cloverName, quadrant;

        //summary level//////////////////////////////////////////////////
        //CsI wall reporting:
        if(cell<24){
            key = this.dataBus.CsIwallTTmap[cell];
            nextLine = key;
            toolTipContent += nextLine + '<br><br>';

            toolTipContent += this.baseTTtext(this.dataBus.CsIwall[key].HV, this.dataBus.CsIwall[key].threshold, this.dataBus.CsIwall[key].rate);
        } else {
        
            //HPGe+BGO summaries
            cloverNumber = Math.floor((cell-100)/8);
            cloverName = 'GRG0'+cloverNumber;  //will match the summary ID of this clover
            quadrant = ((cell-100)%8)%4;
            //HPGE
            if( (cell-100)%8 < 4 ){
                //identify cell mouse is pointing at:
                if(window.parameters.monitorValues[window.subdetectorView] == 'HV'){
                    //todo
                } else {
                    segA = cloverName+this.dataBus.colorQuads[quadrant]+'N00A';
                    segB = cloverName+this.dataBus.colorQuads[quadrant]+'N00B';
                }

                //report segment A:
                nextLine = segA;
                toolTipContent = '<br>' + nextLine + '<br>';
                if(window.parameters.monitorValues[window.subdetectorView] != 'HV'){
                    toolTipContent += this.baseTTtext(0, this.dataBus.HPGe[cloverName][segA].threshold, this.dataBus.HPGe[cloverName][segA].rate)
                } else{
                    //todo
                }

                //report segment B:
                nextLine = segB;
                toolTipContent += '<br><br>' + nextLine + '<br>';
                if(window.parameters.monitorValues[window.subdetectorView] != 'HV'){
                    toolTipContent += this.baseTTtext(0, this.dataBus.HPGe[cloverName][segB].threshold, this.dataBus.HPGe[cloverName][segB].rate)
                } else{
                    //todo
                }                
                
            }
            //BGO: TODO
        

            /*
            var cloverPointing = Math.floor((cell-100)/8);
            var cellPointing
            //HPGe
            if( (cell-100)%8 < 4 ){
                //identify cell mouse is pointing at:
                if(window.parameters.monitorValues[window.subdetectorView] != 'HV'){
                    cellPointing = 48 + cloverPointing*28 + 2*((cell-100)%8);
                } else {
                    cellPointing = 136 + cloverPointing*44 + 2*((cell-100)%8);
                }
                //report first crystal half
                nextLine = this.dataBus.key[cellPointing][0]   
                toolTipContent = '<br>' + nextLine + '<br>';
                if(window.parameters.monitorValues[window.subdetectorView] != 'HV' && (cell-100)%8<4){
                    toolTipContent += this.baseTTtext(-9999, this.dataBus.detailHPGethreshold[2*(cell-100 -4*cloverPointing)], this.dataBus.detailHPGerate[2*(cell -100-4*cloverPointing)])
                }
                //report second crystal half
                nextLine = this.dataBus.key[cellPointing+1][0]   
                toolTipContent += '<br><br>' + nextLine + '<br>';
                if(window.parameters.monitorValues[window.subdetectorView] != 'HV' && (cell-100)%8<4){
                    toolTipContent += this.baseTTtext(-9999, this.dataBus.detailHPGethreshold[2*(cell-100 -4*cloverPointing)+1], this.dataBus.detailHPGerate[2*(cell -100-4*cloverPointing)+1]) 
                }

            } else{
            //BGO: TODO

            }
            */
        }

        //HPGe detail level///////////////////////////////////////////////
        if(this.detailShowing){
            //determine index number per the mapping in the key definition in DataStructures.js:
            var chIndex;
            if(window.parameters.monitorValues[window.subdetectorView] != 'HV'){
                chIndex = 48 + this.cloverShowing*28 + cell;
            } else {
                chIndex = 136 + this.cloverShowing*44 + cell;
            }
            nextLine = this.dataBus.key[chIndex][0]
            //report the channel name
            toolTipContent = '<br>' + nextLine + '<br><br>';

            if(window.parameters.monitorValues[window.subdetectorView] != 'HV' && cell<8){
                toolTipContent += this.baseTTtext(-9999, this.dataBus.detailHPGethreshold[cell + this.nHPGesegments*this.cloverShowing], this.dataBus.detailHPGerate[cell + this.nHPGesegments*this.cloverShowing]);
            }
        }

        //put the text in the right tooltip:
        toolTipContent += '<br><br>';
        if(this.detailShowing){
            document.getElementById(this.detailTooltip.ttDivID).innerHTML = toolTipContent;
        } else{
            document.getElementById(this.tooltip.ttDivID).innerHTML = toolTipContent;
        }

        //return length of longest line:
        return 0;
    };

    this.update = function(){
        var key, subKey;

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
                
        //HPGe + BGO
        //summary level
        for(key in this.dataBus.summary){
            for(subKey in this.dataBus.summary[key]){

                this.dataBus.summary[key][subKey].oldHVcolor = this.dataBus.summary[key][subKey].HVcolor;
                this.dataBus.summary[key][subKey].HVcolor = this.parseColor(this.dataBus.summary[key][subKey].HV, 'HPGe');
                this.dataBus.summary[key][subKey].oldThresholdColor = this.dataBus.summary[key][subKey].thresholdColor;
                this.dataBus.summary[key][subKey].thresholdColor = this.parseColor(this.dataBus.summary[key][subKey].threshold, 'HPGe');
                this.dataBus.summary[key][subKey].oldRateColor = this.dataBus.summary[key][subKey].rateColor;
                this.dataBus.summary[key][subKey].rateColor = this.parseColor(this.dataBus.summary[key][subKey].rate, 'HPGe');
/*
                this.oldSummaryBGOHVcolor[i] = this.summaryBGOHVcolor[i];
                this.summaryBGOHVcolor[i] = this.parseColor(this.dataBus.summaryBGOHV[i], 'BGO');
                this.oldSummaryBGOthresholdColor[i] = this.summaryBGOthresholdColor[i];
                this.summaryBGOthresholdColor[i] = this.parseColor(this.dataBus.summaryBGOthreshold[i], 'BGO');
                this.oldSummaryBGOrateColor[i] = this.summaryBGOrateColor[i];
                this.summaryBGOrateColor[i] = this.parseColor(this.dataBus.summaryBGOrate[i], 'BGO');
*/
            }
        }
        

        //detail level
        //loop over detectors
        for(key in this.dataBus.HPGe){
            //loop over detector elements
            for(subKey in this.dataBus.HPGe[key]){
                this.dataBus.HPGe[key][subKey].oldHVcolor = this.dataBus.HPGe[key][subKey].HVcolor;
                this.dataBus.HPGe[key][subKey].HVcolor = this.parseColor(this.dataBus.HPGe[key][subKey].HV, 'HPGe');
                this.dataBus.HPGe[key][subKey].oldThresholdColor = this.dataBus.HPGe[key][subKey].thresholdColor;
                this.dataBus.HPGe[key][subKey].thresholdColor = this.parseColor(this.dataBus.HPGe[key][subKey].threshold, 'HPGe');
                this.dataBus.HPGe[key][subKey].oldRateColor = this.dataBus.HPGe[key][subKey].rateColor;
                this.dataBus.HPGe[key][subKey].rateColor = this.parseColor(this.dataBus.HPGe[key][subKey].rate, 'HPGe');
            }
        }
/*
        //BGO
        for(i=0; i<3*20; i++){
            this.oldDetailBGOthresholdColor[i] = this.detailBGOthresholdColor[i];
            this.detailBGOthresholdColor[i] = this.parseColor(this.dataBus.detailBGOthreshold[i], 'BGO');
            this.oldDetailBGOrateColor[i] = this.detailBGOrateColor[i];
            this.detailBGOrateColor[i] = this.parseColor(this.dataBus.detailBGOrate[i], 'BGO');
        }
        for(i=0; i<3*40; i++){
            this.oldDetailBGOHVcolor[i] = this.detailBGOHVcolor[i];
            this.detailBGOHVcolor[i] = this.parseColor(this.dataBus.detailBGOHV[i], 'BGO');
        }
*/        
        this.tooltip.update();
        this.detailTooltip.update();
        this.displaySwitch();
    };

    //overhauled data fetcher for new key value packing
    this.fetchNewData = function(){
        var i, key, subKey, summaryKey;

        //CsI
        for(key in this.dataBus.CsIwall){
            if(window.JSONPstore['parameters'])
                this.dataBus.CsIwall[key]['threshold'] = window.JSONPstore['parameters'][key]['threshold'];
            if(window.JSONPstore['scalar'])
                this.dataBus.CsIwall[key]['rate']      = window.JSONPstore['scalar'][key]['rate'];
        }
        
        //HPGe + BGO
        for(key in this.dataBus.HPGe){
            //detail
            for(subKey in this.dataBus.HPGe[key]){
                if(window.JSONPstore['parameters'])
                    this.dataBus.HPGe[key][subKey]['threshold'] = window.JSONPstore['parameters'][subKey]['threshold'];
                if(window.JSONPstore['scalar'])
                    this.dataBus.HPGe[key][subKey]['rate'] = window.JSONPstore['scalar'][subKey]['rate'];
            }

            //summary
            for(i=0; i<4; i++){
                summaryKey = key + this.dataBus.colorQuads[i];
                this.dataBus.summary[key][summaryKey].threshold = (this.dataBus.HPGe[key][summaryKey+'N00A']['threshold'] + this.dataBus.HPGe[key][summaryKey+'N00B']['threshold'])/2;
                this.dataBus.summary[key][summaryKey].rate = (this.dataBus.HPGe[key][summaryKey+'N00A']['rate'] + this.dataBus.HPGe[key][summaryKey+'N00B']['rate'])/2;
            }
        }
        
    };

    //do an initial populate:
    this.update();
}