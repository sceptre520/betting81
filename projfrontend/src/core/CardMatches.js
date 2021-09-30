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
    <div className="card text-white bg-light-alt card-shadow">
      <div className="card-header lead bg-info-alt">
        {match.awayTeam.name} @ {match.homeTeam.name}
      </div>
      {getARedirect(redirect)}
      <div className="card-body">
        <h6 className="card-subtitle mb-2 text-warning">{match.league}</h6>

        <h6 className="card-subtitle mb-2 text-muted">
          {convertUTCDateToLocalDate(match.date).toLocaleDateString("en-gb", {
            year: "numeric",
            month: "short",
            day: "numeric",
          })}
        </h6>
        <div className="row">
          <div className="col-6">
            <LogoHelper team={match.awayTeam} />
          </div>
          <div className="col-6">
            <LogoHelper team={match.homeTeam} />
          </div>
        </div>
        <div className="row">
          <div className="col-12">
            <button
              onClick={doSomething}
              className="btn btn-block mt-0 mb-0 font-weight-bold bg-success-alt text-white"
            >
              Click to see all markets
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CardMatches;
