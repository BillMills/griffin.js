//masterCodex imports a table from which DAQ and (eventually) HV information can be parsed and mapped.

masterCodex = function(){
	var i, j, k, m, Fkey, Skey, Pkey, Ckey;

    //Parse DAQ Assets///////////////////////////////////////////////////////////////////////

	//pull the table info in from the ODB
    if(window.parameters.devMode == 0){
        this.FSPC = ODBGet('/Analyzer/Parameters/Cathode/config/FSCP[*]');
        this.Name = ODBGet('/Analyzer/Parameters/Cathode/config/Name[*]');
        this.nRows = ODBGet('/Analyzer/Parameters/Cathode/config/N');
    } else{
        //put the tables in by hand for now:
        this.FSPC = [0x0700700,0x0700701,0x0700702,0x0700703,0x0700704,0x0700705,0x0700706,0x0700707,0x0700708,0x0700709,0x0700800,0x0700801,0x0700802,0x0700803,0x0700804,0x0700805,0x0700806,0x0700807,0x0700808,0x0700809,0x0700900,0x0700901,0x0700902,0x0700903,0x0700904,0x0700905,0x0700906,0x0700907,0x0700908,0x0700909,0x0800700,0x0800701,0x0800702,0x0800703,0x0800704,0x0800705,0x0800706,0x0800707,0x0800708,0x0800709,0x0800800,0x0800801,0x0800802,0x0800803,0x0800804,0x0800805,0x0800806,0x0800807,0x0800808,0x0800809,0x0800900,0x0800901,0x0800902,0x0800903,0x0800904,0x0800905,0x0800906,0x0800907,0x0800908,0x0800909,0x0900700,0x0900701,0x0900702,0x0900703,0x0900704,0x0900705,0x0900706,0x0900707,0x0900708,0x0900709];
        this.Name = ['TPW001P00X','TPW002P00X','TPW003P00X','TPW004P00X','TPW005P00X','TPW006P00X','TPW007P00X','TPW008P00X','TPW009P00X','TPW010P00X','TPW011P00X','TPW012P00X','TPW013P00X','TPW014P00X','TPW015P00X','TPW016P00X','TPW017P00X','TPW018P00X','TPW019P00X','TPW020P00X','TPW021P00X','TPW022P00X','TPW023P00X','TPW024P00X','TPW025P00X','TPW026P00X','TPW027P00X','TPW028P00X','TPW029P00X','TPW030P00X','GRG01BN00A','GRG01GN00A','GRG01RN00A','GRG01WN00A','GRGXXXXXXX','GRG01BN00B','GRG01GN00B','GRG01RN00B','GRG01WN00B','GRGXXXXXXX','GRG02BN00A','GRG02GN00A','GRG02RN00A','GRG02WN00A','GRGXXXXXXX','GRG02BN00B','GRG02GN00B','GRG02RN00B','GRG02WN00B','GRGXXXXXXX','GRG03BN00A','GRG03GN00A','GRG03RN00A','GRG03WN00A','GRGXXXXXXX','GRG03BN00B','GRG03GN00B','GRG03RN00B','GRG03WN00B','GRGXXXXXXX','RFL00XS00X','RFLXXXXXXX','RFLXXXXXXX','RFLXXXXXXX','RFLXXXXXXX','RFLXXXXXXX','RFLXXXXXXX','RFLXXXXXXX','RFLXXXXXXX','RFLXXXXXXX'];
        this.nRows = 70;
    }

    //parse out FSCP into F, S, C and P, and decide how many of each thing there are: //////////////////////////////////////////////
    this.F = [];
    this.S = [];
    this.P = [];
    this.C = [];
    var Fseen = [];
    var Sseen = [];
    var Pseen = [];
    var Cseen = [];
    var newToken;
    for(i=0; i<this.nRows; i++){
        this.F[i] = Math.floor(this.FSPC[i] / 0x10000000);                                          //first digit (on left)
        this.S[i] = Math.floor(this.FSPC[i] / 0x100000) - this.F[i]*0x100;                          //second
        this.P[i] = Math.floor(this.FSPC[i] / 0x100) - this.F[i]*0x100000 - this.S[i]*0x1000;       //third-fifth
        this.C[i] = this.FSPC[i] - this.F[i]*0x10000000 - this.S[i]*0x100000 - this.P[i]*0x100;     //sixth and seventh

        newToken = 1;
        for(j=0; j<Fseen.length; j++){
            if(this.F[i] == Fseen[j]){
                newToken = 0;
                break;
            }
        }
        if(newToken == 1) Fseen[Fseen.length] = this.F[i];

        newToken = 1;
        for(j=0; j<Sseen.length; j++){
            if(this.S[i] == Sseen[j]){
                newToken = 0;
                break;
            }
        }
        if(newToken == 1) Sseen[Sseen.length] = this.S[i];

        newToken = 1;
        for(j=0; j<Pseen.length; j++){
            if(this.P[i] == Pseen[j]){
                newToken = 0;
                break;
            }
        }
        if(newToken == 1) Pseen[Pseen.length] = this.P[i];

        newToken = 1;
        for(j=0; j<Cseen.length; j++){
            if(this.C[i] == Cseen[j]){
                newToken = 0;
                break;
            }
        }
        if(newToken == 1) Cseen[Cseen.length] = this.C[i];

    }

    //construct a 4-level key value array that reproduces the DAQ structure:
    this.DAQmap = {};
    for(i=0; i<this.F.length; i++){
        Fkey = '0x'+this.F[i]+'XXXXXX';
        this.DAQmap[Fkey] = {};

        for(j=0; j<this.S.length; j++){
            if(this.F[j] == this.F[i]){
                Skey = '0x'+this.F[i]+this.S[j]+'XXXXX';
                this.DAQmap[Fkey][Skey] = {}

                for(k=0; k<this.P.length; k++){
                    if(this.F[k] == this.F[i] && this.S[k] == this.S[j]){
                        Pkey = '0x'+this.F[i]+this.S[j]+'00'+this.P[k]+'XX';
                        this.DAQmap[Fkey][Skey][Pkey] = {};

                        for(m=0; m<this.C.length; m++){
                            if(this.F[m] == this.F[i] && this.S[m] == this.S[j] && this.P[m] == this.P[k]){
                                Ckey = '0x'+this.F[i]+this.S[j]+'00'+this.P[k]+'0'+this.C[m];
                                //alert(Pkey)
                                this.DAQmap[Fkey][Skey][Pkey][Ckey] = {'detector' : this.Name[m]};
                            }
                        }
                    }
                }
            }
        }
    }

    this.nCollectors = 0;
    for(Skey in this.DAQmap['0x0XXXXXX']) this.nCollectors++;
    this.nDigitizers = 0;
    this.nDigitizersPerCollector = [];
    i = 0;
    for(Skey in this.DAQmap['0x0XXXXXX']){
        this.nDigitizersPerCollector[i] = 0;
        for(Pkey in this.DAQmap['0x0XXXXXX'][Skey]){ 
            this.nDigitizers++;
            this.nDigitizersPerCollector[i]++;
        }
        i++;
    }


/*
    //now decide how many digitizers are plugged into each collector identified:
    var localDigitizers = [];
    this.nDigitizersPerCollector = [];

    //loop through each unique collector
    for(i=0; i<Sseen.length; i++){
        localDigitizers = [];
        //identify all unique digitizers that match this collector
        for(j=0; j<this.nRows; j++){
            if(this.S[j] == Sseen[i]){  //collector matches
                newToken = 1;
                for(k=0; k<localDigitizers.length; k++){  //see if this digitizers has already been found
                    if(localDigitizers[k] == this.C[j])
                        newToken = 0;
                }
                if(newToken == 1)
                    localDigitizers[localDigitizers.length] = this.C[j]
            }
        }
        this.nDigitizersPerCollector[i] = localDigitizers.length;
    }

    this.nCollectors = Sseen.length;
    this.nDigitizers = 0;
    for(i=0; i<this.nDigitizersPerCollector.length; i++)
        this.nDigitizers += this.nDigitizersPerCollector[i];
*/
    //finished DAQ///////////////////////////////////////////////////////////////////////////////////////////////////////



}



