function Cycle(){
    var that = this,
    i;
    window.cyclePointer = that;

    this.wrapperID = window.parameters.wrapper; //ID of wrapping div
    this.canvasID = 'cycleCanvas';         //ID of canvas to paint filter on
    this.linkWrapperID = 'cycleLinks';        //ID of div to contain clock view header
    this.sidebarID = 'cycleSidebar';          //ID of sidebar div
    this.nCycleSteps = 0;
    this.helpMessage = 'Drag an action from the right here to define a command step, or leave as-is for a delay.';
    this.currentDrag = '';
    this.codex = {
        "beamOn"        : 1,    //0x00000001
        "syncClocks"    : 16,   //0x00000010
        "clearScalars"  : 32,   //0x00000020
        "moveTape"      : 64,   //0x00000040
        "enableHPGe"    : 128,  //0x00000080
        "enableSCEPTAR" : 256,  //0x00000100
        "enablePACES"   : 512,  //0x00000200
        "enableDANTE"   : 1024, //0x00000400
        "enableDESCANT" : 2048, //0x00000800
        "triggersOn"    : 3968  //0x00000F80  //as in ALL triggers on.
    };

    this.wrapper = document.getElementById(this.wrapperID);

    //add top level nav button:
    insertDOM('button', 'CycleButton', 'navLink', '', 'statusLink', function(){swapView('cycleLinks', 'cycleCanvas', 'cycleMenus', 'CycleButton');}, 'Cycle');

    //nav wrapper div
    insertDOM('div', this.linkWrapperID, 'navPanel', '', this.wrapperID, '', '')
    //nav header
    insertDOM('h1', 'cycleLinksBanner', 'navPanelHeader', '', this.linkWrapperID, '', 'Edit Cycle');

    insertDOM('br', 'break', '', '', this.linkWrapperID, '', '');
    //nav buttons & cycle save / load interface:
    insertDOM('button', 'commitCycle', 'navLink', '-webkit-animation-name:x; -moz-animation-name:x;', this.linkWrapperID, commitCycle.bind(null), 'Deploy Cycle Now', '', 'button');
    insertDOM('button', 'resetCycle', 'navLink', '', this.linkWrapperID, reloadCycle.bind(null), 'Reload Active Cycle', '', 'button');
    insertDOM('br', 'break', '', '', this.linkWrapperID);
    insertDOM('label', 'cycleNameLabel', '', 'margin-left:10px;', this.linkWrapperID, '', 'Name this Cycle: ');
    insertDOM('input', 'cycleName', '', '', this.linkWrapperID, '', '', '', 'text', 'newCycle');
    insertDOM('button', 'saveCycle', 'navLink', '', this.linkWrapperID, saveCycle.bind(null), 'Save Cycle Definition', '', 'button');
    document.getElementById('cycleNameLabel').setAttribute('for', 'cycleName');
    insertDOM('br', 'break', '', '', this.linkWrapperID);
    insertDOM('label', 'loadCycleLabel', '', 'margin-left:10px;', this.linkWrapperID, '', 'Load Cycle: ');
    insertDOM('select', 'cycleOptions', '', '', this.linkWrapperID, '', '');
    document.getElementById('loadCycleLabel').setAttribute('for', 'cycleOptions');
    loadCycleOptions();
    insertDOM('button', 'loadCycle', 'navLink', '', this.linkWrapperID, loadCycle.bind(null), 'Load', '', 'button');
    insertDOM('button', 'deleteCycle', 'navLink', '', this.linkWrapperID, function(){
        confirm('Delete Cycle Definition', 'Do you really want to delete '+document.getElementById('cycleOptions').childNodes[parseInt(document.getElementById('cycleOptions').value, 10)].text+'?', deleteCycle.bind(null))
    }, 'Delete', '', 'button');


    //div structure for drag and drop area: right panel for detector palete, two-div column for Single Stream and Interstream Filters:
    insertDOM('div', 'cycleWrapper', '', 'width:'+0.48*$(this.wrapper).width()+'px; margin-top:1em; display:block', this.linkWrapperID, '', '');
    insertDOM('div', 'cycleSteps', '', 'width:79%; padding:0.5em; float:left; text-align:center;', 'cycleWrapper', '', '');
    insertDOM('div', 'cyclePalete', 'cycleDiv', 'width:'+0.2*0.48*$(this.wrapper).width()+'; float:right; text-align:center; padding-top:1em; position:relative; top:0px;', 'cycleWrapper', '', '');

    //inject options into palete
    this.badgeWidth = document.getElementById('cyclePalete').offsetWidth*0.6//0.9;
    this.badgeHeight = 100;

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

    //Clear Scalars
    deployBadgeCanvas(this.badgeWidth, this.badgeHeight, 'clearScalarsPaleteBadge', 'cyclePalete', clearScalars, [this.badgeWidth, this.badgeHeight, this.badgeWidth/2, this.badgeHeight*0.35], 'Clear Scalars', true);
    //Move Tape
    deployBadgeCanvas(this.badgeWidth, this.badgeHeight, 'moveTapePaleteBadge', 'cyclePalete', moveTape, [this.badgeWidth, this.badgeHeight, this.badgeWidth/2, this.badgeHeight*0.35], 'Move Tape', true);
    //Trigers On
    deployBadgeCanvas(this.badgeWidth, this.badgeHeight, 'triggersOnPaleteBadge', 'cyclePalete', triggersOn, [this.badgeWidth, this.badgeHeight, this.badgeWidth/2, this.badgeHeight*0.35], 'Triggers On', true);
    //Beam On
    deployBadgeCanvas(this.badgeWidth, this.badgeHeight, 'beamOnPaleteBadge', 'cyclePalete', beamOn, [this.badgeWidth, this.badgeHeight, this.badgeWidth/2, this.badgeHeight*0.35], 'Beam On', true);
    //modify the dragstart of the palete badges:
    document.getElementById('clearScalarsPaleteBadgecyclePalete').addEventListener('dragstart', paleteDragStart, false);
    document.getElementById('moveTapePaleteBadgecyclePalete').addEventListener('dragstart', paleteDragStart, false);
    document.getElementById('triggersOnPaleteBadgecyclePalete').addEventListener('dragstart', paleteDragStart, false);
    document.getElementById('beamOnPaleteBadgecyclePalete').addEventListener('dragstart', paleteDragStart, false);

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
    insertDOM('div', 'cycleStep'+window.cyclePointer.nCycleSteps, 'cycleStep', 'display:inline-block; margin-left:auto; margin-right:auto;', 'cycleSteps', '', '');
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
    insertDOM('div', stepDiv.contentID, 'cycleContent', '', 'cycleStep'+window.cyclePointer.nCycleSteps, '', '');
    //deploy the div with something in it:
    //document.getElementById(stepDiv.contentID).innerHTML = input;
    deployBadge.apply(window.cyclePointer, [input, 'cycleContent'+window.cyclePointer.nCycleSteps]);

    //duration block:
    durationBadge(window.cyclePointer.nCycleSteps, 'cycleStep'+window.cyclePointer.nCycleSteps);

    //kill button
    insertDOM('button', 'deleteCycleStep'+window.cyclePointer.nCycleSteps, 'deleteButton', 'position:static; float:right;', 'cycleStep'+window.cyclePointer.nCycleSteps, function(){
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
    }, String.fromCharCode(0x2573), '', 'button');

    //cycleStep div listens for things to be dropped on it:
    stepDiv.addEventListener('dragover', cycleDragOver, false);
    stepDiv.addEventListener('dragleave', cycleDragLeave, false);
    stepDiv.addEventListener('drop', cycleDrop, false);
    

    //spacer divs to create timeline:
    insertDOM('br', 'cycleStepsBreak'+window.cyclePointer.nCycleSteps, '', '', 'cycleSteps');
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
    insertDOM('div', 'terminateCycle', '', '', 'cycleSteps', '', '');
    insertDOM('button', 'newCommand', 'navLink', '','terminateCycle', function(){
        createCycleStep(window.cyclePointer.helpMessage);
        document.getElementById('cycleContent'+window.cyclePointer.nCycleSteps).setAttribute('class', 'delayCycleContent') 
        window.cyclePointer.nCycleSteps++;
        askForCycleDeploy();
    }, 'New Command', '', 'button');
}

//create a duration control badge for deployment in each cycle step
function durationBadge(index, parentID){
    var canvas, context;

    //wrapper div
    insertDOM('div', 'durationDiv'+index, '', 'display:inline-block; text-align:center; border-left:1px solid #999999; margin-left:5px;', parentID, '', '');
    //number input
    insertDOM('input', 'durationInput'+index, 'cycleDurationInput', '', 'durationDiv'+index, '', '', '', 'number');
    insertDOM('p', 'infiniteDuration'+index, '', 'display:none; font-size:230%; margin:0px;', 'durationDiv'+index, '', String.fromCharCode(0x221E) );
    insertDOM('br', 'durationBreak'+index, '', '', 'durationDiv'+index);
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
    insertDOM('br', 'break', '', '', 'durationDiv'+index);
    //slider
    insertDOM('input', 'durationSlider'+index, '', 'width:80%; margin:0px', 'durationDiv'+index, '', '', '', 'range');
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
        deployBadgeCanvas(this.badgeWidth, this.badgeHeight, 'clearScalarsPaleteBadge', commandID, clearScalars, [this.badgeWidth, this.badgeHeight, this.badgeWidth/2, this.badgeHeight*0.35], 'Clear Scalars', false);
    else if(badge == 'moveTape')
        deployBadgeCanvas(this.badgeWidth, this.badgeHeight, 'moveTapePaleteBadge', commandID, moveTape, [this.badgeWidth, this.badgeHeight, this.badgeWidth/2, this.badgeHeight*0.35], 'Move Tape', false);
    else if(badge == 'triggersOn')
        deployBadgeCanvas(this.badgeWidth, this.badgeHeight, 'triggersOnPaleteBadge', commandID, triggersOn, [this.badgeWidth, this.badgeHeight, this.badgeWidth/2, this.badgeHeight*0.35], 'Triggers On', false);
    else if(badge == 'beamOn')
        deployBadgeCanvas(this.badgeWidth, this.badgeHeight, 'beamOnPaleteBadge', commandID, beamOn, [this.badgeWidth, this.badgeHeight, this.badgeWidth/2, this.badgeHeight*0.35], 'Beam On', false);
    else{
        document.getElementById(commandID).innerHTML = badge;
        document.getElementById(commandID).setAttribute('class', 'delayCycleContent');
    }
}

//step through the cycle, and construct the appropriate command and duration arrays
function buildCycle(){
    var i, j, commandNode, contentNode, actionNode, stepCode, durationNode, duration, timeUnit,
        nCycleSteps = (document.getElementById('cycleSteps').childNodes.length-1)/4, //-1 for the termination badge, /4 for command+2spacers+linebreak.
        commands = [],
        durations = [];

        for(i=0; i<nCycleSteps; i++){
            commandNode = document.getElementById('cycleSteps').childNodes[i*4] ;
            contentNode = commandNode.childNodes[0];
            //build the command word:
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
            durationNode = commandNode.childNodes[1];
            duration = durationNode.firstChild.valueAsNumber;
            timeUnit = durationNode.childNodes[3].childNodes[1].innerHTML;
            if(timeUnit == 'seconds')
                duration *= 1000;
            else if(timeUnit == 'minutes')
                duration *= 1000*60;
            else if(timeUnit == 'infinite')
                duration = 0;
            durations[durations.length] = duration;
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

//fetch the predefined cycle options and make them choices in the loading dropdown:
function loadCycleOptions(){
    var key, i=0,
        option = [];

    for(key in window.parameters.ODB.Cycles){
        if(window.parameters.ODB.Cycles.hasOwnProperty(key) && typeof window.parameters.ODB.Cycles[key] == 'object' && !Array.isArray(window.parameters.ODB.Cycles[key]) ){
            option[i] = document.createElement('option');
            option[i].text = key;
            option[i].value = i;
            document.getElementById('cycleOptions').add(option[i], null);
            i++;
        }
    }
}

//write the defined cycle to the ODB for later use - disabled until ODBSet for strings bug is solved
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
    window.parameters.ODB = fetchODB();

    //include in dropdown if new
    if(deleteCode[0] == 312){
        option = document.createElement('option');
        option.text = name;
        option.value = window.parameters.cycleNames.length-1;
        document.getElementById('cycleOptions').add(option, null);
    } else
        console.log(deleteCode[0])
}

function deleteCycle(){
    var i,
        dropdown = document.getElementById('cycleOptions'),
        cycleIndex = parseInt(dropdown.value, 10),
        name = dropdown.childNodes[cycleIndex].text;

    //remove from ODB
    ODBMDelete(['/DashboardConfig/Cycles/'+name]);

    //remove from dropdown
    for(i=0; i<dropdown.childNodes.length; i++){
        if(dropdown.childNodes[i].value == cycleIndex){
            dropdown.childNodes[i].parentNode.removeChild(dropdown.childNodes[i]);
        }
    }

    //technically the cycle is still floating around in memory now until page refresh.
}

//load the defined cycle into the ODB for present use:
function commitCycle(){
    var cycle = buildCycle();

    ODBMDelete(['/DashboardConfig/Cycles/Active Pattern', '/DashboardConfig/Cycles/Active Duration']);
    ODBMCreate(['/DashboardConfig/Cycles/Active Pattern', '/DashboardConfig/Cycles/Active Duration'], [TID_INT, TID_INT]);

    ODBSet('/DashboardConfig/Cycles/Active Pattern[*]', cycle[0]);
    ODBSet('/DashboardConfig/Cycles/Active Duration[*]', cycle[1]);
    ODBSet('/DashboardConfig/Cycles/Active Name', document.getElementById('cycleName').value);
    window.parameters.liveCycle = cycle;
    window.parameters.liveCycleName = document.getElementById('cycleName').value;
    suspendCycleRequest();

    //regrab ODB
    window.parameters.ODB = fetchODB();
}

//load whatever the ODB has currently registered as the active cycle
function reloadCycle(){
    var i;

    //dump whatever's displayed currently:
    resetCycle();
    //load the active cycle from the ODB:
    for(i=0; i<window.parameters.liveCycle[0].length; i++){
        deployCommand(window.parameters.liveCycle[0][i], window.parameters.liveCycle[1][i] );
    }

    document.getElementById('cycleName').value = window.parameters.liveCycleName;

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
    if(window.parameters.ODB.Cycles[name].Code.length > 1){
        for(i=0; i<window.parameters.ODB.Cycles[name].Code.length; i++){
            deployCommand(parseInt(window.parameters.ODB.Cycles[name].Code[i],10), parseInt(window.parameters.ODB.Cycles[name].Duration[i],10));
        }
    } else {
        deployCommand(parseInt(window.parameters.ODB.Cycles[name].Code,10), parseInt(window.parameters.ODB.Cycles[name].Duration,10));
    }

    //if reloading the active cycle, dismiss any requests for cycle deployment:
    if(name == window.parameters.liveCycleName)
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
