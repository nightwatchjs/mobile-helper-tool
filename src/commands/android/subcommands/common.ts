import colors from 'ansi-colors';

import Logger from '../../../logger';
import {AVAILABLE_SUBCOMMANDS} from '../constants';
import {Options, verifyOptionsResult} from '../interfaces';
import {getSubcommandOptionsHelp} from '../utils/common';

export function showHelp(subcommand: string) {
  const subcmd = AVAILABLE_SUBCOMMANDS[subcommand];

  Logger.log(`Usage: ${colors.cyan(`npx @nightwatch/mobile-helper android ${subcommand} [options]`)}\n`);
  Logger.log(colors.yellow('Options:'));

  const subcmdOptionsHelp = getSubcommandOptionsHelp(subcmd);
  Logger.log(subcmdOptionsHelp);
}

export function verifyOptions(subcommand: string, options: Options): false | verifyOptionsResult {
  const optionsPassed = Object.keys(options).filter(option => options[option] !== false);
  const availableOptions = AVAILABLE_SUBCOMMANDS[subcommand].options;

  const availableOptionsNames = availableOptions.map(option => option.name);

  // Divide the optionsPassed array in two arrays: mainOptionsPassed and optionFlagsPassed.
  // mainOptionsPassed contains the main option that is available for the subcommand.
  // optionFlagsPassed contains the options with string or boolean values corresponding to the main option.

  const mainOptionsPassed = optionsPassed.filter(option => availableOptionsNames.includes(option));
  const optionFlagsPassed = optionsPassed.filter(option => !availableOptionsNames.includes(option));

  if (mainOptionsPassed.length > 1) {
    // A subcommand can only have one main option.
    Logger.log(`${colors.red(`Too many options passed for subcommand ${subcommand}:`)} ${mainOptionsPassed.join(', ')}`);
    showHelp(subcommand);

    return false;
  } else if (mainOptionsPassed.length === 0 && optionFlagsPassed.length) {
    // If the main option is not present, then any other options present are invalid.
    Logger.log(`${colors.red(`Unknown option(s) passed for subcommand ${subcommand}:`)} ${optionFlagsPassed.join(', ')}`);
    showHelp(subcommand);

    return false;
  } else if (mainOptionsPassed.length === 0 && optionFlagsPassed.length === 0) {
    // If no options are passed, then we simply return and continue with the default subcommand flow.
    return {
      mainOption: '',
      flags: []
    };
  }

  const mainOption = mainOptionsPassed[0];
  const availableOptionFlags = availableOptions.find(option => option.name === mainOption)?.flags;

  if (availableOptionFlags?.length) {
    // If the main option has flags, then check if the passed flags are valid.
    const flagsNames = availableOptionFlags.map(flag => flag.name);
    const flagsAliases: string[] = [];

    availableOptionFlags.forEach(option => flagsAliases.push(...option.alias));
    flagsNames.push(...flagsAliases);

    const unknownFlags = optionFlagsPassed.filter(option => !flagsNames.includes(option));

    if (unknownFlags.length) {
      Logger.log(`${colors.red(`Unknown flag(s) passed for ${mainOption} option:`)} ${unknownFlags.join(', ')}`);
      Logger.log(`(Allowed flags: ${(flagsNames.join(', '))})\n`);
      showHelp(subcommand);

      return false;
    }
  } else if (!availableOptionFlags?.length && optionFlagsPassed.length) {
    // If the main option does not have flags, then all the other options present are invalid.
    Logger.log(`${colors.red(`Unknown flag(s) passed for ${mainOption} option:`)} ${optionFlagsPassed.join(', ')}`);
    Logger.log('(none expected)\n');
    showHelp(subcommand);

    return false;
  }

  return {
    mainOption: mainOption,
    flags: optionFlagsPassed
  };
}

