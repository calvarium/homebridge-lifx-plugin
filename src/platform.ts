import { API, DynamicPlatformPlugin, Logger, PlatformAccessory, PlatformConfig, Service, Characteristic } from 'homebridge';

import { PLATFORM_NAME, PLUGIN_NAME } from './settings';
import { LifxPlatformAccessory } from './platformAccessory';

import Lifx from 'lifx-lan-client';

export class LifxHomebridgePlatform implements DynamicPlatformPlugin {
  public readonly Service: typeof Service = this.api.hap.Service;
  public readonly Characteristic: typeof Characteristic = this.api.hap.Characteristic;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private lifxClient: any = new Lifx.Client();
  private bulbs;

  public readonly cachedAccessories: PlatformAccessory[] = [];
  public readonly accessories: LifxPlatformAccessory[] = [];

  constructor(
    public readonly log: Logger,
    public readonly config: PlatformConfig,
    public readonly api: API,
  ) {

    this.log.debug('Finished initializing platform:', this.config.name);

    if (this.config.bulbs) {
      this.bulbs = this.config.bulbs.map(bulb => bulb.address);
    }

    this.api.on('didFinishLaunching', () => {
      log.debug('Executed didFinishLaunching callback');
      this.discoverDevices();
    });
  }

  configureAccessory(accessory: PlatformAccessory) {
    this.log.debug('Loading accessory from cache:', accessory.displayName);

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

    if (!this.config.autoDiscover) {
      this.config.broadcast = '0.0.0.0';
    }

    this.log.debug('Initialising lan client');
    this.lifxClient.init({
      broadcast:              this.config.broadcast,
      lightOfflineTolerance:  this.config.lightOfflineTolerance,
      messageHandlerTimeout:  this.config.messageHandlerTimeout,
      resendPacketDelay:      this.config.resendPacketDelay,
      resendMaxTimes:         this.config.resendMaxTimes,
      debug:                  this.config.debug,
      lights:                 this.bulbs || [],
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
    let accessory = this.findCachedAccessory(light);

    if (accessory) {
      this.log.debug('Restoring existing accessory from cache:', name);

    } else {
      this.log.debug('Adding new accessory:', name);
      accessory = this.registerNewAccessory(light, name);
    }
    this.log.debug('Hooking light to accessory', name);
    this.hookAccessory(accessory, light);
  }

}
