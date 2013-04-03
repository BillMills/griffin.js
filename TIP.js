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

    //establish data buffers////////////////////////////////////////////////////////////////////////////
    //CsI
    this.CsIHVcolor = [];
    this.oldCsIHVcolor = [];
    this.CsIthresholdColor = [];
    this.oldCsIThresholdColor = [];
    this.CsIrateColor = [];
    this.oldCsIRateColor = [];

    //HPGe+BGO
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

    //member functions///////////////////////////////////////////////////////////////////


    this.draw = function(frame){
    	var i, iAdj;

        this.context.strokeStyle = '#999999';
        this.context.lineWidth = this.lineWeight;
        //CsI wall:
        //once for display canvas...
    	for(i=0; i<24; i++){
            iAdj = i;
            if (iAdj>11) iAdj++;

            if(window.subdetectorView == 0) this.context.fillStyle = interpolateColor(parseHexColor(this.oldCsIHVcolor[i]), parseHexColor(this.CsIHVcolor[i]), frame/this.nFrames);
            else if(window.subdetectorView == 1) this.context.fillStyle = interpolateColor(parseHexColor(this.oldCsIThresholdColor[i]), parseHexColor(this.CsIthresholdColor[i]), frame/this.nFrames);
            else if(window.subdetectorView == 2) this.context.fillStyle = interpolateColor(parseHexColor(this.oldCsIRateColor[i]), parseHexColor(this.CsIrateColor[i]), frame/this.nFrames);

            this.context.fillRect(this.CsIx0 + this.CsIcellSide*(iAdj%5), this.CsIy0 + this.CsIcellSide*Math.floor(iAdj/5), this.CsIcellSide, this.CsIcellSide);
            this.context.strokeRect(this.CsIx0 + this.CsIcellSide*(iAdj%5), this.CsIy0 + this.CsIcellSide*Math.floor(iAdj/5), this.CsIcellSide, this.CsIcellSide);

    	}
        //...and again for tt encoding:
        for(i=0; i<24; i++){
            iAdj = i;
            if (iAdj>11) iAdj++;

            this.TTcontext.fillStyle = 'rgba('+i+','+i+','+i+',1)';
            this.TTcontext.fillRect(Math.round(this.CsIx0 + this.CsIcellSide*(iAdj%5)), Math.round(this.CsIy0 + this.CsIcellSide*Math.floor(iAdj/5)), Math.round(this.CsIcellSide), Math.round(this.CsIcellSide));
        }

        //HPGe summaries
        this.drawHPGesummary(this.context, this.canvasWidth*0.7, this.canvasHeight*0.1, 0, frame);
        this.drawHPGesummary(this.context, this.canvasWidth*0.7, this.canvasHeight*0.325, 1, frame);
        this.drawHPGesummary(this.context, this.canvasWidth*0.7, this.canvasHeight*0.55, 2, frame);

        //HPGe summary tooltip
        this.drawHPGesummary(this.TTcontext, this.canvasWidth*0.7, this.canvasHeight*0.1, 0, frame);
        this.drawHPGesummary(this.TTcontext, this.canvasWidth*0.7, this.canvasHeight*0.325, 1, frame);
        this.drawHPGesummary(this.TTcontext, this.canvasWidth*0.7, this.canvasHeight*0.55, 2, frame);

        this.drawScale(this.context, frame);
    };

    this.drawDetail = function(context, frame){
        var i, j;

        //state variables select the segmentation state of HPGe and services of BGO 
        var HPGestate, BGOstate;

        this.detailContext.lineWidth = this.lineWeight;

        //colorWheel enumerates the standard configuration of color sectors:
        var colorWheel = ['#999999', '#999999', '#999999', '#999999'];
        //orientation enumerates orientations of half-BGOs
        var orientation = ['left', 'right'];

        var fillColor, fillColor2;

        if(window.subdetectorView == 0){
            HPGestate = 0; //no segmentation
            BGOstate = 1;  //two services per sector per side per suppressor
        }else if(window.subdetectorView == 1 || window.subdetectorView == 2){
            HPGestate = 1; //9-element segmentation
            BGOstate = 0;  //one service per sector per side per suppressor
        }
            
        //loop over quadrents:
        for(i=0; i<4; i++){
            //useful switches:
            var PBC = Math.ceil((i%3)/3);               //positive for i=1,2, 0 OW
            var NAD = Math.ceil((i%3)/3) - 1;           //negative for i=0,3, 0 OW
            var NAB = Math.floor(i/2) - 1;              //negative for i=0,1, 0 OW
            var PCD = Math.floor(i/2);                  //positive for i=2,3, 0 OW

            //HPGe/////////////////////////////
            if(HPGestate == 0){
                if(context == this.detailContext){
                    fillColor  = interpolateColor(parseHexColor(this.oldDetailHPGeHVcolor[4*(this.cloverShowing)+i]), parseHexColor(this.detailHPGeHVcolor[4*(this.cloverShowing)+i]), frame/this.nFrames);
                } else{
                    fillColor  = 'rgba('+i+', '+i+', '+i+', 1)';
                }
                this.crystal(context, this.centerX + PBC*this.lineWeight + NAD*this.crystalSide, this.centerY + NAB*this.crystalSide + PCD*this.lineWeight, colorWheel[i], fillColor);

            } else if(HPGestate == 1){
                //cores
                if(context == this.detailContext){
                    if(window.subdetectorView == 1){
                        fillColor  = interpolateColor(parseHexColor(this.oldDetailHPGethresholdColor[8*(this.cloverShowing)+2*i]), parseHexColor(this.detailHPGethresholdColor[8*(this.cloverShowing)+2*i]), frame/this.nFrames);
                        fillColor2 = interpolateColor(parseHexColor(this.oldDetailHPGethresholdColor[8*(this.cloverShowing)+2*i+1]), parseHexColor(this.detailHPGethresholdColor[8*(this.cloverShowing)+2*i+1]), frame/this.nFrames);
                    }
                    else if(window.subdetectorView == 2){ 
                        fillColor = interpolateColor(parseHexColor(this.oldDetailHPGerateColor[8*(this.cloverShowing)+2*i]), parseHexColor(this.detailHPGerateColor[8*(this.cloverShowing)+2*i]), frame/this.nFrames);
                        fillColor2 = interpolateColor(parseHexColor(this.oldDetailHPGerateColor[8*(this.cloverShowing)+2*i+1]), parseHexColor(this.detailHPGerateColor[8*(this.cloverShowing)+2*i+1]), frame/this.nFrames);
                    }
                } else {
                    fillColor  = 'rgba('+2*i+', '+2*i+', '+2*i+', 1)';
                    fillColor2 = 'rgba('+(2*i+1)+', '+(2*i+1)+', '+(2*i+1)+', 1)';
                }

                this.splitCrystal(context, this.centerX + NAD*this.crystalSide + PBC*this.lineWeight, this.centerY + NAB*this.crystalSide + PCD*this.lineWeight, this.crystalSide, i, colorWheel[i], fillColor, fillColor2);                       
            }

            //BGO//////////////////////////////
            for(j=0; j<2; j++){
                //useful switches
                var NA = j-1;
                var NB = (-1)*j;
                var PA = (j+1)%2;
                var PB = j;

                //back suppressors
                if(context == this.detailContext){
                    if(window.subdetectorView == 0){ 
                        fillColor  = interpolateColor(parseHexColor(this.oldDetailBGOHVcolor[40*(this.cloverShowing)+i*2+j]), parseHexColor(this.detailBGOHVcolor[40*(this.cloverShowing)+i*2+j]), frame/this.nFrames);
                    }
                    else if(window.subdetectorView == 1) fillColor = interpolateColor(parseHexColor(this.oldDetailBGOthresholdColor[20*(this.cloverShowing)+i]), parseHexColor(this.detailBGOthresholdColor[20*(this.cloverShowing)+i]), frame/this.nFrames);
                    else if(window.subdetectorView == 2) fillColor = interpolateColor(parseHexColor(this.oldDetailBGOrateColor[20*(this.cloverShowing)+i]), parseHexColor(this.detailBGOrateColor[20*(this.cloverShowing)+i]), frame/this.nFrames);
                } else{
                    if(window.subdetectorView == 0){
                        fillColor  = 'rgba('+(4+2*i+j)+', '+(4+2*i+j)+', '+(4+2*i+j)+', 1)';
                    }
                    else
                        fillColor = 'rgba('+(this.nHPGesegments+i)+', '+(this.nHPGesegments+i)+', '+(this.nHPGesegments+i)+', 1)';
                }
                if(window.subdetectorView == 0){
                    this.drawHalfL(context, (i-1+j)*(Math.PI/2), this.suppressorWidth, this.backBGOouterWidth/2, this.centerX + NAD*this.backBGOinnerWidth/2 + PBC*this.backBGOinnerWidth/2 + PBC*2*this.lineWeight + (-NAB)*NA*this.lineWeight + PCD*NB*this.lineWeight, this.centerY + (NAB+PCD)*this.backBGOinnerWidth/2 + PCD*2*this.lineWeight + (-NAD)*NB*this.lineWeight + PBC*NA*this.lineWeight, orientation[j], false, colorWheel[i], fillColor);
                } else if(window.subdetectorView == 1 || window.subdetectorView == 2){
                    if(j==0) this.drawL(context, i*(Math.PI/2), this.suppressorWidth, this.backBGOouterWidth/2, this.centerX + NAD*this.backBGOinnerWidth/2 + PBC*this.backBGOinnerWidth/2 + PBC*this.lineWeight + (NAD+PBC)*this.suppressorWidth, this.centerY + (NAB+PCD)*this.backBGOinnerWidth/2 + PCD*this.lineWeight + (NAB+PCD)*this.suppressorWidth, colorWheel[i], fillColor);    
                }

                //side suppressors
                if(context == this.detailContext){
                    if(window.subdetectorView == 0){
                        fillColor  = interpolateColor(parseHexColor(this.oldDetailBGOHVcolor[40*(this.cloverShowing)+i*4+j*2+8]), parseHexColor(this.detailBGOHVcolor[40*(this.cloverShowing)+i*4+j*2+8]), frame/this.nFrames);
                        fillColor2 = interpolateColor(parseHexColor(this.oldDetailBGOHVcolor[40*(this.cloverShowing)+i*4+j*2+8+1]), parseHexColor(this.detailBGOHVcolor[40*(this.cloverShowing)+i*4+j*2+8+1]), frame/this.nFrames);
                    }
                    else if(window.subdetectorView == 1) fillColor = interpolateColor(parseHexColor(this.oldDetailBGOthresholdColor[20*(this.cloverShowing)+i*2+j+4]), parseHexColor(this.detailBGOthresholdColor[20*(this.cloverShowing)+i*2+j+4]), frame/this.nFrames);
                    else if(window.subdetectorView == 2) fillColor = interpolateColor(parseHexColor(this.oldDetailBGOrateColor[20*(this.cloverShowing)+i*2+j+4]), parseHexColor(this.detailBGOrateColor[20*(this.cloverShowing)+i*2+j+4]), frame/this.nFrames);
                } else{
                    if(window.subdetectorView == 0){
                        fillColor  = 'rgba('+(4+8+4*i+2*j)+', '+(4+8+4*i+2*j)+', '+(4+8+4*i+2*j)+', 1)';
                        fillColor2 = 'rgba('+(4+8+4*i+2*j+1)+', '+(4+8+4*i+2*j+1)+', '+(4+8+4*i+2*j+1)+', 1)';
                    }
                    else
                        fillColor = 'rgba('+(this.nHPGesegments+4+2*i+j)+', '+(this.nHPGesegments+4+2*i+j)+', '+(this.nHPGesegments+4+2*i+j)+', 1)';
                }
                this.drawHalfL(context, (i-1+j)*(Math.PI/2), this.suppressorWidth, this.sideBGOouterWidth/2, this.centerX +NAD*this.sideBGOinnerWidth/2 + PBC*this.sideBGOinnerWidth/2 + PBC*2*this.lineWeight + (-NAB)*NA*this.lineWeight + PCD*NB*this.lineWeight     , this.centerY + (NAB+PCD)*this.sideBGOinnerWidth/2 + PCD*2*this.lineWeight + (-NAD)*NB*this.lineWeight + PBC*NA*this.lineWeight, orientation[j], BGOstate, colorWheel[i], fillColor, fillColor2);
                //front suppressors
                if(context == this.detailContext){
                    if(window.subdetectorView == 0){
                        fillColor  = interpolateColor(parseHexColor(this.oldDetailBGOHVcolor[40*(this.cloverShowing)+i*4+j*2+8+16]), parseHexColor(this.detailBGOHVcolor[40*(this.cloverShowing)+i*4+j*2+8+16]), frame/this.nFrames);
                        fillColor2 = interpolateColor(parseHexColor(this.oldDetailBGOHVcolor[40*(this.cloverShowing)+i*4+j*2+8+16+1]), parseHexColor(this.detailBGOHVcolor[40*(this.cloverShowing)+i*4+j*2+8+16+1]), frame/this.nFrames);
                    }
                    else if(window.subdetectorView == 1) fillColor = interpolateColor(parseHexColor(this.oldDetailBGOthresholdColor[20*(this.cloverShowing)+i*2+j+4+8]), parseHexColor(this.detailBGOthresholdColor[20*(this.cloverShowing)+i*2+j+4+8]), frame/this.nFrames);
                    else if(window.subdetectorView == 2) fillColor = interpolateColor(parseHexColor(this.oldDetailBGOrateColor[20*(this.cloverShowing)+i*2+j+4+8]), parseHexColor(this.detailBGOrateColor[20*(this.cloverShowing)+i*2+j+4+8]), frame/this.nFrames);
                } else{
                    if(window.subdetectorView == 0){
                        fillColor  = 'rgba('+(4+8+16+4*i+2*j)+', '+(4+8+16+4*i+2*j)+', '+(4+8+16+4*i+2*j)+', 1)';
                        fillColor2 = 'rgba('+(4+8+16+4*i+2*j+1)+', '+(4+8+16+4*i+2*j+1)+', '+(4+8+16+4*i+2*j+1)+', 1)';
                    }
                    else
                        fillColor = 'rgba('+(this.nHPGesegments+4+8+2*i+j)+', '+(this.nHPGesegments+4+8+2*i+j)+', '+(this.nHPGesegments+4+8+2*i+j)+', 1)';
                }
                this.drawHalfL(context, (i-1+j)*(Math.PI/2), this.suppressorWidth, this.frontBGOouterWidth/2 - this.sideSpacer, this.centerX + (PBC+NAD)*this.frontBGOinnerWidth/2 + PBC*this.lineWeight + (-NAB)*NA*this.sideSpacer + PCD*NB*this.sideSpacer + (-NAD)*this.sideSpacer, this.centerY + (NAB+PCD)*this.frontBGOinnerWidth/2 + PCD*this.lineWeight + (-NAB*PA + PBC*NA + PBC*PB + PCD*NB)*this.sideSpacer, orientation[j], BGOstate, colorWheel[i], fillColor, fillColor2);
            }   

        }

        //scale
        this.drawScale(this.detailContext, frame);
        //title
        this.detailContext.fillStyle = '#999999';
        this.detailContext.font="24px 'Orbitron'";
        this.detailContext.fillText('GRG0'+(this.cloverShowing+1), 0.5*this.canvasWidth - this.detailContext.measureText('GRG0'+(this.cloverShowing+1)).width/2, 0.85*this.canvasHeight);
    };

    this.defineText = function(cell){
        var toolTipContent = '<br>';
        var nextLine;
        var cardIndex;
        var i;

        //summary level//////////////////////////////////////////////////
        //CsI wall reporting:
        if(cell<24){
            nextLine = this.dataBus.key[cell][0];
            toolTipContent += nextLine + '<br><br>';

            //HV
            nextLine = this.prefix[0];
            nextLine += (this.dataBus.CsIHV[cell]).toFixed() + this.postfix[0];
            toolTipContent += nextLine + '<br>';
            //Thresholds
            nextLine = this.prefix[1];
            nextLine += (this.dataBus.CsIthresholds[cell]).toFixed() + this.postfix[1];
            toolTipContent += nextLine + '<br>';
            //Rate
            nextLine = this.prefix[2];
            nextLine += (this.dataBus.CsIrate[cell]).toFixed() + this.postfix[2];
            toolTipContent += nextLine; 
        } else {
        //HPGe+BGO summaries
            var cloverPointing = Math.floor((cell-100)/8);
            var cellPointing
            //HPGe
            if( (cell-100)%8 < 4 ){
                if(window.parameters.monitorValues[window.subdetectorView] != 'HV'){
                    cellPointing = 48 + cloverPointing*28 + 2*((cell-100)%8);
                } else {
                    cellPointing = 136 + cloverPointing*44 + 2*((cell-100)%8);
                }
                nextLine = this.dataBus.key[cellPointing][0]   
                toolTipContent = '<br>' + nextLine + '<br>';
                if(window.parameters.monitorValues[window.subdetectorView] != 'HV' && (cell-100)%8<4){
                    //HV: todo
                    //Thresholds
                    nextLine = this.prefix[1];
                    nextLine += (this.dataBus.detailHPGethreshold[2*(cell-100 -4*cloverPointing)]).toFixed() + this.postfix[1];
                    toolTipContent += nextLine + '<br>';
                    //Rate
                    nextLine = this.prefix[2];
                    nextLine += (this.dataBus.detailHPGerate[2*(cell -100-4*cloverPointing)]).toFixed() + this.postfix[2];
                    toolTipContent += nextLine; 
                }
                nextLine = this.dataBus.key[cellPointing+1][0]   
                toolTipContent += '<br><br>' + nextLine + '<br>';
                if(window.parameters.monitorValues[window.subdetectorView] != 'HV' && (cell-100)%8<4){
                    //HV: todo
                    //Thresholds
                    nextLine = this.prefix[1];
                    nextLine += (this.dataBus.detailHPGethreshold[2*(cell-100 -4*cloverPointing)+1]).toFixed() + this.postfix[1];
                    toolTipContent += nextLine + '<br>';
                    //Rate
                    nextLine = this.prefix[2];
                    nextLine += (this.dataBus.detailHPGerate[2*(cell -100-4*cloverPointing)+1]).toFixed() + this.postfix[2];
                    toolTipContent += nextLine; 
                }
            } else{
            //BGO: TODO

            }
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
                //HV: todo
                //Thresholds
                nextLine = this.prefix[1];
                nextLine += (this.dataBus.detailHPGethreshold[cell + this.nHPGesegments*this.cloverShowing]).toFixed() + this.postfix[1];
                toolTipContent += nextLine + '<br>';
                //Rate
                nextLine = this.prefix[2];
                nextLine += (this.dataBus.detailHPGerate[cell + this.nHPGesegments*this.cloverShowing]).toFixed() + this.postfix[2];
                toolTipContent += nextLine; 
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
        var i;

        //get new data
        this.fetchNewData();

        //parse the new data into colors
        //CsI
        for(i=0; i<this.dataBus.CsIHV.length; i++){
            this.oldCsIHVcolor[i] = this.CsIHVcolor[i];
            this.CsIHVcolor[i] = this.parseColor(this.dataBus.CsIHV[i], 'CsI');
            this.oldCsIThresholdColor[i] = this.CsIthresholdColor[i];
            this.CsIthresholdColor[i] = this.parseColor(this.dataBus.CsIthresholds[i], 'CsI');
            this.oldCsIRateColor[i] = this.CsIrateColor[i];
            this.CsIrateColor[i] = this.parseColor(this.dataBus.CsIrate[i], 'CsI');

        }

        //HPGe + BGO
        //summary level
        for(i=0; i<3*4; i++){
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
        for(i=0; i<3*this.nHPGesegments; i++){
            this.oldDetailHPGethresholdColor[i] = this.detailHPGethresholdColor[i];
            this.detailHPGethresholdColor[i] = this.parseColor(this.dataBus.detailHPGethreshold[i], 'HPGe');
            this.oldDetailHPGerateColor[i] = this.detailHPGerateColor[i];
            this.detailHPGerateColor[i] = this.parseColor(this.dataBus.detailHPGerate[i], 'HPGe');
        }
        for(i=0; i<3*4; i++){
            this.oldDetailHPGeHVcolor[i] = this.detailHPGeHVcolor[i];
            this.detailHPGeHVcolor[i] = this.parseColor(this.dataBus.detailHPGeHV[i], 'HPGe');
        }
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

        this.tooltip.update();
        this.detailTooltip.update();
        this.displaySwitch();
    };

    this.fetchNewData = function(){
        var i;

        //CsI
        for(i=0; i<24; i++){
            this.dataBus.CsIHV[i] = -9999//Math.random();
            this.dataBus.CsIthresholds[i] = -9999//Math.random();
            this.dataBus.CsIrate[i] = -9999//Math.random();
            if(this.dataBus.key[i][1] != -1)
                this.dataBus.CsIrate[i] = window.JSONPstore['scalar'][this.dataBus.key[i][1]]['fLastRate']
            if(this.dataBus.key[i][2] != -1 && window.JSONPstore['parameters'])
                this.dataBus.CsIthresholds[i] = window.JSONPstore['parameters'][0]['fVec'][this.dataBus.key[i][2]]
        }


        //HPGe + BGO
        //detail level
        var chIndex;
        for(i=0; i<3*this.nHPGesegments; i++){
            this.dataBus.detailHPGethreshold[i] = -9999;
            this.dataBus.detailHPGerate[i] = -9999;
            //determine index per key in DataStructures:
            chIndex = 48 + Math.floor(i/8)*28 + i%8;
            if(this.dataBus.key[chIndex][2] != -1)
                this.dataBus.detailHPGethreshold[i] = window.JSONPstore['parameters'][0]['fVec'][this.dataBus.key[chIndex][2]]//Math.random();
            if(this.dataBus.key[chIndex][1] != -1)
                this.dataBus.detailHPGerate[i] = window.JSONPstore['scalar'][this.dataBus.key[chIndex][1]]['fLastRate']//Math.random();
        }
        for(i=0; i<3*4; i++){
            this.dataBus.detailHPGeHV[i] = -9999//Math.random();
        }
        for(i=0; i<3*20; i++){
            this.dataBus.detailBGOthreshold[i] = -9999//Math.random();
            this.dataBus.detailBGOrate[i] = -9999//Math.random();
        }
        for(i=0; i<3*40; i++){
            this.dataBus.detailBGOHV[i] = -9999//Math.random();        
        }

        //summary level
        for(i=0; i<3*4; i++){
            this.dataBus.summaryHPGeHV[i] = (this.dataBus.detailHPGeHV[2*i] + this.dataBus.detailHPGeHV[2*i+1]) / 2//Math.random();
            this.dataBus.summaryHPGethreshold[i] =  (this.dataBus.detailHPGethreshold[2*i] + this.dataBus.detailHPGethreshold[2*i+1]) / 2//Math.random();
            this.dataBus.summaryHPGerate[i] = (this.dataBus.detailHPGerate[2*i] + this.dataBus.detailHPGerate[2*i+1]) / 2//Math.random();
            this.dataBus.summaryBGOHV[i] = -9999//Math.random();
            this.dataBus.summaryBGOthreshold[i] = -9999//Math.random();
            this.dataBus.summaryBGOrate[i] = -9999//Math.random();
        }
    };

    //do an initial populate:
    this.update();
}