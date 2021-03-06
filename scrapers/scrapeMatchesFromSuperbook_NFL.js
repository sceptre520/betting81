const fetch = require("node-fetch");

var {
  scrapeData,
  queryForAllMatches,
  createExternalMatchInDB,
  deleteOneSportsbookExtMatchesFromDB,
} = require("./helper/scraperFunctions.js");

deleteOneSportsbookExtMatchesFromDB("Superbook");

////////////////////////////////////////////////////////////////////////////////

//Scrape matches from Betfred public API//

var competitionId = "52455.1"; //not used in url but will filter on further down.
var FB_comp_URL = `https://co.superbook.com/cache/psmg/UK/${competitionId}.json`;

const grabRelevantMatchFields = (matchObject) => {
  let eventId = matchObject.idfoevent;
  let name = matchObject.eventname;
  let league = matchObject.sportname;
  let startDate = new Date(matchObject.tsstart);
  let awayTeam = matchObject.participantname_away;
  let homeTeam = matchObject.participantname_home;

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

const FBMatches = scrapeData(FB_comp_URL)
  .then((output) => {
    //const events = output.eventGroup.events;

    const events = output.events;

    if (events) {
      //filter prematch only
      const filteredEvents = events.filter((o) => {
        return o.ismatch && o.istradable && o.noofmarkets && !o.israce;
      });
      return filteredEvents;
    }
  })
  .then((data) => {
    return data.map((o) => {
      return grabRelevantMatchFields(o);
    });
  });

// ////////////////////////////////////////////////////////////////////////////////
// //Get matches from mongoDB//

const APIurl = "http://localhost:8000/api";

//Executes the steps//

const matchList = queryForAllMatches().then((matches) => {
  //console.log(teams);
  return matches;
});

const MappedMatches = Promise.all([FBMatches, matchList]).then((values) => {
  let FBMatches = values[0];
  let matchList = values[1];

  //Grab the matchId from my DB that corresponds to each DK EventID
  var FBEventMapping = FBMatches;
  for (let i = 0; i < FBEventMapping.length; i++) {
    thisFBEvent = FBEventMapping[i];

    let matchFromDB = matchList.filter((o) => {
      return o.name === thisFBEvent.name;
    });

    if (matchFromDB[0]) {
      FBEventMapping[i]["matchId"] = matchFromDB[0]._id;
    } else {
      FBEventMapping[i]["matchId"] = "";
    }

    FBEventMapping[i]["sportsbook"] = "Superbook";
  }

  FBEventMapping.map((FBEvent) => {
    //console.log(FBEvent)
    createExternalMatchInDB(FBEvent);
  });
});
