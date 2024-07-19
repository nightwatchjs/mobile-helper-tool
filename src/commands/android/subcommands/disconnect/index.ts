import colors from 'ansi-colors';
import ADB from 'appium-adb';
import inquirer from 'inquirer';

import Logger from '../../../../logger';
import {symbols} from '../../../../utils';
import {killEmulatorWithoutWait} from '../../adb';
import {Options, Platform} from '../../interfaces';
import {getBinaryLocation} from '../../utils/common';
import {execBinarySync} from '../../utils/sdk';
import {showConnectedRealDevices, showRunningAVDs} from '../common';

export async function disconnect(options: Options, sdkRoot: string, platform: Platform) {
  try {
    const adbLocation = getBinaryLocation(sdkRoot, platform, 'adb', true);
    if (adbLocation === '') {
      Logger.log(`  ${colors.red(symbols().fail)} ${colors.cyan('adb')} binary not found.\n`);
      Logger.log(`Run: ${colors.cyan('npx @nightwatch/mobile-helper android --standalone')} to setup missing requirements.`);
      Logger.log(`(Remove the ${colors.gray('--standalone')} flag from the above command if setting up for testing.)\n`);

      return false;
    }

    const adb = await ADB.createADB({allowOfflineDevices: true});
    const devices = await adb.getConnectedDevices();

    if (devices.length === 0) {
      Logger.log(`${colors.yellow('No device found running.')}`);

      return true;
    }

    const devicesList = devices.map((device) => device.udid);

    // Here, options.deviceId represent the device id to disconnect.
    // If the provided device id is not found then prompt the user to select the device.
    if (options.deviceId && typeof options.deviceId === 'string') {
      if (!devicesList.includes(options.deviceId)) {
        Logger.log(`${colors.yellow('Device with the provided ID was not found.')}\n`);
        options.deviceId = '';
      }
    } else if (options.deviceId === true) {
      // If the --deviceId flag is present without a value then assign it an empty string
      // to follow the default flow.
      options.deviceId = '';
    }

    await showConnectedRealDevices();
    await showRunningAVDs();

    if (!options.deviceId) {
      const deviceAnswer = await inquirer.prompt({
        type: 'list',
        name: 'device',
        message: 'Select the device to disconnect:',
        choices: devicesList
      });
      options.deviceId = deviceAnswer.device;

      Logger.log();
    }

    if ((options.deviceId as string).includes('emulator')) {
      killEmulatorWithoutWait(sdkRoot, platform, options.deviceId as string);
      Logger.log(colors.green('Successfully shut down the AVD.'));

      return true;
    }

    const disconnectionStatus = execBinarySync(adbLocation, 'adb', platform, `disconnect ${options.deviceId}`);
    if (disconnectionStatus?.includes('disconnected')) {
      Logger.log(colors.green('Successfully disconnected the device.'));

      return true;
    } else {
      Logger.log(`${colors.red('Failed to disconnect the device.')} Please try again.`);
    }

    return false;
  } catch (err) {
    Logger.log(colors.red('Error occured while disconnecting a device.'));
    console.error(err);

    return false;
  }
}

