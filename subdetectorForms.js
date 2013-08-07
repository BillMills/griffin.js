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
		insertDOM('p', 'BAMBINOmodeLabel', '', 'float:left; text-align:center; padding-right:20px; margin-top:70px', 'BAMBINOdiv', '', 'BAMBINO Mode<br>')
		insertDOM('p', 'S2label', '', 'display:inline;', 'BAMBINOmodeLabel', '', 'S2');
		insertDOM('input', 'BAMBINOmodeS2', '', '', 'BAMBINOmodeLabel', '', '', 'BAMBINOmode', 'radio', 'S2')
		insertDOM('p', 'S3label', '', 'display:inline; margin-left:10px;', 'BAMBINOmodeLabel', '', 'S3');
		insertDOM('input', 'BAMBINOmodeS3', '', '', 'BAMBINOmodeLabel', '', '', 'BAMBINOmode', 'radio', 'S3');
		document.getElementById('BAMBINOmodeS3').setAttribute('checked', true);
		//scale table:
		minmaxTable('BAMBINOdiv', 'BAMBINO');
		insertDOM('br', 'break', '', '', 'BAMBINOdiv');
		//upstream / downstream options
		insertDOM('p', 'BAMBINOupstreamLabel', '', 'float:left; text-align:right;', 'BAMBINOdiv', '', 'Upstream');
		insertDOM('input', 'BAMBINOupstreamCheck', '', 'float:left;', 'BAMBINOupstreamLabel', '', '', '', 'checkbox', 'deploy');
		document.getElementById('BAMBINOupstreamCheck').setAttribute('checked', true);
		insertDOM('p', 'BAMBINOdownstreamLabel', '', 'float:left; text-align:right;', 'BAMBINOdiv', '', 'Downstream');
		insertDOM('input', 'BAMBINOdownstreamCheck', '', 'float:left; margin-left:10px', 'BAMBINOdownstreamLabel', '', '', '', 'checkbox', 'deploy');
		document.getElementById('BAMBINOdownstreamCheck').setAttribute('checked', true);
		//groups of checkboxes are a pain for validation, do it in JS:
		document.getElementById('BAMBINOupstreamCheck').onchange = function(){checkBAMBINO()};
		document.getElementById('BAMBINOdownstreamCheck').onchange = function(){checkBAMBINO()};
		//one or two layers:
		insertDOM('p', 'BAMBINOlayerLabel', '', 'float:left; text-align:center; margin-left:30px;', 'BAMBINOdiv', '', 'Layers: ')
		insertDOM('p', 'singleLayerLabel', '', 'display:inline;', 'BAMBINOlayerLabel', '', 'Single');
		insertDOM('input', 'BAMBINOsingleLayer', '', '', 'BAMBINOlayerLabel', '', '', 'BAMBINOlayer', 'radio', 'single')
		insertDOM('p', 'doubleLayerLabel', '', 'display:inline; margin-left:10px;', 'BAMBINOlayerLabel', '', 'Double');
		insertDOM('input', 'BAMBINOdoubleLayer', '', '', 'BAMBINOlayerLabel', '', '', 'BAMBINOlayer', 'radio', 'double');
		document.getElementById('BAMBINOsingleLayer').setAttribute('checked', true);


	} else if(detector == 'SCEPTAR'){
		minmaxTable('SCEPTARdiv', 'SCEPTAR');
	} else if(detector == 'ZDS'){
		minmaxTable('ZDSdiv', 'ZDS');
	} else if(detector == 'SPICE'){
		//S2 or S3 auxiliary:
		insertDOM('p', 'SPICEmodeLabel', '', 'float:left; text-align:center; padding-right:20px; margin-top:70px', 'SPICEdiv', '', 'SPICE Auxiliary Mode<br>')
		insertDOM('p', 'S2label', '', 'display:inline;', 'SPICEmodeLabel', '', 'S2');
		insertDOM('input', 'SPICEmodeS2', '', '', 'SPICEmodeLabel', '', '', 'SPICEmode', 'radio', 'S2')
		insertDOM('p', 'S3label', '', 'display:inline; margin-left:10px;', 'SPICEmodeLabel', '', 'S3');
		insertDOM('input', 'SPICEmodeS3', '', '', 'SPICEmodeLabel', '', '', 'SPICEmode', 'radio', 'S3');
		insertDOM('p', 'noAuxlabel', '', 'display:inline; margin-left:10px;', 'SPICEmodeLabel', '', 'none');
		insertDOM('input', 'SPICEnoAux', '', '', 'SPICEmodeLabel', '', '', 'SPICEmode', 'radio', 'none');		
		document.getElementById('SPICEnoAux').setAttribute('checked', true);
		minmaxTable('SPICEdiv', 'SPICE');
		//one or two auxiliary layers:
		insertDOM('br', 'break', '', '', 'SPICEmodeLabel')
		insertDOM('p', 'SPICElayerLabel', '', 'float:left; text-align:center;', 'SPICEmodeLabel', '', 'Aux. Layers: ')
		insertDOM('p', 'singleLayerLabel', '', 'display:inline;', 'SPICElayerLabel', '', 'Single');
		insertDOM('input', 'SPICEsingleLayer', '', '', 'SPICElayerLabel', '', '', 'SPICElayer', 'radio', 'single')
		insertDOM('p', 'doubleLayerLabel', '', 'display:inline; margin-left:10px;', 'SPICElayerLabel', '', 'Double');
		insertDOM('input', 'SPICEdoubleLayer', '', '', 'SPICElayerLabel', '', '', 'SPICElayer', 'radio', 'double');
		document.getElementById('SPICEsingleLayer').setAttribute('checked', true);

		document.getElementById('SPICEmodeS3').onchange = function(){hideSPICEaux()};
		document.getElementById('SPICEmodeS2').onchange = function(){hideSPICEaux()};
		document.getElementById('SPICEnoAux').onchange = function(){hideSPICEaux()};
	} else if(detector == 'TIPwall'){
		minmaxTable('TIPwalldiv', 'TIP CsI');
		minmaxTable('TIPwalldiv', 'TIP HPGe');
		minmaxTable('TIPwalldiv', 'TIP BGO');
	} else if(detector == 'TIPball'){
		minmaxTable('TIPballdiv', 'TIP CsI');
		minmaxTable('TIPballdiv', 'TIP HPGe');
		minmaxTable('TIPballdiv', 'TIP BGO');
	}	
}

function hideSPICEaux(){
	if(document.getElementById('SPICEnoAux').checked){
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
	insertDOM('table', id, 'minmaxtable', '', wrapper, '', '');
	//title
	insertDOM('tr', id+'titleRow', '', '', id, '', '');
	insertDOM('td', 'spacer', '', '', id+'titleRow', '', '');
	insertDOM('td', id+'titleCell', '', '', id+'titleRow', '', '');
	document.getElementById(id+'titleCell').setAttribute('colspan', 2);
	document.getElementById(id+'titleCell').innerHTML = ((detType) ? detType + ' Scale Limits' : 'Scale Limits');

	//column headers
	insertDOM('tr', id+'columnHeadRow', '', '', id, '', '');
	insertDOM('td', id+'spacer', '', '', id+'columnHeadRow', '', '');
	insertDOM('td', id+'minHead', '', '', id+'columnHeadRow', '', 'Min');
	insertDOM('td', id+'maxHead', '', '', id+'columnHeadRow', '', 'Max');

	//meter types, one row for each:
	//HV
	insertDOM('tr', id+'HVRow', '', '', id, '', '');
	insertDOM('td', id+'HVTitle', '', 'text-align:right;', id+'HVRow', '', 'HV');
	insertDOM('td', id+'HVminCell', '', '', id+'HVRow', '', '');
	insertDOM('td', id+'HVmaxCell', '', '', id+'HVRow', '', '');
	insertDOM('input', id+'HVmin', 'minmaxCell', '', id+'HVminCell', '', '', '', 'number', '0');
	insertDOM('input', id+'HVmax', 'minmaxCell', '', id+'HVmaxCell', '', '', '', 'number', '3000');
	insertDOM('td', id+'HVunitCell', '', 'text-align:left', id+'HVRow', '', '');
	insertDOM('p', id+'HVunit', '', 'display:inline;', id+'HVunitCell', '', 'V');
	//max should be > min
    document.getElementById(id+'HVmin').onchange = function(){document.getElementById(id+'HVmax').min = document.getElementById(id+'HVmin').valueAsNumber;};

	//threshold
	insertDOM('tr', id+'thresholdRow', '', '', id, '', '');
	insertDOM('td', id+'thresholdTitle', '', 'text-align:right;', id+'thresholdRow', '', 'Threshold');
	insertDOM('td', id+'thresholdMinCell', '', '', id+'thresholdRow', '', '');
	insertDOM('td', id+'thresholdMaxCell', '', '', id+'thresholdRow', '', '');
	insertDOM('input', id+'thresholdMin', 'minmaxCell', '', id+'thresholdMinCell', '', '', '', 'number', '0');
	insertDOM('input', id+'thresholdMax', 'minmaxCell', '', id+'thresholdMaxCell', '', '', '', 'number', '1000');
	insertDOM('td', id+'thresholdUnitCell', '', 'text-align:left', id+'thresholdRow', '', '');
	insertDOM('p', id+'thresholdUnit', '', 'display:inline;', id+'thresholdUnitCell', '', 'ADC Units');
	document.getElementById(id+'thresholdMin').setAttribute('min', 0);
	//max should be > min
    document.getElementById(id+'thresholdMin').onchange = function(){document.getElementById(id+'thresholdMax').min = document.getElementById(id+'thresholdMin').valueAsNumber;};

	//rate	
	insertDOM('tr', id+'rateRow', '', '', id, '', '');
	insertDOM('td', id+'rateTitle', '', 'text-align:right;', id+'rateRow', '', 'Rate');
	insertDOM('td', id+'rateMinCell', '', '', id+'rateRow', '', '');
	insertDOM('td', id+'rateMaxCell', '', '', id+'rateRow', '', '');
	insertDOM('input', id+'rateMin', 'minmaxCell', '', id+'rateMinCell', '', '', '', 'number', '0');
	insertDOM('input', id+'rateMax', 'minmaxCell', '', id+'rateMaxCell', '', '', '', 'number', '10000');
	insertDOM('td', id+'rateUnitCell', '', 'text-align:left', id+'rateRow', '', '');
	insertDOM('p', id+'rateUnit', '', 'display:inline;', id+'rateUnitCell', '', 'Hz');
	document.getElementById(id+'rateMin').setAttribute('min', 0);
	//max should be > min
    document.getElementById(id+'rateMin').onchange = function(){document.getElementById(id+'rateMax').min = document.getElementById(id+'rateMin').valueAsNumber;};

}




















