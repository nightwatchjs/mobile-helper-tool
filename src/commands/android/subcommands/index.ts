import colors from 'ansi-colors';
import * as dotenv from 'dotenv';
import path from 'path';

import {checkJavaInstallation, getSdkRootFromEnv, getSubcommandHelp} from '../utils/common';
import {connect} from './connect';
import {getPlatformName} from '../../../utils';
import Logger from '../../../logger';
import {Options, Platform} from '../interfaces';
import {AVAILABLE_SUBCOMMANDS} from '../constants';

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
    if (!Object.keys(AVAILABLE_SUBCOMMANDS).includes(this.subcommand)) {
      Logger.log(`${colors.red(`unknown subcommand passed: ${this.subcommand}`)}\n`);

      const help = getSubcommandHelp();
      Logger.log(help);
      Logger.log(`For complete Android help, run: ${colors.cyan('npx @nightwatch/mobile-helper android --help')}`);

      return false;
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
    }

    return false;
  }
}

