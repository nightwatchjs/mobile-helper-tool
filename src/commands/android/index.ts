import colors from 'ansi-colors';

import {AndroidSetup} from './androidSetup';
import {Options} from './interfaces';
import {AndroidSubcommand} from './subcommands';
import {getSubcommandHelp} from './subcommands/help';

export function handleAndroidCommand(args: string[], options: Options): void {
  if (args.length === 1) {
    const androidSetup = new AndroidSetup(options);
    androidSetup.run();
  } else if (args.length === 2) {
    // Here args[1] represents the android subcommand.
    const androidSubcommand = new AndroidSubcommand(args[1], options);
    androidSubcommand.run();
  } else {
    // android command doesn't accept more than one argument.
    console.log(`${colors.red(`Too many arguments passed for 'android' command: ${args.slice(1).join(', ')}`)}\n`);

    console.log(getSubcommandHelp());
  }
}

