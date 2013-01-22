function Tooltip(waffle, ttCanvasID, ttTextID, ttDivID, ttContainerDivID, ttParentDivID, prefix, postfix){

    this.waffle = waffle;                           //the waffle that this tooltip is associated with
    this.canvasID = ttCanvasID;                     //target canvas
    this.ttTextID = ttTextID;                       //tooltip text
    this.ttDivID = ttDivID;                         //tooltip div
    this.ttContainerDivID = ttContainerDivID;       //tooltip container div
    this.ttParentDivID = ttParentDivID;             //tooltip parent div
    this.prefix = prefix;                           //prefixes to tooltip content lines
    this.postfix = postfix;                         //postfixes to tooltip content lines

    this.ttContainer = document.getElementById(this.ttContainerDivID);
    this.canvas = document.getElementById(this.canvasID);
    this.context = this.canvas.getContext('2d'); 
    this.ttDiv = document.getElementById(this.ttDivID)
    this.ttParent = document.getElementById(ttParentDivID);

    //old tt bin, for updates when the mouse is just sitting in the same place:
    this.oldRow = 0;
    this.oldCol = 0;
    this.allowUpdate = 0;

    //array of values from the waffle to report in the tooltip
    this.reportedValues = [this.waffle.demandVoltage, this.waffle.reportVoltage, this.waffle.reportCurrent, this.waffle.demandVrampUp, this.waffle.demandVrampDown, this.waffle.reportTemperature, this.waffle.rampStatus];

    var that = this;

    this.canvas.onmousemove = function(event){

        //force the tooltip off - patches persistency problem when moving down off the waffle.  TODO: understand persistency problem.
        that.ttDiv.style.display = 'none';

        //get mouse coords:
        var x = event.pageX - that.ttContainer.offsetLeft;   
        var y = event.pageY - that.ttContainer.offsetTop;

        //determine cell coords:
        var row = Math.floor( (event.pageY - that.ttParent.offsetTop - that.canvas.offsetTop) / that.waffle.cellSide);
        var col = Math.floor( (event.pageX - that.ttParent.offsetLeft - that.canvas.offsetLeft) / that.waffle.cellSide);
        if(row == 0) col = primaryBin(that.waffle.moduleSizes, col);

        //decide which card we're pointing at:
        var cardIndex = 0;
        if(row == 0) cardIndex = col;
        else cardIndex = primaryBin(that.waffle.moduleSizes, col);

        //are we on the primary of a card that doesn't have a primary?
        var suppressTT = 0;
        if(row==0 && that.waffle.moduleSizes[cardIndex] != 4) suppressTT = 1;

        //only continue if the cursor is actually on the waffle and not on the primary of a card that doesn't have a primary:
        if(col >= 0 && col<that.waffle.cols && row>=0 && row<that.waffle.rows && suppressTT == 0){

            //establish text:
            var newWidth = that.defineText(row, col);

            //update the size of the tool tip to fit the text:
            $(that.ttDiv).width(newWidth);
            $(that.ttDiv).height(220);

            //make the tool tip follow the mouse:
            that.ttDiv.style.top = y-220-5;
            that.ttDiv.style.left = x-newWidth-5;

            //make the tool tip appear iff the waffle is showing:
            if(window.onDisplay == that.canvasID) that.ttDiv.style.display = 'block';

            //keep track of tooltip position
            that.oldRow = row;
            that.oldCol = col;
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
            var newWidth = this.defineText(this.oldRow, this.oldCol);            

            //update the size of the tool tip to fit the text:
            $(this.ttDiv).width(newWidth);
            $(this.ttDiv).height(220);
        }
    };

    //establish the current tooltip text based on cell position; returns length of longest line 
    this.defineText = function(row, col){
        var toolTipContent = '<br>';
        var nextLine;
        var longestLine = 0;
        var cardIndex;
        var i;

        //decide which card we're pointing at:
        if(row == 0) cardIndex = col;
        else cardIndex = primaryBin(this.waffle.moduleSizes, col);

        //Title for normal channels:
        if(row != 0) nextLine = this.waffle.moduleLabels[cardIndex]+', '+this.waffle.rowTitles[0]+' '+channelMap(col, row, this.waffle.moduleSizes, this.waffle.rows)+'<br>';
        //Title for primary channels:
        else nextLine = this.waffle.moduleLabels[cardIndex]+' Primary <br>';

        //keep track of the longest line of text:
        longestLine = Math.max(longestLine, this.context.measureText(nextLine).width)
        toolTipContent += nextLine;

        //fill out tooltip content:
        for(i=0; i<this.reportedValues.length; i++){
            //establish prefix:
            nextLine = '<br/>'+this.prefix[i];
            if(this.prefix[i] !== '') nextLine += ' ';

            //pull in content; special cases for the status word and reported current:
            //status word:
            if(i == 6){
                nextLine += parseStatusWord(this.reportedValues[i][row][col]);
            }
            //current:
            else if(i == 2){
                    if(this.waffle.moduleSizes[cardIndex]==4 && row!=0) nextLine += '--';
                    else nextLine += Math.round( this.reportedValues[i][row][col]*1000)/1000 + ' ' + this.postfix[i];                
            } else {
                nextLine += Math.round( this.reportedValues[i][row][col]*1000)/1000 + ' ' + this.postfix[i];
            }

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