// Copyright (c) Microsoft. All rights reserved.

import React, { Component } from 'react';
import { Observable, Subject } from 'rxjs';

import Config from 'app.config';
import { TelemetryService } from 'services';
import { compareByProperty } from 'utilities';
import { Grid, Cell } from './grid';
import {
  MapPanel,
  AlarmsPanelContainer,
  TelemetryPanel,
  KpisPanelContainer
} from './panels';

import './dashboard.css';

const maxTopAlarms = 5; // TODO: Move to config

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

export class Dashboard extends Component {

  constructor(props) {
    super(props);

    this.state = {
      chartColors,

      // Telemetry data
      telemetry: {},
      telemetryIsPending: true,
      telemetryError: null,

      // Kpis data
      topAlarms: [],
      alarmsPerDeviceId: {},
      criticalAlarmsChange: 0,
      kpisIsPending: true,
      kpisError: null,

      // Map data
      openWarningCount: 0,
      openCriticalCount: 0
    };

    this.subscriptions = [];
    this.telemetryRefresh$ = new Subject();
    this.panelsRefresh$ = new Subject();
  }

  componentDidMount() {
    // Telemetry stream - START
    const telemetry$ = TelemetryService.getTelemetryByDeviceIdP15M()
      .merge(
        this.telemetryRefresh$
          .delay(Config.telemetryRefreshInterval)
          .do(_ => this.setState({ telemetryIsPending: true }))
          .flatMap(_ => TelemetryService.getTelemetryByDeviceIdP1M())
      )
      .flatMap(items =>
        Observable.from(items)
          .flatMap(({ data, deviceId, time }) =>
            Observable.from(Object.keys(data))
              .filter(key => key.indexOf('Unit') < 0)
              .map(key => ({ key, deviceId, time, data: data[key] }))
          )
          .reduce((acc, { key, deviceId, time, data }) => ({
            ...acc,
            [key]: {
              ...(acc[key] ? acc[key] : {}),
              [deviceId]: {
                ...(acc[key] && acc[key][deviceId] ? acc[key][deviceId] : {}),
                '': {
                  ...(acc[key] && acc[key][deviceId] && acc[key][deviceId][''] ? acc[key][deviceId][''] : {}),
                  [time]: { val: data }
                }
              }
            }
          }), this.state.telemetry)
      )
      .map(telemetry => ({ telemetry, telemetryIsPending: false }));
      // Telemetry stream - END

      // KPI stream - START
      const currentFrom = 'NOW-PT1H';
      const previousFrom = 'NOW-PT2H';

      const currentParams = { from: currentFrom, to: 'NOW' };
      const previousParams = { from: previousFrom, to: currentFrom };

      // TODO: Add device ids to params - START
      const kpis$ = this.panelsRefresh$
        .delay(Config.dashboardRefreshInterval)
        .startWith(0)
        .do(_ => this.setState({ kpisIsPending: true }))
        .flatMap(_ =>
          Observable.forkJoin(
            TelemetryService.getActiveAlarms(currentParams), // Get current
            TelemetryService.getActiveAlarms(previousParams), // Get previous

            TelemetryService.getAlarms(currentParams),
            TelemetryService.getAlarms(previousParams)
          )
        ).map(([
          currentActiveAlarms,
          previousActiveAlarms,

          currentAlarms,
          previousAlarms
        ]) => {
          // Process all the data out of the currentAlarms list
          const currentAlarmsStats = currentAlarms.reduce((acc, alarm) => {
              const isOpen = alarm.status === 'open';
              const isWarning = alarm.severity === 'warning';
              const isCritical = alarm.severity === 'critical';
              let updatedAlarmsPerDeviceId = acc.alarmsPerDeviceId;
              if (alarm.deviceId) {
                const deviceType = (this.props.devices[alarm.deviceId] || {}).type || 'Other'; // TODO: Translate
                updatedAlarmsPerDeviceId = {
                  ...updatedAlarmsPerDeviceId,
                  [deviceType]: (updatedAlarmsPerDeviceId[deviceType] || 0) + 1
                };
              }
              return {
                openWarningCount: (acc.openWarningCount || 0) + (isWarning && isOpen ? 1 : 0),
                openCriticalCount: (acc.openCriticalCount || 0) + (isCritical && isOpen ? 1 : 0),
                totalCriticalCount: (acc.totalCriticalCount || 0) + (isCritical ? 1 : 0),
                alarmsPerDeviceId: updatedAlarmsPerDeviceId
              };
            },
            { alarmsPerDeviceId: {} }
          );
          // ================== Critical Alarms Count - START
          const currentCriticalAlarms = currentAlarmsStats.totalCriticalCount;
          const previousCriticalAlarms = previousAlarms.reduce(
            (count, { severity }) => severity === 'critical' ? count + 1 : count,
            0
          );
          const criticalAlarmsChange = ((currentCriticalAlarms - previousCriticalAlarms) / currentCriticalAlarms * 100).toFixed(2);
          // ================== Critical Alarms Count - END

          // ================== Top Alarms - START
          const currentTopAlarms = currentActiveAlarms
            .sort(compareByProperty('count'))
            .slice(0, maxTopAlarms);

          // Find the previous counts for the current top kpis
          const previousTopAlarmsMap = previousActiveAlarms.reduce(
            (acc, { ruleId, count }) =>
              (ruleId in acc)
                ? { ...acc, [ruleId]: count }
                : acc
            ,
            currentTopAlarms.reduce((acc, { ruleId }) => ({ ...acc, [ruleId]: 0 }), {})
          );

          const topAlarms = currentTopAlarms.map(({ ruleId, count }) => ({
            name: (this.props.rules[ruleId] || {}).name || ruleId,
            count,
            previousCount: previousTopAlarmsMap[ruleId] || 0
          }));
          // ================== Top Alarms - END
          return ({
            kpisIsPending: false,

            // Kpis data
            topAlarms,
            criticalAlarmsChange,
            alarmsPerDeviceId: currentAlarmsStats.alarmsPerDeviceId,

            // Map data
            openWarningCount: currentAlarmsStats.openWarningCount,
            openCriticalCount: currentAlarmsStats.openCriticalCount
          });
        });
      // KPI stream - END

      this.subscriptions.push(
        telemetry$.subscribe(
          telemetryState => this.setState(telemetryState, () => this.telemetryRefresh$.next('r')),
          telemetryError => this.setState({ telemetryError, telemetryIsPending: false })
        )
      );

      this.subscriptions.push(
        kpis$.subscribe(
          kpiState => this.setState(kpiState, () => this.panelsRefresh$.next('r')),
          kpisError => this.setState({ kpisError, kpisIsPending: false })
        )
      );
  }

  componentWillUnmount() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  render () {
    const {
      chartColors,

      telemetry,
      telemetryIsPending,
      telemetryError,

      topAlarms,
      alarmsPerDeviceId,
      criticalAlarmsChange,
      kpisIsPending,
      kpisError,

      openWarningCount,
      openCriticalCount
    } = this.state;
    return (
      <div className="dashboard-container">
        <Grid>
          <Cell className="col-6">
            <MapPanel
              openWarningCount={openWarningCount}
              openCriticalCount={openCriticalCount}
              isPending={kpisIsPending} />
          </Cell>
          <Cell className="col-4">
            <AlarmsPanelContainer />
          </Cell>
          <Cell className="col-6">
            <TelemetryPanel
              telemetry={telemetry}
              isPending={telemetryIsPending}
              error={telemetryError}
              colors={chartColors} />
          </Cell>
          <Cell className="col-4">
            <KpisPanelContainer
              topAlarms={topAlarms}
              alarmsPerDeviceId={alarmsPerDeviceId}
              criticalAlarmsChange={criticalAlarmsChange}
              isPending={kpisIsPending}
              error={kpisError}
              colors={chartColors} />
          </Cell>
        </Grid>
      </div>
    );
  }
}
