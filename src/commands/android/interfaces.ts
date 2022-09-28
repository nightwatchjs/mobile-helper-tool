export interface Options {
  [key: string]: string | string[] | boolean;
}

export interface SetupConfigs {
  mode?: 'real' | 'emulator' | 'both';
  browsers?: 'chrome' | 'firefox' | 'both' | 'none';
}
