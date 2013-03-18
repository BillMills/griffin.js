function Clock(){

	this.wrapperID = window.parameters.wrapper;	    //ID of wrapping div
	this.canvasID = 'ClockCanvas';		            //ID of canvas to paint clock on
    this.linkWrapperID = 'ClockLinks';              //ID of div to contain clock view header
    this.sidebarID = 'ClockSidebar';                //ID of div to contain clock sidebar

	this.wrapper = document.getElementById(this.wrapperID);

    //add top level nav button:
    insertDOM('button', 'ClockButton', 'navLink', '', 'statusLink', "javascript:swapView('ClockLinks', 'ClockCanvas', 'ClockSidebar', 'ClockButton')", 'Clock')

    //nav wrapper div
    insertDOM('div', this.linkWrapperID, 'navPanel', '', this.wrapperID, '', '')
    //nav header
    insertDOM('h1', 'ClockLinksBanner', 'navPanelHeader', '', this.linkWrapperID, '', 'GRIFFIN Clock Status')
    insertDOM('br', 'break', '', '', this.linkWrapperID, '', '')

	//deploy a canvas for the clock view:
    this.canvasWidth = 0.48*$(this.wrapper).width();
    this.canvasHeight = 0.8*$(this.wrapper).height();
    insertDOM('canvas', this.canvasID, 'monitor', 'top:' + ($('#ClockLinks').height() + 5) +'px;', this.wrapperID, '', '')
    this.canvas = document.getElementById('ClockCanvas');
    this.context = this.canvas.getContext('2d');
    this.canvas.setAttribute('width', this.canvasWidth);
    this.canvas.setAttribute('height', this.canvasHeight);

    //right sidebar
    insertDOM('div', this.sidebarID, 'Sidebar', '', this.wrapperID, '', '')

    //drawing parameters:
    this.margin = 5;
    this.topMargin = this.canvasHeight*0.1;
    this.masterWidth = this.canvasWidth - 2*this.margin;
    this.masterHeight = this.canvasHeight*0.2;
    this.clockCenterY = this.topMargin + this.masterHeight/2;
    this.clockRadius = this.masterHeight*0.8/2;
    this.secondHandLength = this.clockRadius*0.9;
    this.clockCenterX = this.margin + this.clockRadius*1.4;
    this.slavesCellSide = this.canvasHeight*0.1;
    this.slavesRows = 4;
    this.slavesColumns = 6;
    this.slavesLeft = (this.canvasWidth - this.slavesColumns*this.slavesCellSide) / 2;
    this.slavesTop = this.topMargin + this.masterHeight + this.slavesCellSide;
    //establish animation parameters////////////////////////////////////////////////////////////////////
    this.FPS = 30;
    this.duration = 0.5;
    this.nFrames = this.FPS*this.duration;

    //data buffers///////////////////////////
    this.secondHand = 0;

    //member functions/////////////////////////////////////////////
    this.draw = function(frame){
    	var i, j, secondAngle;

    	this.context.clearRect(0,0,this.canvasWidth, this.canvasHeight);

    	this.context.strokeStyle = '#999999';

    	//master
    	//frame
    	this.context.strokeRect(this.margin, this.topMargin, this.masterWidth, this.masterHeight);
    	//clock
    	this.secondHand++;
    	secondAngle = (this.secondHand%60)*6*Math.PI/180;
    	this.context.beginPath();
    	this.context.arc(this.clockCenterX, this.clockCenterY, this.clockRadius, 0, 2*Math.PI);
    	this.context.moveTo(this.clockCenterX, this.clockCenterY);
    	this.context.lineTo(this.clockCenterX + this.secondHandLength*Math.cos(secondAngle), this.clockCenterY + this.secondHandLength*Math.sin(secondAngle) );
    	this.context.closePath();
    	this.context.stroke();

    	//slaves
    	for(i=0; i<this.slavesRows; i++){
    		for(j=0; j<this.slavesColumns; j++){
    			this.context.strokeRect(this.slavesLeft + j*this.slavesCellSide, this.slavesTop + i*this.slavesCellSide, this.slavesCellSide, this.slavesCellSide);
    		}
    	}

    	//titles
        this.context.fillStyle = '#999999';
        this.context.font="24px 'Orbitron'";
        this.context.fillText('Master', this.margin, this.topMargin - 10);
        this.context.fillText('Slaves', this.slavesLeft, this.slavesTop - 10);

    };

    this.animate = function(){
        if(window.onDisplay == this.canvasID || window.freshLoad) animate(this, 0);
        else this.draw(this.nFrames);
    };
}