function VME(){
	var VMEStyle, cellSize, that = this;
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
    //...
    //

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