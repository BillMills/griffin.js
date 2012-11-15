function MeterDecorator(canv, div, title, nMetersPerBank) {
    'use strict'

    var i = 0;
    var label;

    //fetch canvas
    var canvas = document.getElementById(canv);
    var context = canvas.getContext('2d');

    //adjust canvas to fit:
    $('#'+canv).attr('width', nMetersPerBank*25 + 50);
    $('#'+canv).attr('height', 200);
    //adjust div to fit:
    $('#'+div).width(nMetersPerBank*25 + 50);
    $('#'+div).height(200);

    //style canvas
    context.fillStyle = "rgba(0,0,0,0.6)";
    context.lineWidth = 1;
        
    //draw border
    context.beginPath();
    context.moveTo(50,35);
    context.lineTo(800,35);

    context.moveTo(50.,0.);
    context.lineTo(50.,100.);
    context.lineTo(800.,100.);

    context.stroke();

    for(i = 0; i<30; i++){
        if(i<10){
            label = "V00"+i;
        } else {
            label = "V0"+i;
        }

        context.save();
        context.translate(60+i*25, 120);
        context.rotate(-Math.PI/2);
        context.textAlign = "center";
        context.fillText(label, 0, 7);
        context.restore();
    }

    context.fillText("65mV", 20, 37);

    context.font="30px Times New Roman";
    context.fillText(title, 300, 175);
}

function Initialize(callMyself, meterID, cssID, sidebar, side){
    var i, newRule;

    for(i=0; i<meterID.length; i++){
        newRule = "div.meter#"+meterID[i]+"{transition: height 0.5s, bottom 0.5s, background 0.5s;-moz-transition: height 0.5s, bottom 0.5s, background 0.5s;-webkit-transition: height 0.5s, bottom 0.5s, background 0.5s;height:100px;width: 20px;background:#FFFFFF;position:relative;bottom:0px;margin-left:5px;float:left;}";
        document.styleSheets[cssID].insertRule(newRule,i);
    }

    //bit of a fudge for now, TODO: clean up initialization animation        
    setTimeout(function(){MeterUpdate(callMyself, meterID, cssID, sidebar, side)},500);

}

function MeterUpdate(callMyself, meterID, cssID, sidebar, side) {

    if(!document.webkitHidden && !document.mozHidden){
      var i = 0;
      var threshold = 65;
      var rawData = []; rawData[0] = [];
      var newHeight = 0;
      var newColor = "#FFFFFF";
      var newRule = "";

      for(i=0; i<meterID.length; i++){
        //pull whatever values out of ODB:
        rawData[0][i] = Math.random()*100;
        newHeight = rawData[0][i];
        //don't let the meter completely disappear:
        if(newHeight < 2) {
            newHeight = 2;
        }
        //meter turns red if it is over threshold, stays green otherwise:
        newColor = "#00FF00";
        if(newHeight>threshold){
            newColor = "#FF0000";
        }

        //delete old style rules, parse new rule, and insert new rule into css:
        document.styleSheets[cssID].deleteRule(i);
        newRule = "div.meter#"+meterID[i]+"{transition: height 0.5s, bottom 0.5s, background 0.5s;-moz-transition: height 0.5s, bottom 0.5s, background 0.5s;-webkit-transition: height 0.5s, bottom 0.5s, background 0.5s;height:"+newHeight+"px;width: 20px;background:"+newColor+";position:relative;bottom:"+(newHeight-100)+"px;margin-left:5px;float:left;}";
        document.styleSheets[cssID].insertRule(newRule,i);
      }

      AlarmSidebar('Voltage', sidebar, side, 1, 'wrapperBlock', 600, rawData, 'mV', 1, meterID.length, 65, callMyself);
    }
    //recurse:
    setTimeout(function(){MeterUpdate(1, meterID, cssID, sidebar, side)},3000);

}














