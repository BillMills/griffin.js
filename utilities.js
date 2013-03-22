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
    newElement.setAttribute('onclick', onclick);
    newElement.setAttribute('name', name);
    newElement.setAttribute('type', type);
    newElement.setAttribute('value', value);
    if(wrapperID == 'body')
        document.body.appendChild(newElement)
    else
        document.getElementById(wrapperID).appendChild(newElement);
    document.getElementById(id).innerHTML = content;
}


//summon a dialogue to change some parameter values.  mostly hardcoded for scale min/max, todo: generalize
function parameterDialogue(scales){
    var i;

    //insert div and title
    insertDOM('div', 'tempDiv', '', 'z-index:10; position:absolute; text-align:center; opacity:0; transition:opacity 0.5s; -moz-transition:opacity 0.5s; -webkit-transition:opacity 0.5s;', 'waffleplate', '', '', '');
    var dialogue = document.getElementById('tempDiv');
    insertDOM('h2', 'dialogHeader', '', 'position:relative; font:24px Orbitron; top:10px; margin-bottom:6%', 'tempDiv', '', 'Adjust Scale');

    //insert canvas
    insertDOM('canvas', 'dialogBKG', '', 'z-index:-10; position:absolute; top:0', 'tempDiv', '', '');
    var canvas = document.getElementById('dialogBKG');
    var context = canvas.getContext('2d');
    var width = 200*scales.length
    var height = 2*width/3
    canvas.setAttribute('width', width)
    canvas.setAttribute('height', height) 
    $('#dialogHeader').width(width)

    //draw background
    context.lineWidth = 5;
    context.strokeStyle = '#FFFFFF';
    context.fillStyle = 'rgba(0,0,0,0.8)';
    roundBox(context,5,5,width-10,height-10,10);
    context.fill();
    context.stroke();

    //center dialogue
    $('#tempDiv').css('left', ($('#waffleplate').width()/2 - width/2))

    //insert form fields
    insertDOM('form', 'dialogueValues', '', '', 'tempDiv', '', '');
    for(i=0; i<scales.length; i++){
        insertDOM('p', 'title'+i, '', 'font-size:16px; margin-top:3%;', 'tempDiv', '', scales[i][0]+'<br>');
        insertDOM('p', 'minlabel'+i, '', 'display:inline;', 'tempDiv', '', 'Minimum: ');
        insertDOM('input', 'minfield'+i, '', 'display:inline;', 'tempDiv', '', '', 'textbox', 'text', scales[i][1][window.subdetectorView])
        document.getElementById('minfield'+i).setAttribute('size', 6);
        insertDOM('p', 'minunit'+i, '', 'display:inline; margin-right:3%', 'tempDiv', '', window.parameters.subdetectorUnit[window.subdetectorView]);
        insertDOM('p', 'maxlabel'+i, '', 'display:inline', 'tempDiv', '', 'Maximum: ');
        insertDOM('input', 'maxfield'+i, '', 'display:inline;', 'tempDiv', '', '', 'textbox', 'text', scales[i][2][window.subdetectorView])
        document.getElementById('maxfield'+i).setAttribute('size', 6);
        insertDOM('p', 'maxunit'+i, '', 'display:inline;', 'tempDiv', '', window.parameters.subdetectorUnit[window.subdetectorView] + '<br>');
    }

    //insert submit button
    insertDOM('input', 'updateParameters', 'bigButton', 'width:20%; margin-right:2%; margin-top:6%', 'tempDiv', '', '', '', 'button', 'Commit')
    insertDOM('input', 'dismiss', 'bigButton', 'width:20%; margin-top:6%', 'tempDiv', '', '', '', 'button', 'Dismiss')

    document.getElementById('updateParameters').onclick = function(event){
        var i;
        
        for(i=0; i<scales.length; i++){
            scales[i][1][window.subdetectorView] = parseFloat(document.getElementById('minfield'+i).value);
            scales[i][2][window.subdetectorView] = parseFloat(document.getElementById('maxfield'+i).value);
        }
        document.getElementById('tempDiv').style.opacity = 0;
        setTimeout(function(){
            var element = document.getElementById('tempDiv');
            element.parentNode.removeChild(element);            
        }, 500);
        forceUpdate();
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



