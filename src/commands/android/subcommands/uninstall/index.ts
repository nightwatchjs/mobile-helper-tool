import {Options, Platform} from '../../interfaces';
import {deleteAvd} from './avd';

export async function uninstall(options: Options, sdkRoot: string, platform: Platform): Promise<boolean> {
  if (options.avd) {
    return await deleteAvd(sdkRoot, platform);
  }

  return false;
}

