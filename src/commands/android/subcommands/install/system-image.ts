import colors from 'ansi-colors';
import inquirer from 'inquirer';

import Logger from '../../../../logger';
import {APILevelNames} from '../../constants';
import {AvailableSystemImages, Platform} from '../../interfaces';
import {getBinaryLocation} from '../../utils/common';
import {execBinarySync} from '../../utils/sdk';
import {showMissingBinaryHelp} from '../common';

export async function installSystemImage(sdkRoot: string, platform: Platform): Promise<boolean> {
  try {
    const sdkmanagerLocation = getBinaryLocation(sdkRoot, platform, 'sdkmanager', true);
    if (!sdkmanagerLocation) {
      showMissingBinaryHelp('sdkmanager');

      return false;
    }

    const stdout = execBinarySync(sdkmanagerLocation, 'sdkmanager', platform, '--list | grep "system-images;"');
    if (!stdout) {
      Logger.log(`${colors.red('Failed to fetch system images!')} Please try again.`);

      return false;
    }

    // sdkmanager output has repetitive system image names in different sections (Installed
    // packages, Available packages, Available updates).
    // Parse the output and store the system images in a Set to avoid duplicates.
    const images = new Set<string>();
    // Before removing duplicates, sort the system images to get them in increasing order of API level.
    const lines = stdout.split('\n').sort();

    lines.forEach(line => {
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
      if (APILevelNames[apiLevel]) {
        return `${apiLevel}: ${APILevelNames[apiLevel]}`;
      }

      return apiLevel;
    });

    const androidVersionAnswer = await inquirer.prompt({
      type: 'list',
      name: 'androidVersion',
      message: 'Select the API level for system image:',
      choices: apiLevelsWithNames
    });
    const apiLevel = androidVersionAnswer.androidVersion.split(':')[0];

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
      choices: availableSystemImages[apiLevel].find(image => image.type === systemImageTypeAnswer.systemImageType)?.archs
    });
    const arch = systemImageArchAnswer.systemImageArch;

    const systemImageName = `system-images;${apiLevel};${type};${arch}`;

    Logger.log();
    Logger.log(`Downloading ${colors.cyan(systemImageName)}...\n`);

    const downloadStatus = execBinarySync(sdkmanagerLocation, 'sdkmanager', platform, `'${systemImageName}'`);

    if (downloadStatus?.includes('100% Unzipping')) {
      Logger.log(`${colors.green('System image downloaded successfully!')}\n`);

      return true;
    } else if (downloadStatus?.includes('100% Computing updates')) {
      Logger.log(`${colors.green('System image already downloaded!')}\n`);

      return true;
    }

    return false;
  } catch (error) {
    Logger.log(colors.red('Error occured while installing system image.'));
    console.error(error);

    return false;
  }
}

