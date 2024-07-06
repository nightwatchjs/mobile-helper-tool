import colors from 'ansi-colors';
import ADB from 'appium-adb';

import {Options} from '../interfaces';
import Logger from '../../../logger';

export async function showConnectedDevices(options: Options) {
  try {
    const adb = await ADB.createADB({allowOfflineDevices: true});
    const connectedDevices = await adb.getConnectedDevices();

    if (connectedDevices.length === 0) {
      return true;
    }
    const connectedRealDevices = connectedDevices.filter((device) => !device.udid.includes('emulator'));
    const connectedAVDs = connectedDevices.filter((device) => device.udid.includes('emulator'));

    if (connectedAVDs.length) {
      // show running AVDs only if --avd flag is present or
      // if both --avd and --wireless flags are absent.
      if (options.avd || (!options.avd && !options.wireless)) {
        Logger.log(colors.bold('Running AVDs:'));

        connectedAVDs.forEach((avd) => {
          Logger.log(`  ${avd.udid} - ${avd.state}`);
        });
        Logger.log();
      }
    }

    if (connectedRealDevices.length) {
      // show connected real devices only if --wireless flag is present or
      // if both --avd and --wireless flags are absent.
      if (options.wireless || (!options.avd && !options.wireless)) {
        Logger.log(colors.bold('Connected Real Devices:'));

        connectedRealDevices.forEach((device) => {
          Logger.log(`  ${device.udid} - ${device.state}`);
        });
        Logger.log();
      }
    }

    return true;
  } catch (error) {
    Logger.log(colors.red('Error occured while getting list of connected devices.'));
    console.error(error);

    return false;
  }
}

