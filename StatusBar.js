function StatusBar(wrapper){
	this.wrapperID = wrapper;
	this.titleID = 'experimentTitle';
	this.runInfoID = 'runInfo';

	var that = this;

    //header info
    insertDOM('div', 'statusHeader', '', 'background:rgba(0,0,0,0.7); border: 5px solid; border-radius:10px; width:80%; margin-top:5%; margin-bottom:5%; margin-left:auto; margin-right:auto; padding-left:5%; padding-right:5%; transition:border-color 0.5s; -moz-transition:border-color 0.5s; -webkit-transition:border-color 0.5s;', this.wrapperID, '', '')

    //deploy tooltip:
    //this.tooltip = new Tooltip('LeftSidebarBKG', 'leftSidebarTT', this.wrapperID, [], []);
    //this.tooltip.obj = that;

    //tooltip actually attaches to a canvas - attach it to the background canvas, but then pull the event listners up to the top-level div:
    //document.getElementById('statusHeader').onmousemove = document.getElementById('LeftSidebarBKG').onmousemove
    //document.getElementById('statusHeader').onmouseout = document.getElementById('LeftSidebarBKG').onmouseout
    //document.getElementById('statusHeader').onmouseover = document.getElementById('LeftSidebarBKG').onmouseover
    //tooltip will also look for members canvasWidth and canvasHeight:
    //this.canvasWidth = document.getElementById('LeftSidebarBKG').width
    //this.canvasHeight = document.getElementById('LeftSidebarBKG').height

    //experiment title
    insertDOM('h2', this.titleID, '', 'margin-top:25px; font-family: "Orbitron", sans-serif;', 'statusHeader', '', '')

    //run info
	insertDOM('p', this.runInfoID, '', 'position:relative; margin-top:10px; margin-left:auto; margin-right:auto; padding-left:5%; padding-right:5%; text-align:center; font-size:16px; width: 80%;', 'statusHeader', '', 'Run Info Unavailable in pre-2011 MIDAS');

    //Alarm Service
    window.AlarmServices = new AlarmService('leftSidebar', 'leftSidebarDetail');

    //JSONP monitor
    insertDOM('p', 'JSONPmonitor', '', 'width:80%; margin-left:auto; margin-right:auto; padding-left:5%; padding-right:5%; margin-top:5%;', this.wrapperID, '', '')

    if(!window.parameters.MIDASlegacyMode){
        //message service
        //insertDOM('table', 'messageTable', '', 'padding:10px; font-family:10px Raleway;', this.wrapperID, '', '');
        /*  //message input diabled until further notice///////////////////////////////////
        insertDOM('tr', 'inputRow', '', '', 'messageTable', '', '');
        insertDOM('td', 'inputCell', 'messageServiceCell', 'background:#333333;', 'inputRow', '');
        document.getElementById('inputCell').innerHTML = ''
        //insertDOM('input', 'inputMessage', '', '', 'inputCell', '', '', '', 'text', '');
        insertDOM('textarea', 'inputMessage', '', 'background:#333333; color:#FFFFFF', 'inputCell', '', '', '', '', '');
        document.getElementById('inputMessage').rows = 3;
        document.getElementById('inputMessage').cols = 30;
        //expand the text box to fill the sidebar on larger monitors:
        while(document.getElementById('messageTable').offsetWidth + 10 < document.getElementById(this.wrapperID).offsetWidth)
            document.getElementById('inputMessage').cols++;
        document.getElementById('inputMessage').value = 'Enter log message here; press return to commit.';
        document.getElementById('inputMessage').onclick = function(){
            this.value = '';
        }
        document.getElementById('inputMessage').onkeypress = function(event){
            if(event.keyCode == 13 && this.value!=''){
                ODBGenerateMsg(this.value);
                forceUpdate();
                this.value = 'Enter log message here; press return to commit.';
            }
        }
        */ //end message input///////////////////////////////////////////////////////////////
        insertDOM('div', 'message0', 'messageServiceCell', 'background:#777777;', this.wrapperID, '');
        insertDOM('div', 'message1', 'messageServiceCell', 'background:#333333;', this.wrapperID, '');
        insertDOM('div', 'message2', 'messageServiceCell', 'background:#777777;', this.wrapperID, '');
        insertDOM('div', 'message3', 'messageServiceCell', 'background:#333333;', this.wrapperID, '');
        insertDOM('div', 'message4', 'messageServiceCell', 'background:#777777; margin-bottom:20px;', this.wrapperID, '');
    }

    this.update = function(){
        if(!window.parameters.MIDASlegacyMode){
            var i;
        	//experiment title 
            this.expTitle = window.localODB.expTitle + ' Experiment';
        	document.getElementById(this.titleID).innerHTML = this.expTitle;

    	    //run # 
            this.runInfo = 'Run # '+window.localODB.runInfo;

        	//run state
        	this.runInfo += ': ';
            this.runstate = window.localODB.runstate;
        	if(this.runstate == 1){ 
                this.runInfo += 'Stopped';
                $('#statusHeader').css('border-color', '#FF3333');
            }
        	else if(this.runstate == 2){
                this.runInfo += 'Paused';
                $('#statusHeader').css('border-color', '#FFFF33');   
            }
        	else if (this.runstate == 3){
                this.runInfo += 'Live';
                $('#statusHeader').css('border-color', '#66FF66');
            }
        	else this.runInfo += 'State Unknown';
        
    	    //run time
        	this.startInfo = 'Start: '+window.localODB.startInfo;
        	this.elapsed;
        	if(this.runstate == 1){
    	   	    this.elapsed = 'Stop: '+window.localODB.elapsed;
    	    } else {
                this.elapsed = 'Up: ';
                this.binaryStart = window.localODB.binaryStart;
                var date = new Date(); 
                var now = date.getTime() / 1000;
                var uptime = now - this.binaryStart;
                var hours = Math.floor(uptime / 3600);
                var minutes = Math.floor( (uptime%3600)/60 );
                var seconds = Math.floor(uptime%60);
                this.elapsed += hours + ' h, ' + minutes + ' m, ' + seconds +' s'
  		    }

            //run comment
            this.comment = window.localODB.comment;

            document.getElementById(this.runInfoID).innerHTML = '<br>' + this.runInfo + '<br>' + this.startInfo + '<br>' + this.elapsed + '<br><br>' + this.comment + '<br><br>';
        }

        //JSONP monitor:
        var JSONPtext = 'JSONP Services<br>';
        JSONPtext += 'Thresholds: ';
        JSONPtext += window.JSONPstatus[0]+'<br>';
        JSONPtext += 'Rates: ';
        JSONPtext += window.JSONPstatus[1]+'<br>';
        document.getElementById('JSONPmonitor').innerHTML = JSONPtext;
        
        //message service:
        if(!window.parameters.MIDASlegacyMode){
            var messages = ODBGetMsg(5);
            for(i=0; i<5; i++){
                document.getElementById('message'+i).innerHTML = messages[4-i]; //most recent on top
            }
        }
        
        //pull in status table from traditional status page, and put it in the TT: - disabled until id's available in MIDAS
        if(!window.parameters.MIDASlegacyMode && 1==0){
            $.get(window.parameters.statusURL, function(response){
                var i, headStart, headEnd = '', rowNode;

                //remove the <head> before html is parsed: (todo: oneline this with regex and replace?)
                i=0;
                while(headEnd==''){
                    if(response[i] == '<' && response[i+1] == 'h' && response[i+2] == 'e' && response[i+3] == 'a' && response[i+4] == 'd' && response[i+5] == '>' )
                        headStart = i;
                    else if (response[i] == '<' && response[i+1] == '/' && response[i+2] == 'h' && response[i+3] == 'e' && response[i+4] == 'a' && response[i+5] == 'd' && response[i+6] == '>' )
                        headEnd = i+7;
                    i++;
                }
                response = response.slice(0, headStart) + response.slice(headEnd, response.length);

                //change some colors - tags don't have IDs so easiest to do this as text:
                response = response.replace(/#E0E0FF/g, '#333333');

                //replace some font colors to make them legible against their backgrounds
                response = response.replace(/bgcolor="#00FF00"/g, 'bgcolor="#00FF00" style="color:#000000;"'); //green backgrounds
                response = response.replace(/bgcolor="00FF00"/g, 'bgcolor="#00FF00" style="color:#000000;"'); //green backgrounds, sometimes MIDAS leaves off the hash...
                response = response.replace(/bgcolor=#00FF00/g, 'bgcolor="#00FF00" style="color:#000000;"'); //green backgrounds, sometimes MIDAS leaves off the quotes...
                response = response.replace(/bgcolor="#FFFF00"/g, 'bgcolor="#FFFF00" style="color:#000000;"'); //yellow backgrounds
                response = response.replace(/bgcolor="FFFF00"/g, 'bgcolor="#FFFF00" style="color:#000000;"'); //yellow backgrounds, sometimes MIDAS leaves off the hash...
                response = response.replace(/bgcolor=#FFFF00/g, 'bgcolor="#FFFF00" style="color:#000000;"'); //yellow backgrounds, sometimes MIDAS leaves off the quotes...

                //stick the result in the TT - html parsing happens now:
                //document.getElementById('leftSidebarTT').innerHTML = response;
                /*
                //now strip out unwanted table elements, easiest to do after html parsing:
                var rowTags = getTag('tr', 'leftSidebarTT');
                if(rowTags){
                    for(i=0; i<4; i++){
                        rowTags[0].id = 'rowNodeID';
                        rowNode = document.getElementById('rowNodeID');
                        rowNode.parentNode.removeChild(rowNode);                    
                    }
                }

                $('#leftSidebarTT').css('padding', 0);
                */
            });

        }
        
    };

    this.findCell = function(event){
    	if(!window.parameters.MIDASlegacyMode)return 1;
        else return -1;
    };

    this.defineText = function(cell){        
        return 0;
    };

    this.update();

}