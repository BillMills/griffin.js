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

            this.context.fillStyle = colors(key, this.dataBus.TIPwall, frame, this.nFrames);

            this.context.fillRect(this.CsIx0 + this.CsIcellSide*(iAdj%5), this.CsIy0 + this.CsIcellSide*Math.floor(iAdj/5), this.CsIcellSide, this.CsIcellSide);
            this.context.strokeRect(this.CsIx0 + this.CsIcellSide*(iAdj%5), this.CsIy0 + this.CsIcellSide*Math.floor(iAdj/5), this.CsIcellSide, this.CsIcellSide);

    	}
        //...and again for tt encoding:
        for(key in this.dataBus.TIPwall){
            i = this.dataBus.TIPwall[key].index;
            iAdj = i;
            if (iAdj>11) iAdj++;

            this.TTcontext.fillStyle = 'rgba('+i+','+i+','+i+',1)';
            this.TTcontext.fillRect(Math.round(this.CsIx0 + this.CsIcellSide*(iAdj%5)), Math.round(this.CsIy0 + this.CsIcellSide*Math.floor(iAdj/5)), Math.round(this.CsIcellSide), Math.round(this.CsIcellSide));
        }

        this.drawScale(this.context, frame);
    };

    //do an initial populate:
    this.update();
}