import inquirer from 'inquirer';

import Logger from '../../../../logger';
import {Options, Platform} from '../../interfaces';
import {verifyOptions, showConnectedRealDevices} from '../common';
import {connectAVD} from './emulator';
import {connectWirelessAdb} from './wireless';

export async function connect(options: Options, sdkRoot: string, platform: Platform): Promise<boolean> {
  const verifyResult = verifyOptions('connect', options);
  if (!verifyResult) {
    return false;
  }

  let subcommandFlag = verifyResult.subcommandFlag;
  if (subcommandFlag === '') {
    subcommandFlag = await promptForFlag();
  }

  if (subcommandFlag === 'wireless') {
    await showConnectedRealDevices();

    return await connectWirelessAdb(sdkRoot, platform);
  } else if (subcommandFlag === 'emulator') {
    return await connectAVD(options, sdkRoot, platform);
  }

  return false;
}

async function promptForFlag(): Promise<string> {
  const flagAnswer = await inquirer.prompt({
    type: 'list',
    name: 'flag',
    message: 'Select what do you want to connect:',
    choices: ['Real device', 'Emulator']
  });
  Logger.log();

  const flag = flagAnswer.flag;
  if (flag === 'Real device') {
    return 'wireless';
  }

  return 'emulator';
}

