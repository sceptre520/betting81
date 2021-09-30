//Make sure backend server is running....

var {
  deleteOneSportsbookMarketsFromDB,
  deleteOneSportsbookExtMatchesFromDB,
  deleteOldMatchesFromDB,
  deleteArbsFromDB,
} = require("./helper/scraperFunctions.js");

const fetch = require("node-fetch");
const { isArray } = require("util");

APIurl = "http://localhost:8000/api";

///////////////////////DELETE EXISTING MATCHES//////////////////////////////////
//Get teams from mongoDB//

deleteOneSportsbookMarketsFromDB("888");
