const fetch = require("node-fetch");

var {
  scrapeData,
  queryForAllExternalMatches,
  writeMarketsToDB,
  deleteOneSportsbookMarketsFromDB,
} = require("./helper/scraperFunctions.js");

////////////////////////////////////////////////////////////////////////////////
//Get BV matches from mongoDB//

const APIurl = "http://localhost:8000/api";

////////////////////////////////////////////////////////////////////////////////

exports.scrapeRiversMarkets = async () => {
  const a = await deleteOneSportsbookMarketsFromDB("Rivers");
  let matchList = await queryForAllExternalMatches();
  matchList.filter((o) => {
    return o.sportsbook === "Rivers";
  });

  ///////////////////////////////////////////////////////////////////////////////////////////

  for (let i = 0; i < matchList.length; i++) {
    var BVmatch = matchList[i];
    const matchId = BVmatch.matchId; //matchList[0].matchId;

    const BVEventId = BVmatch.eventId; //matchList[0].eventId; //179725302;

    const BV_Markets_URL = `https://eu-offering.kambicdn.org/offering/v2018/rsiusco/betoffer/event/${BVEventId}.json?lang=en_US&market=US-CO&includeParticipants=true`;

    const scrapedOdds = await scrapeData(BV_Markets_URL);

    let stats = ["Passing", "Rushing", "Receiving", "FirstTD"];
    for (const stat of stats) {
      var MarketOutputs = InsideEachMatchStat(scrapedOdds, matchId, stat);
      if (MarketOutputs) {
        //console.log(MarketOutputs.length);
        //await writeMarketsToDB(MarketOutputs[0]);
        for (let i = 0; i < MarketOutputs.length; i++) {
          var Z = await mapLoop(MarketOutputs[i]);
        }
        //console.log("Wrote something");
      }
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

/////Start of function
const InsideEachMatchStat = (scrapedOdds, matchId, stat) => {
  if (scrapedOdds.betOffers) {
    const playerMarkets = scrapedOdds.betOffers.filter((o) => {
      let condition;
      if (stat === "Passing") {
        condition = "Total Passing Yards by the Player";
      } else if (stat === "Rushing") {
        condition = "Total Rushing Yards by the Player";
      } else if (stat === "Receiving") {
        condition = "Total Receiving Yards by the Player";
      } else if (stat === "FirstTD") {
        condition = "First Touchdown Scorer";
      } else {
        condition = "No Idea";
      }
      return o.criterion.label === condition;
    });

    if (playerMarkets) {
      var OutcomesOuter = playerMarkets.map((o) => {
        if (o) {
          //console.log(o);
          const OUTS = o.outcomes.map((selection) => {
            //console.log(selection);
            let playerName = selection.participant;
            if (playerName) {
              playerName = `${playerName.split(", ")[1]} ${
                playerName.split(", ")[0]
              }`;

              let overPrice;
              let underPrice;
              let handicap;
              if (selection.label === "Over") {
                overPrice = selection.odds / 1000;
                handicap = selection.line / 1000;
              } else if (selection.label === "Under") {
                underPrice = selection.odds / 1000;
                handicap = selection.line / 1000;
              } else {
                overPrice = selection.odds / 1000;
              }
              myObject = {
                player: playerName,
                marketType: stat,
                sportsbook: "Rivers",
                overPrice: overPrice,
                underPrice: underPrice,
                handicap: handicap,
                matchId: matchId,
              };

              //console.log(myObject);
              return myObject;
            }
          });

          //console.log(OUTS);

          // loop over players and handicaps to see if there is an under to their over

          const revisedOutcomes = OUTS.map((outcome) => {
            if (outcome) {
              const underSelection = OUTS.filter((o) => {
                if (o) {
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
                  newOutcome.underPrice = underSelection[0].underPrice;
                }
                return newOutcome;
              }
            }
          });

          const filteredOutcomes = revisedOutcomes
            .filter((o) => {
              return o; //removes undefineds
            })
            .filter((o) => {
              return !o.player.includes("undefined");
            });

          return filteredOutcomes;
        }
      });
      return OutcomesOuter;
    }
  }
};
//////////////////////End of function
