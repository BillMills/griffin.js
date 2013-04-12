function configureDESCANT(){
	
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
	insertDOM('td', 'spacer', '', '', id+'columnHeadRow', '', '');
	insertDOM('td', 'minHead', '', '', id+'columnHeadRow', '', 'Min');
	insertDOM('td', 'maxHead', '', '', id+'columnHeadRow', '', 'Max');

	//meter types, one row for each:
	//HV
	insertDOM('tr', id+'HVRow', '', '', id, '', '');
	insertDOM('td', 'HVTitle', '', 'text-align:right;', id+'HVRow', '', 'HV');
	insertDOM('td', 'HVminCell', '', '', id+'HVRow', '', '');
	insertDOM('td', 'HVmaxCell', '', '', id+'HVRow', '', '');
	insertDOM('input', id+detType+'HVmin', 'minmaxCell', '', 'HVminCell', '', '', '', 'number', '0');
	insertDOM('input', id+detType+'HVmax', 'minmaxCell', '', 'HVmaxCell', '', '', '', 'number', '3000');
	insertDOM('td', 'HVunitCell', '', 'text-align:left', id+'HVRow', '', '');
	insertDOM('p', 'HVunit', '', 'display:inline;', 'HVunitCell', '', 'V');

	//threshold
	insertDOM('tr', id+'thresholdRow', '', '', id, '', '');
	insertDOM('td', 'thresholdTitle', '', 'text-align:right;', id+'thresholdRow', '', 'Threshold');
	insertDOM('td', 'thresholdMinCell', '', '', id+'thresholdRow', '', '');
	insertDOM('td', 'thresholdMaxCell', '', '', id+'thresholdRow', '', '');
	insertDOM('input', id+detType+'thresholdMin', 'minmaxCell', '', 'thresholdMinCell', '', '', '', 'number', '0');
	insertDOM('input', id+detType+'thresholdMax', 'minmaxCell', '', 'thresholdMaxCell', '', '', '', 'number', '1000');
	insertDOM('td', 'thresholdUnitCell', '', 'text-align:left', id+'thresholdRow', '', '');
	insertDOM('p', 'thresholdUnit', '', 'display:inline;', 'thresholdUnitCell', '', 'ADC Units');

	//rate	
	insertDOM('tr', id+'rateRow', '', '', id, '', '');
	insertDOM('td', 'rateTitle', '', 'text-align:right;', id+'rateRow', '', 'Rate');
	insertDOM('td', 'rateMinCell', '', '', id+'rateRow', '', '');
	insertDOM('td', 'rateMaxCell', '', '', id+'rateRow', '', '');
	insertDOM('input', id+detType+'rateMin', 'minmaxCell', '', 'rateMinCell', '', '', '', 'number', '0');
	insertDOM('input', id+detType+'rateMax', 'minmaxCell', '', 'rateMaxCell', '', '', '', 'number', '10000');
	insertDOM('td', 'rateUnitCell', '', 'text-align:left', id+'rateRow', '', '');
	insertDOM('p', 'rateUnit', '', 'display:inline;', 'rateUnitCell', '', 'Hz');
	document.getElementById(id+detType+'rateMin').setAttribute('min', 0);
	//the max should be >= the min:
	//document.getElementById(id+detType+'rateMin').setAttribute('onchange', function(minID, maxID){document.getElementById(maxID).setAttribute('min', document.getElementById(minID).valueAsNumber)}.call(this, id+detType+'rateMin', id+detType+'rateMax')  );

}