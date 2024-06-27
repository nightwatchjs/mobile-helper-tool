import path from 'path';
import * as dotenv from 'dotenv';

import colors from 'ansi-colors';
import Logger from '../../logger';
import {execBinarySync} from './utils/sdk';
import {getPlatformName} from '../../utils';
import {Platform, SdkBinary} from './interfaces';
import {checkJavaInstallation, getBinaryLocation, getSdkRootFromEnv} from './utils/common';

export class AndroidDotCommand {
  binary: SdkBinary;
  command: string;
  sdkRoot: string;
  rootDir: string;
  platform: Platform;
  androidHomeInGlobalEnv: boolean;

  constructor(binary: SdkBinary, command: string, rootDir = process.cwd()) {
    this.binary = binary;
    this.command = command;
    this.sdkRoot = '';
    this.rootDir = rootDir;
    this.platform = getPlatformName();
    this.androidHomeInGlobalEnv = false;
  }

  async run(): Promise<boolean> {
    const javaInstalled = checkJavaInstallation(this.rootDir);

    if (!javaInstalled) {
      return false;
    }

    this.loadEnvFromDotEnv();
    const sdkRootEnv = getSdkRootFromEnv(this.androidHomeInGlobalEnv, this.rootDir);

    if (!sdkRootEnv) {
      Logger.log(`Run: ${colors.cyan('npx @nightwatch/mobile-helper android --standalone')} to setup Android SDK`);
      Logger.log('     or provide the path to Android SDK if already installed.');
      Logger.log(`(Remove the ${colors.gray('--standalone')} flag from the above command if setting up for testing.)\n`);

      return false;
    }
    this.sdkRoot = sdkRootEnv;

    this.executeCommand();

    return false;
  }

  loadEnvFromDotEnv(): void {
    this.androidHomeInGlobalEnv = 'ANDROID_HOME' in process.env;
    dotenv.config({path: path.join(this.rootDir, '.env')});
  }

  executeCommand(): boolean {
    Logger.log(`Running: ${colors.cyan(this.binary)} ${colors.gray(this.command)}\n`);

    const binaryLocation = getBinaryLocation(this.sdkRoot, this.platform, this.binary, true);
    const commandOutput = execBinarySync(binaryLocation, this.binary, this.platform, this.command);

    console.log(commandOutput);

    return true;
  }
}
