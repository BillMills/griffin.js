SHARC.prototype = Object.create(Subsystem.prototype);
function SHARC(){
    //basic plumbing:
    this.name = 'SHARC';                //name prefix
    var that = this;                    //pointer to self
    Subsystem.call(this);               //inject Subsystem attributes
    window.SHARCpointer = that;         //send a pointer to SHARC up to global scope
    this.dataBus = new SHARCDS();       //build the data structure to manage SHARC's info
    DetailView.call(this);              //inject the infrastructure for a detail level view

    //member variables////////////////////
    this.padsEnabled = 0;               //are the pads present?
    this.detailShowing = 0;             //is the detail view on display?

    //drawing parameters//////////////////
    this.scaleFactor = (this.padsEnabled) ? 0.67 : 1;  //scale down layers D and E to accomodate pads if present
    this.innerQuadRad = 0.02*this.canvasWidth*this.scaleFactor;
    this.outerQuadRad = 0.1*this.canvasWidth*this.scaleFactor;
    this.quadArc = 0.66*Math.PI/2;
    this.innerQuadCenterLine = this.canvasHeight*0.4;
    this.outerRowSpacing = this.canvasHeight*0.2*this.scaleFactor + this.padsEnabled*0.02*this.canvasHeight;
    this.summaryBoxWidth = 0.08*this.canvasWidth;
    this.summaryBoxHeight = 0.16*this.canvasHeight*this.scaleFactor;
    this.x0 = 0.1*this.canvasWidth;  //top left corner for TT boxes on summary view
    this.y0 = (1-this.scaleFactor)*(this.canvasHeight-this.scaleHeight)/2;
    this.TTboxWidth = 0.1*this.canvasWidth;
    this.TTboxHeight = 0.2*this.canvasHeight*this.scaleFactor;
    //detail view
    this.innerQuadRadDetail = this.canvasHeight*0.1;
    this.outerQuadRadDetail = this.canvasHeight*0.6;
    this.quadArcDetail = 0.45*Math.PI/2;
    this.detailTitles = ['Upstream Quadrant 1', 'Upstream Quadrant 2', 'Upstream Quadrant 3', 'Upstream Quadrant 4', 'Upstream Box 1', 'Upstream Box 2', 'Upstream Box 3', 'Upstream Box 4', 'Downstream Box 1', 'Downstream Box 2', 'Downstream Box 3', 'Downstream Box 4', 'Downstream Quadrant 1', 'Downstream Quadrant 2', 'Downstream Quadrant 3', 'Downstream Quadrant 4']

    //member functions////////////////////

    //draw the summary view
    this.draw = function(frame){
        var colors, i, j, name, increment, index;

        for(i=1; i<5; i++){
            //upstream quad fronts:
            colors = [];
            for(j=0; j<4; j++){
                name = 'SHQ0' + i + 'DP' + j;
                colors[colors.length] = frameColor(this.dataBus.summary[name], frame, this.nFrames);
            }
            radialQuadrant(this.context, this.canvasWidth*(0.15 + 0.1*((i-1)%2)), this.innerQuadCenterLine + this.outerRowSpacing*Math.pow(-1, Math.ceil(i/2)), this.innerQuadRad, this.outerQuadRad, this.quadArc, Math.pow(-1, Math.ceil(i/2))*Math.PI/2, colors);           
            //downstream quad fronts:
            colors = [];
            for(j=0; j<4; j++){
                name = 'SHQ' + (i+12) + 'DP' + j;
                colors[colors.length] = frameColor(this.dataBus.summary[name], frame, this.nFrames);
            }
            radialQuadrant(this.context, this.canvasWidth*(0.75 + 0.1*((i-1)%2)), this.innerQuadCenterLine + this.outerRowSpacing*Math.pow(-1, Math.ceil(i/2)), this.innerQuadRad, this.outerQuadRad, this.quadArc, Math.pow(-1, Math.ceil(i/2))*Math.PI/2, colors);           

            //upstream quad backs:
            colors = [];
            for(j=0; j<4; j++){
                name = 'SHQ0' + i + 'EN' + j;
                colors[colors.length] = frameColor(this.dataBus.summary[name], frame, this.nFrames);
            }
            azimuthalQuadrant(this.context, this.canvasWidth*(0.15 + 0.1*((i-1)%2)), this.innerQuadCenterLine, this.innerQuadRad, this.outerQuadRad, this.quadArc, Math.pow(-1, Math.ceil(i/2))*Math.PI/2, colors);          
            //downstream quad backs:
            colors = [];
            for(j=0; j<4; j++){
                name = 'SHQ' + (i+12) + 'EN' + j;
                colors[colors.length] = frameColor(this.dataBus.summary[name], frame, this.nFrames);
            }
            azimuthalQuadrant(this.context, this.canvasWidth*(0.75 + 0.1*((i-1)%2)), this.innerQuadCenterLine, this.innerQuadRad, this.outerQuadRad, this.quadArc, Math.pow(-1, Math.ceil(i/2))*Math.PI/2, colors);

            //upstream box fronts:
            colors = [];
            for(j=0; j<4; j++){
                name = 'SHB0' + (i+4) + 'DP' + j;
                colors[colors.length] = frameColor(this.dataBus.summary[name], frame, this.nFrames);
            }
            boxFront(this.context, this.canvasWidth*(0.31+0.1*((i+1)%2)), this.canvasHeight*(0.22+0.2*Math.floor((i-1)/2)) + (1-this.scaleFactor)/this.scaleFactor*this.summaryBoxHeight*(1-Math.floor((i-1)/2)), this.summaryBoxHeight, this.summaryBoxWidth, colors);

            //downstream box fronts:
            colors = [];
            for(j=0; j<4; j++){
                name = 'SHB' + ( (i+8<10) ? '0'+(i+8) : (i+8) ) + 'DP' + j;
                colors[colors.length] = frameColor(this.dataBus.summary[name], frame, this.nFrames);
            }
            boxFront(this.context, this.canvasWidth*(0.51+0.1*((i+1)%2)), this.canvasHeight*(0.22+0.2*Math.floor((i-1)/2)) + (1-this.scaleFactor)/this.scaleFactor*this.summaryBoxHeight*(1-Math.floor((i-1)/2)), this.summaryBoxHeight, this.summaryBoxWidth, colors);

            //upstream box backs:
            colors = [];
            for(j=0; j<4; j++){
                name = 'SHB0' + (i+4) + 'EN' + j;
                colors[colors.length] = frameColor(this.dataBus.summary[name], frame, this.nFrames);
            }
            boxBack(this.context, this.canvasWidth*(0.31+0.1*((i+1)%2)), this.canvasHeight*(0.02+0.6*Math.floor((i-1)/2)) + (1-this.scaleFactor)/this.scaleFactor*this.summaryBoxHeight*( (i<3) ? 2:-1 ), this.summaryBoxHeight, this.summaryBoxWidth, colors);
            //downstream box backs:
            colors = [];
            for(j=0; j<4; j++){
                name = 'SHB' + ( (i+8<10) ? '0'+(i+8) : (i+8) ) + 'EN' + j;
                colors[colors.length] = frameColor(this.dataBus.summary[name], frame, this.nFrames);
            }
            boxBack(this.context, this.canvasWidth*(0.51+0.1*((i+1)%2)), this.canvasHeight*(0.02+0.6*Math.floor((i-1)/2)) + (1-this.scaleFactor)/this.scaleFactor*this.summaryBoxHeight*( (i<3) ? 2:-1 ), this.summaryBoxHeight, this.summaryBoxWidth, colors);            
            
        }

        //decorations & TT:
        if(frame==this.nFrames || frame==0){ 
            //beamline:
            this.context.strokeStyle = '#999999';
            this.context.moveTo(this.canvasWidth*0.1, this.canvasHeight*0.4);
            this.context.lineTo(this.canvasWidth*0.9, this.canvasHeight*0.4);
            this.context.lineTo(this.canvasWidth*0.9 - 15, this.canvasHeight*0.4 - 15);
            this.context.stroke();
/*
            //temporary grid lines:
            for(var i = 1; i<10; i++){
                this.context.moveTo(i*this.canvasWidth/10, 0);
                this.context.lineTo(i*this.canvasWidth/10, this.canvasHeight);
                this.context.stroke();
            }
*/
            //scale:
            this.drawScale(this.context);

            index = 1;
            for(i=0; i<32; i++){
                this.TTcontext.fillStyle = 'rgba('+index+','+index+','+index+',1)';
                this.TTcontext.fillRect(this.x0 + this.TTboxWidth*Math.floor(i/4), this.y0 + this.TTboxHeight*(i%4), this.TTboxWidth, this.TTboxHeight);

                
                if((i+1)%4 == 1) increment = 1;
                else if((i+1)%4 == 2) increment = 4;
                else if((i+1)%4 == 3) increment = -1;
                else if((i+1)%8 == 4) increment = -2;
                else if((i+1)%8 == 0) increment = 2;
                index += increment;

            }

        }
    };

    this.drawDetail = function(x, frame){  //animatedetail expects the first argument to be the detail context - refactor to eliminate.
        var colors = [], TTcolors = [],
            i, name,
            arrayElt = Math.ceil(this.detailShowing/2);

        this.detailContext.clearRect(0,0, this.canvasWidth, this.canvasHeight-this.scaleHeight);
        this.TTdetailContext.fillStyle = '#FEDCBA'
        this.TTdetailContext.fillRect(0,0, this.canvasWidth, this.canvasHeight);
        //title
        this.detailContext.fillStyle = '#999999';
        this.detailContext.font = '20px Orbitron';
        this.detailContext.fillText(this.detailTitles[arrayElt-1], this.canvasWidth/2 - this.detailContext.measureText(this.detailTitles[arrayElt-1]).width/2, this.canvasHeight*0.75 );

        //quadrant details
        if(arrayElt < 5 || arrayElt > 12){

            //subtitles:
            this.detailContext.fillText('Front', this.canvasWidth*0.3 - this.detailContext.measureText('Front').width/2, this.canvasHeight*0.67);
            this.detailContext.fillText('Back', this.canvasWidth*0.7 - this.detailContext.measureText('Back').width/2, this.canvasHeight*0.67);

            //front side:
            colors = [];
            TTcolors = [];
            for(i=0; i<16; i++){
                name = 'SHQ' + ( (arrayElt < 10) ? '0'+arrayElt : arrayElt ) + 'DP' + ( (i<10) ? '0'+i : i ) + 'X';
                colors[colors.length] = frameColor(this.dataBus.SHARC[name], frame, this.nFrames);
                TTcolors[TTcolors.length] = 'rgba('+i+','+i+','+i+',1)';
            }
            radialQuadrant(this.detailContext, this.canvasWidth*0.3, this.canvasHeight*0.7, this.innerQuadRadDetail, this.outerQuadRadDetail, this.quadArcDetail, -Math.PI/2, colors);
            radialQuadrant(this.TTdetailContext, this.canvasWidth*0.3, this.canvasHeight*0.7, this.innerQuadRadDetail, this.outerQuadRadDetail, this.quadArcDetail, -Math.PI/2, TTcolors, 1);

            //back side:
            colors = [];
            TTcolors = [];
            for(i=0; i<24; i++){
                name = 'SHQ' + ( (arrayElt < 10) ? '0'+arrayElt : arrayElt ) + 'EN' + ( (i<10) ? '0'+i : i ) + 'X';
                colors[colors.length] = frameColor(this.dataBus.SHARC[name], frame, this.nFrames);
                TTcolors[TTcolors.length] = 'rgba('+(i+16)+','+(i+16)+','+(i+16)+',1)';
            }
            azimuthalQuadrant(this.detailContext, this.canvasWidth*0.7, this.canvasHeight*0.7, this.innerQuadRadDetail, this.outerQuadRadDetail, this.quadArcDetail, -Math.PI/2, colors);
            azimuthalQuadrant(this.TTdetailContext, this.canvasWidth*0.7, this.canvasHeight*0.7, this.innerQuadRadDetail, this.outerQuadRadDetail, this.quadArcDetail, -Math.PI/2, TTcolors, 1);

        } else{  //box details

            //subtitles:
            this.detailContext.fillText('Front', this.canvasWidth*0.29 - this.detailContext.measureText('Front').width/2, this.canvasHeight*0.7);
            this.detailContext.fillText('Back', this.canvasWidth*0.71 - this.detailContext.measureText('Back').width/2, this.canvasHeight*0.7);

            //front side:
            colors = [];
            TTcolors = [];
            for(i=0; i<24; i++){
                name = 'SHB' + ( (arrayElt < 10) ? '0'+arrayElt : arrayElt ) + 'DP' + ( (i<10) ? '0'+i : i ) + 'X';
                colors[colors.length] = frameColor(this.dataBus.SHARC[name], frame, this.nFrames);
                TTcolors[TTcolors.length] = 'rgba('+i+','+i+','+i+',1)';
            }
            boxFront(this.detailContext, 0.1*this.canvasWidth,0.05*this.canvasHeight, 0.60*this.canvasHeight, 0.38*this.canvasWidth, colors);
            boxFront(this.TTdetailContext, 0.1*this.canvasWidth,0.05*this.canvasHeight, 0.60*this.canvasHeight, 0.38*this.canvasWidth, TTcolors, 1);

            //back side:
            colors = [];
            TTcolors = [];
            for(i=0; i<48; i++){
                name = 'SHB' + ( (arrayElt < 10) ? '0'+arrayElt : arrayElt ) + 'EN' + ( (i<10) ? '0'+i : i ) + 'X';
                colors[colors.length] = frameColor(this.dataBus.SHARC[name], frame, this.nFrames);
                TTcolors[TTcolors.length] = 'rgba('+(i+24)+','+(i+24)+','+(i+24)+',1)';
            }
            boxBack(this.detailContext, 0.52*this.canvasWidth, 0.05*this.canvasHeight, 0.60*this.canvasHeight, 0.38*this.canvasWidth, colors);
            boxBack(this.TTdetailContext, 0.52*this.canvasWidth, 0.05*this.canvasHeight, 0.60*this.canvasHeight, 0.38*this.canvasWidth, TTcolors, 1);
        }

        //decorations & TT:
        if(frame==this.nFrames || frame==0){ 
            //scale:
            this.drawScale(this.detailContext);
        }
    }

    this.defineText = function(cell){
        var i, name,
            objects = [], 
            keys = ['HV', 'threshold', 'rate'],
            arrayElt;

        if(this.detailShowing == 0){
            arrayElt = Math.ceil(cell/2);
            //quadrants
            if(arrayElt < 5 || arrayElt > 12){
                //fronts
                if(cell%2){
                    for(i=0; i<16; i++){
                        objects[objects.length] = 'SHQ' + ( (arrayElt < 10) ? '0'+arrayElt : arrayElt ) + 'DP' + ( (i<10) ? '0'+i : i ) + 'X';
                    }
                } else { //backs
                    for(i=0; i<24; i++){
                        objects[objects.length] = 'SHQ' + ( (arrayElt < 10) ? '0'+arrayElt : arrayElt ) + 'EN' + ( (i<10) ? '0'+i : i ) + 'X';
                    }
                }            
            } else{ //boxes
                //fronts
                if(cell%2 == 0){
                    for(i=0; i<24; i++){
                        objects[objects.length] = 'SHB' + ( (arrayElt < 10) ? '0'+arrayElt : arrayElt ) + 'DP' + ( (i<10) ? '0'+i : i ) + 'X';
                    }
                } else { //backs
                    //backs
                    for(i=0; i<48; i++){
                        objects[objects.length] = 'SHB' + ( (arrayElt < 10) ? '0'+arrayElt : arrayElt ) + 'EN' + ( (i<10) ? '0'+i : i ) + 'X';
                    } 
                }

            }
            document.getElementById(this.name+'TT').innerHTML = '';
            TTtable(this.name+'TT', this.dataBus.SHARC , objects, keys, objects[0].slice(0,5) + ( (objects[0].slice(5,7) == 'DP') ? ' (front)' : ' (back)' ), ['HV [V]', 'Threhsold [ADC Units]', 'Rate [Hz]'], 2);
        } else {
            arrayElt = Math.ceil(this.detailShowing/2);
            if(arrayElt < 5 || arrayElt > 12){
                name = 'SHQ' + ( (arrayElt < 10) ? '0'+arrayElt : arrayElt ) + ( (cell < 16) ? ('DP' + ((cell<10)?'0'+cell:cell) ) : ('EN' + ((cell-16<10)?'0'+(cell-16):(cell-16))) ) + 'X'
            } else {
                name = 'SHB' + ( (arrayElt < 10) ? '0'+arrayElt : arrayElt ) + ( (cell < 24) ? ('DP' + ((cell<10)?'0'+cell:cell) ) : ('EN' + ((cell-24<10)?'0'+(cell-24):(cell-24))) ) + 'X'
            }
            
            document.getElementById(this.detailTooltip.ttDivID).innerHTML = name + '<br><br>' + this.baseTTtext(this.dataBus.SHARC[name].HV, this.dataBus.SHARC[name].threshold, this.dataBus.SHARC[name].rate);

        }

    };

    //get new data
    this.fetchNewData = function(){
        
        var key, normalization, quarter;

        //zero out the summary:
        for(key in this.dataBus.summary){
            if(this.dataBus.summary.hasOwnProperty(key)){
                this.dataBus.summary[key].HV = 0;
                this.dataBus.summary[key].threshold = 0;
                this.dataBus.summary[key].rate = 0;
            }
        }

        //fetch data, plug into detail level and increment summary cells:
        for(key in this.dataBus.SHARC){
            if(window.JSONPstore['thresholds']){
                if(window.JSONPstore['thresholds'][key]){
                    this.dataBus.SHARC[key]['threshold'] = window.JSONPstore['thresholds'][key];
                    quarter = Math.floor(parseInt(key.slice(7,9)) / this.sizeOfQuarter(key));
                    this.dataBus.summary[key.slice(0,7) + quarter].threshold += window.JSONPstore['thresholds'][key];
                } else
                    this.dataBus.SHARC[key]['threshold'] = 0xDEADBEEF;
            }

            if(window.JSONPstore['scalar']){
                if(window.JSONPstore['scalar'][key]){
                    this.dataBus.SHARC[key]['rate'] = window.JSONPstore['scalar'][key]['TRIGREQ'];
                    quarter = Math.floor(parseInt(key.slice(7,9)) / this.sizeOfQuarter(key));
                    this.dataBus.summary[key.slice(0,7) + quarter].rate += window.JSONPstore['scalar'][key]['TRIGREQ'];
                } else 
                    this.dataBus.SHARC[key]['rate'] = 0xDEADBEEF;
            }
        }

        //average the summary level cells:
        for(key in this.dataBus.summary){
            if(this.dataBus.summary.hasOwnProperty(key)){
                this.dataBus.summary[key].HV /= this.sizeOfQuarter(key);
                this.dataBus.summary[key].threshold /= this.sizeOfQuarter(key);
                this.dataBus.summary[key].rate /= this.sizeOfQuarter(key);
            }
        }
        

    };

    //given a SHARC key, return 1/4 the number of segments in that type of detector
    this.sizeOfQuarter = function(key){

        if(key.slice(0,3) == 'SHB'){
            if(key.slice(5,7) == 'DP')
                return 6;
            else if(key.slice(5,7) == 'EN')
                return 12;
        } else if(key.slice(0,3) == 'SHQ'){
            if(key.slice(5,7) == 'DP')
                return 4;
            else if(key.slice(5,7) == 'EN')
                return 6;
        }        
    };

}


