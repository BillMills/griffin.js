//the subsystem object from which all subsystems will inherit.
function Subsystem(){
	var that = this;

	//names of things
	this.monitorID = window.parameters.wrapper;		//div ID of wrapper div
	this.linkWrapperID = 'SubsystemLinks';	        //ID of div wrapping subsystem navigation links
	this.sidebarID = 'SubsystemSidebar';			//ID of right sidebar for this object
	this.topNavID = 'SubsystemsButton';				//ID of top level nav button
	this.canvasID = this.name+'Canvas';		        //ID of canvas to draw main view on; this.name defined downstream in prototype chain
    this.subviewLink = this.name+'link';            //ID of inter-subsystem nav button
    this.TTcanvasID = this.name+'TTCanvas';         //ID of hidden tooltip map canvas for main view

    //other member data
    this.prefix = window.parameters[this.name].prefix;
    this.postfix = window.parameters[this.name].postfix;

    //animation parameters
    this.FPS = 30;
    this.duration = 0.5;
    this.nFrames = this.FPS*this.duration;
    
    //DOM insertions
    //insert nav link
	insertDOM('button', this.name+'link', 'navLink', '', this.linkWrapperID, function(){swapFade(this.id, this.parentPointer, window.subsystemScalars, window.subdetectorView)}, this.name, '', 'button');
    document.getElementById(this.name+'link').parentPointer = this;
    //scale canvas
	this.monitor = document.getElementById(this.monitorID);
    this.canvasWidth = 0.48*$(this.monitor).width();
    this.canvasHeight = 0.8*$(this.monitor).height();
    //detector view
    insertDOM('canvas', this.canvasID, 'monitor', 'top:' + ($('#'+this.linkWrapperID).height()*1.25 + 5) +'px;', this.monitorID, '', '')
    this.canvas = document.getElementById(this.canvasID);
    this.context = this.canvas.getContext('2d');
    this.canvas.setAttribute('width', this.canvasWidth);
    this.canvas.setAttribute('height', this.canvasHeight);
    //hidden Tooltip map layer
    insertDOM('canvas', this.TTcanvasID, 'monitor', 'top:' + ($('#'+this.linkWrapperID).height()*1.25 + 5) +'px;', this.monitorID, '', '')    
    this.TTcanvas = document.getElementById(this.TTcanvasID);
    this.TTcontext = this.TTcanvas.getContext('2d');
    this.TTcanvas.setAttribute('width', this.canvasWidth);
    this.TTcanvas.setAttribute('height', this.canvasHeight);

    //Dirty trick to implement tooltip on arbitrary geometry: make another canvas of the same size hidden beneath, with the 
    //detector drawn on it, but with each element filled in with rgba(0,0,n,1), where n is the channel number; fetching the color from the 
    //hidden canvas at point x,y will then return the appropriate channel index.
    //paint whole hidden canvas with R!=G!=B to trigger TT suppression:
    this.TTcontext.fillStyle = '#123456';
    this.TTcontext.fillRect(0,0,this.canvasWidth, this.canvasHeight);

    //set up tooltip:
    this.tooltip = new Tooltip(this.canvasID, this.name+'TT', this.monitorID, this.prefix, this.postfix);
    this.tooltip.obj = that;

    //what fraction of the canvas does the scale take up?  need this for onclick behavior:
    this.scaleHeight = this.canvasHeight*0.2;

    //member functions
    //determine which color <scalar> corresponds to
    this.parseColor = function(scalar, detector){

        //how far along the scale are we?  Technically this will produce the wrong color for canvases not currently on display.
        var scale = (scalar - window.parameters[this.name].minima[detector][window.subdetectorView]) / (window.parameters[this.name].maxima[detector][window.subdetectorView] - window.parameters[this.name].minima[detector][window.subdetectorView]);

        //different scales for different meters to aid visual recognition:
        if(window.subdetectorView==0) return scalepickr(scale, 'rainbow');
        else if(window.subdetectorView==1) return scalepickr(scale, 'twighlight');
        else if(window.subdetectorView==2) return scalepickr(scale, 'thermalScope');
    };

    //draw the color scale
    this.drawScale = function(context, frame){
        var i, j, key;
        var scaleFraction = 0.8  //fraction of canvas to span with the scale
        //clear the scale region
        context.clearRect(0, this.canvasHeight - this.scaleHeight, this.canvasWidth, this.canvasHeight);

        //compressed unit for scales, as a function of window.subdetectorView:
        var scaleUnit = [' k', String.fromCharCode(2406)+'10'+String.fromCharCode(179)+' ', ' k']

        var minTicks = [];
        var maxTicks = [];
        title = window.parameters.monitorValues[window.subdetectorView];
        for(key in window.parameters[this.name].minima){
            //minimas
            if(window.parameters[this.name].minima[key][window.subdetectorView] < 1000) minTicks[key] = key+': ' + window.parameters[this.name].minima[key][window.subdetectorView] + ' ' + window.parameters.subdetectorUnit[window.subdetectorView];
            else minTicks[key] = key + ': ' + window.parameters[this.name].minima[key][window.subdetectorView]/1000 + scaleUnit[window.subdetectorView] + window.parameters.subdetectorUnit[window.subdetectorView];
            //maximas:
            if(window.parameters[this.name].maxima[key][window.subdetectorView] < 1000) maxTicks[key] = key+': ' + window.parameters[this.name].maxima[key][window.subdetectorView] + ' ' + window.parameters.subdetectorUnit[window.subdetectorView];
            else maxTicks[key] = key + ': ' + window.parameters[this.name].maxima[key][window.subdetectorView]/1000 + scaleUnit[window.subdetectorView] + window.parameters.subdetectorUnit[window.subdetectorView];
        }

        //titles
        context.fillStyle = '#999999';
        context.font="24px 'Orbitron'";
        context.fillText(title, this.canvasWidth/2 - context.measureText(title).width/2, this.canvasHeight*0.95);

        //tickmark;
        context.strokeStyle = '#999999';
        context.lineWidth = 1;
        context.font="12px 'Raleway'";

        //min tick
        context.beginPath();
        context.moveTo(this.canvasWidth*(1-scaleFraction)/2+1, this.canvasHeight - this.scaleHeight/2);
        context.lineTo(this.canvasWidth*(1-scaleFraction)/2+1, this.canvasHeight - this.scaleHeight/2 + 10);
        context.stroke();
        i=0;
        for(key in window.parameters[this.name].minima){
            context.fillText(minTicks[key], this.canvasWidth*(1-scaleFraction)/2 - context.measureText(minTicks[key]).width/2, this.canvasHeight-this.scaleHeight/2 + 25+12*i);
            i++;
        }

        //max tick
        context.beginPath();
        context.moveTo(this.canvasWidth*(1-(1-scaleFraction)/2)-1, this.canvasHeight - this.scaleHeight/2);
        context.lineTo(this.canvasWidth*(1-(1-scaleFraction)/2)-1, this.canvasHeight - this.scaleHeight/2 + 10); 
        context.stroke();
        i=0;
        for(key in window.parameters[this.name].minima){
            context.fillText(maxTicks[key], this.canvasWidth*(1-(1-scaleFraction)/2) - context.measureText(maxTicks[key]).width/2, this.canvasHeight-this.scaleHeight/2 + 25+12*i);
            i++;
        }

        var colorSteps = 150
        for(i=0; i<3*colorSteps; i++){
            if(window.subdetectorView == 0) context.fillStyle = scalepickr((i%colorSteps)/colorSteps, 'rainbow');
            if(window.subdetectorView == 1) context.fillStyle = scalepickr((i%colorSteps)/colorSteps, 'twighlight');
            if(window.subdetectorView == 2) context.fillStyle = scalepickr((i%colorSteps)/colorSteps, 'thermalScope');
            context.fillRect(this.canvasWidth*(1-scaleFraction)/2 + this.canvasWidth*scaleFraction/colorSteps*(i%colorSteps), this.canvasHeight-this.scaleHeight/2-20, this.canvasWidth*scaleFraction/colorSteps, 20);
        }

    };

    //decide which view to transition to when this object is navigated to
    this.view = function(){
        return this.canvasID;
    };

    //determine the cell index at canvas position x, y
    this.findCell = function(x, y){
        var imageData = this.TTcontext.getImageData(x,y,1,1);
        var index = -1;
        if(imageData.data[0] == imageData.data[1] && imageData.data[0] == imageData.data[2]) index = imageData.data[0];
        return index;
    };

    //manage animation
    this.animate = function(){
        if(window.onDisplay == this.canvasID || window.freshLoad) animate(this, 0);
        else this.draw(this.nFrames);
    };

    //make the base HV / thresholds / rate summary text for the tooltip
    this.baseTTtext = function(HV, thresh, rate){
        var nextLine, toolTipContent;
        toolTipContent = '';

        //HV
        nextLine = window.parameters.monitorValues[0] + ': ';
        nextLine += HV.toFixed() + ' ' + window.parameters.subdetectorUnit[0];
        toolTipContent += nextLine + '<br>';
        //Thresholds
        nextLine = window.parameters.monitorValues[1] + ': ';
        nextLine += thresh.toFixed() + ' ' + window.parameters.subdetectorUnit[1];
        toolTipContent += nextLine + '<br>';
        //Rate
        nextLine = window.parameters.monitorValues[2] + ': ';
        nextLine += rate.toFixed() + ' ' + window.parameters.subdetectorUnit[2];
        toolTipContent += nextLine;

        return toolTipContent;
    };

}




//another object to inject into subsystems that need a detail-level view:
function DetailView(){
    var that = this;
    this.detailCanvasID = this.name+'detailCanvas';       //ID of canvas to draw single HPGe view on
    this.TTdetailCanvasID = this.name+'TTdetailCanvas';   //ID of hidden tooltip map canvas for detail level

    //insert & scale canvas
    insertDOM('canvas', this.detailCanvasID, 'monitor', 'top:' + ($('#'+this.linkWrapperID).height()*1.25 + 5) +'px; transition:opacity 0.5s, z-index 0.5s; -moz-transition:opacity 0.5s, z-index 0.5s; -webkit-transition:opacity 0.5s, z-index 0.5s;', this.monitorID, '', '');
    this.detailCanvas = document.getElementById(this.detailCanvasID);
    this.detailContext = this.detailCanvas.getContext('2d');
    this.detailCanvas.setAttribute('width', this.canvasWidth);
    this.detailCanvas.setAttribute('height', this.canvasHeight);
    //hidden Tooltip map layer for detail
    insertDOM('canvas', this.TTdetailCanvasID, 'monitor', 'top:' + ($('#'+this.linkWrapperID).height()*1.25 + 5) +'px;', this.monitorID, '', '')
    this.TTdetailCanvas = document.getElementById(this.TTdetailCanvasID);
    this.TTdetailContext = this.TTdetailCanvas.getContext('2d');
    this.TTdetailCanvas.setAttribute('width', this.canvasWidth);
    this.TTdetailCanvas.setAttribute('height', this.canvasHeight);

    //detail level tt:
    //paint whole hidden canvas with R!=G!=B to trigger TT suppression:
    this.TTdetailContext.fillStyle = 'rgba(50,100,150,1)';
    this.TTdetailContext.fillRect(0,0,this.canvasWidth, this.canvasHeight);
    //set up detail tooltip:
    this.detailTooltip = new Tooltip(this.detailCanvasID, this.name+'TTdetail', this.monitorID, window.parameters.HPGeprefix, window.parameters.HPGepostfix);
    this.detailTooltip.obj = that;

    //member functions
    //decide which view to transition to when this object is navigated to; overwrites equivalent in Subsystem.
    this.view = function(){
        if(this.detailShowing == 0)
            return this.canvasID;
        else if(this.detailShowing == 1)
            return this.detailCanvasID;
    };

    //determine the cell index at canvas position x, y; overwrites equivalent in Subsystem.
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

    //manage animation
    this.animate = function(){
        if(window.onDisplay == this.canvasID || window.freshLoad) animate(this, 0);
        else this.draw(this.nFrames);
        if(window.onDisplay == this.detailCanvasID || window.freshLoad) animateDetail(this, 0);
        else this.drawDetail(this.detailContext, this.nFrames);
    };

    //decide which display version to show:
    this.displaySwitch = function(){
        this.TTdetailContext.fillStyle = 'rgba(50,100,150,1)';
        this.TTdetailContext.fillRect(0,0,this.canvasWidth,this.canvasHeight);
        this.drawDetail(this.detailContext, this.nFrames);
        this.drawDetail(this.TTdetailContext, this.nFrames);
    };
}





//function wrapping all the specialized drawing tools for HPGe displays:
function HPGeAssets(){
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

    this.drawHPGesummary = function(context, x0,y0, cloverSummaryKey, frame){
        var key, i, iprime;
        var color1, color2;

        for(key in this.dataBus.summary[cloverSummaryKey]){
            i = this.dataBus.summary[cloverSummaryKey][key].quadrant;
            //HPGE
            if(context == this.TTcontext){
                iprime = 100+this.dataBus.summary[cloverSummaryKey][key].clover*8+i;
                context.fillStyle = 'rgba('+iprime+','+iprime+','+iprime+',1)';
            } else{
                if(window.subdetectorView == 0){
                    color1 = parseHexColor(this.dataBus.summary[cloverSummaryKey][key].oldHVcolor);
                    color2 = parseHexColor(this.dataBus.summary[cloverSummaryKey][key].HVcolor);
                } else if(window.subdetectorView == 1){
                    color1 = parseHexColor(this.dataBus.summary[cloverSummaryKey][key].oldThresholdColor);
                    color2 = parseHexColor(this.dataBus.summary[cloverSummaryKey][key].thresholdColor);
                } else if(window.subdetectorView == 2){
                    color1 = parseHexColor(this.dataBus.summary[cloverSummaryKey][key].oldRateColor);
                    color2 = parseHexColor(this.dataBus.summary[cloverSummaryKey][key].rateColor);
                }
                context.fillStyle = interpolateColor(color1, color2, frame/this.nFrames);
            }
            context.fillRect(Math.round(x0 + (this.BGOouter-this.HPGeside)/2 + (i%2)*(this.lineWeight + this.HPGeside/2)), Math.round(y0 + (this.BGOouter-this.HPGeside)/2 + (i>>1)/2*(2*this.lineWeight + this.HPGeside)), Math.round(this.HPGeside/2),Math.round(this.HPGeside/2));
            if(context != this.TTcontext){
                context.strokeStyle = '#999999';
                context.strokeRect(x0 + (this.BGOouter-this.HPGeside)/2 + (i%2)*(this.lineWeight + this.HPGeside/2), y0 + (this.BGOouter-this.HPGeside)/2 + (i>>1)/2*(2*this.lineWeight + this.HPGeside), this.HPGeside/2, this.HPGeside/2);
            }

            //BGO
        }

        /*
        var i, iprime;
        var colors = ['#999999', '#999999', '#999999', '#999999'];

        for(i=0; i<4; i++){

            //fudge to arrange the summary the same as the detail:
            if (i<2) iprime = i;
            if (i==2) iprime = 3;
            if (i==3) iprime = 2;

            //HPGe
            //fill the crystal quarter with the appropriate color on the top view, or the tt encoding on the tt layer:
            if(window.subdetectorView == 0) context.fillStyle = interpolateColor(parseHexColor(this.oldSummaryHPGeHVcolor[4*(cloverNumber)+i]), parseHexColor(this.summaryHPGeHVcolor[4*(cloverNumber)+i]), frame/this.nFrames);
            else if(window.subdetectorView == 1) context.fillStyle = interpolateColor(parseHexColor(this.oldSummaryHPGethresholdColor[4*(cloverNumber)+i]), parseHexColor(this.summaryHPGethresholdColor[4*(cloverNumber)+i]), frame/this.nFrames);
            else if(window.subdetectorView == 2) context.fillStyle = interpolateColor(parseHexColor(this.oldSummaryHPGerateColor[4*(cloverNumber)+i]), parseHexColor(this.summaryHPGerateColor[4*(cloverNumber)+i]), frame/this.nFrames);
            if(context == this.TTcontext) context.fillStyle = 'rgba('+(100+cloverNumber*8 + iprime)+', '+(100+cloverNumber*8 + iprime)+', '+(100+cloverNumber*8 + iprime)+', 1)';
            context.fillRect(Math.round(x0 + (this.BGOouter-this.HPGeside)/2 + (i%2)*(this.lineWeight + this.HPGeside/2)), Math.round(y0 + (this.BGOouter-this.HPGeside)/2 + (i>>1)/2*(2*this.lineWeight + this.HPGeside)), Math.round(this.HPGeside/2),Math.round(this.HPGeside/2));
            //give the top view clovers an appropriately-colored outline:
            if(context != this.TTcontext){
                context.strokeStyle = colors[i];
                context.strokeRect(x0 + (this.BGOouter-this.HPGeside)/2 + (i%2)*(this.lineWeight + this.HPGeside/2), y0 + (this.BGOouter-this.HPGeside)/2 + (i>>1)/2*(2*this.lineWeight + this.HPGeside), this.HPGeside/2, this.HPGeside/2);
            }

            //BGO
            var rotation 
            if(i<2) rotation = i*Math.PI/2;
            else if(i==2) rotation = 3*Math.PI/2;
            else if(i==3) rotation = Math.PI;
            var color = '#000000';
            if(window.subdetectorView == 0) color = interpolateColor(parseHexColor(this.oldSummaryBGOHVcolor[4*(cloverNumber)+i]), parseHexColor(this.summaryBGOHVcolor[4*(cloverNumber)+i]), frame/this.nFrames);
            else if(window.subdetectorView == 1) color = interpolateColor(parseHexColor(this.oldSummaryBGOthresholdColor[4*(cloverNumber)+i]), parseHexColor(this.summaryBGOthresholdColor[4*(cloverNumber)+i]), frame/this.nFrames);
            else if(window.subdetectorView == 2) color = interpolateColor(parseHexColor(this.oldSummaryBGOrateColor[4*(cloverNumber)+i]), parseHexColor(this.summaryBGOrateColor[4*(cloverNumber)+i]), frame/this.nFrames);
            if(context == this.TTcontext) color = 'rgba('+(100+cloverNumber*8 + 4 + iprime)+', '+(100+cloverNumber*8 + 4 + iprime)+', '+(100+cloverNumber*8 + 4 + iprime)+', 1)';
            this.drawL(context, rotation, Math.round((this.BGOouter - this.BGOinner)/2), Math.round(this.BGOouter/2), Math.round(x0 + (this.BGOouter+this.lineWeight)*(i%2)), Math.round(y0 + (this.BGOouter+this.lineWeight)*(i>>1)), colors[i], color);

        }
        */
    };

    this.drawDetail = function(context, frame){
        /*
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
                    fillColor  = interpolateColor(parseHexColor(this.oldDetailHPGeHVcolor[4*this.cloverShowing+i]), parseHexColor(this.detailHPGeHVcolor[4*this.cloverShowing+i]), frame/this.nFrames);
                } else{
                    fillColor  = 'rgba('+i+', '+i+', '+i+', 1)';
                }
                this.crystal(context, this.centerX + PBC*this.lineWeight + NAD*this.crystalSide, this.centerY + NAB*this.crystalSide + PCD*this.lineWeight, colorWheel[i], fillColor);

            } else if(HPGestate == 1){
                if(this.mode == 'TIGRESS'){
                    //cores
                    if(context == this.detailContext){
                        if(window.subdetectorView == 1){ 
                            fillColor  = interpolateColor(parseHexColor(this.oldDetailHPGethresholdColor[this.nHPGesegments*this.cloverShowing+this.nHPGesegments/4*i]), parseHexColor(this.detailHPGethresholdColor[this.nHPGesegments*this.cloverShowing+this.nHPGesegments/4*i]), frame/this.nFrames);
                            fillColor2 = interpolateColor(parseHexColor(this.oldDetailHPGethresholdColor[this.nHPGesegments*this.cloverShowing+this.nHPGesegments/4*i+1]), parseHexColor(this.detailHPGethresholdColor[this.nHPGesegments*this.cloverShowing+this.nHPGesegments/4*i+1]), frame/this.nFrames);
                        }
                        else if(window.subdetectorView == 2){
                            fillColor  = interpolateColor(parseHexColor(this.oldDetailHPGerateColor[this.nHPGesegments*this.cloverShowing+this.nHPGesegments/4*i]), parseHexColor(this.detailHPGerateColor[this.nHPGesegments*this.cloverShowing+this.nHPGesegments/4*i]), frame/this.nFrames);
                            fillColor2 = interpolateColor(parseHexColor(this.oldDetailHPGerateColor[this.nHPGesegments*this.cloverShowing+this.nHPGesegments/4*i+1]), parseHexColor(this.detailHPGerateColor[this.nHPGesegments*this.cloverShowing+this.nHPGesegments/4*i+1]), frame/this.nFrames);
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
                            if(window.subdetectorView == 1) fillColor = interpolateColor(parseHexColor(this.oldDetailHPGethresholdColor[this.nHPGesegments*this.cloverShowing+this.nHPGesegments/4*i+j+2]), parseHexColor(this.detailHPGethresholdColor[this.nHPGesegments*this.cloverShowing+this.nHPGesegments/4*i+j+2]), frame/this.nFrames);
                            else if(window.subdetectorView == 2) fillColor = interpolateColor(parseHexColor(this.oldDetailHPGerateColor[this.nHPGesegments*this.cloverShowing+this.nHPGesegments/4*i+j+2]), parseHexColor(this.detailHPGerateColor[this.nHPGesegments*this.cloverShowing+this.nHPGesegments/4*i+j+2]), frame/this.nFrames);
    
                        } else
                            fillColor = 'rgba('+(this.nHPGesegments/4*i+j+2)+', '+(this.nHPGesegments/4*i+j+2)+', '+(this.nHPGesegments/4*i+j+2)+', 1)';
                        this.drawL(context, j*Math.PI/2, this.crystalSide/6, 1/3*this.crystalSide, this.centerX + PBC*this.lineWeight + NAD*(-NAD2)*5/6*this.crystalSide + NAD*PBC2*1/6*this.crystalSide + PBC*(-NAD2)*1/6*this.crystalSide + PBC*PBC2*5/6*this.crystalSide, this.centerY + NAB*(-NAB2)*5/6*this.crystalSide + NAB*PCD2*1/6*this.crystalSide + PCD*(-NAB2)*1/6*this.crystalSide + PCD*PCD2*5/6*this.crystalSide + PCD*this.lineWeight, colorWheel[i], fillColor);

                        //back segs
                        if(context == this.detailContext){
                            if(window.subdetectorView == 1) fillColor = interpolateColor(parseHexColor(this.oldDetailHPGethresholdColor[this.nHPGesegments*this.cloverShowing+this.nHPGesegments/4*i+j+2+4]), parseHexColor(this.detailHPGethresholdColor[this.nHPGesegments*this.cloverShowing+this.nHPGesegments/4*i+j+2+4]), frame/this.nFrames);
                            else if(window.subdetectorView == 2) fillColor = interpolateColor(parseHexColor(this.oldDetailHPGerateColor[this.nHPGesegments*this.cloverShowing+this.nHPGesegments/4*i+j+2+4]), parseHexColor(this.detailHPGerateColor[this.nHPGesegments*this.cloverShowing+this.nHPGesegments/4*i+j+2+4]), frame/this.nFrames);
                        } else
                            fillColor = 'rgba('+(this.nHPGesegments/4*i+j+2+4)+', '+(this.nHPGesegments/4*i+j+2+4)+', '+(this.nHPGesegments/4*i+j+2+4)+', 1)';
                        this.drawL(context, j*Math.PI/2, this.crystalSide/6, this.crystalSide/2, this.centerX + (-NAD)*NAD2*this.crystalSide + PBC*PBC2*this.crystalSide + PBC*this.lineWeight, this.centerY + (-NAB)*NAB2*this.crystalSide + PCD*PCD2*this.crystalSide + PCD*this.lineWeight, colorWheel[i], fillColor);
                    }
                } else if(this.mode == 'GRIFFIN'){
                    //cores
                    if(context == this.detailContext){
                        if(window.subdetectorView == 1){
                            fillColor  = interpolateColor(parseHexColor(this.oldDetailHPGethresholdColor[8*this.cloverShowing+2*i]), parseHexColor(this.detailHPGethresholdColor[8*this.cloverShowing+2*i]), frame/this.nFrames);
                            fillColor2 = interpolateColor(parseHexColor(this.oldDetailHPGethresholdColor[8*this.cloverShowing+2*i+1]), parseHexColor(this.detailHPGethresholdColor[8*this.cloverShowing+2*i+1]), frame/this.nFrames);
                        }
                        else if(window.subdetectorView == 2){ 
                            fillColor = interpolateColor(parseHexColor(this.oldDetailHPGerateColor[8*this.cloverShowing+2*i]), parseHexColor(this.detailHPGerateColor[8*this.cloverShowing+2*i]), frame/this.nFrames);
                            fillColor2 = interpolateColor(parseHexColor(this.oldDetailHPGerateColor[8*this.cloverShowing+2*i+1]), parseHexColor(this.detailHPGerateColor[8*this.cloverShowing+2*i+1]), frame/this.nFrames);
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
                        fillColor  = interpolateColor(parseHexColor(this.oldDetailBGOHVcolor[40*this.cloverShowing+i*2+j]), parseHexColor(this.detailBGOHVcolor[40*this.cloverShowing+i*2+j]), frame/this.nFrames);
                    }
                    else if(window.subdetectorView == 1) fillColor = interpolateColor(parseHexColor(this.oldDetailBGOthresholdColor[20*this.cloverShowing+i]), parseHexColor(this.detailBGOthresholdColor[20*this.cloverShowing+i]), frame/this.nFrames);
                    else if(window.subdetectorView == 2) fillColor = interpolateColor(parseHexColor(this.oldDetailBGOrateColor[20*this.cloverShowing+i]), parseHexColor(this.detailBGOrateColor[20*this.cloverShowing+i]), frame/this.nFrames);
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
                        fillColor  = interpolateColor(parseHexColor(this.oldDetailBGOHVcolor[40*this.cloverShowing+i*4+j*2+8]), parseHexColor(this.detailBGOHVcolor[40*this.cloverShowing+i*4+j*2+8]), frame/this.nFrames);
                        fillColor2 = interpolateColor(parseHexColor(this.oldDetailBGOHVcolor[40*this.cloverShowing+i*4+j*2+8+1]), parseHexColor(this.detailBGOHVcolor[40*this.cloverShowing+i*4+j*2+8+1]), frame/this.nFrames);
                    }
                    else if(window.subdetectorView == 1) fillColor = interpolateColor(parseHexColor(this.oldDetailBGOthresholdColor[20*this.cloverShowing+i*2+j+4]), parseHexColor(this.detailBGOthresholdColor[20*this.cloverShowing+i*2+j+4]), frame/this.nFrames);
                    else if(window.subdetectorView == 2) fillColor = interpolateColor(parseHexColor(this.oldDetailBGOrateColor[20*this.cloverShowing+i*2+j+4]), parseHexColor(this.detailBGOrateColor[20*this.cloverShowing+i*2+j+4]), frame/this.nFrames);
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
                        fillColor  = interpolateColor(parseHexColor(this.oldDetailBGOHVcolor[40*this.cloverShowing+i*4+j*2+8+16]), parseHexColor(this.detailBGOHVcolor[40*this.cloverShowing+i*4+j*2+8+16]), frame/this.nFrames);
                        fillColor2 = interpolateColor(parseHexColor(this.oldDetailBGOHVcolor[40*this.cloverShowing+i*4+j*2+8+16+1]), parseHexColor(this.detailBGOHVcolor[40*this.cloverShowing+i*4+j*2+8+16+1]), frame/this.nFrames);
                    }
                    else if(window.subdetectorView == 1) fillColor = interpolateColor(parseHexColor(this.oldDetailBGOthresholdColor[20*this.cloverShowing+i*2+j+4+8]), parseHexColor(this.detailBGOthresholdColor[20*this.cloverShowing+i*2+j+4+8]), frame/this.nFrames);
                    else if(window.subdetectorView == 2) fillColor = interpolateColor(parseHexColor(this.oldDetailBGOrateColor[20*this.cloverShowing+i*2+j+4+8]), parseHexColor(this.detailBGOrateColor[20*this.cloverShowing+i*2+j+4+8]), frame/this.nFrames);
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
        this.drawScale(this.detailContext);
        //title
        this.detailContext.fillStyle = '#999999';
        this.detailContext.font="24px 'Orbitron'";
        this.detailContext.fillText(this.scalePrefix+(this.cloverShowing+1), 0.5*this.canvasWidth - this.detailContext.measureText(this.scalePrefix+(this.cloverShowing+1)).width/2, 0.85*this.canvasHeight);
        */
    };
}










