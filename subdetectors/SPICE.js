SPICE.prototype = Object.create(Subsystem.prototype);

function SPICE(){
    //detector name, self-pointing pointer, pull in the Subsystem template, 
    //establish a databus and create a global-scope pointer to this object:
    this.name = 'SPICE';
    var that = this;
    Subsystem.call(this);
    this.dataBus = new SPICEDS();
    //SPICE can be deployed with an S2 or S3 downstream in the chamber;
    //these are identical to BAMBINO, so we deploy BAMBINO in 'SPICE mode':
    if(ODB.SPICE.SPICEauxiliary == 'S2' || ODB.SPICE.SPICEauxiliary == 'S3'){
        //window.parameters.deployment.BAMBINO = 1;
        ODB.BAMBINO.USdeploy = 0;
        ODB.BAMBINO.DSdeploy = 1;
        ODBSet('/DashboardConfig/BAMBINO/USdeploy', 0);
        ODBSet('/DashboardConfig/BAMBINO/DSdeploy', 1);
    }
    //make a pointer at window level back to this object, so we can pass by reference to the nav button onclick
    window.SPICEpointer = that;

    //member variables///////////////////////////////////
	this.nRadial = 10;
	this.nAzimuthal = 12;
    //list of elements with distinct minima and maxima on subdetector views:
    this.subdetectors = ['SPICE'];

    //drawing parameters///////////////////////////////////////
    this.centerX = this.canvasWidth/2;
    this.centerY = this.canvasHeight*0.42;
    this.innerRadius = this.canvasHeight*0.02;
    this.outerRadius = this.canvasHeight*0.36;
    this.azimuthalStep = 2*Math.PI / this.nAzimuthal;
    this.radialStep = (this.outerRadius - this.innerRadius) / this.nRadial;

    //member functions///////////////////////////////////////////////////////////////////


    this.draw = function(frame){
    	var i=0, key, ring, sector, fill;

    	this.context.strokeStyle = '#999999';
    	
        //once for display canvas...
    	for(key in this.dataBus.SPICE){
    		sector = i%12;
    		ring = Math.floor(i/12);

            fill = colors(key, this.dataBus.SPICE, frame, this.nFrames);
            this.context.fillStyle = (fill==0xDEADBEEF) ? this.context.createPattern(window.parameters.warningFill, 'repeat') : fill;

		    this.context.beginPath();
		    this.context.arc(this.centerX, this.centerY, this.innerRadius + ring*this.radialStep, -sector*this.azimuthalStep, -(sector+1)*this.azimuthalStep, true);
    		this.context.lineTo(this.centerX + (this.innerRadius + (ring+1)*this.radialStep)*Math.cos(2*Math.PI - (sector+1)*this.azimuthalStep), this.centerY + (this.innerRadius + (ring+1)*this.radialStep)*Math.sin(2*Math.PI - (sector+1)*this.azimuthalStep));
	    	this.context.arc(this.centerX, this.centerY, this.innerRadius + (ring+1)*this.radialStep, - (sector+1)*this.azimuthalStep, - sector*this.azimuthalStep, false);
    		this.context.closePath();
    		this.context.fill();
    		this.context.stroke();

            i++;
    	}
        //...and again for tt encoding:
        if(!this.TTlayerDone){
        i=0;
            for(key in this.dataBus.SPICE){
                sector = i%12;
                ring = Math.floor(i/12);

                this.TTcontext.fillStyle = 'rgba('+this.dataBus.SPICE[key].index+','+this.dataBus.SPICE[key].index+','+this.dataBus.SPICE[key].index+',1)';
                this.TTcontext.beginPath();
                this.TTcontext.arc(this.centerX, this.centerY, this.innerRadius + ring*this.radialStep, -sector*this.azimuthalStep, -(sector+1)*this.azimuthalStep, true);
                this.TTcontext.lineTo(this.centerX + (this.innerRadius + (ring+1)*this.radialStep)*Math.cos(2*Math.PI - (sector+1)*this.azimuthalStep), this.centerY + (this.innerRadius + (ring+1)*this.radialStep)*Math.sin(2*Math.PI - (sector+1)*this.azimuthalStep));
                this.TTcontext.arc(this.centerX, this.centerY, this.innerRadius + (ring+1)*this.radialStep, - (sector+1)*this.azimuthalStep, - sector*this.azimuthalStep, false);
                this.TTcontext.closePath();
                this.TTcontext.fill();
                //suppress antialiasing problems between cells:
                this.TTcontext.strokeStyle = '#123456';
                this.TTcontext.stroke();

                i++;
            }
            this.TTlayerDone = 1;
        }

        //scale
        if(frame==this.nFrames || frame==0) this.drawScale(this.context);
    };

    
    //do an initial populate:
    //this.update();
}