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
    injectDOM('button', 'FilterButton', 'statusLink', {
        'class' : 'navLink',
        'innerHTML' : 'Filter',
        'type' : 'button',
        'onclick' : function(){swapView('FilterLinks', 'FilterCanvas', 'FilterSidebar', 'FilterButton')}
    });

    //nav wrapper div
    injectDOM('div', this.linkWrapperID, this.wrapperID, {'class':'navPanel'});
    //nav header
    injectDOM('h1', 'FilterLinksBanner', this.linkWrapperID, {'class':'navPanelHeader', 'innerHTML':ODB.topLevel.expName+' Filter Status'});
    injectDOM('br', 'break', this.linkWrapperID, {});

	//deploy a canvas for the filter view:
    this.canvasWidth = 0.48*$(this.wrapper).width();
    this.canvasHeight = 1*$(this.wrapper).height();

    injectDOM('canvas', this.canvasID, this.wrapperID, {'class':'monitor', 'style':'top:' + ($('#FilterLinks').offset().top + $('#FilterLinks').height() + 5) +'px;'});
    this.canvas = document.getElementById('FilterCanvas');
    this.context = this.canvas.getContext('2d');
    this.canvas.setAttribute('width', this.canvasWidth);
    this.canvas.setAttribute('height', this.canvasHeight);

    //and the tt layer:
    injectDOM('canvas', this.TTcanvasID, this.wrapperID, {'class':'monitor', 'style':'top:' + ($('#FilterLinks').offset().top + $('#FilterLinks').height() + 5) +'px;'});
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
                            };

    //right sidebar
    injectDOM('div', this.sidebarID, this.wrapperID, {'class':'collapsableSidebar', 'style':'float:right; height:80%;'});
    //deploy right bar menu:
    deployMenu(this.sidebarID, ['detail'] , ['Filter Detail'] );
    //start with menu open:
    document.getElementById('detailarrow').onclick();

    //edit filter button
    injectDOM('input', 'detailContentEditFilters', 'detailContent', {
        'class' : 'bigButton',
        'style' : 'width:auto; height:auto; padding:0.5em; margin:1em',
        'type' : 'button',
        'value' : 'Edit Filters'
    });
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
            injectDOM('p', 'detailContentMessage', 'detailContent', {'innerHTML':'Input Link'});
        //Short Term Buffer
        } else if(cell==1){
            injectDOM('p', 'detailContentMessage', 'detailContent', {'innerHTML':'Short-Term Buffer'});
        //Raw Data
        } else if(cell==2){
            injectDOM('p', 'detailContentMessage', 'detailContent', {'innerHTML':'Raw Data'});
        //Filter Core
        } else if(cell==3){
            injectDOM('p', 'detailContentMessage', 'detailContent', {'innerHTML':'Filter Core'});
        //Long Term Buffer
        } else if(cell==4){
            injectDOM('p', 'detailContentMessage', 'detailContent', {'innerHTML':'Long-Term Buffer'});
        //Computer Link
        } else if(cell==5){
            injectDOM('p', 'detailContentMessage', 'detailContent', {'innerHTML':'Computer Link'});
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
    this.filterConIndex = 0;
    this.filterConPresent = [];  //keeps track of which filter condition indices are in which position
    this.newFilterMessage = 'Drag detectors from the right here to AND them together in a filter condition; add more leaves to OR together the different groups.'

    this.wrapperID = window.parameters.wrapper; //ID of wrapping div
    this.canvasID = 'editFilterCanvas';         //ID of canvas to paint filter on
    this.linkWrapperID = 'editFilterLinks';        //ID of div to contain clock view header
    this.sidebarID = 'editFilterSidebar';          //ID of sidebar div
    this.filterSystems = filterSystems; //subsytems available to participate in the filter
    this.filterSystemsNames = filterSystemsNames //human readable filterSystems

    this.wrapper = document.getElementById(this.wrapperID);

    //keep an internal list of all available filter:
    this.filterNames = [];
    //generate initial cycle list:
    for(key in ODB.Filters){
        if(ODB.Filters.hasOwnProperty(key) && typeof ODB.Filters[key] == 'object' && !Array.isArray(ODB.Filters[key])){
            this.filterNames[this.filterNames.length] = key;
        }
    }

    //nav wrapper div
    injectDOM('div', this.linkWrapperID, this.wrapperID, {'class':'navPanel'});
    //nav header
    injectDOM('h1', 'editFilterLinksBanner', this.linkWrapperID, {'class':'navPanelHeader', 'innerHTML':'Edit Filter'});
    injectDOM('br', 'break', this.linkWrapperID, {});
    //nav buttons
    injectDOM('button', 'commitFilter', this.linkWrapperID, {
        'class' : 'navLink',
        'innerHTML' : 'Deploy Filter and Return',
        'type' : 'button',
        'onclick' : deployFilter
    });
    injectDOM('button', 'abortFilter', this.linkWrapperID, {
        'class' : 'navLink',
        'innerHTML' : 'Reload Active Filter',
        'type' : 'button',
        'onclick' : reloadFilter
    });
    injectDOM('br', 'break', this.linkWrapperID, {});
    injectDOM('label', 'filterNameLabel', this.linkWrapperID, {'style' : 'margin-left:10px;', 'innerHTML' : 'Name this Filter: ', 'for':'filterName'});
    injectDOM('input', 'filterName', this.linkWrapperID, {'type':'text', 'value':'newFilter'});
    injectDOM('button', 'saveFilter', this.linkWrapperID, {
        'class' : 'navLink',
        'innerHTML' : 'Save Filter Definition',
        'type' : 'button',
        'onclick' : saveFilter
    });
    injectDOM('br', 'break', this.linkWrapperID, {});
    injectDOM('label', 'loadFilterLabel', this.linkWrapperID, {'style':'margin-left:10px;', 'innerHTML':'Load Filter: '});
    injectDOM('select', 'filterOptions', this.linkWrapperID, {});
    document.getElementById('loadFilterLabel').setAttribute('for', 'filterOptions');
    loadOptions(ODB.Filters, 'filterOptions');
    injectDOM('button', 'loadFilter', this.linkWrapperID, {
        'class':'navLink', 
        'innerHTML':'Load', 
        'type':'button',
        'onclick': loadFilter.bind(null)
    });
    injectDOM('button', 'deleteFilter', this.linkWrapperID, {
        'class' : 'navLink',
        'innerHTML' : 'Delete',
        'type' : 'button',
        'onclick' : function(){
            var name = getDrop('filterOptions');
            confirm('Delete Filter Definition', 'Do you really want to delete '+name+'?', deleteOption.bind(null, '/DashboardConfig/Filters/', 'filterOptions'));
            document.getElementById('tempDiv').style.top = window.innerHeight*0.2;
        }
    });
    injectDOM('br', 'break', this.linkWrapperID, {});

    //div structure for drag and drop area: right panel for detector palete, gutter for tree lines and main area for trigger groups:
    injectDOM('div', 'editFilterWrapper', this.linkWrapperID, {'style':'width:'+0.68*$(this.wrapper).width()+'px; display:inline-block; margin-top:1em'});
    injectDOM('div', 'filterWrap', 'editFilterWrapper', {'style':'float:left; width:79%'}); //79 kind of kludgy, to accommodate margins.
    injectDOM('div', 'treeGutter', 'filterWrap', {'style':'float:left; width:7%; text-align:center;'});
    injectDOM('div', 'treeBlockX', 'treeGutter', {'style':'height:20px;'});  //top block in tree gutter provides the first branch
    injectDOM('div', 'filterCons', 'filterWrap', {'style':'float:left; width:89%'});
    deployEmptyFilterCondition();
    injectDOM('div', 'filterPalete', 'editFilterWrapper', {
        'class' : 'filterDiv',
        'style' : 'width:15%; float:right; text-align:center; padding-top:1em; max-height:'+($('#leftSidebar').offset().top + $('#leftSidebar').offset().height - $('#filterWrap').offset().top)+'px; overflow:scroll; background-color:#222222; position:relative;',
    });
    injectDOM('button', 'newFilterCon', 'treeGutter', {
        'class' : 'addButton',
        'innerHTML' : '+',
        'type' : 'button',
        'onclick' : function(){deployEmptyFilterCondition()}
    });

    //deploy a dummy canvas for the filter view:
    this.canvasWidth = 0// 0.48*$(this.wrapper).width();
    this.canvasHeight = 0 //1*$(this.wrapper).height();
    injectDOM('canvas', this.canvasID, this.wrapperID, {'class':'monitor', 'style':'top:' + ($('#editFilterLinks').height() + 5) +'px;'});
    this.canvas = document.getElementById('editFilterCanvas');
    this.context = this.canvas.getContext('2d');
    this.canvas.setAttribute('width', this.canvasWidth);
    this.canvas.setAttribute('height', this.canvasHeight);

/*
    //right sidebar
    injectDOM('div', this.sidebarID, this.wrapperID, {'class':'collapsableSidebar', 'style':'float:right; height:80%;'});
    //deploy right bar menu:
    deployMenu(this.sidebarID, this.filterSystems, this.filterSystemsNames);    

    //inject inputs into filterable subsystem tabs:
    for(i=0; i<this.filterSystemsNames.length; i++){
        //prescale input + label
        injectDOM('input', this.filterSystems[i]+'ContentPS', this.filterSystems[i]+'Content', {'type':'number'});
        injectDOM('label', this.filterSystems[i]+'ContentPSlabel', this.filterSystems[i]+'Content', {'innerHTML':'Prescale Factor', 'for':this.filterSystems[i]+'ContentPS'});
        injectDOM('br', 'break', this.filterSystems[i]+'Content', {});

        //coinc multiplicity input + label
        injectDOM('input', this.filterSystems[i]+'ContentMulti', this.filterSystems[i]+'Content', {'type':'number'});
        injectDOM('label', this.filterSystems[i]+'ContentMultilabel', this.filterSystems[i]+'Content', {'innerHTML':'Coinc. Multiplicity', 'for':this.filterSystems[i]+'ContentMulti'});
        injectDOM('br', 'break', this.filterSystems[i]+'Content', {});

        //prescale input + label
        injectDOM('input', this.filterSystems[i]+'ContentCoincWindow', this.filterSystems[i]+'Content', {'type':'number'});
        injectDOM('label', this.filterSystems[i]+'ContentCoincWindowLabel', this.filterSystems[i]+'Content', {'innerHTML':'Coinc. Window [ns]', 'for':this.filterSystems[i]+'ContentCoincWindow'});
    }
*/
    injectDOM('div', this.sidebarID, this.wrapperID, {}); //dummy sidebar for transitions

    //inject detector options into palete
    this.badgeWidth = document.getElementById('filterPalete').offsetWidth*0.9;
    this.badgeHeight = 100;
    //DANTE
    if(ODB.DANTE)
        deployBadgeCanvas(this.badgeWidth, this.badgeHeight, 'DANTEPaleteBadge', 'filterPalete', dante, [this.badgeWidth/2, this.badgeHeight*0.35, this.badgeHeight*0.25, '#999999'], 'DANTE', true);
    //PACES
    if(ODB.PACES)
        deployBadgeCanvas(this.badgeWidth, this.badgeHeight, 'PACESPaleteBadge', 'filterPalete', paces, [this.badgeWidth/2, this.badgeHeight*0.35, this.badgeHeight*0.25, this.badgeHeight*0.25/3], 'PACES', true);
    //SCEPTAR
    if(ODB.SCEPTAR)
        deployBadgeCanvas(this.badgeWidth, this.badgeHeight, 'SCEPTARPaleteBadge', 'filterPalete', sceptar, [this.badgeWidth/2, this.badgeHeight*0.35, this.badgeHeight*0.25], 'SCEPTAR', true);
    //HPGE
    deployBadgeCanvas(this.badgeWidth, this.badgeHeight, 'HPGEPaleteBadge', 'filterPalete', tigress, [this.badgeWidth/2, this.badgeHeight*0.35, this.badgeHeight*0.25], 'HPGE', true); 
    //ZDS
    if(ODB.ZDS)
        deployBadgeCanvas(this.badgeWidth, this.badgeHeight, 'ZDSPaleteBadge', 'filterPalete', zds, [this.badgeWidth/2, this.badgeHeight*0.35, this.badgeHeight*0.25], 'ZDS', true);
    //SPICE
    if(ODB.SPICE)
        deployBadgeCanvas(this.badgeWidth, this.badgeHeight, 'SPICEPaleteBadge', 'filterPalete', spice, [this.badgeWidth/2, this.badgeHeight*0.35, this.badgeHeight*0.25], 'SPICE', true);
    //DESCANT
    if(ODB.DESCANT)
        deployBadgeCanvas(this.badgeWidth, this.badgeHeight, 'DESCANTPaleteBadge', 'filterPalete', descant, [this.badgeWidth/2, this.badgeHeight*0.35, this.badgeHeight*0.12], 'DESCANT', true);
    //BAMBINO
    if(ODB.BAMBINO)
        deployBadgeCanvas(this.badgeWidth, this.badgeHeight, 'BAMBINOPaleteBadge', 'filterPalete', bambino, [this.badgeWidth*0.45, this.badgeWidth*0.55, this.badgeHeight/3, this.badgeHeight*0.6, this.badgeHeight*0.12], 'BAMBINO', true);
    //SHARC
    if(ODB.SHARC)
        deployBadgeCanvas(this.badgeWidth, this.badgeHeight, 'SHARCPaleteBadge', 'filterPalete', sharc, [this.badgeWidth/2, this.badgeHeight*0.35, this.badgeWidth*0.3, this.badgeHeight*0.7], 'SHARC', true);
    //TIPwall
    if(ODB.TIPwall)
        deployBadgeCanvas(this.badgeWidth, this.badgeHeight, 'TIPwallPaleteBadge', 'filterPalete', tipWall, [this.badgeWidth/2, this.badgeHeight*0.35, this.badgeHeight*0.7], 'TIP Wall', true);
    //TIPball
    if(ODB.TIPball)
        deployBadgeCanvas(this.badgeWidth, this.badgeHeight, 'TIPballPaleteBadge', 'filterPalete', tipBall, [this.badgeWidth/2, this.badgeHeight*0.35, this.badgeHeight*0.35], 'TIP Ball', true);

    reloadFilter();
}

//drag and drop handler functions:
function dragStart(event){
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', this.id.slice(0, this.id.indexOf('PaleteBadge')));
}

function handleDrop(event){
    var index = this.id.slice(18, this.id.length);

    event.stopPropagation();

    if(this.innerHTML == window.filterEditPointer.newFilterMessage)
        this.innerHTML = '';

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

    //resize the appropriate tree gutter
    document.getElementById('treeBlock' + index).style.height = document.getElementById('filterGroup' + index).offsetHeight + parseInt(document.body.style.fontSize);

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

    injectDOM('canvas', id+wrapperID, wrapperID, {'style':'width:'+this.badgeWidth+'px; height:'+this.badgeHeight+'px;'});
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
                                    if(window.onDisplay == 'editFilterCanvas'){
                                        var index = this.id.slice(this.id.indexOf('filterGroupContent')+18, this.id.length);
                                        this.parentNode.parentNode.removeChild(this.parentNode);
                                        //resize the corresponding tree gutter:
                                        resizeBranches();
                                        //document.getElementById('treeBlock' + index).style.height = document.getElementById('filterGroup' + index).offsetHeight + parseInt(document.body.style.fontSize);
                                        //replace the intro message if there's nothing else to show:
                                        if(document.getElementById('filterGroupContent' + index).innerHTML == '')
                                            document.getElementById('filterGroupContent' + index).innerHTML = window.filterEditPointer.newFilterMessage;
                                        askForFilterDeploy();
                                    }
                                    else if(window.onDisplay == 'cycleCanvas'){
                                        pointer = this.parentNode;
                                        this.parentNode.removeChild(this);
                                        if(pointer.innerHTML == ''){
                                            pointer.innerHTML = window.cyclePointer.helpMessage;
                                            pointer.setAttribute('class', 'delayCycleContent');
                                        }
                                        askForCycleDeploy();
                                    }
                                }
                            };
    }

}

//create the full badge for the filter divs
function deployFilterBadge(id, wrapperID, createCanvas){
    injectDOM('div', id+wrapperID, wrapperID, {'class':'filterBadge'});
    document.getElementById(id+wrapperID).filterTag = filterTag(id.slice(0, id.indexOf('filterBadge')));
    createCanvas();
    createOptionScroll(id+wrapperID, id+wrapperID+'scroll', ['Singles', 'Coincidence', 'Prescaled'], document.getElementById(id+wrapperID).offsetWidth, filterScrollCB.bind(null, id+wrapperID)  );
    injectDOM('label', id+wrapperID+'label', id+wrapperID, {
        'innerHTML' : '',
        'for' : id+wrapperID+'factor'
    });
    injectDOM('input', id+wrapperID+'factor', id+wrapperID, {
        'type' : 'number',
        'class' : 'filterFactor',
        'style' : 'opacity:0',
        'min' : 0,
        'value' : 1
    });

    //update help messages:
    if(wrapperID == 'singleStreamFilters')
        document.getElementById('singleStreamHelp').innerHTML = 'Any of these:';
    else if(wrapperID.slice(0,11) == 'interstream')
        document.getElementById('interstreamHelp'+wrapperID.slice(11, wrapperID.length)).innerHTML = 'or ALL of these:'
    askForFilterDeploy();
    resizeBranches();
}

function filterScrollCB(target){
    scroll = document.getElementById(target+'scroll');
    if(scroll.chosen==0){
        document.getElementById(target+'label').innerHTML = '';
        document.getElementById(target+'factor').style.width = 0;        
        document.getElementById(target+'label').style.opacity = 0;
        document.getElementById(target+'factor').style.opacity = 0;
    } else if(scroll.chosen==1){
        document.getElementById(target+'label').innerHTML = 'Multiplicity: ';
        document.getElementById(target+'factor').style.width = '3em';
        document.getElementById(target+'label').style.opacity = 1;
        document.getElementById(target+'factor').style.opacity = 1;        
    } else if(scroll.chosen==2){
        document.getElementById(target+'label').innerHTML = 'Prescale Factor: ';
        document.getElementById(target+'factor').style.width = '6em';
        document.getElementById(target+'label').style.opacity = 1;
        document.getElementById(target+'factor').style.opacity = 1;        
    }
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
    else if(detName == 'SPICE')
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
    var i, j, k, modeTag, filters = [],
        filterConditions = document.getElementById('filterCons');

    for(i=0; i<filterConditions.childNodes.length; i++){
        filters[i] = [];
        for(j=0; j<filterConditions.childNodes[i].childNodes.length; j++){
            for(k=0; k<filterConditions.childNodes[i].childNodes[j].childNodes.length; k++){
                if(filterConditions.childNodes[i].childNodes[j].childNodes[k].filterTag){
                    filterString = '';
                    //add subsystem tag
                    filterString += filterConditions.childNodes[i].childNodes[j].childNodes[k].filterTag;
                    //add Singles / Coinc / Prescale tag:
                    modeTag = filterConditions.childNodes[i].childNodes[j].childNodes[k].childNodes[1].childNodes[1].innerHTML;  //trololololo
                    modeTag = ( (modeTag == 'Singles') ? '-S' : ( (modeTag=='Prescaled') ? '-P' : '-C' ) );
                    filterString += modeTag;
                    //Include varibale prescale / coincidence multiplicity here; fixed to 1 until I get a real spec:
                    filterString += '-'+filterConditions.childNodes[i].childNodes[j].childNodes[k].childNodes[3].value;

                    filters[i][k] = filterString;
                }
            }
        }
    }

    return filters;
}

function deployEmptyFilterCondition(){
        var bottomFilterConID = window.filterEditPointer.filterConPresent[window.filterEditPointer.filterConPresent.length-1];

        //inject a new filter group:
        injectDOM('div', 'filterGroup'+window.filterEditPointer.filterConIndex, 'filterCons', {'class':'filterCon'});
        //inject a new tree gutter:
        injectDOM('div', 'treeBlock'+window.filterEditPointer.filterConIndex, 'treeGutter', {'class':'treeGutter', 'style':'display:none;'});
        //make sure the tree gutter comes above the new button:
        document.getElementById('treeGutter').insertBefore(document.getElementById('treeBlock'+window.filterEditPointer.filterConIndex), document.getElementById('newFilterCon'))
        //resize the previous tree gutter and reveal it to connect it to the tree:
        if(bottomFilterConID != undefined){
            document.getElementById('treeBlock' + bottomFilterConID).style.height = document.getElementById('filterGroup' + bottomFilterConID).offsetHeight + parseInt(window.getComputedStyle(document.body).fontSize);
            document.getElementById('treeBlock' + bottomFilterConID).style.display = 'block';
        }

        //off button
        injectDOM('button', 'deleteFilterCon'+window.filterEditPointer.filterConIndex, 'filterGroup'+window.filterEditPointer.filterConIndex, {
            'class' : 'deleteButton',
            'innerHTML' : String.fromCharCode(0x2573),
            'type' : 'button',
            'onclick' : function(){
                //refuse if this is the last condition:
                if(window.filterEditPointer.filterConPresent.length<2)
                    return;
                //delete elements
                var index = parseInt(this.id.slice(15, this.id.length), 10),
                    treeGutter = document.getElementById('treeBlock'+index); 
                    element = document.getElementById(this.id);
                treeGutter.parentNode.removeChild(treeGutter);
                element.parentNode.parentNode.removeChild(element.parentNode);
                //need to remove this group's index from filterConPresent
                window.filterEditPointer.filterConPresent.splice(window.filterEditPointer.filterConPresent.indexOf(index), 1);
                //hide previous tree gutter
                document.getElementById('treeBlock'+window.filterEditPointer.filterConPresent[window.filterEditPointer.filterConPresent.length-1]).style.display = 'none';
                askForFilterDeploy();
            }
        });
        //content block
        injectDOM('div', 'filterGroupContent'+window.filterEditPointer.filterConIndex, 'filterGroup'+window.filterEditPointer.filterConIndex, {'innerHTML':window.filterEditPointer.newFilterMessage});
        //prepare filter groups to accept new elements:
        document.getElementById('filterGroupContent'+window.filterEditPointer.filterConIndex).addEventListener('dragover', dragOver, false);
        document.getElementById('filterGroupContent'+window.filterEditPointer.filterConIndex).addEventListener('drop', handleDrop, false);

        window.filterEditPointer.filterConPresent[window.filterEditPointer.filterConPresent.length] = window.filterEditPointer.filterConIndex;
        window.filterEditPointer.filterConIndex++;
}

//step through the tree and make sure all the branches are the right size
function resizeBranches(){
    var i;

    for(i=0; i<window.filterEditPointer.filterConIndex; i++){
        if(document.getElementById('deleteFilterCon'+i) ){
            document.getElementById('treeBlock' + i).style.height = document.getElementById('filterGroup' + i).offsetHeight + parseInt(window.getComputedStyle(document.body).fontSize);
        }
    }
}

function saveFilter(){
    var i, deleteCode,
        filter = buildFilter(),
        name = document.getElementById('filterName').value,
        groups = [], types = [], arrayLengths = [], stringLength = [];

    //recreate the filter
    deleteCode = JSON.parse(ODBMDelete(['/DashboardConfig/Filters/'+name]));
    ODBMCreate(['/DashboardConfig/Filters/'+name], [TID_KEY]);

    //create arrays for each OR'ed group:
    for(i=0; i<filter.length; i++){
        groups[i] = '/DashboardConfig/Filters/'+name+'/group'+i;
        types[i] = TID_STRING;
        arrayLengths[i] = filter[i].length;
        stringLength[i] = 32;
    }
    ODBMCreate(groups, types, arrayLengths, stringLength);

    //populate arrays
    for(i=0; i<filter.length; i++){
        ODBSet('/DashboardConfig/Filters/'+name+'/group'+i+'[*]', filter[i]);   
    }

    //include in dropdown if new
    if(deleteCode[0] == 312){
        option = document.createElement('option');
        option.text = name;
        option.value = window.filterEditPointer.filterNames.length;
        window.filterEditPointer.filterNames[window.filterEditPointer.filterNames.length] = name;
        document.getElementById('filterOptions').add(option, null);
    }
}

function deployFilter(){

    var name = document.getElementById('filterName').value,
        filter = buildFilter(),
        i, deleteCode, oldGroups = [], groups = [], types = [], arrayLengths = [], stringLength = [];

    //write name:
    ODBSet('/DashboardConfig/Filters/Active Name', name);

    //delete old groups, max 100 OR'd conditions:
    for(i=0; i<100; i++){
        if(ODB.Filters['group'+i])
            oldGroups[oldGroups.length] = '/DashboardConfig/Filters/group'+i;
    }
    ODBMDelete(oldGroups);

    //write new filter groups
    //create arrays for each OR'ed group:
    for(i=0; i<filter.length; i++){
        groups[i] = '/DashboardConfig/Filters/group'+i;
        types[i] = TID_STRING;
        arrayLengths[i] = filter[i].length;
        stringLength[i] = 32;
    }
    ODBMCreate(groups, types, arrayLengths, stringLength);

    //populate arrays
    for(i=0; i<filter.length; i++){
        ODBSet('/DashboardConfig/Filters/group'+i+'[*]', filter[i]);   
    }

    //regrab ODB
    fetchODB();
    suspendFilterRequest();
    document.getElementById('FilterButton').onclick();
}

function reloadFilter(){
    var i,
        dropdown = document.getElementById('filterOptions');

    for(i=0; i<dropdown.childNodes.length; i++){
        if(dropdown.childNodes[i].innerHTML == ODB.Filters['Active Name']){
            dropdown.selectedIndex = i;
        }
    }

    loadFilter();
    suspendFilterRequest();
    fetchODB();
}

function loadFilter(){
    var name = getDrop('filterOptions'),
        filter = JSON.parse(ODBCopy('/DashboardConfig/Filters/'+name)),
        key, length, i, init=1, rule, detector, mode, factor, groupID, contentID, 
        counter, originalCount, badgeID, scroll, scrollButton;

    //load the name into the input box
    document.getElementById('filterName').value = name;

    //find the last rule index declared, and build from there; will delete earlier ones at the end
    for(i=0; i<window.filterEditPointer.filterConIndex; i++){
        if(document.getElementById('deleteFilterCon'+i))
            counter = i;
    }
    originalCount = counter;
    window.filterEditPointer.filterConIndex = counter+1

    for(key in filter){
        //skip the metadata
        if(key.indexOf('key') != -1) continue;

        //if there's just one thing, ODBCopy just returns it, not in an array :/
        length = ( typeof filter[key] == 'string' ) ? 1 : filter[key].length;

        //make a new block for each group:
        if(!init){
            document.getElementById('newFilterCon').onclick();
        } else
            init = 0;

        //construct the ID for this block:
        groupID = 'filterGroup' + counter;
        contentID = 'filterGroupContent' + counter;

        //dump the default text
        document.getElementById(contentID).innerHTML = '';

        //deploy all the individual elements in the block
        for(i=0; i<length; i++){
            //extract an individual rule
            if(length==1)
                rule = filter[key];
            else
                rule = filter[key][i];

            //slice the rule up into which detector in what mode with what prescale / multi factor:
            detector = rule.slice(0,3);
            mode = rule.slice(4,5);
            factor = parseInt( rule.slice(6, rule.length), 10 );

            //set us up the badge:
            if(detector == 'DAB'){
                deployFilterBadge('DANTEfilterBadge', contentID, deployBadgeCanvas.bind(null, window.filterEditPointer.badgeWidth, window.filterEditPointer.badgeHeight, 'DANTEfilterBadgeCanvas', 'DANTEfilterBadge'+contentID, dante, [window.filterEditPointer.badgeWidth/2, window.filterEditPointer.badgeHeight*0.35, window.filterEditPointer.badgeHeight*0.25, '#999999'], 'DANTE', false));
                badgeID = 'DANTEfilterBadgefilterGroupContent'+counter;
            } else if(detector == 'PAC' ){
                deployFilterBadge('PACESfilterBadge', contentID, deployBadgeCanvas.bind(null,window.filterEditPointer.badgeWidth, window.filterEditPointer.badgeHeight, 'PACESfilterBadgeCanvas', 'PACESfilterBadge'+contentID, paces, [window.filterEditPointer.badgeWidth/2, window.filterEditPointer.badgeHeight*0.35, window.filterEditPointer.badgeHeight*0.25, window.filterEditPointer.badgeHeight*0.25/3], 'PACES', false));
                badgeID = 'PACESfilterBadgefilterGroupContent'+counter;
            } else if(detector == 'SEP' ){
                deployFilterBadge('SCEPTARfilterBadge', contentID, deployBadgeCanvas.bind(null,window.filterEditPointer.badgeWidth, window.filterEditPointer.badgeHeight, 'SCEPTARfilterBadgeCanvas', 'SCEPTARfilterBadge'+contentID, sceptar, [window.filterEditPointer.badgeWidth/2, window.filterEditPointer.badgeHeight*0.35, window.filterEditPointer.badgeHeight*0.25], 'SCEPTAR', false));
                badgeID = 'SCEPTARfilterBadgefilterGroupContent'+counter;
            } else if(detector == 'GRG' ){
                deployFilterBadge('HPGEfilterBadge', contentID, deployBadgeCanvas.bind(null, window.filterEditPointer.badgeWidth, window.filterEditPointer.badgeHeight, 'HPGEfilterBadgeCanvas', 'HPGEfilterBadge'+contentID, tigress, [window.filterEditPointer.badgeWidth/2, window.filterEditPointer.badgeHeight*0.35, window.filterEditPointer.badgeHeight*0.25], 'HPGE', false));
                badgeID = 'HPGEfilterBadgefilterGroupContent'+counter;
            } else if(detector == 'ZDS' ){
                deployFilterBadge('ZDSfilterBadge', contentID, deployBadgeCanvas.bind(null, window.filterEditPointer.badgeWidth, window.filterEditPointer.badgeHeight, 'ZDSfilterBadgeCanvas', 'ZDSfilterBadge'+contentID, zds, [window.filterEditPointer.badgeWidth/2, window.filterEditPointer.badgeHeight*0.35, window.filterEditPointer.badgeHeight*0.25], 'ZDS', false));
                badgeID = 'ZDSfilterBadgefilterGroupContent'+counter;
            } else if(detector == 'SPI' ){
                deployFilterBadge('SPICEfilterBadge', contentID, deployBadgeCanvas.bind(null, window.filterEditPointer.badgeWidth, window.filterEditPointer.badgeHeight, 'SPICEfilterBadgeCanvas', 'SPICEfilterBadge'+contentID, spice, [window.filterEditPointer.badgeWidth/2, window.filterEditPointer.badgeHeight*0.35, window.filterEditPointer.badgeHeight*0.25], 'SPICE', false));
                badgeID = 'SPICEfilterBadgefilterGroupContent'+counter;
            } else if(detector == 'DSC' ){
                deployFilterBadge('DESCANTfilterBadge', contentID, deployBadgeCanvas.bind(null, window.filterEditPointer.badgeWidth, window.filterEditPointer.badgeHeight, 'DESCANTfilterBadgeCanvas', 'DESCANTfilterBadge'+contentID, descant, [window.filterEditPointer.badgeWidth/2, window.filterEditPointer.badgeHeight*0.35, window.filterEditPointer.badgeHeight*0.12], 'DESCANT', false));
                badgeID = 'DESCANTfilterBadgefilterGroupContent'+counter;
            } else if(detector == 'BAE' ){
                deployFilterBadge('BAMBINOfilterBadge', contentID, deployBadgeCanvas.bind(null, window.filterEditPointer.badgeWidth, window.filterEditPointer.badgeHeight, 'BAMBINOfilterBadgeCanvas', 'BAMBINOfilterBadge'+contentID, bambino, [window.filterEditPointer.badgeWidth*0.45, window.filterEditPointer.badgeWidth*0.55, window.filterEditPointer.badgeHeight/3, window.filterEditPointer.badgeHeight*0.6, window.filterEditPointer.badgeHeight*0.12], 'BAMBINO', false));
                badgeID = 'BAMBINOfilterBadgefilterGroupontent'+counter;
            } else if(detector == 'SHB' ){
                deployFilterBadge('SHARCfilterBadge', contentID, deployBadgeCanvas.bind(null, window.filterEditPointer.badgeWidth, window.filterEditPointer.badgeHeight, 'SHARCfilterBadgeCanvas', 'SHARCfilterBadge'+contentID, sharc, [window.filterEditPointer.badgeWidth/2, window.filterEditPointer.badgeHeight*0.35, window.filterEditPointer.badgeWidth*0.3, window.filterEditPointer.badgeHeight*0.7], 'SHARC', false));
                badgeID = 'SHARCfilterBadgefilterGroupContent'+counter;
            } else if(detector == 'TPW' ){
                deployFilterBadge('TIPwallfilterBadge', contentID, deployBadgeCanvas.bind(null, window.filterEditPointer.badgeWidth, window.filterEditPointer.badgeHeight, 'TIPwallfilterBadgeCanvas', 'TIPwallfilterBadge'+contentID, tipWall, [window.filterEditPointer.badgeWidth/2, window.filterEditPointer.badgeHeight*0.35, window.filterEditPointer.badgeHeight*0.7], 'TIP Wall', false));
                badgeID = 'TIPwallfilterBadgefilterGroupContent'+counter;
            } else if(detector == 'TPC' ){
                deployFilterBadge('TIPballfilterBadge', contentID, deployBadgeCanvas.bind(null, window.filterEditPointer.badgeWidth, window.filterEditPointer.badgeHeight, 'TIPballfilterBadgeCanvas', 'TIPballfilterBadge'+contentID, tipBall, [window.filterEditPointer.badgeWidth/2, window.filterEditPointer.badgeHeight*0.35, window.filterEditPointer.badgeHeight*0.35], 'TIP Ball', false));
                badgeID = 'TIPballfilterBadgefilterGroupContent'+counter;
            }

            //get the scroll in the right position:
            scroll = document.getElementById(badgeID+'scroll');
            scrollButton = document.getElementById(badgeID+'scrollLeftArrow');
            if(mode == 'C'){
                while(scroll.chosen != 1)
                    scrollButton.onclick();
            } else if(mode == 'P'){
                while(scroll.chosen != 2)
                    scrollButton.onclick();
            }

            //assign multiplicity / prescale factor:
            document.getElementById(badgeID + 'factor').value = factor;

        }
        counter++;

    }

    //delete any rules that may have come before:
    for(i=0; i<originalCount; i++){
        if(document.getElementById('deleteFilterCon'+i))
            document.getElementById('deleteFilterCon'+i).onclick();
    }

    askForFilterDeploy();
}

//start the deploy filter button flashing:
function askForFilterDeploy(){
    document.getElementById('commitFilter').style.webkitAnimationName = 'alertBorder';
    document.getElementById('commitFilter').style.mozAnimationName = 'alertBorder';
}

//suspend request for cycle deployment
function suspendFilterRequest(){
    document.getElementById('commitFilter').style.webkitAnimationName = 'x';
    document.getElementById('commitFilter').style.mozAnimationName = 'x';    
}





