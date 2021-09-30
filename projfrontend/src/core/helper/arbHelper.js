import { API } from "../../backend";

//get all matches
export const queryForAllArbs = () => {
  async function getAllArbsInDB() {
    return fetch(`${API}/arb/all`).then((arbs) => {
      return arbs.json();
    });
  }

  let arbList = getAllArbsInDB().then((output) => {
    return output;
  });

  return arbList;
};
