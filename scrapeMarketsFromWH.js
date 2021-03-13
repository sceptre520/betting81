const fetch = require("node-fetch");

// ////////////////////////////////////////////////////////////////////////////////
// //Get WH matches from mongoDB//

const APIurl = "http://localhost:8000/api";

const queryForAllMatches = () => {
  async function getAllMatchesInDB() {
    return fetch(`${APIurl}/externalMatches`).then((matches) => {
      return matches.json();
    });
  }

  let matchList = getAllMatchesInDB().then((output) => {
    return output;
  });

  return matchList;
};

const matchList = queryForAllMatches().then((matches) => {
  //console.log(teams);
  return matches;
});

// ////////////////////////////////////////////////////////////////////////////////

// //Scrape odds from DK public API//
const getWilliamHillOdds = (URL_for_odds) => {
  async function scrapeData(URL_for_odds) {
    return fetch(URL_for_odds, {
      method: "GET",
    })
      .then((response) => {
        return response.json();
      })
      .catch((err) => console.log("you fucked up"));
  }

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
          return o.collectionName === "Player Props";
        });

        //console.log(playerProps);

        let stats = ["Points", "Assists", "Rebounds"]; //I have no idea what is the naming convention
        //let stats = ["Total Player Shots"]; //I have no idea what is the naming convention

        for (const stat of stats) {
          const playerMarkets = playerProps.filter((o) => {
            const nameWithoutPipes = o.templateName.replace(/\|/g, "");
            return nameWithoutPipes === `Player Total ${stat}`; //I have no idea what is the naming convention. More probably .type is a unique identifier
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
                }

                Outcomes.map((o) => {
                  o.player = thisPointsMarket.name.split("|")[1];
                });

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

                //Not yet writing to DB

                writeMarketsToDB(filteredOutcomes);
              });
            }
          }
        }
      });
    });
  });
// ////////////////////////////////////////////////////////////////////////////////

// //Pull out markets from PB API one event at a time, and write to DB//

const createMarketInDB = (market) => {
  fetch(`${APIurl}/scraper/market/create`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(market),
  }).then((response, err) => {
    if (err) {
      console.log(err);
    } else {
      console.log(response);
    }
  });
};

const writeMarketsToDB = (Outcomes) => {
  if (Array.isArray(Outcomes)) {
    //console.log("I am array");
    Outcomes.map((market) => {
      createMarketInDB(market);
    });
  } else {
    //console.log("I am not array");
    createMarketInDB(Outcomes);
  }
};
