//Generates branding

function Banner(canvas, location, navbar, title) {
	'use strict'

    //fetch canvas
    var canvas = document.getElementById(canvas);
    var context = canvas.getContext('2d');

    //Choose rendering width: use 1440px or the actual width, whichever is larger:
    var renderWidth = Math.max(1440, window.innerWidth);
    var renderHeight = Math.max(900, window.innerHeight)

    //resize canvas
    context.canvas.width = renderWidth-10;
    context.canvas.height = renderHeight*0.1;//window.innerHeight*0.1;

    //style canvas
    context.fillStyle = 'black';
    context.globalAlpha = 0.2;
    context.lineWidth = 5;
		
    //draw border
	context.beginPath();
	context.moveTo(5,0);
	context.lineTo(5,context.canvas.height*0.7);
	context.arcTo(5,context.canvas.height*0.9,25,context.canvas.height*0.9,20);
	context.lineTo(renderWidth-50,context.canvas.height*0.9);
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

    //set navbar width:
    var navigation = document.getElementById(navbar);
    $(navigation).css('width', renderWidth-50);

    //move local title around:
    context.font = '24px Raleway'
    var urHere = document.getElementById(location);
    $(urHere).css('width', context.measureText(title).width*1.1);
    $(urHere).css('left', renderWidth - 50 - context.measureText(title).width);
    urHere.innerHTML = title;
}