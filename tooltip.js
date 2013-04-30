function Tooltip(ttCanvasID, ttDivID, wrapperID, prefix, postfix){

    this.obj;                                       //the object that this tooltip is associated with
    this.canvasID = ttCanvasID;                     //target canvas
    this.ttDivID = ttDivID;                         //tooltip div
    this.wrapperID = wrapperID;                     //ID of div which wraps the tooltip's canvas
    this.prefix = prefix;                           //prefixes to tooltip content lines
    this.postfix = postfix;                         //postfixes to tooltip content lines

    //inject the necessary DOM elements for this tooltip:
    //wrapper div
    insertDOM('div', this.ttDivID, 'tooltip', '', 'body', '', '')

    this.canvas = document.getElementById(this.canvasID);
    this.context = this.canvas.getContext('2d'); 
    this.ttDiv = document.getElementById(this.ttDivID);
    this.ttParent = document.getElementById(this.wrapperID);

    //old tt bin, for updates when the mouse is just sitting in the same place:
    this.oldCellIndex = -1;
    this.allowUpdate = 0;

    var that = this;

    //suppresses some flaky positioning when TT changes size:
    this.canvas.onmouseover = function(event){
        that.ttDiv.style.display = 'none';
        that.allowUpdate = 0; 
    }

    this.canvas.onmousemove = function(event){

        //force the tooltip off - patches persistency problem when moving down off the waffle.  TODO: understand persistency problem.
        that.ttDiv.style.display = 'none';

        //get mouse coords:
        var x = event.pageX - that.canvas.offsetLeft - that.ttParent.offsetLeft;   
        var y = event.pageY - that.canvas.offsetTop - that.ttParent.offsetTop;

        //turn mouse coords into the index pointing to where the relevant info is stored in obj's info arrays:
        var cellIndex = that.obj.findCell(x, y);

        //only continue if the cursor is actually on a valid channel; x and y>0 suppresses an antialiasing bug:
        if(cellIndex != -1 && x>1 && y>1 && x<that.obj.canvasWidth-1 && y<that.obj.canvasHeight-1){

            //establish text:
            that.obj.defineText(cellIndex);

            //set the display on so offsetHeight and Width work:
            that.ttDiv.style.display = 'block';
            that.ttDiv.style.opacity = 0;

            //make the tool tip follow the mouse, but keep it on the screen:
            that.ttDiv.style.top = Math.min(event.pageY - 10, window.innerHeight + window.pageYOffset - that.ttDiv.offsetHeight);
            if(event.pageX < that.canvas.offsetWidth){
                that.ttDiv.style.right = 'auto'
                that.ttDiv.style.left = event.pageX  + 10;
            }else{
                that.ttDiv.style.left = 'auto';
                that.ttDiv.style.right = window.innerWidth - event.pageX + 10;
            }
            //turn the TT on:
            that.ttDiv.style.opacity = 1;

            //keep track of tooltip position
            that.oldCellIndex = cellIndex;
            that.allowUpdate = 1;

        } else that.allowUpdate = 0;

    }

    //turn the tool tip off if it's outside the canvas:
    this.canvas.onmouseout = function(event){
        that.ttDiv.style.display = 'none';
        that.allowUpdate = 0;
    }

    //updater for if the tooltip is stationary on the waffle during a master loop transition:
    this.update = function(){
        if(this.allowUpdate){
            //establish text:
            this.obj.defineText(this.oldCellIndex);
        }
    };

}