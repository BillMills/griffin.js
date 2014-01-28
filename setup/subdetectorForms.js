function configure(detector){
	if(detector == 'SHARC'){
		minmaxTable('SHARCdiv', 'SHARC');
	} else if(detector == 'HPGe'){
		minmaxTable('HPGediv', 'HPGe');
		minmaxTable('HPGediv', 'HPGe BGO');
	} else if(detector == 'DESCANT'){
		minmaxTable('DESCANTdiv', 'DESCANT');
	} else if(detector == 'PACES'){
		minmaxTable('PACESdiv', 'PACES');
	} else if(detector == 'DANTE'){
		minmaxTable('DANTEdiv', 'DANTE LaBrPMT');
		minmaxTable('DANTEdiv', 'DANTE LaBrTAC');
		minmaxTable('DANTEdiv', 'DANTE BGO');
		document.getElementById('DANTE LaBrPMTTabletitleCell').innerHTML = 'DANTE LaBr PMT Scale Limits';
		document.getElementById('DANTE LaBrTACTabletitleCell').innerHTML = 'DANTE LaBr TAC Scale Limits';
	} else if(detector == 'BAMBINO'){
		//S2 or S3 mode:
		injectDOM('p', 'BAMBINOmodeLabel', 'BAMBINOdiv', {
			'style' : 'float:left; text-align:center; padding-right:20px; margin-top:70px',
			'innerHTML' : 'BAMBINO Mode<br>'
		});
		injectDOM('p', 'S2label', 'BAMBINOmodeLabel', {'style':'display:inline', 'innerHTML':'S2'});
		injectDOM('input', 'BAMBINOmodeS2', 'BAMBINOmodeLabel', {'name':'BAMBINOmode', 'type':'radio', 'value':'S2'});
		injectDOM('p', 'S3label', 'BAMBINOmodeLabel', {'style':'display:inline; margin-left:10px;', 'innerHTML':'S3'});
		injectDOM('input', 'BAMBINOmodeS3', 'BAMBINOmodeLabel', {'name':'BAMBINOmode', 'type':'radio', 'value':'S3', 'checked':true});
		//scale table:
		minmaxTable('BAMBINOdiv', 'BAMBINO');
		injectDOM('br', 'break', 'BAMBINOdiv', {});
		//upstream / downstream options
		injectDOM('p', 'BAMBINOupstreamLabel', 'BAMBINOdiv', {'style':'float:left; text-align:right;', 'innerHTML':'Upstream'});
		injectDOM('input', 'BAMBINOupstreamCheck', 'BAMBINOupstreamLabel', {
			'style':'float:left', 
			'type':'checkbox', 
			'value':'deploy', 
			'checked': (window.experiment == 'TIGRESS') ? true : false, 
		});
		document.getElementById('BAMBINOupstreamCheck').onchange = function(){checkBAMBINO()};
		injectDOM('p', 'BAMBINOdownstreamLabel', 'BAMBINOdiv', {'style':'float:left; text-align:right;', 'innerHTML':'Downstream'});
		injectDOM('input', 'BAMBINOdownstreamCheck', 'BAMBINOdownstreamLabel', {
			'style':'float:left; margin-left:10px', 
			'type':'checkbox', 
			'value':'deploy', 
			'checked':true, 
		});
		document.getElementById('BAMBINOdownstreamCheck').onchange = function(){checkBAMBINO()}; 
		//groups of checkboxes are a pain for validation, do it in JS:
		//document.getElementById('BAMBINOupstreamCheck').onchange = function(){checkBAMBINO()};
		//document.getElementById('BAMBINOdownstreamCheck').onchange = function(){checkBAMBINO()};
		//one or two layers:
		injectDOM('p', 'BAMBINOlayerLabel', 'BAMBINOdiv', {'style':'float:left; text-align:center; margin-left:30px;', 'innerHTML': 'Layers: '});
		injectDOM('p', 'singleLayerLabel', 'BAMBINOlayerLabel', {'style':'display:inline;', 'innerHTML':'Single'});
		injectDOM('input', 'BAMBINOsingleLayer', 'BAMBINOlayerLabel', {
			'name':'BAMBINOlayer', 
			'type':'radio', 
			'value':'single', 
			'checked':true
		});
		injectDOM('p', 'doubleLayerLabel', 'BAMBINOlayerLabel', {'style':'display:inline; margin-left:10px;', 'innerHTML':'Double'});
		injectDOM('input', 'BAMBINOdoubleLayer', 'BAMBINOlayerLabel', {'name':'BAMBINOlayer', 'type':'radio', 'value':'double'});


	} else if(detector == 'SCEPTAR'){
		minmaxTable('SCEPTARdiv', 'SCEPTAR');
	} else if(detector == 'ZDS'){
		minmaxTable('ZDSdiv', 'ZDS');
	} else if(detector == 'SPICE'){
		//only need all the other stuff in TIGRESS - GRIFFIN gives the SPICE aux it's own dialog
		if(window.experiment == 'TIGRESS'){
			//S2 or S3 auxiliary:
			injectDOM('p', 'SPICEmodeLabel', 'SPICEdiv', {
				'style' : 'float:left; text-align:center; padding-right:20px; margin-top:70px',
				'innerHTML' : 'SPICE Auxiliary Mode<br>'
			});
			injectDOM('p', 'S2label', 'SPICEmodeLabel', {'style':'display:inline', 'innerHTML':'S2'});
			injectDOM('input', 'SPICEmodeS2', 'SPICEmodeLabel', {'name':'SPICEmode', 'type':'radio', 'value':'S2', 'checked':true});
			document.getElementById('SPICEmodeS2').onchange = function(){hideSPICEaux()};
			injectDOM('p', 'S3label', 'SPICEmodeLabel', {'style':'display:inline; margin-left:10px;', 'innerHTML':'S3'});
			injectDOM('input', 'SPICEmodeS3', 'SPICEmodeLabel', {'name':'SPICEmode', 'type':'radio', 'value':'S3'});
			document.getElementById('SPICEmodeS3').onchange = function(){hideSPICEaux()};
			injectDOM('p', 'noAuxlabel', 'SPICEmodeLabel', {'style':'display:inline; margin-left:10px;', 'innerHTML':'none'});
			injectDOM('input', 'SPICEnoAux', 'SPICEmodeLabel', {'name':'SPICEmode', 'type':'radio', 'value':'none'});
			document.getElementById('SPICEnoAux').onchange = function(){hideSPICEaux()};
		}

		minmaxTable('SPICEdiv', 'SPICE');

		//again, only for TIGRESS
		if(window.experiment == 'TIGRESS'){
			//one or two auxiliary layers:
			injectDOM('br', 'break', 'SPICEmodeLabel', {});
			injectDOM('p', 'SPICElayerLabel', 'SPICEmodeLabel', {'style':'float:left; text-align:center;', 'innerHTML':'Aux. Layers: '});
			injectDOM('p', 'singleLayerLabel', 'SPICElayerLabel', {'style':'display:inline;', 'innerHTML':'Single'});
			injectDOM('input', 'SPICEsingleLayer', 'SPICElayerLabel', {'name':'SPICElayer', 'type':'radio', 'value':'single', 'checked':true});
			injectDOM('p', 'doubleLayerLabel', 'SPICElayerLabel', {'style':'display:inline; margin-left:10px;', 'innerHTML':'Double'});
			injectDOM('input', 'SPICEdoubleLayer', 'SPICElayerLabel', {'name':'SPICElayer', 'type':'radio', 'value':'double'});
		}

	} else if(detector == 'TIPwall'){
		minmaxTable('TIPwalldiv', 'TIPwall');
	} else if(detector == 'TIPball'){
		minmaxTable('TIPballdiv', 'TIPball');
	}	
}

function hideSPICEaux(){
	if(!document.getElementById('SPICEnoAux').checked){
		document.getElementById('SPICElayerLabel').style.display = 'block';
		document.getElementById('singleLayerLabel').style.display = 'inline';
		document.getElementById('SPICEsingleLayer').style.display = 'inline';
		document.getElementById('doubleLayerLabel').style.display = 'inline';
		document.getElementById('SPICEdoubleLayer').style.display = 'inline';
	} else{
		document.getElementById('SPICElayerLabel').style.display = 'none';
		document.getElementById('singleLayerLabel').style.display = 'none';
		document.getElementById('SPICEsingleLayer').style.display = 'none';
		document.getElementById('doubleLayerLabel').style.display = 'none';
		document.getElementById('SPICEdoubleLayer').style.display = 'none';
	}
}

function minmaxTable(wrapper, detType){

	var id = detType + 'Table';

	//wrap elements in a table
	injectDOM('table', id, wrapper, {'class':'minmaxtable',});
	//title
	injectDOM('tr', id+'titleRow', id, {});
	injectDOM('td', 'spacer', id+'titleRow', {});
	injectDOM('td', id+'titleCell', id+'titleRow', {'colspan':2, 'innerHTML':((detType) ? detType + ' Scale Limits' : 'Scale Limits')});

	//column headers
	injectDOM('tr', id+'columnHeadRow', id, {});
	injectDOM('td', id+'spacer', id+'columnHeadRow', {});
	injectDOM('td', id+'minHead', id+'columnHeadRow', {'innerHTML':'Min'});
	injectDOM('td', id+'maxHead', id+'columnHeadRow', {'innerHTML':'Max'});

	//meter types, one row for each:
	//HV
    injectDOM('tr', id+'HVRow', id, {});
    injectDOM('td', id+'HVTitle', id+'HVRow', {'style':'text-align:right;', 'innerHTML':'HV'});
    injectDOM('td', id+'HVminCell', id+'HVRow', {});
    injectDOM('td', id+'HVmaxCell', id+'HVRow', {});
    injectDOM('input', id+'HVmin', id+'HVminCell', {
    	'class':'minmaxCell', 
    	'type':'number', 
    	'value':0
    });
    document.getElementById(id+'HVmin').onchange = function(){document.getElementById(id+'HVmax').min = document.getElementById(id+'HVmin').valueAsNumber;}
    injectDOM('input', id+'HVmax', id+'HVmaxCell', {'class':'minmaxCell', 'type':'number', 'value':3000});
    injectDOM('td', id+'HVunitCell', id+'HVRow', {'style':'text-align:left'});
    injectDOM('p', id+'HVunit', id+'HVunitCell', {'style':'display:inline', 'innerHTML':'V'});

	//threshold
    injectDOM('tr', id+'thresholdRow', id, {});
    injectDOM('td', id+'thresholdTitle', id+'thresholdRow', {'style':'text-align:right;', 'innerHTML':'Threshold'});
    injectDOM('td', id+'thresholdMinCell', id+'thresholdRow', {});
    injectDOM('td', id+'thresholdMaxCell', id+'thresholdRow', {});
    injectDOM('input', id+'thresholdMin', id+'thresholdMinCell', {
    	'class':'minmaxCell', 
    	'type':'number', 
    	'value':0,
    	'min':0
    });
    document.getElementById(id+'thresholdMin').onchange = function(){document.getElementById(id+'thresholdMax').min = document.getElementById(id+'thresholdMin').valueAsNumber;}
    injectDOM('input', id+'thresholdMax', id+'thresholdMaxCell', {'class':'minmaxCell', 'type':'number', 'value':1000});
    injectDOM('td', id+'thresholdUnitCell', id+'thresholdRow', {'style':'text-align:left'});
    injectDOM('p', id+'thresholdUnit', id+'thresholdUnitCell', {'style':'display:inline', 'innerHTML':'ADC Units'});

	//rate	
    injectDOM('tr', id+'rateRow', id, {});
    injectDOM('td', id+'rateTitle', id+'rateRow', {'style':'text-align:right;', 'innerHTML':'Rate'});
    injectDOM('td', id+'rateMinCell', id+'rateRow', {});
    injectDOM('td', id+'rateMaxCell', id+'rateRow', {});
    injectDOM('input', id+'rateMin', id+'rateMinCell', {
    	'class':'minmaxCell', 
    	'type':'number', 
    	'value':0,
    	'min':0
    });
    document.getElementById(id+'rateMin').onchange = function(){document.getElementById(id+'rateMax').min = document.getElementById(id+'rateMin').valueAsNumber;};
    injectDOM('input', id+'rateMax', id+'rateMaxCell', {'class':'minmaxCell', 'type':'number', 'value':10000});
    injectDOM('td', id+'rateUnitCell', id+'rateRow', {'style':'text-align:left'});
    injectDOM('p', id+'rateUnit', id+'rateUnitCell', {'style':'display:inline;', 'innerHTML':'Hz'});

}








