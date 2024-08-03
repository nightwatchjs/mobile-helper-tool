import colors from 'ansi-colors';
import inquirer from 'inquirer';

import Logger from '../../../../logger';
import {symbols} from '../../../../utils';
import {Platform} from '../../interfaces';
import {execBinarySync} from '../../utils/sdk';
import {getBinaryLocation} from '../../utils/common';
import {getInstalledSystemImages} from '../common';

export async function deleteSystemImage(sdkRoot: string, platform: Platform): Promise<boolean> {
  try {
    const sdkmanagerLocation = getBinaryLocation(sdkRoot, platform, 'sdkmanager', true);
    if (!sdkmanagerLocation) {
      Logger.log(`  ${colors.red(symbols().fail)} ${colors.cyan('adb')} binary not found.\n`);
      Logger.log(`Run: ${colors.cyan('npx @nightwatch/mobile-helper android --standalone')} to setup missing requirements.`);
      Logger.log(`(Remove the ${colors.gray('--standalone')} flag from the above command if setting up for testing.)\n`);

      return false;
    }
    const installedImages: string[] = await getInstalledSystemImages(sdkmanagerLocation, platform);
    if (!installedImages.length) {
      return false;
    }

    const systemImageAnswer = await inquirer.prompt({
      type: 'list',
      name: 'systemImage',
      message: 'Select the system image to uninstall:',
      choices: installedImages
    });
    const systemImage = systemImageAnswer.systemImage;

    Logger.log();
    Logger.log(`Uninstalling ${colors.cyan(systemImageAnswer.systemImage)}...\n`);

    const deleteStatus = execBinarySync(sdkmanagerLocation, 'sdkmanager', platform, `--uninstall '${systemImage}'`);
    if (!deleteStatus?.includes('100% Fetch remote repository')) {
      Logger.log(`${colors.red('Failed to uninstall system image!')} Please try again.`);

      return false;
    }
    Logger.log(colors.green('System image uninstalled successfully!\n'));

    deleteObsoleteAVDs(sdkRoot, platform);

    return true;
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

