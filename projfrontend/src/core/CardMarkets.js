import React, { useState, useEffect } from "react";
import { Link, Redirect } from "react-router-dom";
import { getPlayers, getPlayerStats } from "./helper/playerHelper";

const CardMarkets = ({ market, player, isUnder, isAmerican }) => {
  const [redirect, setRedirect] = useState(false);

  const [playerData, setplayerData] = useState([]);
  const [playerStats, setplayerStats] = useState({});
  const [teamAndPosition, setteamAndPosition] = useState("");

  const preload = () => {
    getPlayers()
      .then((data) => {
        setplayerData(data);

        const thisPlayerDBEntry = data.filter((o) => {
          return (
            o.playerName.toLowerCase().replace(/[^\w\s]/gi, "") ===
            player.toLowerCase().replace(/[^\w\s]/gi, "")
          );
        });

        if (thisPlayerDBEntry[0]) {
          setteamAndPosition(
            ` (${
              thisPlayerDBEntry[0] ? thisPlayerDBEntry[0].teamAbbrev : ""
            }, ${thisPlayerDBEntry[0] ? thisPlayerDBEntry[0].position : ""})`
          );
          return thisPlayerDBEntry[0].BDL_id;
        }
      })
      .then((BDL_id) => {
        //setplayerStats(BDL_id);
        //console.log(BDL_id);

        const playerStats = getPlayerStats(BDL_id).then((playerStats) => {
          return playerStats;
        });

        return playerStats;
      })
      .then((playerStats) => {
        if (playerStats) {
          const output = {
            pts: playerStats.data[0] ? playerStats.data[0].pts : 0,
            ast: playerStats.data[0] ? playerStats.data[0].ast : 0,
            reb: playerStats.data[0] ? playerStats.data[0].reb : 0,
            games: playerStats.data[0] ? playerStats.data[0].games_played : 0,
            min: playerStats.data[0] ? playerStats.data[0].min : 0,
          };
          return output;
        }
      })
      .then((output) => {
        setplayerStats(output);
      });
  };

  useEffect(() => {
    preload();
  }, []);

  const playerName = player;

  const mutation = (LongerString, ShorterString) => {
    var value1 = LongerString.toLowerCase();
    var value2 = ShorterString.toLowerCase();

    for (var i = 0; i < value2.length; i++) {
      if (value1.indexOf(value2.charAt(i)) === -1) {
        return false;
      }
    }
    return true;
  };

  const playerMarkets = market.filter((market) => {
    const normalizedName = market.player
      .normalize("NFD")
      .replace(/[^\w\s]|_/g, "")
      .toLowerCase()
      .replace(/[^\w\s]/gi, "");

    return (
      //exact match
      normalizedName === playerName ||
      //last 4 characters and 1st character match
      (normalizedName.substring(normalizedName.length - 4) ===
        playerName.substring(playerName.length - 4) &&
        normalizedName.substring(0, 1) === playerName.substring(0, 1)) ||
      //all characters in string are present in full playerName
      mutation(playerName, normalizedName)
    );
  });

  const playerNameForDisplay = playerMarkets[0].player;

  //find this player in BallDontLie DB

  const doSomething = () => {
    setRedirect(true);
  };

  const getARedirect = (redirect) => {
    if (redirect) {
      return <Redirect to={`/`} />;
    }
  };

  const getByValue = (arr, marketType, sportsbook) => {
    var result = arr.filter(function (o) {
      return o.marketType === marketType && o.sportsbook === sportsbook;
    });

    return result;
  };

  const convertOdds = (price, isAmerican = false) => {
    if (isAmerican) {
      if (price >= 2) {
        return `+${(100 * (price - 1)).toFixed(0)}`;
      } else {
        return (-100 / (price - 1)).toFixed(0);
      }
    } else {
      return `$${price.toFixed(2)}`;
    }
  };

  const presentOdds = (data, isUnder = false, isAmerican = false) => {
    if (data[0]) {
      let HandicapPart = "";
      let PricePart = "";
      if (data[0].handicap) {
        HandicapPart = `${isUnder ? "u" : "o"}${data[0].handicap.toFixed(1)} `;
      }
      if (isUnder && data[0].marketType !== "First Basket") {
        PricePart = convertOdds(data[0].underPrice, isAmerican);
      } else {
        PricePart = convertOdds(data[0].overPrice, isAmerican);
      }
      return `${HandicapPart}${PricePart}`;
    } else {
      return "-";
    }
  };

  const grabHandicap = (data, isAmerican = false) => {
    if (data[0]) {
      let HandicapPart = "";
      if (data[0].handicap) {
        HandicapPart = data[0].handicap.toFixed(1);
      }
      return HandicapPart;
    } else {
      return "-";
    }
  };

  const grabPrice = (data, isUnder = false, isAmerican = false) => {
    if (data[0]) {
      let PricePart = "";
      if (isUnder && data[0].marketType !== "First Basket") {
        PricePart = convertOdds(data[0].underPrice, isAmerican);
      } else {
        PricePart = convertOdds(data[0].overPrice, isAmerican);
      }
      return PricePart;
    } else {
      return "-";
    }
  };

  const grabHandicapWrapper = (stat, sportsbook, isAmerican = false) => {
    return grabHandicap(
      getByValue(playerMarkets, stat, sportsbook),
      isAmerican
    );
  };

  const grabPriceWrapper = (
    stat,
    sportsbook,
    isUnder = false,
    isAmerican = false
  ) => {
    return grabPrice(
      getByValue(playerMarkets, stat, sportsbook),
      isUnder,
      isAmerican
    );
  };

  const Bballreference = `https://www.basketball-reference.com/search/search.fcgi?search=${playerName.replaceAll(
    " ",
    "+"
  )}`;

  // const odds = {
  //   PB_Points: presentOdds(
  //     getByValue(playerMarkets, "Points", "PointsBet"),
  //     isUnder,
  //     isAmerican
  //   ),
  //   K_Points: presentOdds(
  //     getByValue(playerMarkets, "Points", "Kambi"),
  //     isUnder,
  //     isAmerican
  //   ),
  //   FB_Points: presentOdds(
  //     getByValue(playerMarkets, "Points", "FoxBet"),
  //     isUnder,
  //     isAmerican
  //   ),
  //   WH_Points: presentOdds(
  //     getByValue(playerMarkets, "Points", "William Hill"),
  //     isUnder,
  //     isAmerican
  //   ),
  //   SB_Points: presentOdds(
  //     getByValue(playerMarkets, "Points", "SportsBet"),
  //     isUnder,
  //     isAmerican
  //   ),
  //   TAB_Points: presentOdds(
  //     getByValue(playerMarkets, "Points", "TAB"),
  //     isUnder,
  //     isAmerican
  //   ),
  //   PB_Rebs: presentOdds(
  //     getByValue(playerMarkets, "Rebounds", "PointsBet"),
  //     isUnder,
  //     isAmerican
  //   ),
  //   K_Rebs: presentOdds(
  //     getByValue(playerMarkets, "Rebounds", "Kambi"),
  //     isUnder,
  //     isAmerican
  //   ),
  //   FB_Rebs: presentOdds(
  //     getByValue(playerMarkets, "Rebounds", "FoxBet"),
  //     isUnder,
  //     isAmerican
  //   ),
  //   WH_Rebs: presentOdds(
  //     getByValue(playerMarkets, "Rebounds", "William Hill"),
  //     isUnder,
  //     isAmerican
  //   ),
  //   SB_Rebs: presentOdds(
  //     getByValue(playerMarkets, "Rebounds", "SportsBet"),
  //     isUnder,
  //     isAmerican
  //   ),
  //   TAB_Rebs: presentOdds(
  //     getByValue(playerMarkets, "Rebounds", "TAB"),
  //     isUnder,
  //     isAmerican
  //   ),
  //   PB_Ass: presentOdds(
  //     getByValue(playerMarkets, "Assists", "PointsBet"),
  //     isUnder,
  //     isAmerican
  //   ),
  //   K_Ass: presentOdds(
  //     getByValue(playerMarkets, "Assists", "Kambi"),
  //     isUnder,
  //     isAmerican
  //   ),
  //   FB_Ass: presentOdds(
  //     getByValue(playerMarkets, "Assists", "FoxBet"),
  //     isUnder,
  //     isAmerican
  //   ),
  //   WH_Ass: presentOdds(
  //     getByValue(playerMarkets, "Assists", "William Hill"),
  //     isUnder,
  //     isAmerican
  //   ),
  //   SB_Ass: presentOdds(
  //     getByValue(playerMarkets, "Assists", "SportsBet"),
  //     isUnder,
  //     isAmerican
  //   ),
  //   TAB_Ass: presentOdds(
  //     getByValue(playerMarkets, "Assists", "TAB"),
  //     isUnder,
  //     isAmerican
  //   ),
  //   PB_FB: presentOdds(
  //     getByValue(playerMarkets, "First Basket", "PointsBet"),
  //     isUnder,
  //     isAmerican
  //   ),
  //   K_FB: presentOdds(
  //     getByValue(playerMarkets, "First Field Goal", "Kambi"),
  //     isUnder,
  //     isAmerican
  //   ),
  //   FB_FB: presentOdds(
  //     getByValue(playerMarkets, "First Field Goal", "FoxBet"), //check naming convention
  //     isUnder,
  //     isAmerican
  //   ),
  //   WH_FB: presentOdds(
  //     getByValue(playerMarkets, "First Field Goal", "William Hill"), //check naming convention
  //     isUnder,
  //     isAmerican
  //   ),
  //   SB_FB: presentOdds(
  //     getByValue(playerMarkets, "First Field Goal", "SportsBet"),
  //     isUnder,
  //     isAmerican
  //   ),
  //   TAB_FB: presentOdds(
  //     getByValue(playerMarkets, "First Field Goal", "TAB"),
  //     isUnder,
  //     isAmerican
  //   ),
  // };

  const identifyTopBook = (playerMarkets, stat, isUnder) => {
    const PointsBetMarket = getByValue(playerMarkets, stat, "PointsBet")[0];
    const KambiMarket = getByValue(
      playerMarkets,
      stat === "First Basket" ? "First Field Goal" : stat,
      "Kambi"
    )[0];
    const FoxBetMarket = getByValue(
      playerMarkets,
      stat === "First Basket" ? "First Field Goal" : stat,
      "FoxBet"
    )[0];
    const WHMarket = getByValue(
      playerMarkets,
      stat === "First Basket" ? "First Field Goal" : stat,
      "William Hill"
    )[0];
    const SBMarket = getByValue(
      playerMarkets,
      stat === "First Basket" ? "First Field Goal" : stat,
      "SportsBet"
    )[0];
    const TABMarket = getByValue(
      playerMarkets,
      stat === "First Basket" ? "First Field Goal" : stat,
      "TAB"
    )[0];
    const SbookMarket = getByValue(
      playerMarkets,
      stat === "First Basket" ? "First Field Goal" : stat,
      "Superbook"
    )[0];
    const LadMarket = getByValue(
      playerMarkets,
      stat === "First Basket" ? "First Field Goal" : stat,
      "Ladbrokes"
    )[0];

    const markets = [
      PointsBetMarket,
      KambiMarket,
      FoxBetMarket,
      WHMarket,
      SBMarket,
      TABMarket,
      SbookMarket,
      LadMarket,
    ];
    const bookNames = [
      "PointsBet",
      "Kambi",
      "FoxBet",
      "William Hill",
      "SportsBet",
      "TAB",
      "Superbook",
      "Ladbrokes",
    ];

    let books = [...Array(markets.length).keys()];

    let topBook;
    let topMarket;

    for (const idx of books) {
      const thisMarket = markets[idx];
      const thisBook = bookNames[idx];

      if (thisMarket) {
        if (!topBook) {
          topBook = thisBook;
          topMarket = thisMarket;
        } else {
          if (stat === "First Basket") {
            let thisPrice = thisMarket.overPrice;
            let topPrice = topMarket.overPrice;

            let priceDiff = thisPrice - topPrice;

            if (priceDiff > 0) {
              topBook = thisBook;
              topMarket = thisMarket;
            }
          } else {
            let handicapDiff =
              (topMarket.handicap ? topMarket.handicap : 0) -
              (thisMarket.handicap ? thisMarket.handicap : 0);

            if (isUnder) {
              handicapDiff = -handicapDiff;
            }

            if (handicapDiff == 0) {
              let thisPrice = isUnder
                ? thisMarket.underPrice
                : thisMarket.overPrice;
              let topPrice = isUnder
                ? topMarket.underPrice
                : topMarket.overPrice;

              let priceDiff =
                (thisPrice ? thisPrice : thisMarket.overPrice) -
                (topPrice ? topPrice : topMarket.overPrice);

              if (priceDiff > 0) {
                topBook = thisBook;
                topMarket = thisMarket;
              }
            } else if (handicapDiff > 0) {
              topBook = thisBook;
              topMarket = thisMarket;
            }
          }
        }
      }
    }

    return topBook;
  };

  const highlighting = {
    Points: {
      Over: identifyTopBook(playerMarkets, "Points", false),
      Under: identifyTopBook(playerMarkets, "Points", true),
    },
    Rebounds: {
      Over: identifyTopBook(playerMarkets, "Rebounds", false),
      Under: identifyTopBook(playerMarkets, "Rebounds", true),
    },
    Assists: {
      Over: identifyTopBook(playerMarkets, "Assists", false),
      Under: identifyTopBook(playerMarkets, "Assists", true),
    },
    FirstBasket: {
      Over: identifyTopBook(playerMarkets, "First Basket", false),
      Under: identifyTopBook(playerMarkets, "First Basket", true),
    },
  };

  // const classOfCell = {
  //   PB_Points: highlighting.Points === "PointsBet" ? "mark " : "",
  //   K_Points: highlighting.Points === "Kambi" ? "mark" : "",
  //   FB_Points: highlighting.Points === "FoxBet" ? "mark" : "",
  //   WH_Points: highlighting.Points === "William Hill" ? "mark" : "",
  //   SB_Points: highlighting.Points === "SportsBet" ? "mark" : "",
  //   TAB_Points: highlighting.Points === "TAB" ? "mark" : "",
  //   PB_Rebs: highlighting.Rebounds === "PointsBet" ? "mark" : "",
  //   K_Rebs: highlighting.Rebounds === "Kambi" ? "mark" : "",
  //   FB_Rebs: highlighting.Rebounds === "FoxBet" ? "mark" : "",
  //   WH_Rebs: highlighting.Rebounds === "William Hill" ? "mark" : "",
  //   SB_Rebs: highlighting.Rebounds === "SportsBet" ? "mark" : "",
  //   TAB_Rebs: highlighting.Rebounds === "TAB" ? "mark" : "",
  //   PB_Ass: highlighting.Assists === "PointsBet" ? "mark" : "",
  //   K_Ass: highlighting.Assists === "Kambi" ? "mark" : "",
  //   FB_Ass: highlighting.Assists === "FoxBet" ? "mark" : "",
  //   WH_Ass: highlighting.Assists === "William Hill" ? "mark" : "",
  //   SB_Ass: highlighting.Assists === "SportsBet" ? "mark" : "",
  //   TAB_Ass: highlighting.Assists === "TAB" ? "mark" : "",
  //   PB_FB: highlighting.FirstBasket === "PointsBet" ? "mark" : "",
  //   K_FB: highlighting.FirstBasket === "Kambi" ? "mark" : "",
  //   FB_FB: highlighting.FirstBasket === "FoxBet" ? "mark" : "",
  //   WH_FB: highlighting.FirstBasket === "William Hill" ? "mark" : "",
  //   SB_FB: highlighting.FirstBasket === "SportsBet" ? "mark" : "",
  //   TAB_FB: highlighting.FirstBasket === "TAB" ? "mark" : "",
  // };

  const defineClassOfCell = (stat, sportsbook, overunder) => {
    if (highlighting[stat]) {
      return highlighting[stat][overunder] === sportsbook ? "mark " : "";
    } else {
      return "";
    }
  };

  const populateThreeRowSnippet = (stat, sportsbook, isAmerican = false) => {
    return (
      <td>
        <p>
          <h6>{grabHandicapWrapper(stat, sportsbook, isUnder, isAmerican)}</h6>
        </p>
        <p className={defineClassOfCell(stat, sportsbook, "Over")}>
          {grabPriceWrapper(stat, sportsbook, false, isAmerican)}
        </p>
        <p className={defineClassOfCell(stat, sportsbook, "Under")}>
          {grabPriceWrapper(stat, sportsbook, true, isAmerican)}
        </p>
      </td>
    );
  };

  const populateSingleRowSnippet = (
    stat,
    sportsbook,
    isUnder = false,
    isAmerican = false
  ) => {
    let AltStat =
      stat === "First Basket" && sportsbook === "Kambi"
        ? "First Field Goal"
        : stat;

    return (
      <td className={defineClassOfCell(stat, sportsbook, "Over")}>
        {grabPriceWrapper(AltStat, sportsbook, isUnder, isAmerican)}
      </td>
    );
  };

  const bookNames = [
    "PointsBet",
    "Kambi",
    "FoxBet",
    "William Hill",
    "SportsBet",
    "TAB",
    "Superbook",
    "Ladbrokes",
  ];

  const openInNewTab = (url) => {
    const newWindow = window.open(url, "_blank", "noopener,noreferrer");
    if (newWindow) newWindow.opener = null;
  };

  return (
    <div className="card bg-white border border-info">
      {getARedirect(redirect)}
      <div className="card-body">
        <h3 className="card-title text-dark text-center  font-weight-bold">
          <u>{`${playerNameForDisplay}${teamAndPosition}`}</u>
        </h3>
        <p className="text-dark text-center font-weight-light font-italic">
          {playerStats ? `${playerStats.games} games, ` : ""}
          {playerStats ? `${playerStats.min} mins per game` : ""}
          <p className="text-white">{playerStats ? "" : "I am empty"}</p>
        </p>
        <div className="container">
          <table className="table table-striped text-center">
            <thead>
              <tr>
                <th scope="col" className="align-middle"></th>
                <th scope="col" className="align-middle">
                  Season Avg
                </th>
                <th scope="col" className="align-middle">
                  PointsBet
                </th>
                <th scope="col" className="align-middle">
                  DraftKings
                </th>
                <th scope="col" className="align-middle">
                  FoxBet
                </th>
                <th scope="col" className="align-middle">
                  William Hill
                </th>
                <th scope="col" className="align-middle">
                  SportsBet
                </th>
                <th scope="col" className="align-middle">
                  TAB
                </th>
                <th scope="col" className="align-middle">
                  Superbook
                </th>
                <th scope="col" className="align-middle">
                  Ladbrokes
                </th>
              </tr>
            </thead>

            <tr>
              <td className="font-weight-bold align-middle">
                <p>Points</p>
                <p className="font-weight-light font-italic">Over</p>
                <p className="font-weight-light font-italic">Under</p>
              </td>
              <td className="font-weight-light font-italic">
                {playerStats ? Number(playerStats.pts).toFixed(1) : "?"}
              </td>
              {bookNames.map((book) => {
                return populateThreeRowSnippet("Points", book, isAmerican);
              })}
            </tr>

            <tr>
              <td className="font-weight-bold align-middle">
                <p>Rebounds</p>
                <p className="font-weight-light font-italic">Over</p>
                <p className="font-weight-light font-italic">Under</p>
              </td>
              <td className="font-weight-light font-italic">
                {playerStats ? Number(playerStats.reb).toFixed(1) : "?"}
              </td>
              {bookNames.map((book) => {
                return populateThreeRowSnippet("Rebounds", book, isAmerican);
              })}
            </tr>

            <tr>
              <td className="font-weight-bold align-middle">
                <p>Assists</p>
                <p className="font-weight-light font-italic">Over</p>
                <p className="font-weight-light font-italic">Under</p>
              </td>
              <td className="font-weight-light font-italic">
                {playerStats ? Number(playerStats.ast).toFixed(1) : "?"}
              </td>
              {bookNames.map((book) => {
                return populateThreeRowSnippet("Assists", book, isAmerican);
              })}
            </tr>

            <tr>
              <td className="font-weight-bold align-middle">First Basket</td>
              <td className="font-weight-light font-italic"> </td>
              {bookNames.map((book) => {
                return populateSingleRowSnippet(
                  "First Basket",
                  book,
                  isUnder,
                  isAmerican
                );
              })}
            </tr>

            <tr>
              <td colSpan="10">
                <button
                  className="btn btn-block border bg-light"
                  onClick={() => openInNewTab(Bballreference)}
                >
                  Research <em>{playerNameForDisplay}</em> at Basketball
                  Reference
                </button>
              </td>
              <td></td>
            </tr>
          </table>
        </div>
      </div>
    </div>
  );
};

export default CardMarkets;
