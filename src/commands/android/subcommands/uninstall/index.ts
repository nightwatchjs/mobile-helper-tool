import {Options, Platform} from '../../interfaces';
import {uninstallApp} from './app';

export async function uninstall(options: Options, sdkRoot: string, platform: Platform): Promise<boolean> {
  if (options.app) {
    return await uninstallApp(options, sdkRoot, platform);
  }

  return false;
}
