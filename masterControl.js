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

function masterLoop(callMyself){
    var i,j;
	if(!document.webkitHidden && !document.mozHidden){

        //update all assets
    	window.waffle.update();
        window.DAQ.update();
        for(i=0; i<window.Subdetectors.length; i++)
            window.Subdetectors[i].update();

        //animate whoever is showing on top, flat draw the rest; force animate for everyone on first pass, since Google fonts don't render in canvas on the first call to draw (investigate):
        window.dashboard.animate(callMyself);
        window.waffle.animate(callMyself);
        for(i=0; i<window.waffle.barCharts.length; i++)
            window.waffle.barCharts[i].animate(callMyself);
        window.DAQ.animate(callMyself);
        window.Clock.animate(callMyself);
        window.Trigger.animate(callMyself);

        for(i=0; i<window.Subdetectors.length; i++){
            window.Subdetectors[i].animate(callMyself);
        }
    }
    
    //remove all temporary scripts from the head so they don't accrue:
    for(i=0; i<window.parameters.JSONPrepos.length; i++){
        var element = document.getElementById('tempScript'+i);
        element.parentNode.removeChild(element);
    }

    //next iteration:
    window.loop = setTimeout(function(){loadJSONP('masterLoop(1)')}, 3000);
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













