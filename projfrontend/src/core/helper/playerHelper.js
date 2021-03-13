import { API } from "../../backend";

//get all matches
export const getPlayers = () => {
  return fetch(`${API}/players`, {
    method: "GET",
  })
    .then((response) => {
      return response.json();
    })
    .catch((err) => console.log(err));
};

//get player stats
export const getPlayerStats = (BDL_id) => {
  return fetch(
    `https://www.balldontlie.io/api/v1/season_averages?player_ids[]=${BDL_id}`,
    {
      method: "GET",
    }
  )
    .then((response) => {
      return response.json();
    })
    .catch((err) => console.log(err));
};
