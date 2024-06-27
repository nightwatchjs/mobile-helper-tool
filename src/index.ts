import colors from 'ansi-colors';
import minimist from 'minimist';

import {AndroidSetup} from './commands/android';
import {IosSetup} from './commands/ios';
import {ANDROID_DOT_COMMANDS, AVAILABLE_COMMANDS, AVAILABLE_DOT_COMMANDS} from './constants';
import {AndroidDotCommand} from './commands/android/dotcommands';
import {SdkBinary} from './commands/android/interfaces';

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
      showHelp(args[0], options.help);
    } else {
      if (args[0].includes('.')) {
        // Handle dot commands
        const dotCommandArgs = args[0].split('.');
        if (dotCommandArgs.length !== 2 || !AVAILABLE_DOT_COMMANDS.includes(dotCommandArgs[0])) {
          showHelp(args[0], options.help);
        } else {
          if (dotCommandArgs[0] === 'android') {
            if (!ANDROID_DOT_COMMANDS.includes(dotCommandArgs[1])) {
              showHelp(args[0], options.help);
            } else {
              const androidDotCommand = new AndroidDotCommand((dotCommandArgs[1] as SdkBinary), args[1]);
              androidDotCommand.run();
            }
          }
        }
      } else {
        // Handle main commands
        if (!AVAILABLE_COMMANDS.includes(args[0]) || args.length > 2) {
          showHelp(args[0], options.help);
        } else {
          if (args[0] === 'android') {
            const androidSetup = new AndroidSetup(options, args[1]);
            androidSetup.run();
          } else if (args[0] === 'ios') {
            const iOSSetup = new IosSetup(options);
            iOSSetup.run();
          }
        }
      }
    }
  } catch (err) {
    console.error(err as string);
    process.exit(1);
  }
};

const showHelp = (cmdPassed: string, helpFlag: boolean) => {
  if (cmdPassed) {
    console.log(colors.red(`unknown command: ${cmdPassed}`), '\n');
  } else if (!helpFlag) {
    console.log(colors.red('No command passed.'), '\n');
  }

  console.log(`Usage: ${colors.cyan('npx @nightwatch/mobile-helper COMMAND [options]')}\n`);

  console.log(`Available commands: ${colors.green(AVAILABLE_COMMANDS.join(', '))}\n`);
  console.log(`To know more about each command, run:
  ${colors.cyan('npx @nightwatch/mobile-helper COMMAND --help')}`);
};

export {AndroidSetup, IosSetup};
export * from './commands/android/adb';
export {getBinaryNameForOS, getBinaryLocation} from './commands/android/utils/common';
export {execBinarySync} from './commands/android/utils/sdk';
export {getPlatformName} from './utils';
