import colors from 'ansi-colors';
import inquirer from 'inquirer';

import Logger from '../../../../logger';
import {symbols} from '../../../../utils';
import {Platform} from '../../interfaces';
import {getBinaryLocation} from '../../utils/common';
import {execBinarySync, execBinaryAsync} from '../../utils/sdk';

export async function deleteAvd(sdkRoot: string, platform: Platform): Promise<boolean> {
  try {
    const avdmanagerLocation = getBinaryLocation(sdkRoot, platform, 'avdmanager', true);
    if (!avdmanagerLocation) {
      Logger.log(`  ${colors.red(symbols().fail)} ${colors.cyan('avdmanager')} binary not found.\n`);
      Logger.log(`Run: ${colors.cyan('npx @nightwatch/mobile-helper android --standalone')} to setup missing requirements.`);
      Logger.log(`(Remove the ${colors.gray('--standalone')} flag from the above command if setting up for testing.)\n`);

      return false;
    }

    const installedAvds = execBinarySync(avdmanagerLocation, 'avdmanager', platform, 'list avd -c');
    if (!installedAvds) {
      Logger.log(`${colors.yellow('Failed to fetch installed AVDs.')} Please try again.`);

      return false;
    }

    const avdAnswer = await inquirer.prompt({
      type: 'list',
      name: 'avdName',
      message: 'Select the AVD to delete:',
      choices: installedAvds.split('\n').filter(avd => avd !== '')
    });
    const avdName = avdAnswer.avdName;

    Logger.log();
    Logger.log(`Deleting ${colors.cyan(avdName)}...\n`);

    const deleteStatus = await execBinaryAsync(avdmanagerLocation, 'avdmanager', platform, `delete avd --name '${avdName}'`);

    if (deleteStatus?.includes('deleted')) {
      Logger.log(`${colors.green('AVD deleted successfully!')}`);

      return true;
    }

    return false;
  } catch (error) {
    Logger.log(colors.red('Error occured while deleting AVD.'));
    console.error(error);

    return false;
  }
}

