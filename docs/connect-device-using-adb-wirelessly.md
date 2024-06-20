# Connecting real device using adb wirelessly

## Introduction

Connecting Android Debug Bridge (ADB) wirelessly to your device can be convenient, especially when working with devices that don't have easily accessible USB ports or when you want to avoid cable clutter. This guide will walk you through the process of connecting ADB to your Android device wirelessly using the Command Line Interface (CLI).

## Prerequisites

- Android device
- [Developer Options](https://developer.android.com/studio/debug/dev-options) enabled on your device.
- Install Android SDK using [mobile-helper-tool](https://github.com/nightwatchjs/mobile-helper-tool): `npx @nightwatch/mobile-helper android`.

### Android Debug Bridge (adb)

The whole process is done using `adb` command line tool. So, you would need to make sure that `adb` is available from your terminal. You can check this by running `adb --version`.

If `adb` is not available directly, you can either add its location to your `PATH` environment variable, or `cd` to the location where the `adb` binary is present and use it directly from there.

The `adb` binary will be present in the `platform-tools` sub-directory of your Android SDK setup location.

### Adding `adb` location to `PATH`

Add the path of `platform-tools` directory to your `PATH` environment variable.

**Linux/Mac**:

Add the below command at the end of your `~/.bashrc` or `~./bash_profile` file and restart the terminal.

```bash
export PATH=$PATH:/path/to/Android/sdk/platform-tools/
```

**Windows**:

Add the below path to your `PATH` environment variable in the Control Panel and restart the terminal.

```bash
\path\to\Android\sdk\platform-tools\
```

### Using `adb` directly

To use `adb` directly (without adding it to `PATH`), simply go to the directly where the binary is present and use it as follows:

```bash
cd /path/to/Android/sdk/platform-tools/

# for windows
adb.exe --version

# for mac/linux
./adb --version
```

## Steps for Android v11 or above

### Enable Wireless Debugging on your device

1. Connect your device to the same network as your computer. You may connect the device to your computer's hotspot.
2. Enable wireless debugging on your device by going to: `settings > wireless debugging`.

### Pair your device with your comptuer

```bash
adb pair <ip_address>:<pairing_port> <pairing_code>
``` 

Find your device's IP address, pairing port and pairing code by going to: `settings > wireless debugging > pair device with pairing code`.

> The pairing port is different from actual port of your device. However, IP address remains same.

### Connect your device with your computer

```bash
adb connect <ip_address>:<port>
```

Find your device's IP address and port number by going to: `settings > wireless debugging`.  

You can see your connected device by running the following command.

```bash
adb devices
```

```bash
#output of adb devices
List of devices attached
10.42.0.88:38233	device
```
Here `10.42.0.88:38233` is the device id which combines the IP address and port number of the connected device.

## Steps for Android v10 or below (initial USB connection required)

1. Turn on USB debugging on your device by going to: `settings > developer options > USB debugging`.

2. Connect your Android device and `adb` host computer to a common Wi-Fi network.

3. Connect the device to the host computer with a USB cable.

4. Grant permission for File Transfer.

5. Set the target device to listen for a TCP/IP connection on port 5555:

```bash
adb tcpip 5555
```

6. This will show the prompt on your device for permission options. Grant permission for File Transfer.

7. Disconnect the USB cable from the target device.

8. Find the IP address of the Android device by going to: `settings > about phone > status > IP address` OR you can find the IP address by going to network details of your connected wifi network on your device.

9. Connect to the device by its IP address:

```bash
adb connect <device_ip_address>:5555
```

You can see your connected device by running the following command.

```bash
adb devices
```

```bash
#output of adb devices
List of devices attached
10.42.0.88:5555	device
```
Here `10.42.0.88:5555` is the device id which combines the IP address and port number of the connected device.

## Disconnecting your device

To disconnect your device, simply run the below command.

```bash
adb disconnect <device_id>
```

To disconnect all the connected devices.

```bash
adb kill-server
```