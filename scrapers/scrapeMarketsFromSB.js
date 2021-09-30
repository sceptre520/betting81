const fetch = require("node-fetch");

var {
  scrapeData,
  queryForAllExternalMatches,
  writeMarketsToDB,
} = require("./helper/scraperFunctions.js");

// ////////////////////////////////////////////////////////////////////////////////
// //Get WH matches from mongoDB//

const APIurl = "http://localhost:8000/api";

const matchList = queryForAllExternalMatches().then((matches) => {
  //console.log(teams);
  return matches;
});

// ////////////////////////////////////////////////////////////////////////////////

// //Scrape odds from DK public API//
const getWilliamHillOdds = (URL_for_odds) => {
  let result = scrapeData(URL_for_odds);

  return result;
};

Promise.resolve(matchList)
  .then((data) => {
    return data.filter((o) => {
      return o.sportsbook === "SportsBet";
    });
  })
  .then((matchList) => {
    matchList.map((WHmatch) => {
      const matchId = WHmatch.matchId; //matchList[1].matchId; //

      const WHEventId = WHmatch.eventId; //matchList[1].eventId; //179725302;

      const WH_Markets_URL = `https://www.sportsbet.com.au/apigw/sportsbook-sports/Sportsbook/Sports/Events/${WHEventId}/SportCard?displayWinnersPriceMkt=true&includeLiveMarketGroupings=true&includeCollection=true`;

      //Promise API call
      const scrapedOdds = getWilliamHillOdds(WH_Markets_URL).then((data) => {
        return data;
      });

      const marketGroups = Promise.resolve(scrapedOdds)
        .then((scrapedOdds) => {
          const marketGroupings = scrapedOdds.marketGrouping;

          return marketGroupings;
        })
        .then((marketGroupings) => {
          if (marketGroupings) {
            const marketGroupingId = marketGroupings.map((o) => {
              return o.id;
            });

            return marketGroupingId;
          }
        })
        .then((marketGroupingId) => {
          if (marketGroupingId) {
            const oddsData = marketGroupingId.map((o) => {
              //Promise API call

              const SB_Odds_URL = `https://www.sportsbet.com.au/apigw/sportsbook-sports/Sportsbook/Sports/Events/${WHEventId}/MarketGroupings/${o}/Markets`;

              const sportsbetOdds = getWilliamHillOdds(SB_Odds_URL).then(
                (data) => {
                  return data;
                }
              );

              Promise.resolve(sportsbetOdds).then((sportsbetOdds) => {
                //console.log(sportsbetOdds);

                let stats = ["Points", "Assists", "Rebounds", "First Basket"];

                for (const stat of stats) {
                  const playerMarkets = sportsbetOdds.filter((o) => {
                    if (stat === "First Basket") {
                      return o.name === stat;
                    } else {
                      return o.name.includes(` - ${stat}`);
                    }
                  });

                  let Outcomes;

                  if (playerMarkets) {
                    const pointsMarkets = playerMarkets.filter((o) => {
                      return o.statusCode === "A";
                    });

                    pointsMarkets.map((o) => {
                      let playerName = o.name.split(" - ")[0];
                      // //console.log(playerName);

                      Outcomes = o.selections.map((outcome) => {
                        let playerName = outcome.name;

                        let handicap = outcome.unformattedHandicap
                          ? Number(outcome.unformattedHandicap)
                          : 0;
                        let overPrice;
                        let underPrice;
                        if (outcome.name.includes("Over")) {
                          overPrice = Number(outcome.price.winPrice);
                        } else if (outcome.name.includes("Under")) {
                          underPrice = Number(outcome.price.winPrice);
                        } else {
                          overPrice = Number(outcome.price.winPrice);
                        }

                        myObject = {
                          player: playerName,
                          marketType: stat,
                          sportsbook: "SportsBet",
                          overPrice: overPrice,
                          underPrice: underPrice,
                          handicap: handicap,
                          matchId: matchId,
                        };

                        //console.log(myObject);
                        return myObject;
                      });

                      let Outcomes2 = Outcomes;
                      if (!stat === "First Basket") {
                        Outcomes2 = Outcomes.map((o) => {
                          o.player = playerName;
                          return o;
                        });
                      }

                      // // loop over players and handicaps to see if there is an under to their over
                      const revisedOutcomes = Outcomes2.map((outcome) => {
                        if (outcome.overPrice) {
                          const underSelection = Outcomes2.filter((o) => {
                            return (
                              o.player === outcome.player &&
                              o.handicap === outcome.handicap &&
                              o.underPrice
                            );
                          });
                          if (underSelection) {
                            newOutcome = outcome;
                            newOutcome.underPrice =
                              underSelection[0].underPrice;
                            return newOutcome;
                          }
                        }
                      });

                      const filteredOutcomes = revisedOutcomes.filter((o) => {
                        return o; //removes undefineds
                      });

                      //console.log(filteredOutcomes);
                      writeMarketsToDB(filteredOutcomes);
                    });
                  }
                }
              });
            });
          }
        });
    });
  });
