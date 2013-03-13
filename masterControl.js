function loadJSONP(callback) {
    var i;

    for(i=0; i<window.parameters.JSONPrepos.length; i++){
        var script  = document.createElement('script');
        script.setAttribute('src', window.parameters.JSONPrepos[i]);    //fetch the ith repo
        script.setAttribute('id', 'tempScript'+i);
        if(i == window.parameters.JSONPrepos.length-1)
            script.setAttribute('onload', callback);                    //attach the callback to masterLoop to the last data store to load
        document.head.appendChild(script);
    }
}

function masterLoop(dashboard, AlarmServices, waffle, SHARC, HPGE, DESCANT, PACES, DANTE, BAMBINO, SCEPTAR, SPICE, TIP, DAQ, Clock, Trigger, callMyself){
    var i,j;
	if(!document.webkitHidden && !document.mozHidden){

        //update all assets
    	waffle.update();
        SHARC.update();
        HPGE.update();
        DESCANT.update();
        PACES.update();        
        DANTE.update();        
        BAMBINO.update();
        SCEPTAR.update();
        SPICE.update();
        TIP.update();
        DAQ.update();

        //animate whoever is showing on top, flat draw the rest; force animate for everyone on first pass, since Google fonts don't render in canvas on the first call to draw (investigate):
        if(window.onDisplay == 'DashboardCanvas' || !callMyself) animate(dashboard,0);
        else dashboard.draw(dashboard.nFrames);
        if(window.onDisplay == 'TestWaffle' || !callMyself) animate(waffle, 0);
        else waffle.draw(waffle.nFrames);
        for(i=0; i<waffle.barCharts.length; i++){
            if(window.onDisplay == waffle.barCharts[i].cvas || !callMyself) animate(waffle.barCharts[i], 0);
            else waffle.barCharts[i].draw(waffle.barCharts[i].nFrames);
        }
        if(window.onDisplay == 'SHARCCanvas' || !callMyself) animate(SHARC,0);
        else SHARC.draw(SHARC.nFrames);
        if(window.onDisplay == 'HPGECanvas' || !callMyself) animate(HPGE,0);
        else HPGE.draw(HPGE.nFrames);
        if(window.onDisplay == 'HPGEdetailCanvas' || !callMyself) animateDetail(HPGE,0);
        else HPGE.drawDetail(HPGE.detailContext, HPGE.nFrames);
        if(window.onDisplay == 'DESCANTCanvas' || !callMyself) animate(DESCANT,0);
        else DESCANT.draw(DESCANT.nFrames);
        if(window.onDisplay == 'PACESHVCanvas' || window.onDisplay == 'PACESrateCanvas' ||  !callMyself) animate(PACES,0);
        else PACES.draw(PACES.nFrames);
        if(window.onDisplay == 'DANTECanvas' || !callMyself) animate(DANTE,0);
        else DANTE.draw(DANTE.nFrames);
        if(window.onDisplay == 'BAMBINOCanvas' || !callMyself) animate(BAMBINO,0);
        else BAMBINO.draw(BAMBINO.nFrames);
        if(window.onDisplay == 'SCEPTARCanvas' || !callMyself) animate(SCEPTAR,0);
        else SCEPTAR.draw(SCEPTAR.nFrames);
        if(window.onDisplay == 'SPICECanvas' || !callMyself) animate(SPICE,0);
        else SPICE.draw(SPICE.nFrames);
        if(window.onDisplay == 'TIPCanvas' || !callMyself) animate(TIP,0);
        else TIP.draw(TIP.nFrames);
        if(window.onDisplay == 'TIPdetailCanvas' || !callMyself) animateDetail(TIP,0);
        else TIP.drawDetail(TIP.detailContext, TIP.nFrames);
        if(window.onDisplay == 'DAQcanvas' || !callMyself) animate(DAQ,0);
        else DAQ.draw(DAQ.nFrames);
        if(window.onDisplay == 'DAQdetailCanvas' || !callMyself) animateDetail(DAQ,0);
        else DAQ.drawDetail(DAQ.nFrames);
        if(window.onDisplay == 'ClockCanvas' || !callMyself) animate(Clock,0);
        else Clock.draw(Clock.nFrames);
        if(window.onDisplay == 'TriggerCanvas' || !callMyself) animate(Trigger,0);
        else Trigger.draw(Trigger.nFrames);
    }
    
    //remove all temporary scripts from the head so they don't accrue:
    for(i=0; i<window.parameters.JSONPrepos.length; i++){
        var element = document.getElementById('tempScript'+i);
        element.parentNode.removeChild(element);
    }

    //next iteration:
    window.loop = setTimeout(function(){loadJSONP('masterLoop(window.dashboard, window.AlarmServices, window.waffle, window.SHARC, window.HPGE, window.DESCANT, window.PACES, window.DANTE, window.BAMBINO, window.SCEPTAR, window.SPICE, window.TIP, window.DAQ, window.Clock, window.Trigger, 1)')}, 3000);
}

//determine what size cards are in what slot:
function detectCards(){
    var moduleSizes
    //insert ODB magic here
    moduleSizes = [0,4,0,4,0,4,0,4,0,4,0,4];
    return moduleSizes;
}

//force an immediate update, and set the master loop going again from there:
function forceUpdate(){
    clearTimeout(window.loop);
    startLoop(1);
}













