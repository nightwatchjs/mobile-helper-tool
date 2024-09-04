# @nightwatch/mobile-helper

Official Nightwatch helper-tool to easily setup all the requirements needed to get started with mobile testing using Nightwatch.js.

## Usage

- [Mobile web testing](./docs/mobile-web-testing.md)
- [Mobile app testing](./docs/mobile-app-testing.md)
- [Setup Android SDK]()
- [Do more with Android SDK](#do-more-with-android-sdk)
- [Run Android SDK binaries](#run-android-sdk-binaries)

### Setup Android SDK

Run the below command to download all the required Android SDKs needed to get the Android Emulator setup and running with Android v11:


```sh
npx @nightwatch/mobile-helper android --standalone
```

### Do more with Android SDK

The tool supports various Android SDK workflows, accessible through the following subcommands:

1. [connect](./docs/subcommands/connect.md)
2. [list](./docs/subcommands/list.md)
3. [install](./docs/subcommands/install.md)
4. [uninstall](./docs/subcommands/uninstall.md)

#### Syntax

The following syntax is used for executing subcommands:

```bash
npx @nightwatch/mobile-helper android <subcommand> [flags|cliConfigs]
```

#### 1. Connect a real device or launch an AVD

```sh
npx @nightwatch/mobile-helper android connect [flags]
```


| Flag       | Description                           |
| ---------- | ------------------------------------- |
| --wireless | Connect a real device wirelessly      |

#### 2. List all the connected devices and installed AVDs

```sh
npx @nightwatch/mobile-helper android list [flags]
```

| Flag       | Description                                            |
| ---------- | ------------------------------------------------------ |
| --device   | Show a list of all the connected real devices and AVDs |
| --avd      | Show a list of all the currently installed AVDs        |


#### 3. Install an APK or create a new AVD

```sh
npx @nightwatch/mobile-helper android install [flags]
```

| Flag  | Description                                |
| ----- | ------------------------------------------ |
| --app | Install an APK on a real device or an AVD  |
| --avd | Create a new AVD                           |


#### 4. Uninstall an app or delete an AVD

```sh
npx @nightwatch/mobile-helper android uninstall [flags]
```

| Flag  | Description                                    |
| ----- | ---------------------------------------------- |
| --app | Uninstall an app from a real device or an AVD  |
| --avd | Delete an AVD                                  |

### Run Android SDK binaries

Easily run Android SDK binaries without needing to locate them manually by using the `mobile-helper` CLI.

**Syntax**

```sh
npx @nightwatch/mobile-helper android.<binary_name> [args]
```

Currenty supported binaries: `adb`, `avdmanager`, `sdkmanager` and `emulator`.

Check the following docs to know more about the usage of the above mentioned binaries: 
- [Using emulator from CLI](./docs/use-emulator-from-command-line.md)
