<p align="center">
   <a href="https://github.com/calvarium/homebridge-lifx-plugin"><img alt="homebridge-lifx-plugin" src="https://user-images.githubusercontent.com/94163719/145686236-4d930c87-aedd-40a3-a4c4-2d64ee0c5904.png" width="200px"></a>
</p>
<span align="center">

# homebridge-lifx-plugin

[![npm](https://img.shields.io/npm/dw/homebridge-lifx-plugin?logo=npm&style=flat-square)](https://www.npmjs.com/package/homebridge-lifx-plugin)
[![npm](https://img.shields.io/npm/dt/homebridge-lifx-plugin?label=total&logo=npm&style=flat-square)](https://www.npmjs.com/package/homebridge-lifx-plugin)
[![npm](https://img.shields.io/npm/v/homebridge-lifx-plugin?color=brightgreen&label=version&logo=npm&style=flat-square)](https://www.npmjs.com/package/homebridge-lifx-plugin)

![GitHub code size in bytes](https://img.shields.io/github/languages/code-size/calvarium/homebridge-lifx-plugin?color=brightgreen&logo=GitHub&style=flat-square)
[![GitHub last commit](https://img.shields.io/github/last-commit/calvarium/homebridge-lifx-plugin?logo=github&style=flat-square)](https://github.com/calvarium/homebridge-lifx-plugin)

LIFX plugin for [Homebridge](https://github.com/homebridge/homebridge).

Ein Plugin, das Lifx-birnen im Netzwerk automatisch zur Homebridge hinzufügt, anstatt die Lichter mühselig einzeln über homekit zu registrieren

Einzelne Leuchten können manuell hinzugefügt werden.


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

<img width="798" alt="Settings" src="https://user-images.githubusercontent.com/94163719/145215775-1d31068f-3971-4f31-8e73-c51de18d0464.png">

Options can be found under [Settings](#⚙️-settings)

### 3. **Enjoy** 😎💡

All Lifx bulbs accessible on the network will be added to your homekit automatically.
So go outside, configure your lights, create scenes and automations. Enjoy your life🧘

## ⚙️ Settings
### General

|Title                  |Name    |Type       |Value         |Default|Description
|-----------------------|--------|-----------|--------------|---|-----------
|Platform Name          |`name`  |`string`   |any   |"Lifx Plugin"|Display name of the platform, to be seen in the log
|Enable Auto Discover   |`autoDiscover`  |`boolean`  |true/false    |true|Discovers bulbs by broadcasting. If disabled, bulbs can be added manually
|Duration               |`duration`  |`integer`  |0...∞       |0|Time to fade on/off in milliseconds
|Brightness Duration    |`brightnessDuration`  |`integer`  |0...∞       |300|Time to fade in milliseconds for changing brightness
|Color Duration         |`colorDuration`  |`integer`  |0...∞       |300|Time to fade in milliseconds for changing color

### Advenced Settings

|Title                  |Name    |Type       |Value         |Default|Description
|-----------------------|--------|-----------|--------------|---|-----------
|Broadcast Address          |`broadcast`  |`string`   |ip|255.255.255.255   |Broadcast address of your network to detect bulbs automatically
|Offline Tolerance   |`lightOfflineTolerance`  |`integer`  |1...∞    |3|A light is offline if not seen for the given amount of discoveries
|Handler Timeout               |`messageHandlerTimeout`  |`integer`  |100...∞       |45000|In ms, if not answer in time an error is provided to get methods
|Resend Packet Delay    |`resendPacketDelay`  |`integer`  |50...∞       |150|Delay between packages if light did not receive a packet (for setting methods with callback)
|Resend Packet Max Times         |`resendMaxTimes`  |`integer`  |0...∞       |3|Resend packages x times if light did not receive a packet (for setting methods with callback)

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
- [ ] Separate dim settings for brightness, color and On/Off
- [ ] Configure lights individually
