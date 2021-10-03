const fetch = require("node-fetch");

var {
  scrapeData,
  queryForAllExternalMatches,
  writeMarketsToDB,
  deleteOneSportsbookMarketsFromDB,
} = require("./helper/scraperFunctions.js");

// //Get WH matches from mongoDB//

const APIurl = "http://localhost:8000/api";

// ////////////////////////////////////////////////////////////////////////////////

exports.scrapeSportsBettingMarkets = async () => {
  const a = await deleteOneSportsbookMarketsFromDB("MaximBet");
  let matchList = await queryForAllExternalMatches();
  matchList = matchList.filter((o) => {
    return o.sportsbook === "MaximBet";
  });

  for (let i = 0; i < matchList.length; i++) {
    var WHmatch = matchList[i];
    const matchId = WHmatch.matchId;

    const WHEventId = WHmatch.eventId;

    const Odds_URL = `https://co.maximbet.com/api/events/${WHEventId}`;

    //Promise API call
    const scrapedOdds = await scrapeData(Odds_URL);
    const playerPropMarkets = scrapedOdds.markets.filter((o) => {
      return o.active && o.display;
    });

    if (playerPropMarkets) {
      const playerPropSelections = scrapedOdds.selections.filter((o) => {
        return o.active && o.display;
      });

      let stats = ["Passing", "Receiving", "Rushing", "FirstTD"]; //
      for (const stat of stats) {
        await InnerLoop(stat, playerPropMarkets, playerPropSelections, matchId);
      }
    }
  }
};

const InnerLoop = async (
  stat,
  playerPropMarkets,
  playerPropSelections,
  matchId
) => {
  let marketType;

  if (stat === "Passing") {
    marketType = "Total Pass Yards";
  } else if (stat === "Receiving") {
    marketType = "Receiving Yards";
  } else if (stat === "Rushing") {
    marketType = "Rushing Yards";
  } else if (stat === "FirstTD") {
    marketType = "First Touchdown Scorer";
  } else {
    marketType = "Fuck knows";
  }

  let playerMarkets;
  if (stat === "FirstTD") {
    playerMarkets = playerPropMarkets.filter((o) => {
      return o.name === marketType; //I have no idea what is the naming convention. More probably .type is a unique identifier
    });

    const OUTS = playerMarkets.map((o) => {
      if (o.selections) {
        const theseSelections = o.selections;
        const OUT2 = playerPropSelections.filter((o) => {
          return theseSelections.includes(o.id);
        });

        if (OUT2) {
          const BIGOUTS = OUT2.map((o) => {
            if (o.name.includes(" (")) {
              const nameWithoutBrackets = o.name.split(" (")[0];
              var playerName = nameWithoutBrackets;
              var overPrice = o.price.d;

              var myObject = {
                player: playerName,
                marketType: stat,
                sportsbook: "MaximBet",
                overPrice: overPrice,
                matchId: matchId,
              };

              return myObject;
            }
          });

          const filteredOutcomes = BIGOUTS.filter((o) => {
            return o; //removes undefineds
          });

          return filteredOutcomes;
        }
      }
    });
  } else {
    playerMarkets = playerPropMarkets.filter((o) => {
      return o.name.endsWith(marketType); //I have no idea what is the naming convention. More probably .type is a unique identifier
    });

    const OUTS = playerMarkets.map((o) => {
      if (o.selections) {
        const theseSelections = o.selections;
        const OUT2 = playerPropSelections.filter((o) => {
          return theseSelections.includes(o.id);
        });

        const playerName = o.name.split(" (")[0];

        if (OUT2) {
          const BIGOUTS = OUT2.map((o) => {
            let handicap;
            let overPrice;
            let underPrice;
            if (o.name.includes("Over") && o.price) {
              handicap = parseFloat(o.name.split("Over ")[1]);
              overPrice = o.price.d;
            } else if (o.name.includes("Under") && o.price) {
              handicap = parseFloat(o.name.split("Under ")[1]);
              underPrice = o.price.d;
            }

            var myObject = {
              player: playerName,
              marketType: stat,
              sportsbook: "MaximBet",
              overPrice: overPrice,
              underPrice: underPrice,
              handicap: handicap,
              matchId: matchId,
            };
            return myObject;
          });

          const revisedOutcomes = BIGOUTS.map((outcome) => {
            if (outcome) {
              if (outcome.overPrice) {
                const underSelection = BIGOUTS.filter((o) => {
                  return (
                    o.player === outcome.player &&
                    o.handicap === outcome.handicap &&
                    o.underPrice
                  );
                });
                if (underSelection) {
                  newOutcome = outcome;
                  if (underSelection[0]) {
                    newOutcome.underPrice = underSelection[0].underPrice;
                  }
                  return newOutcome;
                }
              }
            }
          });

          const filteredOutcomes = revisedOutcomes.filter((o) => {
            return o; //removes undefineds
          });

          return filteredOutcomes;
        }
      }
    });

    if (OUTS) {
      //console.log(OUTS);
      //await writeMarketsToDB(MarketOutputs[0]);
      for (let i = 0; i < OUTS.length; i++) {
        var Z = await mapLoop(OUTS[i]);
      }
      //console.log("Wrote something");
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
  //console.log(numFruits);

  //console.log("End");
};
