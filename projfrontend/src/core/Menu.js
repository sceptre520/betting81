import React, { Fragment } from "react";
import { Link, withRouter } from "react-router-dom";
import { signout, isAutheticated } from "../auth/helper";

const currentTab = (history, path) => {
  if (history.location.pathname === path) {
    return {
      color: "#5bc0de",
      backgroundColor: "#FFFFFF",
      fontWeight: "bold",
    };
  } else {
    return { color: "#FFFFFF" };
  }
};

const Menu = ({ history }) => (
  <nav className="navbar navbar-expand-md bg-grad-blue-green">
    <ul className="nav nav-tabs mr-auto">
      <li className="nav-item">
        <Link
          style={currentTab(history, "/player-prop-arbitrage-betting-service")}
          className="nav-link"
          to="/player-prop-arbitrage-betting-service"
        >
          Home
        </Link>
      </li>
      <li className="nav-item">
        <Link
          style={currentTab(history, "/nfl-player-prop-arb-bets")}
          className="nav-link"
          to="/nfl-player-prop-arb-bets"
        >
          NFL
        </Link>
      </li>
      <li className="nav-item">
        <Link
          style={currentTab(history, "/nba-player-prop-arb-bets")}
          className="nav-link"
          to="/nba-player-prop-arb-bets"
        >
          NBA
        </Link>
      </li>
      <li className="nav-item">
        <Link
          style={currentTab(history, "/about")}
          className="nav-link"
          to="/about"
        >
          About
        </Link>
      </li>
      <li className="nav-item">
        <Link
          style={currentTab(history, "/how-to-find-player-prop-arb-bets")}
          className="nav-link"
          to="/how-to-find-player-prop-arb-bets"
        >
          How To Bet Player Props
        </Link>
      </li>

      <li className="nav-item">
        <Link
          style={currentTab(history, "/arbs")}
          className="nav-link"
          to="/arbs"
        >
          Arbs + Middles
        </Link>
      </li>
      {isAutheticated() && isAutheticated().user.role === 0 && (
        <li className="nav-item">
          <Link
            style={currentTab(history, "/user/dashboard")}
            className="nav-link"
            to="/user/dashboard"
          >
            U. Dashboard
          </Link>
        </li>
      )}
      {isAutheticated() && isAutheticated().user.role === 1 && (
        <li className="nav-item">
          <Link
            style={currentTab(history, "/admin/dashboard")}
            className="nav-link"
            to="/admin/dashboard"
          >
            A. Dashboard
          </Link>
        </li>
      )}
    </ul>
    {false && (
      <ul className="nav nav-tabs ml-auto">
        {!isAutheticated() && (
          <Fragment>
            <li className="nav-item bg-success">
              <Link
                style={currentTab(history, "/signup")}
                className="nav-link"
                to="/signup"
              >
                Signup
              </Link>
            </li>
            <li className="nav-item bg-warning">
              <Link
                style={currentTab(history, "/signin")}
                className="nav-link"
                to="/signin"
              >
                Sign In
              </Link>
            </li>
          </Fragment>
        )}
        {isAutheticated() && (
          <li className="nav-item">
            <span
              className="nav-link text-warning"
              onClick={() => {
                signout(() => {
                  history.push("/");
                });
              }}
            >
              Signout
            </span>
          </li>
        )}
      </ul>
    )}
  </nav>
);

export default withRouter(Menu);
