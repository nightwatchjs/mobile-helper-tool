import colors from 'ansi-colors';
import minimist from 'minimist';

import {AndroidSetup} from './commands/android';
import {AndroidSubcommand} from './commands/android/subcommands';
import {AVAILABLE_COMMANDS} from './constants';
import {IosSetup} from './commands/ios';

export const run = () => {
  try {
    const argv = process.argv.slice(2);
    const {_: args, ...options} = minimist(argv, {
      boolean: ['install', 'setup', 'help', 'appium', 'standalone'],
      alias: {
        help: 'h',
        mode: 'm',
        browsers: ['b', 'browser'],
        setup: ['install', 'i']
      }
    });

    if (!args[0]) {
      if (!options.help) {
        // Show error message if help flag is not present.
        console.log(`${colors.red('No command passed.')}\n`);
      }
      showHelp();
    } else if (!AVAILABLE_COMMANDS.includes(args[0])) {
      console.log(`${colors.red(`Unknown command passed: ${args[0]}`)}\n`);
      showHelp();
    } else if (args.length > 2 || (args[0] === 'ios' && args.length > 1)) {
      // android command can accept only one subcommand.
      // ios command does not accept subcommands.
      console.log(`${colors.red(`Too many arguments passed: ${args.slice(1).join(', ')}`)}\n`);
      showHelp();
    } else if (args[0] === 'android') {
      if (args[1]) {
        // args[1] represents the android subcommand.
        // If subcommand is present then proceed to run the subcommand.
        const androidSubcommand = new AndroidSubcommand(args[1], options);
        androidSubcommand.run();
      } else {
        // If no subcommand is present then proceed to run the main android setup.
        const androidSetup = new AndroidSetup(options);
        androidSetup.run();
      }
    } else if (args[0] === 'ios') {
      const iOSSetup = new IosSetup(options);
      iOSSetup.run();
    }
  } catch (err) {
    console.error(err as string);
    process.exit(1);
  }
};

const showHelp = () => {
  console.log(`Usage: ${colors.cyan('npx @nightwatch/mobile-helper COMMAND [options|args]')}\n`);

  console.log(`Available commands: ${colors.green(AVAILABLE_COMMANDS.join(', '))}\n`);
  console.log(`To know more about each command, run:
  ${colors.cyan('npx @nightwatch/mobile-helper COMMAND --help')}`);
};

export {AndroidSetup, IosSetup};
export * from './commands/android/adb';
export {getBinaryNameForOS, getBinaryLocation} from './commands/android/utils/common';
export {execBinarySync} from './commands/android/utils/sdk';
export {getPlatformName} from './utils';
