function Slider(sliderDiv, sliderCanv, knobDiv, knobCanv) {
	//set up slider size:
	/*
	$('#'+sliderDiv).width(260);
	$('#'+sliderDiv).height(24);
	$('#'+sliderCanv).width(260);
	$('#'+sliderCanv).height(24);

	$('#'+knobDiv).width(20);
	$('#'+knobDiv).height(16);
	$('#'+knobCanv).width(20);
	$('#'+knobCanv).height(16);
	*/
  
    //drawing: refactor into function---------------------------
	//draw slider background:
	var canvasBKG = document.getElementById(sliderCanv);
    var contextBKG = canvasBKG.getContext('2d');	

    contextBKG.lineWidth = 1;
    contextBKG.beginPath();
    contextBKG.moveTo(20, 8);
    contextBKG.lineTo(240, 8);
    contextBKG.stroke();

    //draw slider knob:
	var canvasKnob = document.getElementById(knobCanv);
    var contextKnob = canvasKnob.getContext('2d');
    contextKnob.fillStyle = 'rgba(255,255,255,1)';
    contextKnob.fillRect(0,0,20,16);

    contextKnob.lineWidth = 1;
	contextKnob.beginPath();
	contextKnob.moveTo(0,4);
	contextKnob.lineTo(0,12);         
	contextKnob.arcTo(0,16, 4,16, 4);
	contextKnob.lineTo(16,16);
	contextKnob.arcTo(20,16,20,12,4);
	contextKnob.lineTo(20,4);
	contextKnob.arcTo(20,0,16,0,4);
	contextKnob.lineTo(4,0);
	contextKnob.arcTo(0,0,0,4,4)
	
	contextKnob.stroke();	

	//-----end drawing-----------------------------------------

    //-----button response-------------------------------------
    var canvas = document.getElementById(knobCanv);
    //var context = canvas.getContext('2d');
    var active = 0;
	var sliderContainer = document.getElementById(sliderDiv);
    var knobContainer = document.getElementById(knobDiv);
    var sliderWasAt = 0;
    var cursorWasAt = 0;
    var dragX = 0;
    var sliderTo = 0;
    var scale = 0;

    //turn off slider focus glow:
    $(knobContainer).css('outline', '0px none transparent');    

    canvas.onmousedown = function(event){
    	knobContainer.tabIndex = '1';
    	knobContainer.focus();
    	active = 1;
    	cursorWasAt = event.pageX;
    }

    document.onmouseup = function(event){
    	active = 0;
    	sliderWasAt = sliderWasAt + dragX;
    }

    sliderContainer.onmousemove = function(event){
    	if(active){

	    	dragX = event.pageX - cursorWasAt;
	    	sliderTo = sliderWasAt + dragX;
	    	//keep slider in range:
	    	if(sliderTo < 10) sliderTo = 10;
	    	if(sliderTo > 230) sliderTo = 230;

	    	scale = Math.round(sliderTo / 220 * 100) - 5;  //TODO: what's with the offset?
	    	document.getElementById('sliderText').innerHTML = '<br>'+scale+'%';

		   	$(knobContainer).css('left', sliderTo);

		   	partial(demo, scale/100)();
		}
    }

	knobContainer.onkeydown = function(event){
        if(event.keyCode == 39) {
        	var sliderTo = parseFloat($(knobContainer).css('left')) + 1;
        	if(sliderTo > 230) sliderTo = 230;
        	$(knobContainer).css('left', sliderTo);   
            scale = Math.round(sliderTo / 220 * 100) - 5;  //TODO: what's with the offset?
	    	document.getElementById('sliderText').innerHTML = '<br>'+scale+'%';
	    	partial(demo, scale/100)();

        }
        else if(event.keyCode == 37) {
        	var sliderTo = parseFloat($(knobContainer).css('left')) - 1;
        	if(sliderTo < 10) sliderTo = 10;
        	$(knobContainer).css('left', sliderTo);
            scale = Math.round(sliderTo / 220 * 100) - 5;  //TODO: what's with the offset?
	    	document.getElementById('sliderText').innerHTML = '<br>'+scale+'%'; 
	    	partial(demo, scale/100)();
        }
	}
    //end button response----------------------------------------

}




function partial(func /*, 0..n args */) {
  var args = Array.prototype.slice.call(arguments, 1);
  return function() {
    var allArguments = args.concat(Array.prototype.slice.call(arguments));
    return func.apply(this, allArguments);
  };
}

function demo(alpha){
	var canvasDemo = document.getElementById('demo');
    var contextDemo = canvasDemo.getContext('2d');

    contextDemo.fillStyle = 'rgba(255,255,255,1)';
    contextDemo.fillRect(0,0,100,100);

    contextDemo.fillStyle = 'rgba(0,0,0,'+alpha+')';
	  
    contextDemo.fillRect(0,0,100,100);
}