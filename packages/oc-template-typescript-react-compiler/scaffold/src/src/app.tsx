import React from 'react';
import styles from './styles.css';
import { AdditionalData, ClientProps, GetData } from './types';

interface AppProps extends ClientProps {
  getData: GetData;
}

const App: React.FC<AppProps> = ({ firstName, lastName, getData, userId }) => {
  const [additionalData, setAdditionalData] = React.useState<AdditionalData | null>(null);
  const [error, setError] = React.useState('');

  const fetchMoreData = () => {
    setError('');
    getData({ userId, getMoreData: true }, (err, data) => {
      if (err) {
        setError(String(err));
      } else {
        setAdditionalData(data);
      }
    });
  };

  if (error) {
    return <div>Something wrong happened!</div>;
  }

  return (
    <div className={styles.container}>
      <h1 style={{ margin: '0 0 20px 0' }}>
        Hello, <span style={{ textDecoration: 'underline' }}>{firstName}</span> {lastName}
      </h1>
      {additionalData && (
        <div className={styles.info}>
          <div className={styles.block}>Age: {additionalData.age}</div>
          <div className={styles.block}>
            Hobbies: {additionalData.hobbies.map((x) => x.toLowerCase()).join(', ')}
          </div>
        </div>
      )}
      <button className={styles.button} onClick={fetchMoreData}>
        Get extra information
      </button>
    </div>
  );
};

export default App;
