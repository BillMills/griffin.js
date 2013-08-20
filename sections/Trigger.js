function Trigger(){
    var that = this;
    window.triggerPointer = that;

	this.wrapperID = window.parameters.wrapper;	//ID of wrapping div
	this.canvasID = 'TriggerCanvas';	        //ID of canvas to paint trigger on
    this.linkWrapperID = 'TriggerLinks';        //ID of div to contain clock view header
    this.sidebarID = 'TriggerSidebar';          //ID of sidebar div
    this.TTcanvasID = 'TTtriggerCanvas';

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
    this.canvasHeight = 1*$(this.wrapper).height();

    insertDOM('canvas', this.canvasID, 'monitor', 'top:' + ($('#TriggerLinks').height() + 5) +'px;', this.wrapperID, '', '')
    this.canvas = document.getElementById('TriggerCanvas');
    this.context = this.canvas.getContext('2d');
    this.canvas.setAttribute('width', this.canvasWidth);
    this.canvas.setAttribute('height', this.canvasHeight);

    //and the tt layer:
    insertDOM('canvas', this.TTcanvasID, 'monitor', 'top:' + ($('#TriggerLinks').height() + 5) +'px;', this.wrapperID, '', '')
    this.TTcanvas = document.getElementById('TTtriggerCanvas');
    this.TTcontext = this.TTcanvas.getContext('2d');
    this.TTcanvas.setAttribute('width', this.canvasWidth);
    this.TTcanvas.setAttribute('height', this.canvasHeight);

    //set up tooltip:
    this.TTcontext.fillStyle = '#123456';
    this.TTcontext.fillRect(0,0,this.canvasWidth, this.canvasHeight);
    this.tooltip = new Tooltip(this.canvasID, 'triggerTT', this.wrapperID, [], []);
    this.tooltip.obj = that;

    //right sidebar
    insertDOM('div', this.sidebarID, 'collapsableSidebar', 'float:right; height:80%;', this.wrapperID, '', '')
    //deploy right bar menu:
    deployMenu(this.sidebarID, ['detail'] , ['Filter Detail']);

    //drawing parameters:
    this.lineWeight = 4;
    this.context.lineWidth = this.lineWeight;
    this.context.fillStyle = '#444444';

    this.scaleHeight = 0.2*this.canvasHeight;

    this.arrowGutter = 0.07*this.canvasHeight;
    this.arrowOver = 0.04*this.canvasHeight;

    this.inputLinkHeight = 0.08*this.canvasHeight-this.lineWeight;
    this.inputLinkWidth = 0.8*this.canvasWidth-this.lineWeight;
    this.inputLinkX0 = 0.1*this.canvasWidth + this.lineWeight/2;
    this.inputLinkY0 = 0.72*this.canvasHeight + this.lineWeight/2;

    this.shortBufferHeight = 0.1*this.canvasHeight - this.lineWeight;
    this.shortBufferWidth = 0.15*this.canvasWidth - this.lineWeight;
    this.shortBufferX0 = 0.25*this.canvasWidth + this.lineWeight/2;
    this.shortBufferY0 = 0.55*this.canvasHeight + this.lineWeight/2;

    this.rawDataHeight = 0.18*this.canvasHeight - this.lineWeight;
    this.rawDataWidth = 0.3*this.canvasWidth - this.lineWeight;
    this.rawDataX0 = 0.1*this.canvasWidth + this.lineWeight/2;
    this.rawDataY0 = 0.3*this.canvasHeight + this.lineWeight/2;

    this.masterCoreHeight = 0.35*this.canvasHeight - this.lineWeight;
    this.masterCoreWidth = 0.3*this.canvasWidth - this.lineWeight;
    this.masterCoreX0 = 0.6*this.canvasWidth + this.lineWeight/2;
    this.masterCoreY0 = this.rawDataY0;

    this.longBufferHeight = 0.08*this.canvasHeight - this.lineWeight;
    this.longBufferWidth = 0.8*this.canvasWidth - this.lineWeight;
    this.longBufferX0 = 0.1*this.canvasWidth + this.lineWeight/2;
    this.longBufferY0 = 0.15*this.canvasHeight + this.lineWeight/2 

    this.compLinkHeight = 0.08*this.canvasHeight - this.lineWeight;
    this.compLinkWidth = 0.8*this.canvasWidth - this.lineWeight;
    this.compLinkX0 = 0.1*this.canvasWidth + this.lineWeight/2;
    this.compLinkY0 = this.lineWeight/2;

    //establish animation parameters////////////////////////////////////////////////////////////////////
    this.FPS = 30;
    this.duration = 0.5;
    this.nFrames = this.FPS*this.duration;

    //data buffers///////////////////////////

    //member functions/////////////////////////////////////////////

    this.draw = function(frame){

        //Input Link
        this.context.strokeStyle = '#000000';
        roundBox(this.context, this.inputLinkX0, this.inputLinkY0, this.inputLinkWidth, this.inputLinkHeight, 25);
        this.context.fill();
        this.context.stroke();

        //Short term Buffer
        this.context.strokeStyle = '#000000';
        roundBox(this.context, this.shortBufferX0, this.shortBufferY0, this.shortBufferWidth, this.shortBufferHeight, 25);
        this.context.fill();
        this.context.stroke();

        //Raw Data
        this.context.strokeStyle = '#000000';
        roundBox(this.context, this.rawDataX0, this.rawDataY0, this.rawDataWidth, this.rawDataHeight, 25);
        this.context.fill();
        this.context.stroke();

        //Master Core 
        this.context.strokeStyle = '#000000';
        roundBox(this.context, this.masterCoreX0, this.masterCoreY0, this.masterCoreWidth, this.masterCoreHeight, 25);
        this.context.fill();
        this.context.stroke();

        //Long term Buffer
        this.context.strokeStyle = '#000000';
        roundBox(this.context, this.longBufferX0, this.longBufferY0, this.longBufferWidth, this.longBufferHeight, 25);
        this.context.fill();
        this.context.stroke();

        //Computer Link
        this.context.strokeStyle = '#000000';
        roundBox(this.context, this.compLinkX0, this.compLinkY0, this.compLinkWidth, this.compLinkHeight, 25);
        this.context.fill();
        this.context.stroke();

        //arrows:
        //input -> short buffer
        this.context.strokeStyle = '#999999';
        arrow(this.context, 0.325*this.canvasWidth, 0.72*this.canvasHeight, 0.325*this.canvasWidth, 0.65*this.canvasHeight + this.lineWeight - this.arrowOver, 0.01*this.canvasHeight);
        this.context.stroke();

        //input -> raw data
        arrow(this.context, 0.175*this.canvasWidth, 0.72*this.canvasHeight, 0.175*this.canvasWidth, 0.48*this.canvasHeight + this.lineWeight - this.arrowOver, 0.01*this.canvasHeight);
        this.context.stroke(); 

        //short buffer -> raw data
        arrow(this.context, 0.325*this.canvasWidth, 0.55*this.canvasHeight, 0.325*this.canvasWidth, 0.48*this.canvasHeight + this.lineWeight - this.arrowOver, 0.01*this.canvasHeight);
        this.context.stroke();

        //short buffer -> master
        arrow(this.context, 0.4*this.canvasWidth, 0.6*this.canvasHeight, 0.6*this.canvasWidth - this.lineWeight + this.arrowOver, 0.6*this.canvasHeight, 0.01*this.canvasHeight);
        this.context.stroke();        

        //master -> raw data
        arrow(this.context, 0.6*this.canvasWidth, 0.4*this.canvasHeight, 0.4*this.canvasWidth+this.lineWeight - this.arrowOver, 0.4*this.canvasHeight, 0.01*this.canvasHeight);
        this.context.stroke(); 

        //raw data -> long (raw)
        arrow(this.context, 0.175*this.canvasWidth, 0.3*this.canvasHeight, 0.175*this.canvasWidth, 0.23*this.canvasHeight+this.lineWeight - this.arrowOver, 0.01*this.canvasHeight);
        this.context.stroke(); 

        //raw data -> long (data)
        arrow(this.context, 0.325*this.canvasWidth, 0.3*this.canvasHeight, 0.325*this.canvasWidth, 0.23*this.canvasHeight+this.lineWeight - this.arrowOver, 0.01*this.canvasHeight);
        this.context.stroke(); 

        //long buffer -> computer link
        arrow(this.context, 0.5*this.canvasWidth, 0.15*this.canvasHeight, 0.5*this.canvasWidth, 0.08*this.canvasHeight+this.lineWeight - this.arrowOver, 0.01*this.canvasHeight);
        this.context.stroke(); 

        //draw scale
        //if(frame==0)
        //    this.drawScale(this.context);

    };

    this.drawTTlayer = function(){
        //Input Link
        this.TTcontext.fillStyle = '#000000';
        roundBox(this.TTcontext, this.inputLinkX0, this.inputLinkY0, this.inputLinkWidth, this.inputLinkHeight, 25);
        this.TTcontext.fill();

        //Short term Buffer
        this.TTcontext.fillStyle = '#010101';
        roundBox(this.TTcontext, this.shortBufferX0, this.shortBufferY0, this.shortBufferWidth, this.shortBufferHeight, 25);
        this.TTcontext.fill();

        //Raw Data
        this.TTcontext.fillStyle = '#020202';
        roundBox(this.TTcontext, this.rawDataX0, this.rawDataY0, this.rawDataWidth, this.rawDataHeight, 25);
        this.TTcontext.fill();

        //Master Core 
        this.TTcontext.fillStyle = '#030303';
        roundBox(this.TTcontext, this.masterCoreX0, this.masterCoreY0, this.masterCoreWidth, this.masterCoreHeight, 25);
        this.TTcontext.fill();

        //Long term Buffer
        this.TTcontext.fillStyle = '#040404';
        roundBox(this.TTcontext, this.longBufferX0, this.longBufferY0, this.longBufferWidth, this.longBufferHeight, 25);
        this.TTcontext.fill();

        //Computer Link
        this.TTcontext.fillStyle = '#050505';
        roundBox(this.TTcontext, this.compLinkX0, this.compLinkY0, this.compLinkWidth, this.compLinkHeight, 25);
        this.TTcontext.fill();
    };
    //paint the tt layer exactly once :)
    this.drawTTlayer();

    this.update = function(){
        this.draw(0);
    }

    this.animate = function(){
        if(window.onDisplay == this.canvasID /*|| window.freshLoad*/) animate(this, 0);
        else this.draw(this.nFrames);
    };

    this.findCell = function(x, y){
        var imageData = this.TTcontext.getImageData(x,y,1,1), 
            index;
        
        index = -1;
        if(imageData.data[0] == imageData.data[1] && imageData.data[0] == imageData.data[2]) index = imageData.data[0];

        return index;
    };

    this.defineText = function(cell){
         document.getElementById(this.tooltip.ttDivID).innerHTML = cell;
    };
}