const fetch = require("node-fetch");

var {
  scrapeData,
  queryForAllExternalMatches,
  writeMarketsToDB,
  deleteOneSportsbookMarketsFromDB,
} = require("./helper/scraperFunctions.js");

//Get DK matches from mongoDB//

const APIurl = "http://localhost:8000/api";

////////////////////////////////////////////////////////////////////////////////

////////////////////////////////////////////////////////////////////////////////
exports.scrapeDKMarkets = async () => {
  // const a = await deleteOneSportsbookMarketsFromDB("DraftKings");
  let matchList = await queryForAllExternalMatches();
  matchList = matchList.filter((o) => {
    return o.sportsbook === "DraftKings" && o.league === "NHL";
  });

  for (let i = 0; i < matchList.length; i++) {
    var DKmatch = matchList[i];

    const matchId = DKmatch.matchId; //matchList[0].matchId;

    const DKEventId = DKmatch.eventId; //matchList[0].eventId; //179725302;

    const DK_Markets_URL = `https://sportsbook-us-co.draftkings.com//sites/US-CO-SB/api/v2/event/${DKEventId}?includePromotions=true&format=json`;

    //Promise API call
    const scrapedOdds = await scrapeData(DK_Markets_URL);

    const output = scrapedOdds.eventCategories;

    if (output) {
      await InnerLoop(output, matchId);
    }
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

const InnerLoop = async (output, matchId) => {
  const playerProps = output.filter((o) => {
    return o.name === "Player Props";
  });

  //console.log(playerProps);

  if (playerProps) {
    var BigBigBigOuts = playerProps.map((Category) => {
      const playerProps2 = Category.componentizedOffers;
      var BigBigOuts = [];
      let stats = [
        "Points (NHL)",
        "Assists (NHL)",
        "Goals (NHL)",
        //"Saves",
        "Shots On Goal",
        "PP Points",
      ];
      for (const stat of stats) {
        const playerMarkets = playerProps2.filter((o) => {
          let condition;
          if (stat === "Points (NHL)") {
            condition = "Points";
          } else if (stat === "Assists (NHL)") {
            condition = "Assists";
          } else if (stat === "Goals (NHL)") {
            condition = "Goalscorer"; //"Anytime Scorer";
          } else if (stat === "Shots On Goal") {
            condition = "Shots on Goal";
          } else if (stat === "PP Points") {
            condition = "Power Play Points";
          } else {
            condition = "No Idea";
          }
          return o.subcategoryName === condition;
        })[0];

        if (playerMarkets) {
          //console.log(playerMarkets.offers[0][0].outcomes);
          let BigOuts = [];
          const pointsMarkets = playerMarkets.offers[0].filter((o) => {
            return !o.isSuspended && o.isOpen;
          });

          if (stat === "Goals (NHL)") {
            // console.log(pointsMarkets[0].outcomes);
            const Outcomes = pointsMarkets[0].outcomes
              .filter((o) => {
                let criteria;
                if (stat === "Goals (NHL)") {
                  criteria = "Anytime Scorer";
                } else {
                  criteria = "Unknown";
                }
                return o.criterionName === criteria;
              })
              .map((market) => {
                // console.log(market);
                let myObject;

                myObject = {
                  player: market.label.includes("(")
                    ? market.label.split("(")[0].trim()
                    : market.label,
                  marketType: stat,
                  sportsbook: "DraftKings",
                  overPrice: market.oddsDecimal,
                  handicap: 0.5,
                  matchId: matchId,
                };
                // console.log(myObject);
                return myObject;
              });

            BigOuts.push(Array.from(Outcomes));
          } else {
            const Outcomes = pointsMarkets.map((market) => {
              var oMarket = market.outcomes.filter((o) => {
                return !o.label.includes("Under");
              })[0];

              var uMarket = market.outcomes.filter((o) => {
                return o.label.includes("Under");
              })[0];

              var handicap = oMarket ? Number(oMarket.line) : 0;
              if (oMarket.participant) {
                myObject = {
                  player: oMarket.participant.includes("(")
                    ? oMarket.participant.split("(")[0].trim()
                    : oMarket.participant,
                  marketType: stat,
                  sportsbook: "DraftKings",
                  overPrice: oMarket.oddsDecimal,
                  underPrice: uMarket ? uMarket.oddsDecimal : NaN,
                  handicap: handicap,
                  matchId: matchId,
                };

                // console.log(myObject);
                return myObject;
              }
            });

            BigOuts.push(Outcomes);
          }
          // console.log(BigOuts);
          BigBigOuts.push(BigOuts);
        }
      }
      return BigBigOuts;
    });
    // console.log(BigBigBigOuts);
    if (BigBigBigOuts.length) {
      //console.log(BigOuts);
      //await writeMarketsToDB(BigBigOuts);
      for (let i = 0; i < BigBigBigOuts.length; i++) {
        var data = BigBigBigOuts[i];
        for (let j = 0; j < data.length; j++) {
          var Z = await mapLoop(data[j][0]);
          // console.log(data[j][0].length);
        }
      }
      //console.log("Wrote something");
    }
  }
};
