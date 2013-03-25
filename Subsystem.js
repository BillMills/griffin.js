//the subsystem class from which all subsystems will inherit.
function Subsystem(){
	/*
	var keys = [];
	for(var key in document.defaultView.parameters){
		keys[keys.length] = key
	}
	alert(keys)
	*/
	//this.monitorID = window.parameters.wrapper;		//div ID of wrapper div
	this.linkWrapperID = 'SubsystemLinks';	        //ID of div wrapping subsystem navigation links
	this.sidebarID = 'SubsystemSidebar';			//ID of right sidebar for this object
	this.topNavID = 'SubsystemsButton';				//ID of top level nav button

    this.FPS = 30;
    this.duration = 0.5;
    this.nFrames = this.FPS*this.duration;


}