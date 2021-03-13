import React, { useState, useEffect } from "react";
import "../styles.css";
import Base from "./Base";
import CardMatches from "./CardMatches";
import { getMatches } from "./helper/matchHelper";

export default function Home_Match() {
  const [matches, setMatches] = useState([]);
  const [error, setError] = useState(false);

  const loadAllMatches = () => {
    getMatches().then((data) => {
      if (data.error) {
        setError(data.error);
      } else {
        //return in chronological
        setMatches(data.sort((a, b) => a.date.localeCompare(b.date)));
      }
    });
  };

  useEffect(() => {
    loadAllMatches();
  }, []);

  return (
    <Base
      title="Odds Comparison Tool - Player Props"
      description="Select a Match to Analyse"
    >
      <div className="row container-fluid text-center align-center">
        <div className="row container-fluid">
          {matches.map((match, index) => {
            return (
              <div key={index} className="col-4 mb-4">
                <CardMatches match={match} />
              </div>
            );
          })}
        </div>
      </div>
    </Base>
  );
}
