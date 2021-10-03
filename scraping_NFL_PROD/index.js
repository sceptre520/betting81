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
const marketsSportsBetting = require("./scraperFiles/scrapeMarketsFromSportsBetting_NFL_Refactor");

const matchesWH = require("./scraperFiles/scrapeMatchesFromWH_NFL_Refactor");
const marketsWH = require("./scraperFiles/scrapeMarketsFromWH_NFL_Refactor");

const ArbIdentification = require("./scraperFiles/arbIdentification_Refactor");

////////////////////////////////////////////////////////
var pipeline = [null, null, null];
var cron_cnt = 0;
var start_time = getNow();
var run = async () => {
  //A
  try {
    console.log("Starting: PB Matches");
    var PBMatches = await matchesPB.scrapePBMatches();
    //console.log(PBMatches)
    console.log("Successful: PB Matches");
  } catch (error) {
    console.log("Failed: PB Matches");
  }

  //B
  try {
    console.log("Starting: PB Markets");
    var PBMarkets = await marketsPB.scrapePBMarkets();
    //console.log(PBMarkets)
    console.log("Successful: PB Markets");
  } catch (error) {
    console.log("Failed: PB Markets");
  }

  //C
  try {
    console.log("Starting: Other Matches");
    var [
      BovadaMatches,
      DKMatches,
      FBMatches,
      RiversMatches,
      SportsBettingMatches,
      WHMatches,
    ] = await Promise.all([
      matchesBovada.scrapeBovadaMatches(),
      matchesDK.scrapeDKMatches(),
      matchesFB.scrapeFBMatches(),
      matchesRivers.scrapeRiversMatches(),
      matchesSportsBetting.scrapeSportsBettingMatches(),
      matchesWH.scrapeWHMatches(),
    ]);
    //console.log(BovadaMatches, DKMatches, FBMatches,RiversMatches,SportsBettingMatches,WHMatches)
    console.log("Successful: Other Matches");
  } catch (error) {
    console.log("Failed: Other Matches");
  }

  //D
  try {
    console.log("Starting: Other Markets");
    var [
      BovadaMarkets,
      DKMarkets,
      FBMarkets,
      RiversMarkets,
      SportsBettingMarkets,
      WHMarkets,
    ] = await Promise.all([
      marketsBovada.scrapeBovadaMarkets(),
      marketsDK.scrapeDKMarkets(),
      marketsFB.scrapeFBMarkets(),
      marketsRivers.scrapeRiversMarkets(),
      marketsSportsBetting.scrapeSportsBettingMarkets(),
      marketsWH.scrapeWHMarkets(),
    ]);
    //console.log(BovadaMarkets, DKMarkets, FBMarkets,RiversMarkets,SportsBettingMarkets,WHMarkets)
    console.log("Successful: Other Markets");
  } catch (error) {
    console.log("Failed: Other Markets");
  }

  //E
  try {
    console.log("Starting: Arbs");
    var Arbs = await ArbIdentification.identifyArbs();
    //console.log(Arbs)
    console.log("Successful: Arbs");
  } catch (error) {
    console.log("Failed: Arbs");
  }
};

console.log("                                             ");
console.log("--------    started  scheduler    -----------");
cron.schedule("0 */15 * * * *", function () {
  console.log(" ---  running a task every 15 minutes --- ");

  run();
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
