function Trigger(){

	this.wrapperID = window.parameters.wrapper;	//ID of wrapping div
	this.canvasID = 'TriggerCanvas';	        //ID of canvas to paint trigger on
    this.linkWrapperID = 'TriggerLinks';        //ID of div to contain clock view header
    this.sidebarID = 'TriggerSidebar';          //ID of sidebar div

	this.wrapper = document.getElementById(this.wrapperID);

    //add top level nav button:
    insertDOM('button', 'TriggerButton', 'navLink', '', 'statusLink', function(){swapView('TriggerLinks', 'TriggerCanvas', 'TriggerSidebar', 'TriggerButton')}, 'Trigger', '', 'button')

    //nav wrapper div
    insertDOM('div', this.linkWrapperID, 'navPanel', '', this.wrapperID, '', '')
    //nav header
    insertDOM('h1', 'TriggerLinksBanner', 'navPanelHeader', '', this.linkWrapperID, '', window.parameters.ExpName+' Trigger Status')
    insertDOM('br', 'break', '', '', this.linkWrapperID, '', '')

	//deploy a canvas for the trigger view:
    this.canvasWidth = 0.48*$(this.wrapper).width();
    this.canvasHeight = 0.8*$(this.wrapper).height();
    insertDOM('canvas', this.canvasID, 'monitor', 'top:' + ($('#TriggerLinks').height() + 5) +'px;', this.wrapperID, '', '')
    this.canvas = document.getElementById('TriggerCanvas');
    this.context = this.canvas.getContext('2d');
    this.canvas.setAttribute('width', this.canvasWidth)
    this.canvas.setAttribute('height', this.canvasHeight)

    //right sidebar
    insertDOM('div', this.sidebarID, 'Sidebar', '', this.wrapperID, '', '')

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
        if(window.onDisplay == this.canvasID /*|| window.freshLoad*/) animate(this, 0);
        else this.draw(this.nFrames);
    };
}