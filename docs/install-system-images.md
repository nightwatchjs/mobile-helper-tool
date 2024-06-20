# Install system images of additional android versions

## Introduction

This guide will demonstrate how to manage system images and other packages using the `sdkmanager` tool, which is a part of the Android SDK. This includes installing, uninstalling, updating, and listing available packages.

## Prerequisites

- Setup Android SDK using [mobile-helper-tool](https://github.com/nightwatchjs/mobile-helper-tool): `npx @nightwatch/mobile-helper android`.

### Android SDK command line tools

`sdkmanager` is a part of the Android SDK command-line tools package. You can ensure that `sdkmanager` is working by running `sdkmanager --version`.

If `sdkmanager` is not available directly, you can either add its location to your `PATH` environment variable, or `cd` to the location where the `sdkmanager` binary is present and use it directly from there.

For both cases, you'll need the location where you've setup your Android SDK, which you can get by running `npx @nightwatch/mobile-helper android` again:

<img width="517" alt="ANDROID_HOME" src="https://github.com/nightwatchjs/mobile-helper-tool/assets/39924567/20289460-1f1b-489e-9558-b0a7764d15e0">

The `sdkmanager` binary will be present in the `cmdline-tools/latest/bin` sub-directory of your Android SDK setup location from above. Eg: `/path/to/Android/Sdk/cmdline-tools/latest/bin/`.

### Adding `sdkmanager` location to `PATH`

Add the path of `cmdline-tools/latest/bin` directory to your `PATH` environment variable.

**Linux/Mac**:

Add the below command at the end of your `~/.bashrc` or `~./bash_profile` file and restart the terminal.

```bash
export PATH=$PATH:/path/to/Android/Sdk/cmdline-tools/latest/bin/
```

**Windows**:

Add the below path to your `PATH` environment variable in the Control Panel and restart the terminal.

```bash
\path\to\Android\Sdk\cmdline-tools\latest\bin\
```

### Using `sdkmanager` directly

To use `sdkmanager` directly (without adding it to `PATH`), simply go to the directory where the binary is present and use it as follows:

```bash
cd /path/to/Android/Sdk/cmdline-tools/latest/bin

# for windows
sdkmanager.exe --version

# for mac/linux
./sdkmanager --version
```

## System Images

A system image in the context of Android development is a file that represents the operating system and other software that runs on an Android Virtual Device (AVD) in the Android Emulator. It is essentially a snapshot of an Android OS environment, allowing developers to emulate different devices and Android versions on their development machines.

```bash
# The general representation of system image

system-images;android-<API_LEVEL>;<IMAGE_TYPE>;<ARCHITECTURE>
```

**Components**

1. **system-images**: This prefix indicates that the package contains system images for the Android Emulator.

2. **android-<API_LEVEL>**: This specifies the version of the Android OS by its API level. For example, android-30 refers to Android 11, which corresponds to API level 30.

3. **<IMAGE_TYPE>**: This denotes the type of system image. The types include:

    - **default**: A basic system image without Google Play services.
    - **google_apis**: Includes Google APIs but not the Google Play Store.
    - **google_apis_playstore**: Includes both Google APIs and the Google Play Store.
    - **android-wear**: For Wear OS devices.
    - **android-tv**: For Android TV devices.
    - **android-automotive**: For Android Automotive devices.
    - **aosp_atd**: For Automated Testing Devices (ATD).

4. **\<ARCHITECTURE>**: This specifies the CPU architecture the system image is built for. Common architectures include:

    - **armeabi-v7a**: ARMv7-A architecture.
    - **arm64-v8a**: ARMv8-A architecture (64-bit).
    - **x86**: Intel x86 architecture.
    - **x86_64**: Intel x86 architecture (64-bit).

**Example Representations**

```bash
#Android 10 default system image for ARMv7-A architecture
system-images;android-29;default;armeabi-v7a

# Android 11 system image with Google APIs for x86 architecture
system-images;android-30;google_apis;x86

# Android 12 system image with Google Play Store for x86_64 architecture
system-images;android-31;google_apis_playstore;x86_64

# Wear OS system image for ARM64 architecture
system-images;android-wear-28;default;arm64-v8a
```

## Commands

**1. List Packages**

The following command is used to list all the installed and available packages.

```bash
sdkmanager --list [options] 
```

**2. Install or Update Package**

The following command is used to install new packages or update previously installed packages from the list returned by the above command.

```bash
sdkmanager <package_names> [options]

# Installing all available updates at once
sdkmanager --update [options]

# Example for installing or updating two packages at once
sdkmanager "system-images;android-wear-28;default;arm64-v8a" "system-images;android-30;google_apis;x86"
```

**3. Uninstall Package**

The following command is used to uninstall packages.

```bash
sdkmanager --uninstall <package_names> [options]
```

**4. Accept Licenses**

You are required to accept the necessary license for each package you have installed. The following command prompts you to accept any licenses that haven't already been accepted.

```bash
sdkmanager --licenses
```

### Options

The following table lists the available options for the commands listed in the preceding section:

| Option                                         | Description                                                                                                                             |
| ---------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| --sdk_root=path                                | Use the specified SDK path instead of the SDK containing this tool.                                                                     |
| --channel=channel_id                           | Include packages in channels up to and including channel_id. Available channels are: 0 (Stable), 1 (Beta), 2 (Dev), and 3 (Canary).     |
| --include_obsolete                             | Include obsolete packages in the package listing or package updates. For use with --list and --update only.                             |
| --no_https                                     | Force all connections to use HTTP rather than HTTPS.                                                                                    |
| --newer                                        | With --list, show only new or updatable packages.                                                                                       |
| --verbose                                      | Verbose output mode. Errors, warnings and informational messages are printed.                                                           |
| --proxy={http \| socks}                        | Connect via a proxy of the given type: either http for high level protocols such as HTTP or FTP, or socks for a SOCKS (V4 or V5) proxy. |
| --proxy_host={IP_address \| DNS_address}       | IP or DNS address of the proxy to use.                                                                                                  |
| --proxy_port=port_number                       | Proxy port number to connect to.                                                                                                        |
