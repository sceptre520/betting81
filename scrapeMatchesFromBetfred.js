//https://sb-content.co.betfredsports.com/content-service/api/v1/q/event-list?started=false

const fetch = require("node-fetch");

////////////////////////////////////////////////////////////////////////////////

//Scrape matches from Betfred public API//

var competitionId = "NBA"; //not used in url but will filter on further down.
var FB_comp_URL =
  "https://sb-content.co.betfredsports.com/content-service/api/v1/q/event-list?started=false";

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

async function scrapeData(FB_comp_URL) {
  const options = {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 6.3; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/38.0.2125.111 Safari/537.36",
    },
  };

  const response = await fetch(FB_comp_URL, options);
  // waits until the request completes...
  const data = await response; //.json();
  return data;
}

const FBMatches = scrapeData(FB_comp_URL)
  .then((output) => {
    //const events = output.eventGroup.events;
    console.log(output);
    // const events = output.data.events;
    // if (events) {
    //   //filter prematch only
    //   const filteredEvents = events.filter((o) => {
    //     return (
    //       o.displayed &&
    //       o.active &&
    //       o.fixedOddsAvailable &&
    //       o.type.name === competitionId
    //     ); //avoids futures etc.
    //   });
    //   return filteredEvents;
    // }
  })
  .then((data) => {
    //console.log(data);
    // return data.map((o) => {
    //   return grabRelevantMatchFields(o);
    // });
  });

// ////////////////////////////////////////////////////////////////////////////////
// //Get matches from mongoDB//

// const APIurl = "http://localhost:8000/api";

// const queryForAllMatches = () => {
//   async function getAllMatchesInDB() {
//     return fetch(`${APIurl}/matches`).then((matches) => {
//       return matches.json();
//     });
//   }

//   let matchList = getAllMatchesInDB().then((output) => {
//     return output;
//   });

//   return matchList;
// };

// //Executes the steps//

// const matchList = queryForAllMatches().then((matches) => {
//   //console.log(teams);
//   return matches;
// });

// const MappedMatches = Promise.all([FBMatches, matchList]).then((values) => {
//   let FBMatches = values[0];
//   let matchList = values[1];

//   //Grab the matchId from my DB that corresponds to each DK EventID
//   var FBEventMapping = FBMatches;
//   for (let i = 0; i < FBEventMapping.length; i++) {
//     thisFBEvent = FBEventMapping[i];

//     let matchFromDB = matchList.filter((o) => {
//       return (
//         //FoxBet uses [home vs. away] convention, not [away @ home]
//         thisFBEvent.name.includes(o.awayTeam.name) &&
//         thisFBEvent.name.includes(o.homeTeam.name)
//       );
//       //return o.name === thisFBEvent.name; // this may be inadequate. Possibly use team names and/or date.
//     });

//     if (matchFromDB[0]) {
//       FBEventMapping[i]["matchId"] = matchFromDB[0]._id;
//     } else {
//       FBEventMapping[i]["matchId"] = "";
//     }

//     FBEventMapping[i]["sportsbook"] = "FoxBet";
//   }

//   FBEventMapping.map((FBEvent) => {
//     createExternalMatchInDB(FBEvent);
//   });
// });

// const createExternalMatchInDB = (match) => {
//   fetch(`${APIurl}/scraper/externalMatches/create`, {
//     method: "POST",
//     headers: {
//       "Content-Type": "application/json",
//     },
//     body: JSON.stringify(match),
//   }).then((response, err) => {
//     if (err) {
//       console.log(err);
//     } else {
//       console.log(response);
//     }
//   });
// };
