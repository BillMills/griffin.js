
//collect the form input and do something with it:
function updateParameter(InputLayer, mode){
    
    var oForm = document.getElementById('setValues');
    var oText = oForm.elements[2];
    var textVal = oText.value;

    //some dummy behavior, replace the rest of this function with more exciting things
    var onoff;
    if(document.getElementById('onButton').checked == true) onoff = 'on'
    else onoff = 'off'

    alert(onoff+' '+textVal);    

	divFade(document.getElementById(InputLayer), 'out', mode, 0);

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

function channelSelect(wrapperDiv, InputLayer, chx, chy, rowTitles, colTitles, title, unit, endData, mode, rows, cols, event){
	
    var superDiv = document.getElementById(wrapperDiv);
    var inputDiv = document.getElementById(InputLayer);

    //set text in dialog box:
    var inputTitle = 'Parameters for '+rowTitles[0]+' '+chy+', '+colTitles[0]+' '+chx;
    document.getElementById('inputTitle').innerHTML = inputTitle;
    var fieldTextContent = 'Demand '+title+' ['+unit+'] ';
    document.getElementById('FieldText').innerHTML = fieldTextContent;

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

function gotoNewChannel(wrapperDiv, InputLayer, rowTitles, colTitles, title, unit, endData, mode, rows, cols){
    var chanForm = document.getElementById('changeChannel');
    var yText = chanForm.elements[0];
    var xText = chanForm.elements[1];
    var xVal = xText.value;
    var yVal = yText.value;

    xText.value = 'Card';
    yText.value = 'Channel';
    channelSelect(wrapperDiv, InputLayer, xVal, yVal, rowTitles, colTitles, title, unit, endData, mode, rows, cols);
}