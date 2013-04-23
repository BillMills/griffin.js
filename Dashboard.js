function Dashboard(){

	this.wrapperID = window.parameters.wrapper;    //ID of wrapping div
	this.canvasID = 'DashboardCanvas';	           //ID of canvas to paint dashboard on
    this.linkWrapperID = 'DashboardLinks';         //ID of div to contain clock view header
    this.sidebarID = 'DashboardSidebar';           //ID of dashboard sidebar div

	this.wrapper = document.getElementById(this.wrapperID);

    //deploy the sidebar
    this.deploySidebar = function(){
        //wrapper div
        insertDOM('div', this.sidebarID, 'Sidebar', '', this.wrapperID, '', '')
        document.getElementById(this.sidebarID).setAttribute('align', 'left');
    }
    this.deploySidebar();

    //add top level nav button:
    insertDOM('button', 'DashboardButton', 'navLinkDown', '', 'statusLink', function(){swapView('DashboardLinks', 'DashboardCanvas', 'DashboardSidebar', 'DashboardButton')}, 'Dashboard', '', 'button')

    //nav wrapper div
    insertDOM('div', this.linkWrapperID, 'navPanel', '', this.wrapperID, '', '')
    //dashboard is the initial view, put the navbar on top:
    document.getElementById(this.linkWrapperID).setAttribute('style', 'z-index:1; opacity:1;')

    //nav header
    insertDOM('h1', 'DashboardLinksBanner', 'navPanelHeader', '', this.linkWrapperID, '', window.parameters.ExpName+' Dashboard')
    insertDOM('br', 'break', '', '', this.linkWrapperID, '', '')

	//deploy a canvas for the dashboard view:
    this.canvasWidth = 0.48*$(this.wrapper).width();
    this.canvasHeight = 0.8*$(this.wrapper).height();
    insertDOM('canvas', this.canvasID, 'monitor', 'position:absolute; left:24%; top:' + ($('#DashboardLinks').height() + 5) +'px;', this.wrapperID, '', '')
    this.canvas = document.getElementById('DashboardCanvas');
    this.context = this.canvas.getContext('2d');
    this.canvas.setAttribute('width', this.canvasWidth)
    this.canvas.setAttribute('height', this.canvasHeight)

/*
    //determine appropriate font size for header banner:
    var bannerFontSize = 72;

    while(document.getElementById('DashboardLinksBanner').offsetWidth > document.getElementById(this.canvasID).offsetWidth){
        bannerFontSize--;
        $('#DashboardLinksBanner').css('font-size', bannerFontSize);
    }
*/
    //drawing parameters:

    //establish animation parameters////////////////////////////////////////////////////////////////////
    this.FPS = 30;
    this.duration = 0.5;
    this.nFrames = this.FPS*this.duration;

    //data buffers///////////////////////////

    //member functions/////////////////////////////////////////////

    this.draw = function(frame){

    };

    this.animate = function(){
        if(window.onDisplay == this.canvasID || window.freshLoad) animate(this, 0);
        else this.draw(this.nFrames);
    };

}