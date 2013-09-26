SCEPTAR.prototype = Object.create(Subsystem.prototype);

function SCEPTAR(){
    //detector name, self-pointing pointer, pull in the Subsystem template, 
    //establish a databus and create a global-scope pointer to this object:
    this.name = 'SCEPTAR';
    var that = this;
    Subsystem.call(this);
    //establish which of USSCEPTAR, DSSCEPTAR, and ZDS are present:
    this.SCEPTARconfig = [window.parameters.ODB.SCEPTAR.USdeploy, window.parameters.ODB.SCEPTAR.DSdeploy%2, Math.floor(window.parameters.ODB.SCEPTAR.DSdeploy/2)];
    this.dataBus = new SCEPTARDS(this.SCEPTARconfig);
    //make a pointer at window level back to this object, so we can pass by reference to the nav button onclick
    window.SCEPTARpointer = that;

    //member variables///////////////////////////////////
    this.config = this.SCEPTARconfig;  //subsystems on: [upstream sceptar, downstream sceptar, downstream ZDS]
    //list of elements with distinct minima and maxima on subdetector views:
    this.subdetectors = ['SCEPTAR'];
    if(window.parameters.ODB.SCEPTAR.DSdeploy == 2) this.subdetectors[1] = 'ZDS';

    //set up scale adjust dialog:
    this.canvas.onclick = function(event){
        var y = event.pageY - that.canvas.offsetTop - that.monitor.offsetTop;
        if(y > that.canvasHeight - that.scaleHeight){
            if(that.config[2]) parameterDialogue(that.name, [['SCEPTAR', window.parameters.ODB[that.name][that.constructMinMaxKey('SCEPTAR')][0], window.parameters.ODB[that.name][that.constructMinMaxKey('SCEPTAR')][1], window.parameters.subdetectorUnit[window.state.subdetectorView], '/DashboardConfig/SCEPTAR/'+scaleType()+'[0]', '/DashboardConfig/SCEPTAR/'+scaleType()+'[1]'],   ['ZDS', window.parameters.ODB[that.name][that.constructMinMaxKey('ZDS')][0], window.parameters.ODB[that.name][that.constructMinMaxKey('ZDS')][1], window.parameters.subdetectorUnit[window.state.subdetectorView], '/DashboardConfig/ZDS/'+scaleType()+'[0]', '/DashboardConfig/ZDS/'+scaleType()+'[1]'] ], window.parameters.subdetectorColors[window.state.subdetectorView]);
            else parameterDialogue(that.name, [['SCEPTAR', window.parameters.ODB[that.name][that.constructMinMaxKey('SCEPTAR')][0], window.parameters.ODB[that.name][that.constructMinMaxKey('SCEPTAR')][1], window.parameters.subdetectorUnit[window.state.subdetectorView], '/DashboardConfig/SCEPTAR/'+scaleType()+'[0]', '/DashboardConfig/SCEPTAR/'+scaleType()+'[1]']], window.parameters.subdetectorColors[window.state.subdetectorView]);

        }
    }

    //make the button say ZDS if only ZDS is deployed:
    if(this.config[2]==1 && this.config[0]==0 && this.config[1]==0)
        document.getElementById('SCEPTARlink').innerHTML = 'ZDS';

    //drawing parameters///////////////////////////////////////
    this.ZDSradius = this.canvasHeight*0.5 / 4; 
    this.ZDScenterX = this.canvasWidth*0.5 + (this.config[0] +this.config[1] + this.config[2] - 1)*this.canvasWidth*0.25;
    this.ZDScenterY = 0.4*this.canvasHeight;
    this.SCEPTARx0 = this.canvasWidth*0.1;
    this.SCEPTARy0 = this.canvasHeight*0.1;

    this.SCEPTARspoke = this.canvasHeight/5;
    this.USSCx0 = (this.config[0] + this.config[1] + this.config[2] == 2) ? 0.25*this.canvasWidth : 0.5*this.canvasWidth;
    this.USSCy0 = 0.4*this.canvasHeight;
    this.DSSCx0 = (this.config[0] + this.config[1] + this.config[2] == 2) ? 0.75*this.canvasWidth : 0.5*this.canvasWidth;
    this.DSSCy0 = 0.4*this.canvasHeight;

    //member functions///////////////////////////////////////////////////////////////////


    this.draw = function(frame){
    	var i, row, col, fill;

        //once for display view...
    	this.context.strokeStyle = '#999999';
        //upstream SCEPTAR
        if(this.config[0] == 1){
            this.drawSceptar('upstream', frame, this.context);
        }
        //downstream SCEPTAR
        if(this.config[1] == 1){
            this.drawSceptar('downstream', frame, this.context);
        }
    	//ZDS
        if(this.config[2] == 1){
            fill = colors('ZDS01XN00X', this.dataBus.SCEPTAR, frame, this.nFrames);
            this.context.fillStyle = (fill==0xDEADBEEF) ? this.context.createPattern(window.parameters.warningFill, 'repeat') : fill;
        	this.context.beginPath();
    	    this.context.arc(this.ZDScenterX, this.ZDScenterY, this.ZDSradius, 0, 2*Math.PI);
        	this.context.closePath();
        	this.context.fill();
    	    this.context.stroke();
        }

        //...and again for tt encoding:
        if(!this.TTlayerDone){
            //upstream SCEPTAR
            if(this.config[0] == 1){
                this.drawSceptar('upstream', frame, this.TTcontext);
            }
            //downstream SCEPTAR
            if(this.config[1] == 1){
                this.drawSceptar('downstream', frame, this.TTcontext);
            }
            //ZDS
            if(this.config[2] == 1){
                //antialiasing hackaround:
                this.TTcontext.beginPath();
                this.TTcontext.arc(this.ZDScenterX, this.ZDScenterY, 1.05*this.ZDSradius, 0, 2*Math.PI);
                this.TTcontext.closePath();
                this.TTcontext.fillStyle = '#123456';
                this.TTcontext.fill();
                //end hack around
                this.TTcontext.beginPath();
                this.TTcontext.arc(this.ZDScenterX, this.ZDScenterY, this.ZDSradius, 0, 2*Math.PI);
                this.TTcontext.closePath();
                this.TTcontext.fillStyle = 'rgba('+21+','+21+','+21+',1)';
                this.TTcontext.fill();
            }
            this.TTlayerDone = 1;
        }
   

    	//titles
        this.context.clearRect(0,this.SCEPTARy0 + 2.5*this.SCEPTARspoke + 10,this.canvasWidth,this.canvasHeight - (this.scaleHeight+this.SCEPTARy0 + 2.5*this.SCEPTARspoke + 10));
        this.context.fillStyle = '#999999';
        this.context.font="24px 'Orbitron'";
        if(this.config[0] == 1){
            this.context.fillText('Upstream SCEPTAR', this.USSCx0 - this.context.measureText('Upstream SCEPTAR').width/2, this.USSCy0 + 1.4*this.SCEPTARspoke);
        }
        if(this.config[1] == 1){
            this.context.fillText('Downstream SCEPTAR', this.DSSCx0 - this.context.measureText('Downstream SCEPTAR').width/2, this.DSSCy0 + 1.4*this.SCEPTARspoke);
        }
        if(this.config[2] == 1){
            this.context.fillText('ZDS', this.ZDScenterX - this.context.measureText('ZDS').width/2, this.ZDScenterY + 1.4*this.SCEPTARspoke);    
        }

        //scale
        if(frame==this.nFrames || frame==0) this.drawScale(this.context);
	
    };

    this.drawSceptar = function(side, frame, context){
        var x0, y0, i, indexStart, name;
        if(side == 'upstream'){
            x0 = this.USSCx0;
            y0 = this.USSCy0;
            indexStart = 0;
        } else if(side == 'downstream'){
            x0 = this.DSSCx0;
            y0 = this.DSSCy0;
            indexStart = 10;
        }

        for(i=0; i<10; i++){
            name = (indexStart+i+1<10) ? 'SEP0'+(indexStart+i+1)+'XN00X' : 'SEP'+(indexStart+i+1)+'XN00X'

            if(context == this.context){
                fill = colors(name, this.dataBus.SCEPTAR, frame, this.nFrames);
                this.context.fillStyle = (fill==0xDEADBEEF) ? this.context.createPattern(window.parameters.warningFill, 'repeat') : fill;
            }
            else if(context == this.TTcontext) context.fillStyle = '#123456'; //anti-antialiasing
            context.save();
            context.translate(x0, y0);
            context.rotate((i%5)*Math.PI/180*72);
            context.beginPath();
            context.moveTo(0,0);
            context.lineTo(0, -this.SCEPTARspoke/2*( 2 - Math.floor(i/5) ) );
            context.rotate(Math.PI/180*72);
            context.lineTo(0, -this.SCEPTARspoke/2*( 2 - Math.floor(i/5) ) );
            context.closePath();
            context.fill();
            if(context == this.context) context.stroke();
            context.restore();

            if(context == this.TTcontext){
                context.fillStyle = 'rgba('+(indexStart+1+i)+','+(indexStart+1+i)+','+(indexStart+1+i)+',1)';
                context.save();
                context.translate(x0, y0);
                context.rotate((i%5)*Math.PI/180*72);
                context.beginPath();
                context.moveTo(0,0);
                context.lineTo(0, -this.SCEPTARspoke/2*( 2 - Math.floor(i/5) ) );
                context.rotate(Math.PI/180*72);
                context.lineTo(0, -this.SCEPTARspoke/2*( 2 - Math.floor(i/5) ) );
                context.closePath();
                context.fill();
                context.restore();
            }
        }   
    }

    //do an initial populate:
    //this.update();
}