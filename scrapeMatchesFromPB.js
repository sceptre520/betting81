//Make sure backend server is running....

const fetch = require("node-fetch");

APIurl = "http://localhost:8000/api";

///////////////////////DELETE EXISTING MATCHES//////////////////////////////////
//Get teams from mongoDB//

const deleteMatchesFromDB = () => {
  return fetch(`${APIurl}/matches/delete`, {
    method: "DELETE",
  })
    .then((res) => {
      console.log("successfully deleted");
    })
    .catch((err) => {
      console.log(err);
    });
};

deleteMatchesFromDB();

const deleteExternalMatchesFromDB = () => {
  return fetch(`${APIurl}/externalmatches/delete`, {
    method: "DELETE",
  })
    .then((res) => {
      console.log("successfully deleted");
    })
    .catch((err) => {
      console.log(err);
    });
};

deleteExternalMatchesFromDB();

////////////////////////////////////////////////////////////////////////////////
//Get teams from mongoDB//

const queryForAllTeams = () => {
  async function getAllTeamsInDB() {
    return fetch(`${APIurl}/teams`).then((teams) => {
      return teams.json();
    });
  }

  let teamsList = getAllTeamsInDB().then((output) => {
    return output;
  });

  return teamsList;
};

////////////////////////////////////////////////////////////////////////////////

//Scrape matches from PointsBet public API//

var AU_URL_prefix = "http://api.pointsbet.com/api/v2/";
var competitionId = 7176; //NBA
var URL_for_events = `${AU_URL_prefix}competitions/${competitionId}/events/featured?includeLive=true"`;

const scrapePointsBetMatches = (URL_for_events) => {
  async function scrapeData(URL_for_competitions) {
    return fetch(URL_for_competitions, {
      method: "GET",
    })
      .then((response) => {
        return response.json();
      })
      .catch((err) => console.log("you fucked up"));
  }

  let result = scrapeData(URL_for_events);

  const grabRelevantMatchFields = (matchObject) => {
    let { name, competitionName, startsAt, homeTeam, awayTeam } = matchObject;
    let subset = { name, competitionName, startsAt, homeTeam, awayTeam };
    return subset;
  };

  let final = result
    .then((output) => {
      //filter prematch only

      return output.events.filter((o) => {
        return !o.isLive && o.name.includes("@"); //name a bets
      });
    })
    .then((output) => {
      //select subset of keys

      return output.map((o) => {
        return grabRelevantMatchFields(o);
      });
    })
    .then((output) => {
      // update names of keys

      var resultArray = output.map(function (elm) {
        elm["league"] = elm["competitionName"];
        elm["date"] = new Date(elm["startsAt"]);
        delete elm["competitionName"];
        delete elm["startsAt"];
        return elm;
      });
      return resultArray;
    });

  return final;
};

////////////////////////////////////////////////////////////////////////////////

//Executes the steps//

const teamsList = queryForAllTeams().then((teams) => {
  //console.log(teams);
  return teams;
});

const scrapedMatches = scrapePointsBetMatches(URL_for_events).then(
  (matches) => {
    //console.log(matches);
    return matches;
  }
);

Promise.all([teamsList, scrapedMatches]).then((values) => {
  let teamsList = values[0];
  let scrapedMatches = values[1];

  //Get home teams
  const homeTeams = scrapedMatches.map((match) => {
    let homeString = match.homeTeam;
    let homeId = teamsList.filter((team) => team.name === homeString);
    if (homeId.length === 0) {
      return "Missing";
    } else {
      return homeId[0]._id;
    }
  });

  //Get away teams
  const awayTeams = scrapedMatches.map((match) => {
    let awayString = match.awayTeam;
    let awayId = teamsList.filter((team) => team.name === awayString);
    //console.log(awayId);
    if (awayId.length === 0) {
      return "Missing";
    } else {
      return awayId[0]._id;
    }
  });

  homeTeams.map((element, index) => {
    scrapedMatches[index].homeTeam = element;
  });

  awayTeams.map((element, index) => {
    scrapedMatches[index].awayTeam = element;
  });

  console.log(scrapedMatches);

  if (Array.isArray(scrapedMatches)) {
    //console.log("I am array");
    scrapedMatches.map((market) => {
      createMatchInDB(market);
    });
  } else {
    //console.log("I am not array");
    createMatchInDB(scrapedMatches);
  }
});

const createMatchInDB = (match) => {
  fetch(`${APIurl}/scraper/match/create`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(match),
  }).then((response, err) => {
    if (err) {
      console.log(err);
    } else {
      console.log(response);
      // console.log("Everything is great");
    }
  });
};
