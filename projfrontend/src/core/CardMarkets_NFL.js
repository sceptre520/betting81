import React, { useState, useEffect } from "react";
import { Link, Redirect } from "react-router-dom";

const CardMarkets_NFL = ({ market, player, isUnder, isAmerican }) => {
  const [redirect, setRedirect] = useState(false);

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
      (mutation(playerName, normalizedName) &&
        normalizedName.substring(0, 1) === playerName.substring(0, 1))
    );
  });

  const playerNameForDisplay = playerMarkets[0].player;

  //   const doSomething = () => {
  //     setRedirect(true);
  //   };

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

  const doesMarketExist = (arr, marketType) => {
    var result = arr.filter(function (o) {
      return o.marketType === marketType;
    });

    return result.length;
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
      if (isUnder && data[0].marketType !== "First Touchdown") {
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

  const Bballreference = `https://www.pro-football-reference.com/search/search.fcgi?search=${playerName.replaceAll(
    " ",
    "+"
  )}`;

  const identifyTopBook = (playerMarkets, stat, isUnder) => {
    const PointsBetMarket = getByValue(playerMarkets, stat, "PointsBet")[0];
    const KambiMarket = getByValue(
      playerMarkets,
      stat === "First Basket" ? "First Field Goal" : stat,
      "DraftKings"
    )[0];
    const WHMarket = getByValue(
      playerMarkets,
      stat === "First Basket" ? "First Field Goal" : stat,
      "William Hill"
    )[0];
    const FBMarket = getByValue(
      playerMarkets,
      stat === "First Basket" ? "First Field Goal" : stat,
      "FoxBet"
    )[0];
    const RSIMarket = getByValue(
      playerMarkets,
      stat === "First Basket" ? "First Field Goal" : stat,
      "Rivers"
    )[0];
    const BovadaMarket = getByValue(
      playerMarkets,
      stat === "First Basket" ? "First Field Goal" : stat,
      "Bovada"
    )[0];
    const SBettingMarket = getByValue(
      playerMarkets,
      stat === "First Basket" ? "First Field Goal" : stat,
      "MaximBet"
    )[0];

    const markets = [
      PointsBetMarket,
      KambiMarket,
      WHMarket,
      BovadaMarket,
      SBettingMarket,
      FBMarket,
      RSIMarket,
    ];
    const bookNames = [
      "PointsBet",
      "DraftKings",
      "William Hill",
      "Bovada",
      "MaximBet",
      "FoxBet",
      "Rivers",
    ];

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
            if (stat === "First Touchdown") {
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

              if (handicapDiff === 0) {
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
    Passing: {
      Over: identifyTopBook(playerMarkets, "Passing", false),
      Under: identifyTopBook(playerMarkets, "Passing", true),
    },
    Rushing: {
      Over: identifyTopBook(playerMarkets, "Rushing", false),
      Under: identifyTopBook(playerMarkets, "Rushing", true),
    },
    Receiving: {
      Over: identifyTopBook(playerMarkets, "Receiving", false),
      Under: identifyTopBook(playerMarkets, "Receiving", true),
    },
    FirstTD: {
      Over: identifyTopBook(playerMarkets, "FirstTD", false),
      Under: identifyTopBook(playerMarkets, "FirstTD", true),
    },
  };

  const defineClassOfCell = (stat, sportsbook, overunder) => {
    if (highlighting[stat]) {
      return highlighting[stat][overunder].book === sportsbook
        ? BP[stat] === ""
          ? "infoBorder text-warning font-weight-bold"
          : BP[stat] < 100
          ? "markgreen  font-weight-bold"
          : "infoBorder text-warning font-weight-bold"
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

        if (handicapDiff <= 0) {
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
    Passing: defineEffectiveBP("Passing")
      ? Number(defineEffectiveBP("Passing").replace("%", ""))
      : "",
    Rushing: defineEffectiveBP("Rushing")
      ? Number(defineEffectiveBP("Rushing").replace("%", ""))
      : "",
    Receiving: defineEffectiveBP("Receiving")
      ? Number(defineEffectiveBP("Receiving").replace("%", ""))
      : "",
  };

  const classOfBP = {
    Passing:
      BP.Passing < 100
        ? "font-weight-bold text-success"
        : "font-weight-light font-italic",
    Rushing:
      BP.Rushing < 100
        ? "font-weight-bold text-success"
        : "font-weight-light font-italic",
    Receiving:
      BP.Receiving < 100
        ? "font-weight-bold text-success"
        : "font-weight-light font-italic",
  };

  const bookNames = [
    "PointsBet",
    "DraftKings",
    "William Hill",
    "Bovada",
    "MaximBet",
    "FoxBet",
    "Rivers",
  ];

  const openInNewTab = (url) => {
    const newWindow = window.open(url, "_blank", "noopener,noreferrer");
    if (newWindow) newWindow.opener = null;
  };

  const PassingRows = () => {
    if (!(doesMarketExist(playerMarkets, "Passing") > 0)) {
      return null;
    }

    return (
      <tr>
        <td colspan="2">
          <p className="font-weight-bold align-middle">Passing Yards</p>
          <p>Over</p>
          <p>Under</p>
        </td>

        {bookNames.map((book) => {
          return populateThreeRowSnippet("Passing", book, isAmerican);
        })}
      </tr>
    );
  };

  const RushingRows = () => {
    if (!(doesMarketExist(playerMarkets, "Rushing") > 0)) {
      return null;
    }

    return (
      <tr>
        <td colspan="2">
          <p className="font-weight-bold align-middle">Rushing Yards</p>
          <p>Over</p>
          <p>Under</p>
        </td>

        {bookNames.map((book) => {
          return populateThreeRowSnippet("Rushing", book, isAmerican);
        })}
      </tr>
    );
  };

  const ReceivingRows = () => {
    if (!(doesMarketExist(playerMarkets, "Receiving") > 0)) {
      return null;
    }

    return (
      <tr>
        <td colspan="2">
          <p className="font-weight-bold align-middle">Receiving Yards</p>
          <p>Over</p>
          <p>Under</p>
        </td>

        {bookNames.map((book) => {
          return populateThreeRowSnippet("Receiving", book, isAmerican);
        })}
      </tr>
    );
  };

  const FirstTDRows = () => {
    if (!(doesMarketExist(playerMarkets, "FirstTD") > 0)) {
      return null;
    }

    return (
      <tr>
        <td className="font-weight-bold align-middle" colspan="2">
          First Touchdown
        </td>
        {bookNames.map((book) => {
          return populateSingleRowSnippet("FirstTD", book, isUnder, isAmerican);
        })}
      </tr>
    );
  };

  return (
    <div className="card bg-light-alt border border-info card-shadow">
      {getARedirect(redirect)}

      <a className="text-white" href={Bballreference} target="_blank">
        <div className="card-header lead bg-info-alt">
          <h3 className="card-title text-white text-center  font-weight-bold">
            <u>{`${playerNameForDisplay}`}</u>
          </h3>
        </div>
      </a>

      <div className="card-body">
        <div className="container">
          <table className="table table-striped text-center p-2">
            <thead>
              <tr>
                <th scope="col" className="align-middle" colspan="2"></th>
                <th scope="col" className="align-middle">
                  PointsBet
                </th>
                <th scope="col" className="align-middle">
                  DraftKings
                </th>
                <th scope="col" className="align-middle">
                  Caesars
                </th>
                <th scope="col" className="align-middle">
                  Bovada
                </th>
                <th scope="col" className="align-middle">
                  MaximBet
                </th>
                <th scope="col" className="align-middle">
                  FoxBet
                </th>
                <th scope="col" className="align-middle">
                  BetRivers
                </th>
              </tr>
            </thead>

            <PassingRows />
            <RushingRows />
            <ReceivingRows />
            <FirstTDRows />
          </table>
        </div>
      </div>
    </div>
  );
};

export default CardMarkets_NFL;
