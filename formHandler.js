function updateParameter(InputLayer){
    
    var oForm = document.getElementById('setValues');
    var oText = oForm.elements[0];
    var textVal = oText.value;
    alert(textVal)
}

function abortUpdate(InputLayer){
	var inputDiv = document.getElementById(InputLayer);
	inputDiv.style.display = 'none';
}