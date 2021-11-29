export default class Bulb{
  static getStates(light, callback, errorFallback){
    light.getState((err, value) => {
      if (err) {
        errorFallback(err);
      }
      callback(value);
    });
  }

  static getHardwareInformation(light, callback, errorFallback){
    light.getHardwareVersion((err, value) => {
      if (err) {
        errorFallback(err);
      }
      callback(value);
    });
  }

  static getFirmwareVersion(light, callback, errorFallback){
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

  static getColorTemperatur(kelvin){
    return Math.round((640) / (11500/kelvin));
  }

  static getKelvin(value){
    return 11500 - Math.round((11500) / (640/value));
  }

}

