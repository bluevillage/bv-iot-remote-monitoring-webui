// Copyright (c) Microsoft. All rights reserved.

import React, { Component } from 'react';

import { Btn, Indicator } from 'components/shared';
import { svgs } from 'utilities'
import {
  Panel,
  PanelHeader,
  PanelHeaderLabel,
  PanelContent,
  PanelOverlay,
  PanelError
} from 'components/pages/dashboard/panel';

import './map.css';

const atlas = window.atlas;
const deviceLayer = 'devices-layer';
const seattlePosition = new atlas.data.Position(-122.3320708, 47.6062);

// TODO (stpryor): Add error boundary around the map panel
export class MapPanel extends Component {
  componentDidMount() {
    if (this.props.azureMapsKey) {
      this.map = new atlas.Map('map', {
        'subscription-key': this.props.azureMapsKey,
        center: seattlePosition,
        zoom: 11
      });

      this.map.addPins([], {
          name: deviceLayer,
          cluster: true,
          icon: 'pin-darkblue'
      });

      this.calculatePins(this.props);
    }
  }

  componentWillReceiveProps(nextProps) {
    this.calculatePins(nextProps);
  }

  calculatePins(props) {
    if (Object.keys(props.devices).join() === Object.keys(this.props.devices).join())
      return;

    const devicePins = Object.keys(props.devices)
      .map(key => props.devices[key])
      .filter(({ properties }) => properties.latitude && properties.longitude)
      .map(({ id, properties }) =>
        new atlas.data.Feature(new atlas.data.Point([properties.longitude, properties.latitude]), {
          name: id,
          address: properties.location || ''
        })
      );

    if (this.map && devicePins.length) {
      this.map.addPins(devicePins, {
        name: deviceLayer
      });

      const lons = devicePins.map(({ geometry }) => geometry.coordinates[0]);
      const lats = devicePins.map(({ geometry }) => geometry.coordinates[1]);

      var swLon = Math.min.apply(null, lons);
      var swLat = Math.min.apply(null, lats);
      var neLon = Math.max.apply(null, lons);
      var neLat = Math.max.apply(null, lats);

      // Zoom the map to the bounding box of the devices
      this.map.setCameraBounds({
        bounds: [swLon, swLat, neLon, neLat],
        padding: 50
      });
    }
  }

  zoomIn = () => {
    if (this.map) {
      const currZoom = this.map.getCamera().zoom;
      this.map.setCamera({ zoom: currZoom + 1 });
    }
  }

  zoomOut = () => {
    if (this.map) {
      const currZoom = this.map.getCamera().zoom;
      this.map.setCamera({ zoom: currZoom - 1 });
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
          <button className="zoom-btn zoom-in" onClick={this.zoomIn}>+</button>
          <button className="zoom-btn zoom-out" onClick={this.zoomOut}>-</button>
        </PanelContent>
        { showOverlay && <PanelOverlay><Indicator /></PanelOverlay> }
        { !this.props.azureMapsKey && <PanelError>Azure maps is not correctly configured</PanelError> }
        { error && <PanelError>{t(error.message)}</PanelError> }
      </Panel>
    );
  }
}
