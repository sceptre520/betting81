import React, { useState, useEffect } from "react";
import { Link, Redirect } from "react-router-dom";
import { getPlayers, getPlayerStats } from "./helper/playerHelper";

const CardMarkets_NHL = ({ market, player, isUnder, isAmerican }) => {
  const [redirect, setRedirect] = useState(false);

  const [playerData, setplayerData] = useState([]);
  //   const [playerStats, setplayerStats] = useState({});
  const [teamAndPosition, setteamAndPosition] = useState("");

  const preload = () => {
    getPlayers().then((data) => {
      setplayerData(data);

      const thisPlayerDBEntry = data.filter((o) => {
        return (
          o.playerName.toLowerCase().replace(/[^\w\s]/gi, "") ===
          player.toLowerCase().replace(/[^\w\s]/gi, "")
        );
      });

      if (thisPlayerDBEntry[0]) {
        setteamAndPosition(
          ` (${thisPlayerDBEntry[0] ? thisPlayerDBEntry[0].teamAbbrev : ""}, ${
            thisPlayerDBEntry[0] ? thisPlayerDBEntry[0].position : ""
          })`
        );
        return thisPlayerDBEntry[0].BDL_id;
      }
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
    if (price) {
      if (isAmerican) {
        if (price >= 2) {
          return `+${(100 * (price - 1)).toFixed(0)}`;
        } else {
          return (-100 / (price - 1)).toFixed(0);
        }
      } else {
        return `$${price.toFixed(2)}`;
      }
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
      if (isUnder && data[0].marketType !== "First Goal") {
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

  const Bballreference = `https://www.hockey-reference.com/search/search.fcgi?search=${playerName.replaceAll(
    " ",
    "+"
  )}`;

  const identifyTopBook = (playerMarkets, stat, isUnder) => {
    const PointsBetMarket = getByValue(playerMarkets, stat, "PointsBet")[0];
    const KambiMarket = getByValue(
      playerMarkets,
      stat === "First Basket" ? "First Field Goal" : stat,
      "Kambi"
    )[0];
    const WHMarket = getByValue(
      playerMarkets,
      stat === "First Basket" ? "First Field Goal" : stat,
      "William Hill"
    )[0];
    const SbookMarket = getByValue(
      playerMarkets,
      stat === "First Basket" ? "First Field Goal" : stat,
      "Superbook"
    )[0];

    const markets = [PointsBetMarket, KambiMarket, WHMarket, SbookMarket];
    const bookNames = ["PointsBet", "Kambi", "William Hill", "Superbook"];

    let books = [...Array(markets.length).keys()];

    let topBook;
    let topMarket;

    for (const idx of books) {
      const thisMarket = markets[idx];
      const thisBook = bookNames[idx];

      if (thisMarket) {
        let priceInQuestion = isUnder
          ? thisMarket.underPrice
          : thisMarket.overPrice;

        if (priceInQuestion > 0) {
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
    }

    return {
      book: topBook,
      market: topMarket,
    };
  };

  const highlighting = {
    Points: {
      Over: identifyTopBook(playerMarkets, "Points", false),
      Under: identifyTopBook(playerMarkets, "Points", true),
    },
    Goals: {
      Over: identifyTopBook(playerMarkets, "Goals", false),
      Under: identifyTopBook(playerMarkets, "Goals", true),
    },
    Assists: {
      Over: identifyTopBook(playerMarkets, "Assists", false),
      Under: identifyTopBook(playerMarkets, "Assists", true),
    },
    FirstGoal: {
      Over: identifyTopBook(playerMarkets, "First Goal", false),
      Under: identifyTopBook(playerMarkets, "First Goal", true),
    },
    Shots: {
      Over: identifyTopBook(playerMarkets, "Shots", false),
      Under: identifyTopBook(playerMarkets, "Shots", true),
    },
  };

  const defineClassOfCell = (stat, sportsbook, overunder) => {
    if (highlighting[stat]) {
      return highlighting[stat][overunder].book === sportsbook
        ? BP[stat] === ""
          ? "infoBorder"
          : BP[stat] < 100
          ? "markgreen"
          : "infoBorder"
        : "";
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

  const defineEffectiveBP = (stat) => {
    if (highlighting[stat]) {
      if (
        highlighting[stat]["Over"].market &&
        highlighting[stat]["Under"].market
      ) {
        let handicapDiff =
          (highlighting[stat]["Over"].market.handicap
            ? highlighting[stat]["Over"].market.handicap
            : 0) -
          (highlighting[stat]["Under"].market.handicap
            ? highlighting[stat]["Under"].market.handicap
            : 0);

        if (handicapDiff === 0) {
          let oPrice = Number(highlighting[stat]["Over"].market.overPrice);
          let uPrice = Number(highlighting[stat]["Under"].market.underPrice);

          if (oPrice > 1 && uPrice > 1) {
            return `${Number(100 / oPrice + 100 / uPrice).toFixed(1)}%`;
          } else {
            return "?";
          }
        } else {
          return "?";
        }
      }
    } else {
      return "?";
    }
  };

  const BP = {
    Points: defineEffectiveBP("Points")
      ? Number(defineEffectiveBP("Points").replace("%", ""))
      : "",
    Goals: defineEffectiveBP("Goals")
      ? Number(defineEffectiveBP("Goals").replace("%", ""))
      : "",
    Assists: defineEffectiveBP("Assists")
      ? Number(defineEffectiveBP("Assists").replace("%", ""))
      : "",
    Shots: defineEffectiveBP("Shots")
      ? Number(defineEffectiveBP("Shots").replace("%", ""))
      : "",
  };

  const classOfBP = {
    Points:
      BP.Points < 100
        ? "font-weight-bold text-success"
        : "font-weight-light font-italic",
    Goals:
      BP.Goals < 100
        ? "font-weight-bold text-success"
        : "font-weight-light font-italic",
    Assists:
      BP.Assists < 100
        ? "font-weight-bold text-success"
        : "font-weight-light font-italic",
    Shots:
      BP.Shots < 100
        ? "font-weight-bold text-success"
        : "font-weight-light font-italic",
  };

  const bookNames = ["PointsBet", "Kambi", "William Hill", "Superbook"];

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
        <p className="text-dark text-center font-weight-light font-italic"></p>
        <div className="container">
          <table className="table table-striped text-center">
            <thead>
              <tr>
                <th scope="col" className="align-middle"></th>
                <th scope="col" className="align-middle">
                  PointsBet
                </th>
                <th scope="col" className="align-middle">
                  DraftKings
                </th>
                <th scope="col" className="align-middle">
                  William Hill
                </th>
                <th scope="col" className="align-middle">
                  Superbook
                </th>
              </tr>
            </thead>
            <tr>
              <td className="font-weight-bold align-middle">First Goal</td>
              {bookNames.map((book) => {
                return populateSingleRowSnippet(
                  "First Goal",
                  book,
                  isUnder,
                  isAmerican
                );
              })}
            </tr>

            <tr>
              <td>
                <p className="font-weight-bold align-middle">Goals</p>
                <p>Over</p>
                <p>Under</p>
              </td>

              {bookNames.map((book) => {
                return populateThreeRowSnippet("Goals", book, isAmerican);
              })}
            </tr>

            <tr>
              <td>
                <p className="font-weight-bold align-middle">Points</p>
                <p>Over</p>
                <p>Under</p>
              </td>
              {bookNames.map((book) => {
                return populateThreeRowSnippet("Points", book, isAmerican);
              })}
            </tr>
            <tr>
              <td>
                <p className="font-weight-bold align-middle">Shots On Target</p>
                <p>Over</p>
                <p>Under</p>
              </td>
              {bookNames.map((book) => {
                return populateThreeRowSnippet("Shots", book, isAmerican);
              })}
            </tr>
            <tr>
              <td>
                <p className="font-weight-bold align-middle">Assists</p>
                <p>Over</p>
                <p>Under</p>
              </td>

              {bookNames.map((book) => {
                return populateThreeRowSnippet("Assists", book, isAmerican);
              })}
            </tr>

            <tr>
              <td colSpan="5">
                <button
                  className="btn btn-block border bg-light"
                  onClick={() => openInNewTab(Bballreference)}
                >
                  Research <em>{playerNameForDisplay}</em> at Hockey Reference
                </button>
              </td>
            </tr>
          </table>
        </div>
      </div>
    </div>
  );
};

export default CardMarkets_NHL;
