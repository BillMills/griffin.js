//trigger css transition on opacity to fade canvas out, then send it to bottom of stack on completion:
function fadeOut(canvasID){
	//set canvas to come off top of stack once it's faded out:
	document.getElementById(canvasID).addEventListener('webkitTransitionEnd', function(){
			if( $('#'+canvasID).css('opacity')==0 )
	            $('#'+canvasID).css('z-index', 0);    
    });

    //fade the canvas out:
    $('#'+canvasID).css('opacity', 0);
}

function fadeIn(canvasID){
	//kill off the transitionEnd callback that may have been stuck on by fadeOut:
	//document.getElementById(canvasID).addEventListener('webkitTransitionEnd', function(){return 0});

	$('#'+canvasID).css('z-index', 1);
	$('#'+canvasID).css('opacity', 1);
}

/*
function fadeOut(cvas, frame){

	var duration = 0.5;
	var FPS = 30;
	var nFrames = duration*FPS;

    canvas = document.getElementById(cvas);
    context = canvas.getContext('2d');

    var newOpacity = (nFrames - frame) / nFrames;
    if(newOpacity == 0) newOpacity = 0.00000001;
    $(canvas).css('opacity', newOpacity);
    $(canvas).css('z-index', 0);

    if(frame<nFrames+1){
	    setTimeout(function(){fadeOut(cvas, frame+1)}, 1000/FPS);
	}
}

//fade a canvas in:
function fadeIn(cvas, frame){

	var duration = 0.5;
	var FPS = 30;
	var nFrames = duration*FPS;

    canvas = document.getElementById(cvas);
    context = canvas.getContext('2d');

    var newOpacity = frame / nFrames;
    if(newOpacity == 0) newOpacity = 0.00000001;
    $(canvas).css('opacity', newOpacity);
    $(canvas).css('z-index', 1);

    if(frame<nFrames+1){
	    setTimeout(function(){fadeIn(cvas, frame+1)}, 1000/FPS);
	}
}
*/


//fade a div out
function fadeDivOut(navDiv){

	$('#'+navDiv).css('z-index', -1);

	div = document.getElementById(navDiv);
	div.style.opacity = 0;

}

//fade a div in
function fadeDivIn(navDiv){

	$('#'+navDiv).css('z-index', 1);
	div = document.getElementById(navDiv);
	div.style.opacity = 1;

}

//swap two canvases:
function swapFade(buttonID, object, leaveOff, representationIndex){
	var i;
	//parse which view is requested, and fetch the corresponding canvas ID to bring to the front:
	//var inbound = object.scalarViewCanvas[window.subdetectorView];
	var inbound = object.view(representationIndex);

	//turn off other buttons, except for some at the end:
	for(i=0; i<document.getElementById(object.linkWrapperID).children.length - leaveOff; i++){
		if(document.getElementById(object.linkWrapperID).children[i].type == 'button')
			document.getElementById(object.linkWrapperID).children[i].setAttribute('class', 'navLink');
	}
	//highlight this button:
	if(buttonID != null) document.getElementById(buttonID).setAttribute('class','navLinkDown');
	//make sure the top level nav button navigates back to this config if user leaves & returns:
	document.getElementById(object.topNavID).setAttribute('onclick', "javascript:swapView('"+object.linkWrapperID+"', '"+inbound+"', '"+object.sidebarID+"', '"+object.topNavID+"')");

	if(inbound != window.onDisplay){
		fadeIn(inbound, 0);
		fadeOut(window.onDisplay, 0);
		window.onDisplay = inbound;
	}
}

//swap what values are being presented in the subsystem view:
function swapSubsystemView(buttonID, navWrapperID, viewIndex){
	var i;

	//turn off the other view options:
	for(i=document.getElementById(navWrapperID).children.length - window.subsystemScalars; i<document.getElementById(navWrapperID).children.length; i++){
		if(document.getElementById(navWrapperID).children[i].type == 'button')
			document.getElementById(navWrapperID).children[i].setAttribute('class', 'navLink');
	}
	//highlight this button:
	document.getElementById(buttonID).setAttribute('class','navLinkDown');

	//change the corresponding state variable:
	window.subdetectorView = viewIndex;

	//imediately update the display:
	forceUpdate();
}

//swap top level views
function swapView(inboundNav, inboundCanvas, inboundSidebar, buttonID){

	if(inboundNav != window.navOnDisplay){

		fadeIn(inboundCanvas, 0);
		fadeOut(window.onDisplay, 0);
		window.onDisplay = inboundCanvas;

		fadeDivIn(inboundNav);
		fadeDivOut(window.navOnDisplay);
		window.navOnDisplay = inboundNav;

		fadeDivIn(inboundSidebar);
		fadeDivOut(window.sidebarOnDisplay);
		window.sidebarOnDisplay = inboundSidebar;

		document.getElementById(window.viewState).setAttribute('class', 'navLink');
		document.getElementById(buttonID).setAttribute('class', 'navLinkDown');		
		window.viewState = buttonID;


	    //move local title around:
	   	var context = document.getElementById(inboundCanvas).getContext('2d');
    	context.font = '24px Raleway'
    	var title = document.getElementById(inboundNav+'Banner').innerHTML;
    	$('#youAreHere').css('width', context.measureText(title).width*1.1);
    	$('#youAreHere').css('left', renderWidth - 50 - context.measureText(title).width);
		document.getElementById('youAreHere').innerHTML = title;

	}
}

//simple canvas swap in / out:
function swapCanv(inID, outID){
    
    $('#'+inID).css('z-index', '1');
    $('#'+inID).css('opacity', '1');
    $('#'+outID).css('z-index', '-1');
    $('#'+outID).css('opacity', '0');

    window.onDisplay = inID;
    
}
