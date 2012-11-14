//Generates branding

function Banner(canvas) {
	'use strict'

    //fetch canvas
    var canvas = document.getElementById(canvas);
    var context = canvas.getContext('2d');

    //resize canvas
    context.canvas.width = screen.availWidth-10;
    context.canvas.height = screen.availHeight*0.1;

    //style canvas
    context.fillStyle = 'black';
    context.globalAlpha = 0.2;
    context.lineWidth = 5;
		
    //draw border
	context.beginPath();
	context.moveTo(5,0);
	context.lineTo(5,context.canvas.height*0.7);         //5,70
	context.arcTo(5,context.canvas.height*0.9,25,context.canvas.height*0.9,20);
	context.lineTo(screen.availWidth-50,context.canvas.height*0.9);
	context.stroke();

    //insert logo
    var imageObj = new Image();
    imageObj.onload = function() {
      context.drawImage(imageObj, 20, 0, context.canvas.height*0.7*.9/.8, context.canvas.height*0.9);   //70,80
    };
    imageObj.src = 'logo.gif';

    //write title
    context.font='72px Times New Roman';
    context.fillText('GRIFFIN', 100, 65);
}