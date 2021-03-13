const fetch = require("node-fetch");

////////////////////////////////////////////////////////////////////////////////

//Scrape matches from DraftKings public API//

var competitionId = 103;
var DK_comp_URL = `https://sportsbook.draftkings.com//sites/US-SB/api/v1/eventgroup/${competitionId}/full?includePromotions=true&format=json`;

const grabRelevantMatchFields = (matchObject) => {
  let {
    eventId,
    name,
    eventGroupName,
    startDate,
    teamName2,
    teamName1,
  } = matchObject;
  let subset = {
    eventId,
    name,
    eventGroupName,
    startDate,
    teamName2,
    teamName1,
  };
  return subset;
};

async function scrapeData(DK_comp_URL) {
  const response = await fetch(DK_comp_URL);
  // waits until the request completes...
  const data = await response.json();
  return data;
}

const DKMatches = scrapeData(DK_comp_URL)
  .then((output) => {
    const events = output.eventGroup.events;
    //console.log(events);
    //filter prematch only
    return events.filter((o) => {
      return o.eventStatus.state === "NOT_STARTED" && o.name.includes("@"); //avoids futures etc.
    });
  })
  .then((data) => {
    return data.map((o) => {
      return grabRelevantMatchFields(o);
    });
  })
  .then((data) => {
    var myArray = data.map((elm) => {
      elm["league"] = elm["eventGroupName"];
      elm["homeTeam"] = elm["teamName2"];
      elm["awayTeam"] = elm["teamName1"];
      elm["date"] = new Date(elm["startDate"]);
      delete elm["eventGroupName"];
      delete elm["startDate"];
      delete elm["teamName2"];
      delete elm["teamName1"];
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

const MappedMatches = Promise.all([DKMatches, matchList]).then((values) => {
  let DKMatches = values[0];
  let matchList = values[1];

  //   console.log(DKMatches);
  //   console.log(matchList);

  //Grab the matchId from my DB that corresponds to each DK EventID
  var DKEventMapping = DKMatches;
  for (let i = 0; i < DKEventMapping.length; i++) {
    thisDKEvent = DKEventMapping[i];
    //console.log(matchList);
    let matchFromDB = matchList.filter((o) => {
      return o.name === thisDKEvent.name;
    });

    if (matchFromDB[0]) {
      DKEventMapping[i]["matchId"] = matchFromDB[0]._id;
    } else {
      DKEventMapping[i]["matchId"] = "";
    }

    DKEventMapping[i]["sportsbook"] = "Kambi";
  }

  DKEventMapping.map((DKEvent) => {
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
