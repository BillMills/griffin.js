function loadJSONP(gatekeeper, callback) {
    var i;

    for(i=0; i<window.parameters.JSONPrepos.length; i++){

        var script  = document.createElement('script');
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
    this.listener = document.getElementById('waffleplate')

    //how many JSONP assets have checked in?
    this.copyBack = 0;

    this.listener.addEventListener("gatekeeperReport", function(e){
        window.Gatekeeper.copyBack++;

        if(window.Gatekeeper.copyBack == window.parameters.JSONPrepos.length){
            window.Gatekeeper.copyBack = 0;
            if(e.detail.cb == 'main') main();
            else masterLoop(e.detail.cb);
        }
    });
}

function masterLoop(callMyself){
    var i,j;
	if(!document.webkitHidden && !document.mozHidden){

        //one big ODB grab:
        ODBgrab();

        //update all assets
        //status bar
        window.statusBar.update();
        //HV
    	if(window.parameters.topDeployment['HV']) window.waffle.update();
        //DAQ
        if(window.parameters.topDeployment['DAQ']) window.DAQ.update();
        //Subsystems
        if(window.parameters.topDeployment['Subsystems']){
            for(i=0; i<window.Subdetectors.length; i++)
                window.Subdetectors[i].update();
        }

        //animate whoever is showing on top, flat draw the rest
        //Dashboard
        window.dashboard.animate(callMyself);
        //HV
        if(window.parameters.topDeployment['HV']){
            window.waffle.animate(callMyself);
            for(i=0; i<window.waffle.barCharts.length; i++){
                for(j=0; j<window.waffle.barCharts[i].length; j++)
                    window.waffle.barCharts[i][j].animate(callMyself);
            }
        }
        //DAQ
        if(window.parameters.topDeployment['DAQ']) window.DAQ.animate(callMyself);
        //Clock
        if(window.parameters.topDeployment['Clock']) window.Clock.animate(callMyself);
        //Trigger
        if(window.parameters.topDeployment['Trigger']) window.Trigger.animate(callMyself);
        //Subsystems
        if(window.parameters.topDeployment['Subsystems']){
            for(i=0; i<window.Subdetectors.length; i++){
                window.Subdetectors[i].animate(callMyself);
            }
        }
    }
    
    //remove all temporary scripts from the head so they don't accrue:
    for(i=0; i<window.parameters.JSONPrepos.length; i++){
        var element = document.getElementById('tempScript'+i);
        element.parentNode.removeChild(element);
    }

    window.freshLoad = 0;
    //next iteration:
    window.loop = setTimeout(function(){loadJSONP(window.Gatekeeper, 1)}, 3000);
}

//determine what size cards are in what slot:
function detectCards(){
    var i, j, crateCode, nSlots;
    
    if(window.parameters.devMode) moduleSizes = [0,4,0,1,1,0];
    else {
        //fetch cratemap code: subsequent pairs of bits correspond to slots in ascending order: 00 => empty slot; 01 => 12 channel card; 10 => 48 channel card.
        //crate size indicated by terminating bitpattern = 111: at bit 12 -> 6 slot crate, at bit 24 -> 12 slot crate, absent -> 16 slot crate:
        for(j=0; j<window.parameters.HVequipmentNames.length; j++){
            crateCode = ODBGet('/Equipment/'+window.parameters.HVequipmentNames[j]+'/Settings/CrateMap[0]');
            if( ((crateCode & (7<<12)) >> 12) == 7) nSlots = 6;
            else if( ((crateCode & (7<<24)) >> 24) == 7) nSlots = 12;
            else nSlots = 16;
    
            window.parameters.moduleSizes[j] = [];    
            for(i=0; i<nSlots; i++){
                if( ((crateCode>>(2*i)) & 3) == 1 ) window.parameters.moduleSizes[j][window.parameters.moduleSizes[j].length] = 1;
                else if( ((crateCode>>(2*i)) & 3) == 2 ) window.parameters.moduleSizes[j][window.parameters.moduleSizes[j].length] = 4;
                else window.parameters.moduleSizes[j][window.parameters.moduleSizes[j].length] = 0;
            }
        }
    }
}

//force an immediate update, and set the master loop going again from there:
function forceUpdate(){
    clearTimeout(window.loop);
    startLoop(1);
}

//handle everybody's interval-based fetch from the ODB in one network request:
function ODBgrab(){
    var paths = [], 
    data;

    //sidebar
    paths[0] = '/Experiment/Name';
    paths[1] = '/Runinfo/Run number';
    paths[2] = '/Runinfo/State';
    paths[3] = '/Runinfo/Start time';
    paths[4] = 'Runinfo/Stop time';
    paths[5] = 'Runinfo/Start time binary';
    paths[6] = '/Experiment/Run Parameters/Comment';
    //DAQ
    paths[7] = '/Equipment/Trigger/Statistics/Events per sec.';
    paths[8] = '/Equipment/Trigger/Statistics/kBytes per sec.';
    paths[9] = '/Equipment/Event Builder/Statistics/Events per sec.';
    paths[10] = '/Equipment/Event Builder/Statistics/kBytes per sec.';

    data = ODBMGet(paths);

    //sidebar
    window.localODB.expTitle = data[0];
    window.localODB.runInfo = data[1];
    window.localODB.runstate = data[2];
    window.localODB.startInfo = data[3];
    window.localODB.elapsed = data[4];
    window.localODB.binaryStart = data[5];
    window.localODB.comment = data[6];
    //DAQ
    window.localODB.TrigEPS = data[7];
    window.localODB.TrigDPS = data[8];
    window.localODB.EBEPS = data[9];
    window.localODB.EBDPS = data[10];  
}

//handle pulling the initial config parameters out of the ODB and replacing the default values in the JSONP-loaded parameter store:
function fetchCustomParameters(){

    //define keys
    var paths = [];
    paths[0]  = '/DashboardConfig/topLevel/HPGeArray'            //GRIFFIN or TIGRESS
    
    paths[1]  = '/DashboardConfig/topLevel/statusURL'            //URL of MIDAS status page
    paths[2]  = '/DashboardConfig/topLevel/expName'              //Experiment name

    paths[3]  = '/DashboardConfig/HV/voltageTolerance'           //tolerance for voltage alarms
    paths[4]  = '/DashboardConfig/HV/currentTolerance'           //threshold for current alarms
    paths[5]  = '/DashboardConfig/HV/tempTolerance'              //threshold for temperature alarms
    paths[6]  = '/DashboardConfig/HV/demandVoltage[*]'           //range of allowed demand voltages
    paths[7]  = '/DashboardConfig/HV/voltRampSpeed[*]'           //range of allowed voltage ramp speeds

    paths[8]  = '/DashboardConfig/BAMBINO/deploy'                //deploy BAMBINO?
    paths[9]  = '/DashboardConfig/BAMBINO/HVscale[*]'            //[min HV, max HV] on color scale
    paths[10] = '/DashboardConfig/BAMBINO/thresholdScale[*]'     //[min thresh, max thresh] on color scale
    paths[11] = '/DashboardConfig/BAMBINO/rateScale[*]'          //[min rate, max rate] on color scale
    paths[12] = '/DashboardConfig/BAMBINO/mode'                  //'S2' or 'S3'

    paths[13] = '/DashboardConfig/DANTE/deploy'
    paths[14] = '/DashboardConfig/DANTE/BaFHVscale[*]'
    paths[15] = '/DashboardConfig/DANTE/BaFthresholdScale[*]'
    paths[16] = '/DashboardConfig/DANTE/BaFrateScale[*]'
    paths[17] = '/DashboardConfig/DANTE/BGOHVscale[*]'
    paths[18] = '/DashboardConfig/DANTE/BGOthresholdScale[*]'
    paths[19] = '/DashboardConfig/DANTE/BGOrateScale[*]'

    paths[20] = '/DashboardConfig/DESCANT/deploy'
    paths[21] = '/DashboardConfig/DESCANT/HVscale[*]'
    paths[22] = '/DashboardConfig/DESCANT/thresholdScale[*]'
    paths[23] = '/DashboardConfig/DESCANT/rateScale[*]'

    paths[24] = '/DashboardConfig/HPGe/deploy'
    paths[25] = '/DashboardConfig/HPGe/BGOHVscale[*]'
    paths[26] = '/DashboardConfig/HPGe/BGOthresholdScale[*]'
    paths[27] = '/DashboardConfig/HPGe/BGOrateScale[*]'
    paths[28] = '/DashboardConfig/HPGe/HVscale[*]'
    paths[29] = '/DashboardConfig/HPGe/thresholdScale[*]'
    paths[30] = '/DashboardConfig/HPGe/rateScale[*]'

    paths[31] = '/DashboardConfig/PACES/deploy'
    paths[32] = '/DashboardConfig/PACES/HVscale[*]'
    paths[33] = '/DashboardConfig/PACES/thresholdScale[*]'
    paths[34] = '/DashboardConfig/PACES/rateScale[*]'    

    paths[35] = '/DashboardConfig/SCEPTAR/USdeploy'
    paths[36] = '/DashboardConfig/SCEPTAR/DSdeploy'
    paths[37] = '/DashboardConfig/SCEPTAR/HVscale[*]'
    paths[38] = '/DashboardConfig/SCEPTAR/thresholdScale[*]'
    paths[39] = '/DashboardConfig/SCEPTAR/rateScale[*]'

    paths[40] = '/DashboardConfig/SHARC/deploy'
    paths[41] = '/DashboardConfig/SHARC/HVscale[*]'
    paths[42] = '/DashboardConfig/SHARC/thresholdScale[*]'
    paths[43] = '/DashboardConfig/SHARC/rateScale[*]'

    paths[44] = '/DashboardConfig/SPICE/deploy'
    paths[45] = '/DashboardConfig/SPICE/HVscale[*]'
    paths[46] = '/DashboardConfig/SPICE/thresholdScale[*]'
    paths[47] = '/DashboardConfig/SPICE/rateScale[*]'

    paths[48] = '/DashboardConfig/ZDS/deploy'
    paths[49] = '/DashboardConfig/ZDS/HVscale[*]'
    paths[50] = '/DashboardConfig/ZDS/thresholdScale[*]'
    paths[51] = '/DashboardConfig/ZDS/rateScale[*]'

    paths[52] = '/DashboardConfig/TIP/deploy'
    paths[53] = '/DashboardConfig/TIP/mode'                         //'Ball' or 'Wall' 
    paths[54] = '/DashboardConfig/TIP/CsIHVscale[*]'
    paths[55] = '/DashboardConfig/TIP/HPGeHVscale[*]'
    paths[56] = '/DashboardConfig/TIP/BGOHVscale[*]'
    paths[57] = '/DashboardConfig/TIP/CsIthresholdScale[*]'
    paths[58] = '/DashboardConfig/TIP/HPGethresholdScale[*]'
    paths[59] = '/DashboardConfig/TIP/BGOthresholdScale[*]'
    paths[60] = '/DashboardConfig/TIP/CsIrateScale[*]'
    paths[61] = '/DashboardConfig/TIP/HPGerateScale[*]'
    paths[62] = '/DashboardConfig/TIP/BGOrateScale[*]'              

    paths[63] = '/DashboardConfig/DAQ/rateMinTopView';
    paths[64] = '/DashboardConfig/DAQ/rateMaxTopView';
    paths[65] = '/DashboardConfig/DAQ/rateMinDetailView';
    paths[66] = '/DashboardConfig/DAQ/rateMaxDetailView';
    paths[67] = '/DashboardConfig/DAQ/transferMinTopView';
    paths[68] = '/DashboardConfig/DAQ/transferMaxTopView';
    paths[69] = '/DashboardConfig/DAQ/transferMinDetailView';
    paths[70] = '/DashboardConfig/DAQ/transferMaxDetailView';
    
    paths[71] = '/DashboardConfig/DAQ/rateMinMaster';
    paths[72] = '/DashboardConfig/DAQ/rateMaxMaster';
    paths[73] = '/DashboardConfig/DAQ/transferMinMaster';
    paths[74] = '/DashboardConfig/DAQ/transferMaxMaster';

    paths[75] = '/DashboardConfig/DSSD/HVscale[*]'
    paths[76] = '/DashboardConfig/DSSD/thresholdScale[*]'
    paths[77] = '/DashboardConfig/DSSD/rateScale[*]'

    //fetch:
    var data = ODBMGet(paths);

    //alert(data[0].slice(data[0].length-1,data[0].length).charCodeAt(0));  //ODBGet sticks a \n onto the end of all returned strings :(
    //also all numbers are returned as strings with \n suffix, and all arrays have an empty array position stuck on the back :( :( :(

    //console.log(ODBGet(paths[62]))

    //plug data in
    
    window.parameters['HPGemode'] = data[0].slice(0, data[0].length-1);
    
    window.parameters['statusURL'] = data[1].slice(0, data[1].length-1);
    window.parameters['ExpName'] = data[2].slice(0, data[2].length-1);

    window.parameters['alarmThresholds'][0] = parseFloat(data[3]);
    window.parameters['alarmThresholds'][1] = parseFloat(data[4]);
    window.parameters['alarmThresholds'][2] = parseFloat(data[5]);
    window.parameters['minVoltage'] = parseFloat(data[6][0]);
    window.parameters['maxVoltage'] = parseFloat(data[6][1]);
    window.parameters['minRampSpeed'] = parseFloat(data[7][0]);
    window.parameters['maxRampSpeed'] = parseFloat(data[7][1]);

    window.parameters.deployment.BAMBINO = parseFloat(data[8]);
    window.parameters.BAMBINO.minima.BAMBINO = [parseFloat(data[9][0]), parseFloat(data[10][0]), parseFloat(data[11][0])];
    window.parameters.BAMBINO.maxima.BAMBINO = [parseFloat(data[9][1]), parseFloat(data[10][1]), parseFloat(data[11][1])];
    window.parameters.BAMBINOmode = data[12].slice(0, data[12].length-1);

    window.parameters.deployment.DANTE = parseFloat(data[13]);
    window.parameters.DANTE.minima.BaF = [parseFloat(data[14][0]), parseFloat(data[15][0]), parseFloat(data[16][0])];
    window.parameters.DANTE.maxima.BaF = [parseFloat(data[14][1]), parseFloat(data[15][1]), parseFloat(data[16][1])];
    window.parameters.DANTE.minima.BGO = [parseFloat(data[17][0]), parseFloat(data[18][0]), parseFloat(data[19][0])];
    window.parameters.DANTE.maxima.BGO = [parseFloat(data[17][1]), parseFloat(data[18][1]), parseFloat(data[19][1])];

    window.parameters.deployment.DESCANT = parseFloat(data[20]);
    window.parameters.DESCANT.minima.DESCANT = [parseFloat(data[21][0]), parseFloat(data[22][0]), parseFloat(data[23][0])];
    window.parameters.DESCANT.maxima.DESCANT = [parseFloat(data[21][1]), parseFloat(data[22][1]), parseFloat(data[23][1])];

    window.parameters.deployment.HPGe = parseFloat(data[24]);
    window.parameters.HPGe.minima.BGO = [parseFloat(data[25][0]), parseFloat(data[26][0]), parseFloat(data[27][0])];
    window.parameters.HPGe.maxima.BGO = [parseFloat(data[25][1]), parseFloat(data[26][1]), parseFloat(data[27][1])];
    window.parameters.HPGe.minima.HPGe = [parseFloat(data[28][0]), parseFloat(data[29][0]), parseFloat(data[30][0])];
    window.parameters.HPGe.maxima.HPGe = [parseFloat(data[28][1]), parseFloat(data[29][1]), parseFloat(data[30][1])];

    window.parameters.deployment.PACES = parseFloat(data[31]);
    window.parameters.PACES.minima.PACES = [parseFloat(data[32][0]), parseFloat(data[33][0]), parseFloat(data[34][0])];
    window.parameters.PACES.maxima.PACES = [parseFloat(data[32][1]), parseFloat(data[33][1]), parseFloat(data[34][1])];    

    if(parseFloat(data[35]) || parseFloat(data[36]) || parseFloat(data[48])) window.parameters.deployment.SCEPTAR = 1;
    else window.parameters.deployment.SCEPTAR = 0;
    window.parameters.SCEPTARconfig = [parseFloat(data[35]), parseFloat(data[36]), parseFloat(data[48])];
    window.parameters.SCEPTAR.minima.SCEPTAR = [parseFloat(data[37][0]), parseFloat(data[38][0]), parseFloat(data[39][0])];
    window.parameters.SCEPTAR.maxima.SCEPTAR = [parseFloat(data[37][1]), parseFloat(data[38][1]), parseFloat(data[39][1])];
    window.parameters.SCEPTAR.minima.ZDS = [parseFloat(data[49][0]), parseFloat(data[50][0]), parseFloat(data[51][0])];
    window.parameters.SCEPTAR.maxima.ZDS = [parseFloat(data[49][1]), parseFloat(data[50][1]), parseFloat(data[51][1])];

    window.parameters.deployment.SHARC = parseFloat(data[40]);
    window.parameters.SHARC.minima.SHARC = [parseFloat(data[41][0]), parseFloat(data[42][0]), parseFloat(data[43][0])];
    window.parameters.SHARC.maxima.SHARC = [parseFloat(data[41][1]), parseFloat(data[42][1]), parseFloat(data[43][1])];

    window.parameters.deployment.SPICE = parseFloat(data[44]);
    window.parameters.SPICE.minima.SPICE = [parseFloat(data[45][0]), parseFloat(data[46][0]), parseFloat(data[47][0])];
    window.parameters.SPICE.maxima.SPICE = [parseFloat(data[45][1]), parseFloat(data[46][1]), parseFloat(data[47][1])];

    window.parameters.deployment.TIP = parseFloat(data[52]);
    window.parameters.TIPmode = data[53].slice(0, data[53].length-1);
    window.parameters.TIP.minima.CsI = [parseFloat(data[54][0]), parseFloat(data[57][0]), parseFloat(data[60][0])];
    window.parameters.TIP.minima.HPGe = [parseFloat(data[55][0]), parseFloat(data[58][0]), parseFloat(data[61][0])];
    window.parameters.TIP.minima.BGO = [parseFloat(data[56][0]), parseFloat(data[59][0]), parseFloat(data[62][0])];
    window.parameters.TIP.maxima.CsI = [parseFloat(data[54][1]), parseFloat(data[57][1]), parseFloat(data[60][1])];
    window.parameters.TIP.maxima.HPGe = [parseFloat(data[55][1]), parseFloat(data[58][1]), parseFloat(data[61][1])];
    window.parameters.TIP.maxima.BGO = [parseFloat(data[56][1]), parseFloat(data[59][1]), parseFloat(data[62][1])];

    window.parameters.DAQminima = [parseFloat(data[63]), parseFloat(data[67]), parseFloat(data[65]), parseFloat(data[69]), parseFloat(data[71]), parseFloat(data[73])];
    window.parameters.DAQmaxima = [parseFloat(data[64]), parseFloat(data[68]), parseFloat(data[66]), parseFloat(data[70]), parseFloat(data[72]), parseFloat(data[74])];

    window.parameters.DSSD.minima.DSSD = [parseFloat(data[75][0]), parseFloat(data[76][0]), parseFloat(data[77][0])];
    window.parameters.DSSD.maxima.DSSD = [parseFloat(data[75][1]), parseFloat(data[76][1]), parseFloat(data[77][1])];
    
}

//wrap ODBMGet in a function that accepts a key value store populated with ODBpaths, and returns the same object
//with paths replaced by actual values fetched from the ODB
//coming soon








