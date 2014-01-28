BAMBINO.prototype = Object.create(Subsystem.prototype);

function BAMBINO(spiceMode){
    //detector name, self-pointing pointer, pull in the Subsystem template, 
    //establish a databus and create a global-scope pointer to this object:
    this.name = 'BAMBINO'
    var that = this;
    Subsystem.call(this);
    this.spiceAux = (ODB.SPICE) ? true : false;

    //need special implementation of parameter dialog, since the may be deployed as BAMBINO or SPICE AUX
    this.canvas.onclick = function(event){
        var name,
            y = event.pageY - that.canvas.offsetTop - that.monitor.offsetTop;
            name = (that.spiceAux) ? "SPICE Auxilliary" : "BAMBINO";
        if(y > that.canvasHeight - that.scaleHeight)
            parameterDialogue(name, [[name, ODB[that.name][that.constructMinMaxKey(that.name)][0], ODB[that.name][that.constructMinMaxKey(that.name)][1], window.parameters.subdetectorUnit[window.state.subdetectorView], '/DashboardConfig/'+that.name+'/'+scaleType()+'[0]', '/DashboardConfig/'+that.name+'/'+scaleType()+'[1]']], window.parameters.subdetectorColors[window.state.subdetectorView]);
    }

    //make a pointer at window level back to this object, so we can pass by reference to the nav button onclick
    window.BAMBINOpointer = that;

    //change the button name if we're deploying in spice mode:
    if(this.spiceAux)
        document.getElementById('BAMBINOlink').innerHTML = 'SPICE Aux.';
    //member variables///////////////////////////////////
    this.mode = ODB.BAMBINO.mode;      //'S2' or 'S3'
    this.layers = ODB.BAMBINO.layers;

    this.dataBus = new BAMBINODS(this.mode, this.layers, this.spiceAux);

    this.nRadial = 24;
    if(this.mode=='S2')
    	this.nAzimuthal = 16;
    else if(this.mode=='S3')
        this.nAzimuthal = 32;

    //list of elements with distinct minima and maxima on subdetector views:
    this.subdetectors = ['BAMBINO'];

    //drawing parameters//////////////////////////////////////////////////
    this.centerX = this.canvasWidth/2;
    this.centerY = this.canvasHeight/2;
    this.CDinnerRadius = this.canvasWidth*0.01;
    this.CDradius = (this.layers == 1) ? this.canvasHeight*0.17 : this.canvasWidth*0.12;
    if(this.layers==1 && !(ODB.BAMBINO.USdeploy && ODB.BAMBINO.DSdeploy) )
        this.CDradius *= 1.5
    this.centerLeft = this.canvasWidth*0.25;
    this.centerRight = this.canvasWidth*0.75;
    this.centerLeftE = this.canvasWidth*0.13;
    this.centerLeftD = this.canvasWidth*0.375;
    this.centerRightD = this.canvasWidth*0.625;
    this.centerRightE = this.canvasWidth*0.87;
    this.centerTop = this.canvasHeight*0.2;
    this.centerBottom = this.canvasHeight*0.6;
    this.radialWidth = (this.CDradius - this.CDinnerRadius) / this.nRadial;
    this.azimuthalArc = 2*Math.PI / this.nAzimuthal;

    if(this.layers==1 && ODB.BAMBINO.DSdeploy==0)
        this.upstreamTitleCenter = this.canvasWidth/2;
    else if(this.layers==1)
        this.upstreamTitleCenter = this.centerLeft;
    else if(ODB.BAMBINO.DSdeploy==1)
        this.upstreamTitleCenter = (this.centerLeftD + this.centerLeftE)/2
    else
        this.upstreamTitleCenter = this.canvasWidth/2;

    if(this.layers==1 && ODB.BAMBINO.USdeploy==0)
        this.downstreamTitleCenter = this.canvasWidth/2;
    else if(this.layers==1)
        this.downstreamTitleCenter = this.centerRight;
    else if(ODB.BAMBINO.USdeploy==1)
        this.downstreamTitleCenter = (this.centerRightD + this.centerRightE)/2   
    else
        this.downstreamTitleCenter = this.canvasWidth/2;    

    //which detectors are present: [upstream layer D, downstream layer D, upstream layer E, downstream layer E];
    this.detPresent = [0,0,0,0]; 
    if(ODB.BAMBINO.USdeploy){
        this.detPresent[0] = 1
        if(this.layers == 2){
            this.detPresent[2] = 1   
        }
    }
    if(ODB.BAMBINO.DSdeploy){
        this.detPresent[1] = 1
        if(this.layers == 2){
            this.detPresent[3] = 1   
        }
    }    

    //member functions///////////////////////////////////////////////////////////////////

    this.draw = function(frame){

    	var i, j, m, x0, y0, name, fill;

    	this.context.strokeStyle = '#999999';
        this.TTcontext.strokeStyle = '#123456';

        //each layer -> 1 or 2 disks (up and downstream) times 2 sides (front and back).
        //index i counts upstream/layerD/front, upstream/layerD/back, downstream/layerD/front, downstream/layerD/back, etc incrementing layers.
    	for(i=0; i<4*this.layers; i++){ 
            //bail out if this iteration's disk isn't there:
            if(!this.detPresent[Math.floor(i/2)]) continue;

            //determine disk image center
            //upstream layer D front || back:
            if(i==0 || i==1){
                if(this.layers == 2){
                    x0 = this.centerLeftD; y0 = (i==0) ? this.centerTop : this.centerBottom;
                } else if(ODB.BAMBINO.DSdeploy){
                    x0 = this.centerLeft; y0 = (i==0) ? this.centerTop : this.centerBottom;
                } else{
                    x0 = (i==0) ? this.centerLeft : this.centerRight; y0 = this.canvasHeight*0.4;
                }
            } else if(i==2 || i==3){ //downstream layer D front || back:
                if(this.layers == 2 && !ODB.BAMBINO.USdeploy){
                    x0 = this.centerLeftD; y0 = (i==2) ? this.centerTop : this.centerBottom;
                } else if(this.layers==2){
                    x0 = this.centerRightD; y0 = (i==2) ? this.centerTop : this.centerBottom;
                } else if(ODB.BAMBINO.USdeploy){
                    x0 = this.centerRight; y0 = (i==2) ? this.centerTop : this.centerBottom;
                } else{
                    x0 = (i==2) ? this.centerLeft : this.centerRight; y0 = this.canvasHeight*0.4;
                }
            } else if(i==4 || i==5){ //upstream layer E front || back:
                if(ODB.BAMBINO.DSdeploy){
                    x0 = this.centerLeftE; y0 = (i==4) ? this.centerTop : this.centerBottom;
                } else{
                    x0 = this.centerRightD; y0 = (i==4) ? this.centerTop : this.centerBottom;
                }
            } else if(i==6 || i==7){ //downstream layer E front || back:
                if(ODB.BAMBINO.USdeploy){
                    x0 = this.centerRightE; y0 = (i==6) ? this.centerTop : this.centerBottom;
                } else{
                    x0 = this.centerRightD; y0 = (i==6) ? this.centerTop : this.centerBottom;
                }
            }

            //fronts    
	    	if(i%2 == 0){

	    		for(j=0; j<this.nRadial; j++){
                    //name = ((this.spiceAux) ? 'SP' : 'BA' ) + ((this.mode=='S2') ? 'Z0' : 'E0') + ( (this.spiceAux) ? 0 : Math.floor((i%4)/2)+1) + this.dataBus.waypoints[Math.floor(i/4)] + 'P' +( (j<10) ? '0'+j : j ) + 'X';
                    if(i==2 || i==6) //downstream fronts count 0 on the inside to 23 on the outside
                        name = ((this.spiceAux) ? 'SP' : 'BA' ) + ((this.mode=='S2') ? 'Z0' : 'E0') + ( (this.spiceAux) ? 0 : Math.floor((i%4)/2)+1) + this.dataBus.waypoints[Math.floor(i/4)] + 'P' + ((this.nRadial-1-j < 10) ? '0'+(this.nRadial-1-j) : this.nRadial-1-j) + 'X';
                    else //upstream fronts count 0 on the outside to 23 on the inside
                        name = ((this.spiceAux) ? 'SP' : 'BA' ) + ((this.mode=='S2') ? 'Z0' : 'E0') + ( (this.spiceAux) ? 0 : Math.floor((i%4)/2)+1) + this.dataBus.waypoints[Math.floor(i/4)] + 'P' +( (j<10) ? '0'+j : j ) + 'X';
                    
    				this.context.beginPath()
                    fill = colors(name, this.dataBus.BAMBINO, frame, this.nFrames);
                    this.context.fillStyle = (fill==0xDEADBEEF) ? this.context.createPattern(window.parameters.warningFill, 'repeat') : fill;
	    			this.context.arc(x0, y0, this.CDradius - j*this.radialWidth, 0, 2*Math.PI);
	    			this.context.closePath();
    				this.context.fill();
	    			this.context.stroke();

                    //and again for tooltip:
                    if(!this.TTlayerDone){
                        this.TTcontext.fillStyle = 'rgba('+this.dataBus.BAMBINO[name].index+','+this.dataBus.BAMBINO[name].index+','+this.dataBus.BAMBINO[name].index+',1)';
                        this.TTcontext.beginPath();
                        this.TTcontext.arc(x0, y0, this.CDradius - j*this.radialWidth, 0, 2*Math.PI);
                        this.TTcontext.closePath();
                        this.TTcontext.fill();
                        this.TTcontext.stroke();
                    }
    			}
                //clear inner circle:
                this.context.fillStyle = '#333333';
                this.context.beginPath();
                this.context.arc(x0, y0, this.CDradius - j*this.radialWidth, 0, 2*Math.PI);
                this.context.closePath();
                this.context.fill(); 
                //and again in TT:
                if(!this.TTlayerDone){
                    this.TTcontext.fillStyle = '#987654';
                    this.TTcontext.beginPath();
                    this.TTcontext.arc(x0, y0, this.CDradius - j*this.radialWidth, 0, 2*Math.PI);
                    this.TTcontext.closePath();
                    this.TTcontext.fill();
    		    }	
            //backs
    		} else {
    
	    		for(j=0; j<this.nAzimuthal; j++){
                    name = ((this.spiceAux) ? 'SP' : 'BA' ) + ((this.mode=='S2') ? 'Z0' : 'E0') + ( (this.spiceAux) ? 0 : Math.floor((i%4)/2)+1) + this.dataBus.waypoints[Math.floor(i/4)] + 'N' +( (j<10) ? '0'+j : j ) + 'X';
    				this.context.beginPath()
                    fill = colors(name, this.dataBus.BAMBINO, frame, this.nFrames);
                    this.context.fillStyle = (fill==0xDEADBEEF) ? this.context.createPattern(window.parameters.warningFill, 'repeat') : fill;
                    
                    this.context.moveTo(x0 + this.CDinnerRadius*Math.cos(j*this.azimuthalArc), y0 - this.CDinnerRadius*Math.sin(j*this.azimuthalArc));
                    this.context.arc(x0,y0, this.CDinnerRadius, -j*this.azimuthalArc, -(j+1)*this.azimuthalArc, true);
                    this.context.lineTo(x0 + this.CDradius*Math.cos((j+1)*this.azimuthalArc), y0 - this.CDradius*Math.sin((j+1)*this.azimuthalArc));
                    this.context.arc(x0,y0, this.CDradius, -(j+1)*this.azimuthalArc, -j*this.azimuthalArc, false);
    				this.context.closePath();
    				this.context.fill();
	    			this.context.stroke();
                    
                    //and again for tooltip:
                    if(!this.TTlayerDone){
                        this.TTcontext.fillStyle = 'rgba('+this.dataBus.BAMBINO[name].index+','+this.dataBus.BAMBINO[name].index+','+this.dataBus.BAMBINO[name].index+',1)';
                        this.TTcontext.beginPath();
                        this.TTcontext.moveTo(x0 + this.CDinnerRadius*Math.cos(j*this.azimuthalArc), y0 - this.CDinnerRadius*Math.sin(j*this.azimuthalArc));
                        this.TTcontext.arc(x0,y0, this.CDinnerRadius, -j*this.azimuthalArc, -(j+1)*this.azimuthalArc, true);
                        this.TTcontext.lineTo(x0 + this.CDradius*Math.cos((j+1)*this.azimuthalArc), y0 - this.CDradius*Math.sin((j+1)*this.azimuthalArc));
                        this.TTcontext.arc(x0,y0, this.CDradius, -(j+1)*this.azimuthalArc, -j*this.azimuthalArc, false);
                        this.TTcontext.closePath();
                        this.TTcontext.fill();
                        this.TTcontext.stroke();                  
                    }

    			}

    		}
    	}

        if(frame==this.nFrames || frame==0) {
            //scale
            this.drawScale(this.context);
    	    //titles
            this.context.clearRect(0,0.80*this.canvasHeight,this.canvasWidth,0.20*this.canvasHeight - this.scaleHeight);
            this.context.fillStyle = '#999999';
            this.context.font="24px 'Orbitron'";
            if(ODB.BAMBINO.USdeploy) this.context.fillText('Upstream', this.upstreamTitleCenter - this.context.measureText('Upstream').width/2, 0.85*this.canvasHeight);
            if(ODB.BAMBINO.DSdeploy) this.context.fillText('Downstream', this.downstreamTitleCenter - this.context.measureText('Downstream').width/2, 0.85*this.canvasHeight);
        }

        this.TTlayerDone = 1;

    };

    //do an initial populate:
    //this.update();

}