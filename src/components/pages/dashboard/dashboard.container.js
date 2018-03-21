// Copyright (c) Microsoft. All rights reserved.

import { connect } from 'react-redux';
import { translate } from 'react-i18next';
import { epics as rulesEpics } from 'store/reducers/rulesReducer';
import { getEntities as getRuleEntities } from 'store/reducers/rulesReducer';
import { getEntities as getDeviceEntities } from 'store/reducers/devicesReducer';

import { Dashboard } from './dashboard';

const mapStateToProps = state => ({
  rules: getRuleEntities(state),
  devices: getDeviceEntities(state)
});

// Wrap the dispatch method
const mapDispatchToProps = dispatch => ({
  fetchRules: () => dispatch(rulesEpics.actions.fetchRules())
})

export const DashboardContainer = translate()(connect(mapStateToProps, mapDispatchToProps)(Dashboard));
