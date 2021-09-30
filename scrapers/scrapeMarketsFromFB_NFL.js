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

deleteOneSportsbookMarketsFromDB("FoxBet");

const matchList = queryForAllExternalMatches().then((matches) => {
  return matches;
});

////////////////////////////////////////////////////////////////////////////////

//Scrape odds from DK public API//
const getFoxBetOdds = (URL_for_odds) => {
  let result = scrapeData(URL_for_odds);

  return result;
};

Promise.resolve(matchList)
  .then((data) => {
    return data.filter((o) => {
      return o.sportsbook === "FoxBet";
    });
  })
  .then((matchList) => {
    matchList.map((FBMatch) => {
      const matchId = FBMatch.matchId; //matchList[1].matchId; //

      const FBEventId = FBMatch.eventId; //matchList[1].eventId; //179725302;

      const FB_Markets_URL = `https://sports.co.foxbet.com/sportsbook/v1/api/getEvent?eventId=${FBEventId}&channelId=17&locale=en-us&siteId=536870914`;

      //Promise API call
      const scrapedOdds = getFoxBetOdds(FB_Markets_URL).then((data) => {
        return data;
      });

      Promise.all([scrapedOdds, matchId]).then((values) => {
        const scrapedOdds = values[0];
        const matchId = values[1];

        const playerProps = scrapedOdds.markets;

        let stats = ["Passing", "Rushing", "Receiving", "FirstTD"];

        for (const stat of stats) {
          let type;
          if (stat === "Passing") {
            type = "AMFOOT:FTOT:PPY";
          } else if (stat === "Rushing") {
            type = "AMFOOT:FTOT:PRY";
          } else if (stat === "Receiving") {
            type = "AMFOOT:FTOT:PREY";
          } else if (stat === "FirstTD") {
            type = "AMFOOT:FTOT:P1TD";
          }

          const playerMarkets = playerProps.filter((o) => {
            return o.type === type;
          });

          if (playerMarkets) {
            const pointsMarkets = playerMarkets.filter((o) => {
              return !o.suspended;
            });

            let Outcomes;
            if (stat === "FirstTD") {
              const market = pointsMarkets[0];

              if (market) {
                if (market.selection) {
                  Outcomes = market.selection.map((outcome) => {
                    if (!outcome.suspended) {
                      myObject = {
                        player: outcome.name,
                        marketType: stat,
                        sportsbook: "FoxBet",
                        overPrice: Number(outcome.odds.dec),
                        matchId: matchId,
                      };
                      return myObject;
                    }
                  });

                  var filtered = Outcomes.filter(function (x) {
                    return x !== undefined;
                  });

                  //console.log(filtered);
                  writeMarketsToDB(filtered);
                }
              }
            } else {
              Outcomes = pointsMarkets.map((market) => {
                if (market.selection) {
                  const Selections = market.selection.map((o) => {
                    if (!o.suspended) {
                      myObject = {
                        player: o.name.includes("Over")
                          ? o.name.split(" Over")[0]
                          : o.name.split(" Under")[0],
                        marketType: stat,
                        sportsbook: "FoxBet",
                        overPrice: o.name.includes("Over")
                          ? Number(o.odds.dec)
                          : undefined,
                        underPrice: o.name.includes("Over")
                          ? undefined
                          : Number(o.odds.dec),
                        handicap: o.name.includes("Over")
                          ? o.name.split(" Over ")[1]
                          : o.name.split(" Under ")[1],
                        matchId: matchId,
                      };
                      return myObject;
                    }
                  });

                  //console.log(Selections);

                  // loop over players and handicaps to see if there is an under to their over

                  const revisedOutcomes = Selections.map((outcome) => {
                    if (outcome) {
                      if (outcome.overPrice && outcome.player) {
                        const underSelection = Selections.filter((o) => {
                          if (o && outcome) {
                            return (
                              o.player === outcome.player &&
                              o.handicap === outcome.handicap &&
                              o.underPrice
                            );
                          }
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
              });
            }
          }
        }
      });
    });
  });
