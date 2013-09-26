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
    this.TTlayerDone = 0;                           //set to 1 when TT layer painted, don't paint again.

    //animation parameters
    this.FPS = 30;
    this.duration = 0.5;
    this.nFrames = this.FPS*this.duration;
    
    //DOM insertions
    //insert nav link
	insertDOM('button', this.name+'link', 'navLink', '', this.linkWrapperID, function(){ swapFade(this.id, this.parentPointer, window.subsystemScalars); rePaint();}, this.name, '', 'button');
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
    //set up scale adjust dialog:
    
    this.canvas.onclick = function(event){
        var y = event.pageY - that.canvas.offsetTop - that.monitor.offsetTop;
        if(y > that.canvasHeight - that.scaleHeight)
            parameterDialogue(that.name, [[that.name, ODB[that.name][that.constructMinMaxKey(that.name)][0], ODB[that.name][that.constructMinMaxKey(that.name)][1], window.parameters.subdetectorUnit[window.state.subdetectorView], '/DashboardConfig/'+that.name+'/'+scaleType()+'[0]', '/DashboardConfig/'+that.name+'/'+scaleType()+'[1]']], window.parameters.subdetectorColors[window.state.subdetectorView]);
    }
    
    //member functions
    //construct the key pointing to the display min and max of detector
    this.constructMinMaxKey = function(detector){
        var limitIndex, limitKey;

        //construct key pointing to relevant minima and maxima, = subsystem name + view state + 'Scale'
        limitIndex = (window.state.subdetectorView < 3) ? window.state.subdetectorView : window.state.subdetectorView-2;
        limitKey = (that.name == detector) ? '' : detector;
        if(limitIndex == 0)
            limitKey += 'HVscale'
        else if(limitIndex == 1)
            limitKey += 'thresholdScale'
        else if(limitIndex == 2)
            limitKey += 'rateScale'

        return limitKey;
    };

    //determine which color <scalar> corresponds to
    this.parseColor = function(scalar, detector){
        var scale,
        limitKey = this.constructMinMaxKey(detector);

        if(scalar == 0xDEADBEEF) return 0xDEADBEEF

        //how far along the scale are we?  Technically this will produce the wrong color for canvases not currently on display.
        if(window.parameters.detectorLogMode.SubsystemsButton){
            scale = (Math.log(scalar) - Math.log(ODB[this.name][limitKey][0])) / (Math.log(ODB[this.name][limitKey][1]) - Math.log(ODB[this.name][limitKey][0]));
        } else {
            scale = (scalar - ODB[this.name][limitKey][0]) / (ODB[this.name][limitKey][1] - ODB[this.name][limitKey][0]);
        }

        //different scales for different meters to aid visual recognition:
        if(window.state.subdetectorView==0) return scalepickr(scale, window.parameters.subdetectorColors[0]);
        else if(window.state.subdetectorView==1 || window.state.subdetectorView==3) return scalepickr(scale, window.parameters.subdetectorColors[1]);
        else if(window.state.subdetectorView==2 || window.state.subdetectorView==4) return scalepickr(scale, window.parameters.subdetectorColors[2]);
    };

    //draw the color scale
    this.drawScale = function(context, frame){
        var i, j, key, nKeys=0, label, limitIndex, limitKey;
        var scaleFraction = 0.8  //fraction of canvas to span with the scale
        //clear the scale region
        context.clearRect(0, this.canvasHeight - this.scaleHeight, this.canvasWidth, this.canvasHeight);

        //compressed unit for scales, as a function of window.state.subdetectorView:
        var scaleUnit = [' k', String.fromCharCode(2406)+'10'+String.fromCharCode(179)+' ', ' k']

        //where in the array of minima / maxima will we find the appropriate limit:
        limitIndex = (window.state.subdetectorView < 3) ? window.state.subdetectorView : window.state.subdetectorView-2;

        //define the strings to use for each minima and maxima label:
        var minTicks = [];
        var maxTicks = [];
        title = window.parameters.monitorValues[limitIndex];
        if(window.parameters.detectorLogMode.SubsystemsButton) title = 'log(' + title + ')';
        for(i=0; i<this.subdetectors.length; i++){
            limitKey = this.constructMinMaxKey(this.subdetectors[i]);
            if(window.parameters.detectorLogMode.SubsystemsButton){
                //minimas
                minTicks[this.subdetectors[i]] = this.subdetectors[i]+': ' + Math.log(ODB[this.name][limitKey][0]).toFixed(1) + ' log(' + window.parameters.subdetectorUnit[limitIndex]+')';
                //maximas:
                maxTicks[this.subdetectors[i]] = this.subdetectors[i]+': ' + Math.log(ODB[this.name][limitKey][1]).toFixed(1) + ' log(' + window.parameters.subdetectorUnit[limitIndex]+')';
            } else {
                //minimas
                if(ODB[this.name][limitKey][0] < 1000) minTicks[this.subdetectors[i]] = this.subdetectors[i]+': ' + ODB[this.name][limitKey][0] + ' ' + window.parameters.subdetectorUnit[limitIndex];
                else minTicks[this.subdetectors[i]] = this.subdetectors[i] + ': ' + ODB[this.name][limitKey][0]/1000 + scaleUnit[limitIndex] + window.parameters.subdetectorUnit[limitIndex];
                //maximas:
                if(ODB[this.name][limitKey][1] < 1000) maxTicks[this.subdetectors[i]] = this.subdetectors[i]+': ' + ODB[this.name][limitKey][1] + ' ' + window.parameters.subdetectorUnit[limitIndex];
                else maxTicks[this.subdetectors[i]] = this.subdetectors[i] + ': ' + ODB[this.name][limitKey][1]/1000 + scaleUnit[limitIndex] + window.parameters.subdetectorUnit[limitIndex];
            }
            nKeys++;            
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
        for(i=0; i<this.subdetectors.length; i++){
            label = ((nKeys == 1) ? minTicks[this.subdetectors[i]].slice(minTicks[this.subdetectors[i]].indexOf(':')+2, minTicks[this.subdetectors[i]].length+1) : minTicks[this.subdetectors[i]]);
            context.fillText( label, this.canvasWidth*(1-scaleFraction)/2 - context.measureText(label).width/2, this.canvasHeight-this.scaleHeight/2 + 25+12*i);
        }

        //max tick
        context.beginPath();
        context.moveTo(this.canvasWidth*(1-(1-scaleFraction)/2)-1, this.canvasHeight - this.scaleHeight/2);
        context.lineTo(this.canvasWidth*(1-(1-scaleFraction)/2)-1, this.canvasHeight - this.scaleHeight/2 + 10); 
        context.stroke();
        for(i=0; i<this.subdetectors.length; i++){
            label = ((nKeys == 1) ? maxTicks[this.subdetectors[i]].slice(maxTicks[this.subdetectors[i]].indexOf(':')+2, maxTicks[this.subdetectors[i]].length+1) : maxTicks[this.subdetectors[i]]);
            context.fillText(label, this.canvasWidth*(1-(1-scaleFraction)/2) - context.measureText(label).width/2, this.canvasHeight-this.scaleHeight/2 + 25+12*i);
        }

        var colorSteps = 150
        for(i=0; i<3*colorSteps; i++){
            if(window.state.subdetectorView == 0) context.fillStyle = scalepickr((i%colorSteps)/colorSteps, window.parameters.subdetectorColors[0]);
            if(window.state.subdetectorView == 1 || window.state.subdetectorView == 3) context.fillStyle = scalepickr((i%colorSteps)/colorSteps, window.parameters.subdetectorColors[1]);
            if(window.state.subdetectorView == 2 || window.state.subdetectorView == 4) context.fillStyle = scalepickr((i%colorSteps)/colorSteps, window.parameters.subdetectorColors[2]);
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
        if(window.onDisplay == this.canvasID) animate(this, 0);
    };

    //make the base HV / thresholds / rate summary text for the tooltip
    this.baseTTtext = function(HV, thresh, rate, HVB){
        var nextLine, toolTipContent;
        toolTipContent = '';

        //HV
        if(arguments.length == 4){
            nextLine = window.parameters.monitorValues[0] + '-A: ';
            nextLine += HV.toFixed() + ' ' + window.parameters.subdetectorUnit[0];
            toolTipContent += nextLine + '<br>';
            nextLine = window.parameters.monitorValues[0] + '-B: ';
            nextLine += HVB.toFixed() + ' ' + window.parameters.subdetectorUnit[0];
            toolTipContent += nextLine + '<br>';
        } else if(arguments.length == 3){
            nextLine = window.parameters.monitorValues[0] + ': ';
            nextLine += HV.toFixed() + ' ' + window.parameters.subdetectorUnit[0];
            toolTipContent += nextLine + '<br>';            
        }

        //Thresholds
        nextLine = window.parameters.monitorValues[1] + ': ';
        if(thresh >= 0xDEADBEEF) nextLine += 'Not Reporting';
        else nextLine += thresh.toFixed() + ' ' + window.parameters.subdetectorUnit[1];
        toolTipContent += nextLine + '<br>';
        //Rate
        nextLine = window.parameters.monitorValues[2] + ': ';
        if(rate >= 0xDEADBEEF) nextLine += 'Not Reporting';
        else nextLine += rate.toFixed() + ' ' + window.parameters.subdetectorUnit[2];
        toolTipContent += nextLine;

        return toolTipContent;
    };

    //a more generic tt text.  lines is an array, where each entry is another array packed as [prefix, value, suffix]
    this.TTtext = function(lines){
        var i, nextLine, toolTipContent;
        toolTipContent = '';

        for(i=0; i<lines.length; i++){
            nextLine = lines[i][0] + ': ';
            nextLine += lines[i][1].toFixed() + ' ' + lines[i][2];
            toolTipContent += nextLine + '<br>'
        }

        return toolTipContent;
    };

    //simple data fetcher.  Some subsystems will have more sophisticated data routing.
    this.fetchNewData = function(){
        
        var key;
        this.dataBus.totalRate = 0;

        for(key in this.dataBus[this.name]){
            
            if(window.JSONPstore['thresholds']){
                if(typeof window.JSONPstore['thresholds'][key] == 'number')
                    this.dataBus[this.name][key]['threshold'] = window.JSONPstore['thresholds'][key];
                else
                     this.dataBus[this.name][key]['threshold'] = 0xDEADBEEF; 
            }

            if(window.JSONPstore['scalar']){
                if(window.JSONPstore['scalar'][key]){
                    if(typeof window.JSONPstore['scalar'][key]['TRIGREQ'] == 'number'){
                        this.dataBus[this.name][key]['rate'] = window.JSONPstore['scalar'][key]['TRIGREQ'];
                        this.dataBus.totalRate += window.JSONPstore['scalar'][key]['TRIGREQ'];
                    } else 
                        this.dataBus[this.name][key]['rate'] = 0xDEADBEEF;
                        this.dataBus.totalRate = 0xDEADBEEF;
                } else{
                    this.dataBus[this.name][key]['rate'] = 0xDEADBEEF;
                    this.dataBus.totalRate = 0xDEADBEEF
                }
                
            }

        }
        
    };

    //generic update routine.  Again, some subsystems are more complcated versions of this:
    this.update = function(){
        var key;

        //get new data
        this.fetchNewData();

        //parse the new data into colors
        for(key in this.dataBus[this.name]){
            this.dataBus[this.name][key].oldHVcolor = this.dataBus[this.name][key].HVcolor;
            this.dataBus[this.name][key].HVcolor = this.parseColor(this.dataBus[this.name][key].HV, this.detectorType(key));
            this.dataBus[this.name][key].oldThresholdColor = this.dataBus[this.name][key].thresholdColor;
            this.dataBus[this.name][key].thresholdColor = this.parseColor(this.dataBus[this.name][key].threshold, this.detectorType(key));
            this.dataBus[this.name][key].oldRateColor = this.dataBus[this.name][key].rateColor;
            this.dataBus[this.name][key].rateColor = this.parseColor(this.dataBus[this.name][key].rate, this.detectorType(key));
        }

        //do the same for the summary level, if it exists:
        if(this.dataBus.summary){
            for(key in this.dataBus.summary){
                this.dataBus.summary[key].oldHVcolor = this.dataBus.summary[key].HVcolor;
                this.dataBus.summary[key].HVcolor = this.parseColor(this.dataBus.summary[key].HV, this.detectorType(key));
                this.dataBus.summary[key].oldThresholdColor = this.dataBus.summary[key].thresholdColor;
                this.dataBus.summary[key].thresholdColor = this.parseColor(this.dataBus.summary[key].threshold, this.detectorType(key));
                this.dataBus.summary[key].oldRateColor = this.dataBus.summary[key].rateColor;
                this.dataBus.summary[key].rateColor = this.parseColor(this.dataBus.summary[key].rate, this.detectorType(key));
            }            
        }

        //update tooltip
        this.tooltip.update();
        //update detail level tooltip if it exists:
        if(this.detailTooltip)
            this.detailTooltip.update();

        //animate if on top:
        this.animate();

    };

    //return the detector code from the parameters store that corresponds to the input detector <name> - trivial case
    //here will work for subsystems with only one kind of element like DESCANT or SHARC, 
    //subsystems with multiple detector types like DANTE and TIP will have to define their own.
    this.detectorType = function(name){
        return this.name;
    };
    
    //write the simplest possible subsystem tooltip contents:
    this.defineText = function(cell){
        
        var key, nextLine, toolTipContent;

        toolTipContent = '<br>'
        key = this.dataBus.TTmap[cell];
        nextLine = key;
        toolTipContent += nextLine + '<br><br>';
        toolTipContent += this.baseTTtext(this.dataBus[this.name][key].HV, this.dataBus[this.name][key].threshold, this.dataBus[this.name][key].rate);
        toolTipContent += '<br><br>'

        document.getElementById(this.tooltip.ttDivID).innerHTML = toolTipContent;
        
    };
    
}









//another object to inject into subsystems that need a detail-level view:
function DetailView(){
    var that = this;
    this.detailCanvasID = this.name+'detailCanvas';       //ID of canvas to draw single HPGe view on
    this.TTdetailCanvasID = this.name+'TTdetailCanvas';   //ID of hidden tooltip map canvas for detail level
    this.TTdetailLayerDone = 0;

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

    //onclick switch between top and detail view - only appropriate for detectors with a single scale (so ie not HPGe, which has HPGe+BGO)
    this.detailCanvas.onclick = function(event){
                                    var y = event.pageY - that.canvas.offsetTop - that.monitor.offsetTop;    
                                    if(y < that.canvasHeight - that.scaleHeight){
                                        that.detailShowing = 0;
                                        swapFade(null, that, 1000);
                                    } else{
                                        parameterDialogue(that.name, [[that.name, ODB[that.name][that.constructMinMaxKey(that.name)][0], ODB[that.name][that.constructMinMaxKey(that.name)][1], window.parameters.subdetectorUnit[window.state.subdetectorView], '/DashboardConfig/'+that.name+'/'+scaleType()+'[0]', '/DashboardConfig/'+that.name+'/'+scaleType()+'[1]']], window.parameters.subdetectorColors[window.state.subdetectorView]);
                                    }
                                };
    this.canvas.onclick =   function(event){
                                //use TT layer to decide which detail group user clicked on
                                var detailClicked = -1;
                                var x,y;
                                x = event.pageX - that.canvas.offsetLeft - that.monitor.offsetLeft;
                                y = event.pageY - that.canvas.offsetTop - that.monitor.offsetTop;
                                detailClicked = that.findCell(x,y);
                                //draw and swap out if user clicked on a valid detail group
                                if(detailClicked != -1){
                                    //detailClicked = Math.floor( (detailClicked - 108) / 8)+1;  //transformation from HPGe implementation of this, drop in general?
                                    that.detailShowing = detailClicked;
                                    that.TTdetailLayerDone = 0 //get ready to draw a new TT layer for the detail view
                                    //draw detail chooses which detail group to draw as a function of that.detailShowing:
                                    that.drawDetail(0,that.nFrames);  //draw detail wants a context for first arg, eliminate
                                    //that.detailShowing = 1;
                                    swapFade(null, that, 1000)
                                } else if(y > that.canvasHeight - that.scaleHeight){
                                    parameterDialogue(that.name, [[that.name, ODB[that.name][that.constructMinMaxKey(that.name)][0], ODB[that.name][that.constructMinMaxKey(that.name)][1], window.parameters.subdetectorUnit[window.state.subdetectorView], '/DashboardConfig/'+that.name+'/'+scaleType()+'[0]', '/DashboardConfig/'+that.name+'/'+scaleType()+'[1]']], window.parameters.subdetectorColors[window.state.subdetectorView]);
                                }
                            };

    //member functions
    //decide which view to transition to when this object is navigated to; overwrites equivalent in Subsystem.
    this.view = function(){
        if(this.detailShowing == 0)
            return this.canvasID;
        else if(this.detailShowing > 0)
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
        if(window.onDisplay == this.canvasID) animate(this, 0);
        if(window.onDisplay == this.detailCanvasID) animateDetail(this, 0);
    };

    //decide which display version to show: (depricated?)
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
        var key, i, q, iprime;
        var color1, color2, fillColor;

        for(q=0; q<4; q++){
            key = cloverSummaryKey + this.dataBus.colorQuads[q];
            i = this.dataBus.summary[key].quadrant;
            if(i==3) i = 2;
            else if(i==2) i = 3;
            
            if(key[2] == 'G'){
                //HPGE
                if(context == this.TTcontext){
                    iprime = 100+this.dataBus.summary[key].clover*8+i;
                    context.fillStyle = 'rgba('+iprime+','+iprime+','+iprime+',1)';
                } else{
                    if(window.state.subdetectorView == 0){
                        color1 = parseHexColor(this.dataBus.summary[key].oldHVcolor);
                        color2 = parseHexColor(this.dataBus.summary[key].HVcolor);
                    } else if(window.state.subdetectorView == 1){
                        color1 = parseHexColor(this.dataBus.summary[key].oldThresholdColor);
                        color2 = parseHexColor(this.dataBus.summary[key].thresholdColor);
                    } else if(window.state.subdetectorView == 2){
                        color1 = parseHexColor(this.dataBus.summary[key].oldRateColor);
                        color2 = parseHexColor(this.dataBus.summary[key].rateColor);
                    }
                    context.fillStyle = interpolateColor(color1, color2, frame/this.nFrames);
                    if(interpolateColor(color1, color2, frame/this.nFrames) == 0xDEADBEEF)
                        context.fillStyle = context.createPattern(window.parameters.warningFill, 'repeat');
                }
                if( this.cloversAbsent.indexOf(parseInt(cloverSummaryKey.slice(3,5),10)) != -1 && context!= this.TTcontext)
                    context.fillStyle = '#333333' //absent clovers transparent

                context.fillRect(Math.round(x0 + (this.BGOouter-this.HPGeside)/2 + (i%2)*(this.lineWeight + this.HPGeside/2)), Math.round(y0 + (this.BGOouter-this.HPGeside)/2 + (i>>1)/2*(2*this.lineWeight + this.HPGeside)), Math.round(this.HPGeside/2),Math.round(this.HPGeside/2));
                if(context != this.TTcontext){
                    context.strokeStyle = '#999999';
                    context.strokeRect(x0 + (this.BGOouter-this.HPGeside)/2 + (i%2)*(this.lineWeight + this.HPGeside/2), y0 + (this.BGOouter-this.HPGeside)/2 + (i>>1)/2*(2*this.lineWeight + this.HPGeside), this.HPGeside/2, this.HPGeside/2);
                }
            } else if(key[2] == 'S'){       
                //BGO
                var rotation 
                if(i<2) rotation = i*Math.PI/2;
                else if(i==2) rotation = 3*Math.PI/2;
                else if(i==3) rotation = Math.PI;
                var color = '#999999';
                if(context == this.TTcontext){
                    iprime = 100+this.dataBus.summary[key].clover*8+i+4;
                    fillColor = 'rgba('+iprime+','+iprime+','+iprime+',1)';
                } else{
                    if(window.state.subdetectorView == 0){
                        color1 = parseHexColor(this.dataBus.summary[key].oldHVcolor);
                        color2 = parseHexColor(this.dataBus.summary[key].HVcolor);
                    } else if(window.state.subdetectorView == 1){
                        color1 = parseHexColor(this.dataBus.summary[key].oldThresholdColor);
                        color2 = parseHexColor(this.dataBus.summary[key].thresholdColor);
                    } else if(window.state.subdetectorView == 2){
                        color1 = parseHexColor(this.dataBus.summary[key].oldRateColor);
                        color2 = parseHexColor(this.dataBus.summary[key].rateColor);
                    }
                    fillColor = interpolateColor(color1, color2, frame/this.nFrames);
                    if(fillColor == 0xDEADBEEF)
                        fillColor = context.createPattern(window.parameters.warningFill, 'repeat');
                    if( this.cloversAbsent.indexOf(parseInt(cloverSummaryKey.slice(3,5),10)) != -1 )
                        fillColor = '#333333' //absent clovers transparent
                }

                this.drawL(context, rotation, Math.round((this.BGOouter - this.BGOinner)/2), Math.round(this.BGOouter/2), Math.round(x0 + (this.BGOouter+this.lineWeight)*(i%2)), Math.round(y0 + (this.BGOouter+this.lineWeight)*(i>>1)), color, fillColor);
            }
            
        }

    };

    this.drawDetail = function(context, frame){
        
        if(context==this.TTdetailContext && this.TTdetailLayerDone) return 0; //only draw the TT layer once

        var i, j, quad;

        //state variables select the segmentation state of HPGe and services of BGO 
        var HPGestate, BGOstate;

        this.detailContext.lineWidth = this.lineWeight;

        //colorWheel enumerates the standard configuration of color sectors:
        var colorWheel =  ['#999999','#999999','#999999','#999999'];//['#00FF00', '#0000FF', '#FFFFFF', '#FF0000'];
        //orientation enumerates orientations of half-BGOs
        var orientation = ['left', 'right'];

        var fillColor, fillColor2;
        var pfx = (this.mode == 'TIGRESS') ? 'TI' : 'GR';

        //clover HPGe and BGO keys:
        var HPGeName = pfx+'G'+ ( (this.cloverShowing<10) ? '0'+this.cloverShowing : this.cloverShowing );
        var BGOname  = pfx+'S'+ ( (this.cloverShowing<10) ? '0'+this.cloverShowing : this.cloverShowing );
        var HPGeKey, BGOkey, BGOsuffix;

        if(window.state.subdetectorView == 0){
            HPGestate = 0; //no segmentation
            BGOstate = 1;  //two services per sector per side per suppressor
        }else if(window.state.subdetectorView == 1 || window.state.subdetectorView == 2){
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

            //append quadrant color to keys:
            HPGeKey = HPGeName + this.dataBus.colorQuads[i];
            BGOkey = BGOname + this.dataBus.colorQuads[i];

            //HPGe/////////////////////////////
            if(HPGestate == 0){
                
                if(context == this.detailContext){
                    fillColor  =  interpolateColor(parseHexColor(this.dataBus.HPGe[HPGeKey+'N00A'].oldHVcolor), parseHexColor(this.dataBus.HPGe[HPGeKey+'N00A'].HVcolor), frame/this.nFrames);
                } else{
                    fillColor  = 'rgba('+i+', '+i+', '+i+', 1)';
                }
                this.crystal(context, this.centerX + PBC*this.lineWeight + NAD*this.crystalSide, this.centerY + NAB*this.crystalSide + PCD*this.lineWeight, colorWheel[i], fillColor);
                
            } else if(HPGestate == 1){
                
                if(this.mode == 'TIGRESS'){

                    //cores - same as GRIFFIN for core, factor out
                    if(context == this.detailContext){
                        if(window.state.subdetectorView == 1){
                            fillColor  = interpolateColor(parseHexColor(this.dataBus.HPGe[HPGeKey+'N00A'].oldThresholdColor), parseHexColor(this.dataBus.HPGe[HPGeKey+'N00A'].thresholdColor), frame/this.nFrames );
                            fillColor2 = interpolateColor(parseHexColor(this.dataBus.HPGe[HPGeKey+'N00B'].oldThresholdColor), parseHexColor(this.dataBus.HPGe[HPGeKey+'N00B'].thresholdColor), frame/this.nFrames );
                        }
                        else if(window.state.subdetectorView == 2){ 
                            fillColor  = interpolateColor(parseHexColor(this.dataBus.HPGe[HPGeKey+'N00A'].oldRateColor), parseHexColor(this.dataBus.HPGe[HPGeKey+'N00A'].rateColor), frame/this.nFrames );
                            fillColor2 = interpolateColor(parseHexColor(this.dataBus.HPGe[HPGeKey+'N00B'].oldRateColor), parseHexColor(this.dataBus.HPGe[HPGeKey+'N00B'].rateColor), frame/this.nFrames );
                        }
                        if(fillColor==0xDEADBEEF) fillColor = this.detailContext.createPattern(window.parameters.warningFill, 'repeat');
                        if(fillColor2==0xDEADBEEF) fillColor2 = this.detailContext.createPattern(window.parameters.warningFill, 'repeat');
                    } else {
                        fillColor  = 'rgba('+10*i+', '+10*i+', '+10*i+', 1)';
                        fillColor2 = 'rgba('+(10*i+1)+', '+(10*i+1)+', '+(10*i+1)+', 1)';
                    }

                    this.splitCrystal(context, this.centerX + NAD*2/3*this.crystalSide + PBC*1/3*this.crystalSide + PBC*this.lineWeight, this.centerY + NAB*2/3*this.crystalSide + PCD*1/3*this.crystalSide + PCD*this.lineWeight, this.crystalSide/3, i, colorWheel[i], fillColor, fillColor2);

                    for(j=0; j<4; j++){
                        //useful switches:
                        var PBC2 = Math.ceil((j%3)/3);               //positive for i=1,2, 0 OW
                        var NAD2 = Math.ceil((j%3)/3) - 1;           //negative for i=0,3, 0 OW
                        var NAB2 = Math.floor(j/2) - 1;              //negative for i=0,1, 0 OW
                        var PCD2 = Math.floor(j/2);                  //positive for i=2,3, 0 OW
                        //segements drawn in different order than numbering; use jprime to get the right mapping:
                        var jprime = (((1-j)+4)%4 + i)%4;
                        if (jprime==0) jprime = 4;

                        //segs 1-4
                        if(context == this.detailContext){
                            if(window.state.subdetectorView == 1) fillColor = interpolateColor(parseHexColor(this.dataBus.HPGe[HPGeKey+'P0'+jprime+'X'].oldThresholdColor), parseHexColor(this.dataBus.HPGe[HPGeKey+'P0'+jprime+'X'].thresholdColor), frame/this.nFrames);
                            else if(window.state.subdetectorView == 2) fillColor = interpolateColor(parseHexColor(this.dataBus.HPGe[HPGeKey+'P0'+jprime+'X'].oldRateColor), parseHexColor(this.dataBus.HPGe[HPGeKey+'P0'+jprime+'X'].rateColor), frame/this.nFrames);
                            if(fillColor==0xDEADBEEF) fillColor = this.detailContext.createPattern(window.parameters.warningFill, 'repeat');
                        } else
                            fillColor = 'rgba('+(this.nHPGesegments/4*i+jprime+1)+', '+(this.nHPGesegments/4*i+jprime+1)+', '+(this.nHPGesegments/4*i+jprime+1)+', 1)';
                        this.drawL(context, j*Math.PI/2, this.crystalSide/6, 1/3*this.crystalSide, this.centerX + PBC*this.lineWeight + NAD*(-NAD2)*5/6*this.crystalSide + NAD*PBC2*1/6*this.crystalSide + PBC*(-NAD2)*1/6*this.crystalSide + PBC*PBC2*5/6*this.crystalSide, this.centerY + NAB*(-NAB2)*5/6*this.crystalSide + NAB*PCD2*1/6*this.crystalSide + PCD*(-NAB2)*1/6*this.crystalSide + PCD*PCD2*5/6*this.crystalSide + PCD*this.lineWeight, colorWheel[i], fillColor);

                        //segs 5-8
                        if(context == this.detailContext){
                            if(window.state.subdetectorView == 1) fillColor = interpolateColor(parseHexColor(this.dataBus.HPGe[HPGeKey+'P0'+(jprime+4)+'X'].oldThresholdColor), parseHexColor(this.dataBus.HPGe[HPGeKey+'P0'+(jprime+4)+'X'].thresholdColor), frame/this.nFrames);
                            else if(window.state.subdetectorView == 2) fillColor = interpolateColor(parseHexColor(this.dataBus.HPGe[HPGeKey+'P0'+(jprime+4)+'X'].oldRateColor), parseHexColor(this.dataBus.HPGe[HPGeKey+'P0'+(jprime+4)+'X'].rateColor), frame/this.nFrames);
                            if(fillColor==0xDEADBEEF) fillColor = this.detailContext.createPattern(window.parameters.warningFill, 'repeat');
                        } else
                            fillColor = 'rgba('+(this.nHPGesegments/4*i+jprime+1+4)+', '+(this.nHPGesegments/4*i+jprime+1+4)+', '+(this.nHPGesegments/4*i+jprime+1+4)+', 1)';
                        this.drawL(context, j*Math.PI/2, this.crystalSide/6, this.crystalSide/2, this.centerX + (-NAD)*NAD2*this.crystalSide + PBC*PBC2*this.crystalSide + PBC*this.lineWeight, this.centerY + (-NAB)*NAB2*this.crystalSide + PCD*PCD2*this.crystalSide + PCD*this.lineWeight, colorWheel[i], fillColor);
                        
                    }

                    
                } else if(this.mode == 'GRIFFIN'){
                    
                    //cores
                    if(context == this.detailContext){
                        if(window.state.subdetectorView == 1){
                            fillColor  = interpolateColor(parseHexColor(this.dataBus.HPGe[HPGeKey+'N00A'].oldThresholdColor), parseHexColor(this.dataBus.HPGe[HPGeKey+'N00A'].thresholdColor), frame/this.nFrames );
                            fillColor2 = interpolateColor(parseHexColor(this.dataBus.HPGe[HPGeKey+'N00B'].oldThresholdColor), parseHexColor(this.dataBus.HPGe[HPGeKey+'N00B'].thresholdColor), frame/this.nFrames );
                        }
                        else if(window.state.subdetectorView == 2){ 
                            fillColor  = interpolateColor(parseHexColor(this.dataBus.HPGe[HPGeKey+'N00A'].oldRateColor), parseHexColor(this.dataBus.HPGe[HPGeKey+'N00A'].rateColor), frame/this.nFrames );
                            fillColor2 = interpolateColor(parseHexColor(this.dataBus.HPGe[HPGeKey+'N00B'].oldRateColor), parseHexColor(this.dataBus.HPGe[HPGeKey+'N00B'].rateColor), frame/this.nFrames );
                        }
                        if(fillColor==0xDEADBEEF) fillColor = this.detailContext.createPattern(window.parameters.warningFill, 'repeat');
                        if(fillColor2==0xDEADBEEF) fillColor2 = this.detailContext.createPattern(window.parameters.warningFill, 'repeat');
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

                //are we on channel A or B for HV?
                var HVchan = 'HVA';
                if(j==1) HVchan = 'HVB';

                //back suppressors
                if(context == this.detailContext){
                    if(window.state.subdetectorView == 0) fillColor = interpolateColor(parseHexColor(this.dataBus.HPGe[BGOkey+'N05X']['old'+HVchan+'color']), parseHexColor(this.dataBus.HPGe[BGOkey+'N05X'][HVchan+'color']), frame/this.nFrames);
                    else if(window.state.subdetectorView == 1) fillColor = interpolateColor(parseHexColor(this.dataBus.HPGe[BGOkey+'N05X'].oldThresholdColor), parseHexColor(this.dataBus.HPGe[BGOkey+'N05X'].thresholdColor), frame/this.nFrames);
                    else if(window.state.subdetectorView == 2) fillColor = interpolateColor(parseHexColor(this.dataBus.HPGe[BGOkey+'N05X'].oldRateColor), parseHexColor(this.dataBus.HPGe[BGOkey+'N05X'].rateColor), frame/this.nFrames);
                    if(fillColor==0xDEADBEEF) fillColor = this.detailContext.createPattern(window.parameters.warningFill, 'repeat');

                } else{
                    if(window.state.subdetectorView == 0){
                        fillColor  ='rgba('+(4+2*i+j)+', '+(4+2*i+j)+', '+(4+2*i+j)+', 1)';
                    }
                    else
                        fillColor = 'rgba('+(this.nHPGesegments+i)+', '+(this.nHPGesegments+i)+', '+(this.nHPGesegments+i)+', 1)';
                }
                if(window.state.subdetectorView == 0){
                    this.drawHalfL(context, (i-1+j)*(Math.PI/2), this.suppressorWidth, this.backBGOouterWidth/2, this.centerX + NAD*this.backBGOinnerWidth/2 + PBC*this.backBGOinnerWidth/2 + PBC*2*this.lineWeight + (-NAB)*NA*this.lineWeight + PCD*NB*this.lineWeight, this.centerY + (NAB+PCD)*this.backBGOinnerWidth/2 + PCD*2*this.lineWeight + (-NAD)*NB*this.lineWeight + PBC*NA*this.lineWeight, orientation[j], false, colorWheel[i], fillColor);
                } else if(window.state.subdetectorView == 1 || window.state.subdetectorView == 2){
                    if(j==0) this.drawL(context, i*(Math.PI/2), this.suppressorWidth, this.backBGOouterWidth/2, this.centerX + NAD*this.backBGOinnerWidth/2 + PBC*this.backBGOinnerWidth/2 + PBC*this.lineWeight + (NAD+PBC)*this.suppressorWidth, this.centerY + (NAB+PCD)*this.backBGOinnerWidth/2 + PCD*this.lineWeight + (NAB+PCD)*this.suppressorWidth, colorWheel[i], fillColor);    
                }
                
                //side suppressors
                BGOsuffix = 'N0'+(3+1-j)+'X'; //side suppressors labeled -N03X and -N04X j->1-j here since drawing happens in reverse order
                if(context == this.detailContext){
                    if(window.state.subdetectorView == 0){
                        fillColor  = interpolateColor(parseHexColor(this.dataBus.HPGe[BGOkey+BGOsuffix].oldHVAcolor), parseHexColor(this.dataBus.HPGe[BGOkey+BGOsuffix].HVAcolor), frame/this.nFrames);
                        fillColor2 = interpolateColor(parseHexColor(this.dataBus.HPGe[BGOkey+BGOsuffix].oldHVBcolor), parseHexColor(this.dataBus.HPGe[BGOkey+BGOsuffix].HVBcolor), frame/this.nFrames);
                    }
                    else if(window.state.subdetectorView == 1) fillColor = interpolateColor(parseHexColor(this.dataBus.HPGe[BGOkey+BGOsuffix].oldThresholdColor), parseHexColor(this.dataBus.HPGe[BGOkey+BGOsuffix].thresholdColor), frame/this.nFrames);
                    else if(window.state.subdetectorView == 2) fillColor = interpolateColor(parseHexColor(this.dataBus.HPGe[BGOkey+BGOsuffix].oldRateColor), parseHexColor(this.dataBus.HPGe[BGOkey+BGOsuffix].rateColor), frame/this.nFrames);
                    if(fillColor==0xDEADBEEF) fillColor = this.detailContext.createPattern(window.parameters.warningFill, 'repeat');
                    if(fillColor2==0xDEADBEEF) fillColor2 = this.detailContext.createPattern(window.parameters.warningFill, 'repeat');
                } else{
                    if(window.state.subdetectorView == 0){
                        fillColor  = 'rgba('+(4+8+4*i+2*j)+', '+(4+8+4*i+2*j)+', '+(4+8+4*i+2*j)+', 1)';
                        fillColor2 = 'rgba('+(4+8+4*i+2*j+1)+', '+(4+8+4*i+2*j+1)+', '+(4+8+4*i+2*j+1)+', 1)';
                    }
                    else
                        fillColor = 'rgba('+(this.nHPGesegments+4+2*i+j)+', '+(this.nHPGesegments+4+2*i+j)+', '+(this.nHPGesegments+4+2*i+j)+', 1)';
                }
                this.drawHalfL(context, (i-1+j)*(Math.PI/2), this.suppressorWidth, this.sideBGOouterWidth/2, this.centerX +NAD*this.sideBGOinnerWidth/2 + PBC*this.sideBGOinnerWidth/2 + PBC*2*this.lineWeight + (-NAB)*NA*this.lineWeight + PCD*NB*this.lineWeight     , this.centerY + (NAB+PCD)*this.sideBGOinnerWidth/2 + PCD*2*this.lineWeight + (-NAD)*NB*this.lineWeight + PBC*NA*this.lineWeight, orientation[j], BGOstate, colorWheel[i], fillColor, fillColor2);

                //front suppressors
                BGOsuffix = 'N0'+(1+1-j)+'X'; //front suppressors labeled -N01X and -N02X; j->1-j here since drawing happens in reverse order
                if(context == this.detailContext){
                    if(window.state.subdetectorView == 0){
                        fillColor  = interpolateColor(parseHexColor(this.dataBus.HPGe[BGOkey+BGOsuffix].oldHVAcolor), parseHexColor(this.dataBus.HPGe[BGOkey+BGOsuffix].HVAcolor), frame/this.nFrames);
                        fillColor2 = interpolateColor(parseHexColor(this.dataBus.HPGe[BGOkey+BGOsuffix].oldHVBcolor), parseHexColor(this.dataBus.HPGe[BGOkey+BGOsuffix].HVBcolor), frame/this.nFrames);
                    }
                    else if(window.state.subdetectorView == 1) fillColor = interpolateColor(parseHexColor(this.dataBus.HPGe[BGOkey+BGOsuffix].oldThresholdColor), parseHexColor(this.dataBus.HPGe[BGOkey+BGOsuffix].thresholdColor), frame/this.nFrames);
                    else if(window.state.subdetectorView == 2) fillColor = interpolateColor(parseHexColor(this.dataBus.HPGe[BGOkey+BGOsuffix].oldRateColor), parseHexColor(this.dataBus.HPGe[BGOkey+BGOsuffix].rateColor), frame/this.nFrames);
                    if(fillColor==0xDEADBEEF) fillColor = this.detailContext.createPattern(window.parameters.warningFill, 'repeat');
                    if(fillColor2==0xDEADBEEF) fillColor2 = this.detailContext.createPattern(window.parameters.warningFill, 'repeat');
                } else{
                    if(window.state.subdetectorView == 0){
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
        this.detailContext.fillText(this.scalePrefix+this.cloverShowing, 0.5*this.canvasWidth - this.detailContext.measureText(this.scalePrefix+this.cloverShowing).width/2, 0.85*this.canvasHeight);
        
        if(context == this.TTdetailContext) this.TTdetailLayerDone = 1;
    };

    this.updateHPGe = function(){
        //HPGe + BGO
        //summary level
        for(key in this.dataBus.summary){

            detType = (key[2] == 'G') ? 'HPGe' : 'BGO';

            this.dataBus.summary[key].oldHVcolor = this.dataBus.summary[key].HVcolor;
            this.dataBus.summary[key].HVcolor = this.parseColor(this.dataBus.summary[key].HV, detType);
            this.dataBus.summary[key].oldThresholdColor = this.dataBus.summary[key].thresholdColor;
            this.dataBus.summary[key].thresholdColor = this.parseColor(this.dataBus.summary[key].threshold, detType);
            this.dataBus.summary[key].oldRateColor = this.dataBus.summary[key].rateColor;
            this.dataBus.summary[key].rateColor = this.parseColor(this.dataBus.summary[key].rate, detType);
        }
        

        //detail level
        //loop over detector elements
        for(key in this.dataBus.HPGe){
            detType = (key[2] == 'G') ? 'HPGe' : 'BGO';

            if(detType == 'HPGe'){
                this.dataBus.HPGe[key].oldHVcolor = this.dataBus.HPGe[key].HVcolor;
                this.dataBus.HPGe[key].HVcolor = this.parseColor(this.dataBus.HPGe[key].HV, detType);                    
            } else{
                this.dataBus.HPGe[key].oldHVAcolor = this.dataBus.HPGe[key].HVAcolor;
                this.dataBus.HPGe[key].HVAcolor = this.parseColor(this.dataBus.HPGe[key].HVA, detType);
                this.dataBus.HPGe[key].oldHVBcolor = this.dataBus.HPGe[key].HVBcolor;
                this.dataBus.HPGe[key].HVBcolor = this.parseColor(this.dataBus.HPGe[key].HVB,detType);
            }
            this.dataBus.HPGe[key].oldThresholdColor = this.dataBus.HPGe[key].thresholdColor;
            this.dataBus.HPGe[key].thresholdColor = this.parseColor(this.dataBus.HPGe[key].threshold, detType);
            this.dataBus.HPGe[key].oldRateColor = this.dataBus.HPGe[key].rateColor;
            this.dataBus.HPGe[key].rateColor = this.parseColor(this.dataBus.HPGe[key].rate, detType);
        }
    };

    this.fetchHPGeData = function(){
        var i, j, key;
        this.dataBus.totalRate = 0;

        //HPGe + BGO detail
        for(key in this.dataBus.HPGe){

            if(window.JSONPstore['thresholds']){
                if(typeof window.JSONPstore['thresholds'][key] == 'number')
                    this.dataBus.HPGe[key]['threshold'] = window.JSONPstore['thresholds'][key];
                else
                    this.dataBus.HPGe[key]['threshold'] = 0xDEADBEEF;
            }

            if(window.JSONPstore['scalar']){
                if(window.JSONPstore['scalar'][key]){
                    if(typeof window.JSONPstore['scalar'][key]['TRIGREQ'] == 'number')
                        this.dataBus.HPGe[key]['rate'] = window.JSONPstore['scalar'][key]['TRIGREQ'];
                    else 
                        this.dataBus.HPGe[key]['rate'] = 0xDEADBEEF;
                } else
                    this.dataBus.HPGe[key]['rate'] = 0xDEADBEEF;
                this.dataBus.totalRate += this.dataBus.HPGe[key]['rate'];
            }
        }

        //HPGe + BGO summary
        for(key in this.dataBus.summary){
            //summary            
            for(i=0; i<4; i++){
                if(key[2] == 'G'){
                    this.dataBus.summary[key].HV = this.dataBus.HPGe[key+'N00A']['HV'];
                    if(this.mode == 'GRIFFIN'){
                        this.dataBus.summary[key].threshold = (this.dataBus.HPGe[key+'N00A']['threshold'] + this.dataBus.HPGe[key+'N00B']['threshold'])/2;
                        this.dataBus.summary[key].rate = (this.dataBus.HPGe[key+'N00A']['rate'] + this.dataBus.HPGe[key+'N00B']['rate'])/2;
                    } else if (this.mode == 'TIGRESS'){
                        this.dataBus.summary[key].threshold = this.dataBus.HPGe[key+'N00A']['threshold'] + this.dataBus.HPGe[key+'N00B']['threshold'];
                        this.dataBus.summary[key].rate = this.dataBus.HPGe[key+'N00A']['rate'] + this.dataBus.HPGe[key+'N00B']['rate'];
                        for(j=1; j<9; j++){
                            this.dataBus.summary[key].threshold += this.dataBus.HPGe[key+'P0'+j+'X']['threshold'];
                            this.dataBus.summary[key].rate += this.dataBus.HPGe[key+'P0'+j+'X']['rate'];
                        }
                        //this.dataBus.summary[key].threshold = this.dataBus.summary[key].threshold%0xDEADBEEF;  //drop any DEADBEEF that got added in
                        //this.dataBus.summary[key].rate = this.dataBus.summary[key].rate%0xDEADBEEF;
                        //this.dataBus.summary[key].threshold /= 10;
                        //this.dataBus.summary[key].rate /= 10;
                        if(this.dataBus.summary[key].threshold >= 0xDEADBEEF) 
                            this.dataBus.summary[key].threshold = 0xDEADBEEF;
                        else
                            this.dataBus.summary[key].threshold /= 10;
                        if(this.dataBus.summary[key].rate >= 0xDEADBEEF) 
                            this.dataBus.summary[key].rate = 0xDEADBEEF;
                        else
                            this.dataBus.summary[key].rate /= 10;
                    }
                } else if(key[2] == 'S'){
                    this.dataBus.summary[key].HV = 0;
                    for(j=1; j<6; j++){
                        this.dataBus.summary[key].HV += this.dataBus.HPGe[key+'N0'+j+'A'] / 10;
                        this.dataBus.summary[key].HV += this.dataBus.HPGe[key+'N0'+j+'B'] / 10;
                    }
                    this.dataBus.summary[key].threshold = this.dataBus.HPGe[key+'N01X']['threshold'] + this.dataBus.HPGe[key+'N02X']['threshold'] + this.dataBus.HPGe[key+'N03X']['threshold'] + this.dataBus.HPGe[key+'N04X']['threshold'] + this.dataBus.HPGe[key+'N05X']['threshold'];
                    this.dataBus.summary[key].rate = this.dataBus.HPGe[key+'N01X']['rate'] + this.dataBus.HPGe[key+'N02X']['rate'] + this.dataBus.HPGe[key+'N03X']['rate'] + this.dataBus.HPGe[key+'N04X']['rate'] + this.dataBus.HPGe[key+'N05X']['rate'];
                    //this.dataBus.summary[key].threshold = (this.dataBus.summary[key].threshold%0xDEADBEEF)/5;  //drop any DEADBEEF that got added in
                    //this.dataBus.summary[key].rate = (this.dataBus.summary[key].rate%0xDEADBEEF)/5;
                    if(this.dataBus.summary[key].threshold >= 0xDEADBEEF)
                        this.dataBus.summary[key].threshold = 0xDEADBEEF;
                    else
                        this.dataBus.summary[key].threshold /= 5;
                    if(this.dataBus.summary[key].rate >= 0xDEADBEEF)
                        this.dataBus.summary[key].rate = 0xDEADBEEF;
                    else
                        this.dataBus.summary[key].rate /= 5;
                }
            }
        }
        
    };

    this.defineHPGeText = function(cell){
        var i, segA, segB, cloverNumber, cloverName, quadrant, BGO, channelName, detName, suffix, title, ABX;
        var BGO = [];
        var toolTipContent = '';
        var pfx = (this.mode == 'TIGRESS') ? 'TI' : 'GR';

        //summary level//////////////////////////////////////////////////

        if(!this.detailShowing) {

            cloverNumber = Math.floor((cell-100)/8);
            cloverName = pfx+'G'+((cloverNumber<10) ? '0'+cloverNumber : cloverNumber );  //will match the HPGe summary ID of this clover
            if(this.cloversAbsent.indexOf(cloverNumber) == -1){  //not in the absentee list
                quadrant = ((cell-100)%8)%4;
                if (quadrant==2) quadrant = 3;
                else if(quadrant==3) quadrant = 2;
                //HPGE
                if( (cell-100)%8 < 4 ){
                    if(this.mode == 'GRIFFIN'){
                        segA = cloverName+this.dataBus.colorQuads[quadrant]+'N00A';
                        segB = cloverName+this.dataBus.colorQuads[quadrant]+'N00B';

                        //report segment A:
                        nextLine = segA;
                        toolTipContent = '<br>' + nextLine + '<br>';
                        toolTipContent += this.baseTTtext(this.dataBus.HPGe[segA].HV, this.dataBus.HPGe[segA].threshold, this.dataBus.HPGe[segA].rate)

                        //report segment B:
                        nextLine = segB;
                        toolTipContent += '<br><br>' + nextLine + '<br>';
                        toolTipContent += this.baseTTtext(this.dataBus.HPGe[segA].HV, this.dataBus.HPGe[segB].threshold, this.dataBus.HPGe[segB].rate)
                    } else if(this.mode == 'TIGRESS'){
                        createTIGRESSsummaryTT(this.tooltip.ttDivID, cloverName+this.dataBus.colorQuads[quadrant], this.dataBus);
                    }
                //BGO 
                } else {
                    cloverName = pfx+'S'+((cloverNumber<10) ? '0'+cloverNumber : cloverNumber );
                    toolTipContent = '';
                    for(i=1; i<6; i++){
                        BGO[i] = cloverName+this.dataBus.colorQuads[quadrant]+'N0'+i+'X';
                        toolTipContent += ((i==1) ? '<br>' : '<br><br>') + BGO[i] + '<br>';
                        toolTipContent += this.baseTTtext(this.dataBus.HPGe[BGO[i]].HVA, this.dataBus.HPGe[BGO[i]].threshold, this.dataBus.HPGe[BGO[i]].rate, this.dataBus.HPGe[BGO[i]].HVB);
                    }
                }
            } else {
                toolTipContent = '<br>'+cloverName + ' absent.'
            }
        }
        //HPGe detail level///////////////////////////////////////////////
        else{
            //HV view decodes detector from cell index algorithmically; rate view uses lookup table from DataStructures.  Haven't decided which I dislike less.
            if(window.state.subdetectorView == 0){ 
                toolTipContent = cell;
                cloverName = pfx+'S'+((this.cloverShowing<10) ? '0'+this.cloverShowing : this.cloverShowing);
                //HPGe, front, side or back BGO?
                if(cell<4){
                    cloverName = pfx+'G'+((this.cloverShowing<10) ? '0'+this.cloverShowing : this.cloverShowing);
                    detName = cloverName+this.dataBus.colorQuads[cell]+'N00A';
                    title = detName.slice(0,9) + 'X';
                    nextLine = this.TTtext([['HV',this.dataBus.HPGe[detName].HV,window.parameters.subdetectorUnit[0]],['Thresholds-A',this.dataBus.HPGe[detName].threshold,window.parameters.subdetectorUnit[1]],['Thresholds-B',this.dataBus.HPGe[detName.slice(0,9)+'B'].threshold,window.parameters.subdetectorUnit[1]],['Rate-A',this.dataBus.HPGe[detName].rate,window.parameters.subdetectorUnit[2]],['Rate-B',this.dataBus.HPGe[detName.slice(0,9)+'B'].rate,window.parameters.subdetectorUnit[2]]]);
                } else if(cell<12){ //back
                    detName = cloverName+this.dataBus.colorQuads[Math.floor((cell-4)/2)]+'N05X';
                } else if(cell<28){ //sides
                    suffix = (Math.floor( ((cell-12)%4) /2) == 0) ? 'N03X' : 'N04X';
                    detName = cloverName+this.dataBus.colorQuads[Math.floor((cell-12)/4)]+suffix;
                } else{ //front
                    suffix = (Math.floor( ((cell-28)%4) /2) == 0) ? 'N01X' : 'N02X';
                    detName = cloverName+this.dataBus.colorQuads[Math.floor((cell-28)/4)]+suffix;
                }
                if(cell>3){
                    ABX = (cell%2 == 0) ? 'A' : 'B';
                    title = detName.slice(0,9) + ABX;
                    nextLine = this.baseTTtext(this.dataBus.HPGe[detName]['HV'+ABX], this.dataBus.HPGe[detName].threshold, this.dataBus.HPGe[detName].rate );
                }

                toolTipContent = '<br>' + title + '<br><br>' + nextLine;

            } else {
                
                channelName = this.dataBus.HPGeTTmap[(this.cloverShowing-1)*((this.mode=='TIGRESS')? 60:30) + cell];
                detName = channelName.slice(0,5);

                toolTipContent = '<br>' + channelName + '<br><br>';
                if(detName.slice(2,3) == 'G')
                    toolTipContent += this.baseTTtext(this.dataBus.HPGe[channelName].HV, this.dataBus.HPGe[channelName].threshold, this.dataBus.HPGe[channelName].rate);
                else if(detName.slice(2,3) == 'S')
                    toolTipContent += this.baseTTtext(this.dataBus.HPGe[channelName].HVA, this.dataBus.HPGe[channelName].threshold, this.dataBus.HPGe[channelName].rate, this.dataBus.HPGe[channelName].HVB);
                
            }
        }

        toolTipContent += '<br>'
        return toolTipContent;

    };

    function createTIGRESSsummaryTT(wrapperID, cloverLeaf, dataBus){
        var i, elt, eltName1, eltName2;

        document.getElementById(wrapperID).innerHTML = ''; //kill off whatever used to be in there
        insertDOM('table', 'tigressTTtable', '', 'text-align:center; margin:10px; ', wrapperID, '', '');  //new table
        insertDOM('tr', 'coreTitles', '', '', 'tigressTTtable', '', '');
        insertDOM('td', 'blank', '', '', 'coreTitles', '', '');
        insertDOM('td', 'spacer', '', 'width:10px', 'coreTitles', '', '');
        insertDOM('td', 'coreAname', '', '', 'coreTitles', '', cloverLeaf+'N00A');
        insertDOM('td', 'spacer', '', 'width:50px', 'coreTitles', '', '');
        insertDOM('td', 'coreBname', '', '', 'coreTitles', '', cloverLeaf+'N00B');

        insertDOM('tr', 'coreVolt', '', '', 'tigressTTtable', '', '');
        insertDOM('td', 'coreVoltTitle', '', 'text-align:right;', 'coreVolt', '', window.parameters.monitorValues[0])
        insertDOM('td', 'spacer', '', 'width:10px', 'coreVolt', '', '');
        insertDOM('td', 'coreAhv', '', '', 'coreVolt', '', dataBus.HPGe[cloverLeaf+'N00A'].HV.toFixed(0) + ' ' + window.parameters.subdetectorUnit[0]);
        insertDOM('td', 'spacer', '', 'width:50px', 'coreVolt', '', '');
        insertDOM('td', 'coreBhv', '', '', 'coreVolt', '', dataBus.HPGe[cloverLeaf+'N00B'].HV.toFixed(0) + ' ' + window.parameters.subdetectorUnit[0]);

        insertDOM('tr', 'coreThreshold', '', '', 'tigressTTtable', '', '');
        insertDOM('td', 'coreThresholdTitle', '', 'text-align:right;', 'coreThreshold', '', window.parameters.monitorValues[1])
        insertDOM('td', 'spacer', '', 'width:10px', 'coreThreshold', '', '');
        insertDOM('td', 'coreAthreshold', '', '', 'coreThreshold', '', ( (dataBus.HPGe[cloverLeaf+'N00A'].threshold < 0xDEADBEEF) ? dataBus.HPGe[cloverLeaf+'N00A'].threshold.toFixed(0) + ' ' + window.parameters.subdetectorUnit[1] : 'Not Reporting') );
        insertDOM('td', 'spacer', '', 'width:50px', 'coreThreshold', '', '');
        insertDOM('td', 'coreBthreshold', '', '', 'coreThreshold', '', ( (dataBus.HPGe[cloverLeaf+'N00B'].threshold < 0xDEADBEEF) ? dataBus.HPGe[cloverLeaf+'N00B'].threshold.toFixed(0) + ' ' + window.parameters.subdetectorUnit[1] : 'Not Reporting') ); 

        insertDOM('tr', 'coreRate', '', '', 'tigressTTtable', '', '');
        insertDOM('td', 'coreRateTitle', '', 'text-align:right;', 'coreRate', '', window.parameters.monitorValues[2])
        insertDOM('td', 'spacer', '', 'width:10px', 'coreRate', '', '');
        insertDOM('td', 'coreArate', '', '', 'coreRate', '', ( (dataBus.HPGe[cloverLeaf+'N00A'].rate < 0xDEADBEEF) ? dataBus.HPGe[cloverLeaf+'N00A'].rate.toFixed(0) + ' ' + window.parameters.subdetectorUnit[2] : 'Not Reporting') );
        insertDOM('td', 'spacer', '', 'width:50px;', 'coreRate', '', '');
        insertDOM('td', 'coreBrate', '', '', 'coreRate', '', ((dataBus.HPGe[cloverLeaf+'N00B'].rate < 0xDEADBEEF) ? dataBus.HPGe[cloverLeaf+'N00B'].rate.toFixed(0) + ' ' + window.parameters.subdetectorUnit[2] : 'Not Reporting') ); 

        insertDOM('tr', 'divider', '', '', 'tigressTTtable', '', '');
        insertDOM('td', 'line', '', 'border-bottom-style:solid; border-color:white; border-width:1px;', 'divider', '', '');
        document.getElementById('line').setAttribute('colspan', 5);

        for(i=0; i<4; i++){
            elt = cloverLeaf+i;
            eltName1 = cloverLeaf + 'P0' + (2*i+1) + 'X';
            eltName2 = cloverLeaf + 'P0' + (2*i+2) + 'X';

            insertDOM('tr', elt+'Titles', '', '', 'tigressTTtable', '', '');
            insertDOM('td', 'blank', '', '', elt+'Titles', '', '');
            insertDOM('td', 'spacer', '', 'width:10px', elt+'Titles', '', '');
            insertDOM('td', elt+'Aname', '', '', elt+'Titles', '', eltName1);
            insertDOM('td', 'spacer', '', 'width:50px', elt+'Titles', '', '');
            insertDOM('td', elt+'Bname', '', '', elt+'Titles', '', eltName2);

            insertDOM('tr', elt+'Volt', '', '', 'tigressTTtable', '', '');
            insertDOM('td', elt+'VoltTitle', '', 'text-align:right;', elt+'Volt', '', window.parameters.monitorValues[0])
            insertDOM('td', 'spacer', '', 'width:10px', elt+'Volt', '', '');
            insertDOM('td', elt+'Ahv', '', '', elt+'Volt', '', dataBus.HPGe[eltName1].HV.toFixed(0) + ' ' + window.parameters.subdetectorUnit[0]);
            insertDOM('td', 'spacer', '', 'width:50px', elt+'Volt', '', '');
            insertDOM('td', elt+'Bhv', '', '', elt+'Volt', '', dataBus.HPGe[eltName2].HV.toFixed(0) + ' ' + window.parameters.subdetectorUnit[0]);

            insertDOM('tr', elt+'Threshold', '', '', 'tigressTTtable', '', '');
            insertDOM('td', elt+'ThresholdTitle', '', 'text-align:right;', elt+'Threshold', '', window.parameters.monitorValues[1])
            insertDOM('td', 'spacer', '', 'width:10px', elt+'Threshold', '', '');
            insertDOM('td', elt+'Athreshold', '', '', elt+'Threshold', '', ((dataBus.HPGe[eltName1].threshold < 0xDEADBEEF) ? dataBus.HPGe[eltName1].threshold.toFixed(0) + ' ' + window.parameters.subdetectorUnit[1] : 'Not Reporting') );
            insertDOM('td', 'spacer', '', 'width:50px', elt+'Threshold', '', '');
            insertDOM('td', elt+'Bthreshold', '', '', elt+'Threshold', '', ( (dataBus.HPGe[eltName2].threshold < 0xDEADBEEF) ? dataBus.HPGe[eltName2].threshold.toFixed(0) + ' ' + window.parameters.subdetectorUnit[1] : 'Not Reporting') ); 

            insertDOM('tr', elt+'Rate', '', '', 'tigressTTtable', '', '');
            insertDOM('td', elt+'RateTitle', '', 'text-align:right;', elt+'Rate', '', window.parameters.monitorValues[2])
            insertDOM('td', 'spacer', '', 'width:10px', elt+'Rate', '', '');
            insertDOM('td', elt+'Arate', '', '', elt+'Rate', '', ( (dataBus.HPGe[eltName1].rate < 0xDEADBEEF) ? dataBus.HPGe[eltName1].rate.toFixed(0) + ' ' + window.parameters.subdetectorUnit[2] : 'Not Reporting') );
            insertDOM('td', 'spacer', '', 'width:50px;', elt+'Rate', '', '');
            insertDOM('td', elt+'Brate', '', '', elt+'Rate', '', ( (dataBus.HPGe[eltName2].rate < 0xDEADBEEF) ? dataBus.HPGe[eltName2].rate.toFixed(0) + ' ' + window.parameters.subdetectorUnit[2] : 'Not Reporting') ); 

            if(i!=3){
                insertDOM('tr', elt+'divider', '', '', 'tigressTTtable', '', '');
                insertDOM('td', elt+'line', '', 'border-bottom-style:solid; border-color:white; border-width:1px;', elt+'divider', '', '');
                document.getElementById(elt+'line').setAttribute('colspan', 5);
            }   

        }
    }

}










