function reportSpectrumBin(){
	SVparam.canvas.addEventListener('mousemove', function(event){
		var coords, x, y, xBin, yBin;

		coords = document.getElementById(SVparam.canvasID).relMouseCoords(event);
		x = coords.x;
		y = coords.y;

        if(x > SVparam.leftMargin && x < SVparam.canvas.width - SVparam.rightMargin && y > SVparam.topMargin){
	        xBin = Math.floor((x-SVparam.leftMargin)/SVparam.binWidth) + SVparam.XaxisLimitMin;
    	    
    	    if(SVparam.AxisType == 1){
    	    	yBin = (SVparam.canvas.height-SVparam.bottomMargin - y) / SVparam.countHeight;
    	    	yBin = Math.floor(Math.pow(10,yBin)/10);
    	    } else {
    	    	yBin = Math.floor((SVparam.canvas.height-SVparam.bottomMargin - y) / SVparam.countHeight);
    	    }

        	document.getElementById('mousebox').innerHTML = 'x=' + xBin.toFixed(0) + ' y=' + yBin.toFixed(0);
        } else {
        	document.getElementById('mousebox').innerHTML = '';
        }

        //change cursor to indicate draggable region:
        if(SVparam.fitModeEngage){
        	if( y < (SVparam.canvas.height - SVparam.bottomMargin) )
	        	document.body.style.cursor = 's-resize';
	        else 
	        	document.body.style.cursor = 'n-resize';
	    }
        else if(y>SVparam.canvas.height-SVparam.bottomMargin) 
        	document.body.style.cursor = 'pointer';
        else
        	document.body.style.cursor = 'default';

	}, false);

	SVparam.canvas.onmouseout = function(event){
		document.body.style.cursor = 'default';
	};
}

function DragWindow(){
	var buffer;

	//don't even try if there's only one bin selected:
	if(SVparam.XMouseLimitxMin != SVparam.XMouseLimitxMax){
		//don't confuse the click limits with the click and drag limits:
		SVparam.clickBounds[0] = 'abort';

		//Make sure the max is actually the max:
		if(SVparam.XMouseLimitxMax < SVparam.XMouseLimitxMin){
			buffer = SVparam.XMouseLimitxMax;
			SVparam.XMouseLimitxMax = SVparam.XMouseLimitxMin;
			SVparam.XMouseLimitxMin = buffer;
		}

		//keep things in range
		if(SVparam.XMouseLimitxMin < 0) SVparam.XMouseLimitxMin = 0;
		if(SVparam.XMouseLimitxMax > SVparam.XaxisLimitAbsMax) SVparam.XMouseLimitxMax = SVparam.XaxisLimitAbsMax;

		//stick into the appropriate globals
		SVparam.XaxisLimitMin = parseInt(SVparam.XMouseLimitxMin);
		SVparam.XaxisLimitMax = parseInt(SVparam.XMouseLimitxMax);

		//populate the text fields:
		document.getElementById("LowerXLimit").value=SVparam.XaxisLimitMin;
		document.getElementById("UpperXLimit").value=SVparam.XaxisLimitMax;	

		//drawXaxis();
		SVparam.YaxisLimitMax=5;

		plot_data(0);

	}
}

function ClickWindow(bin){

	//decide what to do with the clicked limits - zoom or fit?
	if(SVparam.clickBounds.length == 0){
		SVparam.clickBounds[0] = bin;
	} else if(SVparam.clickBounds[0] == 'abort' && !SVparam.fitModeEngage){
		SVparam.clickBounds = [];
	} else if(SVparam.clickBounds.length == 2 ){
		SVparam.clickBounds = [];
		SVparam.clickBounds[0] = bin;
	} else if(SVparam.clickBounds.length == 1){
		SVparam.clickBounds[1] = bin;
		//fit mode
		if(SVparam.fitModeEngage){
			SVparam.FitLimitLower = Math.min(SVparam.clickBounds[0], SVparam.clickBounds[1]);
			SVparam.FitLimitUpper = Math.max(SVparam.clickBounds[0], SVparam.clickBounds[1]);
			FitData();
		} else {  //zoom mode
			//use the mouse drag function to achieve the same effect for clicking:
			SVparam.XMouseLimitxMin = SVparam.clickBounds[0];
			SVparam.XMouseLimitxMax = SVparam.clickBounds[1];
			DragWindow();
			SVparam.clickBounds = [];
		}
	}
}

function setAxisLimit(input, fieldID, target, absMax){
	var field = document.getElementById(fieldID)
	if(field.validity.valid){

		//mins are always protected to be > 0 from the HTML, but maxs need to be babysat:
		if(field.value > SVparam[absMax])
			field.value = SVparam[absMax];

		//input the number requested...
		SVparam[target]=input;

		//...and make sure it makes sense.
		if(SVparam[target]>SVparam[absMax])
			SVparam[target]=SVparam[absMax];

		if(SVparam[target]<0) 
			SVparam[target]=0;

	} else {  //exception handling
		if(input < field.min)
			field.value = field.min;
		else if(input > field.max)
			field.value = field.max;
		if(field.value > SVparam[absMax])
			field.value = SVparam[absMax]
	}
}

function scrollSpectra(step, targetMin, targetMax, targetAbsMax, loField, hiField){
	var windowSize = SVparam[targetMax] - SVparam[targetMin];

	SVparam[targetMin] += step;
	SVparam[targetMax] += step;

	if(SVparam[targetMin] < 0){
		SVparam[targetMin] = 0;
		SVparam[targetMax] = windowSize;
	}

	if(SVparam[targetMax] > SVparam[targetAbsMax]){
		SVparam[targetMax] = SVparam[targetAbsMax];
		SVparam[targetMin] = SVparam[targetAbsMax] - windowSize;
	}

	document.getElementById(loField).value = SVparam[targetMin];
	document.getElementById(loField).onchange();
	document.getElementById(hiField).value = SVparam[targetMax];
	document.getElementById(hiField).onchange();
}

function Unzoom(){

	//1D
	SVparam.XaxisLimitMin=0;
	SVparam.XaxisLimitMax=SVparam.XaxisLimitAbsMax;

	document.getElementById("LowerXLimit").value=SVparam.XaxisLimitMin;
	document.getElementById("UpperXLimit").value=SVparam.XaxisLimitMax;

	plot_data(0);

	//2D
	SVparam.XaxisLimitMin2D = 0;
	SVparam.XaxisLimitMax2D = SVparam.XaxisLimitAbsMax2D;
	SVparam.YaxisLimitMin2D = 0;
	SVparam.YaxisLimitMax2D = SVparam.YaxisLimitAbsMax2D;

	document.getElementById("LowerXLimit2D").value=SVparam.XaxisLimitMin2D;
	document.getElementById("UpperXLimit2D").value=SVparam.XaxisLimitMax2D;
	document.getElementById("LowerYLimit").value=SVparam.YaxisLimitMin2D;
	document.getElementById("UpperYLimit").value=SVparam.YaxisLimitMax2D;

	plot_data2D(0);	

}

/////////////////////////////////////////////////////////////////////
// set_SVparam.AxisType function                                   //
// Function to change to and from Linear and Logarithmic Y axis    //
/////////////////////////////////////////////////////////////////////
function set_AxisType(word){
	var x;

	//TODO: overkill, simplify:
	x=word.id;
	SVparam.AxisType=x.substring(1,2);
	x=x.substring(0,1)+"0"; document.getElementById(x+"").checked=false;
	x=x.substring(0,1)+"1"; document.getElementById(x+"").checked=false;
	x=word.id; document.getElementById(x+"").checked=true;
	SVparam.AxisType=word.value;

	if(SVparam.AxisType==0){
		SVparam.YaxisLimitMin=0;
		SVparam.YaxisLimitMax=500;
	}

	if(SVparam.AxisType==1){
		SVparam.YaxisLimitMin=0.1;
		SVparam.YaxisLimitMax=SVparam.YaxisLimitMax*100;  //?? okay I guess...
	}	
	plot_data(0);
}
//////////////////////////////////
// End of set_SVparam.AxisType function //
//////////////////////////////////


/////////////////////////////////////////////////////////////////////
// startup function                                                //
// Function to draw everything the first time when page is loaded  //
/////////////////////////////////////////////////////////////////////
function startup(){
	var iframe, iframeDoc, row, table;

	// Setup the mouse coordinate printing on the screen
	reportSpectrumBin();

	document.getElementById(SVparam.canvasID).onmousedown = function(event){
			SVparam.XMouseLimitxMin = parseInt((document.getElementById(SVparam.canvasID).relMouseCoords(event).x-SVparam.leftMargin)/SVparam.binWidth + SVparam.XaxisLimitMin);
		};
	document.getElementById(SVparam.canvasID).onmouseup = function(event){
			SVparam.XMouseLimitxMax = parseInt((document.getElementById(SVparam.canvasID).relMouseCoords(event).x-SVparam.leftMargin)/SVparam.binWidth + SVparam.XaxisLimitMin); 
			DragWindow();
			ClickWindow( parseInt((document.getElementById(SVparam.canvasID).relMouseCoords(event).x-SVparam.leftMargin)/SVparam.binWidth + SVparam.XaxisLimitMin) );
		}

	document.getElementById(SVparam.canvasID2D).onmousedown = function(event){mDown2D(event)};
	document.getElementById(SVparam.canvasID2D).onmouseup = function(event){mUp2D(event)};
	SVparam.canvas2D.addEventListener('mousemove', function(event){mMove2D(event)}, false);
	document.getElementById(SVparam.canvasID2D).onmouseout = function(event){document.getElementById('2Dcoords').innerHTML=''};


	iframe = document.getElementById('menu_iframe');
	iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
	iframeDoc.open();
	iframeDoc.write('<body style="background:#333333; color:#999999; font-family:'+ "'" +'Raleway'+ "'" +', sans-serif;"> <table id="main_table" width="100%"></table></body>');
	iframeDoc.close();

	table = iframeDoc.getElementById("main_table");
	row = table.insertRow(0);
	row.innerHTML ="Welcome! To begin click 'Load Spectra' below.";

}
///////////////////////////////
// End of startup function   //
///////////////////////////////

/////////////////////////////////////////////////////////////////////
// Math.log10 function                                             //
// Function to calculate the logarithm with base 10 of the number  //
/////////////////////////////////////////////////////////////////////
Math.log10 = function(n) {
	return (Math.log(n)) / (Math.log(10));
}
////////////////////////////////
// End of Math.log10 function //
////////////////////////////////

/////////////////////////////////////////////////////////////////////
// resetData function                                              //
// Function to zero the data array and in the ODB                  //
/////////////////////////////////////////////////////////////////////
function resetData(){
	var i;
	// Zero the data array in the ODB
	// ODBSet("/Analyzer/Parameters/Gate0/reset",1);

	// Zero the data array
	for(i=0; i<512; i++) SVparam.data[i]=0;

	// Redraw with the zeroed data values 
	plot_data(0);
}  
///////////////////////////////
// End of resetData function //
///////////////////////////////

/////////////////////////////////////////////////////////////////////
// plot_data function                                              //
// Function to reload and redraw the data points in the spectrum   //
// Two data display options are available, Stairs and Points       //
// Stairs option: The coordinates of a polyline are saved for each //
// data point. The coordinates are then set in the svg element.    //
// Points option: The coordinates of each data point are saved     //
// directly as the coordinates of a svg circle element.            //
// If the data exceeds the Y limit or the maximum value is well    //
// below the limit then the axis will be redrawn                   //
/////////////////////////////////////////////////////////////////////
function plot_data(RefreshNow, abandonBuffer){
	var i, j, data, thisSpec,
	thisData = [];
	SVparam.entries = [];
	
	SVparam.YaxisLimitMax=5;
	SVparam.XaxisLength = SVparam.XaxisLimitMax - SVparam.XaxisLimitMin;

	//abandon the fit when re-drawing the plot
	if(SVparam.Fitted==1){
		document.getElementById('fitbox').innerHTML = '';
		SVparam.Fitted=0;
	}

	SVparam.maxYvalue=SVparam.YaxisLimitMax;
	// Loop through to get the data and set the Y axis limits
	for(thisSpec=0; thisSpec<SVparam.DisplayedSpecs.length; thisSpec++){
		// Here call function to get data from the server
		// thisData[thisSpec]=ODBGet("/Test/spectrum_data[*]","%d");
		thisData[thisSpec]=getSpecData(SVparam.DisplayedSpecs[thisSpec], abandonBuffer);

		//Find the maximum X value from the size of the data
		if(thisData[thisSpec].length>SVparam.XaxisLimitAbsMax){
			SVparam.XaxisLimitAbsMax=thisData[thisSpec].length;

			// Create more datapoints here if required for this spectrum
		}

		// Find maximum Y value in the part of the spectrum to be displayed
		if(Math.max.apply(Math, thisData[thisSpec].slice(Math.floor(SVparam.XaxisLimitMin),Math.floor(SVparam.XaxisLimitMax)))>SVparam.maxYvalue){
			SVparam.maxYvalue=Math.max.apply(Math, thisData[thisSpec].slice(Math.floor(SVparam.XaxisLimitMin),Math.floor(SVparam.XaxisLimitMax)));
		}

		// Find the sum of everything in the current x range
		data = thisData[thisSpec].slice(  Math.floor(SVparam.XaxisLimitMin),Math.floor(SVparam.XaxisLimitMax)   );
		SVparam.totalEntries = 0;
		for(j=0; j<data.length; j++ ){
			SVparam.totalEntries += data[j];
		}

		//report number of entries on canvas:
		SVparam.entries[thisSpec] = SVparam.totalEntries;

	}// End of for loop

	// Adjust the Y axis limit and compression and redraw the axis
	if(SVparam.maxYvalue>5){
		if(SVparam.AxisType==0) SVparam.YaxisLimitMax=Math.floor(SVparam.maxYvalue*1);
		if(SVparam.AxisType==1) SVparam.YaxisLimitMax=SVparam.maxYvalue*10;
	} else {
		if(SVparam.AxisType==0) SVparam.YaxisLimitMax=5;
		if(SVparam.AxisType==1) SVparam.YaxisLimitMax=50;
	}

	if(SVparam.AxisType==0)
		SVparam.YaxisLength=SVparam.YaxisLimitMax-SVparam.YaxisLimitMin;

	if(SVparam.AxisType==1)
		SVparam.YaxisLength=Math.log10(SVparam.YaxisLimitMax-SVparam.YaxisLimitMin);

	drawFrame();

	// Now the limits are set loop through and plot the data points
	for(thisSpec=0; thisSpec<SVparam.DisplayedSpecs.length; thisSpec++){

		SVparam.context.textBaseline = 'top';
		SVparam.context.fillStyle = SVparam.dataColor[thisSpec];
		SVparam.context.fillText('Entries: '+SVparam.entries[thisSpec], SVparam.canvas.width - SVparam.rightMargin - SVparam.context.measureText('Entries: '+SVparam.entries[thisSpec]).width, thisSpec*16);

		SVparam.data=thisData[thisSpec].slice();

		// Loop through the data spectrum that we have
		//start the canvas path:
		SVparam.context.strokeStyle = SVparam.dataColor[thisSpec];
		SVparam.context.beginPath();
		SVparam.context.moveTo(SVparam.leftMargin, SVparam.canvas.height - SVparam.bottomMargin);
		for(i=Math.floor(SVparam.XaxisLimitMin); i<Math.floor(SVparam.XaxisLimitMax); i++){

			// Protection at the end of the spectrum (minimum and maximum X)
			if(i<SVparam.XaxisLimitMin || i>SVparam.XaxisLimitMax) continue;

			// Protection in Overlay mode for spectra which are shorter (in x) than the longest spectrum overlayed.
			if(i>=SVparam.data.length) continue;

			// If using Stairs data display
			// Record the coordinates of this data point along the polyline
			// The coordinates are set following this for loop
			if(SVparam.DataType==0){
				if(SVparam.AxisType==0){
					//draw canvas line:
					//left side of bar
					SVparam.context.lineTo( SVparam.leftMargin + (i-SVparam.XaxisLimitMin)*SVparam.binWidth, SVparam.canvas.height - SVparam.bottomMargin - SVparam.data[i]*SVparam.countHeight );
					//top of bar
					SVparam.context.lineTo( SVparam.leftMargin + (i+1-SVparam.XaxisLimitMin)*SVparam.binWidth, SVparam.canvas.height - SVparam.bottomMargin - SVparam.data[i]*SVparam.countHeight );
				}

				if(SVparam.AxisType==1){
					//draw canvas line:
					if(SVparam.data[i] > 0){
						//left side of bar
						SVparam.context.lineTo( SVparam.leftMargin + (i-SVparam.XaxisLimitMin)*SVparam.binWidth, SVparam.canvas.height - SVparam.bottomMargin - (Math.log10(SVparam.data[i]) - Math.log10(SVparam.YaxisLimitMin))*SVparam.countHeight );
						//top of bar
						SVparam.context.lineTo( SVparam.leftMargin + (i+1-SVparam.XaxisLimitMin)*SVparam.binWidth, SVparam.canvas.height - SVparam.bottomMargin - (Math.log10(SVparam.data[i]) - Math.log10(SVparam.YaxisLimitMin))*SVparam.countHeight );
					} else {
						//drop to the x axis
						SVparam.context.lineTo( SVparam.leftMargin + (i-SVparam.XaxisLimitMin)*SVparam.binWidth, SVparam.canvas.height - SVparam.bottomMargin );
						//crawl along x axis until log-able data is found:
						SVparam.context.lineTo( SVparam.leftMargin + (i+1-SVparam.XaxisLimitMin)*SVparam.binWidth, SVparam.canvas.height - SVparam.bottomMargin );
					}
				}

			}

		}
		//finish the canvas path:
		SVparam.context.lineTo(SVparam.canvas.width - SVparam.rightMargin, SVparam.canvas.height - SVparam.bottomMargin );
		SVparam.context.closePath();
		SVparam.context.stroke();

	} // End of for loop

	// Pause for some time and then recall this function to refresh the data display
	if(SVparam.RefreshTime>0 && RefreshNow==1) setTimeout(function(){plot_data(1, 'true')},SVparam.RefreshTime*1000); 
	
}
///////////////////////////////
// End of plot_data function //
///////////////////////////////

//draw the plot frame
function drawFrame(){
	var binsPerTick, countsPerTick, i, label;

	//determine bin render width
	SVparam.binWidth = SVparam.xAxisPixLength / (SVparam.XaxisLimitMax - SVparam.XaxisLimitMin);
	//determine the scale render height per count for linear view:
	SVparam.countHeight = SVparam.yAxisPixLength / SVparam.YaxisLength;

	//clear canvas
	SVparam.context.clearRect(0,0,SVparam.canvWidth, SVparam.canvHeight);

	//draw principle axes:
	SVparam.context.strokeStyle = '#FFFFFF';
	SVparam.context.fillStyle = '#FFFFFF';
	SVparam.context.lineWidth = 1;
	SVparam.context.beginPath();
	SVparam.context.moveTo(SVparam.leftMargin, SVparam.topMargin);
	SVparam.context.lineTo(SVparam.leftMargin, SVparam.canvas.height-SVparam.bottomMargin);
	SVparam.context.lineTo(SVparam.canvas.width - SVparam.rightMargin, SVparam.canvas.height - SVparam.bottomMargin);
	SVparam.context.stroke();

	//Decorate x axis////////////////////////////////////////////////////////
	//decide how many ticks to draw on the x axis:
	SVparam.nXticks = 6;

	//come as close to a factor of the number of bins as possible:
	while( Math.floor(SVparam.XaxisLength / SVparam.nXticks) == Math.floor(SVparam.XaxisLength / (SVparam.nXticks-1)) )
		SVparam.nXticks--;
	//draw at most one tick per bin:
	if(SVparam.XaxisLength < (SVparam.nXticks-1) )
		SVparam.nXticks = SVparam.XaxisLength+1

	//how many bins should there be between each tick?
	binsPerTick = Math.floor((SVparam.XaxisLimitMax - SVparam.XaxisLimitMin) / (SVparam.nXticks-1));

	//draw x axis ticks & labels:
	for(i=0; i<SVparam.nXticks; i++){
		//ticks
		SVparam.context.beginPath();
		SVparam.context.moveTo(SVparam.leftMargin + i*binsPerTick*SVparam.binWidth, SVparam.canvas.height - SVparam.bottomMargin);
		SVparam.context.lineTo(SVparam.leftMargin + i*binsPerTick*SVparam.binWidth, SVparam.canvas.height - SVparam.bottomMargin + SVparam.tickLength);
		SVparam.context.stroke();

		//labels
		label = (SVparam.XaxisLimitMin + i*binsPerTick).toFixed(0);
		SVparam.context.textBaseline = 'top';
		SVparam.context.fillText(label, SVparam.leftMargin + i*binsPerTick*SVparam.binWidth - SVparam.context.measureText(label).width/2, SVparam.canvas.height - SVparam.bottomMargin + SVparam.tickLength + SVparam.xLabelOffset);
	}

	//Decorate Y axis/////////////////////////////////////////////////////////
	//decide how many ticks to draw on the y axis:
	SVparam.nYticks = 5;
	//come as close to a factor of the number of bins as possible:
	while( Math.floor(SVparam.YaxisLength / SVparam.nYticks) == Math.floor(SVparam.YaxisLength / (SVparam.nYticks-1)) )
		SVparam.nYticks--;

	//how many counts should each tick increment?
	countsPerTick = Math.floor(SVparam.YaxisLength / (SVparam.nYticks-1));

	//draw y axis ticks and labels:
	for(i=0; i<SVparam.nYticks; i++){
		//ticks
		SVparam.context.beginPath();
		SVparam.context.moveTo(SVparam.leftMargin, SVparam.canvas.height - SVparam.bottomMargin - i*countsPerTick*SVparam.countHeight);
		SVparam.context.lineTo(SVparam.leftMargin - SVparam.tickLength, SVparam.canvas.height - SVparam.bottomMargin - i*countsPerTick*SVparam.countHeight);
		SVparam.context.stroke();

		//labels
		SVparam.context.textBaseline = 'middle';
		if(SVparam.AxisType == 0){ //linear scale
			label = (SVparam.YaxisLimitMax<10000) ? (i*countsPerTick).toFixed(0) : (i*countsPerTick).toExponential(1);
			SVparam.context.fillText(label, SVparam.leftMargin - SVparam.tickLength - SVparam.yLabelOffset - SVparam.context.measureText(label).width, SVparam.canvas.height - SVparam.bottomMargin - i*countsPerTick*SVparam.countHeight);
		} else {  //log scale
			label = i*countsPerTick-1;
			//exponent
			SVparam.context.font = SVparam.expFont;
			SVparam.context.fillText(label, SVparam.leftMargin - SVparam.tickLength - SVparam.yLabelOffset - SVparam.context.measureText(label).width, SVparam.canvas.height - SVparam.bottomMargin - i*countsPerTick*SVparam.countHeight - 10);
			//base
			SVparam.context.font = SVparam.baseFont;
			SVparam.context.fillText('10', SVparam.leftMargin - SVparam.tickLength - SVparam.yLabelOffset - SVparam.context.measureText('10'+label).width, SVparam.canvas.height - SVparam.bottomMargin - i*countsPerTick*SVparam.countHeight);
		}
	}

	//x axis title:
	SVparam.context.textBaseline = 'bottom';
	SVparam.context.fillText('Channels', SVparam.canvas.width - SVparam.rightMargin - SVparam.context.measureText('Channels').width, SVparam.canvas.height);

	//y axis title:
	SVparam.context.textBaseline = 'alphabetic';
	SVparam.context.save();
	SVparam.context.translate(SVparam.leftMargin*0.25, SVparam.context.measureText('Counts').width + SVparam.topMargin );
	SVparam.context.rotate(-Math.PI/2);
	SVparam.context.fillText('Counts', 0,0);
	SVparam.context.restore();

}

function RequestFitLimits(){
	var x;

	//enter fit mode:
	SVparam.fitModeEngage = 1;

	SVparam.FitLimitLower=-1;
	SVparam.FitLimitUpper=-1;

	document.getElementById('fitbox').innerHTML = 'Select fit region with Mouse clicks';

}

function FitData(){
	var cent, fitdata, i, max, width, x, y, height;

	if(SVparam.FitLimitLower<0) SVparam.FitLimitLower=0;
	if(SVparam.FitLimitUpper>SVparam.XaxisLimitAbsMax) SVparam.FitLimitUpper=SVparam.XaxisLimitAbsMax;

	max=1;

	fitdata=getSpecData(SVparam.DisplayedSpecs[0]);
	fitdata=fitdata.slice(SVparam.FitLimitLower,SVparam.FitLimitUpper);

	// Find maximum Y value in the fit data
	if(Math.max.apply(Math, fitdata)>max){
		max=Math.max.apply(Math, fitdata);
	}

	// Find the bin with the maximum Y value
	cent=0;
	while(fitdata[cent]<max){
		cent++;
	}

	// Find the width of the peak
	x=cent;
	while(fitdata[x]>(max/2.0)) x--; 
	width=x;
	x=cent;
	while(fitdata[x]>(max/2.0)) x++; 
	width=x-width;
	if(width<1) width=1;
	width/=2.35;

	cent=cent+SVparam.FitLimitLower+0.5;

	//set up canvas for drawing fit line
	SVparam.context.lineWidth = 3;
	SVparam.context.strokeStyle = '#FF0000';
	SVparam.context.beginPath();
	SVparam.context.moveTo( SVparam.leftMargin + (SVparam.FitLimitLower-SVparam.XaxisLimitMin)*SVparam.binWidth, SVparam.canvas.height - SVparam.bottomMargin - max*Math.exp(-1*(((SVparam.FitLimitLower-cent)*(SVparam.FitLimitLower-cent))/(2*width*width)))*SVparam.countHeight);

	for(i=0;i<fitdata.length;i+=0.2){
		//draw fit line on canvas:
		x=i+SVparam.FitLimitLower;
		y = max*Math.exp(-1*(((x-cent)*(x-cent))/(2*width*width)));
		if(i!=0){
			if(SVparam.AxisType == 0){
				SVparam.context.lineTo( SVparam.leftMargin + (SVparam.FitLimitLower-SVparam.XaxisLimitMin)*SVparam.binWidth + i*SVparam.binWidth, SVparam.canvas.height - SVparam.bottomMargin - y*SVparam.countHeight);
			} else if(SVparam.AxisType == 1){
				if(y<=0) height = 0;
				else height = Math.log10(y) - Math.log10(SVparam.YaxisLimitMin);
				if(height<0) height = 0;

				SVparam.context.lineTo( SVparam.leftMargin + (SVparam.FitLimitLower-SVparam.XaxisLimitMin)*SVparam.binWidth + i*SVparam.binWidth, SVparam.canvas.height - SVparam.bottomMargin - height*SVparam.countHeight);
			}
		}
	}

	SVparam.context.stroke();

	SVparam.word = 'Height = ' + max + ' Width = ' + width.toFixed(3) + ' Centroid = ' + cent;
	document.getElementById('fitbox').innerHTML = SVparam.word;
	SVparam.word = 'H=' + max + ',W=' + width.toFixed(3) + ',C=' + cent + "; ";
	document.getElementById('spec_fits0').innerHTML = SVparam.word+document.getElementById('spec_fits0').innerHTML;

	SVparam.Fitted=1;
	SVparam.fitModeEngage = 0;
}

function Menu_unSelectAll(){
	var i, iframe, iframeDoc, j;

	document.getElementById("displayMistake").innerHTML="";
	iframe = document.getElementById('menu_iframe');
	iframeDoc = iframe.contentDocument || iframe.contentWindow.document;

	// Reset the properties of the rows which were selected
	j=0;
	if(SVparam.Specs.length>0){
		while(j<SVparam.Specs.length){
			i=SVparam.Specs[j];
			iframeDoc.getElementById("row"+i).setAttribute('bgcolor', "#333333");
			iframeDoc.getElementById("row"+i).setAttribute('onclick', 'parent.Menu_MakeselectSpectrum(event,'+i+')');
			j++;
		}
	}
	SVparam.Specs = [];
}

function SetupGetList(){
	var box, but, i;

	// Black out the screen
	box = document.createElement('div');
	box.setAttribute('id', 'hostnameblankbox');
	box.setAttribute('style', 'position:fixed; top:0; left:0; right:0; bottom:0; border:none; z-index:49; background-color:rgba(190,190,190,0.8); opacity:50%;');
	document.getElementById('holder').appendChild(box);

	// Request the hostname input from the user
	box = document.createElement('div');
	box.setAttribute('id', 'hostnamebox');
	box.setAttribute('style', 'position:fixed; top:180px; left:0; right:0; border:3px solid black; z-index:50; width:500px; margin:auto; background-color:#A0A0FF;');
	box.innerHTML = '<center>Please enter a hostname or select a known one from the list:<table width=100%><tr><td align=center id="enterhostbox"></td></tr><tr><td align=center id="knownhostbox"></td></table></center>';
	document.getElementById('holder').appendChild(box);

	but = document.createElement('input');
	but.setAttribute('type', 'text');
	but.setAttribute('id', 'divtext');
	document.getElementById('enterhostbox').appendChild(but);
	but = document.createElement('input');
	but.setAttribute('type', 'button');
	but.setAttribute('id', 'divtextbutton');
	but.setAttribute('value', 'ok');
	but.setAttribute('onclick', 'GetList(divtext.value)');
	document.getElementById('enterhostbox').appendChild(but);
	but = document.createElement('input');
	but.setAttribute('type', 'button');
	but.setAttribute('id', 'divcancelbutton');
	but.setAttribute('value', 'cancel');
	but.setAttribute('onclick', 'GetList(null)');
	document.getElementById('enterhostbox').appendChild(but);

	for(i=0; i<SVparam.KnownHostnames.length; i++){
		but = document.createElement('input');
		but.setAttribute('type', 'button');
		but.setAttribute('id', 'divbutton'+i);
		but.setAttribute('value', SVparam.KnownHostnames[i]);
		but.setAttribute('onclick', 'GetList(this.value)');
		document.getElementById('knownhostbox').appendChild(but);
	}
}

function GetList(newhost){
	var i, iframe, iframeDoc, Num, row, table, string,
		RemoveTable = 0;

	// Check if a list is already loaded by the hostname being defined
	// if yes then set a flag for the old list to be removed later in this function
	if(SVparam.hostname.length>0) RemoveTable=1; 

	// Set the hostname at the top of the page
    string = document.location.href.slice(7, document.location.href.length);
    string = string.slice(0,string.indexOf('/'));
	document.getElementById('youAreHere').innerHTML="Spectrum Viewer - "+string;

	// Attach to the table for the spectrum list in the iframe
	iframe = document.getElementById('menu_iframe');
	iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
	table = iframeDoc.getElementById("main_table");

	// If a previous list was loaded, delete all rows for it
	if(RemoveTable==1){
		i=0;
		Num=table.rows.length;
		while(i<Num){
			table.deleteRow(0);
			i++;
		}
	}
	else{
		table.deleteRow(0);
	}
	
	if(!SVparam.devMode){
		// Here call the function to Get the spectrum list from the server
	//SVparam.spectrum_names = getList();
		for(i=0; i<SVparam.spectrum_names.length; i++){
			row = table.insertRow(i);
			row.setAttribute('id', "row"+i);
			row.setAttribute('bgcolor', "#333333");
			row.setAttribute('style', "display:block;cursor:default");
			// row.setAttribute('onclick', "parent.Menu_selectSpectrum("+i+")");
			row.setAttribute('onclick', "parent.Menu_MakeselectSpectrum(event,"+i+")");
			row.setAttribute('ondblclick', "parent.displaySpectrum("+i+")");
			row.innerHTML = SVparam.spectrum_names[i];
		}
	} else {
		// Put in fake list info - COMMENT OUT ONCE ABOVE FUNCTION IS WORKING
			for(i=0; i<50; i++){
				row = table.insertRow(i);
				row.setAttribute('id', "row"+i);
				row.setAttribute('bgcolor', "#333333");
				row.setAttribute('style', "display:block;cursor:default");
				iframeDoc.getElementById('row'+i).onclick = function(event){ parent.Menu_MakeselectSpectrum(event, parseInt(this.id.slice(3,this.id.length+1))  )};
				iframeDoc.getElementById('row'+i).ondblclick = function(){parent.displaySpectrum( parseInt(this.id.slice(3,this.id.length+1)) )};
				row.innerHTML ="Spectrum Name "+i;
				SVparam.spectrum_names[i]="Spectrum Name "+i;

		}
	}


	// Disable text selection in the menu list
	if (typeof iframeDoc.body.onselectstart!="undefined") //IE route
		iframeDoc.body.onselectstart=function(){return false}

	else if (typeof iframeDoc.body.style.MozUserSelect!="undefined") //Firefox route
		iframeDoc.body.style.MozUserSelect="none"

	else //All other route (ie: Opera)
		iframeDoc.body.onmousedown=function(){return false}

	plot_data(1);
}

function DisplaySpecs(){
	var j, num;

	SVparam.XaxisLimitAbsMax=500;
	SVparam.YaxisLimitMax=5;
	document.getElementById("displayMistake").innerHTML="";

	if(SVparam.Specs.length>1){
		document.getElementById("displayMistake").innerHTML="Only one spectrum can be displayed! (use Overlay for multiple spectra)";
		return;
	}
	if(SVparam.Specs.length==0){
		clearSpecs()
		return;
	}

	reset_list_color();
	SVparam.word="";
	num=(SVparam.Specs.length-1);

	if(num>=0){
		while(num>=0){
			List_update(SVparam.Specs[num],0);
			num--;
			if(num<0) break;
		}
	}
	SVparam.DisplayedSpecs=SVparam.Specs.slice();
	SVparam.NumSpecsDisplayed=1;
	Menu_unSelectAll();
	plot_data(0);
}

function OverlaySpecs(){
	var j, x;

	SVparam.XaxisLimitAbsMax=500;
	SVparam.YaxisLimitMax=5;
	document.getElementById("displayMistake").innerHTML="";

	if((SVparam.Specs.length+SVparam.NumSpecsDisplayed)>10){
		document.getElementById("displayMistake").innerHTML="Maximum of 10 spectra can be overlayed";
		return;
	}

	// Plot the spectra
	for(j=0; j<SVparam.Specs.length; j++){
		SVparam.DisplayedSpecs[SVparam.DisplayedSpecs.length]=SVparam.Specs[j];
		List_update(SVparam.Specs[j],SVparam.NumSpecsDisplayed+j);
	}
	plot_data(0);

	SVparam.NumSpecsDisplayed=SVparam.NumSpecsDisplayed+SVparam.Specs.length;
	Menu_unSelectAll();
}

function Menu_MakeselectSpectrum(oEvent,id){
	var i, id1;

	//alert("MakeSelection: "+id);
	if (oEvent.shiftKey){
		// Multi-select with mouse button and Shift key 
		if(SVparam.Specs.length>0){
			// Call Menu_selectSpectrum multiple times
			id1=SVparam.Specs[SVparam.Specs.length-1];
			if(id1>id){
				for(i=id; i<id1; i++) Menu_selectSpectrum(i);
			} else {
				for(i=id1+1; i<=id; i++){ Menu_selectSpectrum(i); }
			}
		} else {
			// Even though shift key is used, this is the first spectrum so just select it
			Menu_selectSpectrum(id);
		}
	} else {
		// Single-select with mouse button only
		Menu_selectSpectrum(id);
	}
}

function Menu_selectSpectrum(id){
	var iframe, iframeDoc, j, rowID;

	document.getElementById("displayMistake").innerHTML="";

	// Check for duplicates
	j=0;
	if(SVparam.DisplayedSpecs.length>0){
		while(j<SVparam.DisplayedSpecs.length){
			if(SVparam.DisplayedSpecs[j]!=id) j++;
			else {
				SVparam.word='Spectrum "'+SVparam.spectrum_names[id]+'" already displayed, use "Clear Spectra"';
				document.getElementById("displayMistake").innerHTML=SVparam.word;
				return;
			}
		}
	}
	j=0;
	if(SVparam.Specs.length>0){
		while(j<SVparam.Specs.length){
			if(SVparam.Specs[j]!=id) j++;
			else{
				return;
			}
		}
	}

	// Connect to the iframe and make the changes to the selected row
	iframe = document.getElementById('menu_iframe');
	iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
	rowID = iframeDoc.getElementById("row"+id);
	iframeDoc.getElementById("row"+id).setAttribute('bgcolor', "lightblue");
	iframeDoc.getElementById("row"+id).setAttribute('onclick', 'parent.Menu_unselectSpectrum('+id+')');

	// Add this spectrum to the Specs list
	SVparam.Specs[SVparam.Specs.length]=id;
}

function List_update(id,colorID) {
	var i, table, row;

	table = document.getElementById("recent_list");
	//don't duplicate things in the list:
	for(i=0; i<table.getElementsByTagName("tr").length; i++){
		if(table.getElementsByTagName('tr')[i].innerHTML.indexOf(SVparam.spectrum_names[id]) != -1)
			table.deleteRow(i);
	}

	SVparam.word='<td width="25px" align="center" id="box'+colorID+'" style="display:inline-block;width:20px;background-color:'+SVparam.dataColor[colorID]+';color:'+SVparam.dataColor[colorID]+'">:-)</td><td width="150px" align="center"><button type="button" class="navLink" value="Display" onclick="displaySpectrum('+id+')">Display</button>'+' <button type="button" class="navLink" value="Overlay" onclick="overlaySpectrum('+id+')">Overlay</button></td><td width="225px">'+SVparam.spectrum_names[id]+' </td><td id="spec_fits'+colorID+'"></td>';
	table.setAttribute('style', 'display:block; margin-top:10px;')
	row = table.insertRow(0);
	row.innerHTML =SVparam.word;

	i = table.getElementsByTagName("tr").length;
	if(i>40) table.deleteRow(i-1);
}

function reset_list_color(){
	var j, x;

	for(j=0; j<10; j++){
		x=document.getElementById("box"+j);
		if(x){
			x.setAttribute('style', "background-color:#333333;color:#333333");
			x.setAttribute('id', "");
		}
	}
}

function displaySpectrum(id){
	var j;

	document.getElementById("displayMistake").innerHTML="";

	SVparam.XaxisLimitAbsMax=500;
	SVparam.YaxisLimitMax=5;
	reset_list_color();
	Menu_unSelectAll();
	SVparam.Specs[0]=id;
	List_update(id,0);

	SVparam.DisplayedSpecs=SVparam.Specs.slice();
	SVparam.NumSpecsDisplayed=1;
	plot_data(0);
}

function overlaySpectrum(id){
	var j, x;

	document.getElementById("displayMistake").innerHTML="";

	// Check for duplicates
	j=0;
	if(SVparam.DisplayedSpecs.length>0){
		while(j<SVparam.DisplayedSpecs.length){
			if(SVparam.DisplayedSpecs[j]!=id) j++;
			else {
				SVparam.word='Spectrum "'+SVparam.spectrum_names[id]+'" already displayed';
				document.getElementById("displayMistake").innerHTML=SVparam.word;
				return;
			}
		}
	}

	// Add this spectrum to the Specs list
	//SVparam.Specs[SVparam.Specs.length]=id;
	SVparam.Specs = [id]  //dubious hack seems to fix the funky behavior of the above line - first use of overlay duplicated the original spectrum, investigate.

	//Check number of displayed spectra
	if((SVparam.Specs.length+SVparam.NumSpecsDisplayed)>10){
		document.getElementById("displayMistake").innerHTML="Maximum of 10 spectra can be overlayed";
		return;
	}

	// Plot the spectra
	for(j=0; j<SVparam.Specs.length; j++){
		SVparam.DisplayedSpecs[SVparam.DisplayedSpecs.length]=SVparam.Specs[j];
		List_update(SVparam.Specs[j],SVparam.NumSpecsDisplayed+j);
	}
	plot_data(0);

	SVparam.NumSpecsDisplayed=SVparam.NumSpecsDisplayed+SVparam.Specs.length;
	Menu_unSelectAll();
}

function Menu_unselectSpectrum(id){
	var iframe, iframeDoc, j, k;

	document.getElementById("displayMistake").innerHTML="";
	iframe = document.getElementById('menu_iframe');
	iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
	iframeDoc.getElementById("row"+id).setAttribute('bgcolor', "#333333");
	iframeDoc.getElementById("row"+id).setAttribute('onclick', "parent.Menu_selectSpectrum("+id+")");

	// Remove this spectrum from the parent.Spec array
	j=0;
	if(SVparam.Specs.length>0){
		while(SVparam.Specs[j]!=id){
			j++;
		}
		k=j+1;
		while(k<SVparam.Specs.length){
			SVparam.Specs[j]=SVparam.Specs[k];
			j++; 
			k++;
		}
	}
	SVparam.Specs=SVparam.Specs.slice(0,j);
}

function clearSpecs(){

	//1D:
	reset_list_color();
	SVparam.Specs=[];

	SVparam.DisplayedSpecs=SVparam.Specs.slice();
	SVparam.NumSpecsDisplayed=0;

	drawFrame();

	//2D:
	draw2Dframe();

}

function getSpecData(x, abandonBuffer){
	if(!SVparam.devMode){
		if(SVparam.dataBuffer[parseInt(x)] && !abandonBuffer){
			return SVparam.dataBuffer[parseInt(x)];
		} else {
			SVparam.dataBuffer[parseInt(x)] = getData(parseInt(x));
			return SVparam.dataBuffer[parseInt(x)];
		}
	} else {
		if(x==0) return SVfakeData.energydata0;
		if(x==1) return SVfakeData.energydata1;
		if(x==2) return SVfakeData.energydata2;
		if(x==3) return SVfakeData.energydata3;
		if(x==4) return SVfakeData.energydata4;
	}
}

function relMouseCoords(event){
    var totalOffsetX = 0,
    totalOffsetY = 0,
    canvasX = 0,
    canvasY = 0,
    currentElement = this,
    test = [],
    elts = [];

	if (event.offsetX !== undefined && event.offsetY !== undefined) { return {x:event.offsetX, y:event.offsetY}; }

    do{
        totalOffsetX += currentElement.offsetLeft - currentElement.scrollLeft;
        totalOffsetY += currentElement.offsetTop - currentElement.scrollTop;
        test[test.length] = currentElement.offsetLeft - currentElement.scrollLeft
        elts[elts.length] = currentElement
    }
    while(currentElement = currentElement.offsetParent)
console.log(test)
console.log(elts)
    canvasX = event.pageX - totalOffsetX;
    canvasY = event.pageY - totalOffsetY;

    return {x:canvasX, y:canvasY}
}
HTMLCanvasElement.prototype.relMouseCoords = relMouseCoords;

//call <target==1,2>D view to display in Spectrum Control panel
function summonView(target){
	if(target==1){
		document.getElementById('spectrumBlock2D').setAttribute('style', 'display:none;');
		document.getElementById('spectrumBlock1D').setAttribute('style', '');
		document.getElementById('overlayB').setAttribute('style', '');
	} else if(target==2){
		document.getElementById('spectrumBlock1D').setAttribute('style', 'display:none;');
		document.getElementById('spectrumBlock2D').setAttribute('style', '');
		document.getElementById('spectrumBlock2D').setAttribute('width', '100%');
		document.getElementById('overlayB').setAttribute('style', 'display:none');
	}
}


//stuff for 2D mode///////////////////////////////////////////////////////////////////////////////////
//draw the frame for the 2D view:
function draw2Dframe(){
	var binsPerTick, i, label;

	//determine bin render width (enforce square bins)
	SVparam.binWidth2D = Math.min(  SVparam.yAxisPixLength2D / (SVparam.YaxisLimitMax2D - SVparam.YaxisLimitMin2D), SVparam.xAxisPixLength2D / (SVparam.XaxisLimitMax2D - SVparam.XaxisLimitMin2D));

	//clear canvas
	SVparam.context2D.clearRect(0,0,SVparam.canvWidth2D, SVparam.canvHeight2D);

	//draw principle axes:
	SVparam.context2D.strokeStyle = '#FFFFFF';
	SVparam.context2D.fillStyle = '#FFFFFF';
	SVparam.context2D.lineWidth = 1;
	SVparam.context2D.beginPath();
	SVparam.context2D.moveTo(SVparam.leftMargin2D, SVparam.topMargin2D);
	SVparam.context2D.lineTo(SVparam.leftMargin2D, SVparam.canvas2D.height-SVparam.bottomMargin2D);
	SVparam.context2D.lineTo(SVparam.canvas2D.width - SVparam.rightMargin2D, SVparam.canvas2D.height - SVparam.bottomMargin2D);
	SVparam.context2D.stroke();

	//Decorate x axis////////////////////////////////////////////////////////
	//decide how many ticks to draw on the x axis:
	SVparam.nXticks = 6;
	//draw at most one tick per bin:
	if(SVparam.XaxisLength2D < (SVparam.nXticks-1) )
		SVparam.nXticks = SVparam.XaxisLength2D+1
	//come as close to a factor of the number of bins as possible:
	while( Math.floor(SVparam.XaxisLength2D / SVparam.nXticks) == Math.floor(SVparam.XaxisLength2D / (SVparam.nXticks-1)) )
		SVparam.nXticks--;

	//how many bins should there be between each tick?
	binsPerTick = Math.floor((SVparam.XaxisLimitMax2D - SVparam.XaxisLimitMin2D) / (SVparam.nXticks-1));

	//draw x axis ticks & labels:
	for(i=0; i<SVparam.nXticks; i++){
		//ticks
		SVparam.context2D.beginPath();
		SVparam.context2D.moveTo(SVparam.leftMargin2D + i*binsPerTick*SVparam.binWidth2D, SVparam.canvas2D.height - SVparam.bottomMargin2D);
		SVparam.context2D.lineTo(SVparam.leftMargin2D + i*binsPerTick*SVparam.binWidth2D, SVparam.canvas2D.height - SVparam.bottomMargin2D + SVparam.tickLength);
		SVparam.context2D.stroke();

		//labels
		label = (SVparam.XaxisLimitMin2D + i*binsPerTick).toFixed(0);
		SVparam.context2D.textBaseline = 'top';
		SVparam.context2D.fillText(label, SVparam.leftMargin2D + i*binsPerTick*SVparam.binWidth2D - SVparam.context2D.measureText(label).width/2, SVparam.canvas2D.height - SVparam.bottomMargin2D + SVparam.tickLength + SVparam.xLabelOffset);
	}

	//Decorate Y axis/////////////////////////////////////////////////////////
	//decide how many ticks to draw on the y axis:
	SVparam.nYticks = 6;
	//come as close to a factor of the number of bins as possible:
	while( Math.floor(SVparam.YaxisLength2D / SVparam.nYticks) == Math.floor(SVparam.YaxisLength2D / (SVparam.nYticks-1)) )
		SVparam.nYticks--;

	//how many bins should each tick increment?
	binsPerTick = Math.floor(SVparam.YaxisLength2D / (SVparam.nYticks-1));

	//draw y axis ticks and labels:
	for(i=0; i<SVparam.nYticks; i++){
		//ticks
		SVparam.context2D.beginPath();
		SVparam.context2D.moveTo(SVparam.leftMargin2D, SVparam.canvas2D.height - SVparam.bottomMargin2D - i*binsPerTick*SVparam.binWidth2D);
		SVparam.context2D.lineTo(SVparam.leftMargin2D - SVparam.tickLength, SVparam.canvas2D.height - SVparam.bottomMargin2D - i*binsPerTick*SVparam.binWidth2D);
		SVparam.context2D.stroke();

		//labels
		SVparam.context2D.textBaseline = 'middle';
		label = (SVparam.YaxisLimitMin2D + i*binsPerTick).toFixed(0);
		SVparam.context2D.fillText(label, SVparam.leftMargin2D - SVparam.tickLength - SVparam.yLabelOffset - SVparam.context2D.measureText(label).width, SVparam.canvas2D.height - SVparam.bottomMargin2D - i*binsPerTick*SVparam.binWidth2D);

	}

	//x axis title:
	SVparam.context2D.textBaseline = 'bottom';
	SVparam.context2D.fillText('Channels', SVparam.canvas2D.width - SVparam.rightMargin2D - SVparam.context2D.measureText('Channels').width, SVparam.canvas2D.height);

	//y axis title:
	SVparam.context2D.textBaseline = 'alphabetic';
	SVparam.context2D.save();
	SVparam.context2D.translate(SVparam.leftMargin2D*0.25, SVparam.context2D.measureText('Channels').width + SVparam.topMargin2D );
	SVparam.context2D.rotate(-Math.PI/2);
	SVparam.context2D.fillText('Channels', 0,0);
	SVparam.context2D.restore();

}

function plot_data2D(RefreshNow, abandonBuffer){
	var i, j, data, thisSpec, 
	entries = 0,
	thisData = [];
	SVparam.entries = [];

	//echo back the axis limits in the input textboxes:
	document.getElementById('LowerXLimit2D').value = SVparam.XaxisLimitMin2D;
	document.getElementById('UpperXLimit2D').value = SVparam.XaxisLimitMax2D;
	document.getElementById('LowerYLimit').value = SVparam.YaxisLimitMin2D;
	document.getElementById('UpperYLimit').value = SVparam.YaxisLimitMax2D;

	thisData = window.thisData;
/*
	SVparam.maxYvalue=SVparam.YaxisLimitMax;
	// Loop through to get the data and set the Y axis limits
	for(thisSpec=0; thisSpec<SVparam.DisplayedSpecs.length; thisSpec++){
		// Here call function to get data from the server
		// thisData[thisSpec]=ODBGet("/Test/spectrum_data[*]","%d");
		thisData[thisSpec]=getSpecData(SVparam.DisplayedSpecs[thisSpec], abandonBuffer);

		//Find the maximum X value from the size of the data
		if(thisData[thisSpec].length>SVparam.XaxisLimitAbsMax){
			SVparam.XaxisLimitAbsMax=thisData[thisSpec].length;

			// Create more datapoints here if required for this spectrum
		}

		// Find maximum Y value in the part of the spectrum to be displayed
		if(Math.max.apply(Math, thisData[thisSpec].slice(Math.floor(SVparam.XaxisLimitMin),Math.floor(SVparam.XaxisLimitMax)))>SVparam.maxYvalue){
			SVparam.maxYvalue=Math.max.apply(Math, thisData[thisSpec].slice(Math.floor(SVparam.XaxisLimitMin),Math.floor(SVparam.XaxisLimitMax)));
		}

		// Find the sum of everything in the current x range
		data = thisData[thisSpec].slice(  Math.floor(SVparam.XaxisLimitMin),Math.floor(SVparam.XaxisLimitMax)   );
		SVparam.totalEntries = 0;
		for(j=0; j<data.length; j++ ){
			SVparam.totalEntries += data[j];
		}

		//report number of entries on canvas:
		SVparam.entries[thisSpec] = SVparam.totalEntries;

	}// End of for loop
*/
/*
	// Adjust the Y axis limit and compression and redraw the axis
	if(SVparam.maxYvalue>5){
		if(SVparam.AxisType==0) SVparam.YaxisLimitMax=Math.floor(SVparam.maxYvalue*1);
		if(SVparam.AxisType==1) SVparam.YaxisLimitMax=SVparam.maxYvalue*10;
	} else {
		if(SVparam.AxisType==0) SVparam.YaxisLimitMax=5;
		if(SVparam.AxisType==1) SVparam.YaxisLimitMax=50;
	}
*/
	//update axis range
	SVparam.XaxisLength2D=SVparam.XaxisLimitMax2D-SVparam.XaxisLimitMin2D;
	SVparam.YaxisLength2D=SVparam.YaxisLimitMax2D-SVparam.YaxisLimitMin2D;

	draw2Dframe();

	//fill histo:
	for(i=0; i<thisData.length; i++){
		if(thisData[i].x >= SVparam.XaxisLimitMin2D && thisData[i].x < SVparam.XaxisLimitMax2D && thisData[i].y >= SVparam.YaxisLimitMin2D && thisData[i].y < SVparam.YaxisLimitMax2D){
			SVparam.context2D.fillStyle = scalepickr(thisData[i].z, 'Sunset');
			//SVparam.context2D.shadowColor = scalepickr(thisData[i].z, 'Sunset');
			SVparam.context2D.fillRect(SVparam.leftMargin2D + (thisData[i].x-SVparam.XaxisLimitMin2D)*SVparam.binWidth2D, SVparam.canvas2D.height - SVparam.bottomMargin2D - (thisData[i].y-SVparam.YaxisLimitMin2D+1)*SVparam.binWidth2D ,SVparam.binWidth2D,SVparam.binWidth2D);
			entries += thisData[i].z;
		}
	}

	//report entries:
	SVparam.context2D.textBaseline = 'top';
	SVparam.context2D.fillStyle = '#999999';
	SVparam.context2D.fillText('Entries: '+entries, SVparam.canvas2D.width - SVparam.rightMargin2D - SVparam.context.measureText('Entries: '+entries).width, 16);


	// Pause for some time and then recall this function to refresh the data display
	if(SVparam.RefreshTime>0 && RefreshNow==1) setTimeout(function(){plot_data2D(1, 'true')},SVparam.RefreshTime*1000); 
}

//mouse down & mouse up behavior functions for 2D canvas:
function mDown2D(event){
	var x, y, coords;

	coords = document.getElementById(SVparam.canvasID2D).relMouseCoords(event);
	x = coords.x;
	y = coords.y;

	//drag a box if clicking in the plot field:
	if(x > SVparam.leftMargin2D && x < (SVparam.canvas2D.width - SVparam.rightMargin2D) && y>SVparam.topMargin2D && y<(SVparam.canvas2D.height-SVparam.bottomMargin2D)){
		SVparam.onclickXvals.min = Math.floor((x-SVparam.leftMargin2D)/SVparam.binWidth2D + SVparam.XaxisLimitMin2D);
		SVparam.onclickYvals.min = Math.floor((SVparam.canvas2D.height-SVparam.bottomMargin2D - y)/SVparam.binWidth2D + SVparam.YaxisLimitMin2D);
	}
}

function mUp2D(event){
	var x, y, coords;

	coords = document.getElementById(SVparam.canvasID2D).relMouseCoords(event);
	x = coords.x;
	y = coords.y;

	//drag a box if clicking in the plot field:
	if(x > SVparam.leftMargin2D && x < (SVparam.canvas2D.width - SVparam.rightMargin2D) && y>SVparam.topMargin2D && y<(SVparam.canvas2D.height-SVparam.bottomMargin2D)){
		SVparam.onclickXvals.max = Math.floor((x-SVparam.leftMargin2D)/SVparam.binWidth2D + SVparam.XaxisLimitMin2D);
		SVparam.onclickYvals.max = Math.floor((SVparam.canvas2D.height-SVparam.bottomMargin2D - y)/SVparam.binWidth2D + SVparam.YaxisLimitMin2D);

		//make sure the mins and maxes go to the right place, in case the user dragged backwards:
		SVparam.XaxisLimitMin2D = Math.min(SVparam.onclickXvals.min, SVparam.onclickXvals.max);
		SVparam.XaxisLimitMax2D = Math.max(SVparam.onclickXvals.min, SVparam.onclickXvals.max);
		SVparam.YaxisLimitMin2D = Math.min(SVparam.onclickYvals.min, SVparam.onclickYvals.max);
		SVparam.YaxisLimitMax2D = Math.max(SVparam.onclickYvals.min, SVparam.onclickYvals.max);

		//redraw with new bounds:
		plot_data2D();
	}
}

function mMove2D(event){
	var x, y, coords, xBin, yBin;

	coords = document.getElementById(SVparam.canvasID2D).relMouseCoords(event);
	x = coords.x;
	y = coords.y;

	xBin = Math.floor((x-SVparam.leftMargin2D)/SVparam.binWidth2D+SVparam.XaxisLimitMin2D);
	yBin = Math.floor((SVparam.canvas2D.height-SVparam.bottomMargin2D-y)/SVparam.binWidth2D+SVparam.YaxisLimitMin2D);

	document.getElementById('2Dcoords').innerHTML = 'x: '+xBin+', y: '+yBin;

}


//map [0,1] onto black->purple->red->orange->yellow->white
scalepickr = function(scale, palette){
    //map scale onto [0,360]:
    var H = scale*300 / 60;
    if(H>5) H=5;
    if(H<0) H=0;
    var R, G, B;
    var start0, start1, start2, start3, start4, start5;
    if (palette == 'Sunset'){
        start0 = [0,0,0];
        start1 = [0,0,0x52];
        start2 = [0xE6,0,0x5C];
        start3 = [255,255,0];        
        start4 = [255,0x66,0];
        start5 = [255,0,0];        
    } else if (palette == 'ROOT Rainbow'){
        start0 = [0xFF,0x00,0x00];
        start1 = [0xFF,0xFF,0x00];
        start2 = [0x00,0xFF,0x00];
        start3 = [0x00,0xFF,0xFF];
        start4 = [0x00,0x00,0xFF];
        start5 = [0x66,0x00,0xCC];
        H = -1*(H-5);
    } else if (palette == 'Greyscale'){
        start0 = [0x00,0x00,0x00];
        start1 = [0x22,0x22,0x22];
        start2 = [0x55,0x55,0x55];
        start3 = [0x88,0x88,0x88];        
        start4 = [0xBB,0xBB,0xBB];
        start5 = [0xFF,0xFF,0xFF];
    } else if (palette == 'Red Scale'){
        start0 = [0x00,0x00,0x00];
        start1 = [0x33,0x00,0x00];
        start2 = [0x66,0x00,0x00];
        start3 = [0x99,0x00,0x00];
        start4 = [0xCC,0x00,0x00];
        start5 = [0xFF,0x00,0x00];
    } else if (palette == 'Mayfair'){
        start0 = [0x1E,0x4B,0x0F];
        start1 = [0x0E,0xBE,0x57];
        start2 = [0xE4,0xAB,0x33];
        start3 = [0xEC,0x95,0xF7];
        start4 = [0x86,0x19,0x4A];
        start5 = [0xFF,0x10,0x10];
    } else if (palette == 'Test'){
        start0 = [0x5E,0x1F,0x14];
        start1 = [0x74,0x4D,0x3E];
        start2 = [0x9D,0x47,0x05];
        start3 = [0xDF,0x67,0x19];
        start4 = [0xFE,0x83,0x54];
        start5 = [0x251,0x15,0x29];
    }
    if(H>=0 && H<1){
        R = start0[0] + Math.round(H*(start1[0]-start0[0]));
        G = start0[1] + Math.round(H*(start1[1]-start0[1]));
        B = start0[2] + Math.round(H*(start1[2]-start0[2]));
    } else if(H>=1 && H<2){
        R = start1[0] + Math.round((H-1)*(start2[0]-start1[0]));
        G = start1[1] + Math.round((H-1)*(start2[1]-start1[1]));
        B = start1[2] + Math.round((H-1)*(start2[2]-start1[2]));
    } else if(H>=2 && H<3){
        R = start2[0] + Math.round((H-2)*(start3[0]-start2[0]));
        G = start2[1] + Math.round((H-2)*(start3[1]-start2[1]));
        B = start2[2] + Math.round((H-2)*(start3[2]-start2[2]));
    } else if(H>=3 && H<4){
        R = start3[0] + Math.round((H-3)*(start4[0]-start3[0]));
        G = start3[1] + Math.round((H-3)*(start4[1]-start3[1]));
        B = start3[2] + Math.round((H-3)*(start4[2]-start3[2]));
    } else if(H>=4 && H<=5){
        R = start4[0] + Math.round((H-4)*(start5[0]-start4[0]));
        G = start4[1] + Math.round((H-4)*(start5[1]-start4[1]));
        B = start4[2] + Math.round((H-4)*(start5[2]-start4[2]));  
    }

    return constructHexColor([R,G,B]);

}

function constructHexColor(color){
    var R = Math.round(color[0]);
    var G = Math.round(color[1]);
    var B = Math.round(color[2]);

    R = R.toString(16);
    G = G.toString(16);
    B = B.toString(16);

    if(R.length == 1) R = '0'+R;
    if(G.length == 1) G = '0'+G;
    if(B.length == 1) B = '0'+B;

    return '#'+R+G+B;
}

// To do list:
// 
// General:
// - Reorder the specs list before displaying to handle mutliple selection better
// - include overlay functionality for points data OR REMOVE FUCNTIONALITY - removed for now
// - Reset function to make an array and subtract that from what we get from midas for zeroing spectra ie. spectrum not reset for all users
// - Comment entire code
//
// Cool extras:
// - data points get larger when zoomed in
// - Sleek buttons from images with mouseover effects
//
// 2D spectra:
// - Make a 2D menu load button
// - y axis zoomable with mouse and limit entry
// - 2D data array with each line as all y points of x
