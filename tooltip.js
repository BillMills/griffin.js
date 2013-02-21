function Tooltip(ttCanvasID, ttTextID, ttBKGcanvID, ttDivID, wrapperID, prefix, postfix){

    this.obj;                                       //the object that this tooltip is associated with
    this.canvasID = ttCanvasID;                     //target canvas
    this.ttTextID = ttTextID;                       //tooltip text
    this.ttBKGcanvID = ttBKGcanvID;                 //tooltip's background canvas
    this.ttDivID = ttDivID;                         //tooltip div
    this.wrapperID = wrapperID;                     //ID of div which wraps the tooltip's canvas
    this.prefix = prefix;                           //prefixes to tooltip content lines
    this.postfix = postfix;                         //postfixes to tooltip content lines

    //inject the necessary DOM elements for this tooltip:
    //wrapper div
    insertDiv(ttDivID, 'tooltip', 'body');
    //background canvas
    insertCanvas(ttBKGcanvID, 'ttBKG', '', 0, 0, ttDivID);
    //content paragraph
    insertParagraph(ttTextID, 'TTtext', '', ttDivID, '');

    this.canvas = document.getElementById(this.canvasID);
    this.context = this.canvas.getContext('2d'); 
    this.ttDiv = document.getElementById(this.ttDivID);
    this.ttParent = document.getElementById(this.wrapperID);
    this.BKGcanvas = document.getElementById(this.ttBKGcanvID);
    this.BKGcontext = this.BKGcanvas.getContext('2d');

    //match the font here to the font declared in the css for the tooltip text, to get measurements made in defineText right
    this.BKGcanvas.font = '14px "Raleway"';

    //old tt bin, for updates when the mouse is just sitting in the same place:
    this.oldCellIndex = -1;
    this.allowUpdate = 0;

    var that = this;

    this.canvas.onmousemove = function(event){

        //force the tooltip off - patches persistency problem when moving down off the waffle.  TODO: understand persistency problem.
        that.ttDiv.style.display = 'none';

        //get mouse coords:
        var x = event.pageX - that.canvas.offsetLeft - that.ttParent.offsetLeft;   
        var y = event.pageY - that.canvas.offsetTop - that.ttParent.offsetTop;

        //turn mouse coords into the index pointing to where the relevant info is stored in obj's info arrays:
        var cellIndex = that.obj.findCell(x, y);

        //only continue if the cursor is actually on a valid channel:
        if(cellIndex != -1){

            //establish text:
            var newWidth = Math.max(1.5*that.obj.defineText(cellIndex),200);
            var newHeight = 200;

            //update the size of the tool tip to fit the text:
            that.ttDiv.setAttribute('width', newWidth);
            that.ttDiv.setAttribute('height', newHeight);
            $('#'+that.ttTextID).width(newWidth);

            //repaint background canvas:
            that.BKGcanvas.setAttribute('width', newWidth);
            that.BKGcanvas.setAttribute('height', newHeight);
            that.drawBKG(newWidth, newHeight);

            //make the tool tip follow the mouse:
            that.ttDiv.style.top = event.pageY - newHeight - 5;
            that.ttDiv.style.left = event.pageX - newWidth - 5;

            //make the tool tip appear iff the waffle is showing:
            that.ttDiv.style.display = 'block';

            //keep track of tooltip position
            that.oldCellIndex = cellIndex;
            that.allowUpdate = 1;
        } else that.allowUpdate = 0;

    }

    //turn the tool tip off if it's outside the canvas:
    this.canvas.onmouseout = function(event){
        that.ttDiv.style.display = 'none';
    }

    //updater for if the tooltip is stationary on the waffle during a master loop transition:
    this.update = function(){
        if(this.allowUpdate){
            //establish text:
            var newWidth = Math.max(1.5*this.obj.defineText(this.oldCellIndex),200);            

            //update the size of the tool tip to fit the text:
            this.ttDiv.setAttribute('width', newWidth);
            this.ttDiv.setAttribute('height', 200);
            $('#'+this.ttTextID).width(newWidth);
            this.BKGcanvas.setAttribute('width', newWidth);
            this.BKGcanvas.setAttribute('height', 200);
            this.drawBKG(newWidth, 200);
        }
    };

    //draw the tooltip background
    this.drawBKG = function(width, height){
        this.BKGcontext.clearRect(0,0,width, height);
        this.BKGcontext.lineWidth = 5;
        this.BKGcontext.strokeStyle = '#FFFFFF';
        this.BKGcontext.fillStyle = 'rgba(0,0,0,0.8)';
        roundBox(this.BKGcontext,5,5,width-10,height-10,10);
        this.BKGcontext.fill();
        this.BKGcontext.stroke();
    };

}