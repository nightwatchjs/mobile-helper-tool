export interface Options {
  [key: string]: string | string[] | boolean;
}

export type Platform = 'windows' | 'linux' | 'mac';

export interface SetupConfigs {
  mode?: 'real' | 'emulator' | 'both';
  browsers?: 'chrome' | 'firefox' | 'both' | 'none';
}

export interface BinaryLocationInterface {
  sdkmanager: string;
  adb: string;
}
