function Cycle(){
    var that = this,
    i;
    window.cyclePointer = that;

    this.wrapperID = window.parameters.wrapper; //ID of wrapping div
    this.canvasID = 'cycleCanvas';         //ID of canvas to paint filter on
    this.linkWrapperID = 'cycleLinks';        //ID of div to contain clock view header
    this.sidebarID = 'cycleSidebar';          //ID of sidebar div
    this.nCycleSteps = 0;
    this.helpMessage = 'Drag an action from the right here to define a command step.';
    this.currentDrag = '';

    this.wrapper = document.getElementById(this.wrapperID);

    //add top level nav button:
    insertDOM('button', 'CycleButton', 'navLink', '', 'statusLink', function(){swapView('cycleLinks', 'cycleCanvas', 'cycleMenus', 'CycleButton');}, 'Cycle');

    //nav wrapper div
    insertDOM('div', this.linkWrapperID, 'navPanel', '', this.wrapperID, '', '')
    //nav header
    insertDOM('h1', 'cycleLinksBanner', 'navPanelHeader', '', this.linkWrapperID, '', 'Edit Cycle');

    insertDOM('br', 'break', '', '', this.linkWrapperID, '', '');
    //nav buttons
    insertDOM('button', 'commitCycle', 'navLink', '', this.linkWrapperID, function(){}, 'Commit Cycle and Return', '', 'button');
    insertDOM('button', 'abortCycle', 'navLink', '', this.linkWrapperID, function(){}, 'Abandon Changes and Return', '', 'button');
    insertDOM('button', 'resetCycle', 'navLink', '', this.linkWrapperID, function(){}, 'Start Over', '', 'button');
    insertDOM('br', 'break', '', '', this.linkWrapperID);
    insertDOM('label', 'cycleNameLabel', '', 'margin-left:10px;', this.linkWrapperID, '', 'Name this Cycle: ');
    insertDOM('input', 'cycleName', '', '', this.linkWrapperID, '', '', '', 'text', 'newCycle');
    document.getElementById('cycleNameLabel').setAttribute('for', 'cycleName');
    insertDOM('br', 'break', '', '', this.linkWrapperID);

    //div structure for drag and drop area: right panel for detector palete, two-div column for Single Stream and Interstream Filters:
    insertDOM('div', 'cycleWrapper', '', 'width:'+0.48*$(this.wrapper).width()+'px; margin-top:1em; display:block', this.linkWrapperID, '', '');
    insertDOM('div', 'cycleSteps', '', 'width:78%; padding:1em; float:left; text-align:center;', 'cycleWrapper', '', '');
    insertDOM('div', 'cyclePalete', 'cycleDiv', 'width:20%; float:right; text-align:center; padding-top:1em;', 'cycleWrapper', '', '');

    //start display off with one drop target, filled with just an instruction on how to proceed:
    createCycleStep(this.helpMessage);
    this.nCycleSteps++;
    terminationBadge();

    //deploy a dummy canvas for the filter view:
    this.canvasWidth = 0// 0.48*$(this.wrapper).width();
    this.canvasHeight = 0 //1*$(this.wrapper).height();
    insertDOM('canvas', this.canvasID, 'monitor', 'top:' + ($('#cycleLinks').height() + 5) +'px;', this.wrapperID, '', '')
    this.canvas = document.getElementById('cycleCanvas');
    this.context = this.canvas.getContext('2d');
    this.canvas.setAttribute('width', this.canvasWidth);
    this.canvas.setAttribute('height', this.canvasHeight);

    //right sidebar
    insertDOM('div', this.sidebarID, 'collapsableSidebar', 'float:right; height:80%;', this.wrapperID, '', '')
    //deploy right bar menu:
    deployMenu(this.sidebarID, ['Cycle'], ['Cycle Details']);    

    //inject options into palete
    this.badgeWidth = document.getElementById('cyclePalete').offsetWidth*0.9;
    this.badgeHeight = 100;
    //Clear Scalars
    deployBadgeCanvas(this.badgeWidth, this.badgeHeight, 'clearScalarsPaleteBadge', 'cyclePalete', clearScalars, [this.badgeWidth, this.badgeHeight, this.badgeWidth/2, this.badgeHeight*0.35], 'Clear Scalars', true);
    //Move Tape
    deployBadgeCanvas(this.badgeWidth, this.badgeHeight, 'moveTapePaleteBadge', 'cyclePalete', moveTape, [this.badgeWidth, this.badgeHeight, this.badgeWidth/2, this.badgeHeight*0.35], 'Move Tape', true);
    //modify the dragstart of the palete badges:
    document.getElementById('clearScalarsPaleteBadgecyclePalete').addEventListener('dragstart', paleteDragStart, false);
    document.getElementById('moveTapePaleteBadgecyclePalete').addEventListener('dragstart', paleteDragStart, false);







    this.update = function(){

    };

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

    //make the cycle step per usual:
    createCycleStep(payload);

    //and move it to where it should go:
    document.getElementById('cycleSteps').insertBefore(document.getElementById('cycleStep'+window.cyclePointer.nCycleSteps), document.getElementById('rightCycleSpacer' + targetIndex).nextSibling);
    document.getElementById('cycleSteps').insertBefore(document.getElementById('leftCycleSpacer'+window.cyclePointer.nCycleSteps), document.getElementById('cycleStep'+window.cyclePointer.nCycleSteps).nextSibling );
    document.getElementById('cycleSteps').insertBefore(document.getElementById('rightCycleSpacer'+window.cyclePointer.nCycleSteps), document.getElementById('leftCycleSpacer'+window.cyclePointer.nCycleSteps).nextSibling );

    //if a command was getting dragged, move it into position:
    if(payload.slice(0,9) == 'cycleStep'){
        //clone HTML
        document.getElementById('cycleContent'+window.cyclePointer.nCycleSteps).innerHTML = document.getElementById(document.getElementById(payload).contentID).innerHTML;
        //delete from old position:
        document.getElementById('deleteCycleStep'+payload.slice(9, payload.length)).onclick();

    //otherwise, just increment the number of commands
    }
    window.cyclePointer.nCycleSteps++;

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
        if(contentBlock.innerHTML.indexOf(window.cyclePointer.helpMessage) != -1)
            contentBlock.innerHTML = event.dataTransfer.getData('text/plain'); 
        else
            contentBlock.innerHTML += event.dataTransfer.getData('text/plain');
    }

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
    insertDOM('div', 'cycleStep'+window.cyclePointer.nCycleSteps, 'cycleStep', '', 'cycleSteps', '', '');
    stepDiv = document.getElementById('cycleStep'+window.cyclePointer.nCycleSteps)
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
    insertDOM('div', stepDiv.contentID, '', 'display:inline;', 'cycleStep'+window.cyclePointer.nCycleSteps, '', '');
    //deploy the div with something in it:
    document.getElementById(stepDiv.contentID).innerHTML = input;

    //duration block:
    durationBadge(window.cyclePointer.nCycleSteps, 'cycleStep'+window.cyclePointer.nCycleSteps);

    //kill button
    insertDOM('button', 'deleteCycleStep'+window.cyclePointer.nCycleSteps, 'deleteButton', 'position:static; float:right;', 'cycleStep'+window.cyclePointer.nCycleSteps, function(){
        //delete only if there's a button to make a new div:
        if(document.getElementById('terminateCycle')){
            //delete timeline divs:
            var leftDiv = document.getElementById('leftCycleSpacer'+this.id.slice(15, this.id.length));
            leftDiv.parentNode.removeChild(leftDiv);
            var rightDiv = document.getElementById('rightCycleSpacer'+this.id.slice(15, this.id.length));
            rightDiv.parentNode.removeChild(rightDiv);
            //delete cycle div:
            var element = document.getElementById(this.id);
            element.parentNode.parentNode.removeChild(element.parentNode);

        }
    }, String.fromCharCode(0x2573), '', 'button');

    //cycleStep div listens for things to be dropped on it:
    stepDiv.addEventListener('dragover', cycleDragOver, false);
    stepDiv.addEventListener('dragleave', cycleDragLeave, false);
    stepDiv.addEventListener('drop', cycleDrop, false);
    

    //spacer divs to create timeline:
    insertDOM('div', 'leftCycleSpacer'+window.cyclePointer.nCycleSteps, '', 'display:inline-block; height:50px; width:50%', 'cycleSteps', '', '');
    insertDOM('div', 'rightCycleSpacer'+window.cyclePointer.nCycleSteps, '', 'display:inline-block; border-left: 5px solid #999999; height:50px; width:50%', 'cycleSteps', '', '');
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

//create a timeline termination badge that includes a button to create a new empty command:
function terminationBadge(){
    insertDOM('div', 'terminateCycle', '', 'border:5px solid #999999; width:30%; margin-left:auto; margin-right:auto;', 'cycleSteps', '', '');
    insertDOM('button', 'newCommand', 'navLink', '','terminateCycle', function(){
        createCycleStep(window.cyclePointer.helpMessage); 
        window.cyclePointer.nCycleSteps++;}, 'New Command', '', 'button');
}

//create a duration control badge for deployment in each cycle step
function durationBadge(index, parentID){
    var canvas, context;

    //wrapper div
    insertDOM('div', 'durationDiv'+index, '', 'display:inline-block; text-align:center;', parentID, '', '');
    //number input
    insertDOM('input', 'durationInput'+index, '', 'background-color:#333333; border:0px; color:#FFFFFF; font-size:200%; font-family:Raleway; width:3em', 'durationDiv'+index, '', '', '', 'number');
    insertDOM('br', 'break', '', '', 'durationDiv'+index);
    //unit
    createOptionScroll('durationDiv'+index, 'durationScroll'+index, ['millisec', 'seconds', 'minutes'], window.cyclePointer.badgeWidth);
    insertDOM('br', 'break', '', '', 'durationDiv'+index);
    //slider
    insertDOM('input', 'durationSlider'+index, '', '', 'durationDiv'+index, '', '', '', 'range');
    document.getElementById('durationSlider'+index).min = 0;
    document.getElementById('durationSlider'+index).max = 1000;
    document.getElementById('durationSlider'+index).onchange = function(){
        document.getElementById('durationInput'+index).value = this.valueAsNumber;
    }
    document.getElementById('durationInput'+index).value = document.getElementById('durationSlider'+index).valueAsNumber;
    

}








