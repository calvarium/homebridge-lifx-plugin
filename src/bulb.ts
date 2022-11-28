/* eslint-disable max-len */
import LIFX from './products.json';
import ProductInfo from './IProductInfo';
export default class Bulb{
  private ProductInfo? : ProductInfo;

  private States = {
    color: { hue: 120, saturation: 0, brightness: 100, kelvin: 8994 },
    power: 0,
    label: '',
  };

  private HardwareInfo = {
    vendorName : 'LIFX',
    productName : 'Unknown',
    productFeatures : { color: false, infrared: false, multizone: false },
  };

  private FirmwareVersion = {
    majorVersion : 0,
    minorVersion : 0,
  };

  constructor(
    private readonly light,
    private readonly Settings){
  }

  public async Init(callback, error){
    this.setFirmwareVersion(err => error(err));
    this.setHardwareInformation(() => {
      this.ProductInfo = Bulb.getProductInfo(this.getProductName() || '');
      this.updateStates(() => {
        callback();
      });
    }, err => error(err));
  }

  public getName(){
    return this.States.label;
  }

  public getVersion(){
    return this.FirmwareVersion.majorVersion + '.' + this.FirmwareVersion.minorVersion;
  }

  public getSerialNumber(){
    return this.light.id;
  }

  public getVendorName(){
    return this.HardwareInfo.vendorName;
  }

  public getProductName(){
    return this.HardwareInfo.productName;
  }

  public hasColors(){
    if (this.ProductInfo) {
      return this.ProductInfo.features.color;
    }
    return this.HardwareInfo.productFeatures.color;
  }

  public hasKelvin(){
    if (this.ProductInfo) {
      if (this.ProductInfo.features.temperature_range) {
        return this.ProductInfo.features.temperature_range.reduce((a, b) => b - a) > 0;
      }
      return false;
    }
    return this.HardwareInfo.productName !== 'LIFX Mini White';
  }

  async updateStates(callback){
    this.getStates((state) => {
      if (state !== null) {
        this.States = state;
      }else{
        this.setPower(0);
      }
      callback();
    }, () => {
      this.setPower(0);
      callback();
    });
  }

  private static getProductInfo(productName) : ProductInfo{
    return LIFX.products.find((x) => x.name === productName) as ProductInfo;
  }

  private setPower(value){
    this.States.power = value;
  }

  async setFirmwareVersion(error){
    this.getFirmwareVersion((version) => {
      this.FirmwareVersion = version;
    }, (err) => error('setFirmwareVersion' + err));
  }

  async setHardwareInformation(callback, error){
    this.getHardwareInformation((info) => {
      this.HardwareInfo = info;
      callback();
    }, (err) => error('setHardwareInformation' + err));
  }

  getStates(callback, errorFallback){
    this.light.getState((err, value) => {
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

  update(state, duration){
    this.light.color(state.color.hue, state.color.saturation, state.color.brightness, state.color.kelvin, duration);
  }

  updateKelvin(state, duration){
    this.light.color(0, 0, state.color.brightness, state.color.kelvin, duration);
  }

  async setOn(value) {
    this.States.power = value;

    if (this.States.power > 0) {
      this.light.on(this.Settings.Duration);
    } else{
      this.light.off(this.Settings.Duration);
    }
  }

  async setBrightness(value) {
    this.States.color.brightness = value;
    this.update(this.States, this.Settings.BrightnessDuration);
  }

  async setHue(value){
    this.States.color.hue = value;
    this.update(this.States, this.Settings.ColorDuration);
  }

  async setSaturation(value){
    this.States.color.saturation = value;
    this.update(this.States, this.Settings.ColorDuration);
  }

  async setKelvin(value: number){
    const color = this.convertHomeKitColorTemperatureToHomeKitColor(value);
    this.States.color.hue = color.h;
    this.States.color.saturation = color.s;

    const range = this.getKelvinRange();
    this.States.color.kelvin = Math.min(Math.max(range.min, Bulb.convertKelvinMirek(value)), range.max);
    this.updateKelvin(this.States, this.Settings.ColorDuration);
  }

  getOn() {
    return this.States.power;
  }

  getBrightness() {
    return this.States.color.brightness;
  }

  getHue(){
    return this.States.color.hue;
  }

  getSaturation(){
    return this.States.color.saturation;
  }

  getColorTemperatur(){
    return Bulb.convertKelvinMirek(this.States.color.kelvin);
  }

  public static convertKelvinMirek(value){
    return 1000000 / value;
  }

  public getKelvinRange(){
    if (this.ProductInfo) {
      if (this.ProductInfo.upgrades.length > 0) {
        for (const key in this.ProductInfo.upgrades) {
          if (Object.prototype.hasOwnProperty.call(this.ProductInfo.upgrades, key)) {
            const element = this.ProductInfo.upgrades[key];
            const asd= element['features'];
            if (asd['temperature_range']) {
              return {
                min: asd['temperature_range'][0],
                max: asd['temperature_range'][1],
              };
            }
          }
        }
      }
      return {
        min: this.ProductInfo?.features.temperature_range[0],
        max: this.ProductInfo?.features.temperature_range[1],
      };
    }
    return {min: 1500, max: 9000};
  }

  private convertHomeKitColorTemperatureToHomeKitColor(value) {
    const dKelvin = 10000 / value;
    const rgb = [
      dKelvin > 66 ? 351.97690566805693 + 0.114206453784165 * (dKelvin - 55) - 40.25366309332127 * Math.log(dKelvin - 55) : 255,
      dKelvin > 66 ? 325.4494125711974 + 0.07943456536662342 * (dKelvin - 50) - 28.0852963507957 * Math.log(dKelvin - 55) : 104.49216199393888 * Math.log(dKelvin - 2) - 0.44596950469579133 * (dKelvin - 2) - 155.25485562709179,
      dKelvin > 66 ? 255 : 115.67994401066147 * Math.log(dKelvin - 10) + 0.8274096064007395 * (dKelvin - 10) - 254.76935184120902,
    ].map(v => Math.max(0, Math.min(255, v)) / 255);
    const max = Math.max(...rgb);
    const min = Math.min(...rgb);
    let h = 0;
    const d = max - min,
      s = max ? 100 * d / max : 0,
      b = 100 * max;

    if (d) {
      switch (max) {
        case rgb[0]: h = (rgb[1] - rgb[2]) / d + (rgb[1] < rgb[2] ? 6 : 0); break;
        case rgb[1]: h = (rgb[2] - rgb[0]) / d + 2; break;
        default: h = (rgb[0] - rgb[1]) / d + 4; break;
      }
      h *= 60;
    }
    return {
      h: Math.round(h),
      s: Math.round(s),
      b: Math.round(b),
    };
  }
}
