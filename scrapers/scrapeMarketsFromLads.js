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
const getFoxBetOdds = (URL_for_odds) => {
  let result = scrapeData(URL_for_odds);

  return result;
};

Promise.resolve(matchList)
  .then((data) => {
    return data.filter((o) => {
      return o.sportsbook === "Ladbrokes";
    });
  })
  .then((matchList) => {
    matchList.map((FBMatch) => {
      const matchId = FBMatch.matchId; //matchList[1].matchId; //

      const FBEventId = FBMatch.eventId; //matchList[1].eventId; //179725302;
      const FB_Markets_URL = `https://api.ladbrokes.com.au/v2/sport/event-card?id=${FBEventId}`;

      //Promise API call
      const scrapedOdds = getFoxBetOdds(FB_Markets_URL).then((data) => {
        return data;
      });

      Promise.all([scrapedOdds, matchId]).then((values) => {
        const scrapedOdds = values[0];
        const matchId = values[1];

        let marketArray = [];
        for (const [key, value] of Object.entries(scrapedOdds.markets)) {
          marketArray.push(value);
          //console.log(`${key}: ${value}`);
        }

        let priceAndSelectionArray = [];
        for (const [key, value] of Object.entries(scrapedOdds.prices)) {
          let selectionId = key.split(":")[0];

          priceAndSelectionArray.push({
            selectionId: selectionId,
            price: value,
          });
          //selectionArray.push(key);
          //console.log(`${key}: ${value}`);
        }

        let entrantArray = [];
        for (const [key, value] of Object.entries(scrapedOdds.entrants)) {
          entrantArray.push(value);
          //console.log(`${key}: ${value}`);
        }

        //   //const playerProps = scrapedOdds.markets;

        let stats = ["Points", "Rebounds", "Assists", "First Basket"]; //I have no idea what is the naming convention

        //   // //type:
        //   // //"Player Points O/U"
        //   // //let stats = ["First Goalscorer"]; //I have no idea what is the naming convention

        for (const stat of stats) {
          const playerMarkets = marketArray.filter((o) => {
            if (stat === "First Basket") {
              return o.name === "First Player to Score";
            } else {
              return o.name.includes(`Player ${stat} O/U`); //I have no idea what is the naming convention. More probably .type is a unique identifier
            }
          });
          if (playerMarkets) {
            const pointsMarkets = playerMarkets.filter((o) => {
              return (
                o.visible &&
                o.market_status_id === "4bc8fe96-296b-4b4c-aea4-85c94f63b9c6"
              );
            });
            const everyMarket = pointsMarkets.map((market) => {
              const marketId = market.id;
              const handicap = market.handicap;
              const playerName = market.name.split(" - ")[1];
              const startTime = market.advertised_start.seconds;
              return { marketId, handicap, playerName, startTime };
            });
            const everyPrice = priceAndSelectionArray.map((o) => {
              return {
                selectionId: o.selectionId,
                price: 1 + o.price.odds.numerator / o.price.odds.denominator,
              };
            });
            const everyEntrant = entrantArray.map((selection) => {
              const marketId = selection.market_id;
              const selectionName = selection.name;
              const selectionId = selection.id;
              return { marketId, selectionName, selectionId };
            });
            const addEntrants = everyMarket.map((market) => {
              //   //find relevant entrants
              const entrantsForThisMarket = everyEntrant.filter((o) => {
                return market.marketId === o.marketId;
              });
              if (entrantsForThisMarket) {
                //console.log(entrantsForThisMarket);
                const addEntrant = entrantsForThisMarket.map((entry) => {
                  let appendedEntry = entry;
                  //console.log(entry.selectionId);
                  const pricesForThisSelection = everyPrice.filter((o) => {
                    return entry.selectionId === o.selectionId;
                  })[0];
                  if (pricesForThisSelection) {
                    // console.log(pricesForThisSelection);
                    appendedEntry["price"] = pricesForThisSelection.price;
                    appendedEntry["marketInfo"] = market;
                    return appendedEntry;
                  }
                });
                return addEntrant;
              }
            });

            //console.log(addEntrants);

            if (!(stat === "First Basket")) {
              const Outcomes = addEntrants.map((o) => {
                var oMarket = o.filter((o) => {
                  return o.selectionName === "Over";
                })[0];
                var uMarket = o.filter((o) => {
                  return o.selectionName === "Under";
                })[0];
                var handicap = oMarket
                  ? Number(oMarket.marketInfo.handicap)
                  : Number(uMarket.marketInfo.handicap);
                var player = oMarket
                  ? oMarket.marketInfo.playerName
                  : uMarket.marketInfo.playerName;
                var myObject = {
                  player: player,
                  marketType: stat,
                  sportsbook: "Ladbrokes",
                  overPrice: Number(oMarket.price),
                  underPrice: uMarket ? Number(uMarket.price) : NaN,
                  handicap: handicap,
                  matchId: matchId,
                };
                return myObject;
              });
              writeMarketsToDB(Outcomes);
            } else {
              const FirstBaskets = addEntrants[0].map((o) => {
                var myObject = {
                  player: o.selectionName.split(" (")[0],
                  marketType: stat,
                  sportsbook: "Ladbrokes",
                  overPrice: Number(o.price),
                  matchId: matchId,
                };
                return myObject;
              });
              writeMarketsToDB(FirstBaskets);
            }
          }
        }
      });
    });
  });
// let Outcomes;

// Outcomes = pointsMarkets.map((market) => {
//   if (market.selection) {
//     var oMarket = market.selection.filter((o) => {
//       return o.type === "Over";
//     })[0];
//     var uMarket = market.selection.filter((o) => {
//       return o.type === "Under";
//     })[0];
//     var handicap = oMarket
//       ? Number(oMarket.name.replace(/[^0-9\.]+/g, ""))
//       : Number(uMarket.name.replace(/[^0-9\.]+/g, ""));
//     var player = market.name.split(" total")[0];
//     myObject = {
//       player: player,
//       marketType: stat,
//       sportsbook: "FoxBet",
//       overPrice: Number(oMarket.odds.dec),
//       underPrice: uMarket ? Number(uMarket.odds.dec) : NaN,
//       handicap: handicap,
//       matchId: matchId,
//     };
//     return myObject;
//   }
// });

//     if (stat === "First Goalscorer") {
//       const market = pointsMarkets[0]    ;

//       if (market) {
//         if (market.selection) {
//           Outcomes = market.selection.map((outcome) => {
//             if (!outcome.suspended) {
//               myObject = {
//                 player: outcome.name,
//                 marketType: stat,
//                 sportsbook: "FoxBet",
//                 overPrice: Number(outcome.odds.dec),
//                 matchId: matchId,
//               };
//               return myObject;
//             }
//           });
//         }
//       }
//     } else {
//       //console.log(pointsMarkets);
//       Outcomes = pointsMarkets.map((market) => {
//         if (market.selection) {
//           var oMarket = market.selection.filter((o) => {
//             return o.type === "Over";
//           })[0];
//           var uMarket = market.selection.filter((o) => {
//             return o.type === "Under";
//           })[0];
//           var handicap = oMarket
//             ? Number(oMarket.name.replace(/[^0-9\.]+/g, ""))
//             : Number(uMarket.name.replace(/[^0-9\.]+/g, ""));
//           var player = market.name.split(" total")[0];
//           myObject = {
//             player: player,
//             marketType: stat,
//             sportsbook: "FoxBet",
//             overPrice: Number(oMarket.odds.dec),
//             underPrice: uMarket ? Number(uMarket.odds.dec) : NaN,
//             handicap: handicap,
//             matchId: matchId,
//           };
//           return myObject;
//         }
//       });
//     }

//     var filtered = Outcomes.filter(function (x) {
//       return x !== undefined;
//     });

//     //console.log(filtered);

//     //Not yet writing to DB

//     writeMarketsToDB(filtered);
//   }
// }
// }
// });
// });
// });
