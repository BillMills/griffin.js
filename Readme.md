#Intro

Welcome to griffin.js, a user interface by Bill Mills for the MIDAS data aquisition system, designed for use on the GRIFFIN and TIGRESS experiments at TRIUMF.  griffin.js aims to make an easy to use, easy to understand, and elegant experimental monitoring and control interface to enhance the user experience and productivity of students and scientists working at TRIUMF on GRIFFIN and her sister experiments. 

Part of the GRIFFIN Collaboration Open Source Software Project

Copyright (c) 2012 - 2014, Bill Mills
All rights reserved.

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.

#Setup

griffin.js comes with a setup script designed to make deployment as painless as possible.  Before you start, you'll need an experiment running in a sufficiently recent version of MIDAS (last commit validated with this project MIDAS 89a9e94 January 2014), and a sufficiently recent version of Chrome or Firefox.   Then, just download the code:

    git clone https://github.com/GRIFFINCollaboration/griffin.js.git

...and navigate to the install directory and run the setup script:

    cd griffin.js/install
    source setupODB

This will set up the Custom directory in your ODB, with appropriate pointers to all the Dashboard assets.  And voila!  You should have three custom page links on your MIDAS Status page now: ConfigureExperiment, ConfigureSubdetectors, and Dashboard.  

Click on ConfigureExperiment from the Status page, and click through the options it presents to you to choose which subsystems you'll be using.  Upon completion, this page will send you to another config page to choose the detailed parameters of your experiment; completing this will set up the DashboardConfig subdirectory in your ODB, and send you to the Dashboard proper.  That's it!  Your dashboard is now happily watching your experiment.

##Help Nothing Works

The instructions above will deploy a minimal stable version of the dashboard for you, but you still need to install the appropriate frontends for the clocks and HV, make sure the FSPC (TIGRESS) or MSC (GRIFFIN) tables are in the appropriate places, and that the rate and threshold JSON posts are live - per their documentation.



<img src='https://github.com/BillMills/griffin.js/blob/master/img/static.gif?raw=true'></image>
