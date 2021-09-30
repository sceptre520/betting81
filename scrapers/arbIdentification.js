const {
  queryForAllMarkets,
  createArbInDB,
  deleteArbsFromDB,
} = require("./helper/scraperFunctions");

deleteArbsFromDB();

const arbCriterion = 0.995;

let Z = queryForAllMarkets();

Promise.resolve(Z).then((data) => {
  let arbs = [];

  const Output = data.forEach((market) => {
    const filtered = data.filter((o) => {
      return (
        //this string matching is suboptimal
        o.player
          .normalize("NFD")
          .replace(/[^\w\s]|_/g, "")
          .replace(/\s+/g, " ")
          .toLowerCase()
          .replace(/[^\w\s]/gi, "") ===
          market.player
            .normalize("NFD")
            .replace(/[^\w\s]|_/g, "")
            .replace(/\s+/g, " ")
            .toLowerCase()
            .replace(/[^\w\s]/gi, "") &&
        o.marketType === market.marketType &&
        o.handicap >= market.handicap &&
        o.underPrice
      );
    });

    if (filtered) {
      filtered.map((o) => {
        if (1 / market.overPrice + 1 / o.underPrice < arbCriterion) {
          const thisArb = {
            overMarketId: market._id,
            underMarketId: o._id,
            ArbOrMiddle: "arb",
          };

          arbs.push(thisArb);
        }
      });
    }
  });

  //console.log(arbs);

  if (arbs) {
    arbs.map((data) => {
      createArbInDB(data);
    });
  }
});

const middleCriterion = 3;

Promise.resolve(Z).then((data) => {
  let middles = [];

  const Output = data.forEach((market) => {
    const filtered = data.filter((o) => {
      return (
        o.player
          .normalize("NFD")
          .replace(/[^\w\s]|_/g, "")
          .replace(/\s+/g, " ")
          .toLowerCase()
          .replace(/[^\w\s]/gi, "") ===
          market.player
            .normalize("NFD")
            .replace(/[^\w\s]|_/g, "")
            .replace(/\s+/g, " ")
            .toLowerCase()
            .replace(/[^\w\s]/gi, "") &&
        o.marketType === market.marketType &&
        o.handicap !== market.handicap &&
        o.underPrice
      );
    });

    if (filtered) {
      filtered.map((o) => {
        if (market.handicap <= o.handicap - middleCriterion) {
          const thisMiddle = {
            overMarketId: market._id,
            underMarketId: o._id,
            ArbOrMiddle: "middle",
          };

          middles.push(thisMiddle);
        }
      });
    }
  });

  //console.log(arbs);

  if (middles) {
    middles.map((data) => {
      createArbInDB(data);
    });
  }
});
