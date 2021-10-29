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
  // const a = await deleteOneSportsbookMarketsFromDB("FoxBet");
  let matchList = await queryForAllExternalMatches();
  matchList = matchList.filter((o) => {
    return o.sportsbook === "FoxBet" && o.league === "NBA";
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
      let stats = ["Points", "Rebounds", "Assists", "Threes"];

      for (const stat of stats) {
        await InnerLoopPerMatchPerStat(playerProps, matchId, stat);
      }
    }
  }
};

const InnerLoopPerMatchPerStat = async (playerProps, matchId, stat) => {
  let type;
  if (stat === "Points") {
    type = "BASKETBALL:FTOU:PLRPTS";
  } else if (stat === "Rebounds") {
    type = "BASKETBALL:FTOU:PLRREB";
  } else if (stat === "Assists") {
    type = "BASKETBALL:FTOU:PLRASS";
  } else if (stat === "Threes") {
    type = "BASKETBALL:FTOU:PLR3PT";
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

    Outcomes = pointsMarkets.map((market) => {
      if (market.selection) {
        const thisPlayer =
          market.attributes.attrib[0].value +
          " " +
          market.attributes.attrib[3].value;

        const thisHandicap = market.attributes.attrib[5].value;

        const Selections = market.selection.map((o) => {
          if (!o.suspended) {
            myObject = {
              player: thisPlayer,
              marketType: stat,
              sportsbook: "FoxBet",
              overPrice: o.name.includes("over")
                ? Number(o.odds.dec)
                : undefined,
              underPrice: o.name.includes("over")
                ? undefined
                : Number(o.odds.dec),
              handicap: thisHandicap,
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
  console.log(numFruits);
  //console.log("End");
};
