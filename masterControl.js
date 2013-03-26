function loadJSONP(callback) {
    var i;

    for(i=0; i<window.parameters.JSONPrepos.length; i++){

        var script  = document.createElement('script');
        if (window.parameters.JSONPrepos[i] != 'SERVICE DOWN') script.setAttribute('src', window.parameters.JSONPrepos[i]);    //fetch the ith repo
        script.setAttribute('id', 'tempScript'+i);

        //recover if the JSON bounces:
        script.onerror = function(){
            alert('JSONP service\n\n' + this.src + '\n\nhas dropped.  Suppressing further requests.' )
            
            //delete the failed resource from the list:
            for(var k=0; k<window.parameters.JSONPrepos.length; k++){
                if(window.parameters.JSONPrepos[k] == this.src)
                    window.parameters.JSONPrepos[k] = 'SERVICE DOWN';
            }
        }

        if(i == window.parameters.JSONPrepos.length-1)
            script.setAttribute('onload', callback);                    //attach the callback to the last data store to load

        document.head.appendChild(script);
    }
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
    window.loop = setTimeout(function(){loadJSONP('masterLoop(1)')}, 3000);
}

//determine what size cards are in what slot:
function detectCards(){
    var moduleSizes
    //insert ODB magic here
    moduleSizes = [0,4,0,4,0,4,0,4,0,4,0,4];
    //moduleSizes = [1,0,0,0,0,0];
    return moduleSizes;
}

//force an immediate update, and set the master loop going again from there:
function forceUpdate(){
    clearTimeout(window.loop);
    startLoop(1);
}













