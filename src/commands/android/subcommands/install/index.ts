import {Options, Platform} from '../../interfaces';
import {installApp} from './app';
import {createAvd} from './avd';

export async function install(options: Options, sdkRoot: string, platform: Platform): Promise<boolean> {
  if (options.app) {
    return await installApp(options, sdkRoot, platform);
  } else if (options.avd) {
    return await createAvd(sdkRoot, platform);
  }

  return false;
}

