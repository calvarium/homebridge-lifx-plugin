export default class Bulb{

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
    minorVersion : 1,
  };

  constructor(
    private readonly light,
    private readonly Settings){
  }

  public async Init(callback, error){
    this.setFirmwareVersion(err => error(err));
    this.setHardwareInformation(() => {
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
    return this.HardwareInfo.productFeatures.color;
  }

  public hasKelvin(){
    //checking if range in light object is available
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
    this.States.color.hue = 0;
    this.States.color.saturation = 0;
    this.States.color.kelvin = Bulb.getKelvin(value);
    this.update(this.States, this.Settings.ColorDuration);
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
    let tmp = Math.round((640) / (10500/ this.States.color.kelvin));
    if (tmp > 500) {
      tmp = 500;
    } else if (tmp < 140) {
      tmp = 140;
    }
    return tmp;
  }

  static getColorTemperatur(kelvin){
    let tmp = Math.round((640) / (10500/kelvin));
    if (tmp > 500) {
      tmp = 500;
    } else if (tmp < 140) {
      tmp = 140;
    }
    return tmp;
  }

  static getKelvin(value){
    return 10500 - Math.round((10500) / (640/value));
  }



}

