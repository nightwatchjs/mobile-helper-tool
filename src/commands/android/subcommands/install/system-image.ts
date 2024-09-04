import colors from 'ansi-colors';
import inquirer from 'inquirer';

import Logger from '../../../../logger';
import {Platform} from '../../interfaces';
import {getBinaryLocation} from '../../utils/common';
import {execBinarySync, spawnCommandSync} from '../../utils/sdk';
import apiLevelNames from '../apiLevelNames.json';
import {showMissingBinaryHelp} from '../common';
import {ApiLevelNames, AvailableSystemImages} from '../interfaces';

export async function installSystemImage(sdkRoot: string, platform: Platform): Promise<boolean> {
  try {
    const sdkmanagerLocation = getBinaryLocation(sdkRoot, platform, 'sdkmanager', true);
    if (!sdkmanagerLocation) {
      showMissingBinaryHelp('sdkmanager');

      return false;
    }

    const stdout = execBinarySync(sdkmanagerLocation, 'sdkmanager', platform, '--list');
    if (!stdout) {
      Logger.log(`${colors.red('Failed to fetch available system images!')} Please try again.`);

      return false;
    }

    // sdkmanager output has repetitive system image names in different sections (Installed
    // packages, Available packages, Available updates).
    // Parse the output and store the system images in a Set to avoid duplicates.
    const images = new Set<string>();
    // Before removing duplicates, sort the system images to get them in increasing order of API level.
    const lines = stdout.split('\n').sort();

    lines.forEach(line => {
      if (!line.includes('system-images;')) {
        return;
      }
      const image = line.split('|')[0].trim();
      images.add(image);
    });

    // System images are represented in the format: system-images;android-<api-level>;<type>;<arch>
    // Group all the system image types by API level. Group all the architectures by system image type.
    const availableSystemImages: AvailableSystemImages = {};

    images.forEach(image => {
      if (!image.includes('system-image')) {
        return;
      }
      const imageSplit = image.split(';');
      const apiLevel = imageSplit[1];
      const type = imageSplit[2];
      const arch = imageSplit[3];

      if (!availableSystemImages[apiLevel]) {
        availableSystemImages[apiLevel] = [];
      }

      const imageType = availableSystemImages[apiLevel].find(image => image.type === type);
      if (!imageType) {
        availableSystemImages[apiLevel].push({
          type: type,
          archs: [arch]
        });
      } else {
        imageType.archs.push(arch);
      }
    });

    const apiLevelsWithNames = Object.keys(availableSystemImages).map(apiLevel => {
      let name = apiLevel;
      if ((apiLevelNames as ApiLevelNames)[apiLevel]) {
        name = `${apiLevel}: ${(apiLevelNames as ApiLevelNames)[apiLevel]}`;
      }

      return {name, value: apiLevel};
    });

    const androidVersionAnswer = await inquirer.prompt({
      type: 'list',
      name: 'androidVersion',
      message: 'Select the API level for system image:',
      choices: apiLevelsWithNames
    });
    const apiLevel = androidVersionAnswer.androidVersion;

    const systemImageTypeAnswer = await inquirer.prompt({
      type: 'list',
      name: 'systemImageType',
      message: `Select the system image type for ${colors.cyan(apiLevel)}:`,
      choices: availableSystemImages[apiLevel].map(image => image.type)
    });
    const type = systemImageTypeAnswer.systemImageType;

    const systemImageArchAnswer = await inquirer.prompt({
      type: 'list',
      name: 'systemImageArch',
      message: 'Select the architecture for the system image:',
      choices: availableSystemImages[apiLevel].find(image => image.type === type)?.archs
    });
    const arch = systemImageArchAnswer.systemImageArch;

    const systemImageName = `system-images;${apiLevel};${type};${arch}`;

    Logger.log();
    Logger.log(`Installing system image: ${colors.cyan(systemImageName)}\n`);

    const installationStatus = spawnCommandSync(sdkmanagerLocation, 'sdkmanager', platform, [systemImageName]);
    if (installationStatus) {
      Logger.log(colors.green('System image installed successfully!\n'));

      return true;
    }

    Logger.log(colors.red('Something went wrong while installing system image.'));
    Logger.log(`Please run ${colors.cyan('npx @nightwatch/mobile-helper android.sdkmanager --list_installed')} to verify if the system image was installed.`);
    Logger.log('If the system image was not installed, please try installing again.\n');

    return false;
  } catch (error) {
    Logger.log(colors.red('Error occured while installing system image.'));
    console.error(error);

    return false;
  }
}

