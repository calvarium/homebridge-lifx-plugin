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
  public readonly cachedAccessories: PlatformAccessory[] = [];
  public readonly accessories: LifxPlatformAccessory[] = [];

  constructor(
    public readonly log: Logger,
    public readonly config: PlatformConfig,
    public readonly api: API,
  ) {

    this.log.debug('Finished initializing platform:', this.config.name);

    // When this event is fired it means Homebridge has restored all cached accessories from disk.
    // Dynamic Platform plugins should only register new accessories after this event was fired,
    // in order to ensure they weren't added to homebridge already. This event can also be used
    // to start discovery of new accessories.
    this.api.on('didFinishLaunching', () => {
      log.debug('Executed didFinishLaunching callback');
      // run the method to discover / register your devices as accessories
      this.discoverDevices();
    });
  }

  /**
   * This function is invoked when homebridge restores cached accessories from disk at startup.
   * It should be used to setup event handlers for characteristics and update respective values.
   */
  configureAccessory(accessory: PlatformAccessory) {
    this.log.debug('Loading accessory from cache:', accessory.displayName);

    // add the restored accessory to the accessories cache so we can track if it has already been registered
    this.cachedAccessories.push(accessory);

  }

  discoverDevices() {

    this.log.debug('Register eventhandlers');
    this.lifxClient.on('light-new', (light) => {
      light.getLabel((err, value) => {
        this.log.debug('Light detected:', value);
        if (value) {
          this.handleLight(light, value);
        }
      });
    });

    this.lifxClient.on('light-online', (light) => {
      const accessory = this.findAccessory(light);
      if (accessory) {
        accessory.SetOnline();
        this.log.debug('Light online', accessory.GetName());
      } else {
        this.log.debug('Light online, but not found in list');
      }
    });

    this.lifxClient.on('light-offline', (light) => {
      const accessory = this.findAccessory(light);
      if (accessory) {
        accessory.SetOffline();
        this.log.debug('Light offline', accessory.GetName());
      } else {
        this.log.debug('Light offline, but not found in list');
      }
    });

    this.log.debug('Initialising lan client');
    this.lifxClient.init({
      broadcast:              this.config.broadcast,
      lightOfflineTolerance:  this.config.lightOfflineTolerance,
      messageHandlerTimeout:  this.config.messageHandlerTimeout,
      resendPacketDelay:      this.config.resendPacketDelay,
      resendMaxTimes:         this.config.resendMaxTimes,
      debug:                  this.config.debug,
    });

  }

  findAccessory(light){
    return this.accessories.find(accessory => accessory.UUID === this.getUuid(light));
  }

  getUuid(light){
    return this.api.hap.uuid.generate(light.id);
  }

  findCachedAccessory(light){
    return this.cachedAccessories.find(accessory => accessory.UUID === this.getUuid(light));
  }

  registerNewAccessory(light, name){
    const accessory = new this.api.platformAccessory(name, this.getUuid(light));
    this.api.registerPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [accessory]);
    return accessory;
  }

  hookAccessory(accessory, light){
    this.accessories.push(new LifxPlatformAccessory(this, accessory, light, {
      Duration : this.config.duration,
      BrightnessDuration: this.config.brightnessDuration,
      ColorDuration: this.config.colorDuration,
    }));
  }

  handleLight(light, name){
    // see if an accessory with the same uuid has already been registered and restored from
    // the cached devices we stored in the `configureAccessory` method above
    let accessory = this.findCachedAccessory(light);

    if (accessory) {
      // the accessory already exists
      this.log.debug('Restoring existing accessory from cache:', name);

    } else {
      // the accessory does not yet exist, so we need to create it
      this.log.debug('Adding new accessory:', name);
      accessory = this.registerNewAccessory(light, name);
    }
    this.log.debug('Hooking light to accessory', name);
    this.hookAccessory(accessory, light);
  }

}
