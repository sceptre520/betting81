// //Make sure backend server is running....

const fetch = require("node-fetch");

APIurl = "http://localhost:8000/api";

// ////////////////////////////////////////////////////////////////////////////////

// //Scrape players from BallDontLie public API//

const scrapeBallDontLiePlayers = (BDL_URL) => {
  async function scrapeData(BDL_URL) {
    return fetch(BDL_URL, {
      method: "GET",
    })
      .then((response) => {
        return response.json();
      })
      .catch((err) => console.log("you fucked up"));
  }

  let result = scrapeData(BDL_URL);

  return result;
};

const writePlayersToDB = (player) =>
  fetch(`${APIurl}/scraper/players/create`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(player),
  }).then((response, err) => {
    if (err) {
      console.log(err);
    } else {
      console.log("Everything is great");
    }
  });

const extractKeysWeWant = (data) => {
  return data.map((elm) => {
    elm["BDL_id"] = elm["id"];
    elm["teamAbbrev"] = elm.team.abbreviation;
    elm["playerName"] = `${elm.first_name} ${elm.last_name}`;
    elm["height"] =
      elm.height_feet && elm.height_inches
        ? `${elm.height_feet}'${elm.height_inches}"`
        : "";
    elm["weight"] = elm.weight_pounds ? `${elm.weight_pounds}lbs` : "";
    delete elm["team"];
    delete elm["first_name"];
    delete elm["last_name"];
    delete elm["height_feet"];
    delete elm["height_inches"];
    delete elm["weight_pounds"];
    delete elm["id"];
    return elm;
  });
};

const sleep = (m) => new Promise((r) => setTimeout(r, m));

const DoTheScraping = async (i) => {
  let BDL_URL = `https://www.balldontlie.io/api/v1/players?page=${i}&per_page=100`;

  const scrapedPlayers = scrapeBallDontLiePlayers(BDL_URL).then((players) => {
    return players;
  });

  Promise.resolve(scrapedPlayers).then((scrapedPlayers) => {
    const data = scrapedPlayers.data;

    var myArray = extractKeysWeWant(data);
    // write to DB
    myArray.map((player) => {
      writePlayersToDB(player);
    });
  });
};

(async () => {
  for (let i = 1; i <= 35; i++) {
    await sleep(3000);
    await DoTheScraping(i);
  }
})();
