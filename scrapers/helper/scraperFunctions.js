//Make sure backend server is running....
APIurl = "http://localhost:8000/api";
const fetch = require("node-fetch");

//////////Fetch URL//////////

exports.scrapeData = async (URL) => {
  return fetch(URL, {
    method: "GET",
  })
    .then((response) => {
      return response.json();
    })
    .catch((err) => console.log("you fucked up"));
};

//////////Deletion//////////

exports.deleteMatchesFromDB = () => {
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

exports.deleteExternalMatchesFromDB = () => {
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

exports.deleteMarketsFromDB = () => {
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

exports.deleteOldMatchesFromDB = () => {
  return fetch(`${APIurl}/matches/delete/old`, {
    method: "DELETE",
  })
    .then((res) => {
      console.log("successfully deleted");
    })
    .catch((err) => {
      console.log(err);
    });
};

exports.deleteOneSportsbookMarketsFromDB = (sportsbook) => {
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

exports.deleteOneSportsbookExtMatchesFromDB = (sportsbook) => {
  return fetch(`${APIurl}/externalmatches/delete/${sportsbook}`, {
    method: "DELETE",
  })
    .then((res) => {
      console.log("successfully deleted");
    })
    .catch((err) => {
      console.log(err);
    });
};

exports.deleteArbsFromDB = () => {
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

exports.queryForAllTeams = () => {
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

exports.queryForAllMatches = () => {
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

exports.queryForAllExternalMatches = () => {
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

exports.queryForAllMarkets = () => {
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

exports.queryForAllArbs = () => {
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

exports.createMatchInDB = (match) => {
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

exports.createExternalMatchInDB = (match) => {
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

exports.writeMarketsToDB = (Outcomes) => {
  const createMarketInDB = (market) => {
    fetch(`${APIurl}/scraper/market/create`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(market),
    }).then((response, err) => {
      if (err) {
        console.log(err);
      } else {
        console.log(response);
      }
    });
  };

  if (Array.isArray(Outcomes)) {
    //console.log("I am array");
    Outcomes.map((market) => {
      createMarketInDB(market);
    });
  } else {
    //console.log("I am not array");
    createMarketInDB(Outcomes);
  }
};

exports.createArbInDB = (arb) => {
  fetch(`${APIurl}/arb/create`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(arb),
  }).then((response, err) => {
    if (err) {
      console.log(err);
    } else {
      console.log(response);
      // console.log("Everything is great");
    }
  });
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
