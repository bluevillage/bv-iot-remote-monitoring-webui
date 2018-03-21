// Copyright (c) Microsoft. All rights reserved.

import React, { Component } from 'react';
import { Observable } from 'rxjs';

import { TelemetryService } from 'services';
import { Grid, Cell } from './grid';
import {
  MapPanel,
  AlarmsPanelContainer,
  TelemetryPanel,
  KpisPanelContainer
} from './panels';

import './dashboard.css';

const maxTopAlarms = 5; // TODO: Move to config

const countCriticalAlarms = alarms => alarms.reduce(
  (count, { severity }) => severity === 'critical' ? count + 1 : count,
  0
);

const compareByProperty = (property) => (a, b) => {
  if (b[property] > a[property]) return 1;
  if (b[property] < a[property]) return -1;
  return 0;
};

export class Dashboard extends Component {

  constructor(props) {
    super(props);

    this.state = {
      // Telemetry data
      telemetry: {},
      telemetryIsPending: true,
      telemetryError: null,

      // Kpis data
      currentTopAlarms: [],
      previousTopAlarms: {},

      currentActiveAlarms: [],
      previousActiveAlarms: [],
      currentAlarms: [],
      previousAlarms: [],
      criticalAlarmsChange: 0,
      kpisIsPending: true,
      kpisError: null,
    };

    this.subscriptions = [];
  }

  componentDidMount() {
    // Telemetry stream - START
    const telemetry$ = TelemetryService.getTelemetryByDeviceIdP15M()
      .flatMap(response =>
        Observable.interval(2000)
          .do(_ => this.setState({ telemetryIsPending: true }))
          .flatMap(_ => TelemetryService.getTelemetryByDeviceIdP1M())
          .startWith(response)
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
      );
      // Telemetry stream - END

      // KPI stream - START
      const currentFrom = 'NOW-PT1H';
      const previousFrom = 'NOW-PT2H';

      const currentParams = { from: currentFrom, to: 'NOW' };
      const previousParams = { from: previousFrom, to: currentFrom };

      // TODO: Add device ids to params - START
      const kpis$ = Observable.forkJoin(
        TelemetryService.getActiveAlarms(currentParams), // Get current
        TelemetryService.getActiveAlarms(previousParams), // Get previous

        TelemetryService.getAlarms(currentParams),
        TelemetryService.getAlarms(previousParams)
      );
      // KPI stream - END

      this.subscriptions.push(
        telemetry$.subscribe(
          telemetry => this.setState({ telemetry, telemetryIsPending: false }),
          telemetryError => this.setState({ telemetryError, telemetryIsPending: false })
        )
      );

      this.subscriptions.push(
        kpis$.subscribe(([
          currentActiveAlarms,
          previousActiveAlarms,

          currentAlarms,
          previousAlarms
        ]) => {
          // ================== Critical Alarms Count - START
          const currentCriticalAlarms = countCriticalAlarms(currentAlarms);
          const previousCriticalAlarms = countCriticalAlarms(previousAlarms);
          const criticalAlarmsChange = ((currentCriticalAlarms - previousCriticalAlarms) / currentCriticalAlarms * 100).toFixed(2);
          // ================== Critical Alarms Count - END

          // ================== Top Alarms - START
          const currentTopAlarms = currentActiveAlarms
            .sort(compareByProperty('count'))
            .slice(0, maxTopAlarms);

          // Find the previous counts for the current top kpis
          const previousTopAlarms = previousActiveAlarms.reduce(
            (acc, { ruleId, count }) =>
              (ruleId in acc)
                ? { ...acc, [ruleId]: count }
                : acc
            ,
            currentTopAlarms.reduce((acc, { ruleId }) => ({ ...acc, [ruleId]: 0 }), {})
          );
          // TODO: Merge these two collections into a single array of objects
          // ================== Top Alarms - END
          this.setState({
            currentTopAlarms,
            previousTopAlarms,

            currentActiveAlarms,
            previousActiveAlarms,
            currentAlarms,
            previousAlarms,
            criticalAlarmsChange,
            kpisIsPending: false
          });
        })
      );
  }

  componentWillUnmount() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  render () {
    const {
      telemetry,
      telemetryIsPending,

      currentTopAlarms,
      previousTopAlarms,

      currentActiveAlarms,
      previousActiveAlarms,
      currentAlarms,
      previousAlarms,
      criticalAlarmsChange,
      kpisIsPending
    } = this.state;
    return (
      <div className="dashboard-container">
        <Grid>
          <Cell className="col-6">
            <MapPanel />
          </Cell>
          <Cell className="col-4">
            <AlarmsPanelContainer />
          </Cell>
          <Cell className="col-6">
            <TelemetryPanel
              telemetry={telemetry}
              isPending={telemetryIsPending} />
          </Cell>
          <Cell className="col-4">
            <KpisPanelContainer
              currentTopAlarms={currentTopAlarms}
              previousTopAlarms={previousTopAlarms}

              currentActiveAlarms={currentActiveAlarms}
              previousActiveAlarms={previousActiveAlarms}
              currentAlarms={currentAlarms}
              previousAlarms={previousAlarms}
              criticalAlarmsChange={criticalAlarmsChange}
              isPending={kpisIsPending} />
          </Cell>
        </Grid>
      </div>
    );
  }
}
