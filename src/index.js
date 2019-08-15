import React from 'react';
import ReactDOM from 'react-dom';
import Graph from './Graph';
import { ParentSize } from '@vx/responsive';
import './styles.css';

const margin = {
  top: 30,
  left: 5,
  right: 40,
  bottom: 30
};

const App = () => (
  <div
    style={{
      backgroundColor: 'white',
      borderRadius: 4,
      padding: '10px 30px 30px'
    }}
  >
    <ParentSize>
      {parent => <Graph width={parent.width} height={500} margin={margin} />}
    </ParentSize>
  </div>
);

const rootElement = document.getElementById('root');
ReactDOM.render(<App />, rootElement);
