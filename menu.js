//create a vertical collapsible menu that occupies a target div.
function deployMenu(targetDivID, headings, titles){
	var i;

	//inject the appropriate html into the target div:
	for(i=0; i<headings.length; i++){
		insertDOM('div', headings[i]+'Tab', 'collapsableMenu', 'height:50px; text-align:center; margin-top:2%;', targetDivID, function(){toggleMenu(targetDivID, headings, this.id)}, '', '', '', '');
		insertDOM('h3', headings[i]+'arrow', '', 'display:inline; float:left;', headings[i]+'Tab', '', String.fromCharCode(0x25B6));
		insertDOM('h3', headings[i]+'title', '', 'display:inline-block', headings[i]+'Tab', '', titles[i]);
	}

}

//menu toggler for clock view - wrapperDivID wraps the menu, headings is the same array containing menu item IDs as in menu(), and thisOne is the item ID being interacted with.
function toggleMenu(wrapperDivID, headings, thisOne){

    var totalHeight = parseInt(document.getElementById(wrapperDivID).offsetHeight),  //total height of menu bar
        fullHeight = totalHeight*0.98 - 100,
        assocDiv, string, i;

    if(document.getElementById(thisOne).style.height == '50px'){ //expand menu:
        //change the title arrows as appropriate, and resize menus
        for(i=0; i<headings.length; i++){
        	//force others to collapse so only one open at a time?
        	if(thisOne != headings[i]+'Tab'){
	        	//document.getElementById(headings[i]+'arrow').innerHTML = String.fromCharCode(0x25B6);
	        	//document.getElementById(headings[i]+'Tab').style.height = '50px';
	        } else{
	        	document.getElementById(headings[i]+'arrow').innerHTML = String.fromCharCode(0x25BC);
	        	document.getElementById(headings[i]+'Tab').style.height = fullHeight+'px';
	        }
        }
    } else {
	    document.getElementById(thisOne.slice(0,thisOne.length-3)+'arrow').innerHTML = String.fromCharCode(0x25B6);
	    document.getElementById(thisOne).style.height = '50px';
    }
}