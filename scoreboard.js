/**
 * Author: Samuel Ryckman
 * Plotter Application
 */
class Scoreboard {
    constructor() {
        this.leaderboard = $('#leaderboard');
        this.scoreboard = $('#scoreboard');
        this.loadingWheel = $('#loadingWheel');
        
        // List of teams and info relating to them
        this.teams = {};
        this.scores = {};
        this.leaderboard = [];
        
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
        
        this.init();
    }

    
    /**
     * Read the filter options from the API and display them.
     * 
     * @param action - API endpoint to contact ["getLastUpdate", "getScores", "getTeamInfo", "getLeaders"]
     * @param callback - function to call once we have the data
     */
    getData(action, callback) {
        console.log("Getting data: "+action);
        $.getJSON(this.apiEndpoint+"?action="+action, callback);
    }
    
    init() {
        //Build stuff
        this.buildLeaderboard();
        this.buildScoreboard();
        
        //Update content
        var self = this;
        this.updateData(function() {
            self.loadingWheel.addClass("hidden");
            self.updateUi();
        });
    }
    
    updateData(callback) {
        var self = this;
        //Get the team list and info
        this.getData("getTeamInfo", function(data) {
            console.log("Done!");
            console.log(data);
            if (data["error"] === undefined) {
                self.teams = data;
                
                //Get the scores
                self.getData("getScores", function(data) {
                    if (data["error"] === undefined) {
                        self.scores = data;
                        
                        //Update the rankings based on the scores
                        self.updateLeaders();
                        
                        if (callback) {
                            callback();
                        }
                    }
                });
            }
        });
    }
    
    updateLeaders() {
        //Get the total for each team
        for (var team in this.teams) {
            this.leaderboard.push({"team":team, "score":this.scores[team].total});
        }
        
        //Sort
        this.leaderboard.sort(function(a, b) {
            return b[1] - a[1];
        });
        
        //Remove all but the top three
        this.leaderboard.length = Math.min(this.leaderboard.length, 3);
    }
    
    updateUi() {
        console.log(this.teams);
        console.log(this.scores);
        console.log(this.leaderboard);
        
        this.buildScoreboard();
    }
    
    
    buildLeaderboard() {
        
    }
    
    buildScoreboard() {
        for (var team in this.teams) {
            if (this.scores[team] !== undefined) {
                //heading
                var scoreHead = $('<div></div>');
                scoreHead.addClass("scoreHeading");
                $('<h2>'+team+'</h2>').appendTo(scoreHead);
                scoreHead.appendTo(this.scoreboard);
                $('<hr>').appendTo(this.scoreboard);
                
                //Table of scores
                var table = $('<table></table>');
                var thead = $('<thead></thead>');
                
                //header
                var row = $('<tr></tr>');
                $('<th>Round</th>').appendTo(row);
                $('<th>Distance</th>').appendTo(row);
                $('<th>Score</th>').appendTo(row);
                row.appendTo(thead);
                
                thead.appendTo(table);
                
                //body
                var tbody = $('<tbody></tbody>');
                //TODO: need the master list of rounds and need to iterate that instead
                for (const round of this.scores[team].rounds){
                }
                this.scores[team].rounds.forEach(function (round, index) {
                    //dist, score
                    var row = $('<tr></tr>');
                    $('<td>Round '+index+'</td>').appendTo(row);
                    $('<td>'+round.dist+'</td>').appendTo(row);
                    $('<td>'+round.score+'</td>').appendTo(row);
                    row.appendTo(tbody);
                });
                
                //Total score
                row = $('<tr></tr>');
                $('<td></td>').appendTo(row);
                $('<td>total:</td>').appendTo(row);
                $('<td>'+this.scores[team].total+'</td>').appendTo(row);
                row.appendTo(tbody);
                
                tbody.appendTo(table);
                table.appendTo(this.scoreboard);
            }
        }
    }

}

