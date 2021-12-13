import { Service, PlatformAccessory, CharacteristicValue } from 'homebridge';

import { LifxHomebridgePlatform } from './platform';

import Bulb from './bulb';

/**
 * Platform Accessory
 * An instance of this class is created for each accessory your platform registers
 * Each accessory may expose multiple services of different service types.
 */

export class LifxPlatformAccessory {
  private service: Service;
  private informationService : Service;

  private online = false;

  private watcher;

  /**
   * These are just used to create a working example
   * You should implement your own code to track the state of your accessory
   */
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

    this.online = true;

    // get the LightBulb service if it exists, otherwise create a new LightBulb service
    // you can create multiple services for each accessory
    this.service = this.Accessory.getService(this.platform.Service.Lightbulb) || this.Accessory.addService(this.platform.Service.Lightbulb);
    this.informationService = this.Accessory.getService(this.platform.Service.AccessoryInformation)!;

    // set accessory information
    this.setFirmwareVersion();
    this.setHardwareInformation(() => {
      this.updateStates(() => {
        // set the service name, this is what is displayed as the default name on the Home app
        // in this example we are using the name we stored in the `accessory.context` in the `discoverDevices` method.
        this.service.setCharacteristic(this.platform.Characteristic.Name, this.States.label);

        // each service must implement at-minimum the "required characteristics" for the given service type
        // see https://developers.homebridge.io/#/service/Lightbulb

        // register handlers for the On/Off Characteristic
        this.service.getCharacteristic(this.platform.Characteristic.On)
          .onSet(this.setOn.bind(this)) ;        // SET - bind to the `setOn` method below

        //diabled through many home kit calls || manually updating charactaristic on
        // .onGet(this.getOn.bind(this));               // GET - bind to the `getOn` method below

        // register handlers for the Brightness Characteristic
        this.service.getCharacteristic(this.platform.Characteristic.Brightness)
          .onSet(this.setBrightness.bind(this));       // SET - bind to the 'setBrightness` method below

        this.service.getCharacteristic(this.platform.Characteristic.ColorTemperature)
          .onSet(this.setKelvin.bind(this));       // SET - bind to the 'setBrightness` method below

        this.service.removeCharacteristic(this.service.getCharacteristic(this.platform.Characteristic.Hue));
        this.service.removeCharacteristic(this.service.getCharacteristic(this.platform.Characteristic.Saturation));

        this.HardwareInfo.productFeatures.color = false;

        if (this.HardwareInfo.productFeatures.color) {

          this.service.getCharacteristic(this.platform.Characteristic.Hue)
            .onSet(this.setHue.bind(this));       // SET - bind to the 'setBrightness` method below

          this.service.getCharacteristic(this.platform.Characteristic.Saturation)
            .onSet(this.setSaturation.bind(this));       // SET - bind to the 'setBrightness` method below
        }

        this.resetWatcher();

      });
    });

  }

  /**
   * Handle the "GET" requests from HomeKit
   * These are sent when HomeKit wants to know the current state of the accessory, for example, checking if a Light bulb is on.
   *
   * GET requests should return as fast as possbile. A long delay here will result in
   * HomeKit being unresponsive and a bad user experience in general.
   *
   * If your device takes time to respond you should update the status of your device
   * asynchronously instead using the `updateCharacteristic` method instead.

   * @example
   * this.service.updateCharacteristic(this.platform.Characteristic.On, true)
   */
  async getOn(): Promise<CharacteristicValue> {
    const isOn = this.States.power;
    this.platform.log.debug('Get Characteristic On ->', isOn);
    return isOn;
  }

  async setOn(value: CharacteristicValue) {
    this.resetWatcher();
    if (!this.online) {
      this.updateLightbuldCharacteristics();
      //place Timeout right here
    }else {
      this.States.power = value as number;

      if (this.States.power > 0) {
        this.light.on(this.Settings.Duration);
      } else{
        this.light.off(this.Settings.Duration);
      }

      this.platform.log.debug('Set Characteristic On ->', value);
    }
  }

  async setBrightness(value: CharacteristicValue) {
    this.resetWatcher();
    if (!this.online) {
      this.updateLightbuldCharacteristics();
      //place Timeout right here
    }else {
      this.States.color.brightness = value as number;
      Bulb.update(this.light, this.States, this.Settings.BrightnessDuration);
      // this.updateLightbuldCharacteristics();
      this.platform.log.debug('Set Characteristic Brightness -> ', value);
    }
  }

  async setHue(value: CharacteristicValue){
    this.resetWatcher();
    if (!this.online) {
      this.updateLightbuldCharacteristics();
      //place Timeout right here
    }else {
      this.States.color.hue = value as number;
      Bulb.update(this.light, this.States, this.Settings.ColorDuration);
      // this.updateLightbuldCharacteristics();
      this.platform.log.debug('Set Characteristic Hue -> ', value);
    }
  }

  async setSaturation(value: CharacteristicValue){
    this.resetWatcher();
    if (!this.online) {
      this.updateLightbuldCharacteristics();
      //place Timeout right here
    }else {
      this.States.color.saturation = value as number;
      Bulb.update(this.light, this.States, this.Settings.ColorDuration);
      // this.updateLightbuldCharacteristics();
      this.platform.log.debug('Set Characteristic Saturation -> ', value);
    }
  }

  async setKelvin(value: CharacteristicValue){
    this.resetWatcher();
    if (!this.online) {
      this.updateLightbuldCharacteristics();
      //place Timeout right here
    }else {
      this.States.color.hue = 0;
      this.States.color.saturation = 0;
      this.States.color.kelvin = Bulb.getKelvin(value as number);
      // this.updateLightbuldCharacteristics();
      Bulb.update(this.light, this.States, this.Settings.ColorDuration);
      this.platform.log.debug('Set Characteristic Kelvin -> ', value);
    }
  }

  handleError(err){
    this.platform.log.debug('Bulb throughs error', err);
    this.SetOffline();
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
        this.SetOnline();
        this.setStates(state);
        callback();
      }else{
        this.SetOffline();
      }
    }, (err) => this.handleError(err));
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
    this.updateKelvin ();
  }

  async setHardwareInformation(callback){
    Bulb.getHardwareInformation(this.light, (info) => {
      this.HardwareInfo = info;
      this.setAccessoryInformationCharacteristics(this.HardwareInfo);
      callback();
    }, (err) => this.handleError(err));
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
    }, (err) => this.handleError(err));
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

  public async SetOnline(){
    this.online = true;
    this.setPower(1);
  }

  public async SetOffline(){
    this.online = false;
    this.setPower(0);
  }

  public GetName(){
    return this.States.label;
  }

}
