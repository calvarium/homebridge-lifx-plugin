<p align="center">
   <a href="https://github.com/calvarium/homebridge-lifx-plugin"><img alt="homebridge-lifx-plugin" src="https://user-images.githubusercontent.com/94163719/145686236-4d930c87-aedd-40a3-a4c4-2d64ee0c5904.png" width="200px"></a>
</p>
<span align="center">

# homebridge-lifx-plugin

[![verified-by-homebridge](https://img.shields.io/badge/homebridge-verified-blueviolet?style=flat-square)](https://github.com/homebridge/homebridge/wiki/Verified-Plugins)

[![npm](https://img.shields.io/npm/dw/homebridge-lifx-plugin?logo=npm&style=flat-square)](https://www.npmjs.com/package/homebridge-lifx-plugin)
[![npm](https://img.shields.io/npm/dt/homebridge-lifx-plugin?label=total&logo=npm&style=flat-square)](https://www.npmjs.com/package/homebridge-lifx-plugin)
[![npm](https://img.shields.io/npm/v/homebridge-lifx-plugin?color=brightgreen&label=version&logo=npm&style=flat-square)](https://www.npmjs.com/package/homebridge-lifx-plugin)

![GitHub code size in bytes](https://img.shields.io/github/languages/code-size/calvarium/homebridge-lifx-plugin?color=brightgreen&logo=GitHub&style=flat-square)
[![GitHub last commit](https://img.shields.io/github/last-commit/calvarium/homebridge-lifx-plugin?logo=github&style=flat-square)](https://github.com/calvarium/homebridge-lifx-plugin)

LIFX plugin for [Homebridge](https://github.com/homebridge/homebridge).

A plugin that automatically adds Lifx bulbs on the network to the Homebridge instead of tediously registering the lights individually via homekit.

Individual lights can be added manually.


This plugin will be updated regularly in the future, because I see it as a small heart task and use it personally. 

The reason to create this plugin was the use of several published already existing lifx-plugins for homebridge and the anger struggeling with lifx and homekit. Unfortunately, all the plugins I tested slowed down homebridge so I couldn't access my devices from outside my network.
This plugin should fix that problem and add some extra functionality

Also, lights that were not connected to the power were marked as "not responding".
This plugin automatically sets the status of these lights to offline as soon as the light can no longer be reached.

I appreciate anyone who would like to use my plugin and welcome comments of any kind.

Of course, sometimes no error is left out, so forgive me if you might have problems and stay tuned. Updates will follow as soon as possible!


## 🚀 Quick Start

 ### 1. **Installation**

```console
npm i homebridge-lifx-plugin
```

or use the awesome [Homebridge Config Ui X plugin](https://www.npmjs.com/package/homebridge-config-ui-x)

### 2. **Setup**

All settings can be configured in the [Homebridge Plugin Settings GUI](https://github.com/oznu/homebridge-config-ui-x/wiki/Developers:-Plugin-Settings-GUI)

<img width="800" alt="Bildschirmfoto 2021-12-16 um 09 21 54" src="https://user-images.githubusercontent.com/94163719/146334682-bcaa0f20-1f83-4e7f-9bd9-337204249196.png">

Options can be found under [Settings](#⚙️-settings)

### 3. **Enjoy** 😎💡

All Lifx bulbs accessible on the network will be added to your homekit automatically.
So go outside, configure your lights, create scenes and automations. Enjoy your life🧘

## ⚙️ Settings
### General

|Title                  |Name    |Type       |Value         |Default|Description
|-----------------------|--------|-----------|--------------|---|-----------
|Platform Name          |`name`  |`string`   |any   |"Lifx Plugin"|Display name of the platform, to be seen in the log
|Enable Auto Discover   |`autoDiscover`  |`boolean`  |true/false    |true|Discovers bulbs by broadcasting
|Duration               |`duration`  |`integer`  |0...∞       |0|Time to fade on/off in milliseconds
|Brightness Duration    |`brightnessDuration`  |`integer`  |0...∞       |300|Time to fade in milliseconds for changing brightness
|Color Duration         |`colorDuration`  |`integer`  |0...∞       |300|Time to fade in milliseconds for changing color

### Bulbs

Adding bulbs separately is useful for networks where broadcasting is not possible or if you do not want the plugin to discover all bulbs automatically.
If autoDiscover is enabled the separately added bulbs are not added a second time.

|Title                  |Name    |Type       |Value         |Default|Description
|-----------------------|--------|-----------|--------------|---|-----------
|Name          |`name`  |`string`   |any   ||Name for recognizing the bulb
|Address   |`address`  |`string`  |ip    ||IP address of the bulb to be added separately
### Excludes

You can now create exceptions for your bulbs that should not be registered with broadcasting

|Title                  |Name    |Type       |Value         |Default|Description
|-----------------------|--------|-----------|--------------|---|-----------
|Name          |`name`  |`string`   |any   ||Name for recognizing the bulb
|Address   |`address`  |`string`  |ip    ||IP address of the bulb to be excluded
|ID   |`id`  |`string`  |id    ||Serial number of the bulb to be excluded

### Advenced Settings

|Title                  |Name    |Type       |Value         |Default|Description
|-----------------------|--------|-----------|--------------|---|-----------
|Broadcast Address          |`broadcast`  |`string`   |ip|255.255.255.255   |Broadcast address of your network to detect bulbs automatically
|Offline Tolerance   |`lightOfflineTolerance`  |`integer`  |1...∞    |3|A light is offline if not seen for the given amount of discoveries
|Handler Timeout               |`messageHandlerTimeout`  |`integer`  |100...∞       |45000|In ms, if not answer in time an error is provided to get methods
|Resend Packet Delay    |`resendPacketDelay`  |`integer`  |50...∞       |150|Delay between packages if light did not receive a packet
|Resend Packet Max Times         |`resendMaxTimes`  |`integer`  |0...∞       |3|Resend packages x times if light did not receive a packet

### Example Configuration

#### 💡 Autodiscover

```json
{
   "name": "Lifx",
   "duration": 0,
   "brightnessDuration": 300,
   "colorDuration": 300,
   "broadcast": "255.255.255.255",
   "lightOfflineTolerance": 3,
   "messageHandlerTimeout": 45000,
   "resendPacketDelay": 150,
   "resendMaxTimes": 3,
   "debug": false,
   "autoDiscover": true,
   "platform": "LifxPlugin"
}
```

#### 🔧 Manually Added Bulbs

```json
{
   "name": "Lifx",
   "duration": 500,
   "brightnessDuration": 500,
   "colorDuration": 500,
   "broadcast": "255.255.255.255",
   "lightOfflineTolerance": 3,
   "messageHandlerTimeout": 45000,
   "resendPacketDelay": 150,
   "resendMaxTimes": 3,
   "debug": false,
   "autoDiscover": false,
   "bulbs": [
         {
            "address": "192.168.178.20"
         }
   ],
   "platform": "LifxPlugin"
}
```

## 📝 ToDo

- [x] Dim settings for brightness, color and On/Off
- [x] Add lights individually
- [x] Listen for new states of the light
- [x] Mark bulb as offline if it could not be reached
- [x] Enable adding bulbs manually when autoDiscover is active
- [x] Added exclusions for bulbs to not be registered (thanks to [L0T8](https://github.com/L0T8))
- [ ] Separate dim settings for brightness, color and On/Off
- [ ] Configure lights individually
- [ ] Accessories will show as "no response" until plugin has successfully initialised

## ✅ Officialy supported on

- LIFX A19 Night Vision
- LIFX A19
- LIFX Z
- LIFX Mini White
- LIFX BR30 Night Vision
- LIFX Original
- LIFX Colour 1000
- LIFX GU10
- LIFX Mini Day & Dusk

All other bulbs could be supported, but without guarantee.
If you find something that does not fit yet open an issue, I will take care of it

## 🔍 Tested on

- LIFX A19 Night Vision
- LIFX A19
- LIFX Z
- LIFX Mini White           (by [7RDR7](https://github.com/7RDR7))
- LIFX BR30 Night Vision    (by [7RDR7](https://github.com/7RDR7))
- LIFX Original             (by [andyvirus](https://github.com/andyvirus))
- LIFX Colour 1000          (by [andyvirus](https://github.com/andyvirus))
- LIFX GU10                 (by [L0T8](https://github.com/L0T8))
- LIFX Mini Day & Dusk      (by [L0T8](https://github.com/L0T8))