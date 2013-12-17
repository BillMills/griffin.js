//fetch one spectrum from the server
function fetchSpectrum(name, callback){
    var script;

    //get data from server:
    script = document.createElement('script');
    script.setAttribute('src', 'http://annikal.triumf.ca:9093/?cmd=callspechandler&spectrum1='+name);
    if(callback) script.onload = callback
    script.id = 'fetchdata';

    document.head.appendChild(script);
}

//deploy a new histo to the viewer: fetch it, draw it.
function addSpectrum(name, viewer){

    //get the spectrum
    fetchSpectrum(name, function(name, viewer){
        var key;

        //one at a time in the embedded viewer
        for(key in viewer.plotBuffer)
            viewer.removeData(key);

        //append to spectrum viewer's data store:
        viewer.addData(name, spectrumBuffer[name]);

        //redraw the spectra
        viewer.plotData();
        viewer.unzoom();

        //dump the script so they don't accrue
        deleteDOM('fetchdata');

    }.bind(null, name, viewer));
    
};

//handle the server callback, currently hardcoded as callSpectrumHandler
function callSpectrumHandler(data){

    var key, response;
    
    for(key in data){
        if(data[key]){
            spectrumBuffer[key] = [];
            for(i=0; i<data[key].length; i++)
                spectrumBuffer[key][i] = data[key][i];
        }
    }  
};

//handle fetching a subsystem spectrum
function getSubsystemSpectrum(){
    var spectrumOptions = document.getElementById('subsystemSpectrumType'),
        spectrumType = spectrumOptions.options[spectrumOptions.selectedIndex].value,
        channel = document.getElementById('subsystemSpectrumName').value;

    channel = channel.slice(0,9) + channel.slice(9,10).toLowerCase();
    addSpectrum(spectrumType + channel, window.spectrumViewers.subsystem);
}

//refresh spectra that are currently available for plotting
function refreshSpectra(viewer){
    var i, key, URL = 'http://annikal.triumf.ca:9093/?cmd=callspechandler';

    i=0;
    for(key in spectrumBuffer){
        URL += '&spectrum'+i+'='+key;
        i++;
    }

    //get data from server:
    if(i!=0){
        script = document.createElement('script');
        script.setAttribute('src', URL);
        script.onload = function(){
            var key;
            //push relevant data to the viewer's buffer
            for(key in viewer.plotBuffer){
                viewer.addData(key, spectrumBuffer[key]);
            }
            //dump the script so they don't stack up:
            deleteDOM('fetchdata');

            viewer.plotData();
        };
        script.id = 'fetchdata'
        document.head.appendChild(script);
    } else
        viewer.plotData();
}
