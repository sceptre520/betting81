import React from "react";
import Base from "./Base";
import { Link } from "react-router-dom";

const About = () => {
  let isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

  // const MobileCheckForColWidth = () => {
  //   if (isMobile) {
  //     return ["col-1", "col-10"];
  //   } else {
  //     return ["col-3", "col-6"];
  //   }
  // };

  return (
    <Base title="Easily Compare Player Props Bets" description="">
      <div className="row text-left m-4">
        <div className="">
          <p className="HowTo">
            ComparePlayerProps.com is a totally free service that compares
            player prop odds across all your favorite leagues: NFL, NBA, NHL and
            MLB. To help you always find the most profitable bets, arbs and
            middles identified on the <a href="/arbs">arbs page</a>. Meanwhile,
            the top odds for each selection is highlighted visually in the odds
            grid.
          </p>
          <br></br>
          <p className="HowTo">
            Currently, we cover the following sportsbooks:
            <ul>
              <li>PointsBet</li>
              <li>DraftKings</li>
              <li>Caesars, formerly William Hill</li>
              <li>FoxBet</li>
              <li>Bovada</li>
              <li>MaximBet, formerly Sportsbetting.com</li>
              <li>
                BetRivers{" "}
                <em>
                  (prices provided by Kambi, who also powers Barstool, Twin
                  Spires, Sports Illustrated)
                </em>
              </li>
            </ul>
          </p>
          <br></br>
          <p className="text-white text-center HowTo">
            A <b className="text-warning">PREMIUM</b> offering is coming soon.{" "}
            <br />
            Be sure to{" "}
            <Link to="/signup" className="text-center text-info ">
              <u>SIGN UP</u>
            </Link>{" "}
            to receive updates.
          </p>
          <div className="row">
            <div className="col-12">
              <button className="btn btn-block mt-2 mb-2 font-weight-bold bg-success-alt text-white card-shadow">
                <Link
                  className="nav-link text-white"
                  to="/player-prop-arbitrage-betting-service"
                >
                  <p className="HowTo">Get started - view all matches</p>
                </Link>
              </button>
            </div>
          </div>
        </div>
      </div>
    </Base>
  );
};

export default About;
