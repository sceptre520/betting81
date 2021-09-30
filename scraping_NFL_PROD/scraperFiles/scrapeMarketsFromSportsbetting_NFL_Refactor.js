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
  return deleteOneSportsbookMarketsFromDB("MaximBet").then(() => {
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
          return o.sportsbook === "MaximBet";
        });
      })
      .then((matchList) => {
        matchList.map((WHmatch) => {
          const matchId = WHmatch.matchId; //matchList[1].matchId; //

          const WHEventId = WHmatch.eventId; //matchList[1].eventId; //179725302;

          const Odds_URL = `https://co.maximbet.com/api/events/${WHEventId}`;

          //Promise API call
          const scrapedOdds = getWilliamHillOdds(Odds_URL).then((data) => {
            return data;
          });

          Promise.all([scrapedOdds, matchId]).then((values) => {
            const scrapedOdds = values[0];
            const matchId = values[1];

            const playerPropMarkets = scrapedOdds.markets.filter((o) => {
              return o.active && o.display;
            });

            const playerPropSelections = scrapedOdds.selections.filter((o) => {
              return o.active && o.display;
            });

            let stats = ["Passing", "Receiving", "Rushing", "FirstTD"]; //

            for (const stat of stats) {
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

                      //console.log(filteredOutcomes);
                      writeMarketsToDB(filteredOutcomes);
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
                        if (o.name.includes("Over")) {
                          handicap = parseFloat(o.name.split("Over ")[1]);
                          overPrice = o.price.d;
                        } else if (o.name.includes("Under")) {
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
                                newOutcome.underPrice =
                                  underSelection[0].underPrice;
                              }
                              return newOutcome;
                            }
                          }
                        }
                      });

                      const filteredOutcomes = revisedOutcomes.filter((o) => {
                        return o; //removes undefineds
                      });

                      //console.log(filteredOutcomes);
                      writeMarketsToDB(filteredOutcomes);
                    }
                  }
                });
              }
            }
          });
        });
      });
  });
};
