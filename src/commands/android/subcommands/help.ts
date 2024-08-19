import colors from 'ansi-colors';

import Logger from '../../../logger';
import {AVAILABLE_SUBCOMMANDS} from '../constants';
import {CliConfig, Subcommand} from './interfaces';

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

export const getSubcommandHelp = (): string => {
  let output = '';

  output += `Usage: ${colors.cyan('npx @nightwatch/mobile-helper android subcmd [subcmd-options]')}\n`;
  output += '  The following subcommands are used for different operations on Android SDK:\n\n';
  output += `${colors.yellow('Subcommands and Subcommand-Options:')}\n`;

  Object.keys(AVAILABLE_SUBCOMMANDS).forEach(subcommand => {
    const subcmd = AVAILABLE_SUBCOMMANDS[subcommand];

    // A subcommand will have flags to facilitate multiple workflows. If a subcommand has single
    // workflow, then it won't have flags but might have configs with string or boolean values.

    // Display the subcommand name along with flags in the format:
    // subcommand [--flag1] [--flag2] ...
    // OR
    // with the configs in the format:
    // subcommand [--config1 <usageHelp>] [--config2 <usageHelp>] ...

    const subcmdFlags = subcmd.flags?.map(flag => `[--${flag.name}]`).join(' ') || '';
    const subcmdConfigs = generateConfigsString(subcmd.cliConfigs);

    output += `  ${colors.cyan(subcommand)} ${subcmdFlags} ${subcmdConfigs}\n`;
    output += `  ${colors.gray(subcmd.description)}\n`;

    // Display list of configs for the subcommand along with description

    if (subcmd.cliConfigs) {

      // Generate strings of configs with their aliases in the format:
      // --config1 | -c11 | -c12 ...
      // --config2 | -c21 | -c22 ...

      const configsWithAlias = getConfigsWithAlias(subcmd.cliConfigs);

      subcmd.cliConfigs.forEach((config, idx) => {
        const padding = generatePadding(configsWithAlias, configsWithAlias[idx].length);
        output += `    ${configsWithAlias[idx]} ${colors.grey(padding)} ${colors.gray(config.description)}\n`;
      });
    }

    // Display the list of flags for the subcommand along with description.

    output += getSubcommandFlagsHelp(subcmd);
    output += '\n';
  });

  return output;
};

export const getSubcommandFlagsHelp = (subcmd: Subcommand): string => {
  let output = '';

  if (subcmd.flags.length) {

    // Generate a list of 'flagsWithConfigs' strings in the format:
    // --flag1 [--config11 <usageHelp>] [--config12 <usageHelp>] ...
    // --flag2 [--config21 <usageHelp>] [--config22 <usageHelp>] ...

    const flagsWithConfigs = subcmd.flags.map((flag) => {
      const configs = generateConfigsString(flag.cliConfigs);

      return '--' + flag.name + ' ' + configs;
    });

    subcmd.flags.forEach((flag, idx) => {
      const padding = generatePadding(flagsWithConfigs, flagsWithConfigs[idx].length);

      output += `    ${flagsWithConfigs[idx]} ${colors.grey(padding)} ${colors.gray(flag.description)}\n`;

      // Show the list of configs for the flag along with description.

      if (flag.cliConfigs) {

        // Generate strings of configs with their aliases in the format:
        // --config1 | -c11 | -c12 ...
        // --config2 | -c21 | -c22 ...

        const configsWithAlias = getConfigsWithAlias(flag.cliConfigs);

        flag.cliConfigs.forEach((config, idx) => {
          const padding = generatePadding(configsWithAlias, configsWithAlias[idx].length);
          output += `        ${configsWithAlias[idx]} ${colors.grey(padding)} ${colors.gray(config.description)}\n`;
        });
      }
    });
  }

  return output;
};

const generateConfigsString = (configs: CliConfig[] | undefined) => {

  // Generate a string of configs in the format:
  // [--config1 <usageHelp>] [--config2 <usageHelp>] ...

  if (!configs) {
    return '';
  }

  let configsStr = '';
  configs.forEach(config => {
    configsStr += `[--${config.name} <${config.usageHelp}>] `;
  });

  return configsStr;
};

const generatePadding = (array: string[], length: number): string => {
  const longest = (xs: string[]) => Math.max.apply(null, xs.map(x => x.length));
  const padding = new Array(Math.max(longest(array) - length + 3, 0)).join('.');

  return padding;
};

const getConfigsWithAlias = (configs: CliConfig[]): string[] => {
  const configsWithAlias = configs.map(config => {
    const configAlias = config.alias.map(alias => `-${alias}`).join(' |');

    return `--${config.name}` + (configAlias ? ` | ${configAlias}` : '');
  });

  return configsWithAlias;
};

