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
        var toolTipContent = '<br>';
        var nextLine;
        var cardIndex;
        var i, key, segA, segB, cloverNumber, cloverName, quadrant, BGO, channelName, detName, suffix, title, ABX;
        BGO = [];

        //summary level//////////////////////////////////////////////////
        if(!this.detailShowing){
            //CsI wall reporting:
            if(cell<24){
                key = this.dataBus.CsIwallTTmap[cell];
                nextLine = key;
                toolTipContent += nextLine + '<br><br>';

                toolTipContent += this.baseTTtext(this.dataBus.CsIwall[key].HV, this.dataBus.CsIwall[key].threshold, this.dataBus.CsIwall[key].rate);
            } else {
            
                //HPGe+BGO summaries
                cloverNumber = Math.floor((cell-100)/8);
                cloverName = 'GRG0'+cloverNumber;  //will match the HPGe summary ID of this clover
                quadrant = ((cell-100)%8)%4;
                if (quadrant==2) quadrant = 3;
                else if(quadrant==3) quadrant = 2;
                //HPGE
                if( (cell-100)%8 < 4 ){
                    segA = cloverName+this.dataBus.colorQuads[quadrant]+'N00A';
                    segB = cloverName+this.dataBus.colorQuads[quadrant]+'N00B';

                    //report segment A:
                    nextLine = segA;
                    toolTipContent = '<br>' + nextLine + '<br>';
                    toolTipContent += this.baseTTtext(this.dataBus.HPGe[cloverName][segA].HV, this.dataBus.HPGe[cloverName][segA].threshold, this.dataBus.HPGe[cloverName][segA].rate)

                    //report segment B:
                    nextLine = segB;
                    toolTipContent += '<br><br>' + nextLine + '<br>';
                    toolTipContent += this.baseTTtext(this.dataBus.HPGe[cloverName][segA].HV, this.dataBus.HPGe[cloverName][segB].threshold, this.dataBus.HPGe[cloverName][segB].rate)
        
                //BGO 
                } else {
                    cloverName = 'GRS0'+cloverNumber;
                    toolTipContent = '';
                    for(i=1; i<6; i++){
                        BGO[i] = cloverName+this.dataBus.colorQuads[quadrant]+'N0'+i+'X';
                        toolTipContent += '<br><br>' + BGO[i] + '<br>';
                        toolTipContent += this.baseTTtext(this.dataBus.HPGe[cloverName][BGO[i]].HVA, this.dataBus.HPGe[cloverName][BGO[i]].threshold, this.dataBus.HPGe[cloverName][BGO[i]].rate, this.dataBus.HPGe[cloverName][BGO[i]].HVB);
                    }
                    toolTipContent += '<br>';
                }
            }
        }
        //HPGe detail level///////////////////////////////////////////////
        else if(this.detailShowing){
            //HV view decodes detector from cell index algorithmically; rate view uses lookup table from DataStructures.  Haven't decided which I dislike less.
            if(window.subdetectorView == 0){ 
                toolTipContent = cell;

                //HPGe, front, side or back BGO?
                if(cell<4){
                    detName = 'GRG0'+this.cloverShowing+this.dataBus.colorQuads[cell]+'N00A';
                    title = detName.slice(0,9) + 'X';
                    nextLine = this.TTtext([['HV',this.dataBus.HPGe[detName.slice(0,5)][detName].HV,window.parameters.subdetectorUnit[0]],['Thresholds-A',this.dataBus.HPGe[detName.slice(0,5)][detName].threshold,window.parameters.subdetectorUnit[1]],['Thresholds-B',this.dataBus.HPGe[detName.slice(0,5)][detName.slice(0,9)+'B'].threshold,window.parameters.subdetectorUnit[1]],['Rate-A',this.dataBus.HPGe[detName.slice(0,5)][detName].rate,window.parameters.subdetectorUnit[2]],['Rate-B',this.dataBus.HPGe[detName.slice(0,5)][detName.slice(0,9)+'B'].rate,window.parameters.subdetectorUnit[2]]]);
                } else if(cell<12){ //back
                    detName = 'GRS0'+this.cloverShowing+this.dataBus.colorQuads[Math.floor((cell-4)/2)]+'N05X';
                } else if(cell<28){ //sides
                    suffix = (Math.floor( ((cell-12)%4) /2) == 0) ? 'N03X' : 'N04X';
                    detName = 'GRS0'+this.cloverShowing+this.dataBus.colorQuads[Math.floor((cell-12)/4)]+suffix;
                } else{ //front
                    suffix = (Math.floor( ((cell-28)%4) /2) == 0) ? 'N01X' : 'N02X';
                    detName = 'GRS0'+this.cloverShowing+this.dataBus.colorQuads[Math.floor((cell-28)/4)]+suffix;
                }
                if(cell>3){
                    ABX = (cell%2 == 0) ? 'A' : 'B';
                    title = detName.slice(0,9) + ABX;
                    nextLine = this.baseTTtext(this.dataBus.HPGe[detName.slice(0,5)][detName]['HV'+ABX], this.dataBus.HPGe[detName.slice(0,5)][detName].threshold, this.dataBus.HPGe[detName.slice(0,5)][detName].rate );
                }

                toolTipContent = '<br>' + title + '<br><br>' + nextLine;

            } else {
                channelName = this.dataBus.HPGeTTmap[(this.cloverShowing-1)*30 + cell];
                detName = channelName.slice(0,5);

                toolTipContent = '<br>' + channelName + '<br><br>';
                if(detName.slice(2,3) == 'G')
                    toolTipContent += this.baseTTtext(this.dataBus.HPGe[detName][channelName].HV, this.dataBus.HPGe[detName][channelName].threshold, this.dataBus.HPGe[detName][channelName].rate);
                else if(detName.slice(2,3) == 'S')
                    toolTipContent += this.baseTTtext(this.dataBus.HPGe[detName][channelName].HVA, this.dataBus.HPGe[detName][channelName].threshold, this.dataBus.HPGe[detName][channelName].rate, this.dataBus.HPGe[detName][channelName].HVB);
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
                
        //HPGe + BGO
        //summary level
        for(key in this.dataBus.summary){
            for(subKey in this.dataBus.summary[key]){

                detType = (key[2] == 'G') ? 'HPGe' : 'BGO';

                this.dataBus.summary[key][subKey].oldHVcolor = this.dataBus.summary[key][subKey].HVcolor;
                this.dataBus.summary[key][subKey].HVcolor = this.parseColor(this.dataBus.summary[key][subKey].HV, detType);
                this.dataBus.summary[key][subKey].oldThresholdColor = this.dataBus.summary[key][subKey].thresholdColor;
                this.dataBus.summary[key][subKey].thresholdColor = this.parseColor(this.dataBus.summary[key][subKey].threshold, detType);
                this.dataBus.summary[key][subKey].oldRateColor = this.dataBus.summary[key][subKey].rateColor;
                this.dataBus.summary[key][subKey].rateColor = this.parseColor(this.dataBus.summary[key][subKey].rate, detType);
            }
        }
        

        //detail level
        //loop over detectors
        for(key in this.dataBus.HPGe){
            //loop over detector elements
            for(subKey in this.dataBus.HPGe[key]){

                detType = (key[2] == 'G') ? 'HPGe' : 'BGO';

                if(detType == 'HPGe'){
                    this.dataBus.HPGe[key][subKey].oldHVcolor = this.dataBus.HPGe[key][subKey].HVcolor;
                    this.dataBus.HPGe[key][subKey].HVcolor = this.parseColor(this.dataBus.HPGe[key][subKey].HV, detType);                    
                } else{
                    this.dataBus.HPGe[key][subKey].oldHVAcolor = this.dataBus.HPGe[key][subKey].HVAcolor;
                    this.dataBus.HPGe[key][subKey].HVAcolor = this.parseColor(this.dataBus.HPGe[key][subKey].HVA, detType);
                    this.dataBus.HPGe[key][subKey].oldHVBcolor = this.dataBus.HPGe[key][subKey].HVBcolor;
                    this.dataBus.HPGe[key][subKey].HVBcolor = this.parseColor(this.dataBus.HPGe[key][subKey].HVB,detType);
                }
                this.dataBus.HPGe[key][subKey].oldThresholdColor = this.dataBus.HPGe[key][subKey].thresholdColor;
                this.dataBus.HPGe[key][subKey].thresholdColor = this.parseColor(this.dataBus.HPGe[key][subKey].threshold, detType);
                this.dataBus.HPGe[key][subKey].oldRateColor = this.dataBus.HPGe[key][subKey].rateColor;
                this.dataBus.HPGe[key][subKey].rateColor = this.parseColor(this.dataBus.HPGe[key][subKey].rate, detType);
            }
        }
       
        this.tooltip.update();
        this.detailTooltip.update();
        this.displaySwitch();
    };

    //overhauled data fetcher for new key value packing
    this.fetchNewData = function(){
        var i, j, key, subKey, summaryKey;

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
                if(key[2] == 'G'){
                    this.dataBus.summary[key][summaryKey].HV = this.dataBus.HPGe[key][summaryKey+'N00A']['HV']
                    this.dataBus.summary[key][summaryKey].threshold = (this.dataBus.HPGe[key][summaryKey+'N00A']['threshold'] + this.dataBus.HPGe[key][summaryKey+'N00B']['threshold'])/2;
                    this.dataBus.summary[key][summaryKey].rate = (this.dataBus.HPGe[key][summaryKey+'N00A']['rate'] + this.dataBus.HPGe[key][summaryKey+'N00B']['rate'])/2;
                } else if(key[2] == 'S'){
                    this.dataBus.summary[key][summaryKey].HV = 0;
                    for(j=1; j<6; j++){
                        this.dataBus.summary[key][summaryKey].HV += this.dataBus.HPGe[key][summaryKey+'N0'+j+'A'] / 10;
                        this.dataBus.summary[key][summaryKey].HV += this.dataBus.HPGe[key][summaryKey+'N0'+j+'A'] / 10;
                    }
                    this.dataBus.summary[key][summaryKey].threshold = (this.dataBus.HPGe[key][summaryKey+'N01X']['threshold'] + this.dataBus.HPGe[key][summaryKey+'N02X']['threshold'] + this.dataBus.HPGe[key][summaryKey+'N03X']['threshold'] + this.dataBus.HPGe[key][summaryKey+'N04X']['threshold'] + this.dataBus.HPGe[key][summaryKey+'N05X']['threshold'])/5;
                    this.dataBus.summary[key][summaryKey].rate = (this.dataBus.HPGe[key][summaryKey+'N01X']['rate'] + this.dataBus.HPGe[key][summaryKey+'N02X']['rate'] + this.dataBus.HPGe[key][summaryKey+'N03X']['rate'] + this.dataBus.HPGe[key][summaryKey+'N04X']['rate'] + this.dataBus.HPGe[key][summaryKey+'N05X']['rate'])/5;
                }
            }
            
        }
        
    };

    //do an initial populate:
    this.update();
}