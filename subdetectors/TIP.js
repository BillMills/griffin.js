TIPwall.prototype = Object.create(Subsystem.prototype);

function TIPwall(){
    //detector name, self-pointing pointer, pull in the Subsystem template, 
    //establish a databus and create a global-scope pointer to this object:
    this.name = 'TIPwall';
    var that = this;
    Subsystem.call(this);
    this.dataBus = new TIPwallDS();
    //make a pointer at window level back to this object, so we can pass by reference to the nav button onclick
    window.TIPwallpointer = that;

    //drawing parameters
    //general
    this.centerX = this.canvasWidth/2;
    this.centerY = this.canvasHeight*0.4;
    this.lineWeight = 1;

    //CsI
    this.CsIy0 = this.canvasHeight*0.1;
    this.CsIcellSide = this.canvasHeight*0.12;
    this.CsIx0 = this.canvasWidth/2 - 2.5*this.CsIcellSide;

    document.getElementById('TIPwalllink').innerHTML = 'TIP Wall';

    //member functions///////////////////////////////////////////////////////////////////

    this.draw = function(frame){
    	var key, iAdj, i;

        this.context.strokeStyle = '#999999';
        this.context.lineWidth = this.lineWeight;

        //CsI wall:
        //once for display canvas...
        for(key in this.dataBus.TIPwall){
            iAdj = this.dataBus.TIPwall[key].index;
            if (iAdj>11) iAdj++;

            fill = colors(key, this.dataBus.TIPwall, frame, this.nFrames);
            this.context.fillStyle =  (fill == 0xDEADBEEF) ? this.context.createPattern(window.parameters.warningFill, 'repeat') : fill;

            this.context.fillRect(this.CsIx0 + this.CsIcellSide*(iAdj%5), this.CsIy0 + this.CsIcellSide*Math.floor(iAdj/5), this.CsIcellSide, this.CsIcellSide);
            this.context.strokeRect(this.CsIx0 + this.CsIcellSide*(iAdj%5), this.CsIy0 + this.CsIcellSide*Math.floor(iAdj/5), this.CsIcellSide, this.CsIcellSide);

    	}
        if(!this.TTlayerDone){
        //...and again for tt encoding:
            for(key in this.dataBus.TIPwall){
                i = this.dataBus.TIPwall[key].index;
                iAdj = i;
                if (iAdj>11) iAdj++;

                this.TTcontext.fillStyle = 'rgba('+i+','+i+','+i+',1)';
                this.TTcontext.fillRect(Math.round(this.CsIx0 + this.CsIcellSide*(iAdj%5)), Math.round(this.CsIy0 + this.CsIcellSide*Math.floor(iAdj/5)), Math.round(this.CsIcellSide), Math.round(this.CsIcellSide));
            }
            this.TTlayerDone = 1;
        }

        this.drawScale(this.context, frame);
    };

    //do an initial populate:
    //this.update();
}

TIPball.prototype = Object.create(Subsystem.prototype);

function TIPball(){
    //detector name, self-pointing pointer, pull in the Subsystem template, 
    //establish a databus and create a global-scope pointer to this object:
    this.name = 'TIPball';
    var that = this;
    Subsystem.call(this);
    this.dataBus = new TIPballDS();
    //make a pointer at window level back to this object, so we can pass by reference to the nav button onclick
    window.TIPballpointer = that;

    //member variables
    this.detsPerRing = [4,6,12,16,20,18,18,14,12,8];  //how many detectors are in each ring?
    this.ringTheta = [8, 17.5, 33, 48.5, 64, 79.5, 95, 111.9, 130.2, 148.5]; //average theta for each ring

    //drawing parameters
    this.cellSide = this.canvasWidth/25;
    this.gutterWidth = (0.9*(this.canvasHeight - this.scaleHeight) - 10*this.cellSide)/11; //this.cellSide*0.2;
    this.rowTop = 0.05*this.canvasHeight;  //incremented for each row.
    this.context.strokeStyle = '#999999';
    this.TTcontext.strokeStyle = '#987654';
    this.context.lineWidth = this.lineWeight;

    document.getElementById('TIPballlink').innerHTML = 'TIP Ball';

    //member functions///////////////////////////////////////////////////////////////////

    this.draw = function(frame){
        var i, j, index=0;

        if(frame==0) {
            this.context.clearRect(0,0,this.canvasWidth, this.canvasHeight-this.scaleHeight)
            this.context.textBaseline = 'top';
            this.context.font = '16px Raleway';
            this.context.fillStyle = '#999999';
            this.context.fillText('Av. Theta:', this.gutterWidth, 0);  //String.fromCharCode(0x03B8)
            this.context.fillText('Ring No.', this.canvasWidth - this.gutterWidth - this.context.measureText('Ring No.').width, 0);
        }

        for(i=0; i<this.detsPerRing.length; i++){
            for(j=0; j<this.detsPerRing[i]; j++){
                this.context.fillStyle = colors(this.dataBus.TTmap[this.DAQmap(index)], this.dataBus.TIPball, frame, this.nFrames);
                fill = colors(this.dataBus.TTmap[this.DAQmap(index)], this.dataBus.TIPball, frame, this.nFrames);
                this.context.fillStyle =  (fill == 0xDEADBEEF) ? this.context.createPattern(window.parameters.warningFill, 'repeat') : fill;
                //draw dashboard:
                this.context.fillRect(this.canvasWidth/2 - this.cellSide*this.detsPerRing[i]/2 + this.cellSide*j, this.rowTop, this.cellSide, this.cellSide);
                this.context.strokeRect(this.canvasWidth/2 - this.cellSide*this.detsPerRing[i]/2 + this.cellSide*j, this.rowTop, this.cellSide, this.cellSide);

                //and for the tooltip:
                if(!this.TTlayerDone){
                    this.TTcontext.fillStyle = 'rgba('+this.DAQmap(index)+','+this.DAQmap(index)+','+this.DAQmap(index)+',1)';
                    this.TTcontext.fillRect(this.canvasWidth/2 - this.cellSide*this.detsPerRing[i]/2 + this.cellSide*j, this.rowTop, this.cellSide, this.cellSide);
                    this.TTcontext.strokeRect(this.canvasWidth/2 - this.cellSide*this.detsPerRing[i]/2 + this.cellSide*j, this.rowTop, this.cellSide, this.cellSide);
                }

                index++;
            
            }
            //labels:
            if(frame==0){
                this.context.textBaseline = 'middle';
                this.context.font = '16px Raleway'
                this.context.fillStyle = '#999999';
                this.context.fillText(this.ringTheta[i].toFixed(1)+String.fromCharCode(0x00B0), this.gutterWidth, this.rowTop+this.cellSide/2);
                this.context.fillText(i, this.canvasWidth - this.gutterWidth - this.context.measureText(i).width, this.rowTop+this.cellSide/2);
            } 

            //move down to the next row:
            this.rowTop += this.cellSide + this.gutterWidth;
            //Ring 0 is a bit extra offset:
            if(i==0) this.rowTop += 2*this.gutterWidth;
        }
        this.rowTop = 0.05*this.canvasHeight;
        this.TTlayerDone = 1;

        if(frame==0 || frame == this.nFrames){
            this.context.textBaseline = 'alphabetic'
            this.drawScale(this.context, frame);
        }
    };

    //this.draw indexes each cell starting from 0 and counting up along each ring, starting from ring 0;
    //this function takes that index, and maps it onto the dataBus index for the channel that should be in that position.
    this.DAQmap = function(index){
        return index+1;
    };

    //do an initial populate:
    //this.update();
}