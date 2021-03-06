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
      return o.sportsbook === "TAB";
    });
  })
  .then((matchList) => {
    matchList.map((WHmatch) => {
      const matchId = WHmatch.matchId; //matchList[1].matchId; //

      const WHEventId = WHmatch.eventId; //matchList[1].eventId; //179725302;

      const WH_Markets_URL = `https://api.beta.tab.com.au/v1/tab-info-service/sports/Basketball/competitions/NBA/matches/${WHEventId}/markets?jurisdiction=VIC`;

      //Promise API call
      const scrapedOdds = getWilliamHillOdds(WH_Markets_URL).then((data) => {
        return data;
      });

      Promise.all([scrapedOdds, matchId]).then((values) => {
        const scrapedOdds = values[0];
        const matchId = values[1];

        const playerProps = scrapedOdds.markets.filter((o) => {
          return o.bettingStatus === "Open" && !o.inPlay;
        });

        let stats = ["Points", "Assists", "Rebounds"];

        //o.betOption === "Player Points"

        for (const stat of stats) {
          const playerMarkets = playerProps.filter((o) => {
            return o.betOption === `Player ${stat}`; //I have no idea what is the naming convention. More probably .type is a unique identifier
          });
          if (playerMarkets) {
            let Outcomes;
            playerMarkets.map((thisPointsMarket) => {
              Outcomes = thisPointsMarket.propositions.map((outcome) => {
                if (outcome.isOpen) {
                  let playerName;
                  let handicap = Number(outcome.name.replace(/[^0-9\.]+/g, ""));
                  let overPrice;
                  let underPrice;
                  if (outcome.name.includes("Over")) {
                    playerName = outcome.name.split(" Over")[0];
                    overPrice = Number(outcome.returnWin);
                  } else if (outcome.name.includes("Under")) {
                    playerName = outcome.name.split(" Under")[0];
                    underPrice = Number(outcome.returnWin);
                  } else {
                    playerName = outcome.name;
                    overPrice = Number(outcome.returnWin);
                  }
                  myObject = {
                    player: playerName,
                    marketType: stat,
                    sportsbook: "TAB",
                    overPrice: overPrice,
                    underPrice: underPrice,
                    handicap: handicap,
                    matchId: matchId,
                  };
                  return myObject;
                }
              });

              //   // loop over players and handicaps to see if there is an under to their over
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

              writeMarketsToDB(filteredOutcomes);
            });
          }
        }
      });
    });
  });
