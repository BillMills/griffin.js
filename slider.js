//migrating to OO slider implementation.  TODO: finish!
function Slider(titleID, inputBoxID, sliderContainerID, sliderBackgroundID, sliderKnobID, sliderCanvID, sliderTextID){

    //pointers by ID:
    this.inputBox = document.getElementById(inputBoxID);
    this.sliderContainer = document.getElementById(sliderContainerID);
    this.sliderBackground = document.getElementById(sliderBackgroundID);
    this.sliderKnob = document.getElementById(sliderKnobID);
    this.sliderCanv = document.getElementById(sliderCanvID);
    this.sliderText = document.getElementById(sliderTextID);

    //configure slider div and canvas css:
    $(this.inputBox).attr('size', '6');
    $(this.sliderContainer).css('width', '270px');
    $(this.sliderContainer).css('height', '36px');
    $(this.sliderContainer).css('display', 'inline');
    $(this.sliderContainer).css('position', 'absolute');
    $(this.sliderBackground).css('width', '260px');
    $(this.sliderBackground).css('height', '24px');
    $(this.sliderBackground).css('display', 'inline');
    $(this.sliderBackground).css('position', 'absolute');
    $(this.sliderKnob).css('width', '24px');
    $(this.sliderKnob).css('height', '36px');
    $(this.sliderKnob).css('left', '10px');
    $(this.sliderKnob).css('display', 'inline');
    $(this.sliderKnob).css('position', 'absolute');
    $(this.sliderCanv).css('width', '24px');
    $(this.sliderCanv).css('height', '16px');
    $(this.sliderCanv).css('display', 'inline');
    $(this.sliderCanv).css('position', 'absolute');
    $(this.sliderText).css('display', 'inline');
    $(this.sliderText).css('color', 'Grey');

    //draw the slider canvases:
    this.sliderContext = this.sliderBackground.getContext('2d');
    this.knobContext = this.sliderCanv.getContext('2d');

    //this.sliderContext.fillRect(0,0,100,100);



    //knob rail:
    this.sliderContext.lineWidth = 1;
    this.sliderContext.beginPath();
    this.sliderContext.moveTo(20, 8);
    this.sliderContext.lineTo(240, 8);
    this.sliderContext.stroke();

    //knob surface:
    this.knobContext.fillStyle = 'rgba(255,255,255,1)';
    this.knobContext.fillRect(0,0,20,16);

    this.knobContext.lineWidth = 1;
    this.knobContext.beginPath();
    this.knobContext.moveTo(0,4);
    this.knobContext.lineTo(0,12);         
    this.knobContext.arcTo(0,16, 4,16, 4);
    this.knobContext.lineTo(16,16);
    this.knobContext.arcTo(20,16,20,12,4);
    this.knobContext.lineTo(20,4);
    this.knobContext.arcTo(20,0,16,0,4);
    this.knobContext.lineTo(4,0);
    this.knobContext.arcTo(0,0,0,4,4)
    this.knobContext.stroke();

}






function slider(sliderDiv, sliderCanv, knobDiv, knobCanv, sliderText, execute, min, max, unit) {
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

    contextBKG.strokeStyle = 'rgba(255,255,255,0.9)'
    contextBKG.lineWidth = 1;
    contextBKG.beginPath();
    contextBKG.moveTo(20, 8);
    contextBKG.lineTo(240, 8);
    contextBKG.stroke();

    //draw slider knob:
	var canvasKnob = document.getElementById(knobCanv);
    var contextKnob = canvasKnob.getContext('2d');
    contextKnob.fillStyle = 'rgba(255,255,255,0)';
    contextKnob.fillRect(0,0,20,16);

    contextKnob.fillStyle = 'rgba(255,255,255,1)'
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
	contextKnob.fill();
	contextKnob.stroke();	

	//-----end drawing-----------------------------------------

    //-----button response-------------------------------------
    var canvas = document.getElementById(knobCanv);
    //var context = canvas.getContext('2d');
    var active = 0;
	var sliderContainer = document.getElementById(sliderDiv);
    var knobContainer = document.getElementById(knobDiv);
    var sliderWasAt = 0; //parseFloat($(knobContainer).css('left'));
    var cursorWasAt = 0;
    var dragX = 0;
    var sliderTo = 0;
    var scale = 0;
    var sliderString;

    //turn off slider focus glow:
    $(knobContainer).css('outline', '0px none transparent');    

    canvas.onmousedown = function(event){
        sliderWasAt = parseFloat($(knobContainer).css('left'));
    	knobContainer.tabIndex = '1';
    	knobContainer.focus();
    	active = 1;
    	cursorWasAt = event.pageX;
    }

    sliderContainer.onmouseup = function(event){
    	active = 0;
    	sliderWasAt = sliderWasAt + dragX;
    }

    sliderContainer.onmouseout = function(event){
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

	    	//scale = Math.round((sliderTo-10) / 220*100);
            scale = (sliderTo-10) / 220*100;

            //estabish slider label content
            sliderString = (scale/100*(max-min) + min).toFixed(0) +' '+unit;

            //center label under knob, but don't let it fall off the end of the slider.
            $('#'+sliderText).css('left',(-1*contextKnob.measureText(sliderString).width/2) );
            if(contextKnob.measureText(sliderString).width/2+sliderTo+12 > 230){
                $('#'+sliderText).css('left', -2*contextKnob.measureText(sliderString).width/2 - sliderTo -12 + 230 );
            }
            if(sliderTo - contextKnob.measureText(sliderString).width/2 -12 < 10){
                $('#'+sliderText).css('left', 10 + 12 -sliderTo );
            }

	    	document.getElementById(sliderText).innerHTML = '<br>'+sliderString;

		   	$(knobContainer).css('left', sliderTo);

		   	partial(execute, scale/100)();
		}
    }

	knobContainer.onkeydown = function(event){
        if(event.keyCode == 39) {
        	var sliderTo = parseFloat($(knobContainer).css('left')) + 1;
        	if(sliderTo > 230) sliderTo = 230;
        	$(knobContainer).css('left', sliderTo);   
            //scale = Math.round((sliderTo-10) / 220 * 100);
            scale = (sliderTo-10) / 220 * 100;

            //estabish slider label content
            sliderString = (scale/100*(max-min) + min).toFixed(0) +' '+unit;

            //center label under knob, but don't let it fall off the end of the slider.
            $('#'+sliderText).css('left',(-1*contextKnob.measureText(sliderString).width/2) );
            if(contextKnob.measureText(sliderString).width/2+sliderTo+12 > 230){
                $('#'+sliderText).css('left', -2*contextKnob.measureText(sliderString).width/2 - sliderTo-12 + 230 );
            }
            if(sliderTo - contextKnob.measureText(sliderString).width/2 - 12 < 10){
                $('#'+sliderText).css('left', 10 + 12 -sliderTo );
            }

            document.getElementById(sliderText).innerHTML = '<br>'+sliderString;
	    	
	    	partial(execute, scale/100)();

        }
        else if(event.keyCode == 37) {
        	var sliderTo = parseFloat($(knobContainer).css('left')) - 1;
        	if(sliderTo < 10) sliderTo = 10;
        	$(knobContainer).css('left', sliderTo);
            //scale = Math.round((sliderTo-10) / 220 * 100);
            scale = (sliderTo-10) / 220 * 100;

            //estabish slider label content
            sliderString = (scale/100*(max-min) + min).toFixed(0) +' '+unit;

            //center label under knob, but don't let it fall off the end of the slider.
            $('#'+sliderText).css('left',(-1*contextKnob.measureText(sliderString).width/2) );
            if(contextKnob.measureText(sliderString).width/2+sliderTo+12 > 230){
                $('#'+sliderText).css('left', -2*contextKnob.measureText(sliderString).width/2 - sliderTo-12 + 230 );
            }
            if(sliderTo - contextKnob.measureText(sliderString).width/2 - 12 < 10){
                $('#'+sliderText).css('left', 10 + 12 -sliderTo );
            }

            document.getElementById(sliderText).innerHTML = '<br>'+sliderString;

	    	partial(execute, scale/100)();
        }
	}
    //end button response----------------------------------------

}

function jumpSlider(position, knobDiv, knobCanv, sliderText, min, max, unit){
    var knobContainer = document.getElementById(knobDiv);
    var sliderTo = position*220;
    $(knobContainer).css('left', sliderTo+10);   
    //scale = Math.round( (sliderTo) / 220 * 100);
    scale = (sliderTo) / 220 * 100;

    var canvasKnob = document.getElementById(knobCanv);
    var contextKnob = canvasKnob.getContext('2d');

    //estabish slider label content
    //var sliderString = (scale/100*(max-min) + min).toFixed(0) +' '+unit;

    var sliderString = (position*(max-min)+min).toFixed(0)+' '+unit;

    //center label under knob, but don't let it fall off the end of the slider.
    $('#'+sliderText).css('left',(-1*contextKnob.measureText(sliderString).width/2) );
    if(contextKnob.measureText(sliderString).width/2+sliderTo+10+12 > 230){
        $('#'+sliderText).css('left', -2*contextKnob.measureText(sliderString).width/2 - sliderTo -10-12 + 230 );
    }
    if(sliderTo+10 - contextKnob.measureText(sliderString).width/2 -12 < 10){
        $('#'+sliderText).css('left', 10+12-sliderTo-10 );
    }

    document.getElementById(sliderText).innerHTML = '<br>'+sliderString;
}

function demo(alpha){
	var canvasDemo = document.getElementById('demo');
    var contextDemo = canvasDemo.getContext('2d');

    contextDemo.fillStyle = 'rgba(255,255,255,1)';
    contextDemo.fillRect(0,0,100,100);

    contextDemo.fillStyle = 'rgba(0,0,0,'+alpha+')';
	  
    contextDemo.fillRect(0,0,100,100);
}