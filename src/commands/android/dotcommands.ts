import colors from 'ansi-colors';
import * as dotenv from 'dotenv';
import path from 'path';

import {ANDROID_DOTCOMMANDS} from '../../constants';
import Logger from '../../logger';
import {getPlatformName} from '../../utils';
import {Platform, SdkBinary} from './interfaces';
import {checkJavaInstallation, getBinaryLocation, getSdkRootFromEnv} from './utils/common';
import {execBinarySync} from './utils/sdk';

export class AndroidDotCommand {
  dotcmd: string;
  command: string;
  sdkRoot: string;
  rootDir: string;
  platform: Platform;
  androidHomeInGlobalEnv: boolean;

  constructor(dotcmd: string, cmdArgs: string[], rootDir = process.cwd()) {
    this.dotcmd = dotcmd;
    this.command = cmdArgs.slice(1).join(' ');
    this.sdkRoot = '';
    this.rootDir = rootDir;
    this.platform = getPlatformName();
    this.androidHomeInGlobalEnv = false;
  }

  async run(): Promise<boolean> {
    if (!ANDROID_DOTCOMMANDS.includes(this.dotcmd)) {
      Logger.log(colors.red(`Unknown dot command passed: ${this.dotcmd}\n`));

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

    this.executeDotCommand();

    return false;
  }

  loadEnvFromDotEnv(): void {
    this.androidHomeInGlobalEnv = 'ANDROID_HOME' in process.env;
    dotenv.config({path: path.join(this.rootDir, '.env')});
  }

  executeDotCommand(): boolean {
    const binaryName = this.dotcmd.split('.')[1] as SdkBinary;

    Logger.log(`Running: ${colors.cyan(binaryName)} ${colors.gray(this.command)}\n`);

    const binaryLocation = getBinaryLocation(this.sdkRoot, this.platform, binaryName, true);
    const commandOutput = execBinarySync(binaryLocation, binaryName, this.platform, this.command);

    console.log(commandOutput);

    return true;
  }
}

