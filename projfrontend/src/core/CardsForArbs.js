import React, { useState, useEffect } from "react";
import { Link, Redirect } from "react-router-dom";

const CardsForArbs = ({ arb }) => {
  const [redirect, setRedirect] = useState(false);

  const openInNewTab = (url) => {
    const newWindow = window.open(url, "_blank", "noopener,noreferrer");
    if (newWindow) newWindow.opener = null;
  };

  return (
    <div className="card bg-light-alt border border-info card-shadow">
      <div className="card-header lead bg-info-alt">
        <h3 className="card-title text-white text-center  font-weight-bold">
          <a href={arb.matchPath}>
            <u className="text-white">
              {arb.player} - {arb.marketType} ({arb.league})
            </u>
          </a>
        </h3>
      </div>

      <div className="card-body">
        <div className="container">
          <a href={arb.matchPath}>
            <p className="text-dark">
              <b className="text-success">
                {100 * arb.bookPerc.toFixed(3)}% Arbitrage
              </b>
              <br></br>
              {arb.overString}
              <br></br>
              {arb.underString}
              <br></br>
              {arb.matchName}
            </p>
          </a>
        </div>
      </div>
    </div>
  );
};

export default CardsForArbs;
