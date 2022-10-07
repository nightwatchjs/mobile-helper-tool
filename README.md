# @nightwatch/mobile-helper

## Setup

Before we start we are going to need to do the following.

1. Install Java Run Time e.g. `brew install openjdk@17`. Make sure once installed that Java is in the `PATH`.
2. `mkdir ~/android_home; export ANDROID_HOME=~/android_home`
 Install all JS dependencies with `npm i .`
3. Run `npm run dev -- android --setup`
4. `cd $ANDROID_HOME`
5. `./platform-tools/adb root`
6. `./emulator/emulator @nightwatch-android-11`
7. Down the latest from [Mozilla FTP](https://ftp.mozilla.org/pub/fenix/releases/) and drag the browser into the started emulator.
8. update `desired_capabilities`  to have

```js
desiredCapabilities: {
        browserName: 'firefox',
        acceptInsecureCerts: true,
        'moz:firefoxOptions': {
          args: [
            // '-headless',
            // '-verbose'
          ],
          androidPackage: "org.mozilla.firefox",
        }
      },
```

9. run your test.
