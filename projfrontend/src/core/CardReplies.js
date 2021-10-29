import React, { useState } from "react";
import LogoHelper from "./helper/LogoHelper";
import { Redirect } from "react-router-dom";

const CardReplies = ({ reply }) => {
  const [redirect, setRedirect] = useState(false);

  const doSomething = () => {
    setRedirect(true);
  };

  const getARedirect = (redirect) => {
    if (redirect) {
      return <Redirect to="/" />;
    }
  };

  const convertUTCDateToLocalDate = (date) => {
    var dateLocal = new Date(date);
    var newDate = new Date(
      dateLocal.getTime() - dateLocal.getTimezoneOffset() * 60 * 1000
    );
    return newDate;
  };

  return (
    <div className="card text-white bg-light card-shadow">
      {getARedirect(redirect)}
      <div className="card-body text-muted">
        <b>{reply.userName}</b> replied on{" "}
        {convertUTCDateToLocalDate(reply.date).toLocaleDateString("en-gb", {
          year: "numeric",
          month: "short",
          day: "numeric",
        })}
        : {reply.body}
      </div>
    </div>
  );
};

export default CardReplies;
