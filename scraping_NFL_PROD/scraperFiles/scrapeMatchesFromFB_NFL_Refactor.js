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

//Scrape matches from FOXBET public API//

var competitionId = 8707516; //this is NOT NBA! have to look up what NBA is when there is a fixture available
var FB_comp_URL = `https://sports.co.foxbet.com/sportsbook/v1/api/getCompetitionEvents?competitionId=${competitionId}&includeOutrights=false&channelId=17&locale=en-us&siteId=536870914`;

const grabRelevantMatchFields = (matchObject) => {
  let eventId = matchObject.id;
  let name = matchObject.name;
  let league = matchObject.compName;
  let startDate = new Date(matchObject.eventTime);
  let awayTeam = matchObject.participants.participant[1].name;
  let homeTeam = matchObject.participants.participant[0].name;

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
exports.scrapeFBMatches = async () => {
  return deleteOneSportsbookExtMatchesFromDB("FoxBet").then(() => {
    const FBMatches = scrapeData(FB_comp_URL)
      .then((output) => {
        //const events = output.eventGroup.events;

        const events = output.event;
        if (events) {
          //filter prematch only
          const filteredEvents = events.filter((o) => {
            return o.displayed && !o.isInplay && !o.outright; //avoids futures etc.
          });
          return filteredEvents;
        }
      })
      .then((data) => {
        console.log(data);
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
          return (
            //FoxBet uses [home vs. away] convention, not [away @ home]
            thisFBEvent.name.includes(o.awayTeam.name) &&
            thisFBEvent.name.includes(o.homeTeam.name)
          );
          //return o.name === thisFBEvent.name; // this may be inadequate. Possibly use team names and/or date.
        });

        if (matchFromDB[0]) {
          FBEventMapping[i]["matchId"] = matchFromDB[0]._id;
        } else {
          FBEventMapping[i]["matchId"] = "";
        }

        FBEventMapping[i]["sportsbook"] = "FoxBet";
      }

      FBEventMapping.map((FBEvent) => {
        //console.log(FBEvent)
        createExternalMatchInDB(FBEvent);
      });
    });
  });
};
