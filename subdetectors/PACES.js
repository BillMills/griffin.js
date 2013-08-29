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

    	var i, name, fill;
    	this.context.strokeStyle = '#999999'

        //Thresholds & Rate view///////////////////////////////////////
        //once for the display canvas....
        if(window.state.subdetectorView == 1 || window.state.subdetectorView == 2){
        	for(i=0; i<5; i++){

                name = 'PAC0'+(i+1)+'XN00A';

        		this.context.save();
        		this.context.translate(this.centerX, this.centerY);
        		this.context.rotate(i*Math.PI*72/180);

                fill = colors(name, this.dataBus.PACES, frame, this.nFrames);
                this.context.fillStyle =  (fill == 0xDEADBEEF) ? this.context.createPattern(window.parameters.warningFill, 'repeat') : fill;
        		this.context.beginPath();
        		this.context.arc(0, -this.arrayRadius, this.SiLiRadius, 0, Math.PI);
        		this.context.closePath();
                this.context.fill();
        		this.context.stroke();

                name = 'PAC0'+(i+1)+'XN00B';

                fill = colors(name, this.dataBus.PACES, frame, this.nFrames);
                this.context.fillStyle =  (fill == 0xDEADBEEF) ? this.context.createPattern(window.parameters.warningFill, 'repeat') : fill;
                this.context.beginPath();
                this.context.arc(0, -this.arrayRadius, this.SiLiRadius, Math.PI, 0);
                this.context.closePath();
                this.context.fill();
                this.context.stroke();

        		this.context.restore();
        	}
        }
        //...and again for the tooltip encoding
        if(!this.TTlayerDone){
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
            this.TTlayerDone = 1;
        }

        //HV view///////////////////////////////////////////
        if(window.state.subdetectorView == 0){
            for(i=0; i<5; i++){

                name = 'PAC0'+(i+1)+'XN00A';  //real voltage is plugged into seg. A; seg B voltage contains garbage data, don't use.

                fill = colors(name, this.dataBus.PACES, frame, this.nFrames);
                this.context.fillStyle =  (fill == 0xDEADBEEF) ? this.context.createPattern(window.parameters.warningFill, 'repeat') : fill;
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

    //do an initial populate:
    this.update();
}