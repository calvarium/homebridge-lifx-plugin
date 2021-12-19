import IPlatformAccessoryBulb from './IPlatformAccessoryBulb';
import PlatformAccessoryBulb from './PlatformAccessoryBulb';

export class platformAccessoryFactory implements IPlatformAccessoryFactory{

  public static getPlatformAccessory(light): IPlatformAccessoryBulb{
    return new PlatformAccessoryBulb());
  }

}