import React, { useState, useEffect } from "react";
import { Link, Redirect } from "react-router-dom";

const CardsForMiddles = ({ middle }) => {
  const [redirect, setRedirect] = useState(false);

  const openInNewTab = (url) => {
    const newWindow = window.open(url, "_blank", "noopener,noreferrer");
    if (newWindow) newWindow.opener = null;
  };

  return (
    <div className="card bg-light-alt border border-info card-shadow">
      <div className="card-header lead bg-info-alt">
        <h3 className="card-title text-white text-center  font-weight-bold">
          <a href={middle.matchPath}>
            <u className="text-white">
              {middle.player} - {middle.marketType} ({middle.league})
            </u>
          </a>
        </h3>
      </div>

      <div className="card-body">
        <a href={middle.matchPath} className="text-dark">
          <div className="container">
            <p>
              <span className="text-danger">
                {middle.middleSize} Point Middle
              </span>
              <br></br>
              {middle.Ohandicap} {middle.overString}
              <br></br>
              {middle.Uhandicap} {middle.underString}
              <br></br>
              {middle.matchName}
            </p>
          </div>
        </a>
      </div>
    </div>
  );
};

export default CardsForMiddles;
