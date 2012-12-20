
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
function channelSelect(wrapperDiv, InputLayer, chx, chy, rowTitles, colTitles, title, unit, channelMask, demandVolt, demandVoltRamp, rows, cols, event){

    //Throw up to global so the setter remembers where we're pointing.  TODO: refactor without globals?
    window.griffinDialogX = chx;
    window.griffinDialogY = chy;
	
    var superDiv = document.getElementById(wrapperDiv);
    var inputDiv = document.getElementById(InputLayer);

    //set text in dialog box:
    var inputTitle = 'Parameters for '+colTitles[0]+' '+chx+', '+rowTitles[0]+' '+chy;
    document.getElementById('inputTitle').innerHTML = inputTitle;

    //set defaults
    if (channelMask[chy][chx] == 1) document.getElementById('onButton').checked = true;
    else document.getElementById('offButton').checked = true;

    document.getElementById('demandVoltage').value = Math.round(demandVolt[chy][chx]*10000)/10000;
    jumpSlider(Math.round(demandVolt[chy][chx]*10000)/10000, 'voltageSliderKnob', 'voltageSliderText');
    document.getElementById('demandRampSpeed').value = Math.round(demandVoltRamp[chy][chx]*10000)/10000;
    jumpSlider(Math.round(demandVoltRamp[chy][chx]*10000)/10000, 'rampSliderKnob', 'rampSliderText');

    //input sidebar:
    $(inputDiv).css('right', '3%');

    //only actually display if the click was on the waffle and not the rest of the canvas:
    if(chx < cols && chy < rows){
        divFade(inputDiv, 'in', 0);
    }

    //var meter = new FillMeter('voltageMeter', $('#'+InputLayer).width() - 60);
    meter.update(Math.round(demandVolt[chy][chx]*10000)/10000);
}

//point interface at new channel indicated by user in the 'changeChannel' form.
function gotoNewChannel(wrapperDiv, InputLayer, rowTitles, colTitles, title, unit, channelMask, demandVolt, demandVoltRamp, rows, cols, callMyself){

	var xVal = getInput('changeChannel', 0);
	var yVal = getInput('changeChannel', 1);

    if(xVal<cols && yVal<rows){
        channelSelect(wrapperDiv, InputLayer, xVal, yVal, rowTitles, colTitles, title, unit, channelMask, demandVolt, demandVoltRamp, rows, cols);
    }
}

//tie the slider value to the field value for demand voltage:
function slideVoltage(sliderVal){
    var max = 1;
    var min = 0;
    document.getElementById('demandVoltage').value = sliderVal*(max-min)+min;
}

//...and the opposite, too: make the slider catch up to a value typed into the corresponding field:
function fieldVoltage(){
    var max = 1;
    var min = 0;
    var fieldEntry = document.getElementById('demandVoltage').value;
    jumpSlider(fieldEntry, 'voltageSliderKnob', 'voltageSliderText');
    if(fieldEntry < min) {
        jumpSlider(min, 'voltageSliderKnob', 'voltageSliderText');
        document.getElementById('demandVoltage').value = min;
    } else if(fieldEntry > max){
        jumpSlider(max, 'voltageSliderKnob', 'voltageSliderText');
        document.getElementById('demandVoltage').value = max;
    }
}

//tie the slider value to the field value for demand ramp speed:
function slideRamp(sliderVal){
    var max = 1;
    var min = 0;
    document.getElementById('demandRampSpeed').value = sliderVal*(max-min)+min;
}


//...and the opposite, too: make the slider catch up to a value typed into the corresponding field:
function fieldRamp(){
    var max = 1;
    var min = 0;
    var fieldEntry = document.getElementById('demandRampSpeed').value;
    jumpSlider(fieldEntry, 'rampSliderKnob', 'rampSliderText');
    if(fieldEntry < min) {
        jumpSlider(min, 'rampSliderKnob', 'rampSliderText');
        document.getElementById('demandRampSpeed').value = min;
    } else if(fieldEntry > max){
        jumpSlider(max, 'rampSliderKnob', 'rampSliderText');
        document.getElementById('demandRampSpeed').value = max;
    }
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

    //draw separator line
    context.strokeStyle = "rgba(0,0,0,0.2)"
    context.beginPath();
    if(side === "left"){
        context.moveTo(width-inset,10);
        context.lineTo(width-inset,waffleHeight*1.3);
    } else if(side === "right"){
        context.moveTo(inset,10);
        context.lineTo(inset,waffleHeight*1.3);
    }
        
    context.stroke();
    
}


