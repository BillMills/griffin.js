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

        //animate whoever is showing on top, flat draw the rest; force animate for everyone on first pass, since Google fonts don't render in canvas on the first call to draw (investigate):
        //Dashboard
        window.dashboard.animate(callMyself);
        //HV
        if(window.parameters.topDeployment['HV']){
            window.waffle.animate(callMyself);
            for(i=0; i<window.waffle.barCharts.length; i++)
                window.waffle.barCharts[i].animate(callMyself);
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
    var moduleSizes, crateCode, nSlots;
    
    if(window.parameters.devMode) moduleSizes = [0,4,0,1,1,0];
    else {
        //fetch cratemap code: lowest bit: 0 = 6 slot, 1 = 12 slot; subsequent pairs of bits correspond to slots in ascending order;
        //00 => empty slot; 01 => 12 channel card; 10 => 48 channel card.
        crateCode = ODBGet('/Equipment/HV/Settings/CrateMap[0]');
        if(crateCode & 1) nSlots = 12;
        else nSlots = 6;

        moduleSizes = [];
        for(var i=0; i<nSlots; i++){
            if( ((crateCode>>(1+2*i)) & 3) == 1 ) moduleSizes[moduleSizes.length] = 1;
            else if( ((crateCode>>(1+2*i)) & 3) == 2 ) moduleSizes[moduleSizes.length] = 4;
            else moduleSizes[moduleSizes.length] = 0;
        }
    }

    return moduleSizes;
}

//force an immediate update, and set the master loop going again from there:
function forceUpdate(){
    clearTimeout(window.loop);
    startLoop(1);
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
    paths[54] = '/DashboardConfig/TIP/WallHVscale[*]'
    paths[55] = '/DashboardConfig/TIP/BallHVscale[*]'
    paths[56] = '/DashboardConfig/TIP/HPGeHVscale[*]'
    paths[57] = '/DashboardConfig/TIP/BGOHVscale[*]'
    paths[58] = '/DashboardConfig/TIP/WallthresholdScale[*]'
    paths[59] = '/DashboardConfig/TIP/BallthresholdScale[*]'
    paths[60] = '/DashboardConfig/TIP/HPGethresholdScale[*]'
    paths[61] = '/DashboardConfig/TIP/BGOthresholdScale[*]'
    paths[62] = '/DashboardConfig/TIP/WallrateScale[*]'
    paths[63] = '/DashboardConfig/TIP/BallrateScale[*]'
    paths[64] = '/DashboardConfig/TIP/HPGerateScale[*]'
    paths[65] = '/DashboardConfig/TIP/BGOrateScale[*]'              

    //fetch:
    var data = ODBMGet(paths);
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
    if(window.parameters.TIPmode == 'Wall') window.parameters.TIP.minima.CsI = [parseFloat(data[54][0]), parseFloat(data[58][0]), parseFloat(data[62][0])];
    else if(window.parameters.TIPmode == 'Ball') window.parameters.TIP.minima.CsI = [parseFloat(data[55][0]), parseFloat(data[59][0]), parseFloat(data[63][0])];
    window.parameters.TIP.minima.HPGe = [parseFloat(data[56][0]), parseFloat(data[60][0]), parseFloat(data[64][0])];
    window.parameters.TIP.minima.BGO = [parseFloat(data[57][0]), parseFloat(data[61][0]), parseFloat(data[65][0])];
    if(window.parameters.TIPmode == 'Wall') window.parameters.TIP.maxima.CsI = [parseFloat(data[54][1]), parseFloat(data[58][1]), parseFloat(data[62][1])];
    else if(window.parameters.TIPmode == 'Ball') window.parameters.TIP.maxima.CsI = [parseFloat(data[55][1]), parseFloat(data[59][1]), parseFloat(data[63][1])];
    window.parameters.TIP.maxima.HPGe = [parseFloat(data[56][1]), parseFloat(data[60][1]), parseFloat(data[64][1])];
    window.parameters.TIP.maxima.BGO = [parseFloat(data[57][1]), parseFloat(data[61][1]), parseFloat(data[65][1])];


}










