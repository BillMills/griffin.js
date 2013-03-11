function Trigger(monitor){

	this.wrapperID = monitor;			  //ID of wrapping div
	this.canvasID = 'TriggerCanvas';	  //ID of canvas to paint trigger on
    this.linkWrapperID = 'TriggerLinks';  //ID of div to contain clock view header
    this.sidebarID = 'TriggerSidebar';    //ID of sidebar div

	this.wrapper = document.getElementById(monitor);

    //add top level nav button:
    insertButton('TriggerButton', 'navLink', "javascript:swapView('TriggerLinks', 'TriggerCanvas', 'TriggerSidebar', 'TriggerButton')", 'statusLink', 'Trigger');

    //nav wrapper div
    insertDiv(this.linkWrapperID, 'navPanel', monitor);
    //nav header
    insertH1('TriggerLinksBanner', 'navPanelHeader', this.linkWrapperID, 'GRIFFIN Trigger Status');
    insertLinebreak(this.linkWrapperID);

	//deploy a canvas for the trigger view:
    this.canvasWidth = 0.48*$(this.wrapper).width();
    this.canvasHeight = 0.8*$(this.wrapper).height();
    insertCanvas(this.canvasID, 'monitor', 'top:' + ($('#TriggerLinks').height() + 5) +'px;', this.canvasWidth, this.canvasHeight, monitor);
    this.canvas = document.getElementById('TriggerCanvas');
    this.context = this.canvas.getContext('2d');

    //right sidebar
    insertDiv(this.sidebarID, 'Sidebar', monitor);

    //drawing parameters:

    //establish animation parameters////////////////////////////////////////////////////////////////////
    this.FPS = 30;
    this.duration = 0.5;
    this.nFrames = this.FPS*this.duration;

    //data buffers///////////////////////////

    //member functions/////////////////////////////////////////////

    this.draw = function(frame){

    };
}