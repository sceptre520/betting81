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
      title="Compare Player Prop Bets and Arbs"
      description="Select a match to analyse from NFL, NBA, MLB and more"
    >
      <div className="row container-fluid text-center align-center">
        <div className="row container-fluid card-matches">
          {matches.map((match, index) => {
            return (
              <div key={index} className="card-matches-margins mb-4">
                <CardMatches match={match} />
              </div>
            );
          })}
        </div>
      </div>
    </Base>
  );
}
