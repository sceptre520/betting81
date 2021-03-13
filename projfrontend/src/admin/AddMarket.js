import React, { useState, useEffect } from "react";
import Base from "../core/Base";
import { Link } from "react-router-dom";
import { createaMarket } from "./helper/adminapicall";
import { isAutheticated } from "../auth/helper/index";

const AddMarket = () => {
  const { user, token } = isAutheticated();

  const [values, setValues] = useState({
    player: "",
    marketType: "",
    sportsbook: "",
    overPrice: "",
    underPrice: "",
    handicap: "",
    matchId: "",
    loading: false,
    error: "",
    createdMarket: "",
    getaRedirect: false,
    formData: "",
  });

  const {
    player,
    marketType,
    sportsbook,
    overPrice,
    underPrice,
    handicap,
    matchId,
    loading,
    error,
    createdMarket,
    getaRedirect,
    formData,
  } = values;

  const preload = () => {
    setValues({ ...values, formData: new FormData() });
  };

  useEffect(() => {
    preload();
  }, []);

  const onSubmit = (event) => {
    event.preventDefault();
    setValues({ ...values, error: "", loading: true });
    createaMarket(user._id, token, formData).then((data) => {
      if (!data) {
        console.log("API cooked");
      } else if (data.error) {
        setValues({ ...values, error: data.error });
        console.log(data.error);
      } else {
        setValues({
          player: "",
          marketType: "",
          sportsbook: "",
          overPrice: "",
          underPrice: "",
          handicap: "",
          matchId: "",
          loading: false,
          createdMarket: `${data.player}: ${data.marketType} (${data.sportsbook})`,
        });
      }
    });
  };

  const handleChange = (name) => (event) => {
    const value = name === "photo" ? event.target.files[0] : event.target.value;
    formData.set(name, value);
    setValues({ ...values, [name]: value });
  };

  const successMessage = () => (
    <div
      className="alert alert-success mt-3"
      style={{ display: createdMarket ? "" : "none" }}
    >
      <h4>{createdMarket} created successfully</h4>
    </div>
  );

  const createMarketForm = () => (
    <div>
      <form>
        <div className="form-group">
          <label>Input player</label>
          <input
            onChange={handleChange("player")}
            name="player"
            className="form-control"
            placeholder="Player"
            value={player}
          />
        </div>
        <div className="form-group">
          <label>Input type of market</label>
          <input
            onChange={handleChange("marketType")}
            name="marketType"
            className="form-control"
            placeholder="Market Type"
            value={marketType}
          />
        </div>
        <div className="form-group">
          <label>Input sportsbook</label>
          <input
            onChange={handleChange("sportsbook")}
            name="sportsbook"
            className="form-control"
            placeholder="Sportsbook"
            value={sportsbook}
          />
        </div>
        <div className="form-group">
          <label>Input price</label>
          <input
            onChange={handleChange("overPrice")}
            type="number"
            name="overPrice"
            className="form-control"
            placeholder="1.91"
            value={overPrice}
          />
        </div>
        <div className="form-group">
          <label>Input under price (optional)</label>
          <input
            onChange={handleChange("underPrice")}
            type="number"
            name="underPrice"
            className="form-control"
            placeholder=""
            value={underPrice}
          />
        </div>
        <div className="form-group">
          <label>Input handicap (optional)</label>
          <input
            onChange={handleChange("handicap")}
            type="number"
            name="handicap"
            className="form-control"
            placeholder=""
            value={handicap}
          />
        </div>
        <div className="form-group">
          <label>Input id of match</label>
          <input
            onChange={handleChange("matchId")}
            name="matchId"
            className="form-control"
            placeholder="matchId"
            value={matchId}
          />
        </div>

        <button
          type="submit"
          onClick={onSubmit}
          className="btn btn-outline-success mb-3"
        >
          Create Market
        </button>
      </form>
      <p>{formData}</p>
    </div>
  );

  return (
    <Base
      title="Add a market here!"
      description="Welcome to market creation section"
      className="container bg-info p-4"
    >
      <Link to="/admin/dashboard" className="btn btn-md btn-dark mb-3">
        Admin Home
      </Link>
      <div className="row bg-dark text-white rounded">
        <div className="col-md-8 offset-md-2">
          {successMessage()}
          {createMarketForm()}
        </div>
      </div>
    </Base>
  );
};

export default AddMarket;
