import colors from 'ansi-colors';
import * as dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import untildify from 'untildify';
import which from 'which';
import {prompt} from 'inquirer';

import {getPlatformName, symbols} from '../../utils';
import {BINARY_TO_PACKAGE_NAME, NIGHTWATCH_AVD, SDK_BINARY_LOCATIONS, SETUP_CONFIG_QUES} from './constants';
import {Options, OtherInfo, Platform, SdkBinary, SetupConfigs} from './interfaces';
import {getAbiForOS, getBinaryNameForOS} from './utils/common';
import {downloadAndSetupAndroidSdk, execBinarySync, getDefaultAndroidSdkRoot, installPackagesUsingSdkManager} from './utils/sdk';


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

  async run() {
    let result = true;

    if (this.options.help) {
      this.showHelp();

      return result;
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

    if (!sdkRootEnv) {
      this.sdkRootEnvSetInstructions();
    }

    return result;
  }

  showHelp() {
    console.log('Help menu for android');
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

  async getSdkRootFromUser() {
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

  getConfigFromOptions(options: {[key: string]: string | string[] | boolean}) {
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

  async getSetupConfigs(options: Options) {
    const configs = this.getConfigFromOptions(options);

    return await prompt(SETUP_CONFIG_QUES, configs);
  }

  getBinaryLocation(binaryName: SdkBinary, suppressOutput = false) {
    const failLocations: string[] = [];

    const binaryFullName = getBinaryNameForOS(this.platform, binaryName);

    const pathToBinary = path.join(this.sdkRoot, SDK_BINARY_LOCATIONS[binaryName], binaryFullName);
    if (fs.existsSync(pathToBinary)) {
      if (!suppressOutput) {
        console.log(
          `  ${colors.green(symbols().ok)} ${colors.cyan(binaryName)} binary is present at '${pathToBinary}'`
        );
      }

      return pathToBinary;
    }
    failLocations.push(pathToBinary);

    if (binaryName === 'adb') {
      // look for adb in sdkRoot (as it is a standalone binary).
      const adbPath = path.join(this.sdkRoot, binaryFullName);
      if (fs.existsSync(adbPath)) {
        if (!suppressOutput) {
          console.log(
            `  ${colors.green(symbols().ok)} ${colors.cyan(binaryName)} binary is present at '${adbPath}'`
          );
        }

        return adbPath;
      }
      failLocations.push(adbPath);

      // Look for adb in PATH also (runnable as `adb --version`)
      const adbLocation = which.sync(binaryFullName, {nothrow: true});
      if (adbLocation) {
        if (!suppressOutput) {
          console.log(
            `  ${colors.green(symbols().ok)} ${colors.cyan(binaryName)} binary is present at '${adbPath}' which is added in 'PATH'`
          );
        }

        return 'PATH';
      }
      failLocations.push('PATH');
    }

    if (!suppressOutput) {
      for (const location of failLocations) {
        console.log(
          `  ${colors.red(symbols().fail)} ${colors.cyan(binaryName)} binary not present at '${location}'`
        );
      }
    }

    return '';
  }

  checkBinariesPresent(binaries: SdkBinary[]) {
    const missingBinaries: SdkBinary[] = [];

    for (const binaryName of binaries) {
      const binaryPath = this.getBinaryLocation(binaryName);
      if (!binaryPath) {
        missingBinaries.push(binaryName);
      }
    }
    console.log();

    return missingBinaries;
  }

  checkBinariesWorking(binaries: SdkBinary[]) {
    const nonWorkingBinaries: SdkBinary[] = [];

    for (const binaryName of binaries) {
      const binaryPath = this.getBinaryLocation(binaryName);

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

  verifyAvdPresent() {
    const avdLocation = this.getBinaryLocation('avdmanager', true);
    if (!avdLocation) {
      return false;
    }

    const stdout = execBinarySync(
      avdLocation,
      'avdmanager',
      this.platform,
      'list avd'
    );

    if (stdout !== null) {
      const workingAvds = stdout.split('---------').filter((avd) => !avd.includes('Error: '));

      if (workingAvds.filter((avd) => avd.includes(NIGHTWATCH_AVD)).length) {
        return true;
      }
    }

    return false;
  }

  verifyAdbRunning() {
    console.log('Making sure adb is running...');

    const adbLocation = this.getBinaryLocation('adb', true);
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
        console.log('You can go ahead and run your tests now on your Android device.');
      } else {
        console.log('You can go ahead and run your tests now on an Android device/emulator.');
      }
    } else if (!this.options.setup) {
      console.log(`Some requirements are missing: ${missingRequirements.join(', ')}`);
      console.log(`Please use ${colors.magenta('--setup')} flag with the command to install all the missing requirements.`);
    }

    return missingRequirements;
  }

  async setupAndroid(setupConfigs: SetupConfigs, missingRequirements: string[]) {
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
      this.getBinaryLocation('sdkmanager', true),
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
          this.getBinaryLocation('avdmanager', true),
          'avdmanager',
          this.platform,
          `create avd --force --name "${NIGHTWATCH_AVD}" --package "system-images;android-30;google_apis;${getAbiForOS()}" --device "pixel_5"`
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
        console.log('You can go ahead and run your tests now on your Android device.');
      } else {
        console.log('You can go ahead and run your tests now on an Android device/emulator.');
      }
    } else {
      console.log('Some requirements failed to set up.');
      console.log('Please try running the failed commands by yourself and then re-run this tool.\n');

      console.log('If it still fails, please raise an issue with us at:');
      console.log(colors.cyan('  https://github.com/nightwatchjs/mobile-helper-tool/issues'));
    }

    return result;
  }

  sdkRootEnvSetInstructions() {
    console.log();
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
}
