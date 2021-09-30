require("dotenv").config();
const express = require("express");
const app = express();
var path = require("path");
const cron = require("node-cron");

var View = require("./base");

////////////////////////////////////////////////////////////

const matchesPB = require("./scraperFiles/scrapeMatchesFromPB_NFL_Refactor");
const marketsPB = require("./scraperFiles/scrapeMarketsFromPB_NFL_Refactor");

const matchesBovada = require("./scraperFiles/scrapeMatchesFromBovada_NFL_Refactor");
const marketsBovada = require("./scraperFiles/scrapeMarketsFromBovada_NFL_Refactor");

const matchesDK = require("./scraperFiles/scrapeMatchesFromDK_NFL_Refactor");
const marketsDK = require("./scraperFiles/scrapeMarketsFromDK_NFL_Refactor");

const matchesFB = require("./scraperFiles/scrapeMatchesFromFB_NFL_Refactor");
const marketsFB = require("./scraperFiles/scrapeMarketsFromFB_NFL_Refactor");

const matchesRivers = require("./scraperFiles/scrapeMatchesFromRivers_NFL_Refactor");
const marketsRivers = require("./scraperFiles/scrapeMarketsFromRivers_NFL_Refactor");

const matchesSportsBetting = require("./scraperFiles/scrapeMatchesFromSportsBetting_NFL_Refactor");
const marketsSportsBetting = require("./scraperFiles/scrapeMarketsFromSportsbetting_NFL_Refactor");

const matchesWH = require("./scraperFiles/scrapeMatchesFromWH_NFL_Refactor");
const marketsWH = require("./scraperFiles/scrapeMarketsFromWH_NFL_Refactor");

const ArbIdentification = require("./scraperFiles/arbIdentification_Refactor");

////////////////////////////////////////////////////////
var pipeline = [null, null, null];
var cron_cnt = 0;
var start_time = getNow();

console.log("                                             ");
console.log("--------    started  scheduler    -----------");

cron.schedule("0 */15 * * * *", function () {
  console.log(" ---  running a task every 15 minutes --- ");
  tmp = {};

  ////////////////////////////////////////////////////
  //This First

  try {
    matchesPB.scrapePBMatches().then((output) => {
      tmp.matchesPB = { run_time: getNow(), log: output };
    });
  } catch (error) {
    tmp.matchesPB = { run_time: getNow(), log: output };
  }

  ////////////////////////////////////////////////////
  //Then all these

  try {
    matchesBovada.scrapeBovadaMatches().then((output) => {
      tmp.matchesBovada = { run_time: getNow(), log: output };
    });
  } catch (error) {
    tmp.matchesBovada = { run_time: getNow(), log: output };
  }

  try {
    matchesDK.scrapeDKMatches().then((output) => {
      tmp.matchesDK = { run_time: getNow(), log: output };
    });
  } catch (error) {
    tmp.matchesDK = { run_time: getNow(), log: output };
  }

  try {
    matchesFB.scrapeFBMatches().then((output) => {
      tmp.matchesFB = { run_time: getNow(), log: output };
    });
  } catch (error) {
    tmp.matchesFB = { run_time: getNow(), log: output };
  }

  try {
    matchesRivers.scrapeRiversMatches().then((output) => {
      tmp.matchesRivers = { run_time: getNow(), log: output };
    });
  } catch (error) {
    tmp.matchesRivers = { run_time: getNow(), log: output };
  }

  try {
    matchesSportsBetting.scrapeSportsBettingMatches().then((output) => {
      tmp.matchesSportsBetting = { run_time: getNow(), log: output };
    });
  } catch (error) {
    tmp.matchesSportsBetting = { run_time: getNow(), log: output };
  }

  try {
    matchesWH.scrapeWHMatches().then((output) => {
      tmp.matchesWH = { run_time: getNow(), log: output };
    });
  } catch (error) {
    tmp.matchesWH = { run_time: getNow(), log: output };
  }
  ////////////////////////////////////////////////////
  //Then all these

  try {
    marketsPB.scrapePBMarkets().then((output) => {
      tmp.marketsPB = { run_time: getNow(), log: output };
    });
  } catch (error) {
    tmp.marketsPB = { run_time: getNow(), log: output };
  }

  try {
    marketsBovada.scrapeBovadaMarkets().then((output) => {
      tmp.marketsBovada = { run_time: getNow(), log: output };
    });
  } catch (error) {
    tmp.marketsBovada = { run_time: getNow(), log: output };
  }

  try {
    marketsDK.scrapeDKMarkets().then((output) => {
      tmp.marketsDK = { run_time: getNow(), log: output };
    });
  } catch (error) {
    tmp.marketsDK = { run_time: getNow(), log: output };
  }

  try {
    marketsFB.scrapeFBMarkets().then((output) => {
      tmp.marketsFB = { run_time: getNow(), log: output };
    });
  } catch (error) {
    tmp.marketsFB = { run_time: getNow(), log: output };
  }

  try {
    marketsRivers.scrapeRiversMarkets().then((output) => {
      tmp.marketsRivers = { run_time: getNow(), log: output };
    });
  } catch (error) {
    tmp.marketsRivers = { run_time: getNow(), log: output };
  }

  try {
    marketsSportsBetting.scrapeSportsBettingMarkets().then((output) => {
      tmp.marketsSportsBetting = { run_time: getNow(), log: output };
    });
  } catch (error) {
    tmp.marketsSportsBetting = { run_time: getNow(), log: output };
  }

  try {
    marketsWH.scrapeWHMarkets().then((output) => {
      tmp.marketsWH = { run_time: getNow(), log: output };
    });
  } catch (error) {
    tmp.marketsWH = { run_time: getNow(), log: output };
  }

  ////////////////////////////////////////////////////
  //Then finally this

  try {
    ArbIdentification.identifyArbs().then((output) => {
      tmp.arbs = { run_time: getNow(), log: output };
    });
  } catch (error) {
    tmp.arbs = { run_time: getNow(), log: output };
  }

  /////

  for (i = 0; i < 2; i++) {
    pipeline[i] = pipeline[i + 1];
  }
  pipeline[2] = tmp;

  cron_cnt++;
});

const port = process.env.PORT || 8100;

app.set("views", __dirname + "/views");
app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, "public")));

app.get("/", function (req, res, next) {
  var v = new View(res, "index");
  v.render({
    start_time: start_time,
    cron_cnt: cron_cnt,
    pipeline: pipeline,
  });
});

app.listen(port, () => {
  console.log(`scraper-schedule is running at ${port}`);
});

function getNow() {
  var started_at = new Date();
  let date = ("0" + started_at.getDate()).slice(-2);
  let month = ("0" + (started_at.getMonth() + 1)).slice(-2);
  let year = started_at.getFullYear();
  let hours = ("0" + started_at.getHours()).slice(-2);
  let minutes = ("0" + started_at.getMinutes()).slice(-2);
  let seconds = ("0" + started_at.getSeconds()).slice(-2);
  return (
    year +
    "-" +
    month +
    "-" +
    date +
    " " +
    hours +
    ":" +
    minutes +
    ":" +
    seconds
  );
}
