// Copyright (c) Microsoft. All rights reserved.

import React, { Component } from 'react';
import { Route, Redirect, Switch } from 'react-router-dom';
import { NavLink } from 'react-router-dom';

import './maintenance.css';

const Notifications = () => (
  <div><NavLink to={'/maintenance/rule/id-for-rule-473465'}>RuleDetails</NavLink></div>
);
const Jobs = () => (
  <div><NavLink to={'/maintenance/job/id-for-job-954728'}>JobDetails</NavLink></div>
);
const RuleDetails = ({ match: { params: { id } } }) => (
  <div>
    <NavLink to={'/maintenance/notifications'}>Back</NavLink>
    Rule Details for {id}
  </div>
);
const JobDetails = ({ match: { params: { id } } }) => (
  <div>
    <NavLink to={'/maintenance/jobs'}>Back</NavLink>
    Job Details for {id}
  </div>
);

const View = ({ match: { params: { path } } }) => (
  <div className="maintenance-container">
    <NavLink to={'/maintenance/notifications'}>Notifications</NavLink> | <NavLink to={'/maintenance/jobs'}>Jobs</NavLink>
    <h2>{path}</h2>
    <Switch>
      <Route exact path={'/maintenance/notifications'} component={Notifications} />
      <Route exact path={'/maintenance/jobs'} component={Jobs} />
    </Switch>
  </div>
);

export class Maintenance extends Component {
  render () {
    return (
      <div className="maintenance-container">
        <Switch>
          <Route exact path={'/maintenance/:path(notifications|jobs)'} component={View} />
          <Route exact path={'/maintenance/rule/:id'} component={RuleDetails} />
          <Route exact path={'/maintenance/job/:id'} component={JobDetails} />
          <Redirect to="/maintenance/notifications" />
        </Switch>
      </div>
    );
  }
}
