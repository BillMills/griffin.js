//Each detector will have its own data structure for ferrying information 
//from the ODB (or elsewhere) to the instance of the monitoring service
//for that detector.  Also, each detector will have a key map which matches
//monitoring service array indices to detector element name, and to ODB
//index.

HVDS = function(rows, cols){
	var i,j;
	//data arrays:
	this.channelName = [];
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
    	this.channelName[i] = [];
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
        	this.alarmStatus[i][j] = [0,0,0];
        }
    }
}

HVBarDS = function(){
    this.barChartData = [];
    this.barChartAlarms = [];
}

function cloverDS(nClovers, mode){
	var i, j, k;

	this.colorQuads = ['G', 'B', 'W', 'R'];
	var pfx = (mode == 'TIGRESS') ? 'TI' : 'GR';
	this.HPGe = {};
	for(i=1; i<1+nClovers; i++){
		//loop over quadrants
		for(j=0; j<4; j++){
			this.HPGe[pfx+'G'+( (i<10) ? '0'+i : i)+this.colorQuads[j]+'N00A'] = {
				'HV'		: 0,		//note both A and B carry the same HV for GRIFFIN style HPGe
				'threshold' : 0,
				'rate'		: 0,
				'index'     : ((mode== 'TIGRESS')? 10:2)*j+((mode== 'TIGRESS')? 60:30)*(i-1),

				'oldHVcolor' : '#000000',
				'HVcolor'	 : '#000000',
				'oldThresholdColor' : '#000000',
				'thresholdColor' : '#000000',
				'oldRateColor' : '#000000',
				'rateColor' : '#000000'				
			}
			this.HPGe[pfx+'G'+( (i<10) ? '0'+i : i)+this.colorQuads[j]+'N00B'] = {
				'HV'		: 0,		//note both A and B carry the same HV for GRIFFIN style HPGe
				'threshold' : 0,
				'rate'		: 0,
				'index'		: ((mode== 'TIGRESS')? 10:2)*j+1+((mode== 'TIGRESS')? 60:30)*(i-1),

				'oldHVcolor' : '#000000',
				'HVcolor'	 : '#000000',
				'oldThresholdColor' : '#000000',
				'thresholdColor' : '#000000',
				'oldRateColor' : '#000000',
				'rateColor' : '#000000'				
			}

			if(mode == 'TIGRESS'){
				for(k=1; k<9; k++){
					this.HPGe['TIG'+( (i<10) ? '0'+i : i)+this.colorQuads[j]+'P0'+k+'X'] = {
						'HV'		: 0,
						'threshold' : 0,
						'rate'		: 0,
						'index'     : 10*j+1+k + 60*(i-1),

						'oldHVcolor' : '#000000',
						'HVcolor'	 : '#000000',
						'oldThresholdColor' : '#000000',
						'thresholdColor' : '#000000',
						'oldRateColor' : '#000000',
						'rateColor' : '#000000'							
					}
				}
			}
		}

		//BGO channels
		var ID;
		//loop over quadrants
		for(j=0; j<4; j++){
			//five BGO segments in each quadrant: front, front, side, side, back
			for(k=1; k<6; k++){
				if(k==1) ID = ((mode== 'TIGRESS')? 53:21)+2*j;	//front suppressors
				if(k==2) ID = ((mode== 'TIGRESS')? 52:20)+2*j;
				if(k==3) ID = ((mode== 'TIGRESS')? 45:13)+2*j;	//side suppressors
				if(k==4) ID = ((mode== 'TIGRESS')? 44:12)+2*j;
				if(k==5) ID = ((mode== 'TIGRESS')? 40:8)+j; 		//back suppressors
				this.HPGe[pfx+'S'+( (i<10) ? '0'+i : i)+this.colorQuads[j]+'N0'+k+'X'] = {
				'HVA'		: 0,		//each rate channel has two HV hookups.
				'HVB'		: 0,
				'threshold' : 0,
				'rate'		: 0,
				'index'		: ID+((mode== 'TIGRESS')? 60:30)*(i-1),

				'oldHVAcolor' : '#000000',
				'HVAcolor'	 : '#000000',
				'oldHVBcolor' : '#000000',
				'HVBcolor'	 : '#000000',				
				'oldThresholdColor' : '#000000',
				'thresholdColor' : '#000000',
				'oldRateColor' : '#000000',
				'rateColor' : '#000000'					
				}
			}
		}

	}

	//invert the index map for the TT:
	this.HPGeTTmap = [];
	for(key in this.HPGe){
		this.HPGeTTmap[this.HPGe[key].index] = key;
	}

	this.summary = {};
	for(i=1; i<1+nClovers; i++){
		//HPGe summaries
		for(j=0; j<4; j++){
			this.summary[pfx+'G'+( (i<10) ? '0'+i : i)+this.colorQuads[j]] = {
				'clover' : i,
				'quadrant' : j,

				'HV'		: 0,
				'threshold' : 0,
				'rate'		: 0,

				'oldHVcolor' : '#000000',
				'HVcolor'	 : '#000000',
				'oldThresholdColor' : '#000000',
				'thresholdColor' : '#000000',
				'oldRateColor' : '#000000',
				'rateColor' : '#000000'					
			}
		}

		//BGO summaries
		for(j=0; j<4; j++){
			this.summary[pfx+'S'+( (i<10) ? '0'+i : i)+this.colorQuads[j]] = {
				'clover' : i,
				'quadrant' : j,

				'HV'		: 0,
				'threshold' : 0,
				'rate'		: 0,

				'oldHVcolor' : '#000000',
				'HVcolor'	 : '#000000',
				'oldThresholdColor' : '#000000',
				'thresholdColor' : '#000000',
				'oldRateColor' : '#000000',
				'rateColor' : '#000000'					
			}			
		}
	}
}

SHARCDS = function(){
	//data arrays:
	this.HV = [];
	this.thresholds = [];
	this.rate = [];

	//key map
	//todo
}

DESCANTDS = function(){

	var i, name;

	this.DESCANT = {};
	this.TTmap = [];
	for(i=1; i<71; i++){
		var name = (i<10) ? 'DSC00'+i+'P00X' : 'DSC0'+i+'P00X';
		this.DESCANT[name] = {
			'HV'		: 0,
			'threshold' : 0,
			'rate' 		: 0,
			'index'		: i,

			'oldHVcolor' : '#000000',
			'HVcolor'	 : '#000000',
			'oldThresholdColor' : '#000000',
			'thresholdColor' : '#000000',
			'oldRateColor' : '#000000',
			'rateColor' : '#000000'	
		}
		this.TTmap[i] = name;
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

DSSDDS = function(){

	var i, j, name, layer, charge, 
	index = 0,
	prefix = 'MAD',
	layers = ['D', 'E', 'F'],
	charges = ['N', 'P'];

	this.DSSD = {};
	this.TTmap = [];
	
	for(i=0; i<7; i++){
		for(layer=0; layer<3; layer++){
			for(charge=0; charge<2; charge++){
				for(j=0; j<16; j++){
					name = prefix + ((i<10) ? '0'+i : i) + layers[layer] + charges[charge] + ((j<10) ? '0'+j : j) + 'X';
					this.DSSD[name] = {
						'HV'		: 0,
						'threshold' : 0,
						'rate' 		: 0,
						'index'		: index,

						'oldHVcolor' : '#000000',
						'HVcolor'	 : '#000000',
						'oldThresholdColor' : '#000000',
						'thresholdColor' : '#000000',
						'oldRateColor' : '#000000',
						'rateColor' : '#000000'	
					}
					this.TTmap[index] = name;
					index++;
				}
			}
		}
	}
	
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
	var i, j, k, name, key, subKey;

	this.CsIwall = {};
	for(i=1; i<25; i++){
		var name = (i<10) ? 'TPW00'+i+'P00X' : 'TPW0'+i+'P00X';
		this.CsIwall[name] = {
			'HV'		: 0.3,
			'threshold' : 500,
			'rate' 		: 100*i,

			'oldHVcolor' : '#000000',
			'HVcolor'	 : '#000000',
			'oldThresholdColor' : '#000000',
			'thresholdColor' : '#000000',
			'oldRateColor' : '#000000',
			'rateColor' : '#000000'	
		}
	}
	this.CsIwall['TPW011P00X']['index'] = 0;
	this.CsIwall['TPW012P00X']['index'] = 1;
	this.CsIwall['TPW013P00X']['index'] = 2;
	this.CsIwall['TPW014P00X']['index'] = 3;
	this.CsIwall['TPW015P00X']['index'] = 4;
	this.CsIwall['TPW010P00X']['index'] = 5;
	this.CsIwall['TPW002P00X']['index'] = 6;
	this.CsIwall['TPW003P00X']['index'] = 7;
	this.CsIwall['TPW004P00X']['index'] = 8;
	this.CsIwall['TPW016P00X']['index'] = 9;
	this.CsIwall['TPW009P00X']['index'] = 10;
	this.CsIwall['TPW001P00X']['index'] = 11;
	this.CsIwall['TPW005P00X']['index'] = 12;
	this.CsIwall['TPW017P00X']['index'] = 13;
	this.CsIwall['TPW024P00X']['index'] = 14;
	this.CsIwall['TPW008P00X']['index'] = 15;
	this.CsIwall['TPW007P00X']['index'] = 16;
	this.CsIwall['TPW006P00X']['index'] = 17;
	this.CsIwall['TPW018P00X']['index'] = 18;
	this.CsIwall['TPW023P00X']['index'] = 19;
	this.CsIwall['TPW022P00X']['index'] = 20;
	this.CsIwall['TPW021P00X']['index'] = 21;
	this.CsIwall['TPW020P00X']['index'] = 22;
	this.CsIwall['TPW019P00X']['index'] = 23;

	//invert the above index map for TT lookup
	this.CsIwallTTmap = []
	for(key in this.CsIwall){
		this.CsIwallTTmap[this.CsIwall[key].index] = key;
	}

	cloverDS.call(this, 3, 'GRIFFIN');

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

    //master
    this.masterColor = '#000000';
    this.oldMasterColor = '#000000';
    //master group links
    this.masterGroupColor = [];
    this.oldMasterGroupColor = [];
    //links from collectors to master
    this.masterLinkColor = [];
    this.oldMasterLinkColor = [];
    //collectors; different colors for top level view and detail view:
    this.collectorColor = [];
    this.oldCollectorColor = [];
    this.detailCollectorColor = [];
    this.oldDetailCollectorColor = [];
    //links from digitizer summary node to collector in top level view, and from all digitizers to collector in detail view
    this.collectorLinkColor = [];
    this.oldCollectorLinkColor = [];
    this.detailCollectorLinkColor = [];
    this.oldDetailCollectorLinkColor = [];
    //digitizer summary node
    this.digiSummaryColor = [];
    this.oldDigiSummaryColor = [];
    //links from digitizer group to digitizer summary node
    this.digiGroupSummaryColor = [];
    this.oldDigiGroupSummaryColor = [];
    //links from digitizers to digitizer group
    this.digitizerLinkColor = [];
    this.oldDigitizerLinkColor = [];
    //digitizers
    this.digitizerColor = [];
    this.oldDigitizerColor = [];

    for(i=0; i<Math.ceil(window.DAQpointer.nCollectors/4); i++){
        this.masterGroupColor[i] = '#000000';
        this.oldMasterGroupColor[i] = '#000000';        
    }
    for(i=0; i<4*Math.ceil(window.DAQpointer.nCollectors/4); i++){
        this.masterLinkColor[i] = '#000000';
        this.oldMasterLinkColor[i] = '#000000';
        this.collectorColor[i] = '#000000';
        this.oldCollectorColor[i] = '#000000';
        this.detailCollectorColor[i] = '#000000';
        this.oldDetailCollectorColor[i] = '#000000';
        this.collectorLinkColor[i] = '#000000';
        this.oldCollectorLinkColor[i] = '#000000';
        this.detailCollectorLinkColor[i] = '#000000';
        this.oldDetailCollectorLinkColor[i] = '#000000';
        this.digiSummaryColor[i] = '#000000';
        this.oldDigiSummaryColor[i] = '#000000';        
    }
    for(i=0; i<4*4*Math.ceil(window.DAQpointer.nCollectors/4); i++){
        this.digiGroupSummaryColor[i] = '#000000';
        this.oldDigiGroupSummaryColor[i] = '#000000';        
    }
    for(i=0; i<4*4*4*Math.ceil(window.DAQpointer.nCollectors/4); i++){
        this.digitizerLinkColor[i] = '#000000';
        this.oldDigitizerLinkColor[i] = '#000000';
        this.digitizerColor[i] = '#000000';
        this.oldDigitizerColor[i] = '#000000';        
    }

	/*
	key map, format: key[griffin.js index number] = array containing parsed FSPC keys from masterCodex for this node, down to digitizer level

	FSPC key array packed like [master key, collector key, digitizer key];
	note that the master node only has a master key, collector nodes only have master + collector keys etc, so length of array
	corresponds to type of node.  Example: FSPC = 0x0700604 -> ['0x0XXXXXX', '0x07XXXXX', '0x07006XX']

	griffin.js index counts from 0: first master -> collectors -> digitizer summary nodes -> digitizers, next master... etc 
	*/

	this.key = [];
	var Fkey, Skey, Pkey, Ckey;
	var i = 0;
	var j = 0;
	var k = 0;
	for(Fkey in window.codex.DAQmap){
		this.key[i] = [Fkey];
		i++;
		for(Skey in window.codex.DAQmap[Fkey]){
			if(window.codex.dataKeys.indexOf(Skey) == -1){
				this.key[i] = [Fkey, Skey];
				i++;
				j++;
			}
		}

		for(k=0; k<j; k++){
			this.key[i+k] = this.key[1+k];
		}
		i += j //leave an index for a summary node to go with each collector node
		j = 0;


		//now count through digitizers, starting with the first collector:
		for(Skey in window.codex.DAQmap[Fkey]){
			if(window.codex.dataKeys.indexOf(Skey) == -1){
				for(Pkey in window.codex.DAQmap[Fkey][Skey]){
					if(window.codex.dataKeys.indexOf(Pkey) == -1){
						this.key[i] = [Fkey, Skey, Pkey];
						i++;
					}
				}
			}
		}
	}

}



















