PACES.prototype = Object.create(Subsystem.prototype);

function PACES(){
    //detector name, self-pointing pointer, pull in the Subsystem template, 
    //establish a databus and create a global-scope pointer to this object:
    this.name = 'PACES';
    var that = this;
    Subsystem.call(this);
    this.dataBus = new PACESDS();
    //make a pointer at window level back to this object, so we can pass by reference to the nav button onclick
    window.PACESpointer = that;

    //member variables///////////////////////////////////

    //drawing parameters
    this.centerX = this.canvasWidth/2;
    this.centerY = this.canvasHeight*0.45;
    this.arrayRadius = this.canvasHeight*0.3;
    this.SiLiRadius = this.canvasHeight*0.1;

    //member functions///////////////////////////////////////////////////////////////////

    this.draw = function(frame){

    	var i, name;
    	this.context.strokeStyle = '#999999'

        //Thresholds & Rate view///////////////////////////////////////
        //once for the display canvas....
        if(window.state.subdetectorView == 1 || window.state.subdetectorView == 2){
        	for(i=0; i<5; i++){

                name = 'PAC0'+(i+1)+'XN00A';

        		this.context.save();
        		this.context.translate(this.centerX, this.centerY);
        		this.context.rotate(i*Math.PI*72/180);

                if(window.state.subdetectorView == 1) this.context.fillStyle = interpolateColor(parseHexColor(this.dataBus.PACES[name].oldThresholdColor), parseHexColor(this.dataBus.PACES[name].thresholdColor), frame/this.nFrames);
                else if(window.state.subdetectorView == 2) this.context.fillStyle = interpolateColor(parseHexColor(this.dataBus.PACES[name].oldRateColor), parseHexColor(this.dataBus.PACES[name].rateColor), frame/this.nFrames);
        		this.context.beginPath();
        		this.context.arc(0, -this.arrayRadius, this.SiLiRadius, 0, Math.PI);
        		this.context.closePath();
                this.context.fill();
        		this.context.stroke();

                name = 'PAC0'+(i+1)+'XN00B';

                if(window.state.subdetectorView == 1) this.context.fillStyle = interpolateColor(parseHexColor(this.dataBus.PACES[name].oldThresholdColor), parseHexColor(this.dataBus.PACES[name].thresholdColor), frame/this.nFrames);
                else if(window.state.subdetectorView == 2) this.context.fillStyle = interpolateColor(parseHexColor(this.dataBus.PACES[name].oldRateColor), parseHexColor(this.dataBus.PACES[name].rateColor), frame/this.nFrames);
                this.context.beginPath();
                this.context.arc(0, -this.arrayRadius, this.SiLiRadius, Math.PI, 0);
                this.context.closePath();
                this.context.fill();
                this.context.stroke();

        		this.context.restore();
        	}
        }
        //...and again for the tooltip encoding
        for(i=0; i<5; i++){
            this.TTcontext.save();
            this.TTcontext.translate(this.centerX, this.centerY);
            this.TTcontext.rotate(i*Math.PI*72/180);

            this.TTcontext.fillStyle = 'rgba('+(2*i+1)+','+(2*i+1)+','+(2*i+1)+',1)';
            this.TTcontext.beginPath();
            this.TTcontext.arc(0, -this.arrayRadius, this.SiLiRadius, 0, Math.PI);
            this.TTcontext.closePath();
            this.TTcontext.fill();

            this.TTcontext.fillStyle = 'rgba('+(2*i+2)+','+(2*i+2)+','+(2*i+2)+',1)';
            this.TTcontext.beginPath();
            this.TTcontext.arc(0, -this.arrayRadius, this.SiLiRadius, Math.PI, 0);
            this.TTcontext.closePath();
            this.TTcontext.fill();

            this.TTcontext.restore();

        }

        //HV view///////////////////////////////////////////
        if(window.state.subdetectorView == 0){
            for(i=0; i<5; i++){

                name = 'PAC0'+(i+1)+'XN00A';  //real voltage is plugged into seg. A; seg B voltage contains garbage data, don't use.

                this.context.fillStyle = interpolateColor(parseHexColor(this.dataBus.PACES[name].oldHVcolor), parseHexColor(this.dataBus.PACES[name].HVcolor), frame/this.nFrames);
                this.context.save();
                this.context.translate(this.centerX, this.centerY);
                this.context.rotate(i*Math.PI*72/180);
                this.context.beginPath();
                this.context.arc(0, -this.arrayRadius, this.SiLiRadius, 0, 2*Math.PI);
                this.context.closePath();
                this.context.fill();
                this.context.stroke();
                this.context.restore();
            }
        }

        if(frame==this.nFrames || frame==0) {
            //scale
            this.drawScale(this.context);
        }
    };


/*
    this.findCell = function(x, y){
        var imageData = this.TTcontext.getImageData(x,y,1,1);
        var index = -1;
        if(imageData.data[0] == imageData.data[1] && imageData.data[0] == imageData.data[2]) index = imageData.data[0];
        //different behvior for rate VS. HV views:
        if(window.state.subdetectorView == 1 || window.state.subdetectorView == 2 || index == -1)
            return index;
        else if(window.state.subdetectorView == 0)
            return Math.floor(index/2);
    };

    this.defineText = function(cell){
        var toolTipContent = '<br>';
        var nextLine;
        var cardIndex;
        var i;

        nextLine = 'Channel '+cell;
        toolTipContent += nextLine;

        toolTipContent += '<br><br>';
        document.getElementById(this.tooltip.ttDivID).innerHTML = toolTipContent;

        return 0;
    };

    this.update = function(){
        var i;

        //get new data
        this.fetchNewData();

        //parse the new data into colors
        for(i=0; i<this.dataBus.HV.length; i++){
            this.oldHVcolor[i] = this.HVcolor[i];
            this.HVcolor[i] = this.parseColor(this.dataBus.HV[i], 'PACES');
        }
        for(i=0; i<this.dataBus.thresholds.length; i++){
            this.oldThresholdColor[i] = this.thresholdColor[i];
            this.thresholdColor[i] = this.parseColor(this.dataBus.thresholds[i], 'PACES');
        }

        for(i=0; i<this.dataBus.rate.length; i++){
            this.oldRateColor[i] = this.rateColor[i];
            this.rateColor[i] = this.parseColor(this.dataBus.rate[i], 'PACES');
        }

        this.tooltip.update();

    };

    this.fetchNewData = function(){
        var i;

        //dummy data:
        for(i=0; i<5; i++){
            this.dataBus.HV[i] = Math.random();
        }
        for(i=0; i<10; i++){
            this.dataBus.thresholds[i] = Math.random();
            this.dataBus.rate[i] = Math.random();
        }

    };
*/
    //do an initial populate:
    this.update();
}