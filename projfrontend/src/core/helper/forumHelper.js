import { API } from "../../backend";

//get all comments
export const queryForAllComments = () => {
  async function getAllCommentsInDB() {
    return fetch(`${API}/comments`).then((comments) => {
      return comments.json();
    });
  }

  let commentsList = getAllCommentsInDB().then((output) => {
    return output;
  });

  return commentsList;
};

//create a comment
export const createaComment = (comment) => {
  return fetch(`${API}/comment/create`, {
    method: "POST",
    headers: {
      Accept: "application/json",
    },
    body: comment,
  })
    .then((response) => {
      return response.json();
    })
    .catch((err) => console.log(err));
};

//get all replies
export const queryForAllReplies = () => {
  async function getAllRepliesInDB() {
    return fetch(`${API}/reply`).then((replies) => {
      return replies.json();
    });
  }

  let repliesList = getAllRepliesInDB().then((output) => {
    return output;
  });

  return repliesList;
};

//create a comment
export const createaReply = (reply) => {
  return fetch(`${API}/reply/create`, {
    method: "POST",
    headers: {
      Accept: "application/json",
    },
    body: reply,
  })
    .then((response) => {
      return response.json();
    })
    .catch((err) => console.log(err));
};
