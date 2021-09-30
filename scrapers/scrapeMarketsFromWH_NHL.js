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
      return o.sportsbook === "William Hill";
    });
  })
  .then((matchList) => {
    matchList.map((WHmatch) => {
      const matchId = WHmatch.matchId; //matchList[1].matchId; //

      const WHEventId = WHmatch.eventId; //matchList[1].eventId; //179725302;

      const WH_Markets_URL = `https://www.williamhill.com/us/co/bet/api/v2/events/${WHEventId}`;

      //Promise API call
      const scrapedOdds = getWilliamHillOdds(WH_Markets_URL).then((data) => {
        return data;
      });

      Promise.all([scrapedOdds, matchId]).then((values) => {
        const scrapedOdds = values[0];
        const matchId = values[1];

        const playerProps = scrapedOdds.markets.filter((o) => {
          return (
            o.collectionName === "Player Props" || o.collectionName === "Goals"
          );
        });

        let stats = ["Points", "Assists", "Shots", "Goals", "First Goal"]; //I have no idea what is the naming convention

        for (const stat of stats) {
          const playerMarkets = playerProps.filter((o) => {
            let nameWithoutPipes;
            let condition;
            if (["Points", "Assists", "Shots"].includes(stat)) {
              nameWithoutPipes = o.name.replace(/\|/g, "");
              condition = ` Total ${stat}`;
              return nameWithoutPipes.endsWith(condition);
            } else if (stat === "Goals") {
              nameWithoutPipes = o.templateName.replace(/\|/g, "");
              condition = "Anytime Goalscorer";
              return nameWithoutPipes === condition;
            } else if (stat === "First Goal") {
              nameWithoutPipes = o.templateName.replace(/\|/g, "");
              condition = "First Goalscorer";
              return nameWithoutPipes === condition;
            }

            //I have no idea what is the naming convention. More probably .type is a unique identifier
          });

          if (playerMarkets) {
            const pointsMarkets = playerMarkets.filter((o) => {
              return o.display && o.active;
            });

            let Outcomes;

            if (pointsMarkets) {
              pointsMarkets.map((thisPointsMarket) => {
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
                      overPrice = Number(outcome.price.d);
                    }

                    myObject = {
                      player: playerName,
                      marketType: stat,
                      sportsbook: "William Hill",
                      overPrice: overPrice,
                      underPrice: underPrice,
                      handicap: handicap,
                      matchId: matchId,
                    };
                    return myObject;
                  }
                });

                if (thisPointsMarket.line) {
                  Outcomes.map((o) => {
                    o.handicap = thisPointsMarket.line;
                  });
                } else if (stat === "Goals") {
                  Outcomes.map((o) => {
                    o.handicap = 0.5;
                    o.underPrice = 0;
                  });
                } else if (stat === "First Goal") {
                  Outcomes.map((o) => {
                    o.handicap = 0;
                    o.underPrice = 0;
                  });
                }

                if (["Points", "Assists", "Shots"].includes(stat)) {
                  Outcomes.map((o) => {
                    o.player = thisPointsMarket.name.split("|")[1];
                  });
                }
                //console.log(Outcomes);
                // loop over players and handicaps to see if there is an under to their over

                const revisedOutcomes = Outcomes.map((outcome) => {
                  if (outcome.overPrice) {
                    const underSelection = Outcomes.filter((o) => {
                      return (
                        o.player === outcome.player &&
                        o.handicap === outcome.handicap &&
                        o.underPrice
                      );
                    });
                    if (underSelection && underSelection[0]) {
                      newOutcome = outcome;
                      newOutcome.underPrice = underSelection[0].underPrice;
                      return newOutcome;
                    } else {
                      return outcome;
                    }
                  }
                });

                const filteredOutcomes = revisedOutcomes.filter((o) => {
                  return o; //removes undefineds
                });

                writeMarketsToDB(filteredOutcomes);
              });
            }
          }
        }
      });
    });
  });
