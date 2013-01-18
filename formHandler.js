//collect the form input and do something with it.  Expect form 'setValues', which
//begins with a pair of radio buttons for channel on off, then has an arbitrary 
//no. of text fields for inputting whatever else.

function updateParameter(InputLayer){

	var i;
	var userInputs = [];

    //loop over all elements in the form except the first two (off/on) and last one (submit)
	for(i=2; i<document.getElementById('setValues').elements.length - 1; i++){
		userInputs[i-2] = getInput('setValues', i);
	}

    //determine where this cell falls in MIDAS vector:
    var MIDASindex = getMIDASindex(window.griffinDialogY, window.griffinDialogX);

    //some dummy behavior, replace the rest of this function with more exciting things
    var onoff;
    if(document.getElementById('onButton').checked == true) onoff = 'on'
    else onoff = 'off'

    alert(onoff+' '+userInputs[0]);    

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

    //Throw up to global so the setter remembers where we're pointing.  TODO: refactor without globals?
    window.griffinDialogX = waffle.chx;
    window.griffinDialogY = waffle.chy;
	
    var superDiv = document.getElementById(waffle.wrapperDiv);
    var inputDiv = document.getElementById(waffle.InputLayer);

    //set text in dialog box:
    if(waffle.chy != 0) inputTitle = 'Parameters for <br>'+waffle.moduleLabels[primaryBin(waffle.moduleSizes, waffle.chx)]+', '+waffle.rowTitles[0]+' '+channelMap(waffle.chx, waffle.chy, waffle.moduleSizes, waffle.rows);
    else inputTitle = 'Parameters for <br>'+waffle.moduleLabels[primaryBin(waffle.moduleSizes, waffle.chx)]+' Primary';
    document.getElementById('inputTitle').innerHTML = inputTitle;

    var xIndex;
    if(waffle.chy == 0) xIndex = primaryBin(waffle.moduleSizes, waffle.chx);
    else xIndex = waffle.chx;

    if(window.refreshInput){
        //set defaults
        if (waffle.channelMask[waffle.chy][xIndex] == 1) document.getElementById('onButton').checked = true;
        else document.getElementById('offButton').checked = true;

        //report status word:
        document.getElementById('status').innerHTML = 'Status: '+parseStatusWord(waffle.rampStatus[waffle.chy][xIndex]);

        //manage sliders
        waffle.voltageSlider.update(Math.round(waffle.demandVoltage[waffle.chy][xIndex]*10000)/10000);
        waffle.rampSlider.update(Math.round(waffle.demandVrampUp[waffle.chy][xIndex]*10000)/10000);
        window.refreshInput = 0;

        //set the module
        setInput('changeChannel',0,waffle.moduleLabels[primaryBin(waffle.moduleSizes, waffle.chx)]);
        //update channel number list
        reconfigureChannelList(waffle.moduleLabels, waffle.moduleSizes, 'ChannelList');
        //set the channel number
        setInput('changeChannel',1,channelMap(waffle.chx, waffle.chy, waffle.moduleSizes, waffle.rows));
        if(waffle.chy==0) setInput('changeChannel',1,'Primary');
    }

    //only actually display if the click was on the waffle and not the rest of the canvas:
    if(waffle.chx < waffle.cols && waffle.chy < waffle.rows){
        divFade(inputDiv, 'in', 0);

    }

    //dummy for now just to illustrate fill meters:
    meter.update(Math.round(waffle.reportVoltage[waffle.chy][xIndex]*10000)/10000);
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
    for(var i=0; i<waffle.moduleLabels.length; i++){
        if(waffle.moduleLabels[i] == xName) xVal = i;
    }
    waffle.chx = 0;
    for(i=0; i<xVal; i++) waffle.chx += waffle.moduleSizes[i];
    if(yVal != 'Primary') waffle.chx += Math.floor(yVal/(waffle.rows-1));

    channelSelect(waffle);
}

function parseStatusWord(statusCode){

    if(statusCode == 0) return 'Off';
    else if(statusCode == 1) return 'On';
    else if(statusCode == 3) return 'Ramping Up';
    else if(statusCode == 5) return 'Ramping Down';
    else if(statusCode == 256) return 'Internal Trip';
    else return 'Unknown Error';
}




