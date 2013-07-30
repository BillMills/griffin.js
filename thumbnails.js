
function thumbnail(canvasID, left, right, color){
	var canvas = document.getElementById(canvasID);
	var context = canvas.getContext('2d');

	var width = canvas.width;
	var height = canvas.height;

	window.width = width;
	window.height = height;

	context.clearRect(0,0,width,height);
	context.lineWidth = 1;

	var title = '';

	context.strokeStyle = color;
	context.fillStyle = color;

	//GRIFFIN options
	if(left == 'US SCEPTAR' && right == 'DS SCEPTAR'){
		sceptar(context, width/3, height*0.4, height*0.2);
		sceptar(context, 2*width/3, height*0.4, height*0.2);
		title = 'USSC + DSSC';
	} else if(left == 'US SCEPTAR' && right == 'ZDS'){
		sceptar(context, width/3, height*0.4, height*0.2);
		zds(context, 2/3*width, 0.4*height, 0.18*height);
		title = 'USSC + ZDS';
	} else if(left == 'PACES' && right == 'DS SCEPTAR'){
		paces(context, width/3, height*0.4, height*0.15, height*0.05);
		sceptar(context, 2*width/3, height*0.4, height*0.2);
		title = 'PACES + SCEPTAR';
	} else if(left == 'PACES' && right == 'ZDS'){
		paces(context, width/3, height*0.4, height*0.15, height*0.05);
		zds(context, 2/3*width, 0.4*height, 0.18*height);
		title = 'PACES + ZDS';
	} else if(left == 'SPICE' && right == 'ZDS'){
		spice(context, width/3, height*0.4, height*0.2);
		zds(context, 2/3*width, 0.4*height, 0.18*height);
		title = 'SPICE + ZDS';
	} else if(left == 'SPICE' && right == 'DS SCEPTAR'){
		spice(context, width/3, height*0.4, height*0.2);
		sceptar(context, 2*width/3, height*0.4, height*0.2);
		title = 'SPICE + DSSC';
	} else if(left == 'GRIFFIN' && right == 'none'){
		griffin(context, width*0.5 - imageObj.width/imageObj.height*context.canvas.height*0.6/2, height*0.1, color);
		title = 'GRIFFIN Standalone';	
	} else if(left == 'GRIFFIN' && right == 'DESCANT'){
		griffin(context, width*0.28 - imageObj.width/imageObj.height*context.canvas.height*0.6/2, height*0.1, color);
		descant(context, width*0.68, height*0.4, height*0.1 )
		title = 'GRIFFIN + DESCANT'
	} else if(left == 'GRIFFIN' && right == 'DANTE'){
		griffin(context, width*0.3 - imageObj.width/imageObj.height*context.canvas.height*0.6/2, height*0.1, color);
		dante(context, width*0.7, height*0.4, height*0.2, color);
		title = 'GRIFFIN + DANTE';
	} else if(left == 'GRIFFIN' && right == 'SPICE'){
		griffin(context, width*0.28 - imageObj.width/imageObj.height*context.canvas.height*0.6/2, height*0.1, color);
		spice(context, width*0.68, height*0.4, height*0.2);
		title = 'GRIFFIN + SPICE';
	}

	//TIGRESS options
	if(left == 'BAMBINO' && right == 'solo'){
		title = 'BAMBINO';
		bambino(context, width*0.45, width*0.55, height/3, height*0.6, height*0.12);	
	} else if(right == 'BAMBINO' && left == 'none'){
		title = 'DS BAMBINO';
		bambino(context, width*0.45, width*0.55, height/3, height*0.6, height*0.12);		
	} else if(left == 'BAMBINO' && right == 'BAMBINO'){
		title = 'US + DS BAMBINO';
		bambino(context, width*0.28, width*0.38, height/3, height*0.6, height*0.12);
		bambino(context, width*0.62, width*0.72, height/3, height*0.6, height*0.12);
	} else if(left == 'SHARC' && right == 'none'){
		title = 'SHARC';
		sharc(context, width/2, height*0.45, width*0.3, height*0.7);	
	} else if(left == 'SHARC' && right == 'services'){
		title = 'SHARC Services';
		sharc(context, width/2, height*0.45, width*0.3, height*0.7, document.getElementById('Tdsl1canv').disabled);	
	} else if(left == 'SPICE' && right == 'none'){
		spice(context, width*0.5, height*0.45, height*0.2);
		title = 'SPICE';
	} else if(left == 'TIPwall' && right == 'none'){
		tipWall(context, width/2, height*0.45, height/2);
		title = 'TIP Wall';
	} else if(left == 'TIPball' && right == 'none'){
		tipBall(context, width/2, height/2, height*0.25);
		title = 'TIP Ball';
	} else if(left == 'TIGRESS' && right == 'none'){
		tigress(context, width/2, height*0.45, Math.round(height*0.25));
		title = 'TIGRESS';
	} else if(left == 'TIGRESS' && right == 'SHARC'){
		tigress(context, width*0.32, height*0.45, Math.round(height*0.25));
		sharc(context, width*0.7, height*0.45, width*0.3, height*0.7);
		title = 'TIGRESS + SHARC';
	} else if(left == 'TIGRESS' && right == 'DESCANT'){
		tigress(context, width*0.28, height*0.45, Math.round(height*0.25));
		descant(context, width*0.68,height*0.4, height*0.1 );
		title = 'TIGRESS + DESCANT';
	} else if(left == 'TIGRESS' && right == 'all'){
		tigress(context, width*0.2, height*0.45, Math.round(height*0.25));
		sharc(context, width*0.5, height*0.45, width*0.3, height*0.7);
		descant(context, width*0.8,height*0.4, height*0.1 );
		context.font = '14px Raleway';
		title = 'TIGRESS + SHARC + DESCANT';
	} else if(left == 'TIGRESS' && right == 'SPICE'){
		tigress(context, width*0.28, height*0.45, Math.round(height*0.25));
		spice(context, width*0.68, height*0.45, height*0.2);
		title = 'TIGRESS + SPICE';
	} else if(left == 'beamdump' && right == 'none'){
		beamdump(context, width/2, height*0.45, height*0.4)
		title = 'Beamdump Scintilator';
	}

	//standalone options
	if(left == 'HPGe' && right == 'none'){
		tigress(context, width/2, height*0.45, Math.round(height*0.25));
		title = 'HPGe';		
	} else if(left == 'DESCANT' && right=='none'){
		descant(context, width*0.5,height*0.4, height*0.1 );
		title = 'DESCANT';		
	} else if(left == 'PACES' && right=='none'){
		paces(context, width/2, height*0.4, height*0.15, height*0.05);
		title = 'PACES';
	} else if(left == 'DANTE' && right=='none'){
		dante(context, width*0.5, height*0.4, height*0.2, color);
		title = 'DANTE';
	} else if( (left == 'US SCEPTAR' || left == 'SCEPTAR') && right=='none'){
		sceptar(context, width/2, height*0.4, height*0.2);
		title = 'SCEPTAR';
	} else if(left == 'SPICE' && right=='none'){
		spice(context, width*0.5, height*0.45, height*0.2);
		title = 'SPICE';
	} else if(left == 'ZDS' && right=='none'){
		zds(context, 0.5*width, 0.4*height, 0.18*height);
		title = 'ZDS';
	} else if(left == 'BAMBINO' && right=='none'){
		title = 'BAMBINO';
		bambino(context, width*0.45, width*0.55, height/3, height*0.6, height*0.12);		
	} else if(left == 'TRIUMF' && right == 'none'){
		triumf(context, width*0.5 - imageObj.width/imageObj.height*context.canvas.height*0.6/2, height*0.1, color);
		title = 'Top Level Config';	
	} else if(left == 'HV' && right == 'none'){
		hv(context, width, height, color);
		title = 'High Voltage';
	}

	if(right != 'all') context.font = '16px Raleway';
	context.fillText(title, width/2 - context.measureText(title).width/2, 0.9*height);
}

//individual thumbnails////////////////////////////////////////////////////////////////////////////////

//draw a SCEPTAR wireframe on context centered at x0, y0.  size is the center to outer vertext distance. 
function sceptar(context, x0, y0, size){
	var i, side;
	side = size*Math.sqrt(2-2*Math.cos(72/180*Math.PI));
	smallSize = 0.5*size;
	smallSide = smallSize*Math.sqrt(2-2*Math.cos(72/180*Math.PI));
	context.save();
	context.translate(x0, y0);
	context.beginPath();
	context.rotate(54/180*Math.PI);
	for(i=0; i<5; i++){
		context.moveTo(0,0);
		context.lineTo(size, 0);
		context.lineTo(size - side*Math.cos(54/180*Math.PI), side*Math.sin(54/180*Math.PI) );
		context.stroke();
		context.moveTo(smallSize, 0);
		context.lineTo(smallSize - smallSide*Math.cos(54/180*Math.PI), smallSide*Math.sin(54/180*Math.PI) );
		context.stroke();
		context.rotate(72/180*Math.PI);
	}
	context.closePath();
	context.restore();
}

function zds(context, x0, y0, radius){
	context.beginPath();
	context.arc(x0, y0, radius, 0, 2*Math.PI);
	context.closePath();
	context.stroke();
}

//draw a PACES wireframe on context centered at x0, y0.  size is the array center to detector center distance, rad is the detector radius.
function paces(context, x0, y0, size, rad){
	var i;

	context.save();
	context.translate(x0, y0);
	context.rotate(54/180*Math.PI);
	for(i=0; i<5; i++){
		context.beginPath();
		context.arc(size, 0, rad, 0, 2*Math.PI);
		context.closePath();
		context.stroke();
		context.rotate(72/180*Math.PI);
	}
	context.restore();
}

function spice(context, x0, y0, rad){
	var i, innerRad, radStep;

	innerRad = 0.15*rad;
	radStep = (rad - innerRad)/3

	for(i=0; i<4; i++){
		context.beginPath();
		context.arc(x0, y0, innerRad+i*radStep, 0, 2*Math.PI);
		context.closePath();
		context.stroke();
	}

	for(i=0; i<8; i++){
		context.beginPath();
		context.moveTo(x0 + innerRad*Math.cos(Math.PI/4*i), y0 + innerRad*Math.sin(Math.PI/4*i));
		context.lineTo(x0 + rad*Math.cos(Math.PI/4*i), y0 + rad*Math.sin(Math.PI/4*i));
		context.stroke();
	}
}

function descant(context, x0, y0, cellSize){
	var i, rad;

	//center to center distance of adjacent honeycomb cells:
	rad = 2*cellSize*Math.cos(30/180*Math.PI);

	regPoly(context, x0,y0, 6, cellSize);

	context.save();
	context.translate(x0, y0);
	for(i=0; i<6; i++){
		regPoly(context, 0, rad, 6, cellSize);
		context.rotate(60/180*Math.PI);
	}
	context.restore();
}

function dante(context, x0, y0, radius, color){
	var i;

	context.save();
	context.translate(x0,y0);
	context.rotate(Math.PI/8);
	context.beginPath();
	context.arc(0,0,radius, 0, 2*Math.PI);
	context.closePath();
	context.stroke();
	for(i=0; i<4; i++){
		context.beginPath();
		context.fillStyle = color;
		context.arc(radius, 0, radius*0.35, 0, 2*Math.PI);
		context.closePath();
		context.fill();
		context.beginPath();
		context.fillStyle = '#333333';
		context.arc(radius, 0, radius*0.3, 0, 2*Math.PI);
		context.closePath();
		context.fill();
		context.beginPath();
		context.fillStyle = color;
		context.arc(radius, 0, radius*0.2, 0, 2*Math.PI);
		context.closePath();
		context.fill();
		context.rotate(Math.PI/2);
	}
	context.restore();
}
function bambino(context, x0upper, x0lower, y0upper, y0lower, rad){
	var i, innerRad, radStep;

	innerRad = 0.15*rad;
	radStep = (rad - innerRad)/5

	for(i=0; i<6; i++){
		context.beginPath();
		context.arc(x0upper, y0upper, innerRad+i*radStep, 0, 2*Math.PI);
		context.closePath();
		context.stroke();

		if(i==0 || i==5){
			context.beginPath();
			context.arc(x0lower, y0lower, innerRad+i*radStep, 0, 2*Math.PI);
			context.closePath();
		}
		context.stroke();
	}

	for(i=0; i<12; i++){
		context.beginPath();
		context.moveTo(x0lower + innerRad*Math.cos(Math.PI/6*i), y0lower + innerRad*Math.sin(Math.PI/6*i));
		context.lineTo(x0lower + rad*Math.cos(Math.PI/6*i), y0lower + rad*Math.sin(Math.PI/6*i));
		context.closePath();
		context.stroke();		
	}
}

function sharc(context, x0, y0, width, height, disabled){
	context.save();
	context.translate(x0,y0);
	ellipse(context, 0, -0.35*height, 0.2*width, 0, Math.PI*2);
	ellipse(context, 0, 0.35*height, 0.2*width, 0, Math.PI*2);
	ellipse(context, 0, -0.35*height, 0.4/3*width, 0, Math.PI*2);
	ellipse(context, 0, 0.35*height, 0.4/3*width, 0, Math.PI*2);
	ellipse(context, 0, -0.35*height, 0.2/3*width, 0, Math.PI*2);
	ellipse(context, 0, 0.35*height, 0.2/3*width, 0, Math.PI*2);
	context.strokeRect(-width*0.2, -height*0.2, width*0.4, height*0.4);
	context.stroke();
	context.beginPath();
	context.moveTo(-width*0.2, 0);
	context.lineTo(width*0.2, 0);
	context.stroke();
	context.beginPath();
	context.moveTo(-width*0.4/6, -height*0.2);
	context.lineTo(-width*0.4/6, height*0.2);
	context.stroke();
	context.beginPath();
	context.moveTo(width*0.4/6, -height*0.2);
	context.lineTo(width*0.4/6, height*0.2);
	context.stroke();
	context.restore();

	if(disabled)
		strikeOut(context, window.width, window.height)
}

function tipWall(context, x0, y0, width){
		var i, cellSize, CsIx0, CsIy0;

		cellSize = width / 5;
		CsIx0 = x0-width/2;
		CsIy0 = y0-width/2;

    	for(i=0; i<25; i++){
            context.strokeRect(CsIx0 + cellSize*(i%5), CsIy0 + cellSize*Math.floor(i/5), cellSize, cellSize);
    	}
    	context.strokeRect(CsIx0, CsIy0, width, width)
}

function tipBall(context, x0, y0, rad){

	context.save();

	context.beginPath();
	context.arc(x0,y0,rad,0,Math.PI*2);
	context.clip();

	context.beginPath();
	context.lineWidth = 2;
	context.arc(x0,y0,rad-1,0,Math.PI*2);
	context.stroke();

	context.lineWidth=1;
	context.beginPath();
	context.arc(x0+20,y0,rad+10,0,Math.PI*2);
	context.stroke();
	context.beginPath();
	context.arc(x0-20,y0,rad+10,0,Math.PI*2);
	context.stroke();
	context.beginPath();
	context.arc(x0,y0+20,rad+10,0,Math.PI*2);
	context.stroke();
	context.beginPath();
	context.arc(x0,y0-20,rad+10,0,Math.PI*2);
	context.stroke();

	context.beginPath();
	context.arc(x0+40,y0,rad+20,0,Math.PI*2);
	context.stroke();
	context.beginPath();
	context.arc(x0-40,y0,rad+20,0,Math.PI*2);
	context.stroke();
	context.beginPath();
	context.arc(x0,y0+40,rad+20,0,Math.PI*2);
	context.stroke();
	context.beginPath();
	context.arc(x0,y0-40,rad+20,0,Math.PI*2);
	context.stroke();

	context.beginPath();
	context.moveTo(x0-rad, y0);
	context.lineTo(x0+rad,y0);
	context.stroke;
	context.moveTo(x0, y0-rad);
	context.lineTo(x0, y0+rad);
	context.stroke();

	context.restore();

}

function griffin(context, x0, y0, color){
	if(color == '#999999')context.globalAlpha = 0.4;
	context.drawImage(imageObj, x0, y0, imageObj.width/imageObj.height*context.canvas.height*0.6, context.canvas.height*0.6);
	context.globalAlpha = 1;
}

function triumf(context, x0, y0, color){
	if(color == '#999999')context.globalAlpha = 0.4;
	context.drawImage(imageObj, x0, y0, imageObj.width/imageObj.height*context.canvas.height*0.6, context.canvas.height*0.6);
	context.globalAlpha = 1;
}

function tigress(context, x0, y0, size){
	var hpge = Math.round(size*0.3);
	var bgo = Math.round(size*0.75);

	context.save();
	context.translate(x0, y0);
	context.strokeRect(-size, -size, 2*size, 2*size);
	context.strokeRect(-bgo, -bgo, 2*bgo, 2*bgo);
	context.strokeRect(-hpge, -hpge, 2*hpge, 2*hpge );

	context.moveTo(-hpge, 0);
	context.lineTo(hpge, 0);
	context.moveTo(0, -hpge);
	context.lineTo(0, hpge);

	context.moveTo(0, -size);
	context.lineTo(0, -(size-hpge) - 2 );
	context.moveTo(0, size);
	context.lineTo(0, size-hpge + 2 );
	context.moveTo(-size, 0);
	context.lineTo(-(size-hpge) - 2, 0);
	context.moveTo(size, 0);
	context.lineTo(size-hpge + 2, 0);

	context.stroke();
	context.restore();
}

function beamdump(context, x0, y0, width){
	var i;

	context.save();
	context.translate(x0, y0);

	context.moveTo(width/2, -width/2);
	context.lineTo(width/2, width/2);
	context.moveTo(width*0.45, -width/2 );
	context.lineTo(width*0.45, width/2);

	for(i=0; i<10; i++){
		context.moveTo(width*0.45, width/2 - i*width/10);
		context.lineTo(width*0.5, width/2 - (i+1)*width/10)
	}

	context.fillRect(-width/2, -2, width*0.95, 4);

	context.moveTo(width*0.45, 0);
	context.lineTo(width*0.4, 12);
	context.moveTo(width*0.45, 0);
	context.lineTo(width*0.3, 20);
	context.moveTo(width*0.45, 0);
	context.lineTo(width*0.4, -15);
	context.moveTo(width*0.45, 0);
	context.lineTo(width*0.1, -10)



	context.stroke();
	context.restore();

}

function hv(context, width, height, color){
	context.fillStyle = color;
	context.beginPath()
	context.moveTo(0.6*width, 0.2*height);
	context.lineTo(0.4*width, 0.475*height);
	context.lineTo(0.5*width, 0.475*height);
	context.lineTo(0.4*width, 0.7*height);
	context.lineTo(0.6*width, 0.425*height);
	context.lineTo(0.5*width, 0.425*height);
	context.closePath();
	context.fill()
}

//draws a regular polygon of n sides on context, centered at x0, y0 and with a center-vertext distance of size
function regPoly(context, x0, y0, n, size){
	var i;
	var stepAngle = 2*Math.PI/n;
	var jointAngle = (Math.PI-stepAngle)/2;
	var side = size*Math.sqrt(2-2*Math.cos(stepAngle));

	context.save();
	context.translate(x0, y0);
	context.beginPath();
	for(i=0; i<n; i++){
		context.moveTo(size, 0);
		context.lineTo(size - side*Math.cos(jointAngle), 0-side*Math.sin(jointAngle));
		context.stroke();
		context.rotate(stepAngle);
	}
	context.restore();
}

function strikeOut(context, width, height){
		context.beginPath()
		context.lineWidth = 5;
		context.strokeStyle = '#FF0000';
		context.moveTo(width*.25, height*0.2);
		context.lineTo(width*0.75, height*0.6);
		context.stroke();
		context.moveTo(width*0.75, height*0.2);
		context.lineTo(width*0.25, height*0.6);
		context.stroke();
}

function glowy(canvasID){
	var canvas = document.getElementById(canvasID);
	var context = canvas.getContext('2d');

	context.shadowOffsetX = 0;
	context.shadowOffsetY = 0;
	context.shadowBlur = 2;
	context.shadowColor = '#FFFFFF';
	thumbnail('Gcha5canv', 'SPICE', 'DSSC');
	context.fill();

}


