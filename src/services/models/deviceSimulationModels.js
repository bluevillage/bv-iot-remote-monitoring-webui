// Copyright (c) Microsoft. All rights reserved.

import { reshape } from 'utilities';

export const toSimulationStatusModel = (response = {}) => reshape(response, {
  'enabled': 'enabled',
  'etag': 'etag'
});
export const toDeviceModelSelectOptions = (response = {}) => (response.items || [])
  .map((deviceModel = {}) =>reshape(deviceModel, {
    'id': 'value',
    'name': 'name'
}));

export const toDeviceSimulationsModel = (response = {}) => reshape(response, {
  'etag': 'etag',
  'id': 'id',
  'enabled': 'enabled',
  'deviceModels': 'deviceModels'
});
