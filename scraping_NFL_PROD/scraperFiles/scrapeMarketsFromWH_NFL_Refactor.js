const fetch = require("node-fetch");

var {
  scrapeData,
  queryForAllExternalMatches,
  writeMarketsToDB,
  deleteOneSportsbookMarketsFromDB,
} = require("./helper/scraperFunctions.js");

// ////////////////////////////////////////////////////////////////////////////////
// //Get WH matches from mongoDB//

const APIurl = "http://localhost:8000/api";

// ////////////////////////////////////////////////////////////////////////////////
exports.scrapeWHMarkets = async () => {
  const a = await deleteOneSportsbookMarketsFromDB("William Hill");
  let matchList = await queryForAllExternalMatches();
  matchList = matchList.filter((o) => {
    return o.sportsbook === "William Hill";
  });

  for (let i = 0; i < matchList.length; i++) {
    var WHmatch = matchList[i];
    const matchId = WHmatch.matchId;

    const WHEventId = WHmatch.eventId;

    const WH_Markets_URL = `https://www.williamhill.com/us/co/bet/api/v2/events/${WHEventId}`;

    const scrapedOdds = await scrapeData(WH_Markets_URL);

    if (scrapedOdds) {
      const playerProps = scrapedOdds.markets.filter((o) => {
        return (
          o.collectionName === "Player Props" ||
          o.collectionName === "TD Scorer"
        );
      });

      if (playerProps) {
        let stats = ["Passing", "Receiving", "Rushing", "FirstTD"];

        for (const stat of stats) {
          await InnerLoop(playerProps, matchId, stat);
        }
      }
    }
  }
};

const InnerLoop = async (playerProps, matchId, stat) => {
  let marketType;
  if (stat === "Passing") {
    marketType = "Passing Yards";
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
    playerMarkets = playerProps.filter((o) => {
      const nameWithoutPipes = o.templateName.replace(/\|/g, "");
      return nameWithoutPipes === marketType; //I have no idea what is the naming convention. More probably .type is a unique identifier
    });
  } else {
    playerMarkets = playerProps.filter((o) => {
      const nameWithoutPipes = o.name.replace(/\|/g, "");
      return nameWithoutPipes.endsWith(`Total ${marketType}`); //I have no idea what is the naming convention. More probably .type is a unique identifier
    });
  }

  if (playerMarkets) {
    const pointsMarkets = playerMarkets.filter((o) => {
      return o.display && o.active;
    });

    let Outcomes;

    if (pointsMarkets) {
      var OUTS = pointsMarkets.map((thisPointsMarket) => {
        Outcomes = thisPointsMarket.selections.map((outcome) => {
          if (outcome.display && outcome.active) {
            const nameWithoutPipes = outcome.name.replace(/\|/g, "");

            let playerName;
            let handicap;
            let overPrice;
            let underPrice;
            if (nameWithoutPipes === "Over") {
              overPrice = Number(outcome.price.d);
            } else if (nameWithoutPipes === "Under") {
              underPrice = Number(outcome.price.d);
            } else {
              playerName = nameWithoutPipes;
              if (outcome.price) {
                overPrice = Number(outcome.price.d);
              }
            }

            if (stat === "FirstTD") {
              myObject = {
                player: playerName,
                marketType: stat,
                sportsbook: "William Hill",
                overPrice: overPrice,
                matchId: matchId,
              };
            } else {
              myObject = {
                player: playerName,
                marketType: stat,
                sportsbook: "William Hill",
                overPrice: overPrice,
                underPrice: underPrice,
                handicap: handicap,
                matchId: matchId,
              };
            }
            return myObject;
          }
        });

        if (Outcomes.length) {
          if (thisPointsMarket.line) {
            Outcomes.map((o) => {
              o.handicap = thisPointsMarket.line;
            });
          }

          Outcomes.map((o) => {
            if (o && stat !== "FirstTD") {
              o.player = thisPointsMarket.name.split("|")[1];
            }
          });

          // loop over players and handicaps to see if there is an under to their over

          const revisedOutcomes = Outcomes.map((outcome) => {
            if (outcome) {
              if (outcome.overPrice) {
                const underSelection = Outcomes.filter((o) => {
                  if (o) {
                    return (
                      o.player === outcome.player &&
                      o.handicap === outcome.handicap &&
                      o.underPrice
                    );
                  }
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
  }
};

const mapLoop = async (MarketOutputs) => {
  //console.log("Start");

  const promises = MarketOutputs.map(async (market) => {
    const numFruit = await writeMarketsToDB(market);
    return numFruit;
  });

  const numFruits = await Promise.all(promises);
  // console.log(numFruits);

  //console.log("End");
};
