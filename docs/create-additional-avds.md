# Create additional AVDs (Android Virtual Device)

## Introduction

This guide will demonstrate how to create Android Virtual Devices (AVDs) using the `avdmanager` tool, which is a part of the Android SDK command line tools.

## Prerequisites

- Setup Android SDK using [mobile-helper-tool](https://github.com/nightwatchjs/mobile-helper-tool): `npx @nightwatch/mobile-helper android`.

### Android SDK command line tools

`avdmanager` is a part of the Android SDK command-line tools package. You can ensure that `avdmanager` is working by running `avdmanager -h`.

If `avdmanager` is not available directly, you can either add its location to your `PATH` environment variable, or `cd` to the location where the `avdmanager` binary is present and use it directly from there.

For both cases, you'd need the location where you've setup your Android SDK, which you can get by running `npx @nightwatch/mobile-helper android` again:

<img width="517" alt="ANDROID_HOME" src="https://github.com/nightwatchjs/mobile-helper-tool/assets/39924567/20289460-1f1b-489e-9558-b0a7764d15e0">

The `avdmanager` binary will be present in the `cmdline-tools/latest/bin` sub-directory of your Android SDK setup location from above. Eg: `/path/to/Android/Sdk/cmdline-tools/latest/bin/`.

### Adding `avdmanager` location to `PATH`

Add the path of `cmdline-tools/latest/bin/` directory to your `PATH` environment variable.

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

### Using `avdmanager` directly

To use `avdmanager` directly (without adding it to `PATH`), simply go to the directory where the binary is present and use it as follows:

```bash
cd /path/to/Android/Sdk/cmdline-tools/latest/bin

# for windows
avdmanager.exe -h

# for mac/linux
./avdmanager -h
```

## Commands

The syntax for using `avdmanager` is:

```bash
avdmanager [global options] command [command options]
```

### Global options

| Option          | Description                                                             |
| --------------- | ----------------------------------------------------------------------- |
| -s \| --silent  | Silent mode: only errors are printed out.                               |
| -h \| --help    | Usage help.                                                             |
| -v \| --verbose | Verbose mode: errors, warnings, and informational messages are printed. |
| --clear cache   | Clear the SDK Manager repository manifest cache.                        |

### Command and command options

The following are the various commands and options used with the `avdmanager` binary.

**1. Create AVD**

The following syntax is used for creating an AVD:

```bash
# Create AVD
avdmanager create avd -n <avd_name> -k <sdk_id> [-d <device_name>] [-c {<path>|<size>}] [-f] [-p <path>]
```
- **-n <avd_name>**

    This option specifies the name of the AVD. The `avd_name` should be unique and descriptive, as it will be used to identify the AVD later.

- **-k <sdk_id>**

    This option specifies the system image to use for the AVD. The `sdk_id` should be in the format
    ```bash
    system-images;android-<API_level>;<image_type>;<architecture>
    ```
    For example, the below system image representation specifies an Android 30 (Android 11) system image for the x86 architecture.
    ```bash
    system-images;android-30;default;x86 
    ```

- **-d <device_name> (Optional)**

    This option specifies a predefined device profile to use for the AVD. The `device_name` should match one of the available device definitions.

- **-c {\<path> | \<size>} (Optional)**

    This option specifies the size of the SD card to create for the AVD, or a path to an existing SD card image.

    **path:** A file path to an existing SD card image.

    **size:** The size of the new SD card to create in MB or KB (e.g., 512M for 512 megabytes, 1G for 1 gigabyte).

- **-f (Optional)**

    This flag forces the creation of the AVD even if there is an existing AVD with the same name. It overwrites the existing AVD.

- **-p \<path> (Optional)**

    Path to the location where the directory for this AVD's files will be created. If you don't specify a path, the AVD is created in `~/.android/avd/`.

**2. Delete AVD**

```bash
# Delete AVD
avdmanager delete avd -n <name>
```

To delete an AVD you must specify the `name`.

**3. Move or rename AVD**

```bash
# Move or rename AVD
avdmanager move avd -n <name> [-p <path>] [-r <new_name>]
```

- **-n \<name>**

    The `name` must be specified to move or rename the AVD.

- **-p \<path>**

    The absolute path to the location at which to create the directory where this AVD's files will be moved. If you don't include this argument, the AVD won't be moved. You might choose not to include this argument if you want to rename the AVD in place.

- **-r <new_name>**

    The new name of the AVD being renamed.

**4. List targets, device definitions, or AVDs**

```bash
# Show a list of available targets, device definitions or AVDs
list [target|device|avd] [-c]
```

- **target** 

    This command shows a list of all Android SDK targets that are installed, including details such as the target ID, name, type (platform or add-on), and API level.

- **device**

    This command shows a list of all the available device definitions that can be used to create AVDs.

- **avd**

    This command shows a list of all the currently present AVDs in your device. 
    
- **-c**

    This option is used to receive a compact output. It is not available when listing all three options together.
    
If any of the above three commands is not specified, then a combined list of all three will be shown.