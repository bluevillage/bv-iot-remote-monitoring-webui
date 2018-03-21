// Copyright (c) Microsoft. All rights reserved.

import React, { Component } from 'react';
import 'tsiclient';

import { Indicator } from 'components/shared';
import {
  Panel,
  PanelHeader,
  PanelContent,
  PanelOverlay
} from 'components/pages/dashboard/panel';
import { joinClasses } from 'utilities';

import './telemetryPanel.css';
// TODO: find a way to import without the relative path
import '../../../../../../node_modules/tsiclient/tsiclient.css';

const chartId = 'telemetry-chart-container';

const chartColors = [
  '#01B8AA',
  '#F2C80F',
  '#E81123',
  '#3599B8',
  '#33669A',
  '#26FFDE',
  '#E0E7EE',
  '#FDA954',
  '#FD625E',
  '#FF4EC2',
  '#FFEE91'
];

export class TelemetryPanel extends Component {
  constructor(props) {
    super(props);

    this.state = {
      telemetry: {},
      telemetryKeys: [],
      telemetryKey: '',
      isPending: true
    };

    // Initialize chart client
    this.tsiClient = new window.TsiClient();
  }

  componentDidMount() {
    // Create line chart
    this.lineChart = new this.tsiClient.ux.LineChart(document.getElementById(chartId));
  }

  componentWillReceiveProps({ telemetry, isPending }) {
    const telemetryKeys = Object.keys(telemetry).sort();
    const currentKey = this.state.telemetryKey;
    this.setState({
      telemetry,
      telemetryKeys,
      telemetryKey: currentKey in telemetry ? currentKey : telemetryKeys[0],
      isPending
    });
  }

  componentWillUpdate(_, { telemetry, telemetryKey}) {
    if (Object.keys(telemetry).length && telemetryKey && telemetry[telemetryKey]) {
      const chartData = Object.keys(telemetry[telemetryKey]).map(deviceId => ({
        [deviceId]: telemetry[telemetryKey][deviceId]
      }));
      const noAnimate = telemetryKey === this.state.telemetryKey;
      // Set a timeout to allow the panel height to be calculated before updating the graph
      setTimeout(() => {
        this.lineChart.render(
          chartData,
          {
            grid: false,
            legend: 'compact',
            noAnimate, // If the telemetryKey changes, animate
            tooltip: true,
            yAxisState: 'shared' // Default to all values being on the same axis
          },
          chartColors.map(color => ({ color }))
        );
      }, 10);
    }
  }

  setTelemetryKey = telemetryKey => () => this.setState({ telemetryKey });

  render() {
    const { telemetryKeys, telemetry, telemetryKey } = this.state;
    return (
      <Panel>
        <PanelHeader>Telemetry</PanelHeader>
        <PanelContent className="telemetry-panel-container">
          <div className="options-container">
            {
              telemetryKeys.map((key, index) => {
                const count = Object.keys(telemetry[key]).length;
                return (
                  <button key={index}
                       onClick={this.setTelemetryKey(key)}
                       className={joinClasses('telemetry-option', telemetryKey === key ? 'active' : '')}>
                    {`${key} [${count}]`}
                  </button>
                );
              })
            }
          </div>
          <div className="chart-container" id={chartId} />
        </PanelContent>
        { this.state.isPending && <PanelOverlay><Indicator /></PanelOverlay> }
      </Panel>
    );
  }
}
