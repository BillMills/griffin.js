function SetupMouseValues(){
	SVparam.img.addEventListener('mousemove',function(evt){
		var Xpos, Ypos;
		// Get point in global SVG space
		SVparam.pt.x = evt.clientX; SVparam.pt.y = evt.clientY;
		// Translate to the right coordinates
		loc = SVparam.pt.matrixTransform(SVparam.img.getScreenCTM().inverse());

		// Adjust for this spectrum coordinates 
		Xpos = Math.floor(((loc.x-SVparam.Xoffset)/SVparam.XaxisCompression))+SVparam.XaxisLimitMin;
		if(SVparam.AxisType==0){ // Linear y axis
			Ypos = Math.floor((SVparam.Yoffset-(loc.y))/SVparam.YaxisCompression);
		}
		if(SVparam.AxisType==1){ // log y axis
			Ypos = Math.floor((Math.pow(10,(((SVparam.Yoffset-(loc.y))/SVparam.YaxisCompression)))-Math.pow(10,SVparam.YaxisLimitMin))/10.0);
		}

		// Only print coordinates if mouse is over the actual spectrum
		if(SVparam.NumSpecsDisplayed>0 && (loc.x>SVparam.Xoffset-1) && (loc.y<SVparam.Yoffset+30) && (loc.x<SVparam.Xoffset+SVparam.XaxisPixelLength) && (loc.y>	SVparam.Yoffset-SVparam.YaxisPixelLength)){
			document.getElementById('mousebox').innerHTML = 'x=' + Xpos + ' y=' + Ypos;
		} else {
			document.getElementById('mousebox').innerHTML = "";
		}
	},false);
}

function SetLimitsByMouse(){
	var loc;

	if(SVparam.Fitted==1){
		document.getElementById('fitbox').innerHTML = '';
		SVparam.img.removeChild(SVparam.img.getElementById("PeakFitLine"));
		SVparam.Fitted=0;
	}

	SVparam.point.x = SVparam.XMouseLimitxMin;
	// Translate to the right coordinates - PROBLEM IS HERE USING .Y
	loc = SVparam.point.matrixTransform(SVparam.img.getScreenCTM().inverse());
	SVparam.XMouseLimitxMin=loc.x; 
	SVparam.point.x = SVparam.XMouseLimitxMax;
	// Translate to the right coordinates - PROBLEM IS HERE USING .Y
	loc = SVparam.point.matrixTransform(SVparam.img.getScreenCTM().inverse());
	SVparam.XMouseLimitxMax=loc.x; 

	if(SVparam.XMouseLimitxMax>SVparam.XMouseLimitxMin){
		SVparam.XaxisLimitMax=Math.floor(((SVparam.XMouseLimitxMax-SVparam.Xoffset)/SVparam.XaxisCompression))+SVparam.XaxisLimitMin;
		SVparam.XaxisLimitMin=Math.floor(((SVparam.XMouseLimitxMin-SVparam.Xoffset)/SVparam.XaxisCompression))+SVparam.XaxisLimitMin;
	} else {
		SVparam.XaxisLimitMax=Math.floor(((SVparam.XMouseLimitxMin-SVparam.Xoffset)/SVparam.XaxisCompression))+SVparam.XaxisLimitMin;
		SVparam.XaxisLimitMin=Math.floor(((SVparam.XMouseLimitxMax-SVparam.Xoffset)/SVparam.XaxisCompression))+SVparam.XaxisLimitMin;
	}

	if(SVparam.XaxisLimitMin<0) SVparam.XaxisLimitMin=0; 
	if(SVparam.XaxisLimitMax>SVparam.XaxisLimitAbsMax) SVparam.XaxisLimitMax=SVparam.XaxisLimitAbsMax;
	document.getElementById("LowerXLimit").value=SVparam.XaxisLimitMin;
	document.getElementById("UpperXLimit").value=SVparam.XaxisLimitMax;
	
	drawXaxis();
	SVparam.YaxisLimitMax=5;

	plot_data(0);
}

function SetUpperLimitByInput(input){
	document.getElementById("limitMistake").innerHTML="";
	if(SVparam.Fitted==1){
		document.getElementById('fitbox').innerHTML = '';
		SVparam.img.removeChild(SVparam.img.getElementById("PeakFitLine"));
		SVparam.Fitted=0;
	}

	if(parseInt(input)<=parseInt(SVparam.XaxisLimitMin)){
		document.getElementById("limitMistake").innerHTML="Error: Upper limit must be larger than the lower limit fool! ";
		document.getElementById("UpperXLimit").value=SVparam.XaxisLimitMax;
		return;
	}
	SVparam.XaxisLimitMax=input;

	if(SVparam.XaxisLimitMax>SVparam.XaxisLimitAbsMax)
		SVparam.XaxisLimitMax=SVparam.XaxisLimitAbsMax;
	drawXaxis();
	SVparam.YaxisLimitMax=5;

	plot_data(0);
}

function SetLowerLimitByInput(input){
	document.getElementById("limitMistake").innerHTML="";
	if(SVparam.Fitted==1){
		document.getElementById('fitbox').innerHTML = '';
		SVparam.img.removeChild(SVparam.img.getElementById("PeakFitLine"));
		SVparam.Fitted=0;
	}

	if(parseInt(input)>=parseInt(SVparam.XaxisLimitMax)){
		document.getElementById("limitMistake").innerHTML="Error: Lower limit must be smaller than the upper limit fool! ";
		document.getElementById("LowerXLimit").value=SVparam.XaxisLimitMin;
		return;
	}
	SVparam.XaxisLimitMin=input;

	if(SVparam.XaxisLimitMin<0){SVparam.XaxisLimitMin=0;}
	drawXaxis();

	SVparam.YaxisLimitMax=5;
	plot_data(0);
}

function ShiftLimitLeft(){
	if(SVparam.Fitted==1){
		document.getElementById('fitbox').innerHTML = '';
		SVparam.img.removeChild(SVparam.img.getElementById("PeakFitLine"));
		SVparam.Fitted=0;
	}
	SVparam.XaxisLimitMin--;
	SVparam.XaxisLimitMax--;

	if(SVparam.XaxisLimitMin<=0) SVparam.XaxisLimitMin=0;
	if(SVparam.XaxisLimitMax<=5) SVparam.XaxisLimitMax=5;
	if(SVparam.XaxisLimitMax>=SVparam.XaxisLimitAbsMax) SVparam.XaxisLimitMax=SVparam.XaxisLimitAbsMax; 
	if(SVparam.XaxisLimitMin>=SVparam.XaxisLimitMax) SVparam.XaxisLimitMin=(SVparam.XaxisLimitMax-5);
	if(SVparam.XaxisLimitMax<=SVparam.XaxisLimitMin) SVparam.XaxisLimitMax=(SVparam.XaxisLimitMin+5); 
	drawXaxis();
	document.getElementById("LowerXLimit").value=SVparam.XaxisLimitMin;
	document.getElementById("UpperXLimit").value=SVparam.XaxisLimitMax;

	SVparam.YaxisLimitMax=5;
	plot_data(0);
}

function ShiftLimitRight(){
	if(SVparam.Fitted==1){
		document.getElementById('fitbox').innerHTML = '';
		SVparam.img.removeChild(SVparam.img.getElementById("PeakFitLine"));
		SVparam.Fitted=0;
	}
	SVparam.XaxisLimitMin++;
	SVparam.XaxisLimitMax++;

	if(SVparam.XaxisLimitMin<0) SVparam.XaxisLimitMin=0;
	if(SVparam.XaxisLimitMax<=5) SVparam.XaxisLimitMax=5;
	if(SVparam.XaxisLimitMax>SVparam.XaxisLimitAbsMax) SVparam.XaxisLimitMax=SVparam.XaxisLimitAbsMax; 
	if(SVparam.XaxisLimitMin>=(SVparam.XaxisLimitMax-5)) SVparam.XaxisLimitMin=(SVparam.XaxisLimitMax-5);
	if(SVparam.XaxisLimitMax<=SVparam.XaxisLimitMin) SVparam.XaxisLimitMax=(SVparam.XaxisLimitMin+5);
	drawXaxis();
	document.getElementById("LowerXLimit").value=SVparam.XaxisLimitMin;
	document.getElementById("UpperXLimit").value=SVparam.XaxisLimitMax;

	SVparam.YaxisLimitMax=5;
	plot_data(0);
}

function ShiftLimitBigLeft(){
	if(SVparam.Fitted==1){
		document.getElementById('fitbox').innerHTML = '';
		SVparam.img.removeChild(SVparam.img.getElementById("PeakFitLine"));
		SVparam.Fitted=0;
	}
	length=SVparam.XaxisLimitMax-SVparam.XaxisLimitMin;
	SVparam.XaxisLimitMin=SVparam.XaxisLimitMin-length;
	SVparam.XaxisLimitMax=SVparam.XaxisLimitMax-length;

	if(SVparam.XaxisLimitMin<=0) SVparam.XaxisLimitMin=0; 
	if(SVparam.XaxisLimitMax<=5) SVparam.XaxisLimitMax=5; 
	if(SVparam.XaxisLimitMax>=SVparam.XaxisLimitAbsMax) SVparam.XaxisLimitMax=SVparam.XaxisLimitAbsMax;
	if(SVparam.XaxisLimitMin>=SVparam.XaxisLimitMax) SVparam.XaxisLimitMin=(SVparam.XaxisLimitMax-5);
	if(SVparam.XaxisLimitMax<=SVparam.XaxisLimitMin) SVparam.XaxisLimitMax=(SVparam.XaxisLimitMin+5);
	drawXaxis();
	document.getElementById("LowerXLimit").value=SVparam.XaxisLimitMin;
	document.getElementById("UpperXLimit").value=SVparam.XaxisLimitMax;

	SVparam.YaxisLimitMax=5;
	plot_data(0);
}

function ShiftLimitBigRight(){
	if(SVparam.Fitted==1){
		document.getElementById('fitbox').innerHTML = '';
		SVparam.img.removeChild(SVparam.img.getElementById("PeakFitLine"));
		SVparam.Fitted=0;
	}
	length=SVparam.XaxisLimitMax-SVparam.XaxisLimitMin;
	SVparam.XaxisLimitMin=SVparam.XaxisLimitMin+length;
	SVparam.XaxisLimitMax=SVparam.XaxisLimitMax+length;

	if(SVparam.XaxisLimitMin<0) SVparam.XaxisLimitMin=0; 
	if(SVparam.XaxisLimitMax<=5) SVparam.XaxisLimitMax=5;
	if(SVparam.XaxisLimitMax>SVparam.XaxisLimitAbsMax) SVparam.XaxisLimitMax=SVparam.XaxisLimitAbsMax; 
	if(SVparam.XaxisLimitMin>=SVparam.XaxisLimitMax) SVparam.XaxisLimitMin=(SVparam.XaxisLimitMax-5); 
	if(SVparam.XaxisLimitMax<=SVparam.XaxisLimitMin) SVparam.XaxisLimitMax=(SVparam.XaxisLimitMin+5); 
	drawXaxis();
	document.getElementById("LowerXLimit").value=SVparam.XaxisLimitMin;
	document.getElementById("UpperXLimit").value=SVparam.XaxisLimitMax;

	SVparam.YaxisLimitMax=5;
	plot_data(0);
}

function resetXaxis(){
	document.getElementById("limitMistake").innerHTML="";
	if(SVparam.Fitted==1){
		document.getElementById('fitbox').innerHTML = '';
		SVparam.img.removeChild(SVparam.img.getElementById("PeakFitLine"));
		SVparam.Fitted=0;
	}

	SVparam.XaxisLimitMin=0;
	SVparam.XaxisLimitMax=SVparam.XaxisLimitAbsMax;
	document.getElementById("LowerXLimit").value=SVparam.XaxisLimitMin;
	document.getElementById("UpperXLimit").value=SVparam.XaxisLimitMax;
	drawXaxis();

	SVparam.YaxisLimitMax=5;
	plot_data(0);
}

/////////////////////////////////////////////////////////////////////
// set_SVparam.DataType function                                   //
// Function to change to and from Stairs or Points data display    //
// Stairs style is like a histogram                                //
// Points style is like a xy scatter plot                          //
/////////////////////////////////////////////////////////////////////
function set_DataType_radios(word){
	var a, i, x; 

	if(SVparam.Fitted==1){
		document.getElementById('fitbox').innerHTML = '';
		SVparam.img.removeChild(SVparam.img.getElementById("PeakFitLine"));
		SVparam.Fitted=0;
	}

	x=word.id;
	SVparam.DataType=x.substring(1,2);
	x=x.substring(0,1)+"0"; document.getElementById(x+"").checked=false;
	x=x.substring(0,1)+"1"; document.getElementById(x+"").checked=false;
	x=word.id; document.getElementById(x+"").checked=true;

	if(SVparam.DataType==0){
		// This needs to change for variable spectrum length
		for(i=0; i<512; i++){
			if(i>SVparam.XaxisLength) break;
			a = SVparam.img.getElementById("datapoint"+i);
			a.setAttribute("cx", (SVparam.Xoffset+i));
			a.setAttribute("cy", "");
			a.setAttribute("r", "");
			a.setAttribute("fill", "");
		}
	}

	if(SVparam.DataType==1){
		SVparam.img.getElementById("dataline0").setAttribute("points","");

		// This needs to change for variable spectrum length
		for(i=0; i<1028; i++){
			x = document.createElementNS(SVparam.svgns,'circle');
			x.setAttribute('id',"datapoint"+i);
			SVparam.img.appendChild(x);
		}
	}

	if(SVparam.DataType==0){
		// This needs to change for variable spectrum length
		for(i=0; i<1028; i++){
			SVparam.img.removeChild(SVparam.img.getElementById("datapoint"+i));
		}
	}

	plot_data(0);
}

/////////////////////////////////////////////////////////////////////
// set_SVparam.AxisType function                                           //
// Function to change to and from Linear and Logarithmic Y axis    //
/////////////////////////////////////////////////////////////////////
function set_AxisType(word){
	var x;

	if(SVparam.Fitted==1){
		document.getElementById('fitbox').innerHTML = '';
		SVparam.img.removeChild(SVparam.img.getElementById("PeakFitLine"));
		SVparam.Fitted=0;
	}

	x=word.id;
	SVparam.AxisType=x.substring(1,2);
	x=x.substring(0,1)+"0"; document.getElementById(x+"").checked=false;
	x=x.substring(0,1)+"1"; document.getElementById(x+"").checked=false;
	x=word.id; document.getElementById(x+"").checked=true;
	SVparam.AxisType=word.value;

	if(SVparam.AxisType==0){
		SVparam.YaxisLimitMin=0;
		SVparam.YaxisLimitMax=500;
		drawYaxisLinear();
	}

	if(SVparam.AxisType==1){
		SVparam.YaxisLimitMin=0.1;
		SVparam.YaxisLimitMax=SVparam.YaxisLimitMax*100;
		drawYaxisLog();
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
function startup(evt){
	var i, iframe, iframeDoc, row, table, x;
	// Connect to the svg image so we can manipulate its elements
	SVparam.img = document.getElementById("svgimage");
	SVparam.pt = SVparam.img.createSVGPoint();
	SVparam.point = SVparam.img.createSVGPoint();

	// Setup the nouse coordinate printing on the screen
	SetupMouseValues();

	// Create the X axis
	x = document.createElementNS(SVparam.svgns,'line');
	x.setAttribute('id','xaxis');
	x.setAttribute("x1", SVparam.Xoffset); 
	x.setAttribute("y1", SVparam.Yoffset); 
	x.setAttribute("x2", (SVparam.Xoffset+SVparam.XaxisPixelLength)); 
	x.setAttribute("y2", SVparam.Yoffset); 
	x.setAttribute("stroke", "rgb(0,0,0)");
	x.setAttribute("stroke-width", "2");
	SVparam.img.appendChild(x);
	x = document.createElementNS(SVparam.svgns,'text');
	x.setAttribute('id','yaxisTitle');
	x.setAttribute("x", SVparam.YaxisTitlePos); 
	x.setAttribute("y", 100); 
	x.setAttribute("style", 'writing-mode:tb');
	x.setAttribute("transform", 'rotate(180,10,100)');
	x.textContent="Counts";  
	SVparam.img.appendChild(x);

	// Create the Y axis
	x = document.createElementNS(SVparam.svgns,'line');
	x.setAttribute('id','yaxis');
	x.setAttribute("x1", SVparam.Xoffset); 
	x.setAttribute("y1", (SVparam.Yoffset-SVparam.YaxisPixelLength)); 	
	x.setAttribute("x2", SVparam.Xoffset); 
	x.setAttribute("y2", SVparam.Yoffset); 
	x.setAttribute("stroke", "rgb(0,0,0)");
	x.setAttribute("stroke-width", "2");
	SVparam.img.appendChild(x);
	x = document.createElementNS(SVparam.svgns,'text');
	x.setAttribute('id','xaxisTitle');
	x.setAttribute("x", 600); 
	x.setAttribute("y", SVparam.XaxisTitlePos);
	x.textContent="Channels";  
	SVparam.img.appendChild(x);

	// Create data line for first series
	x = document.createElementNS(SVparam.svgns,'polyline');
	x.setAttribute('id','dataline0');
	SVparam.img.appendChild(x);
	SVparam.NumSpecsDisplayed=0;

	// Create title text for first series
	x=document.createElementNS(SVparam.svgns,'text');
	x.setAttribute('id','title0');
	x.setAttribute('x','790');
	x.setAttribute('y','15');
	x.setAttribute('text-anchor', "end"); 
	SVparam.img.appendChild(x);

	for(i=0; i<6; i++){
		x = document.createElementNS(SVparam.svgns,'text');
		x.setAttribute('id', "Xlabel"+i);
		x.setAttribute('style','cursor:pointer');
		SVparam.img.appendChild(x);
		x = document.createElementNS(SVparam.svgns,'line');
		x.setAttribute('id',"Xtick"+i);
		SVparam.img.appendChild(x);
	}

	// Create the X axis zoom box
	x = document.createElementNS(SVparam.svgns,'rect');
	x.setAttribute('id','xaxisbox');
	x.setAttribute('x','0');
	x.setAttribute('y','300');
	x.setAttribute('width','720');
	x.setAttribute('height','50');
	x.setAttribute('style','opacity:0.0; cursor:pointer');
	x.textContent="<title>This is my title</title>";
	SVparam.img.appendChild(x);
	document.getElementById('xaxisbox').onmousedown = function(event){SVparam.XMouseLimitxMin=event.clientX;};
	document.getElementById('xaxisbox').onmouseup = function(event){SVparam.XMouseLimitxMax=event.clientX; SetLimitsByMouse();};

	drawXaxis();

	iframe = document.getElementById('menu_iframe');
	iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
	iframeDoc.open();
	iframeDoc.write('<body bgcolor=#E0FFE0><TABLE id="main_table" width=100% bgcolor=#E0FFE0></TABLE></body>');
	iframeDoc.close();

	table = iframeDoc.getElementById("main_table");
	row = table.insertRow(0);
	row.innerHTML ="Welcome! To begin click 'Load 1D Spectrum List' below.";

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
	var a, i;
	// Zero the data array in the ODB
	// ODBSet("/Analyzer/Parameters/Gate0/reset",1);

	if(SVparam.Fitted==1){
		document.getElementById('fitbox').innerHTML = '';
		SVparam.img.removeChild(SVparam.img.getElementById("PeakFitLine"));
		SVparam.Fitted=0;
	}

	// Zero the data array
	for(i=0; i<512; i++) SVparam.data[i]=0;

	// In Points display, reset the data points
	if(SVparam.DataType==1){
		for(i=0; i<512; i++){
			if(i>SVparam.XaxisLength) break;
			a = SVparam.img.getElementById("datapoint"+i);
			a.setAttribute("cx", (SVparam.Xoffset+i));
			a.setAttribute("cy", "");
			a.setAttribute("r", "");
			a.setAttribute("fill", "");
		}
	}

	// Redraw with the zeroed data values 
	plot_data(0);
}  
///////////////////////////////
// End of resetData function //
///////////////////////////////

/////////////////////////////////////////////////////////////////////
// drawXaxis function                                              //
// Function to draw the X axis line, ticks and labels              //
// Only linear is possible at the moment                           //
/////////////////////////////////////////////////////////////////////
function drawXaxis(){
	var a, i;

	// Calculate the compression factor for the labels and ticks
	SVparam.XaxisLength=SVparam.XaxisLimitMax-SVparam.XaxisLimitMin;
	SVparam.XaxisLabelFactor=Math.round(SVparam.XaxisLength/5);

	// Set the X compression factor appropriate for diplaying/calculating the data points
	SVparam.XaxisCompression=1.0/((SVparam.XaxisLength)/SVparam.XaxisPixelLength);

	// Draw x axis labels and ticks
	for(i=0; i<6; i++){
		if(((((i*SVparam.XaxisLabelFactor)*SVparam.XaxisCompression)+SVparam.Xoffset)<SVparam.Xoffset) || ((((i*SVparam.XaxisLabelFactor)*SVparam.XaxisCompression)+SVparam.Xoffset)>(SVparam.XaxisPixelLength+SVparam.Xoffset))){
			a = SVparam.img.getElementById("Xtick"+i);
			a.setAttribute("x1", '0'); 
			a.setAttribute("y1", '0'); 
			a.setAttribute("x2", '0'); 
			a.setAttribute("y2", '0');
			a = SVparam.img.getElementById("Xlabel"+i); // only 0 to 5
			a.setAttribute("x", ""); 
			a.setAttribute("y", ""); 
			a.textContent=""; 
			continue;
		}
		a = SVparam.img.getElementById("Xtick"+i);
		a.setAttribute("x1", (((i*SVparam.XaxisLabelFactor)*SVparam.XaxisCompression)+SVparam.Xoffset));
		a.setAttribute("y1", SVparam.Yoffset); 
		a.setAttribute("x2", (((i*SVparam.XaxisLabelFactor)*SVparam.XaxisCompression)+SVparam.Xoffset));
		a.setAttribute("y2", SVparam.Yoffset-5); 
		a.setAttribute("stroke", "rgb(0,0,0)");
		a.setAttribute("stroke-width", "2");
		a = SVparam.img.getElementById("Xlabel"+i); // only 0 to 5
		a.setAttribute("x", (((i*SVparam.XaxisLabelFactor)*SVparam.XaxisCompression)+SVparam.Xoffset));
		a.setAttribute("y", SVparam.XaxisLabelPos);
		a.setAttribute('text-anchor', "middle"); 
		a.textContent=Math.floor((i*SVparam.XaxisLabelFactor)+(SVparam.XaxisLimitMin*1.0)); 
	}
}
///////////////////////////////
// End of drawXaxis function //
///////////////////////////////

/////////////////////////////////////////////////////////////////////
// drawYaxisLinear function                                        //
// Function to draw the Y axis line, ticks and labels              //
// Draws the Y axis in Linear style                                //
/////////////////////////////////////////////////////////////////////
function drawYaxisLinear(){
	var a, b, i, j, label,
		lastNum=SVparam.NumYAxisLabels; // Remember the number of labels and ticks which already exist

	// Calculate the compression factor for the labels and ticks
	SVparam.YaxisLength=SVparam.YaxisLimitMax-SVparam.YaxisLimitMin;
	SVparam.YaxisLabelFactor=Math.round(SVparam.YaxisLength/4.1);
	if(SVparam.YaxisLabelFactor==0) SVparam.YaxisLabelFactor=1.0;
	SVparam.YaxisCompression=(SVparam.YaxisLabelFactor/SVparam.YaxisLength)*SVparam.YaxisPixelLength;

	//word="comp="+(SVparam.YaxisCompression)+", length="+SVparam.YaxisLength+", factor="+SVparam.YaxisLabelFactor+", max="+SVparam.YaxisLimitMax+", min="+SVparam.YaxisLimitMin+"<BR> LOGmax="+(Math.log10(SVparam.YaxisLimitMax))+", LOGmin="+(Math.log10(SVparam.YaxisLimitMin));


	// Create the power labels if they do not exist
	if(SVparam.PowerLabels==0 && SVparam.YaxisLimitMax>=10000){
		for(j=0; j<lastNum; j++){
			b = document.createElementNS(SVparam.svgns,'text');
			b.setAttribute("id", "Ylabelpower"+j);
			SVparam.img.appendChild(b);
		}
		// Activate the flag
		SVparam.PowerLabels=1;
	}
	// Remove the power labels if they exist
	if(SVparam.PowerLabels==1 && SVparam.YaxisLimitMax<10000){ 
		for(j=0; j<lastNum; j++){
			SVparam.img.removeChild(SVparam.img.getElementById("Ylabelpower"+j));
		}
		// Deactivate the flag
		SVparam.PowerLabels=0;
	}

	// Draw Y axis labels and ticks
	i=0;
	while((i*SVparam.YaxisLabelFactor)<=SVparam.YaxisLimitMax) {
		// If the tick and label elements do not exist, create them
		if(i>=SVparam.NumYAxisLabels){
			// Create next label 
			a = document.createElementNS(SVparam.svgns,'line');
			a.setAttribute("id", "Ytick"+i);
			SVparam.img.appendChild(a);
			a = document.createElementNS(SVparam.svgns,'text');
			a.setAttribute("id", "Ylabel"+i);
			SVparam.img.appendChild(a);

			if(SVparam.PowerLabels==1){
				a = document.createElementNS(SVparam.svgns,'text');
				a.setAttribute("id", "Ylabelpower"+i);
				SVparam.img.appendChild(a);
			}
			SVparam.NumYAxisLabels++;
		}

		// Set the details of the Y tick
		a=SVparam.img.getElementById("Ytick"+i);
		a.setAttribute("x1", SVparam.Xoffset); 
		a.setAttribute("y1", SVparam.Yoffset-Math.floor(i*SVparam.YaxisCompression)); 
		a.setAttribute("x2", SVparam.Xoffset+5); 
		a.setAttribute("y2", SVparam.Yoffset-Math.floor(i*SVparam.YaxisCompression)); 
		a.setAttribute("stroke", "rgb(0,1,0)");
		a.setAttribute("stroke-width", "2");

		// Set the details of the Y label
		a=SVparam.img.getElementById("Ylabel"+i);
		a.setAttribute("x", SVparam.YaxisLabelPos-SVparam.YaxisLabelxOffset); 
		a.setAttribute("y", SVparam.Yoffset-Math.round(i*SVparam.YaxisCompression)+5); 
		a.setAttribute('text-anchor', "end");
		if(SVparam.YaxisLimitMax<10000){
			label=(i*SVparam.YaxisLabelFactor);
		} else {
			// Set the main text label
			if((i*SVparam.YaxisLabelFactor)==0) label="0";
			else label=(parseFloat((i*SVparam.YaxisLabelFactor)/(Math.pow(10,Math.floor(Math.log10(i*SVparam.YaxisLabelFactor))))).toFixed(1))+"x10";
			//word=word+"<BR>i="+i+", "+(i*SVparam.YaxisLabelFactor);
			// Connect to label for the power
			b=SVparam.img.getElementById("Ylabelpower"+i);
			a.setAttribute("x", SVparam.YaxisLabelPos-SVparam.YaxisLabelxOffset-2); 
			b.setAttribute("x", SVparam.YaxisLabelPos-SVparam.YaxisLabelxOffset-2); 
			b.setAttribute("y", SVparam.Yoffset-Math.round(i*SVparam.YaxisCompression)); 
			b.setAttribute('text-anchor', "start");
			if((i*SVparam.YaxisLabelFactor)>0) b.textContent=(Math.floor(Math.log10(i*SVparam.YaxisLabelFactor))); 
			SVparam.img.appendChild(b);
		}
		a.textContent=label; 
		i++;
	}

	//document.getElementById("textbox").innerHTML=word;

	// Save the number of required labels
	SVparam.NumYAxisLabels=i;

	// Remove extra labels
	while(i<lastNum){
		SVparam.img.removeChild(SVparam.img.getElementById("Ytick"+i));
		SVparam.img.removeChild(SVparam.img.getElementById("Ylabel"+i));
		if(SVparam.PowerLabels==1) SVparam.img.removeChild(SVparam.img.getElementById("Ylabelpower"+i));
		i++;
	}

	// Set the Y compression factor appropriate for diplaying/calculating the data points
	SVparam.YaxisCompression=1.0/((SVparam.YaxisLength)/SVparam.YaxisPixelLength);

}
/////////////////////////////////////
// End of drawYaxisLinear function //
/////////////////////////////////////

/////////////////////////////////////////////////////////////////////
// drawYaxisLog function                                           //
// Function to draw the Y axis line, ticks and labels              //
// Draws the axis in Logarithmic style                             //
/////////////////////////////////////////////////////////////////////
function drawYaxisLog(){
	
	var a, b, i, j, label, value,
		lastNum=SVparam.NumYAxisLabels; // Remember the number of labels and ticks which already exist

	// Calculate the compression factor for the labels and ticks
	SVparam.YaxisLength=Math.log10(SVparam.YaxisLimitMax-SVparam.YaxisLimitMin);
	SVparam.YaxisLabelFactor=Math.round(SVparam.YaxisLength/4.0);
	if(SVparam.YaxisLabelFactor==0) SVparam.YaxisLabelFactor=1.0;
	SVparam.YaxisCompression=1.0/((SVparam.YaxisLength)/SVparam.YaxisPixelLength);

	// Create the power labels if they do not exist
	if(SVparam.PowerLabels==0 && SVparam.YaxisLimitMax>=10000){
		for(j=0; j<lastNum; j++){
			b = document.createElementNS(SVparam.svgns,'text');
			b.setAttribute("id", "Ylabelpower"+j);
			SVparam.img.appendChild(b);
		}
		// Activate the flag
		SVparam.PowerLabels=1;
	}
	// Remove the power labels if they exist
	if(SVparam.PowerLabels==1 && SVparam.YaxisLimitMax<10000){ 
		for(j=0; j<lastNum; j++){
			SVparam.img.removeChild(SVparam.img.getElementById("Ylabelpower"+j));
		}
		// Deactivate the flag
		SVparam.PowerLabels=0;
	}

	//word="comp="+(SVparam.YaxisCompression)+", length="+SVparam.YaxisLength+", factor="+SVparam.YaxisLabelFactor+", max="+SVparam.YaxisLimitMax+", min="+SVparam.YaxisLimitMin+"<BR> LOGmax="+(Math.log10(SVparam.YaxisLimitMax))+", LOGmin="+(Math.log10(SVparam.YaxisLimitMin));

	// Draw Y axis labels and ticks
	value=Math.log10(SVparam.YaxisLimitMin);
	i=0;
	while((value-Math.log10(SVparam.YaxisLimitMin))<=Math.log10(SVparam.YaxisLimitMax)) {
		// If the tick and label elements do not exist, create them
		if(i>=SVparam.NumYAxisLabels){
			// Create next label 
			a = document.createElementNS(SVparam.svgns,'line');
			a.setAttribute("id", "Ytick"+i);
			SVparam.img.appendChild(a);
			a = document.createElementNS(SVparam.svgns,'text');
			a.setAttribute("id", "Ylabel"+i);
			SVparam.img.appendChild(a);
			if(SVparam.PowerLabels==1){
				a = document.createElementNS(SVparam.svgns,'text');
				a.setAttribute("id", "Ylabelpower"+i);
				SVparam.img.appendChild(a);
			}
			SVparam.NumYAxisLabels++;
		}

		// Set the details of the Y tick
		a=SVparam.img.getElementById("Ytick"+i);
		a.setAttribute("x1", SVparam.Xoffset); 
		a.setAttribute("y1", SVparam.Yoffset-Math.floor((value-Math.log10(SVparam.YaxisLimitMin))*SVparam.YaxisCompression)); 
		a.setAttribute("x2", SVparam.Xoffset+5); 
		a.setAttribute("y2", SVparam.Yoffset-Math.floor((value-Math.log10(SVparam.YaxisLimitMin))*SVparam.YaxisCompression)); 
		a.setAttribute("stroke", "rgb(0,1,0)");
		a.setAttribute("stroke-width", "2");

		// Set the details of the Y label
		a=SVparam.img.getElementById("Ylabel"+i);
		a.setAttribute("x", SVparam.YaxisLabelPos-SVparam.YaxisLabelxOffset); 
		a.setAttribute("y", SVparam.Yoffset-Math.round((value-Math.log10(SVparam.YaxisLimitMin))*SVparam.YaxisCompression)+5);
		a.setAttribute('text-anchor', "end"); 
		if(value<0) b=1;
		else b=0;
		if(SVparam.YaxisLimitMax<10000) label=(parseFloat(Math.round((Math.pow(10,value)) * 100) / 100).toFixed(b));
		else{
			// Set the main text label
			label="10";
			//   word=word+"<BR>"+(parseFloat(Math.round((Math.pow(10,value)) * 100) / 100).toFixed(b))+", "+value;

			// Connect to label for the power
			b=SVparam.img.getElementById("Ylabelpower"+i);
			a.setAttribute("x", SVparam.YaxisLabelPos-SVparam.YaxisLabelxOffset-2); 
			b.setAttribute("x", SVparam.YaxisLabelPos-SVparam.YaxisLabelxOffset-2); 
			b.setAttribute("y", SVparam.Yoffset-Math.round((value-Math.log10(SVparam.YaxisLimitMin))*SVparam.YaxisCompression)); 
			b.setAttribute('text-anchor', "start");
			b.textContent=Math.floor(value);
			SVparam.img.appendChild(b);
		}
		a.textContent=label; 
		i++;
		value=value+SVparam.YaxisLabelFactor;
		if((value-Math.log10(SVparam.YaxisLimitMin))>=Math.log10(SVparam.YaxisLimitMax)) break;
	}

	// Save the number of required labels
	SVparam.NumYAxisLabels=i;

	// Remove extra labels
	while(i<lastNum){
		SVparam.img.removeChild(SVparam.img.getElementById("Ytick"+i));
		SVparam.img.removeChild(SVparam.img.getElementById("Ylabel"+i));
		if(SVparam.PowerLabels==1) SVparam.img.removeChild(SVparam.img.getElementById("Ylabelpower"+i));
		i++;
	}
	//document.getElementById("textbox").innerHTML=word;
}
//////////////////////////////////
// End of drawYaxisLog function //
//////////////////////////////////

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
function plot_data(RefreshNow){
	var a, c, i, j, data, thisSpec, y,
	total = 0,
	thisData = [];

	SVparam.maxYvalue=SVparam.YaxisLimitMax;
	// Loop through to get the data and set the Y axis limits
	for(thisSpec=0; thisSpec<SVparam.DisplayedSpecs.length; thisSpec++){
		// Here call function to get data from the server
		// thisData[thisSpec]=ODBGet("/Test/spectrum_data[*]","%d");
		thisData[thisSpec]=getSpecData(SVparam.DisplayedSpecs[thisSpec]);

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
		total = 0;
		for(j=0; j<data.length; j++ ){
			total += data[j];
		}
		SVparam.img.getElementById('title'+thisSpec).textContent="Entries: "+total;

	}// End of for loop

	// Adjust the Y axis limit and compression and redraw the axis
	if(SVparam.maxYvalue>5){
		if(SVparam.AxisType==0) SVparam.YaxisLimitMax=Math.floor(SVparam.maxYvalue*1.2);
		if(SVparam.AxisType==1) SVparam.YaxisLimitMax=SVparam.maxYvalue*100;
	} else {
		if(SVparam.AxisType==0) SVparam.YaxisLimitMax=5;
		if(SVparam.AxisType==1) SVparam.YaxisLimitMax=50;
	}

	if(SVparam.AxisType==0)
		drawYaxisLinear();

	if(SVparam.AxisType==1)
		drawYaxisLog();

	drawFrame();

	// Now the limits are set loop through and plot the data points
	for(thisSpec=0; thisSpec<SVparam.DisplayedSpecs.length; thisSpec++){
		SVparam.data=thisData[thisSpec].slice();

		// Reset the coordinates string for the polyline
		SVparam.DataLinePoints="";

		// Reset the data points
		if(SVparam.DataType==1){
			for(i=0; i<1028; i++){
				a = SVparam.img.getElementById("datapoint"+i);
				a.setAttribute("r", "0");
			}
		}

		// Loop through the data spectrum that we have
		for(i=Math.floor(SVparam.XaxisLimitMin); i<Math.floor(SVparam.XaxisLimitMax); i++){

			// Protection at the end of the spectrum (minimum and maximum X)
			if(i<SVparam.XaxisLimitMin || i>SVparam.XaxisLimitMax) continue;

			// Protection in Overlay mode for spectra which are short (in x) than the longest spectrum overlayed.
			if(i>=SVparam.data.length) continue;

			// If using Stairs data display
			// Record the coordinates of this data point along the polyline
			// The coordinates are set following this for loop
			if(SVparam.DataType==0){
				if(SVparam.AxisType==0){
					// Protect against overflow at the top of the y axis
					if(SVparam.data[i]<SVparam.YaxisLimitMax) y=(SVparam.Yoffset-(SVparam.data[i]*SVparam.YaxisCompression));
					else y=(SVparam.Yoffset-(SVparam.YaxisLimitMax*SVparam.YaxisCompression));
				}

				if(SVparam.AxisType==1){
					// Protect against overflow at bottom of y axis
					if(SVparam.data[i]<=0) y=(SVparam.Yoffset);
					else if((Math.log10(SVparam.data[i])-Math.log10(SVparam.YaxisLimitMin))<Math.log10(SVparam.YaxisLimitMax)) y=(SVparam.Yoffset-((Math.log10(SVparam.data[i])-Math.log10(SVparam.YaxisLimitMin))*SVparam.YaxisCompression));
					// and protect against overflow at the top of the y axis
					else y=(SVparam.Yoffset-((Math.log10(SVparam.YaxisLimitMax)-Math.log10(SVparam.YaxisLimitMin))*SVparam.YaxisCompression));
				}

				SVparam.DataLinePoints=SVparam.DataLinePoints+(SVparam.Xoffset+(i*SVparam.XaxisCompression)-(SVparam.XaxisLimitMin*SVparam.XaxisCompression))+","+y+" ";
				SVparam.DataLinePoints=SVparam.DataLinePoints+(SVparam.Xoffset+((i+1)*SVparam.XaxisCompression)-(SVparam.XaxisLimitMin*SVparam.XaxisCompression))+","+y+" ";
			}

			// If using Points data display
			// Set the coordinates of this data point
			if(SVparam.DataType==1){
				if(SVparam.AxisType==0){
					if(SVparam.data[i]>0 && SVparam.data[i]<SVparam.YaxisLimitMax){
						a = SVparam.img.getElementById("datapoint"+i);
						a.setAttribute("cx", (SVparam.Xoffset+(i*SVparam.XaxisCompression)-(SVparam.XaxisLimitMin*SVparam.XaxisCompression)));
						a.setAttribute("cy", (SVparam.Yoffset-(SVparam.data[i]*SVparam.YaxisCompression)));
						a.setAttribute("r", "1");
						a.setAttribute("fill", SVparam.dataColor[SVparam.dataColorx]);
					}
				}
				if(SVparam.AxisType==1){
					if(SVparam.data[i]>0 && ((Math.log10(SVparam.data[i])-Math.log10(SVparam.YaxisLimitMin))<Math.log10(SVparam.YaxisLimitMax))){
						a = SVparam.img.getElementById("datapoint"+i);
						a.setAttribute("cx", (SVparam.Xoffset+(i*SVparam.XaxisCompression)-(SVparam.XaxisLimitMin*SVparam.XaxisCompression)));
						a.setAttribute("cy", (SVparam.Yoffset-((Math.log10(SVparam.data[i])-Math.log10(SVparam.YaxisLimitMin))*SVparam.YaxisCompression)));
						a.setAttribute("r", "1");
						a.setAttribute("fill", SVparam.dataColor[SVparam.dataColorx]);
					}
				}
			}
		}

		// If using Stairs data display
		if(SVparam.DataType==0){
			// Set the first and last data point on the line to zero at the end
			SVparam.DataLinePoints=(SVparam.Xoffset)+","+SVparam.Yoffset+" "+SVparam.DataLinePoints;
			SVparam.DataLinePoints=SVparam.DataLinePoints+(SVparam.Xoffset+((i)*SVparam.XaxisCompression)-(SVparam.XaxisLimitMin*SVparam.XaxisCompression))+","+SVparam.Yoffset+" ";

			// Set the data coordinates of the svg polyline element to display the spectrum
			a = SVparam.img.getElementById("dataline"+thisSpec);
			a.setAttribute("points", SVparam.DataLinePoints);
			c=SVparam.dataColor[thisSpec];
			a.setAttribute("style", "fill:none;stroke:"+c+";stroke-width:1");
		}

		// If using Points data display
		// Change the color of the data for debugging the refresh functions
		if(SVparam.DataType==1){
			if(SVparam.dataColorx==0) SVparam.dataColorx=1;
			else SVparam.dataColorx=0;
		}

	} // End of for loop

	// Pause for some time and then recall this function to refresh the data display
	if(SVparam.RefreshTime>0 && RefreshNow==1) setTimeout(function(){plot_data(1)},SVparam.RefreshTime*1000); 
}
///////////////////////////////
// End of plot_data function //
///////////////////////////////

//reproduce the results of plot_data in a canvas, no svg allowed:
function paintCanvas(RefreshNow){
	return 0;
}

//draw the plot frame
function drawFrame(){

	//draw principle axes:
	SVparam.context.strokeStyle = '#000000';
	SVparam.context.beginPath();
	SVparam.context.moveTo(SVparam.leftMargin, SVparam.topMargin);
	SVparam.context.lineTo(SVparam.leftMargin, SVparam.canvas.height-SVparam.bottomMargin);
	SVparam.context.lineTo(SVparam.canvas.width - SVparam.rightMargin, SVparam.canvas.height - SVparam.bottomMargin);
	SVparam.context.stroke();
}

function FitTimeData(){
	var a, b, i, x, y, r, xyr,
		sumx = 0,
		sumy = 0,
		sumx2 = 0,
		sumy2 = 0,
		sumxy = 0,
		sumr = 0;

	SVparam.FitLimitLower=0;
	SVparam.FitLimitUpper=10;

	xyr=SVfakeData.timedata.slice(SVparam.FitLimitLower,SVparam.FitLimitUpper);

	for(i=0;i<xyr.length;i++){   
		// this is our data pair
		//  x = xyr[i][0]; y = xyr[i][1];
		x=i;
		y=xyr[i];

		// this is the weight for that pair
		// set to 1 (and simplify code accordingly, ie, sumr becomes xy.length) if weighting is not needed
		// r = xyr[i][2];
		r=1;

		// consider checking for NaN in the x, y and r variables here 
		// (add a continue statement in that case)

		sumr += r;
		sumx += r*x;
		sumx2 += r*(x*x);
		sumy += r*y;
		sumy2 += r*(y*y);
		sumxy += r*(x*y);
	}

	// note: the denominator is the variance of the random variable X
	// the only case when it is 0 is the degenerate case X==constant
	b = (sumy*sumx2 - sumx*sumxy)/(sumr*sumx2-sumx*sumx);
	a = (sumr*sumxy - sumx*sumy)/(sumr*sumx2-sumx*sumx);

	alert(a+", "+b);
}

function FitPeakData(){
	//SVparam.FitLimitLower=1;
	//SVparam.FitLimitUpper=6;
	SVparam.FitLimitLower=5;
	SVparam.FitLimitUpper=25;

	var a, b, i, r, x, y, Points,
		sumx = 0,
		sumy = 0,
		sumx2 = 0,
		sumy2 = 0,
		sumxy = 0,
		sumr = 0,
		testdata=[0,50,100,200,100,50],
		xyr=SVfakeData.energydata0.slice(SVparam.FitLimitLower,SVparam.FitLimitUpper);

	for(i=0;i<xyr.length;i++){   
		// this is our data pair
		//  x = xyr[i][0]; y = xyr[i][1];
		x=i;
		y=xyr[i];

		// this is the weight for that pair
		// set to 1 (and simplify code accordingly, ie, sumr becomes xy.length) if weighting is not needed
		// r = xyr[i][2];
		r=0.1;

		// consider checking for NaN in the x, y and r variables here 
		// (add a continue statement in that case)

		sumr += r;
		sumx += r*x;
		sumx2 += r*(x*x);
		sumy += r*y;
		sumy2 += r*(y*y);
		sumxy += r*(x*y);
	}

	// note: the denominator is the variance of the random variable X
	// the only case when it is 0 is the degenerate case X==constant 
	a = (sumy*sumx2 - sumxy*sumx)/(sumr*sumx2-sumx*sumx);
	b = (sumr*sumxy - sumx*sumy)/(sumr*sumx2-sumx*sumx);

	a=Math.pow(2.718,a);
	// b=Math.sqrt(-1/(2*b));

	// alert(a+", "+b);

	Points="";
	for(i=0;i<xyr.length;i++){
		x=i+SVparam.FitLimitLower;
		y = a*Math.exp(-1*(((x-17)*(x-17))/(2*b*b)));
		y = 500*Math.exp(-1*(((x-17)*(x-17))/(2*2.2*2.2)));

		if(y<SVparam.YaxisLimitMax) y=(SVparam.Yoffset-(y*SVparam.YaxisCompression));
		else y=(SVparam.Yoffset-(SVparam.YaxisLimitMax*SVparam.YaxisCompression));
		x=(SVparam.Xoffset+(x*SVparam.XaxisCompression)-(SVparam.XaxisLimitMin*SVparam.XaxisCompression));
		Points += " "+Math.round(x,1)+","+Math.round(y,1);
	}

	//document.getElementById('fitbox').innerHTML = 'Height = ' + a + ' Width = ' + b + '<BR>'+Points;
	document.getElementById('fitbox').innerHTML = ''+'Height = ' + a + ' Width = ' + b + '<br>'+Points;

	// Create the dataline element needed
	x = document.createElementNS(SVparam.svgns,'polyline');
	x.setAttribute('id','PeakFitLine');
	SVparam.img.appendChild(x);
	SVparam.img.getElementById("PeakFitLine").setAttribute("points",Points);
	SVparam.img.getElementById("PeakFitLine").setAttribute("style","fill:none;stroke:red");

}

function RequestFitLimits(){
	var x;

	// Remove a previous fit
	if(SVparam.Fitted==1){
		document.getElementById('fitbox').innerHTML = '';
		SVparam.img.removeChild(SVparam.img.getElementById("PeakFitLine"));
		SVparam.Fitted=0;
	}

	//SVparam.FitLimitLower=SVparam.XaxisLimitMin;
	//SVparam.FitLimitUpper=SVparam.XaxisLimitMax;
	SVparam.FitLimitLower=-1;
	SVparam.FitLimitUpper=-1;

	// Create the X axis zoom box
	x = document.createElementNS(SVparam.svgns,'rect');
	x.setAttribute('id','LimitsBox');
	x.setAttribute('x','0');
	x.setAttribute('y','10');
	x.setAttribute('width','720');
	x.setAttribute('height','300');
	x.setAttribute('style','opacity:0.0;cursor:s-resize');
	SVparam.img.appendChild(x);
	document.getElementById('LimitsBox').onmouseup = function(){
			SVparam.FitLimitLower=window.event.clientX; 
			document.getElementById("LimitsBox").onmouseup = function(){ 
				SVparam.FitLimitUpper=window.event.clientX;
				FitData();
			}
		}

	document.getElementById('fitbox').innerHTML = 'Select fit region with Mouse clicks';
}

function FitData(){
	var cent, fitdata, i, loc, max, Points, width, x, y;

	SVparam.img.removeChild(SVparam.img.getElementById("LimitsBox"));

	SVparam.point.x = SVparam.FitLimitLower;
	// Translate to the right coordinates
	loc = SVparam.point.matrixTransform(SVparam.img.getScreenCTM().inverse());
	SVparam.FitLimitLower=loc.x;
	SVparam.point.x = SVparam.FitLimitUpper;
	// Translate to the right coordinates
	loc = SVparam.point.matrixTransform(SVparam.img.getScreenCTM().inverse());
	SVparam.FitLimitUpper=loc.x;

	SVparam.FitLimitLower=Math.floor(((SVparam.FitLimitLower-SVparam.Xoffset)/SVparam.XaxisCompression))+SVparam.XaxisLimitMin;
	SVparam.FitLimitUpper=Math.floor(((SVparam.FitLimitUpper-SVparam.Xoffset)/SVparam.XaxisCompression))+SVparam.XaxisLimitMin;

	if(SVparam.FitLimitUpper<SVparam.FitLimitLower){
		x=SVparam.FitLimitUpper;
		SVparam.FitLimitUpper=SVparam.FitLimitLower;
		SVparam.FitLimitLower=x;
	}

	if(SVparam.FitLimitLower<0) SVparam.FitLimitLower=0;
	if(SVparam.FitLimitUpper>SVparam.XaxisLimitAbsMax) SVparam.FitLimitUpper=SVparam.XaxisLimitAbsMax;

	max=1;

	//data=ODBGet("/Analyzer/Parameters/Statistics/SpectrumData[*]","%d");
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
	Points="";
	for(i=0;i<fitdata.length;i+=0.2){
		x=i+SVparam.FitLimitLower;
		y = max*Math.exp(-1*(((x-cent)*(x-cent))/(2*width*width)));

		if(SVparam.AxisType==0){
			if(y<SVparam.YaxisLimitMax) y=(SVparam.Yoffset-(y*SVparam.YaxisCompression));
			else y=(SVparam.Yoffset-(SVparam.YaxisLimitMax*SVparam.YaxisCompression));
		}

		if(SVparam.AxisType==1){
			// Protect against overflow at bottom of y axis
			if(y<=0) y=(SVparam.Yoffset);
			else if((Math.log10(y)-Math.log10(SVparam.YaxisLimitMin))<Math.log10(SVparam.YaxisLimitMax)) y=(SVparam.Yoffset-((Math.log10(y)-Math.log10(SVparam.YaxisLimitMin))*SVparam.YaxisCompression));
			// and protect against overflow at the top of the y axis
			else y=(SVparam.Yoffset-((Math.log10(SVparam.YaxisLimitMax)-Math.log10(SVparam.YaxisLimitMin))*SVparam.YaxisCompression));

			// protect at bottom of log axis
			if(y>SVparam.Yoffset) y=SVparam.Yoffset;
		}

		x=(SVparam.Xoffset+(x*SVparam.XaxisCompression)-(SVparam.XaxisLimitMin*SVparam.XaxisCompression));
		Points=Points+" "+Math.round(x,1)+","+Math.round(y,1);
	}

	SVparam.word = 'Height = ' + max + ' Width = ' + width.toFixed(3) + ' Centroid = ' + cent;
	document.getElementById('fitbox').innerHTML = SVparam.word;
	SVparam.word = 'H=' + max + ',W=' + width.toFixed(3) + ',C=' + cent + "; ";
	document.getElementById('spec_fits0').innerHTML = SVparam.word+document.getElementById('spec_fits0').innerHTML;

	// Create the dataline element needed
	x = document.createElementNS(SVparam.svgns,'polyline');
	x.setAttribute('id','PeakFitLine');
	SVparam.img.appendChild(x);
	SVparam.img.getElementById("PeakFitLine").setAttribute("points",Points);
	SVparam.img.getElementById("PeakFitLine").setAttribute("style","fill:none;stroke:red;stroke-width:3");

	SVparam.Fitted=1;
}

function Menu_unSelectAll(){
	var i, iframe, iframeDoc, j;

	document.getElementById("displayMistake").innerHTML="";
	iframe = document.getElementById('menu_iframe');
	iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
	//Nrows=iframeDoc.getElementById("main_table").getElementsByTagName("TR").length;

	// Reset the properties of the rows which were selected
	j=0;
	if(SVparam.Specs.length>0){
		while(j<SVparam.Specs.length){
			i=SVparam.Specs[j];
			iframeDoc.getElementById("row"+i).setAttribute('bgcolor', "white");
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
	var i, iframe, iframeDoc, Num, row, table,
		RemoveTable = 0;
	// Remove the prompt window
	//document.getElementById('holder').removeChild(hostnamebox);
	//document.getElementById('holder').removeChild(hostnameblankbox);

	// Check if a list is already loaded by the hostname being defined
	// if yes then set a flag for the old list to be removed later in this function
	if(SVparam.hostname.length>0) RemoveTable=1; 

	// If Cancel was pressed exit this function here 
	//if(newhost==null){return;}
	//if(newhost.length==0){return;}
	//else{hostname=newhost;}

	// Set the hostname at the top of the page
	document.getElementById('host_text').innerHTML=" - Hostname: "+SVparam.hostname;

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
	/*
	// Here call the function to Get the spectrum list from the server
	SVparam.spectrum_names = getList();
	for(i=0; i<SVparam.spectrum_names.length; i++){
	row = table.insertRow(i);
	row.setAttribute('id', "row"+i);
	row.setAttribute('bgcolor', "white");
	row.setAttribute('style', "display:block;cursor:default");
	// row.setAttribute('onclick', "parent.Menu_selectSpectrum("+i+")");
	row.setAttribute('onclick', "parent.Menu_MakeselectSpectrum(event,"+i+")");
	row.setAttribute('ondblclick', "parent.displaySpectrum("+i+")");
	row.innerHTML = SVparam.spectrum_names[i];
	}
	*/
	// Put in fake list info - COMMENT OUT ONCE ABOVE FUNCTION IS WORKING
		for(i=0; i<50; i++){
			row = table.insertRow(i);
			row.setAttribute('id', "row"+i);
			row.setAttribute('bgcolor', "white");
			row.setAttribute('style', "display:block;cursor:default");
			iframeDoc.getElementById('row'+i).onclick = function(event){ parent.Menu_MakeselectSpectrum(event, parseInt(this.id.slice(3,this.id.length+1))  )};
			iframeDoc.getElementById('row'+i).ondblclick = function(){parent.displaySpectrum( parseInt(this.id.slice(3,this.id.length+1)) )};
			row.innerHTML ="Spectrum Name "+i;
			SVparam.spectrum_names[i]="Spectrum Name "+i;

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
	if(SVparam.Fitted==1){
		document.getElementById('fitbox').innerHTML = '';
		SVparam.img.removeChild(SVparam.img.getElementById("PeakFitLine"));
		SVparam.Fitted=0;
	}
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

	if(SVparam.Specs.length<SVparam.NumSpecsDisplayed){
		for(j=1; j<SVparam.NumSpecsDisplayed; j++){
			// Remove the dataline elements that are not needed
			SVparam.img.removeChild(SVparam.img.getElementById('dataline'+j));
			SVparam.img.removeChild(SVparam.img.getElementById('title'+j));
		}
	}

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
	if(SVparam.Fitted==1){
		document.getElementById('fitbox').innerHTML = '';
		SVparam.img.removeChild(SVparam.img.getElementById("PeakFitLine"));
		SVparam.Fitted=0;
	}	
	if((SVparam.Specs.length+SVparam.NumSpecsDisplayed)>10){
		document.getElementById("displayMistake").innerHTML="Maximum of 10 spectra can be overlayed";
		return;
	}

	if((SVparam.Specs.length+SVparam.NumSpecsDisplayed)>SVparam.NumSpecsDisplayed){
		for(j=SVparam.NumSpecsDisplayed; j<(SVparam.Specs.length+SVparam.NumSpecsDisplayed); j++){
			// Create the dataline element needed
			x = document.createElementNS(SVparam.svgns,'polyline');
			x.setAttribute('id','dataline'+j);
			SVparam.img.appendChild(x);
			// Create title text for first series
			x=document.createElementNS(SVparam.svgns,'text');
			x.setAttribute('id','title'+j);
			x.setAttribute('x','790');
			x.setAttribute('y', (15+(j*20)));
			x.setAttribute('style', 'fill:'+SVparam.dataColor[j]); 
			x.setAttribute('text-anchor', "end"); 
			SVparam.img.appendChild(x);
		}
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
		//alert("Multi: "+SVparam.DisplayedSpecs.length+", "+id);
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
	if(SVparam.Fitted==1){
		document.getElementById('fitbox').innerHTML = '';
		SVparam.img.removeChild(SVparam.img.getElementById("PeakFitLine"));
		SVparam.Fitted=0;
	}

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

	SVparam.word='<td width="25px" align="center" id="box'+colorID+'" style="display:inline-block;width:20px;background-color:'+SVparam.dataColor[colorID]+';color:'+SVparam.dataColor[colorID]+'">:-)</td><td width="150px" align="center"><input type="button" value="Display" onclick="displaySpectrum('+id+')">'+' <input type="button" value="Overlay" onclick="overlaySpectrum('+id+')"></td><td width="225px"> '+SVparam.spectrum_names[id]+' </td><td width="800px" id="spec_fits'+colorID+'"></td>';
	table = document.getElementById("recent_list");
	row = table.insertRow(0);
	row.innerHTML =SVparam.word;

	i = table.getElementsByTagName("tr").length;
	if(i>40) table.deleteRow(i-1);
}

function reset_list_color(){
	var j, x;

	for(j=0; j<SVparam.NumSpecsDisplayed; j++){
		x=document.getElementById("box"+j);
		x.setAttribute('style', "background-color:white;color:white");
		x.setAttribute('id', "");
	}
}

function displaySpectrum(id){
	var j;

	document.getElementById("displayMistake").innerHTML="";
	if(SVparam.Fitted==1){
		document.getElementById('fitbox').innerHTML = '';
		SVparam.img.removeChild(SVparam.img.getElementById("PeakFitLine"));
		SVparam.Fitted=0;
	}
	SVparam.XaxisLimitAbsMax=500;
	SVparam.YaxisLimitMax=5;
	reset_list_color();
	Menu_unSelectAll();
	SVparam.Specs[0]=id;
	List_update(id,0);
	if(SVparam.Specs.length<SVparam.NumSpecsDisplayed){
		for(j=1; j<SVparam.NumSpecsDisplayed; j++){
			// Remove the dataline elements that are not needed
			SVparam.img.removeChild(SVparam.img.getElementById('dataline'+j));
			SVparam.img.removeChild(SVparam.img.getElementById('title'+j));
		}
	}
	SVparam.DisplayedSpecs=SVparam.Specs.slice();
	SVparam.NumSpecsDisplayed=1;
	plot_data(0);
}

function overlaySpectrum(id){
	var j, x;

	document.getElementById("displayMistake").innerHTML="";
	if(SVparam.Fitted==1){
		document.getElementById('fitbox').innerHTML = '';
		SVparam.img.removeChild(SVparam.img.getElementById("PeakFitLine"));
		SVparam.Fitted=0;
	}

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
	SVparam.Specs[SVparam.Specs.length]=id;

	//Check number of displayed spectra
	if((SVparam.Specs.length+SVparam.NumSpecsDisplayed)>10){
		document.getElementById("displayMistake").innerHTML="Maximum of 10 spectra can be overlayed";
		return;
	}

	if((SVparam.Specs.length+SVparam.NumSpecsDisplayed)>SVparam.NumSpecsDisplayed){
		for(j=SVparam.NumSpecsDisplayed; j<(SVparam.Specs.length+SVparam.NumSpecsDisplayed); j++){
			// Create the dataline element needed
			x = document.createElementNS(SVparam.svgns,'polyline');
			x.setAttribute('id','dataline'+j);
			SVparam.img.appendChild(x);
			// Create title text for first series
			x=document.createElementNS(SVparam.svgns,'text');
			x.setAttribute('id','title'+j);
			x.setAttribute('x','790');
			x.setAttribute('y', (15+(j*20)));
			x.setAttribute('style', 'fill:'+SVparam.dataColor[j]); 
			x.setAttribute('text-anchor', "end"); 
			SVparam.img.appendChild(x);
		}
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
	iframeDoc.getElementById("row"+id).setAttribute('bgcolor', "white");
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
	var a, j;

	if(SVparam.Fitted==1){
		document.getElementById('fitbox').innerHTML = '';
		SVparam.img.removeChild(SVparam.img.getElementById("PeakFitLine"));
		SVparam.Fitted=0;
	}
	reset_list_color();
	SVparam.Specs=new Array();
	if(SVparam.Specs.length<SVparam.NumSpecsDisplayed){
		for(j=1; j<SVparam.NumSpecsDisplayed; j++){
			// Remove the dataline elements that are not needed
			SVparam.img.removeChild(SVparam.img.getElementById('dataline'+j));
			SVparam.img.removeChild(SVparam.img.getElementById('title'+j));
		}
	}
	SVparam.img.getElementById('title0').textContent="";
	SVparam.DisplayedSpecs=SVparam.Specs.slice();
	SVparam.NumSpecsDisplayed=0;
	a = SVparam.img.getElementById("dataline0");
	a.setAttribute("points", (SVparam.Xoffset)+","+SVparam.Yoffset+" "+(SVparam.Xoffset)+","+SVparam.Yoffset);
}

function getSpecData(x){
	//return getData(parseInt(x));
	if(x==0) return SVfakeData.energydata0;
	if(x==1) return SVfakeData.energydata1;
	if(x==2) return SVfakeData.energydata2;
	if(x==3) return SVfakeData.energydata3;
	if(x==4) return SVfakeData.energydata4;
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
