import React from 'react';
import PropTypes from 'prop-types';

import { Svg } from 'components/shared/svg/svg';
import { joinClasses } from 'utilities';

import './styles/pill.css';

export const Pill = (props) => {
  const { svg, label, onSvgClick} = props;
  return (
    <p className={joinClasses('pill', 'pill-primary')} onClick={onSvgClick}>
      {label}
      { props.svg && <Svg path={props.svg} className="pill-icon" /> }
    </p>
  );
};

Pill.propTypes = {
  svg: PropTypes.string,
  label: PropTypes.string,
  onSvgClick: PropTypes.func
};
