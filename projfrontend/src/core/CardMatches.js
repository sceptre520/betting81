import React, { useState } from "react";
import LogoHelper from "./helper/LogoHelper";
import { Redirect } from "react-router-dom";

const CardMatches = ({ match }) => {
  const [redirect, setRedirect] = useState(false);

  const doSomething = () => {
    setRedirect(true);
  };

  const getARedirect = (redirect) => {
    if (redirect) {
      return <Redirect to={`/match/${match._id}`} />;
    }
  };

  const convertUTCDateToLocalDate = (date) => {
    var dateLocal = new Date(date);
    var newDate = new Date(
      dateLocal.getTime() - dateLocal.getTimezoneOffset() * 60 * 1000
    );
    return newDate;
  };

  return (
    <div className="card text-white bg-dark border border-white">
      <div className="card-header lead">
        {match.awayTeam.name} @ {match.homeTeam.name}
      </div>

      {getARedirect(redirect)}
      <div className="card-body">
        <h6 className="card-subtitle mb-2 text-muted">
          {match.league}
          <br />
          {convertUTCDateToLocalDate(match.date).toLocaleDateString("en-gb", {
            year: "numeric",
            month: "short",
            day: "numeric",
          })}
        </h6>
        <div className="row">
          <div className="col-6">
            <LogoHelper teamId={match.awayTeam._id} />
          </div>
          <div className="col-6">
            <LogoHelper teamId={match.homeTeam._id} />
          </div>
        </div>
        <div className="row">
          <div className="col-12">
            <button
              onClick={doSomething}
              className="btn btn-block btn-outline-info mt-2 mb-2"
            >
              Match Center
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CardMatches;
