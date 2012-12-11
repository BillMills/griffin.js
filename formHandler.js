
//collect the form input and do something with it:
function updateParameter(InputLayer){
    
    var oForm = document.getElementById('setValues');
    var oText = oForm.elements[2];
    var textVal = oText.value;

    //some dummy behavior, replace the rest of this function with more exciting things
    var onoff;
    if(document.getElementById('onButton').checked == true) onoff = 'on'
    else onoff = 'off'

    alert(onoff+' '+textVal);    

	divFade(document.getElementById(InputLayer), 'out', 0);

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

	if(frame <= nFrames){
		if(direction === 'in'){
			alpha = 0.7*frame/nFrames;
			$(targetDiv).css('background', 'rgba(0,0,0,'+alpha+')');
			targetDiv.style.display = 'block';

		} else if(direction === 'out'){
			alpha = 0.7-0.7*frame/nFrames;
			$(targetDiv).css('background', 'rgba(0,0,0,'+alpha+')');
		}
		frame++;

		setTimeout(function(){divFade(targetDiv, direction, frame)}, 1000/FPS);
	} else if(direction === 'out'){
		targetDiv.style.display = 'none';
	}

}
