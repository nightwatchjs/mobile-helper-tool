export interface Options {
  [key: string]: string | string[] | boolean;
}

export type Platform = 'windows' | 'linux' | 'mac';

export interface OtherInfo {
  androidHomeInGlobalEnv: boolean;
}

export interface SetupConfigs {
  mode?: 'real' | 'emulator' | 'both';
  browsers?: 'chrome' | 'firefox' | 'both' | 'none';
}

export type SdkBinary = 'sdkmanager' | 'adb' | 'emulator' | 'avdmanager';
