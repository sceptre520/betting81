const {
  queryForAllMarkets,
  createArbInDB,
  deleteArbsFromDB,
} = require("./helper/scraperFunctions");

const arbCriterion = 0.995;

const middleCriterion = 3;

exports.identifyArbs = async () => {
  const a = await deleteArbsFromDB();
  const data = await queryForAllMarkets();

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
        (o.handicap ? o.handicap : 0) >=
          (market.handicap ? market.handicap : 0) &&
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
    const mapLoop = async (arbs) => {
      console.log("Start writing arbs");

      const promises = arbs.map(async (arb) => {
        //const numFruit = await sleep(thisFBEvent);
        const numFruit = await createArbInDB(arb);
        return numFruit;
      });

      const numFruits = await Promise.all(promises);
      //console.log(numFruits);

      console.log("End writing arbs");
    };

    const Final = await mapLoop(arbs);

    //return Final;
  }

  let middles = [];

  const Output2 = data.forEach((market) => {
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
    const mapLoop2 = async (middles) => {
      console.log("Start writing middles");

      const promises = middles.map(async (middle) => {
        //const numFruit = await sleep(thisFBEvent);
        const numFruit = await createArbInDB(middle);
        return numFruit;
      });

      const numFruits = await Promise.all(promises);
      console.log(numFruits);

      console.log("End writing middles");
    };

    const Final2 = await mapLoop2(middles);

    return Final2;
  }
};
