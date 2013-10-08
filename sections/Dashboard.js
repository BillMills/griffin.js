function Dashboard(){

    var subsPresent, subsNames, key, that = this;

	this.wrapperID = window.parameters.wrapper;             //ID of wrapping div
	this.canvasID = 'DashboardCanvas';	                    //ID of canvas to paint dashboard on
    this.linkWrapperID = 'DashboardLinks';                  //ID of div to contain clock view header
    this.sidebarID = 'dashboardMenus';                      //ID of dashboard sidebar div
    this.labels = [ODB.topLevel.HPGeArray, ODB.topLevel.HPGeArray, ODB.topLevel.HPGeArray, 0, 0, 0, 'DUMP']      //names of corona, downstream lamp, upstream lamp, corona auxilary, chamber ds, chamber us, beamdump detectors
    this.pointers = []; //global pointers to subsystems, to fetch the correct total rate for each section
    //colors:
    this.USLcolor = '#000000';
    this.USLoldColor = '#000000';
    this.coronaColor = '#000000';
    this.coronaOldColor = '#000000';
    this.auxCoronaColor = '#000000';
    this.auxCoronaOldColor = '#000000';
    this.DSLcolor = '#000000';
    this.DSLoldColor = '#000000';
    this.DSchamberColor = '#000000';
    this.DSchamberOldColor = '#000000';
    this.USchamberColor = '#000000';
    this.USchamberOldColor = '#000000';
    this.dumpColor = '#000000';
    this.dumpOldColor = '#000000';

    //determine which detectors go where:
    //HPGe, overwritten below if absent:
    this.pointers[0] = window.HPGepointer;
    this.pointers[1] = window.HPGepointer;
    this.pointers[2] = window.HPGepointer;
    //corona auxilary
    if(ODB.DANTE.deploy){
        this.labels[3] = 'DANTE';
        this.pointers[3] = window.DANTEpointer;
    }
    //chamber
    if(ODB.BAMBINO.USdeploy){  //upstream BAMBINO
        this.labels[5] = 'BAMBINO';
        this.pointers[5] = window.BAMBINOpointer;
    }
    if(ODB.BAMBINO.DSdeploy){  //downstream BAMBINO
        this.labels[4] = 'BAMBINO';
        this.pointers[5] = window.BAMBINOpointer;
    }
    if(ODB.SHARC.deploy){
        this.labels[4] = 'SHARC';
        this.pointers[4] = window.SHARCpointer;
    }
    if(ODB.TIPwall.deploy){
        this.labels[4] = 'TIP Wall';
        this.pointers[4] = window.TIPwallpointer;
    }
    if(ODB.TIPball.deploy){
        this.labels[4] = 'TIP Ball';
        this.pointers[4] = window.TIPballpointer;
    }
    if(ODB.SCEPTAR.USdeploy){ //upstream SCEPTAR
        this.labels[5] = 'SCEPTAR';
        this.pointers[5] = window.SCEPTARpointer;
    }
    if(ODB.SCEPTAR.DSdeploy == 1){ //downstream SCEPTAR
        this.labels[4] = 'SCEPTAR';
        this.pointers[4] = window.SCEPTARpointer;
    }
    if(ODB.SCEPTAR.DSdeploy == 2){ //ZDS
        this.labels[4] = 'ZDS';
        this.pointers[4] = window.ZDSpointer;
    }
    if(ODB.PACES.deploy){
        this.labels[5] = 'PACES';
        this.pointers[5] = window.PACESpointer;
    }
    if(ODB.SPICE.deploy){
        this.labels[5] = 'SPICE';
        this.pointers[5] = window.SPICEpointer;
    }
    //downstream lampshade
    if(ODB.DESCANT.deploy){
        this.labels[1] = 'DESCANT';
        this.pointers[1] = window.DESCANTpointer;
    }
    //upstream lampshade
    if(ODB.SPICE.deploy){
        this.labels[2] = 0;
        this.pointers[2] = window.SPICEpointer;
    }

	this.wrapper = document.getElementById(this.wrapperID);

    //right sidebar menus
    subsPresent = [ODB.topLevel.HPGeArray];
    subsNames = [ODB.topLevel.HPGeArray];
    for(key in window.parameters.deployment){
        if(window.parameters.deployment[key] && key!='HPGe'){
            subsPresent[subsPresent.length] = key;
            if(key == 'TIPwall')
                subsNames[subsNames.length] = 'TIP Wall';
            else if(key == 'TIPball')
                subsNames[subsNames.length] = 'TIP Ball'
            else
                subsNames[subsNames.length] = key;
        }
    }
    deployMenu(this.sidebarID, subsPresent , subsNames);

    //add top level nav button:
    injectDOM('button', 'DashboardButton', 'statusLink', {
        'class' : 'navLinkDown',
        'innerHTML' : 'Dashboard',
        'type' : 'button',
        'onclick' : function(){swapView('DashboardLinks', 'DashboardCanvas', 'dashboardMenus', 'DashboardButton'); rePaint();}
    });

    //nav wrapper div
    injectDOM('div', this.linkWrapperID, this.wrapperID, {'class':'navPanel'});
    //dashboard is the initial view, put the navbar on top:
    document.getElementById(this.linkWrapperID).setAttribute('style', 'z-index:1; opacity:1;')

    //nav header
    injectDOM('h1', 'DashboardLinksBanner', this.linkWrapperID, {'class':'navPanelHeader', 'innerHTML':ODB.topLevel.expName+' Dashboard'});
    injectDOM('br', 'break', this.linkWrapperID, {});

	//deploy a canvas for the dashboard view:
    this.canvasWidth = 0.48*$(this.wrapper).width();
    this.canvasHeight = 0.9*$(this.wrapper).height();
    injectDOM('canvas', this.canvasID, this.wrapperID, {'class':'monitor', 'style':'position:absolute; left:24%; top:' + ($('#DashboardLinks').height() + 5) +'px;'});
    this.canvas = document.getElementById('DashboardCanvas');
    this.context = this.canvas.getContext('2d');
    this.canvas.setAttribute('width', this.canvasWidth)
    this.canvas.setAttribute('height', this.canvasHeight)
    this.scaleHeight = 0.2*this.canvasHeight;

    this.canvas.onclick =   function(event){
                                var y,
                                    coords = this.relMouseCoords(event);
                                y = coords.y;
                                if(y>that.canvasHeight - that.scaleHeight){
                                    parameterDialogue('Dashboard', [ ['Rate', parseFloat(ODB.Dashboard.dashboardMin), parseFloat(ODB.Dashboard.dashboardMax), 'Hz', '/DashboardConfig/Dashboard/dashboardMin', '/DashboardConfig/Dashboard/dashboardMax' ]  ], 'Sunset' );
                                }
                            };

    //drawing parameters:
    this.x0 = this.canvasWidth / 2;
    this.y0 = this.canvasHeight*0.4;
    this.outerRad = this.canvasHeight*0.36;
    this.innerRad = this.canvasHeight*0.2;
    this.gapArc = Math.PI/180 * 5;
    this.lampshadeArc = Math.PI/180 * 25;
    this.coronaArc = Math.PI/180 * 60;
    this.auxCoronaArc = Math.PI/180 * 10;
    this.beampipeArc = Math.PI - this.coronaArc - 2*this.auxCoronaArc - 4*this.gapArc - 2*this.lampshadeArc;



    //establish animation parameters////////////////////////////////////////////////////////////////////
    this.FPS = 30;
    this.duration = 0.5;
    this.nFrames = this.FPS*this.duration;

    //data buffers///////////////////////////

    //member functions/////////////////////////////////////////////

    this.draw = function(frame){
        var fill;

        this.context.strokeStyle = '#999999';
        this.context.lineWidth = 1;

        this.context.clearRect(0,0,this.canvasWidth, this.canvasHeight-this.scaleHeight);

        //downstream lampshade
        fill = interpolateColor(parseHexColor(this.DSLoldColor), parseHexColor(this.DSLcolor), frame/this.nFrames);
        this.context.fillStyle = (fill==0xDEADBEEF) ? this.context.createPattern(window.parameters.warningFill, 'repeat') : fill;
        //port side
        this.context.beginPath();
        this.context.arc(this.x0, this.y0, this.outerRad, -this.coronaArc/2 - 2*this.gapArc - this.auxCoronaArc - 2*this.lampshadeArc - this.beampipeArc, -this.coronaArc/2 - 2*this.gapArc - this.auxCoronaArc - this.lampshadeArc - this.beampipeArc, false);
        this.context.arc(this.x0, this.y0, this.innerRad, -this.coronaArc/2 - 2*this.gapArc - this.auxCoronaArc - this.lampshadeArc - this.beampipeArc, -this.coronaArc/2 - 2*this.gapArc - this.auxCoronaArc - 2*this.lampshadeArc - this.beampipeArc, true);
        this.context.closePath();
        this.context.fill();
        this.context.stroke();
        //starboard side
        this.context.beginPath();
        this.context.arc(this.x0, this.y0, this.outerRad, -this.coronaArc/2 - 2*this.gapArc - this.auxCoronaArc - this.lampshadeArc, -this.coronaArc/2 - 2*this.gapArc - this.auxCoronaArc, false);
        this.context.arc(this.x0, this.y0, this.innerRad, -this.coronaArc/2 - 2*this.gapArc - this.auxCoronaArc, -this.coronaArc/2 - 2*this.gapArc - this.auxCoronaArc - this.lampshadeArc, true);
        this.context.closePath();
        this.context.fill();
        this.context.stroke();      

        if(this.labels[2]){
            //upstream lampshade  
            fill = interpolateColor(parseHexColor(this.USLoldColor), parseHexColor(this.USLcolor), frame/this.nFrames);
            this.context.fillStyle = (fill==0xDEADBEEF) ? this.context.createPattern(window.parameters.warningFill, 'repeat') : fill;
            //port side
            this.context.beginPath();
            this.context.arc(this.x0, this.y0, this.outerRad, -1.5*this.coronaArc - 6*this.gapArc - 3*this.auxCoronaArc - 3*this.lampshadeArc - this.beampipeArc, -1.5*this.coronaArc - 6*this.gapArc - 3*this.auxCoronaArc - 2*this.lampshadeArc - this.beampipeArc, false);
            this.context.arc(this.x0, this.y0, this.innerRad, -1.5*this.coronaArc - 6*this.gapArc - 3*this.auxCoronaArc - 2*this.lampshadeArc - this.beampipeArc, -1.5*this.coronaArc - 6*this.gapArc - 3*this.auxCoronaArc - 3*this.lampshadeArc - this.beampipeArc, true);
            this.context.closePath();
            this.context.fill();
            this.context.stroke();
            //starboard side
            this.context.beginPath();
            this.context.arc(this.x0, this.y0, this.outerRad, this.coronaArc/2 + 2*this.gapArc + this.auxCoronaArc, this.coronaArc/2 + 2*this.gapArc + this.auxCoronaArc + this.lampshadeArc, false);
            this.context.arc(this.x0, this.y0, this.innerRad, this.coronaArc/2 + 2*this.gapArc + this.auxCoronaArc + this.lampshadeArc, this.coronaArc/2 + 2*this.gapArc + this.auxCoronaArc, true);
            this.context.closePath();
            this.context.fill();
            this.context.stroke();  
        }

        if(this.labels[3]){
            //downstream auxillary corona
            fill = interpolateColor(parseHexColor(this.auxCoronaOldColor), parseHexColor(this.auxCoronaColor), frame/this.nFrames);
            this.context.fillStyle = (fill==0xDEADBEEF) ? this.context.createPattern(window.parameters.warningFill, 'repeat') : fill;
            //port side
            this.context.beginPath();
            this.context.arc(this.x0, this.y0, this.outerRad, -this.coronaArc/2 - 3*this.gapArc - 2*this.auxCoronaArc - 2*this.lampshadeArc - this.beampipeArc, -this.coronaArc/2 - 3*this.gapArc - this.auxCoronaArc - 2*this.lampshadeArc - this.beampipeArc, false);
            this.context.arc(this.x0, this.y0, this.innerRad, -this.coronaArc/2 - 3*this.gapArc - this.auxCoronaArc - 2*this.lampshadeArc - this.beampipeArc, -this.coronaArc/2 - 3*this.gapArc - 2*this.auxCoronaArc - 2*this.lampshadeArc - this.beampipeArc, true);
            this.context.closePath();
            this.context.fill();
            this.context.stroke();
            //starboard side
            this.context.beginPath();
            this.context.arc(this.x0, this.y0, this.outerRad, -this.coronaArc/2 - this.gapArc - this.auxCoronaArc, -this.coronaArc/2 - this.gapArc, false);
            this.context.arc(this.x0, this.y0, this.innerRad, -this.coronaArc/2 - this.gapArc, -this.coronaArc/2 - this.gapArc - this.auxCoronaArc, true);
            this.context.closePath();
            this.context.fill();
            this.context.stroke();      

            //upstream auxilary corona
            //port side
            this.context.beginPath();
            this.context.arc(this.x0, this.y0, this.outerRad, -1.5*this.coronaArc - 5*this.gapArc - 3*this.auxCoronaArc - 2*this.lampshadeArc - this.beampipeArc, -1.5*this.coronaArc - 5*this.gapArc - 2*this.auxCoronaArc - 2*this.lampshadeArc - this.beampipeArc, false);
            this.context.arc(this.x0, this.y0, this.innerRad, -1.5*this.coronaArc - 5*this.gapArc - 2*this.auxCoronaArc - 2*this.lampshadeArc - this.beampipeArc, -1.5*this.coronaArc - 5*this.gapArc - 3*this.auxCoronaArc - 2*this.lampshadeArc - this.beampipeArc, true);
            this.context.closePath();
            this.context.fill();
            this.context.stroke();
            //starboard side
            this.context.beginPath();
            this.context.arc(this.x0, this.y0, this.outerRad, this.coronaArc/2 + this.gapArc, this.coronaArc/2 + this.gapArc + this.auxCoronaArc, false);
            this.context.arc(this.x0, this.y0, this.innerRad, this.coronaArc/2 + this.gapArc + this.auxCoronaArc, this.coronaArc/2 + this.gapArc, true);
            this.context.closePath();
            this.context.fill();
            this.context.stroke();      
        }

        //corona
        fill = interpolateColor(parseHexColor(this.coronaOldColor), parseHexColor(this.coronaColor), frame/this.nFrames);
        this.context.fillStyle = (fill==0xDEADBEEF) ? this.context.createPattern(window.parameters.warningFill, 'repeat') : fill;
        //port corona
        this.context.beginPath();
        this.context.arc(this.x0, this.y0, this.outerRad, -Math.PI -0.5*this.coronaArc, -Math.PI + 0.5*this.coronaArc, false);
        this.context.arc(this.x0, this.y0, this.innerRad, -Math.PI + 0.5*this.coronaArc, -Math.PI - 0.5*this.coronaArc, true);
        this.context.closePath();
        this.context.fill();
        this.context.stroke();
        //starboard corona
        this.context.beginPath();
        this.context.arc(this.x0, this.y0, this.outerRad, -0.5*this.coronaArc, 0.5*this.coronaArc, false);
        this.context.arc(this.x0, this.y0, this.innerRad, 0.5*this.coronaArc, -0.5*this.coronaArc, true);
        this.context.closePath();
        this.context.fill();
        this.context.stroke();

        //target chamber
        if(this.labels[4]){
            //downstream
            fill = interpolateColor(parseHexColor(this.DSchamberOldColor), parseHexColor(this.DSchamberColor), frame/this.nFrames);
            this.context.fillStyle = (fill==0xDEADBEEF) ? this.context.createPattern(window.parameters.warningFill, 'repeat') : fill;
            this.context.fillRect(this.x0 - 0.75*this.innerRad/2, this.y0-this.innerRad/2, 0.75*this.innerRad, this.innerRad/10);
            this.context.strokeRect(this.x0 - 0.75*this.innerRad/2, this.y0-this.innerRad/2, 0.75*this.innerRad, this.innerRad/10);
        }
        if(this.labels[5]){
            //upstream
            fill = interpolateColor(parseHexColor(this.USchamberOldColor), parseHexColor(this.USchamberColor), frame/this.nFrames);
            this.context.fillStyle = (fill==0xDEADBEEF) ? this.context.createPattern(window.parameters.warningFill, 'repeat') : fill;
            this.context.fillRect(this.x0 - 0.75*this.innerRad/2, this.y0+this.innerRad/2 - this.innerRad/10, 0.75*this.innerRad, this.innerRad/10);
            this.context.strokeRect(this.x0 - 0.75*this.innerRad/2, this.y0+this.innerRad/2 - this.innerRad/10, 0.75*this.innerRad, this.innerRad/10);
        }

        //beamdump
        fill = interpolateColor(parseHexColor(this.dumpOldColor), parseHexColor(this.dumpColor), frame/this.nFrames);
        this.context.fillStyle = (fill==0xDEADBEEF) ? this.context.createPattern(window.parameters.warningFill, 'repeat') : fill;
        this.context.fillRect(this.x0 - this.canvasHeight*0.08, this.canvasHeight*0.008, this.canvasHeight*0.16, this.canvasHeight*0.4 - this.outerRad - 2*this.canvasHeight*0.008);
        this.context.strokeRect(this.x0 - this.canvasHeight*0.08, this.canvasHeight*0.008, this.canvasHeight*0.16, this.canvasHeight*0.4 - this.outerRad - 2*this.canvasHeight*0.008);

        //beam arrow
        this.context.lineWidth = 2;
        this.context.beginPath();
        this.context.moveTo(this.x0, this.canvasHeight*0.98*0.8);
        this.context.lineTo(this.x0, this.canvasHeight*0.78*0.8);
        this.context.lineTo(this.x0 - this.canvasHeight*0.02*0.8, this.canvasHeight*0.78*0.8 + this.canvasHeight*0.02*0.8);
        this.context.stroke();

        //labels
        this.context.font = Math.min(20,fitFont(this.context, this.labels[3], this.outerRad*(this.gapArc+this.auxCoronaArc)))+'px Orbitron';
        this.context.fillStyle = '#999999';
        this.context.textBaseline = 'alphabetic';
        //corona
        curveText(this.labels[0], this.context, this.x0, this.y0, this.outerRad*1.02, -Math.PI/2 - this.context.measureText(this.labels[0]).width/2/this.outerRad*1.02);
        curveText(this.labels[0], this.context, this.x0, this.y0, this.outerRad*1.02, Math.PI/2 - this.context.measureText(this.labels[0]).width/2/this.outerRad*1.02);
        //downstream auxilary corona
        curveText(this.labels[3], this.context, this.x0, this.y0, this.outerRad*1.02, -(this.beampipeArc/2+this.lampshadeArc+this.gapArc+this.auxCoronaArc/2) - this.context.measureText(this.labels[3]).width/2/this.outerRad*1.02);
        curveText(this.labels[3], this.context, this.x0, this.y0, this.outerRad*1.02, this.beampipeArc/2+this.lampshadeArc+this.gapArc+this.auxCoronaArc/2 - this.context.measureText(this.labels[3]).width/2/this.outerRad*1.02);        
        //upstream auxilary corona
        curveText(this.labels[3], this.context, this.x0, this.y0, this.outerRad*1.02, Math.PI-(this.beampipeArc/2+this.lampshadeArc+this.gapArc+this.auxCoronaArc/2) - this.context.measureText(this.labels[3]).width/2/this.outerRad*1.02);
        curveText(this.labels[3], this.context, this.x0, this.y0, this.outerRad*1.02, Math.PI+this.beampipeArc/2+this.lampshadeArc+this.gapArc+this.auxCoronaArc/2 - this.context.measureText(this.labels[3]).width/2/this.outerRad*1.02); 
        //downstream lampshade
        curveText(this.labels[1], this.context, this.x0, this.y0, this.outerRad*1.02, -(this.beampipeArc + this.lampshadeArc)/2 - this.context.measureText(this.labels[1]).width/2/this.outerRad*1.02);
        curveText(this.labels[1], this.context, this.x0, this.y0, this.outerRad*1.02, (this.beampipeArc + this.lampshadeArc)/2 - this.context.measureText(this.labels[1]).width/2/this.outerRad*1.02);
        //upstream lampshade
        curveText(this.labels[2], this.context, this.x0, this.y0, this.outerRad*1.02, Math.PI-(this.beampipeArc + this.lampshadeArc)/2 - this.context.measureText(this.labels[2]).width/2/this.outerRad*1.02);
        curveText(this.labels[2], this.context, this.x0, this.y0, this.outerRad*1.02, Math.PI+(this.beampipeArc + this.lampshadeArc)/2 - this.context.measureText(this.labels[2]).width/2/this.outerRad*1.02);  
        //target chamber (downstream)
        if(this.labels[4]){
            this.context.font = Math.min(20,fitFont(this.context, this.labels[4], this.innerRad*1.9))+'px Orbitron';
            this.context.textBaseline = 'top';
            this.context.fillText(this.labels[4], this.x0 - this.context.measureText(this.labels[4]).width/2, this.y0 - 0.34*this.innerRad);
        }
        //target chamber (upstream)        
        if(this.labels[5]){
            this.context.font = Math.min(20,fitFont(this.context, this.labels[5], this.innerRad*1.9))+'px Orbitron';
            this.context.textBaseline = 'bottom';
            this.context.fillText(this.labels[5], this.x0 - this.context.measureText(this.labels[5]).width/2, this.y0 + 0.4*this.innerRad);
        }
        //beam dump
        this.context.font = Math.min(20,fitFont(this.context, this.labels[6], this.canvasHeight*0.16*0.8))+'px Orbitron';
        this.context.textBaseline = 'top';
        this.context.fillText(this.labels[6], this.x0 - this.context.measureText(this.labels[6]).width/2, this.canvasHeight*0.4 - this.outerRad); 

        if(frame==0)
            this.drawScale();       
    };

    this.animate = function(){
        if(window.onDisplay == this.canvasID) animate(this, 0);
        else this.draw(this.nFrames);
    };


    this.update = function(){
        this.fetchNewData();

        this.animate();
    };

    //parse the count rates into colors for each sector:
    this.fetchNewData = function(){
        this.USLoldColor = this.USLcolor;
        this.coronaOldColor = this.coronaColor;
        this.auxCoronaOldColor = this.auxCoronaColor;
        this.DSLoldColor = this.DSLcolor;
        this.DSchamberOldColor = this.DSchamberColor;
        this.USchamberOldColor = this.USchamberColor;
        this.dumpOldColor = this.dumpColor;

        this.USLcolor = this.parseColor(this.pointers[2].dataBus.totalRate);
        this.coronaColor = this.parseColor(this.pointers[0].dataBus.totalRate);
        if(this.pointers[3])
            this.auxCoronaColor = this.parseColor(this.pointers[3].dataBus.totalRate);
        this.DSLcolor = this.parseColor(this.pointers[1].dataBus.totalRate);
        if(this.pointers[4])
            this.DSchamberColor = this.parseColor(this.pointers[4].dataBus.totalRate);
        if(this.pointers[5])
            this.USchamberColor = this.parseColor(this.pointers[5].dataBus.totalRate);
        //this.dumpColor = this.parseColor(this.pointers[6].dataBus.totalRate);
    };

    //alarm animation test:
    //fadeRed('TIGRESSTab')
    function fadeBlack(tabID){
        $('#'+tabID).off();
        $('#'+tabID).on('transitionend', function(){fadeRed(tabID)});
        document.getElementById(tabID).style.border = '2px solid black';
        document.getElementById(tabID).style['border-right'] = 'none';
    };
    function fadeRed(tabID){
        $('#'+tabID).off();
        $('#'+tabID).on('transitionend', function(){fadeBlack(tabID)});
        document.getElementById(tabID).style.border = '2px solid red';
        document.getElementById(tabID).style['border-right'] = 'none';
    };

    this.drawScale = function(){

        var i, j, string, unit, title;

        this.context.clearRect(0, this.canvasHeight - this.scaleHeight, this.canvasWidth, this.canvasHeight);

        //titles
        this.context.fillStyle = '#999999';
        this.context.font="24px 'Orbitron'";
        this.context.textBaseline = 'middle';
        if(window.parameters.detectorLogMode.DashboardButton){
            title = 'log(Rate)';
        } else {
            title = 'Rate';
        }
        this.context.fillText(title, this.canvasWidth/2 - this.context.measureText(title).width/2, this.canvasHeight-this.scaleHeight/2 + 20 + 20);
        this.context.textBaseline = 'alphabetic';

        //tickmark;
        this.context.strokeStyle = '#999999';
        this.context.lineWidth = 1;
        this.context.font="12px 'Raleway'";

        //determine unit:
        unit = ODB.Dashboard.dashboardMax;
        if(unit > 1000000) unit = ' MHz';
        else if(unit > 1000) unit = ' kHz';
        else unit = ' Hz';
        if(window.parameters.detectorLogMode.DashboardButton) unit = ' log(Hz)';

        this.context.beginPath();
        this.context.moveTo(this.canvasWidth*0.05+1, this.canvasHeight - this.scaleHeight/2 + 20);
        this.context.lineTo(this.canvasWidth*0.05+1, this.canvasHeight - this.scaleHeight/2 + 20 + 10);
        this.context.stroke();
        if(window.parameters.detectorLogMode.DashboardButton) string = Math.log( ODB.Dashboard.dashboardMin ) + ' log(Hz)';
        else string = (ODB.Dashboard.dashboardMin) + ' Hz';
        this.context.fillText( string, this.canvasWidth*0.05 - this.context.measureText(string).width/2, this.canvasHeight-this.scaleHeight/2 + 45);

        this.context.beginPath();
        this.context.moveTo(this.canvasWidth*0.95-1, this.canvasHeight - this.scaleHeight/2 + 20);
        this.context.lineTo(this.canvasWidth*0.95-1, this.canvasHeight - this.scaleHeight/2 + 20 + 10); 
        this.context.stroke();

        string = ODB.Dashboard.dashboardMax;
        if(window.parameters.detectorLogMode. DashboardButton){
            string = Math.log(string).toFixed(1) + unit;
        } else {
            if(string > 1000000) string = string/1000000 + unit;
            else if(string > 1000) string = string/1000 + unit;
            else string = string + unit;
        }
        this.context.fillText(string, this.canvasWidth*0.95 - this.context.measureText(string).width/2, this.canvasHeight-this.scaleHeight/2 + 45);

        for(i=0; i<3000; i++){
            this.context.fillStyle = scalepickr(0.001*(i%1000), 'Sunset');
            this.context.fillRect(this.canvasWidth*0.05 + this.canvasWidth*0.9/1000*(i%1000), this.canvasHeight-this.scaleHeight/2, this.canvasWidth*0.9/1000, 20);
        }

    };

    this.parseColor = function(scalar){
        var scale;

        //how far along the scale are we?
        if(window.parameters.detectorLogMode.DashboardButton){  //log mode
            scale = (Math.log(scalar) - Math.log(ODB.Dashboard.dashboardMin) )/ (Math.log(ODB.Dashboard.dashboardMax) - Math.log(ODB.Dashboard.dashboardMin ));
        } else {  //linear mode
            scale = (scalar - ODB.Dashboard.dashboardMin ) / (ODB.Dashboard.dashboardMax - ODB.Dashboard.dashboardMin);
        }

        return scalepickr(scale, 'Sunset');

    };   
}