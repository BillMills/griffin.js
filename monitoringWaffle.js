function Waffle(callMyself, rows, cols, cvas, alarm, scaleMax, startData, title, sidebar, side, tooltip, TTcontainer, wrapperDiv, unit, rowTitles, colTitles, InputLayer){

    if(!document.webkitHidden && !document.mozHidden){
    	var i, j;
	    var R, G, B, A;

        //determine dimesions of canvas:
        var totalWidth = Math.round(0.24*$('#'+wrapperDiv).width());
        var totalHeight = totalWidth*rows/cols + 100;

        //waffle dimensions; leave gutters for labels & title
        var waffleWidth = totalWidth - 60;
        var waffleHeight = totalHeight - 120;

        //cell dimensions controlled by width, since width more visually important here:
        var cellSide = waffleWidth / cols;

        //for now, data is just random on [0,1]; TODO: provide ODB values later.
        //set up arrays:
        var endData = [];
        var startColor = [];
        var endColor = [];
        for(i=0; i<rows; i++){
        	endData[i] = [];
    	   startColor[i] = [];
        	endColor[i] = [];
        }
        //populate new data:
        for(i=0; i<rows; i++){
    	   for(j=0; j<cols; j++){
    		  endData[i][j] = Math.random();
    	   }
        }

        //abort flag for sidebar if data hasn't changed or if it's changed but is all still below alarm level:
        var flag = 0;
        if(startData){
            var flag = 0;
            for(i=0; i<rows; i++){
                for(j=0; j<cols; j++){
                    if( (endData[i][j]<alarm && startData[i][j]<alarm) || (endData[i][j] === startData[i][j]) ) flag = flag*1;
                    else flag = 1;
                }
            }
        } else{
            flag = 1;
        }
        
        //check if startData is an array; if not, make a dummy array to start from:
        if( Object.prototype.toString.call( startData ) !== '[object Array]' ) {
            startData = [];
            for(i=0; i<rows; i++){
              startData[i] = []
              for(j=0; j<cols; j++){
                startData[i][j] = 0;
              }
            }
        }

        //determine per cell color info for start and finish.
        //Color info is packed as four numbers: red, green, blue, alpha
        for(i=0; i<rows; i++){
        	for(j=0; j<cols; j++){
    	      	//start values:
    	   	   if(startData[i][j] < alarm){
    		    	R = 0;
    		      	G = 255;
    		      	B = 0;
    		      	A = 0.3;
    		      	startColor[i][j] = [R,G,B,A];
    		    } else {
    			    R = 255;
    			    G = 0;
    			    B = 0;
    			    A = (startData[i][j] - alarm) / (scaleMax - alarm)*0.7 + 0.3;  //enforce minimum 0.3 to make it clearly red
    			    if(A>1) {A = 1;}
            		startColor[i][j] = [R,G,B,A];
    	       }

        	   //end values:
    		   if(endData[i][j] < alarm){
    		       R = 0;
    			   G = 255;
    			   B = 0;
    			   A = 0.3;
    			   endColor[i][j] = [R,G,B,A];
    		    } else {
    			    R = 255;
    			    G = 0;
    			    B = 0;
    			    A = (endData[i][j] - alarm) / (scaleMax - alarm)*0.7 + 0.3;  //enforce minimum 0.3 to make it clearly red
    			    if(A>1) {A = 1;}
        			endColor[i][j] = [R,G,B,A];
        		}
    	    }
        }

        //make waffles clickable to set a variable for a channel:
        var canvas = document.getElementById(cvas);
        var context = canvas.getContext('2d');
        canvas.onclick = function(event){

            var superDiv = document.getElementById(wrapperDiv);
            var inputDiv = document.getElementById(InputLayer);
            //form coordinate system chx, chy with origin at the upper left corner of the div, and 
            //bin as the waffle binning: 
            var chx = Math.floor( (event.pageX - superDiv.offsetLeft - canvas.offsetLeft) / cellSide);
            var chy = Math.floor( (event.pageY - superDiv.offsetTop - canvas.offsetTop) / cellSide);

            //set text in dialog box:
            var fieldTextContent = 'Demand '+title+' ['+unit+'] '+' for '+rowTitles[0]+' '+chy+', '+colTitles[0]+' '+chx;
            document.getElementById('FieldText').innerHTML = fieldTextContent;

            //position dialog box in the middle, above the waffles; recall rendering width is at least 1200px
            $(inputDiv).css('left', Math.max(1200, window.innerWidth)/2 - context.measureText(fieldTextContent).width / 2);
            $(inputDiv).css('top', window.innerHeight*0.175);

            //only actually display if the click was on the waffle and not the rest of the canvas:
            if(chx < cols && chy < rows){
                //inputDiv.style.display = 'block';
                divFade(inputDiv, 'in', 0);
            }

        }

        DrawWaffle(cvas, startColor, endColor, 1, title, rows, cols, totalWidth, totalHeight, cellSide);
        AlarmSidebar(title, sidebar, side, 1, wrapperDiv, waffleHeight, endData, unit, rows, cols, alarm, rowTitles, colTitles, callMyself, flag);
        Tooltip(cvas, wrapperDiv, tooltip, TTcontainer, endData, rows, cols, cellSide, unit, rowTitles, colTitles);
        
    } else {
        //make sure endData is defined for the next call to Waffle; keep the same one so the first transition after focus returns is smooth.        
        var endData = startData;

    }

    //repeat every update interval:
    setTimeout(function(){Waffle(1, rows, cols, cvas, alarm, scaleMax, endData, title, sidebar, side, tooltip, TTcontainer, wrapperDiv, unit, rowTitles, colTitles, InputLayer)},3000);

}

function DrawWaffle(cvas, startColor, endColor, frame, title, rows, cols, totalWidth, totalHeight, cellSide){

	var FPS = 30;
	var duration = 0.5;
    var nFrames = FPS*duration;

	var i, j;
	var R, G, B, A;
	var color;

	var cornerX, cornerY;

    //fetch canvas:
    var canvas = document.getElementById(cvas);
    var context = canvas.getContext('2d');

    //adjust canvas to fit:
    $('#'+cvas).attr('width', totalWidth);
    $('#'+cvas).attr('height', totalHeight);

    context.globalAlpha = 1;

    context.fillStyle = "rgba(255,255,255,1)"
    context.fillRect(0,0,totalWidth,totalHeight);

    for(i=0; i<rows; i++){
    	for(j=0; j<cols; j++){
		    R = startColor[i][j][0] + (endColor[i][j][0] - startColor[i][j][0])*frame/nFrames;
    		G = startColor[i][j][1] + (endColor[i][j][1] - startColor[i][j][1])*frame/nFrames;
    		B = startColor[i][j][2] + (endColor[i][j][2] - startColor[i][j][2])*frame/nFrames;
    		A = startColor[i][j][3] + (endColor[i][j][3] - startColor[i][j][3])*frame/nFrames;
    		color = "rgba("+R+","+G+","+B+","+A+")";
    		context.fillStyle = color;
    		cornerX = j*cellSide;
    		cornerY = i*cellSide;    		
    		context.fillRect(cornerX, cornerY,cellSide,cellSide);
    	}
    }

    var gridLines = new DrawWaffleDecorations(cvas, rows, cols, cellSide);
    var waffleLabels = new DrawWaffleLabels(cvas, title, rows, cols, cellSide);

    if(frame < nFrames){
    	frame++;
    	setTimeout(function(){DrawWaffle(cvas, startColor, endColor, frame, title, rows, cols, totalWidth, totalHeight, cellSide)},duration/FPS);
    }

}

function DrawWaffleDecorations(cvas, rows, cols, cellSide){
    //fetch canvas:
    var canvas = document.getElementById(cvas);
    var context = canvas.getContext('2d');

    var i, j;

    //style lines:
    context.fillStyle = 'rgba(0,0,0,1)';
    context.lineWidth = 1;

    //draw border:
	context.beginPath();
	context.moveTo(0,0);
	context.lineTo(0,cellSide*rows);
	context.lineTo(cellSide*cols,cellSide*rows);
	context.lineTo(cellSide*cols,0);
	context.lineTo(0,0);

    //draw inner lines:
	for(i=1; i<rows; i++){
		context.moveTo(0,i*cellSide);
		context.lineTo(cellSide*cols,i*cellSide);		
	}
    for(j=1; j<cols; j++){
        context.moveTo(j*cellSide,0);
        context.lineTo(j*cellSide,cellSide*rows);
    }

    context.stroke();

}

function DrawWaffleLabels(cvas, title, rows, cols, cellSide){
    var i, j;

    //fetch canvas:
    var canvas = document.getElementById(cvas);
    var context = canvas.getContext('2d');

    //Tie title font size to plot size:
    var titleFontSize = Math.min(30, context.canvas.width*0.08);
    //make title:
    context.font=titleFontSize+"px Times New Roman";
    context.fillStyle = 'black';
    context.globalAlpha = 0.6;
    context.fillText(title, cols*cellSide/2 - context.measureText(title).width/2, rows*cellSide+70);

    //channel labels:
    var labelFontSize = Math.min(16, cellSide);
    context.font=labelFontSize+"px Times New Roman";
    for(i=0; i<rows; i++){
        context.fillText(i, cellSide*cols+10, i*cellSide + cellSide/2 +8 );
    }
    for(j=0; j<cols; j++){
        context.save();
        context.translate(j*cellSide + cellSide/2, rows*cellSide+10);
        context.rotate(-Math.PI/2);
        context.textAlign = "right";
        context.fillText(j, 0,labelFontSize/2);
        context.restore();
    }
}
