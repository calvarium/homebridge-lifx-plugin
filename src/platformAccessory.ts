import { Service, PlatformAccessory, CharacteristicValue } from 'homebridge';

import { LifxHomebridgePlatform } from './platform';

import Bulb from './bulb';

export class LifxPlatformAccessory {
  private service: Service;
  private watcher;

  private bulb;

  constructor(
    private readonly platform: LifxHomebridgePlatform,
    public readonly Accessory: PlatformAccessory,
    private readonly light,
    settings,
  ) {

    this.bulb = new Bulb(light, settings);

    this.service = this.Accessory.getService(this.platform.Service.Lightbulb) || this.Accessory.addService(this.platform.Service.Lightbulb);

    this.bulb.Init(()=>{

      this.setHardwareCharacteristics();
      this.bindFunctions();
      this.resetWatcher();

    }, (error) => this.handleError(error));

  }

  setHardwareCharacteristics(){
    this.Accessory.getService(this.platform.Service.AccessoryInformation)!
      .setCharacteristic(this.platform.Characteristic.FirmwareRevision, this.bulb.getVersion())
      .setCharacteristic(this.platform.Characteristic.Manufacturer, this.bulb.getVendorName())
      .setCharacteristic(this.platform.Characteristic.Model, this.bulb.getProductName())
      .setCharacteristic(this.platform.Characteristic.SerialNumber, this.bulb.getSerialNumber());
    this.service.setCharacteristic(this.platform.Characteristic.Name, this.bulb.getName());
  }

  bindFunctions(){
    this.service.getCharacteristic(this.platform.Characteristic.On)
      .onSet(this.setOn.bind(this)) ;

    this.service.getCharacteristic(this.platform.Characteristic.Brightness)
      .onSet(this.setBrightness.bind(this));

    if (this.bulb.hasKelvin()) {
      this.service.getCharacteristic(this.platform.Characteristic.ColorTemperature)
        .onSet(this.setKelvin.bind(this));
    } else{
      this.service.removeCharacteristic(this.service.getCharacteristic(this.platform.Characteristic.ColorTemperature));
    }

    if (this.bulb.hasColors()) {
      this.service.getCharacteristic(this.platform.Characteristic.Hue)
        .onSet(this.setHue.bind(this));

      this.service.getCharacteristic(this.platform.Characteristic.Saturation)
        .onSet(this.setSaturation.bind(this));
    } else{
      this.service.removeCharacteristic(this.service.getCharacteristic(this.platform.Characteristic.Hue));
      this.service.removeCharacteristic(this.service.getCharacteristic(this.platform.Characteristic.Saturation));
    }
  }

  async setOn(value: CharacteristicValue) {
    this.resetWatcher();
    this.bulb.setOn(value);
    this.platform.log.debug('Set Characteristic On ->', value);
  }

  async setBrightness(value: CharacteristicValue) {
    this.resetWatcher();
    this.bulb.setBrightness(value);
    this.platform.log.debug('Set Characteristic Brightness -> ', value);
  }

  async setHue(value: CharacteristicValue){
    this.resetWatcher();
    this.bulb.setHue(value);
    this.platform.log.debug('Set Characteristic Hue -> ', value);
  }

  async setSaturation(value: CharacteristicValue){
    this.resetWatcher();
    this.bulb.setSaturation(value);
    this.platform.log.debug('Set Characteristic Saturation -> ', value);
  }

  async setKelvin(value: CharacteristicValue){
    this.resetWatcher();
    this.bulb.setKelvin(value);
    this.platform.log.debug('Set Characteristic Kelvin -> ', value);
  }

  handleError(err){
    this.platform.log.warn('Bulb ' + this.bulb.getName() + ' throughs error', err);
    // if you need to return an error to show the device as "Not Responding" in the Home app:
    // throw new this.platform.api.hap.HapStatusError(this.platform.api.hap.HAPStatus.SERVICE_COMMUNICATION_FAILURE);
  }

  async watchState(){
    this.watcher = setInterval(() => {
      this.bulb.updateStates(() => {
        this.updateLightbuldCharacteristics();
        this.platform.log.debug('updated', this.bulb.getName());
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

    if (this.bulb.hasColors()) {
      this.updateHue();
      this.updateSaturation();
    }

    this.updateBrightness();

    if (this.bulb.hasKelvin()) {
      this.updateKelvin ();
    }
  }

  updateOn(){
    this.service.updateCharacteristic(this.platform.Characteristic.On, this.bulb.getOn());
  }

  updateHue(){
    this.service.updateCharacteristic(this.platform.Characteristic.Hue, this.bulb.getHue());
  }

  updateSaturation(){
    this.service.updateCharacteristic(this.platform.Characteristic.Saturation, this.bulb.getSaturation());
  }

  updateBrightness(){
    this.service.updateCharacteristic(this.platform.Characteristic.Brightness, this.bulb.getBrightness());
  }

  updateKelvin (){
    this.service.updateCharacteristic(this.platform.Characteristic.ColorTemperature, this.bulb.getColorTemperatur());
  }

}
