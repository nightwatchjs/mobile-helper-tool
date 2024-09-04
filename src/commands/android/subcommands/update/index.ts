import colors from 'ansi-colors';
import {spawnSync} from 'child_process';
import inquirer from 'inquirer';

import Logger from '../../../../logger';
import {Platform} from '../../interfaces';
import {getBinaryLocation} from '../../utils/common';
import {execBinarySync} from '../../utils/sdk';
import {showMissingBinaryHelp} from '../common';

export async function update(sdkRoot: string, platform: Platform): Promise<boolean> {
  try {
    const sdkmanagerLocation = getBinaryLocation(sdkRoot, platform, 'sdkmanager', true);
    if (!sdkmanagerLocation) {
      showMissingBinaryHelp('sdkmanager');

      return false;
    }
    const stdout = execBinarySync(sdkmanagerLocation, 'sdkmanager', platform, '--list --include_obsolete');
    if (!stdout) {
      Logger.log(colors.red('Failed to fetch packages. Please try again.\n'));

      return false;
    }

    if (!stdout.includes('Available Updates:')) {
      Logger.log(colors.yellow('No updates available.\n'));

      return true;
    }

    const availableUpdates = stdout.split('Available Updates:')[1].trimEnd();

    Logger.log(colors.bold('Available Updates:'));
    Logger.log(availableUpdates);
    Logger.log();

    const availableUpdatesList = availableUpdates.split('\n').filter(line => line !== '').slice(2);
    const availableUpdatesNames: string[] = [];

    availableUpdatesList.forEach(updateInfo => {
      const packageName = updateInfo.split('|')[0].trim();
      availableUpdatesNames.push(packageName);
    });

    const updateAnswer = await inquirer.prompt({
      type: 'list',
      name: 'packageName',
      message: 'Select the packages to update:',
      choices: [...availableUpdatesNames, 'Update all']
    });
    const packageName = updateAnswer.packageName;

    Logger.log();

    if (packageName === 'Update all') {
      Logger.log('Updating all packages... \n');

      return runUpdateCommand(sdkmanagerLocation, ['--update']);
    }

    Logger.log(`Updating ${colors.cyan(packageName)}... \n`);

    return runUpdateCommand(sdkmanagerLocation, [packageName]);
  } catch (err) {
    Logger.log(colors.red('Error occured while updating the package.'));
    console.error(err);

    return false;
  }
}

function runUpdateCommand(sdkmanagerLocation: string, args: string[]) {
  const result = spawnSync(sdkmanagerLocation, args, {stdio: 'inherit'});

  if (result.error) {
    console.error(result.error);

    return false;
  }

  return result.status === 0;
}
