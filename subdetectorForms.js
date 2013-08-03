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
		minmaxTable('DANTEdiv', 'DANTE BaF');
		minmaxTable('DANTEdiv', 'DANTE BGO');
	} else if(detector == 'BAMBINO'){
		insertDOM('p', 'BAMBINOmodeLabel', '', 'float:left; text-align:center; padding-right:20px; margin-top:70px', 'BAMBINOdiv', '', 'BAMBINO Mode<br>')
		insertDOM('p', 'S2label', '', 'display:inline;', 'BAMBINOmodeLabel', '', 'S2');
		insertDOM('input', 'BAMBINOmodeS2', '', '', 'BAMBINOmodeLabel', '', '', 'BAMBINOmode', 'radio', 'S2')
		insertDOM('p', 'S3label', '', 'display:inline; margin-left:10px;', 'BAMBINOmodeLabel', '', 'S3');
		insertDOM('input', 'BAMBINOmodeS3', '', '', 'BAMBINOmodeLabel', '', '', 'BAMBINOmode', 'radio', 'S3');
		document.getElementById('BAMBINOmodeS3').setAttribute('checked', true);
		minmaxTable('BAMBINOdiv', 'BAMBINO');
		insertDOM('br', 'break', '', '', 'BAMBINOdiv');
		insertDOM('p', 'BAMBINOupstreamLabel', '', 'float:left; text-align:right;', 'BAMBINOdiv', '', 'Upstream');
		insertDOM('input', 'BAMBINOupstreamCheck', '', 'float:left;', 'BAMBINOupstreamLabel', '', '', '', 'checkbox', 'deploy');
		document.getElementById('BAMBINOupstreamCheck').setAttribute('checked', true);
		insertDOM('p', 'BAMBINOdownstreamLabel', '', 'float:left; text-align:right;', 'BAMBINOdiv', '', 'Downstream');
		insertDOM('input', 'BAMBINOdownstreamCheck', '', 'float:left; margin-left:10px', 'BAMBINOdownstreamLabel', '', '', '', 'checkbox', 'deploy');
		document.getElementById('BAMBINOdownstreamCheck').setAttribute('checked', true);
		//insertDOM('p', 'BAMBINOlayersLabel', '', 'float:left; text-align:right; margin-left:50px;', 'BAMBINOdiv', '', 'Layers:');

		document.getElementById('BAMBINOupstreamCheck').onchange = function(){checkBAMBINO()};
		document.getElementById('BAMBINOdownstreamCheck').onchange = function(){checkBAMBINO()};

	} else if(detector == 'SCEPTAR'){
		minmaxTable('SCEPTARdiv', 'SCEPTAR');
	} else if(detector == 'ZDS'){
		minmaxTable('ZDSdiv', 'ZDS');
	} else if(detector == 'SPICE'){
		minmaxTable('SPICEdiv', 'SPICE');
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

function minmaxTable(wrapper, detType){

	var id = detType + 'Table';

	//wrap elements in a table
	insertDOM('table', id, 'minmaxtable', '', wrapper, '', '');
	//title
	insertDOM('tr', id+'titleRow', '', '', id, '', '');
	insertDOM('td', 'spacer', '', '', id+'titleRow', '', '');
	insertDOM('td', id+'titleCell', '', '', id+'titleRow', '', '');
	document.getElementById(id+'titleCell').setAttribute('colspan', 2);
	document.getElementById(id+'titleCell').innerHTML = (detType) ? detType + ' Scale Limits' : 'Scale Limits';

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




















