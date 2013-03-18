function StatusBar(wrapper){
	this.wrapperID = wrapper;
	this.titleID = 'experimentTitle';
	this.runInfoID = 'runInfo';

    //experiment title
    insertDOM('h2', this.titleID, '', 'margin-left:10%; margin-top:25px; font-family: "Orbitron", sans-serif;', this.wrapperID, '', 'Experiment Title')

    //run info
	insertDOM('p', this.runInfoID, '', 'margin-top:10px; margin-left:auto; margin-right:auto; text-align:center; font-size:16px;', this.wrapperID, '', 'Run Info');

    //Alarm Service
    window.AlarmServices = new AlarmService('leftSidebar', 'leftSidebarDetail');

    this.update = function(){
    	//experiment title
    	this.expTitle = 'Offline Demo Experiment'; //ODBGet('/Experiment/Name') + ' Experiment';
    	document.getElementById(this.titleID).innerHTML = this.expTitle;

    	//run #
    	var runInfo = 'Run #1337'; // 'Run # '+ODBGet('/Runinfo/Run number');

    	//run state
    	runInfo += ': ';
    	var runstate = 3; //ODBGet('/Runinfo/State');
    	if(runstate == 1) runInfo += 'Stopped';
    	else if(runstate == 2) runInfo += 'Paused';
    	else if (runstate == 3) runInfo += 'Live';
    	else runInfo += 'State Unknown';

    	//run time
    	var startInfo = 'Start: ';
    	startInfo += '00:00:00 January 1, 1970'//ODBGet('/Runinfo/Start time');
    	var elapsed;
    	if(runstate == 1){
    		elapsed = 'Stop: '
    		elapsed += '00:00:00 January 1, 1970'; //ODBGet('Runinfo/Stop time');
    	} else {
    		elapsed = 'Up: ';
    		var binaryStart = 0; //ODBGet('Runinfo/Start time binary');
    		var date = new Date(); 
    		var now = date.getTime() / 1000;
    		var uptime = now - binaryStart;
    		var hours = Math.floor(uptime / 3600);
    		var minutes = Math.floor( (uptime%3600)/60 );
    		var seconds = Math.floor(uptime%60);
    		elapsed += hours + ' h, ' + minutes + ' m, ' + seconds +' s'
  		}
  		document.getElementById(this.runInfoID).innerHTML = runInfo + '<br>' + startInfo + '<br>' + elapsed;

    };

    this.update();
}