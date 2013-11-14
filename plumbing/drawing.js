//SHARC////////////////////////////////////////////////////////////
//SHARC assets: x0, y0 = center of shape
//Quad back summary - azimuthal segments, colors sorted azimuthally
quadBack = function(context, x0, y0, innerRad, outerRad, squish, colors, TT){
    
    var angularStep = (2*Math.PI)/colors.length;

    for(i=0; i<colors.length; i++){
        azimuthalSegment(context, x0, y0, innerRad, outerRad, angularStep, Math.PI-(i+1)*angularStep, squish, colors[i], TT);
    }

}

//draws a wedge shaped segment
azimuthalSegment = function(context, x0, y0, innerRad, outerRad, arc, orientation, squish, color, TT){
    context.fillStyle = (color==0xDEADBEEF) ? context.createPattern(window.parameters.warningFill, 'repeat') : color;
    context.strokeStyle = ( (TT) ? '#123456' : '#999999' );

    context.save();
    context.translate(x0, y0);
    context.scale(1,squish);
    context.rotate(-orientation);
    context.beginPath();
    context.arc(0,0,innerRad, 0, -arc, true);
    context.lineTo(outerRad*Math.cos(arc), -outerRad*Math.sin(arc));
    context.arc(0,0,outerRad, -arc, 0, false);
    context.closePath();
    context.fill();
    context.stroke();
    context.restore();
}

//Quad front summary - radial segments.  Colors should be sorted first by array position (ie quadrant), then by smallest to largest radius.
quadFront = function(context, x0, y0, innerRad, outerRad, squish, colors, TT){

    var radStep = (outerRad - innerRad)/4;

    for(i=0; i<colors.length; i++){
        annularSegment(context, x0, y0, innerRad+(i%4)*radStep, innerRad + ((i%4)+1)*radStep, Math.PI/2, Math.PI/2*Math.floor(i/4), squish, colors[i], TT);
    }

}

//draws a macaroni-shaped segment that extends <arc> radians CCW from angle <orientation>
annularSegment = function(context, x0, y0, innerRad, outerRad, arc, orientation, squish, color, TT){
    context.fillStyle = (color==0xDEADBEEF) ? context.createPattern(window.parameters.warningFill, 'repeat') : color;
    context.strokeStyle = ( (TT) ? '#123456' : '#999999' );

    context.save();
    context.translate(x0, y0);
    context.scale(-1,squish);
    context.rotate(-orientation);
    context.beginPath();
    context.arc(0,0,innerRad, 0, -arc, true);
    context.lineTo(outerRad*Math.cos(arc), -outerRad*Math.sin(arc));
    context.arc(0,0,outerRad, -arc, 0, false);
    context.closePath();
    context.fill();
    context.stroke();
    context.restore();

}

//stack of four horizontal parallelograms for summary view; colors stack bottom to top:
horizStack = function(context, X0, Y0, width, height, colors, pitch, TT){
    var i, y0, x0, dX, dY, stripWidth;

    context.strokeStyle = ( (TT) ? '#123456' : '#999999' );

    //for the pads:
    if(colors.length==1){
        horizPara(context, X0, Y0, width, height, colors[0], pitch, TT);  
        return;
    }

    if(pitch == 'h'){
        //center of first strip:
        y0 = Y0 + 1.5*height/4,
        x0 = X0 - 1.5*height/4*Math.tan(Math.PI/6),
        dX = height/4*Math.tan(Math.PI/6),
        dY = height/4;
        for(i=0; i<4; i++){
            horizPara(context, x0+i*dX, y0-i*dY, width - 0.75*height*Math.tan(Math.PI/6), height/4, colors[i], pitch, TT );
        }
    } else {
        stripWidth = (height-width*Math.tan(Math.PI/6))/4;
        x0 = X0;
        y0 = Y0 + 1.5*stripWidth;
        dY = stripWidth;
        dX = 0;
        for(i=0; i<4; i++){
            horizPara(context, x0+i*dX, y0-i*dY, width, (height-width*Math.tan(Math.PI/6))/4+width*Math.tan(Math.PI/6), colors[i], pitch, TT );
        }
    }



}

//paralellogram with horizontal stripes - pitch = 'h' for top and bottom parallel to x or 'v' for left and right parallel to y
horizPara = function(context, x0, y0, width, height, color, pitch, TT){

    var theta = Math.PI/6,
        yLength, xLength,
        //cx, cy coords of bottom left corner
        cx = x0 - width/2,
        cy = y0 + height/2;

    context.fillStyle = (color==0xDEADBEEF) ? context.createPattern(window.parameters.warningFill, 'repeat') : color;
    context.beginPath();
    context.moveTo(cx,cy);
    if(pitch == 'h'){
        yLength = height / Math.cos(theta);
        xLength = width - height*Math.tan(theta);
        context.lineTo(cx + height*Math.tan(theta), cy - height);
        context.lineTo(cx+width, cy-height);
        context.lineTo(cx+xLength, cy);
    } else{
        xLength = width / Math.cos(theta);
        yLength = height - width*Math.tan(theta);
        context.lineTo(cx, cy-yLength);
        context.lineTo(cx+width, cy-height);
        context.lineTo(cx+width, cy - (height-yLength) )
    }
    context.closePath();
    context.fill();
    context.stroke();

}

//stack of four vertical parallelograms for summary view; colors stack left to right:
vertStack = function(context, X0, Y0, width, height, colors, pitch, TT){
    var i, y0, x0, dX, dY, stripWidth;

    context.strokeStyle = ( (TT) ? '#123456' : '#999999' );

    //for the pads:
    if(colors.length==1){
        vertPara(context, X0, Y0, width, height, colors[0], pitch, TT);  
        return;
    }

    if(pitch == 'h'){
        //center of first strip:
        y0 = Y0,
        x0 = X0 - 1.5*(width - height*Math.tan(Math.PI/6))/4,
        dX = (width - height*Math.tan(Math.PI/6))/4,
        dY = 0;
        for(i=0; i<4; i++){
            vertPara(context, x0+i*dX, y0, (width + 3*height*Math.tan(Math.PI/6))/4, height, colors[i], pitch, TT );
        }
    } else {
        stripWidth = width/4/Math.cos(Math.PI/6);
        dY = stripWidth*Math.sin(Math.PI/6);
        dX = width/4;
        x0 = X0 - 1.5*dX;
        y0 = Y0 + 1.5*dY;
        for(i=0; i<4; i++){
            vertPara(context, x0+i*dX, y0-i*dY, width/4, (height-0.75*width*Math.tan(Math.PI/6)), colors[i], pitch, TT );
        }
    }



}

//paralellogram with vertical stripes
vertPara = function(context, x0, y0, width, height, color, pitch, TT){

    var theta = Math.PI/6,
        yLength, xLength,
        //cx, cy coords of bottom left corner
        cx = x0 - width/2,
        cy = y0 + height/2;

    context.fillStyle = (color==0xDEADBEEF) ? context.createPattern(window.parameters.warningFill, 'repeat') : color;
    context.beginPath();
    context.moveTo(cx,cy);
    if(pitch == 'h'){
        yLength = height / Math.cos(theta);
        xLength = width - height*Math.tan(theta);
        context.lineTo(cx + height*Math.tan(theta), cy - height);
        context.lineTo(cx+width, cy-height);
        context.lineTo(cx+xLength, cy);
    } else{
        xLength = width / Math.cos(theta);
        yLength = height - width*Math.tan(theta);
        context.lineTo(cx, cy-yLength);
        context.lineTo(cx+width, cy-height);
        context.lineTo(cx+width, cy - (height-yLength) )
    }
    context.closePath();
    context.fill();
    context.stroke();

}

radialQuadrant = function(context, x0, y0, innerRad, outerRad, arc, orientation, colors, TT){
    var i,
        segments = colors.length,
        radStep = (outerRad - innerRad) / segments;

    context.save();
    context.translate(x0,y0);
    context.rotate(orientation);

    //outline cell or suppress antialiasing, as appropriate
    if(TT)
        context.strokeStyle = '#123456';
    else
        context.strokeStyle = '#999999';

    for(i=0; i<segments; i++){
        context.fillStyle = colors[i];
        context.beginPath();
        context.arc(0,0,innerRad + i*radStep, -arc/2, arc/2, false);
        context.arc(0,0,innerRad + (i+1)*radStep, arc/2, -arc/2, true);
        context.closePath();
        context.fill();
        context.stroke();
    }

    context.restore();

}

azimuthalQuadrant = function(context, x0, y0, innerRad, outerRad, arc, orientation, colors, TT){
    var i,
        segments = colors.length,
        angleStep = arc / segments;

    context.save();
    context.translate(x0,y0);
    context.rotate(orientation);

    //outline cell or suppress antialiasing, as appropriate
    if(TT)
        context.strokeStyle = '#123456';
    else
        context.strokeStyle = '#999999';

    for(i=0; i<segments; i++){
        context.fillStyle = colors[i];
        context.beginPath();
        context.arc(0,0,innerRad, -arc/2 + i*angleStep, -arc/2 + (i+1)*angleStep  , false);
        context.arc(0,0,outerRad, -arc/2 + (i+1)*angleStep, -arc/2 + i*angleStep, true);
        context.closePath();
        context.fill();
        context.stroke();
    }

    context.restore();

}

boxFront = function(context, x0,y0, height, width, colors, TT){
    var i,
        nStrips = colors.length,
        stripWidth = height/nStrips;

    //outline cell or suppress antialiasing, as appropriate
    if(TT)
        context.strokeStyle = '#123456';
    else
        context.strokeStyle = '#999999';

    for(i=0; i<nStrips; i++){
        context.fillStyle = (colors[i]==0xDEADBEEF) ? context.createPattern(window.parameters.warningFill, 'repeat') : colors[i];
        context.fillRect(x0, y0+i*stripWidth, width, stripWidth);
        context.strokeRect(x0, y0+i*stripWidth, width, stripWidth);
    }
}

boxBack = function(context, x0,y0, height, width, colors, TT){
    var i,
        nStrips = colors.length,
        stripWidth = width/nStrips;

    //outline cell or suppress antialiasing, as appropriate
    if(TT)
        context.strokeStyle = '#123456';
    else
        context.strokeStyle = '#999999';

    for(i=0; i<nStrips; i++){
        context.fillStyle = (colors[i]==0xDEADBEEF) ? context.createPattern(window.parameters.warningFill, 'repeat') : colors[i];
        context.fillRect(x0+i*stripWidth, y0, stripWidth, height);
        context.strokeRect(x0+i*stripWidth, y0, stripWidth, height);
    }
}

padSummaries = function(context, x0, y0, scale, colors, TT){

    //outline cell or suppress antialiasing, as appropriate
    if(TT)
        context.strokeStyle = '#123456';
    else
        context.strokeStyle = '#999999';   

    context.fillStyle = colors[0];
    context.fillRect(x0-1.5*scale, y0-scale/2, scale, scale);
    context.strokeRect(x0-1.5*scale, y0-scale/2, scale, scale);

    context.fillStyle = colors[1];
    context.fillRect(x0+0.5*scale, y0-scale/2, scale, scale);
    context.strokeRect(x0+0.5*scale, y0-scale/2, scale, scale);    

}

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

//map [0,1] onto various color scales
scalepickr = function(scale, palette){
    //map scale onto [0,360]:
    var H = scale*300 / 60;
    if(H>5) H=5;
    if(H<0) H=0;
    var R, G, B;
    var start0, start1, start2, start3, start4, start5;
    if (palette == 'Sunset'){
        start0 = [0,0,0];
        start1 = [0,0,0x52];
        start2 = [0xE6,0,0x5C];
        start3 = [255,255,0];        
        start4 = [255,0x66,0];
        start5 = [255,0,0];        
    } else if (palette == 'ROOT Rainbow'){
        start0 = [0xFF,0x00,0x00];
        start1 = [0xFF,0xFF,0x00];
        start2 = [0x00,0xFF,0x00];
        start3 = [0x00,0xFF,0xFF];
        start4 = [0x00,0x00,0xFF];
        start5 = [0x66,0x00,0xCC];
        H = -1*(H-5);
    } else if (palette == 'Greyscale'){
        start0 = [0x00,0x00,0x00];
        start1 = [0x22,0x22,0x22];
        start2 = [0x55,0x55,0x55];
        start3 = [0x88,0x88,0x88];        
        start4 = [0xBB,0xBB,0xBB];
        start5 = [0xFF,0xFF,0xFF];
    } else if (palette == 'Red Scale'){
        start0 = [0x00,0x00,0x00];
        start1 = [0x33,0x00,0x00];
        start2 = [0x66,0x00,0x00];
        start3 = [0x99,0x00,0x00];
        start4 = [0xCC,0x00,0x00];
        start5 = [0xFF,0x00,0x00];
    } else if (palette == 'Mayfair'){
        start0 = [0x1E,0x4B,0x0F];
        start1 = [0x0E,0xBE,0x57];
        start2 = [0xE4,0xAB,0x33];
        start3 = [0xEC,0x95,0xF7];
        start4 = [0x86,0x19,0x4A];
        start5 = [0xFF,0x10,0x10];
    } else if (palette == 'Test'){
        start0 = [0x5E,0x1F,0x14];
        start1 = [0x74,0x4D,0x3E];
        start2 = [0x9D,0x47,0x05];
        start3 = [0xDF,0x67,0x19];
        start4 = [0xFE,0x83,0x54];
        start5 = [0x251,0x15,0x29];
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
        G = start2[1] + Math.round((H-2)*(start3[1]-start2[1]));
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

    if(oldColor == 0xDEADBEEF || newColor == 0xDEADBEEF) return 0xDEADBEEF;

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

    if(color==0xDEADBEEF) return 0xDEADBEEF
        
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
/*
//draw a nicer sidebar background
function tabBKG(canvasID, side){

    var canvas = document.getElementById(canvasID);
    var context = canvas.getContext('2d');

    var width = $(canvas).width();
    var height = $(canvas).height();
    //console.log(canvasID + ': ' + height)
    var cornerRad = 20;
    var tailRad = 50;
    var lineWeight = 2;

    context.clearRect(0,0,width,height);

    if(side == 'left'){
        context.save()
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

    if(side== 'left'){
        context.restore();
    }

}
*/
//atom spinner:
function drawSpinner(canvasID, label){
    
    var canvas = document.getElementById(canvasID);
    var context = canvas.getContext('2d');
    var string = (label) ? label : 'LOADING';

        $('#spinner').css('left', window.innerWidth/2 - 100);
        $('#spinner').css('top', window.innerHeight/2 - 100);

    context.lineWidth = 5;
    context.strokeStyle = '#FFFFFF';
    context.fillStyle = 'rgba(0,0,0,0.7)';
    roundBox(context, 5, 5, 190, 190, 5);
    context.lineWidth = 1;
    context.fill();
    context.stroke();

    context.fillStyle = '#FFFFFF';
    context.font = '16px Arial'
    context.fillText(string, 100-context.measureText(string).width/2, 145);
    window.nProtons = 0;
    window.nNucleons = 0;

/*
    window.spinLoop = setInterval(function(){
        context = document.getElementById('spinner').getContext('2d');

        //choose proton or neutron:
        var nucleon = (Math.random() < 0.5) ? 'p' : 'n';
        window.nNucleons++;
        if(nucleon == 'p') window.nProtons++;
        //choose position on canvas
        var radius = Math.random()*15;
        var phi = Math.random()*Math.PI*2;

        //draw:
        context.strokeStyle = '#FFFFFF';
        context.fillStyle = (nucleon == 'p') ? '#FF0000' : '#0000FF';
        context.beginPath();
        context.arc(100+radius*Math.cos(phi), 100+radius*Math.sin(phi), 5, 0, Math.PI*2);
        context.closePath();
        context.fill();
        context.stroke();

        context.clearRect(20,20, 160, 55);
        context.fillStyle = 'rgba(0,0,0,0.7)'
        context.fillRect(20,20, 160, 55);
        context.fillStyle = '#FFFFFF';
        context.fillText('Z = '+window.nProtons, 70-context.measureText('Z = '+window.nProtons).width/2, 70);
        context.fillText('A = '+window.nNucleons, 130-context.measureText('N = '+window.nProtons).width/2, 70);

    }, 3);
*/    
}

function curveText(text, context, x0, y0, rad, startAngle){
    var textWidth = context.measureText(text).width,
        charRotation = startAngle,
        character, charWidth, nextChar, nextWidth, bothWidth, kern, extraRotation, charSegment;

    for (var i=0, l=text.length; i<l; i++) {
        character = nextChar || text[i];
        charWidth = nextWidth || context.measureText(character).width;

        // Rotate so the letter base makes a circle segment instead of a tangent
        extraRotation = (Math.PI/2) - Math.acos((charWidth/2) / rad);

        context.save();
        context.translate(x0, y0);
        context.rotate(charRotation);
        context.translate(0, -rad);
        context.rotate(extraRotation);
        context.fillText(character,0,0);
        context.restore();

        nextChar = text[i+1] || '';
        nextWidth = context.measureText(nextChar).width;

        bothWidth = context.measureText(character+nextChar).width;
        kern = bothWidth - charWidth - nextWidth;

        charSegment = (charWidth+kern) / textWidth; // percent of total text size this takes up
        charRotation += charSegment * (context.measureText(text).width/rad);
    }           
}

function arrow(context, x0, y0, x1, y1, headScale){
    context.beginPath();
    context.moveTo(x0,y0);
    context.lineTo(x1,y1);

    context.save();
    context.translate(x1, y1);
    context.rotate(Math.atan((x1-x0)/(y1-y0)));
    context.moveTo(-headScale, headScale);
    context.lineTo(0,0);
    context.lineTo(headScale, headScale);
    context.restore();
}

function closeX(context, x0, y0, radius){
    context.strokeStyle = '#FFFFFF';
    context.fillStyle = '#FF0000';
    context.lineWidth = 1;

    context.beginPath();
    context.arc(x0, y0, radius, 0, Math.PI*2, true);
    context.closePath();
    context.fill();
    context.stroke();

    context.beginPath();
    context.lineWidth = 1;
    context.moveTo(x0 - 0.4*radius, y0 - 0.4*radius);
    context.lineTo(x0 + 0.4*radius, y0 + 0.4*radius);
    context.stroke();
    
    context.moveTo(x0 + 0.4*radius, y0 - 0.4*radius);
    context.lineTo(x0 - 0.4*radius, y0 + 0.4*radius);
    context.stroke();
}

//draws a digit like on an old digital clock.  cells is an array describing which cells
//are lit, indexed 0-5 around the edge starting on top, and 6 for the middle bar.
function digitalDigit(cells, context, height, x0, y0){

    var cellWidth = 0.05*height,
        width = 0.5*height,
        cellHeight = 0.5*height;

    context.save();
    context.setTransform(1, -Math.tan(Math.PI/12), 0, 1, 0, 0);
    context.rotate(Math.tan(Math.PI/12));

    if(cells[0]){
        context.beginPath();
        context.moveTo(x0+cellWidth, y0);
        context.lineTo(x0+cellWidth+width, y0);
        context.lineTo(x0+width, y0+cellWidth);
        context.lineTo(x0+2*cellWidth, y0+cellWidth);
        context.closePath();
        context.fill();
    }

    if(cells[1]){
        context.beginPath();
        context.moveTo(x0+width+2*cellWidth, y0+cellWidth);
        context.lineTo(x0+width+2*cellWidth, y0+cellWidth+cellHeight);
        context.lineTo(x0+width+cellWidth, y0+cellHeight);
        context.lineTo(x0+width+cellWidth, y0+2*cellWidth);
        context.closePath();
        context.fill();
    }

    if(cells[2]){
        context.beginPath();
        context.moveTo(x0+width+2*cellWidth, y0+3*cellWidth+cellHeight);
        context.lineTo(x0+width+2*cellWidth, y0+3*cellWidth+2*cellHeight);
        context.lineTo(x0+width+cellWidth, y0+2*cellWidth+2*cellHeight);
        context.lineTo(x0+width+cellWidth, y0+4*cellWidth+cellHeight);     
        context.closePath();
        context.fill();   
    }

    if(cells[3]){
        context.beginPath();
        context.moveTo(x0+cellWidth+width, y0+4*cellWidth+2*cellHeight);
        context.lineTo(x0+cellWidth, y0+4*cellWidth+2*cellHeight);
        context.lineTo(x0+2*cellWidth, y0+3*cellWidth+2*cellHeight);
        context.lineTo(x0+width, y0+3*cellWidth+2*cellHeight);
        context.closePath();
        context.fill();
    }

    if(cells[4]){
        context.beginPath();
        context.moveTo(x0, y0+3*cellWidth+cellHeight);
        context.lineTo(x0, y0+3*cellWidth+2*cellHeight);
        context.lineTo(x0+cellWidth, y0+2*cellWidth+2*cellHeight);
        context.lineTo(x0+cellWidth, y0+4*cellWidth+cellHeight);
        context.closePath();
        context.fill();
    }

    if(cells[5]){
        context.beginPath();
        context.moveTo(x0, y0+cellWidth+cellHeight);
        context.lineTo(x0, y0+cellWidth);
        context.lineTo(x0+cellWidth, y0+2*cellWidth);
        context.lineTo(x0+cellWidth, y0+cellHeight);
        context.closePath();
        context.fill();
    }

    if(cells[6]){
        context.beginPath();
        context.moveTo(x0+cellWidth, y0+2*cellWidth+cellHeight);
        context.lineTo(x0+2*cellWidth, y0+1.5*cellWidth+cellHeight);
        context.lineTo(x0+width, y0+1.5*cellWidth+cellHeight);
        context.lineTo(x0+width+cellWidth, y0+2*cellWidth+cellHeight);
        context.lineTo(x0+width, y0+2.5*cellWidth+cellHeight);
        context.lineTo(x0+2*cellWidth, y0+2.5*cellWidth+cellHeight);
        context.closePath();
        context.fill();
    }

    context.restore();

}

//draw a flow-chart like branch
//    |         x0, y0
//    ---       
//      |       
//  ----------  x1, y1
//  |  |  |  |  combLength
//context == context to draw in
//combColors == array containing color of each comb end; length = number of comb tines (4 in ascii art above)
//combWidth == width of base of comb in px
//combLength length of tines
//branchColor == color of 3 branch segments and comb spine
//x0, y0 == coordinates of branch root
//x1, y1 == coordinates of branch / comb join
function drawBranch(context, combColors, combWidth, combLength, branchColor, x0, y0, x1, y1){

    var nTine = combColors.length,
        tineSpacing = combWidth / (nTine-1),
        branchHeight = y1-y0;
        branchWidth = x1-x0;
        i;

    //draw branch and spine of comb:
    context.strokeStyle = branchColor;
    context.beginPath();
    context.moveTo(x0, y0);
    context.lineTo(x0, y0 + branchHeight/2);
    context.lineTo(x0 + branchWidth, y0 + branchHeight/2);
    context.lineTo(x0 + branchWidth, y0 + branchHeight);
    context.moveTo(x0 + branchWidth - combWidth / 2 - parseFloat(context.lineWidth)/2, y0 + branchHeight);
    context.lineTo(x0 + branchWidth + combWidth / 2 + parseFloat(context.lineWidth)/2, y0 + branchHeight);
    context.stroke();

    //draw tines
    for(i=0; i<nTine; i++){
        context.strokeStyle = combColors[i];
        context.beginPath();
        context.moveTo(x0 + branchWidth - combWidth / 2 + i*tineSpacing, y0 + branchHeight + parseFloat(context.lineWidth)/2);
        context.lineTo(x0 + branchWidth - combWidth / 2 + i*tineSpacing, y0 + branchHeight + combLength);
        context.stroke();
    }
}
