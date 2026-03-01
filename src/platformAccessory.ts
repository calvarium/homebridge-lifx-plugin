import { Service, PlatformAccessory, CharacteristicValue } from 'homebridge';
import { LifxHomebridgePlatform } from './platform';
import Bulb from './bulb';

export class LifxPlatformAccessory {
  private service: Service;
  private watcher;
  private adaptiveLightingController;
  private bulb;
  private isOnline = false;  // offline until Init() succeeds

  public readonly lightId: string;

  constructor(
    private readonly platform: LifxHomebridgePlatform,
    public readonly Accessory: PlatformAccessory,
    private readonly light,
    settings,
  ) {

    this.lightId = light.id;
    this.bulb = new Bulb(light, settings);
    this.service = this.Accessory.getService(this.platform.Service.Lightbulb) || this.Accessory.addService(this.platform.Service.Lightbulb);

    // Register onGet immediately so HomeKit gets SERVICE_COMMUNICATION_FAILURE
    // even before Init() completes or if the bulb is unreachable at startup.
    this.service.getCharacteristic(this.platform.Characteristic.On)
      .onGet(this.getOn.bind(this));

    this.bulb.Init((reachable)=>{

      this.setHardwareCharacteristics();
      this.setSoftwareCharacteristics();
      this.bindFunctions();

      if (reachable) {
        this.isOnline = true;
        this.resetWatcher();
      } else {
        // Bulb did not respond during Init – mark as not responding immediately.
        this.markNotResponding();
        this.platform.log.info('Device unreachable at startup:', this.bulb.getName());
      }

    }, (error) => this.handleError(error));

  }

  setHardwareCharacteristics(){
    this.Accessory.getService(this.platform.Service.AccessoryInformation)!
      .setCharacteristic(this.platform.Characteristic.Manufacturer, this.bulb.getVendorName() ?? 'LIFX')
      .setCharacteristic(this.platform.Characteristic.Model, this.bulb.getProductName() ?? 'Unknown')
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
      .onGet(this.getOn.bind(this))
      .onSet(this.setOn.bind(this));
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

  async getOn(): Promise<CharacteristicValue> {
    if (!this.isOnline) {
      throw new this.platform.api.hap.HapStatusError(
        this.platform.api.hap.HAPStatus.SERVICE_COMMUNICATION_FAILURE,
      );
    }
    return this.bulb.getOn();
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
  }

  /**
   * Marks the accessory as offline and notifies HomeKit immediately.
   * updateValue(Error) only sets the statusCode but does NOT emit a change
   * event, so HomeKit never gets notified proactively. We therefore first
   * force a change event (by flipping the value) so HomeKit re-polls, and
   * the onGet handler will then return SERVICE_COMMUNICATION_FAILURE.
   */
  private markNotResponding() {
    // Set the HAP statusCode to SERVICE_COMMUNICATION_FAILURE (-70402).
    // The next time HomeKit polls this characteristic (Home app opened, Siri,
    // automation etc.) the onGet handler will throw a HapStatusError and
    // HomeKit will show "No Response". HAP event notifications only carry
    // values, not error codes, so there is no way to proactively push this.
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
    this.platform.log.info('Device offline:', this.bulb.getName());
  }

  setOnline(){
    if (this.isOnline) {
      return;
    }
    this.isOnline = true;
    this.resetWatcher();
    this.platform.log.info('Device online:', this.bulb.getName());
  }

  async watchState(){
    this.watcher = setInterval(() => {
      this.bulb.updateStates((reachable) => {
        if (!reachable) {
          // Lampe antwortet nicht mehr – sofort offline schalten.
          // setOffline() stoppt auch diesen Watcher.
          this.setOffline();
          return;
        }
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
    // Do not push any value updates while offline – doing so would reset the
    // HAP statusCode to SUCCESS and make HomeKit show "Off" instead of
    // "Not Responding".
    if (!this.isOnline) {
      return;
    }

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
