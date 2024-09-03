## Workflows of the `install` subcommand

**Syntax**
```sh
npx @nightwatch/mobile-helper android install [flags|cliConfigs]
```

### 1. Install an APK

Run the below command to install an APK on a real device or an AVD:
```sh
npx @nightwatch/mobile-helper android install --app [cliConfigs]
```

**Configs**

| Config                         | Description                                                    |
| ------------------------------ | -------------------------------------------------------------- |
| --deviceId \| -s <device_id>   | Id of the device to install the APK                            |
| --path \| -p <path_to_apk>     | Path to the APK file relative to the current working directory |

### 2. Create a new Android Virtual Device

Run the below command to create a new AVD:
```sh
npx @nightwatch/mobile-helper android install --avd
```