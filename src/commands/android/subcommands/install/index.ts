import inquirer from 'inquirer';

import Logger from '../../../../logger';
import {Options, Platform} from '../../interfaces';
import {verifyOptions} from '../common';
import {installApp} from './app';
import {createAvd} from './avd';

export async function install(options: Options, sdkRoot: string, platform: Platform): Promise<boolean> {
  const optionsVerified = verifyOptions('install', options);
  if (!optionsVerified) {
    return false;
  }

  const subcommandFlag = optionsVerified.subcommandFlag;
  if (subcommandFlag === '') {
    await flagsPrompt(options);
  }

  if (options.app) {
    return await installApp(options, sdkRoot, platform);
  } else if (options.avd) {
    return await createAvd(sdkRoot, platform);
  }

  return false;
}

async function flagsPrompt(options: Options) {
  const flagAnswer = await inquirer.prompt({
    type: 'list',
    name: 'flag',
    message: 'Select what do you want to install:',
    choices: ['APK', 'AVD']
  });

  const flag = flagAnswer.flag;
  if (flag === 'APK') {
    options.app = true;
  } else if (flag === 'AVD') {
    options.avd = true;
  }
  Logger.log();
}

