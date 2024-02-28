# Installing an application from APK

## Introduction

This guide will show you how to install an application from an APK file on your Android emulator.

## Prerequisites

- Setup Android Emulator using [mobile-helper-tool](https://github.com/nightwatchjs/mobile-helper-tool)
- APK file of the application you want to install
- `adb` command should be available in your terminal. You can check this by running `adb --version` in your terminal.

## Assumptions
- APK path is `/path/to/your/app.apk`
- Application package name is `your.app.package`

## Steps

### Check if Emulator is running
```bash
adb devices
```

### Install the application
```bash
adb install /path/to/your/app.apk
```

### Verify the installation
```bash
adb shell pm list packages -f | grep your.app.package
```

### Remove the application
```bash
adb uninstall your.app.package
```
