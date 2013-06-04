function set_radios(word){
	var x;

	x=word.id;
	x=x.substring(0,1)+"0"; document.getElementById(x+"").checked=false;
	x=x.substring(0,1)+"1"; document.getElementById(x+"").checked=false;
	x=x.substring(0,1)+"2"; document.getElementById(x+"").checked=false;
	x=x.substring(0,1)+"3"; document.getElementById(x+"").checked=false;
	x=word.id; document.getElementById(x+"").checked=true;
	TBparam.old_num_gates=TBparam.num_gates;
	TBparam.num_gates=parseInt(x.substring(1,2));
	ODBSet("/Analyzer/Parameters/Gate0/NGates",TBparam.num_gates);
	mod_layout();
}

function RemoveScaler(Num){
	var img;

	if(Num<2 || Num>4) return;

	img = document.getElementById("svgimage");
	img.removeChild(img.getElementById("ScalerGroup"+Num));
	img.getElementById('Scaler'+Num).setAttribute("height", 0);
	img.getElementById('ScalerNum'+Num).textContent="";
	img.getElementById('ScalerTot'+Num).textContent="";
}

/*
function DrawBars(){
	var XOffset=120,
		Color = ['fill:rgb(0,0,255);', 'fill:rgb(255,0,0);', 'fill:rgb(0,255,0);', 'fill:rgb(255,255,0);', 'fill:rgb(102,0,153);'],
		img = document.getElementById("svgimage"),
		i, x;

	for(i=0; i<5; i++){
		x = document.createElementNS(TBparam.svgns,'rect');
		x.setAttribute('id','Scaler'+i);
		x.setAttribute('x', 10+(i*XOffset));
		x.setAttribute('y', 550);
		x.setAttribute('width','60');
		x.setAttribute('height', '0');
		x.setAttribute('transform', 'rotate(180 '+(40+(i*XOffset))+' 550)');
		x.setAttribute('style',Color[i]);
		img.appendChild(x);
		x = document.createElementNS(TBparam.svgns,'text');
		x.setAttribute('id','ScalerNum'+i);
		x.setAttribute('x', 40+(i*XOffset));
		x.setAttribute('y', 30);
		x.setAttribute('text-anchor', "middle"); 
		x.textContent="";
		img.appendChild(x);
		x = document.createElementNS(TBparam.svgns,'text');
		x.setAttribute('id','ScalerTot'+i);
		x.setAttribute('x', 40+(i*XOffset));
		x.setAttribute('y', 600);
		x.setAttribute('text-anchor', "middle"); 
		x.textContent="";
		img.appendChild(x);
	}
}

/*
function DrawScaler(Num){
	var XOffset=120,
		Title = ["Total (Hz)", "Gate1 (Hz)", "Gate2 (Hz)", "Gate3 (Hz)", "Gate4 (Hz)"],
		Color = ['fill:rgb(0,0,255);', 'fill:rgb(255,0,0);', 'fill:rgb(0,255,0);', 'fill:rgb(255,255,0);', 'fill:rgb(102,0,153);'],
		img, group, x;

	if(Num<0 || Num>4) return;

	img = document.getElementById("svgimage");
	group = document.createElementNS(TBparam.svgns,'g');
	group.setAttribute('id','ScalerGroup'+Num);
	x = document.createElementNS(TBparam.svgns,'rect');
	x.setAttribute('id','ScalerBox'+Num);
	x.setAttribute('x', 10+(Num*XOffset));
	x.setAttribute('y', 50);
	x.setAttribute('width','60');
	x.setAttribute('height','500');
	x.setAttribute('style','fill:none;stroke-width:1;stroke:rgb(0,0,0)');
	group.appendChild(x);
	x = document.createElementNS(TBparam.svgns,'text');
	x.setAttribute('id','ScalerAxis0'+Num);
	x.setAttribute('x', 75+(Num*XOffset));
	x.setAttribute('y', 550);
	x.setAttribute('text-anchor', "start"); 
	x.textContent="0";
	group.appendChild(x);
	x = document.createElementNS(TBparam.svgns,'text');
	x.setAttribute('id','ScalerAxis25'+Num);
	x.setAttribute('x', 75+(Num*XOffset));
	x.setAttribute('y', 425);
	x.setAttribute('text-anchor', "start"); 
	x.textContent=parseInt(TBparam.GateMax[Num]*0.25);
	group.appendChild(x);
	x = document.createElementNS(TBparam.svgns,'text');
	x.setAttribute('id','ScalerAxis50'+Num);	
	x.setAttribute('x', 75+(Num*XOffset));
	x.setAttribute('y', 300);
	x.setAttribute('text-anchor', "start"); 
	x.textContent=parseInt(TBparam.GateMax[Num]*0.50);
	group.appendChild(x);
	x = document.createElementNS(TBparam.svgns,'text');
	x.setAttribute('id','ScalerAxis75'+Num);
	x.setAttribute('x', 75+(Num*XOffset));
	x.setAttribute('y', 175);
	x.setAttribute('text-anchor', "start"); 
	x.textContent=parseInt(TBparam.GateMax[Num]*0.75);
	group.appendChild(x);
	x = document.createElementNS(TBparam.svgns,'text');
	x.setAttribute('id','ScalerAxis100'+Num);
	x.setAttribute('x', 75+(Num*XOffset));
	x.setAttribute('y', 50);
	x.setAttribute('text-anchor', "start"); 
	x.textContent=parseInt(TBparam.GateMax[Num]);
	group.appendChild(x);
	x = document.createElementNS(TBparam.svgns,'text');
	x.setAttribute('id','ScalerLabel'+Num);
	x.setAttribute('x', 40+(Num*XOffset));
	x.setAttribute('y', 580);
	x.setAttribute('text-anchor', "middle"); 
	x.textContent=Title[Num];
	group.appendChild(x);
	img.appendChild(group);
}


function mod_gate_limit(id){
	var img = document.getElementById("svgimage");
	img.getElementById('ScalerAxis100'+id).textContent=TBparam.GateMax[id];
	img.getElementById('ScalerAxis75'+id).textContent=parseInt(TBparam.GateMax[id]*0.75);
	img.getElementById('ScalerAxis50'+id).textContent=parseInt(TBparam.GateMax[id]*0.50);
	img.getElementById('ScalerAxis25'+id).textContent=parseInt(TBparam.GateMax[id]*0.25);
}
*/

function mod_layout(){
	//var x;
/*
	if(TBparam.num_gates<TBparam.old_num_gates){
		while(TBparam.old_num_gates>TBparam.num_gates){
			x=parseInt(TBparam.old_num_gates)+1;
			RemoveScaler(x);
			TBparam.old_num_gates--;
			if(TBparam.old_num_gates<TBparam.num_gates){
				TBparam.old_num_gates=TBparam.num_gates; 
				x=parseInt(TBparam.old_num_gates)+1; 
				RemoveScaler(x); break;
			}
		}
	} else if(TBparam.num_gates>TBparam.old_num_gates){
		while(TBparam.old_num_gates!=TBparam.num_gates){
			x=parseInt(TBparam.old_num_gates)+2;
			if(x>1 && x<5) DrawScaler(x);
			TBparam.old_num_gates++;
			if(TBparam.old_num_gates>TBparam.num_gates){
				TBparam.old_num_gates=TBparam.num_gates; 
				break;
			}
		}
	}
/*
	if(TBparam.num_gates==0){
		document.getElementById("l1").innerHTML="";
		document.getElementById("l2").innerHTML="";
		document.getElementById("l3").innerHTML="";
	}

	if(TBparam.num_gates==1){
		document.getElementById("l1").innerHTML="Upper limit<br><input type=\"text\" id=\"MaxG1\" style=\"width:70px\"; onchange=\"TBparam.GateMax[2]=this.value;mod_gate_limit(2);\">";
		document.getElementById("l2").innerHTML="";
		document.getElementById("l3").innerHTML="";
	}

	if(TBparam.num_gates==2){
		document.getElementById("l1").innerHTML="Upper limit<br><input type=\"text\" id=\"MaxG1\" style=\"width:70px\"; onchange=\"TBparam.GateMax[2]=this.value;mod_gate_limit(2);\">";
		document.getElementById("l2").innerHTML="Upper limit<br><input type=\"text\" id=\"MaxG2\" style=\"width:70px\"; onchange=\"TBparam.GateMax[3]=this.value;mod_gate_limit(3);\">";
		document.getElementById("l3").innerHTML="";
	}

	if(TBparam.num_gates==3){
		document.getElementById("l1").innerHTML="Upper limit<br><input type=\"text\" id=\"MaxG1\" style=\"width:70px\"; onchange=\"TBparam.GateMax[2]=this.value;mod_gate_limit(2);\">";
		document.getElementById("l2").innerHTML="Upper limit<br><input type=\"text\" id=\"MaxG2\" style=\"width:70px\"; onchange=\"TBparam.GateMax[3]=this.value;mod_gate_limit(3);\">";
		document.getElementById("l3").innerHTML="Upper limit<br><input type=\"text\" id=\"MaxG3\" style=\"width:70px\"; onchange=\"TBparam.GateMax[4]=this.value;mod_gate_limit(4);\">";
	}
*/
	// Set initial values
	document.getElementById("MaxT").value=TBparam.GateMax[0];
	document.getElementById("MaxG").value=TBparam.GateMax[1];
	if(TBparam.num_gates>0){
		document.getElementById("MaxG1").value=TBparam.GateMax[2];
		document.getElementById("l1").setAttribute('style', 'opacity:1;')
	} else
		document.getElementById("l1").setAttribute('style', 'opacity:0;')
	if(TBparam.num_gates>1){
		document.getElementById("MaxG2").value=TBparam.GateMax[3];
		document.getElementById("l2").setAttribute('style', 'opacity:1;')
	} else
		document.getElementById("l2").setAttribute('style', 'opacity:0;')
	if(TBparam.num_gates>2){
		document.getElementById("MaxG3").value=TBparam.GateMax[4];
		document.getElementById("l3").setAttribute('style', 'opacity:1;')
	} else
		document.getElementById("l3").setAttribute('style', 'opacity:0;')
	mod_gate_params();
}

function mod_gate_params(){
	var font=["#FF0000", "#00FF00", "#FFFF00", "#660099"],
		obj=document.getElementById("Gate_params"),
		line="",
		i, name, cmd;

	for(i=0; i<=TBparam.num_gates; i++){
		line=line+"<br><font style=\"color: "+font[i]+";\"><b>Gate"+(i+1)+":</b></font> Centre (x,y): <input type=\"text\" id=\"Gatex"+i+"\" style=\"width:40px\"; onchange=\"setGateX(this)\">,<input type=\"text\" id=\"Gatey"+i+"\" style=\"width:40px\"; onchange=\"setGateY(this)\">Size: <input type=\"text\" id=\"GateSize"+i+"\" style=\"width:40px\"; onchange=\"setGateSize(this)\">\n";

	}
	obj.innerHTML=line;

	for(i=0; i<=TBparam.num_gates; i++){
		name="Gatex"+i;
		cmd="/Analyzer/Parameters/Gate"+i+"/x";
		document.getElementById(name).value=ODBGet(cmd);
		name="Gatey"+i;
		cmd="/Analyzer/Parameters/Gate"+i+"/y";
		document.getElementById(name).value=ODBGet(cmd);
		name="GateSize"+i;
		cmd="/Analyzer/Parameters/Gate"+i+"/size";
		document.getElementById(name).value=ODBGet(cmd);
	}
}

function refreshAll(){
	var this_run_num,// = ODBGet("/Runinfo/Run number"),
		running,//=ODBGet("/Runinfo/State"),
		data, img, Num, h, t, x, y, z, rate, obj, currentTime, hrs, mins, secs, TimeNow,
		newLevels = [],
		paths = [];

		paths[0] = "/Runinfo/Run number";
		paths[1] = "/Runinfo/State";
		paths[2] = "/Analyzer/Parameters/Statistics/TotalRate";
		paths[3] = "/Analyzer/Parameters/Statistics/TotalInt";
		paths[4] = "/Analyzer/Parameters/Statistics/GateRate";
		paths[5] = "/Analyzer/Parameters/Statistics/GateInt";
		paths[6] = "/Analyzer/Parameters/Statistics/GateRate1";
		paths[7] = "/Analyzer/Parameters/Statistics/GateInt1";
		paths[8] = "/Analyzer/Parameters/Statistics/GateRate2";
		paths[9] = "/Analyzer/Parameters/Statistics/GateInt2";
		paths[10] = "/Analyzer/Parameters/Statistics/GateRate3";
		paths[11] = "/Analyzer/Parameters/Statistics/GateInt3";
		paths[12] = "/Analyzer/Parameters/Gate0/Zoom";

		data = ODBMGet(paths);
		this_run_num = data[0];
		running = data[1];

	if(running==1){
		document.getElementById("run_status").bgColor="red";
		document.getElementById("run_status").innerHTML="Data Collecting Stopped";
	} else {
		document.getElementById("run_status").bgColor="lime";
		document.getElementById("run_status").innerHTML="Data Collecting";
	}
	document.getElementById("run_num").innerHTML=this_run_num;

	// Connect to the svg image element
	//img = document.getElementById("svgimage");

	for(Num=4; Num>=0; Num--){
		if(Num==0){ 
			h=data[2]//ODBGet("/Analyzer/Parameters/Statistics/TotalRate");
			t=data[3]//ODBGet("/Analyzer/Parameters/Statistics/TotalInt");
		} else if(Num==1){ 
			h=data[4]//ODBGet("/Analyzer/Parameters/Statistics/GateRate"); 
			t=data[5]//ODBGet("/Analyzer/Parameters/Statistics/GateInt");
		} else{ 
			//x="/Analyzer/Parameters/Statistics/GateRate"+(Num-1); 
			h=data[6+2*(Num-2)]//ODBGet(x); 
			//x='/Analyzer/Parameters/Statistics/GateInt'+(Num-1); 
			t=data[6+2*(Num-2)+1]//ODBGet(x);
		}
		TBparam.rate[Num] = h;
		TBparam.int[Num] = t;
		rate=parseInt((h/TBparam.GateMax[Num])*500.0);
		if(rate>TBparam.GateMax[Num]) rate=500;
		if(rate<0) rate=0;
	rate = Math.random()*500;
		newLevels[Num] = rate;
		/*
		if(Num<=(parseInt(TBparam.num_gates)+1)){
			x='Scaler'+Num;
			y="ScalerNum"+Num;
			z="ScalerTot"+Num;
			img.getElementById(x).setAttribute("height", rate);
			img.getElementById(y).textContent=h;
			img.getElementById(z).textContent=t;
		} else {
			x='Scaler'+Num;
			y="ScalerNum"+Num;
			z="ScalerTot"+Num;
			img.getElementById(x).setAttribute("height", 0);
			img.getElementById(y).textContent="";
			img.getElementById(z).textContent="";
		}
		*/
	}

	//reproduce the svg in canvas:
	for(Num=4; Num>=0; Num--){
		TBparam.oldLevels[Num] = TBparam.levels[Num];
		TBparam.levels[Num] = newLevels[Num];
	}
	updateBars(0);


	//obj=document.getElementById("2Dplot");  //intended to force a source refresh?  Very slow.
	//obj.src=obj.src;
	document.getElementById("zoom_drop").selectedIndex=parseFloat(data[12])-1//ODBGet("/Analyzer/Parameters/Gate0/Zoom")-1;


	// Print the time of the refresh
	currentTime = new Date();
	hrs = currentTime.getHours();
	if(hrs < 10) hrs="0"+hrs;
	mins = currentTime.getMinutes();
	if(mins < 10) mins="0"+mins;
	secs = currentTime.getSeconds();
	if(secs < 10) secs="0"+secs;

	TimeNow=hrs+":"+mins+":"+secs
	document.getElementById("dateLine").innerHTML=currentTime+'<br>';


	document.getElementById("Time_display").innerHTML=(Math.floor(currentTime.getTime()/1000)-TBparam.ResetTime);

	setTimeout("refreshAll()",1*1000);
}

function updateBars(frame){
	//console.log(TBparam.num_gates)
	var duration = 0.3,
		FPS = 30,
		nFrame = Math.floor(FPS*duration),
		canvas = document.getElementById('rateBars'),
		context = canvas.getContext('2d'),
		textGutter = 60,
		leftMargin = 40,
		bottomMargin = canvas.width*0.15,
		barWidth = 70,
		yAxisLength = canvas.height*0.9 - bottomMargin,
		tickLength = 5,
		lineWidth = 1,
		height, i, j, string;

		//style context:
		context.strokeStyle = '#000000';
		context.fillStyle = '#000000';
		context.font = '16px Arial';
		context.lineWidth = lineWidth;

		//clear canvas:
		context.clearRect(0,0,1000,1000);

		//bars
		for(i=0; i<=parseInt(TBparam.num_gates)+1; i++){
			context.fillStyle = TBparam.barChartColors[i];
			height = TBparam.oldLevels[i]/TBparam.GateMax[i]*yAxisLength + ( TBparam.levels[i] / TBparam.GateMax[i] - TBparam.oldLevels[i] / TBparam.GateMax[i] )*yAxisLength*frame/nFrame;
			context.fillRect(leftMargin + textGutter + i*(barWidth+textGutter), canvas.height - bottomMargin - height, barWidth, height);
		}

		//draw frames
		for(i=0; i<=TBparam.num_gates+1; i++){
			//frame
			context.strokeRect(leftMargin + textGutter + i*(barWidth+textGutter), canvas.height-bottomMargin-yAxisLength, barWidth, yAxisLength);
			//ticks
			for(j=0; j<5; j++){
				context.beginPath();
				context.moveTo(leftMargin + textGutter + i*(barWidth+textGutter), canvas.height - bottomMargin - j/4*yAxisLength);
				context.lineTo(leftMargin + textGutter + i*(barWidth+textGutter) - tickLength, canvas.height - bottomMargin - j/4*yAxisLength);
				context.stroke();
				context.textBaseline = 'middle';
				context.fillStyle = '#000000'
				context.fillText(j*TBparam.GateMax[i]/4, leftMargin + textGutter + i*(barWidth+textGutter) - tickLength - context.measureText(j*TBparam.GateMax[i]/4).width - 5, canvas.height - bottomMargin - j/4*yAxisLength);
			}
			//x-axis labels
			context.textBaseline = 'top';
			string = ( (i==0) ? 'Total' : 'Gate '+i );
			context.fillText(string, leftMargin + textGutter + barWidth/2 + i*(barWidth+textGutter) - context.measureText(string).width/2, canvas.height-bottomMargin+5);
		}
		
		//y-axis title
		context.textBaseline = 'top';
		context.save();
		context.translate(leftMargin/2, canvas.height-bottomMargin-yAxisLength/2 + context.measureText('Rate (Hz)').width/2);
		context.rotate(-Math.PI/2);
		context.fillText('Rate (Hz)', 0,0);
		context.restore();

		//bar summary data
		context.textBaseline = 'middle';
		for(i=0; i<=TBparam.num_gates+1; i++){
			context.save()
			context.translate(leftMargin+textGutter+barWidth/2 + i*(barWidth+textGutter), canvas.height-bottomMargin-yAxisLength-5 );
			context.rotate(-Math.PI/2);
			context.fillText('Rate: '+parseFloat(TBparam.rate[i]).toFixed(0), 0, -20);
			context.fillText('Int: '+parseFloat(TBparam.int[i]).toFixed(0), 0, 20);
			context.restore();
		}

		//call next animation frame:
		if(frame < nFrame) setTimeout(function(){updateBars(frame+1)}, 1000/FPS);

}

function setZoom(factor){
	ODBSet("/Analyzer/Parameters/Gate0/Zoom",factor);
}

function setGateX(num){
	var thisid=num.id,
		cmd="/Analyzer/Parameters/Gate"+thisid.substring(5,6)+"/x",
		factor=document.getElementById(thisid).value;
	ODBSet(cmd,factor);
}

function setGateY(num){
	var thisid=num.id,
		cmd="/Analyzer/Parameters/Gate"+thisid.substring(5,6)+"/y",
		factor=document.getElementById(thisid).value;
	ODBSet(cmd,factor);
}

function setGateSize(num){
	var thisid=num.id,
		cmd="/Analyzer/Parameters/Gate"+thisid.substring(8,9)+"/size",
		factor=document.getElementById(thisid).value;
	ODBSet(cmd,factor);
} 

function setResetTime(){
	// Print the time of the refresh
	var ResetTime = new Date();
	ResetTime = Math.floor(ResetTime.getTime()/1000);
	ODBSet("/Analyzer/Parameters/Gate0/ResetTime",ResetTime);
}

function dump2D(){
	var currentTime, year, month, day, hrs, mins, filename;

	// Get the time
	currentTime = new Date();
	year = currentTime.getFullYear();
	month = currentTime.getMonth();	
	month = parseInt(month)+1;
	if(month < 10) month="0"+month;
	day = currentTime.getDate();
	hrs = currentTime.getHours();
	if(hrs < 10) hrs="0"+hrs;
	mins = currentTime.getMinutes();
	if(mins < 10) mins="0"+mins;

	filename="bragg-"+year+month+day+"-"+hrs+mins+".dat";
	//  filename=prompt("Please enter filename including the extension:","");
	ODBSet("/Analyzer/Parameters/Gate0/dumpname",filename);
	ODBSet("/Analyzer/Parameters/Gate0/dump",1);
	alert("The file \""+filename+"\" has been written on the lxdaq04 filesystem.");
}