import React, { useState, useEffect } from "react";
import "../styles.css";
import Base from "./Base";
import CardMatches from "./CardMatches";
import { getMatches } from "./helper/matchHelper";

export default function NFL() {
  const [matches, setMatches] = useState([]);
  const [error, setError] = useState(false);

  const loadAllMatches = () => {
    getMatches().then((data) => {
      if (data.error) {
        setError(data.error);
      } else {
        //return in chronological
        const filteredMatches = data
          .sort((a, b) => a.date.localeCompare(b.date))
          .filter((data) => {
            return data.league === "NFL";
          });
        setMatches(filteredMatches);
      }
    });
  };

  useEffect(() => {
    loadAllMatches();
  }, []);

  return (
    <Base
      title="NFL Player Prop Bets and Arbs"
      description="Compare passing yards, rushing yards, receiving yards and TDs"
    >
      <div className="row container-fluid text-center align-center mt-0">
        <div className="row container-fluid card-matches p-2">
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
