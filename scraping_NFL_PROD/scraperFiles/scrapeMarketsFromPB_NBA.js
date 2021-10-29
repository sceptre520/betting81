//Make sure backend server is running....

var {
  queryForAllMatches,
  deleteMarketsFromDB,
  scrapeData,
  writeMarketsToDB,
  deleteOneSportsbookMarketsFromDB,
} = require("./helper/scraperFunctions.js");

const fetch = require("node-fetch");
const { isArray } = require("util");

APIurl = "http://localhost:8000/api";
////////////////////////////////////////////////////////////////////////////////

//Scrape matches from PointsBet public API//

var AU_URL_prefix = "http://api.pointsbet.com/api/v2/";
var competitionId = 7176; //NBA
var URL_for_events = `${AU_URL_prefix}competitions/${competitionId}/events/featured?includeLive=true"`;

const grabRelevantMatchFields = (matchObject) => {
  let { key, name } = matchObject;
  let subset = { key, name };
  return subset;
};

exports.scrapePBMarkets = async () => {
  ///////////////////////DELETE EXISTING MATCHES//////////////////////////////////
  //Get teams from mongoDB//

  // const a = await deleteOneSportsbookMarketsFromDB("PointsBet");

  ////////////////////////////////////////////////////////////////////////////////

  //Executes the steps//

  const matchList = await queryForAllMatches();

  const result = await scrapeData(URL_for_events);

  const scrapedEventIDs = result.events
    .filter((o) => {
      return !o.isLive && o.name.includes("@"); //name a bets
    })
    .map((o) => {
      return grabRelevantMatchFields(o);
    });

  ////////////////////////////////////////////////////////////////////////////////

  //Merge PB EventIDs and MatchIds from the DB//

  //Grab the matchId from my DB that corresponds to each PB EventID
  var PBEventMapping = scrapedEventIDs;
  for (let i = 0; i < PBEventMapping.length; i++) {
    thisPBEvent = PBEventMapping[i];
    //console.log(matchList);
    let matchFromDB = matchList.filter((o) => {
      return o.name.replace(/\./g, "") === thisPBEvent.name.replace(/\./g, "");
    });

    if (matchFromDB[0]) {
      PBEventMapping[i]["matchId"] = matchFromDB[0]._id;
    } else {
      PBEventMapping[i]["matchId"] = "";
    }
  }

  ////////////////////////////////////////////////////////////////////////////////

  //Pull out markets from PB API one event at a time, and write to DB//

  for (let i = 0; i < PBEventMapping.length; i++) {
    var PBEvent = PBEventMapping[i];

    var eventID = PBEvent.key;

    var URL_for_odds = `${AU_URL_prefix}events/${eventID}`;

    //Promise API call
    let scrapedOdds = await scrapeData(URL_for_odds);
    scrapedOdds = scrapedOdds.fixedOddsMarkets;
    //console.log(scrapedOdds);
    if (scrapedOdds) {
      const UniqueEventClasses = workThroughUniqueEventClasses(scrapedOdds);

      if (UniqueEventClasses) {
        //console.log(UniqueEventClasses);
        await InnerLoop(UniqueEventClasses, scrapedOdds, PBEvent);
      }
    }
  }
};

const workThroughUniqueEventClasses = (scrapedOdds) => {
  let allPointsMarkets = scrapedOdds.filter((o) => {
    return (
      (((o.groupName === "Player Points Markets" &&
        o.eventClass.endsWith(" Points Over/Under")) ||
        (o.groupName === "Player Assists Markets" &&
          o.eventClass.endsWith(" Assists Over/Under")) ||
        (o.groupName === "Player Rebounds Markets" &&
          o.eventClass.endsWith(" Rebounds Over/Under")) ||
        (o.groupName === "Player Three Pointer Markets" &&
          o.eventClass.endsWith(" Made Threes Over/Under")) ||
        o.eventClass.endsWith(" Pts + Rebs + Asts Over/Under") ||
        o.eventClass.endsWith(" Points + Assists Over/Under") ||
        o.eventClass.endsWith(" Points + Rebounds Over/Under") ||
        o.eventClass.endsWith(" Assists + Rebounds Over/Under")) &&
        (o.eventClass.includes("Home") || o.eventClass.includes("Away"))) ||
      o.eventClass === "Double-Doubles" ||
      o.eventClass === "Triple-Doubles"
    );
  });

  uniqueArray = [];

  allPointsMarkets.forEach((market) => {
    if (!uniqueArray.includes(market.eventClass)) {
      uniqueArray.push(market.eventClass);
    }
  });

  return uniqueArray;
};

const InnerLoop = async (UniqueEventClasses, scrapedOdds, PBEvent) => {
  let Mydata = UniqueEventClasses.map((eventClass) => {
    let thisPointsMarkets = scrapedOdds.filter((o) => {
      return o.eventClass === eventClass;
    });

    let marketType;
    if (
      eventClass.endsWith(" Points Over/Under")
      // &&       groupName === "Player Points Markets"
    ) {
      marketType = "Points";
    } else if (
      eventClass.endsWith(" Assists Over/Under") &&
      !eventClass.includes("+")
      // &&       groupName === "Player Assists Markets"
    ) {
      marketType = "Assists";
    } else if (
      eventClass.endsWith(" Rebounds Over/Under") &&
      !eventClass.includes("+")
      // &&       groupName === "Player Rebounds Markets"
    ) {
      marketType = "Rebounds";
    } else if (
      eventClass.endsWith(" Made Threes Over/Under")
      // &&       groupName === "Player Three Pointer Markets"
    ) {
      marketType = "Threes";
    } else if (
      eventClass.endsWith(" Pts + Rebs + Asts Over/Under")
      // &&       groupName === "Player Multi Stat Markets"
    ) {
      marketType = "PRA";
    } else if (
      eventClass.endsWith(" Points + Assists Over/Under")
      // &&       groupName === "Player Multi Stat Markets"
    ) {
      marketType = "P+A";
    } else if (
      eventClass.endsWith(" Points + Rebounds Over/Under")
      // &&       groupName === "Player Multi Stat Markets"
    ) {
      marketType = "P+R";
    } else if (
      eventClass.endsWith(" Assists + Rebounds Over/Under")
      // &&         groupName === "Player Multi Stat Markets"
    ) {
      marketType = "A+R";
    } else if (eventClass.includes("Double-Doubles")) {
      marketType = "Double Double";
    } else if (eventClass.includes("Triple-Doubles")) {
      marketType = "Triple Double";
    } else {
      marketType = "Fuck knows";
    }

    //console.log(thisPointsMarkets[0].outcomes);
    GiannisMarket = thisPointsMarkets[0].outcomes;

    if (GiannisMarket) {
      const GiannisSelections = GiannisMarket.map((outcome) => {
        let selectionName = outcome.name;

        let player = selectionName
          .split(" Under")[0]
          .split(" Over")[0]
          .split(" To Get")[0];

        let handicap;
        let handicapSection;
        if (marketType === "Double Double" || marketType === "Triple Double") {
          handicap = 0;
        } else {
          handicapSection = selectionName.replace(player, ""); //guys names have initials, and so the . fucks things up
          handicap = Number(handicapSection.replace(/[^0-9\.]+/g, ""));
        }

        let OU;
        if (
          selectionName.includes("Over") ||
          marketType === "Double Double" ||
          marketType === "Triple Double"
        ) {
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

      //console.log(GiannisSelections);

      let marketOutput;
      let revisedOutcomes;
      if (marketType === "Double Double" || marketType === "Triple Double") {
        marketOutput = GiannisSelections;
      } else {
        // loop over players and handicaps to see if there is an under to their over

        revisedOutcomes = GiannisSelections.map((outcome) => {
          if (outcome.overPrice) {
            const underSelection = GiannisSelections.filter((o) => {
              return (
                o.player === outcome.player &&
                o.marketType === outcome.marketType &&
                o.handicap === outcome.handicap &&
                o.underPrice
              );
            });
            if (underSelection) {
              newOutcome = outcome;
              newOutcome.underPrice = underSelection[0].underPrice;
              return newOutcome;
            }
          }
        });

        marketOutput = revisedOutcomes.filter((o) => {
          return o; //removes undefineds
        });
      }

      return marketOutput;
    }
  });

  if (Mydata) {
    //console.log(Mydata);
    //await writeMarketsToDB(BigOuts);
    for (let i = 0; i < Mydata.length; i++) {
      var Z = await mapLoop(Mydata[i]);
    }
    //console.log("Wrote something");
  }
};

const mapLoop = async (MarketOutputs) => {
  //console.log("Start");
  const promises = MarketOutputs.map(async (market) => {
    const numFruit = await writeMarketsToDB(market);
    return numFruit;
  });
  const numFruits = await Promise.all(promises);
  console.log(numFruits);
  //console.log("End");
};
