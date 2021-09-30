import React, { useState, useEffect } from "react";
import { getProduct } from "../admin/helper/adminapicall";
import Menu from "./Menu";

const Base = ({
  title = "My Title",
  description = "My desription",
  className = "bg-dark-alt text-white p-1",
  children,
}) => {
  return (
    <div>
      <Menu />
      <div className="container-fluid">
        <div className="jumbotron bg-dark-alt text-white text-center mb-0">
          <h2 className="display-4">{title}</h2>
          <p className="lead mb-0">{description}</p>
        </div>
        <div className={className}>{children}</div>
      </div>
      <footer className="footer bg-dark-alt mt-auto py-3">
        <div className="container-fluid bg-dark-alt text-white text-center py-3"></div>

        <div className="container">
          <span className="text-muted">All rights reserved</span>
        </div>
      </footer>
    </div>
  );
};

export default Base;
