import React, { useEffect, useState } from "react";
import Base from "../core/Base";

import { isAutheticated } from "../auth/helper/index";
import { getAUser, updateUserPreferences } from "./helper/userapicalls";

const UserDashBoard = () => {
  const [oddsPref, setOddsPref] = useState([]);
  const [membershipLevel, setMembershipLevel] = useState([]);
  const [user, setUser] = useState({});

  const preload = () => {
    getAUser(_id).then((user) => {
      setOddsPref(user.oddsPreference);
      setMembershipLevel(user.membership);
      setUser(user);
    });
  };

  useEffect(() => {
    preload();
  }, []);

  const {
    user: { name, email, _id },
  } = isAutheticated();

  const selectedOddsType = oddsPref
    ? "American Odds (-110)"
    : "Decimal Odds ($1.91)";

  const otherOddsType = oddsPref
    ? "Decimal Odds ($1.91)"
    : "American Odds (-110)";

  const onClickOddsPref = (event) => {
    event.preventDefault();
    let updatedUserInfo = user;
    updatedUserInfo["oddsPreference"] = 1 - oddsPref;
    setUser(updatedUserInfo);
    setOddsPref(1 - oddsPref);
    updateUserPreferences(updatedUserInfo);
  };

  return (
    <Base title="User Dashboard" description="">
      <div className="row p-4">
        <div className="col-4"></div>
        <div className="card mb-4 col-4">
          <h4 className="card-header text-dark  text-center">
            Member Information
          </h4>
          <ul className="list-group">
            <li className="list-group-item">
              <span className="badge badge-warning mr-2">Name:</span>
              <span className="text-dark">{name}</span>
            </li>
            <li className="list-group-item">
              <span className="badge badge-warning mr-2">Email:</span>
              <span className="text-dark">{email}</span>
            </li>
            <li className="list-group-item">
              <span className="badge badge-warning mr-2">Odds Preference:</span>
              <span className="text-dark">{selectedOddsType}</span>
            </li>
            <li className="list-group-item text-center">
              <div className="btn-group btn-group-toggle" data-toggle="buttons">
                <button
                  className="btn btn-info btn-md"
                  onClick={onClickOddsPref}
                >
                  Switch to {otherOddsType}
                </button>
              </div>
            </li>
            <li className="list-group-item">
              <span className="badge badge-warning mr-2">
                Membership Level:
              </span>
              <span className="text-dark">
                {membershipLevel === 1 ? "Basic" : "Premium"}
              </span>
            </li>
            <li className="list-group-item  text-center">
              <div
                className="btn-group btn-group-toggle btn-block"
                data-toggle="buttons"
              >
                <button className="btn btn-success btn-lg btn-block">
                  Upgrade to Premium
                </button>
              </div>
            </li>
          </ul>
        </div>
        <div className="col-4"></div>
      </div>
    </Base>
  );
};

export default UserDashBoard;
