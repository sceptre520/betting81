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
  const a = await deleteOneSportsbookMarketsFromDB("Bovada");
  let matchList = await queryForAllExternalMatches();
  matchList = matchList.filter((o) => {
    return o.sportsbook === "Bovada";
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

  const promises = MarketOutputs.map(async (market) => {
    const numFruit = await writeMarketsToDB(market);
    return numFruit;
  });

  const numFruits = await Promise.all(promises);
  // console.log(numFruits);

  //console.log("End");
};

const InnerLoop = async (scrapedOdds, matchId) => {
  const output = scrapedOdds[0].events[0].displayGroups;

  if (output) {
    const playerProps = output.filter((o) => {
      return (
        o.description === "Touchdown Props" ||
        o.description === "Quarterback Props" ||
        o.description === "Receiving Props" ||
        o.description === "Rushing Props"
      );
    });

    if (playerProps) {
      for (let j = 0; j < playerProps.length; j++) {
        var Category = playerProps[j];

        const playerProps2 = Category.markets;
        if (playerProps2) {
          let stats = ["Passing", "Rushing", "Receiving"]; //, "FirstTD"
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
                (o.description.startsWith(condition) && stat !== "FirstTD")
              );
            });

            if (playerMarkets) {
              let BigOuts = [];
              if (stat === "FirstTD") {
                const SELECTIONS = playerMarkets.map((o) => {
                  if (o.outcomes) {
                    const pointsMarkets = o.outcomes.filter((o) => {
                      return o.status === "O" && o.description.includes("(");
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

                    return Outcomes;
                  }
                });

                BigOuts.push(SELECTIONS);
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

                    BigOuts.push(filteredOutcomes);
                  }
                });
              }

              if (BigOuts.length) {
                //console.log(BigOuts);
                //await writeMarketsToDB(BigOuts);
                for (let i = 0; i < BigOuts.length; i++) {
                  var Z = await mapLoop(BigOuts[i]);
                }
                //console.log("Wrote something");
              }
            }
          }
        }
      }
    }
  }
};
