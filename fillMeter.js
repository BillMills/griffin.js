//meter that fills to show the level of a scalar, with decorations.
function FillMeter(cvas, width, min, max, unit){

    this.oldFillLevel = 0;
    this.fillLevel = 0;
    this.min = min;
    this.max = max;
    this.width = width;
    this.unit = unit;
    this.xPos = 0;  //left margin of value label

    //fetch canvas:
    this.canvas = document.getElementById(cvas);
    this.context = this.canvas.getContext('2d');

    //set canvas dimensions
    this.canvas.width = width*1.2;
    this.canvas.height = 45;//0.15*width;

    //center of left end semicircle:
    this.leftX0 = width*0.1;
    this.leftY0 = this.canvas.height / 2;
    //meter half-thickness:
    this.radius = 5;
    //center of right end semicircle:
    this.rightX0 = width*0.8;
    this.rightY0 = this.canvas.height / 2;
    //boundary of fill line:
    this.fillTo = this.fillLevel*(this.rightX0 - this.leftX0) + this.leftX0;

    //animation parameters:
    this.duration = 0.4; //seconds
    this.FPS = 30;
    this.nFrames = this.duration*this.FPS;

    //set up empty meter:
       //draw bar shadow:
        this.context.lineWidth = 1;
        this.context.beginPath();
        this.context.arc(this.leftX0+1, this.leftY0+1, this.radius, Math.PI/2, 3*Math.PI/2);
        this.context.arc(this.rightX0+1, this.rightY0+1, this.radius, 3*Math.PI/2, Math.PI/2);
        this.context.closePath();
        this.context.stroke();

        //draw empty bar:
        this.context.lineWidth = 1;
        this.context.beginPath();
        this.context.arc(this.leftX0, this.leftY0, this.radius, Math.PI/2, 3*Math.PI/2);
        this.context.arc(this.rightX0, this.rightY0, this.radius, 3*Math.PI/2, Math.PI/2);
        this.context.closePath();
        this.context.stroke();    

    //change the fill level and related parameters
    this.setNewFillLevel = function(newLevel){
        this.oldFillLevel = this.fillLevel;
        this.fillLevel = this.fillLevel = (newLevel - this.min) / (this.max - this.min);
        this.fillTo = newLevel*(this.rightX0 - this.leftX0) + this.leftX0;
    };

    //draw a meter at frame <frame> when transitioning between this.oldFillLevel and this.fillLevel:
    this.draw = function(frame){
    
        //fill level for this frame:
        var frameFill = this.oldFillLevel + (this.fillLevel - this.oldFillLevel) * frame / this.nFrames;

        //determine fill coordinate:
        var fillLimit = frameFill*(this.rightX0 - this.leftX0) + this.leftX0;

        //draw empty bar:
        this.context.lineWidth = 1;
        this.context.fillStyle = 'rgba(255,255,255,1)';
        this.context.beginPath();
        this.context.arc(this.leftX0, this.leftY0, this.radius, Math.PI/2, 3*Math.PI/2);
        this.context.arc(this.rightX0, this.rightY0, this.radius, 3*Math.PI/2, Math.PI/2);
        this.context.closePath();
        this.context.fill();
        this.context.stroke();

        //draw bar fill:
        this.context.lineWidth = 1;
        this.context.fillStyle = 'rgba(0,0,255,0.3)';
        this.context.beginPath();
        this.context.arc(this.leftX0, this.leftY0, this.radius, Math.PI/2, 3*Math.PI/2);
        this.context.arc(fillLimit, this.rightY0, this.radius, 3*Math.PI/2, Math.PI/2);
        this.context.closePath();
        this.context.fill();    

        //quote value above fill position:
        this.context.clearRect(0,0, this.rightX0+this.width, this.rightY0-this.radius);
        this.context.fillStyle = 'rgba(255,255,255,0.9)';
        this.context.font = "20px Raleway"; 
        fillString = (frameFill*(this.max-this.min)+this.min).toFixed(3)+' '+this.unit;
        this.xPos = fillLimit - this.context.measureText(fillString).width/2;
        if(this.xPos < this.leftX0) {
            this.xPos = this.leftX0
        }
        if(this.xPos + this.context.measureText(fillString).width > this.rightX0){
            this.xPos = this.rightX0 - this.context.measureText(fillString).width;
        }
        this.context.fillText(fillString, this.xPos, this.leftY0-1.7*this.radius);

        //quote meter max to right of meter:
        this.context.font = '12px Raleway';
        this.context.clearRect(this.rightX0+this.radius, 0, this.width, 45);
        this.context.fillText('Max: '+this.max.toFixed(0)+' '+this.unit, this.rightX0 + 1.5*this.radius, this.rightY0 + 5)
    };

    //wrapper for transition from old state to new state via this.animate:
    this.update = function(newLevel){

        //set up member variables for animation:
        this.setNewFillLevel(newLevel);

        //animate:
        animate(this, 0);

    };

}