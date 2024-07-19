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
  const optionsPassed = Object.keys(options).filter(option => options[option] !== false);
  const availableOptions = AVAILABLE_SUBCOMMANDS[subcommand].options;

  const availableOptionsNames = availableOptions.map(option => option.name);

  // Divide the optionsPassed array in two arrays: mainOptionsPassed and valuedOptionsPassed.
  // mainOptionsPassed contains the main option that is available for the subcommand.
  // valuedOptionsPassed contains the options with string values corresponding to the main option.

  const mainOptionsPassed = optionsPassed.filter(option => availableOptionsNames.includes(option));
  const valuedOptionsPassed = optionsPassed.filter(option => !availableOptionsNames.includes(option));

  if (mainOptionsPassed.length > 1) {
    // A subcommand can only have one main option.
    Logger.log(`${colors.red('Too many options passed:')} ${mainOptionsPassed.join(', ')}`);
    showHelp(subcommand);

    return false;
  } else if (mainOptionsPassed.length === 0) {
    // If the main option is not present, then any other options present are invalid.
    Logger.log(`${colors.red('Unknown option(s) passed:')} ${valuedOptionsPassed.join(', ')}`);
    showHelp(subcommand);

    return false;
  }

  const mainOption = mainOptionsPassed[0];
  const availableValuedOptions = availableOptions.find(option => option.name === mainOption)?.valuedOptions;

  if (availableValuedOptions?.length) {
    // If the main option has valued options, then check if the passed valued options are valid.
    const valuedOptionsNames = availableValuedOptions.map(option => option.name);
    const valuedOptionsAliases: string[] = [];

    availableValuedOptions.forEach(option => valuedOptionsAliases.push(...option.alias));
    valuedOptionsNames.push(...valuedOptionsAliases);

    const unknownValuedOptions = valuedOptionsPassed.filter(option => !valuedOptionsNames.includes(option));

    if (unknownValuedOptions.length) {
      Logger.log(`${colors.red('Unknown option(s) passed:')} ${unknownValuedOptions.join(', ')}`);
      showHelp(subcommand);

      return false;
    }
  } else if (!availableValuedOptions?.length && valuedOptionsPassed.length) {
    // If the main option does not have valued options, then all the other options present are invalid.
    Logger.log(`${colors.red('Unknown option(s) passed:')} ${valuedOptionsPassed.join(', ')}`);
    showHelp(subcommand);

    return false;
  }

  return true;
}

