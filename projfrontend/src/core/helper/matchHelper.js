import { API } from "../../backend";

//get all matches
export const getMatches = () => {
  return fetch(`${API}/matches`, {
    method: "GET",
  })
    .then((response) => {
      return response.json();
    })
    .catch((err) => console.log(err));
};
