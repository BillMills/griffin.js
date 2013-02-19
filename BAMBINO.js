function BAMBINO(monitor){
	this.monitorID = monitor;		        //div ID of wrapper div
	this.canvasID = 'BAMBINOCanvas'; 		//ID of canvas to draw top level TIGRESS view on
    this.linkWrapperID = 'SubsystemLinks';  //ID of div wrapping subsystem navigation links
    this.sidebarID = 'SubsystemSidebar';    //ID of right sidebar for this object
    this.topNavID = 'SubsystemsButton';     //ID of top level nav button
    this.TTcanvasID = 'BAMBINOTTCanvas';      //ID of hidden tooltip map canvas

	this.nRadial = 16;
	this.nAzimuthal = 16;

    var that = this;
    //make a pointer at window level back to this object, so we can pass by reference to the nav button onclick
    window.BAMBINOpointer = that;

    //establish animation parameters////////////////////////////////////////////////////////////////////
    this.FPS = 30;
    this.duration = 0.5;
    this.nFrames = this.FPS*this.duration;

    //insert navigation/////////////////////////////////////////////////////////////////////////////////
    var newButton = document.createElement('button');
    newButton.setAttribute('id', 'BAMBINOlink');
    newButton.setAttribute('class', 'navLink');
    newButton.setAttribute('type', 'button');
    newButton.setAttribute('onclick', "javascript:swapFade('BAMBINOCanvas', 'BAMBINOlink', window.BAMBINOpointer)");
    document.getElementById(this.linkWrapperID).appendChild(newButton);
    document.getElementById('BAMBINOlink').innerHTML = 'BAMBINO';

    //insert & scale canvas//////////////////////////////////////////////////////////////////////////////////////
    this.monitor = document.getElementById(monitor);
    this.canvasWidth = 0.48*$(this.monitor).width();
    this.canvasHeight = 0.8*$(this.monitor).height();
    var newCanvas = document.createElement('canvas');
    newCanvas.setAttribute('id', this.canvasID);
    newCanvas.setAttribute('class', 'monitor');
    newCanvas.setAttribute('style', 'top:' + ($('#SubsystemLinks').height() + 5)*1.25 +'px;')
    newCanvas.setAttribute('width', this.canvasWidth);
    newCanvas.setAttribute('height', this.canvasHeight);
    document.getElementById(monitor).appendChild(newCanvas);
    this.canvas = document.getElementById(this.canvasID);
    this.context = this.canvas.getContext('2d');

    //hidden Tooltip map layer
    newCanvas = document.createElement('canvas');
    newCanvas.setAttribute('id', this.TTcanvasID);
    newCanvas.setAttribute('class', 'monitor');
    newCanvas.setAttribute('style', 'top:' + ($('#SubsystemLinks').height() + 5)*1.25 +'px;')
    newCanvas.setAttribute('width', this.canvasWidth);
    newCanvas.setAttribute('height', this.canvasHeight);
    document.getElementById(monitor).appendChild(newCanvas);
    this.TTcanvas = document.getElementById(this.TTcanvasID);
    this.TTcontext = this.TTcanvas.getContext('2d');
    //Dirty trick to implement tooltip on obnoxious geometry: make another canvas of the same size hidden beneath, with the 
    //detector drawn on it, but with each element filled in with rgba(0,0,n,1), where n is the channel number; fetching the color from the 
    //hidden canvas at point x,y will then return the appropriate channel index.
    //paint whole hidden canvas with R!=G!=B to trigger TT suppression:
    this.TTcontext.fillStyle = 'rgba(50,100,150,1)';
    this.TTcontext.fillRect(0,0,this.canvasWidth, this.canvasHeight);
    //set up tooltip:
    this.tooltip = new Tooltip(this.canvasID, 'BAMBINOTipText', 'BAMBINOttCanv', 'BAMBINOTT', this.monitorID, prefix, postfix);
    this.tooltip.obj = that;

    //drawing parameters
    this.centerX = this.canvasWidth/2;
    this.centerY = this.canvasHeight/2;
    this.CDinnerRadius = this.canvasWidth*0.01;
    this.CDradius = this.canvasHeight*0.17;
    this.centerLeft = this.canvasWidth*0.25;
    this.centerRight = this.canvasWidth*0.75;
    this.centerTop = this.canvasHeight*0.25;
    this.centerBottom = this.canvasHeight*0.65;
    this.radialWidth = (this.CDradius - this.CDinnerRadius) / this.nRadial;
    this.azimuthalArc = 2*Math.PI / this.nAzimuthal;

    //member functions///////////////////////////////////////////////////////////////////
    this.draw = function(frame){

    	var i, j, m, x0, y0;

    	this.context.strokeStyle = '#999999';

        //once for display canvas...
    	for(i=0; i<4; i++){
	    	if(i == 0){
	    		x0 = this.centerLeft; y0 = this.centerTop;  //downstream radial
	    	} else if(i == 1){
	    		x0 = this.centerLeft; y0 = this.centerBottom; //downstream azimuthal
	    	} else if(i == 2){
	    		x0 = this.centerRight; y0 = this.centerTop; //upstream radial
	    	} else if(i == 3){
	    		x0 = this.centerRight; y0 = this.centerBottom; //upstream azimuthal
	    	}
	    	if(i == 0 || i == 2){
	    		for(j=0; j<this.nRadial+1; j++){
    				this.context.beginPath()
    				this.context.fillStyle = '#4C4C4C';
	    			this.context.arc(x0, y0, this.CDradius - j*this.radialWidth, 0, 2*Math.PI);
	    			this.context.closePath();
    				this.context.fill();
	    			this.context.stroke();
    			}
    			
    		} else {
    
	    		for(j=0; j<this.nAzimuthal; j++){
    				this.context.beginPath()
    				this.context.fillStyle = '#4C4C4C';
    				this.context.moveTo(x0, y0);
    				this.context.lineTo(x0 + this.CDradius*Math.cos(j*this.azimuthalArc), y0 - this.CDradius*Math.sin(j*this.azimuthalArc));
    				this.context.arc(x0,y0, this.CDradius, -j*this.azimuthalArc, -(j+1)*this.azimuthalArc, true);
    				this.context.closePath();
    				this.context.fill();
	    			this.context.stroke();
    			}
    		}
    	}
        //...and again for TT encoding:
        m=0;
        for(i=0; i<4; i++){
            if(i == 0){
                x0 = this.centerLeft; y0 = this.centerTop;  //downstream radial
            } else if(i == 1){
                x0 = this.centerLeft; y0 = this.centerBottom; //downstream azimuthal
            } else if(i == 2){
                x0 = this.centerRight; y0 = this.centerTop; //upstream radial
            } else if(i == 3){
                x0 = this.centerRight; y0 = this.centerBottom; //upstream azimuthal
            }
            if(i == 0 || i == 2){
                for(j=0; j<this.nRadial+1; j++){
                    this.TTcontext.beginPath()
                    this.TTcontext.fillStyle = 'rgba('+m+','+m+','+m+',1)';
                    this.TTcontext.arc(x0, y0, this.CDradius - j*this.radialWidth, 0, 2*Math.PI);
                    this.TTcontext.closePath();
                    this.TTcontext.fill();
                    m++;
                }
                
            } else {
    
                for(j=0; j<this.nAzimuthal; j++){
                    this.TTcontext.beginPath()
                    this.TTcontext.fillStyle = 'rgba('+m+','+m+','+m+',1)';
                    this.TTcontext.moveTo(x0, y0);
                    this.TTcontext.lineTo(x0 + this.CDradius*Math.cos(j*this.azimuthalArc), y0 - this.CDradius*Math.sin(j*this.azimuthalArc));
                    this.TTcontext.arc(x0,y0, this.CDradius, -j*this.azimuthalArc, -(j+1)*this.azimuthalArc, true);
                    this.TTcontext.closePath();
                    this.TTcontext.fill();
                    m++;
                }
            }
        }    
		
    	//titles
        this.context.clearRect(0,0.85*this.canvasHeight,this.canvasWidth,0.15*this.canvasHeight);
        this.context.fillStyle = '#999999';
        this.context.font="24px 'Orbitron'";
        this.context.fillText('Downstream', this.centerLeft - this.context.measureText('Downstream').width/2, 0.9*this.canvasHeight);
        this.context.fillText('Upstream', this.centerRight - this.context.measureText('Upstream').width/2, 0.9*this.canvasHeight);

    };

    this.findCell = function(x, y){
        var imageData = this.TTcontext.getImageData(x,y,1,1);
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

        document.getElementById(this.tooltip.ttTextID).innerHTML = toolTipContent;

        //return length of longest line:
        return longestLine;
    };

}