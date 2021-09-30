import React from "react";
import Base from "./Base";
import { Link } from "react-router-dom";

const About = () => {
  let isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

  const MobileCheckForColWidth = () => {
    if (isMobile) {
      return ["col-1", "col-10"];
    } else {
      return ["col-3", "col-6"];
    }
  };

  return (
    <Base
      title="404 Not Found"
      description="Check the URL, the page you are looking for may have moved"
    >
      <div className="row text-left">
        <div className={MobileCheckForColWidth()[0]}></div>
        <div className={MobileCheckForColWidth()[1]}>
          <div className="row">
            <div className="col-12">
              <button className="btn btn-block mt-2 mb-2 font-weight-bold bg-success-alt text-white card-shadow">
                <Link
                  className="nav-link text-white"
                  to="/player-prop-arbitrage-betting-service"
                >
                  <p className="HowTo">Return to view all matches</p>
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
