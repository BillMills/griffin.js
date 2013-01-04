//migrating to OO slider implementation.  TODO: finish!
function Slider(titleID, inputBoxID, sliderContainerID, sliderBackgroundID, sliderKnobID, sliderCanvID, sliderTextID, min, max, decimal, unit, length){

    //slider limits:
    this.min = min;
    this.max = max;

    //value unit:
    this.unit = unit;

    //number of decimal places to keep:
    this.dec = decimal;

    //length of slider; if user enters 0, use default size:
    this.length = length;
    if(this.length == 0) this.length = 220;
    //left bound of slider rail:
    this.leftRail = 20;
    //right bound of slider rail:
    this.rightRail = this.leftRail + this.length;
    //leftmost limit of knob's left edge:
    this.leftKnob = this.leftRail - 10;
    //rightmost limit of knob's left edge:
    this.rightKnob = this.rightRail - 10;

    //previous physical value:
    this.oldValue = 0;
    //current value:
    this.newValue = 0;

    //animation parameters:
    this.duration = 0.4; //seconds
    this.FPS = 30;
    this.nFrames = this.duration*this.FPS;

    //IDs:
    this.titleID = titleID;
    this.inputBoxID = inputBoxID;
    this.sliderContainerID = sliderContainerID;
    this.sliderBackgroundID = sliderBackgroundID;
    this.sliderKnobID = sliderKnobID;
    this.sliderCanvID = sliderCanvID;
    this.sliderTextID = sliderTextID;

    //pointers by ID:
    this.inputBox = document.getElementById(inputBoxID);
    this.sliderContainer = document.getElementById(sliderContainerID);
    this.sliderBackground = document.getElementById(sliderBackgroundID);
    this.sliderKnob = document.getElementById(sliderKnobID);
    this.sliderCanv = document.getElementById(sliderCanvID);
    this.sliderText = document.getElementById(sliderTextID);

    $(this.sliderContainer).css('left', $(this.inputBox).width() + 25 );
/*
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
    //$(this.sliderText).css('color', 'Grey');
*/
    //draw the slider canvases:
    this.sliderContext = this.sliderBackground.getContext('2d');
    this.knobContext = this.sliderCanv.getContext('2d');

    //knob rail:
    this.sliderContext.strokeStyle = 'rgba(255,255,255,0.7)'
    this.sliderContext.lineWidth = 1;
    this.sliderContext.beginPath();
    this.sliderContext.moveTo(this.leftRail, 8);
    this.sliderContext.lineTo(this.rightRail, 8);
    this.sliderContext.stroke();

    //knob surface:
    this.knobContext.fillStyle = 'rgba(255,255,255,1)';
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
    this.knobContext.arcTo(0,0,0,4,4);
    this.knobContext.fill();
    this.knobContext.stroke();

    //establish slider response:
    this.active = 0;
    this.sliderWasAt = 0;
    this.cursorWasAt = 0;
    this.dragX = 0;
    this.sliderTo = 0;
    this.scale = 0;
    this.sliderString;  

    //turn off slider focus glow:
    $(this.sliderKnob).css('outline', '0px none transparent');

    var that = this;

    this.sliderCanv.onmousedown = function(event){
        that.sliderWasAt = parseFloat($(that.sliderKnob).css('left'));
        that.sliderKnob.tabIndex = '1';
        that.sliderKnob.focus();
        that.active = 1;
        that.cursorWasAt = event.pageX;
    }

    this.sliderContainer.onmouseup = function(event){
        that.active = 0;
        that.sliderWasAt = that.sliderWasAt + that.dragX;
    }

    this.sliderContainer.onmouseout = function(event){
        that.active = 0;
        that.sliderWasAt = that.sliderWasAt + that.dragX;
    }

    this.sliderContainer.onmousemove = function(event){
        if(that.active){

            that.dragX = event.pageX - that.cursorWasAt;
            that.sliderTo = that.sliderWasAt + that.dragX;
            //keep slider in range:
            if(that.sliderTo < that.leftKnob) that.sliderTo = that.leftKnob;
            if(that.sliderTo > that.rightKnob) that.sliderTo = that.rightKnob;

            that.scale = (that.sliderTo-that.leftKnob) / that.length;

            //establish new position:
            that.oldValue = that.newValue;
            that.newValue = (that.scale*(that.max-that.min) + that.min);

            //estabish slider label content
            that.sliderString =  that.newValue.toFixed(that.dec)+' '+that.unit;

            //center label under knob, but don't let it fall off the end of the slider.
            var stringWidth = that.knobContext.measureText(that.sliderString).width*1.2
            $('#'+sliderTextID).css('left',(-1*stringWidth/2 -10) );
            if(stringWidth/2+that.sliderTo+0+10 > that.rightRail){
                $('#'+sliderTextID).css('left', that.rightKnob - stringWidth - that.sliderTo - 10);
            }
            if(that.sliderTo - stringWidth/2 -0-10 < that.leftRail){
                $('#'+sliderTextID).css('left', that.leftKnob + 0+10 - that.sliderTo );
            }

            that.sliderText.innerHTML = '<br>'+that.sliderString;

            $(that.sliderKnob).css('left', that.sliderTo);

            that.inputBox.value = (that.scale*(that.max-that.min)+that.min).toFixed(that.dec);
        }
    }

    this.sliderKnob.onkeydown = function(event){
        if(event.keyCode == 39) {
            that.step(Math.pow(10, -1*that.dec));
        }
        else if(event.keyCode == 37) {
            that.step(-1*Math.pow(10, -1*that.dec));
        }
    }

    this.inputBox.onblur = function(event){
        that.update(parseFloat(that.inputBox.value));
    }

    //move the slider discontinuously to a new <position>:
    this.jump = function(position){
        this.sliderTo = position*this.length;
        $(this.sliderKnob).css('left', this.sliderTo+this.leftKnob);   
        this.scale = (this.sliderTo) / this.length;

        //estabish slider label content
        this.sliderString = (position*(this.max-this.min)+this.min).toFixed(this.dec)+' '+this.unit;

        //center label under knob, but don't let it fall off the end of the slider.
        var stringWidth = this.knobContext.measureText(this.sliderString).width*1.2;
        $('#'+this.sliderTextID).css('left',(-1*stringWidth/2 - 10) );
        if(stringWidth/2+this.sliderTo+this.leftKnob+0 +10 > this.rightKnob){
            $('#'+this.sliderTextID).css('left', -1*stringWidth - this.sliderTo -this.leftKnob-0 -10 + this.rightKnob );
        }
        if(this.sliderTo+this.leftKnob - stringWidth/2 -0 -10 < this.leftKnob){
            $('#'+this.sliderTextID).css('left', this.leftKnob+0+10-this.sliderTo-this.leftKnob );
        }

        this.sliderText.innerHTML = '<br>'+this.sliderString;

        this.inputBox.value = (this.scale*(this.max-this.min)+this.min).toFixed(this.dec);        
    };

    //top function for handling slider updates from everything other than the slider knob:
    this.update = function(inputValue){

        //keep value inbounds:
        var newValue = inputValue;
        if(newValue > this.max) newValue = this.max;
        if(newValue < this.min) newValue = this.min;

        //set up member variables for animation:
        this.oldValue = this.newValue;
        this.newValue = newValue;

        //animate:
        animate(this, 0);
    };

    //draw function used by animate():
    this.draw = function(frame){
        //this frame is this far between the start and end values...
        var position = (this.newValue - this.oldValue)*frame/this.nFrames + this.oldValue;
        //...which corresponds to this far along the slider:
        var sliderPosition = (position-this.min)/(this.max-this.min);

        this.jump(sliderPosition);

    };

    //like update, but handles an un-animated single step from a cursor stroke:
    this.step = function(stepSize){
        //keep value inbounds:
        var newValue = this.newValue + stepSize; 
        if(newValue > this.max) newValue = this.max;
        if(newValue < this.min) newValue = this.min;

        //set up member variables for animation:
        this.oldValue = this.newValue;
        this.newValue = newValue;

        //use draw at the last frame to skip the animation:
        this.draw(this.nFrames);
    };

}