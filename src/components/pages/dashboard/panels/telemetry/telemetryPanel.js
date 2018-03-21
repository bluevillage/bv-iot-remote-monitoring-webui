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


export class TelemetryPanel extends Component {
  constructor(props) {
    super(props);

    this.state = {
      telemetryKeys: [],
      telemetryKey: ''
    };

    this.tsiClient = new window.TsiClient();
  }

  componentDidMount() {
    this.lineChart = new this.tsiClient.ux.LineChart(document.getElementById(chartId));
  }

  componentWillReceiveProps({ telemetry, isPending }) {
    const telemetryKeys = Object.keys(telemetry).sort();
    const currentKey = this.state.telemetryKey;
    this.setState({
      telemetryKeys,
      telemetryKey: currentKey in telemetry ? currentKey : telemetryKeys[0]
    });
  }

  componentWillUpdate(nextProps, { telemetryKey }) {
    const { telemetry } = nextProps;
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
          this.props.colors.map(color => ({ color }))
        );
      }, 10);
    }
  }

  setTelemetryKey = telemetryKey => () => this.setState({ telemetryKey });

  render() {
    const { telemetry } = this.props;
    const { telemetryKeys, telemetryKey } = this.state;
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
        { this.props.isPending && <PanelOverlay><Indicator /></PanelOverlay> }
      </Panel>
    );
  }
}
