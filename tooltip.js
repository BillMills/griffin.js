function Tooltip(ttCanvasID, ttTextID, ttDivID, wrapperID, prefix, postfix){

    this.obj;                                       //the object that this tooltip is associated with
    this.canvasID = ttCanvasID;                     //target canvas
    this.ttTextID = ttTextID;                       //tooltip text
    this.ttDivID = ttDivID;                         //tooltip div
    this.wrapperID = wrapperID;                     //ID of div which wraps the tooltip's canvas
    this.prefix = prefix;                           //prefixes to tooltip content lines
    this.postfix = postfix;                         //postfixes to tooltip content lines

    //inject the necessary DOM elements for this tooltip:
    var newDiv = document.createElement('div');
    newDiv.setAttribute('id', ttDivID);
    newDiv.setAttribute('class', 'tooltip');
    document.body.appendChild(newDiv);
    var newPara = document.createElement('p');
    newPara.setAttribute('id', ttTextID);
    newPara.setAttribute('class', 'TTtext');
    document.getElementById(ttDivID).appendChild(newPara);

    this.canvas = document.getElementById(this.canvasID);
    this.context = this.canvas.getContext('2d'); 
    this.ttDiv = document.getElementById(this.ttDivID);
    this.ttParent = document.getElementById(this.wrapperID);

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
            var newWidth = that.obj.defineText(cellIndex);

            //update the size of the tool tip to fit the text:
            $(that.ttDiv).width(newWidth);
            $(that.ttDiv).height(180);

            //make the tool tip follow the mouse:
            that.ttDiv.style.top = event.pageY - 180 - 5;
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
            var newWidth = this.obj.defineText(this.oldCellIndex);            

            //update the size of the tool tip to fit the text:
            $(this.ttDiv).width(newWidth);
            $(this.ttDiv).height(180);
        }
    };

}