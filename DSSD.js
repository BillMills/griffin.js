DSSD.prototype = Object.create(Subsystem.prototype);

function DSSD(){
    var i, j;
    //detector name, self-pointing pointer, pull in the Subsystem template, 
    //establish a databus and create a global-scope pointer to this object:
    this.name = 'DSSD';
    var that = this;
    Subsystem.call(this);
    this.dataBus = new DSSDDS();
    window.DSSDpointer = that;

    //drawing parameters//////////////////////////////////////////////////////////////////////////////////

    //3 rows by 4 column grid
    this.gutterSize = 0.1*this.canvasHeight*0.8;
    this.DSSDside = 0.2*this.canvasHeight*0.8;
    this.stripWidth = this.DSSDside/16;
    this.margin = (this.canvasWidth - 1.1*this.canvasHeight*0.8)/2;

    this.context.strokeStyle = '#999999';

    //member functions////////////////////////////////////////////////////////////////////////////////////
    this.draw = function(frame){
        this.context.font = '14px Raleway'
        this.context.clearRect(0,0,this.canvasWidth,this.canvasHeight*0.8);
        
        //DSSDs:
        //column 1:
        this.drawStrips('MAD01DP', this.margin, this.gutterSize, frame);
        this.drawStrips('MAD01DN', this.margin, 2*this.gutterSize+this.DSSDside, frame);

        //column 2:
        this.drawStrips('MAD02DP', this.margin+this.gutterSize+this.DSSDside, this.gutterSize, frame);
        this.drawStrips('MAD02DN', this.margin+this.gutterSize+this.DSSDside, 2*this.gutterSize+this.DSSDside, frame);

        //column 3:
        this.drawStrips('MAD03DP', this.margin+2*this.gutterSize+2*this.DSSDside, this.gutterSize, frame);
        this.drawStrips('MAD03DN', this.margin+2*this.gutterSize+2*this.DSSDside, 2*this.gutterSize+this.DSSDside, frame);

        //column 4:
        this.drawStrips('MAD04DP', this.margin+3*this.gutterSize+3*this.DSSDside, this.gutterSize, frame);
        this.drawStrips('MAD04EP', this.margin+3*this.gutterSize+3*this.DSSDside, 2*this.gutterSize+this.DSSDside, frame);
        this.drawStrips('MAD04EN', this.margin+3*this.gutterSize+3*this.DSSDside, 3*this.gutterSize+2*this.DSSDside, frame);

        //Pads:
        var pads = ['MAD01ENXXX', 'MAD02ENXXX', 'MAD03ENXXX'], key;
        for(var i=0; i<3; i++){
            key = pads[i];
            //if(window.JSONPstore['scalar'][key]){
                //choose fill color:
                if(window.state.subdetectorView == 0) this.context.fillStyle = interpolateColor(parseHexColor(this.dataBus.DSSD[key].oldHVcolor), parseHexColor(this.dataBus.DSSD[key].HVcolor), frame/this.nFrames);
                else if(window.state.subdetectorView == 1) this.context.fillStyle = interpolateColor(parseHexColor(this.dataBus.DSSD[key].oldThresholdColor), parseHexColor(this.dataBus.DSSD[key].thresholdColor), frame/this.nFrames);
                else if(window.state.subdetectorView == 2) this.context.fillStyle = interpolateColor(parseHexColor(this.dataBus.DSSD[key].oldRateColor), parseHexColor(this.dataBus.DSSD[key].rateColor), frame/this.nFrames); 
                this.TTcontext.fillStyle = 'rgba('+this.dataBus.DSSD[key].index+','+this.dataBus.DSSD[key].index+','+this.dataBus.DSSD[key].index+',1)';

                this.context.fillRect(this.margin+i*(this.DSSDside+this.gutterSize), 3*this.gutterSize+2*this.DSSDside, this.DSSDside, this.DSSDside );
                this.context.strokeRect(this.margin+i*(this.DSSDside+this.gutterSize), 3*this.gutterSize+2*this.DSSDside, this.DSSDside, this.DSSDside );
                this.TTcontext.fillRect(this.margin+i*(this.DSSDside+this.gutterSize), 3*this.gutterSize+2*this.DSSDside, this.DSSDside, this.DSSDside );

                //draw title
                this.context.textBaseline = 'top';
                this.context.fillStyle = '#999999';
                this.context.clearRect(this.margin+i*(this.DSSDside+this.gutterSize), 3*this.gutterSize+3*this.DSSDside+2 , this.DSSDside, this.gutterSize*0.8);
                this.context.fillText(pads[i], this.margin+i*(this.DSSDside+this.gutterSize)+this.DSSDside/2 - this.context.measureText(pads[i]).width/2, 3*this.gutterSize+3*this.DSSDside+5 );
                this.context.closePath();
            //}
        }        

        //titles
        this.context.clearRect(0,0,this.canvasWidth, 0.98*this.gutterSize);
        for(i=0; i<4; i++){
            this.context.font = '16px Raleway';
            this.context.textBaseline = 'alphabetic';
            this.context.fillText('MAD0'+(i+1), this.margin + this.DSSDside/2 + i*(this.DSSDside+this.gutterSize) - this.context.measureText('MAD0'+(i+1)).width/2, this.gutterSize*0.85 )
        }

        //draw a frame around the DSSDs:
        this.context.strokeRect(this.margin-5, this.gutterSize-5, this.DSSDside+10, 2*this.DSSDside+this.gutterSize+5+25);
        this.context.strokeRect(this.margin-5 + this.DSSDside+this.gutterSize, this.gutterSize-5, this.DSSDside+10, 2*this.DSSDside+this.gutterSize+5+25);
        this.context.strokeRect(this.margin-5 + 2*this.DSSDside+2*this.gutterSize, this.gutterSize-5, this.DSSDside+10, 2*this.DSSDside+this.gutterSize+5+25);
        this.context.strokeRect(this.margin-5 + 3*this.DSSDside+3*this.gutterSize, this.gutterSize-5 + this.DSSDside+this.gutterSize, this.DSSDside+10, 2*this.DSSDside+this.gutterSize+5+25);

        if(frame==this.nFrames || frame==0) {
            //scale
            this.drawScale(this.context);
        }

    };

    //draw a DSSD array
    this.drawStrips = function(DSSDid, x0, y0, frame){
        var i=0, j,
        key, x, y,
        keys = this.genKeys(DSSDid);

        //draw strips
        for(j=0; j<keys.length; j++){
            key = keys[j];
            //choose fill color:
            if(window.state.subdetectorView == 0) this.context.fillStyle = interpolateColor(parseHexColor(this.dataBus.DSSD[key].oldHVcolor), parseHexColor(this.dataBus.DSSD[key].HVcolor), frame/this.nFrames);
            else if(window.state.subdetectorView == 1) this.context.fillStyle = interpolateColor(parseHexColor(this.dataBus.DSSD[key].oldThresholdColor), parseHexColor(this.dataBus.DSSD[key].thresholdColor), frame/this.nFrames);
            else if(window.state.subdetectorView == 2) this.context.fillStyle = interpolateColor(parseHexColor(this.dataBus.DSSD[key].oldRateColor), parseHexColor(this.dataBus.DSSD[key].rateColor), frame/this.nFrames);

            //also for TT layer:
            this.TTcontext.fillStyle = 'rgba('+this.dataBus.DSSD[key].index+','+this.dataBus.DSSD[key].index+','+this.dataBus.DSSD[key].index+',1)';

            if(DSSDid[6] == 'N'){
                x = x0;
                y = y0+this.stripWidth*i;
                this.context.fillRect(x,y,this.DSSDside,this.stripWidth);
                this.context.strokeRect(x,y,this.DSSDside,this.stripWidth);
                this.TTcontext.fillRect(x,y,this.DSSDside,this.stripWidth);
            } else if(DSSDid[6] == 'P'){
                x = x0+this.stripWidth*i;
                y = y0;
                this.context.fillRect(x,y,this.stripWidth,this.DSSDside);
                this.context.strokeRect(x,y,this.stripWidth,this.DSSDside);
                this.TTcontext.fillRect(x,y,this.stripWidth,this.DSSDside);
            }

            i++;
        }

        //draw title
        this.context.textBaseline = 'top';
        this.context.fillStyle = '#999999';
        this.context.clearRect(x0, y0+this.DSSDside+2 , this.DSSDside, this.gutterSize*0.8);
        this.context.fillText(DSSDid, x0+this.DSSDside/2 - this.context.measureText(DSSDid).width/2, y0+this.DSSDside+5 );
    };

    //generate the keys for one set of 16 DSSD strips from minimal info, return in an array:
    this.genKeys = function(DSSD){
        var i, keys = [];

        for(i=0; i<16; i++){
            keys[i] = DSSD + ((i<10) ? ('0'+i) : i ) + 'X';
        }

        return keys;
    };




}