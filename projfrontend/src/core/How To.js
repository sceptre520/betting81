import React, { useState } from "react";
import Base from "./Base";
import { Redirect, Link } from "react-router-dom";

const HowTo = () => {
  const [redirect, setRedirect] = useState(false);

  const doSomething = () => {
    setRedirect(true);
  };

  const getARedirect = (redirect) => {
    if (redirect) {
      return <Redirect to={`/about`} />;
    }
  };

  let isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

  return (
    <Base
      title="Always Take The Best Odds On Player Props"
      description="Find an edge with our exclusive odds comparison grid"
    >
      <div className="row text-left m-4">
        <div className="">
          <p className="HowTo">
            Whether you're a novice bettor or a seasoned sharp, nothing can beat
            finding the best price for all your favourite prop bets. Let's take
            a look at how to find the most value with ComparePlayerProps.com
            odds grid.
          </p>
          <br></br>
          <p className="HowTo">
            When betting player props, we always want to take the most favorable
            line.
            <ul>
              <li>
                If taking the overs, we look for the lowest handicap. Mahomes
                Over 250 yards is much more likely to hit than Over 300.
              </li>
              <li>
                If hammering the under, we want the highest point value. e.g.
                LeBron Under 25.5 points is favorable to Under 24.5.
              </li>
            </ul>
          </p>
          <br></br>
          <p className="HowTo">
            The points value is not all. Finding the best odds is also critical
            to maximizing your bankroll. No matter the bet type, we always want
            the biggest odds. Don't let the bookie get the better of you by
            accepting more juice.
            <ul>
              <li>+100 is better value than -110 ($2.00 > $1.91)</li>
              <li>-110 is better value than -120 ($1.91 > $1.83)</li>
            </ul>
          </p>
          <p className="HowTo">
            Thankfully, ComparePlayerProps has done the hard work for you,
            scouring numerous sportsbooks for the best value plays. Head to the{" "}
            <a href="/arbs">arbs page</a> for a curated real-time list of the
            biggest arbs and middles. Meanwhile, in the odds grids:
            <ul>
              <li>
                Best odds are highlighted in{" "}
                <a className="border-info text-info">
                  <b>blue</b>
                </a>
              </li>
              <li>
                Arbs are highlighted in <a className="bg-success">green</a>
              </li>
            </ul>
          </p>
          <p className="HowTo">
            Now that you know how to always find the best odds, you can apply
            this knowledge to a wide range of markets including Quarterback
            Passing Yards, Rushing Yards, Receiving Yards and Touchown scorer
            markets. Leagues for betting player props:
            <ul>
              <li>NFL</li>
              <li>NBA</li>
              <li>NHL</li>
              <li>MLB</li>
            </ul>
          </p>
          <p className="HowTo">
            But don't underestimate the importance of doing your own research.
            Follow the links through to{" "}
            <a href="https://www.pro-football-reference.com/">
              Pro Football Reference
            </a>{" "}
            to dig into each player's historical stats and trends.
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

export default HowTo;
