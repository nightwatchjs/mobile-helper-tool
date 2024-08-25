import colors from 'ansi-colors';

import Logger from '../../../logger';
import {AVAILABLE_SUBCOMMANDS} from '../constants';
import {Subcommand} from './interfaces';

export function showHelp(subcommand: string) {
  const subcmd = AVAILABLE_SUBCOMMANDS[subcommand];

  const subcmdFlagUsage = subcmd.flags?.length ? ' [flag]' : '';
  Logger.log(`Usage: ${colors.cyan(`npx @nightwatch/mobile-helper android ${subcommand}${subcmdFlagUsage} [configs]`)}\n`);

  const subcmdFlagsHelp = getSubcommandFlagsHelp(subcmd);
  if (subcmdFlagsHelp) {
    Logger.log(colors.yellow('Available flags:'));
    Logger.log(subcmdFlagsHelp);
  }
}

export const getSubcommandFlagsHelp = (subcmd: Subcommand) => {
  let output = '';
  const longest = (xs: string[]) => Math.max.apply(null, xs.map(x => x.length));

  if (subcmd.flags && subcmd.flags.length > 0) {
    const optionLongest = longest(subcmd.flags.map(flag => `--${flag.name}`));
    subcmd.flags.forEach(flag => {
      const flagStr = `--${flag.name}`;
      const optionPadding = new Array(Math.max(optionLongest - flagStr.length + 3, 0)).join('.');
      output += `    ${flagStr} ${colors.grey(optionPadding)} ${colors.gray(flag.description)}\n`;
    });
  }

  return output;
};
