// Copyright (c) Microsoft. All rights reserved.

import React, { Component } from 'react';
import { Observable } from 'rxjs';
import 'tsiclient';

import { TelemetryService } from 'services';
import { Indicator } from 'components/shared';
import {
  Panel,
  PanelHeader,
  PanelContent,
  PanelOverlay
} from 'components/pages/dashboard/panel';

import './kpisPanel.css';

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

const chartId = 'kpi-bar-chart-container';

const compareByProperty = (property) => (a, b) => {
  if (b[property] > a[property]) return 1;
  if (b[property] < a[property]) return -1;
  return 0;
};

export class KpisPanel extends Component {
  constructor(props) {
    super(props);

    this.state = { isPending: true };

    // Initialize chart client
    this.tsiClient = new window.TsiClient();
  }

  componentDidMount() {
    // Create line chart
    this.barChart = new this.tsiClient.ux.BarChart(document.getElementById(chartId));

    const currentFrom = 'NOW-PT1H';
    const previousFrom = 'NOW-PT2H';

    this.subscription = Observable.forkJoin(
      //missing device ids
      TelemetryService.getAlarms({ from: currentFrom, to: 'NOW' }), // Get current
      TelemetryService.getAlarms({ from: previousFrom, to: currentFrom }), // Get previous

      TelemetryService.getAllAlarms({ order: 'desc', from: currentFrom, to: 'NOW' }),
      TelemetryService.getAllAlarms({ order: 'desc', from: previousFrom, to: currentFrom })
    ).subscribe(([
      alarmsByRule,
      previousAlarmsByRule,
      alarmsList,
      previousAlarmsList
    ]) => {
      this.setState({
        alarmsByRule,
        alarmsList,
        isPending: false
      }, () => {
        // Compute top 5 kpis
        const time = '2017-04-19T13:00:00Z';
        const topFiveAlarms = this.state.alarmsByRule
          .sort(compareByProperty('count'))
          .slice(0, 5);
        const previousAlarms = previousAlarmsByRule.reduce(
          (acc, alarm) =>
            (alarm.ruleId in acc)
              ? { ...acc, [alarm.ruleId]: alarm.count }
              : acc
          ,
          topFiveAlarms.reduce((acc, { ruleId }) => ({ ...acc, [ruleId]: 0}), {})
        );
        const datum = topFiveAlarms.map(({ ruleId, count }) => ({
          [ruleId]: { // TODO: Translate
            'Current Month': { [time]: { val: count } },
            'Previous Month': { [time]: { val: previousAlarms[ruleId] } },
          }
        }));
        this.barChart.render(
          datum,
          {
            grid: false,
            legend: 'hidden',
            tooltip: true,
            yAxisState: 'shared' // Default to all values being on the same axis
          },
          chartColors.map(color => ({ color }))
        );
      });
    });
  }

  componentWillUnmount() {
    if (this.subscription) this.subscription.unsubscribe();
  }

  render() {
    return (
      <Panel>
        <PanelHeader>System KPIs</PanelHeader>
        <PanelContent className="kpis-panel-container">
          <div className="chart-container" id={chartId} />
        </PanelContent>
        { this.state.isPending && <PanelOverlay><Indicator /></PanelOverlay> }
      </Panel>
    );
  }
}
