### Mobile web testing - iOS

1. In your [Nightwatch](https://nightwatchjs.org) project, install `@nightwatch/mobile-helper` as a dev-dependency:
   ```sh
   npm i @nightwatch/mobile-helper --save-dev
   ```
2. From your project's root dir, run:

   ```sh
   npx @nightwatch/mobile-helper ios
   ```
3. Answer a device related question:

   <img width="352" alt="image" src="https://user-images.githubusercontent.com/94462364/199410412-e40da151-e545-4039-90db-e68697358665.png">


4. It will verify if all the requirements are being met.
5. If some requirements are not being met, follow the guide to setup those requirements.

   <img width="662" alt="image" src="https://user-images.githubusercontent.com/94462364/199419711-43e7793a-df82-4d67-a832-679eb5c1f7b9.png">


6. Great :tada: Your setup is now complete. (Re-run the command in the first step to verify.)

7. Add the following env configuration to your `nightwatch.conf.js` or `nightwatch.json` file:
   ```js
   "test_settings": {
     // other envs above this line
     'ios.real.safari': {
       desiredCapabilities: {
         browserName: 'safari',
         platformName: 'iOS',
         // add udid of the device to run tests on (necessary)
         // Run command: `xcrun xctrace list devices`
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
         // To find the available deviceName/platformName to run tests on,
         // run command: `xcrun simctl list devices`
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
8. (**Real Device**) Run the following command to get the *UDID*:
   ```sh
    system_profiler SPUSBDataType | sed -n '/iPhone/,/Serial/p' | grep 'Serial Number:' | awk -F ': ' '{print $2}'
    ```

9. (**Optional**) Update the configurations : 

    **Real Device**

    In your Nightwatch configuration, set `safari:deviceUDID` capability of `ios.real.safari` environment to *UDID* from the previous step.

    **Simulators**
    
    Run the following command to get a list of simulators:
    ```sh
    xcrun simctl list devices
    ```
    And then update `safari:deviceName` (eg: 'iPhone 13') and `safari:platformVersion` (eg: '15.0') capabilities of `ios.simulator.safari` environment in your Nightwatch configuration according to your preference.

10. Run your nightwatch tests on Android mobile browsers:
    ```sh
    # for simulators
    npx nightwatch --env ios.simulator.safari

    # for real device
    npx nightwatch --env ios.real.safari --deviceId <YOUR-DEVICE-UDID>
    # for real device (if updated the config in the previous step)
    npx nightwatch --env ios.real.safari
    ```

### Mobile app testing - iOS

#### Setup iOS SDK requirements

1. From your [Nightwatch](https://nightwatchjs.org) project's root dir, run:
   ```sh
   npx @nightwatch/mobile-helper ios --setup
   ```
2. Answer a device related question:

   <img width="352" alt="image" src="https://user-images.githubusercontent.com/94462364/199410412-e40da151-e545-4039-90db-e68697358665.png">

3. It will verify if all the requirements are being met.
4. If some requirements are not being met, follow the guide to setup those requirements.

   <img width="662" alt="image" src="https://user-images.githubusercontent.com/94462364/199419711-43e7793a-df82-4d67-a832-679eb5c1f7b9.png">

5. And done! :tada: Your setup is now complete. (Re-run the command in the first step to verify.)

#### Setup mobile app testing and run first sample test

1. In your [Nightwatch](https://nightwatchjs.org) project, install Appium v2 as a dev-dependency:
   ```sh
   npm i appium@next --save-dev
   ```
2. Install Appium XCUITest driver for iOS:
   ```sh
   npx appium driver install xcuitest
   ```
3. Download the [sample wikipedia app](https://raw.githubusercontent.com/priyansh3133/wikipedia/main/wikipedia.zip) and save it in your project's root directory (alongside `nightwatch.conf.js` file).
4. Add the following env configuration to your `nightwatch.conf.js` file (skip 'app' env if already followed Android setup above):
   ```js
   "test_settings": {
    // other envs above this line

    app: {
      selenium: {
        start_process: true,
        use_appium: true,
        host: 'localhost',
        port: 4723,
        server_path: '',
        // args to pass when starting the Appium server
        cli_args: [
          // automatically download the required chromedriver
          // '--allow-insecure=chromedriver_autodownload'
        ],
        // Remove below line if using Appium v1
        default_path_prefix: ''
      },
      webdriver: {
        timeout_options: {
          timeout: 150000,
          retry_attempts: 3
        },
        keep_alive: false,
        start_process: false
      }
    },

    'app.ios.simulator': {
      extends: 'app',
      'desiredCapabilities': {
        // More capabilities can be found at https://github.com/appium/appium-xcuitest-driver#capabilities
        browserName: null,
        platformName: 'ios',
        // `appium:options` is not natively supported in Appium v1, but works with Nightwatch.
        // If copying these capabilities elsewhere while using Appium v1, make sure to remove `appium:options`
        // and add `appium:` prefix to each one of its capabilities, e.g. change 'app' to 'appium:app'.
        'appium:options': {
          automationName: 'XCUITest',
          // platformVersion: '15.5',
          deviceName: 'iPhone 13',
          // While Appium v1 supports relative paths, it's more safe to use absolute paths instead.
          // Appium v2 does not support relative paths.
          app: `${__dirname}/wikipedia.zip`,
          bundleId: 'org.wikimedia.wikipedia',
          newCommandTimeout: 0
        }
      }
    },

    'app.ios.real': {
      extends: 'app',
      'desiredCapabilities': {
        // More capabilities can be found at https://github.com/appium/appium-xcuitest-driver#capabilities
        browserName: null,
        platformName: 'ios',
        // `appium:options` is not natively supported in Appium v1, but works with Nightwatch.
        // If copying these capabilities elsewhere while using Appium v1, make sure to remove `appium:options`
        // and add `appium:` prefix to each one of its capabilities, e.g. change 'app' to 'appium:app'.
        'appium:options': {
          automationName: 'XCUITest',
          // While Appium v1 supports relative paths, it's more safe to use absolute paths instead.
          // Appium v2 does not support relative paths.
          app: `${__dirname}/wikipedia.zip`,
          bundleId: 'org.wikimedia.wikipedia',
          newCommandTimeout: 0,
          // add udid of the device to run tests on. Or, pass the id to `--deviceId` flag when running tests.
          // device id could be retrieved from Xcode > Window > "Devices and Simulators" window.
          // udid: '00008030-00024C2C3453402E'
        }
      }
    },
   }
   ```
5. Add the following sample test to your test-suite (`test/wikipedia-ios.js`):
   ```js
   describe('Wikipedia iOS app test', function() {
     before(function(app) {
       app.click('xpath', '//XCUIElementTypeButton[@name="Skip"]');
     });

     it('Search for BrowserStack', async function(app) {
       app
         .useXpath()
         .click('//XCUIElementTypeSearchField[@name="Search Wikipedia"]')
         .sendKeys('//XCUIElementTypeSearchField[@name="Search Wikipedia"]', 'browserstack')
         .click('//XCUIElementTypeStaticText[@name="BrowserStack"]')
         .waitUntil(async function() {
           // wait for webview context to be available
           const contexts = await this.appium.getContexts();

           return contexts.length > 1;
         }, 5000)
         .perform(async function() {
           // switch to webview context
           const contexts = await this.appium.getContexts();

           await this.appium.setContext(contexts[1]);
         })
         .useCss()
         .assert.textEquals('.pcs-edit-section-title', 'BrowserStack');  // command run in webview context
     });
   });
   ```
6. (**Real Device**) Run the following command to get the *UDID*:
   ```sh
    system_profiler SPUSBDataType | sed -n '/iPhone/,/Serial/p' | grep 'Serial Number:' | awk -F ': ' '{print $2}'
    ```

7. (**Optional**) Update the configurations : 

    **Real Device**

    In your Nightwatch configuration, set `udid` property of `appium:options` capability inside `app.ios.real` environment to *UDID* from the previous step.

    **Simulators**
    
    Run the following command to get a list of simulators:
    ```sh
    xcrun simctl list devices
    ```
    And then update `deviceName` (eg: 'iPhone 13') and `platformVersion` (eg: '15.0') properties of `appium:options` capability, defined for `app.ios.simulator` environment in your Nightwatch configuration, according to your preference.

8. Run your Nightwatch tests on iOS simulator/real device:
   ```sh
    # test on simulator (assuming test saved as `test/wikipedia-ios.js`)
    npx nightwatch test/wikipedia-ios.js --env app.ios.simulator
    
    # test on real-device (assuming test saved as `test/wikipedia-ios.js`)
    npx nightwatch test/wikipedia-ios.js --env app.ios.real
   ```
