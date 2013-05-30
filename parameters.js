function loadParameters(){

				window.parameters = {
				"devMode" : 0,
				"MIDASlegacyMode" : 0,
				"ExpName" : "TIGRESS",
				"statusURL" : "http://midtig06.triumf.ca:8081/",
				"topDeployment" : {"HV":0, "Subsystems":1, "DAQ":1, "Clock":0, "Trigger":0},
				"deployment" : {"BAMBINO":0, "DANTE":0, "DESCANT":0, "HPGe":1, "PACES":0, "SCEPTAR":0, "SHARC":0, "SPICE":0, "TIP":0, "DSSD":1},
				"wrapper" : "waffleplate",
				"subdetectorUnit" : ["V", "ADC units", "Hz"],
				"monitorValues" : ["HV", "Thresholds", "Rate"],
				//"ODBkeys" : ["/Location/Of/Device/Varibles", "/Location/Of/Device/Settings", "Demand Voltage Key", "Measured Voltage Key", "Measured Current Key", "Voltage Ramp Up Key", "Voltage Ramp Down Key", "Temperature Key", "ChState Key", "ChStatus Key", "Voltage Limit Key", "Current Limit Key", "Channel Name Key"],
				//"ODBkeys" : ["/Equipment/HV/Variables", "/Equipment/HV/Settings", "Demand", "Measured", "Current", "Ramp Up Speed", "Ramp Down Speed", "Temperature", "ChState", "ChStatus", "Voltage Limit", "Current Limit", "Names"],
				"ODBkeys" : ["Variables/Demand", "Variables/Measured", "Variables/Current", "Settings/Ramp Up Speed", "Settings/Ramp Down Speed", "Variables/Temperature", "Settings/ChState", "Variables/ChStatus", "Settings/Voltage Limit", "Settings/Current Limit", "Settings/Names"],
				"rows" : 12,
				"columns": [],
				"rowTitles" : ["Ch.", "0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11"],
				"alarmThresholds" : [0.8, 0.999, 0.999, 0],
				"scaleMaxima" : [1,1,1,1],
				"prefix" : ["Demand Voltage: ", "Reported Voltage: ", "Reported Current: ", "Voltage Ramp Up Speed: ", "Voltage Ramp Down Speed", "Temperature: ", "Status: "],
				"postfix" : ["V", "V", "uA", "V/s", "V/s", "C", ""],
				"minVoltage" : 0,
				"maxVoltage" : 1,
				"minCurrent" : 0,
				"maxCurrent" : 1,
				"minTemperature" : 0,
				"maxTemperature" : 1,
				"minRampSpeed" : 0,
				"maxRampSpeed" : 1,
				"statusPrecision" : 3,
				"barChartPrecision" : 1,
				"alarmPrecision" : 3,
				"voltUnit" : "V",
				"rampUnit" : "V/s",
				"currentUnit" : "uA",
				"temperatureUnit" : "C",
				"HVequipmentNames" : ["HV-0", "HV-1", "HV-2"],
				"moduleSizes" : [],
				"colorScale"  : ["ROOT Rainbow", "Greyscale", "Sunset", "Red Scale", "Mayfair"],
				"subdetectorColors" : ["ROOT Rainbow", "ROOT Rainbow", "Sunset"],
				"validDetectors" : ["TIG", "TIS", "GRG", "GRS", "HPG", "HPS", "BAE", "BAZ", "SHQ", "SHB", "MAD", "MAM", "CSD", "CSM", "SPI", "SPE", "DSC", "SEP", "SET", "PAC", "DAL", "DAB", "DAS", "TPC", "TPW", "TPP", "TPG", "TPE", "ZDS", "ZDP", "ZDM", "ZDD", "TBR", "YBP", "YBB", "TRF", "RFL", "RFS"],
				"detectorLogMode" : {'SubsystemsButton' : 1, 'DAQbutton' : 0},  //log state a function of ID of button used to summon current view state 


				"BAMBINO" : {
								"minima" : {
												"BAMBINO" : [0,0,0]
										   },
								"maxima" : {
												"BAMBINO" : [1,1,1]
										   }
							},
				"BAMBINOmode" : "S3",

				"DANTE" : {
							"minima" : {
											"BaF" : [0,0,0],
											"BGO" : [1,1,1]
									   },
							"maxima" : {
											"BaF" : [0,0,0],
											"BGO" : [2,3,4]
									   }
						  },

				"DESCANT" : {
								"minima" : {
												"DESCANT" : [0,0,0]
										   },
								"maxima" : {
												"DESCANT" : [1,1,1]
										   },
							},

				"HPGe" : {
							"minima" : {
											"HPGe" : [0,0,0],
											"BGO" : [0,0,0]
									   },
							"maxima" : {
											"HPGe" : [1,1,1],
											"BGO" : [100,100,100]
							           },
						 },
				"HPGemode" : "GRIFFIN",
				"BGOenable" : 1,

				"PACES" : {
							"minima" : {
											"PACES" : [0,0,0]
									   },
							"maxima" : {
											"PACES" : [1,1,1]
									   }
						  },


				"SCEPTAR" : {
								"minima" : {
												"SCEPTAR" : [0,0,0],
												"ZDS" : [0,0,0]
										   },
								"maxima" : {
												"SCEPTAR" : [1,1,1],
												"ZDS" : [1,1,1]
										   }
							},
				"SCEPTARconfig" : [1,0,1],

				"SHARC" : {
							"minima" : {
											"SHARC" : [0,0,0]
								       },
							"maxima" : {
											"SHARC" : [1,1,1]
							           },
						  },
				"SMrows" : 2,
				"SMcolumns" : 4,
				"SM_ODBkeys" : ["/Location/Of/Device/Varibles", "/Location/Of/Device/Settings", "HV Key"],
				"SMnChannels" : 16,
				"nRadialHoriz" : 4, 
				"nAzimuthalHoriz" : 4, 
				"nRadialVert" : 1, 
				"nAzimuthalVert" : 16,

				"SPICE" : {
							"minima" : {
											"SPICE" : [0,0,0]
									   },
							"maxima" : {
											"SPICE" : [1,1,1]
									   }
						  },

				"TIP" : {
							"minima" : {
											"CsI" : [0,0,0],
											"HPGe" : [0,0,0],
											"BGO" : [0,0,0]
									   },
							"maxima" : {
											"CsI" : [1,200,5000],
											"HPGe" : [1,1000,5000],
											"BGO" : [1,1,2]
									   }
						},
				"TIPmode" : "Wall",

				"DSSD" : {
								"minima" : {
												"DSSD" : [0,0,0]
										   },
								"maxima" : {
												"DSSD" : [1,1,1]
										   },
						},

				//"DAQminima" : [0, 0, 0, 0, 0, 0], //minima of element scales: [top level view rate, top level transfer, detail view rate, detail view transfer, master rate, master transfer]
				//"DAQmaxima" : [10000, 100000, 1000, 1000, 50000, 50000],

				"JSONPrepos" : ["http://midtig06.triumf.ca:8092/parameters?jsonp=parseThreshold", "http://midtig06.triumf.ca:8091/scalar?jsonp=parseResponse"]
				}

			}

/*Parameter Dictionary//////////////////////////////////////
//Global
devMode							Flag that toggles between actually fetching ODB values and generating dummy values
statusURL:						String containing the url of the MIDAS status page
topDeployment:                  switches to turn top level assets on/off
deployment						switches to turn subsystems on/off
wrapper							ID of div that wraps all both sidebars + main display region
subdetectorUnit                 units for the scale in each of the subdetector views [HV, thresholds, rates]
monitorValues					monitoring options on the subdetector pages

//HV monitor
ODBkeys: 						["/Location/Of/Device/Varibles", "/Location/Of/Device/Settings", "Demand Voltage Key", "Measured Voltage Key", "Measured Current Key", "Voltage Ramp Up Key", "Voltage Ramp Down Key", "Temperature Key", "ChState Key", "ChStatus Key", "Voltage Limit Key", "Current Limit Key"]
rows:							number of rows in the HV monitor, not counting the primary row
columns:						number of columns in HV monitor.
rowTitles:						Array of strings descrbing the row titles
alarmThresholds:				Maximum values before an alarm is tripped [abs(demand-measured voltage), current, temperature, rate]
scaleMaxima:					Saturation point for color scale
prefix:							Array of strings which will be prepended to corresponding lines in the HV tooltip
postfix:						As prefix
minVoltage:						minimum voltage represented in sliders and fillmeters
maxVoltage:						""
minCurrent:						""
maxCurrent:						""
minTemperature:					""
maxTemperature:					""
minRampSpeed:					""
maxRampSpeed:					""
statusPrecision:				number of decimal places to keep in the status sidebar
barChartPrecision:				number of decimal places to keep in the barchart scale
alarmPrecision:					number of decimal places to keep in the alarm reporting sidebar
voltUnit:						unit to be used for voltage reporting
rampUnit:						""
currentUnit:					""
temperatureUnit:				""
moduleSizes:                    Array containing a size code for each slot in the HV crate: 0=empty, 1=12 ch card, 4=48 ch card.

//SHARC
SMrows:							number of rows of strip diplays
SMcolumns:						number of cols of strip displays
SM_ODBkeys:						["/Location/Of/Device/Varibles", "/Location/Of/Device/Settings", "HV Key"]
SMnChannels:					number of channels per display
SMminima:						array containing scale minima
SMmaxima:						""
nRadialHoriz					number of radial bins in the disks corresponding to the horizontal strip display 
nAzimuthalHoriz					number of azimuthal bins "" 
nRadialVert						number of radial bins in disks associated with the vertical strip display 
nAzimuthalVert					number of azimuthal bins ""

//HPGe
HPGemode						'GRIFFIN' or 'TIGRESS'
BGOenable						are the suppressors present?
HPGeminima						array of scale minima: [HPGe HV, HPGe Thresholds, HPGe Rate...]
HPGemaxima						""

DESACNTminima					array of scale minima: [HV, Thresholds, Rate...]
DESCANTmaxima					""

PACESminima						array of scale minima: [HV, Thresholds, Rate...]
PACESmaxima						""

DANTEminima						array of scale minima: [HV, Thresholds, Rate...]
DANTEmaxima						""

SPICEminima						array of scale minima: [HV, Thresholds, Rate...]
SPICEmaxima						""

SCEPTARminima					array of scale minima: [HV, Thresholds, Rate...]
SCEPTARmaxima					""
SCEPTARconfig                   subsystems on: [upstream sceptar, downstream sceptar, downstream ZDS]

TIPminima						array of scale minima: [HV, Thresholds, Rate...]
TIPmaxima						""

//DAQ
DAQminima:						array containing minima of DAQ rate reporting scale: [master, collector groups, collector links, collectors, digitizer summary links, digitizer summaries, digitizer groups, digitizer links, digitizers]
DAQmaxima:						""


//JSONP
JSONPrepos						array containing URLs of all JSONP data to be pulled in at each update: [thresholds, scalars, dummy]

*/


