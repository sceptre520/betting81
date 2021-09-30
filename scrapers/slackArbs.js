const { queryForAllArbs, postInSlack } = require("./helper/scraperFunctions");

const yourWebHookURL =
  "https://hooks.slack.com/services/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";

let Z = queryForAllArbs();

Promise.resolve(Z).then((arbs) => {
  const Output = arbs.map((arb) => {
    let league = arb.overMarketId.matchId.league;
    let matchName = arb.overMarketId.matchId.name;
    let player = arb.overMarketId.player;
    let marketType = arb.overMarketId.marketType;
    let handicap = arb.overMarketId.handicap;
    let overSportsbook = arb.overMarketId.sportsbook;
    let overPrice = arb.overMarketId.overPrice;

    let underSportsbook = arb.underMarketId.sportsbook;
    let underPrice = arb.underMarketId.underPrice;

    let overString = `O $${overPrice.toFixed(2)} (${overSportsbook})`;
    let underString = `U $${underPrice.toFixed(2)} (${underSportsbook})`;

    let text = `${league}: ${matchName}\n*${player} - ${marketType} - ${handicap}*\n${overString}\n${underString}`;

    return text;
  });

  sections = Output.map((text) => {
    return {
      type: "section",
      text: {
        type: "mrkdwn",
        text: text,
      },
    };
  });

  let payload = sections;
  postInSlack(yourWebHookURL, { text: "MyArbBot", blocks: payload });
});
