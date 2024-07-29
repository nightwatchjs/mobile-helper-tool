import colors from 'ansi-colors';
import ADB from 'appium-adb';
import {existsSync} from 'fs';
import inquirer from 'inquirer';
import {homedir} from 'os';
import path from 'path';

import Logger from '../../../../logger';
import {symbols} from '../../../../utils';
import {Options, Platform} from '../../interfaces';
import {getBinaryLocation} from '../../utils/common';
import {execBinaryAsync} from '../../utils/sdk';

export async function installApp(options: Options, sdkRoot: string, platform: Platform): Promise<boolean> {
  try {
    const adbLocation = getBinaryLocation(sdkRoot, platform, 'adb', true);
    if (!adbLocation) {
      Logger.log(`  ${colors.red(symbols().fail)} ${colors.cyan('adb')} binary not found.\n`);
      Logger.log(`Run: ${colors.cyan('npx @nightwatch/mobile-helper android --standalone')} to setup missing requirements.`);
      Logger.log(`(Remove the ${colors.gray('--standalone')} flag from the above command if setting up for testing.)\n`);

      return false;
    }

    const adb = await ADB.createADB({allowOfflineDevices: true});
    const devices = await adb.getConnectedDevices();

    if (!devices.length) {
      Logger.log(`${colors.red('No device found running.')} Please connect a device to install the APK.`);
      Logger.log(`Use ${colors.cyan('npx @nightwatch/mobile-helper android connect')} to connect to a device.\n`);

      return true;
    } else if (devices.length === 1) {
      // if only one device is connected, then set that device's id to options.deviceId
      options.deviceId = devices[0].udid;
    }

    if (options.deviceId && devices.length > 1) {
      // If device id is passed and there are multiple devices connected then
      // check if the id is valid. If not then prompt user to select a device.
      const deviceConnected = devices.find(device => device.udid === options.deviceId);
      if (!deviceConnected) {
        Logger.log(`${colors.yellow('Invalid device Id passed!')}\n`);

        options.deviceId = '';
      }
    }

    if (!options.deviceId) {
      // if device id not found, or invalid device id is found, then prompt the user
      // to select a device from the list of running devices.
      const deviceAnswer = await inquirer.prompt({
        type: 'list',
        name: 'device',
        message: 'Select the device to install the APK:',
        choices: devices.map(device => device.udid)
      });
      options.deviceId = deviceAnswer.device;
    }

    if (!options.path) {
      // if path to APK is not provided, then prompt the user to enter the path.
      const apkPathAnswer = await inquirer.prompt({
        type: 'input',
        name: 'apkPath',
        message: 'Enter the path to the APK file:'
      });
      options.path = apkPathAnswer.apkPath;
      Logger.log();
    }


    options.path = path.resolve(homedir(), options.path as string);
    if (!existsSync(options.path)) {
      Logger.log(`${colors.red('APK file not found!')} Please provide a valid path to the APK file.\n`);

      return false;
    }

    Logger.log('Installing APK...');

    const installationStatus = await execBinaryAsync(adbLocation, 'adb', platform, `-s ${options.deviceId} install ${options.path}`);
    if (installationStatus?.includes('Success')) {
      Logger.log(colors.green('APK installed successfully!\n'));

      return true;
    }

    handleError(installationStatus);

    return false;
  } catch (err) {
    handleError(err);

    return false;
  }
}

const handleError = (consoleOutput: any) => {
  Logger.log(colors.red('Error occured while installing APK'));

  let errorMessage = consoleOutput;
  if (consoleOutput.includes('INSTALL_FAILED_ALREADY_EXISTS')) {
    errorMessage = 'APK with the same package name already exists on the device.\n';
  } else if (consoleOutput.includes('INSTALL_FAILED_OLDER_SDK')) {
    errorMessage = 'Target installation location (AVD/Real device) has older SDK version than the minimum requirement of the APK.\n';
  }

  Logger.log(errorMessage);
};

