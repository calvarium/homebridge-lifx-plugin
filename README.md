<p align="center">
   <a href="https://github.com/calvarium/homebridge-lifx-plugin"><img alt="homebridge-lifx-plugin" src="homebridge-lifx-icon.png" width="600px"></a>
</p>
<span align="center">

# homebridge-lifx-plugin

[![npm](https://img.shields.io/npm/dw/homebridge-lifx-plugin?logo=npm&style=flat-square)](https://www.npmjs.com/package/homebridge-lifx-plugin)
[![npm](https://img.shields.io/npm/dt/homebridge-lifx-plugin?label=total&logo=npm&style=flat-square)](https://www.npmjs.com/package/homebridge-lifx-plugin)
[![npm](https://img.shields.io/npm/v/homebridge-lifx-plugin?color=brightgreen&label=version&logo=npm&style=flat-square)](https://www.npmjs.com/package/homebridge-lifx-plugin)
[![GitHub last commit](https://img.shields.io/github/last-commit/calvarium/homebridge-lifx-plugin?logo=github&style=flat-square)](https://github.com/calvarium/homebridge-lifx-plugin)

LIFX plugin for [Homebridge](https://github.com/homebridge/homebridge).

A plugin that adds lifx-lights in the network automatically to the homebridge, also single lights can be added manually. 

This plugin will be updated regularly in the future, because I see it as a small heart task and use it personally. 

The reason to create this plugin was the use of several published already existing lifx-plugins for homebridge. Unfortunately, all the plugins I tested slowed down homebridge so I couldn't access my devices from outside my network.
This plugin should fix that problem and add some extra functionality

Also, lights that were not connected to the power were marked as "not responding".
This plugin automatically sets the status of these lights to offline as soon as the light can no longer be reached.

I appreciate anyone who would like to use my plugin and welcome comments of any kind.

Of course, sometimes no error is left out, so forgive me if you might have problems and stay tuned. Updates will follow as soon as possible!


## Installation

```console
npm i homebridge-lifx-plugin
```

or use the awesome [Homebridge Config Ui X plugin](https://www.npmjs.com/package/homebridge-config-ui-x)

## ToDo

- [x] Dim settings for brightness, color and On/Off
- [x] Add lights individually
- [x] Listen for new states of the light
- [x] Mark bulb as offline if it could not be reached
- [ ] Separate dim settings for brightness, color and On/Off
- [ ] Configure lights individually