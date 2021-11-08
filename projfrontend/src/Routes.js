import React from "react";
import { BrowserRouter, Switch, Route } from "react-router-dom";
import Signup from "./user/Signup";
import Signin from "./user/Signin";
import AdminRoute from "./auth/helper/AdminRoutes";
import PrivateRoute from "./auth/helper/PrivateRoutes";
import UserDashBoard from "./user/UserDashBoard";
import AdminDashBoard from "./user/AdminDashBoard";
import About from "./core/About";
import HowTo from "./core/How To";
import NFL from "./core/NFL";
import NBA from "./core/NBA";
import NHL from "./core/NHL";
import Arbs from "./core/Arbs";
import MatchMarkets from "./admin/MatchMarkets";
import AddTeam from "./admin/AddTeam";
import AddMatch from "./admin/AddMatch";
import AddMarket from "./admin/AddMarket";
import Home_Match from "./core/Home_Match";
import Forum from "./core/Forum";
import NotFoundPage from "./core/NotFoundPage";

//const Comment = NotFoundPage;

const Routes = () => {
  return (
    <BrowserRouter>
      <Switch>
        <Route path="/" exact component={Home_Match} />
        <Route
          path="/player-prop-arbitrage-betting-service"
          exact
          component={Home_Match}
        />
        <Route path="/about" exact component={About} />
        <Route
          path="/how-to-find-player-prop-arb-bets"
          exact
          component={HowTo}
        />
        <Route path="/nfl-player-prop-arb-bets" exact component={NFL} />
        <Route path="/nba-player-prop-arb-bets" exact component={NBA} />
        <Route path="/nhl-player-prop-arb-bets" exact component={NHL} />
        <Route path="/signup" exact component={Signup} />
        <Route path="/signin" exact component={Signin} />
        <Route path="/arbs" exact component={Arbs} />

        <Route path="/forum" exact component={Forum} />
        <Route path="/match/:matchId" exact component={MatchMarkets} />
        <PrivateRoute path="/user/dashboard" exact component={UserDashBoard} />
        <AdminRoute path="/admin/dashboard" exact component={AdminDashBoard} />
        <AdminRoute path="/admin/create/team" exact component={AddTeam} />
        <AdminRoute path="/admin/create/match" exact component={AddMatch} />
        <AdminRoute path="/admin/create/market" exact component={AddMarket} />
        <Route component={NotFoundPage} />
      </Switch>
    </BrowserRouter>
  );
};

export default Routes;
