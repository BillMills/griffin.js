function partial(func /*, 0..n args */) {
  var args = Array.prototype.slice.call(arguments, 1);
  return function() {
    var allArguments = args.concat(Array.prototype.slice.call(arguments));
    return func.apply(this, allArguments);
  };
}

function curry (fn) {
    var slice = Array.prototype.slice,
        args = slice.apply(arguments, [1]);
    return function () {
        fn.apply(null, args.concat(slice.apply(arguments)));
    };
}

//generic function to execute the animation of some object <thing>, which has memeber function .draw which draws
//the thing only as a function of what frame the animation is on, and member data .duration, .FPS and .nFrames.
function animate(thing, frame){

    //clearTimeout(window.animateLoop);

    thing.draw(frame);
    if(frame < thing.nFrames){
        frame++;
        window.animateLoop = setTimeout(function(){animate(thing, frame)},thing.duration/thing.FPS*1000);
    }
}

//copy of animate, but for use on detail level view:  todo: combine with animate
function animateDetail(thing, frame){

    thing.drawDetail(thing.detailContext, frame);
    if(frame < thing.nFrames){
        frame++;
        window.transAnimateLoop = setTimeout(function(){animateDetail(thing, frame)},thing.duration/thing.FPS*1000);
    }
}

//styling functions to highlight / unhighlight submit button
function unhighlight(buttonID){
    clearTimeout(window.commitBlink);
    $('#'+buttonID).css('background-color', '#FFFFFF');
}

function highlight(buttonID){

    //$('#'+buttonID).css('background-color', '#FFFF00');
    clearTimeout(window.commitBlink);
    function blinkHighlight(color){
        $('#'+buttonID).css('background-color', color);

        if(color == '#FFFFFF') window.commitBlink = setTimeout(function(){blinkHighlight('#FFFF00')},1000);
        if(color == '#FFFF00') window.commitBlink = setTimeout(function(){blinkHighlight('#FFFFFF')},1000);
    }

    blinkHighlight('#FFFF00')


}

//insert something in the DOM
function insertDOM(element, id, classTag, style, wrapperID, onclick, content, name, type, value){
    var newElement = document.createElement(element);
    newElement.setAttribute('id', id);
    newElement.setAttribute('class', classTag);
    newElement.setAttribute('style', style);
    newElement.setAttribute('name', name);
    newElement.setAttribute('type', type);
    newElement.setAttribute('value', value);
    if(wrapperID == 'body')
        document.body.appendChild(newElement)
    else
        document.getElementById(wrapperID).appendChild(newElement);
    document.getElementById(id).innerHTML = content;
    document.getElementById(id).onclick = onclick;
}

//devName = device Name, scales = [ [scale title, parameter service minima, parameter service maxima, unit, ODBminpath, ODBmaxpath], ...]
function parameterDialogue(devName, scales, currentColorScale){
    var i, j, ODBpath;

    //insert div and title
    insertDOM('div', 'tempDiv', '', 'z-index:10; position:absolute; text-align:center; opacity:0; transition:opacity 0.5s; -moz-transition:opacity 0.5s; -webkit-transition:opacity 0.5s; background:rgba(0,0,0,0.8); border: 5px solid; border-radius:10px;', 'waffleplate', '', '', '');
    var dialogue = document.getElementById('tempDiv');
    insertDOM('h2', 'dialogHeader', '', 'position:relative; font:24px Orbitron; top:10px; margin-bottom:6%', 'tempDiv', '', 'Adjust '+devName+' Scale');

    //fix dimensions
    var width = 0.35*window.innerWidth;
    $('#dialogHeader').width(width)

    //center dialogue
    $('#tempDiv').css('left', ($('#waffleplate').width()/2 - width/2))

    //insert form fields
    insertDOM('form', 'dialogueValues', '', '', 'tempDiv', '', '');
    for(i=0; i<scales.length; i++){
        insertDOM('p', 'title'+i, '', 'font-size:16px; margin-top:3%;', 'dialogueValues', '', scales[i][0]+'<br>');
        insertDOM('p', 'minlabel'+i, '', 'display:inline;', 'dialogueValues', '', 'Minimum: ');
        insertDOM('input', 'minfield'+i, '', 'display:inline;', 'dialogueValues', '', '', 'textbox', 'number', scales[i][1]);
        document.getElementById('minfield'+i).setAttribute('size', 6);
        insertDOM('p', 'minunit'+i, '', 'display:inline; margin-right:3%', 'dialogueValues', '', scales[i][3]);
        insertDOM('p', 'maxlabel'+i, '', 'display:inline', 'dialogueValues', '', 'Maximum: ');
        insertDOM('input', 'maxfield'+i, '', 'display:inline;', 'dialogueValues', '', '', 'textbox', 'number', scales[i][2])
        document.getElementById('maxfield'+i).setAttribute('size', 6);
        insertDOM('p', 'maxunit'+i, '', 'display:inline;', 'dialogueValues', '', scales[i][3] + '<br>');
        //don't allow min > max:
        document.getElementById('minfield'+i).onchange = function(){document.getElementById('maxfield'+this.id[8]).min = document.getElementById(this.id).valueAsNumber;};

    }

    //insert color scale picker:
    if(currentColorScale){
        insertDOM('p', 'colorPickerLabel', '', 'display:inline', 'dialogueValues', '', '<br><br>Palette: ');
        var colorScales = window.parameters.colorScale;
        insertDOM('select', 'colorOptions', '', '', 'dialogueValues', '', '');
        var colorDD = document.getElementById('colorOptions');
        var option = [];
        for(i=0; i<colorScales.length; i++){
            option[i] = document.createElement('option');
            option[i].text = colorScales[i];
            option[i].value = colorScales[i];
            colorDD.add(option[i], null);
        }
        colorDD.value = currentColorScale;
        insertDOM('br', 'break', '', '', 'dialogueValues', '', '');
    }

    //insert scale linear / log choice:
    insertDOM('p', 'scalePickerLabel', '', 'display:inline; margin-right:2%', 'dialogueValues', '', '<br><br>Scale: ');
    insertDOM('p', 'linearRadioLabel', '', 'display:inline', 'dialogueValues', '', 'Linear');
    insertDOM('input', 'linearRadio', '', 'display:inline; margin-right:2%;', 'dialogueValues', '', '', 'scaleSwitch', 'radio', 'linear');
    insertDOM('p', 'logRadioLabel', '', 'display:inline;', 'dialogueValues', '', 'Log');
    insertDOM('input', 'logRadio', '', 'display:inline;', 'dialogueValues', '', '', 'scaleSwitch', 'radio', 'log');
    insertDOM('br', 'break', '', '', 'dialogueValues', '', '');
    if (window.parameters.detectorLogMode[window.viewState] == 1) document.getElementById('logRadio').checked = true;
    else document.getElementById('linearRadio').checked = true;

    //insert submit button
    insertDOM('input', 'updateParameters', 'bigButton', 'width:20%; margin-right:2%; margin-top:6%', 'dialogueValues', '', '', '', 'button', 'Commit')
    insertDOM('input', 'dismiss', 'bigButton', 'width:20%; margin-top:6%; margin-bottom:6%;', 'dialogueValues', '', '', '', 'button', 'Dismiss')

    document.getElementById('updateParameters').onclick = function(event){
        var i;
        if(document.getElementById('dialogueValues').checkValidity()){
            
            for(i=0; i<scales.length; i++){
                //commit
                scales[i][1] = parseFloat(document.getElementById('minfield'+i).value);
                scales[i][2] = parseFloat(document.getElementById('maxfield'+i).value);
                ODBSet(scales[i][4], scales[i][1]);
                ODBSet(scales[i][5], scales[i][2]);
                //fetchCustomParameters(); //pushes back to the parameter store
            }
            fetchCustomParameters(); //pushes back to the parameter store

            if(currentColorScale){
                if(window.onDisplay.slice(0,3) == 'DAQ'){
                    window.DAQpointer.DAQcolor = window.parameters.colorScale.indexOf(colorDD.value);
                } else {
                    window.parameters.subdetectorColors[window.state.subdetectorView] = colorDD.value;
                }
            }

            if(document.getElementById('logRadio').checked) window.parameters.detectorLogMode[window.viewState] = 1;
            else if(document.getElementById('linearRadio').checked) window.parameters.detectorLogMode[window.viewState] = 0;
            
            //remove dialogue
            document.getElementById('tempDiv').style.opacity = 0;
            setTimeout(function(){
                var element = document.getElementById('tempDiv');
                element.parentNode.removeChild(element);            
            }, 500);

            rePaint();

        } else{
            alert("Something doesn't make sense.  Check fields for mistakes, highlighted in red.");
        }
    }

    document.getElementById('dismiss').onclick = function(event){
        document.getElementById('tempDiv').style.opacity = 0;
        setTimeout(function(){
            var element = document.getElementById('tempDiv');
            element.parentNode.removeChild(element);            
        }, 500);
    }

    //fade the div in:
    dialogue.style.opacity = 1
}

//help build the ODB path string for the above parameter dialogue:
function scaleType(){
    if (window.state.subdetectorView == 0) return 'HVscale';
    else if (window.state.subdetectorView == 1 || window.state.subdetectorView == 3) return 'thresholdScale';
    else if (window.state.subdetectorView == 2 || window.state.subdetectorView == 4) return 'rateScale';    
}

//Crockford's prototype magics:
function DCobject(o) {
    function F() {}
    F.prototype = o;
    return new F();
}


//return the biggest font size that fits a string into a given length in a given context:
function fitFont(context, string, length){
    var i, size = 1;
    context.font = size+'px Raleway';
    
    while(context.measureText(string).width < length){
        size++;
        context.font = size+'px Raleway';
    }
    
    return size-1;
}

//get the <tag> elements inside a given <parent> (for stripping the head out of the imported status page, since those objects currently have no id's :/ )
function getTag(tag, parentID){
    parent = document.getElementById(parentID);
    var descendants = parent.getElementsByTagName(tag);
    if ( descendants.length )
        return descendants;
    return null;
}

//generate a fake JSONP scalar post to use for offline development:
function fakeScalars(){
    
    var JSONP = {'scalar' : {} },
        key, subKey;


    for(key in window.parameters.deployment){
        if(window.parameters.deployment[key]){            
            for(subKey in window[key+'pointer'].dataBus[key]){
                JSONP.scalar[subKey] = {"TRIGREQ" : 1000*Math.random()};
            }
        }
    }

    return JSONP;
    
}
//like fake scalars, but now thresholds:
function fakeThresholds(){

    var JSONP = {'parameters' : {'thresholds' : {} } },
        key, subKey;

    for(key in window.parameters.deployment){
        if(window.parameters.deployment[key]){
            for(subKey in window[key+'pointer'].dataBus[key]){
                JSONP.parameters.thresholds[subKey] = 1000*Math.random();
            }
        }
    }

    return JSONP;

}

//take a standard object from datastructures and a frame, and determine the appropriate fill color:
function frameColor(obj, frame, nFrames){
    var oldKey, newKey;

    //pick the right keys
    if(window.state.subdetectorView == 0){
        if(obj.HV == 0xDEADBEEF) return 0xDEADBEEF;
        oldKey = 'oldHVcolor';
        newKey = 'HVcolor';
    } else if(window.state.subdetectorView == 1){
        if(obj.threshold == 0xDEADBEEF) return 0xDEADBEEF;
        oldKey = 'oldThresholdColor';
        newKey = 'thresholdColor';
    } else if(window.state.subdetectorView == 2){
        if(obj.rate == 0xDEADBEEF) return 0xDEADBEEF;
        oldKey = 'oldRateColor';
        newKey = 'rateColor';
    }

    return interpolateColor(parseHexColor(obj[oldKey]), parseHexColor(obj[newKey]), frame/nFrames);

}

//make a table for a tooltip using <objects> as rows and <keys> as columns, where the objects are keys of <data>, and insert it into DOM element <id>.  
//[split] indicates how many elements to put in each supercolumn:
function TTtable(id, data, objects, keys, tableTitle, titles, split){
    var i, j, k, n, nContentRows, cellContent;

    insertDOM('table', id + 'table', 'TTtab', 'border-collapse:collapse;', id, '', '');
    insertDOM('colgroup', id+'colgroup', '', '', id+'table');
    for(i=0; i<split.length-1; i++){
        insertDOM('col', id+'colSpace'+i, '', '', id+'colgroup');
        document.getElementById(id+'colSpace'+i).setAttribute('span', keys.length+1)        
        insertDOM('col', id+'col'+i, '', 'border-left:1px solid white;', id+'colgroup');
        document.getElementById(id+'col'+i).setAttribute('span', '1')
    }


    if(tableTitle != ''){
        insertDOM('tr', id+'tableTitleRow', '', '', id+'table', '', '');
        insertDOM('td', id+'tableTitle', '', '', id+'tableTitleRow', '', tableTitle);
        document.getElementById(id+'tableTitle'). setAttribute('colspan', (1+keys.length)*split.length)
    }

    insertDOM('tr', id+'tableHeaderRow', '', '', id+'table', '', '');
    for(k=0; k<split.length; k++){
        //insertDOM('td', 'spacerCell'+k, '', '', id+'tableHeaderRow','','');  
        for(j=0; j<titles.length; j++){
            insertDOM('td', id+'headerCell'+j+'col'+k, '', 'padding-left:'+( (j==0 && k!=0) ? 25:10 )+'px; padding-right:'+( (j==titles.length-1) ? 25:10 )+'px;', id+'tableHeaderRow','',titles[j]);    
        }
    }
    
    nContentRows = Math.max.apply(null, split);

    //build table:
    for(i=0; i<nContentRows; i++){
        //rows
        insertDOM('tr', id+'row'+i, '', '', id+'table', '', '');
        //cells
        for(j=0; j<titles.length*split.length; j++){
            insertDOM('td', id+'row'+i+'cell'+j, '', 'padding:0px; padding-right:'+( (j%(titles.length+1)==0 && j!=0) ? 25:10 )+'px; padding-left:'+( (j%titles.length == 0 && j!=0) ? 25:10 )+'px', id+'row'+i, '', '' );
            //if(j%(keys.length+1)==keys.length && j!=titles.length*split.length-1 ){
            //    document.getElementById(id+'row'+i+'cell'+j).setAttribute('style', 'border-right:1px solid white');
            //}
        }
    }

    //fill table:
    n=0;
    for(i=0; i<split.length; i++){
        for(j=0; j<split[i]; j++){
            document.getElementById(id+'row'+j+'cell'+(titles.length*i)).innerHTML = objects[n];
            for(k=0; k<keys.length; k++){
                if(typeof data[objects[n]][keys[k]] == 'string')
                    cellContent = data[objects[n]][keys[k]];
                else 
                    cellContent = data[objects[n]][keys[k]].toFixed(window.parameters.tooltipPrecision)
                if(cellContent == 0xDEADBEEF) cellContent = '0xDEADBEEF'
                document.getElementById(id+'row'+j+'cell'+(1+titles.length*i+k)).innerHTML = cellContent;
            }
            n++;
        }
    }

}

//return an array with the appropriate colors chosen from <dataStore> (typically dataBus[this.name] for detectors) corresponding to the elements listed in [elements]
function colors(elements, dataStore, frame, nFrames){
    var i,
        colors=[];

    if(Array.isArray(elements)){
        for(i=0; i<elements.length; i++){
            colors[i] = viewMap(elements[i], dataStore, frame, nFrames);
        }
    } else {
        colors = viewMap(elements, dataStore, frame, nFrames);
    }

    function viewMap(elements, dataStore, frame, nFrames){
        if(window.state.subdetectorView == 0) return interpolateColor(parseHexColor(dataStore[elements].oldHVcolor), parseHexColor(dataStore[elements].HVcolor), frame/nFrames);
        else if(window.state.subdetectorView == 1 || window.state.subdetectorView == 3) return interpolateColor(parseHexColor(dataStore[elements].oldThresholdColor), parseHexColor(dataStore[elements].thresholdColor), frame/nFrames);
        else if(window.state.subdetectorView == 2 || window.state.subdetectorView == 4) return interpolateColor(parseHexColor(dataStore[elements].oldRateColor), parseHexColor(dataStore[elements].rateColor), frame/nFrames);        
    }

    return colors;
}

String.prototype.width = function(font) {
  var f = font || '12px arial',
      o = $('<div>' + this + '</div>')
            .css({'position': 'absolute', 'float': 'left', 'white-space': 'nowrap', 'visibility': 'hidden', 'font': f})
            .appendTo($('body')),
      w = o.width();

  o.remove();

  return w;
}

function arraySum(start, end) {
    var i, last, total = 0;

    (end == -1) ? last = this.length : end;

    for(i=start; i<end; i++){
        total += parseFloat(this[i]);
    }
    return total
}


function relMouseCoords(event){
    var totalOffsetX = 0,
    totalOffsetY = 0,
    canvasX = 0,
    canvasY = 0,
    currentElement = this,
    test = [],
    elts = [];

    if (event.offsetX !== undefined && event.offsetY !== undefined) { return {x:event.offsetX, y:event.offsetY}; }
    //if (event.layerX !== undefined && event.layerY !== undefined) { return {x:event.layerX, y:event.layerY}; }

    do{
        totalOffsetX += currentElement.offsetLeft - currentElement.scrollLeft;
        totalOffsetY += currentElement.offsetTop - currentElement.scrollTop;
        //test[test.length] = currentElement.offsetLeft - currentElement.scrollLeft
        //elts[elts.length] = currentElement
    }
    while(currentElement = currentElement.offsetParent)

    canvasX = event.pageX - totalOffsetX;
    canvasY = event.pageY - totalOffsetY;

    //hack to deal with FF scroll, better solution TBD:
    if(event.offsetX == undefined){
        canvasX -= document.body.scrollLeft;
        canvasY -= document.body.scrollTop;
    }

    return {x:canvasX, y:canvasY}
}
HTMLCanvasElement.prototype.relMouseCoords = relMouseCoords;

//generic confirmation dialog
function confirm(headline, detailText, confirmFunc){
    var i, j, ODBpath;

    //insert div and title
    insertDOM('div', 'tempDiv', '', 'z-index:10; position:absolute; text-align:center; opacity:0; transition:opacity 0.5s; -moz-transition:opacity 0.5s; -webkit-transition:opacity 0.5s; background:rgba(0,0,0,0.8); border: 5px solid; border-radius:10px;', 'waffleplate', '', '', '');
    var dialogue = document.getElementById('tempDiv');
    insertDOM('h2', 'dialogHeader', '', 'position:relative; font:24px Orbitron; top:10px; margin-bottom:6%; margin-left:auto; margin-right:auto;', 'tempDiv', '', headline);

    //fix dimensions
    var width = 0.35*window.innerWidth;
    $('#dialogHeader').width(width)

    //center dialogue
    $('#tempDiv').css('left', ($('#waffleplate').width()/2 - width/2))

    //warning text
    insertDOM('p', 'warning', '', 'padding: 1em; font-size:120%;', 'tempDiv', '', '');
    document.getElementById('warning').innerHTML = detailText; 

    //insert submit button
    insertDOM('input', 'confirmChoice', 'bigButton', 'width:auto; height:auto; padding:0.5em; margin-bottom:1em; margin-left:0px', 'tempDiv', '', '', '', 'button', 'Confirm')
    insertDOM('input', 'abortChoice', 'bigButton', 'width:auto; height:auto; padding:0.5em; margin-bottom:1em', 'tempDiv', '', '', '', 'button', 'Abort')

    document.getElementById('confirmChoice').onclick = function(event){

        confirmFunc();

        document.getElementById('tempDiv').style.opacity = 0;
        setTimeout(function(){
            var element = document.getElementById('tempDiv');
            element.parentNode.removeChild(element);            
        }, 500);

        rePaint();
    }

    document.getElementById('abortChoice').onclick = function(event){
        document.getElementById('tempDiv').style.opacity = 0;
        setTimeout(function(){
            var element = document.getElementById('tempDiv');
            element.parentNode.removeChild(element);            
        }, 500);
    }

    //fade the div in:
    dialogue.style.opacity = 1
}

/*
//shouldn't this return something???  otherwise have to use with new keyword to be able to extract anything from the this's.
function ODBKey(path)
{
   var request = XMLHttpRequestGeneric();

   var url = ODBUrlBase + '?cmd=jkey&odb=' + path;
   request.open('GET', url, false);
   request.send(null);
   if (request.responseText == null)
      return null;
   var res = request.responseText.split('\n');
   this.name = res[0];
   this.type = res[1];
   this.num_values = res[2];
   this.item_size = res[3];
   this.last_written = res[4];

   return this;
}
*/