function VME(){
	var VMEStyle, string, cellSize, that = this;
	window.VMEpointer = that;

	//member variables
	this.wrapperID = window.parameters.wrapper;	    //ID of wrapping div
	this.canvasID = 'VMECanvas';		            //ID of canvas to paint clock on
    this.linkWrapperID = 'VMELinks';                //ID of div to contain clock view header
    this.sidebarID = 'VMESidebar';                  //ID of div to contain clock sidebar
    this.activeElt = 'VME0';

	this.wrapper = document.getElementById(this.wrapperID);

    //add top level nav button:
    insertDOM('button', 'VMEButton', 'navLink', '', 'statusLink', function(){swapView('VMELinks', 'VMECanvas', 'VMEMenus', 'VMEButton');}, 'VME');

    //deploy right bar menu:
    deployMenu('VMEMenus', ['VME'] , ['Crate Summary']);
    //insert a table and maybe some buttons into the right bar
    //insertDOM('table', 'VMEContentTable', '', '', 'VMEContent', '', '');
    //insertDOM('tr', '')
    string = '';
    string += '<h3 id="VMEContentTitle" style="text-align:center; margin-top:0px;">VME 0</h3>\n'
    string += '<table id="VMEContentTable">\n';
    string +=     '<tr id="VMEContentTitle">\n';
    string +=         '<td></td>\n';
    string +=         '<td>Voltage [V]</td>\n';
    string +=         '<td style="padding-left:1em;">Current [A]</td>\n';
    string +=     '</tr>\n';
    string +=     '<tr>\n'
    string +=         '<td>+12 V</td>\n'
    string +=         '<td id="p12voltage" class="VMEContentCell">0</td>\n'
    string +=         '<td id="p12current" class="VMEContentCell">0</td>\n'
    string +=     '</tr>\n';
    string +=     '<tr>\n'
    string +=         '<td>+5 V</td>\n'
    string +=         '<td id="p5voltage" class="VMEContentCell">0</td>\n'
    string +=         '<td id="p5current" class="VMEContentCell">0</td>\n'
    string +=     '</tr>\n';
    string +=     '<tr>\n'
    string +=         '<td>+3.3 V</td>\n'
    string +=         '<td id="p3voltage" class="VMEContentCell">0</td>\n'
    string +=         '<td id="p3current" class="VMEContentCell">0</td>\n'
    string +=     '</tr>\n';
    string +=     '<tr>\n'
    string +=         '<td>-12 V</td>\n'
    string +=         '<td id="n12voltage" class="VMEContentCell">0</td>\n'
    string +=         '<td id="n12current" class="VMEContentCell">0</td>\n'
    string +=     '</tr>\n';
    string += '</table>\n';
    string += '<table id="VMEContentTable2">\n';
    string +=     '<tr>\n'
    string +=         '<td>Fan Temp</td>\n'
    string +=         '<td id="fanTemp" class="VMEStatusCell">0 '+String.fromCharCode(0x00B0)+'F</td>\n'
    string +=     '</tr>\n';
    string +=     '<tr>\n'
    string +=         '<td>Fan Speed</td>\n'
    string +=         '<td id="fanSpeed" class="VMEStatusCell">0 rpm</td>\n'
    string +=     '</tr>\n';
    string +=     '<tr>\n'
    string +=         '<td>PS Time</td>\n'
    string +=         '<td id="psTime" class="VMEStatusCell">0 hrs</td>\n'
    string +=     '</tr>\n';
    string +=     '<tr>\n'
    string +=         '<td>Fan Time</td>\n'
    string +=         '<td id="fanTime" class="VMEStatusCell">0 hrs</td>\n'
    string +=     '</tr>\n';
    string += '</table>\n';
    //string += '<button id="VMEContentPwrCycle" class="bigButton" style="margin-left:auto; margin-right:auto;" type="submit">Power Cycle</button>\n'
    document.getElementById('VMEContent').innerHTML = string;
    insertDOM('button', 'VMEContentPwrCycle', 'bigButton', 'width:auto; height:auto; padding:0.5em; margin-top:1em;', 'VMEContent', '', 'Power Cycle', '', 'button');
    document.getElementById('VMEContent').style.textAlign = 'center';

    //nav wrapper div
    insertDOM('div', this.linkWrapperID, 'navPanel', 'text-align:center; width:50%; -moz-box-sizing: border-box; -webkit-box-sizing: border-box; box-sizing: border-box;', this.wrapperID, '', '');
    //nav header
    insertDOM('h1', 'VMELinksBanner', 'navPanelHeader', 'float:left; margin-top:0px;', this.linkWrapperID, '', window.parameters.ExpName+' VME Status');

    //the VME view is done entirely with dom elements; most convenient to extend the central div to accommodate.
    cellSize = document.getElementById(this.linkWrapperID).offsetWidth / 100;
    //VME divs
    insertDOM('div', 'VMEWrapper', '', 'clear:left;', this.linkWrapperID, '', '');
    for(i=0; i<window.parameters.nVME; i++){
        VMEStyle = 'display:inline-block; margin-left:'+(2*cellSize)+'px; margin-right:'+(2*cellSize)+'px; margin-bottom:'+2*cellSize+'px; margin-top:'+2*cellSize+'px;'
        insertDOM('div', 'VME'+i, 'VME', VMEStyle , 'VMEWrapper', function(){showVME(this.id)}, '');
        insertDOM('div', 'VME'+i+'title', '', '', 'VME'+i, '', 'VME '+i);
        if(i%4==3) insertDOM('br', 'break', '', '', 'VMEWrapper');
    }

	//deploy a canvas for the clock view; this is actually just a dummy to stay consistent with all the other views, so we can use the same transition functions easily.
    insertDOM('canvas', this.canvasID, 'monitor', 'top:' + ($('#VMELinks').height() + 5) +'px;', this.wrapperID, '', '');

    this.update = function(){

    	//update sidebar with whatever clock is showing:
    	showVME(this.activeElt);

    };
    this.update();
    document.getElementById('VMEarrow').onclick();
}

function showVME(id){
	glowMe.apply(window.VMEpointer, [id]);

    //keep track of which clock is highlit:
    window.VMEpointer.activeElt = id;
}