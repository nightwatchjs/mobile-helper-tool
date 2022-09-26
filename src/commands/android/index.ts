import {ParsedArgs} from 'minimist';

import {SetupConfigs} from './interfaces';


export class AndroidSetup {
  androidHome: string;
  options: Omit<ParsedArgs, '_'>;

  constructor(options: Omit<ParsedArgs, '_'>) {
    this.androidHome = '';
    this.options = options;
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
    return '';
  }

  async getSetupConfigs(options: Omit<ParsedArgs, '_'>) {
    return options;
  }

  verifySetup(setupConfigs: SetupConfigs): string[] {
    if (setupConfigs.mode === 'real') {
      // check for adb only
    }

    return [];
  }

  async setupAndroid(missingRequirements: string[]) {
    if (missingRequirements.includes('adb')) {
      // install adb
    }
  }
}
