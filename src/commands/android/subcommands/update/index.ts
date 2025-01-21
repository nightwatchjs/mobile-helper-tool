import colors from 'ansi-colors';
import inquirer from 'inquirer';

import Logger from '../../../../logger';
import {Platform} from '../../interfaces';
import {getBinaryLocation} from '../../utils/common';
import {execBinarySync, spawnCommandSync} from '../../utils/sdk';
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

    const commandArgs: string[] = [];
    if (packageName === 'Update all') {
      Logger.log('Updating all packages... \n');
      commandArgs.push('--update');
    } else {
      Logger.log(`Updating ${colors.cyan(packageName)}... \n`);
      commandArgs.push(packageName);
    }

    const updateStatus = spawnCommandSync(sdkmanagerLocation, 'sdkmanager', platform, commandArgs);
    if (updateStatus) {
      if (packageName === 'Update all') {
        Logger.log(colors.green('Packages updated successfully!\n'));
      } else {
        Logger.log(colors.green(`${packageName} updated successfully!\n`));
      }

      return true;
    }

    Logger.log(colors.red('Something went wrong.\n'));
    Logger.log('To verify if the package was updated, run: npx @nightwatch/mobile-helper android.sdkmanager --list');
    Logger.log('If the package is found listed in \'Available Updates\' section, please try updating again.\n');

    return false;
  } catch (err) {
    Logger.log(colors.red('Error occured while updating the package.'));
    console.error(err);

    return false;
  }
}

