//collapsible menu/////////////////////////////////////////////////////////////////////////////////////////////////

//create a vertical collapsible menu that occupies a target div.
function deployMenu(targetDivID, headings, titles){
	var i;

	//listener tool for Buchner's dom insertion listener:
	window.parameters.insertListener = function(event){
		var prefix, tab;
		if (event.animationName == "nodeInserted") {
			prefix = event.target.id.slice(0, event.target.id.search('Content'));
			//tab = document.getElementById(prefix+'Tab');
			resizeMenu(prefix);
		}
	}

	//inject the appropriate html into the target div:
	for(i=0; i<headings.length; i++){
		insertDOM('div', headings[i]+'Tab', 'collapsableMenu', 'max-height:50px; text-align:left; margin-top:2%;', targetDivID, '', '', '', '', '');
		insertDOM('h3', headings[i]+'arrow', '', 'display:inline; float:left;', headings[i]+'Tab', function(){toggleMenu(targetDivID, headings, this.id)}, String.fromCharCode(0x25B6));
		insertDOM('h3', headings[i]+'title', '', 'display:inline-block; font:20px Orbitron; padding-left:1em', headings[i]+'Tab', '', titles[i]);
		insertDOM('div', headings[i]+'Content', 'menuContent', '', headings[i]+'Tab', '', '');

		//make sure the expanded divs maintain an appropriate height even if their contents change:
		document.addEventListener("animationstart", window.parameters.insertListener, false); // standard + firefox
		document.addEventListener("webkitAnimationStart", window.parameters.insertListener, false); // Chrome + Safari

		/*
		document.getElementById(headings[i]+'Tab').addEventListener('transitionend', function(){
				if( this.style.opacity==0 )
		            this.style.display='none';    
	    });
		*/
	}

}

//menu toggler for clock view - wrapperDivID wraps the menu, headings is the same array containing menu item IDs as in menu(), and thisOne is the item ID being interacted with.
function toggleMenu(wrapperDivID, headings, thisID){

    var totalHeight = parseInt(document.getElementById(wrapperDivID).offsetHeight),  //total height of menu bar
        fullHeight = totalHeight*0.98 - 100,
        assocDiv, string, i,
        thisOne = thisID.slice(0, thisID.length-5) + 'Tab';  //reconstruct the tab ID from the arrow ID

    if(document.getElementById(thisOne).style.maxHeight == '50px'){ //expand menu:
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
	        	document.getElementById(headings[i]+'Tab').style.maxHeight = (document.getElementById(headings[i]+'Content').offsetHeight+50)+'px';
	        }
        }
    } else {
	    document.getElementById(thisOne.slice(0,thisOne.length-3)+'arrow').innerHTML = String.fromCharCode(0x25B6);
	    document.getElementById(thisOne).style.maxHeight = '50px';
    }
}

//resize expanded menu when its Content div changes
function resizeMenu(id){
	if(document.getElementById(id+'Tab').style.maxHeight != '50px')
		document.getElementById(id+'Tab').style.maxHeight = (document.getElementById(id+'Content').offsetHeight+50)+'px';
}

//dismiss a tab
function dismissTab(id){
	document.getElementById(id).style.opacity = 0;
}

function recallTab(id){
	//document.getElementById(id).style.display = 'block';
	document.getElementById(id).style.opacity = 1;	
}

//toggle switch//////////////////////////////////////////////////////////////////////////

//build a toggle switch out of divs:
function toggleSwitch(parentID, id, title, enabled, disabled, onActivate, onDeactivate, initialState){

	//wrapper div:
	insertDOM('div', 'toggleWrap'+id, 'toggleWrap',  ( (title=='') ? 'text-align:center;' : '' ), parentID, '', '');
	//label:
	if(title != '')
		insertDOM('div', 'toggleLabel'+id, 'toggleLabel', '', 'toggleWrap'+id, '', title);
	//toggle groove:
	insertDOM('div', 'toggleGroove'+id, 'toggleGroove',  ( (title=='') ? '' : 'float:left;' ), 'toggleWrap'+id, '', '');
	//toggle switch:
	insertDOM('div', 'toggleSwitch'+id, 'toggleSwitch', ((initialState) ? 'left:1em;' : 'left:0em;'), 'toggleGroove'+id,'', '');	
	document.getElementById('toggleSwitch'+id).onmousedown = function(event){
		document.getElementById('toggleWrap'+id).ready = 1;
	};
	document.getElementById('toggleSwitch'+id).onmouseup = function(event){
		flipToggle(event, id, enabled, disabled, onActivate, onDeactivate);
	};
	document.getElementById('toggleSwitch'+id).onmouseout = function(event){
		flipToggle(event, id, enabled, disabled, onActivate, onDeactivate)
	};
	//state description
	if(title=='')
		insertDOM('br', 'break', '', '', 'toggleWrap'+id);
	insertDOM('div', 'toggleDescription'+id, 'toggleDescription', ( (title=='') ? 'width:100%' : '' ), 'toggleWrap'+id, '', ((initialState) ? enabled : disabled));


}

function flipToggle(event, id, enabled, disabled, onActivate, onDeactivate){
	var switchID = 'toggleSwitch'+id,
	//grooveID = 'toggleGroove' + id,
	descriptionID = 'toggleDescription' + id;
	if(document.getElementById('toggleWrap'+id).ready != 1) return

	if(document.getElementById(switchID).style.left == '0em'){
		document.getElementById(switchID).style.left = '1em';
		document.getElementById(descriptionID).innerHTML = enabled;
		onActivate();
	} else{
		document.getElementById(switchID).style.left = '0em';
		document.getElementById(descriptionID).innerHTML = disabled;
		onDeactivate();
	}

	document.getElementById('toggleWrap'+id).ready =0;	
}


//option scroll//////////////////////////////////////////
function createOptionScroll(wrapperID, id, options, maxWidth){
	var i, stringWidths = [], optionWidth;

	insertDOM('div', id, 'scrollWrapper', 'width:'+maxWidth+'px', wrapperID, '', '');
	insertDOM('div', id+'LeftArrow', 'scrollArrow', 'padding-right:0.5em;', id, '', String.fromCharCode(0x25C0));
	insertDOM('div', id+'Selected', 'scrollSelected', '', id, '', options[0]);
	insertDOM('div', id+'RightArrow', 'scrollArrow', 'padding-left:0.5em;', id, '', String.fromCharCode(0x25B6));
	//start off on option 0:
	document.getElementById(id).chosen = 0;
	document.getElementById(id).options = options;

	//fix width of option cell:
	for(i=0; i<options.length; i++){
		stringWidths[i] = options[i].width('14px Raleway');
	}
	optionWidth = Math.min(Math.max.apply(null, stringWidths), maxWidth);
	document.getElementById(id+'Selected').style.width = optionWidth+'px';


	//make the scroll arrows scroll through options:
	document.getElementById(id+'LeftArrow').onclick = function(){
		var id = this.id.slice(0, this.id.indexOf('LeftArrow')),
			scroll = document.getElementById(id);

		if(scroll.chosen == 0){
			scroll.chosen = scroll.options.length-1;
		} else {
			scroll.chosen--;
		}
		document.getElementById(id+'Selected').innerHTML = scroll.options[scroll.chosen];
	}

	document.getElementById(id+'RightArrow').onclick = function(){
		var id = this.id.slice(0, this.id.indexOf('RightArrow')),
			scroll = document.getElementById(id);

		if(scroll.chosen == scroll.options.length-1){
			scroll.chosen = 0;
		} else {
			scroll.chosen++;
		}
		document.getElementById(id+'Selected').innerHTML = scroll.options[scroll.chosen];
	}	

}





