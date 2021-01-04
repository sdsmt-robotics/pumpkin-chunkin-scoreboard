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
        
        //images
        var imgDir = "img/";
        this.imgs = {
             "bg":        imgDir+"bg.svg",
             "maleIco":   imgDir+"ico_male.svg",
             "femaleIco": imgDir+"ico_female.svg",
             "otherIco":  imgDir+"ico_other.svg",
             "noneIco":   imgDir+"ico_none.svg"
            };

        //API endpoints
        this.apiEndpoint = "https://script.google.com/macros/s/AKfycbxuZXy0_Ardo522tVnAt6UGPM29GE_L_as970FVx2Ysm6V6k2k/exec";
        
        //Auto Update stuff
        this.lastUpdate = (new Date()).getTime();
        this.updateInterval = 15*1000;
        
        this.init();
    }

    
    /**
     * Read the filter options from the API and display them.
     * 
     * @param action - API endpoint to contact ["getLastUpdate", "getScores", "getTeamInfo", "getLeaders"]
     * @param callback - function to call once we have the data
     */
    getData(action, callback) {
        $.getJSON(this.apiEndpoint+"?action="+action, callback);
    }
    
    init() {
        //Build stuff
        this.buildLeaderboard();
        this.buildScoreboard();
        
        //Update content
        var self = this;
        this.updateAllData(function() {
            self.loadingWheel.addClass("hidden");
            self.updateUi();
            
            //Update at an interval
            self.updater = setInterval(function() {
                if (!document.hidden) {
                    self.checkForUpdates();
                }
            }, self.updateInterval);
            
            //Update on page made active
            document.addEventListener("visibilitychange", function() {
                if (!document.hidden && ((new Date()).getTime() - self.lastUpdate) > self.updateInterval) {
                    self.checkForUpdates();
                }
            });
        });
    }
    
    
    
    /**Get the update time from the API and check vs the one for the current data.
    **/
    checkForUpdates() {
        console.log("Checking for updates...");
        var self = this;
        this.getData("getLastUpdate", function(data) {
            var newCode = data["code"];
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
        this.getData("getTeamInfo", function(data) {
            console.log(data);
            if (data["error"] === undefined) {
                self.teams = data;
                
                //Sort the teams based on throwing order
                self.teams.sort(function(a, b) {
                    return a["firingOrder"] - b["firingOrder"];
                });
                
                //Get the rounds
                self.getData("getRounds", function(data) {
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
        this.getData("getScores", function(data) {
            if (data["error"] === undefined) {
                self.scores = data;
                
                //Update the rankings based on the scores
                self.updateLeaders();
                
                //Figure out what team and round we are on
                self.updateCurThrow();
                
                
                //update the data timestamp
                self.getData("getLastUpdate", function(data) {
                    self.lastVersionCode = data["code"];
                    
                    //Do whatever is next
                    if (callback) {
                        callback();
                    }
                });
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
            while (curRound < this.scores[teamData.name].rounds.length && 
                   this.scores[teamData.name].rounds[curRound].dist !== "") {
                curRound++
            }
            
            currentRounds.push({
                'name':teamData.name,
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
            this.leaderboard.push({"team":teamData.name, "score":this.scores[teamData.name].total});
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
            if (this.scores[teamData.name] !== undefined) {
                
                var name = teamData.name;
                
                //heading
                var scoreHead = $('<div></div>');
                if (teamData.logoUrl !== "") {
                    $('<img src="'+teamData.logoUrl+'">').appendTo(scoreHead);
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
                if (teamData.color !== "") {
                    row.css('background-color', teamData.color);
                }
                
                thead.appendTo(table);
                
                //body
                var tbody = $('<tbody></tbody>');
                //TODO: need the master list of rounds and need to iterate that instead
                var self = this;
                this.rounds.forEach(function (round, index) {
                    //Construct the round description text
                    var roundText = round.type;
                    if (round.type === 'Accuracy') {
                        roundText += ' ('+round.dist+'ft)';
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
                $('<td>'+this.scores[name].total+'</td>').appendTo(row);
                row.appendTo(tbody);
                if (teamData.color !== "") {
                    row.css('border-color', teamData.color);
                }
                
                tbody.appendTo(table);
                table.appendTo(newScoreboard);
                
            }
        }
        return newScoreboard;
    }

}

