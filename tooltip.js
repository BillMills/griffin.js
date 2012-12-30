//function to generate a tool tip over a canvas targetCanvas wrapped in a parentDiv.  The tool 
//tip consists of a div targetDiv with absolute positioning containing <p id="TipText"></p>, wrapped
//in a containerDiv with relative positioning.  TODO: enforce div properties?

function Tooltip(targetCanvas, parentDiv, targetDiv, containerDiv, rows, cols, cellSide, rowTitles, colTitles, prefix, postfix, data){
	var canvas = document.getElementById(targetCanvas);
    var i;
    var ttArgs = arguments.length;
    var args = Array.prototype.slice.call(arguments);

    //hack to update reported value at waffle refresh if user just leaves the mouse sitting there without moving:
    var oldX = Math.floor( (window.griffinToolTipX - document.getElementById(parentDiv).offsetLeft - document.getElementById(targetCanvas).offsetLeft) / cellSide);
    var oldY = Math.floor( (window.griffinToolTipY - document.getElementById(parentDiv).offsetTop - document.getElementById(targetCanvas).offsetTop) / cellSide);
    if(oldX > -1 && oldX < cols && oldY>-1 && oldY<rows){
        var toolTipContent =  '<br>'+colTitles[0]+' '+colTitles[oldX+1]+', '+rowTitles[0]+' '+rowTitles[oldY+1]+'<br>'
        for(i=11; i<ttArgs; i++){
            toolTipContent += '<br/>'+prefix[i-11];
            if(prefix[i-11] !== '') toolTipContent += ' ';
            toolTipContent += Math.round( args[i][oldY][oldX]*1000)/1000 + ' ' + postfix[i-11];
        }

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
        var boxY = 20 + 20*(ttArgs-11) + 60;

        //make the tool tip follow the mouse:
	    ttDiv.style.top = y-boxY-5;
        ttDiv.style.left = x-boxX-5;

        //form coordinate system chx, chy with origin at the upper left corner of the div, and 
        //bin as the waffle binning: 
        var chx = Math.floor( (event.pageX - superDiv.offsetLeft - canvas.offsetLeft) / cellSide);
       	var chy = Math.floor( (event.pageY - superDiv.offsetTop - canvas.offsetTop) / cellSide);


        //only continue if the cursor is actually on the waffle:
        if(chx<cols && chy<rows){
           	//make the tool tip say something, keeping track of which line is longest:
            var toolTipContent = '<br>';
            var nextLine
            var longestLine = 0;
            nextLine = colTitles[0]+' '+colTitles[chx+1]+', '+rowTitles[0]+' '+rowTitles[chy+1]+'<br>';
            longestLine = Math.max(longestLine, context.measureText(nextLine).width)
            toolTipContent += nextLine;

            for(i=11; i<ttArgs; i++){
                nextLine = '<br/>'+prefix[i-11];
                if(prefix[i-11] !== '') nextLine += ' ';
                nextLine += Math.round( args[i][chy][chx]*1000)/1000 + ' ' + postfix[i-11];
                longestLine = Math.max(longestLine, context.measureText(nextLine).width);
                toolTipContent += nextLine;
            }
    	    document.getElementById('TipText').innerHTML = toolTipContent;


            //update the size of the tool tip to fit the text:
            $(ttDiv).width(1*longestLine);
            $(ttDiv).height(boxY);

	        //make the tool tip appear iff the waffle is showing:
            if(window.onDisplay == 'TestWaffle')
    	        ttDiv.style.display = 'block';

            window.griffinToolTipX = event.pageX;
            window.griffinToolTipY = event.pageY;
        }
    }

    //turn the tool tip off if it's outside the canvas:
    canvas.onmouseout = function(event){
        var ttDiv = document.getElementById(targetDiv);
        ttDiv.style.display = 'none';
    }

}

function drawTextDivider(x0, y0, length, cvas){
        var canvas = document.getElementById(cvas);
        var context = canvas.getContext('2d');

        context.strokeStyle = 'rgba(255,255,255,0.9)'

        context.beginPath();
        context.moveTo(x0-length/2, y0);
        context.lineTo(x0-0.05*length/2, y0);
        context.moveTo(x0+0.05*length/2, y0);
        context.lineTo(x0+length/2, y0);
        context.moveTo(x0-0.02*length/2-5, y0+5);
        context.lineTo(x0-0.02*length/2+5, y0-5);
        context.moveTo(x0+0.02*length/2-5, y0+5);
        context.lineTo(x0+0.02*length/2+5, y0-5);
        context.stroke();



}