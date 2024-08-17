import colors from 'ansi-colors';
import * as dotenv from 'dotenv';
import path from 'path';

import Logger from '../../../logger';
import {getPlatformName} from '../../../utils';
import {Options, Platform} from '../interfaces';
import {checkJavaInstallation, getSdkRootFromEnv} from '../utils/common';
import {showHelp} from './help';
import {connect} from './connect';
import {install} from './install';

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
    if (this.options.help) {
      showHelp(this.subcommand);

      return true;
    }
    this.loadEnvFromDotEnv();

    const javaInstalled = checkJavaInstallation(this.rootDir);
    if (!javaInstalled) {
      return false;
    }

    const sdkRootEnv = getSdkRootFromEnv(this.rootDir, this.androidHomeInGlobalEnv);
    if (!sdkRootEnv) {
      Logger.log(`Run: ${colors.cyan('npx @nightwatch/mobile-helper android --standalone')} to fix this issue.`);
      Logger.log(`(Remove the ${colors.gray('--standalone')} flag from the above command if using the tool for testing.)\n`);

      return false;
    }
    this.sdkRoot = sdkRootEnv;

    this.executeSubcommand();

    return false;
  }

  loadEnvFromDotEnv(): void {
    this.androidHomeInGlobalEnv = 'ANDROID_HOME' in process.env;

    dotenv.config({path: path.join(this.rootDir, '.env')});
  }

  async executeSubcommand(): Promise<boolean> {
    if (this.subcommand === 'connect') {
      return await connect(this.options, this.sdkRoot, this.platform);
    } else if (this.subcommand === 'install') {
      return await install(this.options, this.sdkRoot, this.platform);
    }

    return false;
  }
}

