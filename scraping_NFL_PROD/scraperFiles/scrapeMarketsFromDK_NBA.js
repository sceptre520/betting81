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
    return o.sportsbook === "DraftKings" && o.league === "NBA";
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
  })[0];
  //console.log(playerProps);

  if (playerProps) {
    const Category = playerProps;
    const playerProps2 = Category.componentizedOffers;

    var BigBigOuts = [];
    let stats = [
      "Points",
      "Rebounds",
      "Assists",
      "Threes",
      "PRA",
      "Blocks",
      "Steals",
      "Turnovers",
      "Double Double",
      "Triple Double",
      "P+A",
      "P+R",
      "A+R",
      "S+B",
    ];

    for (const stat of stats) {
      const playerMarkets = playerProps2.filter((o) => {
        let condition;
        if (stat === "PRA") {
          condition = "Pts, Reb & Ast";
        } else if (stat === "Double Double") {
          condition = "Double-Double";
        } else if (stat === "Triple Double") {
          condition = "Triple-Double";
        } else if (stat === "P+A") {
          condition = "Pts + Ast";
        } else if (stat === "P+R") {
          condition = "Pts + Reb";
        } else if (stat === "A+R") {
          condition = "Ast + Reb";
        } else if (stat === "S+B") {
          condition = "Steals + Blocks";
        } else {
          condition = stat;
        }
        return o.subcategoryName === condition;
      })[0];

      if (playerMarkets) {
        //console.log(playerMarkets.offers[0][0].outcomes);
        let BigOuts = [];
        const pointsMarkets = playerMarkets.offers[0].filter((o) => {
          return !o.isSuspended && o.isOpen;
        });
        if (false) {
          const Outcomes = pointsMarkets[0].outcomes.map((market) => {
            //console.log(market);
            let myObject;

            myObject = {
              player: market.label.includes("(")
                ? market.label.split("(")[0].trim()
                : market.label,
              marketType: stat,
              sportsbook: "DraftKings",
              overPrice: market.oddsDecimal,
              matchId: matchId,
            };

            return myObject;
          });

          BigOuts.push(Outcomes);
        } else {
          const Outcomes = pointsMarkets.map((market) => {
            var oMarket = market.outcomes.filter((o) => {
              return !o.label.includes("Under") && !o.label.includes("No");
            })[0];

            var uMarket = market.outcomes.filter((o) => {
              return o.label.includes("Under") || o.label.includes("No");
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
                handicap: handicap ? handicap : 0,
                matchId: matchId,
              };

              return myObject;
            }
          });

          BigOuts.push(Outcomes);
        }

        BigBigOuts.push(BigOuts);
      }
    }

    var BigBigBigOuts = BigBigOuts;
    if (BigBigBigOuts.length) {
      //console.log(BigOuts);
      //await writeMarketsToDB(BigBigOuts);
      for (let i = 0; i < BigBigBigOuts.length; i++) {
        var data = BigBigBigOuts[i];
        for (let j = 0; j < data.length; j++) {
          var Z = await mapLoop(data[j]);
          //console.log(data[j]);
        }
      }
      //console.log("Wrote something");
    }
  }
};
