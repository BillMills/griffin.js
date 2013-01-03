//collect the form input and do something with it.  Expect form 'setValues', which
//begins with a pair of radio buttons for channel on off, then has an arbitrary 
//no. of text fields for inputting whatever else.

function updateParameter(InputLayer){

	var i;
	var userInputs = [];

    //loop over all elements in the form except the first two (off/on) and last two (submit / cancel)
	for(i=2; i<document.getElementById('setValues').elements.length - 2; i++){
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

    //Throw up to global so the setter remembers where we're pointing.  TODO: refactor without globals?
    window.griffinDialogX = waffle.chx;
    window.griffinDialogY = waffle.chy;
	
    var superDiv = document.getElementById(waffle.wrapperDiv);
    var inputDiv = document.getElementById(waffle.InputLayer);

    //set text in dialog box:
    var inputTitle = 'Parameters for <br>'+waffle.colTitles[0]+' '+waffle.chx+', '+waffle.rowTitles[0]+' '+waffle.chy;
    document.getElementById('inputTitle').innerHTML = inputTitle;

    //set defaults
    if (waffle.channelMask[waffle.chy][waffle.chx] == 1) document.getElementById('onButton').checked = true;
    else document.getElementById('offButton').checked = true;

    //manage sliders
    waffle.voltageSlider.update(Math.round(waffle.demandVoltage[waffle.chy][waffle.chx]*10000)/10000);
    waffle.rampSlider.update(Math.round(waffle.demandVramp[waffle.chy][waffle.chx]*10000)/10000);

    //input sidebar:
    //$(inputDiv).css('right', '3%');

    //only actually display if the click was on the waffle and not the rest of the canvas:
    if(waffle.chx < waffle.cols && waffle.chy < waffle.rows){
        divFade(inputDiv, 'in', 0);
        setInput('changeChannel',0,waffle.chx);
        setInput('changeChannel',1,waffle.chy);
    }

    //dummy for now just to illustrate fill meters:
    meter.update(Math.round(waffle.reportVoltage[waffle.chy][waffle.chx]*10000)/10000);
}

//point interface at new channel indicated by user in the 'changeChannel' form.
function gotoNewChannel(event, waffle){
	var xVal = parseInt(getInput('changeChannel', 0));
	var yVal = parseInt(getInput('changeChannel', 1));

    waffle.chx = xVal;
    waffle.chy = yVal;

    if(xVal<waffle.cols && yVal<waffle.rows){
        channelSelect(waffle);
    }
}

//DEPRICATED
//tie the slider value to the field value for demand voltage:
function slideVoltage(sliderVal){
    var max = 1;
    var min = 0;
    document.getElementById('demandVoltage').value = (sliderVal*(max-min)+min).toFixed(3);
}

//...and the opposite, too: make the slider catch up to a value typed into the corresponding field:
function fieldVoltage(){
    var max = 1;
    var min = 0;
    var inputValue = document.getElementById('demandVoltage').value;
    var fieldEntry = (inputValue-min)/(max-min);

    jumpSlider(fieldEntry, 'voltageSliderKnob', 'voltageKnobStyle', 'voltageSliderText', 0, 1, 'mV');
    if(inputValue < min) {
        jumpSlider(0, 'voltageSliderKnob', 'voltageKnobStyle', 'voltageSliderText', 0, 1, 'mV');
        document.getElementById('demandVoltage').value = min;
    } else if(inputValue > max){
        jumpSlider(1, 'voltageSliderKnob', 'voltageKnobStyle', 'voltageSliderText', 0, 1, 'mV');
        document.getElementById('demandVoltage').value = max;
    }
}

//DEPRICATED
//tie the slider value to the field value for demand ramp speed:
function slideRamp(sliderVal){
    var max = 1;
    var min = 0;
    document.getElementById('demandRampSpeed').value = (sliderVal*(max-min)+min).toFixed(3);
}


//...and the opposite, too: make the slider catch up to a value typed into the corresponding field:
function fieldRamp(){
    var max = 1;
    var min = 0;
    var inputValue = document.getElementById('demandRampSpeed').value;
    var fieldEntry = (inputValue-min)/(max-min);

    jumpSlider(fieldEntry, 'rampSliderKnob', 'rampKnobStyle', 'rampSliderText', 0, 1, 'mV/s');
    if(fieldEntry < min) {
        jumpSlider(0, 'rampSliderKnob', 'rampKnobStyle', 'rampSliderText', 0, 1, 'mV/s');
        document.getElementById('demandRampSpeed').value = min;
    } else if(fieldEntry > max){
        jumpSlider(1, 'rampSliderKnob', 'rampKnobStyle', 'rampSliderText', 0, 1, 'mV/s');
        document.getElementById('demandRampSpeed').value = max;
    }
}

//DEPRICATED
//tie the slider value to the field value for test slider:
function slideTest(sliderVal){
    var max = 1;
    var min = 0;
    document.getElementById('testInput').value = (sliderVal*(max-min)+min).toFixed(3);
}

function decorateInputSidebar(sidebar, side, wrapperDiv, waffleHeight){

    //fetch canvas:
    var canvas = document.getElementById(sidebar);
    var context = canvas.getContext('2d');

    //get container div dimensions:
    var parentWidth = $('#'+wrapperDiv).width();
    var parentHeight = $('#'+wrapperDiv).height();

    //define sidebar dimensions:
    var width = parentWidth*0.2;
    var height = parentHeight;

    //set sidebar dimensions:
    canvas.width = width;
    canvas.height = height;

    //separator line inset
    var inset = 0.1*width;
  
}


