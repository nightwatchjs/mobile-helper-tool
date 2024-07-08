import colors from 'ansi-colors';

import Logger from '../../../logger';
import {AVAILABLE_SUBCOMMANDS} from '../constants';
import {Options} from '../interfaces';
import {getSubcommandOptionsHelp} from '../utils/common';

export function showHelp(subcommand: string) {
  const subcmd = AVAILABLE_SUBCOMMANDS[subcommand];

  Logger.log(`Usage: ${colors.cyan(`npx @nightwatch/mobile-helper android ${subcommand} [options]`)}\n`);
  Logger.log(colors.yellow('Options:'));

  const subcmdOptionsHelp = getSubcommandOptionsHelp(subcmd);
  Logger.log(subcmdOptionsHelp);
}

export function verifyOptions(subcommand: string, options: Options): boolean {
  const optionsPassed = Object.keys(options).filter(option => options[option] === true);
  if (optionsPassed.length > 1) {
    Logger.log(`${colors.red('Too many options passed:')} ${optionsPassed.join(', ')}`);
    showHelp(subcommand);

    return false;
  }

  const availableOptions = AVAILABLE_SUBCOMMANDS[subcommand].options.map(option => option.name);
  const option = optionsPassed[0];

  if (!availableOptions.includes(option)) {
    Logger.log(`${colors.red(`unknown option passed: ${option}`)}`);
    showHelp(subcommand);

    return false;
  }

  return true;
}

