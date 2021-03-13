import React, { useState, useEffect } from "react";
import ImageHelper from "./helper/ImageHelper";
import { Redirect } from "react-router-dom";

const Card = ({ product }) => {
  const [redirect, setRedirect] = useState(false);

  const doSomething = () => {
    setRedirect(true);
  };

  const getARedirect = (redirect) => {
    if (redirect) {
      return <Redirect to={`/match/${product._id}`} />;
    }
  };

  return (
    <div className="card text-white bg-dark border border-white ">
      <div className="card-header lead">
        {product.name} vs {product.name}
      </div>

      {getARedirect(redirect)}
      <div className="card-body">
        <h6 class="card-subtitle mb-2 text-muted">
          NBA
          <br />
          8pm tonight
        </h6>
        <div className="row">
          <div className="col-6">
            <ImageHelper product={product} />
          </div>
          <div className="col-6">
            <ImageHelper product={product} />
          </div>
        </div>
        <div className="row">
          <div className="col-12">
            <button
              onClick={doSomething}
              className="btn btn-block btn-outline-info mt-2 mb-2"
            >
              Check out {"XXX"} markets
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Card;
