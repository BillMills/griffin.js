function StatusBar(wrapper){
	this.wrapperID = wrapper;
	this.titleID = 'experimentTitle';
	this.runInfoID = 'runInfo';

	var that = this;

	//deploy tooltip:
    this.tooltip = new Tooltip('LeftSidebarBKG', 'leftSidebarTTipText', 'leftSidebarTT', this.wrapperID, [], []);
    this.tooltip.obj = that;
    //tooltip actually attaches to a canvas - attach it to the background canvas, but then pull the event listners up to the top-level div:
    document.getElementById(this.wrapperID).onmousemove = document.getElementById('LeftSidebarBKG').onmousemove
    document.getElementById(this.wrapperID).onmouseout = document.getElementById('LeftSidebarBKG').onmouseout

    //header info
    insertDOM('div', 'statusHeader', '', 'background:rgba(0,0,0,0.7); border: 5px solid; border-radius:10px; width:80%; margin-top:5%; margin-bottom:5%; margin-left:auto; margin-right:auto; padding-left:5%; padding-right:5%; transition:border-color 0.5s; -moz-transition:border-color 0.5s; -webkit-transition:border-color 0.5s;', this.wrapperID, '', '')

    //experiment title
    insertDOM('h2', this.titleID, '', 'margin-top:25px; font-family: "Orbitron", sans-serif;', 'statusHeader', '', 'Experiment Title')

    //run info
	insertDOM('p', this.runInfoID, '', 'position:relative; margin-top:10px; margin-left:auto; margin-right:auto; padding-left:5%; padding-right:5%; text-align:center; font-size:16px; width: 80%;', 'statusHeader', '', 'Run Info');

    //Alarm Service
    window.AlarmServices = new AlarmService('leftSidebar', 'leftSidebarDetail');

    //JSONP monitor
    insertDOM('p', 'JSONPmonitor', '', 'width:80%; margin-left:auto; margin-right:auto; padding-left:5%; padding-right:5%; margin-top:5%;', this.wrapperID, '', '')


/*
    insertDOM('table', 'JSONPmonitor', '', 'width:80%; margin-left:auto; margin-right:auto; padding-left:5%; padding-right:5%; margin-top:5%;', this.wrapperID, '', '');
    insertDOM('caption', 'JSONPtitle', '', '', 'JSONPmonitor', '', 'JSONP Services');
    //rates
    insertDOM('tr', 'ratesRow', '', '', 'JSONPmonitor', '', '');
    insertDOM('td', 'ratesLabel', '', 'text-align:right; width:50%', 'ratesRow', '', 'Rates:');
    insertDOM('td', 'ratesFlag', '', '', 'ratesRow', '', 'Online');
    //thresholds
    insertDOM('tr', 'thresholdsRow', '', '', 'JSONPmonitor', '', '');
    insertDOM('td', 'thresholdsLabel', '', 'text-align:right; width:50%', 'thresholdsRow', '', 'Thresholds:');
    insertDOM('td', 'thresholdsFlag', '', '', 'thresholdsRow', '', 'Not Responding');
*/
    this.update = function(){
    	//experiment title
    	if(window.parameters.devMode) this.expTitle = 'Offline Demo Experiment'; 
        else this.expTitle = ODBGet('/Experiment/Name') + ' Experiment';
    	document.getElementById(this.titleID).innerHTML = this.expTitle;

    	//run #
    	if(window.parameters.devMode) var runInfo = 'Run #1337'; 
        else var runInfo = 'Run # '+ODBGet('/Runinfo/Run number');

    	//run state
    	runInfo += ': ';
    	if(window.parameters.devMode) var runstate = 3; 
        else var runstate = ODBGet('/Runinfo/State');
    	if(runstate == 1){ 
            runInfo += 'Stopped';
            $('#statusHeader').css('border-color', '#FF3333');
        }
    	else if(runstate == 2){
            runInfo += 'Paused';
            $('#statusHeader').css('border-color', '#FFFF33');   
        }
    	else if (runstate == 3){
            runInfo += 'Live';
            $('#statusHeader').css('border-color', '#66FF66');
        }
    	else runInfo += 'State Unknown';

    	//restart?  TODO
        if(window.parameters.devMode) this.restart = '???';
    	else this.restart = ODBGet('/Programs/Logger/Auto restart');

    	//data dir:
    	if(window.parameters.devMode) this.dataDir = '/dummy/directory/path/' 
        else this.dataDir = ODBGet('/Logger/Data dir')

    	//run time
    	var startInfo = 'Start: ';
    	if(window.parameters.devMode) startInfo += '00:00:00 January 1, 1970'
        else startInfo += ODBGet('/Runinfo/Start time');
    	var elapsed;
    	if(runstate == 1){
    		elapsed = 'Stop: '
    		if(window.parameters.devMode) elapsed += '00:00:00 January 1, 1970'; 
            else elapsed += ODBGet('Runinfo/Stop time');
    	} else {
    		elapsed = 'Up: ';
    		if(window.parameters.devMode) var binaryStart = 0; 
            else var binaryStart = ODBGet('Runinfo/Start time binary');
    		var date = new Date(); 
    		var now = date.getTime() / 1000;
    		var uptime = now - binaryStart;
    		var hours = Math.floor(uptime / 3600);
    		var minutes = Math.floor( (uptime%3600)/60 );
    		var seconds = Math.floor(uptime%60);
    		elapsed += hours + ' h, ' + minutes + ' m, ' + seconds +' s'
  		}

        //run comment
        var comment;
        if(window.parameters.devMode) comment = 'No Comment';
        else comment = ODBGet('/Experiment/Run Parameters/Comment');

  		document.getElementById(this.runInfoID).innerHTML = '<br>' + runInfo + '<br>' + startInfo + '<br>' + elapsed + '<br><br>' + comment + '<br><br>';

        //JSONP monitor:
        var JSONPtext = 'JSONP Services<br>';
        JSONPtext += 'Thresholds: ';
        JSONPtext += window.JSONPstatus[0]+'<br>';
        JSONPtext += 'Rates: ';
        JSONPtext += window.JSONPstatus[1]+'<br>';
        document.getElementById('JSONPmonitor').innerHTML = JSONPtext;

    };

    this.findCell = function(event){
    	return 1;
    };

    this.defineText = function(cell){
        var toolTipContent = '<br>';
        var nextLine;
        var longestLine = 0;
        var cardIndex;
        var i;

        nextLine = '<u>Run Config Details</u>'
        //keep track of the longest line of text:
        longestLine = Math.max(longestLine, this.tooltip.context.measureText(nextLine).width)
        toolTipContent += nextLine + '<br><br>';

        nextLine = 'Auto-Restart on End of Run: ' + this.restart 
        //keep track of the longest line of text:
        longestLine = Math.max(longestLine, this.tooltip.context.measureText(nextLine).width)
        toolTipContent += nextLine + '<br>';

        nextLine = 'Data dir: ' + this.dataDir
        //keep track of the longest line of text:
        longestLine = Math.max(longestLine, this.tooltip.context.measureText(nextLine).width)
        toolTipContent += nextLine + '<br>';

        document.getElementById(this.tooltip.ttTextID).innerHTML = toolTipContent;

        //return length of longest line:
        return longestLine;
    };

    this.update();
}