// Copyright (c) Microsoft. All rights reserved.

import React from 'react';
import { Btn } from 'components/shared';
import { svgs, LinkedComponent } from 'utilities';
import Flyout from 'components/shared/flyout';
import DeviceGroupForm from './views/deviceGroupForm';
import DeviceGroups from './views/deviceGroups';

import './manageDeviceGroups.css';

const Section = Flyout.Section;

export class ManageDeviceGroups extends LinkedComponent {

  constructor(props) {
    super(props);

    this.state = {
      addNewFilter: false,
      editDeviceGroup: false,
      selectedDeviceGroup: {}
    };
  }

  toggleNewFilter = () => this.setState({ addNewFilter: !this.state.addNewFilter });

  closeForm = () => this.setState({
    addNewFilter: false,
    editDeviceGroup: false
  })

  onEditDeviceGroup = selectedDeviceGroup => e => {
    this.setState({
      editDeviceGroup: true,
      selectedDeviceGroup
    })
  }

  render() {
    const { onClose, t, deviceGroups = [] } = this.props;

    return (
      <Flyout.Container>
        <Flyout.Header>
          <Flyout.Title>{t('deviceGroupsFlyout.title')}</Flyout.Title>
          <Flyout.CloseBtn onClick={onClose} />
        </Flyout.Header>
        <Flyout.Content className="manage-filters-flyout-container">
          {
            this.state.addNewFilter || this.state.editDeviceGroup
              ? <DeviceGroupForm {...this.props} cancel={this.closeForm} {...this.state} />
              : <Section.Container>
                  <Btn className="add-btn" svg={svgs.plus} onClick={this.toggleNewFilter}>{t('deviceGroupsFlyout.create')}</Btn>
                  { deviceGroups.length > 0 && <DeviceGroups {...this.props} onEditDeviceGroup={this.onEditDeviceGroup}/> }
                </Section.Container>
          }
        </Flyout.Content>
      </Flyout.Container>
    );
  }
}
