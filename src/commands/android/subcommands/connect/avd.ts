import colors from 'ansi-colors';
import inquirer from 'inquirer';

import {launchAVD} from '../../adb';
import Logger from '../../../../logger';
import {symbols} from '../../../../utils';
import {Platform} from '../../interfaces';
import {execBinarySync} from '../../utils/sdk';
import {getBinaryLocation} from '../../utils/common';

export async function connectAvd(sdkRoot: string, platform: Platform): Promise<boolean> {
  try {
    const avdmanagerLocation = getBinaryLocation(sdkRoot, platform, 'avdmanager', true);
    if (avdmanagerLocation === '') {
      Logger.log(`  ${colors.red(symbols().fail)} ${colors.cyan('avdmanager')} binary not found.\n`);
      Logger.log(`Run: ${colors.cyan('npx @nightwatch/mobile-helper android --standalone')} to setup missing requirements.`);
      Logger.log(`(Remove the ${colors.gray('--standalone')} flag from the above command if setting up for testing.)\n`);

      return false;
    }

    const availableAVDs = execBinarySync(avdmanagerLocation, 'avdmanager', platform, 'list avd -c');
    if (!availableAVDs) {
      Logger.log(`${colors.red('No AVD installed!')}`);
      Logger.log(`Run: ${colors.cyan('npx @nightwatch/mobile-helper android --mode emulator --standalone')} to setup emulator.`);
      Logger.log(`(Remove the ${colors.gray('--standalone')} flag from the above command if setting up for testing.)\n`);

      return false;
    }

    const availableAVDsList = availableAVDs.split('\n').filter(avd => avd !== '');

    const avdAnswer = await inquirer.prompt({
      type: 'list',
      name: 'avdName',
      message: 'Select the AVD to connect:',
      choices: availableAVDsList
    });
    const avdName = avdAnswer.avdName;

    Logger.log();
    Logger.log(`Launching ${avdName}...`);

    const connectionStatus = await launchAVD(sdkRoot, platform, avdName);

    if (!connectionStatus) {
      return false;
    }

    return true;
  } catch (error) {
    Logger.log(colors.red('Error occured while launching AVD.'));
    console.error(error);

    return false;
  }
}

