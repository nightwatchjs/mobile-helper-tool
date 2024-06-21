import path from 'path';
import colors from 'ansi-colors';
import * as dotenv from 'dotenv';

import Logger from '../../../logger';
import {getPlatformName} from '../../../utils';
import {Options, Platform} from '../interfaces';
import {getSdkRootFromEnv} from '../utils/common';
import {connect} from './connect';

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
    const sdkRootEnv = getSdkRootFromEnv(this.androidHomeInGlobalEnv, this.rootDir);

    if (!sdkRootEnv) {
      Logger.log(`Use ${colors.magenta('--standalone')} flag with the main command to setup the Android SDK.`);

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
