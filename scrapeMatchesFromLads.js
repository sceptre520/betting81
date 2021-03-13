const fetch = require("node-fetch");

////////////////////////////////////////////////////////////////////////////////

//Scrape matches from Ladbrokes public API//

var competitionId = "%5B%223c34d075-dc14-436d-bfc4-9272a49c2b39%22%5D"; //this is NOT NBA! have to look up what NBA is when there is a fixture available
var FB_comp_URL = `https://api.ladbrokes.com.au/v2/sport/event-request?category_ids=${competitionId}`;

const grabRelevantMatchFields = (matchObject) => {
  let eventId = matchObject.id;
  let name = matchObject.name;
  let league = matchObject.competition.name.trim();
  let startDate = new Date(matchObject.advertised_start);

  let awayTeam = matchObject.name.split(" vs ")[1];
  let homeTeam = matchObject.name.split(" vs ")[0];

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
    //console.log(output);
    const events = output.events;
    //console.log(events);
    if (events) {
      let eventArray = [];

      for (const [key, value] of Object.entries(events)) {
        eventArray.push(value);
        //console.log(`${key}: ${value}`);
      }

      //     //filter prematch only
      const filteredEvents = eventArray.filter((o) => {
        return (
          o.competition.name.trim() === "NBA" && //"NBA "
          o.match_status === "BettingOpen" &&
          o.visible &&
          o.event_type.name === "Match" &&
          o.name.includes(" vs ")
        ); //avoids futures etc.
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

//Executes the steps//

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
        //FoxBet uses [home vs. away] convention, not [away @ home]
        thisFBEvent.name.includes(o.awayTeam.name) &&
        thisFBEvent.name.includes(o.homeTeam.name)
      );
    });

    if (matchFromDB[0]) {
      FBEventMapping[i]["matchId"] = matchFromDB[0]._id;
    } else {
      FBEventMapping[i]["matchId"] = "";
    }

    FBEventMapping[i]["sportsbook"] = "Ladbrokes";
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
