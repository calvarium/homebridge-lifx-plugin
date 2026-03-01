import { Service, PlatformAccessory, CharacteristicValue } from 'homebridge';

import { LifxHomebridgePlatform } from './platform';

import Switch from './switch';

export class LifxPlatformSwitchAccessory {
  private service: Service;
  private watcher;

  private device;
  private readonly index;
  private isOnline = false;  // offline until Init() succeeds

  public readonly lightId: string;

  constructor(
    private readonly platform: LifxHomebridgePlatform,
    public readonly Accessory: PlatformAccessory,
    private readonly light,
    private readonly relayIndex,
    private readonly name,
    settings,
  ) {

    this.device = new Switch(light, name, settings);
    this.index = relayIndex;
    this.lightId = light.id;

    this.service = this.Accessory.getService(this.platform.Service.Switch) || this.Accessory.addService(this.platform.Service.Switch);

    // Register onGet immediately so HomeKit gets SERVICE_COMMUNICATION_FAILURE
    // even before Init() completes or if the device is unreachable at startup.
    this.service.getCharacteristic(this.platform.Characteristic.On)
      .onGet(this.getOn.bind(this));

    this.device.Init((reachable)=>{

      this.setHardwareCharacteristics();
      this.setSoftwareCharacteristics();
      this.bindFunctions();

      if (reachable) {
        this.isOnline = true;
        this.resetWatcher();
      } else {
        // Device did not respond during Init – mark as not responding immediately.
        this.markNotResponding();
        this.platform.log.info('Device unreachable at startup:', this.getName());
      }

    }, (error) => this.handleError(error));

  }

  setHardwareCharacteristics(){
    this.Accessory.getService(this.platform.Service.AccessoryInformation)!
      .setCharacteristic(this.platform.Characteristic.Manufacturer, this.device.getVendorName())
      .setCharacteristic(this.platform.Characteristic.Model, this.device.getProductName())
      .setCharacteristic(this.platform.Characteristic.SerialNumber, this.device.getSerialNumber());
  }

  setSoftwareCharacteristics(){
    const version = this.device.getVersion();

    if (version !== '0.0' && this.platform.config.updates) {
      const service = this.Accessory.getService(this.platform.Service.AccessoryInformation)!;
      service.addCharacteristic(this.platform.Characteristic.FirmwareRevision);
      service.setCharacteristic(this.platform.Characteristic.FirmwareRevision, version);
    }
    this.service.setCharacteristic(this.platform.Characteristic.Name, this.getName());
  }

  bindFunctions(){
    this.service.getCharacteristic(this.platform.Characteristic.On)
      .onGet(this.getOn.bind(this))
      .onSet(this.setOn.bind(this));
  }

  async getOn(): Promise<CharacteristicValue> {
    if (!this.isOnline) {
      throw new this.platform.api.hap.HapStatusError(
        this.platform.api.hap.HAPStatus.SERVICE_COMMUNICATION_FAILURE,
      );
    }
    return this.device.getOn(this.index);
  }

  async setOn(value: CharacteristicValue) {
    this.resetWatcher();
    this.device.setOn(this.index, value);
    this.platform.log.debug('Set Characteristic On ->', [value, this.index]);
  }

  handleError(err){
    this.platform.log.warn('Bulb ' + this.getName() + ' throughs error', err);
  }

  private markNotResponding() {
    const hapError = new this.platform.api.hap.HapStatusError(
      this.platform.api.hap.HAPStatus.SERVICE_COMMUNICATION_FAILURE,
    );
    this.service.getCharacteristic(this.platform.Characteristic.On)
      .updateValue(hapError);
  }

  setOffline(){
    if (!this.isOnline) {
      return;
    }
    this.isOnline = false;
    clearInterval(this.watcher);
    this.watcher = undefined;
    this.markNotResponding();
    this.platform.log.info('Device offline:', this.getName());
  }

  setOnline(){
    if (this.isOnline) {
      return;
    }
    this.isOnline = true;
    this.resetWatcher();
    this.platform.log.info('Device online:', this.getName());
  }

  async watchState(){
    this.watcher = setInterval(() => {
      this.device.updateStates(this.index, (reachable) => {
        if (!reachable) {
          this.setOffline();
          return;
        }
        this.updateLightbuldCharacteristics();
        this.platform.log.debug('updated', this.getName());
      });
    }, 5000);
  }

  async resetWatcher(){
    if (this.watcher) {
      clearInterval(this.watcher);
    }
    this.watchState();
  }

  async updateLightbuldCharacteristics(){
    if (!this.isOnline) {
      return;
    }
    this.updateOn();
  }

  updateOn() {
    this.service.updateCharacteristic(this.platform.Characteristic.On, this.device.getOn(this.index));
  }

  getName() {
    return this.device.getName() + ' ' + (this.index + 1);
  }
}