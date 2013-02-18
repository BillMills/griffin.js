//fade a canvas out:
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
function swapFade(inbound, buttonID, object, topButtonID){

	//chrome
	//$('#'+window.lastTrip).css('background', '-webkit-gradient(linear, left top, left bottom, from(#999999), to(#DDDDDD));')
	//$('#'+buttonID).css('background', '-webkit-gradient(linear, left top, left bottom, from(#DDDDDD), to(#FFFFFF));')
	//FF
	//$('#'+window.lastTrip).css('background', '-moz-linear-gradient(top,  #DDDDDD,  #FFFFFF);')
	//$('#'+buttonID).css('background', '-moz-linear-gradient(top,  #999999,  #DDDDDD);')

	//document.getElementById(window.lastTrip).setAttribute('class', 'navLink');
	//document.getElementById(buttonID).setAttribute('class', 'navLinkDown');
	//window.lastTrip = buttonID;

	document.getElementById(object.activeButton).setAttribute('class', 'navLink');
	document.getElementById(buttonID).setAttribute('class','navLinkDown');
	object.activeButton = buttonID;
	document.getElementById(topButtonID).setAttribute('onclick', "javascript:swapView('DAQlinks', '"+inbound+"', 'DAQsidebar', 'DAQbutton')")

	if(inbound != window.onDisplay){
		fadeIn(inbound, 0);
		fadeOut(window.onDisplay, 0);
		window.onDisplay = inbound;
	}
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

		document.getElementById('youAreHere').innerHTML = document.getElementById(inboundNav+'Banner').innerHTML;

	}	
}
