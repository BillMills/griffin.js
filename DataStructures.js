//Each detector will have its own data structure for ferrying information 
//from the ODB (or elsewhere) to the instance of the monitoring service
//for that detector.  Also, each detector will have a key map which matches
//monitoring service array indices to detector element name, and to ODB
//index.

SHARCDS = function(){
	//data arrays:
	this.HV = [];
	this.thresholds = [];
	this.rate = [];

	//key map
	//todo
}

HPGEDS = function(){
	//data arrays:
	this.summaryHPGEHV = [];
	this.summaryHPGEthreshold = [];
	this.summaryHPGErate = [];
	this.summaryBGOHV = [];
	this.summaryBGOthreshold = [];
	this.summaryBGOrate = [];

	this.detailHPGEHV = [];
	this.detailHPGEthreshold = [];
	this.detailHPGErate = [];
	this.detailBGOHV = [];
	this.detailBGOthreshold = [];
	this.detailBGOrate = [];

	//key map
	//todo

}

DESCANTDS = function(){
	var i = 0;

	//data arrays:
	this.HV = [];
	this.thresholds = [];
	this.rate = [];

	//key map
	this.key = [];
	for(i=0; i<70; i++){
		this.key[i] = [];
		if(i<10)
			this.key[i][0] = 'DSC0' +i+ 'XN00X';
		else
			this.key[i][0] = 'DSC' +i+ 'XN00X';
	}
}

PACESDS = function(){
	//data arrays:
	this.HV = [];
	this.thresholds = [];
	this.rate = [];

	//key map
	//todo
}

DANTEDS = function(){
	//data arrays:
	this.HV = [];
	this.thresholds = [];
	this.rate = [];

	//key map
	//todo
}

BAMBINODS = function(){
	//data arrays:
	this.HV = [];
	this.thresholds = [];
	this.rate = [];

	//key map
	//todo
}

SCEPTARDS = function(){
	//data arrays:
	this.HV = [];
	this.thresholds = [];
	this.rate = [];

	//key map
	//todo
}

SPICEDS = function(){
	//data arrays:
	this.HV = [];
	this.thresholds = [];
	this.rate = [];

	//key map
	//todo
}

TIPDS = function(){
	//data arrays:
	this.CsIHV = [];
	this.CsIthresholds = [];
	this.CsIrate = [];

	this.summaryHPGEHV = [];
	this.summaryHPGEthreshold = [];
	this.summaryHPGErate = [];
	this.summaryBGOHV = [];
	this.summaryBGOthreshold = [];
	this.summaryBGOrate = [];

	this.detailHPGEHV = [];
	this.detailHPGEthreshold = [];
	this.detailHPGErate = [];
	this.detailBGOHV = [];
	this.detailBGOthreshold = [];
	this.detailBGOrate = [];
	
	//key map
	//todo
}

DAQDS = function(){
	//data arrays:
	this.master = [];
	this.collectorGroups = [];
	this.collectorLinks = [];
	this.collectors = [];
	this.digitizerGroupSummaryLinks = [];
	this.digitizerSummaries = [];
	this.digitizerGroupLinks = [];
	this.digitizerLinks = [];
	this.digitizers = [];


	//key map
	//todo
}