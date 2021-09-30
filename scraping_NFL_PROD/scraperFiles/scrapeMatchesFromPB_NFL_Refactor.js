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
var competitionId = 11444; //NFL
var URL_for_events = `${AU_URL_prefix}competitions/${competitionId}/events/featured?includeLive=true"`;

const scrapePointsBetMatches = (URL_for_events) => {
  let result = scrapeData(URL_for_events);

  const grabRelevantMatchFields = (matchObject) => {
    let { name, competitionName, startsAt, homeTeam, awayTeam } = matchObject;

    name = name.replace(/\./g, "");
    homeTeam = homeTeam.replace(/\./g, "");
    awayTeam = awayTeam.replace(/\./g, "");

    let subset = { name, competitionName, startsAt, homeTeam, awayTeam };
    return subset;
  };

  let final = result
    .then((output) => {
      //filter prematch only

      return output.events.filter((o) => {
        return !o.isLive && o.name.includes("@"); //name a bets
      });
    })
    .then((output) => {
      //select subset of keys

      return output.map((o) => {
        return grabRelevantMatchFields(o);
      });
    })
    .then((output) => {
      // update names of keys

      var resultArray = output.map(function (elm) {
        elm["league"] = elm["competitionName"];
        elm["date"] = new Date(elm["startsAt"]);
        delete elm["competitionName"];
        delete elm["startsAt"];
        return elm;
      });
      return resultArray;
    });

  return final;
};

////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
exports.scrapePBMatches = async () => {
  return deleteOldMatchesFromDB().then(() => {
    //Executes the steps//

    const teamsList = queryForAllTeams().then((teams) => {
      //console.log(teams);
      return teams;
    });

    const scrapedMatches = scrapePointsBetMatches(URL_for_events).then(
      (matches) => {
        //console.log(matches);
        return matches;
      }
    );

    const matchesAlreadyInDB = queryForAllMatches().then((matches) => {
      return matches;
    });

    return Promise.all([teamsList, scrapedMatches, matchesAlreadyInDB]).then(
      (values) => {
        let teamsList = values[0];
        let scrapedMatches = values[1];
        let matchesAlreadyInDB = values[2];

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

        if (Array.isArray(matchesToInsert)) {
          matchesToInsert.map((market) => {
            createMatchInDB(market);
          });
        } else {
          createMatchInDB(matchesToInsert);
        }
      }
    );
  });
};
