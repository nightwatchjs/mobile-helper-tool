import { getSdkRootFromEnv, showHelp } from "./utils/common";
import { getPlatformName } from "../../utils";
import { Options, Platform } from "./interfaces";
import * as dotenv from "dotenv";
import path from "path";
import colors from "ansi-colors";
import Logger from "../../logger";
import {
  connectWirelessAdb,
} from "./utils/connectDevice";
import { AVAILABLE_SUBCOMMANDS } from "./constants";

export class SdkCommandExecute {
  sdkRoot: string;
  options: Options;
  subcommand: string;
  rootDir: string;
  platform: Platform;
  androidHomeInGlobalEnv: boolean;

  constructor(subcommand: string, options: Options, rootDir = process.cwd()) {
    this.sdkRoot = "";
    this.options = options;
    this.subcommand = subcommand;
    this.rootDir = rootDir;
    this.platform = getPlatformName();
    this.androidHomeInGlobalEnv = false;
  }

  async run(): Promise<boolean> {
    if (!Object.keys(AVAILABLE_SUBCOMMANDS).includes(this.subcommand)) {
      showHelp([], this.subcommand);
      
      return false;
    }

    const unknownOptions = this.getUnknownOptions();
    if (unknownOptions.length) {
      showHelp(unknownOptions);

      return false;
    }

    this.loadEnvFromDotEnv();
    const sdkRootEnv = getSdkRootFromEnv(this.androidHomeInGlobalEnv, this.rootDir);

    if (!sdkRootEnv) {
      Logger.log(`Use ${colors.magenta("--standalone")} flag with the main command to setup the Android SDK.`);

      return false;
    }
    this.sdkRoot = sdkRootEnv;

    this.executeSdkScript();

    return false;
  }

  loadEnvFromDotEnv(): void {
    this.androidHomeInGlobalEnv = "ANDROID_HOME" in process.env;

    dotenv.config({ path: path.join(this.rootDir, ".env") });
  }

  getUnknownOptions(): string[] {
    const optionsPassed = Object.keys(this.options).filter(option => this.options[option]);
    const availableOptions = AVAILABLE_SUBCOMMANDS[this.subcommand].options.map(option => option.name);

    return optionsPassed.filter((option) => !availableOptions.includes(option));
  }

  async executeSdkScript(): Promise<boolean> {
    if (this.subcommand === "connect") {
    // check the corresponding options for the 'connect' subcommand.
      if (this.options.wireless) {
        // execute script for wireless adb connection.
        return await connectWirelessAdb(this.sdkRoot, this.platform);
      }
    }

    return false;
  }
}
