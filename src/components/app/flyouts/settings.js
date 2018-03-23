// Copyright (c) Microsoft. All rights reserved.

import React, { Component } from 'react';
import {
  Flyout,
  FlyoutHeader,
  FlyoutTitle,
  FlyoutCloseBtn,
  FlyoutContent
} from 'components/shared';

import {
  FlyoutSection,
  FlyoutSectionHeader,
  FlyoutSectionContent
} from './flyoutSection';

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
        <FlyoutContent className="setting-workflow-container">
          <FlyoutSection>
            <FlyoutSectionHeader>
            Simulation Data
            </FlyoutSectionHeader>
            <FlyoutSectionContent>
              Current theme
            </FlyoutSectionContent>
          </FlyoutSection>

          <FlyoutSection collapsable={false}>
            <FlyoutSectionHeader>
              Simulation Data
            </FlyoutSectionHeader>
            <FlyoutSectionContent>
              Coming soon...
            </FlyoutSectionContent>
          </FlyoutSection>
        </FlyoutContent>
      </Flyout>
    );
  }
}
