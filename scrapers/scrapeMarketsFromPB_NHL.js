//Make sure backend server is running....

var {
  queryForAllMatches,
  deleteMarketsFromDB,
  scrapeData,
  writeMarketsToDB,
} = require("./helper/scraperFunctions.js");

const fetch = require("node-fetch");
const { isArray } = require("util");

APIurl = "http://localhost:8000/api";

///////////////////////DELETE EXISTING MATCHES//////////////////////////////////
//Get teams from mongoDB//

deleteMarketsFromDB();

////////////////////////////////////////////////////////////////////////////////

//Scrape matches from PointsBet public API//

var AU_URL_prefix = "http://api.pointsbet.com/api/v2/";
var competitionId = 7208; //NHL
var URL_for_events = `${AU_URL_prefix}competitions/${competitionId}/events/featured?includeLive=true"`;

const getPointsBetEventIDs = (URL_for_events) => {
  let result = scrapeData(URL_for_events);

  const grabRelevantMatchFields = (matchObject) => {
    let { key, name } = matchObject;
    let subset = { key, name };
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
    });

  return final;
};

////////////////////////////////////////////////////////////////////////////////

//Scrape odds from PointsBet public API//
const getPointsBetOdds = (URL_for_odds) => {
  let result = scrapeData(URL_for_odds);

  let final = result.then((output) => {
    //filter prematch only
    return output;
  });

  return final;
};

////////////////////////////////////////////////////////////////////////////////

//Executes the steps//

const matchList = queryForAllMatches().then((matches) => {
  //console.log(teams);
  return matches;
});

const scrapedEventIDs = getPointsBetEventIDs(URL_for_events).then((matches) => {
  //console.log(matches);
  return matches;
});

////////////////////////////////////////////////////////////////////////////////

//Merge PB EventIDs and MatchIds from the DB//

const PBEventMapping = Promise.all([matchList, scrapedEventIDs]).then(
  (values) => {
    let matchList = values[0];
    let scrapedEventIDs = values[1];

    //Grab the matchId from my DB that corresponds to each PB EventID
    var PBEventMapping = scrapedEventIDs;
    for (let i = 0; i < PBEventMapping.length; i++) {
      thisPBEvent = PBEventMapping[i];
      //console.log(matchList);
      let matchFromDB = matchList.filter((o) => {
        return (
          o.name.replace(/\./g, "") === thisPBEvent.name.replace(/\./g, "")
        );
      });

      if (matchFromDB[0]) {
        PBEventMapping[i]["matchId"] = matchFromDB[0]._id;
      } else {
        PBEventMapping[i]["matchId"] = "";
      }
    }

    return PBEventMapping;
  }
);

////////////////////////////////////////////////////////////////////////////////

//Pull out markets from PB API one event at a time, and write to DB//

Promise.resolve(PBEventMapping).then((PBEventMapping) => {
  PBEventMapping.forEach((PBEvent) => {
    var eventID = PBEvent.key;

    var URL_for_odds = `${AU_URL_prefix}events/${eventID}`;

    //Promise API call
    const scrapedOdds = getPointsBetOdds(URL_for_odds).then((data) => {
      return data;
    });

    const UniqueEventClasses = Promise.resolve(scrapedOdds).then(
      (scrapedOdds) => {
        scrapedOdds = scrapedOdds.fixedOddsMarkets;

        let allPointsMarkets = scrapedOdds.filter((o) => {
          return (
            o.eventClass === "First Goal Scorer" ||
            o.eventClass === "Anytime Goal Scorer" ||
            (o.groupName === "Player Assist Markets" &&
              o.eventClass.includes(" Assists Over/Under")) ||
            (o.groupName === "Player Points Markets" &&
              o.eventClass.includes(" Points Over/Under"))
          );
        });

        uniqueArray = [];

        allPointsMarkets.forEach((market) => {
          if (!uniqueArray.includes(market.eventClass)) {
            uniqueArray.push(market.eventClass);
          }
        });

        return uniqueArray;
      }
    );

    Promise.all([scrapedOdds, UniqueEventClasses, PBEvent]).then((data) => {
      let scrapedOdds = data[0].fixedOddsMarkets;
      let UniqueEventClasses = data[1];
      let PBEvent = data[2];

      if (UniqueEventClasses.length) {
        let Mydata = UniqueEventClasses.map((eventClass) => {
          let thisPointsMarkets = scrapedOdds.filter((o) => {
            return o.eventClass === eventClass;
          });

          let marketType;
          if (eventClass === "First Goal Scorer") {
            marketType = "First Goal";
          } else if (eventClass === "Anytime Goal Scorer") {
            marketType = "Goals";
          } else if (eventClass.includes("Assists")) {
            marketType = "Assists";
          } else if (eventClass.includes("Points")) {
            marketType = "Points";
          } else {
            marketType = "Fuck knows";
          }
          GiannisMarket = thisPointsMarkets[0].outcomes;

          if (GiannisMarket) {
            const GiannisSelections = GiannisMarket.map((outcome) => {
              let selectionName = outcome.name;

              let player = selectionName.split(" Under")[0].split(" Over")[0];

              let handicap;
              let handicapSection;
              if (marketType === "Goals") {
                handicap = 0.5;
              } else if (marketType === "First Goal") {
                handicap = 0;
              } else {
                handicapSection = selectionName.replace(player, ""); //guys names have initials, and so the . fucks things up
                handicap = Number(handicapSection.replace(/[^0-9\.]+/g, ""));
              }

              let OU;
              if (selectionName.includes("Over") || marketType === "Goals") {
                OU = "Over";
              } else if (selectionName.includes("Under")) {
                OU = "Under";
              } else {
                OU = "";
              }
              let overPrice = OU === "Under" ? 0 : outcome.price; //if neither over nor under, put price in over column anyway
              let underPrice = OU === "Under" ? outcome.price : 0;

              //let marketType = "Points";
              let sportsbook = "PointsBet";

              let matchId = PBEvent.matchId;

              let selectionInfo = {
                player,
                marketType,
                sportsbook,
                overPrice,
                underPrice,
                handicap,
                matchId,
              };

              return selectionInfo;
            });

            let marketOutput;
            if (marketType === "First Goal" || marketType === "Goals") {
              marketOutput = GiannisSelections;
            } else {
              marketOutput = GiannisSelections[0];
              if (marketOutput.overPrice === 0) {
                marketOutput.overPrice = GiannisSelections[1].overPrice;
              }
              if (!marketOutput.underPrice === 0) {
                marketOutput.underPrice = GiannisSelections[1].underPrice;
              }
            }

            //console.log(marketOutput);

            writeMarketsToDB(marketOutput);
          }
        });
      }
    });
  });
});
