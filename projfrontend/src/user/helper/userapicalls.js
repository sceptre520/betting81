import { API } from "../../backend";

//get a user

export const getAUser = (userId) => {
  return fetch(`${API}/user/data/${userId}`, {
    method: "GET",
  })
    .then((response) => {
      return response.json();
    })
    .catch((err) => console.log(err));
};

export const updateUserPreferences = (user) => {
  return fetch(`${API}/user/${user._id}/noMiddleware`, {
    method: "PUT",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(user),
  })
    .then((response) => {
      return response.json();
    })
    .catch((err) => console.log(err));
};
