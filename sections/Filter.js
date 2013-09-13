//TODO: both the Filter and Cycle pages make use of a draggable badge system of defining groups and relationships.  The code for this
//is currently pretty spaghetti, should factor out a reusable class.

function Filter(){
    var that = this,
    i;
    window.filterPointer = that;

	this.wrapperID = window.parameters.wrapper;	//ID of wrapping div
	this.canvasID = 'FilterCanvas';	        //ID of canvas to paint filter on
    this.linkWrapperID = 'FilterLinks';        //ID of div to contain clock view header
    this.sidebarID = 'FilterSidebar';          //ID of sidebar div
    this.TTcanvasID = 'TTfilterCanvas';
    this.filterSystems = ['GRI', 'PAC', 'DTE'] //subsytems available to participate in the filter, dummy for now
    this.filterSystemsNames = ['GRIFFIN', 'PACES', 'DANTE'];  //human readable version

	this.wrapper = document.getElementById(this.wrapperID);

    //add top level nav button:
    insertDOM('button', 'FilterButton', 'navLink', '', 'statusLink', function(){swapView('FilterLinks', 'FilterCanvas', 'FilterSidebar', 'FilterButton')}, 'Filter', '', 'button')

    //nav wrapper div
    insertDOM('div', this.linkWrapperID, 'navPanel', '', this.wrapperID, '', '')
    //nav header
    insertDOM('h1', 'FilterLinksBanner', 'navPanelHeader', '', this.linkWrapperID, '', window.parameters.ExpName+' Filter Status')
    insertDOM('br', 'break', '', '', this.linkWrapperID, '', '')

	//deploy a canvas for the filter view:
    this.canvasWidth = 0.48*$(this.wrapper).width();
    this.canvasHeight = 1*$(this.wrapper).height();

    insertDOM('canvas', this.canvasID, 'monitor', 'top:' + ($('#FilterLinks').height() + 5) +'px;', this.wrapperID, '', '')
    this.canvas = document.getElementById('FilterCanvas');
    this.context = this.canvas.getContext('2d');
    this.canvas.setAttribute('width', this.canvasWidth);
    this.canvas.setAttribute('height', this.canvasHeight);

    //and the tt layer:
    insertDOM('canvas', this.TTcanvasID, 'monitor', 'top:' + ($('#FilterLinks').height() + 5) +'px;', this.wrapperID, '', '')
    this.TTcanvas = document.getElementById('TTfilterCanvas');
    this.TTcontext = this.TTcanvas.getContext('2d');
    this.TTcanvas.setAttribute('width', this.canvasWidth);
    this.TTcanvas.setAttribute('height', this.canvasHeight);

    //set up tooltip:
    this.TTcontext.fillStyle = '#123456';
    this.TTcontext.fillRect(0,0,this.canvasWidth, this.canvasHeight);
    this.tooltip = new Tooltip(this.canvasID, 'filterTT', this.wrapperID, [], []);
    this.tooltip.obj = that;

    this.canvas.onclick =   function(event){
                                var x,y, cell;
                                x = event.pageX - that.canvas.offsetLeft - that.wrapper.offsetLeft;
                                y = event.pageY - that.canvas.offsetTop - that.wrapper.offsetTop;
                                cell = that.findCell(x,y);
                                //draw and swap out if user clicked on a valid clover
                                if(cell > -1 && cell < 6){
                                    that.populateSidebar(cell);
                                }
                                /*
                                //set up scale range dialogue:
                                if(y>that.canvasHeight - that.scaleHeight){
                                    parameterDialogue('DAQ', [ ['Transfer Rate', window.parameters.DAQminima[1], window.parameters.DAQmaxima[1], 'Bps', '/DashboardConfig/DAQ/transferMinTopView', '/DashboardConfig/DAQ/transferMaxTopView' ], ['Filter Rate', window.parameters.DAQminima[0], window.parameters.DAQmaxima[0], 'Hz', '/DashboardConfig/DAQ/rateMinTopView', '/DashboardConfig/DAQ/rateMaxTopView']  ], window.parameters.colorScale[window.DAQpointer.DAQcolor]);
                                } else if(y<that.masterBottom){
                                    parameterDialogue('Device Summary',[ ['Trig Requests', window.parameters.DAQminima[4], window.parameters.DAQmaxima[5], 'Hz', '/DashboardConfig/DAQ/rateMinMaster', '/DashboardConfig/DAQ/rateMaxMaster'], ['Data Rate', window.parameters.DAQminima[5], window.parameters.DAQmaxima[5], 'Bps', '/DashboardConfig/DAQ/transferMinMaster', '/DashboardConfig/DAQ/transferMaxMaster']  ]);
                                }
                                */
                            };

    //right sidebar
    insertDOM('div', this.sidebarID, 'collapsableSidebar', 'float:right; height:80%;', this.wrapperID, '', '')
    //deploy right bar menu:
    deployMenu(this.sidebarID, ['detail'] , ['Filter Detail'] );
    //start with menu open:
    document.getElementById('detailarrow').onclick();

    //edit filter button
    insertDOM('input', 'detailContentEditFilters', 'bigButton', 'width:auto; height:auto; padding:0.5em; margin:1em', 'detailContent', '', '', '', 'button', 'Edit Filters');
    document.getElementById('detailContentEditFilters').onclick = function(){
        swapView('editFilterLinks', 'editFilterCanvas', 'editFilterSidebar', 'FilterButton')
    }

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

    this.textMargin = 20;

    //establish animation parameters////////////////////////////////////////////////////////////////////
    this.FPS = 30;
    this.duration = 0.5;
    this.nFrames = this.FPS*this.duration;

    //data buffers///////////////////////////

    //member functions/////////////////////////////////////////////

    this.draw = function(frame){
        var fontSize;

        this.context.fillStyle = '#444444';
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

        //Filter Core 
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

        //labels
        if(frame == 0){
            this.context.fillStyle = '#EEEEEE';
            fontSize = fitFont(this.context, 'Short-Term', this.shortBufferWidth-this.textMargin*2);
            this.context.font = fontSize+'px Raleway';
            this.context.textBaseline = 'middle';

            //Short-term buffer:
            this.context.fillText('Short-Term', this.shortBufferX0+this.textMargin, this.shortBufferY0+this.textMargin);
            this.context.fillText('Buffer', this.shortBufferX0+this.textMargin, this.shortBufferY0+this.textMargin+fontSize);
            if(fontSize < 16)
                this.context.font = '16px Raleway';
            //Input link:
            this.context.fillText('Input Link', this.inputLinkX0+this.textMargin, this.inputLinkY0 + this.inputLinkHeight/2);
            //Raw Data
            this.context.fillText('Raw Data', this.rawDataX0+this.textMargin, this.rawDataY0+1.2*this.textMargin);
            //Filter Core
            this.context.fillText('Filter Core', this.masterCoreX0 + this.masterCoreWidth - this.context.measureText('Filter Core').width -this.textMargin, this.masterCoreY0+1.2*this.textMargin);
            //Long Term Buffer
            this.context.fillText('Long-Term Buffer', this.longBufferX0+this.longBufferWidth - this.context.measureText('Long-Term Buffer').width - this.textMargin, this.longBufferY0+this.longBufferHeight/2);
            //Computer Link
            this.context.fillText('Computer Link', this.compLinkX0+this.compLinkWidth - this.context.measureText('Computer Link').width - this.textMargin, this.compLinkY0+this.compLinkHeight/2);            
        }

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

        //Filter Core 
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
    };

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

    this.populateSidebar = function(cell){
        //Input Link
        if(cell==0){
            insertDOM('p', 'detailContentMessage', '', '', 'detailContent', '', 'Input Link');
        //Short Term Buffer
        } else if(cell==1){
            insertDOM('p', 'detailContentMessage', '', '', 'detailContent', '', 'Short-Term Buffer');
        //Raw Data
        } else if(cell==2){
            insertDOM('p', 'detailContentMessage', '', '', 'detailContent', '', 'Raw Data');
        //Filter Core
        } else if(cell==3){
            insertDOM('p', 'detailContentMessage', '', '', 'detailContent', '', 'Filter Core');
        //Long Term Buffer
        } else if(cell==4){
            insertDOM('p', 'detailContentMessage', '', '', 'detailContent', '', 'Long-Term Buffer');
        //Computer Link
        } else if(cell==5){
            insertDOM('p', 'detailContentMessage', '', '', 'detailContent', '', 'Computer Link');
        }
    };

    //start with filter core sidebar displayed:
    this.populateSidebar(3);
    //deploy the editFilter page
    window.editFilter = new editFilter(this.filterSystems, this.filterSystemsNames)
}








function editFilter(filterSystems, filterSystemsNames){
    var that = this,
    i;
    window.filterEditPointer = that;
    this.nInterstreams = 0;

    this.wrapperID = window.parameters.wrapper; //ID of wrapping div
    this.canvasID = 'editFilterCanvas';         //ID of canvas to paint filter on
    this.linkWrapperID = 'editFilterLinks';        //ID of div to contain clock view header
    this.sidebarID = 'editFilterSidebar';          //ID of sidebar div
    this.filterSystems = filterSystems; //subsytems available to participate in the filter
    this.filterSystemsNames = filterSystemsNames //human readable filterSystems

    this.wrapper = document.getElementById(this.wrapperID);

    //nav wrapper div
    insertDOM('div', this.linkWrapperID, 'navPanel', '', this.wrapperID, '', '')
    //nav header
    insertDOM('h1', 'editFilterLinksBanner', 'navPanelHeader', '', this.linkWrapperID, '', 'Edit Filter')
    insertDOM('br', 'break', '', '', this.linkWrapperID, '', '')
    //nav buttons
    insertDOM('button', 'commitFilter', 'navLink', '', this.linkWrapperID, function(){buildFilter()}, 'Commit Filter and Return', '', 'button');
    insertDOM('button', 'abortFilter', 'navLink', '', this.linkWrapperID, function(){}, 'Abandon Changes and Return', '', 'button');
    insertDOM('button', 'resetFilter', 'navLink', '', this.linkWrapperID, function(){}, 'Start Over', '', 'button');
    insertDOM('br', 'break', '', '', this.linkWrapperID);
    insertDOM('label', 'filterNameLabel', '', 'margin-left:10px;', this.linkWrapperID, '', 'Name this Filter: ');
    insertDOM('input', 'filterName', '', '', this.linkWrapperID, '', '', '', 'text', 'newFilter');
    document.getElementById('filterNameLabel').setAttribute('for', 'filterName');
    insertDOM('br', 'break', '', '', this.linkWrapperID);

    //div structure for drag and drop area: right panel for detector palete, two-div column for Single Stream and Interstream Filters:
    insertDOM('div', 'editFilterWrapper', '', 'width:'+0.48*$(this.wrapper).width()+'px; display:inline-block;', this.linkWrapperID, '', '');
    insertDOM('div', 'filterWrap', '', 'float:left; width:79%', 'editFilterWrapper', '', '');  //79 kind of kludgy, to accommodate margins.
    insertDOM('div', 'singleStreamFilters', 'filterDiv', 'width:100%; padding-left:1em; padding-right:1em;', 'filterWrap', '', '');
    insertDOM('h2', 'singleStreamTitle', '', 'text-align:center; margin:0.5em;', 'singleStreamFilters', '', 'Single-Stream Filters');
    insertDOM('h5', 'singleStreamHelp', '', 'text-align:center; margin:0px; margin-bottom:1em;', 'singleStreamFilters', '', 'Drag a detector here to define a single-stream filter condition.');
    insertDOM('div', 'interstreamFilters', 'filterDiv', 'width:100%; padding-left:1em; padding-right:1em; text-align:center;', 'filterWrap', '', '');
    insertDOM('h2', 'interstreamTitle', '', 'text-align:center; margin:0.5em;', 'interstreamFilters', '', 'Interstream Filters');
    insertDOM('div', 'filterPalete', 'filterDiv', 'width:20%; float:right; text-align:center; padding-top:1em; max-height:500px; overflow:scroll;', 'editFilterWrapper', '', '');
    document.getElementById('singleStreamFilters').addEventListener('dragover', dragOver, false);
    document.getElementById('singleStreamFilters').addEventListener('drop', handleDrop, false);

    //Interstream section needs a button to spawn a new filter group:
    insertDOM('button', 'spawnInterstream', 'navLink', '', 'interstreamFilters', function(){
        insertDOM('div', 'interstream'+window.filterEditPointer.nInterstreams, 'interstreamDiv', '', 'interstreamFilters', '', '');
        document.getElementById('interstream'+window.filterEditPointer.nInterstreams).addEventListener('dragover', dragOver, false);
        document.getElementById('interstream'+window.filterEditPointer.nInterstreams).addEventListener('drop', handleDrop, false);
        //what does this box mean?:
        insertDOM('h5', 'interstreamHelp'+window.filterEditPointer.nInterstreams, '', 'text-align:center; margin:0px; margin-bottom:1em;', 'interstream'+window.filterEditPointer.nInterstreams, '', 'Drag detectors here to AND them together in a multi-stream filter condition.');
        //off button
        insertDOM('button', 'deleteInterstream'+window.filterEditPointer.nInterstreams, 'deleteButton', '', 'interstream'+window.filterEditPointer.nInterstreams, function(){
            var element = document.getElementById(this.id);
            element.parentNode.parentNode.removeChild(element.parentNode);
        }, String.fromCharCode(0x2573), '', 'button');

        window.filterEditPointer.nInterstreams++;
    }, 'New Interstream Filter', '', 'button');

    //deploy a dummy canvas for the filter view:
    this.canvasWidth = 0// 0.48*$(this.wrapper).width();
    this.canvasHeight = 0 //1*$(this.wrapper).height();
    insertDOM('canvas', this.canvasID, 'monitor', 'top:' + ($('#editFilterLinks').height() + 5) +'px;', this.wrapperID, '', '')
    this.canvas = document.getElementById('editFilterCanvas');
    this.context = this.canvas.getContext('2d');
    this.canvas.setAttribute('width', this.canvasWidth);
    this.canvas.setAttribute('height', this.canvasHeight);

    //right sidebar
    insertDOM('div', this.sidebarID, 'collapsableSidebar', 'float:right; height:80%;', this.wrapperID, '', '')
    //deploy right bar menu:
    deployMenu(this.sidebarID, this.filterSystems, this.filterSystemsNames);    

    //inject inputs into filterable subsystem tabs:
    for(i=0; i<this.filterSystemsNames.length; i++){
        //prescale input + label
        insertDOM('input', this.filterSystems[i]+'ContentPS', '', '', this.filterSystems[i]+'Content', '', '', '', 'number');
        insertDOM('label', this.filterSystems[i]+'ContentPSlabel', '', '', this.filterSystems[i]+'Content', '', 'Prescale Factor');
        document.getElementById(this.filterSystems[i]+'ContentPSlabel').setAttribute('for', this.filterSystems[i]+'ContentPS');
        insertDOM('br', 'break', '', '', this.filterSystems[i]+'Content');

        //coinc multiplicity input + label
        insertDOM('input', this.filterSystems[i]+'ContentMulti', '', '', this.filterSystems[i]+'Content', '', '', '', 'number');
        insertDOM('label', this.filterSystems[i]+'ContentMultiLabel', '', '', this.filterSystems[i]+'Content', '', 'Coinc. Multiplicity');
        document.getElementById(this.filterSystems[i]+'ContentMultiLabel').setAttribute('for', this.filterSystems[i]+'ContentMulti');
        insertDOM('br', 'break', '', '', this.filterSystems[i]+'Content');

        //prescale input + label
        insertDOM('input', this.filterSystems[i]+'ContentCoincWindow', '', '', this.filterSystems[i]+'Content', '', '', '', 'number');
        insertDOM('label', this.filterSystems[i]+'ContentCoincWindowLabel', '', '', this.filterSystems[i]+'Content', '', 'Coinc. Window [ns]');
        document.getElementById(this.filterSystems[i]+'ContentCoincWindowLabel').setAttribute('for', this.filterSystems[i]+'ContentCoincWindow');
    }

    //inject detector options into palete
    this.badgeWidth = document.getElementById('filterPalete').offsetWidth*0.9;
    this.badgeHeight = 100;
    //DANTE
    deployBadgeCanvas(this.badgeWidth, this.badgeHeight, 'DANTEPaleteBadge', 'filterPalete', dante, [this.badgeWidth/2, this.badgeHeight*0.35, this.badgeHeight*0.25, '#999999'], 'DANTE', true);
    //PACES
    deployBadgeCanvas(this.badgeWidth, this.badgeHeight, 'PACESPaleteBadge', 'filterPalete', paces, [this.badgeWidth/2, this.badgeHeight*0.35, this.badgeHeight*0.25, this.badgeHeight*0.25/3], 'PACES', true);
    //SCEPTAR
    deployBadgeCanvas(this.badgeWidth, this.badgeHeight, 'SCEPTARPaleteBadge', 'filterPalete', sceptar, [this.badgeWidth/2, this.badgeHeight*0.35, this.badgeHeight*0.25], 'SCEPTAR', true);
    //HPGE
    deployBadgeCanvas(this.badgeWidth, this.badgeHeight, 'HPGEPaleteBadge', 'filterPalete', tigress, [this.badgeWidth/2, this.badgeHeight*0.35, this.badgeHeight*0.25], 'HPGE', true); 
    //ZDS
    deployBadgeCanvas(this.badgeWidth, this.badgeHeight, 'ZDSPaleteBadge', 'filterPalete', zds, [this.badgeWidth/2, this.badgeHeight*0.35, this.badgeHeight*0.25], 'ZDS', true);
    //SPICE
    deployBadgeCanvas(this.badgeWidth, this.badgeHeight, 'SPICEPaleteBadge', 'filterPalete', spice, [this.badgeWidth/2, this.badgeHeight*0.35, this.badgeHeight*0.25], 'SPICE', true);
    //DESCANT
    deployBadgeCanvas(this.badgeWidth, this.badgeHeight, 'DESCANTPaleteBadge', 'filterPalete', descant, [this.badgeWidth/2, this.badgeHeight*0.35, this.badgeHeight*0.12], 'DESCANT', true);
    //BAMBINO
    deployBadgeCanvas(this.badgeWidth, this.badgeHeight, 'BAMBINOPaleteBadge', 'filterPalete', bambino, [this.badgeWidth*0.45, this.badgeWidth*0.55, this.badgeHeight/3, this.badgeHeight*0.6, this.badgeHeight*0.12], 'BAMBINO', true);
    //SHARC
    deployBadgeCanvas(this.badgeWidth, this.badgeHeight, 'SHARCPaleteBadge', 'filterPalete', sharc, [this.badgeWidth/2, this.badgeHeight*0.35, this.badgeWidth*0.3, this.badgeHeight*0.7], 'SHARC', true);
    //TIPwall
    deployBadgeCanvas(this.badgeWidth, this.badgeHeight, 'TIPwallPaleteBadge', 'filterPalete', tipWall, [this.badgeWidth/2, this.badgeHeight*0.35, this.badgeHeight*0.7], 'TIP Wall', true);
    //TIPball
    deployBadgeCanvas(this.badgeWidth, this.badgeHeight, 'TIPballPaleteBadge', 'filterPalete', tipBall, [this.badgeWidth/2, this.badgeHeight*0.35, this.badgeHeight*0.35], 'TIP Ball', true);
}

//drag and drop handler functions:
function dragStart(event){
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', this.id.slice(0, this.id.indexOf('PaleteBadge')));
}

function handleDrop(event){
    event.stopPropagation();

    if(event.dataTransfer.getData('text/plain') == 'DANTE' && !this.querySelector('#DANTEfilterBadge'+this.id) ){
        deployFilterBadge('DANTEfilterBadge', this.id, deployBadgeCanvas.bind(null, window.filterEditPointer.badgeWidth, window.filterEditPointer.badgeHeight, 'DANTEfilterBadgeCanvas', 'DANTEfilterBadge'+this.id, dante, [window.filterEditPointer.badgeWidth/2, window.filterEditPointer.badgeHeight*0.35, window.filterEditPointer.badgeHeight*0.25, '#999999'], 'DANTE', false));
    } else if(event.dataTransfer.getData('text/plain') == 'PACES' && !this.querySelector('#PACESfilterBadge'+this.id) ){
        deployFilterBadge('PACESfilterBadge', this.id, deployBadgeCanvas.bind(null,window.filterEditPointer.badgeWidth, window.filterEditPointer.badgeHeight, 'PACESfilterBadgeCanvas', 'PACESfilterBadge'+this.id, paces, [window.filterEditPointer.badgeWidth/2, window.filterEditPointer.badgeHeight*0.35, window.filterEditPointer.badgeHeight*0.25, window.filterEditPointer.badgeHeight*0.25/3], 'PACES', false));
    } else if(event.dataTransfer.getData('text/plain') == 'SCEPTAR' && !this.querySelector('#SCEPTARfilterBadge'+this.id) ){
        deployFilterBadge('SCEPTARfilterBadge', this.id, deployBadgeCanvas.bind(null,window.filterEditPointer.badgeWidth, window.filterEditPointer.badgeHeight, 'SCEPTARfilterBadgeCanvas', 'SCEPTARfilterBadge'+this.id, sceptar, [window.filterEditPointer.badgeWidth/2, window.filterEditPointer.badgeHeight*0.35, window.filterEditPointer.badgeHeight*0.25], 'SCEPTAR', false));
    } else if(event.dataTransfer.getData('text/plain') == 'HPGE' && !this.querySelector('#HPGEfilterBadge'+this.id) ){
        deployFilterBadge('HPGEfilterBadge', this.id, deployBadgeCanvas.bind(null, window.filterEditPointer.badgeWidth, window.filterEditPointer.badgeHeight, 'HPGEfilterBadgeCanvas', 'HPGEfilterBadge'+this.id, tigress, [window.filterEditPointer.badgeWidth/2, window.filterEditPointer.badgeHeight*0.35, window.filterEditPointer.badgeHeight*0.25], 'HPGE', false));
    } else if(event.dataTransfer.getData('text/plain') == 'ZDS' && !this.querySelector('#ZDSfilterBadge'+this.id) ){
        deployFilterBadge('ZDSfilterBadge', this.id, deployBadgeCanvas.bind(null, window.filterEditPointer.badgeWidth, window.filterEditPointer.badgeHeight, 'ZDSfilterBadgeCanvas', 'ZDSfilterBadge'+this.id, zds, [window.filterEditPointer.badgeWidth/2, window.filterEditPointer.badgeHeight*0.35, window.filterEditPointer.badgeHeight*0.25], 'ZDS', false));
    } else if(event.dataTransfer.getData('text/plain') == 'SPICE' && !this.querySelector('#SPICEfilterBadge'+this.id) ){
        deployFilterBadge('SPICEfilterBadge', this.id, deployBadgeCanvas.bind(null, window.filterEditPointer.badgeWidth, window.filterEditPointer.badgeHeight, 'SPICEfilterBadgeCanvas', 'SPICEfilterBadge'+this.id, spice, [window.filterEditPointer.badgeWidth/2, window.filterEditPointer.badgeHeight*0.35, window.filterEditPointer.badgeHeight*0.25], 'SPICE', false));
    } else if(event.dataTransfer.getData('text/plain') == 'DESCANT' && !this.querySelector('#DESCANTfilterBadge'+this.id) ){
        deployFilterBadge('DESCANTfilterBadge', this.id, deployBadgeCanvas.bind(null, window.filterEditPointer.badgeWidth, window.filterEditPointer.badgeHeight, 'DESCANTfilterBadgeCanvas', 'DESCANTfilterBadge'+this.id, descant, [window.filterEditPointer.badgeWidth/2, window.filterEditPointer.badgeHeight*0.35, window.filterEditPointer.badgeHeight*0.12], 'DESCANT', false));
    } else if(event.dataTransfer.getData('text/plain') == 'BAMBINO' && !this.querySelector('#BAMBINOfilterBadge'+this.id) ){
        deployFilterBadge('BAMBINOfilterBadge', this.id, deployBadgeCanvas.bind(null, window.filterEditPointer.badgeWidth, window.filterEditPointer.badgeHeight, 'BAMBINOfilterBadgeCanvas', 'BAMBINOfilterBadge'+this.id, bambino, [window.filterEditPointer.badgeWidth*0.45, window.filterEditPointer.badgeWidth*0.55, window.filterEditPointer.badgeHeight/3, window.filterEditPointer.badgeHeight*0.6, window.filterEditPointer.badgeHeight*0.12], 'BAMBINO', false));
    } else if(event.dataTransfer.getData('text/plain') == 'SHARC' && !this.querySelector('#SHARCfilterBadge'+this.id) ){
        deployFilterBadge('SHARCfilterBadge', this.id, deployBadgeCanvas.bind(null, window.filterEditPointer.badgeWidth, window.filterEditPointer.badgeHeight, 'SHARCfilterBadgeCanvas', 'SHARCfilterBadge'+this.id, sharc, [window.filterEditPointer.badgeWidth/2, window.filterEditPointer.badgeHeight*0.35, window.filterEditPointer.badgeWidth*0.3, window.filterEditPointer.badgeHeight*0.7], 'SHARC', false));
    } else if(event.dataTransfer.getData('text/plain') == 'TIPwall' && !this.querySelector('#TIPwallfilterBadge'+this.id) ){
        deployFilterBadge('TIPwallfilterBadge', this.id, deployBadgeCanvas.bind(null, window.filterEditPointer.badgeWidth, window.filterEditPointer.badgeHeight, 'TIPwallfilterBadgeCanvas', 'TIPwallfilterBadge'+this.id, tipWall, [window.filterEditPointer.badgeWidth/2, window.filterEditPointer.badgeHeight*0.35, window.filterEditPointer.badgeHeight*0.7], 'TIP Wall', false));
    } else if(event.dataTransfer.getData('text/plain') == 'TIPball' && !this.querySelector('#TIPballfilterBadge'+this.id) ){
        deployFilterBadge('TIPballfilterBadge', this.id, deployBadgeCanvas.bind(null, window.filterEditPointer.badgeWidth, window.filterEditPointer.badgeHeight, 'TIPballfilterBadgeCanvas', 'TIPballfilterBadge'+this.id, tipBall, [window.filterEditPointer.badgeWidth/2, window.filterEditPointer.badgeHeight*0.35, window.filterEditPointer.badgeHeight*0.35], 'TIP Ball', false));
    } else {
        console.log(event.dataTransfer.getData('text/plain'));
    }
    return false;
}

function dragOver(event){
    event.stopPropagation();
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
    return false;
}

//create a badge canvas
function deployBadgeCanvas(width, height, id, wrapperID, paintThumb, thumbArgs, label, draggable){
    var canvas, context;

    //bail out if canvas already exists:
    if(document.getElementById(id+wrapperID)) return;

    insertDOM('canvas', id+wrapperID, '', 'width:'+this.badgeWidth+'px; height:'+this.badgeHeight+'px;', wrapperID, '', '');
    canvas = document.getElementById(id+wrapperID);
    context = canvas.getContext('2d');
    canvas.setAttribute('width', width);
    canvas.setAttribute('height', height);
    context.font = Math.min(14, fitFont(context, label, width))+'px Raleway';
    context.fillStyle = '#999999';
    context.strokeStyle = '#999999';
    paintThumb.apply(null, [context].concat(thumbArgs));
    context.fillStyle = '#FFFFFF';
    context.fillText(label, width/2 - context.measureText(label).width/2, height-10);    
    //palete
    if(draggable){
        canvas.setAttribute('draggable', true);
        canvas.addEventListener('dragstart', dragStart, false);
    //filters
    } else{
        closeX(context, width - 10, 10, 7 );
        canvas.onclick = function(event){

                                var element, x,y, pointer,
                                    coords = this.relMouseCoords(event),
                                    width = (window.onDisplay == 'editFilterCanvas') ? window.filterEditPointer.badgeWidth : window.cyclePointer.badgeWidth;
                                x = coords.x;
                                y = coords.y;
                                if( Math.pow(width-10 - x, 2) + Math.pow(y-10,2) < 49 ){
                                    if(window.onDisplay == 'editFilterCanvas')
                                        this.parentNode.parentNode.removeChild(this.parentNode);
                                    else if(window.onDisplay == 'cycleCanvas'){
                                        pointer = this.parentNode;
                                        this.parentNode.removeChild(this);
                                        if(pointer.innerHTML == '')
                                            pointer.innerHTML = window.cyclePointer.helpMessage;
                                            pointer.setAttribute('class', 'delayCycleContent');
                                    }
                                }
                            };
    }
}

//create the full badge for the filter divs
function deployFilterBadge(id, wrapperID, createCanvas){
    insertDOM('div', id+wrapperID, 'filterBadge', '', wrapperID, '', '');
    document.getElementById(id+wrapperID).filterTag = filterTag(id.slice(0, id.indexOf('filterBadge')));
    createCanvas();
    createOptionScroll(id+wrapperID, id+wrapperID+'scroll', ['Singles', 'Coincidence', 'Prescaled'], document.getElementById(id+wrapperID).offsetWidth);

    //update help messages:
    if(wrapperID == 'singleStreamFilters')
        document.getElementById('singleStreamHelp').innerHTML = 'Any of these:';
    else if(wrapperID.slice(0,11) == 'interstream')
        document.getElementById('interstreamHelp'+wrapperID.slice(11, wrapperID.length)).innerHTML = 'or ALL of these:'
}

//parse the detector names into their tokens for the filter definition
function filterTag(detName){
    if(detName == 'DANTE')
        return 'DAB';
    else if(detName == 'PACES')
        return 'PAC';
    else if(detName == 'SCEPTAR')
        return 'SEP';
    else if(detName == 'HPGE')
        return 'GRG';
    else if(detName == 'ZDS')
        return 'ZDS';
    else if(detName == 'SPICES')
        return 'SPI';
    else if(detName == 'DESCANT')
        return 'DSC';
    else if(detName == 'BAMBINO')
        return 'BAE';
    else if(detName == 'SHARC')
        return 'SHB';
    else if(detName == 'TIPwall')
        return 'TPW';
    else if(detName == 'TIPball')
        return 'TPC';
    else
        return detName;
}

//parse whatever is currently declared into a filter string definition
function buildFilter(){
    var i, j,
        singleStreamFilters = document.getElementById('singleStreamFilters'),
        filterString = '';

    //standalone filter streams:
    for(i=0; i<singleStreamFilters.childNodes.length; i++){
        if(singleStreamFilters.childNodes[i].filterTag)
            filterString += singleStreamFilters.childNodes[i].filterTag + '_';
    }

    //interstream filters:

}