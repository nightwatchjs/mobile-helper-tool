import colors from 'ansi-colors';
import {execSync} from 'child_process';
import * as dotenv from 'dotenv';
import fs from 'fs';
import os from 'os';
import path from 'path';
import untildify from 'untildify';
import {prompt} from 'inquirer';

import {getPlatformName, symbols} from '../../utils';
import {getAlreadyRunningAvd, launchAVD} from './adb';
import {
  ABI, AVAILABLE_OPTIONS, BINARY_TO_PACKAGE_NAME, DEFAULT_CHROME_VERSION,
  DEFAULT_FIREFOX_VERSION, NIGHTWATCH_AVD, SETUP_CONFIG_QUES
} from './constants';
import {Options, OtherInfo, Platform, SdkBinary, SetupConfigs} from './interfaces';
import {
  downloadFirefoxAndroid, downloadWithProgressBar, getAllAvailableOptions,
  getBinaryLocation, getBinaryNameForOS, getFirefoxApkName, getLatestVersion
} from './utils/common';
import {downloadAndSetupAndroidSdk, execBinarySync, getDefaultAndroidSdkRoot, installPackagesUsingSdkManager} from './utils/sdk';

import DOWNLOADS from './downloads.json';


export class AndroidSetup {
  sdkRoot: string;
  options: Options;
  rootDir: string;
  platform: Platform;
  otherInfo: OtherInfo;

  constructor(options: Options, rootDir = process.cwd()) {
    this.sdkRoot = '';
    this.options = options;
    this.rootDir = rootDir;
    this.platform = getPlatformName();
    this.otherInfo = {
      androidHomeInGlobalEnv: false
    };
  }

  async run(): Promise<boolean> {
    let result = true;

    const allAvailableOptions = getAllAvailableOptions();
    const unknownOptions = Object.keys(this.options).filter((option) => !allAvailableOptions.includes(option));

    if (this.options.help || unknownOptions.length) {
      this.showHelp(unknownOptions);

      return this.options.help === true;
    }

    const javaInstalled = this.checkJavaInstallation();
    if (!javaInstalled) {
      return false;
    }

    const sdkRootEnv = this.getSdkRootFromEnv();
    this.sdkRoot = sdkRootEnv || await this.getSdkRootFromUser();

    const setupConfigs: SetupConfigs = await this.getSetupConfigs(this.options);
    console.log();

    const missingRequirements = this.verifySetup(setupConfigs);

    if (this.options.setup) {
      result = await this.setupAndroid(setupConfigs, missingRequirements);
    } else if (missingRequirements.length) {
      result = false;
    }

    if (setupConfigs.mode !== 'real' && result) {
      // Only verify/install browsers if working with emulator and
      // all processes before have passed.
      result = await this.verifyAndSetupBrowsers(setupConfigs.browsers);
    }

    if (setupConfigs.mode !== 'emulator') {
      console.log(`${colors.bold('Note:')} Please make sure you have required browsers installed on your real-device before running tests.\n`);
    }

    if (!sdkRootEnv) {
      this.sdkRootEnvSetInstructions();
    }

    return result;
  }

  showHelp(unknownOptions: string[]) {
    if (unknownOptions.length) {
      console.log(colors.red(`unknown option(s) passed: ${unknownOptions.join(', ')}\n`));
    }

    console.log(`Usage: ${colors.cyan('npx @nightwatch/mobile-helper android [options]')}`);
    console.log('  Verify if all the requirements are met to run tests on an Android device/emulator.\n');

    console.log(`${colors.yellow('Options:')}`);

    const switches = Object.keys(AVAILABLE_OPTIONS).reduce((acc: {[T: string]: string}, key) => {
      acc[key] = [key].concat(AVAILABLE_OPTIONS[key].alias || [])
        .map(function(sw) {
          return (sw.length > 1 ? '--' : '-') + sw;
        })
        .join(', ');

      return acc;
    }, {});

    const longest = (xs: string[]) => Math.max.apply(null, xs.map(x => x.length));

    const switchlen = longest(Object.keys(switches).map(function(s) {
      return switches[s] || '';
    }));

    const desclen = longest(Object.keys(AVAILABLE_OPTIONS).map((option) => {
      return AVAILABLE_OPTIONS[option].description;
    }));

    Object.keys(AVAILABLE_OPTIONS).forEach(key => {
      const kswitch = switches[key];
      let desc = AVAILABLE_OPTIONS[key].description;
      const spadding = new Array(Math.max(switchlen - kswitch.length + 3, 0)).join('.');
      const dpadding = new Array(Math.max(desclen - desc.length + 1, 0)).join(' ');

      if (dpadding.length > 0) {
        desc += dpadding;
      }

      const prelude = '  ' + (kswitch) + ' ' + colors.grey(spadding);

      console.log(prelude + ' ' + colors.grey(desc));
    });
  }

  checkJavaInstallation(): boolean {
    try {
      execSync('java -version', {
        stdio: 'pipe',
        cwd: this.rootDir
      });

      return true;
    } catch {
      console.log('Java Development Kit is required to work with Android SDKs. Download from here:');
      console.log(colors.cyan('  https://www.oracle.com/java/technologies/downloads/'), '\n');

      console.log(`Make sure Java is installed by running ${colors.green('java -version')} command and then re-run this tool.`);

      return false;
    }
  }

  getSdkRootFromEnv(): string {
    console.log('Checking the value of ANDROID_HOME environment variable...');

    this.otherInfo.androidHomeInGlobalEnv = 'ANDROID_HOME' in process.env;

    dotenv.config({path: path.join(this.rootDir, '.env')});

    const androidHome = process.env.ANDROID_HOME;
    const fromDotEnv = this.otherInfo.androidHomeInGlobalEnv ? '' : ' (taken from .env)';

    if (androidHome) {
      const androidHomeFinal = untildify(androidHome);

      const androidHomeAbsolute = path.resolve(this.rootDir, androidHomeFinal);
      if (androidHomeFinal !== androidHomeAbsolute) {
        console.log(`  ${colors.yellow('!')} ANDROID_HOME is set to '${androidHomeFinal}'${fromDotEnv} which is NOT an absolute path.`);
        console.log(`  ${colors.green(symbols().ok)} Considering ANDROID_HOME to be '${androidHomeAbsolute}'\n`);

        return androidHomeAbsolute;
      }

      console.log(`  ${colors.green(symbols().ok)} ANDROID_HOME is set to '${androidHomeFinal}'${fromDotEnv}\n`);

      return androidHomeFinal;
    }

    if (androidHome === undefined) {
      console.log(
        `  ${colors.red(symbols().fail)} ANDROID_HOME environment variable is NOT set!\n`
      );
    } else {
      console.log(
        `  ${colors.red(symbols().fail)} ANDROID_HOME is set to '${androidHome}'${fromDotEnv} which is NOT a valid path!\n`
      );
    }

    return '';
  }

  async getSdkRootFromUser(): Promise<string> {
    const answers: {sdkRoot: string} = await prompt([
      {
        type: 'input',
        name: 'sdkRoot',
        message: 'Where do you wish to verify/download Android SDKs?',
        default: getDefaultAndroidSdkRoot(this.platform),
        filter: (input: string) => path.resolve(this.rootDir, untildify(input))
      }
    ]);

    const {sdkRoot} = answers;

    if (!this.otherInfo.androidHomeInGlobalEnv) {
      // if ANDROID_HOME is already set in global env, saving it to .env is of no use.
      // this is important if global ANDROID_HOME env is set to '', in which case we
      // should not save the user supplied value to .env.
      const envPath = path.join(this.rootDir, '.env');
      fs.appendFileSync(envPath, `\nANDROID_HOME=${sdkRoot}\n`);
    }

    return sdkRoot;
  }

  getConfigFromOptions(options: {[key: string]: string | string[] | boolean}): SetupConfigs {
    const configs: SetupConfigs = {};

    if (options.mode && typeof options.mode !== 'boolean') {
      const realMode = options.mode.includes('real');
      const emulatorMode = options.mode.includes('emulator');

      if (realMode && emulatorMode) {
        configs.mode = 'both';
      } else if (realMode) {
        configs.mode = 'real';
      } else if (emulatorMode) {
        configs.mode = 'emulator';
      }
    }

    if (options.browsers && typeof options.browsers !== 'boolean') {
      const chrome = options.browsers.includes('chrome');
      const firefox = options.browsers.includes('firefox');

      if (options.browsers.includes('none')) {
        configs.browsers = 'none';
      } else if (chrome && firefox) {
        configs.browsers = 'both';
      } else if (chrome) {
        configs.browsers = 'chrome';
      } else if (firefox) {
        configs.browsers = 'firefox';
      }
    }

    return configs;
  }

  async getSetupConfigs(options: Options): Promise<SetupConfigs> {
    const configs = this.getConfigFromOptions(options);

    return await prompt(SETUP_CONFIG_QUES, configs);
  }

  checkBinariesPresent(binaries: SdkBinary[]): SdkBinary[] {
    const missingBinaries: SdkBinary[] = [];

    for (const binaryName of binaries) {
      const binaryPath = getBinaryLocation(this.sdkRoot, this.platform, binaryName);
      if (!binaryPath) {
        missingBinaries.push(binaryName);
      }
    }
    console.log();

    return missingBinaries;
  }

  checkBinariesWorking(binaries: SdkBinary[]): SdkBinary[] {
    const nonWorkingBinaries: SdkBinary[] = [];

    for (const binaryName of binaries) {
      const binaryPath = getBinaryLocation(this.sdkRoot, this.platform, binaryName, true);

      let cmd = '--version';
      if (binaryName === 'emulator') {
        cmd = '-version';
      } else if (binaryName === 'avdmanager') {
        cmd = 'list avd';
      }

      if (binaryPath) {
        const binaryWorking = execBinarySync(binaryPath, binaryName, this.platform, cmd);
        if (binaryWorking === null) {
          nonWorkingBinaries.push(binaryName);
        }
      } else {
        nonWorkingBinaries.push(binaryName);
      }
    }
    console.log();

    return nonWorkingBinaries;
  }

  verifyAvdPresent(): boolean {
    const avdLocation = getBinaryLocation(this.sdkRoot, this.platform, 'avdmanager', true);
    if (!avdLocation) {
      return false;
    }

    let stdout = execBinarySync(
      avdLocation,
      'avdmanager',
      this.platform,
      'list avd'
    );

    if (stdout !== null) {
      const nonWorkingAvdsIndex = stdout.indexOf('could not be loaded');

      if (nonWorkingAvdsIndex > -1) {
        stdout = stdout.slice(0, nonWorkingAvdsIndex);
      }

      if (stdout.includes(NIGHTWATCH_AVD)) {
        return true;
      }
    }

    return false;
  }

  verifyAdbRunning() {
    console.log('Making sure adb is running...');

    const adbLocation = getBinaryLocation(this.sdkRoot, this.platform, 'adb', true);
    if (!adbLocation) {
      console.log(`  ${colors.red(symbols().fail)} ${colors.cyan('adb')} binary not found.\n`);

      return;
    }

    const serverStarted = execBinarySync(
      adbLocation,
      'adb',
      this.platform,
      'start-server'
    );

    if (serverStarted !== null) {
      console.log(`${colors.green('Success!')} adb server is running.\n`);
    } else {
      console.log('Please try running the above command by yourself.\n');
    }
  }

  verifySetup(setupConfigs: SetupConfigs): string[] {
    const missingRequirements: string[] = [];

    if (setupConfigs.mode === 'real') {
      console.log('Verifying the setup requirements for real devices...');
    } else if (setupConfigs.mode === 'emulator') {
      console.log('Verifying the setup requirements for Android emulator...');
    } else {
      console.log('Verifying the setup requirements for real devices/emulator...');
    }

    const requiredBinaries: SdkBinary[] = ['adb'];

    if (setupConfigs.mode !== 'real') {
      requiredBinaries.push('avdmanager', 'emulator');
    }

    const missingBinaries = this.checkBinariesPresent(requiredBinaries);
    missingRequirements.push(...missingBinaries);

    // check for platforms subdirectory (required by emulator)
    if (requiredBinaries.includes('emulator')) {
      const platormsPath = path.join(this.sdkRoot, 'platforms');
      if (fs.existsSync(platormsPath)) {
        console.log(
          `  ${colors.green(symbols().ok)} ${colors.cyan('platforms')} subdirectory is present at '${platormsPath}'\n`
        );
      } else {
        console.log(
          `  ${colors.red(symbols().fail)} ${colors.cyan('platforms')} subdirectory not present at '${platormsPath}'\n`
        );
        missingRequirements.push('platforms');
      }

      const avdPresent = this.verifyAvdPresent();
      if (avdPresent) {
        console.log(
          `  ${colors.green(symbols().ok)} ${colors.cyan(NIGHTWATCH_AVD)} AVD is present and ready to be used.\n`
        );
      } else {
        console.log(`  ${colors.red(symbols().fail)} ${colors.cyan(NIGHTWATCH_AVD)} AVD not found.\n`);

        missingRequirements.push(NIGHTWATCH_AVD);
      }
    }

    const binariesPresent = requiredBinaries.filter((binary) => !missingBinaries.includes(binary));
    if (binariesPresent.length) {
      const nonWorkingBinaries = this.checkBinariesWorking(binariesPresent);

      missingRequirements.push(...nonWorkingBinaries);
    }

    if (missingRequirements.length === 0) {
      this.verifyAdbRunning();

      console.log('Great! All the requirements are being met.');

      if (setupConfigs.mode === 'real') {
        console.log('You can go ahead and run your tests now on your Android device.\n');
      } else {
        console.log('You can go ahead and run your tests now on an Android device/emulator.\n');
      }
    } else if (!this.options.setup) {
      console.log(`Some requirements are missing: ${missingRequirements.join(', ')}`);
      console.log(`Please use ${colors.magenta('--setup')} flag with the command to install all the missing requirements.\n`);
    }

    return missingRequirements;
  }

  async setupAndroid(setupConfigs: SetupConfigs, missingRequirements: string[]): Promise<boolean> {
    if (missingRequirements.length === 0) {
      return true;
    }

    if (setupConfigs.mode === 'real') {
      console.log('Setting up missing requirements for real devices...\n');
    } else if (setupConfigs.mode === 'emulator') {
      console.log('Setting up missing requirements for Android emulator...\n');
    } else {
      console.log('Setting up missing requirements for real devices/emulator...\n');
    }

    // check if sdkmanager is present and working (below line will check both)
    console.log('Verifying that sdkmanager is present and working...');
    const sdkManagerWorking = this.checkBinariesWorking(['sdkmanager']).length === 0;

    if (!sdkManagerWorking || missingRequirements.includes('avdmanager')) {
      // remove avdmanager from missingRequirements to avoid double downloads.
      const avdmanagerIndex = missingRequirements.indexOf('avdmanager');
      if (avdmanagerIndex > -1) {
        missingRequirements.splice(avdmanagerIndex, 1);
      }

      console.log('Downloading cmdline-tools...');
      await downloadAndSetupAndroidSdk(this.sdkRoot, this.platform);
    }

    const packagesToInstall = missingRequirements
      .filter((requirement) => Object.keys(BINARY_TO_PACKAGE_NAME).includes(requirement))
      .map((binary) => BINARY_TO_PACKAGE_NAME[binary as SdkBinary | typeof NIGHTWATCH_AVD]);

    // Update emulator as well
    if (setupConfigs.mode !== 'real' && !missingRequirements.includes('emulator')) {
      packagesToInstall.push(BINARY_TO_PACKAGE_NAME['emulator']);
    }

    let result = installPackagesUsingSdkManager(
      getBinaryLocation(this.sdkRoot, this.platform, 'sdkmanager', true),
      this.platform,
      packagesToInstall
    );

    if (missingRequirements.includes('platforms')) {
      console.log('Creating platforms subdirectory...');

      const platformsPath = path.join(this.sdkRoot, 'platforms');
      try {
        fs.mkdirSync(platformsPath);
        // eslint-disable-next-line
      } catch {}

      console.log(`${colors.green('Success!')} Created platforms subdirectory at ${platformsPath}\n`);
    }

    if (missingRequirements.includes(NIGHTWATCH_AVD)) {
      // Check if AVD is already created and only the system-image was missing.
      const avdPresent = this.verifyAvdPresent();
      if (!avdPresent) {
        console.log(`Creating AVD "${NIGHTWATCH_AVD}" using pixel_5 hardware profile...`);

        const avdCreated = execBinarySync(
          getBinaryLocation(this.sdkRoot, this.platform, 'avdmanager', true),
          'avdmanager',
          this.platform,
          `create avd --force --name "${NIGHTWATCH_AVD}" --package "system-images;android-30;google_apis;${ABI}" --device "pixel_5"`
        );

        if (avdCreated !== null) {
          console.log(`${colors.green('Success!')} AVD "${NIGHTWATCH_AVD}" created successfully!\n`);
        } else {
          console.log();
          result = false;
        }
      }
    }

    this.verifyAdbRunning();

    if (result) {
      console.log('Success! All requirements are set.');
      if (setupConfigs.mode === 'real') {
        console.log('You can go ahead and run your tests now on your Android device.\n');
      } else {
        console.log('You can go ahead and run your tests now on an Android device/emulator.\n');
      }
    } else {
      console.log('Some requirements failed to set up.');
      console.log('Please try running the failed commands by yourself and then re-run this tool.\n');

      console.log('If it still fails, please raise an issue with us at:');
      console.log(colors.cyan('  https://github.com/nightwatchjs/mobile-helper-tool/issues'), '\n');
    }

    return result;
  }

  sdkRootEnvSetInstructions() {
    console.log(colors.red('IMPORTANT'));
    console.log(colors.red('---------'));

    if (this.otherInfo.androidHomeInGlobalEnv && process.env.ANDROID_HOME === '') {
      console.log(`${colors.cyan('ANDROID_HOME')} env is set to '' which is NOT a valid path!\n`);
      console.log(`Please set ${colors.cyan('ANDROID_HOME')} to '${this.sdkRoot}' in your environment variables.`);
      console.log('(As ANDROID_HOME env is already set, temporarily saving it to .env won\'t work.)\n');
    } else {
      console.log(
        `${colors.cyan('ANDROID_HOME')} env was temporarily saved in ${colors.cyan(
          '.env'
        )} file (set to '${this.sdkRoot}').\n`
      );
      console.log(`Please set ${colors.cyan(
        'ANDROID_HOME'
      )} env to '${this.sdkRoot}' globally and then delete it from ${colors.cyan('.env')} file.`);
    }

    console.log('Doing this now might save you from future troubles.\n');
  }

  async verifyAndSetupBrowsers(browsers: SetupConfigs['browsers']): Promise<boolean> {
    if (!browsers || browsers === 'none') {
      return true;
    }

    const status = {
      // verify true by default
      // (turn to false only when browser not found)
      verifyFirefox: true,
      verifyChrome: true,
      // setup false by default
      // (turn to true only when setup complete)
      setupFirefox: false,
      setupChrome: false
    };

    const verifyFirefox = ['firefox', 'both'].includes(browsers);
    const verifyChrome = ['chrome', 'both'].includes(browsers);

    let firefoxLatestVersion = '';
    let installedChromeVersion = DEFAULT_CHROME_VERSION;

    let installFirefox = false;
    let downloadChromedriver = false;

    console.log(`${colors.cyan('Last bit:')} Verifying if browser(s) are installed...\n`);

    const emulatorAlreadyRunning = await getAlreadyRunningAvd(this.sdkRoot, this.platform, NIGHTWATCH_AVD);

    const emulatorId = emulatorAlreadyRunning || await launchAVD(this.sdkRoot, this.platform, NIGHTWATCH_AVD);

    if (!emulatorId) {
      console.log('Please close the emulator manually if running and not closed automatically.\n');

      return false;
    }

    console.log('Making sure adb has root permissions...');
    const adbRootStdout = execBinarySync(
      getBinaryLocation(this.sdkRoot, this.platform, 'adb', true),
      'adb',
      this.platform,
      `-s ${emulatorId} root`
    );
    if (adbRootStdout !== null) {
      console.log(`  ${colors.green(symbols().ok)} adb is running with root permissions!\n`);
    } else {
      console.log('Please try running the above command by yourself.\n');
    }

    if (verifyFirefox) {
      firefoxLatestVersion = await getLatestVersion('firefox');

      console.log('Verifying if Firefox is installed...');
      const stdout = execBinarySync(
        getBinaryLocation(this.sdkRoot, this.platform, 'adb', true),
        'adb',
        this.platform,
        `-s ${emulatorId} shell pm list packages org.mozilla.firefox`
      );
      if (stdout) {
        console.log(`  ${colors.green(symbols().ok)} Firefox browser is installed in the AVD.\n`);

        console.log('Checking the version of installed Firefox browser...');
        const versionStdout = execBinarySync(
          getBinaryLocation(this.sdkRoot, this.platform, 'adb', true),
          'adb',
          this.platform,
          `-s ${emulatorId} shell dumpsys package org.mozilla.firefox`
        );

        if (versionStdout !== null) {
          const versionMatch = versionStdout.match(/versionName=((\d+\.)+\d+)/);
          if (!versionMatch) {
            console.log(`  ${colors.red(symbols().fail)} Failed to find the version of the Firefox browser installed.\n`);
          } else if (versionMatch[1] !== firefoxLatestVersion) {
            const currentMajorVersion = parseInt(versionMatch[1].split('.')[0], 10);
            const latestMajorVersion = parseInt(firefoxLatestVersion.split('.')[0], 10);

            if (firefoxLatestVersion === DEFAULT_FIREFOX_VERSION && currentMajorVersion >= latestMajorVersion) {
              console.log(`  ${colors.red(symbols().fail)} Failed to fetch the latest version of Firefox browser.\n`);
            } else {
              console.log(`A new version of Firefox browser is available (${colors.cyan(versionMatch[1] + ' -> ' + firefoxLatestVersion)})\n`);
              installFirefox = true;
            }
          } else {
            console.log(`  ${colors.green(symbols().ok)} Your Firefox browser is up-to-date.\n`);
          }
        } else {
          console.log('Could not get the version of the installed Firefox browser.\n');
        }
      } else if (stdout !== null) {
        console.log(`  ${colors.red(symbols().fail)} Firefox browser not found in the AVD.\n`);
        installFirefox = true;
        status.verifyFirefox = false;
      } else {
        // Command failed.
        console.log('Failed to verify the presence of Firefox browser.\n');
        status.verifyFirefox = false;
      }
    }

    if (verifyChrome) {
      console.log('Verifying if Chrome is installed...');
      const stdout = execBinarySync(
        getBinaryLocation(this.sdkRoot, this.platform, 'adb', true),
        'adb',
        this.platform,
        `-s ${emulatorId} shell pm list packages com.android.chrome`
      );
      if (stdout) {
        console.log(`  ${colors.green(symbols().ok)} Chrome browser is installed in the AVD.\n`);

        console.log('Checking the version of installed Chrome browser...');
        const versionStdout = execBinarySync(
          getBinaryLocation(this.sdkRoot, this.platform, 'adb', true),
          'adb',
          this.platform,
          `-s ${emulatorId} shell dumpsys package com.android.chrome`
        );

        if (versionStdout !== null) {
          const versionMatch = versionStdout.match(/versionName=((\d+\.)+\d+)/);
          if (!versionMatch) {
            console.log(`  ${colors.red(symbols().fail)} Failed to find the version of the Chrome browser installed.\n`);
          } else {
            console.log(`Version: ${colors.green(versionMatch[1])}\n`);
            installedChromeVersion = versionMatch[1];
          }

          console.log(`${colors.yellow('Note:')} Automatic upgrade of Chrome browser is not supported yet.\n`);
          // console.log('You can upgrade the browser by using Play Store in the emulator if need be.');
        } else {
          console.log('Could not get the version of the installed Chrome browser.\n');
        }

        downloadChromedriver = true;
      } else if (stdout !== null) {
        console.log(`  ${colors.red(symbols().fail)} Chrome browser not found in the AVD.\n`);
        console.log(`${colors.yellow('Note:')} Automatic installation of Chrome browser is not supported yet.\n`);
        status.verifyChrome = false;
      } else {
        // Command failed.
        console.log('Failed to verify the presence of Chrome browser.\n');
        status.verifyChrome = false;
      }
    }

    if (this.options.setup) {
      if (installFirefox) {
        console.log('Downloading latest Firefox APK...');

        const firefoxDownloaded = await downloadFirefoxAndroid(firefoxLatestVersion);
        if (firefoxDownloaded) {
          console.log('\nInstalling the downloaded APK in the running AVD...');

          const stdout = execBinarySync(
            getBinaryLocation(this.sdkRoot, this.platform, 'adb', true),
            'adb',
            this.platform,
            `-s ${emulatorId} install -r ${path.join(os.tmpdir(), getFirefoxApkName(firefoxLatestVersion))}`
          );

          if (stdout !== null) {
            console.log(`  ${colors.green(symbols().ok)} Firefox browser installed successfully!\n`);
            console.log(`${colors.green('Success!')} You can run your tests now on your Android Emulator's Firefox browser.\n`);
            status.setupFirefox = true;
          } else {
            console.log('Please try running the above command by yourself (make sure that the emulator is running).\n');
          }
        } else {
          console.log(`\n${colors.red('Failed!')} Please download the latest version of Firefox from the below link.`);
          console.log('(Drag-and-drop the downloaded APK over the emulator screen to install.)');
          console.log(colors.cyan('  https://archive.mozilla.org/pub/fenix/releases'), '\n');
        }
      }
    }

    if (!emulatorAlreadyRunning) {
      console.log('Closing emulator...');
      execBinarySync(getBinaryLocation(this.sdkRoot, this.platform, 'adb', true), 'adb', this.platform, `-s ${emulatorId} emu kill`);
      console.log('Emulator will close shortly. If not, please close it manually.\n');
    }

    if (this.options.setup && downloadChromedriver) {
      if (installedChromeVersion === DEFAULT_CHROME_VERSION) {
        console.log('Downloading chromedriver to work with the factory version of Chrome browser...');

        const chromedriverDownloadDir = path.join(this.rootDir, 'chromedriver-mobile');
        const chromedriverDownloadPath = path.join(chromedriverDownloadDir, getBinaryNameForOS(this.platform, 'chromedriver'));

        const result = await downloadWithProgressBar(
          DOWNLOADS.chromedriver[this.platform],
          chromedriverDownloadDir,
          true
        );

        if (result) {
          console.log(`${colors.green('Done!')} chromedriver downloaded at '${chromedriverDownloadPath}'\n`);
          console.log(`${colors.green('Success!')} You can run your tests now on your Android Emulator's Chrome browser.\n`);
          status.setupChrome = true;
        } else {
          console.log(`\n${colors.red('Failed!')} You can download the chromedriver yourself from the below link:`);
          console.log(colors.cyan(`  ${DOWNLOADS.chromedriver[this.platform]}`));
          console.log(
            '  (Extract and copy the chromedriver binary and paste it in your Nightwatch project inside \'chromedriver-mobile\' folder.)',
            '\n'
          );
        }
      } else {
        console.log(colors.cyan('[CHROMEDRIVER]'));
        console.log('Installed Chrome browser version is different from factory version.\n');
        console.log('You can download the chromedriver for current version from the below link:');
        console.log(colors.cyan('  https://chromedriver.storage.googleapis.com/index.html'));
        console.log(
          '  (Extract and copy the chromedriver binary and paste it in your Nightwatch project inside \'chromedriver-mobile\' folder.)',
          '\n'
        );
        status.setupChrome = true;  // because we have done what we could do, i.e., setup from our side is complete.
      }
    }

    // below is true by default
    // will turn to false if some verify step has failed
    // and for it to turn back to true, corresponding setup step should pass.
    return (status.verifyFirefox || status.setupFirefox) && (status.verifyChrome || status.setupChrome);
  }
}
