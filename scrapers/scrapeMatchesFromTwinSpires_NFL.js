const fetch = require("node-fetch");

var {
  scrapeData,
  queryForAllMatches,
  createExternalMatchInDB,
  deleteOneSportsbookExtMatchesFromDB,
} = require("./helper/scraperFunctions.js");

deleteOneSportsbookExtMatchesFromDB("TwinSpires");

////////////////////////////////////////////////////////////////////////////////

//Scrape matches from DraftKings public API//
var sportId = "american_football";
var competitionId = "nfl";
var DK_comp_URL = `https://eu-offering.kambicdn.org/offering/v2018/winusco/listView/${sportId}/${competitionId}.json?lang=en_US&market=US-CO`;

const grabRelevantMatchFields = (matchObject) => {
  let eventId = matchObject.id;
  let name = matchObject.englishName;
  let league = matchObject.group;
  let startDate = new Date(matchObject.start);

  let awayTeam;
  let homeTeam;

  if (name.includes(" @ ")) {
    awayTeam = name.split(" @ ")[0];
    homeTeam = name.split(" @ ")[1];
  } else if (name.includes(" - ")) {
    awayTeam = name.split(" - ")[1];
    homeTeam = name.split(" - ")[0];

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

    if (events) {
      //filter prematch only
      const eventSection = events.map((o) => {
        return o.event;
      });
      //console.log(eventSection)

      return eventSection.filter((o) => {
        return o.state === "NOT_STARTED" && o.name.includes("@"); //avoids futures etc.
      });
    }
  })
  .then((data) => {
    return data.map((o) => {
      //console.log(o)
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

    DKEventMapping[i]["sportsbook"] = "TwinSpires";
  }

  DKEventMapping.map((DKEvent) => {
    //console.log(DKEvent)
    createExternalMatchInDB(DKEvent);
  });
});
