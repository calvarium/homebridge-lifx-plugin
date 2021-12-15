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

