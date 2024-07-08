import colors from 'ansi-colors';
import ADB from 'appium-adb';

import Logger from '../../../logger';

export async function showConnectedRealDevices() {
  try {
    const adb = await ADB.createADB({allowOfflineDevices: true});
    const connectedDevices = await adb.getConnectedDevices();
    const connectedRealDevices = connectedDevices.filter((device) => !device.udid.includes('emulator'));

    if (connectedRealDevices.length === 0) {
      return true;
    }

    Logger.log(colors.bold('Connected Real Devices:'));

    connectedRealDevices.forEach((device) => {
      Logger.log(`  ${device.udid} - ${device.state}`);
    });
    Logger.log();

    return true;
  } catch (error) {
    Logger.log(colors.red('Error occured while showing connected real devices.'));
    console.error(error);

    return false;
  }
}

export async function showRunningAVDs() {
  try {
    const adb = await ADB.createADB({allowOfflineDevices: true});
    const connectedAVDs = await adb.getConnectedEmulators();

    if (connectedAVDs.length === 0) {
      return true;
    }

    Logger.log(colors.bold('Running AVDs:'));

    connectedAVDs.forEach((avd) => {
      Logger.log(`  ${avd.udid} - ${avd.state}`);
    });
    Logger.log();

    return true;
  } catch (error) {
    Logger.log(colors.red('Error occured while showing running AVDs.'));
    console.error(error);

    return false;
  }
}
