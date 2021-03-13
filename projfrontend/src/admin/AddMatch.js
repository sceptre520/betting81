import React, { useState, useEffect } from "react";
import Base from "../core/Base";
import { Link } from "react-router-dom";
import { createaMatch } from "./helper/adminapicall";
import { isAutheticated } from "../auth/helper/index";
import { Form } from "react-bootstrap";

const AddMatch = () => {
  const { user, token } = isAutheticated();

  const [values, setValues] = useState({
    name: "",
    league: "",
    date: "",
    homeTeam: "",
    awayTeam: "",
    loading: false,
    error: "",
    createdMatch: "",
    getaRedirect: false,
    formData: "",
  });

  const {
    name,
    league,
    date,
    homeTeam,
    awayTeam,
    loading,
    error,
    createdMatch,
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
    createaMatch(user._id, token, formData).then((data) => {
      if (!data) {
        console.log("API cooked");
      } else if (data.error) {
        setValues({ ...values, error: data.error });
        console.log(data.error);
      } else {
        setValues({
          ...values,
          name: "",
          league: "",
          date: "",
          homeTeam: "",
          awayTeam: "",
          loading: false,
          createdMatch: data.name,
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
      style={{ display: createdMatch ? "" : "none" }}
    >
      <h4>{createdMatch} created successfully</h4>
    </div>
  );

  const createMatchForm = () => (
    <form>
      <div className="form-group">
        <input
          onChange={handleChange("name")}
          name="name"
          className="form-control"
          placeholder="Name"
          value={name}
        />
      </div>
      <div className="form-group">
        <input
          onChange={handleChange("league")}
          name="league"
          className="form-control"
          placeholder="League"
          value={league}
        />
      </div>
      <div className="form-group">
        <Form.Group controlId="date">
          <Form.Control
            onChange={handleChange("date")}
            type="date"
            name="date"
            placeholder="Date of Match"
            value={date}
          />
        </Form.Group>
      </div>
      <div className="form-group">
        <input
          onChange={handleChange("homeTeam")}
          name="homeTeam"
          className="form-control"
          placeholder="homeTeam (_id)"
          value={homeTeam}
        />
      </div>
      <div className="form-group">
        <input
          onChange={handleChange("awayTeam")}
          name="awayTeam"
          className="form-control"
          placeholder="awayTeam (_id)"
          value={awayTeam}
        />
      </div>
      <button
        type="submit"
        onClick={onSubmit}
        className="btn btn-outline-success mb-3"
      >
        Create Match
      </button>
    </form>
  );

  return (
    <Base
      title="Add a match here!"
      description="Welcome to match creation section"
      className="container bg-info p-4"
    >
      <Link to="/admin/dashboard" className="btn btn-md btn-dark mb-3">
        Admin Home
      </Link>
      <div className="row bg-dark text-white rounded">
        <div className="col-md-8 offset-md-2">
          {successMessage()}
          {createMatchForm()}
        </div>
      </div>
    </Base>
  );
};

export default AddMatch;
