import {Options, Platform} from '../../interfaces';
import {installApp} from './app';

export async function install(options: Options, sdkRoot: string, platform: Platform): Promise<boolean> {
  if (options.app) {
    return await installApp(options, sdkRoot, platform);
  }

  return false;
}

