import React from "react";
// @ts-ignore
import styles from "./styles.css";

const App = (props: any) =>
  <div className={styles.special}>
    <h1>
      Hello {props.name}
    </h1>
  </div>;

export default App;
