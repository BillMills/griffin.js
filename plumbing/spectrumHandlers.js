//top-level function to handle fetching a subsystem spectrum
function getSubsystemSpectrum(channel){
    var spectrumOptions = document.getElementById('subsystemSpectrumType'),
        spectrumType = spectrumOptions.options[spectrumOptions.selectedIndex].value,
        spectrumName = channel;

    //if nothing provided, just redo whatever's in there now; there should only ever be one.
    if(!channel)
        spectrumName = Object.keys(window.spectrumViewers.subsystem.plotBuffer)[0].slice(1,11);

    //don't flip out if nothing's been plotted or requested yet:
    if(!spectrumName)
        return;

    //make the last character case insensitive
    spectrumName = spectrumName.slice(0,9) + spectrumName.slice(9,10).toLowerCase();

    addSpectrum(spectrumType + spectrumName, window.spectrumViewers.subsystem);
};

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

//fetch one spectrum from the server
function fetchSpectrum(name, callback){
    var script;

    //get data from server:
    script = document.createElement('script');
    script.setAttribute('src', 'http://annikal.triumf.ca:9093/?cmd=callspechandler&spectrum1='+name);
    if(callback) script.onload = callback
    script.id = 'fetchdata';

    document.head.appendChild(script);
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
};

//inject subsystem spectrum viewer assets
function establishSubsystemSpectrumViewerUI(){
    injectDOM('form', 'subsystemSpectrumControl', 'SubsystemSidebar', {'style':'display:none'});

    injectDOM('div', 'subsystemSpectrumTypeWrapper', 'SubsystemSidebar', {});
    injectDOM('label', 'subsystemSpectrumTypeLabel', 'subsystemSpectrumTypeWrapper', {'innerHTML':'Plot: ', 'for':'subsystemSpectrumType'})
    injectDOM('select', 'subsystemSpectrumType', 'subsystemSpectrumTypeWrapper', {'class':'subsystemSpectrumTypeDD'});
    injectDOM('option', 'subsystemEnergyPlot', 'subsystemSpectrumType', {'value':'E', 'innerHTML':'Energy'});
    //injectDOM('option', 'subsystemCFDPlot', 'subsystemSpectrumType', {'value':'C', 'innerHTML':'CFD Time'});
    injectDOM('option', 'subsystemWaveformPlot', 'subsystemSpectrumType', {'value':'W', 'innerHTML':'Waveform'});
    document.getElementById('subsystemSpectrumType').onchange = function(event){getSubsystemSpectrum();};
    document.getElementById('SubsystemSidebar').insertBefore(document.getElementById('subsystemSpectrumTypeWrapper'), document.getElementById('subsystemSpectrumViewer'));

    injectDOM('button', 'unzoomSubsystemSpectrum', 'SubsystemSidebar', {'onclick':window.spectrumViewers.subsystem.canvas.ondblclick, 'innerHTML':'Unzoom', 'class':'navLink', 'style':'float:left; margin-bottom:0.5em;'});
    injectDOM('label', 'subsystemSpectrumLinear', 'SubsystemSidebar', {'innerHTML':'Linear', 'style':'padding:0.5em; float:left; margin-left:1em; margin-right:-1em; margin-bottom:0.5em;'});
    toggleSwitch('SubsystemSidebar', 'toggleSubsystemSpectrumScale', '', '', '', window.spectrumViewers.subsystem.setAxisType.bind(window.spectrumViewers.subsystem, 'log'), window.spectrumViewers.subsystem.setAxisType.bind(window.spectrumViewers.subsystem, 'linear'), 0);
    injectDOM('label', 'subsystemSpectrumLog', 'SubsystemSidebar', {'innerHTML':'Log', 'style':'padding:0.5em; float:left; margin-right:1em; margin-left:-1em; margin-bottom:0.5em;'});
    injectDOM('div', 'subsystemRefreshWrap', 'SubsystemSidebar', {'style':'float:left; white-space:nowrap; margin-bottom:0.5em;'})
    injectDOM('label', 'subsystemSpectrumRefreshLabel', 'subsystemRefreshWrap', {'innerHTML':'Refresh Every: ', 'style':'clear:left; margin-left:2px;'});
    injectDOM('input', 'subsystemSpectrumRefresh', 'subsystemRefreshWrap', {
                                                                        'type':'number', 
                                                                        'min':0, 
                                                                        'value':'10', 
                                                                        'form':document.getElementById('subsystemSpectrumControl')
                                                                      });
    document.getElementById('subsystemSpectrumRefresh').onchange = function(){
    clearInterval(window.subsystemsSpectrumRefresh);
    window.subsystemsSpectrumRefresh = setInterval(refreshSpectra.bind(null, window.spectrumViewers.subsystem), parseInt(this.value,10)*1000 );              
    };
    injectDOM('label', 'subsystemSpectrumRefreshUnit', 'subsystemRefreshWrap', {'innerHTML':' s'});
    //refresh the spectrum every n seconds:
    window.subsystemsSpectrumRefresh = setInterval(refreshSpectra.bind(null, window.spectrumViewers.subsystem), 10000);

    injectDOM('button', 'subsystemSpectrumRefreshNow', 'subsystemRefreshWrap', {
                                                                            'innerHTML':'Refresh Now', 
                                                                            'class':'navLink', 
                                                                            'style':'float:left; margin-left:1em',
                                                                            'onclick': refreshSpectra.bind(null, window.spectrumViewers.subsystem)
                                                                          });
    injectDOM('button', 'fullSpectrumViewer', 'SubsystemSidebar', {
                                                                            'innerHTML':'Launch Full Spectrum Viewer', 
                                                                            'class':'navLink', 
                                                                            'style':'float:left; margin-bottom:0.5em;',
                                                                            'onclick': function(){
                                                                                //if(Object.keys(window.spectrumViewers.subsystem.plotBuffer)[0]) 
                                                                                    window.open('http://trshare.triumf.ca/~wjmills/spectrumViewer/?spectrum='+Object.keys(window.spectrumViewers.subsystem.plotBuffer)[0], '_blank')
                                                                            }
                                                                          });  
}
