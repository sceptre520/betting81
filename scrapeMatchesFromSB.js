const fetch = require("node-fetch");

////////////////////////////////////////////////////////////////////////////////

//Scrape matches from DraftKings public API//

var competitionId = 6927;

var SB_comp_URL = `https://www.sportsbet.com.au/apigw/sportsbook-sports/Sportsbook/Sports/Competitions/${competitionId}?displayType=default&includeTopMarkets=true&eventFilter=matches`;

const grabRelevantMatchFields = (matchObject) => {
  let {
    id,
    name,
    competitionName,
    startTime,
    participant2,
    participant1,
  } = matchObject;
  let subset = {
    id,
    name,
    competitionName,
    startTime,
    participant2,
    participant1,
  };
  return subset;
};

async function scrapeData(SB_comp_URL) {
  const response = await fetch(SB_comp_URL);
  // waits until the request completes...
  const data = await response.json();
  return data;
}

const SBMatches = scrapeData(SB_comp_URL)
  .then((output) => {
    const events = output.events;

    //filter prematch only
    return events.filter((o) => {
      return o.bettingStatus === "PRICED" && o.isDisplayed; //avoids futures etc.
    });
  })
  .then((data) => {
    return data.map((o) => {
      return grabRelevantMatchFields(o);
    });
  })
  .then((data) => {
    var myArray = data.map((elm) => {
      elm["eventId"] = elm["id"];
      elm["league"] = elm["competitionName"];
      elm["homeTeam"] = elm["participant2"];
      elm["awayTeam"] = elm["participant1"];
      elm["date"] = new Date(elm["startTime"]);
      delete elm["competitionName"];
      delete elm["startTime"];
      delete elm["participant2"];
      delete elm["participant1"];
      delete elm["id"];
      return elm;
    });

    return myArray;
  });

////////////////////////////////////////////////////////////////////////////////
//Get matches from mongoDB//

const APIurl = "http://localhost:8000/api";

const queryForAllMatches = () => {
  async function getAllMatchesInDB() {
    return fetch(`${APIurl}/matches`).then((matches) => {
      return matches.json();
    });
  }

  let matchList = getAllMatchesInDB().then((output) => {
    return output;
  });

  return matchList;
};

//Executes the steps//

const matchList = queryForAllMatches().then((matches) => {
  //console.log(teams);
  return matches;
});

const MappedMatches = Promise.all([SBMatches, matchList]).then((values) => {
  let SBMatches = values[0];
  let matchList = values[1];

  //   console.log(DKMatches);
  // console.log(matchList);

  //Grab the matchId from my DB that corresponds to each DK EventID
  var SBEventMapping = SBMatches;
  for (let i = 0; i < SBEventMapping.length; i++) {
    thisSBEvent = SBEventMapping[i];
    //console.log(matchList);
    let matchFromDB = matchList.filter((o) => {
      return o.name === thisSBEvent.name.replace(" At ", " @ ");
    });

    if (matchFromDB[0]) {
      SBEventMapping[i]["matchId"] = matchFromDB[0]._id;
    } else {
      SBEventMapping[i]["matchId"] = "";
    }

    SBEventMapping[i]["sportsbook"] = "SportsBet";
  }

  //console.log(SBEventMapping);
  SBEventMapping.map((DKEvent) => {
    createExternalMatchInDB(DKEvent);
  });
});

const createExternalMatchInDB = (match) => {
  fetch(`${APIurl}/scraper/externalMatches/create`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(match),
  }).then((response, err) => {
    if (err) {
      console.log(err);
    } else {
      console.log("Everything is great");
    }
  });
};
