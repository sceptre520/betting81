const fetch = require("node-fetch");

var {
  scrapeData,
  queryForAllMatches,
  createMatchInDB,
  queryForAllTeams,
  deleteOldMatchesFromDB,
} = require("./helper/scraperFunctions.js");

// ////////////////////////////////////////////////////////////////////////////////
// //Get matches from mongoDB//

const APIurl = "http://localhost:8000/api";

//Scrape matches from William Hill public API//

const grabRelevantMatchFields = (matchObject) => {
  let eventId = matchObject.id;
  let name = matchObject.name.replace(/\|/g, "");
  let league = matchObject.competitionName;
  let date = new Date(matchObject.startTime);

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

  name = awayTeam + " @ " + homeTeam;

  let subset = {
    //eventId,
    name,
    league,
    date,
    awayTeam,
    homeTeam,
  };

  return subset;
};

const sports = ["americanfootball", "basketball", "icehockey"];

////////////////////////////////////////////////////////////////////////////////
exports.scrapeWHMatches = async () => {
  const a = await deleteOldMatchesFromDB();
  const teamsList = await queryForAllTeams();

  sports.forEach(async (sport_name) => {
    var WH_sport_URL = `https://www.williamhill.com/us/co/bet/api/v2/sports/${sport_name}/events/schedule`;

    const b = await scrapeData(WH_sport_URL);

    const events = b.competitions.filter((o) => {
      return o.name === "NFL" || o.name === "NBA" || o.name === "NHL";
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

      const matchesAlreadyInDB = await queryForAllMatches();

      //Get home teams
      const homeTeams = WHMatches.map((match) => {
        let homeString = match.homeTeam;
        let homeId = teamsList.filter((team) => team.name === homeString);
        if (homeId.length === 0) {
          return "Missing";
        } else {
          return homeId[0]._id;
        }
      });

      //Get away teams
      const awayTeams = WHMatches.map((match) => {
        let awayString = match.awayTeam;
        let awayId = teamsList.filter((team) => team.name === awayString);
        //console.log(awayId);
        if (awayId.length === 0) {
          return "Missing";
        } else {
          return awayId[0]._id;
        }
      });

      homeTeams.map((element, index) => {
        WHMatches[index].homeTeam = element;
      });

      awayTeams.map((element, index) => {
        WHMatches[index].awayTeam = element;
      });

      const matchesToInsert = WHMatches.filter((o) => {
        const PBeventsAlreadyInDB = matchesAlreadyInDB.map((pb) => {
          return pb.name;
        });
        return !PBeventsAlreadyInDB.includes(o.name);
      });

      //console.log(matchesToInsert);
      const mapLoop = async (matchesToInsert) => {
        // console.log("Start");

        const promises = matchesToInsert.map(async (match) => {
          //const numFruit = await sleep(thisFBEvent);
          const numFruit = await createMatchInDB(match);
          return numFruit;
        });

        const numFruits = await Promise.all(promises);
        console.log(numFruits);

        // console.log("End");
      };

      const Z = await mapLoop(matchesToInsert);

      return Z;
    }
  });
};
