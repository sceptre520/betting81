import React, { useState, useEffect } from "react";
import "../styles.css";
import Base from "./Base";
import { queryForAllArbs } from "./helper/arbHelper";
import { Link } from "react-router-dom";

export default function Arbs() {
  const [arbs, setArbs] = useState([]);
  const [middles, setMiddles] = useState([]);
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
            }
          }
        }
      }
    });
  };

  useEffect(() => {
    loadAllArbs();
  }, []);

  const arbsBody = () => {
    if (arbs.length || middles.length) {
      return (
        <div>
          <div className="text-center">
            <section>
              <ul className="text-center NoBullet">
                {arbs.map((arb, index) => {
                  return (
                    <li key={index}>
                      <p>
                        <b className="text-success">
                          {100 * arb.bookPerc.toFixed(3)}% Arbitrage
                        </b>
                        <br></br>
                        {arb.league}:{" "}
                        <a href={arb.matchPath}>{arb.matchName}</a> <br></br>
                        {arb.player} {arb.marketType} {arb.Ohandicap}
                        <br></br>
                        {arb.overString} / {arb.underString}
                        <br></br>
                      </p>
                    </li>
                  );
                })}
              </ul>
            </section>
          </div>
          <div className="text-center">
            <section>
              <ul className="text-center NoBullet">
                {middles.map((middle, index) => {
                  return (
                    <li key={index}>
                      <p>
                        <b className="text-success">
                          {middle.middleSize} Point Middle
                        </b>
                        <br></br>
                        {middle.league}:{" "}
                        <a href={middle.matchPath}>{middle.matchName}</a>{" "}
                        <br></br>
                        {middle.player} {middle.marketType}
                        <br></br>
                        {middle.Ohandicap} {middle.overString}
                        <br></br>
                        {middle.Uhandicap} {middle.underString}
                        <br></br>
                      </p>
                    </li>
                  );
                })}
              </ul>
            </section>
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
                    No arbs right now. Return to home page.
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
