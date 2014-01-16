function establishHistoryView(){
	
	var EPICSdir = window.location.host + '/HS/Epics/';

	//wrap
	injectDOM('div', 'historyWrap', 'SubsystemSidebar', {'style':'padding:1em; border-top: 1px solid #777777; display:inline-block; float:left; clear:left;'});
	//image tag to hold history plot
	injectDOM('img', 'historyPlot', 'historyWrap', {'src':'http://grsmid00.triumf.ca:8081/HS/Epics/Shack%20Temp.gif?width=Small'});

	//form & text box to request plots
	injectDOM('form', 'historyForm', 'historyWrap', {});
	injectDOM('select', 'historyURL', 'historyForm', {'class':'historyDD'});
	injectDOM('option', 'history1', 'historyURL', {'value':EPICSdir + 'Trigger%20rate.gif?width=Small', 'innerHTML':'Trig Rate'});
	injectDOM('option', 'history0', 'historyURL', {'value':EPICSdir + 'Shack%20Temp.gif?width=Small', 'innerHTML':'Temp'});
	injectDOM('option', 'history1', 'historyURL', {'value':EPICSdir + 'Ge.gif?width=Small', 'innerHTML':'Ge'});



	document.getElementById('historyURL').onchange = function(){
		document.getElementById('historyPlot').src = this.value;
	};	

}