function loadParameters(){

				window.parameters = {
				//global
				"devMode" : 0,
				"topDeployment" : {"HV":1, "Subsystems":1, "DAQ":1, "Clock":1, "Filter":1, "VME":1, "Cycle":1},
				"wrapper" : "topWrapper",
				"tooltipPrecision" : 0,
				"colorScale"  : ["ROOT Rainbow", "Greyscale", "Sunset", "Red Scale", "Mayfair"],
				"detectorLogMode" : {'SubsystemsButton' : 0, 'DAQbutton' : 0, 'DashboardButton' : 0},  //log state a function of ID of button used to summon current view state 
				"warningFill" : 0, //an img to fill detector channels absent from the JSONP post
				"JSONPrepos" : ["http://midtig06.triumf.ca:8091/mother/parameters?jsonp=parseThreshold", "http://midtig06:8091/mother/scalar?jsonp=parseResponse"],

				//HV monitor
				"ODBkeys" : ["Variables/Demand", "Variables/Measured", "Variables/Current", "Settings/Ramp Up Speed", "Settings/Ramp Down Speed", "Variables/Temperature", "Settings/ChState", "Variables/ChStatus", "Settings/Voltage Limit", "Settings/Current Limit", "Settings/Names"],
				"rows" : 12,
				"columns": [],
				"scaleMaxima" : [1,1,1,1],
				"statusPrecision" : 0,
				"barChartPrecision" : 0,
				"alarmPrecision" : 0,
				"voltUnit" : "V",
				"rampUnit" : "V/s",
				"currentUnit" : "uA",
				"temperatureUnit" : "C",
				"HVequipmentNames" : [],
				"moduleSizes" : [],

				//Subdetector monitors
				"subdetectorUnit" : ["V", "ADC units", "Hz"],
				"monitorValues" : ["HV", "Thresholds", "Rate", "TAC-Thresholds", "TAC-Rate"],
				"subdetectorColors" : ["ROOT Rainbow", "ROOT Rainbow", "Sunset"],

				"BAMBINO" : {
								"minima" : {
												"BAMBINO" : [0,0,0]
										   },
								"maxima" : {
												"BAMBINO" : [1,1,1]
										   }
							},
				"BAMBINOmode" : "S3",
				"BAMBINOlayers" : 2,
				"BAMBINOdeployment" : [1,0],  //upstream, downstream

				"DANTE" : {
							"minima" : {
											"LaBrPMT" : [0,0,0],
											"LaBrTAC" : [0,0,0],
											"BGO" : [0,0,0]
									   },
							"maxima" : {
											"LaBrPMT" : [1,1,1],
											"LaBrTAC" : [1,1,1],
											"BGO" : [1,1,1]
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
				"cloversAbsent" : [],

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
				"SHARCpads" : 0,

				"SPICE" : {
							"minima" : {
											"SPICE" : [0,0,0]
									   },
							"maxima" : {
											"SPICE" : [1,1,1]
									   }
						  },
				"SPICEaux" : '',
				"SPICEauxLayers" : 2,

				"TIPwall" : {
							"minima" : {
											"TIPwall" : [0,0,0],
									   },
							"maxima" : {
											"TIPwall" : [1,1,1],
									   }
						},

				"TIPball" : {
							"minima" : {
											"TIPball" : [0,0,0],
									   },
							"maxima" : {
											"TIPball" : [1,1,1],
									   }
						},

				"DSSD" : {
								"minima" : {
												"DSSD" : [0,0,0]
										   },
								"maxima" : {
												"DSSD" : [1,1,1]
										   },
						},

				"ZDS" : {
								"minima" : {
												"ZDS" : [0,0,0]
										   },
								"maxima" : {
												"ZDS" : [1,1,1]
										   },
						},

				//DAQ
				"validDetectors" : ["TIG", "TIS", "GRG", "GRS", "HPG", "HPS", "BAE", "BAZ", "SHQ", "SHB", "MAD", "MAM", "CSD", "CSM", "SPI", "SPE", "DSC", "SEP", "SET", "PAC", "DAL", "DAB", "DAS", "TPC", "TPW", "TPP", "TPG", "TPE", "ZDS", "ZDP", "ZDM", "ZDD", "TBR", "YBP", "YBB", "TRF", "RFL", "RFS"],

				//clocks
				"nClocks" : 0,
				"clockVariableNames" : ['Clock Enable', 'Configuration', 'Sync Source', 'Clock Source', 'Ref. Clock', 'LEMO Clock', 'LEMO Sync', 'eSATA Clock', 'eSATA Sync', 'SyncTmeS', 'SyncTmeE', 'Ch. 0 Hi Cycles', 'Ch. 0 Lo Cycles', 'Ch. 0 Bypass', 'Ch. 0 Phase', 'Ch. 1 Hi Cycles', 'Ch. 1 Lo Cycles', 'Ch. 1 Bypass', 'Ch. 1 Phase', 'Ch. 2 Hi Cycles', 'Ch. 2 Lo Cycles', 'Ch. 2 Bypass', 'Ch. 2 Phase', 'Ch. 3 Hi Cycles', 'Ch. 3 Lo Cycles', 'Ch. 3 Bypass', 'Ch. 3 Phase', 'Ch. 4 Hi Cycles', 'Ch. 4 Lo Cycles', 'Ch. 4 Bypass', 'Ch. 4 Phase', 'Ch. 5 Hi Cycles', 'Ch. 5 Lo Cycles', 'Ch. 5 Bypass', 'Ch. 5 Phase', 'Ch. 6 Hi Cycles', 'Ch. 6 Lo Cycles', 'Ch. 6 Bypass', 'Ch. 6 Phase', 'Ch. 7 Hi Cycles', 'Ch. 7 Lo Cycles', 'Ch. 7 Bypass', 'Ch. 7 Phase', 'Power', 'Status', 'Mode', 'Alarm', 'Unit Power', 'Tuning Voltage', 'Laser Current', 'Clock Heater Power', 'Temperature', 'Serial No.', 'Firmware Version']

				}

				window.parameters.warningFill = document.getElementById('warningFill');

			}

/*Parameter Dictionary//////////////////////////////////////
//Global
devMode							1 = generate fake data for testing, 0 = go looking for the JSON posts in JSONPrepos
topDeployment					indicates which subsections will be deployed - TODO: revalidate & debug, probably broken.
wrapper  						ID for div that wraps most of the page content
tooltipPrecision				precision for most generic tooltip table
colorScale						Names of defined color scales 
detectorLogMode					default linear (=0) or log (=1) state for various widgets
warningFill						an image for filling absent channels
JSONPrepos						array containing URLs of all JSONP data to be pulled in at each update: [thresholds, scalars]

//HV monitor
ODBkeys 						[	"Demand Voltage Key", 
									"Measured Voltage Key", 
									"Measured Current Key", 
									"Voltage Ramp Up Key", 
									"Voltage Ramp Down Key", 
									"Temperature Key", 
									"ChState Key", 
									"ChStatus Key", 
									"Voltage Limit Key", 
									"Current Limit Key",
									"Name Key"
								]
rows							number of rows in the HV monitor, not counting the primary row
columns							number of columns in HV monitor.
scaleMaxima						Saturation point for [HV, current, temperature, rate] alarm color scale; ie scaleMaxima[0] = 7 -> full alarm color if Vmeas-Vdemand > 7 
statusPrecision					number of decimal places to keep in the status sidebar
barChartPrecision				number of decimal places to keep in the barchart scale
alarmPrecision					number of decimal places to keep in the alarm reporting sidebar
voltUnit						unit to be used for voltage reporting
rampUnit						""
currentUnit						""
temperatureUnit					""
HVequipmentNames				Array of names of HV slow control front ends, autogenerated, n FE must be named as HV-0, HV-1... HV-n
moduleSizes	                    Array containing a size code for each slot in the HV crate: 0=empty, 1=12 ch card, 4=48 ch card.

//Subdetector monitors
subdetectorUnit                 units for the scale in each of the subdetector views [HV, thresholds, rates]
monitorValues					monitoring options on the subdetector pages
subdetectorColors				default color scales for the different subdetector views

//DAQ
validDetectors					Prefixes of detectors recognized in this project

//Clocks
nClocks							Autodetected number of clocks, slow control frontend name GRIF-Clk<n>
clockVariableNames				list of variable names used when constructing the clock right sidebar






///////////////old//////////////////////////////
//Global
devMode							Flag that toggles between actually fetching ODB values and generating dummy values
statusURL:						String containing the url of the MIDAS status page
topDeployment:                  switches to turn top level assets on/off
deployment						switches to turn subsystems on/off
wrapper							ID of div that wraps all both sidebars + main display region
subdetectorUnit                 units for the scale in each of the subdetector views [HV, thresholds, rates]
monitorValues					monitoring options on the subdetector pages

//HV monitor

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


