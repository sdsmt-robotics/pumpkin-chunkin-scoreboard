# Pumpkin Chunkin Scoreboard
Live updating scoreboard for pumpkin chunkin.  

This is an online live-updating scoreboard to track scores and results for the annual SD Mines pumpkin chunkin competition. The data is hosted in a Google Sheet and is accessed by the client page as csv data which is then displayed.


# Project Information  
Project folders:  
 - **client** - contains the code for the client scoreboard app that receives and dispays the data.
 - **api** - contains the code for the data API. This is simply the Google Sheet

The client files just need to be hosted on some public webserver.  

The Google Sheet should be private. Then the api pages of the sheet should be published as csv files.
 - File -> Publish to the Web  
 - Select the pages (have to do one at a time) and the format (.csv)  
 - Make sure the "Automatically update" buttton is checked and access is not restricted.
 - Add in the links to the individual pages in the scoreboard.js file.
