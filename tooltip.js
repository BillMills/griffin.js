function Tooltip(object, ttCanvasID, ttTextID, ttDivID, prefix, postfix){

    this.obj = object;                              //the object that this tooltip is associated with
    this.canvasID = ttCanvasID;                     //target canvas
    this.ttTextID = ttTextID;                       //tooltip text
    this.ttDivID = ttDivID;                         //tooltip div
    this.prefix = prefix;                           //prefixes to tooltip content lines
    this.postfix = postfix;                         //postfixes to tooltip content lines

    this.canvas = document.getElementById(this.canvasID);
    this.context = this.canvas.getContext('2d'); 
    this.ttDiv = document.getElementById(this.ttDivID)

    //old tt bin, for updates when the mouse is just sitting in the same place:
    this.oldCellIndex = -1;
    this.allowUpdate = 0;

    //array of values from the waffle to report in the tooltip
    this.reportedValues = [/*this.obj....*/];

    var that = this;

    this.canvas.onmousemove = function(event){

        //force the tooltip off - patches persistency problem when moving down off the waffle.  TODO: understand persistency problem.
        that.ttDiv.style.display = 'none';

        //get mouse coords:
        var x = event.pageX - that.canvas.offsetLeft;   
        var y = event.pageY - that.canvas.offsetTop;;

        //turn mouse coords into the index pointing to where the relevant info is stored in obj's info arrays:
        var cellIndex = that.obj.findCell(x, y);

        //only continue if the cursor is actually on a valid channel:
        if(cellIndex != -1){

            //establish text:
            var newWidth = that.defineText(cellIndex);

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
            var newWidth = this.defineText(this.oldCellIndex);            

            //update the size of the tool tip to fit the text:
            $(this.ttDiv).width(newWidth);
            $(this.ttDiv).height(180);
        }
    };

    //establish the current tooltip text based on cell position; returns length of longest line 
    this.defineText = function(cellIndex){
        var toolTipContent = '<br>';
        var nextLine;
        var longestLine = 0;
        var cardIndex;
        var i;

        nextLine = cellIndex;

        //keep track of the longest line of text:
        longestLine = Math.max(longestLine, this.context.measureText(nextLine).width)
        toolTipContent += nextLine;

        //fill out tooltip content:
        for(i=0; i<this.reportedValues.length; i++){
            //establish prefix:
            nextLine = '<br/>'+this.prefix[i];
            if(this.prefix[i] !== '') nextLine += ' ';

            nextLine += Math.round( this.reportedValues[i][row][col]*1000)/1000 + ' ' + this.postfix[i];

            //keep track of longest line:
            longestLine = Math.max(longestLine, this.context.measureText(nextLine).width);

            //append to tooltip:
            toolTipContent += nextLine;
 
        }

        document.getElementById('TipText').innerHTML = toolTipContent;

        //return length of longest line:
        return longestLine;

    };

}