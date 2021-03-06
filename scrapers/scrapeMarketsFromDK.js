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

            let stats = ["Points", "Rebounds", "Assists", "First Field Goal"];
            for (const stat of stats) {
              const playerMarkets = playerProps2.filter((o) => {
                return o.subcategoryName === stat;
              })[0];

              if (playerMarkets) {
                const pointsMarkets = playerMarkets.offers[0].filter((o) => {
                  return !o.isSuspended && o.isOpen;
                });

                if (stat === "First Field Goal") {
                  const Outcomes = pointsMarkets[0].outcomes.map((market) => {
                    myObject = {
                      player: market.participant,
                      marketType: stat,
                      sportsbook: "Kambi",
                      overPrice: market.oddsDecimal,
                      matchId: matchId,
                    };

                    return myObject;
                  });

                  writeMarketsToDB(Outcomes);
                } else {
                  const Outcomes = pointsMarkets.map((market) => {
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
