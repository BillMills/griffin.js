
function thumbnail(canvasID, left, right, color){
	var canvas = document.getElementById(canvasID);
	var context = canvas.getContext('2d');

	var width = canvas.width;
	var height = canvas.height;

	context.clearRect(0,0,width,height);
	context.lineWidth = 1;
	
	var title = '';

	context.strokeStyle = color;
	context.fillStyle = color;
	if(left == 'USSC'){
		sceptar(context, width/3, height*0.4, height*0.2);
		title = 'USSC + ';
	} else if(left == 'PACES'){
		paces(context, width/3, height*0.4, height*0.15, height*0.05);
		title = 'PACES + ';
	} else if(left == 'SPICE'){
		if(right == ''){
			spice(context, width/2, height*0.4, height*0.2);
			title = 'GRIFFIN + SPICE';
		} else if(right == 'none'){
			spice(context, width/2, height*0.4, height*0.2);
			title = 'GRIFFIN - SPICE';
		} else {
			spice(context, width/3, height*0.4, height*0.2);
			title = 'SPICE + ';
		}
	} else if(left == 'DESCANT'){
		descant(context, width/2,height*0.4, height*0.1 )
		title = 'GRIFFIN + DESCANT'
	} else if (left == 'DANTE'){
		dante(context, width/3, height*0.4, height*0.2, color);
		dante(context, 2*width/3, height*0.4, height*0.2, color);
		title = 'GRIFFIN + DANTE';
	}

	if(right == 'DSSC'){
		sceptar(context, 2*width/3, height*0.4, height*0.2);
		title += 'DSSC';
	} else if(right == 'ZDS'){
		context.beginPath();
		context.arc(2*width/3, height*0.4, height*0.18, 0, 2*Math.PI);
		context.closePath();
		context.stroke();
		title += 'ZDS';
	}

	if(left=='DESCANT' && right=='none'){
		title = 'GRIFFIN - DESCANT';
		strikeOut(context, width, height);
	}

	if(left == 'DANTE' && right == 'none'){
		title = 'GRIFFIN - DANTE';
		context.beginPath()
		strikeOut(context, width, height);
	}

	if(left == 'SPICE' && right == 'none'){
		strikeOut(context, width, height);
	}

	context.font = '16px Raleway';
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


