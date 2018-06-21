import React, {Component} from 'react';
import PropTypes from 'prop-types';

import {Pill} from './pill';
import {Link} from 'utilities';
import './styles/pillContainer.css';

export class PillContainer extends Component {
  constructor(props){
    super(props);
  }

  render(){
    const { pills, onSvgClick, svg } = this.props;
    console.log(pills.value);
    return (
      <div className="pill-container">
        {pills.value.map((pill, idx) => (
          <Pill
            key={idx}
            label={pill}
            svg={svg}
            onSvgClick={onSvgClick(idx)}
          ></Pill>
        ))}
      </div>
    );
  }
};

PillContainer.propTypes = {
  svg: PropTypes.string,
  onSvgClick: PropTypes.func,
  pills: PropTypes.instanceOf(Link)
};
