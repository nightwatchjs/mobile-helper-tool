import {connectWirelessAdb} from './wireless';
import {Options, Platform} from '../../interfaces';

export async function connect(options: Options, sdkRoot: string, platform: Platform): Promise<boolean> {
  if (options.wireless) {
    return connectWirelessAdb(sdkRoot, platform);
  }

  return false;
}