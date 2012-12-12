
//collect the form input and do something with it.  Expect form 'setValues', which
//begins with a pair of radio buttons for channel on off, then has an arbitrary 
//no. of text fields for inputting whatever else.

function updateParameter(InputLayer, mode){

	var i;
	var userInputs = [];

    //loop over all elements in the form except the first two (on/off) and last two (submit / cancel)
	for(i=2; i<document.getElementById('setValues').elements.length - 2; i++){
		userInputs[i-2] = getInput('setValues', i);
	}



    //insert calls to getInput as needed per experiment:
    //var fieldValue = getInput('setValues', 2);

    //determine where this cell falls in MIDAS vector:
    var MIDASindex = getMIDASindex(window.griffinDialogY, window.griffinDialogX);

    //some dummy behavior, replace the rest of this function with more exciting things
    var onoff;
    if(document.getElementById('onButton').checked == true) onoff = 'on'
    else onoff = 'off'

    alert(onoff+' '+userInputs[0]);    

	if(mode != 'single'){
		divFade(document.getElementById(InputLayer), 'out', mode, 0);
	}

}

//map the active grid cooridnates onto MIDAS's channel numbering:
function getMIDASindex(row, col){
	//do something
	return 0;
}

//extract information from the field at position <fieldIndex> from a form with id = <formID>
function getInput(formId, fieldIndex){
    var oForm = document.getElementById(formId);
    var oText = oForm.elements[fieldIndex];
    return oText.value;
}

//dismiss the form without doing anything else:
function abortUpdate(InputLayer, mode){
	var inputDiv = document.getElementById(InputLayer);
	divFade(inputDiv, 'out', mode, 0);
}

//fade the form in / out:
function divFade(targetDiv, direction, mode, frame){

	var FPS = 40;
	var duration = 0.1;
	var nFrames = FPS*duration;
	var alpha;
	var maxOpacity;
	if(mode == 'single') maxOpacity = 0;
	if(mode == 'double') maxOpacity = 0.7;

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

		setTimeout(function(){divFade(targetDiv, direction, mode, frame)}, 1000/FPS);
	} else if(direction === 'out'){
		targetDiv.style.display = 'none';
	}

}

//plugs a new cell into the input interface; used for both onclicks on the waffles, and on button submits 
//in the sidepanel view.
function channelSelect(wrapperDiv, InputLayer, chx, chy, rowTitles, colTitles, title, unit, endData, mode, rows, cols, event){

    //Throw up to global so the setter remembers where we're pointing.  TODO: refactor without globals?
    window.griffinDialogX = chx;
    window.griffinDialogY = chy;
	
    var superDiv = document.getElementById(wrapperDiv);
    var inputDiv = document.getElementById(InputLayer);

    //set text in dialog box:
    var inputTitle = 'Parameters for '+rowTitles[0]+' '+chy+', '+colTitles[0]+' '+chx;
    document.getElementById('inputTitle').innerHTML = inputTitle;

    //set defaults
    if (endData[chy][chx] > 0.1) document.getElementById('onButton').checked = true;
    else document.getElementById('offButton').checked = true;
    document.getElementById('demandval').value = Math.round(endData[chy][chx]*10000)/10000;

    //for single waffle, use a sidebar for a fixed input menu; for dual waffle+alarm configuration,
    //input field must follow mouse and overlay.
    if(mode == 'double'){
        $(inputDiv).css('left', event.pageX);
        $(inputDiv).css('top', event.pageY);
    } else if(mode == 'single'){
        $(inputDiv).css('right', '3%');
        //$(inputDiv).css('top', 10%);
    }

    //only actually display if the click was on the waffle and not the rest of the canvas:
    if(chx < cols && chy < rows){
        //inputDiv.style.display = 'block';
        divFade(inputDiv, 'in', mode, 0);
    }
}

//point interface at new channel indicated by user in the 'changeChannel' form.
function gotoNewChannel(wrapperDiv, InputLayer, rowTitles, colTitles, title, unit, endData, mode, rows, cols){

	xVal = getInput('changeChannel', 1);
	yVal = getInput('changeChannel', 0);

    channelSelect(wrapperDiv, InputLayer, xVal, yVal, rowTitles, colTitles, title, unit, endData, mode, rows, cols);
}