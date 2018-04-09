// Copyright (c) Microsoft. All rights reserved.

import { Observable } from 'rxjs';

import Config from 'app.config';
import { HttpClient } from './httpClient';
import { toSimulationStatusModel } from './models';
import { toDeviceModelSelectOptions, toDeviceSimulationsModel } from './models';

const ENDPOINT = Config.serviceUrls.deviceSimulation;
const SIMULATION_ID = Config.simulationId;

/**
 * Contains methods for calling the device simulation microservice
 */
export class DeviceSimulationService {

  /**
   * Toggles simulation status
   */
  static toggleSimulation(Etag, Enabled) {
    return HttpClient.patch(`${ENDPOINT}simulations/${SIMULATION_ID}`, { Etag, Enabled })
      .map(toSimulationStatusModel);
  }

  /**
   * Get the list of running simulated devices
   */
  static getSimulatedDevices() {
    return HttpClient.get(`${ENDPOINT}simulations/${SIMULATION_ID}`)
      .map(toSimulationStatusModel);
  }


  /** Returns a list of devicemodels */
  static getDeviceModelSelectOptions() {
    return HttpClient.get(`${ENDPOINT}devicemodels`)
      .map(toDeviceModelSelectOptions);
  }

  static getDeviceSimulations() {
    return HttpClient.get(`${ENDPOINT}simulations/1`)
      .map(toDeviceSimulationsModel);
  }

  static updateDeviceSimulations(simulations) {
    return simulations;
    //    return HttpClient.put(`${ENDPOINT}simulations/1`, simulations)
    //      .map(toDeviceSimulationsModel)
  }

  static incrementDeviceSimulations(simId, increment) {
    this.getDeviceSimulations()
      .flatMap(simulations => {
        Observable.from(simulations.deviceModels)
          .reduce(
            (acc, { id, count }) => ({
              ...acc, [id]: { id, count: ((acc[id] || {}).count || 0) + count }
            }),
            { [simId]: { id: simId, count: increment } }
          ).map(o => console.log(o))
      })
      .flatMap(request => this.updateDeviceSimulations(request));

    /*
    const simulations = this.getDeviceSimulations()
      .flatMap(simulations => {
        simulations.deviceModels
          .reduce(
            (acc, { id, count }) => ({
              ...acc, [id]: { id, count: ((acc[id] || {}).count || 0) + count }
            }),
            { [simId]: { id: simId, count: increment } }
          )
      })
      .flatMap(this.updateDeviceSimulations(simulations));
      */
  }
}
