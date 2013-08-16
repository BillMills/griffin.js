//trigger css transition on opacity to fade element out, then send it to bottom of stack on completion:
function fadeOut(elementID){
	//set element to come off top of stack once it's faded out:
	document.getElementById(elementID).addEventListener('transitionend', function(){
			if( $('#'+elementID).css('opacity')==0 )
	            $('#'+elementID).css('z-index', 0);    
    });

    //fade the element out:
    $('#'+elementID).css('opacity', 0);
}

function fadeIn(elementID){
	$('#'+elementID).css('z-index', 1);
	$('#'+elementID).css('opacity', 1);
	//window.onDisplay = canvasID;
}

//swap two canvases, for use in subdetector view transitions:
function swapFade(buttonID, object, leaveOff){
	var i;
	//parse which view is requested, and fetch the corresponding canvas ID to bring to the front:
	var inbound = object.view();

	//introduce TAC display buttons as needed (currently only for DANTE):
	if(buttonID == 'DANTElink'){
		document.getElementById('subsystemTAC-Thresholds').style.display = 'inline';
		document.getElementById('subsystemTAC-Rate').style.display = 'inline';
	} else {
		document.getElementById('subsystemTAC-Thresholds').style.display = 'none';
		document.getElementById('subsystemTAC-Rate').style.display = 'none';
		if(window.state.subdetectorView > 2)
			document.getElementById('subsystemRate').onclick();
	}

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
		fadeIn(inbound);
		fadeOut(window.onDisplay);
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
	window.state.subdetectorView = viewIndex;

	//imediately update the display:
	rePaint();
}

//swap top level views
function swapView(inboundNav, inboundCanvas, inboundSidebar, buttonID){

	if(inboundNav != window.navOnDisplay){

		fadeIn(inboundCanvas, 0);
		fadeOut(window.onDisplay, 0);
		window.onDisplay = inboundCanvas;

		fadeIn(inboundNav);
		fadeOut(window.navOnDisplay);
		window.navOnDisplay = inboundNav;

		fadeIn(inboundSidebar);
		fadeOut(window.sidebarOnDisplay);
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
