// Copyright (c) Microsoft. All rights reserved.

import React from 'react';
import { Observable } from 'rxjs';
// import update from 'immutability-helper';
import 'tsiclient';

import { TelemetryService } from 'services';
import { Indicator, Radio } from 'components/shared';
import {
  Panel,
  PanelHeader,
  PanelContent,
  PanelOverlay
} from 'components/pages/dashboard/panel';
import { LinkedComponent, Validator } from 'utilities';

import './telemetryPanel.css';

const telemetryChartId = 'device-telemetry-chart';

const chartColors = [
  '#01B8AA',
  '#33669A',
  '#26FFDE',
  '#3599B8',
  '#E81123',
  '#E0E7EE',
  '#F2C80F',
  '#FDA954',
  '#FD625E',
  '#FF4EC2',
  '#FFEE91'
];

export class TelemetryPanel extends LinkedComponent {
  constructor(props) {
    super(props);

    this.state = {
      isPending: true,
      telemetry: {},
      telemetryKeys: [],
      telemetryKey: ''
    };

    // Create validators
    this.telemetryKeyRadio = this.linkTo('telemetryKey');

    // Initialize chart client
    this.tsiClient = new window.TsiClient();
  }

  componentDidMount() {
    TelemetryService.getTelemetryByDeviceIdP1M()
      .flatMap(({ items }) => items)
      .flatMap(({ data, deviceId, time }) =>
        Observable.from(Object.keys(data))
          .filter(key => key.indexOf('Unit') < 0)
          .map(key => ({ key, deviceId, time, data: data[key] }))
      )
      .reduce((acc, { key, deviceId, time, data }) => ({
        ...acc,
        [key]: {
          ...acc[key],
          [deviceId]: {
            ...(acc[key] && acc[key][deviceId] ? acc[key][deviceId] : {}),
            [time]: { val: data }
          }
        }
      }), {})
      .subscribe(telemetry => {
        const telemetryKeys = Object.keys(telemetry).sort();
        this.setState({
          telemetry,
          telemetryKeys,
          telemetryKey: telemetryKeys[0],
          isPending: false
        })
      });
      // Create line chart
      this.lineChart = new this.tsiClient.ux.LineChart(document.getElementById(telemetryChartId));
  }

  componentWillUnmount() {
    if (this.subscription) this.subscription.unsubscribe();
  }

  componentWillUpdate(_, newState) {
    if (newState.telemetry && newState.telemetryKey && newState.telemetry[newState.telemetryKey]) {
      const datum = [{ [newState.telemetryKey]: newState.telemetry[newState.telemetryKey] }];
      var idsObject = datum[0][Object.keys(datum[0])[0]];
      var newDatum = Object.keys(idsObject).reduce((p, id) => {
        var ae = {[id]: {'': idsObject[id]}};
        p.push(ae);
        return p;
      },[]);
      this.lineChart.render(newDatum, { legend: 'compact', grid: true, tooltip: true, grid: false, yAxisState: 'shared', noAnimate: true }, chartColors.map(color => ({ color })));
    }
  }

  render() {
    const { telemetryKeys, telemetry } = this.state;
    return (
      <Panel>
        <PanelHeader>Telemetry</PanelHeader>
        <PanelContent className="telemetry-panel-container">
          <div className="chart-container" id={telemetryChartId}></div>
          <div className="options-container">
            {
              telemetryKeys.map((key, index) => {
                const count = Object.keys(telemetry[key]).length;
                return (
                  <Radio link={this.telemetryKeyRadio} value={key} key={index}>
                    {`${key} [${count}]`}
                  </Radio>
                );
              })
            }
          </div>
        </PanelContent>
        { this.state.isPending && <PanelOverlay><Indicator /></PanelOverlay> }
      </Panel>
    );
  }
}
