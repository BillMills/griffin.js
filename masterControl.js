function loadJSONP(gatekeeper, callback) {
    var i;

    window.JSONPstore = {}; //dump the old store so old junk doesn't persist.
    for(i=0; i<window.parameters.JSONPrepos.length; i++){

        var script  = document.createElement('script');

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
            for(i=0; i<window.Subdetectors.length; i++){
                window.Subdetectors[i].update();
            }
        }
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

//determine what size cards are in what slot:
function detectCards(){
    var i, j, crateCode, nSlots;
    
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
    paths[14] = '/DashboardConfig/DANTE/LaBrPMTHVscale[*]'
    paths[15] = '/DashboardConfig/DANTE/LaBrPMTthresholdScale[*]'
    paths[16] = '/DashboardConfig/DANTE/LaBrPMTrateScale[*]'
    paths[17] = '/DashboardConfig/DANTE/LaBrTACHVscale[*]'
    paths[18] = '/DashboardConfig/DANTE/LaBrTACthresholdScale[*]'
    paths[19] = '/DashboardConfig/DANTE/LaBrTACrateScale[*]'    
    paths[20] = '/DashboardConfig/DANTE/BGOHVscale[*]'
    paths[21] = '/DashboardConfig/DANTE/BGOthresholdScale[*]'
    paths[22] = '/DashboardConfig/DANTE/BGOrateScale[*]'

    paths[23] = '/DashboardConfig/DESCANT/deploy'
    paths[24] = '/DashboardConfig/DESCANT/HVscale[*]'
    paths[25] = '/DashboardConfig/DESCANT/thresholdScale[*]'
    paths[26] = '/DashboardConfig/DESCANT/rateScale[*]'

    paths[27] = '/DashboardConfig/HPGe/deploy'
    paths[28] = '/DashboardConfig/HPGe/BGOHVscale[*]'
    paths[29] = '/DashboardConfig/HPGe/BGOthresholdScale[*]'
    paths[30] = '/DashboardConfig/HPGe/BGOrateScale[*]'
    paths[31] = '/DashboardConfig/HPGe/HVscale[*]'
    paths[32] = '/DashboardConfig/HPGe/thresholdScale[*]'
    paths[33] = '/DashboardConfig/HPGe/rateScale[*]'

    paths[34] = '/DashboardConfig/PACES/deploy'
    paths[35] = '/DashboardConfig/PACES/HVscale[*]'
    paths[36] = '/DashboardConfig/PACES/thresholdScale[*]'
    paths[37] = '/DashboardConfig/PACES/rateScale[*]'    

    paths[38] = '/DashboardConfig/SCEPTAR/USdeploy'
    paths[39] = '/DashboardConfig/SCEPTAR/DSdeploy'
    paths[40] = '/DashboardConfig/SCEPTAR/HVscale[*]'
    paths[41] = '/DashboardConfig/SCEPTAR/thresholdScale[*]'
    paths[42] = '/DashboardConfig/SCEPTAR/rateScale[*]'

    paths[43] = '/DashboardConfig/SHARC/deploy'
    paths[44] = '/DashboardConfig/SHARC/HVscale[*]'
    paths[45] = '/DashboardConfig/SHARC/thresholdScale[*]'
    paths[46] = '/DashboardConfig/SHARC/rateScale[*]'

    paths[47] = '/DashboardConfig/SPICE/deploy'
    paths[48] = '/DashboardConfig/SPICE/HVscale[*]'
    paths[49] = '/DashboardConfig/SPICE/thresholdScale[*]'
    paths[50] = '/DashboardConfig/SPICE/rateScale[*]'

    paths[51] = '/DashboardConfig/ZDS/deploy'
    paths[52] = '/DashboardConfig/ZDS/HVscale[*]'
    paths[53] = '/DashboardConfig/ZDS/thresholdScale[*]'
    paths[54] = '/DashboardConfig/ZDS/rateScale[*]'

    paths[55] = '/DashboardConfig/TIPwall/deploy'
    paths[56] = '/DashboardConfig/TIPwall/HVscale[*]'
    paths[57] = '/DashboardConfig/TIPwall/thresholdScale[*]'
    paths[58] = '/DashboardConfig/TIPwall/rateScale[*]'            

    paths[59] = '/DashboardConfig/TIPball/deploy'
    paths[60] = '/DashboardConfig/TIPball/HVscale[*]'
    paths[61] = '/DashboardConfig/TIPball/thresholdScale[*]'
    paths[62] = '/DashboardConfig/TIPball/rateScale[*]'   

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

    paths[75] = '/DashboardConfig/DSSD/HVscale[*]';
    paths[76] = '/DashboardConfig/DSSD/thresholdScale[*]';
    paths[77] = '/DashboardConfig/DSSD/rateScale[*]';

    //fetch:
    var data = ODBMGet(paths);
    //console.log(data[78].slice(0,11) == '<DB_NO_KEY>')

    //alert(data[0].slice(data[0].length-1,data[0].length).charCodeAt(0));  //ODBGet sticks a \n onto the end of all returned strings :(
    //also all numbers are returned as strings with \n suffix, and all arrays have an empty array position stuck on the back :( :( :(

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
    window.parameters.DANTE.minima.LaBrPMT = [parseFloat(data[14][0]), parseFloat(data[15][0]), parseFloat(data[16][0])];
    window.parameters.DANTE.maxima.LaBrPMT = [parseFloat(data[14][1]), parseFloat(data[15][1]), parseFloat(data[16][1])];
    window.parameters.DANTE.minima.LaBrTAC = [parseFloat(data[17][0]), parseFloat(data[18][0]), parseFloat(data[19][0])];
    window.parameters.DANTE.maxima.LaBrTAC = [parseFloat(data[17][1]), parseFloat(data[18][1]), parseFloat(data[19][1])];
    window.parameters.DANTE.minima.BGO = [parseFloat(data[20][0]), parseFloat(data[21][0]), parseFloat(data[22][0])];
    window.parameters.DANTE.maxima.BGO = [parseFloat(data[20][1]), parseFloat(data[21][1]), parseFloat(data[22][1])];

    window.parameters.deployment.DESCANT = parseFloat(data[23]);
    window.parameters.DESCANT.minima.DESCANT = [parseFloat(data[24][0]), parseFloat(data[25][0]), parseFloat(data[26][0])];
    window.parameters.DESCANT.maxima.DESCANT = [parseFloat(data[24][1]), parseFloat(data[25][1]), parseFloat(data[26][1])];

    window.parameters.deployment.HPGe = parseFloat(data[27]);
    window.parameters.HPGe.minima.BGO = [parseFloat(data[28][0]), parseFloat(data[29][0]), parseFloat(data[30][0])];
    window.parameters.HPGe.maxima.BGO = [parseFloat(data[28][1]), parseFloat(data[29][1]), parseFloat(data[30][1])];
    window.parameters.HPGe.minima.HPGe = [parseFloat(data[31][0]), parseFloat(data[32][0]), parseFloat(data[33][0])];
    window.parameters.HPGe.maxima.HPGe = [parseFloat(data[31][1]), parseFloat(data[32][1]), parseFloat(data[33][1])];

    window.parameters.deployment.PACES = parseFloat(data[34]);
    window.parameters.PACES.minima.PACES = [parseFloat(data[35][0]), parseFloat(data[36][0]), parseFloat(data[37][0])];
    window.parameters.PACES.maxima.PACES = [parseFloat(data[35][1]), parseFloat(data[36][1]), parseFloat(data[37][1])];    

    if(parseFloat(data[38]) || parseFloat(data[39]) || parseFloat(data[51])) window.parameters.deployment.SCEPTAR = 1;
    else window.parameters.deployment.SCEPTAR = 0;
    window.parameters.SCEPTARconfig = [parseFloat(data[38]), parseFloat(data[39]), parseFloat(data[51])];
    window.parameters.SCEPTAR.minima.SCEPTAR = [parseFloat(data[40][0]), parseFloat(data[41][0]), parseFloat(data[42][0])];
    window.parameters.SCEPTAR.maxima.SCEPTAR = [parseFloat(data[40][1]), parseFloat(data[41][1]), parseFloat(data[42][1])];
    window.parameters.SCEPTAR.minima.ZDS = [parseFloat(data[52][0]), parseFloat(data[53][0]), parseFloat(data[54][0])];
    window.parameters.SCEPTAR.maxima.ZDS = [parseFloat(data[52][1]), parseFloat(data[53][1]), parseFloat(data[54][1])];

    window.parameters.deployment.SHARC = parseFloat(data[43]);
    window.parameters.SHARC.minima.SHARC = [parseFloat(data[44][0]), parseFloat(data[45][0]), parseFloat(data[46][0])];
    window.parameters.SHARC.maxima.SHARC = [parseFloat(data[44][1]), parseFloat(data[45][1]), parseFloat(data[46][1])];

    window.parameters.deployment.SPICE = parseFloat(data[47]);
    window.parameters.SPICE.minima.SPICE = [parseFloat(data[48][0]), parseFloat(data[49][0]), parseFloat(data[50][0])];
    window.parameters.SPICE.maxima.SPICE = [parseFloat(data[48][1]), parseFloat(data[49][1]), parseFloat(data[50][1])];

    window.parameters.deployment.TIPwall = parseFloat(data[55]);
    window.parameters.TIPwall.minima.TIPwall = [parseFloat(data[56][0]), parseFloat(data[57][0]), parseFloat(data[58][0])];
    window.parameters.TIPwall.maxima.TIPwall = [parseFloat(data[56][1]), parseFloat(data[57][1]), parseFloat(data[58][1])];

    window.parameters.deployment.TIPball = parseFloat(data[59]);
    window.parameters.TIPwall.minima.TIPball = [parseFloat(data[60][0]), parseFloat(data[61][0]), parseFloat(data[62][0])];
    window.parameters.TIPwall.maxima.TIPball = [parseFloat(data[60][1]), parseFloat(data[61][1]), parseFloat(data[62][1])];

    window.parameters.DAQminima = [parseFloat(data[63]), parseFloat(data[67]), parseFloat(data[65]), parseFloat(data[69]), parseFloat(data[71]), parseFloat(data[73])];
    window.parameters.DAQmaxima = [parseFloat(data[64]), parseFloat(data[68]), parseFloat(data[66]), parseFloat(data[70]), parseFloat(data[72]), parseFloat(data[74])];

    window.parameters.DSSD.minima.DSSD = [parseFloat(data[75][0]), parseFloat(data[76][0]), parseFloat(data[77][0])];
    window.parameters.DSSD.maxima.DSSD = [parseFloat(data[75][1]), parseFloat(data[76][1]), parseFloat(data[77][1])];
    
}

//wrap ODBMGet in a function that accepts a key value store populated with ODBpaths, and returns the same object
//with paths replaced by actual values fetched from the ODB
//coming soon








