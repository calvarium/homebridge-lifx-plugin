/* eslint-disable max-len */
import LIFX from './products.json';
import HardwareInfo from './IHardwareInfo';
export default class Switch{
  private HardwareInfo? : HardwareInfo;

  private States = {
    power: [0, 0, 0, 0],
    label: '',
  };

  private FirmwareVersion = {
    majorVersion : 0,
    minorVersion : 0,
  };

  constructor(
    private readonly light,
    private readonly name,
    private readonly Settings){
  }

  public async Init(callback, error){
    this.setFirmwareVersion(() => {
      this.setHardwareInformation(() => {
        this.States.label = this.name;
        for (let i = 0; i < 4; i++) {
          this.updateStates(i, () => {
            if (i === 3) {
              callback();
            }
          });
        }
      }, err => error(err));
    }, err => error(err));
  }

  public getName(){
    return this.States.label;
  }

  public getVersion(){
    return (this.FirmwareVersion?.majorVersion || 0) + '.' + (this.FirmwareVersion?.minorVersion || 0);
  }

  public getSerialNumber(){
    return this.light.id;
  }

  public getVendorName(){
    return this.HardwareInfo?.vendorName;
  }

  public getProductName(){
    return this.HardwareInfo?.productName;
  }

  async updateStates(index, callback){
    this.getStates(index, (state) => {
      if (state !== null) {
        this.setPower(index, state);
      } else {
        this.setPower(index, 0);
      }
      callback();
    }, () => {
      this.setPower(index, 0);
      callback();
    });

    this.getLabel((label) => {
      if (label !== null) {
        this.States.label = label;
      }
    }, () => {
      this.States.label = this.States.label || '';
    });
  }

  private static getProductInfo(id){
    return LIFX.products.find((x) => x.pid === id);
  }

  private setPower(index, value){
    this.States.power[index] = value;
  }

  async setFirmwareVersion(callback, error){
    this.getFirmwareVersion((version) => {
      this.FirmwareVersion = version;
      callback();
    }, (err) => error('setFirmwareVersion' + err));
  }

  async setHardwareInformation(callback, error){
    this.getHardwareInformation((info) => {
      this.HardwareInfo = info;
      callback();
    }, (err) => error('setHardwareInformation' + err));
  }

  getStates(index, callback, errorFallback){
    this.light.getRelayPower(index, (err, value) => {
      if (err) {
        errorFallback(err);
      }
      callback(value);
    });
  }

  getHardwareInformation(callback, errorFallback){
    this.light.getHardwareVersion((err, value) => {
      if (err) {
        errorFallback(err);
      }
      callback(value);
    });
  }

  getFirmwareVersion(callback, errorFallback){
    this.light.getFirmwareVersion((err, value) => {
      if (err) {
        errorFallback(err);
      }
      callback(value);
    });
  }

  getLabel(callback, errorFallback){
    this.light.getLabel((err, value) => {
      if (err) {
        errorFallback(err);
      }
      callback(value);
    });
  }

  async setOn(index, value) {
    this.States.power[index] = value;

    if (this.States.power[index] > 0) {
      this.light.relayOn(index);
    } else{
      this.light.relayOff(index);
    }
  }

  getOn(index) {
    return this.States.power[index];
  }
}

