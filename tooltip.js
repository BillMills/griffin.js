//function to generate a tool tip over a canvas targetCanvas wrapped in a parentDiv.  The tool 
//tip consists of a div targetDiv with absolute positioning containing <p id="TipText"></p>, wrapped
//in a containerDiv with relative positioning.  TODO: enforce div properties?

//TODO: text boldness glitch on top row?

function Tooltip(targetCanvas, parentDiv, targetDiv, containerDiv, data, rows, cols, cellSide, unit, rowTitles, colTitles){
	var canvas = document.getElementById(targetCanvas);

    //hack to update reported value at waffle refresh if user just leaves the mouse sitting there without moving:
    var oldX = Math.floor( (window.griffinToolTipX - document.getElementById(parentDiv).offsetLeft - document.getElementById(targetCanvas).offsetLeft) / cellSide);
    var oldY = Math.floor( (window.griffinToolTipY - document.getElementById(parentDiv).offsetTop - document.getElementById(targetCanvas).offsetTop) / cellSide);
    if(oldX > -1 && oldX < cols && oldY>-1 && oldY<rows){
        //var toolTipContent = 'Channel '+oldY+', '+oldX+': <br/>'+Math.round(data[oldY][oldX]*1000)/1000 + ' ' + unit;
        var toolTipContent =  rowTitles[0]+' '+rowTitles[oldY+1]+'<br/>'+colTitles[0]+' '+colTitles[oldX+1]+'<br/>'+Math.round(data[oldY][oldX]*1000)/1000 + ' ' + unit;
        document.getElementById('TipText').innerHTML = toolTipContent;    
    }
    
	canvas.onmousemove = function(event){
  		//get pointers:
	    var ttDiv = document.getElementById(targetDiv);
        var ttContainer = document.getElementById(containerDiv);
       	var canvas = document.getElementById(targetCanvas);
        var context = canvas.getContext('2d');
       	var superDiv = document.getElementById(parentDiv);

        //force the tooltip off - patches persistency problem when moving down off the waffle.  TODO: understand persistency problem.
        ttDiv.style.display = 'none';

       	//get mouse coords:
	    var x = event.pageX - ttContainer.offsetLeft;	
        var y = event.pageY - ttContainer.offsetTop;

        //approximate box size:
        var boxX = 100;
        var boxY = 60;

        //make the tool tip follow the mouse:
	    ttDiv.style.top = y-boxY-5;
        ttDiv.style.left = x-boxX-5;

        //form coordinate system chx, chy with origin at the upper left corner of the div, and 
        //bin as the waffle binning: 
        var chx = Math.floor( (event.pageX - superDiv.offsetLeft - canvas.offsetLeft) / cellSide);
       	var chy = Math.floor( (event.pageY - superDiv.offsetTop - canvas.offsetTop) / cellSide);

       	//make the tool tip say something:
        //var toolTipContent = 'Channel '+chy+', '+chx+': <br/>'+Math.round(data[chy][chx]*1000)/1000 + ' ' + unit;
        var toolTipContent =  rowTitles[0]+' '+rowTitles[chy+1]+'<br/>'+colTitles[0]+' '+colTitles[chx+1]+'<br/>'+Math.round(data[chy][chx]*1000)/1000 + ' ' + unit;
	    document.getElementById('TipText').innerHTML = toolTipContent;

        //update the size of the tool tip to fit the text:
        $(ttDiv).width(1.1*context.measureText('Channel '+chy+', '+chx+':').width)

	    //make the tool tip appear iff it's on the waffle:
	    if(chx<cols && chy<rows) ttDiv.style.display = 'block';
        else ttDiv.style.display = 'none';

        window.griffinToolTipX = event.pageX;
        window.griffinToolTipY = event.pageY;  
    }

    //turn the tool tip off if it's outside the canvas:
    canvas.onmouseout = function(event){
        var ttDiv = document.getElementById(targetDiv);
        ttDiv.style.display = 'none';
    }

}