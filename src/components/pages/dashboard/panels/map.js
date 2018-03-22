// Copyright (c) Microsoft. All rights reserved.

import React, { Component } from 'react';

import { Indicator } from 'components/shared';
import {
  Panel,
  PanelHeader,
  PanelHeaderLabel,
  PanelContent,
  PanelOverlay
} from 'components/pages/dashboard/panel';

export class MapPanel extends Component {
  render() {
    const showOverlay = false;
    const isPending = false;
    return (
      <Panel className="map-panel-container">
        <PanelHeader>
          <PanelHeaderLabel>Device locations</PanelHeaderLabel>
          { !showOverlay && isPending && <Indicator size="small" /> }
        </PanelHeader>
        <PanelContent>
        </PanelContent>
        { showOverlay && <PanelOverlay><Indicator /></PanelOverlay> }
      </Panel>
    );
  }
}
