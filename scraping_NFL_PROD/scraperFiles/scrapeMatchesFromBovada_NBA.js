const { resolveInclude } = require("ejs");
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

var thisSport = "basketball";
var thisCompetition = "nba";
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
  //  const a = await deleteOneSportsbookExtMatchesFromDB("Bovada");

  const b = await scrapeData(FB_comp_URL);

  const events = b[0].events;

  //filter prematch only
  const filteredEvents = events.filter((o) => {
    return o.type === "GAMEEVENT" && !o.live;
  });
  //console.log(filteredEvents);
  const FBMatches = filteredEvents.map((o) => {
    return grabRelevantMatchFields(o);
  });

  // console.log(FBMatches);
  //Executes the steps//

  const matchList = await queryForAllMatches();

  //   //Grab the matchId from my DB that corresponds to each DK EventID
  var FBEventMapping = await FBMatches;

  const thisFunct = (FBEventMapping, matchList) => {
    var FBEventMapping2 = FBEventMapping;
    let thisFBEvent;
    for (let i = 0; i < FBEventMapping.length; i++) {
      thisFBEvent = FBEventMapping2[i];

      let matchFromDB = matchList.filter((o) => {
        return o.name === thisFBEvent.name;
      });

      if (matchFromDB[0]) {
        FBEventMapping2[i]["matchId"] = matchFromDB[0]._id;
      } else {
        FBEventMapping2[i]["matchId"] = "";
      }

      FBEventMapping2[i]["sportsbook"] = "Bovada";
    }
    return FBEventMapping2;
  };

  var FBEventMapping2 = await thisFunct(FBEventMapping, matchList);

  const mapLoop = async () => {
    //console.log("Start");

    const promises = FBEventMapping2.map(async (thisFBEvent) => {
      //const numFruit = await sleep(thisFBEvent);
      const numFruit = await createExternalMatchInDB(thisFBEvent);
      return numFruit;
    });

    const numFruits = await Promise.all(promises);
    //console.log(numFruits);

    //console.log("End");
  };

  const Z = await mapLoop();
  // const thisFunct2 = async (FBEventMapping2) => {
  //   //let something = [];
  //   //let thisFBEvent;
  //   for (let i = 0; i < FBEventMapping2.length; i++) {
  //     const thisFBEvent = FBEventMapping2[i];

  //     const hello = await createExternalMatchInDB(thisFBEvent);
  //     await hello;
  //     console.log(hello);
  //   }
  //   //return something;
  // };

  // // myFunct2 = async (FBEventMapping2) => {
  // //   await FBEventMapping2.map(async (FBEvent) => {
  // //     //     //console.log(FBEvent);
  // //     await createExternalMatchInDB(FBEvent);
  // //   });
  // // };
  // return thisFunct2(FBEventMapping2);
  // var X = await ;

  return Z;
};
