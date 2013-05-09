//collect the form input and do something with it.  Expect form 'setValues', which
//begins with a pair of radio buttons for channel on off, then has an arbitrary 
//no. of text fields for inputting whatever else.

function updateParameter(){

	var i;
    
	var userInputs = [];

    //clear commit button highlighting:
    unhighlight('submitParameters');

    //loop over all elements in the form except the first three (off/on/submit)
	for(i=3; i<document.getElementById('setValues').elements.length; i++){
		userInputs[i-3] = getInput('setValues', i);
	}

    //determine where this cell falls in MIDAS vector:
    var ODBindex = getMIDASindex(window.griffinDialogY, window.griffinDialogX, window.HVview);

    //switch channel on/off
    if(document.getElementById('onButton').checked == true){
      ODBSet("/Equipment/HV/Settings/ChState["+ODBindex+"]",1);
    }
    else{
      ODBSet("/Equipment/HV/Settings/ChState["+ODBindex+"]",0);
    }

    //set demand voltage:
    ODBSet("/Equipment/HV/Variables/Demand["+ODBindex+"]", parseFloat(userInputs[0]));

    //set ramp up voltage:
    ODBSet("/Equipment/HV/Settings/Ramp Up Speed["+ODBindex+"]", parseFloat(userInputs[1]));

    //set ramp down voltage:
    ODBSet("/Equipment/HV/Settings/Ramp Down Speed["+ODBindex+"]", parseFloat(userInputs[2]));

    //once the ODB has been updated, kick the loop to update immediately:
    clearTimeout(window.loop);
    startLoop();

}

//extract information from the field at position <fieldIndex> from a form with id = <formID>
function getInput(formId, fieldIndex){
    var oForm = document.getElementById(formId);
    var oText = oForm.elements[fieldIndex];
    return oText.value;
}

//set values in fields:
function setInput(formId, fieldIndex, setval){
    var oForm = document.getElementById(formId);
    var oText = oForm.elements[fieldIndex];
    oText.value = setval;
}

//dismiss the form without doing anything else:
function abortUpdate(InputLayer){
	var inputDiv = document.getElementById(InputLayer);
	divFade(inputDiv, 'out', 0);
}

//fade the form in / out:
function divFade(targetDiv, direction, frame){

	var FPS = 40;
	var duration = 0.1;
	var nFrames = FPS*duration;
	var alpha;
	var maxOpacity = 0;

	if(frame <= nFrames){
		if(direction === 'in'){
			alpha = maxOpacity*frame/nFrames;
			$(targetDiv).css('background', 'rgba(0,0,0,'+alpha+')');
			targetDiv.style.display = 'block';

		} else if(direction === 'out'){
			alpha = maxOpacity-maxOpacity*frame/nFrames;
			$(targetDiv).css('background', 'rgba(0,0,0,'+alpha+')');
		}
		frame++;

		setTimeout(function(){divFade(targetDiv, direction, frame)}, 1000/FPS);
	} else if(direction === 'out'){
		targetDiv.style.display = 'none';
	}

}

//plugs a new cell into the input interface; used for both onclicks on the waffles, and on button submits 
//in the sidepanel view.
function channelSelect(waffle){

    var inputTitle

    //determine horizontal binning
    var xIndex;
    if(waffle.chy == 0) xIndex = primaryBin(window.parameters.moduleSizes[window.HVview], waffle.chx);
    else xIndex = waffle.chx;

    //Throw up to global so the setter remembers where we're pointing.  TODO: refactor without globals?
    window.griffinDialogX = xIndex;//waffle.chx;
    window.griffinDialogY = waffle.chy;
	
    var superDiv = document.getElementById(waffle.wrapperDiv);
    var inputDiv = document.getElementById(waffle.InputLayer);

    //set text in dialog box:
    if(waffle.chy != 0) inputTitle = 'Parameters for <br>'+waffle.moduleLabels[primaryBin(window.parameters.moduleSizes[window.HVview], waffle.chx)]+', '+window.parameters.rowTitles[0]+' '+channelMap(waffle.chx, waffle.chy, window.parameters.moduleSizes[window.HVview], waffle.rows) + ' (' + waffle.dataBus[window.HVview].channelName[waffle.chy][xIndex] + ')';
    else inputTitle = 'Parameters for <br>'+waffle.moduleLabels[primaryBin(window.parameters.moduleSizes[window.HVview], waffle.chx)]+' Primary';
    document.getElementById('inputTitle').innerHTML = inputTitle;

    //these objects get updated every masterLoop:
    //report status word:
    document.getElementById('status').innerHTML = 'Status: '+parseStatusWord(waffle.dataBus[window.HVview].rampStatus[waffle.chy][xIndex]);
    //report current & update voltage slider and meter maximum:
    if(waffle.chy == 0 || window.parameters.moduleSizes[window.HVview][primaryBin(window.parameters.moduleSizes[window.HVview], waffle.chx)]==1){
        waffle.voltageSlider.max = waffle.dataBus[window.HVview].voltLimit[waffle.chy][xIndex];
        meter.max = waffle.dataBus[window.HVview].voltLimit[waffle.chy][xIndex];
        currentMeter.max = waffle.dataBus[window.HVview].currentLimit[waffle.chy][xIndex];
        currentMeter.update(Math.round(waffle.dataBus[window.HVview].reportCurrent[waffle.chy][xIndex]*10000)/10000)
    }
    else{
        waffle.voltageSlider.max = waffle.dataBus[window.HVview].voltLimit[0][primaryBin(window.parameters.moduleSizes[window.HVview], waffle.chx)];
        meter.max = waffle.dataBus[window.HVview].voltLimit[0][primaryBin(window.parameters.moduleSizes[window.HVview], waffle.chx)];
        currentMeter.max = waffle.dataBus[window.HVview].currentLimit[0][primaryBin(window.parameters.moduleSizes[window.HVview], waffle.chx)];
        currentMeter.update('--');
    }

    //update meter position after maximum has been adjusted:
    meter.update(Math.round(waffle.dataBus[window.HVview].reportVoltage[waffle.chy][xIndex]*10000)/10000);
    temperatureMeter.update(Math.round(waffle.dataBus[window.HVview].reportTemperature[waffle.chy][xIndex]*100)/100);

    if(window.refreshInput){
        //set defaults
        if (waffle.dataBus[window.HVview].channelMask[waffle.chy][xIndex] == 1) document.getElementById('onButton').checked = true;
        else document.getElementById('offButton').checked = true;

        //manage sliders
        waffle.voltageSlider.update(Math.round(waffle.dataBus[window.HVview].demandVoltage[waffle.chy][xIndex]*10000)/10000);
        waffle.rampSlider.update(Math.round(waffle.dataBus[window.HVview].demandVrampUp[waffle.chy][xIndex]*10000)/10000);
        waffle.rampDownSlider.update(Math.round(waffle.dataBus[window.HVview].demandVrampDown[waffle.chy][xIndex]*10000)/10000);
        window.refreshInput = 0;

        //set the module
        setInput('changeChannel',0,waffle.moduleLabels[primaryBin(window.parameters.moduleSizes[window.HVview], waffle.chx)]);
        //update channel number list
        reconfigureChannelList(waffle.moduleLabels, window.parameters.moduleSizes[window.HVview], 'ChannelList');
        //set the channel number
        setInput('changeChannel',1,channelMap(waffle.chx, waffle.chy, window.parameters.moduleSizes[window.HVview], waffle.rows));
        if(waffle.chy==0) setInput('changeChannel',1,'Primary');

        //abandon the please update me flag when navigating away from the channel:
        unhighlight('submitParameters');
    }

    //only actually display if the click was on the waffle and not the rest of the canvas:
    if(waffle.chx < waffle.cols && waffle.chy < waffle.rows){
        divFade(inputDiv, 'in', 0);
    }

    //make sure the right sidebar background adjusts to accomodate the interface
    document.getElementById('SidebarBKG').height = Math.max(renderHeight*0.9, 50+parseInt($('#'+waffle.sidebarID).css('height')) );
    tabBKG('SidebarBKG', 'right');
}

//point interface at new channel indicated by user in the 'changeChannel' form.
function gotoNewChannel(event, waffle){
    var i;
 
    //determine y bin:
    var yVal = getInput('changeChannel', 1);
    if(yVal != 'Primary') yVal = parseInt(yVal);
    if (yVal == 'Primary') waffle.chy = 0;
    else waffle.chy = yVal%(waffle.rows-1)+1;

    //determine x bin:
    var xName = getInput('changeChannel', 0);
    //have to map column titles onto index
    var xVal;
    for(var i=0; i<window.parameters.moduleSizes[window.HVview].length; i++){
        if(waffle.moduleLabels[i] == xName) xVal = i;
    }
    waffle.chx = 0;
    for(i=0; i<xVal; i++) waffle.chx += Math.max(window.parameters.moduleSizes[window.HVview][i], 1);
    if(yVal != 'Primary') waffle.chx += Math.floor(yVal/(waffle.rows-1));

    channelSelect(waffle);
}

function parseStatusWord(statusCode){

    if(statusCode == 0) return 'Off';
    else if(statusCode == 1) return 'On';
    else if(statusCode == 3) return 'Ramping Up';
    else if(statusCode == 5) return 'Ramping Down';
    else if(statusCode == 256) return 'External Disable';
    else return 'Unknown Error';
}




