import colors from 'ansi-colors';
import fs from 'fs';
import path from 'path';
import which from 'which';
import {execSync} from 'child_process';
import {prompt} from 'inquirer';

import {getPlatformName, symbols} from '../../utils';
import {SDK_BINARY_LOCATIONS, SETUP_CONFIG_QUES} from './constants';
import {BinaryLocationInterface, Options, SetupConfigs} from './interfaces';
import {getBinaryNameForOS} from './utils';


export class AndroidSetup {
  sdkRoot: string;
  options: Options;
  cwd: string;
  platform: 'windows' | 'mac' | 'linux';
  binaryLocation: {[key: string]: string};

  constructor(options: Options, cwd = process.cwd()) {
    this.sdkRoot = '';
    this.options = options;
    this.cwd = cwd;
    this.platform = getPlatformName();
    this.binaryLocation = {};
  }

  async run() {
    if (this.options.help) {
      this.showHelp();

      return true;
    }

    this.sdkRoot = this.getSdkRoot();
    if (this.sdkRoot === '') {
      return false;
    }

    const setupConfigs: SetupConfigs = await this.getSetupConfigs(this.options);
    console.log();

    const missingRequirements = this.verifySetup(setupConfigs);

    if (missingRequirements.length === 0) {
      console.log('Great! All the requirements are being met.');
      console.log('You can go ahead and run your tests now on an Android device/emulator.');
    } else if (this.options.setup) {
      await this.setupAndroid(missingRequirements);
    } else {
      console.log(`Some requirements are missing: ${missingRequirements.join(', ')}`);
      console.log(`Please use ${colors.magenta('--setup')} flag with the command to install all the missing requirements.`);

      return false;
    }

    return true;
  }

  showHelp() {
    console.log('Help menu for android');
  }

  getSdkRoot(): string {
    console.log('Checking the value of ANDROID_HOME environment variable...');

    const androidHome = process.env.ANDROID_HOME;
    if (androidHome) {
      console.log(
        `  ${colors.green(symbols().ok)} ANDROID_HOME is set to '${androidHome}'\n`
      );

      return androidHome;
    }

    if (typeof androidHome === 'undefined') {
      console.log(
        `  ${colors.red(symbols().fail)} ANDROID_HOME environment variable is NOT set!'\n`
      );
    } else {
      console.log(
        `  ${colors.red(symbols().fail)} ANDROID_HOME is set to '${androidHome} which is NOT a valid path!'\n`
      );
    }

    // if real device, verifying if all the requirements are present in known locations or added to PATH beforehand (only applicable for adb).

    return '';
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

  getBinaryLocation(binaryName: keyof BinaryLocationInterface, suppressOutput = false) {
    const failLocations: string[] = [];

    const binaryFullName = getBinaryNameForOS(this.platform, binaryName);

    const pathToBinary = path.join(this.sdkRoot, SDK_BINARY_LOCATIONS[binaryName], binaryFullName);
    if (fs.existsSync(pathToBinary)) {
      this.binaryLocation[binaryName] = pathToBinary;

      if (!suppressOutput) {
        console.log(
          `  ${colors.green(symbols().ok)} ${colors.cyan(binaryName)} binary is present at '${pathToBinary}'`
        );
      }

      return pathToBinary;
    }
    failLocations.push(pathToBinary);

    if (binaryName === 'adb') {
      // look for adb in sdkRoot (as it can be executed directly).
      const adbPath = path.join(this.sdkRoot, binaryFullName);
      if (fs.existsSync(adbPath)) {
        this.binaryLocation[binaryName] = adbPath;

        if (!suppressOutput) {
          console.log(
            `  ${colors.green(symbols().ok)} ${colors.cyan(binaryName)} binary is present at '${adbPath}'`
          );
        }

        return adbPath;
      }
      failLocations.push(adbPath);

      // Look for adb in PATH also (runnable as `adb -version`)
      const adbLocation = which.sync(binaryFullName, {nothrow: true});
      if (adbLocation) {
        this.binaryLocation[binaryName] = 'PATH';  // adb is available in PATH.

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

  checkBinariesPresent(binaries: Array<keyof BinaryLocationInterface>) {
    const missingBinaries: Array<keyof BinaryLocationInterface> = [];

    for (const binaryName of binaries) {
      const binaryPath = this.getBinaryLocation(binaryName);
      if (!binaryPath) {
        missingBinaries.push(binaryName);
      }
    }

    return missingBinaries;
  }

  execBinary(binaryLocation: string, binaryName: string, args: string) {
    if (binaryLocation === 'PATH') {
      const binaryFullName = getBinaryNameForOS(this.platform, binaryName);
      const cmd = `${binaryFullName} ${args}`;

      try {
        execSync(cmd, {
          stdio: 'pipe'
        });

        return true;
      } catch {
        console.log(
          `  ${colors.red(symbols().fail)} Failed to run ${colors.cyan(cmd)}`
        );

        return false;
      }
    }

    const binaryFullName = path.basename(binaryLocation);
    const binaryDirPath = path.dirname(binaryLocation);
    let cmd: string;

    if (this.platform === 'windows') {
      cmd = `${binaryFullName} ${args}`;
    } else {
      cmd = `./${binaryFullName} ${args}`;
    }

    try {
      execSync(cmd, {
        stdio: 'pipe',
        cwd: binaryDirPath
      });

      return true;
    } catch {
      console.log(
        `  ${colors.red(symbols().fail)} Failed to run ${colors.cyan(cmd)} inside '${binaryDirPath}'`
      );

      return false;
    }
  }

  checkBinariesWorking(binaries: Array<keyof BinaryLocationInterface>) {
    const nonWorkingBinaries: Array<keyof BinaryLocationInterface> = [];

    for (const binaryName of binaries) {
      const binaryPath = this.binaryLocation[binaryName]
        ? this.binaryLocation[binaryName]
        : this.getBinaryLocation(binaryName);

      if (binaryPath) {
        const binaryWorking = this.execBinary(binaryPath, binaryName, '--version');
        if (!binaryWorking) {
          nonWorkingBinaries.push(binaryName);
        }
      } else {
        nonWorkingBinaries.push(binaryName);
      }
    }

    return nonWorkingBinaries;
  }

  verifySetup(setupConfigs: SetupConfigs): string[] {
    const missingRequirements: string[] = [];
    let requiredBinaries: Array<keyof BinaryLocationInterface>;

    if (setupConfigs.mode === 'real') {
      console.log('Verifying the setup requirements for real devices...');

      requiredBinaries = ['adb'];
    } else {
      requiredBinaries = [];
    }

    const missingBinaries = this.checkBinariesPresent(requiredBinaries);
    missingRequirements.push(...missingBinaries);

    const binariesPresent = requiredBinaries.filter((binary) => !missingBinaries.includes(binary));
    if (binariesPresent.length) {
      const nonWorkingBinaries = this.checkBinariesWorking(binariesPresent);

      missingRequirements.push(...nonWorkingBinaries);
    }
    // add a blank line
    console.log();

    if (!missingRequirements.includes('adb')) {
      console.log('Making sure adb is running...');

      const serverStarted = this.execBinary(this.binaryLocation['adb'], 'adb', 'start-server');
      if (serverStarted) {
        console.log(`${colors.green('Success!')} adb server is running.`);
      } else {
        console.log('Please try running the above command by yourself.');
      }
      // add a blank line
      console.log();
    }

    return missingRequirements;
  }

  async setupAndroid(missingRequirements: string[]) {
    if (missingRequirements.includes('adb')) {
      // install adb
    }
  }
}
