import {Platform} from '../interfaces';
import {execBinarySync} from './sdk';
import Logger from '../../../logger';
import inquirer from 'inquirer';
import colors from 'ansi-colors';

export async function connectAdbWirelessly(adbLocation: string, platform: Platform): Promise<boolean> {
  try {

    Logger.log(`${colors.bold('Follow the below steps to connect to your device wirelessly:\n')}
  1.Connect your device to the same network as your computer ${colors.grey('(you may connect your device to your computer\'s hotspot)')}.
  2.Enable wireless debugging on your device.
  3.Find the IP address and port number of your device by going to:
    ${colors.cyan('Settings > Wireless Debugging')}
    ${colors.grey('IP address and port number are separated by \':\' in the format <ip_address:port>\n    '+
    'where IP address comes before \':\' and port number comes after \':\'')}\n`);

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

    Logger.log(`\n  4.Now find your device's pairing code and pairing port number by going to:
    ${colors.cyan('Settings > Wireless Debugging > Pair device with pairing code')}
    ${colors.grey('Here you will find the pairing code and an IP address with a port number.\n    '+
    'The port number associated with this IP address is the requird pairing port number.')}\n`);

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

    Logger.log('\nPairing your device with your computer...\n');

    const pairing = execBinarySync(adbLocation, 'adb', platform, `pair ${deviceIP}:${pairingPort} ${pairingCode}`);
    if (pairing) {
      Logger.log(`${colors.green('\nPairing successful!')} Now connecting to device wirelessly...`);
    } else {
      Logger.log(`${colors.red('\nPairing failed!')} Please try again.`);

      return false;
    }

    execBinarySync(adbLocation, 'adb', platform, `connect ${deviceIP}:${port}`);
    Logger.log(colors.green('\nConnected to device wirelessly.'));

    return true;
  } catch (error) {
    Logger.log('Error connecting to wifi ADB');
    console.error('Error:', error);

    return false;
  }
}
