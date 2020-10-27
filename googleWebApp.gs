function doGet(e){
  try {
    Logger.log("--- doGet ---");
  var data = {};
  //switch based on "action" param (getLastUpdate, getScores, getCurrent, getLeader)
  switch(e.parameter["action"]) {
    case "getLastUpdate":
      // get the time of the last score update (so client knows if need to re-get stuff)
      break;
    case "getScores":
      // get the scores for all teams
      data = getScores();
      break;
    case "getTeamInfo":
      // get list of teams and their information
      data = getTeamInfo();
      break;
    case "getCurrentFiring":
      // get the name of the team currently firing
      break;
    case "getLeaders":
      // get the names of the top three teams
      break;
    default:
      data = {'error':'Unknown action:"'+e.parameter["action"]+'"'};
  }
  
  return ContentService.createTextOutput(JSON.stringify(data))
  .setMimeType(ContentService.MimeType.JSON);
  } catch(e) {
    return ContentService.createTextOutput(JSON.stringify({'error':e.message}))
  .setMimeType(ContentService.MimeType.JSON);
  }
}

function openSheet() {
  return SpreadsheetApp.openById("1_QLUepMIvqItrRC4vr7d6M1cUbRLv62KPpoweZCoU3w");
}

function getTeamInfo() {
    // Load the spreadsheet
    var ss = openSheet();
    var teamsPage = ss.getSheetByName("Teams");
  
  // Load the data for each team
  var lastIdx = teamsPage.getLastRow();
  var data = {};
  for (r = 2; r <= lastIdx; r++) {
    //Load the data for the team and add to the list
    data[readCell(teamsPage, r, 1)] = {
      'firingOrder':readCell(teamsPage, r, 2),
      'logoUrl':readCell(teamsPage, r, 3),
      'color':readCell(teamsPage, r, 4)
    };
  }
  
  return data;
}

//Get the column index for a particular team on the scoring page
function getTeamScoreIndexes() {
    // Load the spreadsheet
    var ss = openSheet();
    var teamsPage = ss.getSheetByName("Teams");
  
  // Load the data for each team
  var lastIdx = teamsPage.getLastRow();
  var teamIndexes = {};
  for (r = 2; r <= lastIdx; r++) {
    teamIndexes[readCell(teamsPage, r, 1)] = readCell(teamsPage, r, 5);
  }
  
  return teamIndexes;
}

function readCell(page, row, col) {
  return page.getRange(row, col).getValues()[0][0];
}
 
// Method to save given data to a sheet
function getScores(){
  // Load the spreadsheet
  var ss = openSheet();
  var scoresPage = ss.getSheetByName("Scores");
  
  //Get the index for each team in the score page
  var teamIndexes = getTeamScoreIndexes();
  
  //Get the number of rounds
  var numRounds = scoresPage.getLastRow()-3;
  
  //Add the data
  var teamScores = {};
  for (let team in teamIndexes) {
    col = teamIndexes[team];
    
    //Get the round scores
    var roundScores = [];
    for (r = 1; r <= numRounds; r++) {
      roundScores.push({
        'dist':readCell(scoresPage, r+2, col),
        'score':readCell(scoresPage, r+2, col+1)
      });
    }
    
    //Get the total score
    var total = readCell(scoresPage, numRounds+3, col+1);
    
    //Add data to the team
    teamScores[team] = {
      'rounds':roundScores,
      'total':total
    };
  }
  
  return teamScores;
}