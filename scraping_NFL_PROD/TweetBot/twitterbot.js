require("dotenv").config({ path: __dirname + "/.env" });

const twitter = require("twitter-lite");
const client = new twitter({
  subdomain: "api", // "api" is the default (change for other subdomains)
  version: "1.1", // version "1.1" is the default (change for other subdomains)
  consumer_key: process.env.CONSUMER_KEY, // from Twitter.
  consumer_secret: process.env.CONSUMER_SECRET, // from Twitter.
  access_token_key: process.env.ACCESS_TOKEN_KEY, // from your User (oauth_token)
  access_token_secret: process.env.ACCESS_TOKEN_SECRET, // from your User (oauth_token_secret)
});

//  //verify twitter connection
// client
//   .get("account/verify_credentials")
//   .then((results) => {
//     console.log("results", results);
//   })
//   .catch(console.error);

const fetch = require("node-fetch");
const API = "http://localhost:8000/api";

///////////////////////////////////////////////////////////////////////////
//get all matches
const queryForAllArbs = () => {
  async function getAllArbsInDB() {
    return fetch(`${API}/arb/all`).then((arbs) => {
      return arbs.json();
    });
  }

  let arbList = getAllArbsInDB();

  return arbList;
};

const TweetMiddles = async (minimumMiddle) => {
  console.log(
    "Checking for middles >=" + minimumMiddle + " points to tweet..."
  );
  const data = await queryForAllArbs();
  if (data.error) {
    console.log(data.error);
  } else {
    if (data) {
      const Output = data.map((arb) => {
        if (arb.overMarketId && arb.underMarketId) {
          if (arb.overMarketId.matchId) {
            let league = arb.overMarketId.matchId.league;
            let matchName = arb.overMarketId.matchId.name;
            let matchId = arb.overMarketId.matchId._id;
            let player = arb.overMarketId.player;
            let marketType = arb.overMarketId.marketType;
            let Ohandicap = arb.overMarketId.handicap;
            let Uhandicap = arb.underMarketId.handicap;
            let overSportsbook = arb.overMarketId.sportsbook;
            let overPrice = arb.overMarketId.overPrice;

            let underSportsbook = arb.underMarketId.sportsbook;
            let underPrice = arb.underMarketId.underPrice;

            let overString = `Over $${overPrice.toFixed(
              2
            )} (${overSportsbook})`;
            let underString = `Under $${underPrice.toFixed(
              2
            )} (${underSportsbook})`;
            return {
              arbId: arb._id,
              ArbOrMiddle: arb.ArbOrMiddle,
              matchId: matchId,
              matchPath: `/match/${matchId}`,
              league: league,
              matchName: matchName,
              player: player,
              marketType: marketType,
              Ohandicap: Ohandicap,
              Uhandicap: Uhandicap,
              overString: overString,
              underString: underString,
              bookPerc: 1 / overPrice + 1 / underPrice,
              middleSize: Uhandicap - Ohandicap,
            };
          }
        }
      });

      const middleInstances = Output.filter((o) => {
        if (o) {
          return o.ArbOrMiddle === "middle" && o.middleSize >= minimumMiddle;
        }
      });

      const sortedMiddleInstances = middleInstances
        .sort((a, b) => {
          return a.bookPerc - b.bookPerc;
        })
        .sort((a, b) => {
          return b.middleSize - a.middleSize;
        });

      if (sortedMiddleInstances) {
        let OutputVar = [];
        let OutputId = [];

        sortedMiddleInstances.forEach((i) => {
          const thisVar = i.player + "|" + i.marketType + "|" + i.matchPath;

          if (!OutputVar.includes(thisVar)) {
            OutputVar.push(thisVar);
            OutputId.push(i.arbId);
          }
        });

        const MiddlesUnique = sortedMiddleInstances.filter((o) => {
          return OutputId.includes(o.arbId);
        });

        if (MiddlesUnique) {
          const allAlertsInDB = await queryForAllAlerts();

          const allRecentAlertsInDB = allAlertsInDB.map((alert) => {
            return alert.matchId + alert.player + alert.marketType;
          });

          const Candidates = MiddlesUnique.filter((middle) => {
            const thisIndex =
              middle.matchId + middle.player + middle.marketType;
            const inDB = allRecentAlertsInDB
              ? allRecentAlertsInDB.includes(thisIndex)
              : false;
            return !inDB;
          });

          if (Candidates.length) {
            const myMiddle = Candidates[0];
            //console.log(myMiddle);
            const TweetString = createTweetStringMiddle(myMiddle);
            const TweetStringWithHashtags = addHashtags(TweetString);
            const twitResponse = await Tweet(TweetStringWithHashtags);
            console.log(twitResponse);
            const alert = {
              medium: "Twitter @playerpropodds",
              alertText: TweetString,
              matchId: myMiddle.matchId,
              player: myMiddle.player,
              marketType: myMiddle.marketType,
            };
            const alertResponse = await createAlertInDB(alert);
          }
        }
      }
    }
  }
  console.log("Done tweeting middles.");
};

const createTweetStringMiddle = (middle) => {
  return `${middle.middleSize} point middle\r\n${middle.league}: ${middle.player} ${middle.marketType}\r\n${middle.Ohandicap} ${middle.overString}\r\n${middle.Uhandicap} ${middle.underString}`;
};

const createTweetStringArb = (arb) => {
  return `${arb.bookPerc.toFixed(3) * 100}% arb\r\n${arb.league}: ${
    arb.player
  } ${arb.marketType}\r\n${arb.Ohandicap ? arb.Ohandicap : ""} ${
    arb.overString
  }\r\n${arb.Uhandicap ? arb.Uhandicap : ""} ${arb.underString}`;
};

const addHashtags = (string) => {
  return `${string}\r\n#GamblingTwitter #Arbitrage`;
};

const Tweet = (TweetString) => {
  return client
    .post("statuses/update", { status: TweetString })
    .then((result) => {
      return `You successfully tweeted this : "\r\n${result.text}"`;
    })
    .catch(console.error);
};

const createAlertInDB = async (alert) => {
  async function creation() {
    return fetch(`${API}/alert/create`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(alert),
    }).then((response, err) => {
      if (err) {
        console.log(err);
      } else {
        console.log("Alert written successfully to DB");
        //return "Saved";
      }
    });
  }

  let result = await creation();

  return result;
};

const queryForAllAlerts = async () => {
  async function getAllAlertsInDB() {
    return fetch(`${API}/alert/all`).then((alerts) => {
      return alerts.json();
    });
  }

  let alertList = await getAllAlertsInDB();

  return alertList;
};
///////////////////////////////////////////////////////////////////

// const minimumMiddle = 5;
// TweetArbs(minimumMiddle);

const TweetArbs = async (maxBookPerc) => {
  console.log("Checking for arbs <=" + maxBookPerc * 100 + "% to tweet...");
  const data = await queryForAllArbs();
  if (data.error) {
    console.log(data.error);
  } else {
    if (data) {
      const Output = data.map((arb) => {
        if (arb.overMarketId && arb.underMarketId) {
          if (arb.overMarketId.matchId) {
            let league = arb.overMarketId.matchId.league;
            let matchName = arb.overMarketId.matchId.name;
            let matchId = arb.overMarketId.matchId._id;
            let player = arb.overMarketId.player;
            let marketType = arb.overMarketId.marketType;
            let Ohandicap = arb.overMarketId.handicap;
            let Uhandicap = arb.underMarketId.handicap;
            let overSportsbook = arb.overMarketId.sportsbook;
            let overPrice = arb.overMarketId.overPrice;

            let underSportsbook = arb.underMarketId.sportsbook;
            let underPrice = arb.underMarketId.underPrice;

            let overString = `Over $${overPrice.toFixed(
              2
            )} (${overSportsbook})`;
            let underString = `Under $${underPrice.toFixed(
              2
            )} (${underSportsbook})`;
            return {
              arbId: arb._id,
              ArbOrMiddle: arb.ArbOrMiddle,
              matchId: matchId,
              matchPath: `/match/${matchId}`,
              league: league,
              matchName: matchName,
              player: player,
              marketType: marketType,
              Ohandicap: Ohandicap,
              Uhandicap: Uhandicap,
              overString: overString,
              underString: underString,
              bookPerc: 1 / overPrice + 1 / underPrice,
              middleSize: Uhandicap - Ohandicap,
            };
          }
        }
      });

      const arbInstances = Output.filter((o) => {
        if (o) {
          return o.ArbOrMiddle === "arb" && o.bookPerc <= maxBookPerc;
        }
      });

      const sortedArbInstances = arbInstances
        .sort((a, b) => {
          return b.middleSize - a.middleSize;
        })
        .sort((a, b) => {
          return a.bookPerc - b.bookPerc;
        });

      if (sortedArbInstances) {
        let OutputVar = [];
        let OutputId = [];

        sortedArbInstances.forEach((i) => {
          const thisVar = i.player + "|" + i.marketType + "|" + i.matchPath;

          if (!OutputVar.includes(thisVar)) {
            OutputVar.push(thisVar);
            OutputId.push(i.arbId);
          }
        });

        const ArbsUnique = sortedArbInstances.filter((o) => {
          return OutputId.includes(o.arbId);
        });

        if (ArbsUnique) {
          const allAlertsInDB = await queryForAllAlerts();

          const allRecentAlertsInDB = allAlertsInDB.map((alert) => {
            return alert.matchId + alert.player + alert.marketType;
          });

          const Candidates = ArbsUnique.filter((arb) => {
            const thisIndex = arb.matchId + arb.player + arb.marketType;
            const inDB = allRecentAlertsInDB
              ? allRecentAlertsInDB.includes(thisIndex)
              : false;
            return !inDB;
          });

          if (Candidates.length) {
            const myArb = Candidates[0];
            // console.log(myArb);
            const TweetString = createTweetStringArb(myArb);
            //console.log(TweetString);
            const TweetStringWithHashtags = addHashtags(TweetString);
            const twitResponse = await Tweet(TweetStringWithHashtags);
            console.log(twitResponse);
            const alert = {
              medium: "Twitter @playerpropodds",
              alertText: TweetString,
              matchId: myArb.matchId,
              player: myArb.player,
              marketType: myArb.marketType,
            };
            const alertResponse = await createAlertInDB(alert);
          }
        }
      }
    }
  }
  console.log("Done tweeting arbs.");
};

module.exports = {
  TweetArbs,
  TweetMiddles,
};
