const fetch = require("node-fetch");

var {
  scrapeData,
  queryForAllMatches,
  createExternalMatchInDB,
  deleteOneSportsbookExtMatchesFromDB,
} = require("./helper/scraperFunctions.js");

// ////////////////////////////////////////////////////////////////////////////////
// //Get matches from mongoDB//

const APIurl = "http://localhost:8000/api";

//Scrape matches from William Hill public API//

var sport_name = "americanfootball";
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

////////////////////////////////////////////////////////////////////////////////
exports.scrapeWHMatches = async () => {
  const a = await deleteOneSportsbookExtMatchesFromDB("William Hill");
  const b = await scrapeData(WH_sport_URL);
  const events = b.competitions.filter((o) => {
    return o.name === "NFL";
  })[0];
  if (events) {
    //filter prematch only and not futures etc.
    const filteredEvents = events.events.filter((o) => {
      return o.display && o.active && !o.started && o.type === "MATCH";
    });

    const WHMatches = filteredEvents.map((o) => {
      return grabRelevantMatchFields(o);
    });

    // //Executes the steps//

    const matchList = await queryForAllMatches();

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

    const mapLoop = async (DKEventMapping) => {
      // console.log("Start");

      const promises = DKEventMapping.map(async (DKEvent) => {
        //const numFruit = await sleep(thisFBEvent);
        const numFruit = await createExternalMatchInDB(DKEvent);
        return numFruit;
      });

      const numFruits = await Promise.all(promises);
      // console.log(numFruits);

      // console.log("End");
    };

    const Z = await mapLoop(WHEventMapping);

    return Z;
  }
};
