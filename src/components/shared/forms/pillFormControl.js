import React from 'react';
import PropTypes from 'prop-types';

import { Pill } from './pill';
import './styles/pillFormControl.css';

export const PillFormControl = ({ pills, onSvgClick, svg }) => {
  return (
    <div className="pill-form-control">
      {pills.map((pill, idx) => (
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

PillFormControl.propTypes = {
  svg: PropTypes.string,
  onSvgClick: PropTypes.func,
  pills: PropTypes.arrayOf(PropTypes.string)
};
