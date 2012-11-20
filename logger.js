//populate the striptool with recent data upon initialization
function populate(cvas, data, xMin, xMax, yMin, yMax, x0, y0, marginSize, RHB){
    var i, j; 
    var lineSegment;
    var initialY;
    var iter;

    var canvas = [];
    canvas[0] = document.getElementById(cvas[0]);
    canvas[1] = document.getElementById(cvas[1]);
    var context = [];
    context[0] = canvas[0].getContext('2d');
    context[1] = canvas[1].getContext('2d');

    //number of samples on screen at once:
    var nSamples = 10;

    //width of one sample:
    var sampleWidth = (RHB - x0) / nSamples;

    //take the last nSamples+1 entries in the data vector:
    var lastData = data.slice(data.length-nSamples-1);

    var step = 10;
    var iter = 0;

    //draw line:
    for(i=1; i<nSamples+1; i++){

        initialY = lastData[i-1];
        for(j=0; j<sampleWidth/step; j++){
            
            lineSegment = pixelMap(xMin, xMax, yMin, yMax, x0, y0, marginSize, RHB, initialY, lastData[i] - lastData[i-1]);
            //alert(initialY+', '+lineSegment[0])
            //scroll the canvas over a step:
            scrollStep(context[iter], context[Math.abs(iter-1)], canvas[iter], canvas[Math.abs(iter-1)], x0, y0, step, RHB);

            //redraw the axes:
            LoggerFrame(cvas[iter], xMin, xMax, yMin, yMax, marginSize, 'arbitrary x unit', 'arbitrary y unit', 'striptool');

            //draw a line segment from the current position of the logger line, to the edge of the plot:
            drawLine(context[Math.abs(iter-1)], RHB, step, lineSegment);

            initialY += (lastData[i] - lastData[i-1]) / (sampleWidth/step)

            if(iter) iter = 0;
            else iter = 1;

        }

    }

}

//sample and log a value every interval
function Sample(cvas, initialY){

    if(!document.webkitHidden && !document.mozHidden){
    	var pullSlope = Math.random() - 0.5;

	    var scrollIt = new ScrollPlot(cvas, 0, 0, initialY, pullSlope, 2);

    	initialY += pullSlope;
    }

	setTimeout(function(){Sample(cvas, initialY)},3000);

}

function ScrollPlot(cvas, iter, frame, initialY, slope, duration){
    //fetch canvases and contexts:
    var canvas = [];
    canvas[0] = document.getElementById(cvas[0]);
    canvas[1] = document.getElementById(cvas[1]);
    var context = [];
    context[0] = canvas[0].getContext('2d');
    context[1] = canvas[1].getContext('2d');

    //define physical parameter range:
    var yMin = -0.5;
    var yMax = 0.5;
    var xMin = 0;
    var xMax = 10;

    //define animation parameters:
    var FPS =25;
    var nFrames = FPS*duration;

    //number of samples on screen at once:
    var nSamples = 10;

    //seek optimal parameter to autoadjust plot size for smooth animation & maximum size:
    //(this is a solution to the problem that a measurement must be represented with a 
    //line segment which has a width in pixels = integer multiple of the number of
    //frames of animation used to scroll it one step back on the striptool; if not, 
    //roundoff errors at each frame cause the line segments to not line up with the tickmarks
    //nicely).
    var scale = 0;
    while((canvas[0].width - scale*nSamples*nFrames) > 0) scale++;
    scale--;

    //axis parameters, same as in LoggerFrame:
    var marginSize = (canvas[0].width - scale*nSamples*nFrames)*0.4;
    var marginScaleY = 1.5;
    var axisLineWidth = 2;

    //plot origin:
    var x0 = marginSize*marginScaleY+axisLineWidth;
    var y0 = canvas[0].height - marginSize - axisLineWidth;

    //right-hand boundary:
    var RHB = canvas[0].width-marginSize;

    //width of one sample:
    var sampleWidth = (RHB - x0) / nSamples;

    //how far to scroll in each frame of animation:
    var step = Math.round(sampleWidth / nFrames);

    //map the physical line onto the cnavas coordinates
    var lineSegment = pixelMap(xMin, xMax, yMin, yMax, x0, y0, marginSize, RHB, initialY, slope);

    //drawing steps:
    //scroll the canvas over a step:
    scrollStep(context[iter], context[Math.abs(iter-1)], canvas[iter], canvas[Math.abs(iter-1)], x0, y0, step, RHB);

    //redraw the axes:
    LoggerFrame(cvas[iter], xMin, xMax, yMin, yMax, marginSize, 'arbitrary x unit', 'arbitrary y unit', 'striptool');

    //draw a line segment from the current position of the logger line, to the edge of the plot:
    drawLine(context[Math.abs(iter-1)], RHB, step, lineSegment);

    //swap canvases each frame:
	if(iter) iter = 0;
	else iter = 1;

    //call next frame:
	frame++;
	if(frame<nFrames){
	    setTimeout(function(){ScrollPlot(cvas,iter, frame, initialY+slope/nFrames, slope, duration)},1000/FPS);
	}
}

//parse physical info into pixel coords, returns array [yCoord, s, lineColor]
function pixelMap(xMin, xMax, yMin, yMax, x0, y0, marginSize, RHB, initialY, slope){
    //turn initialY into canvas coords:
    var yCoord = marginSize + (yMax - initialY)/(yMax-yMin)*(y0-marginSize)              
    //and similarly for the slope:
    var s = slope*(y0-marginSize)/(yMax-yMin)*(xMax-xMin)/(RHB-x0);

    //line turns red and gets clipped if it's out of bounds:
    var lineColor = 'black';    
    if(yCoord < marginSize){
        s = 0;
        yCoord = marginSize;
        lineColor = 'red';
    } else if(yCoord > y0){
        s = 0;
        yCoord = y0-1;
        lineColor = 'red';
    }    

    return [yCoord, s, lineColor];
}

//canvas scroller:
function scrollStep(contextTop, contextBottom, canvasTop, canvasBottom, x0, y0, step, RHB){
        //scroll the canvas over a step:
        contextTop.drawImage(canvasBottom, x0+step, 0, RHB-x0-step, y0, x0, 0, RHB-x0-step, y0);
        //flip the z-order of the canvases:
        canvasTop.style.zIndex=1;
        canvasBottom.style.zIndex=0;
        //white out the old canvas:
        contextBottom.fillStyle = 'rgba(255,255,255,1)';
        contextBottom.fillRect(0,0,canvasBottom.width, canvasBottom.height);
    
}

function drawLine(context, RHB, step, lineSegment){
        context.beginPath();
        context.lineWidth = 1;
        context.strokeStyle = lineSegment[2];
        context.moveTo(RHB-step, lineSegment[0]);
        context.lineTo(RHB,-step*lineSegment[1] + lineSegment[0] );
        context.stroke();    
}


function LoggerFrame(cvas, xmin, xmax, ymin, ymax, marginSize, xtitle, ytitle, title) {

	var canvas = document.getElementById(cvas);
    var context = canvas.getContext('2d');

    
    //var marginSize = 70;
    var marginScaleY = 1.5;
    var bigTick = 10;
    var smallTick = 5;
    var majorX = 3;
    var minorX = 4;
    var xDecimal = 0;
    var majorY = 3;
    var minorY = 9;
    var yDecimal = 1;
    var scaleFont = '15px sans-serif';
    var titleFont = 'italic 24px times new roman';        
    var textColor = 'black';
    var titleNudgeX = 0;
    var titleNudgeY = 0;
    var xLabelNudgeX = 0;
    var xLabelNudgeY = 0;
    var yLabelNudgeX = 0;
    var yLabelNudgeY = 0;
    var axisLineWidth = 2;    

    var i, j, majorTickSpacingX, minorTickSpacingX, majorTickSpacingY, minorTickSpacingY;
  
    //text color
    context.fillStyle = textColor;

    context.beginPath();
    context.strokeStyle = 'black';
    context.lineWidth = axisLineWidth;
    //axes
    context.moveTo(marginScaleY * marginSize, canvas.height - marginSize);
    context.lineTo(canvas.width - marginSize, canvas.height - marginSize);
    context.moveTo(marginScaleY * marginSize, canvas.height - marginSize);
    context.lineTo(marginScaleY * marginSize, marginSize);

    //x-axis tick marks
    majorTickSpacingX = (canvas.width - (1 + marginScaleY) * marginSize) / (majorX - 1);
    minorTickSpacingX = majorTickSpacingX / (minorX + 1);

    for (i = 0; i < majorX; i++) {
        context.moveTo(marginScaleY * marginSize + i * majorTickSpacingX, canvas.height - marginSize);
        context.lineTo(marginScaleY * marginSize + i * majorTickSpacingX, canvas.height - marginSize + bigTick);

        context.font = scaleFont;
        context.fillText(((xmax - xmin) / (majorX - 1) * i + xmin).toFixed(xDecimal), marginScaleY * marginSize + i * majorTickSpacingX, canvas.height - marginSize + bigTick + 12);

        if (i < majorX - 1) {
            for (j = 0; j < minorX; j++) {
                context.moveTo(marginScaleY * marginSize + i * majorTickSpacingX + (j + 1) * minorTickSpacingX, canvas.height - marginSize);
                context.lineTo(marginScaleY * marginSize + i * majorTickSpacingX + (j + 1) * minorTickSpacingX, canvas.height - marginSize + smallTick);
            }
        }
    }

    //y-axis tick marks
    majorTickSpacingY = (canvas.height - 2 * marginSize) / (majorY - 1);
    minorTickSpacingY = majorTickSpacingY / (minorY + 1);
    for (i = 0; i < majorY; i++) {
        context.moveTo(marginScaleY * marginSize, canvas.height - marginSize - i * majorTickSpacingY);
        context.lineTo(marginScaleY * marginSize - bigTick, canvas.height - marginSize - i * majorTickSpacingY);

        context.font = scaleFont;
        context.textBaseline = "middle";
        context.textAlign = "right";
        context.fillText(((ymax - ymin) / (majorY - 1) * i + ymin).toFixed(yDecimal), marginScaleY * marginSize - bigTick - 12, canvas.height - marginSize - i * majorTickSpacingY);

        if (i < majorY - 1) {
            for (j = 0; j < minorY; j++) {
                context.moveTo(marginScaleY * marginSize, canvas.height - marginSize - i * majorTickSpacingY - (j + 1) * minorTickSpacingY);
                context.lineTo(marginScaleY * marginSize - smallTick, canvas.height - marginSize - i * majorTickSpacingY - (j + 1) * minorTickSpacingY);
            }
        }
    }

    //titles  

    context.textBaseline = "middle";
    context.textAlign = "right";
    context.font = titleFont;
    context.fillText(xtitle, canvas.width - marginSize - minorTickSpacingX + xLabelNudgeX, canvas.height - marginSize / 2 + xLabelNudgeY);

    context.save();
    context.translate(marginSize / 2 + yLabelNudgeX, marginSize + minorTickSpacingY + yLabelNudgeY);
    context.rotate(-1 * Math.PI / 2);
    context.textBaseline = "bottom";
    context.fillText(ytitle, 0, 0);
    context.restore();

    context.textBaseline = "bottom";
    //context.fillText(title, canvas.width - marginSize - minorTickSpacingX + titleNudgeX, marginSize + titleNudgeY);
       
    context.stroke();

 }

