import { Service, PlatformAccessory, CharacteristicValue } from 'homebridge';
import { LifxHomebridgePlatform } from './platform';
import Bulb from './bulb';

export class LifxPlatformAccessory {
  private service: Service;
  private watcher;
  private adaptiveLightingController;
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
      this.setSoftwareCharacteristics();
      this.bindFunctions();
      this.resetWatcher();

    }, (error) => this.handleError(error));

  }

  setHardwareCharacteristics(){
    this.Accessory.getService(this.platform.Service.AccessoryInformation)!
      .setCharacteristic(this.platform.Characteristic.Manufacturer, this.bulb.getVendorName())
      .setCharacteristic(this.platform.Characteristic.Model, this.bulb.getProductName())
      .setCharacteristic(this.platform.Characteristic.SerialNumber, this.bulb.getSerialNumber());
  }

  setSoftwareCharacteristics(){
    const version = this.bulb.getVersion();
    if (version !== '0.0' && this.platform.config.updates) {
      const service = this.Accessory.getService(this.platform.Service.AccessoryInformation)!;
      service.addCharacteristic(this.platform.Characteristic.FirmwareRevision);
      service.setCharacteristic(this.platform.Characteristic.FirmwareRevision, version);
    }
    this.service.setCharacteristic(this.platform.Characteristic.Name, this.bulb.getName());
  }

  bindFunctions(){
    this.service.getCharacteristic(this.platform.Characteristic.On)
      .onSet(this.setOn.bind(this)) ;

    this.service.getCharacteristic(this.platform.Characteristic.Brightness)
      .onSet(this.setBrightness.bind(this));

    if (this.bulb.hasKelvin()) {
      this.service.getCharacteristic(this.platform.Characteristic.ColorTemperature)
        .setProps({ minValue: this.bulb.getMinColorTemperatur(), maxValue: this.bulb.getMaxColorTemperatur() })
        .onSet(this.setKelvin.bind(this));

      if (this.adaptiveLightingSupport()) {
        this.adaptiveLightingController = new this.platform.AdaptiveLightingController(this.service);
        this.Accessory.configureController(this.adaptiveLightingController);
      }

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
    this.setValue('On', this.bulb.setOn, this.bulb, value);
  }

  async setBrightness(value: CharacteristicValue) {
    this.setValue('Brightness', this.bulb.setBrightness, this.bulb, value);
  }

  async setHue(value: CharacteristicValue){
    this.setValue('Hue', this.bulb.setHue, this.bulb, value);
  }

  async setSaturation(value: CharacteristicValue){
    this.setValue('Saturation', this.bulb.setSaturation, this.bulb, value);
  }

  async setKelvin(value: CharacteristicValue){
    this.setValue('Color Temperature', this.bulb.setKelvin, this.bulb, value);
    this.updateLightbulbCharacteristics();
  }

  setValue(name, func, obj, value) {
    this.resetWatcher();
    func.call(obj, value);
    this.platform.log.debug(`Set Characteristic ${name} -> `, value);
  }

  handleError(err){
    this.platform.log.warn('Bulb ' + this.bulb.getName() + ' throughs error', err);
    // if you need to return an error to show the device as "Not Responding" in the Home app:
    // throw new this.platform.api.hap.HapStatusError(this.platform.api.hap.HAPStatus.SERVICE_COMMUNICATION_FAILURE);
  }

  async watchState(){
    this.watcher = setInterval(() => {
      this.bulb.updateStates(() => {
        this.updateLightbulbCharacteristics();
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

  async updateLightbulbCharacteristics(){
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

  // Checks homebridge version to see if Adaptive Lighting is supported
  adaptiveLightingSupport() {
    return (this.platform.api.versionGreaterOrEqual && this.platform.api.versionGreaterOrEqual('v1.3.0-beta.23'));
  }

}
