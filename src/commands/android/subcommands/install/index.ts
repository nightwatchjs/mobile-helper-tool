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

  let subcommandFlag = optionsVerified.subcommandFlag;
  if (subcommandFlag === '') {
    subcommandFlag = await promptForFlag();
  }

  if (subcommandFlag === 'app') {
    return await installApp(options, sdkRoot, platform);
  } else if (subcommandFlag === 'avd') {
    return await createAvd(sdkRoot, platform);
  }

  return false;
}

async function promptForFlag(): Promise<string> {
  const flagAnswer = await inquirer.prompt({
    type: 'list',
    name: 'flag',
    message: 'Select what do you want to install:',
    choices: ['APK', 'AVD']
  });
  Logger.log();

  const flag = flagAnswer.flag;
  if (flag === 'APK') {
    return 'app';
  }

  return 'avd';
}

