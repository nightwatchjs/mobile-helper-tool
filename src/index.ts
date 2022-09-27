import minimist from 'minimist';
import colors from 'ansi-colors';

import {AVAILABLE_COMMANDS} from './constants';
import {AndroidSetup} from './commands/android';

export const run = () => {
  try {
    const argv = process.argv.slice(2);
    const {_: args, ...options} = minimist(argv, {
      boolean: ['install', 'setup', 'help']
    });

    if (!args[0] || !AVAILABLE_COMMANDS.includes(args[0])) {
      showHelp(args[0], options.help);
    } else if (args[0] === 'android') {
      const androidSetup = new AndroidSetup(options);
      androidSetup.run();
    } else {
      console.log('ios setup here');
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
  console.log(`Available commands: ${AVAILABLE_COMMANDS}`);
  console.log(`To know more about each command, run:
  ${colors.cyan('npx @nightwatch/mobile-helper _command_name_ --help')}`);
};
