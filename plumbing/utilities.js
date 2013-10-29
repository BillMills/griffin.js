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

//more flexible DOM injector; <properties> is an object containing property.value pairs for all properties to be set: 
function injectDOM(element, id, wrapperID, properties){
    var key, elt,
        newElement = document.createElement(element);
    //explicit ID
    newElement.setAttribute('id', id);
    //append to document:
    if(wrapperID == 'body')
        document.body.appendChild(newElement)
    else
        document.getElementById(wrapperID).appendChild(newElement);
    elt = document.getElementById(id);

    //some things need to be set specially:
    if(properties['innerHTML']){
        elt.innerHTML = properties['innerHTML'];
        delete properties['innerHTML'];
    }
    if(properties['onclick']){
        elt.onclick = properties['onclick'];
        delete properties['onclick'];
    }
    //send in the clowns:
    for(key in properties){
        elt.setAttribute(key, properties[key]);
    }

}

//devName = device Name, scales = [ [scale title, parameter service minima, parameter service maxima, unit, ODBminpath, ODBmaxpath], ...]
function parameterDialogue(devName, scales, currentColorScale){
    var i, j, ODBpath;

    //insert div and title
    injectDOM('div', 'tempDiv', 'waffleplate', {'class' : 'tempDialog'});
    var dialogue = document.getElementById('tempDiv');
    injectDOM('h2', 'dialogHeader', 'tempDiv', {
        'style' : 'position:relative; font:24px Orbitron; top:10px; margin-bottom:6%',
        'innerHTML' : 'Adjust '+devName+' Scale'
    });

    //fix dimensions
    var width = 0.35*window.innerWidth;
    $('#dialogHeader').width(width)

    //center dialogue
    $('#tempDiv').css('left', ($('#waffleplate').width()/2 - width/2))

    //insert form fields
    injectDOM('form', 'dialogueValues', 'tempDiv', {});
    for(i=0; i<scales.length; i++){
        injectDOM('p', 'title'+i, 'dialogueValues', {'style':'font-size:16px; margin-top:3%;', 'innerHTML':scales[i][0]+'<br>'});
        injectDOM('p', 'minlabel'+i, 'dialogueValues', {'style':'display:inline', 'innerHTML':'Minimum: '});
        injectDOM('input', 'minfield'+i, 'dialogueValues', {
            'style' : 'display:inline;',
            'name' : 'textbox',
            'type' : 'number',
            'value' : scales[i][1],
            'size' : 6
        });
        injectDOM('p', 'minunit'+i, 'dialogueValues', {'style':'display:inline; margin-right:3%', 'innerHTML':scales[i][3]});
        injectDOM('p', 'maxlabel'+i, 'dialogueValues', {'style':'display:inline;', 'innerHTML':'Maximum: '});
        injectDOM('input', 'maxfield'+i, 'dialogueValues', {
            'style' : 'display:inline;',
            'name' : 'textbox',
            'type' : 'number',
            'value' : scales[i][2],
            'size' : 6
        });
        injectDOM('p', 'maxunit'+i, 'dialogueValues', {'style':'display:inline;', 'innerHTML':scales[i][3] + '<br>'});
        //don't allow min > max:
        document.getElementById('minfield'+i).onchange = function(){document.getElementById('maxfield'+this.id[8]).min = document.getElementById(this.id).valueAsNumber;};

    }

    //insert color scale picker:
    if(currentColorScale){
        injectDOM('p', 'colorPickerLabel', 'dialogueValues', {'style':'display:inline;', 'innerHTML':'<br><br>Palette: '})
        var colorScales = window.parameters.colorScale;
        injectDOM('select', 'colorOptions', 'dialogueValues', {});
        var colorDD = document.getElementById('colorOptions');
        var option = [];
        for(i=0; i<colorScales.length; i++){
            option[i] = document.createElement('option');
            option[i].text = colorScales[i];
            option[i].value = colorScales[i];
            colorDD.add(option[i], null);
        }
        colorDD.value = currentColorScale;
        injectDOM('br', 'break', 'dialogueValues', {});
    }

    //insert scale linear / log choice:
    injectDOM('p', 'scalePickerLabel', 'dialogueValues', {'style':'display:inline; margin-right:2%', 'innerHTML':'<br><br>Scale: '});
    injectDOM('p', 'linearRadioLabel', 'dialogueValues', {'style':'display:inline', 'innerHTML':'Linear'});
    injectDOM('input', 'linearRadio', 'dialogueValues', {
        'style' : 'display:inline; margin-right:2%;',
        'name' : 'scaleSwitch',
        'type' : 'radio',
        'value' : 'linear'
    });
    injectDOM('p', 'logRadioLabel', 'dialogueValues', {'style':'display:inline', 'innerHTML':'Log'});
    injectDOM('input', 'logRadio', 'dialogueValues', {
        'style' : 'display:inline;',
        'name' : 'scaleSwitch',
        'type' : 'radio',
        'value' : 'log'
    });
    injectDOM('br', 'break', 'dialogueValues', {});

    if (window.parameters.detectorLogMode[window.viewState] == 1) document.getElementById('logRadio').checked = true;
    else document.getElementById('linearRadio').checked = true;

    //insert submit & dismiss button
    injectDOM('input', 'updateParameters', 'dialogueValues', {
        'class' : 'bigButton',
        'style' : 'width:20%; margin-right:2%; margin-top:6%',
        'type' : 'button',
        'value' : 'Commit'
    });
    injectDOM('input', 'dismiss', 'dialogueValues', {
        'class' : 'bigButton',
        'style' : 'width:20%; margin-top:6%; margin-bottom:6%;',
        'type' : 'button',
        'value' : 'Dismiss'
    });

    document.getElementById('updateParameters').onclick = function(event){
        var i;
        if(document.getElementById('dialogueValues').checkValidity()){
            
            for(i=0; i<scales.length; i++){
                //commit
                scales[i][1] = parseFloat(document.getElementById('minfield'+i).value);
                scales[i][2] = parseFloat(document.getElementById('maxfield'+i).value);
                ODBSet(scales[i][4], scales[i][1]);
                ODBSet(scales[i][5], scales[i][2]);
            }
            fetchODB(); //pushes back to the parameter store

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


    for(key in ODB){
        if(ODB[key].deploy || ODB[key].USdeploy || ODB[key].DSdeploy){            
            for(subKey in window[key+'pointer'].dataBus[key]){
                JSONP.scalar[subKey] = {"TRIGREQ" : 1000*Math.random(), "dataRate" : 1000*Math.random()};
            }
        }
    }

    return JSONP;
    
}
//like fake scalars, but now thresholds:
function fakeThresholds(){

    var JSONP = {'parameters' : {'thresholds' : {} } },
        key, subKey;

    for(key in ODB){
        if(ODB[key].deploy || ODB[key].USdeploy || ODB[key].DSdeploy){
            for(subKey in window[key+'pointer'].dataBus[key] ){
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

    injectDOM('table', id+'table', id, {'class':'TTtab', 'style':'border-collapse:collapse'});
    injectDOM('colgroup', id+'colgroup', id+'table', {});
    for(i=0; i<split.length-1; i++){
        injectDOM('col', id+'colSpace'+i, id+'colgroup', {'span':keys.length+1});
        injectDOM('col', id+'col'+i, id+'colgroup', {'style':'border-left:1px solid white;', 'span':'1'});
    }


    if(tableTitle != ''){
        injectDOM('tr', id+'tableTitleRow', id+'table', {});
        injectDOM('td', id+'tableTitle', id+'tableTitleRow', {'innerHTML':tableTitle, 'colspan':(1+keys.length)*split.length});
    }

    injectDOM('tr', id+'tableHeaderRow', id+'table', {});
    for(k=0; k<split.length; k++){
        for(j=0; j<titles.length; j++){
            injectDOM('td', id+'headerCell'+j+'col'+k, id+'tableHeaderRow', {
                'style' : 'padding-left:'+( (j==0 && k!=0) ? 25:10 )+'px; padding-right:'+( (j==titles.length-1) ? 25:10 )+'px;',
                'innerHTML' : titles[j]
            });
        }
    }
    
    nContentRows = Math.max.apply(null, split);

    //build table:
    for(i=0; i<nContentRows; i++){
        //rows
        injectDOM('tr', id+'row'+i, id+'table', {});
        //cells
        for(j=0; j<titles.length*split.length; j++){
            injectDOM('td', id+'row'+i+'cell'+j, id+'row'+i, {
                'style' : 'padding:0px; padding-right:'+( (j%(titles.length+1)==0 && j!=0) ? 25:10 )+'px; padding-left:'+( (j%titles.length == 0 && j!=0) ? 25:10 )+'px'
            });
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
                    cellContent = data[objects[n]][keys[k]].toFixed(window.parameters.tooltipPrecision);
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
    injectDOM('div', 'tempDiv', 'body', {'class':'tempDialog'});
    var dialogue = document.getElementById('tempDiv');
    injectDOM('h2', 'dialogHeader', 'tempDiv', {
        'style' : 'position:relative; font:24px Orbitron; top:10px; margin-bottom:6%; margin-left:auto; margin-right:auto;',
        'innerHTML' : headline
    })

    //warning text
    injectDOM('p', 'warning', 'tempDiv', {'style':'padding: 1em; font-size:120%;', 'innerHTML':detailText});

    //center dialogue
    var width = document.getElementById('tempDiv').offsetWidth;
    document.getElementById('tempDiv').style.left = document.body.offsetWidth/2 - width/2;

    //insert submit & abort button if there's a function to excecute on confirm, otherwise just an acknowledge button
    if(confirmFunc){
        injectDOM('input', 'confirmChoice', 'tempDiv', {
            'class' : 'standardButton',
            'style' : 'width:auto; height:auto; padding:0.5em; margin-bottom:1em; margin-left:0px',
            'type' : 'button',
            'value' : 'Confirm'
        });

        document.getElementById('confirmChoice').onclick = function(event){

            confirmFunc();

            document.getElementById('tempDiv').style.opacity = 0;
            setTimeout(function(){
                var element = document.getElementById('tempDiv');
                element.parentNode.removeChild(element);            
            }, 500);

            rePaint();
        }
    }

    injectDOM('input', 'abortChoice', 'tempDiv', {
        'class' : 'standardButton',
        'style' : 'width:auto; height:auto; padding:0.5em; margin-bottom:1em',
        'type' : 'button',
        'value' : (confirmFunc == null) ? 'Dismiss' : 'Abort'
    });

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

//define function to fetch from JSONP service
//for the scalar service (and anything with the same hierarchy):
function parseResponse(dataWeGotViaJsonp){
    var key, subkey;
    for(key in dataWeGotViaJsonp){
        if (dataWeGotViaJsonp.hasOwnProperty(key)) {
            window.JSONPstore[key] = {};
            for(subkey in dataWeGotViaJsonp[key]){
                if(dataWeGotViaJsonp[key].hasOwnProperty(subkey)){
                    window.JSONPstore[key][subkey.toUpperCase()] = dataWeGotViaJsonp[key][subkey];
                }
            }
        }
    }
}

//similar function for the threshold service:
function parseThreshold(data){
    var key;
    if(data['parameters']['thresholds']){
        window.JSONPstore['thresholds'] = {};
        for(key in data['parameters']['thresholds']){
            window.JSONPstore['thresholds'][key.toUpperCase().slice(0,10)] = data['parameters']['thresholds'][key];
        }
    }
}