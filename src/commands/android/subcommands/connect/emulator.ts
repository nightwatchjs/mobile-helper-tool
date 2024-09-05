import colors from 'ansi-colors';
import inquirer from 'inquirer';

import Logger from '../../../../logger';
import {Options, Platform} from '../../interfaces';
import {getBinaryLocation} from '../../utils/common';
import {execBinarySync, spawnCommandSync} from '../../utils/sdk';
import {showMissingBinaryHelp} from '../common';

export async function connectAVD(options: Options, sdkRoot: string, platform: Platform): Promise<boolean> {
  try {
    const avdmanagerLocation = getBinaryLocation(sdkRoot, platform, 'avdmanager', true);
    if (avdmanagerLocation === '') {
      showMissingBinaryHelp('avdmanager');

      return false;
    }

    const emulatorLocation = getBinaryLocation(sdkRoot, platform, 'emulator', true);
    if (emulatorLocation === '') {
      showMissingBinaryHelp('emulator');

      return false;
    }

    const installedAvds = execBinarySync(avdmanagerLocation, 'avdmanager', platform, 'list avd -c');
    if (installedAvds === null) {
      Logger.log(`${colors.red('\nFailed to fetch installed AVDs.')} Please try again.\n`);

      return false;
    } else if (installedAvds === '') {
      Logger.log(`${colors.yellow('No installed AVD found.')}\n`);
      Logger.log('To see the list of installed AVDs, run the following command:');
      Logger.log(colors.cyan('  npx @nightwatch/mobile-helper android list --avd\n'));

      return false;
    }

    const installedAVDList = installedAvds.split('\n').filter(avd => avd !== '');

    if (options.avd && !installedAVDList.includes(options.avd as string)) {
      Logger.log(colors.yellow('Provided AVD not found!\n'));
      options.avd = '';
    }

    if (!options.avd) {
      const avdAnswer = await inquirer.prompt({
        type: 'list',
        name: 'avdName',
        message: 'Select the AVD to connect:',
        choices: installedAVDList
      });
      options.avd = avdAnswer.avdName;
    }

    Logger.log();
    Logger.log(`Connecting to AVD: ${colors.cyan(options.avd as string)}\n`);

    const launchStatus = spawnCommandSync(emulatorLocation, 'emulator', platform, [`@${options.avd}`]);
    if (!launchStatus) {
      return false;
    }

    return true;
  } catch (error) {
    Logger.log(colors.red('Error occured while launching AVD.'));
    console.error(error);

    return false;
  }
}

