import inquirer from 'inquirer';

import Logger from '../../../../logger';
import {Options, Platform} from '../../interfaces';
import {verifyOptions} from '../common';
import {uninstallApp} from './app';
import {deleteAvd} from './avd';

export async function uninstall(options: Options, sdkRoot: string, platform: Platform): Promise<boolean> {
  const optionsVerified = verifyOptions('uninstall', options);
  if (!optionsVerified) {
    return false;
  }

  let subcommandFlag = optionsVerified.subcommandFlag;
  if (subcommandFlag === '') {
    subcommandFlag = await promptForFlag();
  }

  if (subcommandFlag === 'app') {
    return await uninstallApp(options, sdkRoot, platform);
  } else if (subcommandFlag === 'avd') {
    return await deleteAvd(sdkRoot, platform);
  }

  return false;
}

async function promptForFlag(): Promise<string> {
  const flagAnswer = await inquirer.prompt({
    type: 'list',
    name: 'flag',
    message: 'Select what you want to uninstall:',
    choices: ['Android App', 'Android Virtual Device (AVD)']
  });
  Logger.log();

  const flag = flagAnswer.flag;
  if (flag === 'Android App') {
    return 'app';
  }

  return 'avd';
}

