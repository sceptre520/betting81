const ArbIdentification = require("./scraperFiles/arbIdentification_Refactor");

const test = async() => {
  try {
    console.log("Starting: Arbs");
    var Arbs = await ArbIdentification.identifyArbs();
    //console.log(Arbs)
    console.log("Successful: Arbs");
  } catch (error) {
    console.log("Failed: Arbs");
  }
}

test()