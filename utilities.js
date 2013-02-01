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

    thing.draw(frame);
    if(frame < thing.nFrames){
        frame++;
        setTimeout(function(){animate(thing, frame)},thing.duration/thing.FPS*1000);
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

//draw elliptical arc:
ellipse = function(context, centerX, centerY, horizRadius, startAngle, endAngle){
    context.save();
    context.translate(centerX, centerY);
    context.scale(1, 0.3);
    //context.beginPath();
    //recall the internet counts its angles backwards :(
    context.arc(0, 0, horizRadius, 2*Math.PI - startAngle, 2*Math.PI - endAngle);
    context.restore();
    context.stroke();
}

//draw spokes from center ellipse to outer ellipse
ellipseSpoke = function(context, centerX, centerY, horizRadiusInner, horizRadiusOuter, phase, nSpokes, spokeNumber){

    //angle between spokes
    var sectionArc = 2*Math.PI / nSpokes;
    //angle of this spoke; recall the internet counts its angles backwards :(
    var phi = 2*Math.PI - (phase + spokeNumber*sectionArc);

    context.save();
    context.translate(centerX, centerY);
    context.scale(1, 0.3);
    //context.beginPath();
    context.moveTo(horizRadiusInner*Math.cos(phi), horizRadiusInner*Math.sin(phi));
    context.lineTo(horizRadiusOuter*Math.cos(phi), horizRadiusOuter*Math.sin(phi));
    context.restore();
    context.stroke();

}

//color in a particular annular section
fillAnnularSection = function(context, centerX, centerY, innerRadius, outerRadius, startAngle, endAngle){

    context.save();
    context.translate(centerX, centerY);
    context.scale(1, 0.3);
    context.beginPath();
    context.moveTo(innerRadius*Math.cos(2*Math.PI - startAngle), innerRadius*Math.sin(2*Math.PI - startAngle));
    context.arc(0, 0, innerRadius, 2*Math.PI - startAngle, 2*Math.PI - endAngle, true);
    context.lineTo(outerRadius*Math.cos(2*Math.PI - endAngle), outerRadius*Math.sin(2*Math.PI - endAngle));
    context.arc(0, 0, outerRadius, 2*Math.PI - endAngle, 2*Math.PI - startAngle, false);
    context.closePath();
    context.restore();
    context.fill();

}

//map [0,1] onto a rainbow:
rainbow = function(scale){
    //map scale onto [0,360]:
    var H = scale*360 / 60;
    var R, G, B;
    if(H>=0 && H<1){
        R = 255;
        G = Math.round(255 - 255*Math.abs(H%2 - 1));
        B = 0;
    } else if(H>=1 && H<2){
        R = Math.round(255 - 255*Math.abs(H%2 - 1));
        G = 255;
        B = 0;
    } else if(H>=2 && H<3){
        R = 0;
        G = 255;
        B = Math.round(255 - 255*Math.abs(H%2 - 1));
    } else if(H>=3 && H<4){
        R = 0;
        G = Math.round(255 - 255*Math.abs(H%2 - 1));
        B = 255;
    } else if(H>=4 && H<5){
        R = Math.round(255 - 255*Math.abs(H%2 - 1));
        G = 0;
        B = 255;
    } else if(H>=5 && H<6){
        R = 255;
        G = 0;
        B = Math.round(255 - 255*Math.abs(H%2 - 1));
    } 
    return [R,G,B];

}