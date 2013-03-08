//Each detector will have its own data structure for ferrying information 
//from the ODB (or elsewhere) to the instance of the monitoring service
//for that detector.  Also, each detector will have a key map which matches
//monitoring service array indices to detector element name, and to ODB
//index.

HVDS = function(rows, cols){
	var i,j;
	//data arrays:
    this.demandVoltage = [];
    this.reportVoltage = [];
    this.reportCurrent = [];
    this.demandVrampUp = [];
    this.demandVrampDown = [];
    this.reportTemperature = [];
    this.channelMask = [];
    this.alarmStatus = [];
    this.rampStatus = [];
    this.voltLimit = [];
    this.currentLimit = [];
    for(i=0; i<rows; i++){
        this.demandVoltage[i] = [];
        this.reportVoltage[i] = [];
        this.reportCurrent[i] = [];
        this.demandVrampUp[i] = [];
        this.demandVrampDown[i] = [];
        this.reportTemperature[i] = [];
        this.channelMask[i] = [];
        this.alarmStatus[i] = [];
        this.rampStatus[i] = [];
        this.voltLimit[i] = [];
        this.currentLimit[i] = [];
        for(j=0;j<cols;j++){
        	this.alarmStatus[i][j] = [];
        }
    }
}

HVBarDS = function(){
    this.barChartData = [];
    this.barChartAlarms = [];
}

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
	var i,j;

	//data arrays:
	this.HV = [];
	this.thresholds = [];
	this.rate = [];

	//ODB paths & keys for each type of info:
	this.HVpath = 'some/path';
	this.thresholdsPath = 'need/a/function';
	this.ratePath = 'to/determine/these';

	//key map
	this.key = [];
	for(i=0; i<70; i++){
		this.key[i] = [];
		//generate names
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

BAMBINODS = function(mode){
	//data arrays:
	this.HV = [];
	this.thresholds = [];
	this.rate = [];

	//key map
	/*
	this.key = [];
	if(mode == 'S2'){

	} else if(mode == 'S3'){

	}
	*/
}

SCEPTARDS = function(){
	//data arrays:
	this.HV = [];
	this.thresholds = [];
	this.rate = [];

	//key map
	this.key = [];
	for(i=0; i<20; i++){
		this.key[i] = [];
		//generate names
		if(i<10)
			this.key[i][0] = 'SEP0'+i+'XN00X';
		else
			this.key[i][0] = 'SEP'+i+'XN00X';
	}	
	this.key[20] = [];
	this.key[20][0] = 'ZDS01XN00X';
}

SPICEDS = function(){
	var i;

	//data arrays:
	this.HV = [];
	this.thresholds = [];
	this.rate = [];

	//key map
	this.key = [];
	for(i=0; i<120; i++){
		this.key[i] = [];
		//generate names
		if(i<10)
			this.key[i][0] = 'SPI00XN00'+i;
		else if(i<100)
			this.key[i][0] = 'SPI00XN0'+i;
		else 
			this.key[i][0] = 'SPI00XN'+i;
	}
}

TIPDS = function(){
	var i;

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
	this.key = [];
	//CsI Wall
	for(i=0; i<24; i++){
		this.key[i] = [];
		//generate names
		if(i<10)
			this.key[i][0] = 'TPW00' +i+ 'P00X';
		else
			this.key[i][0] = 'TPW0' +i+ 'P00X';
	}
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
	/*
	//use the codex to find out what the ODB index for each name is:
	for(j=0; j<window.codex.table.length; j++){
		if(window.codex.table[j][0] == this.key[i][0]){
			this.key[i][1] = window.codex.table[j][1];
			break;
		}
	}
	*/
}