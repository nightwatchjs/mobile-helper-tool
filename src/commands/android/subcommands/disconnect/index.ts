import colors from 'ansi-colors';
import ADB from 'appium-adb';
import inquirer from 'inquirer';

import Logger from '../../../../logger';
import {Options, Platform} from '../../interfaces';
import {getBinaryLocation} from '../../utils/common';
import {execBinarySync} from '../../utils/sdk';
import {showConnectedRealDevices, showConnectedEmulators, verifyOptions, showMissingBinaryHelp} from '../common';

export async function disconnect(options: Options, sdkRoot: string, platform: Platform) {
  const optionsVerified = verifyOptions('disconnect', options);
  if (!optionsVerified) {
    return false;
  }

  return await disconnectDevice(options, sdkRoot, platform);
}

async function disconnectDevice(options: Options, sdkRoot: string, platform: Platform) {
  try {
    const adbLocation = getBinaryLocation(sdkRoot, platform, 'adb', true);
    if (adbLocation === '') {
      showMissingBinaryHelp('adb');

      return false;
    }

    const adb = await ADB.createADB({allowOfflineDevices: true});
    const devices = await adb.getConnectedDevices();

    if (devices.length === 0) {
      Logger.log(`${colors.yellow('No device found running.')}`);

      return true;
    }

    const deviceIdsList = devices.map((device) => device.udid);

    // Here, options.deviceId represent the device id to disconnect.
    // If the provided device id is not found then prompt the user to select the device.
    if (options.deviceId && typeof options.deviceId === 'string') {
      if (!deviceIdsList.includes(options.deviceId)) {
        Logger.log(`${colors.yellow('Device with the provided id was not found.')}\n`);
        options.deviceId = '';
      }
    } else if (options.deviceId === true) {
      // If the --deviceId flag is present without a value then assign it an empty string
      // to follow the default flow.
      options.deviceId = '';
    }

    await showConnectedRealDevices();
    await showConnectedEmulators();

    if (!options.deviceId) {
      const deviceAnswer = await inquirer.prompt({
        type: 'list',
        name: 'device',
        message: 'Select the device to disconnect:',
        choices: [...deviceIdsList, 'Disconnect all']
      });
      options.deviceId = deviceAnswer.device;

      Logger.log();
    }

    if ((options.deviceId as string).includes('emulator') || options.deviceId === 'Disconnect all') {
      if (options.deviceId === 'Disconnect all') {
        // kill adb server to disconnect all wirelessly connected real devices
        const realDevices = deviceIdsList.filter(deviceId => !deviceId.includes('emulator'));
        if (realDevices.length) {
          adb.killServer();
          Logger.log(colors.green('Successfully disconnected all real devices.\n'));
        }
      }

      const avdmanagerLocation = getBinaryLocation(sdkRoot, platform, 'avdmanager', true);
      if (avdmanagerLocation === '') {
        showMissingBinaryHelp('avdmanager');

        return false;
      }
      const stdout = execBinarySync(avdmanagerLocation, 'avdmanager', platform, 'list avd -c');
      if (stdout === null) {
        Logger.log(`${colors.red('Something went wrong when trying to shut down AVD.')} Please try again.`);

        return false;
      }
      const installedAvds = stdout.split('\n').filter((avd) => avd !== '');

      installedAvds.forEach(avdName => {
        adb.getRunningAVDWithRetry(avdName, 1000).then(runningAvd => {
          if (runningAvd) {
            if (options.deviceId !== 'Disconnect all' && runningAvd.udid !== options.deviceId) {
              // If user has selected Disconnect all option then shut down all running avds.
              // If not, then we will return until we encounter the selected avd.
              return;
            }
            adb.killEmulator(avdName).then(avdShutDown => {
              if (avdShutDown) {
                Logger.log(`${colors.green('Successfully shut down: ')} ${runningAvd.udid}`);
              } else {
                Logger.log(`${colors.red('Failed shut down:')} ${runningAvd.udid}`);
              }
            });
          }
        }).catch(_err => {
          // Error is caught to prevent unhandled rejection, but not used.
          // This error is not revelant to users.
          void _err;
        });
      });

      return true;
    }

    const disconnectionStatus = execBinarySync(adbLocation, 'adb', platform, `disconnect ${options.deviceId}`);
    if (disconnectionStatus?.includes('disconnected')) {
      Logger.log(`${colors.green('Successfully disconnected: ')} ${options.deviceId}\n`);

      return true;
    } else {
      Logger.log(`${colors.red('Failed to disconnect the device.')} Please try again.\n`);
    }

    return false;
  } catch (err) {
    Logger.log(colors.red('Error occured while disconnecting a device.'));
    console.error(err);

    return false;
  }
}

