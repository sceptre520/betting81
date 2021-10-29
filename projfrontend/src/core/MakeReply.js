import React, { useState, useEffect } from "react";
import Base from "../core/Base";
import { Link } from "react-router-dom";
import {
  queryForAllComments,
  queryForAllReplies,
  createaComment,
  createaReply,
} from "./helper/forumHelper";
import { Form } from "react-bootstrap";

const MakeReply = (comment) => {
  const [values, setValues] = useState({
    body: "",
    commentId: "",
    loading: false,
    error: "",
    createdReply: "",
    getaRedirect: false,
    formData: "",
  });

  const {
    body,
    commentId,
    loading,
    error,
    createdReply,
    getaRedirect,
    formData,
  } = values;

  const [replies, setReplies] = useState([]);
  const [error2, setError] = useState(false);

  const preload = () => {
    queryForAllReplies()
      .then((data) => {
        if (data.error) {
          setError(data.error);
        } else {
          //return in chronological
          setReplies(data.sort((a, b) => b.date.localeCompare(a.date)));
        }
      })
      .then(() => {
        setValues({ ...values, formData: new FormData() });
      });
  };

  useEffect(() => {
    preload();
  }, []);

  const onSubmit = (event) => {
    event.preventDefault();
    setValues({ ...values, error: "", loading: true });
    formData.append("commentId", comment._id);
    createaReply(formData).then((data) => {
      if (!data) {
        console.log("API cooked");
      } else if (data.error) {
        setValues({ ...values, error: data.error });
        console.log(data.error);
      } else {
        setValues({
          ...values,

          body: "",
          loading: false,
          createdReply: data.body,
        });
      }
    });
  };

  const handleChange = (name) => (event) => {
    const value = name === "photo" ? event.target.files[0] : event.target.value;
    formData.set(name, value);
    setValues({ ...values, [name]: value });
  };

  const successMessage = () => (
    <div
      className="alert alert-success mt-3"
      style={{ display: createdReply ? "" : "none" }}
    >
      <h4>You replied: {createdReply}</h4>
    </div>
  );

  const createReplyForm = () => (
    <form>
      <div className="row">
        <div className="col-6 container-fluid">
          <input
            onChange={handleChange("body")}
            name="body"
            className="form-control"
            placeholder="text"
            value={body}
          />
        </div>
        <div className="col-6 container-fluid">
          <button
            type="submit"
            onClick={onSubmit}
            className="btn btn-outline-success mb-3"
          >
            Post reply
          </button>
        </div>
      </div>
    </form>
  );

  return (
    <div>
      <div className="row text-white rounded">
        <div className="offset-md-2">
          {successMessage()}
          {createReplyForm()}
        </div>
      </div>
      <div className="row container-fluid card-matches p-2"></div>
    </div>
  );
};

export default MakeReply;

// {comments.map((comment, index) => {
//     return (
//       <div key={index} className="col-12 mb-4">
//         <CardComments comment={comment} />
//       </div>
//     );
//   })}
