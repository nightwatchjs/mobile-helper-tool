import colors from 'ansi-colors';
import ADB from 'appium-adb';
import inquirer from 'inquirer';

import Logger from '../../../../logger';
import {killEmulatorWithoutWait} from '../../adb';
import {Options, Platform} from '../../interfaces';
import {getBinaryLocation} from '../../utils/common';
import {execBinarySync} from '../../utils/sdk';
import {showConnectedRealDevices, showRunningAVDs} from '../common';

export async function disconnect(options: Options, sdkRoot: string, platform: Platform) {
  try {
    const adbLocation = getBinaryLocation(sdkRoot, platform, 'adb', true);
    const adb = await ADB.createADB({allowOfflineDevices: true});
    const devices = await adb.getConnectedDevices();

    if (devices.length === 0) {
      Logger.log(`${colors.yellow('No device found running.')}`);

      return true;
    }

    const devicesList = devices.map((device) => device.udid);

    // Here, options.s represent the device id to disconnect.
    // If the provided device id is not found then prompt the user to select the device.
    if (options.s && typeof options.s === 'string') {
      if (!devicesList.includes(options.s)) {
        Logger.log(`${colors.yellow('Device with the provided ID was not found.')}\n`);
        options.s = '';
      }
    } else if (options.s === true) {
      // If the --s flag is present without a value then assign it an empty string
      // to follow the default flow.
      options.s = '';
    }

    await showConnectedRealDevices();
    await showRunningAVDs();

    if (!options.s) {
      const deviceAnswer = await inquirer.prompt({
        type: 'list',
        name: 'device',
        message: 'Select the device to disconnect:',
        choices: devicesList
      });
      options.s = deviceAnswer.device;

      Logger.log();
    }

    if ((options.s as string).includes('emulator')) {
      killEmulatorWithoutWait(sdkRoot, platform, options.s as string);
      Logger.log(colors.green('Successfully shut down the AVD.'));

      return true;
    }

    const disconnectionStatus = execBinarySync(adbLocation, 'adb', platform, `disconnect ${options.s}`);
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

