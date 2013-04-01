HPGe.prototype = Object.create(Subsystem.prototype);

function HPGe(){
    this.name = 'HPGe';
    var that = this;
    this.prefix = window.parameters.HPGeprefix;
    this.postfix = window.parameters.HPGepostfix;
    Subsystem.call(this);
    this.dataBus = new HPGeDS();
    //make a pointer at window level back to this object, so we can pass by reference to the nav button onclick
    window.HPGepointer = that;


    

	this.detailCanvasID = 'HPGedetailCanvas';		//ID of canvas to draw single HPGe view on
    this.TTdetailCanvasID = 'HPGeTTdetailCanvas';   //ID of hidden tooltip map canvas for detail level
    this.mode = window.parameters.HPGemode;         //mode to run in, either 'TIGRESS' or 'GRIFFIN'
    this.BGOenable = window.parameters.BGOenable;   //are the suppresors present?


    this.cloverShowing = 1;                         //index of clover currently showing in detail view
    this.detailShowing = 0;                         //is the detail canvas showing?

    this.nHPGesegments = 0;
    if(this.mode == 'TIGRESS')
        this.nHPGesegments = 40;
    else if(this.mode == 'GRIFFIN')
        this.nHPGesegments = 8;




    //subsystem navigation//////////////////////////////////////////////////////////////////////////////
    //insert & scale canvas//////////////////////////////////////////////////////////////////////////////////////
    //detail level
    insertDOM('canvas', this.detailCanvasID, 'monitor', 'top:' + ($('#SubsystemLinks').height()*1.25 + 5) +'px; transition:opacity 0.5s, z-index 0.5s; -moz-transition:opacity 0.5s, z-index 0.5s; -webkit-transition:opacity 0.5s, z-index 0.5s;', this.monitorID, '', '')
    this.detailCanvas = document.getElementById(this.detailCanvasID);
    this.detailContext = this.detailCanvas.getContext('2d');
    this.detailCanvas.setAttribute('width', this.canvasWidth);
    this.detailCanvas.setAttribute('height', this.canvasHeight);
    //hidden Tooltip map layer for detail
    insertDOM('canvas', this.TTdetailCanvasID, 'monitor', 'top:' + ($('#SubsystemLinks').height()*1.25 + 5) +'px;', this.monitorID, '', '')
    this.TTdetailCanvas = document.getElementById(this.TTdetailCanvasID);
    this.TTdetailContext = this.TTdetailCanvas.getContext('2d');
    this.TTdetailCanvas.setAttribute('width', this.canvasWidth);
    this.TTdetailCanvas.setAttribute('height', this.canvasHeight);

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
                                    that.cloverShowing = cloverClicked
                                    that.drawDetail(that.detailContext, that.nFrames);
                                    that.drawDetail(that.TTdetailContext, that.nFrames);
                                    that.detailShowing = 1;
                                    swapFade(null, that, 1000, 0)
                                }
                            };



    //detail level tt:
    //paint whole hidden canvas with R!=G!=B to trigger TT suppression:
    this.TTdetailContext.fillStyle = 'rgba(50,100,150,1)';
    this.TTdetailContext.fillRect(0,0,this.canvasWidth, this.canvasHeight);
    //set up detail tooltip:
    this.detailTooltip = new Tooltip(this.detailCanvasID, 'HPGedetailTipText', 'HPGeTTdetail', this.monitorID, window.parameters.HPGeprefix, window.parameters.HPGepostfix);
    this.detailTooltip.obj = that;

    //drawing parameters/////////////////////////////////////////////////////////////////////////////////////////////
    this.centerX = this.canvasWidth/2;
    this.centerY = this.canvasHeight*0.4;
    this.lineWeight = 1;
    this.scaleHeight = 80;

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
    this.crystalSide = this.canvasWidth*0.1*0.9;
    this.suppressorWidth = this.canvasWidth*0.03*0.9;
    this.suppressorSpacing = this.canvasWidth*0.04*0.9;
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
    //decide which view to transition to when this object is navigated to
    this.view = function(){
        if(this.detailShowing == 0)
            return this.canvasID;
        else if(this.detailShowing == 1)
            return this.detailCanvasID;
    }

    this.draw = function(frame){
        var i;
        this.context.lineWidth = this.lineWeight;

        for(i=0; i<16; i++){
            this.drawSummary(this.summaryCoord[i+1][0], this.summaryCoord[i+1][1], this.summaryCoord[i+1][2], i+1, frame);
        }

        //titles
        this.context.clearRect(0,0.7*this.canvasHeight,this.canvasWidth,0.3*this.canvasHeight - this.scaleHeight);
        this.context.fillStyle = '#999999';
        this.context.font="24px 'Orbitron'";
        if(this.mode == 'TIGRESS'){
            this.context.fillText('North Hemisphere', 0.201*this.canvasWidth + this.BGOouter/2 - this.context.measureText('North Hemisphere').width/2, 0.8*this.canvasHeight);
            this.context.fillText('South Hemisphere', 0.701*this.canvasWidth + this.BGOouter/2 - this.context.measureText('North Hemisphere').width/2, 0.8*this.canvasHeight);
        } else if(this.mode == 'GRIFFIN'){
            this.context.fillText('West Hemisphere', 0.201*this.canvasWidth + this.BGOouter/2 - this.context.measureText('West Hemisphere').width/2, 0.8*this.canvasHeight);
            this.context.fillText('East Hemisphere', 0.701*this.canvasWidth + this.BGOouter/2 - this.context.measureText('East Hemisphere').width/2, 0.8*this.canvasHeight);
        }

        if(frame==this.nFrames || frame==0) this.drawScale(this.context);
    };


    //drawing functions/////////////////////////////////////////////////////////
    //summary view/////////////////////////

    this.drawSummary = function(x0,y0, hemisphere, cloverNumber, frame){
        var i;
        var colors 
        //cloverleaves are oriented differently in north and south hemispheres in the blueprints, match here:
        if(hemisphere == 'north') colors = ['#999999','#999999','#999999','#999999'];//['#00FF00', '#0000FF', '#FF0000', '#FFFFFF'];
        else if(hemisphere == 'south') colors = ['#999999','#999999','#999999','#999999'];//['#FFFFFF', '#FF0000', '#0000FF', '#00FF00'];

        for(i=0; i<4; i++){

            //HPGe
            //fill the crystal quarter with the appropriate color on the top view, or the tt encoding on the tt layer:
            if(window.subdetectorView == 0) this.context.fillStyle = interpolateColor(parseHexColor(this.oldSummaryHPGeHVcolor[4*(cloverNumber-1)+i]), parseHexColor(this.summaryHPGeHVcolor[4*(cloverNumber-1)+i]), frame/this.nFrames);
            else if(window.subdetectorView == 1) this.context.fillStyle = interpolateColor(parseHexColor(this.oldSummaryHPGethresholdColor[4*(cloverNumber-1)+i]), parseHexColor(this.summaryHPGethresholdColor[4*(cloverNumber-1)+i]), frame/this.nFrames);
            else if(window.subdetectorView == 2) this.context.fillStyle = interpolateColor(parseHexColor(this.oldSummaryHPGerateColor[4*(cloverNumber-1)+i]), parseHexColor(this.summaryHPGerateColor[4*(cloverNumber-1)+i]), frame/this.nFrames);
            this.context.fillRect(Math.round(x0 + (this.BGOouter-this.HPGeside)/2 + (i%2)*(this.lineWeight + this.HPGeside/2)), Math.round(y0 + (this.BGOouter-this.HPGeside)/2 + (i>>1)/2*(2*this.lineWeight + this.HPGeside)), Math.round(this.HPGeside/2),Math.round(this.HPGeside/2));
            //give the top view clovers an appropriately-colored outline:
            this.context.strokeStyle = colors[i];
            this.context.strokeRect(x0 + (this.BGOouter-this.HPGeside)/2 + (i%2)*(this.lineWeight + this.HPGeside/2), y0 + (this.BGOouter-this.HPGeside)/2 + (i>>1)/2*(2*this.lineWeight + this.HPGeside), this.HPGeside/2, this.HPGeside/2);

            //BGO
            var rotation 
            if(i<2) rotation = i*Math.PI/2;
            else if(i==2) rotation = 3*Math.PI/2;
            else if(i==3) rotation = Math.PI;
            var color = '#000000';
            if(this.BGOenable){
                if(window.subdetectorView == 0) color = interpolateColor(parseHexColor(this.oldSummaryBGOHVcolor[4*(cloverNumber-1)+i]), parseHexColor(this.summaryBGOHVcolor[4*(cloverNumber-1)+i]), frame/this.nFrames);
                else if(window.subdetectorView == 1) color = interpolateColor(parseHexColor(this.oldSummaryBGOthresholdColor[4*(cloverNumber-1)+i]), parseHexColor(this.summaryBGOthresholdColor[4*(cloverNumber-1)+i]), frame/this.nFrames);
                else if(window.subdetectorView == 2) color = interpolateColor(parseHexColor(this.oldSummaryBGOrateColor[4*(cloverNumber-1)+i]), parseHexColor(this.summaryBGOrateColor[4*(cloverNumber-1)+i]), frame/this.nFrames);
            }
            this.drawL(this.context, rotation, Math.round((this.BGOouter - this.BGOinner)/2), Math.round(this.BGOouter/2), Math.round(x0 + (this.BGOouter+this.lineWeight)*(i%2)), Math.round(y0 + (this.BGOouter+this.lineWeight)*(i>>1)), colors[i], color);

            //reproduce encoded shadow on the summary tooltip canvas:
            this.TTcontext.fillStyle = 'rgba('+cloverNumber+', '+cloverNumber+', '+cloverNumber+', 1)';
            this.TTcontext.fillRect(Math.round(x0), Math.round(y0), Math.round(this.BGOouter), Math.round(this.BGOouter) );
        }
    }

    //detail view///////////////////////////

    this.drawDetail = function(context, frame){
        var i, j;

        //state variables select the segmentation state of HPGe and services of BGO 
        var HPGestate, BGOstate;

        this.detailContext.lineWidth = this.lineWeight;

        //colorWheel enumerates the standard configuration of color sectors:
        var colorWheel =  ['#999999','#999999','#999999','#999999'];//['#00FF00', '#0000FF', '#FFFFFF', '#FF0000'];
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
                    fillColor  = interpolateColor(parseHexColor(this.oldDetailHPGeHVcolor[4*(this.cloverShowing-1)+i]), parseHexColor(this.detailHPGeHVcolor[4*(this.cloverShowing-1)+i]), frame/this.nFrames);
                } else{
                    fillColor  = 'rgba('+i+', '+i+', '+i+', 1)';
                }
                this.crystal(context, this.centerX + PBC*this.lineWeight + NAD*this.crystalSide, this.centerY + NAB*this.crystalSide + PCD*this.lineWeight, colorWheel[i], fillColor);

            } else if(HPGestate == 1){
                if(this.mode == 'TIGRESS'){
                    //cores
                    if(context == this.detailContext){
                        if(window.subdetectorView == 1){ 
                            fillColor  = interpolateColor(parseHexColor(this.oldDetailHPGethresholdColor[this.nHPGesegments*(this.cloverShowing-1)+this.nHPGesegments/4*i]), parseHexColor(this.detailHPGethresholdColor[this.nHPGesegments*(this.cloverShowing-1)+this.nHPGesegments/4*i]), frame/this.nFrames);
                            fillColor2 = interpolateColor(parseHexColor(this.oldDetailHPGethresholdColor[this.nHPGesegments*(this.cloverShowing-1)+this.nHPGesegments/4*i+1]), parseHexColor(this.detailHPGethresholdColor[this.nHPGesegments*(this.cloverShowing-1)+this.nHPGesegments/4*i+1]), frame/this.nFrames);
                        }
                        else if(window.subdetectorView == 2){
                            fillColor  = interpolateColor(parseHexColor(this.oldDetailHPGerateColor[this.nHPGesegments*(this.cloverShowing-1)+this.nHPGesegments/4*i]), parseHexColor(this.detailHPGerateColor[this.nHPGesegments*(this.cloverShowing-1)+this.nHPGesegments/4*i]), frame/this.nFrames);
                            fillColor2 = interpolateColor(parseHexColor(this.oldDetailHPGerateColor[this.nHPGesegments*(this.cloverShowing-1)+this.nHPGesegments/4*i+1]), parseHexColor(this.detailHPGerateColor[this.nHPGesegments*(this.cloverShowing-1)+this.nHPGesegments/4*i+1]), frame/this.nFrames);
                        }
                    } else{
                        fillColor  = 'rgba('+this.nHPGesegments/4*i+', '+this.nHPGesegments/4*i+', '+this.nHPGesegments/4*i+', 1)';
                        fillColor2 = 'rgba('+(this.nHPGesegments/4*i+1)+', '+(this.nHPGesegments/4*i+1)+', '+(this.nHPGesegments/4*i+1)+', 1)';
                    }
                    this.splitCrystal(context, this.centerX + NAD*2/3*this.crystalSide + PBC*1/3*this.crystalSide + PBC*this.lineWeight, this.centerY + NAB*2/3*this.crystalSide + PCD*1/3*this.crystalSide + PCD*this.lineWeight, this.crystalSide/3, i, colorWheel[i], fillColor, fillColor2);  

                    for(j=0; j<4; j++){
                        //useful switches:
                        var PBC2 = Math.ceil((j%3)/3);               //positive for i=1,2, 0 OW
                        var NAD2 = Math.ceil((j%3)/3) - 1;           //negative for i=0,3, 0 OW
                        var NAB2 = Math.floor(j/2) - 1;              //negative for i=0,1, 0 OW
                        var PCD2 = Math.floor(j/2);                  //positive for i=2,3, 0 OW

                        //front segs
                        if(context == this.detailContext){
                            if(window.subdetectorView == 1) fillColor = interpolateColor(parseHexColor(this.oldDetailHPGethresholdColor[this.nHPGesegments*(this.cloverShowing-1)+this.nHPGesegments/4*i+j+2]), parseHexColor(this.detailHPGethresholdColor[this.nHPGesegments*(this.cloverShowing-1)+this.nHPGesegments/4*i+j+2]), frame/this.nFrames);
                            else if(window.subdetectorView == 2) fillColor = interpolateColor(parseHexColor(this.oldDetailHPGerateColor[this.nHPGesegments*(this.cloverShowing-1)+this.nHPGesegments/4*i+j+2]), parseHexColor(this.detailHPGerateColor[this.nHPGesegments*(this.cloverShowing-1)+this.nHPGesegments/4*i+j+2]), frame/this.nFrames);
    
                        } else
                            fillColor = 'rgba('+(this.nHPGesegments/4*i+j+2)+', '+(this.nHPGesegments/4*i+j+2)+', '+(this.nHPGesegments/4*i+j+2)+', 1)';
                        this.drawL(context, j*Math.PI/2, this.crystalSide/6, 1/3*this.crystalSide, this.centerX + PBC*this.lineWeight + NAD*(-NAD2)*5/6*this.crystalSide + NAD*PBC2*1/6*this.crystalSide + PBC*(-NAD2)*1/6*this.crystalSide + PBC*PBC2*5/6*this.crystalSide, this.centerY + NAB*(-NAB2)*5/6*this.crystalSide + NAB*PCD2*1/6*this.crystalSide + PCD*(-NAB2)*1/6*this.crystalSide + PCD*PCD2*5/6*this.crystalSide + PCD*this.lineWeight, colorWheel[i], fillColor);

                        //back segs
                        if(context == this.detailContext){
                            if(window.subdetectorView == 1) fillColor = interpolateColor(parseHexColor(this.oldDetailHPGethresholdColor[this.nHPGesegments*(this.cloverShowing-1)+this.nHPGesegments/4*i+j+2+4]), parseHexColor(this.detailHPGethresholdColor[this.nHPGesegments*(this.cloverShowing-1)+this.nHPGesegments/4*i+j+2+4]), frame/this.nFrames);
                            else if(window.subdetectorView == 2) fillColor = interpolateColor(parseHexColor(this.oldDetailHPGerateColor[this.nHPGesegments*(this.cloverShowing-1)+this.nHPGesegments/4*i+j+2+4]), parseHexColor(this.detailHPGerateColor[this.nHPGesegments*(this.cloverShowing-1)+this.nHPGesegments/4*i+j+2+4]), frame/this.nFrames);
                        } else
                            fillColor = 'rgba('+(this.nHPGesegments/4*i+j+2+4)+', '+(this.nHPGesegments/4*i+j+2+4)+', '+(this.nHPGesegments/4*i+j+2+4)+', 1)';
                        this.drawL(context, j*Math.PI/2, this.crystalSide/6, this.crystalSide/2, this.centerX + (-NAD)*NAD2*this.crystalSide + PBC*PBC2*this.crystalSide + PBC*this.lineWeight, this.centerY + (-NAB)*NAB2*this.crystalSide + PCD*PCD2*this.crystalSide + PCD*this.lineWeight, colorWheel[i], fillColor);
                    }
                } else if(this.mode == 'GRIFFIN'){
                    //cores
                    if(context == this.detailContext){
                        if(window.subdetectorView == 1){
                            fillColor  = interpolateColor(parseHexColor(this.oldDetailHPGethresholdColor[8*(this.cloverShowing-1)+2*i]), parseHexColor(this.detailHPGethresholdColor[8*(this.cloverShowing-1)+2*i]), frame/this.nFrames);
                            fillColor2 = interpolateColor(parseHexColor(this.oldDetailHPGethresholdColor[8*(this.cloverShowing-1)+2*i+1]), parseHexColor(this.detailHPGethresholdColor[8*(this.cloverShowing-1)+2*i+1]), frame/this.nFrames);
                        }
                        else if(window.subdetectorView == 2){ 
                            fillColor = interpolateColor(parseHexColor(this.oldDetailHPGerateColor[8*(this.cloverShowing-1)+2*i]), parseHexColor(this.detailHPGerateColor[8*(this.cloverShowing-1)+2*i]), frame/this.nFrames);
                            fillColor2 = interpolateColor(parseHexColor(this.oldDetailHPGerateColor[8*(this.cloverShowing-1)+2*i+1]), parseHexColor(this.detailHPGerateColor[8*(this.cloverShowing-1)+2*i+1]), frame/this.nFrames);
                        }
                    } else {
                        fillColor  = 'rgba('+2*i+', '+2*i+', '+2*i+', 1)';
                        fillColor2 = 'rgba('+(2*i+1)+', '+(2*i+1)+', '+(2*i+1)+', 1)';
                    }

                    this.splitCrystal(context, this.centerX + NAD*this.crystalSide + PBC*this.lineWeight, this.centerY + NAB*this.crystalSide + PCD*this.lineWeight, this.crystalSide, i, colorWheel[i], fillColor, fillColor2);                    
                }
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
                        fillColor  = interpolateColor(parseHexColor(this.oldDetailBGOHVcolor[40*(this.cloverShowing-1)+i*2+j]), parseHexColor(this.detailBGOHVcolor[40*(this.cloverShowing-1)+i*2+j]), frame/this.nFrames);
                    }
                    else if(window.subdetectorView == 1) fillColor = interpolateColor(parseHexColor(this.oldDetailBGOthresholdColor[20*(this.cloverShowing-1)+i]), parseHexColor(this.detailBGOthresholdColor[20*(this.cloverShowing-1)+i]), frame/this.nFrames);
                    else if(window.subdetectorView == 2) fillColor = interpolateColor(parseHexColor(this.oldDetailBGOrateColor[20*(this.cloverShowing-1)+i]), parseHexColor(this.detailBGOrateColor[20*(this.cloverShowing-1)+i]), frame/this.nFrames);
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
                        fillColor  = interpolateColor(parseHexColor(this.oldDetailBGOHVcolor[40*(this.cloverShowing-1)+i*4+j*2+8]), parseHexColor(this.detailBGOHVcolor[40*(this.cloverShowing-1)+i*4+j*2+8]), frame/this.nFrames);
                        fillColor2 = interpolateColor(parseHexColor(this.oldDetailBGOHVcolor[40*(this.cloverShowing-1)+i*4+j*2+8+1]), parseHexColor(this.detailBGOHVcolor[40*(this.cloverShowing-1)+i*4+j*2+8+1]), frame/this.nFrames);
                    }
                    else if(window.subdetectorView == 1) fillColor = interpolateColor(parseHexColor(this.oldDetailBGOthresholdColor[20*(this.cloverShowing-1)+i*2+j+4]), parseHexColor(this.detailBGOthresholdColor[20*(this.cloverShowing-1)+i*2+j+4]), frame/this.nFrames);
                    else if(window.subdetectorView == 2) fillColor = interpolateColor(parseHexColor(this.oldDetailBGOrateColor[20*(this.cloverShowing-1)+i*2+j+4]), parseHexColor(this.detailBGOrateColor[20*(this.cloverShowing-1)+i*2+j+4]), frame/this.nFrames);
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
                        fillColor  = interpolateColor(parseHexColor(this.oldDetailBGOHVcolor[40*(this.cloverShowing-1)+i*4+j*2+8+16]), parseHexColor(this.detailBGOHVcolor[40*(this.cloverShowing-1)+i*4+j*2+8+16]), frame/this.nFrames);
                        fillColor2 = interpolateColor(parseHexColor(this.oldDetailBGOHVcolor[40*(this.cloverShowing-1)+i*4+j*2+8+16+1]), parseHexColor(this.detailBGOHVcolor[40*(this.cloverShowing-1)+i*4+j*2+8+16+1]), frame/this.nFrames);
                    }
                    else if(window.subdetectorView == 1) fillColor = interpolateColor(parseHexColor(this.oldDetailBGOthresholdColor[20*(this.cloverShowing-1)+i*2+j+4+8]), parseHexColor(this.detailBGOthresholdColor[20*(this.cloverShowing-1)+i*2+j+4+8]), frame/this.nFrames);
                    else if(window.subdetectorView == 2) fillColor = interpolateColor(parseHexColor(this.oldDetailBGOrateColor[20*(this.cloverShowing-1)+i*2+j+4+8]), parseHexColor(this.detailBGOrateColor[20*(this.cloverShowing-1)+i*2+j+4+8]), frame/this.nFrames);
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

        if(frame==this.nFrames || frame==0){
            //scale
            this.detailContext.clearRect(0,this.canvasHeight*0.80, this.canvasWidth, this.canvasHeight*0.2-this.scaleHeight);
            this.drawScale(this.detailContext);
            //title
            this.detailContext.fillStyle = '#999999';
            this.detailContext.font="24px 'Orbitron'";
            this.detailContext.fillText('Clover '+this.cloverShowing, 0.5*this.canvasWidth - this.detailContext.measureText('Clover '+this.cloverShowing).width/2, 0.85*this.canvasHeight);
        }
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
            context.strokeRect(x0, y0, this.crystalSide, this.crystalSide);
        }

    };    

    //draw split crystal for HV view
    this.splitCrystal = function(context, x0, y0, side, cloverLeaf, border, fill, fillB){
        //antialiasing hack: draw this first on the tooltip level
        if(context == this.TTdetailContext && fill != '#123456'){
            this.splitCrystal(context, x0, y0, side, border, '#123456', '#123456');
        }

        context.save();
        context.translate(x0+side/2, y0+side/2);
        context.rotate(Math.PI/2*cloverLeaf);
        context.strokeStyle = border;
        context.fillStyle = fill;
        context.beginPath();
        context.moveTo(side/2,-side/2);
        context.lineTo(-side/2,-side/2);
        context.lineTo(-side/2,side/2);
        context.closePath();
        context.fill();
        if(context == this.context || context == this.detailContext) context.stroke();

        context.fillStyle = fillB;
        context.beginPath();
        context.moveTo(side/2,-side/2);
        context.lineTo(side/2,side/2);
        context.lineTo(-side/2,side/2);
        context.closePath();
        context.fill();
        if(context == this.context || context == this.detailContext) context.stroke();
        context.restore();
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

        context.save();
        context.strokeStyle = border;
        context.fillStyle = fill;
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
            if(context == this.context || context == this.detailContext) context.stroke();

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

    //determine which color <scalar> corresponds to
    this.parseColor = function(scalar, detectorType){

        //how far along the scale are we?
        var scale;
        if(detectorType == 'HPGe')
            scale = (scalar - window.parameters.HPGeminima[window.subdetectorView]) / (window.parameters.HPGemaxima[window.subdetectorView] - window.parameters.HPGeminima[window.subdetectorView]);
        if(detectorType == 'BGO')
            scale = (scalar - window.parameters.BGOminima[window.subdetectorView]) / (window.parameters.BGOmaxima[window.subdetectorView] - window.parameters.BGOminima[window.subdetectorView]);
        //different scales for different meters to aid visual recognition:
        if(window.subdetectorView==0) return scalepickr(scale, 'rainbow');
        else if(window.subdetectorView==1) return scalepickr(scale, 'twighlight');
        else if(window.subdetectorView==2) return scalepickr(scale, 'thermalScope');
    };

    //decide which display version to show:
    this.displaySwitch = function(){
        this.TTdetailContext.fillStyle = 'rgba(50,100,150,1)';
        this.TTdetailContext.fillRect(0,0,this.canvasWidth,this.canvasHeight);
        this.drawDetail(this.detailContext, this.nFrames);
        this.drawDetail(this.TTdetailContext, this.nFrames);
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

    this.animate = function(){
        if(window.onDisplay == this.canvasID || window.freshLoad) animate(this, 0);
        else this.draw(this.nFrames);
        if(window.onDisplay == this.detailCanvasID || window.freshLoad) animateDetail(this, 0);
        else this.drawDetail(this.detailContext, this.nFrames);
    };

    this.drawScale = function(context){
        var i, j; 
        context.clearRect(0, this.canvasHeight - this.scaleHeight, this.canvasWidth, this.canvasHeight);

        var title, HPGeminTick, HPGemaxTick, BGOminTick, BGOmaxTick;
        title = window.parameters.monitorValues[window.subdetectorView];
        HPGeminTick = 'HPGe: ' + window.parameters.HPGeminima[window.subdetectorView] + ' ' + window.parameters.subdetectorUnit[window.subdetectorView];
        HPGemaxTick = 'HPGe: ' + window.parameters.HPGemaxima[window.subdetectorView] + ' ' + window.parameters.subdetectorUnit[window.subdetectorView];
        BGOminTick = 'BGO: ' + window.parameters.BGOminima[window.subdetectorView] + ' ' + window.parameters.subdetectorUnit[window.subdetectorView];
        BGOmaxTick = 'BGO: ' +window.parameters.BGOmaxima[window.subdetectorView] + ' ' + window.parameters.subdetectorUnit[window.subdetectorView];

        //titles
        context.fillStyle = '#999999';
        context.font="24px 'Orbitron'";
        context.fillText(title, this.canvasWidth/2 - context.measureText(title).width/2, this.canvasHeight-8);

        //tickmark;
        context.strokeStyle = '#999999';
        context.lineWidth = 1;
        context.font="12px 'Raleway'";

        context.beginPath();
        context.moveTo(this.canvasWidth*0.05+1, this.canvasHeight - 40);
        context.lineTo(this.canvasWidth*0.05+1, this.canvasHeight - 30);
        context.stroke();
        context.fillText(HPGeminTick, this.canvasWidth*0.05 - context.measureText(HPGeminTick).width/2, this.canvasHeight-15);
        context.fillText(BGOminTick, this.canvasWidth*0.05 - context.measureText(BGOminTick).width/2, this.canvasHeight-3);

        context.beginPath();
        context.moveTo(this.canvasWidth*0.95-1, this.canvasHeight - 40);
        context.lineTo(this.canvasWidth*0.95-1, this.canvasHeight - 30); 
        context.stroke();      
        context.fillText(HPGemaxTick, this.canvasWidth*0.95 - context.measureText(HPGemaxTick).width/2, this.canvasHeight-15);
        context.fillText(BGOmaxTick, this.canvasWidth*0.95 - context.measureText(BGOmaxTick).width/2, this.canvasHeight-3);

        for(i=0; i<3000; i++){
            if(window.subdetectorView == 0) context.fillStyle = scalepickr(0.001*(i%1000), 'rainbow');
            if(window.subdetectorView == 1) context.fillStyle = scalepickr(0.001*(i%1000), 'twighlight');
            if(window.subdetectorView == 2) context.fillStyle = scalepickr(0.001*(i%1000), 'thermalScope');
            context.fillRect(this.canvasWidth*0.05 + this.canvasWidth*0.9/1000*(i%1000), this.canvasHeight-60, this.canvasWidth*0.9/1000, 20);
        }

    };

    //do an initial populate
    this.update();
}