//create a vertical collapsible menu that occupies a target div.
function deployMenu(targetDivID, headings, titles){
	var i;

	//inject the appropriate html into the target div:
	for(i=0; i<headings.length; i++){
		insertDOM('div', headings[i]+'Tab', 'collapsableMenu', 'max-height:50px; text-align:left; margin-top:2%;', targetDivID, '', '', '', '', '');
		insertDOM('h3', headings[i]+'arrow', '', 'display:inline; float:left;', headings[i]+'Tab', function(){toggleMenu(targetDivID, headings, this.id)}, String.fromCharCode(0x25B6));
		insertDOM('h3', headings[i]+'title', '', 'display:inline-block; font:20px Orbitron; padding-left:1em', headings[i]+'Tab', '', titles[i]);
		//toggleSwitch(headings[i]+'Tab', headings[i]+'testToggle')
		toggleSwitch(headings[i]+'Tab', headings[i]+'testToggle', 'strawberry', 'banana')
		insertDOM('div', headings[i]+'Content', 'menuContent', '', headings[i]+'Tab', '', '');
	}

}

//menu toggler for clock view - wrapperDivID wraps the menu, headings is the same array containing menu item IDs as in menu(), and thisOne is the item ID being interacted with.
function toggleMenu(wrapperDivID, headings, thisID){

    var totalHeight = parseInt(document.getElementById(wrapperDivID).offsetHeight),  //total height of menu bar
        fullHeight = totalHeight*0.98 - 100,
        assocDiv, string, i,
        thisOne = thisID.slice(0, thisID.length-5) + 'Tab';  //reconstruct the tab ID from the arrow ID

    if(document.getElementById(thisOne).style['max-height'] == '50px'){ //expand menu:
        //change the title arrows as appropriate, and resize menus
        for(i=0; i<headings.length; i++){
        	//force others to collapse so only one open at a time?
        	if(thisOne != headings[i]+'Tab'){
	        	//document.getElementById(headings[i]+'arrow').innerHTML = String.fromCharCode(0x25B6);
	        	//document.getElementById(headings[i]+'Tab').style.height = '50px';
	        } else{
	        	document.getElementById(headings[i]+'arrow').innerHTML = String.fromCharCode(0x25BC);
	        	//document.getElementById(headings[i]+'Tab').style.height = fullHeight+'px';
	        	//document.getElementById(headings[i]+'Tab').setAttribute('style', 'height: -webkit-max-content');
	        	document.getElementById(headings[i]+'Tab').style['max-height'] = (document.getElementById(headings[i]+'Content').offsetHeight+50)+'px';
	        }
        }
    } else {
	    document.getElementById(thisOne.slice(0,thisOne.length-3)+'arrow').innerHTML = String.fromCharCode(0x25B6);
	    document.getElementById(thisOne).style['max-height'] = '50px';
    }
}



//build a toggle switch out of divs:
function toggleSwitch(parentID, id, enabled, disabled){

	//wrapper div:
	insertDOM('div', 'toggleWrap'+id, 'toggleWrap', '', parentID, '', '');
	//label:
	insertDOM('div', 'toggleLabel'+id, 'toggleLabel', '', 'toggleWrap'+id, '', 'test toggle');
	//toggle groove:
	insertDOM('div', 'toggleGroove'+id, 'toggleGroove', '', 'toggleWrap'+id, '', '');
	//toggle switch:
	insertDOM('div', 'toggleSwitch'+id, 'toggleSwitch', '', 'toggleGroove'+id, function(){flipToggle(id, enabled, disabled)}, '');
	//state description
	insertDOM('div', 'toggleDescription'+id, 'toggleDescription', '', 'toggleWrap'+id, '', disabled);



}

function flipToggle(id, enabled, disabled){
	var switchID = 'toggleSwitch'+id,
	//grooveID = 'toggleGroove' + id,
	descriptionID = 'toggleDescription' + id;
	if(document.getElementById(switchID).style['left'] == '0em'){
		document.getElementById(switchID).style['left'] = '1em';
		document.getElementById(descriptionID).innerHTML = enabled;
	} else{
		document.getElementById(switchID).style['left'] = '0em';
		document.getElementById(descriptionID).innerHTML = disabled;
	}
}





