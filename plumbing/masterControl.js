function loadJSONP(gatekeeper, callback) {
    var i;

    if(document.getElementById('spinner')){
        drawSpinner('spinner', 'Waiting for JSONP');
    }

    //actually this creates a window where the JSONP store is empty; if a rePaint is requested then, bad things happen!
    //dump buffers AFTER the new data is downloaded :)
    //window.JSONPstore = {'scalar':{}, 'thresholds':{}, 'HV':{}}; //dump the old store so old junk doesn't persist.

    for(i=0; i<window.parameters.JSONPrepos.length; i++){

        var script = document.createElement('script');

        //either make some fake data to replace the JSONP service offline in devMode, or use the real thing online:
        if(window.parameters.devMode){
            script.setAttribute('src', ' ');
            if(callback != 'main'){
                parseResponse(fakeScalars());
                parseThreshold(fakeThresholds());
            }
        } else
            script.setAttribute('src', window.parameters.JSONPrepos[i]);    //fetch the ith repo

        script.setAttribute('id', 'tempScript'+i);

        script.onload = function(){
            for(var i=0; i<window.parameters.JSONPrepos.length; i++){
                if (window.parameters.JSONPrepos[i] == this.src) window.JSONPstatus[i] = 'Online';
            }
            //post to GK:
            var gatekeeperReport = new  CustomEvent("gatekeeperReport", {
                                            detail: {
                                                status: 'loaded',
                                                cb: callback        
                                            }
                                        });
            gatekeeper.listener.dispatchEvent(gatekeeperReport);
        }

        script.onerror = function(){
            for(var i=0; i<window.parameters.JSONPrepos.length; i++){
                if (window.parameters.JSONPrepos[i] == this.src) window.JSONPstatus[i] = 'Not Responding';
            }
            //post to GK:
            var gatekeeperReport = new  CustomEvent("gatekeeperReport", {
                                            detail: {
                                                status: 'failed',        
                                                cb: callback
                                            }
                                        });
            gatekeeper.listener.dispatchEvent(gatekeeperReport);
        }

        document.head.appendChild(script);
    }
}

//an object to block the page update until all the JSONP requests have reported back. 
function gatekeeper(){
    this.listener = document.getElementById('topWrapper')

    //how many JSONP assets have checked in?
    this.copyBack = 0;

    this.listener.addEventListener("gatekeeperReport", function(e){
        window.Gatekeeper.copyBack++;

        if(window.Gatekeeper.copyBack == window.parameters.JSONPrepos.length){
            window.Gatekeeper.copyBack = 0;

            if(e.detail.cb == 'main') main.apply(null); //apply construction turns this into anon to avoid funky main collisions
            else masterLoop(e.detail.cb);
        }
    });
}

function masterLoop(callMyself, noFetch){
    var i,j, historySelect;

	if(!document.webkitHidden && !document.mozHidden){
        //one big ODB grab:
        if(!noFetch) ODBgrab();

        //update all assets
        //status bar
        window.statusBar.update();
        //HV
    	if(window.parameters.topDeployment['HV']) window.waffle.update();
        //DAQ
        if(window.parameters.topDeployment['DAQ']) window.DAQ.update();
        //Subsystems
        if(window.parameters.topDeployment['Subsystems']){
            for(i=0; i<window.Subdetectors.length; i++){
                window.Subdetectors[i].update();
            }
        }
        //Clock
        if(window.parameters.topDeployment['Clock']) window.clockPointer.update();
        //Filter
        if(window.parameters.topDeployment['Filter']) window.filterPointer.update();
        //VME
        if(window.parameters.topDeployment['VME']) window.VMEpointer.update();
        //Cycle
        if(window.parameters.topDeployment['Cycle']) window.cyclePointer.update();
        //Dashboard
        window.dashboard.update();       

        //history
        document.getElementById('historyPlot').src = selected('historyURL');

        //let the alarm service do it's thing now that the update is complete:
        window.AlarmServices.publishAlarms();

    }
    
    //remove all temporary scripts from the head so they don't accrue:
    for(i=0; i<window.parameters.JSONPrepos.length; i++){
        var element = document.getElementById('tempScript'+i);
        if(element)
            element.parentNode.removeChild(element);
    }

    //next iteration:
    window.loop = setTimeout(function(){loadJSONP(window.Gatekeeper, 1)}, 3000);
}

//determine how many crates are declared in the ODB.  Equipment name must be 'HV-xx', where xx == 0-99
function detectCrates(){
    var i, paths = [], data = [],
        maxCrates = 100;

    for(i=0; i<maxCrates; i++){
      paths[i] = '/Equipment/HV-'+i;
    }
    data = ODBMGet(paths);

    for(i=0; i<maxCrates; i++){
      if(data[i] != '<DB_NO_KEY>'){
        window.parameters.HVequipmentNames[window.parameters.HVequipmentNames.length] = 'HV-'+i
      }
    }

    //if no crates present, turn off HV monitoring
    window.parameters.topDeployment['HV'] = window.parameters.HVequipmentNames.length;

}

//determine what size cards are in what slot:
function detectCards(){
    var i, j, crateCode, nSlots;
    
    //32-bit integer encodes what size cards are in what slot; each slot is encoded in 2 bits, and slot 0 is the two highest (ie 31 and 30) bits.
    //00 == empty slot, 01 == 12chan card, 10 == 24chan card, 11 == 48chan card.  Crate size is indicated by the lowest two bits;
    //10 == 6 slot crate, 11 == 12 slot crate, anything else == 16 slot crate.
    for(j=0; j<window.parameters.HVequipmentNames.length; j++){
        crateCode = parseInt(ODBGet('/Equipment/'+window.parameters.HVequipmentNames[j]+'/Settings/Devices/sy2527/DD/crateMap'), 10);
        if( (crateCode & 3) == 2) nSlots = 6;
        else if( (crateCode & 3) == 3) nSlots = 12;
        else nSlots = 16;

        window.parameters.moduleSizes[j] = [];
        for(i=0; i<nSlots; i++){
            if( ((crateCode>>(30-2*i)) & 3) == 0 ) window.parameters.moduleSizes[j][window.parameters.moduleSizes[j].length] = 0;
            else if( ((crateCode>>(30-2*i)) & 3) == 1 ) window.parameters.moduleSizes[j][window.parameters.moduleSizes[j].length] = 1;
            else if( ((crateCode>>(30-2*i)) & 3) == 2 ) window.parameters.moduleSizes[j][window.parameters.moduleSizes[j].length] = 2;
            else if( ((crateCode>>(30-2*i)) & 3) == 3 ) window.parameters.moduleSizes[j][window.parameters.moduleSizes[j].length] = 4;
        }
    }

}

//force an immediate update, and set the master loop going again from there:
function forceUpdate(){
    clearTimeout(window.loop);
    startLoop(1);
}

//like forceUpdate, but doesn't fetch data - just draws with current parameters
function rePaint(){
    clearTimeout(window.loop);
    masterLoop(1, true);
}

//handle everybody's interval-based fetch from the ODB in one network request: (+1 more for the message service, weird...)
function ODBgrab(){
    var paths = [], i, j, k,
    SIDEBAR, DAQ, HV, CLOCK,
    data;

    //Message service:
    window.localODB.messages = ODBGetMsg(5);

    //sidebar
    SIDEBAR = 0;
    paths[SIDEBAR] = '/Experiment/Name';
    paths[SIDEBAR+1] = '/Runinfo/Run number';
    paths[SIDEBAR+2] = '/Runinfo/State';
    paths[SIDEBAR+3] = '/Runinfo/Start time';
    paths[SIDEBAR+4] = '/Runinfo/Stop time';
    paths[SIDEBAR+5] = '/Runinfo/Start time binary';
    paths[SIDEBAR+6] = '/Experiment/Run Parameters/Comment';
    //DAQ
    DAQ = SIDEBAR+7;
    paths[DAQ] = '/Equipment/Trigger/Statistics/Events per sec.';
    paths[DAQ+1] = '/Equipment/Trigger/Statistics/kBytes per sec.';
    paths[DAQ+2] = '/Equipment/Event Builder/Statistics/Events per sec.';
    paths[DAQ+3] = '/Equipment/Event Builder/Statistics/kBytes per sec.';
    //HV
    HV = DAQ+4
    for(k=0; k<window.parameters.moduleSizes.length; k++){  //recall length of module sizes = number of HV crates declared
        for(i=0; i<window.parameters.ODBkeys.length; i++){
            paths[HV + k*window.parameters.ODBkeys.length + i] = '/Equipment/'+window.parameters.HVequipmentNames[k]+'/'+window.parameters.ODBkeys[i]+'[*]';
        }       
    }
    //Clock
    CLOCK = HV + window.parameters.moduleSizes.length*window.parameters.ODBkeys.length;
    for(i=0; i<window.parameters.nClocks; i++){
        paths[CLOCK + i] = '/Equipment/GRIF-Clk'+i+'/Variables/Output[*]';
    }

    //data = ODBMGet(paths);
    data = JSON.parse(ODBMCopy(paths, undefined, 'json'));

    //sidebar
    window.localODB.expTitle = data[SIDEBAR]['Name'];
    window.localODB.runInfo = data[SIDEBAR+1]['Run number'];
    window.localODB.runstate = data[SIDEBAR+2]['State'];
    window.localODB.startInfo = data[SIDEBAR+3]['Start time'];
    window.localODB.elapsed = data[SIDEBAR+4]['Stop time'];
    window.localODB.binaryStart = data[SIDEBAR+5]['Start time binary'];
    window.localODB.comment = data[SIDEBAR+6]['Comment'];
    //DAQ
    window.localODB.TrigEPS = data[DAQ]['Events per sec.'];
    window.localODB.TrigDPS = data[DAQ+1]['kBytes per sec.'];
    window.localODB.EBEPS = data[DAQ+2]['Events per sec.'];
    window.localODB.EBDPS = data[DAQ+3]['kBytes per sec.'];  
    //HV
    for(k=0; k<window.parameters.moduleSizes.length; k++){  //recall length of module sizes = number of HV crates declared
        window.localODB['HV'+k] = [];
        window.localODB['HV'+k].reqVoltage      = data[HV + k*window.parameters.ODBkeys.length + 0]['Demand'];
        window.localODB['HV'+k].measVoltage     = data[HV + k*window.parameters.ODBkeys.length + 1]['Measured'];
        window.localODB['HV'+k].measCurrent     = data[HV + k*window.parameters.ODBkeys.length + 2]['Current'];
        window.localODB['HV'+k].rampUp          = data[HV + k*window.parameters.ODBkeys.length + 3]['Ramp Up Speed'];
        window.localODB['HV'+k].rampDown        = data[HV + k*window.parameters.ODBkeys.length + 4]['Ramp Down Speed'];
        window.localODB['HV'+k].measTemperature = data[HV + k*window.parameters.ODBkeys.length + 5]['Temperature'];
        window.localODB['HV'+k].repoChState     = data[HV + k*window.parameters.ODBkeys.length + 6]['ChState'];
        window.localODB['HV'+k].repoChStatus    = data[HV + k*window.parameters.ODBkeys.length + 7]['ChStatus'];
        window.localODB['HV'+k].voltageLimit    = data[HV + k*window.parameters.ODBkeys.length + 8]['Voltage Limit'];
        window.localODB['HV'+k].currentLimit    = data[HV + k*window.parameters.ODBkeys.length + 9]['Current Limit'];
        window.localODB['HV'+k].chName          = data[HV + k*window.parameters.ODBkeys.length + 10]['Names'];      
    }    
    //Clock
    for(i=0; i<window.parameters.nClocks; i++){
        window.localODB['clock'+i] = data[CLOCK+i]['Output'];
    }

    //Pull the measured voltages and channel names out and pack them along
    //with the JSONP stuff for the subdetector views:
    window.JSONPstore.HV = {};
    for(k=0; k<window.parameters.moduleSizes.length; k++){   
        for(i=0; i<window.localODB['HV'+k].chName.length; i++){
            window.JSONPstore.HV[window.localODB['HV'+k].chName[i].toUpperCase()] = parseFloat(window.localODB['HV'+k].measVoltage[i]);
        }
    }
}

//handle pulling the initial config parameters out of the ODB and replacing the default values in the JSONP-loaded parameter store:
function fetchODB(){
    ODB = JSON.parse(ODBCopy('/DashboardConfig'));
    scrubMeta(ODB);

    //every leaf has a metadata leaf parallel to it, screws up for/in traversal.  Scrub: 
    function scrubMeta(object){
        var key;

        //scrub metadata:
        for(key in object){
            if(key.indexOf('/key') != -1)
                delete object[key];
            else{
                //recurse?
                if(typeof object[key] == 'object' && !Array.isArray(object[key]))
                    scrubMeta(object[key]);
            }
        }
    };
}







