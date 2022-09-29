import {prompt} from 'inquirer';
import {Options, SetupConfigs} from './interfaces';
import {getPlatformName} from '../../utils';
import {SETUP_CONFIG_QUES} from './constants';

const exec = require('child_process').exec;
// const { spawn } = require('child_process')

export class IosSetup {
  options: Options;
  cwd: string;
  platform: 'windows' | 'mac' | 'linux';

  constructor(options: Options, cwd = process.cwd()) {
    this.options = options;
    this.cwd = cwd;
    this.platform = getPlatformName();
  }

  async run() {
    if (this.options.help) {
      return this.showHelp();
    }

    if(this.platform !== 'mac') {
        console.log('Only macOS is supported');
    }

    const setupConfigs: SetupConfigs = await this.getSetupConfigs(this.options);

    const missingRequirements = this.verifySetup(setupConfigs);

    await this.setupIOS(missingRequirements);
  }

  showHelp() {
    console.log('Help menu for IOS');
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
    
    return configs;
  }

  async getSetupConfigs(options: Options) {
    const configs = this.getConfigFromOptions(options);

    return await prompt(SETUP_CONFIG_QUES, configs);
  }

  verifySetup(setupConfigs: SetupConfigs): string[] {
    if (setupConfigs.mode === 'real' || setupConfigs.mode === 'both') {
      console.log('Checking the setup requirements for real devices...');

      exec(`system_profiler SPUSBDataType | sed -n '/iPhone/,/Serial/p' | grep "Serial Number:" | awk -F ": " '{print $2}'`, 
        (err: any, stdout: any, stderr: any) => {
          if(err || stderr) { 
            console.log('\nEither your device is not connected with your system');
            console.log('Or you haven\'t given remote access\n' )
          } else {
            console.log('UUID: ' + stdout);
          }
        }
      );
    }

    if(setupConfigs.mode === 'emulator' || setupConfigs.mode === 'both') {
      console.log('Checking the setup requirements on emulator devices...');

      exec(`/usr/bin/xcodebuild -version`, 
        (err: any, stdout: any, stderr: any) => {
          if(err || stderr) { 
            console.log('\nFollow the guide to install Xcode https://www.freecodecamp.org/news/how-to-download-and-install-xcode/');
          } else {
            console.log('Xcode is installed in your machine \n' + stdout);
          }
        }
      );
    }

    return [];
  }

  async setupIOS(missingRequirements: string[]) {
    if (missingRequirements.includes('xcode')) {
      // install xcode
    }
  }
}
