import {Options, Platform} from '../../interfaces';
import {uninstallApp} from './app';
import {deleteAvd} from './avd';

export async function uninstall(options: Options, sdkRoot: string, platform: Platform): Promise<boolean> {
  if (options.app) {
    return await uninstallApp(options, sdkRoot, platform);
  } else if (options.avd) {
    return await deleteAvd(sdkRoot, platform);
  }

  return false;
}
