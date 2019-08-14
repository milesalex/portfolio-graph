import React from "react";
import ReactDOM from "react-dom";
import Graph from "./Graph";
import "./styles.css";

const margin = {
  top: 30,
  left: 60,
  right: 30,
  bottom: 80
};

const App = () => (
  <div>
    <Graph width={800} height={480} margin={margin} />
  </div>
);

const rootElement = document.getElementById("root");
ReactDOM.render(<App />, rootElement);
