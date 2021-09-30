const fetch = require("node-fetch");

var {
  scrapeData,
  queryForAllExternalMatches,
  writeMarketsToDB,
} = require("./helper/scraperFunctions.js");

////////////////////////////////////////////////////////////////////////////////
//Get DK matches from mongoDB//

const APIurl = "http://localhost:8000/api";

const matchList = queryForAllExternalMatches().then((matches) => {
  //console.log(teams);
  return matches;
});

////////////////////////////////////////////////////////////////////////////////

//Scrape odds from DK public API//
const getDraftkingsOdds = (URL_for_odds) => {
  let result = scrapeData(URL_for_odds);

  return result;
};

Promise.resolve(matchList)
  .then((data) => {
    return data.filter((o) => {
      return o.sportsbook === "Kambi";
    });
  })
  .then((matchList) => {
    matchList.map((DKmatch) => {
      const matchId = DKmatch.matchId; //matchList[0].matchId;

      const DKEventId = DKmatch.eventId; //matchList[0].eventId; //179725302;

      const DK_Markets_URL = `https://sportsbook.draftkings.com//sites/US-SB/api/v1/event/${DKEventId}?includePromotions=true&format=json`;

      //Promise API call
      const scrapedOdds = getDraftkingsOdds(DK_Markets_URL).then((data) => {
        return data;
      });

      Promise.all([scrapedOdds, matchId]).then((values) => {
        const scrapedOdds = values[0];
        const matchId = values[1];

        const output = scrapedOdds.eventCategories;

        if (output) {
          const playerProps = output.filter((o) => {
            return o.name === "Player Props";
          })[0];

          if (playerProps) {
            const playerProps2 = playerProps.componentizedOffers;

            let stats = ["First Goal", "Goals", "Points", "Shots"];
            for (const stat of stats) {
              const playerMarkets = playerProps2.filter((o) => {
                let condition;
                if (stat === "Points") {
                  condition = "1+ Points";
                } else if (stat === "Shots") {
                  condition = "Shots on Goal";
                } else {
                  condition = "Goal Scorer";
                }
                return o.subcategoryName === condition;
              })[0];

              if (playerMarkets) {
                const pointsMarkets = playerMarkets.offers[0].filter((o) => {
                  return !o.isSuspended && o.isOpen;
                });

                if (stat === "First Goal" || stat === "Goals") {
                  const Outcomes = pointsMarkets[0].outcomes
                    .filter((o) => {
                      let criteria;
                      if (stat === "First Goal") {
                        criteria = stat;
                      } else if (stat === "Goals") {
                        criteria = "To Score";
                      } else {
                        criteria = "Unknown";
                      }
                      return o.criterionName === criteria;
                    })
                    .map((market) => {
                      let myObject;

                      if (stat === "First Goal") {
                        myObject = {
                          player: market.participant,
                          marketType: stat,
                          sportsbook: "Kambi",
                          overPrice: market.oddsDecimal,
                          matchId: matchId,
                        };
                      } else {
                        myObject = {
                          player: market.participant,
                          marketType: stat,
                          sportsbook: "Kambi",
                          overPrice: market.oddsDecimal,
                          handicap: 0.5,
                          matchId: matchId,
                        };
                      }

                      return myObject;
                    });

                  //console.log(Outcomes);
                  writeMarketsToDB(Outcomes);
                } else if (stat === "Points") {
                  const Outcomes = pointsMarkets.map((market) => {
                    var oMarket = market.outcomes.filter((o) => {
                      return !o.label.includes("No");
                    })[0];
                    var uMarket = market.outcomes.filter((o) => {
                      return o.label.includes("No");
                    })[0];
                    var handicap = 0.5;
                    myObject = {
                      player: oMarket.participant,
                      marketType: stat,
                      sportsbook: "Kambi",
                      overPrice: oMarket.oddsDecimal,
                      underPrice: uMarket ? uMarket.oddsDecimal : NaN,
                      handicap: handicap,
                      matchId: matchId,
                    };
                    return myObject;
                  });
                  //   console.log(Outcomes);
                  writeMarketsToDB(Outcomes);
                } else if (stat === "Shots") {
                  const Outcomes = pointsMarkets
                    .filter((o) => {
                      return (
                        o.label === "Shots on goal by the player - Inc. OT"
                      );
                    })
                    .map((market) => {
                      var oMarket = market.outcomes.filter((o) => {
                        return !o.label.includes("Under");
                      })[0];

                      var uMarket = market.outcomes.filter((o) => {
                        return o.label.includes("Under");
                      })[0];

                      var handicap = oMarket
                        ? Number(oMarket.label.replace("Over ", ""))
                        : 0;

                      myObject = {
                        player: oMarket.participant,
                        marketType: stat,
                        sportsbook: "Kambi",
                        overPrice: oMarket.oddsDecimal,
                        underPrice: uMarket ? uMarket.oddsDecimal : NaN,
                        handicap: handicap,
                        matchId: matchId,
                      };

                      return myObject;
                    });

                  writeMarketsToDB(Outcomes);
                }
              }
            }
          }
        }
      });
    });
  });
