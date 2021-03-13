import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Base from "./Base";
import { getMarketsFromMatch } from "./helper/marketHelper";

const TestACard = () => {
  const [markets, setMarkets] = useState([]);

  const preload = () =>
    getMarketsFromMatch("6032aa7e2f494c58809a7d7f").then((data) => {
      setMarkets(data);
    });

  useEffect(() => {
    preload();
  }, []);

  const uniquePlayers = markets
    .map((item) => item.player)
    .filter((value, index, self) => self.indexOf(value) === index);

  const jaysonTatumData = markets.filter(
    (market) => market.player === uniquePlayers[2]
  );

  return (
    <Base>
      <div>{uniquePlayers}</div>
      <br></br>
      <div>{JSON.stringify(jaysonTatumData)}</div>
    </Base>
  );
};

export default TestACard;
