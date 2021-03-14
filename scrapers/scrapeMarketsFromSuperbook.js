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

                writeMarketsToDB(filteredOutcomes);
              });
            }
          }
        }
      });
    });
  });
