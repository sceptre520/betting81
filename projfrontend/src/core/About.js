import React from "react";
import Base from "./Base";

const About = () => {
  return (
    <Base title="About" description="">
      <div className="row text-left">
        <div className="col-3"></div>
        <div className="col-6">
          <p>
            This is simply Declan Walpole's hobby. Having completed a web
            development bootcamp, he wanted a toy project to apply his new
            skills. <br />
            <br /> This application compares player prop odds across the
            following sportsbooks:
            <ul>
              <li>PointsBet</li>
              <li>Kambi</li>
            </ul>
            Hopefully, someone finds value and capitalizes on mispricing.
          </p>
          <br></br>
          <p className="text-italic">
            Credit to{" "}
            <a href="https://www.balldontlie.io/#introduction">balldontlie</a>{" "}
            for the API from which we obtain players' season averages.
          </p>
        </div>
      </div>
    </Base>
  );
};

export default About;
