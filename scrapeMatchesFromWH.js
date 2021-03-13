const fetch = require("node-fetch");

////////////////////////////////////////////////////////////////////////////////

//Scrape matches from William Hill public API//

var sport_name = "basketball";
var WH_sport_URL = `https://www.williamhill.com/us/co/bet/api/v2/sports/${sport_name}/events/schedule`;

const grabRelevantMatchFields = (matchObject) => {
  let eventId = matchObject.id;
  let name = matchObject.name.replace(/\|/g, "");
  let league = matchObject.competitionName;
  let startDate = new Date(matchObject.startTime);

  let awayTeam; //= matchObject.participants.participant[0].name;
  let homeTeam; //= matchObject.participants.participant[1].name;

  if (name.includes(" at ")) {
    awayTeam = name.split(" at ")[0];
    homeTeam = name.split(" at ")[1];
  } else if (name.includes(" vs ")) {
    awayTeam = name.split(" vs ")[1];
    homeTeam = name.split(" vs ")[0];
  } else {
    awayTeam = "Unknown";
    homeTeam = "Unknown";
  }

  let subset = {
    eventId,
    name,
    league,
    startDate,
    awayTeam,
    homeTeam,
  };

  console.log(subset);

  return subset;
};

async function scrapeData(WH_sport_URL) {
  const response = await fetch(WH_sport_URL);
  // waits until the request completes...
  const data = await response.json();
  return data;
}

const WHMatches = scrapeData(WH_sport_URL)
  .then((output) => {
    //const events = output.eventGroup.events;

    const events = output.competitions.filter((o) => {
      return o.name === "NBA";
    })[0];

    //filter prematch only and not futures etc.
    const filteredEvents = events.events.filter((o) => {
      return o.display && o.active && !o.started && o.type === "MATCH";
    });

    return filteredEvents;
  })
  .then((data) => {
    console.log(data);
    return data.map((o) => {
      return grabRelevantMatchFields(o);
    });
  });

// ////////////////////////////////////////////////////////////////////////////////
// //Get matches from mongoDB//

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

// //Executes the steps//

const matchList = queryForAllMatches().then((matches) => {
  //console.log(teams);
  return matches;
});

const MappedMatches = Promise.all([WHMatches, matchList]).then((values) => {
  let WHMatches = values[0];
  let matchList = values[1];

  //Grab the matchId from my DB that corresponds to each DK EventID
  var WHEventMapping = WHMatches;
  for (let i = 0; i < WHEventMapping.length; i++) {
    thisWHEvent = WHEventMapping[i];

    let matchFromDB = matchList.filter((o) => {
      return o.name === thisWHEvent.name.replace(" at ", " @ "); // WH does [away at home], not like PB's [away @ home].
    });

    if (matchFromDB[0]) {
      WHEventMapping[i]["matchId"] = matchFromDB[0]._id;
    } else {
      WHEventMapping[i]["matchId"] = "";
    }

    WHEventMapping[i]["sportsbook"] = "William Hill";
  }
  console.log(WHEventMapping);
  WHEventMapping.map((WHEvent) => {
    createExternalMatchInDB(WHEvent);
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
      console.log(response);
    }
  });
};
