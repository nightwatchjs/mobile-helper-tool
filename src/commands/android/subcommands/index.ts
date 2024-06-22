import path from 'path';
import colors from 'ansi-colors';
import * as dotenv from 'dotenv';

import {connect} from './connect';
import Logger from '../../../logger';
import {getPlatformName} from '../../../utils';
import {Options, Platform} from '../interfaces';
import {checkJavaInstallation, getSdkRootFromEnv} from '../utils/common';

export class AndroidSubcommand {
  sdkRoot: string;
  options: Options;
  subcommand: string;
  rootDir: string;
  platform: Platform;
  androidHomeInGlobalEnv: boolean;

  constructor(subcommand: string, options: Options, rootDir = process.cwd()) {
    this.sdkRoot = '';
    this.options = options;
    this.subcommand = subcommand;
    this.rootDir = rootDir;
    this.platform = getPlatformName();
    this.androidHomeInGlobalEnv = false;
  }

  async run(): Promise<boolean> {
    this.loadEnvFromDotEnv();

    const javaInstalled = checkJavaInstallation(this.rootDir);
    if (!javaInstalled) {
      return false;
    }

    const sdkRootEnv = getSdkRootFromEnv(this.androidHomeInGlobalEnv, this.rootDir);
    if (!sdkRootEnv) {
      Logger.log(colors.red('Path to Android SDK not found in environment variables!\n'));
      Logger.log(`Run: ${colors.cyan('npx @nightwatch/mobile-helper android --standalone')} to setup Android SDK`);
      Logger.log('     or provide the path to Android SDK if already installed.');
      Logger.log(`(Remove the ${colors.gray('--standalone')} flag from the above command if setting up for testing.)\n`);

      return false;
    }
    this.sdkRoot = sdkRootEnv;

    this.executeSdkScript();

    return false;
  }

  loadEnvFromDotEnv(): void {
    this.androidHomeInGlobalEnv = 'ANDROID_HOME' in process.env;

    dotenv.config({path: path.join(this.rootDir, '.env')});
  }

  async executeSdkScript(): Promise<boolean> {
    if (this.subcommand === 'connect') {
      return connect(this.options, this.sdkRoot, this.platform);
    }

    return false;
  }
}
