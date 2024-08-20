import inquirer from 'inquirer';

import Logger from '../../../../logger';
import {Options, Platform} from '../../interfaces';
import {listInstalledAVDs} from './avd';
import {listConnectedDevices} from './device';
import {verifyOptions} from '../common';

export async function list(options: Options, sdkRoot: string, platform: Platform): Promise<boolean> {
  const optionsVerified = verifyOptions('list', options);
  if (!optionsVerified) {
    return false;
  }

  const subcommandFlag = optionsVerified.subcommandFlag;
  if (subcommandFlag === '') {
    await flagsPrompt(options);
  }

  if (options.avd) {
    return await listInstalledAVDs(sdkRoot, platform);
  } else if (options.device) {
    return await listConnectedDevices(sdkRoot, platform);
  }

  return false;
}

async function flagsPrompt(options: Options) {
  const flagAnswer = await inquirer.prompt({
    type: 'list',
    name: 'flag',
    message: 'Select what do you want to list:',
    choices: ['Connected devices', 'Installed AVDs']
  });

  const flag = flagAnswer.flag;
  if (flag === 'Connected devices') {
    options.device = true;
  } else if (flag === 'Installed AVDs') {
    options.avd = true;
  }
  Logger.log();
}

