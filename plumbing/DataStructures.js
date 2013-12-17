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
	this.totalRate = 0;
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
				'HVA'		: 0xDEADBEEF,		//each rate channel has two HV hookups.
				'HVB'		: 0xDEADBEEF,
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

SHARCDS = function(padsEnabled){
	var i, j, name,
	that = this;
	this.SHARC = {};
	this.TTmap = [];
	this.summary = {};
	this.totalRate = 0;
	//SHARC detail level index logic: hundreds correspond to Array Position, ones and tens count through Segments front to back to pads. 
	//boxes:
	for(i=5; i<13; i++){
		//fronts:
		for(j=0; j<24; j++){
			name = 'SHB' + ( (i<10) ? '0'+i : i ) + 'DP' + ( (j<10) ? '0'+j : j ) + 'X';
			deployKeys('SHARC', name, 100*i + j);
		}
		//backs:
		for(j=0; j<48; j++){
			name = 'SHB' + ( (i<10) ? '0'+i : i ) + 'DN' + ( (j<10) ? '0'+j : j ) + 'X';
			deployKeys('SHARC', name, 100*i + 24 + j);
		}		
		//pads
		for(j=1; j<2; j++){ //only fronts actually instrumented?
			name = 'SHB' + ( (i<10) ? '0'+i : i ) + 'E' + ( (j==0) ? 'N' : 'P' ) + '00X';
			deployKeys('SHARC', name, 100*i+72 + j);
			deployKeys('summary', name, 10*i+8 + j); //summary level, see below
		}
	}

	//quadrants:
	for(i=1; i<5; i++){
		//fronts:
		for(j=0; j<16; j++){
			name = 'SHQ' + '0'+i + 'DP' + ( (j<10) ? '0'+j : j ) + 'X';  //upstream
			deployKeys('SHARC', name, 100*i + j);
			name = 'SHQ' + (i+12) + 'DP' + ( (j<10) ? '0'+j : j ) + 'X';  //downstream
			deployKeys('SHARC', name, 100*(i+12) + j);
		}
		//backs:
		for(j=0; j<24; j++){
			name = 'SHQ' + '0'+i + 'DN' + ( (j<10) ? '0'+j : j ) + 'X'; //upstream
			deployKeys('SHARC', name, 100*i + 16 + j);
			name = 'SHQ' + (i+12) + 'DN' + ( (j<10) ? '0'+j : j ) + 'X'; //downstream
			deployKeys('SHARC', name, 100*(i+12) + 16 + j);
		}
		//pads
		for(j=1; j<2; j++){  //only fronts actually instrumented?
			name = 'SHQ0' + i + 'E' + ( (j==0) ? 'N' : 'P' ) + '00X';
			deployKeys('SHARC', name, 100*i+40 + j);
			deployKeys('summary', name, 10*i+8 + j);
			name = 'SHQ' + (i+12) + 'E' + ( (j==0) ? 'N' : 'P' ) + '00X';
			deployKeys('SHARC', name, 100*(i+12)+40 + j);
			deployKeys('summary', name, 10*(i+12)+8 + j);
		}


	}

	//invert the index map for the TT:
	for(key in this.SHARC){
		this.TTmap[this.SHARC[key].index] = key;
	}

	//sumaries - split each detector into 4 groups of segments:
	//SHARC summary level index logic: index = 10*(Array Position) + { (Front Q1->Q4, Back Q1->Q4, front pad, back pad) -> [0,9] }
	//boxes:
	for(i=5; i<13; i++){
		//fronts:
		for(j=0; j<4; j++){
			name = 'SHB' + ( (i<10) ? '0'+i : i ) + 'DP' + j;
			deployKeys('summary', name, 10*i + j);
		}
		//backs:
		for(j=0; j<4; j++){
			name = 'SHB' + ( (i<10) ? '0'+i : i ) + 'DN' + j;
			deployKeys('summary', name, 10*i + 4 + j);
		}		
	}

	//quadrants:
	for(i=1; i<5; i++){
		//fronts:
		for(j=0; j<4; j++){
			name = 'SHQ' + '0'+i + 'DP' + j;  //upstream
			deployKeys('summary', name, 10*i + j);
			name = 'SHQ' + (i+12) + 'DP' + j;  //downstream
			deployKeys('summary', name, 10*(i+12) + j);
		}
		//backs:
		for(j=0; j<4; j++){
			name = 'SHQ' + '0'+i + 'DN' + j; //upstream
			deployKeys('summary', name, 10*i + 4 + j);
			name = 'SHQ' + (i+12) + 'DN' + j; //downstream
			deployKeys('summary', name, 10*(i+12) + 4 + j);
		}
	}
 
	function deployKeys(object, name, index){
		that[object][name] = {
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
		that.TTmap[index] = name;		
	};
}

DESCANTDS = function(){
	var i, name;

	this.DESCANT = {};
	this.TTmap = [];
	this.totalRate = 0;
	for(i=1; i<71; i++){
		name = (i<10) ? 'DSC0'+i+'XN00X' : 'DSC'+i+'XN00X';
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
	var i, name;

	this.PACES = {};
	this.TTmap = [];
	this.totalRate = 0;
	for(i=1; i<6; i++){
		name = 'PAC0'+i+'XN00A';
		this.PACES[name] = {
			'HV'		: 0,
			'threshold' : 0,
			'rate' 		: 0,
			'index'		: 2*i-1,

			'oldHVcolor' : '#000000',
			'HVcolor'	 : '#000000',
			'oldThresholdColor' : '#000000',
			'thresholdColor' : '#000000',
			'oldRateColor' : '#000000',
			'rateColor' : '#000000'	
		}
		this.TTmap[2*i-1] = name;

		name = 'PAC0'+i+'XN00B';
		this.PACES[name] = {
			'HV'		: 0,
			'threshold' : 0,
			'rate' 		: 0,
			'index'		: 2*i,

			'oldHVcolor' : '#000000',
			'HVcolor'	 : '#000000',
			'oldThresholdColor' : '#000000',
			'thresholdColor' : '#000000',
			'oldRateColor' : '#000000',
			'rateColor' : '#000000'	
		}
		this.TTmap[2*i] = name;
	}
}

DANTEDS = function(){
	var i, name;

	this.DANTE = {};
	this.TTmap = [];
	this.totalRate = 0;
	for(i=1; i<11; i++){
		//LaBr PMT channels
		name = (i<10) ? 'DAL0'+i+'XN00X' : 'DAL'+i+'XN00X';
		this.DANTE[name] = {
			'HV'		: 0,
			'threshold' : 0,
			'rate' 		: 0,
			'index'		: i,

			'oldHVcolor' : '#000000',
			'HVcolor'	 : '#000000',
			'oldThresholdColor' : '#000000',
			'thresholdColor' : '#000000',
			'oldRateColor' : '#000000',
			'rateColor' : '#000000',
		}

		//LaBr TAC channels
		name = (i<10) ? 'DAL0'+i+'XT00X' : 'DAL'+i+'XT00X';
		this.DANTE[name] = {
			'HV'		: 0,
			'threshold' : 0,
			'rate' 		: 0,
			'index'		: i+10,

			'oldHVcolor' : '#000000',
			'HVcolor'	 : '#000000',
			'oldThresholdColor' : '#000000',
			'thresholdColor' : '#000000',
			'oldRateColor' : '#000000',
			'rateColor' : '#000000',
		}

		//Suppressors:
		name = (i<10) ? 'DAS0'+i+'XN00X' : 'DAS'+i+'XN00X';
		this.DANTE[name] = {
			'HV'		: 0,
			'threshold' : 0,
			'rate' 		: 0,
			'index'		: i+20,

			'oldHVcolor' : '#000000',
			'HVcolor'	 : '#000000',
			'oldThresholdColor' : '#000000',
			'thresholdColor' : '#000000',
			'oldRateColor' : '#000000',
			'rateColor' : '#000000',
		}
	}

	for(name in this.DANTE){
		if(this.DANTE.hasOwnProperty(name)){
			this.TTmap[this.DANTE[name].index] = name;
		}
	}
}

DSSDDS = function(){

	var i, j, name, layer, charge, 
	index = 0,
	prefix = 'MAD',
	layers = ['D', 'E'],
	charges = ['N', 'P'];

	this.DSSD = {};
	this.TTmap = [];
	
	//quick hack only supports what's getting used in Madrid experiment May/June 2013 - last time this will ever be used?
	for(i=1; i<5; i++){
		for(layer=0; layer<2; layer++){
			for(charge=0; charge<2; charge++){
				for(j=0; j<16; j++){
					if( !(layer==1 && (i==1 || i==2 || i==3)) ){
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

	//pads:
	var padID = ['MAD01ENXXX', 'MAD02ENXXX', 'MAD03ENXXX'];
	for(i=0; i<3; i++){
						this.DSSD[padID[i]] = {
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
						this.TTmap[index] = padID[i];
						index++;
	}
	
}

BAMBINODS = function(mode, layers, spiceMode){
	var i, j, k, index=0, name, prefix, arrayPosition;
	if(spiceMode)
		prefix = ((mode=='S2') ? 'SPZ0' : 'SPE0');
	else
		prefix = ((mode=='S2') ? 'BAZ0' : 'BAE0');
	this.waypoints = ['D', 'E'];  //note tooltip indices only support two layers in S3 mode

	this.BAMBINO = {};
	this.TTmap = [];
	this.totalRate = 0;
	for(i=1; i<3; i++){  //1 for upstream, 2 for downstream, 0 for SPICE.
		arrayPosition = (spiceMode) ? 0 : i;
		for(j=0; j<layers; j++){ //telescope layers
			for(k=0; k<24+( (mode=='S2') ? 16 : 32 ); k++ ){  //segments, 16 azimuthal in S2 mode, 32 in S3
				name = prefix + arrayPosition + this.waypoints[j] + ( (k<24) ? 'P'+( (k<10) ? '0'+k : k ) : 'N' + ( (k-24<10) ? '0'+(k-24) : k-24 ) ) + 'X';
				this.BAMBINO[name] = {
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

SCEPTARDS = function(config){
	var i, name;

	this.SCEPTAR = {};
	this.TTmap = [];
	this.totalRate = 0;
	//upstream SCEPTAR
	if(config[0]){
		for(i=1; i<11; i++){
			name = (i<10) ? 'SEP0'+i+'XN00X' : 'SEP'+i+'XN00X';
			this.SCEPTAR[name] = {
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

	//downstream SCEPTAR
	if(config[1]){
		for(i=11; i<21; i++){
			name = 'SEP'+i+'XN00X';
			this.SCEPTAR[name] = {
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
/* not sure what I was thinking here
	//ZDS:
	if(config[2]){
		this.SCEPTAR['ZDS01XN00X'] = {
			'HV'		: 0,
			'threshold' : 0,
			'rate' 		: 0,
			'index'		: 21,

			'oldHVcolor' : '#000000',
			'HVcolor'	 : '#000000',
			'oldThresholdColor' : '#000000',
			'thresholdColor' : '#000000',
			'oldRateColor' : '#000000',
			'rateColor' : '#000000'		
		}
		this.TTmap[21] = 'ZDS01XN00X';
	}
*/
}

ZDSDS = function(){
	this.ZDS = {};
	this.TTmap = [];
	this.ZDS['ZDS01XN00X'] = {
		'HV'		: 0,
		'threshold' : 0,
		'rate' 		: 0,
		'index'		: 0,

		'oldHVcolor' : '#000000',
		'HVcolor'	 : '#000000',
		'oldThresholdColor' : '#000000',
		'thresholdColor' : '#000000',
		'oldRateColor' : '#000000',
		'rateColor' : '#000000'		
	}
	this.TTmap[0] = 'ZDS01XN00X';
}

SPICEDS = function(){
	var i, name;

	this.SPICE = {};
	this.TTmap = [];
	this.totalRate = 0;
	for(i=0; i<120; i++){
		name = 'SPI00XN';
		if(i<10) name += '00'+i;
		else if(i<100) name += '0'+i;
		else name += i;
		this.SPICE[name] = {
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

TIPwallDS = function(){
	var i, j, k, name, key, subKey;

	this.TIPwall = {};
	this.totalRate = 0;
	for(i=1; i<25; i++){
		var name = (i<10) ? 'TPW00'+i+'P00X' : 'TPW0'+i+'P00X';
		this.TIPwall[name] = {
			'HV'		: 0,
			'threshold' : 0,
			'rate' 		: 0,

			'oldHVcolor' : '#000000',
			'HVcolor'	 : '#000000',
			'oldThresholdColor' : '#000000',
			'thresholdColor' : '#000000',
			'oldRateColor' : '#000000',
			'rateColor' : '#000000'	
		}
	}
	this.TIPwall['TPW011P00X']['index'] = 0;
	this.TIPwall['TPW012P00X']['index'] = 1;
	this.TIPwall['TPW013P00X']['index'] = 2;
	this.TIPwall['TPW014P00X']['index'] = 3;
	this.TIPwall['TPW015P00X']['index'] = 4;
	this.TIPwall['TPW010P00X']['index'] = 5;
	this.TIPwall['TPW002P00X']['index'] = 6;
	this.TIPwall['TPW003P00X']['index'] = 7;
	this.TIPwall['TPW004P00X']['index'] = 8;
	this.TIPwall['TPW016P00X']['index'] = 9;
	this.TIPwall['TPW009P00X']['index'] = 10;
	this.TIPwall['TPW001P00X']['index'] = 11;
	this.TIPwall['TPW005P00X']['index'] = 12;
	this.TIPwall['TPW017P00X']['index'] = 13;
	this.TIPwall['TPW024P00X']['index'] = 14;
	this.TIPwall['TPW008P00X']['index'] = 15;
	this.TIPwall['TPW007P00X']['index'] = 16;
	this.TIPwall['TPW006P00X']['index'] = 17;
	this.TIPwall['TPW018P00X']['index'] = 18;
	this.TIPwall['TPW023P00X']['index'] = 19;
	this.TIPwall['TPW022P00X']['index'] = 20;
	this.TIPwall['TPW021P00X']['index'] = 21;
	this.TIPwall['TPW020P00X']['index'] = 22;
	this.TIPwall['TPW019P00X']['index'] = 23;

	//invert the above index map for TT lookup
	this.TTmap = []
	for(key in this.TIPwall){
		this.TTmap[this.TIPwall[key].index] = key;
	}

}

TIPballDS = function(){
	var i, j, k, name, key, subKey;

	this.TIPball = {};
	this.totalRate = 0;
	for(i=1; i<129; i++){
		var name = (i<10) ? 'TPC00'+i+'P00X' : ( (i<100) ? 'TCW0'+i+'P00X' : 'TCW'+i+'P00X');
		this.TIPball[name] = {
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
	}

	//invert the above index map for TT lookup
	this.TTmap = []
	for(key in this.TIPball){
		this.TTmap[this.TIPball[key].index] = key;
	}

}



















