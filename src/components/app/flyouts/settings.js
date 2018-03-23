// Copyright (c) Microsoft. All rights reserved.

import React, { Component } from 'react';
import {
  Flyout,
  FlyoutHeader,
  FlyoutTitle,
  FlyoutCloseBtn,
  FlyoutContent
} from 'components/shared';

import Section from './flyoutSection';

import './settings.css';

export class Settings extends Component {
  render() {
    const { onClose } = this.props;
    return (
      <Flyout>
        <FlyoutHeader>
          <FlyoutTitle>Settings</FlyoutTitle>
          <FlyoutCloseBtn onClick={onClose} />
        </FlyoutHeader>
        <FlyoutContent className="settings-workflow-container">

          <Section.Container>
            <Section.Header>Simulation Data</Section.Header>
            <Section.Content>Current theme</Section.Content>
          </Section.Container>

          <Section.Container collapsable={false}>
            <Section.Header>Simulation Data</Section.Header>
            <Section.Content>Coming soon...</Section.Content>
          </Section.Container>

        </FlyoutContent>
      </Flyout>
    );
  }
}
