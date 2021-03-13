import React from "react";
import { BrowserRouter, Switch, Route } from "react-router-dom";
import Signup from "./user/Signup";
import Signin from "./user/Signin";
import AdminRoute from "./auth/helper/AdminRoutes";
import PrivateRoute from "./auth/helper/PrivateRoutes";
import UserDashBoard from "./user/UserDashBoard";
import AdminDashBoard from "./user/AdminDashBoard";
import About from "./core/About";
import MatchMarkets from "./admin/MatchMarkets";
import AddTeam from "./admin/AddTeam";
import AddMatch from "./admin/AddMatch";
import AddMarket from "./admin/AddMarket";
import Home_Match from "./core/Home_Match";

const Routes = () => {
  return (
    <BrowserRouter>
      <Switch>
        <Route path="/" exact component={Home_Match} />
        <Route path="/about" exact component={About} />
        <Route path="/signup" exact component={Signup} />
        <Route path="/signin" exact component={Signin} />
        <PrivateRoute path="/user/dashboard" exact component={UserDashBoard} />
        <AdminRoute path="/admin/dashboard" exact component={AdminDashBoard} />

        <PrivateRoute path="/match/:matchId" exact component={MatchMarkets} />
        <AdminRoute path="/admin/create/team" exact component={AddTeam} />
        <AdminRoute path="/admin/create/match" exact component={AddMatch} />
        <AdminRoute path="/admin/create/market" exact component={AddMarket} />
      </Switch>
    </BrowserRouter>
  );
};

export default Routes;
