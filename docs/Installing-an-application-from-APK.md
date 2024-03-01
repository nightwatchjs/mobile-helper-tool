# Installing an application from APK

## Introduction

This guide will show you how to install an application from an APK file on your Android emulator or Real device.

## Prerequisites

- Setup Android Emulator using [mobile-helper-tool](https://github.com/nightwatchjs/mobile-helper-tool)
- APK file of the application you want to install

### Android Device Bridge (adb)
The whole process is done using `adb` command line tool. So, you need to make sure that `adb` is reachable from your terminal.

`adb` command should be available in your terminal. You can check this by running `adb --version`.

If `adb` is not available, you can add it to your `PATH` environment variable.

You can find `adb` in the `platform-tools` directory of your Android SDK installation. Eg: `/path/to/android/sdk/platform-tools/`.

Add the `platform-tools` directory to your `PATH` environment variable.

**Linux/Mac**:

Add the below command to your `~/.bashrc` or `~./bash_profile` file and restart the terminal.
```bash
export PATH=$PATH:/path/to/android/sdk/platform-tools/
```

**Windows**:

Add the below path to your `PATH` environment variable in the control panel and restart the terminal.
```
\path\to\android\sdk\platform-tools\
```

## Assumptions
- APK path is `/path/to/your/app.apk`
- Application package name is `your.app.package`

## Steps

### Check if Device is running
```bash
adb devices
```

### Install the application
```bash
adb install /path/to/your/app.apk
```

### Verify the installation
```bash
adb shell pm list packages -f your.app.package
```

If the above command does not work, you can use the below command to find the package name.

Note: This command only works with `Linux` and `Mac` terminals.
```bash
adb shell pm list packages -f | grep your.app.package
```

### Overwrite the existing application
If you want to overwrite the existing application with the new APK, you can use the `-r` option with the `install` command.

```bash
adb install -r /path/to/your/app.apk
```

### Remove the application
```bash
adb uninstall your.app.package
```

### Install the application on a specific device

If you have multiple devices/emulators connected to your adb, you will get an error when you try to install the application.
You need to specify the device on which you want to install the application.

This is not just for installation, you need to specify the device for any `adb` command you run.

To install the application on a specific device, you need to specify the device using the `-s` option before the `install` command.

```bash
adb -s <device_id> install /path/to/your/app.apk
```

You can get the device id by running the below command.
```bash
adb devices
```
```bash
# Output of adb devices
List of devices attached
emulator-5554	device
emulator-5556	device
```
Here, `emulator-5554` and `emulator-5556` are the device ids.
