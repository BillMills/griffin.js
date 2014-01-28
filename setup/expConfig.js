function main(){
	//introduce choose experiment modal:
	document.getElementById('chooseExperiment').active = true;

	////////////////////////////////////////////
	//paint all canvases
	////////////////////////////////////////////
	//GRIFFIN
	//Upstream Chamber
	thumbnail('GRIFusSCEPTAR', 'SCEPTAR', 'none', '#FFFFFF');
	thumbnail('GRIFusPACES', 'PACES', 'none', '#FFFFFF');
	thumbnail('GRIFusSPICE', 'SPICE', 'none', '#FFFFFF');

	//Downstream Chamber
	thumbnail('GRIFdsSCEPTAR', 'SCEPTAR', 'none', '#FFFFFF');
	thumbnail('GRIFdsZDS', 'ZDS', 'none', '#FFFFFF');
	thumbnail('GRIFdsS3', 'S3', 'none', '#FFFFFF');

	//Corona
	thumbnail('GRIFc', 'GRIFFIN', 'DANTE', '#FFFFFF');

	//Upstream Lampshade
	thumbnail('GRIFuslAlone', 'GRIFFIN', 'none', '#FFFFFF');
	thumbnail('GRIFspiceService', 'SPICE', 'services', '#FFFFFF');

	//Downstream Lampshade
	thumbnail('GRIFdslAlone', 'GRIFFIN', 'none', '#FFFFFF');
	thumbnail('GRIFdescant', 'DESCANT', 'none', '#FFFFFF');

	//there's only one choice in GRIFFIN's corona - choose it and lock it by default:
	document.getElementById('GRIFcorona').selected = 'GRIFc0';
	document.getElementById('GRIFcorona').locked = true;

	//TIGRESS
	//Chamber
	thumbnail('TIGusBAMBINO', 'BAMBINO', 'none', '#FFFFFF');
	thumbnail('TIGusSHARC', 'SHARC', 'none', '#FFFFFF'); //need elipses
	thumbnail('TIGusSPICE', 'SPICE', 'none', '#FFFFFF');
	thumbnail('TIGusTIPwall', 'TIPwall', 'none', '#FFFFFF');
	thumbnail('TIGusTIPball', 'TIPball', 'none', '#FFFFFF');

	//there's only one choice in TIGRESS' corona - choose it and lock it by default:
	document.getElementById('TIGcorona').selected = 'TIGc0';
	document.getElementById('TIGcorona').locked = true;

	//Corona
	thumbnail('TIGc', 'TIGRESS', 'none', '#FFFFFF');		

	//Upstream Lampshade
	thumbnail('TIGuslAlone', 'TIGRESS', 'none', '#FFFFFF');
	thumbnail('TIGspiceService', 'SPICE', 'services', '#FFFFFF');

	//Downstream Lampshade
	thumbnail('TIGdslAlone', 'TIGRESS', 'none', '#FFFFFF');
	thumbnail('TIGdescant', 'DESCANT', 'none', '#FFFFFF');
	thumbnail('TIGsharcService', 'SHARC', 'services', '#FFFFFF');	

	/////////////////////////////////////////////////////////////////////////////
	//callbacks - some options influence other options
	/////////////////////////////////////////////////////////////////////////////

	//////////////////////////////
	//GRIFFIN Callbacks
	//////////////////////////////

	//Upstream Chamber
	//SCEPTAR
	document.getElementById('GRIFusc0').setCallback = function(){
		//choosing !SPICE requires !SPICE services, and locks the USL:
		if(!document.getElementById('GRIFusLamp').selected){
			document.getElementById('GRIFusLamp').selected = 'GRIFusl0';
		}
		document.getElementById('GRIFusLamp').locked = true;
	};

	document.getElementById('GRIFusc0').unsetCallback = function(){
		//unchoosing !SPICE unchooses !SPICE Services and unlocks the USL
		if(document.getElementById('GRIFusLamp').selected){
			document.getElementById('GRIFusLamp').locked = false;
			document.getElementById('GRIFusLamp').selected = 'GRIFusl0';
		}
	};

	//PACES
	document.getElementById('GRIFusc1').setCallback = function(){
		//choosing !SPICE chooses and locks GRIFFIN standalone in the USL:
		if(!document.getElementById('GRIFusLamp').selected){
			document.getElementById('GRIFusLamp').selected = 'GRIFusl0';
		}
		document.getElementById('GRIFusLamp').locked = true;
	};

	document.getElementById('GRIFusc1').unsetCallback = function(){
		//unchoosing !SPICE allows either choice for USL:
		if(document.getElementById('GRIFusLamp').selected){
			document.getElementById('GRIFusLamp').locked = false;
			document.getElementById('GRIFusLamp').selected = 'GRIFusl0';
		}
	};

	//SPICE
	document.getElementById('GRIFusc2').setCallback = function(){
		//choosing SPICE requires the SPICE Services
		if(!document.getElementById('GRIFusLamp').selected){
			document.getElementById('GRIFusLamp').selected = 'GRIFusl1';
		}
	};

	document.getElementById('GRIFusc2').unsetCallback = function(){
		//unchoosing SPICE unchooses SPICE Services:
		if(document.getElementById('GRIFusLamp').selected){
			document.getElementById('GRIFusLamp').selected = 'GRIFusl1';
		}
	};

	//Upstream Lampshade
	//GRIFFIN Standalone
	document.getElementById('GRIFusl0').setCallback = function(){
		//choosing GRIFFIN Standalone in the USL removes SPICE as an option in the USC:
		document.getElementById('GRIFusc2').className = 'hidden';
	};

	document.getElementById('GRIFusl0').unsetCallback = function(){
		//unchoosing GRIFFIN Standalone in the USL re-revals SPICE as an option in the USC, if USC not already chosen:
		if(!document.getElementById('GRIFusChamber').selected)
			document.getElementById('GRIFusc2').className = '';
	};

	//SPICE Services
	document.getElementById('GRIFusl1').setCallback = function(){
		//choosing SPICE Services requires SPICE
		if(!document.getElementById('GRIFusChamber').selected){
			document.getElementById('GRIFusChamber').selected = 'GRIFusc2';
		}
	};

	document.getElementById('GRIFusl1').unsetCallback = function(){
		//unchoosing SPICE Services unchooses SPICE:
		if(document.getElementById('GRIFusChamber').selected)
			document.getElementById('GRIFusChamber').selected = 'GRIFusc2';
	};

	///////////////////////////////////////////
	//TIGRESS Callbacks
	///////////////////////////////////////////

	//Chamber
	//BAMBINO
	document.getElementById('TIGusc0').setCallback = function(){
		//!SPICE -> choose TIGRESS in USL:
		if(!document.getElementById('TIGusLamp').selected){
			document.getElementById('TIGusLamp').selected = 'TIGusl0';
		}
		document.getElementById('TIGusLamp').locked = true;
		//!SHARC -> hide SHARC services option 
		document.getElementById('TIGdsl2').className = 'hidden';
	};

	document.getElementById('TIGusc0').unsetCallback = function(){
		//unlock and unset the USL to allow SPICE option
		if(document.getElementById('TIGusLamp').selected){
			document.getElementById('TIGusLamp').locked = false;
			document.getElementById('TIGusLamp').selected = 'TIGusl0';
		}
		//if the DSL is unchosen, allow the SHARC services option...
		if(!document.getElementById('TIGdsLamp').selected){
			document.getElementById('TIGdsl2').className = '';
		//...or if the DSL is chose, unchoose it so SHARC can be a Chamber option again:
		} else{
			document.getElementById('TIGdsLamp').selected = document.getElementById('TIGdsLamp').selected;
		}
	};

	//SHARC
	document.getElementById('TIGusc1').setCallback = function(){
		//SHARC -> must choose SHARC services in DSL:
		if(!document.getElementById('TIGdsLamp').selected){
			document.getElementById('TIGdsLamp').selected = 'TIGdsl2';
		}
		//SHARC -> !SPICE -> TIGRESS in USL:
		if(!document.getElementById('TIGusLamp').selected){
			document.getElementById('TIGusLamp').selected = 'TIGusl0';
			document.getElementById('TIGusLamp').locked = true;
		}
	};

	document.getElementById('TIGusc1').unsetCallback = function(){
		//unsetting SHARC unsets DSL:
		if(document.getElementById('TIGdsLamp').selected){
			document.getElementById('TIGdsLamp').locked = false;
			document.getElementById('TIGdsLamp').selected = 'TIGdsl2';
		}
		//unsetting SHARC also unsets USL, so SPICE can be a Chamber option again:
		if(document.getElementById('TIGusLamp').selected){
			document.getElementById('TIGusLamp').locked = false;
			document.getElementById('TIGusLamp').selected = 'TIGusl0';
		}
	};

	//SPICE
	document.getElementById('TIGusc2').setCallback = function(){
		//SPICE -> SPICE services
		if(!document.getElementById('TIGusLamp').selected){
			document.getElementById('TIGusLamp').selected = 'TIGusl1';
		}
		//SPICE -> !SHARC -> no SHARC services in DSL:
		document.getElementById('TIGdsl2').className = 'hidden';
	};

	document.getElementById('TIGusc2').unsetCallback = function(){
		//unset the USL:
		if(document.getElementById('TIGusLamp').selected){
			document.getElementById('TIGusLamp').selected = 'TIGusl1';
		}
		//If no selection made in the DSL, allow SHARC services as an option.
		if(!document.getElementById('TIGdsLamp').selected)
			document.getElementById('TIGdsl2').className = '';
	};

	//TIP Wall
	document.getElementById('TIGusc3').setCallback = function(){
		//!SPICE -> TIGRESS in the USL:
		if(!document.getElementById('TIGusLamp').selected){
			document.getElementById('TIGusLamp').selected = 'TIGusl0';
		}
		document.getElementById('TIGusLamp').locked = true;
		//!SHARC -> !SHARC services in the DSL:
		document.getElementById('TIGdsl2').className = 'hidden';
		
	};

	document.getElementById('TIGusc3').unsetCallback = function(){
		//unlock and unset USL to allow SPICE as Chamber option:
		if(document.getElementById('TIGusLamp').selected){
			document.getElementById('TIGusLamp').locked = false;
			document.getElementById('TIGusLamp').selected = 'TIGusl0';
		}
		//if DSL is unchosen, allow SHARC services so SHARC can be a Chamber option:
		if(!document.getElementById('TIGdsLamp').selected){
			document.getElementById('TIGdsl2').className = '';
		//if DSL is chosen, unchoose it to allow all Chamber options.
		} else{
			document.getElementById('TIGdsLamp').selected = document.getElementById('TIGdsLamp').selected;
		}
	};

	//TIP Ball
	document.getElementById('TIGusc4').setCallback = function(){
		//!SPICE -> TIGRESS in the USL:
		if(!document.getElementById('TIGusLamp').selected){
			document.getElementById('TIGusLamp').selected = 'TIGusl0';
		}
		document.getElementById('TIGusLamp').locked = true;
		//!SHARC -> !SHARC services in the DSL:
		document.getElementById('TIGdsl2').className = 'hidden';
	};

	document.getElementById('TIGusc4').unsetCallback = function(){
		//unlock and unset USL to allow SPICE as Chamber option:
		if(document.getElementById('TIGusLamp').selected){
			document.getElementById('TIGusLamp').locked = false;
			document.getElementById('TIGusLamp').selected = 'TIGusl0';
		}
		//if DSL is unchosen, allow SHARC services so SHARC can be a Chamber option:
		if(!document.getElementById('TIGdsLamp').selected){
			document.getElementById('TIGdsl2').className = '';
		//if DSL is chosen, unchoose it to allow all Chamber options.
		} else{
			document.getElementById('TIGdsLamp').selected = document.getElementById('TIGdsLamp').selected;
		}
	};

	//Upstream Lampshade
	//TIGRESS Standalone:
	document.getElementById('TIGusl0').setCallback = function(){
		//choosing !SPICE services removes SPICE as a chamber option:
		document.getElementById('TIGusc2').className = 'hidden';
	};

	document.getElementById('TIGusl0').unsetCallback = function(){
		//unsetting TIGRESS standalone releases SPICE as a chamber option, if the chamber isn't already set:
		if(!document.getElementById('TIGusChamber').selected){
			document.getElementById('TIGusc2').className = '';
		}
	};

	//SPICE Services
	document.getElementById('TIGusl1').setCallback = function(){
		//choosing SPICE services chooses SPICE in the chamber
		if(!document.getElementById('TIGusChamber').selected){
			document.getElementById('TIGusChamber').selected = 'TIGusc2';
		}
	};

	document.getElementById('TIGusl1').unsetCallback = function(){
		//unchoosing SPICE Services unchooses SPICE:
		if(document.getElementById('TIGusChamber').selected)
			document.getElementById('TIGusChamber').selected = 'TIGusc2';
	};

	//Downstream Lampshade
	//TIGRESS
	document.getElementById('TIGdsl0').setCallback = function(){
		//Choosing !SHARC Services removes SHARC as a chamber option
		document.getElementById('TIGusc1').className = 'hidden';
	}

	document.getElementById('TIGdsl0').unsetCallback = function(){
		//if the chamber is selected to anything but SHARC, don't re-reveal SHARC services when unsetting TIGRESS in DSL:
		if(document.getElementById('TIGusChamber').selected != 'TIGusc1' && document.getElementById('TIGusChamber').selected){
			document.getElementById('TIGdsl2').className = 'hidden';
		//if the chamber isn't set yet, make sure SHARC is revealed as an option
		} else if(!document.getElementById('TIGusChamber').selected){
			document.getElementById('TIGusc1').className = '';
		}
	};

	//DESCANT
	//choosing !SHARC services removes SHARC option in chamber:
	document.getElementById('TIGdsl1').setCallback = function(){
		document.getElementById('TIGusc1').className = 'hidden';
	}

	document.getElementById('TIGdsl1').unsetCallback = function(){
		//if the chamber is selected to anything but SHARC, don't re-reveal SHARC services when unsetting TIGRESS in DSL:
		if(document.getElementById('TIGusChamber').selected != 'TIGusc1' && document.getElementById('TIGusChamber').selected){
			document.getElementById('TIGdsl2').className = 'hidden';
		//if the chamber isn't set yet, make sure SHARC is revealed as an option
		} else if(!document.getElementById('TIGusChamber').selected){
			document.getElementById('TIGusc1').className = '';
		}
	};

	//SHARC
	document.getElementById('TIGdsl2').setCallback = function(){
		//choosing SHARC Services chooses SHARC in the chamber
		if(!document.getElementById('TIGusChamber').selected){
			document.getElementById('TIGusChamber').selected = 'TIGusc1';
		}
	};

	document.getElementById('TIGdsl2').unsetCallback = function(){
		//unchoosing SHARC services unchooses SHARC in the chamber
		if(document.getElementById('TIGusChamber').selected)
			document.getElementById('TIGusChamber').selected = 'TIGusc1';
	};

}





function buildExperiment(){
	var experiment, BAMBINO, DANTE, DESCANT, PACES, usSCEPTAR, dsSCEPTAR, SHARC, SPICE, TIPball, TIPwall, ZDS;

	//abandon ship if something hasn't been set:
	if(	(document.getElementById('GRIFFINwrap') &&
		(!document.getElementById('GRIFusChamber').selected ||
		!document.getElementById('GRIFdsChamber').selected ||
		!document.getElementById('GRIFusLamp').selected ||
		!document.getElementById('GRIFdsLamp').selected)) ||
		(document.getElementById('TIGRESSwrap') &&
		(!document.getElementById('TIGusChamber').selected ||
		!document.getElementById('TIGusLamp').selected ||
		!document.getElementById('TIGdsLamp').selected))
	){
			document.getElementById('incompleteForm').className = 'activeModal';
			return;
	}

	//which experiment is this?
	experiment = 'GRIFFIN';
	if(document.getElementById('TIGRESSwrap')) experiment = 'TIGRESS';
	//determine which subdetectors have been requested:
	BAMBINO = document.getElementById('TIGusChamber') && document.getElementById('TIGusChamber').selected == 'TIGusc0';
	DANTE = document.getElementById('GRIFcorona');
	DESCANT = (document.getElementById('TIGdsLamp') && document.getElementById('TIGdsLamp').selected == 'TIGdsl1') || 
		(document.getElementById('GRIFdsLamp') && document.getElementById('GRIFdsLamp').selected == 'GRIFdsl1');
	PACES = document.getElementById('GRIFusChamber') && document.getElementById('GRIFusChamber').selected == 'GRIFusc1';
	usSCEPTAR = document.getElementById('GRIFusChamber') && document.getElementById('GRIFusChamber').selected == 'GRIFusc0';
	dsSCEPTAR = document.getElementById('GRIFdsChamber') && document.getElementById('GRIFdsChamber').selected == 'GRIFdsc0';
	SHARC = document.getElementById('TIGusChamber') && document.getElementById('TIGusChamber').selected == 'TIGusc1';
	SPICE = (document.getElementById('TIGusChamber') && document.getElementById('TIGusChamber').selected == 'TIGusc2') ||
			(document.getElementById('GRIFusChamber') && document.getElementById('GRIFusChamber').selected == 'GRIFusc2')
	TIPball = document.getElementById('TIGusChamber') && document.getElementById('TIGusChamber').selected == 'TIGusc4';
	TIPwall = document.getElementById('TIGusChamber') && document.getElementById('TIGusChamber').selected == 'TIGusc3';
	ZDS = document.getElementById('GRIFdsChamber') && document.getElementById('GRIFdsChamber').selected == 'GRIFdsc1';

	//create ODB structure//////////////////////////////////////////////////////////////
	//re-declare root dashboard directory:
	ODBMDelete(['/DashboardConfig']);
	ODBMCreate(['/DashboardConfig'], [TID_KEY]);

	//top level ODB data
	address = [	'/DashboardConfig/topLevel', 
				'/DashboardConfig/topLevel/HPGeArray', 
				'/DashboardConfig/topLevel/statusURL', 
				'/DashboardConfig/topLevel/expName', 
				'/DashboardConfig/topLevel/Experiment'
			];
	type = [TID_KEY, TID_STRING, TID_STRING, TID_STRING, TID_STRING];
	ODBMCreate(address, type);
	ODBSet('/DashboardConfig/topLevel/HPGeArray', experiment);

	//Main dashboard registry
	address = [	'/DashboardConfig/Dashboard', 
				'/DashboardConfig/Dashboard/dashboardMin', 
				'/DashboardConfig/Dashboard/dashboardMax'
			];
	type = [TID_KEY, TID_INT, TID_INT];
	ODBMCreate(address, type);
	ODBSet('/DashboardConfig/Dashboard/dashboardMax', 1000000);

	//alarm registry
	address = [	'/DashboardConfig/CustomAlarms', 
				'/DashboardConfig/CustomAlarms/Voltage', 
				'/DashboardConfig/CustomAlarms/Current', 
				'/DashboardConfig/CustomAlarms/Temperature', 
				'/DashboardConfig/CustomAlarms/Clock'
			];
	type = [TID_KEY, TID_INT, TID_INT, TID_INT, TID_INT];
	ODBMCreate(address, type);

	//cycles
	address = [	'/DashboardConfig/Cycles', 
				'/DashboardConfig/Cycles/Static Source',
				'/DashboardConfig/Cycles/Static Source/Code',
				'/DashboardConfig/Cycles/Static Source/Duration',
				'/DashboardConfig/Cycles/Standard Cycle',
				'/DashboardConfig/Cycles/Standard Cycle/Code',
				'/DashboardConfig/Cycles/Standard Cycle/Duration',									
				'/DashboardConfig/Cycles/Active Name',
				'/DashboardConfig/Cycles/Active Pattern',
				'/DashboardConfig/Cycles/Active Duration'
			];
	type = [TID_KEY, TID_KEY, TID_INT, TID_INT, TID_KEY, TID_INT, TID_INT, TID_STRING, TID_INT, TID_INT];
	arrayLengths = [1, 1, 2, 2, 1, 5, 5, 1, 2, 2];
	ODBMCreate(address, type, arrayLengths);
	ODBSet('/DashboardConfig/Cycles/Static Source/Code[*]', [0x300030, 0x1F811F81]);
	ODBSet('/DashboardConfig/Cycles/Static Source/Duration[*]', [100, 0]);
	ODBSet('/DashboardConfig/Cycles/Standard Cycle/Code[*]', [0x300030, 0x400040, 0x1F801F80, 0x1F811F81, 0x1F801F80]);
	ODBSet('/DashboardConfig/Cycles/Standard Cycle/Duration[*]', [100, 500, 1000, 15000, 5000]);
	ODBSet('/DashboardConfig/Cycles/Active Name', 'Static Source'); //defaults to static source on load
	ODBSet('/DashboardConfig/Cycles/Active Pattern[*]', [0x300030, 0x1F811F81]);
	ODBSet('/DashboardConfig/Cycles/Active Duration[*]', [100, 0]);

	//filters
	ODBMCreate(['/DashboardConfig/Filters', '/DashboardConfig/Filters/HPGe Singles'], [TID_KEY, TID_KEY]);
	ODBMCreate(['/DashboardConfig/Filters/Active Name', '/DashboardConfig/Filters/group0', '/DashboardConfig/Filters/HPGe Singles/group0'], [TID_STRING, TID_STRING, TID_STRING], [1,1,1], [32, 32, 32]);
	ODBSet('/DashboardConfig/Filters/Active Name[*]', 'HPGe Singles');
	ODBSet('/DashboardConfig/Filters/group0[*]', 'GRG-S-1');
	ODBSet('/DashboardConfig/Filters/HPGe Singles/group0[*]', 'GRG-S-1');

	//HV
	address = [	'/DashboardConfig/HV', 
				'/DashboardConfig/HV/voltageTolerance', 
				'/DashboardConfig/HV/currentTolerance', 
				'/DashboardConfig/HV/tempTolerance', 
				'/DashboardConfig/HV/demandVoltage', 
				'/DashboardConfig/HV/voltRampSpeed'
			];
	type = [TID_KEY, TID_INT, TID_INT, TID_INT, TID_INT, TID_INT, TID_INT];
	ODBMCreate(address, type);

	//DAQ
	address = [	'/DashboardConfig/DAQ',
				'/DashboardConfig/DAQ/config',
				'/DashboardConfig/DAQ/rateMinTopView', 
				'/DashboardConfig/DAQ/rateMaxTopView', 
				'/DashboardConfig/DAQ/rateMinDetailView', 
				'/DashboardConfig/DAQ/rateMaxDetailView', 
				'/DashboardConfig/DAQ/transferMinTopView', 
				'/DashboardConfig/DAQ/transferMaxTopView', 
				'/DashboardConfig/DAQ/transferMinDetailView', 
				'/DashboardConfig/DAQ/transferMaxDetailView', 
				'/DashboardConfig/DAQ/rateMinMaster', 
				'/DashboardConfig/DAQ/rateMaxMaster', 
				'/DashboardConfig/DAQ/transferMinMaster', 
				'/DashboardConfig/DAQ/transferMaxMaster'
			];
	type = [TID_KEY, TID_STRING, TID_INT, TID_INT, TID_INT, TID_INT, TID_INT, TID_INT, TID_INT, TID_INT, TID_INT, TID_INT, TID_INT, TID_INT];
	ODBMCreate(address, type);
	ODBSet('/DashboardConfig/DAQ/config', experiment);
	ODBSet('/DashboardConfig/DAQ/rateMaxTopView', 10000);
	ODBSet('/DashboardConfig/DAQ/rateMaxDetailView', 10000);
	ODBSet('/DashboardConfig/DAQ/transferMaxTopView', 10000);
	ODBSet('/DashboardConfig/DAQ/transferMaxDetailView', 10000);
	ODBSet('/DashboardConfig/DAQ/rateMaxMaster', 10000);
	ODBSet('/DashboardConfig/DAQ/transferMaxMaster', 10000);

	//BAMBINO
	if(BAMBINO){
		address = [	'/DashboardConfig/BAMBINO', 
					'/DashboardConfig/BAMBINO/deploy', 
					'/DashboardConfig/BAMBINO/HVscale', 
					'/DashboardConfig/BAMBINO/thresholdScale', 
					'/DashboardConfig/BAMBINO/rateScale', 
					'/DashboardConfig/BAMBINO/mode', 
					'/DashboardConfig/BAMBINO/layers', 
					'/DashboardConfig/BAMBINO/USdeploy', 
					'/DashboardConfig/BAMBINO/DSdeploy'
				];
		type = [TID_KEY, TID_INT, TID_INT, TID_INT, TID_INT, TID_STRING, TID_INT, TID_INT, TID_INT];
		ODBMCreate(address, type);

		ODBSet('/DashboardConfig/BAMBINO/deploy', 1);
	}

	//DANTE
	if(DANTE){
		address = [ '/DashboardConfig/DANTE',
					'/DashboardConfig/DANTE/deploy',
					'/DashboardConfig/DANTE/BGOHVscale',
					'/DashboardConfig/DANTE/BGOthresholdScale',
					'/DashboardConfig/DANTE/BGOrateScale',
					'/DashboardConfig/DANTE/LaBrPMTHVscale',
					'/DashboardConfig/DANTE/LaBrPMTthresholdScale',
					'/DashboardConfig/DANTE/LaBrPMTrateScale',
					'/DashboardConfig/DANTE/LaBrTACHVscale',
					'/DashboardConfig/DANTE/LaBrTACthresholdScale',
					'/DashboardConfig/DANTE/LaBrTACrateScale'										
				];
		type = [TID_KEY, TID_INT, TID_INT, TID_INT, TID_INT, TID_INT, TID_INT, TID_INT, TID_INT, TID_INT, TID_INT];
		ODBMCreate(address, type);

		ODBSet('/DashboardConfig/DANTE/deploy', 1);
	}

	//DESCANT
	if(DESCANT){
		address = [	'/DashboardConfig/DESCANT',
					'/DashboardConfig/DESCANT/deploy',
					'/DashboardConfig/DESCANT/HVscale',
					'/DashboardConfig/DESCANT/thresholdScale',
					'/DashboardConfig/DESCANT/rateScale'
				];

		type = [TID_KEY, TID_INT, TID_INT, TID_INT, TID_INT];
		ODBMCreate(address, type); 

		ODBSet('/DashboardConfig/DESCANT/deploy', 1);
	}

	//HPGe - no if, always in
	address = [	'/DashboardConfig/HPGe',
				'/DashboardConfig/HPGe/deploy',
				'/DashboardConfig/HPGe/BGOHVscale',
				'/DashboardConfig/HPGe/BGOthresholdScale',
				'/DashboardConfig/HPGe/BGOrateScale',
				'/DashboardConfig/HPGe/HVscale',
				'/DashboardConfig/HPGe/thresholdScale',
				'/DashboardConfig/HPGe/rateScale',
				'/DashboardConfig/HPGe/upstreamLampAbsent',
				'/DashboardConfig/HPGe/downstreamLampAbsent'
			];
	type = [TID_KEY, TID_INT, TID_INT, TID_INT, TID_INT, TID_INT, TID_INT, TID_INT, TID_INT, TID_INT];
	ODBMCreate(address, type); 

	ODBSet('/DashboardConfig/HPGe/deploy', 1);

	//PACES
	if(PACES){
		address = [	'/DashboardConfig/PACES',
					'/DashboardConfig/PACES/deploy',
					'/DashboardConfig/PACES/HVscale',
					'/DashboardConfig/PACES/thresholdScale',
					'/DashboardConfig/PACES/rateScale'
				];

		type = [TID_KEY, TID_INT, TID_INT, TID_INT, TID_INT];
		ODBMCreate(address, type); 		

		ODBSet('/DashboardConfig/PACES/deploy', 1);			
	}

	//SCEPTAR
	if(usSCEPTAR || dsSCEPTAR){
		address = [	'/DashboardConfig/SCEPTAR',
					'/DashboardConfig/SCEPTAR/USdeploy',
					'/DashboardConfig/SCEPTAR/DSdeploy',
					'/DashboardConfig/SCEPTAR/HVscale',
					'/DashboardConfig/SCEPTAR/thresholdScale',
					'/DashboardConfig/SCEPTAR/rateScale'
				];

		type = [TID_KEY, TID_INT, TID_INT, TID_INT, TID_INT, TID_INT];
		ODBMCreate(address, type);

		ODBSet('/DashboardConfig/SCEPTAR/USdeploy', (usSCEPTAR ? 1 : 0) );
		ODBSet('/DashboardConfig/SCEPTAR/DSdeploy', (dsSCEPTAR ? 1 : 0) );

	}

	//SHARC
	if(SHARC){
		address = [	'/DashboardConfig/SHARC',
					'/DashboardConfig/SHARC/deploy',
					'/DashboardConfig/SHARC/HVscale',
					'/DashboardConfig/SHARC/thresholdScale',
					'/DashboardConfig/SHARC/rateScale'
				];

		type = [TID_KEY, TID_INT, TID_INT, TID_INT, TID_INT];
		ODBMCreate(address, type); 

		ODBSet('/DashboardConfig/SHARC/deploy', 1);
	}						

	//SPICE
	if(SPICE){
		address = [	'/DashboardConfig/SPICE',
					'/DashboardConfig/SPICE/deploy',
					'/DashboardConfig/SPICE/HVscale',
					'/DashboardConfig/SPICE/thresholdScale',
					'/DashboardConfig/SPICE/rateScale',
					'/DashboardConfig/SPICE/SPICEauxiliary',
					'/DashboardConfig/SPICE/SPICEauxLayers'
				];

		type = [TID_KEY, TID_INT, TID_INT, TID_INT, TID_INT, TID_STRING, TID_INT];
		ODBMCreate(address, type); 

		ODBSet('/DashboardConfig/SPICE/deploy', 1);
	}

	//TIP ball
	if(TIPball){
		address = [	'/DashboardConfig/TIPball',
					'/DashboardConfig/TIPball/deploy',
					'/DashboardConfig/TIPball/HVscale',
					'/DashboardConfig/TIPball/thresholdScale',
					'/DashboardConfig/TIPball/rateScale'
				];

		type = [TID_KEY, TID_INT, TID_INT, TID_INT, TID_INT];
		ODBMCreate(address, type); 

		ODBSet('/DashboardConfig/TIPball/deploy', 1);
	}

	//TIP wall
	if(TIPwall){
		address = [	'/DashboardConfig/TIPwall',
					'/DashboardConfig/TIPwall/deploy',
					'/DashboardConfig/TIPwall/HVscale',
					'/DashboardConfig/TIPwall/thresholdScale',
					'/DashboardConfig/TIPwall/rateScale'
				];

		type = [TID_KEY, TID_INT, TID_INT, TID_INT, TID_INT];
		ODBMCreate(address, type); 

		ODBSet('/DashboardConfig/TIPwall/deploy', 1);
	}

	//ZDS
	if(ZDS){
		address = [	'/DashboardConfig/ZDS',
					'/DashboardConfig/ZDS/deploy',
					'/DashboardConfig/ZDS/HVscale',
					'/DashboardConfig/ZDS/thresholdScale',
					'/DashboardConfig/ZDS/rateScale'
				];

		type = [TID_KEY, TID_INT, TID_INT, TID_INT, TID_INT];
		ODBMCreate(address, type); 

		ODBSet('/DashboardConfig/ZDS/deploy', 1);
	}

	window.location = window.location.href.replace("ConfigureExperiment", "ConfigureSubdetectors");

}

//draw elliptical arc:
function ellipse(context, centerX, centerY, horizRadius, startAngle, endAngle){
    context.save();
    context.translate(centerX, centerY);
    context.scale(1, 0.3);
    context.beginPath();
    context.arc(0, 0, horizRadius, 2*Math.PI - startAngle, 2*Math.PI - endAngle);
    context.restore();
    context.closePath();
    context.stroke();
}

function chooseExperiment(exp){

	//get rid of the dom elements corresponding to the experiment we don't want
	if(exp == 'TIGRESS'){
		deleteDOM('GRIFFINwrap');
		//swap in TIGRESS branding
		document.getElementById('title').innerHTML = 'TIGRESS';
		document.getElementById('logo').src = 'triumf.gif'
	} else if(exp == 'GRIFFIN'){
		deleteDOM('TIGRESSwrap');
	}

	//fade out the experiment selection modal
	document.getElementById('chooseExperiment').active = false;
	//fade in the rest of the page
	document.getElementById('wrapper').setAttribute('style','opacity:1');
	document.getElementById('footer').setAttribute('style','opacity:1');

}

//delete a dom element by ID
function deleteDOM(id){
    var element = document.getElementById(id);
    element.parentNode.removeChild(element);
};