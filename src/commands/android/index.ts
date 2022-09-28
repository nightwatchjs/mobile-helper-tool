import colors from 'ansi-colors';
import {prompt} from 'inquirer';

import {getPlatformName, symbols} from '../../utils';
import {SETUP_CONFIG_QUES} from './constants';
import {Options, SetupConfigs} from './interfaces';


export class AndroidSetup {
  androidHome: string;
  options: Options;
  cwd: string;
  platform: 'windows' | 'mac' | 'linux';

  constructor(options: Options, cwd = process.cwd()) {
    this.androidHome = '';
    this.options = options;
    this.cwd = cwd;
    this.platform = getPlatformName();
  }

  async run() {
    if (this.options.help) {
      return this.showHelp();
    }

    this.androidHome = this.getAndroidHome();
    if (this.androidHome === '') {
      return;
    }

    const setupConfigs: SetupConfigs = await this.getSetupConfigs(this.options);

    const missingRequirements = this.verifySetup(setupConfigs);

    await this.setupAndroid(missingRequirements);
  }

  showHelp() {
    console.log('Help menu for android');
  }

  getAndroidHome(): string {
    console.log('Checking the value of ANDROID_HOME environment variable...');

    const androidHome = process.env.ANDROID_HOME;
    if (androidHome) {
      console.log(
        `${colors.green(symbols().ok)} ANDROID_HOME is set to '${androidHome}'\n`
      );

      return androidHome;
    }

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

  verifySetup(setupConfigs: SetupConfigs): string[] {
    if (setupConfigs.mode === 'real') {
      console.log('Checking the setup requirements for real devices...');

    }

    return ['sdkmanager'];
  }

  async setupAndroid(missingRequirements: string[]) {
    if (missingRequirements.includes('adb')) {
      // install adb
    }
  }
}
