function Clock(){
    var i, cellSize, clockStyle;

	this.wrapperID = window.parameters.wrapper;	    //ID of wrapping div
	this.canvasID = 'ClockCanvas';		            //ID of canvas to paint clock on
    this.linkWrapperID = 'ClockLinks';              //ID of div to contain clock view header
    this.sidebarID = 'ClockSidebar';                //ID of div to contain clock sidebar

	this.wrapper = document.getElementById(this.wrapperID);

    //add top level nav button:
    insertDOM('button', 'ClockButton', 'navLink', '', 'statusLink', function(){swapView('ClockLinks', 'ClockCanvas', 'clockMenus', 'ClockButton');}, 'Clock');

    //deploy right bar menu:
    deployMenu('clockMenus', ['summary', 'outs', 'CSAC'] , ['Clock Summary','Channel Outs','CSAC Parameters']);

    //nav wrapper div
    insertDOM('div', this.linkWrapperID, 'navPanel', 'width:50%; -moz-box-sizing: border-box; -webkit-box-sizing: border-box; box-sizing: border-box;', this.wrapperID, '', '');
    //nav header
    insertDOM('h1', 'ClockLinksBanner', 'navPanelHeader', '', this.linkWrapperID, '', window.parameters.ExpName+' Clock Status');
    insertDOM('br', 'break', '', '', this.linkWrapperID, '', '');

    //the clock view is done entirely with dom elements; most convenient to extend the central div to accommodate.
    cellSize = document.getElementById(this.linkWrapperID).offsetWidth / 100;
    insertDOM('div', 'masterClock', 'clock', 'width:'+20*cellSize+'px; height:'+10*cellSize+'px; margin-left:auto; margin-right:auto; margin-top:20px;', this.linkWrapperID, function(){glowMe(this.id)}, '');
    //slaves
    for(i=0; i<24; i++){
        clockStyle = 'display:inline-block; width:'+10*cellSize+'px; height:'+10*cellSize+'px; margin-left:'+( (i%6==0) ? 10*cellSize : 2*cellSize )+'px; margin-right:'+( (i%6==5) ? 10*cellSize : 2*cellSize )+'px; margin-bottom:'+2*cellSize+'px; margin-top:'+2*cellSize+'px;'
        insertDOM('div', 'slaveClock'+i, 'clock', clockStyle , this.linkWrapperID, function(){glowMe(this.id)}, '');
        if(i%6==5) insertDOM('br', 'break', '', '', this.linkWrapperID);
    }






	//deploy a canvas for the clock view; this is actually just a dummy to stay consistent with all the other views, so we can use the same transition functions easily.
    insertDOM('canvas', this.canvasID, 'monitor', 'top:' + ($('#ClockLinks').height() + 5) +'px;', this.wrapperID, '', '');

}

function glowMe(id){
    var i;

    document.getElementById('masterClock').style['box-shadow'] = '0 0 0px white'; 

    for(i=0; i<24; i++){
        if(document.getElementById('slaveClock'+i))
            document.getElementById('slaveClock'+i).style['box-shadow'] = '0 0 0px white';    
    }
    document.getElementById(id).style['box-shadow'] = '0 0 20px white';
}
