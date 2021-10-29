const fetch = require("node-fetch");

var {
  scrapeData,
  queryForAllMatches,
  createExternalMatchInDB,
  deleteOneSportsbookExtMatchesFromDB,
} = require("./helper/scraperFunctions.js");

//Get matches from mongoDB//

const APIurl = "http://localhost:8000/api";

//Scrape matches from DraftKings public API//
var sportId = "basketball";
var competitionId = "nba";
var DK_comp_URL = `https://eu-offering.kambicdn.org/offering/v2018/rsiusco/listView/${sportId}/${competitionId}.json?market=US&market=US&includeParticipants=true&useCombined=true&lang=en_US`;

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

////////////////////////////////////////////////////////////////////////////////

exports.scrapeRiversMatches = async () => {
  // const a = await deleteOneSportsbookExtMatchesFromDB("Rivers");
  const b = await scrapeData(DK_comp_URL);
  const events = b.events;

  if (events) {
    //filter prematch only
    const eventSection = events.map((o) => {
      return o.event;
    });

    const DKMatches = eventSection
      .filter((o) => {
        return o.state === "NOT_STARTED" && o.name.includes("@"); //avoids futures etc.
      })
      .map((o) => {
        //console.log(o)
        return grabRelevantMatchFields(o);
      });

    ////////////////////////////////////////////////////////////////////////////////

    //Executes the steps//

    const matchList = await queryForAllMatches();

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

      DKEventMapping[i]["sportsbook"] = "Rivers";
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

    const Z = await mapLoop(DKEventMapping);

    return Z;
  }
};
