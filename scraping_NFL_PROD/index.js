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

var run = async() => {
  tmp = {};

  ////////////////////////////////////////////////////
  //This First
  try {
    var res_matchesPB = await matchesPB.scrapePBMatches()
    tmp.matchesPB = { run_time: getNow(), log: res_matchesPB };
  } catch (error) {}

  ////////////////////////////////////////////////////
  //Then all these
  try {
      var [res_matchesBovada, res_matchesDK, res_matchesFB, res_matchesRivers, res_matchesSportsBetting, res_matchesWH] = await Promise.all([
                                        matchesBovada.scrapeBovadaMatches(),
                                        matchesDK.scrapeDKMatches(),
                                        matchesFB.scrapeFBMatches(),
                                        matchesRivers.scrapeRiversMatches(),
                                        matchesSportsBetting.scrapeSportsBettingMatches(),
                                        matchesWH.scrapeWHMatches()
                                      ]);
      tmp.matchesBovada = { run_time: getNow(), log: res_matchesBovada };
      tmp.matchesDK = { run_time: getNow(), log: res_matchesDK };
      tmp.matchesFB = { run_time: getNow(), log: res_matchesFB };
      tmp.matchesRivers = { run_time: getNow(), log: res_matchesRivers };
      tmp.matchesSportsBetting = { run_time: getNow(), log: res_matchesSportsBetting };
      tmp.matchesWH = { run_time: getNow(), log: res_matchesWH };
  }
  catch (error) {}

  ////////////////////////////////////////////////////
  //Then all these
  try {
    var [res_marketsPB, res_marketsBovada, res_marketsDK, res_marketsFB, res_marketsRivers, res_marketsSportsBetting, res_marketsWH] = await Promise.all([
                                      marketsPB.scrapePBMarkets(),
                                      marketsBovada.scrapeBovadaMarkets(),
                                      marketsDK.scrapeDKMarkets(),
                                      marketsFB.scrapeFBMarkets(),
                                      marketsRivers.scrapeRiversMarkets(),
                                      marketsSportsBetting.scrapeSportsBettingMarkets(),
                                      marketsWH.scrapeWHMarkets()
                                    ]);
    tmp.marketsPB = { run_time: getNow(), log: res_marketsPB };
    tmp.marketsBovada = { run_time: getNow(), log: res_marketsBovada };
    tmp.marketsDK = { run_time: getNow(), log: res_marketsDK };
    tmp.marketsFB = { run_time: getNow(), log: res_marketsFB };
    tmp.marketsRivers = { run_time: getNow(), log: res_marketsRivers };
    tmp.marketsSportsBetting = { run_time: getNow(), log: res_marketsSportsBetting };
    tmp.marketsWH = { run_time: getNow(), log: res_marketsWH };
  }
  catch (error) {}

  ////////////////////////////////////////////////////
  //Then finally this
  try {
    var [res_arbs] = await Promise.all([
                                      ArbIdentification.identifyArbs()
                                    ]);
    tmp.arbs = { run_time: getNow(), log: res_arbs };
  }
  catch (error) {}

  for (i = 0; i < 2; i++) {
    pipeline[i] = pipeline[i + 1];
  }
  pipeline[2] = tmp;

  cron_cnt++;
}

run()

cron.schedule("0 */15 * * * *", function () {
  console.log(" ---  running a task every 15 minutes --- ");
  
  run()
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
