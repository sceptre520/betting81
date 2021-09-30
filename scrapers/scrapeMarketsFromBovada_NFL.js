const fetch = require("node-fetch");

var {
  scrapeData,
  queryForAllExternalMatches,
  writeMarketsToDB,
  deleteOneSportsbookMarketsFromDB,
} = require("./helper/scraperFunctions.js");

////////////////////////////////////////////////////////////////////////////////
//Get BV matches from mongoDB//

const APIurl = "http://localhost:8000/api";

deleteOneSportsbookMarketsFromDB("Bovada");

const matchList = queryForAllExternalMatches().then((matches) => {
  //console.log(teams);
  return matches;
});

////////////////////////////////////////////////////////////////////////////////

//Scrape odds from BV public API//
const getBovadaOdds = (URL_for_odds) => {
  let result = scrapeData(URL_for_odds);

  return result;
};

Promise.resolve(matchList)
  .then((data) => {
    return data.filter((o) => {
      return o.sportsbook === "Bovada";
    });
  })
  .then((matchList) => {
    matchList.map((BVmatch) => {
      const matchId = BVmatch.matchId; //matchList[0].matchId;

      const BVEventId = BVmatch.eventId; //matchList[0].eventId; //179725302;

      const BV_Markets_URL = `https://www.bovada.lv/services/sports/event/coupon/events/A/description${BVEventId}`;

      //Promise API call
      const scrapedOdds = getBovadaOdds(BV_Markets_URL).then((data) => {
        return data;
      });

      Promise.all([scrapedOdds, matchId]).then((values) => {
        const scrapedOdds = values[0];
        const matchId = values[1];

        const output = scrapedOdds[0].events[0].displayGroups;

        if (output) {
          const playerProps = output.filter((o) => {
            return (
              o.description === "Touchdown Props" ||
              "Quarterback Props" ||
              "Receiving Props" ||
              "Rushing Props"
            );
          });

          if (playerProps) {
            playerProps.map((Category) => {
              const playerProps2 = Category.markets;
              if (playerProps2) {
                let stats = ["Rushing", "Receiving", "Passing"]; //, "FirstTD"
                for (const stat of stats) {
                  const playerMarkets = playerProps2.filter((o) => {
                    let condition;
                    if (stat === "Passing") {
                      condition = "Total Passing Yards";
                    } else if (stat === "Rushing") {
                      condition = "Total Rushing Yards";
                    } else if (stat === "Receiving") {
                      condition = "Total Receiving Yards";
                    } else if (stat === "FirstTD") {
                      condition = "First Touchdown Scorer";
                    } else {
                      condition = "No Idea";
                    }
                    return (
                      (o.description === condition && stat === "FirstTD") ||
                      (o.description.startsWith(condition) &&
                        stat !== "FirstTD")
                    );
                  });

                  if (playerMarkets) {
                    if (stat === "FirstTD") {
                      const SELECTIONS = playerMarkets.map((o) => {
                        if (o.outcomes) {
                          const pointsMarkets = o.outcomes.filter((o) => {
                            return (
                              o.status === "O" && o.description.includes("(")
                            );
                          });

                          const Outcomes = pointsMarkets.map((market) => {
                            let myObject;

                            myObject = {
                              player: market.description.split(" (")[0],
                              marketType: stat,
                              sportsbook: "Bovada",
                              overPrice: market.price.decimal,
                              matchId: matchId,
                            };

                            return myObject;
                          });

                          //console.log(Outcomes);
                          writeMarketsToDB(Outcomes);
                        }
                      });
                    } else {
                      playerMarkets.map((o) => {
                        if (o.outcomes) {
                          var outerPlayerName = o.description
                            .split(" - ")[1]
                            .split(" (")[0];

                          var SELECTIONS = o.outcomes.map((o) => {
                            let overPrice;
                            let underPrice;
                            let handicap;
                            let innerPlayerName;
                            if (o.description === "Over") {
                              overPrice = o.price.decimal;
                              handicap = o.price.handicap;
                            } else if (o.description === "Under") {
                              underPrice = o.price.decimal;
                              handicap = o.price.handicap;
                            } else {
                              overPrice = o.price.decimal;
                              handicap = o.price.handicap;
                              innerPlayerName = o.description;
                            }

                            var myObject = {
                              player: innerPlayerName
                                ? innerPlayerName
                                : outerPlayerName,
                              marketType: stat,
                              sportsbook: "Bovada",
                              overPrice: overPrice,
                              underPrice: underPrice,
                              handicap: handicap,
                              matchId: matchId,
                            };

                            return myObject;
                          });

                          //DO THE WILLIAM HILL POPULATING OF THE UNDERS
                          // loop over players and handicaps to see if there is an under to their over

                          const revisedOutcomes = SELECTIONS.map((outcome) => {
                            if (outcome.overPrice) {
                              const underSelection = SELECTIONS.filter((o) => {
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

                          const filteredOutcomes = revisedOutcomes.filter(
                            (o) => {
                              return o; //removes undefineds
                            }
                          );

                          //console.log(filteredOutcomes);
                          writeMarketsToDB(filteredOutcomes);
                        }
                      });
                    }
                  }
                }
              }
            });
          }
        }
      });
    });
  });
