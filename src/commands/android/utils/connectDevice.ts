import {Platform} from '../interfaces';
import {execBinarySync} from './sdk';
import Logger from '../../../logger';
import inquirer from 'inquirer';
import colors from 'ansi-colors';
import { getBinaryLocation } from './common';
import { launchAVD } from '../adb';
import ADB from 'appium-adb';

export async function connectWirelessAdb(sdkRoot: string, platform: Platform): Promise<boolean> {
  try {
    const adbLocation = getBinaryLocation(sdkRoot, platform, 'adb', true);
    if (adbLocation === '') {
      Logger.log(`${colors.red('ADB not found!')} Use ${colors.magenta('--setup')} flag with the main command to setup missing requirements.`);

      return false;
    }

    Logger.log(`${colors.yellow('Note: This feature is available only for Android 11 and above.\n')}`);

    Logger.log(`${colors.bold('Follow the below steps to connect to your device wirelessly:')}\n`);

    Logger.log(`1.Connect your device to the same network as your computer.`)
    Logger.log(`${colors.grey('You may connect your device to your computer\'s hotspot')}\n`);

    Logger.log(`2.Enable developer options on your device by going to:`);
    Logger.log(`${colors.cyan('Settings > About Phone > Build Number')}`);
    Logger.log(`Tap on build number 7 times until you see the message ${colors.bold('You are now a developer!')}\n`);

    Logger.log(`3.Enable wireless debugging on your device by searching ${colors.bold('wireless debugging')} in the search bar or by going to:`);
    Logger.log(`${colors.cyan('Settings > Developer Options > Wireless Debugging')}\n`);

    Logger.log(`4.Find the IP address and port number of your device on the wireless debugging screen`);
    Logger.log(`${colors.grey('IP address and port number are separated by \':\' in the format <ip_address:port>\nwhere IP address comes before \':\' and port number comes after \':\'')}\n`);
  
    const deviceIPAnswer = await inquirer.prompt({
      type: 'input',
      name: 'deviceIP',
      message: 'Enter the IP address of your device:'
    });
    const deviceIP = deviceIPAnswer.deviceIP;

    const portAnswer = await inquirer.prompt({
      type: 'input',
      name: 'port',
      message: 'Enter the port number:'
    });
    const port = portAnswer.port;

    Logger.log();
    Logger.log(`5.Now find your device's pairing code and pairing port number by going to:`);
    Logger.log(`${colors.cyan('Settings > Wireless Debugging > Pair device with pairing code')}`);
    Logger.log(`${colors.grey('Here you will find a pairing code and a')} ${colors.magenta('IP address:port')} ${colors.grey('combination.\nThe port number associated with the IP address is the required pairing port number.\n')}`);

    const pairingCodeAnswer = await inquirer.prompt({
      type: 'input',
      name: 'pairingCode',
      message: 'Enter the pairing code displayed on your device:'
    });
    const pairingCode = pairingCodeAnswer.pairingCode;

    const pairingPortAnswer = await inquirer.prompt({
      type: 'input',
      name: 'pairingPort',
      message: 'Enter the pairing port number displayed on your device:'
    });
    const pairingPort = pairingPortAnswer.pairingPort;

    Logger.log();
    Logger.log('Pairing your device with your computer...\n');

    const pairing = execBinarySync(adbLocation, 'adb', platform, `pair ${deviceIP}:${pairingPort} ${pairingCode}`);
    if (pairing) {
      Logger.log(`${colors.green('Pairing successful!')} Now connecting to device wirelessly...\n`);
    } else {
      Logger.log(`${colors.red('Pairing failed!')} Please try again.`);

      return false;
    }

    const connecting = execBinarySync(adbLocation, 'adb', platform, `connect ${deviceIP}:${port}`);
    if (connecting?.includes('connected')) {
      Logger.log(colors.green('Connected to device wirelessly.'));
    } else {
      Logger.log(`${colors.red('Failed to connect!')} Please try again.`);

      return false;
    }

    return true;
  } catch (error) {
    Logger.log('Error connecting to wifi ADB');
    console.error('Error:', error);

    return false;
  }
}

export async function connectAvd (sdkRoot: string, platform: Platform): Promise<boolean> {
  const avdmanagerLocation = getBinaryLocation(sdkRoot, platform, 'avdmanager', true);
  const availableAVDsDetails = execBinarySync(avdmanagerLocation, 'avdmanager', platform, 'list avd');

  if (availableAVDsDetails) {
    Logger.log('Available AVDs:');
    Logger.log(availableAVDsDetails);
  }

  const availableAVDs = execBinarySync(avdmanagerLocation, 'avdmanager', platform, 'list avd -c');

  if (availableAVDs) {
    const avdAnswer = await inquirer.prompt({
      type: 'list',
      name: 'avdName',
      message: 'Select the AVD to connect:',
      choices: availableAVDs.split('\n').filter(avd => avd !== '')
    });
    const avdName = avdAnswer.avdName;

    Logger.log(`Connecting to ${avdName}...`);
    const connectingAvd = await launchAVD(sdkRoot, platform, avdName);

    if (connectingAvd) {
      return true;
    }

    return false;
  } else {
    Logger.log(`${colors.red('No AVDs found!')} Use ${colors.magenta('--setup')} flag with the main command to setup missing requirements.`);
  }
  return false;
}

export async function disconnectDevice (sdkRoot: string, platform: Platform) {
    const adbLocation = getBinaryLocation(sdkRoot, platform, 'adb', true);
    const adb = await ADB.createADB({allowOfflineDevices: true});
    const devices = await adb.getConnectedDevices();

    if (devices.length === 0) {
        Logger.log(`${colors.yellow('No device found running.')}`);
        return true;
    }

    const deviceAnswer = await inquirer.prompt({
      type: 'list',
      name: 'device',
      message: 'Select the device to disconnect:',
      choices: devices.map(device => device.udid)
    });
    const deviceId = deviceAnswer.device;

    let disconnecting;
    if (deviceId.includes('emulator')) {
        disconnecting = execBinarySync(adbLocation, 'adb', platform, `-s ${deviceId} emu kill`);
    } else {
        disconnecting = execBinarySync(adbLocation, 'adb', platform, `disconnect ${deviceId}`);
    }
    console.log(disconnecting);
    
    return false;
}

export async function listRunningDevices() {
    const adb = await ADB.createADB({ allowOfflineDevices: true });
    const devices = await adb.getConnectedDevices();

    if (devices.length === 0) {
        Logger.log(`No device connected.`);
        return true;
    }

    Logger.log(colors.bold('Connected Devices:'));

    const maxUdidLength = devices.reduce((max, device) => Math.max(max, device.udid.length), 0);
    const paddedLength = maxUdidLength + 2;

    devices.forEach((device) => {
        const paddedUdid = device.udid.padEnd(paddedLength);
        Logger.log(`${paddedUdid}${device.state}`);
    });

    return true;
}

export async function defaultConnectFlow(sdkRoot: string, platform: Platform) {
    await listRunningDevices();
    
    Logger.log();

    const connectAnswer = await inquirer.prompt({
      type: 'list',
      name: 'connectOption',
      message: 'Select the type of device to connect:',
      choices: ['Real Device', 'AVD']
    });
    const connectOption = connectAnswer.connectOption;
    
    Logger.log();

    switch (connectOption) {
      case 'Real Device':
        return await connectWirelessAdb(sdkRoot, platform);
      case 'AVD':
        return await connectAvd(sdkRoot, platform);
      default:
        Logger.log('Invalid option selected.');
        return false;
    }
}
