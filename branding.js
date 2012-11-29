//Generates branding

function Banner(canvas) {
	'use strict'

    //fetch canvas
    var canvas = document.getElementById(canvas);
    var context = canvas.getContext('2d');

    //resize canvas
    context.canvas.width = window.innerWidth-10;
    context.canvas.height = window.innerHeight*0.1;

    //style canvas
    context.fillStyle = 'black';
    context.globalAlpha = 0.2;
    context.lineWidth = 5;
		
    //draw border
	context.beginPath();
	context.moveTo(5,0);
	context.lineTo(5,context.canvas.height*0.7);
	context.arcTo(5,context.canvas.height*0.9,25,context.canvas.height*0.9,20);
	context.lineTo(window.innerWidth-50,context.canvas.height*0.9);
	context.stroke();

    //insert logo
    var imageObj = new Image();
    imageObj.onload = function() {
      context.drawImage(imageObj, 20, 0, context.canvas.height*0.7*.9/.8, context.canvas.height*0.9);   //70,80
    };
    imageObj.src = 'logo.gif';

    //write title
    context.font= context.canvas.height*0.75+'px Times New Roman';
    context.fillText('GRIFFIN', context.canvas.height*0.7*.9/.8+20, 0.65*context.canvas.height);
}