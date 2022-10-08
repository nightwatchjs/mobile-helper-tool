import {prompt} from 'inquirer';
import {Options, SetupConfigs} from './interfaces';
import {getPlatformName, iosRealDeviceUUID} from '../../utils';
import {SETUP_CONFIG_QUES} from './constants';
import colors from 'ansi-colors';
import { execSync} from 'child_process';

export class IosSetup {
  options: Options;
  cwd: string;
  platform: 'windows' | 'mac' | 'linux';
  step: number;

  constructor(options: Options, cwd = process.cwd()) {
    this.options = options;
    this.cwd = cwd;
    this.platform = getPlatformName();
    this.step = 1;
  }

  async run() {
    if (this.options.help) {
      return this.showHelp();
    }

    if(this.platform !== 'mac') {
        console.log('Only macOS is supported');
    }

    console.log(colors.red(`\n${this.step}. `) + 
      colors.green("(Skip if done) Run `safaridriver --enable` once. (If you're upgrading from a previous macOS release, you may need to use sudo.)\n"))

    this.step++;

    const setupConfigs: SetupConfigs = await this.getSetupConfigs(this.options);

    this.verifySetup(setupConfigs);
  }

  showHelp() {
    console.log('Help menu for IOS');
  }

  getConfigFromOptions(options: {[key: string]: string | string[] | boolean}) {
    const configs: SetupConfigs = {};

    if (options.mode && typeof options.mode !== 'boolean') {
      const realMode = options.mode.includes('real');
      const simulatorMode = options.mode.includes('simulator');

      if (realMode && simulatorMode) {
        configs.mode = 'both';
      } else if (realMode) {
        configs.mode = 'real';
      } else if (simulatorMode) {
        configs.mode = 'simulator';
      }
    }
    
    return configs;
  }

  async getSetupConfigs(options: Options) {
    const configs = this.getConfigFromOptions(options);

    return await prompt(SETUP_CONFIG_QUES, configs);
  }

  verifySetup(setupConfigs: SetupConfigs) {
    if (setupConfigs.mode === 'real' || setupConfigs.mode === 'both') {
      console.log('Verifying the setup requirements for real devices...');

      console.log(colors.red(`\n${this.step}. `) + 
        colors.green("(Skip if done) To enable Remote Automation, toggle the setting  ") +
                        colors.grey.italic("\nSettings → Safari → Advanced → Remote Automation."));
      
      this.step++;

      try {
        const stdout = execSync("system_profiler SPUSBDataType | sed -n '/iPhone/,/Serial/p' | grep 'Serial Number:' | awk -F ': ' '{print $2}'", {
          stdio: 'pipe'
        });

        if (stdout.toString() !== '') {
          console.log(colors.red(`\n${this.step}. `) + 
            colors.green(`Update ${colors.gray('UUID')} in Nightwatch configuration for ${colors.gray.italic('ios.real')} environment.`) +
            colors.cyanBright("\nUUID: " + iosRealDeviceUUID(stdout.toString()) + "\n"));
        } else {
          throw "Device is not connected";
        }
      } catch (error) {
        console.log(colors.red(`\n${this.step}. `) + 
          colors.green("Connect the device with your system properly and make sure the device is not locked \n"));
        
        return;
      }
    }

    if(setupConfigs.mode === 'simulator' || setupConfigs.mode === 'both') {
      console.log('Verifying the setup requirements for simulators ...');

      try {
        const stdout = execSync("/usr/bin/xcodebuild -version", {
          stdio: 'pipe'
        });
        console.log(colors.cyan("\nXcode is installed in your machine :"));
        console.log(colors.yellow(`${stdout}`));

        console.log(colors.red(`${this.step}. `) + 
          colors.green(`Update ${colors.gray('deviceName')} and ${colors.gray('platformVersion')} in Nightwatch Configuration for ${colors.gray.italic('ios.simulator')} environment.\n`) +
          colors.cyan(`   Run the following command to get the list of devices where you can find ${colors.gray('deviceName')} and ${colors.gray('platformVersion')} \n` + 
          colors.grey.italic('   xcrun simctl list devices')
          )
        );

        this.step++;
        
      } catch (error) {
        console.log(colors.red(`\n${this.step}. `) + 
          `${colors.yellow("If Xcode is already installed : ")}` +
                        `${colors.cyan("\n     1. Run the following after changing the Xcode app name in the command ")}` +
                        `\n        ${colors.grey.italic("sudo xcode-select -switch /Applications/Xcode_x_x.app")}\n` +

                        `${colors.yellow("\n   If Xcode is not installed : ")}` +
                        `${colors.cyan("\n     [Easiest Option] : Download via the App Store for the latest version")}` + 
                        `${colors.green("\n         1. Open the App Store on your mac and Sign in with your Apple credentials")}` +
                        `${colors.green("\n         2. Search for Xcode & click install or update. That's it!!")}\n` + 
                        `${colors.cyan("\n     [Preferred Option] : Download via the Developer site for a specific version")}` + 
                        `${colors.green(`\n         1. Navigate to this URL ${colors.grey.italic("https://developer.apple.com/download/more/")}`)}` + 
                        `${colors.green("\n         2. Sign in with your Apple credentials")}` +
                        `${colors.green("\n         3. Type in the version that you like, and download the Xcode_x_x.xip file")}` +
                        `${colors.green("\n         4. Once the file is downloaded, click on .xip to extract it.")}` +
                        `${colors.green("\n         5. Now click on that Xcode file complete all the installation process")}` +
                        `${colors.green("\n         6. After completion drag the Xcode to Applications folder")}`);
            
        console.log(`${colors.yellow("\n  Follow the guide for more detailed info https://www.freecodecamp.org/news/how-to-download-and-install-xcode/")}\n`);

        return;
      }
    }

    console.log('\nMake sure all above steps are done.')
    console.log('Great! All the requirements are being met.');

    if (setupConfigs.mode === 'real') {
      console.log('You can go ahead and run your tests now on your iOS device.');
    } else if (setupConfigs.mode === 'simulator') {
      console.log('You can go ahead and run your tests now on an iOS simulator.');
    } else {
      console.log('You can go ahead and run your tests now on an iOS device/simulator.');
    }
  }
}
