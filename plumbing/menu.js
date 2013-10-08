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
		injectDOM('div', headings[i]+'Tab', targetDivID, {'class':'collapsableMenu', 'style':'max-height:50px; text-align:left; margin-top:2%;'});
		injectDOM('h3', headings[i]+'arrow', headings[i]+'Tab', {
			'style' : 'display:inline; float:left;',
			'innerHTML' : String.fromCharCode(0x25B6),
			'onclick' : function(){toggleMenu(targetDivID, headings, this.id)}
		});
		injectDOM('h3', headings[i]+'title', headings[i]+'Tab', {'style':'display:inline-block; font:20px Orbitron; padding-left:1em', 'innerHTML':titles[i]});
		injectDOM('div', headings[i]+'Content', headings[i]+'Tab', {'class':'menuContent'});

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
	injectDOM('div', 'toggleWrap'+id, parentID, {'class':'toggleWrap', 'style':( (title=='') ? 'text-align:center;' : '' )});
	//label:
	if(title != '')
		injectDOM('div', 'toggleLabel'+id, 'toggleWrap'+id, {'class':'toggleLabel', 'innerHTML':title});
	//toggle groove:
	injectDOM('div', 'toggleGroove'+id, 'toggleWrap'+id, {'class':'toggleGroove', 'style':( (title=='') ? '' : 'float:left;' )});
	//toggle switch:
	injectDOM('div', 'toggleSwitch'+id, 'toggleGroove'+id, {'class':'toggleSwitch', 'style':((initialState) ? 'left:1em;' : 'left:0em;')});
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
		injectDOM('br', 'break', 'toggleWrap'+id, {});
	injectDOM('div', 'toggleDescription'+id, 'toggleWrap'+id, {
		'class' : 'toggleDescription',
		'style' : ( (title=='') ? 'width:100%' : '' ),
		'innerHTML' : ((initialState) ? enabled : disabled)
	})


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
function createOptionScroll(wrapperID, id, options, maxWidth, callback){
	var i, stringWidths = [], optionWidth;

	injectDOM('div', id, wrapperID, {'class':'scrollWrapper', 'style':'width:'+maxWidth+'px'});
	injectDOM('div', id+'LeftArrow', id, {'class':'scrollArrow', 'style':'padding-right:0.5em;', 'innerHTML':String.fromCharCode(0x25C0)});
	injectDOM('div', id+'Selected', id, {'class':'scrollSelected', 'innerHTML':options[0]});
	injectDOM('div', id+'RightArrow', id, {'class':'scrollArrow', 'style':'padding-left:0.5em;', 'innerHTML':String.fromCharCode(0x25B6)});

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

		if(callback)
			callback();

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

		if(callback)
			callback();
	}	

}





