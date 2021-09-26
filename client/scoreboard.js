/**
 * Author: Samuel Ryckman
 * Plotter Application
 */
 /*
 TODO: 
  - Highlight the current team and round (bubbles gif "...")
  - Fix API final round scoring
  - Add toggle to hide final round scores
  - Auto-update?
 */
class Scoreboard {
    constructor() {
        this.leaderboard = $('#leaderboard');
        this.scoreboard = $('#scoreboard');
        this.loadingWheel = $('#loadingWheel');
        
        // List of teams and info relating to them
        this.teams = [];
        this.rounds = [];
        this.scores = {};
        this.leaderboard = [];
        this.curThrow = {};

        //API endpoints
        this.roundSet = 0;
        this.apiEndpoints = [];
        this.apiEndpoints[0] = {
            "rounds":"https://docs.google.com/spreadsheets/d/e/2PACX-1vSXelrzfqB8JhwFZoq3XsFhrKF4j6Z2o4fuIyeQhawOgdijLSwex0lVq8u4pdk52-a0MLr8RTCagVYi/pub?gid=1295120331&single=true&output=csv",
            "scores":"https://docs.google.com/spreadsheets/d/e/2PACX-1vSXelrzfqB8JhwFZoq3XsFhrKF4j6Z2o4fuIyeQhawOgdijLSwex0lVq8u4pdk52-a0MLr8RTCagVYi/pub?gid=871141574&single=true&output=csv"
        };
        this.apiEndpoints[1] = {
            "rounds":"https://docs.google.com/spreadsheets/d/e/2PACX-1vSXelrzfqB8JhwFZoq3XsFhrKF4j6Z2o4fuIyeQhawOgdijLSwex0lVq8u4pdk52-a0MLr8RTCagVYi/pub?gid=1173911332&single=true&output=csv",
            "scores":"https://docs.google.com/spreadsheets/d/e/2PACX-1vSXelrzfqB8JhwFZoq3XsFhrKF4j6Z2o4fuIyeQhawOgdijLSwex0lVq8u4pdk52-a0MLr8RTCagVYi/pub?gid=4768643&single=true&output=csv"
        };
        this.apiTeams = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSXelrzfqB8JhwFZoq3XsFhrKF4j6Z2o4fuIyeQhawOgdijLSwex0lVq8u4pdk52-a0MLr8RTCagVYi/pub?gid=934905414&single=true&output=csv";
        this.apiUpdateCode = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSXelrzfqB8JhwFZoq3XsFhrKF4j6Z2o4fuIyeQhawOgdijLSwex0lVq8u4pdk52-a0MLr8RTCagVYi/pub?gid=263238343&single=true&output=csv";
        
        //Auto Update stuff
        this.lastUpdate = (new Date()).getTime();
        this.updateInterval = 15*1000;
        
        this.init();
    }

    
    /**
     * Read the filter options from the API and display them.
     * 
     * @param url - API endpoint to contact ["getLastUpdate", "getScores", "getTeamInfo", "getLeaders"]
     * @param callback - function to call once we have the data
     */
    getData(url, callback) {
        $.ajax({ type: "GET",   
            url: url,   
            async: false,
            success : function(text) {
                if (!(callback == null)) {
                    callback(csvToJson(text));
                }
            }
        });
    }
    
    init() {
        //Build stuff
        //this.buildLeaderboard();
        //this.buildScoreboard();

        // Figure out which rounds we are viewing
        var url = new URL(window.location.href);
        var rnd = url.searchParams.get("rnd");
        if (rnd != null) {
            this.roundSet = Number(rnd);
            console.log(rnd);
        }
        if (this.roundSet == 1) {
            $("#afternoonRounds").addClass("active");
        } else {
            $("#morningRounds").addClass("active");
        }
        
        //Update content
        var self = this;
        this.updateAllData(function() {
            self.loadingWheel.addClass("hidden");
            self.updateUi();
            
            //Update at an interval
            // TODO: Had to remove these.
            // self.updater = setInterval(function() {
            //     if (!document.hidden) {
            //         self.checkForUpdates();
            //     }
            // }, self.updateInterval);
            
            // //Update on page made active
            // document.addEventListener("visibilitychange", function() {
            //     if (!document.hidden && ((new Date()).getTime() - self.lastUpdate) > self.updateInterval) {
            //         self.checkForUpdates();
            //     }
            // });
        });
    }
    
    
    
    /**Get the update time from the API and check vs the one for the current data.
    **/
    checkForUpdates() {
        console.log("Checking for updates...");
        var self = this;
        this.getData(this.apiLastUpdate, function(data) {
            // TODO: This is very likely broken
            var newCode = data;
            if (newCode !== self.lastVersionCode) {
                self.lastVersionCode = newCode;
                //
                self.updateScores(function() {
                    self.updateUi();
                });
            }
        });
        
        this.lastUpdate = (new Date()).getTime();
    }
    
    /**Get all data for the scoreboard.
    */
    updateAllData(callback) {
        var self = this;
        //Get the team list and info
        this.getData(this.apiTeams, function(data) {
            console.log(data);
            if (data["error"] === undefined) {
                self.teams = data;
                
                //Sort the teams based on throwing order
                self.teams.sort(function(a, b) {
                    return a["firingOrder"] - b["firingOrder"];
                });
                
                //Get the rounds
                self.getData(self.apiEndpoints[self.roundSet].rounds, function(data) {
                    if (data["error"] === undefined) {
                        self.rounds = data;
                        
                        //Get the scores
                        self.updateScores(callback);
                    }
                });
            }
        });
    }
    
    /**Get the updated data for the scoreboard
    */
    updateScores(callback) {
        //Get the scores
        var self = this;
        this.getData(this.apiEndpoints[this.roundSet].scores, function(data) {
            if (data["error"] === undefined) {
                // Convert to an object
                var newDat = {};
                for (const score of data) {
                    newDat[score["Name"]] = score;
                    
                    // Format the round data correctly
                    newDat[score["Name"]]["rounds"] = [];
                    var i = 1;
                    while (score["Rd"+String(i)+"Dist"] != null && score["Rd"+String(i)+"Score"] != null) {
                        newDat[score["Name"]]["rounds"].push({
                            "dist":score["Rd"+String(i)+"Dist"],
                            "score":score["Rd"+String(i)+"Score"],
                        });
                        i++;
                    }
                }

                self.scores = newDat;
                
                //Update the rankings based on the scores
                self.updateLeaders();
                
                //Figure out what team and round we are on
                self.updateCurThrow();
                
                //update the data timestamp
                self.getUpdateCode(callback);
            }
        });
    }

    /**
     * Get the most recent data version code
     * @param callback - to call when done 
     */
    getUpdateCode(callback) {
        var self = this;
        self.getData(this.apiLastUpdate, function(data) {
            self.lastVersionCode = data;
            
            //Do whatever is next
            if (callback) {
                callback();
            }
        });
    }
    
    
    /*
    * Figure out which team and round we are currently on.
    */
    updateCurThrow() {
        //Find the current round number for each team
        var currentRounds = [];
        for (const teamData of this.teams) {
            var curRound = 0;
            //Find the first round with a value
            while (curRound < this.scores[teamData.Name].rounds.length && 
                   this.scores[teamData.Name].rounds[curRound].dist !== "") {
                curRound++
            }
            
            currentRounds.push({
                'name':teamData.Name,
                'round':curRound,
                'order':teamData.firingOrder
            });
        }
        
        
        //Sort based on round count with firing order as the tiebreaker
        currentRounds.sort(function(a, b) {
            if (a.round === b.round) {
                return a.order - b.order
            }
            return a.round - b.round;
        });
        
        this.curThrow = {
            'team':currentRounds[0].name,
            'round':currentRounds[0].round
        };
        
        console.log(this.curThrow);
    }
    
    /** Get the top three teams and their scores
    */
    updateLeaders() {
        //Get the total for each team
        for (const teamData of this.teams) {
            this.leaderboard.push({"team":teamData.Name, "score":this.scores[teamData.Name].Total});
        }
        
        //Sort
        this.leaderboard.sort(function(a, b) {
            return b[1] - a[1];
        });
        
        //Remove all but the top three
        this.leaderboard.length = Math.min(this.leaderboard.length, 3);
    }
    
    updateUi() {
        //Create the updated scoreboard
        var newScoreboard = this.buildScoreboard();
        
        //Hide the old one, add the new one, and remove the old one
        this.scoreboard.addClass("hidden");
        this.scoreboard.after(newScoreboard);
        this.scoreboard.remove();
        this.scoreboard = newScoreboard;
    }
    
    
    buildLeaderboard() {
        
    }
    
    buildScoreboard() {
        var newScoreboard = $('<div id="scoreboard"></div>');
        for (const teamData of this.teams) {
            if (this.scores[teamData.Name] !== undefined) {
                
                var name = teamData.Name;
                
                //heading
                var scoreHead = $('<div></div>');
                if (teamData.Logo !== "") {
                    $('<img src="'+teamData.Logo+'">').appendTo(scoreHead);
                }
                $('<h2>'+name+'</h2>').appendTo(scoreHead);
                scoreHead.appendTo(newScoreboard);
                scoreHead.addClass("scoreHeading");
                $('<hr>').appendTo(newScoreboard);
                
                //Table of scores
                var table = $('<table></table>');
                var thead = $('<thead></thead>');
                
                //header
                var row = $('<tr></tr>');
                $('<th>Round</th>').appendTo(row);
                $('<th>Throw (ft)</th>').appendTo(row);
                $('<th>Score</th>').appendTo(row);
                row.appendTo(thead);
                if (teamData.Color !== "") {
                    row.css('background-color', teamData.Color);
                }
                
                thead.appendTo(table);
                
                //body
                var tbody = $('<tbody></tbody>');
                //TODO: need the master list of rounds and need to iterate that instead
                var self = this;
                this.rounds.forEach(function (round, index) {
                    //Construct the round description text
                    var roundText = round.Type;
                    if (round.Type === 'Accuracy') {
                        roundText += ' ('+round.Dist+'ft)';
                    }
                    
                    //dist, score
                    var row = $('<tr></tr>');
                    $('<td>'+roundText+'</td>').appendTo(row);
                    $('<td>'+self.scores[name].rounds[index].dist+'</td>').appendTo(row);
                    $('<td>'+self.scores[name].rounds[index].score+'</td>').appendTo(row);
                    row.appendTo(tbody);
                });
                
                //Total score
                row = $('<tr></tr>');
                $('<td></td>').appendTo(row);
                $('<td>total:</td>').appendTo(row);
                $('<td>'+this.scores[name].Total+'</td>').appendTo(row);
                row.appendTo(tbody);
                if (teamData.Color !== "") {
                    row.css('border-color', teamData.Color);
                }
                
                tbody.appendTo(table);
                table.appendTo(newScoreboard);
                
            }
        }
        return newScoreboard;
    }

}

function csvToJson(csv){
    var lines=csv.split("\n");
  
    var result = [];
  
    // NOTE: If your columns contain commas in their values, you'll need
    // to deal with those before doing the next step 
    // (you might convert them to &&& or something, then covert them back later)
    // jsfiddle showing the issue https://jsfiddle.net/
    var headers=lines[0].split(",");
    headers = headers.map(s => String(s).trim());
  
    for(var i=1;i<lines.length;i++){
  
        var obj = {};
        var currentline=lines[i].split(",");
  
        for(var j=0;j<headers.length;j++){
            obj[headers[j]] = currentline[j];
        }
  
        result.push(obj);
  
    }
  
    //return result; //JavaScript object
    return result; //JSON
}