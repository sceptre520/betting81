import React, { useState, useEffect } from "react";
import "../styles.css";
import { API } from "../backend";
import Base from "./Base";
import Card from "./Card";
import { getProducts } from "./helper/coreapicalls";

export default function Home() {
  const [products, setProducts] = useState([]);
  const [error, setError] = useState(false);

  const loadAllProduct = () => {
    getProducts().then((data) => {
      if (data.error) {
        setError(data.error);
      } else {
        //return in alphabetical order. In future, want to order chronologically
        setProducts(data.sort((a, b) => a.name.localeCompare(b.name)));
      }
    });
  };

  useEffect(() => {
    loadAllProduct();
  }, []);

  return (
    <Base
      title="Odds Comparison Tool - Player Props"
      description="Select a Match to Analyse"
    >
      <div className="row text-center">
        <div className="row">
          {products.map((product, index) => {
            return (
              <div key={index} className="col-4 mb-4">
                <Card product={product} />
              </div>
            );
          })}
        </div>
      </div>
    </Base>
  );
}
