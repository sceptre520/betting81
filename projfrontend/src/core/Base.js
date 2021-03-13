import React, { useState, useEffect } from "react";
import { getProduct } from "../admin/helper/adminapicall";
import Menu from "./Menu";

const Base = ({
  title = "My Title",
  description = "My desription",
  className = "bg-dark text-white p-4",
  children,
}) => {
  return (
    <div>
      <Menu />
      <div className="container-fluid">
        <div className="jumbotron bg-dark text-white text-center">
          <h2 className="display-4">{title}</h2>
          <p className="lead">{description}</p>
        </div>
        <div className={className}>{children}</div>
      </div>
      <footer className="footer bg-dark mt-auto py-3">
        <div className="container-fluid bg-dark text-white text-center py-3">
          <button className="btn btn-info btn-lg">Contact Us</button>
        </div>
        <div className="container">
          <span className="text-muted">All Rights: Declan Walpole</span>
        </div>
      </footer>
    </div>
  );
};

export default Base;
