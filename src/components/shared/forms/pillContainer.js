import React from 'react';
import PropTypes from 'prop-types';

import { joinClasses } from 'utilities';
import {Pill} from './pill';
import './styles/pillContainer.css';

export const PillContainer = (props) => {
  const { pills, onSvgClick, svg } = props;

  return (
    <div className="pill-container">
      {pills.map((pill, idx) => (
        <Pill
          key={idx}
          label={pill}
          svg={props.svg}
          onSvgClick={props.onSvgClick}
        ></Pill>
      ))}
    </div>
  );
};

PillContainer.propTypes = {
  svg: PropTypes.string,
  onSvgClick: PropTypes.func,
  pills: PropTypes.arrayOf(PropTypes.string)
};
