function DESCANT(monitor, canvas, tooltip){

	var i, j;

	var that = this;

	this.monitorID = monitor;		//div ID of wrapper div
	this.canvasID = canvas;			//ID of canvas to draw DESCANT on
	this.tooltip = tooltip;			//tooltip associated with this object

	this.canvas = document.getElementById(canvas);
	this.context = this.canvas.getContext('2d');
	this.monitor = document.getElementById(this.monitorID);

    //scale canvas//////////////////////////////////////////////////////////////////////////////////////
    this.canvasWidth = 0.48*$(this.monitor).width();
    this.canvasHeight = 0.8*$(this.monitor).height();
    this.canvas.setAttribute('width', this.canvasWidth);
    this.canvas.setAttribute('height', this.canvasHeight);

    //Dirty trick to implement DESCANT's tooltip on its obnoxious geometry: make another canvas of the same size hidden beneath, with the 
    //detector drawn on it, but with each element filled in with rgba(0,0,n,1), where n is the channel number; fetching the color from the 
    //hidden canvas at point x,y will then return the appropriate channel index.
    this.TTcanvas = document.getElementById('DESCANTTTCanvas');
    this.TTcontext = this.TTcanvas.getContext('2d');
    this.TTcanvas.setAttribute('width', this.canvasWidth);
    this.TTcanvas.setAttribute('height', this.canvasHeight);
    //paint whole hidden canvas with R!=G!=B to trigger TT suppression:
    this.TTcontext.fillStyle = 'rgba(50,100,150,1)';
    this.TTcontext.fillRect(0,0,this.canvasWidth, this.canvasHeight);

    //associate tooltip:
    this.tooltip.obj = that;

	//center of DESCANT
	this.centerX = $(this.canvas).width() / 2;
	this.centerY = $(this.canvas).height() / 2;

	//scale at which to draw DESCANT in pixels relative mm in blueprint:
	this.scale = 0.35;

	//pixels to explode DESCANT view by:
	this.explode = 10;

	//side length of pentagon hole:
	this.pentagonSide = 83*this.scale;
	//shortest distance from center of pentagon to side
	this.pentagonNormal = this.pentagonSide / 2 / Math.tan(36/180 * Math.PI);
	//longest distance from center of pentagon to side
	this.pentagonVertex = this.pentagonSide / 2 / Math.sin(36/180 * Math.PI);

	//array of rules for drawing DESCANT channels.  Array index should correspond to real channel number; packed as [type, center x, center y, canvas rotation, element rotation]
	this.drawRules = [];

	this.drawRules[0] = ['white', 0, 0 - this.pentagonNormal-71.9*this.scale, -72/180*Math.PI];
	this.drawRules[1] = ['white', 0, 0 - this.pentagonNormal-71.9*this.scale - 1*(151.5*this.scale+this.explode), -72/180*Math.PI];
	this.drawRules[2] = ['white', 0, 0 - this.pentagonNormal-71.9*this.scale - 2*(151.5*this.scale+this.explode), -72/180*Math.PI];
	this.drawRules[3] = ['white', 0, 0 - this.pentagonNormal-71.9*this.scale - 3*(151.5*this.scale+this.explode), -72/180*Math.PI];
	this.drawRules[4] = ['greenLeft', 0, 0-(this.pentagonNormal + this.scale*(146.5/0.4 + 350)),  -1*(60)/180*Math.PI, 10/180*Math.PI];
	this.drawRules[5] = ['greenLeft', 0, 0-(this.pentagonNormal + this.scale*(146.5/0.4 + 325)),  -1*(45)/180*Math.PI, 0/180*Math.PI];
	this.drawRules[6] = ['greenRight', 0, 0-(this.pentagonNormal + this.scale*(146.5/0.4 + 325)),  -1*(27)/180*Math.PI, -3/180*Math.PI];
	this.drawRules[7] = ['greenRight', 0, 0-(this.pentagonNormal + this.scale*(146.5/0.4 + 350)),  -1*(12)/180*Math.PI, -13/180*Math.PI];
	this.drawRules[8] = ['white', 0, 0 - this.pentagonNormal-71.9*this.scale, 0];
	this.drawRules[9] = ['white', 0, 0 - this.pentagonNormal-71.9*this.scale - 1*(151.5*this.scale+this.explode), 0];
	this.drawRules[10] = ['white', 0, 0 - this.pentagonNormal-71.9*this.scale - 2*(151.5*this.scale+this.explode), 0];
	this.drawRules[11] = ['white', 0, 0 - this.pentagonNormal-71.9*this.scale - 3*(151.5*this.scale+this.explode), 0];
	this.drawRules[12] = ['greenLeft', 0, 0-(this.pentagonNormal + this.scale*(146.5/0.4 + 350)),  -1*(60 - 72)/180*Math.PI, 10/180*Math.PI];
	this.drawRules[13] = ['greenLeft', 0, 0-(this.pentagonNormal + this.scale*(146.5/0.4 + 325)),  -1*(45 - 72)/180*Math.PI, 0/180*Math.PI];
	this.drawRules[14] = ['greenRight', 0, 0-(this.pentagonNormal + this.scale*(146.5/0.4 + 325)),  -1*(27 - 72)/180*Math.PI, -3/180*Math.PI];
	this.drawRules[15] = ['greenRight', 0, 0-(this.pentagonNormal + this.scale*(146.5/0.4 + 350)),  -1*(12 - 72)/180*Math.PI, -13/180*Math.PI];
	this.drawRules[16] = ['white', 0, 0 - this.pentagonNormal-71.9*this.scale, -4*72/180*Math.PI];
	this.drawRules[17] = ['white', 0, 0 - this.pentagonNormal-71.9*this.scale - 1*(151.5*this.scale+this.explode), -4*72/180*Math.PI];
	this.drawRules[18] = ['white', 0, 0 - this.pentagonNormal-71.9*this.scale - 2*(151.5*this.scale+this.explode), -4*72/180*Math.PI];
	this.drawRules[19] = ['white', 0, 0 - this.pentagonNormal-71.9*this.scale - 3*(151.5*this.scale+this.explode), -4*72/180*Math.PI];
	this.drawRules[20] = ['greenLeft', 0, 0-(this.pentagonNormal + this.scale*(146.5/0.4 + 350)),  -1*(60 - 144)/180*Math.PI, 10/180*Math.PI];
	this.drawRules[21] = ['greenLeft', 0, 0-(this.pentagonNormal + this.scale*(146.5/0.4 + 325)),  -1*(45 - 144)/180*Math.PI, 0/180*Math.PI];
	this.drawRules[22] = ['greenRight', 0, 0-(this.pentagonNormal + this.scale*(146.5/0.4 + 325)),  -1*(27 - 144)/180*Math.PI, -3/180*Math.PI];
	this.drawRules[23] = ['greenRight', 0, 0-(this.pentagonNormal + this.scale*(146.5/0.4 + 350)),  -1*(12 - 144)/180*Math.PI, -13/180*Math.PI];
	this.drawRules[24] = ['white', 0, 0 - this.pentagonNormal-71.9*this.scale, -3*72/180*Math.PI];
	this.drawRules[25] = ['white', 0, 0 - this.pentagonNormal-71.9*this.scale - 1*(151.5*this.scale+this.explode), -3*72/180*Math.PI];
	this.drawRules[26] = ['white', 0, 0 - this.pentagonNormal-71.9*this.scale - 2*(151.5*this.scale+this.explode), -3*72/180*Math.PI];
	this.drawRules[27] = ['white', 0, 0 - this.pentagonNormal-71.9*this.scale - 3*(151.5*this.scale+this.explode), -3*72/180*Math.PI];
	this.drawRules[28] = ['greenLeft', 0, 0-(this.pentagonNormal + this.scale*(146.5/0.4 + 350)),  -1*(60 - 216)/180*Math.PI, 10/180*Math.PI];
	this.drawRules[29] = ['greenLeft', 0, 0-(this.pentagonNormal + this.scale*(146.5/0.4 + 325)),  -1*(45 - 216)/180*Math.PI, 0/180*Math.PI];
	this.drawRules[30] = ['greenRight', 0, 0-(this.pentagonNormal + this.scale*(146.5/0.4 + 325)),  -1*(27 - 216)/180*Math.PI, -3/180*Math.PI];
	this.drawRules[31] = ['greenRight', 0, 0-(this.pentagonNormal + this.scale*(146.5/0.4 + 350)),  -1*(12 - 216)/180*Math.PI, -13/180*Math.PI];
	this.drawRules[32] = ['white', 0, 0 - this.pentagonNormal-71.9*this.scale, -2*72/180*Math.PI];
	this.drawRules[33] = ['white', 0, 0 - this.pentagonNormal-71.9*this.scale - 1*(151.5*this.scale+this.explode), -2*72/180*Math.PI];
	this.drawRules[34] = ['white', 0, 0 - this.pentagonNormal-71.9*this.scale - 2*(151.5*this.scale+this.explode), -2*72/180*Math.PI];
	this.drawRules[35] = ['white', 0, 0 - this.pentagonNormal-71.9*this.scale - 3*(151.5*this.scale+this.explode), -2*72/180*Math.PI];
	this.drawRules[36] = ['greenLeft', 0, 0-(this.pentagonNormal + this.scale*(146.5/0.4 + 350)),  -1*(60 - 288)/180*Math.PI, 10/180*Math.PI];
	this.drawRules[37] = ['greenLeft', 0, 0-(this.pentagonNormal + this.scale*(146.5/0.4 + 325)),  -1*(45 - 288)/180*Math.PI, 0/180*Math.PI];
	this.drawRules[38] = ['greenRight', 0, 0-(this.pentagonNormal + this.scale*(146.5/0.4 + 325)),  -1*(27 - 288)/180*Math.PI, -3/180*Math.PI];
	this.drawRules[39] = ['greenRight', 0, 0-(this.pentagonNormal + this.scale*(146.5/0.4 + 350)),  -1*(12 - 288)/180*Math.PI, -13/180*Math.PI];
	this.drawRules[40] = ['red', 0, 0-this.pentagonVertex - this.scale*(   Math.sqrt( Math.pow( 93-41.5 , 2) + Math.pow( 79.6 , 2) ) +73.1 +this.explode), (4*72/180 + 36/180)*Math.PI, Math.PI/2];
	this.drawRules[41] = ['red',0, 0-(this.pentagonNormal + this.scale*(146.5/0.4 + 160)), -1*(55)/180*Math.PI, Math.PI/2 + 15/180*Math.PI]
	this.drawRules[42] = ['red',0, 0-(this.pentagonNormal + this.scale*(146.5/0.4 + 160)), -1*(16)/180*Math.PI, Math.PI/2 - 15/180*Math.PI]
	this.drawRules[43] = ['red', 0, 0-this.pentagonVertex - this.scale*(   Math.sqrt( Math.pow( 93-41.5 , 2) + Math.pow( 79.6 , 2) ) +73.1 + this.explode ), (36/180)*Math.PI, Math.PI/2];
	this.drawRules[44] = ['red',0, 0-(this.pentagonNormal + this.scale*(146.5/0.4 + 160)), -1*(55 - 72)/180*Math.PI, Math.PI/2 + 15/180*Math.PI]
	this.drawRules[45] = ['red',0, 0-(this.pentagonNormal + this.scale*(146.5/0.4 + 160)), -1*(16 - 72)/180*Math.PI, Math.PI/2 - 15/180*Math.PI]
	this.drawRules[46] = ['red', 0, 0-this.pentagonVertex - this.scale*(   Math.sqrt( Math.pow( 93-41.5 , 2) + Math.pow( 79.6 , 2) ) +73.1 +this.explode), (1*72/180 + 36/180)*Math.PI, Math.PI/2];
	this.drawRules[47] = ['red',0, 0-(this.pentagonNormal + this.scale*(146.5/0.4 + 160)), -1*(55 - 144)/180*Math.PI, Math.PI/2 + 15/180*Math.PI]
	this.drawRules[48] = ['red',0, 0-(this.pentagonNormal + this.scale*(146.5/0.4 + 160)), -1*(16 - 144)/180*Math.PI, Math.PI/2 - 15/180*Math.PI]
	this.drawRules[49] = ['red', 0, 0-this.pentagonVertex - this.scale*(   Math.sqrt( Math.pow( 93-41.5 , 2) + Math.pow( 79.6 , 2) ) +73.1 +this.explode), (2*72/180 + 36/180)*Math.PI, Math.PI/2];
	this.drawRules[50] = ['red',0, 0-(this.pentagonNormal + this.scale*(146.5/0.4 + 160)), -1*(55 - 216)/180*Math.PI, Math.PI/2 + 15/180*Math.PI]
	this.drawRules[51] = ['red',0, 0-(this.pentagonNormal + this.scale*(146.5/0.4 + 160)), -1*(16 - 216)/180*Math.PI, Math.PI/2 - 15/180*Math.PI]
	this.drawRules[52] = ['red', 0, 0-this.pentagonVertex - this.scale*(   Math.sqrt( Math.pow( 93-41.5 , 2) + Math.pow( 79.6 , 2) ) +73.1 +this.explode), (3*72/180 + 36/180)*Math.PI, Math.PI/2];
	this.drawRules[53] = ['red',0, 0-(this.pentagonNormal + this.scale*(146.5/0.4 + 160)), -1*(55 - 288)/180*Math.PI, Math.PI/2 + 15/180*Math.PI]
	this.drawRules[54] = ['red',0, 0-(this.pentagonNormal + this.scale*(146.5/0.4 + 160)), -1*(16 - 288)/180*Math.PI, Math.PI/2 - 15/180*Math.PI]
	this.drawRules[55] = ['blue',0, 0-(this.pentagonNormal + this.scale*146.5/0.4), -1*(32+17)/180*Math.PI, -Math.PI*22/180]
	this.drawRules[56] = ['blue',0, 0-(this.pentagonNormal + this.scale*146.5/0.4), -1*(32-9)/180*Math.PI, Math.PI*22/180]
	this.drawRules[57] = ['blue',0, 0-(this.pentagonNormal + this.scale*(146.5/0.4 + 160)), -1*(36)/180*Math.PI, Math.PI*90/180]
	this.drawRules[58] = ['blue',0, 0-(this.pentagonNormal + this.scale*146.5/0.4), -1*(32+17 - 72)/180*Math.PI, -Math.PI*22/180]
	this.drawRules[59] = ['blue',0, 0-(this.pentagonNormal + this.scale*146.5/0.4), -1*(32-9 - 72)/180*Math.PI, Math.PI*22/180]
	this.drawRules[60] = ['blue',0, 0-(this.pentagonNormal + this.scale*(146.5/0.4 + 160)), -1*(36 - 72)/180*Math.PI, Math.PI*90/180]
	this.drawRules[61] = ['blue',0, 0-(this.pentagonNormal + this.scale*146.5/0.4), -1*(32+17 - 144)/180*Math.PI, -Math.PI*22/180]
	this.drawRules[62] = ['blue',0, 0-(this.pentagonNormal + this.scale*146.5/0.4), -1*(32-9 - 144)/180*Math.PI, Math.PI*22/180]
	this.drawRules[63] = ['blue',0, 0-(this.pentagonNormal + this.scale*(146.5/0.4 + 160)), -1*(36 - 144)/180*Math.PI, Math.PI*90/180]
	this.drawRules[64] = ['blue',0, 0-(this.pentagonNormal + this.scale*146.5/0.4), -1*(32+17 - 216)/180*Math.PI, -Math.PI*22/180]
	this.drawRules[65] = ['blue',0, 0-(this.pentagonNormal + this.scale*146.5/0.4), -1*(32-9 - 216)/180*Math.PI, Math.PI*22/180]
	this.drawRules[66] = ['blue',0, 0-(this.pentagonNormal + this.scale*(146.5/0.4 + 160)), -1*(36 - 216)/180*Math.PI, Math.PI*90/180]
	this.drawRules[67] = ['blue',0, 0-(this.pentagonNormal + this.scale*146.5/0.4), -1*(32+17 - 288)/180*Math.PI, -Math.PI*22/180]
	this.drawRules[68] = ['blue',0, 0-(this.pentagonNormal + this.scale*146.5/0.4), -1*(32-9 - 288)/180*Math.PI, Math.PI*22/180]
	this.drawRules[69] = ['blue',0, 0-(this.pentagonNormal + this.scale*(146.5/0.4 + 160)), -1*(36 - 288)/180*Math.PI, Math.PI*90/180]


    //position canvas
    $('#'+canvas).css('top', $('#'+'SubsystemLinks').height() + 5 )
    $('#DESCANTTTCanvas').css('top', $('#'+'SubsystemLinks').height() + 5 )

	//member functions
	this.wireframe = function(){
		var i, j;
		if(this.drawRules[i]!=0){
		for(i=0; i<70; i++){
			this.context.save();
			this.context.translate(this.centerX, this.centerY);
			this.context.rotate(this.drawRules[i][3]);

			this.TTcontext.fillStyle = 'rgba(0,0,0,0)';

			if(this.drawRules[i][0] == 'white')whiteDetector(this.context, this.drawRules[i][1], this.drawRules[i][2], this.scale, 0, 0);
			else if(this.drawRules[i][0] == 'red') redDetector(this.context, this.drawRules[i][1], this.drawRules[i][2], this.scale, 0, this.drawRules[i][4], 0);
			else if(this.drawRules[i][0] == 'blue') blueDetector(this.context, this.drawRules[i][1], this.drawRules[i][2], this.scale, 0, this.drawRules[i][4], 0);
			else if(this.drawRules[i][0] == 'greenLeft') greenLeftDetector(this.context, this.drawRules[i][1], this.drawRules[i][2], this.scale, 0, this.drawRules[i][4], 0);
			else if(this.drawRules[i][0] == 'greenRight') greenRightDetector(this.context, this.drawRules[i][1], this.drawRules[i][2], this.scale, 0, this.drawRules[i][4], 0);

			this.context.restore();
		}

		//and the same again for the hidden TT info canvas:
		for(i=0; i<70; i++){
			this.TTcontext.save();
			this.TTcontext.translate(this.centerX, this.centerY);
			this.TTcontext.rotate(this.drawRules[i][3]);

			this.TTcontext.fillStyle = 'rgba('+i+','+i+','+i+',1)';

			if(this.drawRules[i][0] == 'white')whiteDetector(this.TTcontext, this.drawRules[i][1], this.drawRules[i][2], this.scale, 0, 1);
			else if(this.drawRules[i][0] == 'red') redDetector(this.TTcontext, this.drawRules[i][1], this.drawRules[i][2], this.scale, 0, this.drawRules[i][4], 1);
			else if(this.drawRules[i][0] == 'blue') blueDetector(this.TTcontext, this.drawRules[i][1], this.drawRules[i][2], this.scale, 0, this.drawRules[i][4], 1);
			else if(this.drawRules[i][0] == 'greenLeft') greenLeftDetector(this.TTcontext, this.drawRules[i][1], this.drawRules[i][2], this.scale, 0, this.drawRules[i][4], 1);
			else if(this.drawRules[i][0] == 'greenRight') greenRightDetector(this.TTcontext, this.drawRules[i][1], this.drawRules[i][2], this.scale, 0, this.drawRules[i][4], 1);

			this.TTcontext.restore();
		}
		}

	};

	//fetch the channel number that pixel x,y sits on by parsing the info encoded in the blue entry of the hidden tooltip canvas
	this.fetchChannel = function(x, y){
		var imageData = this.TTcontext.getImageData(x,y,1,1);
		var index = -1;
		if(imageData.data[0] == imageData.data[1] && imageData.data[0] == imageData.data[2]) index = imageData.data[0];
		return index;
	};

	this.findCell = function(x, y){
		return this.fetchChannel(x,y);
	};

    //establish the tooltip text for the cell returned by this.findCell; return length of longest line:
	this.defineText = function(cell){
        var toolTipContent = '<br>';
        var nextLine;
        var longestLine = 0;
        var cardIndex;
        var i;

        nextLine = cell;

        //keep track of the longest line of text:
        longestLine = Math.max(longestLine, this.tooltip.context.measureText(nextLine).width)
        toolTipContent += nextLine;
/*
        //fill out tooltip content:
        for(i=0; i<this.reportedValues.length; i++){
            //establish prefix:
            nextLine = '<br/>'+this.tooltip.prefix[i];
            if(this.tooltip.prefix[i] !== '') nextLine += ' ';

            //pull in content; special cases for the status word and reported current:
            //status word:
            if(i == 6){
                nextLine += parseStatusWord(this.reportedValues[i][row][col]);
            }
            //current:
            else if(i == 2){
                    if(this.moduleSizes[cardIndex]==4 && row!=0) nextLine += '--';
                    else nextLine += Math.round( this.reportedValues[i][row][col]*1000)/1000 + ' ' + this.tooltip.postfix[i];                
            } else {
                nextLine += Math.round( this.reportedValues[i][row][col]*1000)/1000 + ' ' + this.tooltip.postfix[i];
            }

            //keep track of longest line:
            longestLine = Math.max(longestLine, this.tooltip.context.measureText(nextLine).width);

            //append to tooltip:
            toolTipContent += nextLine;
 
        }
*/
        document.getElementById(this.tooltip.ttTextID).innerHTML = toolTipContent;

        //return length of longest line:
        return longestLine;
	};
}














