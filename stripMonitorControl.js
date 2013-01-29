function stripMasterLoop(horizSM, vertSM, nChannels, HVdata){
	if(!document.webkitHidden && !document.mozHidden){
		fetchNewSMData(nChannels, HVdata);
		horizSM.update(HVdata);
		vertSM.update(HVdata);
	}

	setTimeout(function(){stripMasterLoop(horizSM, vertSM, nChannels, HVdata)}, 2000);
}

function fetchNewSMData(nChannels, HVdata){
	var i = 0;

	//dummy data for offline dev:
	for(i=0; i<nChannels; i++){
		HVdata[i] = Math.random();
	}

}