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

import './kpisPanel.css';

const barChartId = 'kpi-bar-chart-container';
const pieChartId = 'kpi-pie-chart-container';

export class KpisPanel extends Component {

  constructor(props) {
    super(props);
    this.tsiClient = new window.TsiClient();
  }

  componentDidMount() {
    this.barChart = new this.tsiClient.ux.BarChart(document.getElementById(barChartId));
    this.pieChart = new this.tsiClient.ux.PieChart(document.getElementById(pieChartId));
  }

  componentWillUpdate(nextProps) {
    const staticTime = ''; // TODO: Remove hard coded time, needed by the charts

    // ================== Bar chart - START
    if (nextProps.topAlarms.length) {
      // Convert the raw counts into a chart readable format
      const barChartDatum = nextProps.topAlarms.map(({ name, count, previousCount }) => ({
        [name]: {
          'Current Month': { [staticTime]: { val: count } }, // TODO: Translate legends
          'Previous Month': { [staticTime]: { val: previousCount } },
        }
      }));

      this.barChart.render(
        barChartDatum,
        { grid: false, legend: 'hidden', tooltip: true, yAxisState: 'shared' },
        this.props.colors.map(color => ({ color }))
      );
    }
    // ================== Bar chart - END

    // ================== Pie chart - START
    const deviceTypes = Object.keys(nextProps.alarmsPerDeviceId);
    if (deviceTypes.length) {
      // Convert the raw counts into a chart readable format
      const pieChartDatum = deviceTypes.map(deviceType => ({
        [deviceType]: {
          '': { [staticTime]: { val: nextProps.alarmsPerDeviceId[deviceType] } }
        }
      }));

      this.pieChart.render(
        pieChartDatum,
        { grid: false, timestamp: staticTime, legend: 'hidden', arcWidthRatio: .6 },
        this.props.colors.map(color => ({ color }))
      );
    }
    // ================== Pie chart - END
  }

  render() {
    return (
      <Panel>
        <PanelHeader>System KPIs</PanelHeader>
        <PanelContent className="kpis-panel-container">
          <div className="kpi-cell full-width">
            <div className="kpi-header">Top rules triggered</div>
            <div className="chart-container" id={barChartId} />
          </div>
          <div className="kpi-cell">
            <div className="kpi-header">Alarm by device type</div>
            <div className="chart-container" id={pieChartId} />
          </div>
          <div className="kpi-cell">
            <div className="kpi-header">Critical alarms</div>
            <div className="critical-alarms">
              <div className="kpi-percentage-container">
                <div className="kpi-value">{ this.props.criticalAlarmsChange }</div>
                <div className="kpi-percentage-sign">%</div>
              </div>
            </div>
          </div>
        </PanelContent>
        { this.props.isPending && <PanelOverlay><Indicator /></PanelOverlay> }
      </Panel>
    );
  }
}
