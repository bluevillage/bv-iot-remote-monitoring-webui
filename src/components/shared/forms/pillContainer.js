import React from 'react';
import PropTypes from 'prop-types';

import { joinClasses } from 'utilities';
import {Pill} from './pill';

export const PillContainer = (props) => {
  const { pills, onSvgClick, svg } = props;

  return (
    <div>
      {pills.map(pill => (
        <Pill
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
