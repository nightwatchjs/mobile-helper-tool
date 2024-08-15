import colors from 'ansi-colors';

import Logger from '../../../logger';
import {symbols} from '../../../utils';
import {Platform, SdkBinary} from '../interfaces';
import ADB from '../utils/appium-adb';
import {execBinarySync} from '../utils/sdk';

const deviceStateWithColor = (state: string) => {
  switch (state) {
    case 'device':
      return colors.green(state) + colors.gray(' (online)');
    case 'offline':
      return colors.red(state);
    default:
      return colors.gray(state);
  }
};

export async function showConnectedRealDevices() {
  try {
    const adb = await ADB.createADB({allowOfflineDevices: true});
    const connectedDevices = await adb.getConnectedDevices();
    const connectedRealDevices = connectedDevices.filter((device) => {
      return !device.udid.includes('emulator') && !device.udid.includes('_adb-tls-connect');
    });

    if (connectedRealDevices.length === 0) {
      return true;
    }

    Logger.log(colors.bold('Connected Real Devices:'));

    connectedRealDevices.forEach((device, index) => {
      Logger.log(`  ${index+1}. udid/deviceId: ${colors.green(device.udid)} / state: ${deviceStateWithColor(device.state)}`);
    });
    Logger.log();

    return true;
  } catch (error) {
    Logger.log(colors.red('Error occurred while showing connected real devices.'));
    console.error(error);

    return false;
  }
}

export async function showConnectedEmulators() {
  try {
    const adb = await ADB.createADB({allowOfflineDevices: true});
    const connectedEmulators = await adb.getConnectedEmulators();

    if (connectedEmulators.length === 0) {
      return true;
    }

    Logger.log(colors.bold('Connected Emulators:'));

    connectedEmulators.forEach((emu, index) => {
      Logger.log(`  ${index+1}. udid/deviceId: ${colors.green(emu.udid)} / state: ${deviceStateWithColor(emu.state)}`);
    });
    Logger.log();

    return true;
  } catch (error) {
    Logger.log(colors.red('Error occurred while showing connected emulators.'));
    console.error(error);

    return false;
  }
}

export async function getInstalledSystemImages(sdkmanagerLocation: string, platform: Platform): Promise<{
  result: boolean,
  systemImages: string[]
}> {
  const stdout = execBinarySync(sdkmanagerLocation, 'sdkmanager', platform, '--list');
  if (!stdout) {
    Logger.log(`${colors.red('Failed to fetch system images!')} Please try again.`);

    return {
      result: false,
      systemImages: []
    };
  }
  const lines = stdout.split('\n');
  const installedImages: string[] = [];

  for (const line of lines) {
    if (line.includes('Available Packages:')) {
      break;
    }
    if (line.includes('system-images')) {
      installedImages.push(line.split('|')[0].trim());
    }
  }

  return {
    result: true,
    systemImages: installedImages
  };
}

export function showMissingBinaryHelp(binaryName: SdkBinary) {
  Logger.log(`  ${colors.red(symbols().fail)} ${colors.cyan(binaryName)} binary not found.\n`);
  Logger.log(`Run: ${colors.cyan('npx @nightwatch/mobile-helper android --standalone')} to setup missing requirements.`);
  Logger.log(`(Remove the ${colors.gray('--standalone')} flag from the above command if setting up for testing.)\n`);
}
