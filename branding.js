//Generates branding

function Banner(canvas, location, navbar, title, mode) {
	'use strict'

    //fetch canvas
    var canvas = document.getElementById(canvas);
    var context = canvas.getContext('2d');

    //Choose rendering width: use 1440px or the actual width, whichever is larger:
    var renderWidth = Math.max(1440, window.innerWidth);
    var renderHeight = Math.max(900, window.innerHeight)

    //resize canvas
    context.canvas.width = renderWidth;
    context.canvas.height = renderHeight*0.1;//window.innerHeight*0.1;

    //style canvas
    context.fillStyle = 'white' //'black';
    context.globalAlpha =  0.3;  //0.2;
    context.lineWidth = 5;
    context.strokeStyle = 'white';
		
    //draw border
	context.beginPath();
	context.moveTo(5,0);
	context.lineTo(5,context.canvas.height*0.7);
	context.arcTo(5,context.canvas.height*0.9,25,context.canvas.height*0.9,20);
	context.lineTo(renderWidth,context.canvas.height*0.9);
	context.stroke();

    //insert logo
    var imageObj = new Image();
    if(mode == 'GRIFFIN') imageObj.src = 'logo.gif';
    else imageObj.src = 'triumf.gif';
    imageObj.onload = function() {
      context.drawImage(imageObj, 20, 0, imageObj.width/imageObj.height*context.canvas.height*0.8, context.canvas.height*0.8);
    };

    //write title
    if(mode == 'TRIUMF')
        context.font= context.canvas.height*0.75+'px Raleway';
    else  
        context.font= context.canvas.height*0.75+'px Times New Roman';
    context.fillText(mode, context.canvas.height*0.7*.9/.8+20, 0.65*context.canvas.height);

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