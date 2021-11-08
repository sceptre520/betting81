//Make sure backend server is running....

var {
  createMatchInDB,
  queryForAllTeams,
  scrapeData,
  deleteOldMatchesFromDB,
  queryForAllMatches,
} = require("./helper/scraperFunctions.js");

const fetch = require("node-fetch");

APIurl = "http://localhost:8000/api";

//Scrape matches from PointsBet public API//

var AU_URL_prefix = "http://api.pointsbet.com/api/v2/";
var competitionId = 7208; //NHL
var URL_for_events = `${AU_URL_prefix}competitions/${competitionId}/events/featured?includeLive=true"`;

const grabRelevantMatchFields = (matchObject) => {
  let { name, competitionName, startsAt, homeTeam, awayTeam } = matchObject;

  name = name.replace(/\./g, "");
  homeTeam = homeTeam.replace(/\./g, "");
  awayTeam = awayTeam.replace(/\./g, "");

  let subset = { name, competitionName, startsAt, homeTeam, awayTeam };
  return subset;
};

////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
exports.scrapePBMatches = async () => {
  const a = await deleteOldMatchesFromDB();

  const teamsList = await queryForAllTeams();

  const scrapedMatches2 = await scrapeData(URL_for_events);

  let scrapedMatches = scrapedMatches2.events
    .filter((o) => {
      return !o.isLive && o.name.includes("@"); //name a bets
    })
    .map((o) => {
      return grabRelevantMatchFields(o);
    })
    .map(function (elm) {
      elm["league"] = elm["competitionName"];
      elm["date"] = new Date(elm["startsAt"]);
      delete elm["competitionName"];
      delete elm["startsAt"];
      return elm;
    });

  const matchesAlreadyInDB = await queryForAllMatches();

  //Get home teams
  const homeTeams = scrapedMatches.map((match) => {
    let homeString = match.homeTeam;
    let homeId = teamsList.filter((team) => team.name === homeString);
    if (homeId.length === 0) {
      return "Missing";
    } else {
      return homeId[0]._id;
    }
  });

  //Get away teams
  const awayTeams = scrapedMatches.map((match) => {
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
    scrapedMatches[index].homeTeam = element;
  });

  awayTeams.map((element, index) => {
    scrapedMatches[index].awayTeam = element;
  });

  const matchesToInsert = scrapedMatches.filter((o) => {
    const PBeventsAlreadyInDB = matchesAlreadyInDB.map((pb) => {
      return pb.name;
    });
    return !PBeventsAlreadyInDB.includes(o.name);
  });

  //console.log(matchesToInsert);
  const mapLoop = async () => {
    console.log("Start");

    const promises = matchesToInsert.map(async (match) => {
      //const numFruit = await sleep(thisFBEvent);
      const numFruit = await createMatchInDB(match);
      return numFruit;
    });

    const numFruits = await Promise.all(promises);
    console.log(numFruits);

    console.log("End");
  };

  const Z = await mapLoop();

  return Z;
};
