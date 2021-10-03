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

////////////////////////////////////////////////////////////////////////////////
exports.scrapeFBMarkets = async () => {
  const a = await deleteOneSportsbookMarketsFromDB("FoxBet");
  let matchList = await queryForAllExternalMatches();
  matchList = matchList.filter((o) => {
    return o.sportsbook === "FoxBet";
  });

  for (let i = 0; i < matchList.length; i++) {
    var FBMatch = matchList[i];

    const matchId = FBMatch.matchId; //matchList[1].matchId; //

    const FBEventId = FBMatch.eventId; //matchList[1].eventId; //179725302;

    const FB_Markets_URL = `https://sports.co.foxbet.com/sportsbook/v1/api/getEvent?eventId=${FBEventId}&channelId=17&locale=en-us&siteId=536870914`;

    //Promise API call
    const scrapedOdds = await scrapeData(FB_Markets_URL);

    const playerProps = scrapedOdds.markets;

    if (playerProps) {
      let stats = ["Passing", "Rushing", "Receiving", "FirstTD"];

      for (const stat of stats) {
        await InnerLoopPerMatchPerStat(playerProps, matchId, stat);
      }
    }
  }
};

const InnerLoopPerMatchPerStat = async (playerProps, matchId, stat) => {
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
    let BigOuts = [];
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

          BigOuts.push(filtered);
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
                    newOutcome.underPrice = underSelection[0].underPrice;
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
          return filteredOutcomes;
        }
      });

      BigOuts.push(Outcomes);
    }
    if (BigOuts.length) {
      //console.log(BigOuts);
      //await writeMarketsToDB(BigOuts);
      for (let i = 0; i < BigOuts.length; i++) {
        let data = BigOuts[i];
        for (let j = 0; j < data.length; j++) {
          //console.log(data[j]);
          if (data[j].length) {
            var Z = await mapLoop(data[j]);
          }
        }
      }
      //console.log("Wrote something");
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
