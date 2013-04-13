function configure(detector){
	if(detector == 'SHARC'){
		minmaxTable('sharcTable', 'SHARCdiv', 'SHARC');
	} else if(detector == 'HPGe'){
		minmaxTable('hpgeTable', 'HPGediv', 'HPGe');
		minmaxTable('bgoTable', 'HPGediv', 'BGO');
	} else if(detector == 'DESCANT'){
		minmaxTable('descantTable', 'DESCANTdiv', 'DESCANT');
	} else if(detector == 'PACES'){
		minmaxTable('pacesTable', 'PACESdiv', 'PACES');
	} else if(detector == 'DANTE'){
		minmaxTable('bafTable', 'DANTEdiv', 'BaF');
		minmaxTable('DANTEbgoTable', 'DANTEdiv', 'BGO');
	} else if(detector == 'BAMBINO'){
		insertDOM('p', 'BAMBINOmodeLabel', '', 'float:left; text-align:center; padding-right:20px; margin-top:70px', 'BAMBINOdiv', '', 'BAMBINO Mode<br>')
		insertDOM('p', 'S2label', '', 'display:inline;', 'BAMBINOmodeLabel', '', 'S2');
		insertDOM('input', 'BAMBINOmodeS2', '', '', 'BAMBINOmodeLabel', '', '', 'BAMBINOmode', 'radio', 'S2')
		insertDOM('p', 'S3label', '', 'display:inline; margin-left:10px;', 'BAMBINOmodeLabel', '', 'S3');
		insertDOM('input', 'BAMBINOmodeS3', '', '', 'BAMBINOmodeLabel', '', '', 'BAMBINOmode', 'radio', 'S3')
		minmaxTable('bambinoTable', 'BAMBINOdiv', 'BAMBINO');
	} else if(detector == 'SCEPTAR'){
		minmaxTable('sceptarTable', 'SCEPTARdiv', 'SCEPTAR');
	} else if(detector == 'ZDS'){
		minmaxTable('zdsTable', 'ZDSdiv', 'ZDS');
	} else if(detector == 'SPICE'){
		minmaxTable('spiceTable', 'SPICEdiv', 'SPICE');
	} else if(detector == 'TIPwall'){
		minmaxTable('csiTable', 'TIPwalldiv', 'TIP Wall');
		minmaxTable('TIPhpgeTable', 'TIPwalldiv', 'TIP HPGe');
		minmaxTable('TIPbgoTable', 'TIPwalldiv', 'TIP BGO');
	} else if(detector == 'TIPball'){
		minmaxTable('csiTable', 'TIPballdiv', 'TIP Ball');
		minmaxTable('TIPhpgeTable', 'TIPballdiv', 'TIP HPGe');
		minmaxTable('TIPbgoTable', 'TIPballdiv', 'TIP BGO');
	}	
}

function minmaxTable(id, wrapper, detType){

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
	insertDOM('input', id+detType+'HVmin', 'minmaxCell', '', id+'HVminCell', '', '', '', 'number', '0');
	insertDOM('input', id+detType+'HVmax', 'minmaxCell', '', id+'HVmaxCell', '', '', '', 'number', '3000');
	insertDOM('td', id+'HVunitCell', '', 'text-align:left', id+'HVRow', '', '');
	insertDOM('p', id+'HVunit', '', 'display:inline;', id+'HVunitCell', '', 'V');
	//max should be > min
    document.getElementById(id+detType+'HVmin').onchange = function(){document.getElementById(id+detType+'HVmax').min = document.getElementById(id+detType+'HVmin').valueAsNumber;};

	//threshold
	insertDOM('tr', id+'thresholdRow', '', '', id, '', '');
	insertDOM('td', id+'thresholdTitle', '', 'text-align:right;', id+'thresholdRow', '', 'Threshold');
	insertDOM('td', id+'thresholdMinCell', '', '', id+'thresholdRow', '', '');
	insertDOM('td', id+'thresholdMaxCell', '', '', id+'thresholdRow', '', '');
	insertDOM('input', id+detType+'thresholdMin', 'minmaxCell', '', id+'thresholdMinCell', '', '', '', 'number', '0');
	insertDOM('input', id+detType+'thresholdMax', 'minmaxCell', '', id+'thresholdMaxCell', '', '', '', 'number', '1000');
	insertDOM('td', id+'thresholdUnitCell', '', 'text-align:left', id+'thresholdRow', '', '');
	insertDOM('p', id+'thresholdUnit', '', 'display:inline;', id+'thresholdUnitCell', '', 'ADC Units');
	document.getElementById(id+detType+'thresholdMin').setAttribute('min', 0);
	//max should be > min
    document.getElementById(id+detType+'thresholdMin').onchange = function(){document.getElementById(id+detType+'thresholdMax').min = document.getElementById(id+detType+'thresholdMin').valueAsNumber;};

	//rate	
	insertDOM('tr', id+'rateRow', '', '', id, '', '');
	insertDOM('td', id+'rateTitle', '', 'text-align:right;', id+'rateRow', '', 'Rate');
	insertDOM('td', id+'rateMinCell', '', '', id+'rateRow', '', '');
	insertDOM('td', id+'rateMaxCell', '', '', id+'rateRow', '', '');
	insertDOM('input', id+detType+'rateMin', 'minmaxCell', '', id+'rateMinCell', '', '', '', 'number', '0');
	insertDOM('input', id+detType+'rateMax', 'minmaxCell', '', id+'rateMaxCell', '', '', '', 'number', '10000');
	insertDOM('td', id+'rateUnitCell', '', 'text-align:left', id+'rateRow', '', '');
	insertDOM('p', id+'rateUnit', '', 'display:inline;', id+'rateUnitCell', '', 'Hz');
	document.getElementById(id+detType+'rateMin').setAttribute('min', 0);
	//max should be > min
    document.getElementById(id+detType+'rateMin').onchange = function(){document.getElementById(id+detType+'rateMax').min = document.getElementById(id+detType+'rateMin').valueAsNumber;};

}




















