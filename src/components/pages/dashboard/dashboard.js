// Copyright (c) Microsoft. All rights reserved.

import React, { Component } from 'react';
import { Grid, Cell } from './grid';

import './dashboard.css';

export class Dashboard extends Component {
  render () {
    return (
      <div className="dashboard-container">
        <Grid>
          <Cell className="col-7">Cell 1</Cell>
          <Cell className="col-3">Cell 2</Cell>
          <Cell className="col-7">Cell 3</Cell>
          <Cell className="col-3">Cell 4</Cell>
        </Grid>
      </div>
    );
  }
}
