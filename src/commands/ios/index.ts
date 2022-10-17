import { prompt } from 'inquirer';
import { Options, SetupConfigs } from './interfaces';
import { getPlatformName, iosRealDeviceUUID } from '../../utils';
import { SETUP_CONFIG_QUES } from './constants';
import colors from 'ansi-colors';
import { execSync } from 'child_process';

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
    let result = true;

    if (this.options.help) {
      return this.showHelp();

      return result;
    }

    if (this.platform !== 'mac') {
      console.log('Only macOS is supported');
    }

    const setupConfigs: SetupConfigs = await this.getSetupConfigs(this.options);

    const missingRequirements = this.verifySetup(setupConfigs);

    if (this.options.setup) {
      result = await this.setupIos(setupConfigs, missingRequirements);
    } else if (missingRequirements.length) {
      result = false;
    }

  }

  showHelp() {
    console.log('Help menu for IOS');
  }

  getConfigFromOptions(options: { [key: string]: string | string[] | boolean }) {
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

  verifySetup(setupConfigs: SetupConfigs): string[] {
    const missingRequirements: string[] = [];

    if (setupConfigs.mode === 'simulator' || setupConfigs.mode === 'both') {
      console.log('Verifying the setup requirements for simulators ...');

      try {
        const stdout = execSync("/usr/bin/xcodebuild -version", {
          stdio: 'pipe'
        });
        console.log("\nXcode is installed in your machine :");
        console.log(stdout.toString());

        console.log(`Run the following command to get the list of devices\n` +
          colors.cyan.italic('xcrun simctl list devices') + '\n' +
          `\nAnd then update ${colors.cyan('safari:deviceName')} (eg: 'iphone 13') and ${colors.cyan('safari:platformVersion')} (eg: '15.0') in nightwatch configuration for ${colors.gray.italic('ios.simulator.safari')} environment accordingly.\n`
        );
      } catch (error) {
        missingRequirements.push('Xcode is not installed')
      }
    }

    if (setupConfigs.mode === 'real' || setupConfigs.mode === 'both') {
      console.log('Verifying the setup requirements for real devices...');

      try {
        const stdout = execSync("system_profiler SPUSBDataType | sed -n '/iPhone/,/Serial/p' | grep 'Serial Number:' | awk -F ': ' '{print $2}'", {
          stdio: 'pipe'
        });

        if (stdout.toString() !== '') {
          console.log(
            colors.white(`Update ${colors.gray('UUID')} in Nightwatch configuration for ${colors.gray.italic('ios.real.safari')} environment.`) +
            colors.cyan("\nUUID: " + iosRealDeviceUUID(stdout.toString()) + "\n"));
        } else {
          throw "Device is not connected";
        }
      } catch (error) {
        missingRequirements.push('Device is not connected')
      }
    }

    if (missingRequirements.length === 0) {

      console.log('Great! All the requirements are being met.');

      if (setupConfigs.mode === 'real') {
        console.log('You can go ahead and run your tests now on your iOS device.');
      } else {
        console.log('You can go ahead and run your tests now on an iOS device/simulator.');
      }
    } else if (!this.options.setup) {
      console.log(`Some requirements are missing: ${missingRequirements.join(', ')}`);
      console.log(`Please use ${colors.magenta('--setup')} flag with the command to install all the missing requirements.`);
    }

    return missingRequirements;
  }

  async setupIos(setupConfigs: SetupConfigs, missingRequirements: string[]) {
    if (missingRequirements.length === 0) {
      return true;
    }

    let result = true;

    if (setupConfigs.mode === 'real' || setupConfigs.mode === 'both') {
      console.log('\nSetting up missing requirements for real devices...');

      console.log(colors.cyan("\n   Remote Automation should be turned on (necessary) ") +
        colors.grey.italic("\n   (turn it on via Settings → Safari → Advanced → Remote Automation.)"));

      if (missingRequirements.includes('Device is not connected')) {
        console.log(colors.cyan(`\n   Make sure your device is connected and turned on properly`));

        result = false;
      }
    }

    if (setupConfigs.mode === 'simulator' || setupConfigs.mode === 'both') {
      if (missingRequirements.includes('Xcode is not installed')) {
        console.log('Setting up missing requirements for iOS simulator...\n');

        console.log(`${colors.cyan("   If Xcode is already installed : ")}` +
          `${colors.white("\n     1. Run the following after changing the Xcode app name in the command ")}` +
          `\n        ${colors.grey.italic("sudo xcode-select -switch /Applications/Xcode_x_x.app")}\n` +

          `${colors.cyan("\n   If Xcode is not installed : ")}` +
          `${colors.green("\n     [Easiest Option] : Download via the App Store for the latest version")}` +
          `${colors.white("\n         1. Open the App Store on your mac and Sign in with your Apple credentials")}` +
          `${colors.white("\n         2. Search for Xcode & click install or update. That's it!!")}\n` +
          `${colors.green("\n     [Preferred Option] : Download via the Developer site for a specific version")}` +
          `${colors.white(`\n         1. Navigate to this URL ${colors.grey.italic("https://developer.apple.com/download/more/")}`)}` +
          `${colors.white("\n         2. Sign in with your Apple credentials")}` +
          `${colors.white("\n         3. Type in the version that you like, and download the Xcode_x_x.xip file")}` +
          `${colors.white("\n         4. Once the file is downloaded, click on .xip to extract it.")}` +
          `${colors.white("\n         5. Now click on that Xcode file complete all the installation process")}` +
          `${colors.white("\n         6. After completion drag the Xcode to Applications folder")}`);

        console.log(`${colors.magenta("\n  Follow the guide for more detailed info https://www.freecodecamp.org/news/how-to-download-and-install-xcode/")}\n`);

        result = false;
      }
    }

    if (!result) {
      console.log(`\nRerun the command again with ${colors.magenta('--setup')} flag to verify the setup\n`)
    }

    return result;
  }
}