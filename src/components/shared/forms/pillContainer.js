import React from 'react';
import PropTypes from 'prop-types';

import { Pill } from './pill';
import { Link } from 'utilities';
import './styles/pillContainer.css';

export const PillContainer = (props) => {
  const { pills, onSvgClick, svg } = props;

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
};

PillContainer.propTypes = {
  svg: PropTypes.string,
  onSvgClick: PropTypes.func,
  pills: PropTypes.instanceOf(Link)
};
