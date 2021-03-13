import React, { useState, useEffect } from "react";
import Base from "../core/Base";
import { Link, Redirect } from "react-router-dom";
import { getAMatch } from "./helper/adminapicall";
import { isAutheticated } from "../auth/helper/index";
import Menu from "../core/Menu";
import LogoHelper from "../core/helper/LogoHelper";
import { getMarketsFromMatch } from "../core/helper/marketHelper";
import CardMarkets from "../core/CardMarkets";
import { getMatches } from "../core/helper/matchHelper";
import { getPlayers } from "../core/helper/playerHelper";

const MatchMarkets = ({ match }) => {
  const { user, token } = isAutheticated();

  const [markets, setMarkets] = useState([]);
  const [allMatches, setallMatches] = useState([]);
  //const [allPlayersFromDB, setallPlayersFromDB] = useState([]);
  const [selectedDropdown, setselectedDropdown] = useState(false);
  const [values, setValues] = useState({
    name: "",
    homeTeam: "",
    awayTeam: "",
    date: "",
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
        })
      )
      .then(() => {
        getMatches().then((data) => {
          setallMatches(data);
        });
      });
    // .then(() => {
    //   //grab the BallDontLie player data from mongo DB
    //   getPlayers().then((data) => {
    //     setallPlayersFromDB(data);
    //   });
    // });
  };

  useEffect(() => {
    preload(match.params.matchId);
  }, []);

  const uniquePlayers = markets
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
    .filter((value, index, self) => self.indexOf(value) === index);

  const triggerForButton = () => {};

  const toggleAmerican = () => {
    setValues({
      ...values,
      isAmerican: !isAmerican,
    });
  };

  const toggleUnder = () => {
    setValues({
      ...values,
      isUnder: !isUnder,
    });
  };

  const SetRelevantMatch = (event) => {
    setselectedDropdown(event.target.value);
    RedirectToRelevantMatch(event.target.value);
  };

  const RedirectToRelevantMatch = (selectedDropdown) => {
    window.open(`../match/${selectedDropdown}`, "_self");
  };

  const renderButtons = () => {
    if (markets.length) {
      return (
        <div className="row">
          <div className="col-1"></div>
          <div className="col-8 form-group">
            <select
              className="form-control dropdown-toggle btn btn-warning btn-lg btn-block"
              placeholder="Match"
              onChange={SetRelevantMatch}
            >
              <option className="text-center">Select a different match</option>
              {allMatches &&
                allMatches.map((match, index) => (
                  <option key={index} value={match._id}>
                    {match.name}
                  </option>
                ))}
            </select>
          </div>
          <div className="col-2">
            <button
              className="btn btn-lg btn-info btn-block"
              onClick={toggleAmerican}
            >
              {`View ${isAmerican ? "decimal" : "american"} odds`}
            </button>
          </div>
          <div className="col-1"></div>
        </div>
      );
    } else {
      return (
        <div>
          <Link className="btn btn-lg bg-success btn-block text-white" to="/">
            No markets available, return to home page
          </Link>
        </div>
      );
    }
  };

  return (
    <div>
      <Menu />
      <div className="container-fluid">
        <div className="bg-dark text-white text-center">
          <div className="row">
            <div className="col-1"></div>
            <div className="col-2   align-right">
              <LogoHelper teamId={awayTeam._id} />
            </div>
            <div className="col-6 pt-5">
              <h1>{`${awayTeam.name} @ ${homeTeam.name}`}</h1>
              <p className="lead">
                {new Date(date).toLocaleDateString("en-gb", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                  timeZone: "UTC",
                })}
              </p>
            </div>
            <div className="col-2   align-left">
              <LogoHelper teamId={homeTeam._id} />
            </div>
            <div className="col-1"></div>
          </div>
        </div>
        {renderButtons()}
        <div className="row bg-dark text-white rounded">
          {markets.length && (
            <div className="container-fluid">
              {uniquePlayers.map((thisPlayer, index) => {
                return (
                  <div className="row">
                    <div className="col-1 mb-4"></div>
                    <div key={index} className="col-10 mb-4">
                      <CardMarkets
                        market={markets}
                        player={thisPlayer}
                        isUnder={isUnder}
                        isAmerican={isAmerican}
                      />
                    </div>
                    <div className="col-1 mb-4"></div>
                  </div>
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
