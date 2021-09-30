const fetch = require("node-fetch");

var {
  scrapeData,
  queryForAllMatches,
  createExternalMatchInDB,
  deleteOneSportsbookExtMatchesFromDB,
} = require("./helper/scraperFunctions.js");

// //Get matches from mongoDB//

const APIurl = "http://localhost:8000/api";

////////////////////////////////////////////////////////////////////////////////

//Scrape matches from Betfred public API//

var thisSport = "football";
var thisCompetition = "nfl";
var FB_comp_URL = `https://www.bovada.lv/services/sports/event/coupon/events/A/description/${thisSport}/${thisCompetition}?marketFilterId=def&preMatchOnly=true&lang=en`;

const grabRelevantMatchFields = (matchObject) => {
  let eventId = matchObject.link;
  let name = matchObject.description;
  let league = thisCompetition.toUpperCase();
  let startDate = new Date(matchObject.startTime);
  let awayTeam = matchObject.competitors[1].name;
  let homeTeam = matchObject.competitors[0].name;

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

// ////////////////////////////////////////////////////////////////////////////////

exports.scrapeBovadaMatches = async () => {
  return deleteOneSportsbookExtMatchesFromDB("Bovada").then(() => {
    const FBMatches = scrapeData(FB_comp_URL)
      .then((output) => {
        //const events = output.eventGroup.events;

        const events = output[0].events;

        //console.log(events);
        if (events) {
          //filter prematch only
          const filteredEvents = events.filter((o) => {
            return o.type === "GAMEEVENT" && !o.live;
          });
          //console.log(filteredEvents);
          return filteredEvents;
        }
      })
      .then((data) => {
        return data.map((o) => {
          return grabRelevantMatchFields(o);
        });
      });

    //Executes the steps//

    const matchList = queryForAllMatches().then((matches) => {
      //console.log(teams);
      return matches;
    });

    return Promise.all([FBMatches, matchList]).then((values) => {
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

        FBEventMapping[i]["sportsbook"] = "Bovada";
      }

      FBEventMapping.map((FBEvent) => {
        //console.log(FBEvent);
        createExternalMatchInDB(FBEvent);
      });
    });
  });
};
