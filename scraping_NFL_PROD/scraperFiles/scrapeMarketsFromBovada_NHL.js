const fetch = require("node-fetch");

var {
  scrapeData,
  queryForAllExternalMatches,
  writeMarketsToDB,
  deleteOneSportsbookMarketsFromDB,
} = require("./helper/scraperFunctions.js");

//Get BV matches from mongoDB//

const APIurl = "http://localhost:8000/api";

////////////////////////////////////////////////////////////////////////////////
exports.scrapeBovadaMarkets = async () => {
  // const a = await deleteOneSportsbookMarketsFromDB("Bovada");

  let matchList = await queryForAllExternalMatches();

  matchList = matchList.filter((o) => {
    return o.sportsbook === "Bovada" && o.league === "NHL";
  });

  for (let i = 0; i < matchList.length; i++) {
    var BVmatch = matchList[i];

    const matchId = BVmatch.matchId; //matchList[0].matchId;

    const BVEventId = BVmatch.eventId; //matchList[0].eventId; //179725302;

    const BV_Markets_URL = `https://www.bovada.lv/services/sports/event/coupon/events/A/description${BVEventId}`;

    //Promise API call
    const scrapedOdds = await scrapeData(BV_Markets_URL);

    if (scrapedOdds[0]) {
      await InnerLoop(scrapedOdds, matchId);
    }
  }
};

const mapLoop = async (MarketOutputs) => {
  //console.log("Start");

  let promises;
  if (MarketOutputs.map instanceof Function) {
    promises = MarketOutputs.map(async (market) => {
      const numFruit = await writeMarketsToDB(market);
      return numFruit;
    });
  } else {
    promises = await writeMarketsToDB(MarketOutputs);
  }

  const numFruits = await Promise.all(promises);
  // console.log(numFruits);
  //console.log("End");
};

const InnerLoop = async (scrapedOdds, matchId) => {
  const output = scrapedOdds[0].events[0].displayGroups;

  if (output) {
    const playerProps = output.filter((o) => {
      return o.description === "Player Props";
    });

    if (playerProps) {
      for (let j = 0; j < playerProps.length; j++) {
        var Category = playerProps[j];

        const playerProps2 = Category.markets;

        if (playerProps2) {
          let stats = [
            // "Points (NHL)",
            // "Assists (NHL)",
            "Goals (NHL)",
            "Saves",
            "Shots On Goal",
          ];
          for (const stat of stats) {
            const playerMarkets = playerProps2.filter((o) => {
              let condition;
              if (stat === "Goals (NHL)") {
                condition = "Anytime Goalscorer";
              } else if (stat === "Saves") {
                condition = "Total saves in the game -";
              } else if (stat === "Shots On Goal") {
                condition = "Total shots on goal in the game -";
              } else {
                condition = "No Idea";
              }
              return o.description.startsWith(condition);
            });

            if (playerMarkets) {
              let BigOuts = [];
              if (stat === "Goals (NHL)") {
                const SELECTIONS = playerMarkets.map((o) => {
                  if (o.outcomes) {
                    console.log(o.outcomes);
                    const pointsMarkets = o.outcomes.filter((o) => {
                      return o.status === "O";
                    });

                    const Outcomes = pointsMarkets.map((market) => {
                      let myObject;

                      myObject = {
                        player: market.description.split(" (")[0],
                        marketType: stat,
                        sportsbook: "Bovada",
                        overPrice: market.price.decimal,
                        handicap: 0.5,
                        matchId: matchId,
                      };

                      return myObject;
                    });

                    return Outcomes;
                  }
                });

                BigOuts.push(...SELECTIONS);
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
                          newOutcome.underPrice = underSelection[0].underPrice;
                          return newOutcome;
                        }
                      }
                    });

                    const filteredOutcomes = revisedOutcomes.filter((o) => {
                      return o; //removes undefineds
                    });

                    BigOuts.push(...filteredOutcomes);
                  }
                });
              }

              if (BigOuts.length) {
                //console.log(BigOuts);
                //await writeMarketsToDB(BigOuts);
                for (let i = 0; i < BigOuts.length; i++) {
                  var Z = await mapLoop(BigOuts[i]);
                }
              }
            }
          }
        }
      }
    }
  }
};
