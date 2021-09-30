const fetch = require("node-fetch");

var {
  scrapeData,
  queryForAllExternalMatches,
  writeMarketsToDB,
  deleteOneSportsbookMarketsFromDB,
} = require("./helper/scraperFunctions.js");

////////////////////////////////////////////////////////////////////////////////
//Get DK matches from mongoDB//

const APIurl = "http://localhost:8000/api";

deleteOneSportsbookMarketsFromDB("DraftKings");

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
      return o.sportsbook === "DraftKings";
    });
  })
  .then((matchList) => {
    matchList.map((DKmatch) => {
      const matchId = DKmatch.matchId; //matchList[0].matchId;

      const DKEventId = DKmatch.eventId; //matchList[0].eventId; //179725302;

      const DK_Markets_URL = `https://sportsbook-us-co.draftkings.com//sites/US-CO-SB/api/v2/event/${DKEventId}?includePromotions=true&format=json`;

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
            return (
              o.name === "TD Scorers" ||
              o.name === "QB Props" ||
              o.name === "RB/WR Props"
            );
          });

          //console.log(playerProps);

          if (playerProps) {
            playerProps.map((Category) => {
              const playerProps2 = Category.componentizedOffers;

              let stats = ["Passing", "Rushing", "Receiving", "FirstTD"];
              for (const stat of stats) {
                const playerMarkets = playerProps2.filter((o) => {
                  let condition;
                  if (stat === "Passing") {
                    condition = "Pass Yds";
                  } else if (stat === "Rushing") {
                    condition = "Rush Yds";
                  } else if (stat === "Receiving") {
                    condition = "Rec Yds";
                  } else if (stat === "FirstTD") {
                    condition = "TD Scorer";
                  } else {
                    condition = "No Idea";
                  }
                  return o.subcategoryName === condition;
                })[0];

                if (playerMarkets) {
                  //console.log(playerMarkets.offers[0][0].outcomes);

                  const pointsMarkets = playerMarkets.offers[0].filter((o) => {
                    return !o.isSuspended && o.isOpen;
                  });

                  if (stat === "FirstTD") {
                    //console.log(pointsMarkets[0].outcomes);
                    const Outcomes = pointsMarkets[0].outcomes
                      .filter((o) => {
                        let criteria;
                        if (stat === "FirstTD") {
                          criteria = "First Scorer";
                        } else {
                          criteria = "Unknown";
                        }
                        return o.criterionName === criteria;
                      })
                      .map((market) => {
                        //console.log(market);
                        let myObject;

                        myObject = {
                          player: market.label,
                          marketType: stat,
                          sportsbook: "DraftKings",
                          overPrice: market.oddsDecimal,
                          matchId: matchId,
                        };

                        return myObject;
                      });

                    //console.log(Outcomes);
                    writeMarketsToDB(Outcomes);
                  } else {
                    const Outcomes = pointsMarkets.map((market) => {
                      var oMarket = market.outcomes.filter((o) => {
                        return !o.label.includes("Under");
                      })[0];

                      var uMarket = market.outcomes.filter((o) => {
                        return o.label.includes("Under");
                      })[0];

                      var handicap = oMarket ? Number(oMarket.line) : 0;

                      myObject = {
                        player: oMarket.participant,
                        marketType: stat,
                        sportsbook: "DraftKings",
                        overPrice: oMarket.oddsDecimal,
                        underPrice: uMarket ? uMarket.oddsDecimal : NaN,
                        handicap: handicap,
                        matchId: matchId,
                      };

                      return myObject;
                    });

                    // console.log(Outcomes);
                    writeMarketsToDB(Outcomes);
                  }
                }
              }
            });
          }
        }
      });
    });
  });
