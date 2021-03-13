import React, { useState, useEffect } from "react";
import Base from "../core/Base";
import { Link } from "react-router-dom";
import {
  getCategories,
  createaProduct,
  createaTeam,
} from "./helper/adminapicall";
import { isAutheticated } from "../auth/helper/index";

const AddTeam = () => {
  const { user, token } = isAutheticated();

  const [values, setValues] = useState({
    name: "",
    abbrev: "",
    info: "",
    photo: "",
    loading: false,
    error: "",
    createdTeam: "",
    getaRedirect: false,
    formData: "",
  });

  const {
    name,
    abbrev,
    info,
    loading,
    error,
    createdTeam,
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
    createaTeam(user._id, token, formData).then((data) => {
      if (!data) {
        console.log("API cooked");
      } else if (data.error) {
        setValues({ ...values, error: data.error });
        console.log(data.error);
      } else {
        setValues({
          ...values,
          name: "",
          abbrev: "",
          info: "",
          photo: "",
          loading: false,
          createdTeam: data.name,
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
      style={{ display: createdTeam ? "" : "none" }}
    >
      <h4>{createdTeam} created successfully</h4>
    </div>
  );

  const createTeamForm = () => (
    <form>
      <span>Post logo</span>
      <div className="form-group">
        <label className="btn btn-block btn-success">
          <input
            onChange={handleChange("photo")}
            type="file"
            name="photo"
            accept="image"
            placeholder="choose a file"
          />
        </label>
      </div>
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
          onChange={handleChange("abbrev")}
          name="abbrev"
          className="form-control"
          placeholder="Abbreviation"
          value={abbrev}
        />
      </div>
      <div className="form-group">
        <textarea
          onChange={handleChange("info")}
          name="info"
          className="form-control"
          placeholder="Info"
          value={info}
        />
      </div>

      <button
        type="submit"
        onClick={onSubmit}
        className="btn btn-outline-success mb-3"
      >
        Create Team
      </button>
    </form>
  );

  return (
    <Base
      title="Add a team here!"
      description="Welcome to team creation section"
      className="container bg-info p-4"
    >
      <Link to="/admin/dashboard" className="btn btn-md btn-dark mb-3">
        Admin Home
      </Link>
      <div className="row bg-dark text-white rounded">
        <div className="col-md-8 offset-md-2">
          {successMessage()}
          {createTeamForm()}
        </div>
      </div>
    </Base>
  );
};

export default AddTeam;
