// Copyright (c) Microsoft. All rights reserved.

import { Component } from 'react';
import { isFunc } from 'utilities';

export class ProtectedImpl extends Component {
  userHasPermission() {
    const { permission, userPermissions } = this.props;
    return (userPermissions.indexOf(permission) > -1);
  }

  render() {
    const hasPermission = this.userHasPermission();
    if (isFunc(this.props.children)) {
      return this.props.children(hasPermission);
    }
    return hasPermission ? this.props.children : null;
  }
};
