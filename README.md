# @nightwatch/mobile-helper

Official Nightwatch helper-tool to easily setup all the requirements needed to get started with running your Nightwatch tests on real mobile-browsers.

## Usage

### Android

1. From your [Nightwatch](https://nightwatch.org) project's root dir, run:

   ```sh
   npx @nightwatch/mobile-helper android
   ```
2. Answer a few questions related to your requirements:
   <img width="689" alt="image" src="https://user-images.githubusercontent.com/39924567/199205454-e321f143-9757-4f6f-809b-b143519bddae.png">


3. It will verify if all the requirements are being met.
4. If some requirements are not being met, it will ask whether to download and setup those requirements:
   <img width="600" alt="image" src="https://user-images.githubusercontent.com/39924567/199204970-f95f1bce-35a6-4958-b0eb-f642331c9fb7.png">

5. Voila :tada: Your setup is now complete. (If something fails, follow the instructions and re-run the command.)
6. Add the following env configuration to your `nightwatch.conf.js` or `nightwatch.json` file:
   ```js
   "test_settings": {
    // other envs above this line
    'android.chrome': {
      desiredCapabilities: {
        browserName: 'chrome',
        real_device: false,
        'goog:chromeOptions': {
          w3c: true,
          args: [
            //'--no-sandbox',
            //'--ignore-certificate-errors',
            //'--allow-insecure-localhost',
            //'--headless'
          ],
          androidPackage: 'com.android.chrome',
          // add the device serial to run tests on, if multiple devices are online
          // Run command: `$ANDROID_HOME/platform-tools/adb devices`
          // androidDeviceSerial: ''
        },
      },

      webdriver: {
        start_process: true,
        server_path: 'chromedriver-mobile/chromedriver',
        cli_args: [
          // --verbose
        ]
      }
    },

    'android.firefox': {
      desiredCapabilities: {
        browserName: 'firefox',
        real_device: false,
        acceptInsecureCerts: true,
        'moz:firefoxOptions': {
          args: [
            // '-headless',
            // '-verbose'
          ],
          androidPackage: 'org.mozilla.firefox',
          // add the device serial to run tests on, if multiple devices are online
          // Run command: `$ANDROID_HOME/platform-tools/adb devices`
          // androidDeviceSerial: 'ZD2222W62Y'
        }
      },
      webdriver: {
        start_process: true,
        server_path: '',
        cli_args: [
          // very verbose geckodriver logs
          // '-vv'
        ]
      }
    },
   }
   ```
7. If testing on real-device:
   1. Make sure latest version of Chrome/Firefox browsers are installed. If not, install them from Google Play Store.
   2. [Turn on USB Debugging](https://developer.android.com/studio/debug/dev-options#enable) on your Android Device and connect it to your system via data cable.
   3. Set `real_device` capability to true in the configuration.

8. If testing on emulator, make sure `chromedriver-mobile/chromedriver` is present in your Nightwatch project's root dir. If not present, re-run the command in first step.

9. Run your nightwatch tests on Android mobile browsers:
   ```sh
    # for firefox
    npx nightwatch --env android.firefox
    # for chrome
    npx nightwatch --env android.chrome
   ```

### Ios

1. From your [Nightwatch](https://nightwatch.org) project's root dir, run:

   ```sh
   npx @nightwatch/mobile-helper ios
   ```
2. Answer a device related question:
   <img width="352" alt="image" src="https://user-images.githubusercontent.com/94462364/199410412-e40da151-e545-4039-90db-e68697358665.png">


3. It will verify if all the requirements are being met.
4. If some requirements are not being met, follow the guide to manually setup those requirements.

   <img width="662" alt="image" src="https://user-images.githubusercontent.com/94462364/199419711-43e7793a-df82-4d67-a832-679eb5c1f7b9.png">


5. Voila :tada: Your setup is now complete. (re-run the command in first step to re-verify.)

6. Add the following env configuration to your `nightwatch.conf.js` or `nightwatch.json` file:
   ```js
   "test_settings": {
    // other envs above this line
    'ios.real.safari': {
      desiredCapabilities: {
        browserName: 'safari',
        platformName: 'iOS',
        // add the device UDID to run tests on (necessary)
        // Run command: `xcrun simctl list devices`
        // 'safari:deviceUDID': '00008030-00024C2C3453402E',
      },
    
      webdriver: {
        start_process: true,
        server_path: '',
        cli_args: [
          // --verbose
        ]
      }
    },
    
    'ios.simulator.safari': {
      desiredCapabilities: {
        browserName: 'safari',
        platformName: 'iOS',
        'safari:useSimulator': true,
        // change the deviceName, platformVersion accordingly to run tests on 
        // Run command: `xcrun simctl list devices`
        // 'safari:platformVersion': '15.0',
        'safari:deviceName': 'iPhone 13'
      },
    
      webdriver: {
        start_process: true,
        server_path: '',
        cli_args: [
          // --verbose
        ]
      }
    },
   }
   ```

7. Update the configurations :

    **Real Device** (*Mandatory*)
    
    Run the following command to get the *UDID*
    
    ```sh
    system_profiler SPUSBDataType | sed -n '/iPhone/,/Serial/p' | grep 'Serial Number:' | awk -F ': ' '{print $2}'
    ```
    Now update *UDID* in nightwatch configuration for *ios.real.safari* environment. 

    **Simulators** (*Optional*)
    
    Run the following command to get the list of simulators 
    ```sh
    xcrun simctl list devices
    ```
    And then update *safari:deviceName* (eg: 'iphone 13') and *safari:platformVersion* (eg: '15.0') in nightwatch configuration for *ios.simulator.safari* environment accordingly.


8. Run your nightwatch tests on Android mobile browsers:
   ```sh
    # for simulators
    npx nightwatch --env ios.simulator.safari

    # for real device
    npx nightwatch --env ios.real.safari --udid <YOUR-DEVICE-UDID>
   ```
