function insertButton(id, classTag, clickAction, wrapperID, content){
    var newButton = document.createElement('button');
    newButton.setAttribute('id', id);
    newButton.setAttribute('class', classTag);
    newButton.setAttribute('type', 'button');
    newButton.setAttribute('onclick', clickAction);
    document.getElementById(wrapperID).appendChild(newButton);
    document.getElementById(id).innerHTML = content;
}

function insertCanvas(id, classTag, style, width, height, wrapperID){
	var newCanvas = document.createElement('canvas');
    newCanvas.setAttribute('id', id);
    newCanvas.setAttribute('class', classTag);
    newCanvas.setAttribute('style', style);
    newCanvas.setAttribute('width', width);
    newCanvas.setAttribute('height', height);
    document.getElementById(wrapperID).appendChild(newCanvas);
}

function insertDiv(id, classTag, wrapperID){
    var newDiv = document.createElement('div');
    newDiv.setAttribute('id', id);
    newDiv.setAttribute('class', classTag);
    if(wrapperID == 'body')
    	document.body.appendChild(newDiv);
    else
	    document.getElementById(wrapperID).appendChild(newDiv);
}

function insertH1(id, classTag, wrapperID, content){
    var newHead = document.createElement('h1');
    newHead.setAttribute('id', id);
    newHead.setAttribute('class', classTag);
    document.getElementById(wrapperID).appendChild(newHead);
    document.getElementById(id).innerHTML = content;
}

function insertH2(id, classTag, wrapperID, content){
    var newHead = document.createElement('h2');
    newHead.setAttribute('id', id);
    newHead.setAttribute('class', classTag);
    document.getElementById(wrapperID).appendChild(newHead);
    document.getElementById(id).innerHTML = content;
}

function insertH4(id, classTag, wrapperID, content){
    var newHead = document.createElement('h4');
    newHead.setAttribute('id', id);
    newHead.setAttribute('class', classTag);
    document.getElementById(wrapperID).appendChild(newHead);
    document.getElementById(id).innerHTML = content;
}

function insertLinebreak(wrapperID){
    var br = document.createElement("br");
    document.getElementById(wrapperID).appendChild(br);
}

function insertParagraph(id, classTag, style, wrapperID, content){
	var newPara = document.createElement('p');
    newPara.setAttribute('id', id);
    newPara.setAttribute('class', classTag);
    newPara.setAttribute('style', style);
    document.getElementById(wrapperID).appendChild(newPara);
    document.getElementById(id).innerHTML = content;
}

function insertForm(id, style, wrapperID){
    var newForm = document.createElement('form');
    newForm.setAttribute('id', id);
    newForm.setAttribute('style', style);
    document.getElementById(wrapperID).appendChild(newForm);
}

function insertInput(id, style, type, name, value, wrapperID){
    var newInput = document.createElement('input');
    newInput.setAttribute('id', id);
    newInput.setAttribute('style', style);
    newInput.setAttribute('type', type);
    newInput.setAttribute('name', name);
    newInput.setAttribute('value', value);
    document.getElementById(wrapperID).appendChild(newInput);
}

function insertSelect(id, style, wrapperID){
    var newInput = document.createElement('select');
    newInput.setAttribute('id', id);
    newInput.setAttribute('style', style);
    document.getElementById(wrapperID).appendChild(newInput);
}