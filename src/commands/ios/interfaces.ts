export interface SetupConfigs {
  mode?: 'real' | 'simulator' | 'both';
}

export interface Options {
  [key: string]: string | string[] | boolean;
}
