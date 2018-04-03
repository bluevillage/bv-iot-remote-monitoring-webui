// Copyright (c) Microsoft. All rights reserved.

import React, { Component } from 'react';

import { Indicator } from 'components/shared';
import {
  Panel,
  PanelHeader,
  PanelHeaderLabel,
  PanelContent,
  PanelOverlay,
  PanelError
} from 'components/pages/dashboard/panel';

import './map.css';

export class MapPanel extends Component {

  componentDidMount() {
    if (this.props.azureMapsKey) {
      this.map = new window.atlas.Map('map', {
        'subscription-key': this.props.azureMapsKey,
        center: [-118.270293, 34.039737],
        zoom: 14
      });
    }
  }

  render() {
    const { t, isPending, error } = this.props;
    const showOverlay = isPending;
    return (
      <Panel className="map-panel-container">
        <PanelHeader>
          <PanelHeaderLabel>{t('dashboard.panels.map.header')}</PanelHeaderLabel>
          { !showOverlay && isPending && <Indicator size="small" /> }
        </PanelHeader>
        <PanelContent className="map-panel-container">
          <div id="map"></div>
        </PanelContent>
        { showOverlay && <PanelOverlay><Indicator /></PanelOverlay> }
        { !this.props.azureMapsKey && <PanelError>Azure maps is not correctly configured</PanelError> }
        { error && <PanelError>{t(error.message)}</PanelError> }
      </Panel>
    );
  }
}
