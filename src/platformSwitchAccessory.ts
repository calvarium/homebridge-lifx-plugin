import { Service, PlatformAccessory, CharacteristicValue } from 'homebridge';

import { LifxHomebridgePlatform } from './platform';

import Switch from './switch';

export class LifxPlatformSwitchAccessory {
  private service: Service;
  private watcher;

  private device;
  private readonly index;

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

    this.service = this.Accessory.getService(this.platform.Service.Switch) || this.Accessory.addService(this.platform.Service.Switch);


    this.device.Init(()=>{

      this.setHardwareCharacteristics();
      this.setSoftwareCharacteristics();
      this.bindFunctions();
      this.resetWatcher();

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
      .onSet(this.setOn.bind(this)) ;
  }

  async setOn(value: CharacteristicValue) {
    this.resetWatcher();
    this.device.setOn(this.index, value);
    this.platform.log.debug('Set Characteristic On ->', [value, this.index]);
  }

  handleError(err){
    this.platform.log.warn('Bulb ' + this.getName() + ' throughs error', err);
    // if you need to return an error to show the device as "Not Responding" in the Home app:
    // throw new this.platform.api.hap.HapStatusError(this.platform.api.hap.HAPStatus.SERVICE_COMMUNICATION_FAILURE);
  }

  async watchState(){
    this.watcher = setInterval(() => {
      this.device.updateStates(this.index, () => {
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
    this.updateOn();
  }

  updateOn() {
    this.service.updateCharacteristic(this.platform.Characteristic.On, this.device.getOn(this.index));
  }

  getName() {
    return this.device.getName() + ' ' + (this.index + 1);
  }
}
