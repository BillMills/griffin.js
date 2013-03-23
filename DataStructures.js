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
	var i, j;

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
	
	
	//key map, format: key[griffin.js index number][pointer]
	//index 0-23: CsI wall elements TPW001P00X - TPW023P00X
	//index 24-35: HPGE crystal summaries, GBWR x3
	//index 36-47: BGO summaries, GBWR x3
	//index 48-55: HPGE detail (rate view), G(a)G(b)B(a)B(b)W(a)W(b)R(a)R(b) clover 0
	//index 56-59: BGO back detail (rate view), GBRW clover 0
	//index 60-67: BGO side detail (rate view), G(a)G(b)B(a)B(b)W(a)W(b)R(a)R(b) clover 0
	//index 68-75: BGO front detail (rate view), G(a)G(b)B(a)B(b)W(a)W(b)R(a)R(b) clover 0
	//index 76-103: As 48-75, for clover 1
	//index 104-131: As 48-75, for clover 2
	//index 132-135: HPGE detail (HV), GBWR clover 0
	//index 136-143: BGO back detail (HV), G(a)G(b)B(a)B(b)W(a)W(b)R(a)R(b) clover 0
	//index 144-159: BGO side detail (HV), G(a)G(b)B(a)B(b)W(a)W(b)R(a)R(b) clover 0
	//index 160-175: BGO front detail (HV), G(a)G(b)B(a)B(b)W(a)W(b)R(a)R(b) clover 0
	//index 176-219: As 132-175, for clover 1
	//index 220-263: As 132-175, for clover 2

	//pointer == 0: Greg's name
	//pointer == 1: index in scalar rate json object
	//pointer == 2: FSCP index
	this.key = [];
	for(i=0; i<264; i++)
		this.key[i] = [];
	//generate names//////////////////////////////////////
	//CsI wall:
	this.key[0][0]  = 'TPW011P00X';
	this.key[1][0]  = 'TPW012P00X';
	this.key[2][0]  = 'TPW013P00X';
	this.key[3][0]  = 'TPW014P00X';
	this.key[4][0]  = 'TPW015P00X';
	this.key[5][0]  = 'TPW010P00X';
	this.key[6][0]  = 'TPW002P00X';
	this.key[7][0]  = 'TPW003P00X';
	this.key[8][0]  = 'TPW004P00X';
	this.key[9][0]  = 'TPW016P00X';
	this.key[10][0] = 'TPW009P00X';
	this.key[11][0] = 'TPW001P00X';
	this.key[12][0] = 'TPW005P00X';
	this.key[13][0] = 'TPW017P00X';
	this.key[14][0] = 'TPW024P00X';
	this.key[15][0] = 'TPW008P00X';
	this.key[16][0] = 'TPW007P00X';
	this.key[17][0] = 'TPW006P00X';
	this.key[18][0] = 'TPW018P00X';
	this.key[19][0] = 'TPW023P00X';
	this.key[20][0] = 'TPW022P00X';
	this.key[21][0] = 'TPW021P00X';
	this.key[22][0] = 'TPW020P00X';
	this.key[23][0] = 'TPW019P00X';		

	//HPGE + BGO summaries: todo
	//HPGE + BGO rate detail:
	var color = ['G', 'B', 'W', 'R'];
	var half = ['A', 'B'];
	var chIndex;
	for(j=0; j<3; j++){
		//HPGE
		for(i=0; i<8; i++){
			chIndex = 48+28*j+i;
			this.key[chIndex][0] = 'GRG0'+ (j+1) + color[Math.floor(i/2)] + 'N00' + half[i%2];
		}
		//BGO
		for(i=0; i<20; i++){
			chIndex = 56+28*j+i;
			if(i<4) this.key[chIndex][0] = 'GRS0' + (j+1) + color[i] + 'XXXX'
			else this.key[chIndex][0] = 'GRS0' + (j+1) + color[Math.floor((i-4)/2)%4] + 'XXXX'
		}

	}
	//HPGE + BGO HV detail: todo

	//figure out where this name is sitting in the JSON scalar rate array and in the FSCP table

	for(i=0; i<this.key.length; i++){
		this.key[i][1] = -1;
		this.key[i][2] = -1;
		if(window.JSONPstore['scalar']){
	        for(j=0; j<window.JSONPstore['scalar'].length; j++){
    	        if(window.JSONPstore['scalar'][j].fName == this.key[i][0])
        	      	this.key[i][1] = j;
        	}
        }
        if(window.JSONPstore['parameters']){
	        for(j=0; j<window.codex.Name.length; j++){
    	    	if(window.codex.Name[j] == this.key[i][0])
        			this.key[i][2] = j;
        	}
        }

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
