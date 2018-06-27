import React from 'react';
import PropTypes from 'prop-types';

import { Svg } from 'components/shared/svg/svg';

import './styles/pill.css';

export const Pill = ({ svg, label, onSvgClick}) => {
  return (
    <div className="pill" onClick={onSvgClick}>
      { label }
      { svg && <Svg path={svg} className="pill-icon" /> }
    </div>
  );
};

Pill.propTypes = {
  svg: PropTypes.string,
  label: PropTypes.string,
  onSvgClick: PropTypes.func
};
