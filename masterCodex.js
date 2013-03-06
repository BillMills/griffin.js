//masterCodex imports a table which matches detector element name to ODB path and index.  The objects
//in DataStructures.js can then populate their keys from the codex.

masterCodex = function(){
	var i;

	//pull the table info in from the ODB
    this.FSCP = ODBGet('/Analyzer/Parameters/Cathode/config/FSCP[*]');
    //this.Type = ODBGet('/Analyzer/Parameters/Cathode/config/Type[*]');
    this.Name = ODBGet('/Analyzer/Parameters/Cathode/config/Name[*]');
    //this.gain = ODBGet('/Analyzer/Parameters/Cathode/config/g[*]');
    //this.offset = ODBGet('/Analyzer/Parameters/Cathode/config/o[*]');
    this.nRows = ODBGet('/Analyzer/Parameters/Cathode/config/N');

    //construct a table which has [detector name, ODBarray index]
    this.table = []
    for(i=0; i<this.nRows; i++){
    	this.table[i] = [];
    	this.table[i][0] = this.parseName(this.Name[i]);
    	this.table[i][1] = this.parseFSCP(parseInt(this.FSCP[i]));
    }

    //member functions//////////////////////////////

    //slice up <name> to return just the 10 character string describing the element
    this.parseName = function(name){
    	var codename;
    	//do magic
    	return codename;
    };

    //turn the FSCP number into an ODB index for the corresponding element
    this.parseFSCP = function(FSCP){
    	var FE, master, collector, channel, ODBindex;

    	FE = Math.floor(FSCP / 1000000);
    	master = Math.floor(FSCP / 10000) - FE*100;
    	collector = Math.floor(FSCP / 100) - FE*10000 - master*100;
    	channel = FSCP - FE*1000000 - master*10000 - collector*100;

    	//....insert magic here....

    	return ODBindex;
    };
}