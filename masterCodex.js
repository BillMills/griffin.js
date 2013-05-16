//masterCodex imports a table from which DAQ and (eventually) HV information can be parsed and mapped.

masterCodex = function(){
	var i, Fkey, Skey, Pkey, Ckey;

    //Parse DAQ Assets///////////////////////////////////////////////////////////////////////
	//pull the FSPC table info in from the ODB
    this.DAQpath = ['/Analyzer/Parameters/Cathode/Config/FSCP[*]', '/Analyzer/Parameters/Cathode/Config/Name[*]', '/Analyzer/Parameters/Cathode/Config/N'];       
    this.DAQtable = ODBMGet(this.DAQpath);
    this.FSPC  = this.DAQtable[0];
    this.Name  = this.DAQtable[1];
    this.nRows = this.DAQtable[2]; 

    //parse into DAQ levels, and sort:    
    this.table = [];
    this.F = [];
    this.S = [];
    this.P = [];
    this.C = [];
    this.DAQmap = {};

    for(i=0; i<this.nRows; i++){
        this.F[i] = Math.floor(this.FSPC[i] / 0x10000000);                                          //first digit (on left)
        this.S[i] = Math.floor(this.FSPC[i] / 0x100000) - this.F[i]*0x100;                          //second
        this.P[i] = Math.floor(this.FSPC[i] / 0x100) - this.F[i]*0x100000 - this.S[i]*0x1000;       //third-fifth
        this.C[i] = this.FSPC[i] - this.F[i]*0x10000000 - this.S[i]*0x100000 - this.P[i]*0x100;     //sixth and seventh
        if(this.S[i] <= 12){
            this.table.push({
                F : this.F[i],
                S : this.S[i],
                P : this.P[i],
                C : this.C[i],
                Name : this.Name[i]
            })
        }
    }

    function sortFSPC(a, b){
        if(a.F == b.F){
            if(a.S == b.S){
                if(a.P == b.P){
                    if(a.C == b.C){
                        return -9999; //this should never happen
                    } else {
                        if (a.C > b.C) return 1;
                        if (a.C < b.C) return -1;
                        else return 0;                        
                    }                 
                } else {
                    if (a.P > b.P) return 1;
                    if (a.P < b.P) return -1;
                    else return 0;                    
                }
            } else {
                if (a.S > b.S) return 1;
                if (a.S < b.S) return -1;
                else return 0;                
            }
        } else {
            if (a.F > b.F) return 1;
            if (a.F < b.F) return -1;
            else return 0;          
        }
    } 

    this.table.sort(sortFSPC);  
    this.F = []; this.S = []; this.P = []; this.C = []; this.Name = [];

    for(i=0; i<this.table.length; i++){
        this.F[i] = this.table[i].F;
        this.S[i] = this.table[i].S;
        this.C[i] = this.table[i].C;
        this.P[i] = this.table[i].P;
        this.Name[i] = this.table[i].Name.slice(0,10).toUpperCase();        
    }
    this.nRows = this.table.length;

    //loop over all rows, creating a 4-level object that reflects the structure of the DAQ:
    for(i=0; i<this.nRows; i++){

        Fkey = '0x'+this.F[i].toString(16).toUpperCase()+'XXXXXX';
        Skey = '0x'+this.F[i].toString(16).toUpperCase()+this.S[i].toString(16).toUpperCase()+'XXXXX';
        Pkey = '0x'+this.F[i].toString(16).toUpperCase()+this.S[i].toString(16).toUpperCase()+'00'+this.P[i].toString(16).toUpperCase()+'XX';
        Ckey = '0x'+this.F[i].toString(16).toUpperCase()+this.S[i].toString(16).toUpperCase()+'00'+this.P[i].toString(16).toUpperCase()+'0'+this.C[i].toString(16).toUpperCase();

        if(this.DAQmap[Fkey]){
            this.DAQmap[Fkey].trigRequestRate = 0;
            if(this.DAQmap[Fkey][Skey]){
                this.DAQmap[Fkey][Skey].trigRequestRate = 0;
                this.DAQmap[Fkey][Skey].dataRate = 0;  //how much data is this collector pushing upstream?
                if(this.DAQmap[Fkey][Skey][Pkey]){
                    this.DAQmap[Fkey][Skey][Pkey].trigRequestRate = 0;
                    this.DAQmap[Fkey][Skey][Pkey].dataRate = 0;  //how much data is this digitizer pushing upstream?
                    this.DAQmap[Fkey][Skey][Pkey][Ckey] = {'detector' : this.Name[i], 'FSPC' : Ckey, 'trigRequestRate' : 0, 'dataRate' : 0};
                } else {
                    this.DAQmap[Fkey][Skey][Pkey] = {};
                    i--;
                }
            } else {
                this.DAQmap[Fkey][Skey] = {};
                i--;
            }
        } else {
            this.DAQmap[Fkey] = {};
            i--;
        }
    }

    //keep track of all the key names in the DAQmap that contain data directly, and aren't part of the hierarchy, so we can ignore them when traversing the DAQ tree:
    this.dataKeys = ['detector', 'FSPC', 'trigRequestRate', 'dataRate'];

    //0x0XXXXXX == currently hard coded to only look at one master, loop over Fkey to generalize
    this.nCollectors = 0;
    for(Skey in this.DAQmap['0x0XXXXXX']){
        if(this.dataKeys.indexOf(Skey) == -1)
            this.nCollectors++;
    }
    this.nDigitizers = 0;
    this.nDigitizersPerCollector = [];
    i = 0;
    for(Skey in this.DAQmap['0x0XXXXXX']){
        if(this.dataKeys.indexOf(Skey) == -1){
            this.nDigitizersPerCollector[i] = 0;
            for(Pkey in this.DAQmap['0x0XXXXXX'][Skey]){
                if(this.dataKeys.indexOf(Pkey) == -1){
                    this.nDigitizers++;
                    this.nDigitizersPerCollector[i]++;
                }
            }
            i++;
        }
    }

    //populate this.DAQmap with all the relevant information from the JSONPstore.
    this.update = function(){
        
        var Fkey, Skey, Pkey, Ckey;

        for(Fkey in this.DAQmap){
            if(this.dataKeys.indexOf(Fkey) == -1){
                this.DAQmap[Fkey].trigRequestRate = 0;
                for(Skey in this.DAQmap[Fkey]){
                    if(this.dataKeys.indexOf(Skey) == -1){
                        this.DAQmap[Fkey][Skey].trigRequestRate = 0;
                        this.DAQmap[Fkey][Skey].dataRate = 0;
                        for(Pkey in this.DAQmap[Fkey][Skey]){
                            if(this.dataKeys.indexOf(Pkey) == -1){
                                this.DAQmap[Fkey][Skey][Pkey].trigRequestRate = 0;
                                this.DAQmap[Fkey][Skey][Pkey].dataRate = 0;
                                for(Ckey in this.DAQmap[Fkey][Skey][Pkey]){
                                    if( window.JSONPstore['scalar'][this.DAQmap[Fkey][Skey][Pkey][Ckey].detector] ){
                                        this.DAQmap[Fkey][Skey][Pkey][Ckey].trigRequestRate = window.JSONPstore['scalar'][this.DAQmap[Fkey][Skey][Pkey][Ckey].detector]['TRIGREQ'];
                                        this.DAQmap[Fkey][Skey][Pkey][Ckey].dataRate = window.JSONPstore['scalar'][this.DAQmap[Fkey][Skey][Pkey][Ckey].detector]['dataRate'];
                                        this.DAQmap[Fkey][Skey][Pkey].trigRequestRate += this.DAQmap[Fkey][Skey][Pkey][Ckey].trigRequestRate;
                                        this.DAQmap[Fkey][Skey][Pkey].dataRate += this.DAQmap[Fkey][Skey][Pkey][Ckey].dataRate;
                                    }
                                }
                                this.DAQmap[Fkey][Skey].trigRequestRate += this.DAQmap[Fkey][Skey][Pkey].trigRequestRate;
                                this.DAQmap[Fkey][Skey].dataRate += this.DAQmap[Fkey][Skey][Pkey].dataRate;
                            }
                        }
                        this.DAQmap[Fkey].trigRequestRate += this.DAQmap[Fkey][Skey].trigRequestRate;
                    }
                }
            }
        }
        
    };

}

