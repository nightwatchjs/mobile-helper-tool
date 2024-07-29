export interface AndroidSetupResult {
  status: boolean;
  setup: boolean;
  mode: Required<SetupConfigs>['mode'];
}

export interface AvailableOptions {
  [key: string]: {
    alias: string[],
    description: string;
  }
}

export interface Options {
  [key: string]: string | string[] | boolean;
}

export interface Flag {
  name: string,
  alias: string[],
  description: string,
  value: string,
}

export interface Subcommand {
  description: string;
  flags?: Flag[];
  options: {
    name: string;
    description: string;
    flags?: Flag[];
  }[];
}

export interface AvailableSubcommands {
  [key: string]: Subcommand;
}

export interface verifyOptionsResult {
  mainOption: string;
  flags: string[];
}

export type Platform = 'windows' | 'linux' | 'mac';

export interface OtherInfo {
  androidHomeInGlobalEnv: boolean;
  javaHomeInGlobalEnv: boolean;
}

export interface SetupConfigs {
  mode?: 'real' | 'emulator' | 'both';
  browsers?: 'chrome' | 'firefox' | 'both' | 'none';
}

export type SdkBinary = 'sdkmanager' | 'adb' | 'emulator' | 'avdmanager';
