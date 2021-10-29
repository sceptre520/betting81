import React, { useState, useEffect } from "react";
import { Link, Redirect } from "react-router-dom";

const CardMarkets_NBA = ({ market, player, isUnder, isAmerican }) => {
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
      let HandicapPart = "-";
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

  const Bballreference = `https://www.basketball-reference.com/search/search.fcgi?search=${playerName.replaceAll(
    " ",
    "+"
  )}`;

  const identifyTopBook = (playerMarkets, stat, isUnder) => {
    const PointsBetMarket = getByValue(playerMarkets, stat, "PointsBet")[0];
    const KambiMarket = getByValue(playerMarkets, stat, "DraftKings")[0];
    const WHMarket = getByValue(playerMarkets, stat, "William Hill")[0];
    const FBMarket = getByValue(playerMarkets, stat, "FoxBet")[0];
    const RSIMarket = getByValue(playerMarkets, stat, "Rivers")[0];
    const BovadaMarket = getByValue(playerMarkets, stat, "Bovada")[0];
    const SBettingMarket = getByValue(playerMarkets, stat, "MaximBet")[0];

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
    Rebounds: {
      Over: identifyTopBook(playerMarkets, "Rebounds", false),
      Under: identifyTopBook(playerMarkets, "Rebounds", true),
    },
    Assists: {
      Over: identifyTopBook(playerMarkets, "Assists", false),
      Under: identifyTopBook(playerMarkets, "Assists", true),
    },
    PRA: {
      Over: identifyTopBook(playerMarkets, "PRA", false),
      Under: identifyTopBook(playerMarkets, "PRA", true),
    },
    PA: {
      Over: identifyTopBook(playerMarkets, "P+A", false),
      Under: identifyTopBook(playerMarkets, "P+A", true),
    },
    PR: {
      Over: identifyTopBook(playerMarkets, "P+R", false),
      Under: identifyTopBook(playerMarkets, "P+R", true),
    },
    AR: {
      Over: identifyTopBook(playerMarkets, "A+R", false),
      Under: identifyTopBook(playerMarkets, "A+R", true),
    },
    Threes: {
      Over: identifyTopBook(playerMarkets, "Threes", false),
      Under: identifyTopBook(playerMarkets, "Threes", true),
    },
    DD: {
      Over: identifyTopBook(playerMarkets, "Double Double", false),
      Under: identifyTopBook(playerMarkets, "Double Double", true),
    },
    TD: {
      Over: identifyTopBook(playerMarkets, "Triple Double", false),
      Under: identifyTopBook(playerMarkets, "Triple Double", true),
    },
    Blocks: {
      Over: identifyTopBook(playerMarkets, "Blocks", false),
      Under: identifyTopBook(playerMarkets, "Blocks", true),
    },
    Steals: {
      Over: identifyTopBook(playerMarkets, "Steals", false),
      Under: identifyTopBook(playerMarkets, "Steals", true),
    },
    SB: {
      Over: identifyTopBook(playerMarkets, "S+B", false),
      Under: identifyTopBook(playerMarkets, "S+B", true),
    },
    Turnovers: {
      Over: identifyTopBook(playerMarkets, "Turnovers", false),
      Under: identifyTopBook(playerMarkets, "Turnovers", true),
    },
  };

  const defineClassOfCell = (stat, sportsbook, overunder) => {
    let refinedStat;
    if (stat === "Triple Double") {
      refinedStat = "TD";
    } else if (stat === "Double Double") {
      refinedStat = "DD";
    } else if (stat === "P+R") {
      refinedStat = "PR";
    } else if (stat === "P+A") {
      refinedStat = "PA";
    } else if (stat === "A+R") {
      refinedStat = "AR";
    } else if (stat === "S+B") {
      refinedStat = "SB";
    } else {
      refinedStat = stat;
    }

    if (highlighting[refinedStat]) {
      return highlighting[refinedStat][overunder].book === sportsbook
        ? BP[refinedStat] === ""
          ? "infoBorder text-warning font-weight-bold"
          : BP[refinedStat] < 100
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

  const populateTwoRowSnippet = (stat, sportsbook, isAmerican = false) => {
    return (
      <td>
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
    let AltStat = stat;

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
    Points: defineEffectiveBP("Points")
      ? Number(defineEffectiveBP("Points").replace("%", ""))
      : "",
    Rebounds: defineEffectiveBP("Rebounds")
      ? Number(defineEffectiveBP("Rebounds").replace("%", ""))
      : "",
    Assists: defineEffectiveBP("Assists")
      ? Number(defineEffectiveBP("Assists").replace("%", ""))
      : "",
    PRA: defineEffectiveBP("PRA")
      ? Number(defineEffectiveBP("PRA").replace("%", ""))
      : "",
    PA: defineEffectiveBP("PA")
      ? Number(defineEffectiveBP("PA").replace("%", ""))
      : "",
    PR: defineEffectiveBP("PR")
      ? Number(defineEffectiveBP("PR").replace("%", ""))
      : "",
    AR: defineEffectiveBP("AR")
      ? Number(defineEffectiveBP("AR").replace("%", ""))
      : "",
    Threes: defineEffectiveBP("Threes")
      ? Number(defineEffectiveBP("Threes").replace("%", ""))
      : "",
    DD: defineEffectiveBP("DD")
      ? Number(defineEffectiveBP("DD").replace("%", ""))
      : "",
    TD: defineEffectiveBP("TD")
      ? Number(defineEffectiveBP("TD").replace("%", ""))
      : "",
    Blocks: defineEffectiveBP("Blocks")
      ? Number(defineEffectiveBP("Blocks").replace("%", ""))
      : "",
    Steals: defineEffectiveBP("Steals")
      ? Number(defineEffectiveBP("Steals").replace("%", ""))
      : "",
    SB: defineEffectiveBP("SB")
      ? Number(defineEffectiveBP("SB").replace("%", ""))
      : "",
    Turnovers: defineEffectiveBP("Turnovers")
      ? Number(defineEffectiveBP("Turnovers").replace("%", ""))
      : "",
  };

  const classOfBP = {
    Points:
      BP.Points < 100
        ? "font-weight-bold text-success"
        : "font-weight-light font-italic",
    Rebounds:
      BP.Rebounds < 100
        ? "font-weight-bold text-success"
        : "font-weight-light font-italic",
    Assists:
      BP.Assists < 100
        ? "font-weight-bold text-success"
        : "font-weight-light font-italic",
    PRA:
      BP.PRA < 100
        ? "font-weight-bold text-success"
        : "font-weight-light font-italic",
    PA:
      BP.PA < 100
        ? "font-weight-bold text-success"
        : "font-weight-light font-italic",
    PR:
      BP.PR < 100
        ? "font-weight-bold text-success"
        : "font-weight-light font-italic",
    AR:
      BP.AR < 100
        ? "font-weight-bold text-success"
        : "font-weight-light font-italic",
    Threes:
      BP.Threes < 100
        ? "font-weight-bold text-success"
        : "font-weight-light font-italic",
    DD:
      BP.DD < 100
        ? "font-weight-bold text-success"
        : "font-weight-light font-italic",
    TD:
      BP.TD < 100
        ? "font-weight-bold text-success"
        : "font-weight-light font-italic",
    Blocks:
      BP.Blocks < 100
        ? "font-weight-bold text-success"
        : "font-weight-light font-italic",
    Steals:
      BP.Steals < 100
        ? "font-weight-bold text-success"
        : "font-weight-light font-italic",
    SB:
      BP.SB < 100
        ? "font-weight-bold text-success"
        : "font-weight-light font-italic",
    Turnovers:
      BP.Turnovers < 100
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

  const PointsRows = () => {
    if (!(doesMarketExist(playerMarkets, "Points") > 0)) {
      return null;
    }

    return (
      <tr>
        <td colspan="2">
          <p className="font-weight-bold align-middle">Points</p>
          <p>Over</p>
          <p>Under</p>
        </td>

        {bookNames.map((book) => {
          return populateThreeRowSnippet("Points", book, isAmerican);
        })}
      </tr>
    );
  };

  const ReboundsRows = () => {
    if (!(doesMarketExist(playerMarkets, "Rebounds") > 0)) {
      return null;
    }

    return (
      <tr>
        <td colspan="2">
          <p className="font-weight-bold align-middle">Rebounds</p>
          <p>Over</p>
          <p>Under</p>
        </td>

        {bookNames.map((book) => {
          return populateThreeRowSnippet("Rebounds", book, isAmerican);
        })}
      </tr>
    );
  };

  const AssistsRows = () => {
    if (!(doesMarketExist(playerMarkets, "Assists") > 0)) {
      return null;
    }

    return (
      <tr>
        <td colspan="2">
          <p className="font-weight-bold align-middle">Assists</p>
          <p>Over</p>
          <p>Under</p>
        </td>

        {bookNames.map((book) => {
          return populateThreeRowSnippet("Assists", book, isAmerican);
        })}
      </tr>
    );
  };

  const PRARows = () => {
    if (!(doesMarketExist(playerMarkets, "PRA") > 0)) {
      return null;
    }

    return (
      <tr>
        <td colspan="2">
          <p className="font-weight-bold align-middle">Pts + Reb + Ast</p>
          <p>Over</p>
          <p>Under</p>
        </td>

        {bookNames.map((book) => {
          return populateThreeRowSnippet("PRA", book, isAmerican);
        })}
      </tr>
    );
  };

  const ThreesRows = () => {
    if (!(doesMarketExist(playerMarkets, "Threes") > 0)) {
      return null;
    }

    return (
      <tr>
        <td colspan="2">
          <p className="font-weight-bold align-middle">3 Pointers</p>
          <p>Over</p>
          <p>Under</p>
        </td>

        {bookNames.map((book) => {
          return populateThreeRowSnippet("Threes", book, isAmerican);
        })}
      </tr>
    );
  };

  const DDRows = () => {
    if (!(doesMarketExist(playerMarkets, "Double Double") > 0)) {
      return null;
    }

    return (
      <tr>
        <td colspan="2">
          <p className="font-weight-bold align-middle">Double Double</p>
          <p>No</p>
        </td>

        {bookNames.map((book) => {
          return populateTwoRowSnippet("Double Double", book, isAmerican);
        })}
      </tr>
    );
  };

  const TDRows = () => {
    if (!(doesMarketExist(playerMarkets, "Triple Double") > 0)) {
      return null;
    }

    return (
      <tr>
        <td colspan="2">
          <p className="font-weight-bold align-middle">Triple Double</p>
          <p>No</p>
        </td>

        {bookNames.map((book) => {
          return populateTwoRowSnippet("Triple Double", book, isAmerican);
        })}
      </tr>
    );
  };

  const BlocksRows = () => {
    if (!(doesMarketExist(playerMarkets, "Blocks") > 0)) {
      return null;
    }

    return (
      <tr>
        <td colspan="2">
          <p className="font-weight-bold align-middle">Blocks</p>
          <p>Over</p>
          <p>Under</p>
        </td>

        {bookNames.map((book) => {
          return populateThreeRowSnippet("Blocks", book, isAmerican);
        })}
      </tr>
    );
  };

  const StealsRows = () => {
    if (!(doesMarketExist(playerMarkets, "Steals") > 0)) {
      return null;
    }

    return (
      <tr>
        <td colspan="2">
          <p className="font-weight-bold align-middle">Steals</p>
          <p>Over</p>
          <p>Under</p>
        </td>

        {bookNames.map((book) => {
          return populateThreeRowSnippet("Steals", book, isAmerican);
        })}
      </tr>
    );
  };

  const TurnoversRows = () => {
    if (!(doesMarketExist(playerMarkets, "Turnovers") > 0)) {
      return null;
    }

    return (
      <tr>
        <td colspan="2">
          <p className="font-weight-bold align-middle">Turnovers</p>
          <p>Over</p>
          <p>Under</p>
        </td>

        {bookNames.map((book) => {
          return populateThreeRowSnippet("Turnovers", book, isAmerican);
        })}
      </tr>
    );
  };

  const PARows = () => {
    if (!(doesMarketExist(playerMarkets, "P+A") > 0)) {
      return null;
    }

    return (
      <tr>
        <td colspan="2">
          <p className="font-weight-bold align-middle">Points+Assists</p>
          <p>Over</p>
          <p>Under</p>
        </td>

        {bookNames.map((book) => {
          return populateThreeRowSnippet("P+A", book, isAmerican);
        })}
      </tr>
    );
  };

  const PRRows = () => {
    if (!(doesMarketExist(playerMarkets, "P+R") > 0)) {
      return null;
    }

    return (
      <tr>
        <td colspan="2">
          <p className="font-weight-bold align-middle">Points+Rebounds</p>
          <p>Over</p>
          <p>Under</p>
        </td>

        {bookNames.map((book) => {
          return populateThreeRowSnippet("P+R", book, isAmerican);
        })}
      </tr>
    );
  };

  const ARRows = () => {
    if (!(doesMarketExist(playerMarkets, "A+R") > 0)) {
      return null;
    }

    return (
      <tr>
        <td colspan="2">
          <p className="font-weight-bold align-middle">Assists+Rebounds</p>
          <p>Over</p>
          <p>Under</p>
        </td>

        {bookNames.map((book) => {
          return populateThreeRowSnippet("A+R", book, isAmerican);
        })}
      </tr>
    );
  };

  const SBRows = () => {
    if (!(doesMarketExist(playerMarkets, "S+B") > 0)) {
      return null;
    }

    return (
      <tr>
        <td colspan="2">
          <p className="font-weight-bold align-middle">Steals+Blocks</p>
          <p>Over</p>
          <p>Under</p>
        </td>

        {bookNames.map((book) => {
          return populateThreeRowSnippet("S+B", book, isAmerican);
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

            <PointsRows />
            <ReboundsRows />
            <AssistsRows />
            <PRARows />
            <PARows />
            <PRRows />
            <ARRows />
            <ThreesRows />
            <DDRows />
            <TDRows />
            <BlocksRows />
            <StealsRows />
            <SBRows />
            <TurnoversRows />
          </table>
        </div>
      </div>
    </div>
  );
};

export default CardMarkets_NBA;
