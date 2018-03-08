// Copyright (c) Microsoft. All rights reserved.

import React from 'react';
import { NavLink } from 'react-router-dom';

export const JobDetails = ({ match: { params: { id } } }) => (
  <div className="maintenance-container">
    <NavLink to={'/maintenance/jobs'}>Back</NavLink>
    <div className="header">{id}</div>
  </div>
);
