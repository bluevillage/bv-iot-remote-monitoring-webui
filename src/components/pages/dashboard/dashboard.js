// Copyright (c) Microsoft. All rights reserved.

import React, { Component } from 'react';
import { Observable } from 'rxjs';
import { Grid, Cell } from './grid';
import {
  Widget,
  WidgetHeader,
  WidgetContent,
  WidgetOverlay
} from './widget';

import './dashboard.css';

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

  constructor(props) {
    super(props);

    this.state = {
      w1: true,
      w2: true,
      w3: true,
      w4: true
    };
  }

  componentDidMount() {
    this.subscription = Observable.interval(5000).startWith(0).flatMap(_ => ['w1', 'w2', 'w3', 'w4'])
      .flatMap(key => Observable.of({
          [key]: false
        }).delay(Math.random()*5000).startWith({
          [key]: true
        })
      )
      .subscribe(state => this.setState(state));
  }

  componentWillUnmount() {
    if (this.subscription) this.subscription.unsubscribe();
  }

  render () {
    return (
      <div className="dashboard-container">
        <Grid>
          <Cell className="col-6">
            <Widget>
              <WidgetHeader>Header</WidgetHeader>
              <WidgetContent>
                <pre>{ JSON.stringify(testJson, null, 2) }</pre>
              </WidgetContent>
              { this.state.w1 && <WidgetOverlay /> }
            </Widget>
          </Cell>
          <Cell className="col-4">
            <Widget>
              <WidgetHeader>Header</WidgetHeader>
              <WidgetContent>
                <pre>{ JSON.stringify(testJson, null, 2) }</pre>
              </WidgetContent>
              { this.state.w2 && <WidgetOverlay /> }
            </Widget>
          </Cell>
          <Cell className="col-6">
            <Widget>
              <WidgetHeader>Header</WidgetHeader>
              <WidgetContent>
                <pre>{ JSON.stringify(testJson, null, 2) }</pre>
              </WidgetContent>
              { this.state.w3 && <WidgetOverlay /> }
            </Widget>
          </Cell>
          <Cell className="col-4">
            <Widget>
              <WidgetHeader>Header</WidgetHeader>
              <WidgetContent>
                <pre>{ JSON.stringify(testJson, null, 2) }</pre>
              </WidgetContent>
              { this.state.w4 && <WidgetOverlay /> }
            </Widget>
          </Cell>
        </Grid>
      </div>
    );
  }
}
