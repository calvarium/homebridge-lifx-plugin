import { Service, PlatformAccessory, CharacteristicValue } from 'homebridge';

import { LifxHomebridgePlatform } from './platform';
import IPlatformAccessoryBulb from './IPlatformAccessoryBulb';
import IBulb from './IBulb';
import Bulb from './bulb';

export default class PlatformAccessoryBulb implements IPlatformAccessoryBulb{

  private bulb : IBulb;
  private service: Service;

  private watcher;

  constructor(
        private readonly platform: LifxHomebridgePlatform,
        public readonly Accessory: PlatformAccessory,
        private readonly light,
        settings,
  ) {
    this.bulb = new Bulb(light, settings);

    this.service = this.Accessory.getService(this.platform.Service.Lightbulb) || this.Accessory.addService(this.platform.Service.Lightbulb);


    this.bulb.Initialise(()=>{

      this.setHardwareCharacteristics();
      this.bindCharacteristics();
      this.resetWatcher();

    }, (error) => this.handleError(error));

  }

  private setHardwareCharacteristics(){
    this.Accessory.getService(this.platform.Service.AccessoryInformation)!
      .setCharacteristic(this.platform.Characteristic.FirmwareRevision, this.bulb.getVersion())
      .setCharacteristic(this.platform.Characteristic.Manufacturer, this.bulb.getVendorName())
      .setCharacteristic(this.platform.Characteristic.Model, this.bulb.getProductName())
      .setCharacteristic(this.platform.Characteristic.SerialNumber, this.bulb.getSerialNumber());
    this.service.setCharacteristic(this.platform.Characteristic.Name, this.bulb.getName());
  }

  private bindCharacteristics(){
    this.service.getCharacteristic(this.platform.Characteristic.On)
      .onSet(this.setOn.bind(this)) ;

    this.service.getCharacteristic(this.platform.Characteristic.Brightness)
      .onSet(this.setBrightness.bind(this));

    this.service.removeCharacteristic(this.service.getCharacteristic(this.platform.Characteristic.ColorTemperature));
    this.service.removeCharacteristic(this.service.getCharacteristic(this.platform.Characteristic.Hue));
    this.service.removeCharacteristic(this.service.getCharacteristic(this.platform.Characteristic.Saturation));

  }

  private updateCharacteristics(){
    this.updateOn();
    this.updateBrightness();
  }

  async setOn(value: CharacteristicValue) {
    this.resetWatcher();
    this.bulb.setOn(value as number);
    this.platform.log.debug('Set Characteristic On ->', value);
  }

  async setBrightness(value: CharacteristicValue) {
    this.resetWatcher();
    this.bulb.setBrightness(value as number);
    this.platform.log.debug('Set Characteristic Brightness -> ', value);
  }


  updateOn(){
    this.service.updateCharacteristic(this.platform.Characteristic.On, this.bulb.getOn());
  }

  updateBrightness(){
    this.service.updateCharacteristic(this.platform.Characteristic.Brightness, this.bulb.getBrightness());
  }

  async watchState(){
    this.watcher = setInterval(() => {
      this.bulb.pollStates(() => {
        this.updateCharacteristics();
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

  handleError(err){
    this.platform.log.debug('Bulb ' + this.bulb.getName() + ' throughs error', err);
  }

}