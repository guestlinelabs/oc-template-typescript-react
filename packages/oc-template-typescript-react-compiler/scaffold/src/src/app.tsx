import React from 'react';
import styles from './styles.css';
import { AdditionalData } from './AdditionalData';

interface State {
  name: string;
}

class App extends React.Component<any, State> {
  constructor(props: any, context: any) {
    super(props);
    console.log('props', props);
    this.state = {
      name: props.name
    };
  }

  fetchMoreData() {
    this.props.getData({ getMoreData: true }, (err: any, data: AdditionalData, moreData?: any) => {
      if (err) return alert(err);
      console.log(data);
      console.log(moreData);
      this.setState({
        name: `${this.state.name} with Age ${data.Age} and beautiful ${data.HairColour} hair`
      });
    });
  }

  render() {
    return (
      <div className={styles.special}>
        <h1>Hello {this.state.name}</h1>
        <button onClick={() => this.fetchMoreData()}>Click Me</button>
      </div>
    );
  }
}

export default App; //withDataProvider(App);
