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
      return o.sportsbook === "Superbook";
    });
  })
  .then((matchList) => {
    //console.log(matchList);
    matchList.map((WHmatch) => {
      const matchId = WHmatch.matchId; //matchList[1].matchId; //
      const WHEventId = WHmatch.eventId; //matchList[1].eventId; //179725302;
      const WH_Markets_URL = `https://co.superbook.com/cache/psevent/UK/1/false/${WHEventId}.json`;
      //Promise API call
      const scrapedOdds = getWilliamHillOdds(WH_Markets_URL).then((data) => {
        return data;
      });
      const marketGroups = Promise.resolve(scrapedOdds).then((scrapedOdds) => {
        //console.log(scrapedOdds);

        if (scrapedOdds.ismatch && scrapedOdds.istradable) {
          const filteredEvents = scrapedOdds.eventmarketgroups.filter((o) => {
            return o.name === "Player Props";
          })[0];

          if (filteredEvents) {
            const markets = filteredEvents.markets;

            let stats = ["Points", "Assists", "Rebounds"]; //I have no idea what is the naming convention
            for (const stat of stats) {
              const playerMarkets = markets.filter((o) => {
                return o.name.endsWith(` ${stat}`) && !o.name.includes("+"); //avoid the P+R+A-type markets
              });

              playerMarkets.map((data) => {
                let playerName = data.name.replace(` ${stat}`, "");

                const myoutputs = data.selections.map((sel) => {
                  let overPrice;
                  let underPrice;
                  let handicap;

                  if (sel.name === "Under") {
                    handicap = sel.currenthandicap;
                    underPrice = 1 + sel.currentpriceup / sel.currentpricedown;
                  } else if (sel.name === "Over") {
                    handicap = sel.currenthandicap;
                    overPrice = 1 + sel.currentpriceup / sel.currentpricedown;
                  } else {
                    playerName = sel.name;
                    overPrice = 1 + sel.currentpriceup / sel.currentpricedown;
                  }

                  return {
                    player: playerName,
                    marketType: stat,
                    sportsbook: "Superbook",
                    overPrice: overPrice,
                    underPrice: underPrice,
                    handicap: handicap,
                    matchId: matchId,
                  };
                });

                //console.log(myoutputs);

                // loop over players and handicaps to see if there is an under to their over
                const revisedOutcomes = myoutputs.map((outcome) => {
                  if (outcome.overPrice) {
                    const underSelection = myoutputs.filter((o) => {
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
                //console.log(filteredOutcomes);
                writeMarketsToDB(filteredOutcomes);
              });
            }
          }
        }
      });
      //     .then((marketGroupings) => {
      //       if (marketGroupings) {
      //         const marketGroupingId = marketGroupings.map((o) => {
      //           return o.id;
      //         });
      //         return marketGroupingId;
      //       }
      //     })
      //     .then((marketGroupingId) => {
      //       if (marketGroupingId) {
      //         const oddsData = marketGroupingId.map((o) => {
      //           //Promise API call
      //           const SB_Odds_URL = `https://www.sportsbet.com.au/apigw/sportsbook-sports/Sportsbook/Sports/Events/${WHEventId}/MarketGroupings/${o}/Markets`;
      //           const sportsbetOdds = getWilliamHillOdds(SB_Odds_URL).then(
      //             (data) => {
      //               return data;
      //             }
      //           );
      //           Promise.resolve(sportsbetOdds).then((sportsbetOdds) => {
      //             //console.log(sportsbetOdds);
      //             let stats = ["Points", "Assists", "Rebounds"]; //I have no idea what is the naming convention
      //             for (const stat of stats) {
      //               const playerMarkets = sportsbetOdds.filter((o) => {
      //                 return o.name.includes(` - ${stat}`); //I have no idea what is the naming convention. More probably .type is a unique identifier
      //               });
      //               let Outcomes;
      //               if (playerMarkets) {
      //                 const pointsMarkets = playerMarkets.filter((o) => {
      //                   return o.statusCode === "A";
      //                 });
      //                 playerMarkets.map((o) => {
      //                   //console.log(o);
      //                   let playerName = o.name.split(" - ")[0];
      //                   //console.log(playerName);
      //                   Outcomes = o.selections.map((outcome) => {
      //                     //let playerName = playerName;
      //                     let handicap = Number(outcome.unformattedHandicap);
      //                     let overPrice;
      //                     let underPrice;
      //                     if (outcome.name.includes("Over")) {
      //                       overPrice = Number(outcome.price.winPrice);
      //                     } else if (outcome.name.includes("Under")) {
      //                       underPrice = Number(outcome.price.winPrice);
      //                     } else {
      //                       overPrice = Number(outcome.price.winPrice);
      //                     }
      //                     myObject = {
      //                       player: playerName,
      //                       marketType: stat,
      //                       sportsbook: "SportsBet",
      //                       overPrice: overPrice,
      //                       underPrice: underPrice,
      //                       handicap: handicap,
      //                       matchId: matchId,
      //                     };
      //                     return myObject;
      //                   });
      //
      //                   const filteredOutcomes = revisedOutcomes.filter((o) => {
      //                     return o; //removes undefineds
      //                   });
      //                   //Not yet writing to DB
      //                   writeMarketsToDB(filteredOutcomes);
      //                 });
      //               }
      //             }
      //           });
      //         });
      //       }
      //     });
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
