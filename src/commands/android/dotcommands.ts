import colors from 'ansi-colors';
import {spawnSync} from 'child_process';
import * as dotenv from 'dotenv';
import path from 'path';

import {ANDROID_DOTCOMMANDS} from '../../constants';
import Logger from '../../logger';
import {getPlatformName} from '../../utils';
import {Platform, SdkBinary} from './interfaces';
import {checkJavaInstallation, getBinaryLocation, getBinaryNameForOS, getSdkRootFromEnv} from './utils/common';

export class AndroidDotCommand {
  dotcmd: string;
  args: string[];
  sdkRoot: string;
  rootDir: string;
  platform: Platform;
  androidHomeInGlobalEnv: boolean;

  constructor(dotcmd: string, argv: string[], rootDir = process.cwd()) {
    this.dotcmd = dotcmd;
    this.args = argv.slice(1);
    this.sdkRoot = '';
    this.rootDir = rootDir;
    this.platform = getPlatformName();
    this.androidHomeInGlobalEnv = false;
  }

  async run(): Promise<boolean> {
    if (!ANDROID_DOTCOMMANDS.includes(this.dotcmd)) {
      Logger.log(colors.red(`Unknown dot command passed: ${this.dotcmd}\n`));

      Logger.log('Run Android SDK command line tools using the following command:');
      Logger.log(colors.cyan('npx @nightwatch/mobile-helper <DOTCMD> [options|args]\n'));

      Logger.log(`Available Dot Commands: ${colors.magenta(ANDROID_DOTCOMMANDS.join(', '))}\n`);
      Logger.log('Example command: npx @nightwatch/mobile-helper android.emulator @nightwatch-android-11\n');

      return false;
    }

    const javaInstalled = checkJavaInstallation(this.rootDir);

    if (!javaInstalled) {
      return false;
    }

    this.loadEnvFromDotEnv();
    const sdkRootEnv = getSdkRootFromEnv(this.rootDir, this.androidHomeInGlobalEnv);

    if (!sdkRootEnv) {
      Logger.log(`Run: ${colors.cyan('npx @nightwatch/mobile-helper android --standalone')} to fix this issue.`);
      Logger.log(`(Remove the ${colors.gray('--standalone')} flag from the above command if using the tool for testing.)\n`);

      return false;
    }
    this.sdkRoot = sdkRootEnv;

    return this.executeDotCommand();
  }

  loadEnvFromDotEnv(): void {
    this.androidHomeInGlobalEnv = 'ANDROID_HOME' in process.env;
    dotenv.config({path: path.join(this.rootDir, '.env')});
  }

  buildCommand(): string {
    const binaryName = this.dotcmd.split('.')[1] as SdkBinary;
    const binaryLocation = getBinaryLocation(this.sdkRoot, this.platform, binaryName, true);

    let cmd: string;
    if (binaryLocation === 'PATH') {
      const binaryFullName = getBinaryNameForOS(this.platform, binaryName);
      cmd = `${binaryFullName}`;
    } else {
      const binaryFullName = path.basename(binaryLocation);
      const binaryDirPath = path.dirname(binaryLocation);
      cmd = path.join(binaryDirPath, binaryFullName);
    }

    return cmd;
  }

  executeDotCommand(): boolean {
    const cmd = this.buildCommand();
    const result = spawnSync(cmd, this.args, {stdio: 'inherit'});

    if (result.error) {
      console.error(result.error);

      return false;
    }

    return result.status === 0;
  }
}

