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













