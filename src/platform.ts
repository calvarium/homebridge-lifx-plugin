import { API, DynamicPlatformPlugin, Logger, PlatformAccessory, PlatformConfig, Service, Characteristic } from 'homebridge';

import { PLATFORM_NAME, PLUGIN_NAME } from './settings';
import { LifxPlatformAccessory } from './platformAccessory';

import Lifx from 'lifx-lan-client';

/**
 * HomebridgePlatform
 * This class is the main constructor for your plugin, this is where you should
 * parse the user config and discover/register accessories with Homebridge.
 */
export class LifxHomebridgePlatform implements DynamicPlatformPlugin {
  public readonly Service: typeof Service = this.api.hap.Service;
  public readonly Characteristic: typeof Characteristic = this.api.hap.Characteristic;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private lifxClient: any = new Lifx.Client();

  // this is used to track restored cached accessories
  public readonly accessories: PlatformAccessory[] = [];

  constructor(
    public readonly log: Logger,
    public readonly config: PlatformConfig,
    public readonly api: API,
  ) {

    // Logger.setDebugEnabled(this.config.debug);

    this.log.debug('Finished initializing platform:', this.config.name);


    // When this event is fired it means Homebridge has restored all cached accessories from disk.
    // Dynamic Platform plugins should only register new accessories after this event was fired,
    // in order to ensure they weren't added to homebridge already. This event can also be used
    // to start discovery of new accessories.
    this.api.on('didFinishLaunching', () => {
      log.warn('Executed didFinishLaunching callback');
      // run the method to discover / register your devices as accessories
      this.discoverDevices();
    });
  }

  /**
   * This function is invoked when homebridge restores cached accessories from disk at startup.
   * It should be used to setup event handlers for characteristics and update respective values.
   */
  configureAccessory(accessory: PlatformAccessory) {
    this.log.info('Loading accessory from cache:', accessory.displayName);
    this.setAccessoryCharacteristic(accessory, this.Characteristic.On, false);

    // add the restored accessory to the accessories cache so we can track if it has already been registered
    this.accessories.push(accessory);
  }

  /**
   * This is an example method showing how to register discovered accessories.
   * Accessories must only be registered once, previously created accessories
   * must not be registered again to prevent "duplicate UUID" errors.
   */
  discoverDevices() {

    this.lifxClient.on('light-new', (light) => {
      light.getLabel((err, value) => {
        this.log.info('New light detected:', value);
        if (value) {
          this.registerLight(light, value);
        }
      });
    });

    this.lifxClient.on('light-online', (light) => {
      light.getLabel((err, value) => {
        this.log.info('Light online:', value);
      });
      this.setLightCharacteristic(light, this.Characteristic.On, true);
    });

    this.lifxClient.on('light-offline', (light) => {
      this.log.warn('Light offline', light.id);
      this.setLightCharacteristic(light, this.Characteristic.On, false);
    });

    this.lifxClient.init({
      broadcast:              this.config.broadcast,
      lightOfflineTolerance:  this.config.lightOfflineTolerance,
      messageHandlerTimeout:  this.config.messageHandlerTimeout,
      resendPacketDelay:      this.config.resendPacketDelay,
      resendMaxTimes:         this.config.resendMaxTimes,
      debug:                  this.config.debug,
    });

  }

  setLightCharacteristic(light, characteristic, value){
    this.setAccessoryCharacteristic(this.getAccessory(light), characteristic, value);
  }

  setAccessoryCharacteristic(accessory, characteristic, value){
    if (accessory) {
      // the accessory already exists
      accessory.getService(this.Service.Lightbulb)!
        .setCharacteristic(characteristic, value);
    }
  }

  getAccessory(light){
    return this.findExistingAccessory(this.getUuid(light));
  }

  getUuid(light){
    return this.api.hap.uuid.generate(light.id);
  }

  findExistingAccessory(uuid){
    return this.accessories.find(accessory => accessory.UUID === uuid);
  }

  registerLight(light, name){
    const uuid = this.getUuid(light);
    // see if an accessory with the same uuid has already been registered and restored from
    // the cached devices we stored in the `configureAccessory` method above
    let accessory = this.findExistingAccessory(uuid);

    if (accessory) {
      // the accessory already exists
      this.log.info('Restoring existing accessory from cache:', name);

    } else {
      // the accessory does not yet exist, so we need to create it
      this.log.info('Adding new accessory:', name);

      // create a new accessory
      accessory = new this.api.platformAccessory(name, uuid);

      this.api.registerPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [accessory]);
    }

    new LifxPlatformAccessory(this, accessory, light, {
      Duration : this.config.duration,
      BrightnessDuration: this.config.brightnessDuration,
      ColorDuration: this.config.colorDuration,
    });
  }
}
