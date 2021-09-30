const fetch = require("node-fetch");

var {
  scrapeData,
  queryForAllMatches,
  createExternalMatchInDB,
  deleteOneSportsbookExtMatchesFromDB,
} = require("./helper/scraperFunctions.js");

deleteOneSportsbookExtMatchesFromDB("MaximBet");

////////////////////////////////////////////////////////////////////////////////

//Scrape matches from DraftKings public API//
var competitionId = "1010";
var DK_comp_URL = `https://co.maximbet.com/api/events/search?market.display=true&market.main=yes&page=1&perPage=1000&state=open&competition=${competitionId}`;

const grabRelevantMatchFields = (matchObject) => {
  let eventId = matchObject.id;
  let name = matchObject.name;
  let league = "NFL";
  let startDate = new Date(matchObject.timeSettings.startTime);

  let awayTeam;
  let homeTeam;

  if (name.includes(" @ ")) {
    awayTeam = name.split(" @ ")[0];
    homeTeam = name.split(" @ ")[1];
  } else if (name.includes(" vs ")) {
    awayTeam = name.split(" vs ")[1];
    homeTeam = name.split(" vs ")[0];

    name = awayTeam + " @ " + homeTeam;
  } else {
    awayTeam = "Unknown";
    homeTeam = "Unknown";
  }

  let subset = {
    eventId,
    name,
    league,
    startDate,
    awayTeam,
    homeTeam,
  };

  return subset;
};

const DKMatches = scrapeData(DK_comp_URL)
  .then((output) => {
    const events = output.events;
    //console.log(events);
    if (events) {
      return events.filter((o) => {
        return (
          o.active &&
          o.timeSettings.timeline === "Prematch" &&
          o.eventType === "two-participants-event"
        ); //avoids futures etc.
      });
    }
  })
  .then((data) => {
    return data.map((o) => {
      //console.log(o);
      return grabRelevantMatchFields(o);
    });
  });

////////////////////////////////////////////////////////////////////////////////
//Get matches from mongoDB//

const APIurl = "http://localhost:8000/api";

//Executes the steps//

const matchList = queryForAllMatches().then((matches) => {
  //console.log(teams);
  return matches;
});

const MappedMatches = Promise.all([DKMatches, matchList]).then((values) => {
  let DKMatches = values[0];
  let matchList = values[1];

  //Grab the matchId from my DB that corresponds to each DK EventID
  var DKEventMapping = DKMatches;
  for (let i = 0; i < DKEventMapping.length; i++) {
    thisDKEvent = DKEventMapping[i];
    //console.log(matchList);
    let matchFromDB = matchList.filter((o) => {
      return o.name === thisDKEvent.name;
    });

    if (matchFromDB[0]) {
      DKEventMapping[i]["matchId"] = matchFromDB[0]._id;
    } else {
      DKEventMapping[i]["matchId"] = "";
    }

    DKEventMapping[i]["sportsbook"] = "MaximBet";
  }

  DKEventMapping.map((DKEvent) => {
    //console.log(DKEvent);
    createExternalMatchInDB(DKEvent);
  });
});
