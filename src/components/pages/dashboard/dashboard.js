// Copyright (c) Microsoft. All rights reserved.

import React, { Component } from 'react';
import { Grid, Cell } from './grid';

import './dashboard.css';

const Widget = ({ children }) => (
  <div className="widget-container">
    { children }
  </div>
);

const WidgetHeader = ({ children }) => (
  <div className="widget-header">{ children }</div>
);

const WidgetContent = ({ children }) => (
  <div className="widget-content">{ children }</div>
);

const testJson = {
  "name":"John",
  "age":30,
  "cars": {
      "car1":"Ford",
      "car2":"BMW",
      "car3":"Fiat"
  },
  "cars2": {
    "car1":"Ford",
    "car2":"BMW",
    "car3":"Fiat"
  },
  "othercars": {
    "car1":"Ford",
    "car2":"BMW",
    "car3":"Fiat"
  },
  "extracars": {
    "car1":"Ford",
    "car2":"BMW",
    "car3":"Fiat"
  },
};

export class Dashboard extends Component {
  render () {
    return (
      <div className="dashboard-container">
        <Grid>
          <Cell className="col-6">
            <Widget>
              <WidgetHeader>Header</WidgetHeader>
              <WidgetContent>Content</WidgetContent>
            </Widget>
          </Cell>
          <Cell className="col-4">
            <Widget>
              <WidgetHeader>Header</WidgetHeader>
              <WidgetContent>
                <pre>{ JSON.stringify(testJson, null, 2) }</pre>
              </WidgetContent>
            </Widget>
          </Cell>
          <Cell className="col-6">
            <Widget>
              <WidgetHeader>Header</WidgetHeader>
              <WidgetContent>Content</WidgetContent>
            </Widget>
          </Cell>
          <Cell className="col-4">
            <Widget>
              <WidgetHeader>Header</WidgetHeader>
              <WidgetContent>Content</WidgetContent>
            </Widget>
          </Cell>
        </Grid>
      </div>
    );
  }
}
