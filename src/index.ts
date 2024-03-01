import colors from 'ansi-colors';
import minimist from 'minimist';
import { AndroidSetup } from './commands/android';
import { IosSetup } from './commands/ios';
import { AVAILABLE_COMMANDS } from './constants';

const run = () => {
  try {
    const { _: args, ...options } = minimist(process.argv.slice(2), {
      boolean: ['install', 'setup', 'help', 'appium'],
      alias: { help: 'h', mode: 'm', browsers: ['b', 'browser'], setup: ['install', 'i'] }
    });

    if (!args[0] || !AVAILABLE_COMMANDS.includes(args[0])) showHelp(args[0], options.help);
    else (args[0] === 'android') ? new AndroidSetup(options).run() : new IosSetup(options).run();
  } catch (err) { console.error(err), process.exit(1); }
};

const showHelp = (cmd, helpFlag) => {
  console.log(colors.red(cmd ? `unknown command: ${cmd}` : 'No command passed.'), '\n');
  console.log(`Usage: ${colors.cyan('npx @nightwatch/mobile-helper COMMAND [options]')}\n`);
  console.log(`Available commands: ${colors.green(AVAILABLE_COMMANDS.join(', '))}\n`);
  console.log(`To know more about each command, run:\n${colors.cyan('npx @nightwatch/mobile-helper COMMAND --help')}`);
};

export { run, AndroidSetup, IosSetup };
export * from './commands/android/adb';
export { getBinaryNameForOS, getBinaryLocation } from './commands/android/utils/common';
export { execBinarySync } from './commands/android/utils/sdk';
export { getPlatformName } from './utils';
