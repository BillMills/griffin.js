//composite thumbnails//////////////////////////////////////////////////////////////////
function sceptarsceptar(canvasID){
	var canvas = document.getElementById(canvasID);
	var context = canvas.getContext('2d');

	var width = canvas.width;
	var height = canvas.height;

	context.strokeStyle = '#999999';
	strokePentagon(context, width/3, height/2, height*0.2);
	context.stroke();
	strokePentagon(context, 2*width/3, height/2, height*0.2);
	context.stroke();

	context.font = '16px Raleway';
	context.fillStyle = '#999999'
	context.fillText('USSC + DSSC', width/2 - context.measureText('USSC + DSSC').width/2, 0.9*height);
}

function sceptarzds(canvasID){
	var canvas = document.getElementById(canvasID);
	var context = canvas.getContext('2d');

	var width = canvas.width;
	var height = canvas.height;

	context.strokeStyle = '#999999';
	strokePentagon(context, width/3, height/2, height*0.2);
	context.stroke();
	context.beginPath();
	context.arc(2*width/3, height/2, height*0.18, 0, 2*Math.PI);
	context.closePath();
	context.stroke();

	context.font = '16px Raleway';
	context.fillStyle = '#999999'
	context.fillText('USSC + ZDS', width/2 - context.measureText('USSC + ZDS').width/2, 0.9*height);
}

//individual thumbnails////////////////////////////////////////////////////////////////////////////////

//draw a regular pentagon on context centered at x0 y0.  size is the center to vertext distance. 
function strokePentagon(context, x0, y0, size){
	var i, side;
	side = size*Math.sqrt(2-2*Math.cos(72/180*Math.PI))
	context.save();
	context.translate(x0, y0);
	context.beginPath();
	context.rotate(54/180*Math.PI);
	for(i=0; i<5; i++){
		context.moveTo(size, 0);
		context.lineTo(size - side*Math.cos(54/180*Math.PI), side*Math.sin(54/180*Math.PI) );
		context.rotate(72/180*Math.PI);
	}
	context.restore();
	context.closePath();
}

