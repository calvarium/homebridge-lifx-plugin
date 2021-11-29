export default class Bulb{
  static KELVIN_SCALE = 0.05555555555555555;

  static getStates(light, callback, errorFallback){
    // this.bulbWrapper(light.getState, callback, errorFallback);
    light.getState((err, value) => {
      if (err) {
        errorFallback(err);
      }
      callback(value);
    });
  }

  static getHardwareInformation(light, callback, errorFallback){
    // this.bulbWrapper(light.getHardwareVersion, callback, errorFallback);
    light.getHardwareVersion((err, value) => {
      if (err) {
        errorFallback(err);
      }
      callback(value);
    });
  }

  static getFirmwareVersion(light, callback, errorFallback){
    // this.bulbWrapper(light.getFirmwareVersion, callback, errorFallback);
    light.getFirmwareVersion((err, value) => {
      if (err) {
        errorFallback(err);
      }
      callback(value);
    });
  }

  static update(light, state, duration){
    light.color(state.color.hue, state.color.saturation, state.color.brightness, state.color.kelvin, duration);
  }

  private static bulbWrapper(func, callback, errorFallback){
    func((err, value) => {
      if (err) {
        errorFallback(err);
      }
      callback(value);
    });
  }

  static getColorTemperatur(kelvin){
    return Math.round((640) / (11500/kelvin));
  }

  static getKelvin(value){
    return 10500 - Math.round((11500) / (640/value));
  }

}

