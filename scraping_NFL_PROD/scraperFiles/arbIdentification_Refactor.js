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
  console.log(data.length, 'datas are fetched')

  let arbs = [];
  let middles = [];

  //unique matches
  const uniqueMatches = [
    ...new Set(
      data.map((market) => {
        return market.matchId._id;
      })
    ),
  ];

  console.log('----   uniqueMatches   -----')
  console.log(uniqueMatches)
  console.log('----   end uniqueMatches   -----')

  const Outer = uniqueMatches.map((matchId) => {
    const relevantData = data.filter((o) => {
      return o.matchId._id === matchId;
    });

    const uniqueMarketTypes = [
      ...new Set(
        relevantData.map((market) => {
          return market.marketType;
        })
      ),
    ];

    const InnerArbs = uniqueMarketTypes.map((marketType) => {
      const relevantInnerData = relevantData.filter((o) => {
        return o.marketType === marketType;
      });

      const Inner2 = relevantInnerData.forEach((market) => {
        const filtered = relevantInnerData.filter((o) => {
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

      const InnerMiddles = relevantInnerData.forEach((market) => {
        const filtered = relevantInnerData.filter((o) => {
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
    });
  });

  console.log('-----    arb check    -----')
  console.log(arbs)
  console.log('-----   arb check end  -----')

  if (arbs) {
    const Final1 = await mapLoop(arbs);
    console.log(Final1);
  }

  if (middles) {
    const Final2 = await mapLoop(middles);
    console.log(Final2);
  }
};

const mapLoop = async (middles) => {
  console.log("Start writing arbs/middles");

  const promises = middles.map(async (middle) => {
    //const numFruit = await sleep(thisFBEvent);
    const numFruit = await createArbInDB(middle);
    return numFruit;
  });

  const numFruits = await Promise.all(promises);
  // console.log(numFruits);

  console.log("End writing arbs/middles");
};
