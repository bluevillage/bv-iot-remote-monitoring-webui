// Copyright (c) Microsoft. All rights reserved.

import React from 'react';
import { NavLink } from 'react-router-dom';

export const RuleDetails = ({ match: { params: { id } } }) => (
  <div className="maintenance-container">
    <NavLink to={'/maintenance/notifications'}>Back</NavLink>
    <div className="header">{id}</div>
  </div>
);
