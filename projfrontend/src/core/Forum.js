import React, { useState, useEffect } from "react";
import Base from "../core/Base";
import { Link } from "react-router-dom";
import {
  queryForAllComments,
  queryForAllReplies,
  createaComment,
} from "./helper/forumHelper";
import { Form } from "react-bootstrap";

import CardComments from "./CardComments";

const Forum = () => {
  const [values, setValues] = useState({
    userName: "",
    header: "",
    date: "",
    body: "",
    tags: "",
    loading: false,
    error: "",
    createdComment: "",
    getaRedirect: false,
    formData: "",
  });

  const {
    userName,
    header,
    date,
    body,
    tags,
    loading,
    error,
    createdComment,
    getaRedirect,
    formData,
  } = values;

  const [comments, setComments] = useState([]);
  const [error2, setError] = useState(false);

  const preload = () => {
    queryForAllComments()
      .then((data) => {
        if (data.error) {
          setError(data.error);
        } else {
          //return in chronological
          setComments(data.sort((a, b) => b.date.localeCompare(a.date)));
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
    createaComment(formData).then((data) => {
      if (!data) {
        console.log("API cooked");
      } else if (data.error) {
        setValues({ ...values, error: data.error });
        console.log(data.error);
      } else {
        setValues({
          ...values,
          userName: "",
          header: "",
          date: "",
          body: "",
          tags: "",
          loading: false,
          createdComment: data.header,
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
      style={{ display: createdComment ? "" : "none" }}
    >
      <h4>{createdComment} comment added successfully</h4>
    </div>
  );

  const createCommentForm = () => (
    <form>
      <div className="form-group">
        <input
          onChange={handleChange("userName")}
          name="userName"
          className="form-control"
          placeholder="Your screen name"
          value={userName}
        />
      </div>
      <div className="form-group">
        <input
          onChange={handleChange("header")}
          name="header"
          className="form-control"
          placeholder="Comment title"
          value={header}
        />
      </div>
      <div className="form-group">
        <input
          onChange={handleChange("body")}
          name="body"
          className="form-control"
          placeholder="Your comment"
          value={body}
        />
      </div>
      <div className="form-group">
        <input
          onChange={handleChange("tags")}
          name="tags"
          className="form-control"
          placeholder="Add tags (separate with commas)"
          value={tags}
        />
      </div>
      <button
        type="submit"
        onClick={onSubmit}
        className="btn btn-outline-success mb-3"
      >
        Post comment
      </button>
    </form>
  );

  return (
    <Base
      title="Add a comment here!"
      description="Welcome to comment creation section"
      className="container p-4"
    >
      <div className="row text-white rounded">
        <div className="col-md-8 offset-md-2">
          {successMessage()}
          {createCommentForm()}
        </div>
      </div>
      <div className="row container-fluid card-matches p-2">
        {comments.map((comment, index) => {
          return (
            <div key={index} className="col-12 mb-4">
              <CardComments comment={comment} />
            </div>
          );
        })}
      </div>
    </Base>
  );
};

export default Forum;
