const fetch = require("node-fetch");

var {
  scrapeData,
  queryForAllMatches,
  createExternalMatchInDB,
} = require("./helper/scraperFunctions.js");

////////////////////////////////////////////////////////////////////////////////

//Scrape matches from William Hill public API//

var sport_name = "icehockey";
var WH_sport_URL = `https://www.williamhill.com/us/co/bet/api/v2/sports/${sport_name}/events/schedule`;

const grabRelevantMatchFields = (matchObject) => {
  let eventId = matchObject.id;
  let name = matchObject.name.replace(/\|/g, "");
  let league = matchObject.competitionName;
  let startDate = new Date(matchObject.startTime);

  let awayTeam;
  let homeTeam;

  if (name.includes(" at ")) {
    awayTeam = name.split(" at ")[0];
    homeTeam = name.split(" at ")[1];
  } else if (name.includes(" vs ")) {
    awayTeam = name.split(" vs ")[1];
    homeTeam = name.split(" vs ")[0];
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

const WHMatches = scrapeData(WH_sport_URL)
  .then((output) => {
    //const events = output.eventGroup.events;

    const events = output.competitions.filter((o) => {
      return o.name === "NHL";
    })[0];

    //filter prematch only and not futures etc.
    const filteredEvents = events.events.filter((o) => {
      return o.display && o.active && !o.started && o.type === "MATCH";
    });

    return filteredEvents;
  })
  .then((data) => {
    console.log(data);
    return data.map((o) => {
      return grabRelevantMatchFields(o);
    });
  });

// ////////////////////////////////////////////////////////////////////////////////
// //Get matches from mongoDB//

const APIurl = "http://localhost:8000/api";

// //Executes the steps//

const matchList = queryForAllMatches().then((matches) => {
  //console.log(teams);
  return matches;
});

const MappedMatches = Promise.all([WHMatches, matchList]).then((values) => {
  let WHMatches = values[0];
  let matchList = values[1];

  //Grab the matchId from my DB that corresponds to each DK EventID
  var WHEventMapping = WHMatches;
  for (let i = 0; i < WHEventMapping.length; i++) {
    thisWHEvent = WHEventMapping[i];

    let matchFromDB = matchList.filter((o) => {
      return o.name === thisWHEvent.name.replace(" at ", " @ "); // WH does [away at home], not like PB's [away @ home].
    });

    if (matchFromDB[0]) {
      WHEventMapping[i]["matchId"] = matchFromDB[0]._id;
    } else {
      WHEventMapping[i]["matchId"] = "";
    }

    WHEventMapping[i]["sportsbook"] = "William Hill";
  }
  WHEventMapping.map((WHEvent) => {
    createExternalMatchInDB(WHEvent);
  });
});
