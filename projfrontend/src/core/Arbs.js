import React, { useState, useEffect } from "react";
import "../styles.css";
import Base from "./Base";
import { queryForAllArbs } from "./helper/arbHelper";
import { Link } from "react-router-dom";

import CardsForArbs from "./CardsForArbs";
import CardsForMiddles from "./CardsForMiddles";

export default function Arbs() {
  const [arbs, setArbs] = useState([]);
  const [filteredArbs, setFilteredArbs] = useState([]);
  const [middles, setMiddles] = useState([]);
  const [filteredMiddles, setFilteredMiddles] = useState([]);

  const [selectedLeague, setSelectedLeague] = useState([]);
  const [selectedMatch, setSelectedMatch] = useState([]);
  const [selectedMarketType, setSelectedMarketType] = useState([]);

  const [error, setError] = useState(false);

  let isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

  const loadAllArbs = () => {
    queryForAllArbs().then((data) => {
      if (data.error) {
        setError(data.error);
      } else {
        if (data) {
          const Output = data.map((arb) => {
            if (arb.overMarketId && arb.underMarketId) {
              if (arb.overMarketId.matchId) {
                let league = arb.overMarketId.matchId.league;
                let matchName = arb.overMarketId.matchId.name;
                let matchId = arb.overMarketId.matchId._id;
                let player = arb.overMarketId.player;
                let marketType = arb.overMarketId.marketType;
                let Ohandicap = arb.overMarketId.handicap;
                let Uhandicap = arb.underMarketId.handicap;
                let overSportsbook = arb.overMarketId.sportsbook;
                let overPrice = arb.overMarketId.overPrice;

                let underSportsbook = arb.underMarketId.sportsbook;
                let underPrice = arb.underMarketId.underPrice;

                let overString = `Over $${overPrice.toFixed(
                  2
                )} (${overSportsbook})`;
                let underString = `Under $${underPrice.toFixed(
                  2
                )} (${underSportsbook})`;
                return {
                  arbId: arb._id,
                  ArbOrMiddle: arb.ArbOrMiddle,
                  matchPath: `/match/${matchId}`,
                  league: league,
                  matchName: matchName,
                  player: player,
                  marketType: marketType,
                  Ohandicap: Ohandicap,
                  Uhandicap: Uhandicap,
                  overString: overString,
                  underString: underString,
                  bookPerc: 1 / overPrice + 1 / underPrice,
                  middleSize: Uhandicap - Ohandicap,
                };
              }
            }
          });

          if (Output) {
            const arbInstances = Output.filter((o) => {
              if (o) {
                return o.ArbOrMiddle === "arb";
              }
            });

            const sortedArbInstances = arbInstances
              .sort((a, b) => {
                return b.middleSize - a.middleSize;
              })
              .sort((a, b) => {
                return a.bookPerc - b.bookPerc;
              });

            if (sortedArbInstances) {
              let OutputVar = [];
              let OutputId = [];

              sortedArbInstances.forEach((i) => {
                const thisVar =
                  i.player + "|" + i.marketType + "|" + i.matchPath;

                if (!OutputVar.includes(thisVar)) {
                  OutputVar.push(thisVar);
                  OutputId.push(i.arbId);
                }
              });

              const ArbsUnique = sortedArbInstances.filter((o) => {
                return OutputId.includes(o.arbId);
              });

              setArbs(ArbsUnique);
              setFilteredArbs(ArbsUnique);
            }

            const middleInstances = Output.filter((o) => {
              if (o) {
                return o.ArbOrMiddle === "middle";
              }
            });

            const sortedMiddleInstances = middleInstances
              .sort((a, b) => {
                return a.bookPerc - b.bookPerc;
              })
              .sort((a, b) => {
                return b.middleSize - a.middleSize;
              });

            if (sortedMiddleInstances) {
              let OutputVar = [];
              let OutputId = [];

              sortedMiddleInstances.forEach((i) => {
                const thisVar =
                  i.player + "|" + i.marketType + "|" + i.matchPath;

                if (!OutputVar.includes(thisVar)) {
                  OutputVar.push(thisVar);
                  OutputId.push(i.arbId);
                }
              });

              const MiddlesUnique = sortedMiddleInstances.filter((o) => {
                return OutputId.includes(o.arbId);
              });
              setMiddles(MiddlesUnique);
              setFilteredMiddles(MiddlesUnique);
              setSelectedMarketType("Prop Type");
              setSelectedLeague("League");
              setSelectedMatch("Match");
            }
          }
        }
      }
    });
  };

  useEffect(() => {
    loadAllArbs();
  }, []);

  ////////////////////////////////////////////////////////////////
  // compile lists for dropdown filters
  const arbLeagues = filteredArbs.map((arb) => {
    return arb.league;
  });
  const middleLeagues = filteredMiddles.map((arb) => {
    return arb.league;
  });
  const allLeagues = arbLeagues.concat(middleLeagues);
  const uniqueLeagues = [...new Set(allLeagues)];

  const arbMatches = filteredArbs.map((arb) => {
    return arb.matchName;
  });
  const middleMatches = filteredMiddles.map((arb) => {
    return arb.matchName;
  });
  const allMatches = arbMatches.concat(middleMatches);
  const uniqueMatches = [...new Set(allMatches)];

  const arbMarketTypes = filteredArbs.map((arb) => {
    return arb.marketType;
  });
  const middleMarketTypes = filteredMiddles.map((arb) => {
    return arb.marketType;
  });
  const allMarketTypes = arbMarketTypes.concat(middleMarketTypes);
  const uniqueMarketTypes = [...new Set(allMarketTypes)];

  // action filters
  const UpdateFilters = (selectedLeague, selectedMatch, selectedMarketType) => {
    setFilteredArbs(
      arbs.filter((o) => {
        return (
          (selectedMatch === "Match" ? true : o.matchName === selectedMatch) &&
          (selectedLeague === "League" ? true : o.league === selectedLeague) &&
          (selectedMarketType === "Prop Type"
            ? true
            : o.marketType === selectedMarketType)
        );
      })
    );

    setFilteredMiddles(
      middles.filter((o) => {
        return (
          (selectedMatch === "Match" ? true : o.matchName === selectedMatch) &&
          (selectedLeague === "League" ? true : o.league === selectedLeague) &&
          (selectedMarketType === "Prop Type"
            ? true
            : o.marketType === selectedMarketType)
        );
      })
    );
  };

  const SetRelevantMatch = (event) => {
    const MatchOfInterest = event.target.value;
    setSelectedMatch(MatchOfInterest);
    UpdateFilters(selectedLeague, MatchOfInterest, selectedMarketType);
  };

  const SetRelevantLeague = (event) => {
    const LeagueOfInterest = event.target.value;
    setSelectedLeague(LeagueOfInterest);
    UpdateFilters(LeagueOfInterest, selectedMatch, selectedMarketType);
  };

  const SetRelevantMarketType = (event) => {
    const MarketTypeOfInterest = event.target.value;
    setSelectedMarketType(MarketTypeOfInterest);
    UpdateFilters(selectedLeague, selectedMatch, MarketTypeOfInterest);
  };

  const clearFilters = (event) => {
    setFilteredArbs(arbs);
    setFilteredMiddles(middles);

    setSelectedMarketType("Prop Type");
    setSelectedLeague("League");
    setSelectedMatch("Match");
  };

  const renderButtons = () => {
    return (
      <div className="row m-4">
        <div className="col-2 form-group">
          <select
            className="form-control dropdown-toggle btn-warning bg-warning-alt btn-lg btn-block text-white"
            placeholder="League"
            value={selectedLeague}
            onChange={SetRelevantLeague}
          >
            <option className="text-center text-white">League</option>
            {uniqueLeagues &&
              uniqueLeagues.map((league, index) => (
                <option key={index} value={league}>
                  {league}
                </option>
              ))}
          </select>
        </div>
        <div className="col-4 form-group">
          <select
            className="form-control dropdown-toggle btn-warning bg-warning-alt btn-lg btn-block text-white"
            placeholder="Match"
            value={selectedMatch}
            onChange={SetRelevantMatch}
          >
            <option className="text-center text-white">Match</option>
            {uniqueMatches &&
              uniqueMatches.map((league, index) => (
                <option key={index} value={league}>
                  {league}
                </option>
              ))}
          </select>
        </div>
        <div className="col-3 form-group">
          <select
            className="form-control dropdown-toggle btn-warning bg-warning-alt btn-lg btn-block text-white"
            placeholder="Prop Type"
            value={selectedMarketType}
            onChange={SetRelevantMarketType}
          >
            <option className="text-center text-white">Prop Type</option>
            {uniqueMarketTypes &&
              uniqueMarketTypes.map((league, index) => (
                <option key={index} value={league}>
                  {league}
                </option>
              ))}
          </select>
        </div>
        <div className="col-3">
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
  ////////////////////////////////////////////////////////////////

  const arbsBody = () => {
    if (arbs.length || middles.length) {
      return (
        <div>
          {renderButtons()}
          <div className="row container-fluid text-center align-center mt-0">
            <div className="row container-fluid card-matches p-2">
              {filteredArbs.map((arb, index) => {
                return (
                  <div key={index} className="card-matches-margins mb-4">
                    <CardsForArbs arb={arb} />
                  </div>
                );
              })}

              {filteredMiddles.map((middle, index) => {
                return (
                  <div key={index} className="card-matches-margins mb-4">
                    <CardsForMiddles middle={middle} />
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      );
    } else {
      return (
        <div className="text-center">
          <div className="row">
            <div className="col-12">
              <button className="btn btn-block mt-2 mb-2 font-weight-bold bg-danger  text-white">
                <Link
                  className="nav-link text-white"
                  to="/player-prop-arbitrage-betting-service"
                >
                  <p className="HowTo">
                    No arbs right now. Check back soon. Scraper may be running.
                    <br></br>
                    Return to home page.
                  </p>
                </Link>
              </button>
            </div>
          </div>
        </div>
      );
    }
  };

  return (
    <Base title="Recommended Bets" description="Arbs and Middles">
      {arbsBody()}
    </Base>
  );
}
