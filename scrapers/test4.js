const fetch = require("node-fetch");

////////////////////////////////////////////////////////////////////////////////

//Scrape matches from FOXBET public API//

var competitionId = "NBA"; //this is NOT NBA! have to look up what NBA is when there is a fixture available
var FB_comp_URL = `https://api.beta.tab.com.au/v1/tab-info-service/sports/Basketball/competitions/${competitionId}?jurisdiction=VIC`;

const grabRelevantMatchFields = (matchObject) => {
  let eventId = matchObject.name;
  let name = matchObject.name;
  let league = competitionId;
  let startDate = new Date(matchObject.startTime);
  let awayTeam = matchObject.competitors[1];
  let homeTeam = matchObject.competitors[0];

  let subset = {
    eventId,
    name,
    league,
    startDate,
    awayTeam,
    homeTeam,
  };

  return subset;
};

async function scrapeData(FB_comp_URL) {
  const response = await fetch(FB_comp_URL);
  // waits until the request completes...
  const data = await response.json();
  return data;
}

const FBMatches = scrapeData(FB_comp_URL)
  .then((output) => {
    //const events = output.eventGroup.events;

    const events = output.matches;
    if (events) {
      //filter prematch only
      const filteredEvents = events.filter((o) => {
        return o.nonFutureMarketCount; //contains one or more markets.
      });
      return filteredEvents;
    }
  })
  .then((data) => {
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

const MappedMatches = Promise.all([FBMatches, matchList]).then((values) => {
  let FBMatches = values[0];
  let matchList = values[1];

  //Grab the matchId from my DB that corresponds to each DK EventID
  var FBEventMapping = FBMatches;
  for (let i = 0; i < FBEventMapping.length; i++) {
    thisFBEvent = FBEventMapping[i];

    let matchFromDB = matchList.filter((o) => {
      return (
        //TAB uses [home v away] convention, not [away @ home]
        o.awayTeam.name.includes(
          thisFBEvent.awayTeam.replace("LA ", "Los Angeles ")
        ) &&
        o.homeTeam.name.includes(
          thisFBEvent.homeTeam.replace("LA ", "Los Angeles ")
        )
      );
    });

    if (matchFromDB[0]) {
      FBEventMapping[i]["matchId"] = matchFromDB[0]._id;
    } else {
      FBEventMapping[i]["matchId"] = "";
    }

    FBEventMapping[i]["sportsbook"] = "TAB";
  }

  FBEventMapping.map((FBEvent) => {
    //console.log(FBEvent);
    createExternalMatchInDB(FBEvent);
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
