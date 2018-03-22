// Copyright (c) Microsoft. All rights reserved.

import React, { Component } from 'react';

import { Indicator } from 'components/shared';
import { Svg } from 'components/shared/svg/svg';
import { svgs } from 'utilities';
import {
  Panel,
  PanelHeader,
  PanelHeaderLabel,
  PanelContent,
  PanelOverlay
} from 'components/pages/dashboard/panel';

import './overviewPanel.css';

export class OverviewPanel extends Component {
  constructor(props) {
    super(props);

    this.state = { isPending: true };
  }

  render() {
    const { isPending, openCriticalCount, openWarningCount, onlineDeviceCount, offlineDeviceCount } = this.props;
    const showOverlay = isPending && !openCriticalCount && !openWarningCount;
    return (
      <Panel>
        <PanelHeader>
          <PanelHeaderLabel>Devices overview</PanelHeaderLabel>
          { !showOverlay && isPending && <Indicator size="small" /> }
        </PanelHeader>
        <PanelContent className="device-stats-container">
          <div className="stat-header">All devices</div>
          <div className="stat-container">
            <div className="stat-cell col-third">
              <div className="stat-value critical">
                <span>{ openCriticalCount }</span>
                <Svg path={svgs.critical} className="severity-icon"/>
              </div>
              <div className="stat-label">Critical</div>
            </div>

            <div className="stat-cell col-third">
              <div className="stat-value warning">
                <span>{ openWarningCount }</span>
                <Svg path={svgs.warning} className="severity-icon"/>
              </div>
              <div className="stat-label">Warnings</div>
            </div>

            <div className="stat-cell col-third" />

            <div className="stat-cell col-third">
              <div className="stat-value">{ onlineDeviceCount + offlineDeviceCount }</div>
              <div className="stat-label">Total</div>
            </div>

            <div className="stat-cell col-third">
              <div className="stat-value">{ onlineDeviceCount }</div>
              <div className="stat-label">Connected</div>
            </div>

            <div className="stat-cell col-third">
              <div className="stat-value">{ offlineDeviceCount }</div>
              <div className="stat-label">Offline</div>
            </div>
          </div>
        </PanelContent>
        { showOverlay && <PanelOverlay><Indicator /></PanelOverlay> }
      </Panel>
    );
  }
}
