
//SHARC////////////////////////////////////////////////////////////////////////////////////////////////

//draw elliptical arc:
ellipse = function(context, centerX, centerY, horizRadius, startAngle, endAngle){
    context.save();
    context.translate(centerX, centerY);
    context.scale(1, 0.3);
    context.beginPath();
    context.arc(0, 0, horizRadius, 2*Math.PI - startAngle, 2*Math.PI - endAngle);
    context.restore();
    context.closePath();
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
fillAnnularSection = function(drawOption, context, centerX, centerY, innerRadius, outerRadius, startAngle, endAngle){

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
    if(drawOption == 'fill' || drawOption == 'both') context.fill();
    if(drawOption == 'stroke' || drawOption == 'both')context.stroke();

}

//DESCANT////////////////////////////////////////////////////////////////////////////////////////

hex = function(context, centerX, centerY, side, phi){

    var i;

    //center to vertex distance:
    var spoke = side / 2 / Math.sin(Math.PI/6);

    //find coords of 6 vertices relative to center:
    var x = [];
    var y = [];

    for(i=0; i<6; i++){
        x[i] = spoke*Math.cos(phi + i*Math.PI/3);
        y[i] = spoke*Math.sin(phi + i*Math.PI/3);

        //alert(x[i]+' '+y[i]);
    }

    //draw hexagon:
    context.save();
    context.translate(centerX, centerY);
    context.beginPath();
    context.moveTo(x[0], y[0]);
    for(i=1; i<7; i++){
        context.lineTo(x[i%6], y[i%6]);
    }
    context.restore();
    context.stroke();

}

whiteDetector = function(context, centerX, centerY, scale, phi, bkg){
    context.strokeStyle = '#999999';//'rgba(255,255,255,1)';
    context.save();
    context.translate(centerX, centerY);
    context.beginPath();
    context.moveTo(scale*41.5, scale*(71.9));
    context.lineTo(scale*(-41.5), scale*(71.9));
    context.lineTo(scale*(-93), 0);
    context.lineTo(scale*(-41.5), scale*(-79.6));
    context.lineTo(scale*41.5, scale*(-79.6));
    context.lineTo(scale*93, 0);
    context.closePath();
    context.restore();
    context.fill();
    if(bkg == 0)context.stroke();
}

redDetector = function(context, centerX, centerY, scale, phi, rotation, bkg){
    context.strokeStyle = '#999999'; //'rgba(255,0,0,1)'
    context.save();
    context.translate(centerX, centerY);
    context.rotate(rotation);
    context.beginPath();
    context.moveTo(scale*37.4, scale*(-87.1));
    context.lineTo(scale*(-51.6), scale*(-83.3));
    context.lineTo(scale*(-101.8), 0);
    context.lineTo(scale*(-51.6), scale*(83.3));
    context.lineTo(scale*37.4, scale*(87.1));
    context.lineTo(scale*73.1, 0);
    context.closePath();
    context.restore();
    context.fill();
    if(bkg == 0)context.stroke();
}

blueDetector = function(context, centerX, centerY, scale, phi, rotation, bkg){
    context.strokeStyle = '#999999';//'rgba(0,150,255,1)'
    context.save();
    context.translate(centerX, centerY);
    context.rotate(rotation);
    context.beginPath();
    context.moveTo(scale*52.6, scale*(-79.4));
    context.lineTo(scale*(-45.1), scale*(-79.4));
    context.lineTo(scale*(-97.6), 0);
    context.lineTo(scale*(-45.1), scale*(79.4));
    context.lineTo(scale*52.6, scale*(79.4));
    context.lineTo(scale*99.2, 0);
    context.closePath();
    context.restore();
    context.fill();
    if(bkg == 0)context.stroke();
}

greenLeftDetector = function(context, centerX, centerY, scale, phi, rotation, bkg){
    context.strokeStyle = '#999999';//'rgba(0,255,0,1)'
    context.save();
    context.translate(centerX, centerY);
    context.rotate(-1*Math.PI/2 + rotation);
    context.beginPath();
    context.moveTo(scale*41.5, scale*(-71.9));
    context.lineTo(scale*(-41.5), scale*(-71.9));
    context.lineTo(scale*(-93), 0);
    context.lineTo(scale*(-41.5), scale*(79.6));
    context.lineTo(scale*41.5, scale*(79.6));
    context.lineTo(scale*62.3, scale*47.6);
    context.closePath();
    context.restore();  
    context.fill();
    if(bkg == 0)context.stroke(); 
}

greenRightDetector = function(context, centerX, centerY, scale, phi, rotation, bkg){
    context.strokeStyle = '#999999';//'rgba(0,255,0,1)'
    context.save();
    context.translate(centerX, centerY);
    context.rotate(Math.PI/2 + rotation);
    context.beginPath();
    context.moveTo(scale*41.5, scale*(-71.9));
    context.lineTo(scale*(-41.5), scale*(-71.9));
    context.lineTo(scale*(-62.3), scale*47.6);
    context.lineTo(scale*(-41.5), scale*(79.6));
    context.lineTo(scale*41.5, scale*(79.6));
    context.lineTo(scale*93, 0);
    context.closePath();
    context.restore();   
    context.fill();
    if(bkg == 0)context.stroke();
}
//Color Scales///////////////////////////////////////////////////////////////////////////////////

//map [0,1] onto [#000000, #FF0000]
redScale = function(scale){
    var R = scale*255;
    return constructHexColor([R,0,0]);
}

//map [0,1] onto [#000000, #0000FF]
blueScale = function(scale){
    var B = scale*255;
    return constructHexColor([0,0,B]);
}

//map [0,1] onto [#000000, #00FF00]
greenScale = function(scale){
    var G = scale*255;
    return constructHexColor([0,G,0]);
}

colorScale = function(colors,scale){
    return constructHexColor([scale*(colors[3]-colors[0])+colors[0], scale*(colors[4]-colors[1])+colors[1], scale*(colors[5]-colors[2])+colors[2]]);
}

//map [0,1] onto black->purple->red->orange->yellow->white
scalepickr = function(scale, palette){
    //map scale onto [0,360]:
    var H = scale*300 / 60;
    if(H>5) H=5;
    if(H<0) H=0;
    var R, G, B;
    var start0, start1, start2, start3, start4, start5;
    if(palette == 'thermalScope'){
        start0 = [0,0,0];
        start1 = [0x5C,0,0xB8];
        start2 = [255,0,0];
        start3 = [255,0x66,0];
        start4 = [255,255,0];
        start5 = [255,255,255];
    } else if(palette == 'rainbow'){
        start0 = [255,0,0];
        start1 = [255,255,0];
        start2 = [0,255,0];
        start3 = [0,255,255];
        start4 = [0,0,255];
        start5 = [255,0,255];
        H = -1*(H-5);
    } else if(palette == 'twighlight'){
        start0 = [0,0,0];
        start1 = [0,0,0x52];
        start2 = [0xE6,0,0x5C];        
        start3 = [255,0,0];
        start4 = [255,0x66,0];
        start5 = [255,255,255];
    } else if (palette == 'thermalScope2'){
        start0 = [0,0,0];
        start1 = [0,0,0x52];
        start2 = [0xE6,0,0x5C];
        start3 = [255,255,0];        
        start4 = [255,0x66,0];
        start5 = [255,0,0];        
    }
    if(H>=0 && H<1){
        R = start0[0] + Math.round(H*(start1[0]-start0[0]));
        G = start0[1] + Math.round(H*(start1[1]-start0[1]));
        B = start0[2] + Math.round(H*(start1[2]-start0[2]));
    } else if(H>=1 && H<2){
        R = start1[0] + Math.round((H-1)*(start2[0]-start1[0]));
        G = start1[1] + Math.round((H-1)*(start2[1]-start1[1]));
        B = start1[2] + Math.round((H-1)*(start2[2]-start1[2]));
    } else if(H>=2 && H<3){
        R = start2[0] + Math.round((H-2)*(start3[0]-start2[0]));
        G = start1[1] + Math.round((H-2)*(start3[1]-start2[1]));
        B = start2[2] + Math.round((H-2)*(start3[2]-start2[2]));
    } else if(H>=3 && H<4){
        R = start3[0] + Math.round((H-3)*(start4[0]-start3[0]));
        G = start3[1] + Math.round((H-3)*(start4[1]-start3[1]));
        B = start3[2] + Math.round((H-3)*(start4[2]-start3[2]));
    } else if(H>=4 && H<=5){
        R = start4[0] + Math.round((H-4)*(start5[0]-start4[0]));
        G = start4[1] + Math.round((H-4)*(start5[1]-start4[1]));
        B = start4[2] + Math.round((H-4)*(start5[2]-start4[2]));  
    }

    return constructHexColor([R,G,B]);

}

//Misc///////////////////////////////////////////////////////////////////////////


function interpolateColor(oldColor, newColor, scale){
    var R, G, B;
    R = Math.round((newColor[0] - oldColor[0])*scale + oldColor[0]);
    G = Math.round((newColor[1] - oldColor[1])*scale + oldColor[1]);
    B = Math.round((newColor[2] - oldColor[2])*scale + oldColor[2]);

    return 'rgba('+R+','+G+','+B+',1)';
}

function roundBox(context, leftX, topY, width, height, cornerRadius){
    
    context.moveTo(leftX, topY+cornerRadius);
    context.beginPath();
    context.arc(leftX+cornerRadius, topY+cornerRadius, cornerRadius, Math.PI, 3*Math.PI/2);
    context.lineTo(leftX+width-cornerRadius,topY);
    context.arc(leftX+width-cornerRadius, topY+cornerRadius, cornerRadius, 3*Math.PI/2, 0);
    context.lineTo(leftX+width, topY+height-cornerRadius);
    context.arc(leftX+width-cornerRadius, topY+height-cornerRadius, cornerRadius, 0, Math.PI/2);
    context.lineTo(leftX + cornerRadius, topY+height);
    context.arc(leftX+cornerRadius, topY+height-cornerRadius, cornerRadius, Math.PI/2, Math.PI);
    context.closePath();
}

function strokePolygon(context, nSides, x0, y0, spoke, phi){
    var i;
    context.save();
    context.translate(x0, y0);
    context.rotate(phi);
    context.moveTo(0, -spoke);
    for(i=0; i<nSides; i++){
        context.rotate(2*Math.PI/nSides);
        context.lineTo(0, -spoke);
    }
    context.stroke();
    context.restore();
}

//take a hex color string '#012345' and parse it into [R,G,B]
function parseHexColor(color){
    var R, G, B;

    var number = String(color).slice(1,7)

    R = parseInt(number.slice(0,2), 16);
    G = parseInt(number.slice(2,4), 16);
    B = parseInt(number.slice(4,6), 16);

    return [R,G,B];
}

//invert the above function:
function constructHexColor(color){
    var R = Math.round(color[0]);
    var G = Math.round(color[1]);
    var B = Math.round(color[2]);

    R = R.toString(16);
    G = G.toString(16);
    B = B.toString(16);

    if(R.length == 1) R = '0'+R;
    if(G.length == 1) G = '0'+G;
    if(B.length == 1) B = '0'+B;

    return '#'+R+G+B;
}

//draw a nicer sidebar background
function tabBKG(canvasID, side){

    var canvas = document.getElementById(canvasID);
    var context = canvas.getContext('2d');

    var width = $(canvas).width();
    var height = $(canvas).height();
    var cornerRad = 20;
    var tailRad = 50;
    var lineWeight = 2;

    context.clearRect(0,0,width,height);

    if(side == 'left'){
        context.translate(width,0);
        context.scale(-1,1);   
    }

    context.fillStyle = '#4C4C4C';
    context.lineWidth = lineWeight;
    context.beginPath();
    context.moveTo(width,lineWeight);
    context.lineTo(cornerRad, lineWeight);
    context.arc(cornerRad+lineWeight, cornerRad+lineWeight, cornerRad, -Math.PI/2, -Math.PI, true);
    context.lineTo(lineWeight, height - cornerRad - tailRad);
    context.arc(cornerRad+lineWeight, height - tailRad - cornerRad, cornerRad, -Math.PI, Math.PI/2, true);
    context.lineTo(width - tailRad, height - tailRad);
    context.arc(width - tailRad, height, tailRad, -Math.PI/2, 0);
    context.closePath();
    context.fill();
    context.stroke();

}




