import colors from 'ansi-colors';
import ADB from 'appium-adb';

import Logger from '../../../../logger';

export async function showConnectedDevices() {
  try {
    const adb = await ADB.createADB({allowOfflineDevices: true});
    const connectedDevices = await adb.getConnectedDevices();

    if (connectedDevices.length === 0) {
      Logger.log(colors.yellow('No connected device found.'));

      return true;
    }
    const connectedRealDevices = connectedDevices.filter((device) => !device.udid.includes('emulator'));
    const connectedAVDs = connectedDevices.filter((device) => device.udid.includes('emulator'));

    if (connectedAVDs.length) {
      Logger.log(colors.bold('Running AVDs:'));

      connectedAVDs.forEach((avd) => {
        Logger.log(`  ${avd.udid} - ${avd.state}`);
      });
      Logger.log();
    }

    if (connectedRealDevices.length) {
      Logger.log(colors.bold('Connected Real Devices:'));

      connectedRealDevices.forEach((device) => {
        Logger.log(`  ${device.udid} - ${device.state}`);
      });
      Logger.log();
    }

  } catch (error) {
    Logger.log(colors.red('Error occured while getting list of connected devices.'));
    console.error(error);
  }

  return true;
}

