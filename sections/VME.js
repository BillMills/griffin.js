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
    injectDOM('button', 'VMEButton', 'statusLink', {
        'class' : 'navLink',
        'innerHTML' : 'VME',
        'onclick' : function(){swapView('VMELinks', 'VMECanvas', 'VMEMenus', 'VMEButton');}
    });

    //deploy right bar menu:
    deployMenu('VMEMenus', ['VME'] , ['Crate Summary']);
    //insert a table and maybe some buttons into the right bar
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

    document.getElementById('VMEContent').innerHTML = string;
    injectDOM('button', 'VMEContentPwrCycle', 'VMEContent', {
        'class' : 'bigButton',
        'style' : 'width:auto; height:auto; padding:0.5em; margin-top:1em;',
        'innerHTML' : 'Power Cycle',
        'type' : 'button',
        'onclick' : function(){
            confirm('Confirm VME Power Cycle', 'Confirming will power cycle VME ' + window.VMEpointer.activeElt.slice(3, window.VMEpointer.activeElt.length) + '; are you sure you want to do this?', powerCycleVME.bind(null,window.VMEpointer.activeElt));
            document.getElementById('tempDiv').style.top = window.innerHeight*0.2;
        }
    });
    document.getElementById('VMEContent').style.textAlign = 'center';

    //nav wrapper div
    injectDOM('div', this.linkWrapperID, this.wrapperID, {
        'class' : 'navPanel',
        'style' : 'text-align:center; width:50%; -moz-box-sizing: border-box; -webkit-box-sizing: border-box; box-sizing: border-box;'
    });
    //nav header
    injectDOM('h1', 'VMELinksBanner', this.linkWrapperID, {
        'class':'navPanelHeader', 
        'style':'float:left; margin-top:0px;',
        'innerHTML':ODB.topLevel.expName+' VME Status'
    });

    //the VME view is done entirely with dom elements; most convenient to extend the central div to accommodate.
    cellSize = document.getElementById(this.linkWrapperID).offsetWidth / 100;
    //VME divs
    injectDOM('div', 'VMEWrapper', this.linkWrapperID, {'style':'clear:left;'});
    for(i=0; i<window.parameters.nVME; i++){
        VMEStyle = 'display:inline-block; margin-left:'+(2*cellSize)+'px; margin-right:'+(2*cellSize)+'px; margin-bottom:'+2*cellSize+'px; margin-top:'+2*cellSize+'px;'
        injectDOM('div', 'VME'+i, 'VMEWrapper', {'class':'VME', 'style':VMEStyle, 'onclick':function(){showVME(this.id)}});
        injectDOM('div', 'VME'+i+'title', 'VME'+i, {'innerHTML':'VME'+i});
        if(i%4==3)
            injectDOM('br', 'break', 'VMEWrapper', {});
    }

	//deploy a canvas for the clock view; this is actually just a dummy to stay consistent with all the other views, so we can use the same transition functions easily.
    injectDOM('canvas', this.canvasID, this.wrapperID, {'class':'monitor', 'style':'top:' + ($('#VMELinks').height() + 5) +'px;'});

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

    //update table
    document.getElementById('VMEContentTitle').innerHTML = 'VME' + id.slice(3,id.length);
}

function powerCycleVME(id){
	//turn VME off

	//turn VME back on again.
}













