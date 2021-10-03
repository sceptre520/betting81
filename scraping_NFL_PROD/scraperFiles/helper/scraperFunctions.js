//Make sure backend server is running....
APIurl = "http://localhost:8000/api";
const fetch = require("node-fetch");

//////////Fetch URL//////////

exports.scrapeData = async (URL) => {
  const var1 = await fetch(URL, {
    method: "GET",
  })
    .then((response) => {
      return response.json();
      //return "ScrapedData";
    })
    .catch((err) => console.log("you fucked up"));

  return var1;
};

//////////Deletion//////////

exports.deleteMatchesFromDB = async () => {
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

exports.deleteExternalMatchesFromDB = async () => {
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

exports.deleteMarketsFromDB = async () => {
  return fetch(`${APIurl}/markets/delete`, {
    method: "DELETE",
  })
    .then((res) => {
      console.log("successfully deleted");
    })
    .catch((err) => {
      console.log(err);
    });
};

exports.deleteOldMatchesFromDB = async () => {
  await fetch(`${APIurl}/matches/delete/old`, {
    method: "DELETE",
  })
    .then((res) => {
      console.log("successfully deleted");
    })
    .catch((err) => {
      console.log(err);
    });
};

exports.deleteOneSportsbookMarketsFromDB = async (sportsbook) => {
  return fetch(`${APIurl}/markets/delete/${sportsbook}`, {
    method: "DELETE",
  })
    .then((res) => {
      console.log("successfully deleted");
    })
    .catch((err) => {
      console.log(err);
    });
};

exports.deleteOneSportsbookExtMatchesFromDB = async (sportsbook) => {
  await fetch(`${APIurl}/externalmatches/delete/${sportsbook}`, {
    method: "DELETE",
  })
    .then((res) => {
      console.log("successfully deleted");
    })
    .catch((err) => {
      console.log(err);
    });
};

exports.deleteArbsFromDB = async () => {
  return fetch(`${APIurl}/arb/delete`, {
    method: "DELETE",
  })
    .then((res) => {
      console.log("successfully deleted");
    })
    .catch((err) => {
      console.log(err);
    });
};

//////////Read from DB//////////

exports.queryForAllTeams = async () => {
  async function getAllTeamsInDB() {
    return fetch(`${APIurl}/teams`).then((teams) => {
      return teams.json();
    });
  }

  let teamsList = await getAllTeamsInDB();

  return teamsList;
};

exports.queryForAllMatches = async () => {
  async function getAllMatchesInDB() {
    return fetch(`${APIurl}/matches`).then((matches) => {
      return matches.json();
    });
  }

  let matchList = await getAllMatchesInDB();

  return matchList;
};

exports.queryForAllExternalMatches = async () => {
  async function getAllMatchesInDB() {
    return fetch(`${APIurl}/externalMatches`).then((matches) => {
      return matches.json();
    });
  }

  let matchList = getAllMatchesInDB().then((output) => {
    return output;
  });

  return matchList;
};

exports.queryForAllMarkets = async () => {
  async function getAllMarketsInDB() {
    return fetch(`${APIurl}/markets`).then((matches) => {
      return matches.json();
    });
  }

  let matchList = getAllMarketsInDB().then((output) => {
    return output;
  });

  return matchList;
};

exports.queryForAllArbs = async () => {
  async function getAllArbsInDB() {
    return fetch(`${APIurl}/arb/all`).then((arbs) => {
      return arbs.json();
    });
  }

  let arbList = getAllArbsInDB().then((output) => {
    return output;
  });

  return arbList;
};

//////////Write to DB//////////

exports.createMatchInDB = async (match) => {
  async function creation() {
    return fetch(`${APIurl}/scraper/match/create`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(match),
    }).then((response, err) => {
      if (err) {
        console.log(err);
      } else {
        //console.log(response);
        return match.name;
        // console.log("Everything is great");
      }
    });
  }

  let result = await creation();

  return result;
};

exports.createExternalMatchInDB = async (match) => {
  async function creation() {
    return fetch(`${APIurl}/scraper/externalMatches/create`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(match),
    }).then((response, err) => {
      if (err) {
        console.log(err);
      } else {
        //console.log(response);
        return match.name;
      }
    });
  }

  let result = await creation();

  return result;
};

exports.writeMarketsToDB = async (Outcomes) => {
  async function creation() {
    return fetch(`${APIurl}/scraper/market/create`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(Outcomes),
    }).then((response, err) => {
      if (err) {
        console.log(err);
      } else {
        //console.log(response);
        return "saved";
      }
    });
  }

  let result = await creation();

  return result;
};

exports.createArbInDB = async (arb) => {
  async function creation() {
    return fetch(`${APIurl}/arb/create`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(arb),
    }).then((response, err) => {
      if (err) {
        console.log(err);
      } else {
        //console.log(response);
        return "Saved";
      }
    });
  }

  let result = await creation();

  return result;
};

////////////////POST TO SLACK///////////////////////

exports.postInSlack = (url, payload) => {
  fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  }).then((response, err) => {
    if (err) {
      console.log(err);
    } else {
      console.log(response);
    }
  });
};
