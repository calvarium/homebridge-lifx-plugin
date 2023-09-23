import { API, DynamicPlatformPlugin, Logger, PlatformAccessory, PlatformConfig, Service, Characteristic, AdaptiveLightingController,
} from 'homebridge';

import { PLATFORM_NAME, PLUGIN_NAME } from './settings';
import { LifxPlatformAccessory } from './platformAccessory';
import { LifxPlatformSwitchAccessory } from './platformSwitchAccessory';

import Lifx from 'lifx-lan-client';

export class LifxHomebridgePlatform implements DynamicPlatformPlugin {
  public readonly Service: typeof Service = this.api.hap.Service;
  public readonly Characteristic: typeof Characteristic = this.api.hap.Characteristic;
  public readonly AdaptiveLightingController: typeof AdaptiveLightingController = this.api.hap.AdaptiveLightingController;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private lifxClient: any = new Lifx.Client();
  private bulbs;
  private switches;

  public readonly cachedAccessories: PlatformAccessory[] = [];
  public readonly accessories: LifxPlatformAccessory[] = [];
  public readonly switchAccessories: LifxPlatformSwitchAccessory[] = [];

  constructor(
    public readonly log: Logger,
    public readonly config: PlatformConfig,
    public readonly api: API,
  ) {

    this.log.debug('Finished initializing platform:', this.config.name);

    if (this.config.bulbs) {
      this.bulbs = this.config.bulbs.map(bulb => bulb.address);
    }

    if (this.config.switches) {
      this.switches = this.config.switches.map(device => device.address);
    }

    this.api.on('didFinishLaunching', () => {
      log.debug('Executed didFinishLaunching callback');
      this.discoverDevices();
    });
  }

  configureAccessory(accessory: PlatformAccessory) {
    this.log.debug('Loading accessory from cache:', accessory.displayName);

    const service = accessory.getService(this.Service.AccessoryInformation);
    service!.removeCharacteristic(service!.getCharacteristic(this.Characteristic.FirmwareRevision));

    this.cachedAccessories.push(accessory);

  }

  discoverDevices() {

    this.log.debug('Register eventhandlers');
    this.lifxClient.on('light-new', (light) => {
      if (this.config.excludes) {
        if (this.config.excludes.some(x => x.id === light.id || x.address === light.address)) {
          this.removeAccessory(light);
          this.log.info('Device removed');
          return;
        }
      }

      light.getLabel((err, value) => {
        this.log.debug('Light detected:', value);
        if (value) {
          light.hasRelays((hasRelays) => {
            if (hasRelays) {
              for (let i = 0; i < 4; i++) {
                this.handleSwitch(light, value + ' ' + (i + 1), i);
              }
            } else {
              this.handleLight(light, value);
            }
          });
        }
      });
    });

    if (!this.config.autoDiscover) {
      this.config.broadcast = '0.0.0.0';
    }

    this.log.debug('Initialising lan client');
    try {
      this.lifxClient.init({
        address:                this.config.default,
        broadcast:              this.config.broadcast,
        lightOfflineTolerance:  this.config.lightOfflineTolerance,
        messageHandlerTimeout:  this.config.messageHandlerTimeout,
        resendPacketDelay:      this.config.resendPacketDelay,
        resendMaxTimes:         this.config.resendMaxTimes,
        debug:                  this.config.debug,
        lights:                 (this.bulbs || []).concat(this.switches || []),
      });
    } catch (error) {
      this.log.error('Error initializing listener', error as string);
    }

  }

  //should bulbs be defined here?

  getUuid(light){
    return this.api.hap.uuid.generate(light.id);
  }

  getRelayUuid(light, index){
    return this.api.hap.uuid.generate(index + light.id);
  }

  findCachedAccessory(light){
    return this.cachedAccessories.find(accessory => accessory.UUID === this.getUuid(light));
  }

  findCachedSwitchAccessory(light, index){
    return this.cachedAccessories.find(accessory => accessory.UUID === this.getRelayUuid(light, index));
  }

  registerNewAccessory(light, name){
    const accessory = new this.api.platformAccessory(name, this.getUuid(light));
    this.api.registerPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [accessory]);
    return accessory;
  }

  registerNewSwitchAccessory(light, name, index){
    const uuid = this.getRelayUuid(light, index);
    this.log.info('Device registered: ' + uuid);
    this.log.info('Device name: ' + name);
    const accessory = new this.api.platformAccessory(name, uuid);
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

  hookSwitchAccessory(accessory, light, index, name){
    this.switchAccessories.push(new LifxPlatformSwitchAccessory(this, accessory, light, index, name, {}));
  }

  removeAccessory(light){
    const accessory = this.findCachedAccessory(light);

    if (accessory) {
      this.api.unregisterPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [accessory]);
    }
  }

  removeSwitchAccessory(light, index){
    const accessory = this.findCachedSwitchAccessory(light, index);

    if (accessory) {
      this.api.unregisterPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [accessory]);
    }
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

  handleSwitch(light, name, index){
    let accessory = this.findCachedSwitchAccessory(light, index);

    if (accessory) {
      this.log.debug('Restoring existing accessory from cache:', name);

    } else {
      this.log.debug('Adding new accessory:', name);
      accessory = this.registerNewSwitchAccessory(light, name, index);
    }
    this.log.debug('Hooking light to accessory', name);
    this.hookSwitchAccessory(accessory, light, index, name);
  }

}
