import colors from 'ansi-colors';
import inquirer from 'inquirer';

import Logger from '../../../../logger';
import {symbols} from '../../../../utils';
import {Platform} from '../../interfaces';
import {getBinaryLocation} from '../../utils/common';
import {execBinarySync} from '../../utils/sdk';

export async function update(sdkRoot: string, platform: Platform): Promise<boolean> {
  try {
    const sdkmanagerLocation = getBinaryLocation(sdkRoot, platform, 'sdkmanager', true);
    if (!sdkmanagerLocation) {
      Logger.log(`  ${colors.red(symbols().fail)} ${colors.cyan('sdkmanager')} binary not found.\n`);
      Logger.log(`Run: ${colors.cyan('npx @nightwatch/mobile-helper android --standalone')} to setup missing requirements.`);
      Logger.log(`(Remove the ${colors.gray('--standalone')} flag from the above command if setting up for testing.)\n`);

      return false;
    }
    const stdout = execBinarySync(sdkmanagerLocation, 'sdkmanager', platform, '--list --include_obsolete');
    if (!stdout) {
      Logger.log(colors.red('Failed to fetch packages. Please try again.'));

      return false;
    }

    if (!stdout.includes('Available Updates:')) {
      Logger.log(colors.yellow('No updates available.'));

      return true;
    }

    const availableUpdates = stdout.split('Available Updates:')[1].trimEnd();
    Logger.log(colors.bold('Available Updates:'));
    Logger.log(availableUpdates);

    const availableUpdatesList = availableUpdates.split('\n').filter(line => line !== '').slice(2);
    const availableUpdatesNames: string[] = [];

    availableUpdatesList.forEach(updateInfo => {
      const updateName = updateInfo.split('|')[0].trim();
      availableUpdatesNames.push(updateName);
    });

    const updateAnswer = await inquirer.prompt({
      type: 'checkbox',
      name: 'packageName',
      message: 'Select the packages to update:',
      choices: [...availableUpdatesNames, 'Update all']
    });
    const packageName = updateAnswer.packageName;

    if (packageName === 'Update all') {
      Logger.log();
      Logger.log('Updating all packages... \n');

      const updateStatus = execBinarySync(sdkmanagerLocation, 'sdkmanager', platform, '--update');
      if (!updateStatus?.includes('100% Unzipping')) {
        Logger.log(colors.red('Failed to update packages! Please try again.'));

        return false;
      }
      Logger.log(colors.green('All packages updated successfully!'));
    } else {
      Logger.log();
      Logger.log(`Updating ${colors.cyan(packageName)}... \n`);

      const updateStatus = execBinarySync(sdkmanagerLocation, 'sdkmanager', platform, `'${packageName}'`);
      if (!updateStatus?.includes('100% Unzipping')) {
        Logger.log(colors.red('Failed to update package! Please try again.'));

        return false;
      }
      Logger.log(colors.green('Package updated successfully!'));
    }

    return true;
  } catch (err) {
    Logger.log(colors.red('Error occured while updating the packages.'));
    console.error(err);

    return false;
  }
}

