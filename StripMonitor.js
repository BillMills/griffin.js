function StripMonitor(cvas){

	this.canvas = cvas;				//the canvas on which to draw the strip monitor

	this.context = document.getElementById(cvas);

    //establish animation parameters:
    this.FPS = 30;
    this.duration = 0.5;
    this.nFrames = this.FPS*this.duration;

    //draw the empty wireframe
    this.wireframe(){
    	
    }

	//draw the monitor at a particular frame in its current transition
	this.draw(frame){

	}

	//update the info for each cell in the monitor
	this.update(){

	}

}