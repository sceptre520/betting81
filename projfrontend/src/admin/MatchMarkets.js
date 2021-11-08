import React, { useState, useEffect } from "react";
import Base from "../core/Base";
import { Link, Redirect } from "react-router-dom";
import { getAMatch } from "./helper/adminapicall";
import { isAutheticated } from "../auth/helper/index";
import Menu from "../core/Menu";
import LogoHelper from "../core/helper/LogoHelper";
import { getMarketsFromMatch } from "../core/helper/marketHelper";
import CardMarkets_NBA from "../core/CardMarkets_NBA";
import CardMarkets_NHL from "../core/CardMarkets_NHL";
import CardMarkets_NFL from "../core/CardMarkets_NFL";

import { getMatches } from "../core/helper/matchHelper";
import { getPlayers } from "../core/helper/playerHelper";
import { getAUser } from "../user/helper/userapicalls";

const MatchMarkets = ({ match }) => {
  const { user, token } = isAutheticated();

  const [markets, setMarkets] = useState([]);
  const [allMatches, setallMatches] = useState([]);
  const [oddsPref, setOddsPref] = useState([]);

  const [selectedMarketType, setSelectedMarketType] = useState([]);
  const [selectedPlayer, setSelectedPlayer] = useState([]);

  const [filteredMarkets, setFilteredMarkets] = useState([]);
  const [uniquePlayers, setuniquePlayers] = useState([]);

  //const [allPlayersFromDB, setallPlayersFromDB] = useState([]);
  const [selectedDropdown, setselectedDropdown] = useState(false);
  const [values, setValues] = useState({
    name: "",
    homeTeam: "",
    awayTeam: "",
    date: "",
    league: "",
    loading: false,
    error: "",
    getaRedirect: false,

    isUnder: false,
    isAmerican: false,
  });

  const {
    name,
    homeTeam,
    awayTeam,
    date,
    league,
    loading,
    error,
    createdProduct,
    getaRedirect,
    isUnder,
    isAmerican,
  } = values;

  const preload = (matchId) => {
    getAMatch(matchId)
      .then((data) => {
        //console.log(data);
        if (data.error) {
          setValues({ ...values, error: data.error });
        } else {
          console.log(data);
          setValues({
            ...values,
            name: data.name,
            awayTeam: data.awayTeam,
            homeTeam: data.homeTeam,
            date: data.date,
            league: data.league,
          });
        }
      })
      .then(() =>
        getMarketsFromMatch(match.params.matchId).then((data) => {
          const sorted = data.sort(
            (a, b) =>
              (b.handicap ? b.handicap : 0) - (a.handicap ? a.handicap : 0)
          );
          setMarkets(sorted);
          setFilteredMarkets(sorted);
          defineUniquePlayers(sorted);
        })
      )
      .then(() => {
        getMatches().then((data) => {
          setallMatches(data);
        });
      });

    setSelectedMarketType("Prop Type");
    setSelectedPlayer("Player");
  };

  const preloadUserPreferences = (userId) => {
    getAUser(userId).then((user) => {
      setOddsPref(user.oddsPreference);
    });
  };

  useEffect(() => {
    preload(match.params.matchId);
    if (user) {
      preloadUserPreferences(user._id);
    } else {
      setOddsPref(true);
    }
  }, []);

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

  const defineUniquePlayers = (filteredMarkets) => {
    setuniquePlayers(
      filteredMarkets
        .filter((o) => {
          return !(o.sportsbook === "TAB" || o.sportsbook === "FoxBet");
        })
        .map((item) => {
          let lowercaseName = item.player
            .normalize("NFD")
            .replace(/[^\w\s]|_/g, "")
            .replace(/\s+/g, " ")
            .toLowerCase();
          return lowercaseName.replace(/[^\w\s]/gi, "");
        })
        .filter((value, index, self) => self.indexOf(value) === index)
        .filter((value, index, self) => {
          return !self.some((o) => {
            if (o !== value) {
              return (
                mutation(o, value) &&
                o.substring(0, 1) === value.substring(0, 1)
              );
            }
          });
        })
        .filter((o) => {
          return (
            !o.includes("efense") &&
            !o.includes("ouchdown") &&
            !o.includes("oalscorer")
          );
        })
    );
  };

  const toggleAmerican = () => {
    setOddsPref(1 - oddsPref);
  };

  const SetRelevantMatch = (event) => {
    setselectedDropdown(event.target.value);
    RedirectToRelevantMatch(event.target.value);
  };

  const RedirectToRelevantMatch = (selectedDropdown) => {
    window.open(`../match/${selectedDropdown}`, "_self");
  };

  const convertUTCDateToLocalDate = (date) => {
    var dateLocal = new Date(date);
    var newDate = new Date(
      dateLocal.getTime() - dateLocal.getTimezoneOffset() * 60 * 1000
    );
    return newDate;
  };

  const GetPlayerDropdownList = (uniquePlayers) => {
    const up = uniquePlayers;
    const out = up.sort().map((player, index) => (
      <option key={index} value={player._id}>
        {player
          .split(" ")
          .map((word) => {
            return word[0].toUpperCase() + word.substring(1);
          })
          .join(" ")}
      </option>
    ));

    return out;
  };

  ////////////////////////////////////////////////////////////////
  // compile lists for dropdown filters
  const marketMarketTypes = markets.map((market) => {
    return market.marketType;
  });
  const uniqueMarketTypes = [...new Set(marketMarketTypes)];

  const SetRelevantPlayer = (event) => {
    const PlayerOfInterest = event.target.value;
    setSelectedPlayer(PlayerOfInterest);
    UpdateFilters(PlayerOfInterest, selectedMarketType);
  };

  const SetRelevantMarketType = (event) => {
    const MarketTypeOfInterest = event.target.value;
    setSelectedMarketType(MarketTypeOfInterest);
    UpdateFilters(selectedPlayer, MarketTypeOfInterest);
  };

  const clearFilters = (event) => {
    setFilteredMarkets(markets);

    setSelectedMarketType("Prop Type");
    setSelectedPlayer("Player");
  };

  // action filters
  const UpdateFilters = (selectedPlayer, selectedMarketType) => {
    const theFiltering = markets.filter((o) => {
      return (selectedPlayer === "Player"
        ? true
        : o.player
            .normalize("NFD")
            .replace(/[^\w\s]|_/g, "")
            .replace(/\s+/g, " ")
            .toLowerCase()
            .replace(/[^\w\s]/gi, "")) === selectedPlayer &&
        selectedMarketType === "Prop Type"
        ? true
        : o.marketType === selectedMarketType;
    });
    setFilteredMarkets(theFiltering);
    defineUniquePlayers(theFiltering);
  };

  ////////////////////////////////////////////////
  const renderButtons = () => {
    if (markets.length) {
      return (
        <div className="row m-4">
          <div className="col-8 form-group">
            <select
              className="form-control dropdown-toggle btn-warning bg-warning-alt btn-lg btn-block text-white"
              placeholder="Match"
              onChange={SetRelevantMatch}
            >
              <option className="text-center text-white">
                Select a different match
              </option>
              {allMatches &&
                allMatches.map((match, index) => (
                  <option key={index} value={match._id}>
                    {match.name}
                  </option>
                ))}
            </select>
          </div>
          <div className="col-4">
            <button
              className="btn btn-lg  btn-warning bg-warning-alt btn-block text-white"
              onClick={toggleAmerican}
            >
              {`Switch to ${oddsPref ? "Decimal" : "American"}`}
            </button>
          </div>
        </div>
      );
    } else {
      return (
        <div>
          <Link
            className="btn btn-lg bg-success-alt btn-block text-white"
            to="/player-prop-arbitrage-betting-service"
          >
            No markets available, select a different match
          </Link>
        </div>
      );
    }
  };

  const renderButtons2 = () => {
    return (
      <div className="row m-4">
        <div className="col-4 form-group">
          <select
            className="form-control dropdown-toggle btn-warning bg-warning-alt btn-lg btn-block text-white"
            placeholder="MarketType"
            value={selectedMarketType}
            onChange={SetRelevantMarketType}
          >
            <option className="text-center text-white">Prop Type</option>
            {uniqueMarketTypes &&
              uniqueMarketTypes.map((marketType, index) => (
                <option key={index} value={marketType}>
                  {marketType}
                </option>
              ))}
          </select>
        </div>
        <div className="col-4 form-group">
          <select
            className="form-control dropdown-toggle btn-warning bg-warning-alt btn-lg btn-block text-white"
            placeholder="Player"
            value={selectedPlayer}
            onChange={SetRelevantPlayer}
          >
            <option className="text-center text-white">Player</option>
            {uniquePlayers &&
              uniquePlayers.map((player, index) => (
                <option key={index} value={player}>
                  {player}
                </option>
              ))}
          </select>
        </div>

        <div className="col-4">
          <button
            className="btn btn-lg  btn-warning bg-warning-alt btn-block text-white"
            onClick={clearFilters}
          >
            Clear all filters
          </button>
        </div>
      </div>
    );
  };

  const cardSnippet = (markets, thisPlayer, isUnder, oddsPref, index) => {
    if (league === "NBA") {
      return (
        <div className="row">
          <div key={index} className="col-1"></div>
          <div key={index} className="col-10 mb-4">
            <CardMarkets_NBA
              market={markets}
              player={thisPlayer}
              isUnder={isUnder}
              isAmerican={oddsPref}
            />
          </div>
          <div key={index} className="col-1"></div>
        </div>
      );
    } else if (league === "NHL") {
      return (
        <div className="row">
          <div key={index} className="col-1"></div>
          <div key={index} className="col-10 mb-4">
            <CardMarkets_NHL
              market={markets}
              player={thisPlayer}
              isUnder={isUnder}
              isAmerican={oddsPref}
            />
          </div>
          <div key={index} className="col-1"></div>
        </div>
      );
    } else if (league === "NFL") {
      return (
        <div className="row card-markets m-4">
          <div key={index} className="col-12">
            <CardMarkets_NFL
              market={markets}
              player={thisPlayer}
              isUnder={isUnder}
              isAmerican={oddsPref}
            />
          </div>
        </div>
      );
    } else {
      return (
        <div className="row">
          <div key={index} className="col-1"></div>
          <div key={index} className="col-10 mb-4">
            <CardMarkets_NFL
              market={markets}
              player={thisPlayer}
              isUnder={isUnder}
              isAmerican={oddsPref}
            />
          </div>
          <div key={index} className="col-1"></div>
        </div>
      );
    }
  };

  return (
    <div>
      <Menu />
      <div className="container-fluid m-auto">
        <div className="bg-dark-alt text-white text-center">
          <div className="row">
            <div className="col-3   align-right">
              <LogoHelper team={awayTeam} />
            </div>
            <div className="col-6 pt-1">
              <h1 className="matchPageHeader">{`${awayTeam.name} @ ${homeTeam.name}`}</h1>
              <p className="lead date">
                {convertUTCDateToLocalDate(date).toLocaleDateString("en-gb", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })}
              </p>
            </div>
            <div className="col-3   align-left">
              <LogoHelper team={homeTeam} />
            </div>
          </div>
          <br></br>
        </div>
        {renderButtons()}
        {renderButtons2()}
        <div className="row bg-dark-alt text-white rounded">
          {filteredMarkets.length && (
            <div className="container-fluid">
              {uniquePlayers.map((thisPlayer, index) => {
                return cardSnippet(
                  filteredMarkets,
                  thisPlayer,
                  isUnder,
                  oddsPref,
                  index
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MatchMarkets;
