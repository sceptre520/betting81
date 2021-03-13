const fetch = require("node-fetch");

////////////////////////////////////////////////////////////////////////////////
//Get DK matches from mongoDB//

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

// Promise.resolve(matchList).then((data) => {
//   console.log(matchList);
// });

////////////////////////////////////////////////////////////////////////////////

//Scrape odds from DK public API//
const getFoxBetOdds = (URL_for_odds) => {
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

        //console.log(playerProps);

        let stats = ["Points", "Rebounds", "Assists"]; //I have no idea what is the naming convention

        //type:
        //"BASKETBALL:FTOU:PLRPTS" //Points
        //"BASKETBALL:FTOU:PLRREB"
        //"BASKETBALL:FTOU:PLRASS"
        //let stats = ["First Goalscorer"]; //I have no idea what is the naming convention

        for (const stat of stats) {
          let type;
          if (stat === "Points") {
            type = "BASKETBALL:FTOU:PLRPTS";
          } else if (stat === "Rebounds") {
            type = "BASKETBALL:FTOU:PLRREB";
          } else if (stat === "Assists") {
            type = "BASKETBALL:FTOU:PLRASS";
          }

          const playerMarkets = playerProps.filter((o) => {
            return o.type === type; //I have no idea what is the naming convention. More probably .type is a unique identifier
          });

          if (playerMarkets) {
            const pointsMarkets = playerMarkets.filter((o) => {
              return !o.suspended && o.displayed;
            });
            console.log(pointsMarkets);
            let Outcomes;
            if (stat === "First Goalscorer") {
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
                }
              }
            } else {
              //console.log(pointsMarkets);
              Outcomes = pointsMarkets.map((market) => {
                if (market.selection) {
                  var oMarket = market.selection.filter((o) => {
                    return o.type === "Over";
                  })[0];
                  var uMarket = market.selection.filter((o) => {
                    return o.type === "Under";
                  })[0];
                  var handicap = oMarket
                    ? Number(oMarket.name.replace(/[^0-9\.]+/g, ""))
                    : Number(uMarket.name.replace(/[^0-9\.]+/g, ""));
                  var player = market.name.split(" total")[0];
                  myObject = {
                    player: player,
                    marketType: stat,
                    sportsbook: "FoxBet",
                    overPrice: Number(oMarket.odds.dec),
                    underPrice: uMarket ? Number(uMarket.odds.dec) : NaN,
                    handicap: handicap,
                    matchId: matchId,
                  };
                  return myObject;
                }
              });
            }

            var filtered = Outcomes.filter(function (x) {
              return x !== undefined;
            });

            //console.log(filtered);

            //Not yet writing to DB

            writeMarketsToDB(filtered);
          }
        }
      });
    });
  });
////////////////////////////////////////////////////////////////////////////////

//Pull out markets from PB API one event at a time, and write to DB//

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
