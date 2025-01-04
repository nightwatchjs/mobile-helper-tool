# Connecting real device using adb wirelessly

## Introduction

Connecting to your device wirelessly using Android Debug Bridge (ADB) can be convenient, especially when working with devices that don't have easily accessible USB ports or when you want to avoid cable clutter. This guide will walk you through the process of connecting to your Android device wirelessly using the `adb` command-line tool.

## Prerequisites

- Android device
- [Developer Options](https://developer.android.com/studio/debug/dev-options) enabled on your device.
- Install Android SDK using [mobile-helper-tool](https://github.com/nightwatchjs/mobile-helper-tool): `npx @nightwatch/mobile-helper android`.

### Check if `adb` is available and working

The whole process depends on `adb` command line tool. So, you would need to make sure that `adb` is available from your terminal. You can check this by running `adb --version`.

If `adb` is not available directly, you can either add its location to your `PATH` environment variable, or `cd` to the location where the `adb` binary is present and use it directly from there.

> For both cases, you'd need the location where you've set up your Android SDK, which you can get by running `npx @nightwatch/mobile-helper android` again:
>
> <img width="517" alt="ANDROID_HOME" src="https://github.com/nightwatchjs/mobile-helper-tool/assets/39924567/20289460-1f1b-489e-9558-b0a7764d15e0">

You can find the `adb` binary located within the `platform-tools/` sub-directory of your Android SDK setup location from above. Eg. `path/to/Android/sdk/platform-tools/`

### Adding `adb` location to `PATH`

Add the path of `platform-tools/` directory to your `PATH` environment variable.

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

2. Enable developer options on your device by going to: `Settings > About phone > Build number` 
and tapping the **Build number** 7 times until you see the message **You are now a developer!**

3. Enable wireless debugging on your device by going to: `Settings > Developer options > Wireless debugging'` or,
search for **wireless debugging** on your device's Settings app.

### Pair your device with your comptuer

```bash
adb pair <ip_address>:<pairing_port> <pairing_code>
``` 

Find your device's IP address, pairing port and pairing code by going to: `Settings > Developer options > Wireless debugging > Pair device with pairing code`.

> The pairing port is different from actual port of your device. However, IP address remains same.

### Connect your device with your computer

```bash
adb connect <ip_address>:<port>
```

Find your device's IP address and port number by going to: `Settings > Developer options > Wireless debugging'`.  

You can see your connected device by running the following command.

```bash
adb devices
```

```bash
# output of adb devices
List of devices attached
10.42.0.88:38233	device
```
Here `10.42.0.88:38233` is the device id which combines the IP address and port number of the connected device.

## Steps for Android v10 or below (initial USB connection required)

1. Turn on USB debugging on your device by going to: `Settings > Developer options > USB debugging`.

2. Connect your Android device and `adb` host computer to a common Wi-Fi network.

3. Connect the device to the host computer with a USB cable.

4. Grant permission for File Transfer.

5. Set the target device to listen for a TCP/IP connection on port 5555:

```bash
adb tcpip 5555
```

6. Disconnect the USB cable from the target device.

7. Find the IP address of the Android device by going to: `Settings > About phone > Status > IP address` OR you can find the IP address by going to network details of your connected wifi network on your device.

8. Connect to the device by its IP address:

```bash
adb connect <device_ip_address>:5555
```

You can see your connected device by running the following command.

```bash
adb devices
```

```bash
# output of adb devices
List of devices attached
10.42.0.88:5555	device
```
Here `10.42.0.88:5555` is the device id which combines the IP address and port number of the connected device.

## Disconnecting your device

> If the device is connected over wireless debugging using pairing code method, then we can simply disconnect the device with the below commands.

Disconnect a specific device.

```bash
adb disconnect <device_id>
```

To disconnect all the connected devices.

```bash
adb kill-server
```

> If the device is connected with tcpip connection then we need to close the connection first.
> Otherwise the device will still be vulnerable to connection requests from other computers.
> The below command will switch the mode back to usb and close the tcpip connection.
> The device will go offline and will no longer be accessible for debugging. After that, we can simply disconnect the device.

```bash
# close tcpip connection
adb -s <device_id> usb

# disconnect the device
adb disconnect <device_id>
```
