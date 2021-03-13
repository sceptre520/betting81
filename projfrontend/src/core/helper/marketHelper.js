import { API } from "../../backend";

//get all matches
export const getMarketsFromMatch = (matchId) => {
  return fetch(`${API}markets/${matchId}`, {
    method: "GET",
  })
    .then((response) => {
      return response.json();
    })
    .catch((err) => console.log(err));
};
