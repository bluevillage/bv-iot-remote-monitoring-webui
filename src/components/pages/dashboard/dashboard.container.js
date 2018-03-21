// Copyright (c) Microsoft. All rights reserved.

import { connect } from 'react-redux';
import { translate } from 'react-i18next';
import { epics as rulesEpics } from 'store/reducers/rulesReducer';

import { Dashboard } from './dashboard';

// Wrap the dispatch method
const mapDispatchToProps = dispatch => ({
  fetchRules: () => dispatch(rulesEpics.actions.fetchRules())
})

export const DashboardContainer = translate()(connect(null, mapDispatchToProps)(Dashboard));
