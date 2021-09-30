const fetch = require("node-fetch");

var {
  scrapeData,
  queryForAllMatches,
  queryForAllTeams,
  createExternalMatchInDB,
  deleteOneSportsbookExtMatchesFromDB,
} = require("./helper/scraperFunctions.js");

//Scrape matches from DraftKings public API//

var competitionId = 88670561;
var DK_comp_URL = `https://sportsbook-us-co.draftkings.com//sites/US-CO-SB/api/v4/eventgroups/${competitionId}?includePromotions=true&format=json`;

//Get matches from mongoDB//

const APIurl = "http://localhost:8000/api";

////////////////////////////////////////////////////////////////////////////////

const grabRelevantMatchFields = (matchObject) => {
  let { eventId, name, eventGroupName, startDate, teamName2, teamName1 } =
    matchObject;
  let subset = {
    eventId,
    name,
    eventGroupName,
    startDate,
    teamName2,
    teamName1,
  };
  return subset;
};

////////////////////////////////////////////////////////////////////////////////
exports.scrapeDKMatches = async () => {
  return deleteOneSportsbookExtMatchesFromDB("DraftKings").then(() => {
    //Executes the steps//

    const DKMatches = scrapeData(DK_comp_URL)
      .then((output) => {
        const events = output.eventGroup.events;
        //console.log(events);
        //filter prematch only
        return events.filter((o) => {
          return o.eventStatus.state === "NOT_STARTED" && o.name.includes("@"); //avoids futures etc.
        });
      })
      .then((data) => {
        return data.map((o) => {
          return grabRelevantMatchFields(o);
        });
      })
      .then((data) => {
        var myArray = data.map((elm) => {
          elm["league"] = elm["eventGroupName"];
          elm["homeTeam"] = elm["teamName2"];
          elm["awayTeam"] = elm["teamName1"];
          elm["date"] = new Date(elm["startDate"]);
          delete elm["eventGroupName"];
          delete elm["startDate"];
          delete elm["teamName2"];
          delete elm["teamName1"];
          return elm;
        });
        //console.log(myArray)
        return myArray;
      });

    const matchList = queryForAllMatches().then((matches) => {
      //console.log(teams);
      return matches;
    });

    const teamList = queryForAllTeams().then((teams) => {
      //console.log(teams);
      return teams;
    });

    return Promise.all([DKMatches, matchList, teamList]).then((values) => {
      let DKMatches = values[0];
      let matchList = values[1];
      let teamList = values[2];

      //console.log(teamList)

      //Grab the matchId from my DB that corresponds to each DK EventID
      var DKEventMapping = DKMatches;
      for (let i = 0; i < DKEventMapping.length; i++) {
        thisDKEvent = DKEventMapping[i];

        let Homesplits = thisDKEvent.homeTeam.split(" ", 2);

        let HomeTeamFromDB = teamList.filter((o) => {
          return (o.abbrev === Homesplits[0]) & o.name.includes(Homesplits[1]);
        });

        let Awaysplits = thisDKEvent.awayTeam.split(" ", 2);

        let AwayTeamFromDB = teamList.filter((o) => {
          return (o.abbrev === Awaysplits[0]) & o.name.includes(Awaysplits[1]);
        });

        //console.log(HomeTeamFromDB)
        //console.log(AwayTeamFromDB)

        if (AwayTeamFromDB.length & HomeTeamFromDB.length) {
          let matchFromDB = matchList.filter((o) => {
            return (
              o.name === AwayTeamFromDB[0].name + " @ " + HomeTeamFromDB[0].name
            );
          });
          //console.log(matchFromDB)

          if (matchFromDB.length) {
            DKEventMapping[i]["matchId"] = matchFromDB[0]._id;
            DKEventMapping[i]["name"] = matchFromDB[0].name;
            DKEventMapping[i]["homeTeam"] = matchFromDB[0].homeTeam.name;
            DKEventMapping[i]["awayTeam"] = matchFromDB[0].awayTeam.name;
          } else {
            DKEventMapping[i]["matchId"] = "";
          }
        } else {
          DKEventMapping[i]["matchId"] = "";
        }

        DKEventMapping[i]["sportsbook"] = "DraftKings";
      }

      DKEventMapping.map((DKEvent) => {
        createExternalMatchInDB(DKEvent);
      });
    });
  });
};
