import colors from 'ansi-colors';
import inquirer from 'inquirer';

import Logger from '../../../../logger';
import {Platform} from '../../interfaces';
import {getBinaryLocation} from '../../utils/common';
import {execBinarySync} from '../../utils/sdk';
import {getInstalledSystemImages, showMissingBinaryHelp} from '../common';

export async function deleteSystemImage(sdkRoot: string, platform: Platform): Promise<boolean> {
  try {
    const sdkmanagerLocation = getBinaryLocation(sdkRoot, platform, 'sdkmanager', true);
    if (!sdkmanagerLocation) {
      showMissingBinaryHelp('sdkmanager');

      return false;
    }
    const installedSystemImages = await getInstalledSystemImages(sdkmanagerLocation, platform);
    if (!installedSystemImages.result) {
      return false;
    }
    if (!installedSystemImages.systemImages.length) {
      Logger.log(colors.yellow('No installed system images were found!\n'));

      return false;
    }

    const systemImageAnswer = await inquirer.prompt({
      type: 'list',
      name: 'systemImage',
      message: 'Select the system image to uninstall:',
      choices: installedSystemImages.systemImages
    });
    const systemImage = systemImageAnswer.systemImage;

    Logger.log();
    Logger.log(`Uninstalling ${colors.cyan(systemImageAnswer.systemImage)}...\n`);

    const deleteStatus = execBinarySync(sdkmanagerLocation, 'sdkmanager', platform, `--uninstall '${systemImage}'`);
    if (deleteStatus?.includes('100% Fetch remote repository')) {
      Logger.log(colors.green('System image uninstalled successfully!\n'));

      deleteObsoleteAVDs(sdkRoot, platform);

      return true;
    }

    Logger.log(colors.red('\nSomething went wrong while uninstalling system image.\n'));
    Logger.log(`To verify if the system image was uninstalled, run: ${colors.cyan('npx @nightwatch/mobile-helper android.sdkmanager --list_installed')}`);
    Logger.log('If the system image is found listed, please try uninstalling again.\n');

    return false;
  } catch (error) {
    Logger.log(colors.red('Error occured while uninstalling system image.'));
    console.error(error);

    return false;
  }
}

async function deleteObsoleteAVDs(sdkRoot: string, platform: Platform) {
  const avdmanagerLocation = getBinaryLocation(sdkRoot, platform, 'avdmanager', true);
  if (!avdmanagerLocation) {
    return;
  }
  const stdout = execBinarySync(avdmanagerLocation, 'avdmanager', platform, 'list avd');
  if (!stdout) {
    return;
  }
  const obsoleteAVDs = stdout.split('The following Android Virtual Devices could not be loaded:')[1];
  if (obsoleteAVDs) {
    const obsoleteAVDNames: string[] = [];

    obsoleteAVDs.split('\n').forEach(line => {
      if (line.includes('Name: ')) {
        const avdName = line.split(':')[1].trim();
        obsoleteAVDNames.push(avdName);
      }
    });

    Logger.log(colors.yellow('The following AVDs can no longer be used due to missing system image:\n'));

    obsoleteAVDNames.forEach((avdName, idx) => {
      Logger.log(`${idx+1}. ${avdName}`);
    });
    Logger.log();

    const deleteAnswer = await inquirer.prompt({
      type: 'confirm',
      name: 'delete',
      message: 'Do you want to delete these AVDs?'
    });

    if (!deleteAnswer.delete) {
      return;
    }

    Logger.log();
    Logger.log('Deleting obsolete AVDs...\n');

    obsoleteAVDNames.forEach(avdName => {
      const deleteStatus = execBinarySync(avdmanagerLocation, 'avdmanager', platform, `delete avd --name ${avdName}`);
      if (deleteStatus?.includes('deleted')) {
        Logger.log(`${colors.green('Deleted:')} ${avdName}`);

        return;
      }
      Logger.log(`${colors.red('Failed to delete:')} ${avdName}`);
    });
    Logger.log();
  }
}

