import { Service, PlatformAccessory, CharacteristicValue } from 'homebridge';

import { LifxHomebridgePlatform } from './platform';

import Bulb from './bulb';

export class LifxPlatformAccessory {
  private service: Service;
  private informationService : Service;

  private watcher;

  private States = {
    color: { hue: 120, saturation: 0, brightness: 100, kelvin: 8994 },
    power: 0,
    label: '',
  };

  private Settings = {
    Duration: 0,
    BrightnessDuration: 300,
    ColorDuration: 300,
  };

  private HardwareInfo = {
    vendorName : 'LIFX',
    productName : 'Unknown',
    productFeatures : { color: false, infrared: false, multizone: false },
  };

  private FirmwareVersion = {
    majorVersion : 0,
    minorVersion : 1,
  };

  public UUID : string;

  constructor(
    private readonly platform: LifxHomebridgePlatform,
    public readonly Accessory: PlatformAccessory,
    private readonly light,
    settings,
  ) {

    this.UUID = Accessory.UUID;

    this.Settings = settings;

    this.service = this.Accessory.getService(this.platform.Service.Lightbulb) || this.Accessory.addService(this.platform.Service.Lightbulb);
    this.informationService = this.Accessory.getService(this.platform.Service.AccessoryInformation)!;

    this.setFirmwareVersion();
    this.setHardwareInformation(() => {
      this.updateStates(() => {
        this.service.setCharacteristic(this.platform.Characteristic.Name, this.States.label);

        this.service.getCharacteristic(this.platform.Characteristic.On)
          .onSet(this.setOn.bind(this)) ;

        this.service.getCharacteristic(this.platform.Characteristic.Brightness)
          .onSet(this.setBrightness.bind(this));

        if (this.hasKelvin()) {
          this.service.getCharacteristic(this.platform.Characteristic.ColorTemperature)
            .onSet(this.setKelvin.bind(this));
        } else{
          this.service.removeCharacteristic(this.service.getCharacteristic(this.platform.Characteristic.ColorTemperature));
        }

        if (this.HardwareInfo.productFeatures.color) {
          this.service.getCharacteristic(this.platform.Characteristic.Hue)
            .onSet(this.setHue.bind(this));

          this.service.getCharacteristic(this.platform.Characteristic.Saturation)
            .onSet(this.setSaturation.bind(this));
        } else{
          this.service.removeCharacteristic(this.service.getCharacteristic(this.platform.Characteristic.Hue));
          this.service.removeCharacteristic(this.service.getCharacteristic(this.platform.Characteristic.Saturation));
        }

        this.resetWatcher();

      });
    });

  }

  hasKelvin(){
    return this.HardwareInfo.productName !== 'LIFX Mini White';
  }

  async setOn(value: CharacteristicValue) {
    this.resetWatcher();
    this.States.power = value as number;

    if (this.States.power > 0) {
      this.light.on(this.Settings.Duration);
    } else{
      this.light.off(this.Settings.Duration);
    }

    this.platform.log.debug('Set Characteristic On ->', value);
  }

  async setBrightness(value: CharacteristicValue) {
    this.resetWatcher();
    this.States.color.brightness = value as number;
    Bulb.update(this.light, this.States, this.Settings.BrightnessDuration);

    this.platform.log.debug('Set Characteristic Brightness -> ', value);
  }

  async setHue(value: CharacteristicValue){
    this.resetWatcher();
    this.States.color.hue = value as number;
    Bulb.update(this.light, this.States, this.Settings.ColorDuration);

    this.platform.log.debug('Set Characteristic Hue -> ', value);
  }

  async setSaturation(value: CharacteristicValue){
    this.resetWatcher();
    this.States.color.saturation = value as number;
    Bulb.update(this.light, this.States, this.Settings.ColorDuration);

    this.platform.log.debug('Set Characteristic Saturation -> ', value);
  }

  async setKelvin(value: CharacteristicValue){
    this.resetWatcher();
    this.States.color.hue = 0;
    this.States.color.saturation = 0;
    this.States.color.kelvin = Bulb.getKelvin(value as number);

    Bulb.update(this.light, this.States, this.Settings.ColorDuration);
    this.platform.log.debug('Set Characteristic Kelvin -> ', value);
  }

  handleError(err, msg){
    this.platform.log.debug(msg+'\nBulb ' + this.States.label + ' throughs error', err);
    // if you need to return an error to show the device as "Not Responding" in the Home app:
    // throw new this.platform.api.hap.HapStatusError(this.platform.api.hap.HAPStatus.SERVICE_COMMUNICATION_FAILURE);
  }

  async watchState(){
    this.watcher = setInterval(() => {
      this.updateStates(() => {
        this.platform.log.debug('updated', this.States);
      });
    }, 5000);
  }

  async resetWatcher(){
    if (this.watcher) {
      clearInterval(this.watcher);
    }
    this.watchState();
  }

  async updateStates(callback){
    Bulb.getStates(this.light, (state) => {
      if (state !== null) {
        this.setStates(state);
        callback();
      }else{
        this.setPower(0);
      }
    }, (err) => {
      this.setPower(0);
      this.handleError(err, 'updateStates');
    });
  }

  async setStates(state){
    this.States = state;
    this.updateLightbuldCharacteristics();
  }

  async updateLightbuldCharacteristics(){
    this.updateOn();

    if (this.HardwareInfo.productFeatures.color) {
      this.updateHue();
      this.updateSaturation();
    }

    this.updateBrightness();

    if (this.hasKelvin()) {
      this.updateKelvin ();
    }
  }

  async setHardwareInformation(callback){
    Bulb.getHardwareInformation(this.light, (info) => {
      this.HardwareInfo = info;
      this.setAccessoryInformationCharacteristics(this.HardwareInfo);
      callback();
    }, (err) => this.handleError(err, 'setHardwareInformation'));
  }

  async setAccessoryInformationCharacteristics(info){
    this.setAccessoryInformationCharacteristic(this.platform.Characteristic.Manufacturer, info.vendorName);
    this.setAccessoryInformationCharacteristic(this.platform.Characteristic.Model, info.productName);
    this.setAccessoryInformationCharacteristic(this.platform.Characteristic.SerialNumber, this.light.id);
  }

  async setFirmwareVersion(){
    Bulb.getFirmwareVersion(this.light, (version) => {
      this.FirmwareVersion = version;
      this.setFirmwareRevision(this.FirmwareVersion.majorVersion + '.' + this.FirmwareVersion.minorVersion);
    }, (err) => this.handleError(err, 'setFirmwareVersion'));
  }

  async setFirmwareRevision(version){
    this.setAccessoryInformationCharacteristic(this.platform.Characteristic.FirmwareRevision, version);
  }

  async setAccessoryInformationCharacteristic(characteristic, value : CharacteristicValue){
    this.informationService.setCharacteristic(characteristic, value);
  }

  async setLightbulbCharacteristic(characteristic, value : CharacteristicValue){
    this.service.setCharacteristic(characteristic, value);
  }

  async updateLightbulbCharacteristic(characteristic, value : CharacteristicValue){
    this.service.updateCharacteristic(characteristic, value);
  }

  updateOn(){
    this.updateLightbulbCharacteristic(this.platform.Characteristic.On, this.States.power);
  }

  updateHue(){
    this.updateLightbulbCharacteristic(this.platform.Characteristic.Hue, this.States.color.hue);
  }

  updateSaturation(){
    this.updateLightbulbCharacteristic(this.platform.Characteristic.Saturation, this.States.color.saturation);
  }

  updateBrightness(){
    this.updateLightbulbCharacteristic(this.platform.Characteristic.Brightness, this.States.color.brightness);
  }

  updateKelvin (){
    this.updateLightbulbCharacteristic(this.platform.Characteristic.ColorTemperature, Bulb.getColorTemperatur(this.States.color.kelvin));
  }

  setPower(value){
    this.States.power = value;
    this.updateOn();
  }

  public GetName(){
    return this.States.label;
  }

}
