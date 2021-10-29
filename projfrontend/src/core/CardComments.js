import React, { useState, useEffect } from "react";
import LogoHelper from "./helper/LogoHelper";
import { Redirect } from "react-router-dom";
import MakeReply from "./MakeReply";
import CardReplies from "./CardReplies";
import {
  queryForAllComments,
  queryForAllReplies,
  createaComment,
} from "./helper/forumHelper";

const CardComments = ({ comment }) => {
  const preload = () => {
    queryForAllReplies().then((data) => {
      if (data.error) {
        setError(data.error);
      } else {
        //return in chronological
        setReplies(data.sort((a, b) => b.date.localeCompare(a.date)));
      }
    });
  };

  useEffect(() => {
    preload();
  }, []);

  const [redirect, setRedirect] = useState(false);
  const [error, setError] = useState(false);
  const [liked, setLiked] = useState(false);
  const [replies, setReplies] = useState(false);

  const doSomething = () => {
    setRedirect(true);
  };

  const getARedirect = (redirect) => {
    if (redirect) {
      return <Redirect to="/" />;
    }
  };

  const addLike = () => {
    if (liked) {
      setLiked(false);
    } else {
      setLiked(true);
    }
  };

  const convertUTCDateToLocalDate = (date) => {
    var dateLocal = new Date(date);
    var newDate = new Date(
      dateLocal.getTime() - dateLocal.getTimezoneOffset() * 60 * 1000
    );
    return newDate;
  };

  const formatLikeButton = () => {
    if (liked) {
      return "btn btn-block mt-0 mb-0 font-weight-bold bg-danger text-white";
    } else {
      return "btn btn-block mt-0 mb-0 font-weight-bold bg-success text-white";
    }
  };

  return (
    <div className="card text-white bg-light-alt card-shadow">
      <div className="card-header lead bg-info-alt">
        <em>{comment.userName}</em> (
        {convertUTCDateToLocalDate(comment.date).toLocaleDateString("en-gb", {
          year: "numeric",
          month: "short",
          day: "numeric",
        })}
        ): {comment.header}
      </div>
      {getARedirect(redirect)}
      <div className="card-body">
        <h6 className="card-subtitle mb-2 text-muted text-center font-weight-bold">
          {comment.body}
        </h6>
        <div className="row">
          <div className="align-auto flex m-auto">
            <button onClick={addLike} className={formatLikeButton()}>
              {liked
                ? "You Liked This"
                : comment.likeCounter
                ? `${comment.likeCounter} people like this`
                : "Be the first to like this"}
            </button>
          </div>
        </div>
        <div className="row container-fluid card-matches p-2">
          {replies.length &&
            replies.map((reply, index) => {
              return (
                <div key={index} className="col-12 mb-4">
                  <CardReplies reply={reply} />
                </div>
              );
            })}
        </div>

        <div className="row mt-4 block">{MakeReply(comment)} </div>
      </div>
    </div>
  );
};

export default CardComments;
