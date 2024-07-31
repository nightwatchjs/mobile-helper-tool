import colors from 'ansi-colors';
import inquirer from 'inquirer';

import Logger from '../../../../logger';
import {symbols} from '../../../../utils';
import {Platform} from '../../interfaces';
import {getBinaryLocation} from '../../utils/common';
import {execBinaryAsync, execBinarySync} from '../../utils/sdk';
import {getInstalledSystemImages} from '../common';

type DeviceType = 'Nexus' | 'Pixel' | 'Wear OS' | 'Android TV' | 'Desktop' | 'Others';

const deviceTypesToGrepCommand: Record<DeviceType, string> = {
  'Nexus': 'Nexus',
  'Pixel': 'pixel',
  'Wear OS': 'wear',
  'Android TV': 'tv',
  'Desktop': 'desktop',
  'Others': '-Ev "wear|Nexus|pixel|tv|desktop"'
};

export async function createAvd(sdkRoot: string, platform: Platform): Promise<boolean> {
  try {
    const avdmanagerLocation = getBinaryLocation(sdkRoot, platform, 'avdmanager', true);
    if (!avdmanagerLocation) {
      Logger.log(`  ${colors.red(symbols().fail)} ${colors.cyan('avdmanager')} binary not found.\n`);
      Logger.log(`Run: ${colors.cyan('npx @nightwatch/mobile-helper android --standalone')} to setup missing requirements.`);
      Logger.log(`(Remove the ${colors.gray('--standalone')} flag from the above command if setting up for testing.)\n`);

      return false;
    }

    const sdkmanagerLocation = getBinaryLocation(sdkRoot, platform, 'sdkmanager', true);
    if (!sdkmanagerLocation) {
      Logger.log(`  ${colors.red(symbols().fail)} ${colors.cyan('sdkmanager')} binary not found.\n`);
      Logger.log(`Run: ${colors.cyan('npx @nightwatch/mobile-helper android --standalone')} to setup missing requirements.`);
      Logger.log(`(Remove the ${colors.gray('--standalone')} flag from the above command if setting up for testing.)\n`);

      return false;
    }

    const avdNameAnswer = await inquirer.prompt({
      type: 'input',
      name: 'avdName',
      message: 'Enter a name for the AVD:'
    });
    const avdName = avdNameAnswer.avdName;

    const installedSystemImages: string[] = await getInstalledSystemImages(sdkmanagerLocation, platform);
    if (!installedSystemImages.length) {
      return false;
    }

    const systemImageAnswer = await inquirer.prompt({
      type: 'list',
      name: 'systemImage',
      message: 'Select the system image to use for AVD:',
      choices: installedSystemImages
    });
    const systemImage = systemImageAnswer.systemImage;

    const deviceTypes: DeviceType[] = ['Nexus', 'Pixel', 'Wear OS', 'Android TV', 'Desktop', 'Others'];
    const deviceTypeAnswer = await inquirer.prompt({
      type: 'list',
      name: 'deviceType',
      message: 'Select the device type for AVD:',
      choices: deviceTypes
    });
    const deviceType = deviceTypeAnswer.deviceType;

    let cmd = `list devices -c | grep ${deviceTypesToGrepCommand[deviceType as DeviceType]}`;
    const availableDevices = execBinarySync(avdmanagerLocation, 'avdmanager', platform, cmd);

    if (!availableDevices) {
      Logger.log(`${colors.red('No devices found!')} Please try again.`);

      return false;
    }
    const availableDevicesList = availableDevices.split('\n').filter(device => device !== '');
    const deviceAnswer = await inquirer.prompt({
      type: 'list',
      name: 'device',
      message: 'Select the device profile for AVD:',
      choices: availableDevicesList
    });
    const device = deviceAnswer.device;

    Logger.log();
    Logger.log('Creating AVD...');

    cmd = `create avd -n '${avdName}' -k '${systemImage}' -d '${device}'`;
    try {
      const output = await execBinaryAsync(avdmanagerLocation, 'avdmanager', platform, cmd);
      if (output?.includes('100% Fetch remote repository')) {
        Logger.log();
        Logger.log(`${colors.green('AVD created successfully!')}`);

        return true;
      }
    } catch (err) {
      if (typeof err === 'string') {
        if (err.includes('already exists')) {
          // AVD with the same name already exists. Ask user if they want to overwrite it.
          Logger.log();
          Logger.log(`${colors.yellow('AVD with the same name already exists!')}\n`);
          const overwriteAnswer = await inquirer.prompt({
            type: 'confirm',
            name: 'overwrite',
            message: 'Overwrite the existing AVD?'
          });
          Logger.log();

          if (overwriteAnswer.overwrite) {
            cmd += ' --force';
            const output = await execBinaryAsync(avdmanagerLocation, 'avdmanager', platform, cmd);
            if (output?.includes('100% Fetch remote repository')) {
              Logger.log(`${colors.green('AVD created successfully!')}`);

              return true;
            }
          }
        }
      }
    }

    return true;
  } catch (error) {
    Logger.log(colors.red('Error occured while creating AVD.'));
    console.error(error);

    return false;
  }
}

