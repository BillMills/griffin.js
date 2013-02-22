function Dashboard(monitor){

	this.wrapperID = monitor;			    //ID of wrapping div
	this.canvasID = 'DashboardCanvas';	    //ID of canvas to paint dashboard on
    this.linkWrapperID = 'DashboardLinks';  //ID of div to contain clock view header

	this.wrapper = document.getElementById(monitor);

    //add top level nav button:
    insertButton('DashboardButton', 'navLinkDown', "javascript:swapView('DashboardLinks', 'DashboardCanvas', 'DashboardSidebar', 'DashboardButton')", 'statusLink', 'Dashboard');

    //nav wrapper div
    insertDiv(this.linkWrapperID, 'navPanel', this.wrapperID);
    //dashboard is the initial view, put the navbar on top:
    document.getElementById(this.linkWrapperID).setAttribute('style', 'z-index:1; opacity:1;')

    //nav header
    insertH1('DashboardLinksBanner', 'navPanelHeader', this.linkWrapperID, 'GRIFFIN Dashboard');

    insertLinebreak(this.linkWrapperID);

	//deploy a canvas for the dashboard view:
    this.canvasWidth = 0.48*$(this.wrapper).width();
    this.canvasHeight = 0.8*$(this.wrapper).height();
    insertCanvas(this.canvasID, 'monitor', 'position:absolute; left:24%; top:' + ($('#DashboardLinks').height() + 5) +'px;', this.canvasWidth, this.canvasHeight, monitor)
    this.canvas = document.getElementById('DashboardCanvas');
    this.context = this.canvas.getContext('2d');

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