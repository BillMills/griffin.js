function Cycle(){
    var that = this,
    i, key;
    window.cyclePointer = that;

    this.wrapperID = window.parameters.wrapper; //ID of wrapping div
    this.canvasID = 'cycleCanvas';         //ID of canvas to paint filter on
    this.linkWrapperID = 'cycleLinks';        //ID of div to contain clock view header
    this.sidebarID = 'cycleSidebar';          //ID of sidebar div
    this.nCycleSteps = 0;
    this.nCycleSummarySteps = 0;
    this.helpMessage = 'Drag an action from the right here to define a command step, or leave as-is for a delay.';
    this.currentDrag = '';
    this.codex = {
        "beamOn"        : 1,    //0x00000001
        "wildcard1"     : 2,    //0x00000002
        "wildcard2"     : 4,    //0x00000004
        "wildcard3"     : 8,    //0x00000008
        "syncClocks"    : 16,   //0x00000010
        "clearScalars"  : 32,   //0x00000020
        "moveTape"      : 64,   //0x00000040
        "enableHPGe"    : 128,  //0x00000080
        "enableSCEPTAR" : 256,  //0x00000100
        "enablePACES"   : 512,  //0x00000200
        "enableDANTE"   : 1024, //0x00000400
        "enableDESCANT" : 2048, //0x00000800
        "enableZDS"     : 4096, //0x00001000
        "wildcard4"     : 8192, //0x00002000
        "wildcard5"     : 16384,//0x00004000
        "wildcard6"     : 32768,//0x00008000 
        "triggersOn"    : 8064  //0x00001F80  //as in ALL triggers on.
    };
    //keep an internal list of all available cycles:
    this.cycleNames = [];
    //generate initial cycle list:
    for(key in ODB.Cycles){
        if(ODB.Cycles.hasOwnProperty(key) && typeof ODB.Cycles[key] == 'object' && !Array.isArray(ODB.Cycles[key])){
            this.cycleNames[this.cycleNames.length] = key;
        }
    }

    this.wrapper = document.getElementById(this.wrapperID);

    //add top level nav button:
    injectDOM('button', 'CycleButton', 'statusLink', {
        'class' : 'navLink',
        'onclick' : function(){swapView('cycleLinks', 'cycleCanvas', 'cycleMenus', 'CycleButton');},
        'innerHTML' : 'Cycle'
    });

    //summary view//////////////////////////////////////////////////////
    injectDOM('div', 'cycleSummary', this.wrapperID, {'class':'navPanel', 'style':'min-width: 50%'});
    injectDOM('h1', 'cycleSummaryBanner', 'cycleSummary', {'class':'navPanelHeader', 'innerHTML':'Current Cycle'});
    injectDOM('br', 'break', 'cycleSummary', {});
    injectDOM('button', 'gotoCycleEdit', 'cycleSummary', {
        'class' : 'navLink',
        'onclick' : function(){swapView('cycleLinks', 'cycleCanvas', 'cycleMenus', 'CycleButton');},
        'innerHTML' : 'Edit Cycle',
        'style' : 'margin-bottom: 1em', 
        'type' : 'button'
    });
    injectDOM('div', 'cycleSummaryWrapper', 'cycleSummary', {'style' : 'text-align:center; width:100%'});

    //edit view/////////////////////////////////////////////////////////
    injectDOM('div', this.linkWrapperID, this.wrapperID, {'class':'navPanel'});
    //nav header
    injectDOM('h1', 'cycleLinksBanner', this.linkWrapperID, {'class' : 'navPanelHeader', 'innerHTML' : 'Edit Cycle'});
    injectDOM('br', 'break', this.linkWrapperID, {});

    //nav buttons & cycle save / load interface:
    injectDOM('button', 'showCycleSummary', this.linkWrapperID, {
        'class' : 'navLink',
        'onclick' : function(){swapView('cycleSummary', 'cycleCanvas', 'cycleMenus', 'CycleButton');},
        'innerHTML' : 'Return to Cycle Summary',
        'type' : 'button'
    });    
    injectDOM('button', 'commitCycle', this.linkWrapperID, {
        'class' : 'navLink',
        'style' : '-webkit-animation-name:x; -moz-animation-name:x;',
        'onclick' : commitCycle.bind(null),
        'innerHTML' : 'Deploy Cycle Now',
        'type' : 'button'
    });
    injectDOM('button', 'resetCycle', this.linkWrapperID, {
        'class' : 'navLink',
        'onclick' : reloadCycle.bind(null),
        'innerHTML' : 'Reload Active Cycle',
        'type' : 'button',
        'onclick' : function(){
            var dropdown = document.getElementById('cycleOptions'),
                currentCycle = ODB.Cycles['Active Name'],
                i;

            for(i=0; i<dropdown.childNodes.length; i++){
                if(dropdown.childNodes[i].innerHTML == currentCycle){
                    dropdown.selectedIndex = i;
                }
            }

            loadCycle();
        }
    });
    injectDOM('br', 'break', this.linkWrapperID, {});
    injectDOM('label', 'cycleNameLabel', this.linkWrapperID, {'style':'margin-left:10px;', 'innerHTML':'Name this Cycle: '});
    injectDOM('input', 'cycleName', this.linkWrapperID, {'type' : 'text', 'value' : 'newCycle'});
    injectDOM('button', 'saveCycle', this.linkWrapperID, {
        'class' : 'navLink',
        'onclick' : saveCycle.bind(null),
        'innerHTML' : 'Save Cycle Definition',
        'type' : 'button'
    });
    document.getElementById('cycleNameLabel').setAttribute('for', 'cycleName');
    injectDOM('br', 'break', this.linkWrapperID, {});
    injectDOM('label', 'loadCycleLabel', this.linkWrapperID, {'style':'margin-left:10px;', 'innerHTML':'Load Cycle: '});
    injectDOM('select', 'cycleOptions', this.linkWrapperID, {});
    document.getElementById('loadCycleLabel').setAttribute('for', 'cycleOptions');
    loadOptions(ODB.Cycles, 'cycleOptions');
    injectDOM('button', 'loadCycle', this.linkWrapperID, {
        'class' : 'navLink',
        'onclick' : loadCycle.bind(null),
        'innerHTML' : 'Load',
        'type' : 'button'
    });
    injectDOM('button', 'deleteOption', this.linkWrapperID, {
        'class' : 'navLink',
        'innerHTML' : 'Delete',
        'tpye' : 'button',
        'onclick' : function(){
            var i, name,
                dropdown = document.getElementById('cycleOptions'),
                cycleIndex = parseInt(dropdown.value, 10);

            for(i=0; i<dropdown.childNodes.length; i++){
                if(dropdown.childNodes[i].value == cycleIndex){
                    name = dropdown.childNodes[i].innerHTML;
                }
            }
            confirm('Delete Cycle Definition', 'Do you really want to delete '+name+'?', deleteOption.bind(null, '/DashboardConfig/Cycles/', 'cycleOptions'));
            document.getElementById('tempDiv').style.top = 200;
        }
    });


    //div structure for drag and drop area: right panel for detector palete, two-div column for Single Stream and Interstream Filters:
    injectDOM('div', 'cycleWrapper', this.linkWrapperID, {'style' : 'width:'+(270+0.48*$(this.wrapper).width())+'px; margin-top:1em; display:block'});
    injectDOM('div', 'cycleSteps', 'cycleWrapper', {'style' : 'width:'+0.48*$(this.wrapper).width()+'; padding:0.5em; float:left; text-align:center;'});
    injectDOM('div', 'cyclePalete', 'cycleWrapper', {
        'class' : 'cycleDiv',
        'style' : 'width:250px; float:right; text-align:center; padding-top:1em; position:relative; top:0px; max-height:'+( $('#leftSidebar').offset().top + $('#leftSidebar').offset().height - $('#cycleSteps').offset().top )+'; overflow:scroll; background-color:#222222;',
    });

    //inject options into palete
    this.badgeWidth = 100;
    this.badgeHeight = 100;

    //start display off with one drop target, filled with just an instruction on how to proceed:
    createCycleStep(this.helpMessage);
    this.nCycleSteps++;
    terminationBadge();

    //deploy a dummy canvas for the filter view:
    this.canvasWidth = 0// 0.48*$(this.wrapper).width();
    this.canvasHeight = 0 //1*$(this.wrapper).height();
    injectDOM('canvas', this.canvasID, this.wrapperID, {
        'class':'monitor', 
        'style':'top:' + ($('#cycleLinks').height() + 5) +'px;'
    });
    this.canvas = document.getElementById('cycleCanvas');
    this.context = this.canvas.getContext('2d');
    this.canvas.setAttribute('width', this.canvasWidth);
    this.canvas.setAttribute('height', this.canvasHeight);

    /*
    //right sidebar
    injectDOM('div', this.sidebarID, this.wrapperID, {'class':'collapsableSidebar', 'style':'float:right; height:80%;'});
    //deploy right bar menu:
    deployMenu('cycleMenus', ['Cycle'], ['Cycle Details']);    
    */
    injectDOM('div', this.sidebarID, this.wrapperID, {}); //dummy sidebar for transitions

    //Clear Scalars
    deployBadgeCanvas(this.badgeWidth, this.badgeHeight, 'clearScalarsPaleteBadge', 'cyclePalete', clearScalars, [0.5*this.badgeHeight, this.badgeWidth], 'Clear Scalars', true);
    //Move Tape
    deployBadgeCanvas(this.badgeWidth, this.badgeHeight, 'moveTapePaleteBadge', 'cyclePalete', moveTape, [this.badgeWidth, this.badgeHeight, this.badgeWidth/2, this.badgeHeight*0.35], 'Move Tape', true);
    //Trigers On
    deployBadgeCanvas(this.badgeWidth, this.badgeHeight, 'triggersOnPaleteBadge', 'cyclePalete', triggersOn, [this.badgeWidth, this.badgeHeight, this.badgeWidth/2, this.badgeHeight*0.35], 'Triggers On', true);
    //Beam On
    deployBadgeCanvas(this.badgeWidth, this.badgeHeight, 'beamOnPaleteBadge', 'cyclePalete', beamOn, [this.badgeWidth, this.badgeHeight, this.badgeWidth/2, this.badgeHeight*0.35], 'Beam On', true);
    //Sync Clocks
    deployBadgeCanvas(this.badgeWidth, this.badgeHeight, 'syncClocksPaleteBadge', 'cyclePalete', syncClocks, [this.badgeWidth, this.badgeHeight, this.badgeWidth/2, this.badgeHeight*0.35], 'Sync Clocks', true);
    //HPGe Trigger
    deployBadgeCanvas(this.badgeWidth, this.badgeHeight, 'HPGePaleteBadge', 'cyclePalete', tigress, [this.badgeWidth/2, this.badgeHeight*0.35, this.badgeHeight*0.3], 'HPGe Trig', true);
    //SCEPTAR Trigger
    if(ODB.SCEPTAR)
        deployBadgeCanvas(this.badgeWidth, this.badgeHeight, 'SCEPTARPaleteBadge', 'cyclePalete', sceptar, [this.badgeWidth/2, this.badgeHeight*0.35, this.badgeHeight*0.3], 'SCEPTAR Trig', true);
    //PACES Trigger
    if(ODB.PACES)
        deployBadgeCanvas(this.badgeWidth, this.badgeHeight, 'PACESPaleteBadge', 'cyclePalete', paces, [this.badgeWidth/2, this.badgeHeight*0.35, this.badgeHeight*0.2, this.badgeHeight*0.05], 'PACES Trig', true);
    //DANTE Trigger
    if(ODB.DANTE)
        deployBadgeCanvas(this.badgeWidth, this.badgeHeight, 'DANTEPaleteBadge', 'cyclePalete', dante, [this.badgeWidth/2, this.badgeHeight*0.35, this.badgeHeight*0.2, '#999999'], 'DANTE Trig', true);
    //DESCANT Trigger
    if(ODB.DESCANT)
        deployBadgeCanvas(this.badgeWidth, this.badgeHeight, 'DESCANTPaleteBadge', 'cyclePalete', descant, [this.badgeWidth/2, this.badgeHeight*0.35, this.badgeHeight*0.1], 'DESCANT Trig', true);
    //ZDS Trigger
    if(ODB.ZDS)
        deployBadgeCanvas(this.badgeWidth, this.badgeHeight, 'ZDSPaleteBadge', 'cyclePalete', zds, [this.badgeWidth/2, this.badgeHeight*0.35, this.badgeHeight*0.3], 'ZDS Trig', true);
    //Wildcards 1-6:
    deployBadgeCanvas(this.badgeWidth, this.badgeHeight, 'wildcard1PaleteBadge', 'cyclePalete', wildcard, [this.badgeWidth, this.badgeHeight, this.badgeWidth/2, this.badgeHeight*0.35], 'Wildcard 1', true);
    deployBadgeCanvas(this.badgeWidth, this.badgeHeight, 'wildcard2PaleteBadge', 'cyclePalete', wildcard, [this.badgeWidth, this.badgeHeight, this.badgeWidth/2, this.badgeHeight*0.35], 'Wildcard 2', true);
    deployBadgeCanvas(this.badgeWidth, this.badgeHeight, 'wildcard3PaleteBadge', 'cyclePalete', wildcard, [this.badgeWidth, this.badgeHeight, this.badgeWidth/2, this.badgeHeight*0.35], 'Wildcard 3', true);
    deployBadgeCanvas(this.badgeWidth, this.badgeHeight, 'wildcard4PaleteBadge', 'cyclePalete', wildcard, [this.badgeWidth, this.badgeHeight, this.badgeWidth/2, this.badgeHeight*0.35], 'Wildcard 4', true);
    deployBadgeCanvas(this.badgeWidth, this.badgeHeight, 'wildcard5PaleteBadge', 'cyclePalete', wildcard, [this.badgeWidth, this.badgeHeight, this.badgeWidth/2, this.badgeHeight*0.35], 'Wildcard 5', true);
    deployBadgeCanvas(this.badgeWidth, this.badgeHeight, 'wildcard6PaleteBadge', 'cyclePalete', wildcard, [this.badgeWidth, this.badgeHeight, this.badgeWidth/2, this.badgeHeight*0.35], 'Wildcard 6', true);

    //modify the dragstart of the palete badges:
    document.getElementById('clearScalarsPaleteBadgecyclePalete').addEventListener('dragstart', paleteDragStart, false);
    document.getElementById('moveTapePaleteBadgecyclePalete').addEventListener('dragstart', paleteDragStart, false);
    document.getElementById('triggersOnPaleteBadgecyclePalete').addEventListener('dragstart', paleteDragStart, false);
    document.getElementById('beamOnPaleteBadgecyclePalete').addEventListener('dragstart', paleteDragStart, false);
    document.getElementById('syncClocksPaleteBadgecyclePalete').addEventListener('dragstart', paleteDragStart, false);
    document.getElementById('HPGePaleteBadgecyclePalete').addEventListener('dragstart', paleteDragStart, false);
    if(ODB.SCEPTAR)document.getElementById('SCEPTARPaleteBadgecyclePalete').addEventListener('dragstart', paleteDragStart, false);
    if(ODB.PACES)document.getElementById('PACESPaleteBadgecyclePalete').addEventListener('dragstart', paleteDragStart, false);
    if(ODB.DANTE)document.getElementById('DANTEPaleteBadgecyclePalete').addEventListener('dragstart', paleteDragStart, false);
    if(ODB.DESCANT)document.getElementById('DESCANTPaleteBadgecyclePalete').addEventListener('dragstart', paleteDragStart, false);
    if(ODB.ZDS)document.getElementById('ZDSPaleteBadgecyclePalete').addEventListener('dragstart', paleteDragStart, false);
    document.getElementById('wildcard1PaleteBadgecyclePalete').addEventListener('dragstart', paleteDragStart, false);
    document.getElementById('wildcard2PaleteBadgecyclePalete').addEventListener('dragstart', paleteDragStart, false);
    document.getElementById('wildcard3PaleteBadgecyclePalete').addEventListener('dragstart', paleteDragStart, false);
    document.getElementById('wildcard4PaleteBadgecyclePalete').addEventListener('dragstart', paleteDragStart, false);
    document.getElementById('wildcard5PaleteBadgecyclePalete').addEventListener('dragstart', paleteDragStart, false);
    document.getElementById('wildcard6PaleteBadgecyclePalete').addEventListener('dragstart', paleteDragStart, false);

    this.update = function(){
    };

    reloadCycle();
    suspendCycleRequest();

}


//functions for drag and drop event listeners to call////////////////////////////////////////////////////
function paleteDragStart(){
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', this.id.slice(0, this.id.indexOf('PaleteBadge')));
    window.cyclePointer.currentDrag = this.id;
}

//what to do when user drops a command on a spacer div:
function spacerDrop(event){
    event.stopPropagation();

    spacerDragLeave.apply(this);

    var targetIndex,
        payload = event.dataTransfer.getData('text/plain');
    //determine ID of right-hand spacer in the pair:
    targetIndex = this.id.slice(this.id.indexOf('Spacer')+6, this.id.length);

    //if a command was getting dragged, move it into position:
    if(payload.slice(0,9) == 'cycleStep'){
        moveCommand(payload.slice(9,payload.length), targetIndex);
    //otherwise handle a new command getting dropped in:
    } else{
        //make the cycle step per usual:
        createCycleStep(payload);
        //and move it to where it should go:
        moveCommand(window.cyclePointer.nCycleSteps, targetIndex);
        window.cyclePointer.nCycleSteps++;
    }

    //move a command from one place in the sequence to another:    
    function moveCommand(origin, destination){
        document.getElementById('cycleSteps').insertBefore(document.getElementById('cycleStep'+origin), document.getElementById('rightCycleSpacer' + destination).nextSibling);
        document.getElementById('cycleSteps').insertBefore(document.getElementById('cycleStepsBreak'+origin), document.getElementById('cycleStep'+origin).nextSibling);
        document.getElementById('cycleSteps').insertBefore(document.getElementById('leftCycleSpacer'+origin), document.getElementById('cycleStepsBreak'+origin).nextSibling );
        document.getElementById('cycleSteps').insertBefore(document.getElementById('rightCycleSpacer'+origin), document.getElementById('leftCycleSpacer'+origin).nextSibling );
    }

    askForCycleDeploy();

    return false;
}

//change border colors on drag enter and leave for timeline:
function spacerDragOver(){
    event.stopPropagation();
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';

    document.getElementById('rightCycleSpacer'+this.id.slice(this.id.indexOf('Spacer')+6, this.id.length)).style.borderColor = '#FFFFFF';

    return false;
}

function spacerDragLeave(){
    event.stopPropagation();

    document.getElementById('rightCycleSpacer'+this.id.slice(this.id.indexOf('Spacer')+6, this.id.length)).style.borderColor = '#999999';

    return false;
}

//cycle steps can append subcommands to themselves on drop:
function cycleDrop(event){
    event.stopPropagation();

    cycleDragLeave.apply(this);

    var contentBlock = document.getElementById(this.contentID),
        payload = event.dataTransfer.getData('text/plain')

    //do stuff with the payload data
    if(!(payload.slice(0,9)=='cycleStep')){
        if(contentBlock.innerHTML.indexOf(window.cyclePointer.helpMessage) != -1){
            contentBlock.innerHTML = '';
            contentBlock.setAttribute('class', 'cycleContent'); 
        }
        deployBadge.apply(window.cyclePointer, [payload, contentBlock.id]);
    }

    askForCycleDeploy();

    return false;   
}

function cycleDragOver(event){
    event.stopPropagation();
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';

    if(!(window.cyclePointer.currentDrag.slice(0,9)=='cycleStep'))
        this.style.borderColor = '#FFFFFF';
    return false;
}

function cycleDragLeave(){
    event.stopPropagation();

    this.style.borderColor = '#999999';

    return false;
}

//extended page elements/////////////////////////////////////////////////////////////////////////////////////////////

//create a cycle step div based on the <input> recieved from the drop event:
function createCycleStep(input){
    var stepDiv;

    //actual div
    injectDOM('div', 'cycleStep'+window.cyclePointer.nCycleSteps, 'cycleSteps', {'class':'cycleStep', 'style':'display:inline-block; margin-left:auto; margin-right:auto;'});
    stepDiv = document.getElementById('cycleStep'+window.cyclePointer.nCycleSteps);
    stepDiv.draggable = 'true';

    //the div's draggable data payload should be its id:
    stepDiv.addEventListener('dragstart', function(event){
        event.dataTransfer.effectAllowed = 'move';
        event.dataTransfer.setData('text/plain', this.id );
        //in their infinite wisdom, Standards appears to have made it impossible to access the data payload during dragover; store it with a global pointer to circumvent.
        window.cyclePointer.currentDrag = this.id;
    }, false);

    //content block:
    stepDiv.contentID = 'cycleContent'+window.cyclePointer.nCycleSteps
    injectDOM('div', stepDiv.contentID, 'cycleStep'+window.cyclePointer.nCycleSteps, {
        'class':'cycleContent',
        'style': 'max-width:'+0.2*$(window.cyclePointer.wrapper).width()
    });
    //deploy the div with something in it:
    //document.getElementById(stepDiv.contentID).innerHTML = input;
    deployBadge.apply(window.cyclePointer, [input, 'cycleContent'+window.cyclePointer.nCycleSteps]);

    //kill button
    injectDOM('button', 'deleteCycleStep'+window.cyclePointer.nCycleSteps, 'cycleStep'+window.cyclePointer.nCycleSteps, {
        'class' : 'deleteButton',
        'style' : 'position:static; float:right;',
        'innerHTML' : String.fromCharCode(0x2573),
        'type' : 'button',
        'onclick' : function(){
            //delete only if there's a button to make a new div:
            if(document.getElementById('terminateCycle')){
                //delete linebreak:
                var linebreak = document.getElementById('cycleStepsBreak'+this.id.slice(15, this.id.length));
                linebreak.parentNode.removeChild(linebreak);
                //delete timeline divs:
                var leftDiv = document.getElementById('leftCycleSpacer'+this.id.slice(15, this.id.length));
                leftDiv.parentNode.removeChild(leftDiv);
                var rightDiv = document.getElementById('rightCycleSpacer'+this.id.slice(15, this.id.length));
                rightDiv.parentNode.removeChild(rightDiv);
                //delete cycle div:
                var element = document.getElementById(this.id);
                element.parentNode.parentNode.removeChild(element.parentNode);
                askForCycleDeploy();
            }
        }
    });

    //duration block:
    durationBadge(window.cyclePointer.nCycleSteps, 'cycleStep'+window.cyclePointer.nCycleSteps);

    //cycleStep div listens for things to be dropped on it:
    stepDiv.addEventListener('dragover', cycleDragOver, false);
    stepDiv.addEventListener('dragleave', cycleDragLeave, false);
    stepDiv.addEventListener('drop', cycleDrop, false);
    
    injectDOM('br', 'cycleStepsBreak'+window.cyclePointer.nCycleSteps, 'cycleSteps', {});
    injectDOM('div', 'leftCycleSpacer'+window.cyclePointer.nCycleSteps, 'cycleSteps', {'style':'display:inline-block; height:50px; width:50%'});
    injectDOM('div', 'rightCycleSpacer'+window.cyclePointer.nCycleSteps, 'cycleSteps', {'style':'display:inline-block; border-left: 5px solid #999999; height:50px; width:50%'});

    //spacers listen for things to be dropped on them, so commands can be inserted mid-stream
    document.getElementById('leftCycleSpacer'+window.cyclePointer.nCycleSteps).addEventListener('dragover', spacerDragOver, false);
    document.getElementById('rightCycleSpacer'+window.cyclePointer.nCycleSteps).addEventListener('dragover', spacerDragOver, false);
    document.getElementById('leftCycleSpacer'+window.cyclePointer.nCycleSteps).addEventListener('drop', spacerDrop, false);
    document.getElementById('rightCycleSpacer'+window.cyclePointer.nCycleSteps).addEventListener('drop', spacerDrop, false);
    //spacers change color when something droppable this way comes, change it back when the drag leaves:
    document.getElementById('leftCycleSpacer'+window.cyclePointer.nCycleSteps).addEventListener('dragleave', spacerDragLeave, false);
    document.getElementById('rightCycleSpacer'+window.cyclePointer.nCycleSteps).addEventListener('dragleave', spacerDragLeave, false);

    //move the termination badge to the end:
    if(document.getElementById('terminateCycle'))   
        document.getElementById('cycleSteps').appendChild(document.getElementById('terminateCycle'));

}

//create a cycle summary step
function createCycleSummaryStep(encoding, duration, suppressFlow){
    var stepDiv, i, command, key, allowIndividualTrig, durationString;

    //determine duration:
    if(duration==0)
        durationString = 'Infinite';
    else if(duration > 60000)
        durationString = (duration/60000).toFixed(2) + ' min';
    else if(duration>1000)
        durationString = (duration/1000).toFixed(2) + ' s';
    else
        durationString = duration + ' ms';

    //step wrapper
    injectDOM('div', 'cycleSummaryStep'+window.cyclePointer.nCycleSummarySteps, 'cycleSummaryWrapper', {'class':'cycleStep', 'style':'display:inline-block; margin-left:auto; margin-right:auto;'});
    stepDiv = document.getElementById('cycleSummaryStep'+window.cyclePointer.nCycleSummarySteps);

    //content block:
    stepDiv.contentID = 'cycleSummaryContent'+window.cyclePointer.nCycleSummarySteps
    injectDOM('div', stepDiv.contentID, 'cycleSummaryStep'+window.cyclePointer.nCycleSummarySteps, {
        'class':'cycleContent',
        'style': 'max-width:'+0.2*$(window.cyclePointer.wrapper).width()
    });

    //duration block:
    injectDOM('p', 'cycleSummaryDuration'+window.cyclePointer.nCycleSummarySteps, 'cycleSummaryStep'+window.cyclePointer.nCycleSummarySteps, {
        'innerHTML':durationString,
        'class' : 'cycleSummaryDuration'
    });
    document.getElementById('cycleSummaryDuration'+window.cyclePointer.nCycleSummarySteps).style.top = $('#cycleSummaryStep'+window.cyclePointer.nCycleSummarySteps).height()*(-0.5);

    //populate content block
    command = parseCommand(encoding);
    //deploy the appropriate badges:
    //either all trigs is enabled, or allow individual system triggers:
    allowIndividualTrig = 0;
    if(command['triggersOn'] == 1)
        deployBadge.apply( window.cyclePointer, ['triggersOn', 'cycleSummaryContent'+(window.cyclePointer.nCycleSummarySteps)] );
    else
        allowIndividualTrig = 1;
    for(key in command){
        if(command[key] == 1 && key!='triggerOn' && !(key.slice(0,6)=='enable' && allowIndividualTrig==0 ) )
            deployBadge.apply(window.cyclePointer, [key, 'cycleSummaryContent'+(window.cyclePointer.nCycleSummarySteps)]);
    }        
    
    if(!suppressFlow){
        injectDOM('br', 'cycleSummaryStepsBreak'+window.cyclePointer.nCycleSummarySteps, 'cycleSummaryWrapper', {});
        injectDOM('div', 'leftCycleSummarySpacer'+window.cyclePointer.nCycleSummarySteps, 'cycleSummaryWrapper', {'style':'display:inline-block; height:50px; width:50%'});
        injectDOM('div', 'rightCycleSummarySpacer'+window.cyclePointer.nCycleSummarySteps, 'cycleSummaryWrapper', {'style':'display:inline-block; border-left: 5px solid #999999; height:50px; width:50%'});
    }

    window.cyclePointer.nCycleSummarySteps++;
}

//create a timeline termination badge that includes a button to create a new empty command:
function terminationBadge(){
    injectDOM('div', 'terminateCycle', 'cycleSteps', {'style':'background-color:#222222'});
    injectDOM('button', 'newCommand', 'terminateCycle', {
        'class' : 'navLink',
        'innerHTML' : 'New Command',
        'type' : 'button',
        'onclick' : function(){
            createCycleStep(window.cyclePointer.helpMessage);
            document.getElementById('cycleContent'+window.cyclePointer.nCycleSteps).setAttribute('class', 'delayCycleContent') 
            window.cyclePointer.nCycleSteps++;
            askForCycleDeploy();
        }
    });
}

//create a duration control badge for deployment in each cycle step
function durationBadge(index, parentID){
    var canvas, context;

    //wrapper div
    injectDOM('div', 'durationDiv'+index, parentID, {'style' : 'float:right; display:inline-block; text-align:center; margin-left:5px;'});
    //number input
    injectDOM('input', 'durationInput'+index, 'durationDiv'+index, {
        'class' : 'cycleDurationInput',
        'type' : 'number',
        'style' : 'background-color:#222222'
    });
    injectDOM('p', 'infiniteDuration'+index, 'durationDiv'+index, {
        'style' : 'display:none; font-size:230%; margin:0px;',
        'innerHTML' : String.fromCharCode(0x221E)
    });
    injectDOM('br', 'durationBreak'+index, 'durationDiv'+index, {});
    //unit
    createOptionScroll('durationDiv'+index, 'durationScroll'+index, ['millisec', 'seconds', 'minutes', 'infinite'], window.cyclePointer.badgeWidth*1.3,
        function(){
            if(document.getElementById('durationScroll'+index+'Selected').innerHTML == 'infinite'){
                document.getElementById('durationInput'+index).style.display = 'none';
                document.getElementById('durationSlider'+index).style.display = 'none';
                document.getElementById('durationBreak'+index).style.display = 'none';
                document.getElementById('infiniteDuration'+index).style.display = 'block';
            } else{
                document.getElementById('durationInput'+index).style.display = '';
                document.getElementById('durationSlider'+index).style.display = '';
                document.getElementById('durationBreak'+index).style.display = '';
                document.getElementById('infiniteDuration'+index).style.display = 'none';                
            }
            askForCycleDeploy();
        });
    //when infinite is selected, remove UI elements and just show infinite:
    injectDOM('br', 'break', 'durationDiv'+index, {});
    //slider
    injectDOM('input', 'durationSlider'+index, 'durationDiv'+index, {'style':'width:80%; margin:0px', 'type':'range'});
    document.getElementById('durationSlider'+index).min = 0;
    document.getElementById('durationSlider'+index).max = 1000;
    document.getElementById('durationSlider'+index).onchange = function(){
        document.getElementById('durationInput'+index).value = this.valueAsNumber;
        askForCycleDeploy();
    }
    document.getElementById('durationInput'+index).value = document.getElementById('durationSlider'+index).valueAsNumber;
    document.getElementById('durationInput'+index).min = 0;
    document.getElementById('durationInput'+index).max = 1000;
    document.getElementById('durationInput'+index).onchange = function(){
        document.getElementById('durationSlider'+index).value = this.valueAsNumber;
        askForCycleDeploy();
    }
}

//insert the appropriate badge into the command div:
function deployBadge(badge, commandID){


    if(badge == 'clearScalars')
        deployBadgeCanvas(this.badgeWidth, this.badgeHeight, 'clearScalarsPaleteBadge', commandID, clearScalars, [this.badgeHeight*0.5, this.badgeWidth], 'Clear Scalars', false);
    else if(badge == 'moveTape')
        deployBadgeCanvas(this.badgeWidth, this.badgeHeight, 'moveTapePaleteBadge', commandID, moveTape, [this.badgeWidth, this.badgeHeight, this.badgeWidth/2, this.badgeHeight*0.35], 'Move Tape', false);
    else if(badge == 'triggersOn')
        deployBadgeCanvas(this.badgeWidth, this.badgeHeight, 'triggersOnPaleteBadge', commandID, triggersOn, [this.badgeWidth, this.badgeHeight, this.badgeWidth/2, this.badgeHeight*0.35], 'Triggers On', false);
    else if(badge == 'beamOn')
        deployBadgeCanvas(this.badgeWidth, this.badgeHeight, 'beamOnPaleteBadge', commandID, beamOn, [this.badgeWidth, this.badgeHeight, this.badgeWidth/2, this.badgeHeight*0.35], 'Beam On', false);
    else if(badge == 'syncClocks')
        deployBadgeCanvas(this.badgeWidth, this.badgeHeight, 'syncClocksPaleteBadge', commandID, syncClocks, [this.badgeWidth, this.badgeHeight, this.badgeWidth/2, this.badgeHeight*0.35], 'Sync Clocks', false);
    else if(badge == 'HPGe')
        deployBadgeCanvas(this.badgeWidth, this.badgeHeight, 'HPGePaleteBadge', commandID, tigress, [this.badgeWidth/2, this.badgeHeight*0.35, this.badgeHeight*0.3], 'HPGe', false);
    else if(badge == 'SCEPTAR')
        deployBadgeCanvas(this.badgeWidth, this.badgeHeight, 'SCEPTARPaleteBadge', commandID, sceptar, [this.badgeWidth/2, this.badgeHeight*0.35, this.badgeHeight*0.3], 'SCEPTAR', false);
    else if(badge == 'PACES')
        deployBadgeCanvas(this.badgeWidth, this.badgeHeight, 'PACESPaleteBadge', commandID, paces, [this.badgeWidth/2, this.badgeHeight*0.35, this.badgeHeight*0.2, this.badgeHeight*0.05], 'PACES', false);
    else if(badge == 'DANTE')
        deployBadgeCanvas(this.badgeWidth, this.badgeHeight, 'DANTEPaleteBadge', commandID, dante, [this.badgeWidth/2, this.badgeHeight*0.35, this.badgeHeight*0.2, '#999999'], 'DANTE', false);
    else if(badge == 'DESCANT')
        deployBadgeCanvas(this.badgeWidth, this.badgeHeight, 'DESCANTPaleteBadge', commandID, descant, [this.badgeWidth/2, this.badgeHeight*0.35, this.badgeHeight*0.1], 'DESCANT', false);
    else if(badge == 'ZDS')
        deployBadgeCanvas(this.badgeWidth, this.badgeHeight, 'ZDSPaleteBadge', commandID, zds, [this.badgeWidth/2, this.badgeHeight*0.35, this.badgeHeight*0.3], 'ZDS', false);
    else if(badge == 'wildcard1')
        deployBadgeCanvas(this.badgeWidth, this.badgeHeight, 'wildcard1PaleteBadge', commandID, wildcard, [this.badgeWidth, this.badgeHeight, this.badgeWidth/2, this.badgeHeight*0.35], 'Wildcard 1', false);
    else if(badge == 'wildcard2')
        deployBadgeCanvas(this.badgeWidth, this.badgeHeight, 'wildcard2PaleteBadge', commandID, wildcard, [this.badgeWidth, this.badgeHeight, this.badgeWidth/2, this.badgeHeight*0.35], 'Wildcard 2', false);
    else if(badge == 'wildcard3')
        deployBadgeCanvas(this.badgeWidth, this.badgeHeight, 'wildcard3PaleteBadge', commandID, wildcard, [this.badgeWidth, this.badgeHeight, this.badgeWidth/2, this.badgeHeight*0.35], 'Wildcard 3', false);
    else if(badge == 'wildcard4')
        deployBadgeCanvas(this.badgeWidth, this.badgeHeight, 'wildcard4PaleteBadge', commandID, wildcard, [this.badgeWidth, this.badgeHeight, this.badgeWidth/2, this.badgeHeight*0.35], 'Wildcard 4', false);
    else if(badge == 'wildcard5')
        deployBadgeCanvas(this.badgeWidth, this.badgeHeight, 'wildcard5PaleteBadge', commandID, wildcard, [this.badgeWidth, this.badgeHeight, this.badgeWidth/2, this.badgeHeight*0.35], 'Wildcard 5', false);
    else if(badge == 'wildcard6')
        deployBadgeCanvas(this.badgeWidth, this.badgeHeight, 'wildcard6PaleteBadge', commandID, wildcard, [this.badgeWidth, this.badgeHeight, this.badgeWidth/2, this.badgeHeight*0.35], 'Wildcard 6', false);
    else{
        document.getElementById(commandID).innerHTML = badge;
        document.getElementById(commandID).setAttribute('class', 'delayCycleContent');
    }
}

//step through the cycle, and construct the appropriate command and duration arrays
function buildCycle(){
    var i, j, commandNode, contentNode, actionNode, stepCode, duration, timeUnit,
        //nCycleSteps = (document.getElementById('cycleSteps').childNodes.length-1)/4, //-1 for the termination badge, /4 for command+2spacers+linebreak.
        commands = [],
        durations = [];

        for(i=0; i<window.cyclePointer.nCycleSteps; i++){
            commandNode = document.getElementById('cycleStep'+i);
            if(commandNode){
                contentNode = document.getElementById('cycleContent'+i);
                stepCode = 0;
                if(contentNode.childNodes.length != 1 || contentNode.childNodes[0].nodeType != Node.TEXT_NODE){
                    for(j=0; j<contentNode.childNodes.length; j++){
                        actionNode = contentNode.childNodes[j];
                        if(actionNode.id.indexOf('cycleContent') != -1){
                            stepCode = stepCode | window.cyclePointer.codex[actionNode.id.slice(0, actionNode.id.indexOf('Palete'))];
                        }
                    }
                }
                //first 16 bits mirror last 16 bits for redundancy:
                stepCode = stepCode | (stepCode<<16)
                commands[commands.length] = stepCode;
                //extract duration in ms:
                duration = document.getElementById('durationInput'+i).valueAsNumber;
                timeUnit = document.getElementById('durationScroll'+i+'Selected').innerHTML;
                if(timeUnit == 'seconds')
                    duration *= 1000;
                else if(timeUnit == 'minutes')
                    duration *= 1000*60;
                else if(timeUnit == 'infinite')
                    duration = 0;
                durations[durations.length] = duration;                
            }     


        }

        return [commands, durations];
}

//parse a 32bit command word into its component actions:
function parseCommand(command){
    var key,
        actions = JSON.parse(JSON.stringify(window.cyclePointer.codex));

    for(key in window.cyclePointer.codex){
        if(command & window.cyclePointer.codex[key])
            actions[key] = 1;
        else
            actions[key] = 0;
    }

    return actions;
}

//deploy a command step as defined by its command word and duration:
function deployCommand(command, duration){
    var key, time, units, durationBadge, allowIndividualTrig,
        actions = parseCommand(command);

    //use the new command button to insert a new command:
    document.getElementById('newCommand').onclick();
    for(key in actions){
        if(actions[key] == 1){
            document.getElementById('cycleContent'+(window.cyclePointer.nCycleSteps-1)).setAttribute('class', 'cycleContent');
            document.getElementById('cycleContent'+(window.cyclePointer.nCycleSteps-1)).innerHTML = '';
            break;
        }
    }

    //deploy the appropriate badges:
    //either all trigs is enabled, or allow individual system triggers:
    allowIndividualTrig = 0;
    if(actions['triggersOn'] == 1)
        deployBadge.apply( window.cyclePointer, ['triggersOn', 'cycleContent'+(window.cyclePointer.nCycleSteps-1)] );
    else
        allowIndividualTrig = 1;
    for(key in actions){
        if(actions[key] == 1 && key!='triggerOn' && !(key.slice(0,6)=='enable' && allowIndividualTrig==0 ) )
            deployBadge.apply(window.cyclePointer, [key, 'cycleContent'+(window.cyclePointer.nCycleSteps-1)]);
    }

    //set the duration badge:
    if(duration >= 60000){
        time = Math.floor(duration/60000);
        unit = 'minutes';
    } else if(duration >= 1000){
        time = Math.floor(duration/1000);
        unit = 'seconds';
    } else if(duration == 0){
        time = duration;
        unit = 'infinite';
    } else{
        time = duration;
        unit = 'millisec';
    }
    durationBadge = document.getElementById('durationDiv'+(window.cyclePointer.nCycleSteps-1));
    if(time!=0){
        durationBadge.childNodes[0].value = time;
        durationBadge.childNodes[5].value = time;
    }
    while(durationBadge.childNodes[3].childNodes[1].innerHTML != unit)
         durationBadge.childNodes[3].childNodes[2].onclick();

}

//fetch the top-level subkeys from an ODB directory as a set of dropdown options, for use in Filters and Cycles:
function loadOptions(location, dropdown){
    var key, i=0,
        option = [];

    for(key in location){
        if(location.hasOwnProperty(key) && typeof location[key] == 'object' && !Array.isArray(location[key]) ){
            option[i] = document.createElement('option');
            option[i].text = key;
            option[i].value = i;
            document.getElementById(dropdown).add(option[i], null);
            i++;
        }
    }
}

//write the defined cycle to the ODB for later use
function saveCycle(){
    
    var deleteCode, option, cycle = buildCycle();
        name = document.getElementById('cycleName').value,

    //remove old instance of this cycle, in case this is an edit:
    deleteCode = JSON.parse(ODBMDelete(['/DashboardConfig/Cycles/'+name]));
    //recreate:
    ODBMCreate(['/DashboardConfig/Cycles/'+name, '/DashboardConfig/Cycles/'+name+'/Code', '/DashboardConfig/Cycles/'+name+'/Duration'], [TID_KEY, TID_INT, TID_INT]);
    //insert data:
    ODBSet('/DashboardConfig/Cycles/'+name+'/Code[*]', cycle[0]);
    ODBSet('/DashboardConfig/Cycles/'+name+'/Duration[*]', cycle[1]);

    //regrab parameter store; performant enough or update local copy by hand to avoid traffic? TBD.
    fetchODB();

    //include in dropdown if new
    if(deleteCode[0] == 312){
        option = document.createElement('option');
        option.text = name;
        option.value = window.cyclePointer.cycleNames.length;
        window.cyclePointer.cycleNames[window.cyclePointer.cycleNames.length] = name;
        document.getElementById('cycleOptions').add(option, null);
    }
}

//delete a Filter or Cycle option:
function deleteOption(ODBpointer, dropdown){
    var i,
        dropdown = document.getElementById(dropdown),
        cycleIndex = parseInt(dropdown.value, 10),
        name;
        //find name and remove from dropdown
        for(i=0; i<dropdown.childNodes.length; i++){
            if(dropdown.childNodes[i].value == cycleIndex){
                name = dropdown.childNodes[i].innerHTML;
                dropdown.childNodes[i].parentNode.removeChild(dropdown.childNodes[i]);
            }            
        }

    //remove from ODB
    ODBMDelete([ODBpointer+name]);
    //technically the cycle is still floating around in memory now until page refresh.
}

//load the defined cycle into the ODB for present use:
function commitCycle(){

    var cycle = buildCycle(),
        i;

    ODBMDelete(['/DashboardConfig/Cycles/Active Pattern', '/DashboardConfig/Cycles/Active Duration']);
    ODBMCreate(['/DashboardConfig/Cycles/Active Pattern', '/DashboardConfig/Cycles/Active Duration'], [TID_INT, TID_INT]);

    ODBSet('/DashboardConfig/Cycles/Active Pattern[*]', cycle[0]);
    ODBSet('/DashboardConfig/Cycles/Active Duration[*]', cycle[1]);
    ODBSet('/DashboardConfig/Cycles/Active Name', document.getElementById('cycleName').value);

    //regrab ODB
    fetchODB();

    //load the active cycle from the ODB:
    window.cyclePointer.nCycleSummarySteps = 0;
    document.getElementById('cycleSummaryWrapper').innerHTML = '';
    for(i=0; i<ODB.Cycles['Active Pattern'].length; i++){
        createCycleSummaryStep(ODB.Cycles['Active Pattern'][i], ODB.Cycles['Active Duration'][i], Math.floor((i+1)/ODB.Cycles['Active Pattern'].length));
    }

    suspendCycleRequest();
}

//load whatever the ODB has currently registered as the active cycle
function reloadCycle(){
    var i;

    //dump whatever's displayed currently:
    resetCycle();
    //load the active cycle from the ODB:
    for(i=0; i<ODB.Cycles['Active Pattern'].length; i++){
        deployCommand(ODB.Cycles['Active Pattern'][i], ODB.Cycles['Active Duration'][i] );
        if(i==0){
            window.cyclePointer.nCycleSummarySteps = 0;
            document.getElementById('cycleSummaryWrapper').innerHTML = '';
        }
        createCycleSummaryStep(ODB.Cycles['Active Pattern'][i], ODB.Cycles['Active Duration'][i], Math.floor((i+1)/ODB.Cycles['Active Pattern'].length));
    }

    document.getElementById('cycleName').value = ODB.Cycles['Active Name'];

    suspendCycleRequest();
}

//load the chosen cycle
function loadCycle(){
    var i, nSteps, startIndex,
        cycleIndex = parseInt(document.getElementById('cycleOptions').value, 10),  //which cycle has been requested?
        name = document.getElementById('cycleOptions').childNodes[cycleIndex].text;

    //write the name of the cycle in the cycle name box
    document.getElementById('cycleName').value = name;

    //dump whatever's displayed currently:
    resetCycle();

    //weirdness with one-entry array, workaround for now:
    if(ODB.Cycles[name].Code.length > 1){
        for(i=0; i<ODB.Cycles[name].Code.length; i++){
            deployCommand(parseInt(ODB.Cycles[name].Code[i],10), parseInt(ODB.Cycles[name].Duration[i],10));
        }
    } else {
        deployCommand(parseInt(ODB.Cycles[name].Code,10), parseInt(ODB.Cycles[name].Duration,10));
    }

    //if reloading the active cycle, dismiss any requests for cycle deployment:
    if(name == ODB.Cycles['Active Name'])
        suspendCycleRequest();
}

//dump all commands:
function resetCycle(){
    document.getElementById('cycleSteps').innerHTML = ''
    window.cyclePointer.nCycleSteps = 0;
    terminationBadge();
}

//start the deploy cycle button flashing:
function askForCycleDeploy(){
    document.getElementById('commitCycle').style.webkitAnimationName = 'alertBorder';
    document.getElementById('commitCycle').style.mozAnimationName = 'alertBorder';
}

//suspend request for cycle deployment
function suspendCycleRequest(){
    document.getElementById('commitCycle').style.webkitAnimationName = 'x';
    document.getElementById('commitCycle').style.mozAnimationName = 'x';    
}
